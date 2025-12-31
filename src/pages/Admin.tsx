import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { admin, stripe } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  FolderOpen,
  CreditCard,
  Settings,
  BarChart3,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "stripe" | "settings">("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      toast.error("Admin access required");
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          admin.getStats(),
          admin.getUsers(),
        ]);
        setStats(statsResponse);
        setUsers(usersResponse.users);

        // Try to get Stripe config
        try {
          const stripeResponse = await admin.getStripeConfig();
          if (stripeResponse.config) {
            setStripeConfig(stripeResponse.config);
          }
        } catch (e) {
          // Stripe config might not exist yet
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const handleSaveStripeConfig = async () => {
    setSaving(true);
    try {
      await admin.updateStripeConfig(stripeConfig);
      toast.success("Stripe configuration saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestStripeConnection = async () => {
    try {
      const response = await stripe.testConnection();
      if (response.success) {
        toast.success("Stripe connection successful");
      } else {
        toast.error("Stripe connection failed");
      }
    } catch (error) {
      toast.error("Failed to test Stripe connection");
    }
  };

  const handleExportData = async (type: "users" | "projects" | "analytics") => {
    try {
      const response = await admin.exportData(type);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} data exported`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
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
              <h1 className="text-xl font-semibold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage your platform</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "stripe", label: "Stripe", icon: CreditCard },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-card border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Total Users</span>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4" />
                  +12% this month
                </p>
              </div>

              <div className="bg-card border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Total Projects</span>
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{stats.totalProjects}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4" />
                  +8% this month
                </p>
              </div>

              <div className="bg-card border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Active Subscriptions</span>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4" />
                  +5% this month
                </p>
              </div>

              <div className="bg-card border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Monthly Revenue</span>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">${stats.monthlyRevenue}</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4" />
                  +15% this month
                </p>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-card border rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Export Data</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExportData("users")}
                  className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition"
                >
                  <Download className="h-4 w-4" />
                  Export Users
                </button>
                <button
                  onClick={() => handleExportData("projects")}
                  className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition"
                >
                  <Download className="h-4 w-4" />
                  Export Projects
                </button>
                <button
                  onClick={() => handleExportData("analytics")}
                  className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition"
                >
                  <Download className="h-4 w-4" />
                  Export Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium">User</th>
                    <th className="text-left px-6 py-3 text-sm font-medium">Email</th>
                    <th className="text-left px-6 py-3 text-sm font-medium">Role</th>
                    <th className="text-left px-6 py-3 text-sm font-medium">Plan</th>
                    <th className="text-left px-6 py-3 text-sm font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {u.name?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="font-medium">{u.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium capitalize">
                          {u.subscriptionPlan || "free"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stripe Tab */}
        {activeTab === "stripe" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-card border rounded-2xl p-6">
              <h3 className="font-semibold mb-6">Stripe Configuration</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Publishable Key
                  </label>
                  <input
                    type="text"
                    value={stripeConfig.publishableKey}
                    onChange={(e) =>
                      setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })
                    }
                    placeholder="pk_live_..."
                    className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={stripeConfig.secretKey}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, secretKey: e.target.value })
                      }
                      placeholder="sk_live_..."
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showSecrets ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Webhook Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={stripeConfig.webhookSecret}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })
                      }
                      placeholder="whsec_..."
                      className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleTestStripeConnection}
                    className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Test Connection
                  </button>
                  <button
                    onClick={handleSaveStripeConfig}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Keep your Stripe keys secure. Never share your
                secret key publicly. Use test keys (pk_test_, sk_test_) for development.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-card border rounded-2xl p-6">
              <h3 className="font-semibold mb-6">Platform Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    defaultValue="ADELE"
                    className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    defaultValue="support@adele.ayonix.com"
                    className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Projects (Free Plan)
                  </label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Allow Registration</p>
                    <p className="text-sm text-muted-foreground">
                      Enable new user registrations
                    </p>
                  </div>
                  <button className="w-12 h-6 bg-primary rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Show maintenance page to users
                    </p>
                  </div>
                  <button className="w-12 h-6 bg-muted rounded-full relative">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl mt-4">
                  <Save className="h-4 w-4" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
