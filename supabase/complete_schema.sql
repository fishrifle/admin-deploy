-- =============================================
-- COMPLETE SUPABASE SCHEMA FOR PASSITON ADMIN
-- =============================================
-- This schema matches all data points found in the codebase
-- Supports both naming conventions and all current usage patterns

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  legal_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_account_id TEXT UNIQUE,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  stripe_account_enabled BOOLEAN DEFAULT false,
  stripe_account_status TEXT DEFAULT 'pending',
  
  -- Subscription
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
  
  -- Metadata
  terms_of_service_url TEXT,
  privacy_policy_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USERS TABLE  
-- =============================================
CREATE TABLE public.users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  clerk_id TEXT UNIQUE NOT NULL, -- Alternative clerk reference
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Profile
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Permissions
  role TEXT DEFAULT 'editor' CHECK (role IN ('super_admin', 'owner', 'admin', 'editor', 'member', 'viewer')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WIDGETS TABLE
-- =============================================
CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, slug)
);

-- =============================================
-- WIDGET THEMES TABLE
-- =============================================
CREATE TABLE public.widget_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  
  -- Colors
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  
  -- Typography
  font_family TEXT DEFAULT 'Inter',
  font_size TEXT DEFAULT '16px',
  
  -- Layout
  border_radius INTEGER DEFAULT 8,
  border_width INTEGER DEFAULT 1,
  border_color TEXT DEFAULT '#e5e7eb',
  
  -- Custom styling
  custom_css TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(widget_id)
);

-- =============================================
-- CAUSES/INITIATIVES TABLE (Supporting both naming conventions)
-- =============================================
CREATE TABLE public.causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  
  -- Content
  name TEXT NOT NULL, -- Also supports 'title' in queries
  title TEXT GENERATED ALWAYS AS (name) STORED, -- Computed column for backward compatibility
  description TEXT,
  image_url TEXT,
  
  -- Financial goals
  goal_amount DECIMAL(12,2), -- Also supports 'target_amount'
  target_amount DECIMAL(12,2) GENERATED ALWAYS AS (goal_amount) STORED,
  raised_amount DECIMAL(12,2) DEFAULT 0, -- Also supports 'current_amount'
  current_amount DECIMAL(12,2) GENERATED ALWAYS AS (raised_amount) STORED,
  
  -- Donation suggestions
  suggested_amounts INTEGER[] DEFAULT '{}', -- Array of amounts in cents
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alternative view for 'initiatives' naming
CREATE VIEW public.initiatives AS 
SELECT 
  id,
  widget_id,
  widget_id as organization_id, -- Map to organization through widget
  title,
  name,
  description,
  goal_amount,
  current_amount as raised_amount,
  image_url,
  suggested_amounts,
  is_active,
  created_at,
  updated_at
FROM public.causes;

-- =============================================
-- DONATIONS TABLE
-- =============================================
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  cause_id UUID REFERENCES public.causes(id) ON DELETE SET NULL,
  initiative_id UUID GENERATED ALWAYS AS (cause_id) STORED, -- Alias for cause_id
  
  -- Organization reference (computed from widget)
  organization_id UUID,
  
  -- Donor information
  donor_email TEXT,
  donor_name TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  anonymous BOOLEAN GENERATED ALWAYS AS (is_anonymous) STORED, -- Alias
  donor_message TEXT,
  message TEXT GENERATED ALWAYS AS (donor_message) STORED, -- Alias
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL, -- In currency units (dollars)
  amount_cents INTEGER GENERATED ALWAYS AS ((amount * 100)::INTEGER) STORED, -- In cents
  currency TEXT DEFAULT 'USD',
  
  -- Stripe integration
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'succeeded', 'failed', 'refunded', 'canceled')),
  
  -- Processing
  processed_at TIMESTAMPTZ,
  failed_reason TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICES TABLE
-- =============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Stripe integration
  stripe_invoice_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Invoice details
  invoice_number TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  
  -- Dates
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Files
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEMBERSHIPS TABLE (Team management)
-- =============================================
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  
  -- Invitation details
  invited_by TEXT REFERENCES public.users(id),
  invited_email TEXT,
  invitation_token TEXT UNIQUE,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  
  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, user_id)
);

-- =============================================
-- ANALYTICS TABLE
-- =============================================
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  
  -- Time period
  date DATE NOT NULL,
  hour INTEGER, -- For hourly analytics
  
  -- Metrics
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  donations_count INTEGER DEFAULT 0,
  donations_amount DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0, -- views to donations
  
  -- Additional metrics
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  average_time_on_widget INTEGER DEFAULT 0, -- seconds
  
  -- Device/source tracking
  device_type TEXT, -- mobile, desktop, tablet
  traffic_source TEXT, -- direct, social, search, referral
  country_code TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(widget_id, date, hour)
);

