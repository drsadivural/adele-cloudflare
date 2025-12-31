import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { users, stripe } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  CreditCard,
  Bell,
  Shield,
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, subscription, loading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "notifications" | "security">("profile");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await users.updateProfile(profile);
      await refreshUser();
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await stripe.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {[
                { id: "profile", label: "Profile", icon: User },
                { id: "billing", label: "Billing", icon: CreditCard },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "security", label: "Security", icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6">Profile Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="bg-card border rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-6">Current Plan</h2>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl mb-4">
                    <div>
                      <p className="font-medium capitalize">{subscription?.plan || "Free"} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.status === "active"
                          ? `Renews on ${new Date(subscription.currentPeriodEnd || "").toLocaleDateString()}`
                          : "No active subscription"}
                      </p>
                    </div>
                    <Link
                      href="/pricing"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                    >
                      {subscription?.plan === "free" ? "Upgrade" : "Change Plan"}
                    </Link>
                  </div>

                  {subscription?.plan !== "free" && (
                    <button
                      onClick={handleManageBilling}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Manage Billing & Invoices
                    </button>
                  )}
                </div>

                <div className="bg-card border rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Usage</h2>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Projects</span>
                        <span>2 / {subscription?.plan === "free" ? "3" : "∞"}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: subscription?.plan === "free" ? "66%" : "10%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Storage</span>
                        <span>0.5 GB / {subscription?.plan === "free" ? "1 GB" : "10 GB"}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "50%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-card border rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    {
                      id: "email_updates",
                      label: "Email Updates",
                      description: "Receive updates about your projects via email",
                    },
                    {
                      id: "marketing",
                      label: "Marketing Emails",
                      description: "Receive news, tips, and special offers",
                    },
                    {
                      id: "security",
                      label: "Security Alerts",
                      description: "Get notified about security-related events",
                    },
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{pref.label}</p>
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      </div>
                      <button className="w-12 h-6 bg-primary rounded-full relative">
                        <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-card border rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-6">Change Password</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl">
                      <Save className="h-4 w-4" />
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-card border rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Two-Factor Authentication</h2>
                  <p className="text-muted-foreground mb-4">
                    Add an extra layer of security to your account by enabling two-factor
                    authentication.
                  </p>
                  <button className="px-4 py-2 border rounded-xl hover:bg-muted transition">
                    Enable 2FA
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h2>
                  <p className="text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
