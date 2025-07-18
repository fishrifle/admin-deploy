import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;
  const body = await req.json();

  try {
    // Get user's organization
    const { data: user } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!user?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Create widget
    const { data: widget, error } = await supabase
      .from("widgets")
      .insert({
        organization_id: user.organization_id,
        name: body.name,
        slug: body.slug,
        config: body.config || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(widget);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create widget" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;

  try {
    // Get user's organization
    const { data: user } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let query = supabase.from("widgets").select("*");

    // If not super admin, filter by organization
    if (user.role !== "super_admin") {
      query = query.eq("organization_id", user.organization_id);
    }

    const { data: widgets, error } = await query;

    if (error) throw error;

    return NextResponse.json(widgets);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch widgets" },
      { status: 500 }
    );
  }
}
