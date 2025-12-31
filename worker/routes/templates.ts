import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const templateRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all templates (public)
templateRoutes.get("/", async (c) => {
  const db = c.get("db");
  
  const templates = await db.select()
    .from(schema.appTemplates)
    .where(eq(schema.appTemplates.isActive, true))
    .orderBy(desc(schema.appTemplates.usageCount));
  
  return c.json({ 
    templates: templates.map(t => ({
      ...t,
      techStack: t.techStack ? JSON.parse(t.techStack) : [],
      features: t.features ? JSON.parse(t.features) : [],
    }))
  });
});

// Get single template (public)
templateRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const templateId = parseInt(c.req.param("id"));
  
  const template = await db.select()
    .from(schema.appTemplates)
    .where(eq(schema.appTemplates.id, templateId))
    .get();
  
  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }
  
  return c.json({ 
    template: {
      ...template,
      techStack: template.techStack ? JSON.parse(template.techStack) : [],
      features: template.features ? JSON.parse(template.features) : [],
    }
  });
});

// Get templates by category (public)
templateRoutes.get("/category/:category", async (c) => {
  const db = c.get("db");
  const category = c.req.param("category");
  
  const templates = await db.select()
    .from(schema.appTemplates)
    .where(eq(schema.appTemplates.category, category))
    .orderBy(desc(schema.appTemplates.usageCount));
  
  return c.json({ 
    templates: templates.map(t => ({
      ...t,
      techStack: t.techStack ? JSON.parse(t.techStack) : [],
      features: t.features ? JSON.parse(t.features) : [],
    }))
  });
});

// Seed default templates (admin only, called during setup)
templateRoutes.post("/seed", async (c) => {
  const db = c.get("db");
  
  const defaultTemplates = [
    {
      name: "E-Commerce Platform",
      description: "Full-featured online store with product catalog, cart, checkout, and payment integration",
      category: "E-Commerce",
      icon: "ShoppingCart",
      techStack: JSON.stringify(["React", "TypeScript", "FastAPI", "PostgreSQL", "Stripe"]),
      features: JSON.stringify(["Product catalog", "Shopping cart", "User accounts", "Payment processing", "Order management", "Admin dashboard"]),
      basePrompt: "Build an e-commerce platform with product listings, shopping cart, user authentication, and Stripe payment integration.",
    },
    {
      name: "SaaS Dashboard",
      description: "Multi-tenant SaaS application with subscription billing and analytics",
      category: "SaaS",
      icon: "LayoutDashboard",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Stripe"]),
      features: JSON.stringify(["Multi-tenancy", "Subscription billing", "User management", "Analytics dashboard", "API access", "Webhooks"]),
      basePrompt: "Build a SaaS dashboard with multi-tenant architecture, subscription management, and analytics.",
    },
    {
      name: "CRM System",
      description: "Customer relationship management with contacts, deals, and pipeline tracking",
      category: "Business",
      icon: "Users",
      techStack: JSON.stringify(["React", "TypeScript", "FastAPI", "PostgreSQL"]),
      features: JSON.stringify(["Contact management", "Deal pipeline", "Task tracking", "Email integration", "Reports", "Team collaboration"]),
      basePrompt: "Build a CRM system with contact management, deal tracking, and sales pipeline visualization.",
    },
    {
      name: "Project Management",
      description: "Kanban-style project management with tasks, sprints, and team collaboration",
      category: "Productivity",
      icon: "Kanban",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
      features: JSON.stringify(["Kanban boards", "Sprint planning", "Task assignments", "Time tracking", "File attachments", "Comments"]),
      basePrompt: "Build a project management tool with Kanban boards, sprint planning, and team collaboration features.",
    },
    {
      name: "Blog Platform",
      description: "Content management system with rich text editor and SEO optimization",
      category: "Content",
      icon: "FileText",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
      features: JSON.stringify(["Rich text editor", "Categories & tags", "SEO optimization", "Comments", "Social sharing", "Analytics"]),
      basePrompt: "Build a blog platform with a rich text editor, categories, SEO features, and social sharing.",
    },
    {
      name: "Social Network",
      description: "Social media platform with profiles, posts, and real-time messaging",
      category: "Social",
      icon: "MessageCircle",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "WebSocket"]),
      features: JSON.stringify(["User profiles", "Posts & feeds", "Real-time messaging", "Notifications", "Friend connections", "Media uploads"]),
      basePrompt: "Build a social network with user profiles, news feed, real-time messaging, and notifications.",
    },
    {
      name: "Healthcare Portal",
      description: "Patient management system with appointments and medical records",
      category: "Healthcare",
      icon: "Heart",
      techStack: JSON.stringify(["React", "TypeScript", "FastAPI", "PostgreSQL"]),
      features: JSON.stringify(["Patient records", "Appointment scheduling", "Prescription management", "Lab results", "Billing", "HIPAA compliance"]),
      basePrompt: "Build a healthcare portal with patient management, appointment scheduling, and medical records.",
    },
    {
      name: "Learning Management",
      description: "Online learning platform with courses, quizzes, and progress tracking",
      category: "Education",
      icon: "GraduationCap",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
      features: JSON.stringify(["Course creation", "Video lessons", "Quizzes", "Progress tracking", "Certificates", "Discussion forums"]),
      basePrompt: "Build an LMS with course management, video lessons, quizzes, and student progress tracking.",
    },
    {
      name: "Real Estate Listing",
      description: "Property listing platform with search, maps, and virtual tours",
      category: "Real Estate",
      icon: "Home",
      techStack: JSON.stringify(["React", "TypeScript", "FastAPI", "PostgreSQL", "Google Maps"]),
      features: JSON.stringify(["Property listings", "Advanced search", "Map integration", "Virtual tours", "Agent profiles", "Inquiry forms"]),
      basePrompt: "Build a real estate platform with property listings, map search, and virtual tour features.",
    },
    {
      name: "Restaurant POS",
      description: "Point of sale system for restaurants with orders and inventory",
      category: "Restaurant",
      icon: "Utensils",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
      features: JSON.stringify(["Order management", "Table management", "Menu builder", "Inventory tracking", "Staff management", "Reports"]),
      basePrompt: "Build a restaurant POS system with order management, table tracking, and inventory control.",
    },
    {
      name: "Fitness Tracker",
      description: "Workout and nutrition tracking with goals and progress charts",
      category: "Fitness",
      icon: "Dumbbell",
      techStack: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]),
      features: JSON.stringify(["Workout logging", "Nutrition tracking", "Goal setting", "Progress charts", "Exercise library", "Social features"]),
      basePrompt: "Build a fitness tracker with workout logging, nutrition tracking, and progress visualization.",
    },
    {
      name: "Invoice Generator",
      description: "Professional invoicing with templates, payments, and reporting",
      category: "Finance",
      icon: "Receipt",
      techStack: JSON.stringify(["React", "TypeScript", "FastAPI", "PostgreSQL", "Stripe"]),
      features: JSON.stringify(["Invoice templates", "Client management", "Payment tracking", "Recurring invoices", "Tax calculations", "Reports"]),
      basePrompt: "Build an invoicing system with customizable templates, payment tracking, and financial reports.",
    },
  ];
  
  // Check if templates already exist
  const existing = await db.select().from(schema.appTemplates).limit(1).get();
  
  if (existing) {
    return c.json({ message: "Templates already seeded", count: 0 });
  }
  
  // Insert templates
  for (const template of defaultTemplates) {
    await db.insert(schema.appTemplates).values(template);
  }
  
  return c.json({ message: "Templates seeded successfully", count: defaultTemplates.length });
});
