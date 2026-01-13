import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// SHA-256 hash function for password hashing
async function hashPasswordSHA256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Password hashing - use SHA-256 to match existing database format
async function hashPassword(password: string): Promise<string> {
  return hashPasswordSHA256(password);
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    console.log("verifyPassword called");
    console.log("Password length:", password.length);
    console.log("Hash length:", storedHash.length);
    console.log("Hash starts with:", storedHash.substring(0, 7));
    
    // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (storedHash.startsWith("$2")) {
      console.log("Detected bcrypt hash, using bcrypt.compareSync");
      const result = bcrypt.compareSync(password, storedHash);
      console.log("bcrypt.compareSync result:", result);
      return result;
    }
    
    // Otherwise, assume SHA-256 hash (64 hex characters)
    console.log("Detected SHA-256 hash, using crypto.subtle");
    const computedHash = await hashPasswordSHA256(password);
    console.log("Computed SHA-256 hash:", computedHash);
    const result = computedHash === storedHash;
    console.log("SHA-256 comparison result:", result);
    return result;
  } catch (error) {
    console.error("Password verification error:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return false;
  }
}

// Generate random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Register new user
authRoutes.post("/register", async (c) => {
  try {
    const db = c.get("db");
    const emailService = c.get("email");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { email: userEmail, password, name } = body;
    
    // Validation
    if (!userEmail || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return c.json({ error: "Invalid email format" }, 400);
    }
    
    // Check if user exists
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, userEmail.toLowerCase())).get();
    
    if (existingUser) {
      return c.json({ error: "Email already registered" }, 400);
    }
    
    // Hash password using SHA-256 (matching existing database format)
    const passwordHash = await hashPassword(password);
    
    // Create user - only use columns that exist in the actual database
    // Actual columns: id, email, password, name, role, phone, company, position, face_embedding, voice_embedding, created_at, updated_at
    const result = await db.insert(schema.users).values({
      email: userEmail.toLowerCase(),
      passwordHash,
      name,
      role: "user",
    }).returning();
    
    const user = result[0];
    
    if (logger) {
      logger.info("User registered", { userId: user.id, email: user.email });
    }
    
    // Generate JWT
    const token = await sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role || "user",
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
        role: user.role || "user",
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed. Please try again." }, 500);
  }
});

// Login
authRoutes.post("/login", async (c) => {
  try {
    const db = c.get("db");
    const logger = c.get("logger");
    const metrics = c.get("metrics");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { email, password } = body;
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    
    // Find user
    const user = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
    
    console.log("Login attempt for:", email.toLowerCase());
    console.log("User found:", user ? "yes" : "no");
    
    if (!user) {
      if (metrics) metrics.increment("auth.login.failed");
      if (logger) logger.warn("Login failed - user not found", { email });
      return c.json({ error: "Invalid email or password" }, 401);
    }
    
    console.log("User passwordHash exists:", !!user.passwordHash);
    console.log("User passwordHash prefix:", user.passwordHash ? user.passwordHash.substring(0, 10) : "none");
    
    // Check if user has a password (might be OAuth-only user)
    if (!user.passwordHash) {
      return c.json({ error: "Please use social login for this account" }, 401);
    }
    
    // Verify password using bcrypt
    console.log("Attempting bcrypt compare...");
    const isValid = await verifyPassword(password, user.passwordHash);
    console.log("Password valid:", isValid);
    
    if (!isValid) {
      if (metrics) metrics.increment("auth.login.failed");
      if (logger) logger.warn("Login failed - invalid password", { userId: user.id });
      return c.json({ error: "Invalid email or password" }, 401);
    }
    
    // Skip updating last signed in - column doesn't exist
    // Just log the successful authentication
    console.log("Authentication successful for user:", user.id);
    
    // Generate JWT - ensure all values are defined
    console.log("Generating JWT with userId:", user.id, "email:", user.email, "role:", user.role);
    const jwtPayload = { 
      userId: user.id, 
      email: user.email,
      role: String(user.role || "user"),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    };
    console.log("JWT payload:", JSON.stringify(jwtPayload));
    
    let token: string;
    try {
      token = await sign(jwtPayload, c.env.JWT_SECRET);
      console.log("JWT generated successfully");
    } catch (jwtError) {
      console.error("JWT generation error:", jwtError);
      throw jwtError;
    }
    
    console.log("Preparing response...");
    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: String(user.role || "user"),
      },
      token,
    };
    console.log("Response prepared, returning...");
    
    return c.json(response);
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed. Please try again." }, 500);
  }
});

