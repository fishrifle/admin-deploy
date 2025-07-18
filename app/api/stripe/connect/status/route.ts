import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { checkAccountOnboardingStatus } from "@/lib/stripe/connect";

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Check if user has permission to view this organization
    const { data: userData } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!userData || (userData.organization_id !== organizationId && userData.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get organization's Stripe account ID
    const { data: organization } = await supabase
      .from("organizations")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", organizationId)
      .single();

    if (!organization || !organization.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account found for this organization" },
        { status: 404 }
      );
    }

    // Check onboarding status with Stripe
    const status = await checkAccountOnboardingStatus(organization.stripe_account_id);

    // Update local database if onboarding status changed
    if (status.onboardingComplete !== organization.stripe_onboarding_complete) {
      await supabase
        .from("organizations")
        .update({
          stripe_onboarding_complete: status.onboardingComplete,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId);
    }

    return NextResponse.json({
      accountId: organization.stripe_account_id,
      ...status,
    });
  } catch (error) {
    console.error("Error checking Stripe Connect status:", error);
    return NextResponse.json(
      { error: "Failed to check Stripe Connect status" },
      { status: 500 }
    );
  }
}