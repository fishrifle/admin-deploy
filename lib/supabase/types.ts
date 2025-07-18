// Re-export database types for easier importing
import type { Database } from "@/types/database.types";
export type { Database } from "@/types/database.types";

// Common table row types
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Widget = Database["public"]["Tables"]["widgets"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Cause = Database["public"]["Tables"]["causes"]["Row"];

// Insert types
export type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
export type WidgetInsert = Database["public"]["Tables"]["widgets"]["Insert"];
export type DonationInsert = Database["public"]["Tables"]["donations"]["Insert"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type CauseInsert = Database["public"]["Tables"]["causes"]["Insert"];

// Update types
export type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];
export type WidgetUpdate = Database["public"]["Tables"]["widgets"]["Update"];
export type DonationUpdate = Database["public"]["Tables"]["donations"]["Update"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type CauseUpdate = Database["public"]["Tables"]["causes"]["Update"];

// Common enums
export type DonationStatus = "pending" | "completed" | "failed" | "refunded";
export type WidgetStatus = "active" | "inactive" | "draft";
export type OrganizationStatus = "active" | "suspended" | "pending";

// Common interfaces for form data
export interface CreateOrganizationData {
  name: string;
  description?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
}

export interface CreateWidgetData {
  name: string;
  description?: string;
  organization_id: string;
  cause_id: string;
  target_amount?: number;
  is_active?: boolean;
  custom_css?: string;
  custom_fields?: Record<string, any>;
}

export interface CreateDonationData {
  amount: number;
  currency: string;
  donor_email: string;
  donor_name?: string;
  widget_id: string;
  organization_id: string;
  cause_id: string;
  anonymous?: boolean;
  message?: string;
}