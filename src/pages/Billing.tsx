import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CreditCard,
  Check,
  Zap,
  Users,
  HardDrive,
  Rocket,
  Download,
  ExternalLink,
  AlertTriangle,
  Crown,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Badge, Modal, Alert, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    credits: number;
    storage: number;
    concurrency: number;
    teamMembers: number;
  };
  popular?: boolean;
}

interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  pdfUrl: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '1,000 credits/month',
      '1 GB storage',
      '1 concurrent run',
      'Community support',
      'Basic templates',
    ],
    limits: {
      credits: 1000,
      storage: 1,
      concurrency: 1,
      teamMembers: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: [
      '10,000 credits/month',
      '10 GB storage',
      '5 concurrent runs',
      'Priority support',
      'All templates',
      'Custom domains',
      'API access',
      'Team collaboration (5 members)',
    ],
    limits: {
      credits: 10000,
      storage: 10,
      concurrency: 5,
      teamMembers: 5,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited credits',
      '100 GB storage',
      'Unlimited concurrent runs',
      'Dedicated support',
      'Custom templates',
      'SSO/SAML',
      'Advanced analytics',
      'SLA guarantee',
      'Unlimited team members',
      'On-premise deployment',
    ],
    limits: {
      credits: -1,
      storage: 100,
      concurrency: -1,
      teamMembers: -1,
    },
  },
];

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Usage stats
  const [usage, setUsage] = useState({
    credits: { used: 743, limit: 1000 },
    storage: { used: 2.4, limit: 5 },
    concurrency: { used: 1, limit: 1 },
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Load subscription info
      const response = await api.billing.getSubscription();
      if (response?.subscription) {
        setCurrentPlan(response.subscription.plan || 'free');
      }

      // Mock invoices
      setInvoices([
        {
          id: 'inv_1',
          date: new Date('2024-01-01'),
          amount: 29,
          status: 'paid',
          pdfUrl: '#',
        },
        {
          id: 'inv_2',
          date: new Date('2023-12-01'),
          amount: 29,
          status: 'paid',
          pdfUrl: '#',
        },
        {
          id: 'inv_3',
          date: new Date('2023-11-01'),
          amount: 29,
          status: 'paid',
          pdfUrl: '#',
        },
      ]);

      // Mock payment methods
      setPaymentMethods([
        {
          id: 'pm_1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          isDefault: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      // Create Stripe checkout session
      const response = await api.billing.createCheckoutSession({
        planId: selectedPlan.id,
        interval: billingInterval,
      });
      
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start upgrade');
    } finally {
      setLoading(false);
      setShowUpgradeModal(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await api.billing.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await api.billing.cancelSubscription();
      toast.success('Subscription cancelled. You will retain access until the end of your billing period.');
      setShowCancelModal(false);
      loadBillingData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.floor(monthlyPrice * 12 * 0.8); // 20% discount for yearly
  };

  const currentPlanData = plans.find((p) => p.id === currentPlan);

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Billing"
          description="Manage your subscription and payment methods"
          actions={
            currentPlan !== 'free' && (
              <Button variant="outline" onClick={handleManageBilling} loading={loading}>
                Manage Billing
              </Button>
            )
          }
        />

        {/* Current Plan Overview */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-white">Current Plan</h3>
                <Badge variant={currentPlan === 'enterprise' ? 'info' : currentPlan === 'pro' ? 'success' : 'default'}>
                  {currentPlanData?.name}
                </Badge>
              </div>
              <p className="text-zinc-400">
                {currentPlan === 'free'
                  ? 'Upgrade to unlock more features and higher limits'
                  : `Your plan renews on ${new Date().toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {currentPlan !== 'enterprise' && (
                <Button onClick={() => handleUpgrade(plans.find((p) => p.id === 'pro')!)}>
                  Upgrade Plan
                </Button>
              )}
              {currentPlan !== 'free' && (
                <Button variant="outline" onClick={() => setShowCancelModal(true)}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>

          {/* Usage Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-zinc-800">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Credits</span>
                <span className="text-sm text-zinc-300">
                  {usage.credits.used.toLocaleString()} / {usage.credits.limit.toLocaleString()}
                </span>
              </div>
              <Progress
                value={usage.credits.used}
                max={usage.credits.limit}
                variant={usage.credits.used / usage.credits.limit > 0.9 ? 'warning' : 'default'}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Storage</span>
                <span className="text-sm text-zinc-300">
                  {usage.storage.used} GB / {usage.storage.limit} GB
                </span>
              </div>
              <Progress
                value={usage.storage.used}
                max={usage.storage.limit}
                variant={usage.storage.used / usage.storage.limit > 0.9 ? 'warning' : 'default'}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Concurrent Runs</span>
                <span className="text-sm text-zinc-300">
                  {usage.concurrency.used} / {usage.concurrency.limit}
                </span>
              </div>
              <Progress
                value={usage.concurrency.used}
                max={usage.concurrency.limit}
              />
            </div>
          </div>
        </Card>

        {/* Pricing Plans */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Available Plans</h3>
            <div className="flex items-center gap-2 p-1 bg-zinc-800 rounded-lg">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'month'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'year'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Yearly
                <Badge variant="success" size="sm" className="ml-2">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const price = billingInterval === 'year' ? getYearlyPrice(plan.price) : plan.price;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="info">Most Popular</Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 mb-4">
                      {plan.id === 'free' && <Zap className="w-6 h-6 text-zinc-400" />}
                      {plan.id === 'pro' && <Crown className="w-6 h-6 text-yellow-400" />}
                      {plan.id === 'enterprise' && <Building2 className="w-6 h-6 text-purple-400" />}
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">{plan.name}</h4>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span className="text-zinc-400">/{billingInterval === 'year' ? 'year' : 'month'}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.id === 'enterprise' ? (
                    <Button variant="outline" className="w-full">
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={() => handleUpgrade(plan)}
                    >
                      {currentPlan === 'free' ? 'Get Started' : 'Switch Plan'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        {currentPlan !== 'free' && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                Manage
              </Button>
            </div>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-zinc-700 rounded flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white capitalize">{method.brand}</span>
                        <span className="text-zinc-400">•••• {method.last4}</span>
                        {method.isDefault && <Badge size="sm">Default</Badge>}
                      </div>
                      <span className="text-sm text-zinc-500">
                        Expires {method.expMonth}/{method.expYear}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Invoices */}
        {currentPlan !== 'free' && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Billing History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-zinc-800/50">
                      <td className="py-4 px-4 text-white">
                        {invoice.date.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 text-zinc-300">${invoice.amount.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            invoice.status === 'paid'
                              ? 'success'
                              : invoice.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Download className="w-4 h-4" />}
                          onClick={() => window.open(invoice.pdfUrl, '_blank')}
                        >
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Upgrade Modal */}
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title={`Upgrade to ${selectedPlan?.name}`}
          description="You'll be redirected to our secure payment page"
        >
          <div className="space-y-4">
            {selectedPlan && (
              <>
                <div className="p-4 bg-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400">Plan</span>
                    <span className="font-medium text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400">Billing</span>
                    <span className="font-medium text-white capitalize">{billingInterval}ly</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                    <span className="text-zinc-400">Total</span>
                    <span className="text-xl font-bold text-white">
                      ${billingInterval === 'year' ? getYearlyPrice(selectedPlan.price) : selectedPlan.price}
                      <span className="text-sm text-zinc-400 font-normal">
                        /{billingInterval === 'year' ? 'year' : 'month'}
                      </span>
                    </span>
                  </div>
                </div>

                <Alert variant="info">
                  Your card will be charged immediately. You can cancel anytime.
                </Alert>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmUpgrade} loading={loading}>
                    Continue to Payment
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Subscription"
          description="Are you sure you want to cancel your subscription?"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              <p>If you cancel:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>You'll lose access to premium features at the end of your billing period</li>
                <li>Your credits will reset to the free tier limit</li>
                <li>Team members will be removed</li>
                <li>Data exceeding free tier storage will be deleted after 30 days</li>
              </ul>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Keep Subscription
              </Button>
              <Button variant="danger" onClick={handleCancelSubscription} loading={loading}>
                Cancel Subscription
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
