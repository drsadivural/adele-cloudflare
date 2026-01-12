import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (per isolate)
// For production with multiple isolates, use KV or Durable Objects
const rateLimitStore = new Map<string, RateLimitEntry>();

// Workers cannot run timers (setInterval/setTimeout) in global scope.
// We'll do periodic cleanup lazily inside request handlers.
let lastCleanupAt = 0;
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) rateLimitStore.delete(key);
  }
}

export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (c) =>
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      'unknown',
    message = 'Too many requests, please try again later.',
  } = config;

  return async (c: Context, next: Next) => {
    const now = Date.now();
    cleanupExpiredEntries(now);

    const key = keyGenerator(c);
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetSeconds));

    if (entry.count > maxRequests) {
      c.header('Retry-After', String(resetSeconds));
      return c.json(
        {
          error: 'rate_limit_exceeded',
          message,
          retryAfter: resetSeconds,
        },
        429
      );
    }

    await next();
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Strict limit for auth endpoints (prevent brute force)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  }),

  // Moderate limit for API endpoints
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'API rate limit exceeded. Please slow down your requests.',
  }),

  // Strict limit for expensive operations (AI, code generation)
  expensive: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message:
      'Rate limit for AI operations exceeded. Please wait before making more requests.',
  }),

  // Very strict for password reset
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again in an hour.',
  }),

  // Limit for file uploads
  upload: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Upload rate limit exceeded. Please wait before uploading more files.',
  }),

  // Generous limit for read operations
  read: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Read rate limit exceeded.',
  }),
};

// Rate limiter with KV storage for distributed workers
export function createKVRateLimiter(kv: KVNamespace, config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'unknown',
    message = 'Too many requests, please try again later.',
  } = config;

  return async (c: Context, next: Next) => {
    const now = Date.now();

    // Optional: avoid KV hot-spots by keeping keys short but deterministic
    const key = `ratelimit:${keyGenerator(c)}`;

    // Get current count from KV
    const stored = (await kv.get(key, 'json')) as RateLimitEntry | null;

    let entry: RateLimitEntry;

    if (!stored || stored.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      entry = {
        count: stored.count + 1,
        resetTime: stored.resetTime,
      };
    }

    // Store updated count
    const ttl = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttl });

    // Set headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetSeconds));

    if (entry.count > maxRequests) {
      c.header('Retry-After', String(resetSeconds));
      return c.json(
        {
          error: 'rate_limit_exceeded',
          message,
          retryAfter: resetSeconds,
        },
        429
      );
    }

    await next();
  };
}

// Sliding window rate limiter for more accurate limiting
export function slidingWindowRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'unknown',
    message = 'Too many requests, please try again later.',
  } = config;

  const requestLog = new Map<string, number[]>();

  // Lazy cleanup for sliding window state too (avoid unbounded growth)
  let lastSlidingCleanupAt = 0;
  const SLIDING_CLEANUP_INTERVAL_MS = 60_000;

  function cleanupSliding(now: number) {
    if (now - lastSlidingCleanupAt < SLIDING_CLEANUP_INTERVAL_MS) return;
    lastSlidingCleanupAt = now;

    // Remove keys with empty arrays (or very old ones)
    for (const [key, arr] of requestLog.entries()) {
      if (!arr || arr.length === 0) requestLog.delete(key);
    }
  }

  return async (c: Context, next: Next) => {
    const now = Date.now();
    cleanupSliding(now);

    const key = keyGenerator(c);
    const windowStart = now - windowMs;

    // Get or create request timestamps array
    let timestamps = requestLog.get(key) || [];

    // Filter out old timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      const oldestInWindow = timestamps[0];
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);

      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(retryAfter));
      c.header('Retry-After', String(retryAfter));

      return c.json(
        {
          error: 'rate_limit_exceeded',
          message,
          retryAfter,
        },
        429
      );
    }

    // Add current timestamp
    timestamps.push(now);
    requestLog.set(key, timestamps);

    // Set headers
    const remaining = maxRequests - timestamps.length;
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));

    await next();
  };
}

// IP-based blocking for repeated violations (per isolate)
const blockedIPs = new Map<string, number>();

// Lazy cleanup for blocked IPs too
let lastBlockedCleanupAt = 0;
const BLOCKED_CLEANUP_INTERVAL_MS = 60_000;

function cleanupBlocked(now: number) {
  if (now - lastBlockedCleanupAt < BLOCKED_CLEANUP_INTERVAL_MS) return;
  lastBlockedCleanupAt = now;

  for (const [ip, until] of blockedIPs.entries()) {
    if (until <= now) blockedIPs.delete(ip);
  }
}

export function ipBlocker(blockDurationMs: number = 24 * 60 * 60 * 1000) {
  return async (c: Context, next: Next) => {
    const now = Date.now();
    cleanupBlocked(now);

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      'unknown';

    const blockedUntil = blockedIPs.get(ip);

    if (blockedUntil && blockedUntil > now) {
      const retryAfter = Math.ceil((blockedUntil - now) / 1000);
      return c.json(
        {
          error: 'ip_blocked',
          message: 'Your IP has been temporarily blocked due to suspicious activity.',
          retryAfter,
        },
        403
      );
    }

    await next();
  };
}

export function blockIP(ip: string, durationMs: number = 24 * 60 * 60 * 1000) {
  blockedIPs.set(ip, Date.now() + durationMs);
}

export function unblockIP(ip: string) {
  blockedIPs.delete(ip);
}

