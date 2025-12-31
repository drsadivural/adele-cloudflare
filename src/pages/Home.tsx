import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Database,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Play,
  Mic,
  Bot,
  FileCode,
  Rocket,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="ADELE" className="h-10 w-10" />
            <span className="text-xl font-semibold">ADELE</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/templates" className="text-muted-foreground hover:text-foreground transition">
              Templates
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition">
              Pricing
            </Link>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">
              Features
            </a>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium apple-button"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-foreground hover:text-primary transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium apple-button"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Application Builder
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Build Applications with
              <br />
              <span className="gradient-text">Natural Language</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Transform your ideas into production-ready applications. Just describe what you want,
              and ADELE's multi-agent AI system builds it for you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg apple-button flex items-center gap-2"
              >
                Start Building Free
                <ArrowRight className="h-5 w-5" />
              </Link>

              <button className="px-8 py-4 bg-secondary text-secondary-foreground rounded-full font-medium text-lg apple-button flex items-center gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-32 bottom-0 top-auto" />
            <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
              <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-sm text-muted-foreground">
                  ADELE - Project Builder
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-background to-muted min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Bot className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    "Build me an e-commerce platform like Shopify with inventory management..."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Multi-Agent System</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seven specialized AI agents work together to build your application from start to finish.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "Coordinator Agent",
                description: "Orchestrates all agents and breaks down complex requirements into actionable tasks.",
              },
              {
                icon: Globe,
                title: "Research Agent",
                description: "Gathers information from documentation, APIs, and best practices.",
              },
              {
                icon: Code2,
                title: "Coder Agent",
                description: "Generates production-quality frontend and backend code.",
              },
              {
                icon: Database,
                title: "Database Agent",
                description: "Designs schemas, handles migrations, and optimizes queries.",
              },
              {
                icon: Shield,
                title: "Security Agent",
                description: "Implements authentication, authorization, and security best practices.",
              },
              {
                icon: FileCode,
                title: "Reporter Agent",
                description: "Generates comprehensive documentation and deployment guides.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl p-6 border card-hover"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Control Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Mic className="h-4 w-4" />
                Voice Control
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Build Hands-Free with Voice Commands
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Speak your requirements naturally. ADELE understands complex instructions and
                executes them instantly. Perfect for rapid prototyping and accessibility.
              </p>
              <ul className="space-y-4">
                {[
                  "Natural language understanding",
                  "Multi-language support (English, Japanese)",
                  "Conversational coding assistance",
                  "Voice-activated navigation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Zap className="h-3 w-3 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 border">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-10 w-10 text-primary" />
                  </div>
                  <div className="voice-wave text-primary justify-center mb-4">
                    <span style={{ height: "12px" }} />
                    <span style={{ height: "20px" }} />
                    <span style={{ height: "16px" }} />
                    <span style={{ height: "24px" }} />
                    <span style={{ height: "14px" }} />
                  </div>
                  <p className="text-muted-foreground">
                    "Add a shopping cart with Stripe checkout..."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Start with Templates</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from 30+ industry-specific templates to jumpstart your project.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "E-Commerce", icon: "🛒" },
              { name: "SaaS Dashboard", icon: "📊" },
              { name: "Healthcare", icon: "🏥" },
              { name: "Education", icon: "🎓" },
              { name: "Finance", icon: "💰" },
              { name: "Real Estate", icon: "🏠" },
              { name: "Social Network", icon: "💬" },
              { name: "CRM System", icon: "👥" },
            ].map((template) => (
              <div
                key={template.name}
                className="bg-card rounded-xl p-4 border card-hover text-center"
              >
                <div className="text-3xl mb-2">{template.icon}</div>
                <div className="font-medium">{template.name}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              View All Templates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-12 text-center text-white">
            <Rocket className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Join thousands of developers and entrepreneurs building applications with ADELE.
              Start free, upgrade when you're ready.
            </p>
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-full font-medium text-lg apple-button"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="ADELE" className="h-8 w-8" />
              <span className="font-semibold">ADELE</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/templates" className="hover:text-foreground transition">
                Templates
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition">
                Pricing
              </Link>
              <a href="#" className="hover:text-foreground transition">
                Documentation
              </a>
              <a href="#" className="hover:text-foreground transition">
                Support
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 ADELE. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