// Get current user
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ user: null });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ user: null });
    }
    
    // Get subscription
    let subscription = null;
    try {
      subscription = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id)).get();
    } catch (e) {
      console.log("Could not get subscription:", e);
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
        createdAt: user.createdAt,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return c.json({ user: null });
  }
});

// Forgot password
authRoutes.post("/forgot-password", async (c) => {
  try {
    const db = c.get("db");
    const emailService = c.get("email");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { email: userEmail } = body;
    
    if (!userEmail) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    const user = await db.select().from(schema.users).where(eq(schema.users.email, userEmail.toLowerCase())).get();
    
    // Always return success to prevent email enumeration
    if (!user) {
      if (logger) logger.info("Password reset requested for non-existent email", { email: userEmail });
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
    
    // Send reset email
    if (emailService) {
      try {
        const resetUrl = `${c.env.APP_URL || 'https://adele.ayonix.com'}/reset-password?token=${resetToken}`;
        await emailService.sendPasswordReset(user.email, user.name, resetUrl, "1 hour");
        if (logger) logger.info("Password reset email sent", { userId: user.id });
      } catch (e) {
        if (logger) logger.warn("Failed to send password reset email", { userId: user.id, error: e });
      }
    }
    
    return c.json({ success: true, message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return c.json({ error: "Failed to process request. Please try again." }, 500);
  }
});

// Reset password
authRoutes.post("/reset-password", async (c) => {
  try {
    const db = c.get("db");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { token, password } = body;
    
    if (!token || !password) {
      return c.json({ error: "Token and password are required" }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }
    
    const user = await db.select().from(schema.users).where(eq(schema.users.resetToken, token)).get();
    
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      if (logger) logger.warn("Invalid or expired reset token used");
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
    
    if (logger) logger.info("Password reset successfully", { userId: user.id });
    
    return c.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return c.json({ error: "Failed to reset password. Please try again." }, 500);
  }
});

// Verify email
authRoutes.post("/verify-email", async (c) => {
  try {
    const db = c.get("db");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
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
    
    if (logger) logger.info("Email verified", { userId: user.id });
    
    return c.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return c.json({ error: "Failed to verify email. Please try again." }, 500);
  }
});

// Resend verification email
authRoutes.post("/resend-verification", async (c) => {
  try {
    const db = c.get("db");
    const emailService = c.get("email");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { email: userEmail } = body;
    
    if (!userEmail) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    const user = await db.select().from(schema.users).where(eq(schema.users.email, userEmail.toLowerCase())).get();
    
    if (!user) {
      return c.json({ success: true, message: "If the email exists and is unverified, a verification link has been sent" });
    }
    
    if (user.emailVerified) {
      return c.json({ error: "Email is already verified" }, 400);
    }
    
    const verificationToken = generateToken();
    
    await db.update(schema.users)
      .set({ verificationToken })
      .where(eq(schema.users.id, user.id));
    
    if (emailService) {
      try {
        const verifyUrl = `${c.env.APP_URL || 'https://adele.ayonix.com'}/verify-email?token=${verificationToken}`;
        await emailService.sendEmailVerification(user.email, user.name, verifyUrl);
        if (logger) logger.info("Verification email resent", { userId: user.id });
      } catch (e) {
        if (logger) logger.warn("Failed to resend verification email", { userId: user.id, error: e });
      }
    }
    
    return c.json({ success: true, message: "If the email exists and is unverified, a verification link has been sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return c.json({ error: "Failed to resend verification. Please try again." }, 500);
  }
});

// Change password (for logged-in users)
authRoutes.post("/change-password", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: "Current password and new password are required" }, 400);
    }
    
    if (newPassword.length < 8) {
      return c.json({ error: "New password must be at least 8 characters" }, 400);
    }
    
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user || !user.passwordHash) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    
    if (!isValid) {
      return c.json({ error: "Current password is incorrect" }, 401);
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await db.update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, user.id));
    
    if (logger) logger.info("Password changed", { userId: user.id });
    
    return c.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return c.json({ error: "Failed to change password. Please try again." }, 500);
  }
});

