import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { widgetId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;

  try {
    const { data: widget, error } = await supabase
      .from("widgets")
      .select("*, widget_themes(*), causes(*)")
      .eq("id", params.widgetId)
      .single();

    if (error) throw error;

    return NextResponse.json(widget);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch widget" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { widgetId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;
  const body = await req.json();

  try {
    // Verify user has permission to update this widget
    const { data: user } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    const { data: widget } = await supabase
      .from("widgets")
      .select("organization_id")
      .eq("id", params.widgetId)
      .single();

    if (!widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    if (
      user?.role !== "super_admin" &&
      widget.organization_id !== user?.organization_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update widget
    const { data: updatedWidget, error } = await supabase
      .from("widgets")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.widgetId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedWidget);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update widget" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { widgetId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;

  try {
    // Verify user has permission to delete this widget
    const { data: user } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userId)
      .single();

    const { data: widget } = await supabase
      .from("widgets")
      .select("organization_id")
      .eq("id", params.widgetId)
      .single();

    if (!widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    if (
      user?.role !== "super_admin" &&
      widget.organization_id !== user?.organization_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete widget
    const { error } = await supabase
      .from("widgets")
      .delete()
      .eq("id", params.widgetId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete widget" },
      { status: 500 }
    );
  }
}
