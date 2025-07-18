import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // If no webhook secret is configured, return early
  if (!webhookSecret) {
    return new Response("Webhook not configured", { status: 400 });
  }
  const body = await req.text();
  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const { id } = (evt as any).data;
  const eventType = (evt as any).type;

  if (eventType === "user.created") {
    try {
      const { email_addresses, first_name, last_name } = (evt as any).data;
      const email = email_addresses[0]?.email_address;

      console.log("Creating user in Supabase:", { id, email, first_name, last_name });

      // Insert user into Supabase
      const { error } = await supabase.from("users").insert({
        id: id,
        email: email,
        first_name: first_name || null,
        last_name: last_name || null,
        role: "member", // default role
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error creating user in Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("User created successfully in Supabase");
    } catch (error) {
      console.error("Error in user.created webhook:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    try {
      const { email_addresses, first_name, last_name } = (evt as any).data;
      const email = email_addresses[0]?.email_address;

      const { error } = await supabase
        .from("users")
        .update({
          email: email,
          first_name: first_name || null,
          last_name: last_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating user in Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch (error) {
      console.error("Error in user.updated webhook:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) {
        console.error("Error deleting user from Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch (error) {
      console.error("Error in user.deleted webhook:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Webhook processed successfully" });
}