import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";

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
import Monitoring from "@/pages/Monitoring";
import ApiConfig from "@/pages/ApiConfig";
import OAuthCallback from "@/pages/OAuthCallback";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/oauth/callback" component={OAuthCallback} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectBuilder} />
      <Route path="/templates" component={Templates} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/monitoring" component={Monitoring} />
      <Route path="/admin/api-config" component={ApiConfig} />
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
