import { Hono } from "hono";
import { sign } from "hono/jwt";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Simple password hashing using Web Crypto API (available in Workers)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Register new user
authRoutes.post("/register", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  
  const { email, password, name } = body;
  
  // Validation
  if (!email || !password || !name) {
    return c.json({ error: "Email, password, and name are required" }, 400);
  }
  
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: "Invalid email format" }, 400);
  }
  
  // Check if user exists
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  
  if (existingUser) {
    return c.json({ error: "Email already registered" }, 400);
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  
  // Create user
  const result = await db.insert(schema.users).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    verificationToken,
    role: "user",
    emailVerified: false,
  }).returning();
  
  const user = result[0];
  
  // Create default settings
  await db.insert(schema.userSettings).values({
    userId: user.id,
  });
  
  // Create free subscription
  await db.insert(schema.subscriptions).values({
    userId: user.id,
    plan: "free",
    status: "active",
  });
  
  // Create onboarding progress
  await db.insert(schema.onboardingProgress).values({
    userId: user.id,
    currentStep: 0,
    completedSteps: JSON.stringify([]),
    isCompleted: false,
  });
  
  // Generate JWT
  const token = await sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    }, 
    c.env.JWT_SECRET
  );
  
  // TODO: Send verification email
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    token,
  });
});

// Login
authRoutes.post("/login", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  
  const { email, password } = body;
  
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }
  
  // Find user
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  
  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  
  // Update last signed in
  await db.update(schema.users)
    .set({ lastSignedIn: new Date() })
    .where(eq(schema.users.id, user.id));
  
  // Generate JWT
  const token = await sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    }, 
    c.env.JWT_SECRET
  );
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
    },
    token,
  });
});

// Get current user
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ user: null });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ user: null });
    }
    
    // Get subscription
    const subscription = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id)).get();
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null,
    });
  } catch (error) {
    return c.json({ user: null });
  }
});

// Forgot password
authRoutes.post("/forgot-password", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  
  const { email } = body;
  
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }
  
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  
  // Always return success to prevent email enumeration
  if (!user) {
    return c.json({ success: true, message: "If the email exists, a reset link has been sent" });
  }
  
  const resetToken = generateToken();
  const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  
  await db.update(schema.users)
    .set({ 
      resetToken, 
      resetTokenExpiry 
    })
    .where(eq(schema.users.id, user.id));
  
  // TODO: Send reset email with link: ${APP_URL}/reset-password?token=${resetToken}
  
  return c.json({ success: true, message: "If the email exists, a reset link has been sent" });
});

// Reset password
authRoutes.post("/reset-password", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  
  const { token, password } = body;
  
  if (!token || !password) {
    return c.json({ error: "Token and password are required" }, 400);
  }
  
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }
  
  const user = await db.select().from(schema.users).where(eq(schema.users.resetToken, token)).get();
  
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
    return c.json({ error: "Invalid or expired reset token" }, 400);
  }
  
  const passwordHash = await hashPassword(password);
  
  await db.update(schema.users)
    .set({ 
      passwordHash, 
      resetToken: null, 
      resetTokenExpiry: null 
    })
    .where(eq(schema.users.id, user.id));
  
  return c.json({ success: true, message: "Password reset successfully" });
});

// Verify email
authRoutes.post("/verify-email", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  
  const { token } = body;
  
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }
  
  const user = await db.select().from(schema.users).where(eq(schema.users.verificationToken, token)).get();
  
  if (!user) {
    return c.json({ error: "Invalid verification token" }, 400);
  }
  
  await db.update(schema.users)
    .set({ 
      emailVerified: true, 
      verificationToken: null 
    })
    .where(eq(schema.users.id, user.id));
  
  return c.json({ success: true, message: "Email verified successfully" });
});

// Logout (client-side token removal, but we can track it)
authRoutes.post("/logout", async (c) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can invalidate sessions if using KV storage
  return c.json({ success: true });
});

// Change password (authenticated)
authRoutes.post("/change-password", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const body = await c.req.json();
    
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: "Current and new password are required" }, 400);
    }
    
    if (newPassword.length < 8) {
      return c.json({ error: "New password must be at least 8 characters" }, 400);
    }
    
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    
    if (!isValid) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await db.update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, user.id));
    
    return c.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});
