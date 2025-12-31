import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { stripe } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Sparkles, Zap, Building2 } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for trying out ADELE",
    icon: Sparkles,
    features: [
      "3 projects",
      "Basic AI assistance",
      "Community templates",
      "Email support",
      "1GB storage",
    ],
    limitations: [
      "Limited AI requests",
      "No custom domains",
      "ADELE branding",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "month",
    description: "For professionals and growing teams",
    icon: Zap,
    features: [
      "Unlimited projects",
      "Advanced AI assistance",
      "All templates",
      "Priority support",
      "10GB storage",
      "Custom domains",
      "Remove branding",
      "API access",
      "Team collaboration (up to 5)",
    ],
    limitations: [],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    period: "month",
    description: "For large teams and organizations",
    icon: Building2,
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Unlimited team members",
      "SSO authentication",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment",
      "Advanced analytics",
      "White-label option",
    ],
    limitations: [],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      setLocation("/login");
      return;
    }

    if (planId === "free") {
      setLocation("/dashboard");
      return;
    }

    if (planId === "enterprise") {
      window.location.href = "mailto:sales@adele.ayonix.com?subject=Enterprise Plan Inquiry";
      return;
    }

    setLoading(planId);
    try {
      const response = await stripe.createCheckout(planId, billingPeriod);
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const yearlyDiscount = 0.2; // 20% off for yearly

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={user ? "/dashboard" : "/"} className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="ADELE" className="h-10 w-10" />
              <span className="text-xl font-semibold">ADELE</span>
            </Link>
          </div>

          {!user && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that's right for you. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                billingPeriod === "monthly"
                  ? "bg-background shadow"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                billingPeriod === "yearly"
                  ? "bg-background shadow"
                  : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const price =
                plan.price > 0 && billingPeriod === "yearly"
                  ? Math.round(plan.price * (1 - yearlyDiscount))
                  : plan.price;
              const isCurrentPlan = subscription?.plan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-card rounded-2xl border-2 overflow-hidden ${
                    plan.popular ? "border-primary" : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className={`p-8 ${plan.popular ? "pt-12" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                    </div>

                    <p className="text-muted-foreground mb-6">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold">${price}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingPeriod === "yearly" ? "mo" : plan.period}
                        </span>
                      )}
                      {billingPeriod === "yearly" && plan.price > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed ${price * 12}/year
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id || isCurrentPlan}
                      className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                        plan.popular
                          ? "bg-primary text-primary-foreground apple-button"
                          : "border hover:bg-muted"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : (
                        plan.cta
                      )}
                    </button>
                  </div>

                  <div className="border-t px-8 py-6">
                    <p className="text-sm font-medium mb-4">What's included:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <>
                        <p className="text-sm font-medium mt-6 mb-4 text-muted-foreground">
                          Limitations:
                        </p>
                        <ul className="space-y-3">
                          {plan.limitations.map((limitation) => (
                            <li
                              key={limitation}
                              className="flex items-start gap-3 text-sm text-muted-foreground"
                            >
                              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                •
                              </span>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "Can I change plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal through our secure Stripe integration.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start.",
              },
              {
                q: "What happens to my projects if I cancel?",
                a: "Your projects remain accessible in read-only mode. You can export your code at any time, even after cancellation.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-card rounded-xl p-6 border">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
