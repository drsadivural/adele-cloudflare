import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { users, stripe, auth } from "@/lib/api";
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
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

interface NotificationSettings {
  email_updates: boolean;
  marketing: boolean;
  security: boolean;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, subscription, loading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "notifications" | "security">("profile");
  const [loading, setLoading] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_updates: true,
    marketing: false,
    security: true,
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
        phone: (user as any).phone || "",
        company: (user as any).company || "",
        position: (user as any).position || "",
      });
      
      // Load notification settings from user settings if available
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      const response = await users.getProfile();
      if (response.settings?.notifications) {
        setNotifications(response.settings.notifications as NotificationSettings);
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await users.updateProfile({ name: profile.name });
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await users.updateSettings({ notifications });
      toast.success("Notification preferences saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleToggleNotification = async (key: keyof NotificationSettings) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(newNotifications);
    
    // Auto-save on toggle
    try {
      await users.updateSettings({ notifications: newNotifications });
      toast.success("Notification preference updated");
    } catch (error: any) {
      // Revert on error
      setNotifications(notifications);
      toast.error("Failed to update notification preference");
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setSavingPassword(true);
    try {
      await auth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
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
                      disabled
                      className="w-full px-4 py-3 rounded-xl border bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Position</label>
                      <input
                        type="text"
                        value={profile.position}
                        onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your role"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+1 (555) 000-0000"
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Notification Preferences</h2>
                  {savingNotifications && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    {
                      id: "email_updates" as keyof NotificationSettings,
                      label: "Email Updates",
                      description: "Receive updates about your projects via email",
                    },
                    {
                      id: "marketing" as keyof NotificationSettings,
                      label: "Marketing Emails",
                      description: "Receive news, tips, and special offers",
                    },
                    {
                      id: "security" as keyof NotificationSettings,
                      label: "Security Alerts",
                      description: "Get notified about security-related events",
                    },
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{pref.label}</p>
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification(pref.id)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          notifications[pref.id] ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            notifications[pref.id] ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                  >
                    {savingNotifications ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save All Preferences
                  </button>
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
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 pr-12 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-4 py-3 pr-12 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                    >
                      {savingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
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

                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">Danger Zone</h2>
                  <p className="text-red-600 dark:text-red-400/80 mb-4">
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
