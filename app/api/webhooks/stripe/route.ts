import { supabaseAdmin } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err}` },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin;

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update donation status
      await supabase
        .from("donations")
        .update({ status: "succeeded" })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      // Get donation details to update cause raised amount
      const { data: donation } = await supabase
        .from("donations")
        .select("cause_id, amount")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .single();

      if (donation?.cause_id) {
        // Update cause raised amount
        const { data: cause } = await supabase
          .from("causes")
          .select("raised_amount")
          .eq("id", donation.cause_id)
          .single();

        if (cause) {
          await supabase
            .from("causes")
            .update({ raised_amount: cause.raised_amount + donation.amount })
            .eq("id", donation.cause_id);
        }
      }
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from("organizations")
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", subscription.customer);
      break;

    case "invoice.payment_succeeded":
      const invoice = event.data.object as Stripe.Invoice;

      // Create invoice record
      await supabase.from("invoices").insert({
        organization_id: invoice.metadata?.organization_id || null,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: "paid",
        pdf_url: invoice.invoice_pdf,
      });
      break;
  }

  return NextResponse.json({ received: true });
}