-- =============================================
-- AUDIT LOGS TABLE (For compliance)
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id TEXT REFERENCES public.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Action
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- API KEYS TABLE (For integrations)
-- =============================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Key details
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First few chars for identification
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}', -- ['read:donations', 'write:causes']
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to auto-populate organization_id in donations
CREATE OR REPLACE FUNCTION set_donation_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.organization_id = (
        SELECT organization_id 
        FROM widgets 
        WHERE id = NEW.widget_id
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widgets_updated_at BEFORE UPDATE ON public.widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_themes_updated_at BEFORE UPDATE ON public.widget_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_causes_updated_at BEFORE UPDATE ON public.causes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-populate organization_id in donations
CREATE TRIGGER set_donation_organization_id_trigger 
    BEFORE INSERT ON public.donations 
    FOR EACH ROW EXECUTE FUNCTION set_donation_organization_id();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Primary lookup indexes
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX idx_users_organization_id ON public.users(organization_id);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_organizations_clerk_org_id ON public.organizations(clerk_org_id);
CREATE INDEX idx_organizations_stripe_customer_id ON public.organizations(stripe_customer_id);

CREATE INDEX idx_widgets_organization_id ON public.widgets(organization_id);
CREATE INDEX idx_widgets_slug ON public.widgets(slug);
CREATE INDEX idx_widgets_active ON public.widgets(is_active);

CREATE INDEX idx_causes_widget_id ON public.causes(widget_id);
CREATE INDEX idx_causes_active ON public.causes(is_active);

CREATE INDEX idx_donations_widget_id ON public.donations(widget_id);
CREATE INDEX idx_donations_cause_id ON public.donations(cause_id);
CREATE INDEX idx_donations_organization_id ON public.donations(organization_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX idx_donations_donor_email ON public.donations(donor_email);
CREATE INDEX idx_donations_stripe_payment_intent_id ON public.donations(stripe_payment_intent_id);

CREATE INDEX idx_analytics_widget_id ON public.analytics(widget_id);
CREATE INDEX idx_analytics_date ON public.analytics(date DESC);
CREATE INDEX idx_analytics_widget_date ON public.analytics(widget_id, date DESC);

CREATE INDEX idx_memberships_organization_id ON public.memberships(organization_id);
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get donation stats (updated for new schema)
CREATE OR REPLACE FUNCTION get_donation_stats(p_widget_id UUID)
RETURNS TABLE (
  total_raised DECIMAL(10,2),
  total_donations BIGINT,
  average_donation DECIMAL(10,2),
  unique_donors BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0::DECIMAL) as total_raised,
    COUNT(*)::BIGINT as total_donations,
    COALESCE(AVG(amount), 0::DECIMAL) as average_donation,
    COUNT(DISTINCT donor_email)::BIGINT as unique_donors
  FROM public.donations 
  WHERE widget_id = p_widget_id
    AND status IN ('completed', 'succeeded');
END;
$$;

-- Function to update cause raised amounts
CREATE OR REPLACE FUNCTION update_cause_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.causes 
        SET raised_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.donations 
            WHERE cause_id = NEW.cause_id 
            AND status IN ('completed', 'succeeded')
        )
        WHERE id = NEW.cause_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.causes 
        SET raised_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.donations 
            WHERE cause_id = OLD.cause_id 
            AND status IN ('completed', 'succeeded')
        )
        WHERE id = OLD.cause_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update raised amounts
CREATE TRIGGER update_cause_raised_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION update_cause_raised_amount();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = organizations.id
  )
);

CREATE POLICY "Super admins can manage all organizations" ON public.organizations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization owners can update their organization" ON public.organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = organizations.id
    AND users.role IN ('owner', 'super_admin')
  )
);

CREATE POLICY "Allow organization creation during onboarding" ON public.organizations
FOR INSERT WITH CHECK (true);

-- Users policies  
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Super admins can manage all users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

-- Widgets policies
CREATE POLICY "Organization members can manage widgets" ON public.widgets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = widgets.organization_id
  )
);

-- Causes policies
CREATE POLICY "Super admins can manage all causes" ON public.causes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can manage their causes" ON public.causes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.widgets w ON w.organization_id = u.organization_id
    WHERE u.id = auth.uid()::text 
    AND w.id = causes.widget_id
  )
);

-- Donations policies
CREATE POLICY "Super admins can view all donations" ON public.donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization members can view their donations" ON public.donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = donations.organization_id
  )
);

-- Allow public donation creation
CREATE POLICY "Public can create donations" ON public.donations
FOR INSERT WITH CHECK (true);

-- Widget themes policies
CREATE POLICY "Organization members can manage widget themes" ON public.widget_themes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.widgets w ON w.organization_id = u.organization_id
    WHERE u.id = auth.uid()::text 
    AND w.id = widget_themes.widget_id
  )
);

-- Memberships policies
CREATE POLICY "Organization admins can manage memberships" ON public.memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = memberships.organization_id
    AND users.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Analytics policies
CREATE POLICY "Organization members can view analytics" ON public.analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.widgets w ON w.organization_id = u.organization_id
    WHERE u.id = auth.uid()::text 
    AND w.id = analytics.widget_id
  )
);

-- Audit logs policies
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "Organization owners can view their audit logs" ON public.audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = audit_logs.organization_id
    AND users.role IN ('owner', 'super_admin')
  )
);

-- API keys policies
CREATE POLICY "Organization admins can manage API keys" ON public.api_keys
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.organization_id = api_keys.organization_id
    AND users.role IN ('owner', 'admin', 'super_admin')
  )
);

-- =============================================
-- SAMPLE DATA (Optional - for development)
-- =============================================
-- Uncomment below for development sample data

/*
-- Insert sample organization
INSERT INTO public.organizations (name, email, description) 
VALUES ('Sample Charity', 'admin@samplecharity.org', 'A sample charity organization')
ON CONFLICT DO NOTHING;

-- Insert sample user
INSERT INTO public.users (id, clerk_id, email, role, organization_id)
SELECT 'user_sample_123', 'clerk_sample_123', 'admin@samplecharity.org', 'owner', id
FROM public.organizations WHERE email = 'admin@samplecharity.org'
ON CONFLICT DO NOTHING;
*/