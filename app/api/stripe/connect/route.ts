import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createConnectAccount } from "@/lib/stripe/connect";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await req.json();
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Check if user has permission to modify this organization
    const { data: userData } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!userData || (userData.organization_id !== organizationId && userData.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get organization details
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if already has Stripe account
    if (organization.stripe_account_id) {
      return NextResponse.json(
        { error: "Organization already has a Stripe account" },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { accountId, onboardingUrl } = await createConnectAccount({
      email: organization.email,
      organizationName: organization.display_name || organization.name,
      refreshUrl: `${baseUrl}/dashboard/settings?stripe_refresh=true`,
      returnUrl: `${baseUrl}/dashboard/settings?stripe_success=true`,
    });

    // Update organization with Stripe account ID
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        stripe_account_id: accountId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId);

    if (updateError) {
      console.error("Error updating organization:", updateError);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accountId,
      onboardingUrl,
    });
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account" },
      { status: 500 }
    );
  }
}