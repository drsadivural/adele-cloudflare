import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../../drizzle/schema';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  APP_URL: string;
};

const oauth = new Hono<{ Bindings: Bindings }>();

// OAuth provider configurations
const getOAuthConfig = (provider: string, env: Bindings) => {
  const configs: Record<string, any> = {
    google: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: 'openid email profile',
    },
    apple: {
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      scope: 'name email',
      responseMode: 'form_post',
    },
    microsoft: {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      scope: 'openid email profile User.Read',
    },
    facebook: {
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
      scope: 'email public_profile',
    },
    github: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      emailUrl: 'https://api.github.com/user/emails',
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      scope: 'read:user user:email',
    },
  };
  return configs[provider];
};

// Initiate OAuth flow
oauth.get('/:provider', async (c) => {
  const provider = c.req.param('provider');
  const config = getOAuthConfig(provider, c.env);

  if (!config || !config.clientId) {
    return c.json({ error: `${provider} OAuth not configured` }, 400);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${c.env.APP_URL || 'http://localhost:8787'}/api/auth/oauth/${provider}/callback`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  if (config.responseMode) {
    params.append('response_mode', config.responseMode);
  }

  // Store state in cookie for verification
  const response = c.redirect(`${config.authUrl}?${params.toString()}`);
  response.headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  
  return response;
});

// OAuth callback
oauth.get('/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return c.redirect('/login?error=missing_code');
  }

  const config = getOAuthConfig(provider, c.env);
  if (!config) {
    return c.redirect('/login?error=invalid_provider');
  }

  try {
    const redirectUri = `${c.env.APP_URL || 'http://localhost:8787'}/api/auth/oauth/${provider}/callback`;

    // Exchange code for token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as any;

    if (!tokenData.access_token) {
      console.error('Token error:', tokenData);
      return c.redirect('/login?error=token_error');
    }

    // Get user info
    let userInfo: any;
    
    if (provider === 'github') {
      // GitHub requires separate calls for user info and email
      const userResponse = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
          'User-Agent': 'ADELE-App',
        },
      });
      userInfo = await userResponse.json();

      // Get primary email
      const emailResponse = await fetch(config.emailUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
          'User-Agent': 'ADELE-App',
        },
      });
      const emails = await emailResponse.json() as any[];
      const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
      userInfo.email = primaryEmail || userInfo.email;
    } else if (config.userInfoUrl) {
      const userResponse = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });
      userInfo = await userResponse.json();
    }

    // Normalize user data
    const normalizedUser = normalizeUserData(provider, userInfo);

    if (!normalizedUser.email) {
      return c.redirect('/login?error=email_required');
    }

    // Find or create user
    const db = drizzle(c.env.DB);
    let user = await db.select().from(users).where(eq(users.email, normalizedUser.email)).get();

    if (!user) {
      // Create new user
      const result = await db.insert(users).values({
        email: normalizedUser.email,
        name: normalizedUser.name,
        password: '', // OAuth users don't have passwords
        emailVerified: true,
        oauthProvider: provider,
        oauthId: normalizedUser.id,
        avatar: normalizedUser.avatar,
        role: 'user',
      }).returning();
      user = result[0];
    } else {
      // Update OAuth info if not set
      if (!user.oauthProvider) {
        await db.update(users).set({
          oauthProvider: provider,
          oauthId: normalizedUser.id,
          avatar: normalizedUser.avatar || user.avatar,
        }).where(eq(users.id, user.id));
      }
    }

    // Generate JWT
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      c.env.JWT_SECRET
    );

    // Redirect with token
    const response = c.redirect(`/auth/callback?token=${token}`);
    response.headers.append('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    
    return response;
  } catch (error) {
    console.error('OAuth error:', error);
    return c.redirect('/login?error=oauth_failed');
  }
});

// Apple POST callback (Apple uses form_post)
oauth.post('/apple/callback', async (c) => {
  const body = await c.req.parseBody();
  const code = body.code as string;
  const state = body.state as string;
  const userStr = body.user as string;

  if (!code) {
    return c.redirect('/login?error=missing_code');
  }

  // Parse user data from Apple (only sent on first auth)
  let appleUser: any = {};
  if (userStr) {
    try {
      appleUser = JSON.parse(userStr);
    } catch (e) {}
  }

  const config = getOAuthConfig('apple', c.env);
  if (!config) {
    return c.redirect('/login?error=invalid_provider');
  }

  try {
    const redirectUri = `${c.env.APP_URL || 'http://localhost:8787'}/api/auth/oauth/apple/callback`;

    // Exchange code for token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as any;

    if (!tokenData.id_token) {
      return c.redirect('/login?error=token_error');
    }

    // Decode Apple ID token to get user info
    const idTokenParts = tokenData.id_token.split('.');
    const payload = JSON.parse(atob(idTokenParts[1]));

    const email = payload.email;
    const name = appleUser.name ? `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim() : undefined;

    if (!email) {
      return c.redirect('/login?error=email_required');
    }

    // Find or create user
    const db = drizzle(c.env.DB);
    let user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      const result = await db.insert(users).values({
        email,
        name: name || 'Apple User',
        password: '',
        emailVerified: true,
        oauthProvider: 'apple',
        oauthId: payload.sub,
        role: 'user',
      }).returning();
      user = result[0];
    }

    // Generate JWT
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      c.env.JWT_SECRET
    );

    const response = c.redirect(`/auth/callback?token=${token}`);
    response.headers.append('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    
    return response;
  } catch (error) {
    console.error('Apple OAuth error:', error);
    return c.redirect('/login?error=oauth_failed');
  }
});

// Helper to normalize user data from different providers
function normalizeUserData(provider: string, data: any) {
  switch (provider) {
    case 'google':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture,
      };
    case 'microsoft':
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        avatar: null,
      };
    case 'facebook':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture?.data?.url,
      };
    case 'github':
      return {
        id: String(data.id),
        email: data.email,
        name: data.name || data.login,
        avatar: data.avatar_url,
      };
    default:
      return {
        id: data.id || data.sub,
        email: data.email,
        name: data.name,
        avatar: data.picture || data.avatar,
      };
  }
}

export default oauth;

export const oauthRoutes = oauth;
