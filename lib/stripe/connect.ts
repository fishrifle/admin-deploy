import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export interface CreateConnectAccountParams {
  email: string;
  organizationName: string;
  refreshUrl: string;
  returnUrl: string;
}

export interface CreateConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
}

/**
 * Creates a Stripe Connect Standard account for an organization
 */
export async function createConnectAccount({
  email,
  organizationName,
  refreshUrl,
  returnUrl,
}: CreateConnectAccountParams): Promise<CreateConnectAccountResult> {
  try {
    // Create the connect account
    const account = await stripe.accounts.create({
      type: "standard",
      email,
      business_profile: {
        name: organizationName,
      },
      metadata: {
        organization_name: organizationName,
        created_via: "passiton_admin",
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    throw new Error("Failed to create Stripe Connect account");
  }
}

/**
 * Checks if a Stripe Connect account has completed onboarding
 */
export async function checkAccountOnboardingStatus(accountId: string): Promise<{
  onboardingComplete: boolean;
  requiresAction: boolean;
  actionUrl?: string;
}> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    const onboardingComplete = account.charges_enabled && account.payouts_enabled;
    const requiresAction = !onboardingComplete && (account.requirements?.currently_due?.length || 0) > 0;

    let actionUrl: string | undefined;
    if (requiresAction) {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?stripe_onboarding=success`,
        type: "account_onboarding",
      });
      actionUrl = accountLink.url;
    }

    return {
      onboardingComplete,
      requiresAction,
      actionUrl,
    };
  } catch (error) {
    console.error("Error checking account status:", error);
    throw new Error("Failed to check account onboarding status");
  }
}

/**
 * Creates a payment intent for a connected account
 */
export async function createPaymentIntent({
  amount,
  currency = "usd",
  connectedAccountId,
  applicationFeeAmount,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  connectedAccountId: string;
  applicationFeeAmount?: number;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        application_fee_amount: applicationFeeAmount,
        metadata,
        transfer_data: {
          destination: connectedAccountId,
        },
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to create payment intent");
  }
}

/**
 * Retrieve account information
 */
export async function getConnectAccount(accountId: string): Promise<Stripe.Account> {
  try {
    return await stripe.accounts.retrieve(accountId);
  } catch (error) {
    console.error("Error retrieving account:", error);
    throw new Error("Failed to retrieve account information");
  }
}

/**
 * Create login link for connected account dashboard
 */
export async function createLoginLink(accountId: string): Promise<string> {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  } catch (error) {
    console.error("Error creating login link:", error);
    throw new Error("Failed to create dashboard login link");
  }
}

export { stripe };