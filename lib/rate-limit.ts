import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { logger } from "./logger";
import { createErrorResponse } from "./validation/utils";
import { FEATURES } from "./env";

// In-memory rate limiting for development
const cache = new Map();

// Create Redis client (only in production)
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

// Rate limiting configurations
const rateLimits = {
  // API endpoints
  api: new Ratelimit({
    redis: (redis || new Map()) as any,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
    analytics: true,
    prefix: "api",
  }),

  // Authentication endpoints
  auth: new Ratelimit({
    redis: (redis || new Map()) as any,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
    analytics: true,
    prefix: "auth",
  }),

  // Webhook endpoints
  webhook: new Ratelimit({
    redis: (redis || new Map()) as any,
    limiter: Ratelimit.slidingWindow(1000, "1 m"), // 1000 requests per minute
    analytics: true,
    prefix: "webhook",
  }),

  // Stripe operations
  stripe: new Ratelimit({
    redis: (redis || new Map()) as any,
    limiter: Ratelimit.slidingWindow(50, "1 m"), // 50 requests per minute
    analytics: true,
    prefix: "stripe",
  }),

  // Database operations
  database: new Ratelimit({
    redis: (redis || new Map()) as any,
    limiter: Ratelimit.slidingWindow(200, "1 m"), // 200 requests per minute
    analytics: true,
    prefix: "database",
  }),
};

type RateLimitType = keyof typeof rateLimits;

export async function rateLimit(
  identifier: string,
  type: RateLimitType = "api",
  req?: Request
): Promise<{ success: boolean; response?: NextResponse }> {
  // Skip rate limiting in development unless explicitly enabled
  if (!FEATURES.RATE_LIMITING) {
    return { success: true };
  }

  try {
    const { success, limit, reset, remaining } = await rateLimits[type].limit(identifier);

    if (!success) {
      logger.securityEvent("Rate limit exceeded", "medium", {
        identifier,
        type,
        limit,
        reset,
        remaining,
        ip: req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip") || undefined,
        userAgent: req?.headers.get("user-agent") || undefined,
        url: req?.url,
      });

      return {
        success: false,
        response: createErrorResponse(
          "RATE_LIMIT_EXCEEDED",
          "Too many requests. Please try again later.",
          429
        ),
      };
    }

    // Log successful rate limit check for monitoring
    logger.debug("Rate limit check passed", {
      identifier,
      type,
      limit,
      reset,
      remaining,
    });

    return { success: true };
  } catch (error) {
    logger.error("Rate limiting error", {
      identifier,
      type,
      error: error instanceof Error ? error : new Error(String(error)),
    });

    // On rate limiting errors, allow the request to proceed
    return { success: true };
  }
}

// Middleware helper for API routes
export function withRateLimit(
  type: RateLimitType = "api",
  getIdentifier?: (req: Request) => string
) {
  return function (
    handler: (req: Request, context: any) => Promise<NextResponse>
  ) {
    return async (req: Request, context: any): Promise<NextResponse> => {
      // Generate identifier
      const identifier = getIdentifier 
        ? getIdentifier(req)
        : req.headers.get("x-forwarded-for") || 
          req.headers.get("x-real-ip") || 
          "unknown";

      // Check rate limit
      const rateLimitResult = await rateLimit(identifier, type, req);
      
      if (!rateLimitResult.success) {
        return rateLimitResult.response!;
      }

      // Proceed with the handler
      return handler(req, context);
    };
  };
}

// Get IP address from request
export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// Get user identifier for authenticated endpoints
export function getUserIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${getClientIP(req)}`;
}

// Rate limit by user ID for authenticated endpoints
export function rateLimitByUser(userId: string, type: RateLimitType = "api") {
  return rateLimit(`user:${userId}`, type);
}

// Rate limit by IP for public endpoints
export function rateLimitByIP(req: Request, type: RateLimitType = "api") {
  const ip = getClientIP(req);
  return rateLimit(`ip:${ip}`, type, req);
}

// Specific rate limiting functions for common scenarios
export function rateLimitAuth(req: Request) {
  return rateLimitByIP(req, "auth");
}

export function rateLimitWebhook(req: Request) {
  return rateLimitByIP(req, "webhook");
}

export function rateLimitStripe(userId: string) {
  return rateLimitByUser(userId, "stripe");
}

export function rateLimitDatabase(userId: string) {
  return rateLimitByUser(userId, "database");
}