// Logout (invalidate token - for future token blacklist implementation)
authRoutes.post("/logout", async (c) => {
  // For now, just return success
  // In a production app, you might want to add the token to a blacklist
  return c.json({ success: true, message: "Logged out successfully" });
});

// Delete account
authRoutes.delete("/account", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      body = {};
    }
    
    const { password } = body;
    
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    // If user has a password, verify it
    if (user.passwordHash && password) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return c.json({ error: "Invalid password" }, 401);
      }
    }
    
    // Delete user (cascade will handle related records)
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    
    if (logger) logger.info("Account deleted", { userId: user.id });
    
    return c.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return c.json({ error: "Failed to delete account. Please try again." }, 500);
  }
});

// 2FA Setup - Generate secret
authRoutes.post("/2fa/setup", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    // Generate a simple secret (in production, use a proper TOTP library)
    const secret = generateToken().substring(0, 32);
    
    // Store the secret temporarily (not enabled yet)
    await db.update(schema.users)
      .set({ twoFactorSecret: secret })
      .where(eq(schema.users.id, user.id));
    
    // Generate QR code URL for authenticator apps
    const otpAuthUrl = `otpauth://totp/ADELE:${user.email}?secret=${secret}&issuer=ADELE`;
    
    return c.json({
      success: true,
      secret,
      qrCodeUrl: otpAuthUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return c.json({ error: "Failed to setup 2FA. Please try again." }, 500);
  }
});

// 2FA Verify and Enable
authRoutes.post("/2fa/verify", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    
    const { code } = body;
    
    if (!code) {
      return c.json({ error: "Verification code is required" }, 400);
    }
    
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user || !user.twoFactorSecret) {
      return c.json({ error: "2FA not setup" }, 400);
    }
    
    // In production, verify the TOTP code properly
    // For now, we'll accept any 6-digit code for demo purposes
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return c.json({ error: "Invalid verification code" }, 400);
    }
    
    // Enable 2FA
    await db.update(schema.users)
      .set({ twoFactorEnabled: true })
      .where(eq(schema.users.id, user.id));
    
    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 10 }, () => 
      generateToken().substring(0, 8).toUpperCase()
    );
    
    if (logger) logger.info("2FA enabled", { userId: user.id });
    
    return c.json({
      success: true,
      message: "2FA enabled successfully",
      recoveryCodes,
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return c.json({ error: "Failed to verify 2FA. Please try again." }, 500);
  }
});

// 2FA Disable
authRoutes.post("/2fa/disable", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const logger = c.get("logger");
    
    let body;
    try {
      body = await c.req.json();
    } catch (e) {
      body = {};
    }
    
    const { password } = body;
    
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    // Verify password if provided
    if (user.passwordHash && password) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return c.json({ error: "Invalid password" }, 401);
      }
    }
    
    // Disable 2FA
    await db.update(schema.users)
      .set({ 
        twoFactorEnabled: false,
        twoFactorSecret: null 
      })
      .where(eq(schema.users.id, user.id));
    
    if (logger) logger.info("2FA disabled", { userId: user.id });
    
    return c.json({ success: true, message: "2FA disabled successfully" });
  } catch (error) {
    console.error("2FA disable error:", error);
    return c.json({ error: "Failed to disable 2FA. Please try again." }, 500);
  }
});
