import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    redis?: HealthCheckResult;
    external?: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
}

const startTime = Date.now();

export async function GET() {
  const startCheck = Date.now();
  
  try {
    const health: HealthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      uptime: Date.now() - startTime,
      checks: {
        database: await checkDatabase(),
      },
    };

    // Check Redis if available
    if (process.env.UPSTASH_REDIS_REST_URL) {
      health.checks.redis = await checkRedis();
    }

    // Check external services
    health.checks.external = await checkExternalServices();

    // Determine overall status
    const checkStatuses = Object.values(health.checks);
    if (checkStatuses.some(check => check.status === "unhealthy")) {
      health.status = "unhealthy";
    } else if (checkStatuses.some(check => check.status === "unhealthy")) {
      health.status = "degraded";
    }

    const responseTime = Date.now() - startCheck;
    
    logger.debug("Health check completed", {
      status: health.status,
      responseTime,
      checks: health.checks,
    });

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error : new Error(String(error)),
    });

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Simple query to check database connectivity
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("count")
      .limit(1);

    if (error) {
      throw error;
    }

    return {
      status: "healthy",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Import Redis client
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Simple ping
    await redis.ping();

    return {
      status: "healthy",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkExternalServices(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Check Stripe API
    const stripeCheck = await fetch("https://api.stripe.com/v1/charges", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    });

    if (!stripeCheck.ok) {
      throw new Error(`Stripe API returned ${stripeCheck.status}`);
    }

    return {
      status: "healthy",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}