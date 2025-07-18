import { z } from "zod";

// Organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255),
  email: z.string().email("Valid email is required"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// Widget schemas
export const createWidgetSchema = z.object({
  name: z.string().min(1, "Widget name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  organization_id: z.string().uuid("Valid organization ID is required"),
  config: z.record(z.unknown()).optional(),
  is_active: z.boolean().default(false),
});

export const updateWidgetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  config: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// Cause schemas
export const createCauseSchema = z.object({
  name: z.string().min(1, "Cause name is required").max(255),
  description: z.string().optional(),
  widget_id: z.string().uuid("Valid widget ID is required"),
  goal_amount: z.number().positive().optional(),
  is_active: z.boolean().default(true),
});

export const updateCauseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  goal_amount: z.number().positive().optional(),
  is_active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// Donation schemas
export const createDonationSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
  donor_email: z.string().email("Valid email is required"),
  donor_name: z.string().optional(),
  widget_id: z.string().uuid("Valid widget ID is required"),
  cause_id: z.string().uuid("Valid cause ID is required"),
  anonymous: z.boolean().default(false),
  message: z.string().max(1000, "Message must be less than 1000 characters").optional(),
});

// User schemas
export const createUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["super_admin", "owner", "editor"]).default("editor"),
  organization_id: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["super_admin", "owner", "editor"]).optional(),
  organization_id: z.string().uuid().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

// Stripe schemas
export const stripeConnectSchema = z.object({
  email: z.string().email("Valid email is required"),
  organizationName: z.string().min(1, "Organization name is required"),
  refreshUrl: z.string().url("Valid refresh URL is required"),
  returnUrl: z.string().url("Valid return URL is required"),
});

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.unknown(),
  }),
  account: z.string().optional(),
});

// Common validation helpers
export const idParamSchema = z.object({
  id: z.string().uuid("Valid ID is required"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Environment variables schema
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Valid Supabase URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
  
  // Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk publishable key is required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk secret key is required"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, "Stripe publishable key is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "Stripe secret key is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "Stripe webhook secret is required"),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url("Valid app URL is required"),
});

export type EnvConfig = z.infer<typeof envSchema>;