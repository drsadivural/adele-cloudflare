import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { projects, Project } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FolderOpen,
  FileCode,
  Trash2,
  ArrowLeft,
  Loader2,
  Filter,
} from "lucide-react";

export default function Projects() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", type: "web" });
  const [creating, setCreating] = useState(false);

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
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProjects();
    }
  }, [user]);

  const filteredProjects = projectList.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) {
      toast.error("Please enter a project name");
      return;
    }

    setCreating(true);
    try {
      const response = await projects.create(newProject);
      setProjectList([response.project, ...projectList]);
      setShowNewProjectModal(false);
      setNewProject({ name: "", description: "", type: "web" });
      toast.success("Project created successfully");
      setLocation(`/projects/${response.project.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await projects.delete(id);
      setProjectList(projectList.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
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
              <h1 className="text-xl font-semibold">Projects</h1>
              <p className="text-sm text-muted-foreground">
                {projectList.length} total projects
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium apple-button"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="deployed">Deployed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <main className="container mx-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-card border rounded-2xl overflow-hidden card-hover group"
              >
                <Link href={`/projects/${project.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileCode className="h-6 w-6 text-primary" />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : project.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : project.status === "deployed"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {project.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.type}</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>

                <div className="border-t px-6 py-3 flex items-center justify-between">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Open Project
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first project to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium apple-button"
              >
                <Plus className="h-5 w-5" />
                Create Project
              </button>
            )}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-card rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-6">Create New Project</h2>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My Awesome App"
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Type</label>
                <select
                  value={newProject.type}
                  onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="web">Web Application</option>
                  <option value="mobile">Mobile App</option>
                  <option value="api">API / Backend</option>
                  <option value="fullstack">Full Stack</option>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="saas">SaaS Platform</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 py-3 border rounded-xl font-medium hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium apple-button disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
