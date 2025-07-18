import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin;

    // Check if user exists in our database
    const { data: userData, error } = await supabase
      .from("users")
      .select(`
        *,
        organizations (
          id,
          name,
          display_name,
          legal_name,
          email,
          stripe_account_id,
          stripe_onboarding_complete,
          subscription_status
        )
      `)
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // User not found
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      user: userData,
      organization: userData.organizations,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}