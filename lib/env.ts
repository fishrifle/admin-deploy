import { envSchema } from "@/lib/validation/schemas";
import { validateEnvironment } from "@/lib/validation/utils";

// Validate environment variables at startup
export const env = validateEnvironment(envSchema);

// Type-safe environment variables
export const {
  NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL,
} = env;

// Helper functions
export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";

// Logging configuration
export const LOG_LEVEL = isDevelopment ? "debug" : "info";

// Feature flags
export const FEATURES = {
  RATE_LIMITING: isProduction,
  DETAILED_ERRORS: isDevelopment,
  METRICS: isProduction,
  AUDIT_LOGGING: isProduction,
} as const;