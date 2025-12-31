import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const stripeRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Pricing plans
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: ["3 projects", "Basic AI assistance", "Community support"],
  },
  pro: {
    name: "Pro",
    price: 2900, // $29.00 in cents
    priceId: "price_pro_monthly", // Replace with actual Stripe price ID
    features: ["100 projects", "Advanced AI", "Priority support", "Custom domains", "API access"],
  },
  enterprise: {
    name: "Enterprise",
    price: 9900, // $99.00 in cents
    priceId: "price_enterprise_monthly", // Replace with actual Stripe price ID
    features: ["Unlimited projects", "Dedicated AI", "24/7 support", "SSO", "Custom integrations", "SLA"],
  },
};

// Get pricing plans (public)
stripeRoutes.get("/plans", async (c) => {
  return c.json({ plans: PLANS });
});

// Create checkout session
stripeRoutes.post("/checkout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    const body = await c.req.json();
    const { plan } = body;
    
    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return c.json({ error: "Invalid plan" }, 400);
    }
    
    // Get Stripe secret key from admin config or env
    const stripeKey = c.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return c.json({ error: "Stripe not configured. Please contact administrator." }, 500);
    }
    
    const planConfig = PLANS[plan as keyof typeof PLANS];
    
    // Get or create Stripe customer
    let subscription = await db.select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, user.id))
      .get();
    
    let customerId = subscription?.stripeCustomerId;
    
    if (!customerId) {
      // Create Stripe customer
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email,
          name: user.name || "",
          "metadata[userId]": user.id.toString(),
        }),
      });
      
      if (!customerResponse.ok) {
        const error = await customerResponse.json();
        console.error("Stripe customer error:", error);
        return c.json({ error: "Failed to create customer" }, 500);
      }
      
      const customer = await customerResponse.json() as any;
      customerId = customer.id;
      
      // Update subscription record
      if (subscription) {
        await db.update(schema.subscriptions)
          .set({ stripeCustomerId: customerId })
          .where(eq(schema.subscriptions.userId, user.id));
      } else {
        await db.insert(schema.subscriptions).values({
          userId: user.id,
          plan: "free",
          status: "active",
          stripeCustomerId: customerId,
        });
      }
    }
    
    // Create checkout session
    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        mode: "subscription",
        "line_items[0][price]": planConfig.priceId || "",
        "line_items[0][quantity]": "1",
        success_url: `${c.env.APP_URL}/dashboard?checkout=success`,
        cancel_url: `${c.env.APP_URL}/pricing?checkout=canceled`,
        "metadata[userId]": user.id.toString(),
        "metadata[plan]": plan,
      }),
    });
    
    if (!sessionResponse.ok) {
      const error = await sessionResponse.json();
      console.error("Stripe session error:", error);
      return c.json({ error: "Failed to create checkout session" }, 500);
    }
    
    const session = await sessionResponse.json() as any;
    
    return c.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Create customer portal session
stripeRoutes.post("/portal", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const subscription = await db.select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, payload.userId as number))
      .get();
    
    if (!subscription?.stripeCustomerId) {
      return c.json({ error: "No subscription found" }, 404);
    }
    
    const stripeKey = c.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return c.json({ error: "Stripe not configured" }, 500);
    }
    
    const portalResponse = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: subscription.stripeCustomerId,
        return_url: `${c.env.APP_URL}/dashboard`,
      }),
    });
    
    if (!portalResponse.ok) {
      const error = await portalResponse.json();
      console.error("Stripe portal error:", error);
      return c.json({ error: "Failed to create portal session" }, 500);
    }
    
    const portal = await portalResponse.json() as any;
    
    return c.json({ url: portal.url });
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Webhook handler
stripeRoutes.post("/webhook", async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeKey) {
    return c.json({ error: "Stripe not configured" }, 500);
  }
  
  const signature = c.req.header("stripe-signature");
  const body = await c.req.text();
  
  // Verify webhook signature if secret is configured
  if (webhookSecret && signature) {
    // In production, you'd verify the signature here
    // For now, we'll trust the webhook
  }
  
  const event = JSON.parse(body);
  const db = c.get("db");
  
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = parseInt(session.metadata.userId);
      const plan = session.metadata.plan;
      
      await db.update(schema.subscriptions)
        .set({
          plan: plan as "free" | "pro" | "enterprise",
          status: "active",
          stripeSubscriptionId: session.subscription,
          updatedAt: new Date(),
        })
        .where(eq(schema.subscriptions.userId, userId));
      
      break;
    }
    
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      
      const sub = await db.select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
        .get();
      
      if (sub) {
        await db.update(schema.subscriptions)
          .set({
            status: subscription.status === "active" ? "active" : 
                   subscription.status === "past_due" ? "past_due" :
                   subscription.status === "canceled" ? "canceled" : "active",
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.id, sub.id));
      }
      
      break;
    }
    
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      
      const sub = await db.select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
        .get();
      
      if (sub) {
        await db.update(schema.subscriptions)
          .set({
            plan: "free",
            status: "canceled",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.id, sub.id));
      }
      
      break;
    }
    
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      
      if (invoice.subscription) {
        const sub = await db.select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.stripeSubscriptionId, invoice.subscription))
          .get();
        
        if (sub) {
          await db.insert(schema.payments).values({
            userId: sub.userId,
            subscriptionId: sub.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "succeeded",
          });
        }
      }
      
      break;
    }
    
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      
      if (invoice.subscription) {
        const sub = await db.select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.stripeSubscriptionId, invoice.subscription))
          .get();
        
        if (sub) {
          await db.update(schema.subscriptions)
            .set({ status: "past_due", updatedAt: new Date() })
            .where(eq(schema.subscriptions.id, sub.id));
          
          await db.insert(schema.payments).values({
            userId: sub.userId,
            subscriptionId: sub.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: "failed",
          });
        }
      }
      
      break;
    }
  }
  
  return c.json({ received: true });
});

// Get subscription status
stripeRoutes.get("/subscription", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const subscription = await db.select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, payload.userId as number))
      .get();
    
    if (!subscription) {
      return c.json({ 
        subscription: {
          plan: "free",
          status: "active",
        }
      });
    }
    
    return c.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      }
    });
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});
