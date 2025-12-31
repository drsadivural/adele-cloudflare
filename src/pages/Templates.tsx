import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { templates, projects, AppTemplate } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Loader2,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Users,
  Building2,
  GraduationCap,
  Heart,
  Briefcase,
  Home,
  Truck,
  UtensilsCrossed,
  Dumbbell,
  Scale,
  HandHeart,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  "E-Commerce": ShoppingCart,
  "SaaS": BarChart3,
  "Social": MessageSquare,
  "CRM": Users,
  "Enterprise": Building2,
  "Education": GraduationCap,
  "Healthcare": Heart,
  "Finance": Briefcase,
  "Real Estate": Home,
  "Logistics": Truck,
  "Restaurant": UtensilsCrossed,
  "Fitness": Dumbbell,
  "Legal": Scale,
  "Non-Profit": HandHeart,
};

const CATEGORIES = [
  "All",
  "E-Commerce",
  "SaaS",
  "Social",
  "CRM",
  "Enterprise",
  "Education",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Logistics",
  "Restaurant",
  "Fitness",
  "Legal",
  "Non-Profit",
];

// Default templates if API returns empty
const DEFAULT_TEMPLATES: AppTemplate[] = [
  {
    id: 1,
    name: "E-Commerce Platform",
    description: "Full-featured online store with product management, shopping cart, and Stripe checkout",
    category: "E-Commerce",
    icon: "🛒",
    techStack: ["React", "Node.js", "PostgreSQL", "Stripe"],
    features: ["Product catalog", "Shopping cart", "Payment processing", "Order management"],
    usageCount: 1250,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "SaaS Dashboard",
    description: "Analytics dashboard with user management, billing, and team collaboration",
    category: "SaaS",
    icon: "📊",
    techStack: ["React", "TypeScript", "PostgreSQL", "Stripe"],
    features: ["User authentication", "Team management", "Analytics", "Subscription billing"],
    usageCount: 980,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Social Network",
    description: "Community platform with profiles, posts, messaging, and notifications",
    category: "Social",
    icon: "💬",
    techStack: ["React", "Node.js", "MongoDB", "WebSocket"],
    features: ["User profiles", "Posts & comments", "Real-time messaging", "Notifications"],
    usageCount: 756,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "CRM System",
    description: "Customer relationship management with contacts, deals, and pipeline tracking",
    category: "CRM",
    icon: "👥",
    techStack: ["React", "Python", "PostgreSQL"],
    features: ["Contact management", "Deal pipeline", "Email integration", "Reports"],
    usageCount: 645,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Healthcare Portal",
    description: "Patient management system with appointments, records, and telemedicine",
    category: "Healthcare",
    icon: "🏥",
    techStack: ["React", "Node.js", "PostgreSQL", "WebRTC"],
    features: ["Patient records", "Appointment scheduling", "Video consultations", "Prescriptions"],
    usageCount: 432,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: "Learning Management System",
    description: "Online education platform with courses, quizzes, and progress tracking",
    category: "Education",
    icon: "🎓",
    techStack: ["React", "Node.js", "PostgreSQL"],
    features: ["Course builder", "Video lessons", "Quizzes", "Certificates"],
    usageCount: 567,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: "Finance Tracker",
    description: "Personal finance app with budgeting, expense tracking, and investment portfolio",
    category: "Finance",
    icon: "💰",
    techStack: ["React", "Python", "PostgreSQL"],
    features: ["Budget management", "Expense tracking", "Investment tracking", "Reports"],
    usageCount: 389,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    name: "Real Estate Listings",
    description: "Property listing platform with search, virtual tours, and agent management",
    category: "Real Estate",
    icon: "🏠",
    techStack: ["React", "Node.js", "PostgreSQL", "Maps API"],
    features: ["Property listings", "Search & filters", "Virtual tours", "Agent profiles"],
    usageCount: 298,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export default function Templates() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [templateList, setTemplateList] = useState<AppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [creating, setCreating] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await templates.list();
        setTemplateList(response.templates.length > 0 ? response.templates : DEFAULT_TEMPLATES);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        setTemplateList(DEFAULT_TEMPLATES);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const filteredTemplates = templateList.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template: AppTemplate) => {
    if (!user) {
      toast.error("Please sign in to use templates");
      setLocation("/login");
      return;
    }

    setCreating(template.id);
    try {
      const response = await projects.create({
        name: `${template.name} Project`,
        description: template.description,
        type: template.category.toLowerCase(),
        techStack: template.techStack,
      });
      toast.success("Project created from template");
      setLocation(`/projects/${response.project.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={user ? "/dashboard" : "/"} className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Templates</h1>
              <p className="text-sm text-muted-foreground">
                {templateList.length} templates available
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <main className="container mx-auto px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const CategoryIcon = CATEGORY_ICONS[template.category] || Sparkles;
              return (
                <div
                  key={template.id}
                  className="bg-card border rounded-2xl overflow-hidden card-hover"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                        {template.icon || <CategoryIcon className="h-6 w-6 text-primary" />}
                      </div>
                      <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium">
                        {template.category}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.techStack?.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-muted rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Features */}
                    <ul className="space-y-1 mb-4">
                      {template.features?.slice(0, 3).map((feature) => (
                        <li
                          key={feature}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="w-1 h-1 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{template.usageCount?.toLocaleString() || 0} uses</span>
                    </div>
                  </div>

                  <div className="border-t px-6 py-4">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      disabled={creating === template.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium apple-button disabled:opacity-50"
                    >
                      {creating === template.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Use Template
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
