import { Route, Switch, useLocation, Redirect } from "wouter";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectBuilder from "@/pages/ProjectBuilder";
import Templates from "@/pages/Templates";
import Pricing from "@/pages/Pricing";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import AdminPanel from "@/pages/AdminPanel";
import Monitoring from "@/pages/Monitoring";
import ApiConfig from "@/pages/ApiConfig";
import OAuthCallback from "@/pages/OAuthCallback";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";

// New Pages
import Account from "@/pages/Account";
import SettingsPage from "@/pages/SettingsPage";
import Usage from "@/pages/Usage";
import Billing from "@/pages/Billing";
import MailAdele from "@/pages/MailAdele";
import ScheduledWorks from "@/pages/ScheduledWorks";
import DataControls from "@/pages/DataControls";
import CloudBrowser from "@/pages/CloudBrowser";
import Connectors from "@/pages/Connectors";
import Integrations from "@/pages/Integrations";
import WorkOrders from "@/pages/WorkOrders";
import AppDeploy from "@/pages/AppDeploy";
import VoiceCommunication from "@/pages/VoiceCommunication";
import CloudTools from "@/pages/CloudTools";

// Protected Route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

// Auth redirect - redirects to dashboard if already logged in
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

// Home page with auth check
function HomeWithAuth() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeWithAuth} />
      <Route path="/login">
        <AuthRoute component={Login} />
      </Route>
      <Route path="/register">
        <AuthRoute component={Register} />
      </Route>
      <Route path="/oauth/callback" component={OAuthCallback} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/templates" component={Templates} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/projects">
        <ProtectedRoute component={Projects} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectBuilder} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      {/* User Menu Pages */}
      <Route path="/account">
        <ProtectedRoute component={Account} />
      </Route>
      <Route path="/preferences">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/usage">
        <ProtectedRoute component={Usage} />
      </Route>
      <Route path="/billing">
        <ProtectedRoute component={Billing} />
      </Route>
      <Route path="/mail">
        <ProtectedRoute component={MailAdele} />
      </Route>
      <Route path="/scheduled-works">
        <ProtectedRoute component={ScheduledWorks} />
      </Route>
      <Route path="/data-controls">
        <ProtectedRoute component={DataControls} />
      </Route>
      <Route path="/cloud-browser">
        <ProtectedRoute component={CloudBrowser} />
      </Route>
      <Route path="/connectors">
        <ProtectedRoute component={Connectors} />
      </Route>
      <Route path="/integrations">
        <ProtectedRoute component={Integrations} />
      </Route>
      <Route path="/work-orders">
        <ProtectedRoute component={WorkOrders} />
      </Route>
      <Route path="/app-deploy">
        <ProtectedRoute component={AppDeploy} />
      </Route>
      <Route path="/voice">
        <ProtectedRoute component={VoiceCommunication} />
      </Route>
      <Route path="/cloud-tools">
        <ProtectedRoute component={CloudTools} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} />
      </Route>
      <Route path="/admin/old">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/admin/monitoring">
        <ProtectedRoute component={Monitoring} />
      </Route>
      <Route path="/admin/api-config">
        <ProtectedRoute component={ApiConfig} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Router />
    </AuthProvider>
  );
}

export default App;
