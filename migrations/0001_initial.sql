-- ADELE Database Schema for Cloudflare D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  email_verified INTEGER DEFAULT 0,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK(subscription_plan IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  last_signed_in INTEGER DEFAULT (unixepoch())
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'web',
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'building', 'completed', 'deployed', 'archived')),
  tech_stack TEXT,
  deployment_url TEXT,
  repository_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Generated files table
CREATE TABLE IF NOT EXISTS generated_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT,
  version INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Agent tasks table
CREATE TABLE IF NOT EXISTS agent_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  input TEXT,
  output TEXT,
  error_message TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- App templates table
CREATE TABLE IF NOT EXISTS app_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  tech_stack TEXT,
  features TEXT,
  preview_image TEXT,
  base_prompt TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Project versions table
CREATE TABLE IF NOT EXISTS project_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  commit_message TEXT,
  snapshot TEXT,
  created_by INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  voice_enabled INTEGER DEFAULT 0,
  voice_language TEXT DEFAULT 'en-US',
  tts_enabled INTEGER DEFAULT 0,
  tts_provider TEXT,
  editor_font_size INTEGER DEFAULT 14,
  editor_tab_size INTEGER DEFAULT 2,
  auto_save INTEGER DEFAULT 1,
  notifications TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tool connections table
CREATE TABLE IF NOT EXISTS tool_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  config TEXT,
  status TEXT DEFAULT 'connected' CHECK(status IN ('connected', 'disconnected', 'error')),
  last_used INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Biometric data table
CREATE TABLE IF NOT EXISTS biometric_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  voice_sample_url TEXT,
  voice_sample_quality REAL,
  face_photo_url TEXT,
  face_embedding TEXT,
  biometric_login_enabled INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Onboarding progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 0,
  completed_steps TEXT DEFAULT '[]',
  is_completed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admin config table
CREATE TABLE IF NOT EXISTS admin_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  is_encrypted INTEGER DEFAULT 0,
  updated_by INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_project_id ON generated_files(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_id ON agent_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_tool_connections_user_id ON tool_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Insert default templates
INSERT INTO app_templates (name, description, category, icon, tech_stack, features, usage_count, is_active) VALUES
('E-Commerce Platform', 'Full-featured online store with product catalog, cart, and checkout', 'E-Commerce', 'ShoppingCart', '["React", "Node.js", "PostgreSQL", "Stripe"]', '["Product catalog", "Shopping cart", "Secure checkout", "Order management", "Inventory tracking"]', 0, 1),
('SaaS Dashboard', 'Multi-tenant SaaS application with analytics and user management', 'SaaS', 'LayoutDashboard', '["React", "FastAPI", "PostgreSQL", "Redis"]', '["Multi-tenancy", "User management", "Analytics dashboard", "Billing integration", "API access"]', 0, 1),
('CRM System', 'Customer relationship management with contacts, deals, and pipeline', 'Business', 'Users', '["React", "Node.js", "MongoDB"]', '["Contact management", "Deal pipeline", "Task tracking", "Email integration", "Reporting"]', 0, 1),
('Blog Platform', 'Content management system with rich editor and SEO optimization', 'Content', 'FileText', '["Next.js", "PostgreSQL", "Cloudflare"]', '["Rich text editor", "SEO optimization", "Categories & tags", "Comments", "Analytics"]', 0, 1),
('Project Management', 'Kanban-style project tracking with teams and milestones', 'Productivity', 'Kanban', '["React", "Node.js", "PostgreSQL"]', '["Kanban boards", "Team collaboration", "Milestones", "Time tracking", "File attachments"]', 0, 1),
('Healthcare Portal', 'Patient management system with appointments and records', 'Healthcare', 'Heart', '["React", "FastAPI", "PostgreSQL"]', '["Patient records", "Appointment scheduling", "Prescription management", "Telemedicine", "HIPAA compliance"]', 0, 1),
('Finance Tracker', 'Personal finance management with budgets and reports', 'Finance', 'DollarSign', '["React", "Node.js", "PostgreSQL"]', '["Transaction tracking", "Budget management", "Financial reports", "Bank sync", "Goal setting"]', 0, 1),
('Learning Management', 'Online course platform with video lessons and quizzes', 'Education', 'GraduationCap', '["React", "Node.js", "PostgreSQL", "S3"]', '["Course creation", "Video hosting", "Quizzes", "Progress tracking", "Certificates"]', 0, 1),
('Real Estate Listing', 'Property listing platform with search and virtual tours', 'Real Estate', 'Home', '["React", "Node.js", "PostgreSQL", "Mapbox"]', '["Property listings", "Advanced search", "Virtual tours", "Agent profiles", "Lead capture"]', 0, 1),
('HR Management', 'Human resources system with employees and payroll', 'HR', 'Briefcase', '["React", "FastAPI", "PostgreSQL"]', '["Employee directory", "Leave management", "Payroll", "Performance reviews", "Onboarding"]', 0, 1),
('Restaurant POS', 'Point of sale system for restaurants with orders and inventory', 'Restaurant', 'Utensils', '["React", "Node.js", "PostgreSQL"]', '["Order management", "Table management", "Inventory", "Kitchen display", "Reports"]', 0, 1),
('Fitness App', 'Workout tracking with exercises and progress monitoring', 'Fitness', 'Dumbbell', '["React Native", "Node.js", "PostgreSQL"]', '["Workout plans", "Exercise library", "Progress tracking", "Nutrition", "Social features"]', 0, 1),
('Social Network', 'Community platform with profiles, posts, and messaging', 'Social', 'MessageCircle', '["React", "Node.js", "PostgreSQL", "Redis"]', '["User profiles", "News feed", "Messaging", "Groups", "Notifications"]', 0, 1),
('Inventory System', 'Stock management with warehouses and suppliers', 'Logistics', 'Package', '["React", "FastAPI", "PostgreSQL"]', '["Stock tracking", "Warehouse management", "Supplier management", "Purchase orders", "Reports"]', 0, 1),
('Event Platform', 'Event management with ticketing and attendee tracking', 'Events', 'Calendar', '["React", "Node.js", "PostgreSQL", "Stripe"]', '["Event creation", "Ticketing", "Attendee management", "Check-in", "Analytics"]', 0, 1),
('AI Chatbot', 'Conversational AI assistant with knowledge base', 'AI', 'Bot', '["React", "FastAPI", "PostgreSQL", "OpenAI"]', '["Chat interface", "Knowledge base", "Intent recognition", "Multi-channel", "Analytics"]', 0, 1);
