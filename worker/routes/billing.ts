import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";
import Stripe from "stripe";

const billing = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
billing.use("*", authMiddleware);

// Helper to get Stripe instance
function getStripe(env: Env): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

// Get subscription details
billing.get("/subscription", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription) {
    return c.json({
      subscription: {
        plan: "free",
        status: "active",
        customerId: null,
        priceId: null,
        amount: 0,
        currency: "usd",
        interval: "month",
      },
    });
  }

  // Get Stripe subscription details if available
  let stripeDetails = null;
  if (stripe && subscription.stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      stripeDetails = {
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
      };
    } catch (error) {
      console.error("Failed to fetch Stripe subscription:", error);
    }
  }

  return c.json({
    subscription: {
      plan: subscription.plan,
      status: subscription.status,
      customerId: subscription.stripeCustomerId,
      priceId: subscription.stripePriceId,
      amount: subscription.amount || 0,
      currency: subscription.currency || "usd",
      interval: subscription.interval || "month",
      ...stripeDetails,
    },
  });
});

// Get invoices
billing.get("/invoices", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!stripe || !subscription?.stripeCustomerId) {
    return c.json({ invoices: [] });
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 24,
    });

    return c.json({
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.status_transitions?.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
          : null,
        dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
        pdfUrl: inv.invoice_pdf,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return c.json({ invoices: [] });
  }
});

// Get payment methods
billing.get("/payment-methods", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!stripe || !subscription?.stripeCustomerId) {
    return c.json({ paymentMethods: [] });
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: subscription.stripeCustomerId,
      type: "card",
    });

    const customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
    const defaultPaymentMethodId =
      typeof customer !== "string" && !customer.deleted
        ? customer.invoice_settings?.default_payment_method
        : null;

    return c.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch payment methods:", error);
    return c.json({ paymentMethods: [] });
  }
});

// Add payment method
billing.post("/payment-methods", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);
  const { paymentMethodId } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  let subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  // Create customer if doesn't exist
  if (!subscription?.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id.toString() },
    });

    if (subscription) {
      await db
        .update(schema.subscriptions)
        .set({ stripeCustomerId: customer.id })
        .where(eq(schema.subscriptions.userId, user.id));
    } else {
      await db.insert(schema.subscriptions).values({
        userId: user.id,
        plan: "free",
        status: "active",
        stripeCustomerId: customer.id,
      });
    }

    subscription = { ...subscription, stripeCustomerId: customer.id } as any;
  }

  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription!.stripeCustomerId!,
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Remove payment method
billing.delete("/payment-methods/:paymentMethodId", async (c) => {
  const user = c.get("user");
  const stripe = getStripe(c.env);
  const paymentMethodId = c.req.param("paymentMethodId");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Set default payment method
billing.post("/payment-methods/default", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);
  const { paymentMethodId } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription?.stripeCustomerId) {
    return c.json({ error: "No customer found" }, 400);
  }

  try {
    await stripe.customers.update(subscription.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Change plan
billing.post("/change-plan", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);
  const { planId, billingPeriod } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription?.stripeCustomerId) {
    return c.json({ error: "No customer found" }, 400);
  }

  // Get price ID based on plan and billing period
  const priceId = getPriceId(planId, billingPeriod);
  if (!priceId) {
    return c.json({ error: "Invalid plan" }, 400);
  }

  try {
    if (subscription.stripeSubscriptionId) {
      // Update existing subscription
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{ id: stripeSub.items.data[0].id, price: priceId }],
        proration_behavior: "create_prorations",
      });
    } else {
      // Create new subscription
      const stripeSub = await stripe.subscriptions.create({
        customer: subscription.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      await db
        .update(schema.subscriptions)
        .set({
          stripeSubscriptionId: stripeSub.id,
          stripePriceId: priceId,
          plan: planId,
          status: stripeSub.status,
        })
        .where(eq(schema.subscriptions.userId, user.id));
    }

    // Update local subscription
    await db
      .update(schema.subscriptions)
      .set({
        plan: planId,
        stripePriceId: priceId,
        interval: billingPeriod,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.userId, user.id));

    const updatedSub = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, user.id),
    });

    return c.json({ success: true, subscription: updatedSub });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Cancel subscription
billing.post("/cancel", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);
  const { immediately } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription?.stripeSubscriptionId) {
    return c.json({ error: "No subscription found" }, 400);
  }

  try {
    if (immediately) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      await db
        .update(schema.subscriptions)
        .set({ status: "canceled", plan: "free" })
        .where(eq(schema.subscriptions.userId, user.id));
    } else {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      await db
        .update(schema.subscriptions)
        .set({ cancelAtPeriodEnd: true })
        .where(eq(schema.subscriptions.userId, user.id));
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Reactivate subscription
billing.post("/reactivate", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const stripe = getStripe(c.env);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription?.stripeSubscriptionId) {
    return c.json({ error: "No subscription found" }, 400);
  }

  try {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db
      .update(schema.subscriptions)
      .set({ cancelAtPeriodEnd: false })
      .where(eq(schema.subscriptions.userId, user.id));

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Download invoice
billing.get("/invoices/:invoiceId/download", async (c) => {
  const user = c.get("user");
  const stripe = getStripe(c.env);
  const invoiceId = c.req.param("invoiceId");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return c.json({ url: invoice.invoice_pdf });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Helper to get price ID
function getPriceId(plan: string, period: string): string | null {
  // These would be your actual Stripe price IDs
  const prices: Record<string, Record<string, string>> = {
    pro: {
      monthly: "price_pro_monthly",
      yearly: "price_pro_yearly",
    },
    enterprise: {
      monthly: "price_enterprise_monthly",
      yearly: "price_enterprise_yearly",
    },
  };

  return prices[plan]?.[period] || null;
}

export { billing as billingRoutes };
