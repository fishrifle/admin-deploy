export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          clerk_org_id: string | null;
          name: string;
          legal_name: string | null;
          display_name: string | null;
          email: string;
          website: string | null;
          description: string | null;
          logo_url: string | null;
          phone: string | null;
          address: string | null;
          stripe_customer_id: string | null;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          stripe_account_enabled: boolean;
          stripe_account_status: string;
          subscription_status: string;
          subscription_plan: string;
          terms_of_service_url: string | null;
          privacy_policy_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_org_id?: string | null;
          name: string;
          legal_name?: string | null;
          display_name?: string | null;
          email: string;
          website?: string | null;
          description?: string | null;
          logo_url?: string | null;
          phone?: string | null;
          address?: string | null;
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          stripe_account_enabled?: boolean;
          stripe_account_status?: string;
          subscription_status?: string;
          subscription_plan?: string;
          terms_of_service_url?: string | null;
          privacy_policy_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_org_id?: string | null;
          name?: string;
          legal_name?: string | null;
          display_name?: string | null;
          email?: string;
          website?: string | null;
          description?: string | null;
          logo_url?: string | null;
          phone?: string | null;
          address?: string | null;
          stripe_customer_id?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          stripe_account_enabled?: boolean;
          stripe_account_status?: string;
          subscription_status?: string;
          subscription_plan?: string;
          terms_of_service_url?: string | null;
          privacy_policy_url?: string | null;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          clerk_id: string;
          organization_id: string | null;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: "super_admin" | "owner" | "admin" | "editor" | "member" | "viewer";
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          clerk_id: string;
          organization_id?: string | null;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "owner" | "admin" | "editor" | "member" | "viewer";
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          clerk_id?: string;
          organization_id?: string | null;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "owner" | "admin" | "editor" | "member" | "viewer";
          is_active?: boolean;
          last_login_at?: string | null;
          updated_at?: string;
        };
      };
      widgets: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          config?: Json;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      widget_themes: {
        Row: {
          id: string;
          widget_id: string;
          primary_color: string;
          secondary_color: string;
          background_color: string;
          text_color: string;
          font_family: string;
          font_size: string;
          border_radius: number;
          border_width: number;
          border_color: string;
          custom_css: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          primary_color?: string;
          secondary_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          font_size?: string;
          border_radius?: number;
          border_width?: number;
          border_color?: string;
          custom_css?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          widget_id?: string;
          primary_color?: string;
          secondary_color?: string;
          background_color?: string;
          text_color?: string;
          font_family?: string;
          font_size?: string;
          border_radius?: number;
          border_width?: number;
          border_color?: string;
          custom_css?: string | null;
          updated_at?: string;
        };
      };
      causes: {
        Row: {
          id: string;
          widget_id: string;
          name: string;
          title: string;
          description: string | null;
          image_url: string | null;
          goal_amount: number | null;
          target_amount: number | null;
          raised_amount: number;
          current_amount: number;
          suggested_amounts: number[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          goal_amount?: number | null;
          suggested_amounts?: number[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          widget_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          goal_amount?: number | null;
          suggested_amounts?: number[];
          is_active?: boolean;
          updated_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          widget_id: string;
          cause_id: string | null;
          initiative_id: string | null;
          organization_id: string | null;
          donor_email: string | null;
          donor_name: string | null;
          is_anonymous: boolean;
          anonymous: boolean;
          donor_message: string | null;
          message: string | null;
          amount: number;
          amount_cents: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          status: string;
          processed_at: string | null;
          failed_reason: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          cause_id?: string | null;
          donor_email?: string | null;
          donor_name?: string | null;
          is_anonymous?: boolean;
          donor_message?: string | null;
          amount: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: string;
          processed_at?: string | null;
          failed_reason?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          widget_id?: string;
          cause_id?: string | null;
          donor_email?: string | null;
          donor_name?: string | null;
          is_anonymous?: boolean;
          donor_message?: string | null;
          amount?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: string;
          processed_at?: string | null;
          failed_reason?: string | null;
          error_message?: string | null;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          stripe_invoice_id: string | null;
          stripe_subscription_id: string | null;
          invoice_number: string | null;
          amount: number;
          currency: string;
          status: string;
          due_date: string | null;
          paid_at: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_invoice_id?: string | null;
          stripe_subscription_id?: string | null;
          invoice_number?: string | null;
          amount: number;
          currency?: string;
          status: string;
          due_date?: string | null;
          paid_at?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          stripe_invoice_id?: string | null;
          stripe_subscription_id?: string | null;
          invoice_number?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          due_date?: string | null;
          paid_at?: string | null;
          pdf_url?: string | null;
          updated_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          permissions: Json;
          invited_by: string | null;
          invited_email: string | null;
          invitation_token: string | null;
          status: string;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          permissions?: Json;
          invited_by?: string | null;
          invited_email?: string | null;
          invitation_token?: string | null;
          status?: string;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: string;
          permissions?: Json;
          invited_by?: string | null;
          invited_email?: string | null;
          invitation_token?: string | null;
          status?: string;
          invited_at?: string;
          joined_at?: string | null;
          updated_at?: string;
        };
      };
      analytics: {
        Row: {
          id: string;
          widget_id: string;
          date: string;
          hour: number | null;
          views: number;
          unique_views: number;
          donations_count: number;
          donations_amount: number;
          conversion_rate: number;
          bounce_rate: number;
          average_time_on_widget: number;
          device_type: string | null;
          traffic_source: string | null;
          country_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          widget_id: string;
          date: string;
          hour?: number | null;
          views?: number;
          unique_views?: number;
          donations_count?: number;
          donations_amount?: number;
          conversion_rate?: number;
          bounce_rate?: number;
          average_time_on_widget?: number;
          device_type?: string | null;
          traffic_source?: string | null;
          country_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          widget_id?: string;
          date?: string;
          hour?: number | null;
          views?: number;
          unique_views?: number;
          donations_count?: number;
          donations_amount?: number;
          conversion_rate?: number;
          bounce_rate?: number;
          average_time_on_widget?: number;
          device_type?: string | null;
          traffic_source?: string | null;
          country_code?: string | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          timestamp?: string;
        };
        Update: {
          user_id?: string | null;
          organization_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          timestamp?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes: string[];
          is_active: boolean;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          scopes?: string[];
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      initiatives: {
        Row: {
          id: string;
          widget_id: string;
          organization_id: string;
          title: string;
          name: string;
          description: string | null;
          goal_amount: number | null;
          raised_amount: number;
          image_url: string | null;
          suggested_amounts: number[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      get_donation_stats: {
        Args: {
          p_widget_id: string;
        };
        Returns: {
          total_raised: number;
          total_donations: number;
          average_donation: number;
          unique_donors: number;
        }[];
      };
    };
  };
}