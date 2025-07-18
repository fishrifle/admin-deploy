import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createLoginLink } from "@/lib/stripe/connect";

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

    // Check if user has permission to access this organization
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

    if (!organization.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "Stripe onboarding not completed" },
        { status: 400 }
      );
    }

    // Create login link to Stripe dashboard
    const dashboardUrl = await createLoginLink(organization.stripe_account_id);

    return NextResponse.json({
      dashboardUrl,
    });
  } catch (error) {
    console.error("Error creating Stripe dashboard link:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard link" },
      { status: 500 }
    );
  }
}