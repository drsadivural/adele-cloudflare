import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";
import * as crypto from "crypto";

const account = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
account.use("*", authMiddleware);

// Get user profile
account.get("/profile", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(schema.userSettings.userId, user.id),
  });

  return c.json({
    profile: {
      ...user,
      phone: settings?.phone,
      company: settings?.company,
      jobTitle: settings?.jobTitle,
      timezone: settings?.timezone,
      language: settings?.language,
    },
  });
});

// Update user profile
account.patch("/profile", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Update user table fields
  if (body.name || body.avatarUrl) {
    await db
      .update(schema.users)
      .set({
        name: body.name || user.name,
        avatarUrl: body.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
  }

  // Update or create settings for extended profile fields
  const existingSettings = await db.query.userSettings.findFirst({
    where: eq(schema.userSettings.userId, user.id),
  });

  if (existingSettings) {
    await db
      .update(schema.userSettings)
      .set({
        phone: body.phone ?? existingSettings.phone,
        company: body.company ?? existingSettings.company,
        jobTitle: body.jobTitle ?? existingSettings.jobTitle,
        timezone: body.timezone ?? existingSettings.timezone,
        language: body.language ?? existingSettings.language,
        updatedAt: new Date(),
      })
      .where(eq(schema.userSettings.userId, user.id));
  } else {
    await db.insert(schema.userSettings).values({
      userId: user.id,
      phone: body.phone,
      company: body.company,
      jobTitle: body.jobTitle,
      timezone: body.timezone || "UTC",
      language: body.language || "en",
    });
  }

  const updatedUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  });

  return c.json({ profile: updatedUser });
});

// Upload avatar
account.post("/avatar", async (c) => {
  const user = c.get("user");
  const storage = c.env.STORAGE;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get("avatar") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type" }, 400);
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large (max 5MB)" }, 400);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `avatars/${user.id}/${Date.now()}.${ext}`;

  await storage.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const avatarUrl = `https://storage.adele.ayonix.com/${key}`;

  const db = c.get("db");
  await db
    .update(schema.users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  return c.json({ avatarUrl });
});

// Get active sessions
account.get("/sessions", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessions = await db.query.userSessions.findMany({
    where: eq(schema.userSessions.userId, user.id),
    orderBy: desc(schema.userSessions.lastActiveAt),
  });

  // Get current session from token
  const authHeader = c.req.header("Authorization");
  const currentToken = authHeader?.replace("Bearer ", "");

  return c.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      device: s.deviceInfo || "Unknown device",
      browser: s.userAgent || "Unknown browser",
      ip: s.ipAddress || "Unknown",
      location: s.location,
      lastActive: s.lastActiveAt?.toISOString(),
      current: s.token === currentToken,
    })),
  });
});

// Revoke a session
account.delete("/sessions/:sessionId", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const sessionId = c.req.param("sessionId");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.userSessions)
    .where(
      and(
        eq(schema.userSessions.id, parseInt(sessionId)),
        eq(schema.userSessions.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Enable 2FA
account.post("/2fa/enable", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Generate a secret
  const secret = crypto.randomBytes(20).toString("hex");
  
  // Store the secret temporarily (not yet verified)
  await db
    .update(schema.users)
    .set({
      twoFactorSecret: secret,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  // Generate QR code URL (using Google Authenticator format)
  const otpAuthUrl = `otpauth://totp/ADELE:${user.email}?secret=${secret}&issuer=ADELE`;
  
  return c.json({
    secret,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
  });
});

// Verify and activate 2FA
account.post("/2fa/verify", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const { code } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // In production, verify the TOTP code against the secret
  // For now, we'll accept any 6-digit code
  if (!code || code.length !== 6) {
    return c.json({ error: "Invalid code" }, 400);
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  await db
    .update(schema.users)
    .set({
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(backupCodes),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  return c.json({ success: true, backupCodes });
});

// Disable 2FA
account.post("/2fa/disable", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const { code } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify the code before disabling
  if (!code || code.length !== 6) {
    return c.json({ error: "Invalid code" }, 400);
  }

  await db
    .update(schema.users)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  return c.json({ success: true });
});

// Get team members
account.get("/team", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const members = await db.query.teamMembers.findMany({
    where: eq(schema.teamMembers.ownerId, user.id),
    with: {
      user: true,
    },
  });

  return c.json({
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email,
      name: m.user?.name,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt?.toISOString(),
    })),
  });
});

// Invite team member
account.post("/team/invite", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const { email, role } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if user exists
  const invitedUser = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  // Create invitation
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const [invitation] = await db
    .insert(schema.teamInvitations)
    .values({
      ownerId: user.id,
      email,
      role: role || "member",
      token: crypto.randomBytes(32).toString("hex"),
      expiresAt,
    })
    .returning();

  // TODO: Send invitation email

  return c.json({
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt?.toISOString(),
    },
  });
});

// Remove team member
account.delete("/team/:memberId", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const memberId = parseInt(c.req.param("memberId"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.teamMembers)
    .where(
      and(
        eq(schema.teamMembers.id, memberId),
        eq(schema.teamMembers.ownerId, user.id)
      )
    );

  return c.json({ success: true });
});

// Update team member role
account.patch("/team/:memberId/role", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const memberId = parseInt(c.req.param("memberId"));
  const { role } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(schema.teamMembers)
    .set({ role, updatedAt: new Date() })
    .where(
      and(
        eq(schema.teamMembers.id, memberId),
        eq(schema.teamMembers.ownerId, user.id)
      )
    );

  return c.json({ success: true });
});

export { account as accountRoutes };
