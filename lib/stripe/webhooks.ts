import Stripe from "stripe";
import { stripe } from "./connect";
import { supabaseAdmin } from "../supabase/server";

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  account?: string;
}

/**
 * Handles Stripe webhook events
 */
export async function handleStripeWebhook(event: WebhookEvent): Promise<void> {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;
      
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event);
        break;
      
      case "account.updated":
        await handleAccountUpdated(event);
        break;
      
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.id}:`, error);
    throw error;
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(event: WebhookEvent): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  try {
    // Update donation record in database
    const { error } = await supabaseAdmin
      .from("donations")
      .update({
        status: "completed",
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Error updating donation:", error);
      throw error;
    }

    console.log(`Payment intent ${paymentIntent.id} succeeded`);
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(event: WebhookEvent): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  try {
    // Update donation record in database
    const { error } = await supabaseAdmin
      .from("donations")
      .update({
        status: "failed",
        stripe_payment_intent_id: paymentIntent.id,
        error_message: paymentIntent.last_payment_error?.message || "Payment failed",
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Error updating failed donation:", error);
      throw error;
    }

    console.log(`Payment intent ${paymentIntent.id} failed`);
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
    throw error;
  }
}

/**
 * Handle account updates
 */
async function handleAccountUpdated(event: WebhookEvent): Promise<void> {
  const account = event.data.object as Stripe.Account;
  
  try {
    // Update organization record with account status
    const { error } = await supabaseAdmin
      .from("organizations")
      .update({
        stripe_account_enabled: account.charges_enabled && account.payouts_enabled,
        stripe_account_status: (account.requirements?.currently_due?.length || 0) > 0 ? "pending" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", account.id);

    if (error) {
      console.error("Error updating organization:", error);
      throw error;
    }

    console.log(`Account ${account.id} updated`);
  } catch (error) {
    console.error("Error handling account updated:", error);
    throw error;
  }
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(event: WebhookEvent): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  try {
    // Log invoice payment for record keeping
    console.log(`Invoice ${invoice.id} payment succeeded for ${invoice.amount_paid}`);
    
    // You can add additional logic here for invoice handling
    // such as updating subscription status, sending notifications, etc.
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): WebhookEvent {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    throw new Error("Invalid webhook signature");
  }
}