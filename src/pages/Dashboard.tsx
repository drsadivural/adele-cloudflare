import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { projects, Project } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Clock,
  ArrowRight,
  Sparkles,
  Settings,
  LogOut,
  LayoutGrid,
  FileCode,
  BarChart3,
  User,
  ChevronDown,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, subscription, logout, loading: authLoading } = useAuth();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await projects.list();
        setProjectList(response.projects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    setLocation("/");
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

  const recentProjects = projectList.slice(0, 4);
  const stats = {
    totalProjects: projectList.length,
    activeProjects: projectList.filter((p) => p.status === "in_progress").length,
    completedProjects: projectList.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="ADELE" className="h-10 w-10" />
            <span className="text-xl font-semibold">ADELE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-foreground font-medium"
            >
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
            >
              <FolderOpen className="h-4 w-4" />
              Projects
            </Link>
            <Link
              href="/templates"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
            >
              <FileCode className="h-4 w-4" />
              Templates
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <BarChart3 className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden md:block font-medium">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-primary mt-1 capitalize">
                    {subscription?.plan || "Free"} Plan
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">
            Continue building or start a new project with AI assistance.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/projects/new"
            className="bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl p-6 card-hover"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">New Project</h3>
                <p className="text-white/80 text-sm">Start from scratch</p>
              </div>
            </div>
          </Link>

          <Link
            href="/templates"
            className="bg-card border rounded-2xl p-6 card-hover"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Use Template</h3>
                <p className="text-muted-foreground text-sm">30+ templates</p>
              </div>
            </div>
          </Link>

          <Link
            href="/projects"
            className="bg-card border rounded-2xl p-6 card-hover"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">All Projects</h3>
                <p className="text-muted-foreground text-sm">{stats.totalProjects} projects</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Total Projects</span>
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.totalProjects}</p>
          </div>

          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">In Progress</span>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.activeProjects}</p>
          </div>

          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Completed</span>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stats.completedProjects}</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileCode className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.type} • Updated{" "}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : project.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to get started
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
