# ADELE - AI-Powered No-Code Application Builder

<p align="center">
  <img src="public/adele-logo.png" alt="ADELE Logo" width="200">
</p>

<p align="center">
  <strong>Build enterprise-grade applications with natural language</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#development">Development</a> •
  <a href="#api">API</a>
</p>

---

## Overview

ADELE (Advanced Development Environment for Limitless Engineering) is a comprehensive no-code application builder that uses AI agents to generate full-stack applications from natural language descriptions. Built on Cloudflare's edge infrastructure for global performance and reliability.

## Features

### Multi-Agent AI System
- **Coordinator Agent** - Orchestrates tasks and breaks down complex requirements
- **Research Agent** - Gathers information from documentation and best practices
- **Coder Agent** - Generates frontend (React/TypeScript) and backend (FastAPI/Python) code
- **Database Agent** - Designs schemas and manages migrations
- **Security Agent** - Implements authentication, authorization, and validation
- **Reporter Agent** - Generates documentation and deployment guides
- **Browser Agent** - Tests UI and handles web automation

### Apple-Style Interface
- Clean, minimalist design with smooth animations
- Dark/light mode support
- Responsive layout for all devices
- Glassmorphism effects and subtle gradients

### Voice Control
- Hands-free operation with voice commands
- Multi-language support (English, Japanese)
- Conversational coding interface
- Voice-to-text transcription

### Real-Time Collaboration
- WebSocket-based live updates
- Cursor presence indicators
- Team chat within projects
- Collaborative editing

### Version Control
- Visual git-like history
- Commit messages and rollback
- Version comparison
- Snapshot management

### Subscription Tiers
- **Free** - 3 projects, basic features
- **Pro** ($29/mo) - Unlimited projects, priority support
- **Enterprise** ($99/mo) - Custom integrations, dedicated support

### Email Service (Resend)
- Welcome emails for new users
- Email verification with secure tokens
- Password reset emails
- Subscription notifications
- Custom branded email templates

### Monitoring & Logging
- Real-time health checks (database, KV, R2)
- Performance metrics with percentiles (p50, p95, p99)
- Structured logging with severity levels
- Error tracking and reporting
- Admin monitoring dashboard
- Data export (JSON/CSV format)

### Template Library
32+ pre-built templates across categories:
- E-Commerce, SaaS, CRM, CMS
- Healthcare, Finance, Education
- Real Estate, HR, Logistics
- Restaurant, Fitness, Legal
- Non-Profit, Social Media, IoT

## Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Wouter for routing
- Sonner for notifications

**Backend:**
- Cloudflare Workers with Hono.js
- Cloudflare D1 (SQLite) database
- Drizzle ORM for type-safe queries
- JWT authentication

**Infrastructure:**
- Cloudflare Pages for frontend hosting
- Cloudflare Workers for API
- Cloudflare D1 for database
- Cloudflare R2 for file storage (optional)

### Project Structure

```
adele-cloudflare/
├── src/                    # Frontend source
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utilities and API client
│   └── pages/              # Page components
├── worker/                 # Cloudflare Worker backend
│   ├── routes/             # API route handlers
│   └── index.ts            # Worker entry point
├── drizzle/                # Database schema
├── public/                 # Static assets
└── wrangler.toml           # Cloudflare configuration
```

## Deployment

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
3. Node.js 18+
4. pnpm

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/drsadivural/adele.git
   cd adele
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Cloudflare:**
   ```bash
   # Login to Cloudflare
   wrangler login

   # Create D1 database
   wrangler d1 create adele-db

   # Update wrangler.toml with your database ID
   ```

4. **Set up environment variables:**
   ```bash
   # Set JWT secret
   wrangler secret put JWT_SECRET

   # Set OpenAI API key (for AI features)
   wrangler secret put OPENAI_API_KEY

   # Set Stripe keys (for payments)
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

5. **Run database migrations:**
   ```bash
   wrangler d1 migrations apply adele-db
   ```

6. **Deploy:**
   ```bash
   # Deploy Worker
   wrangler deploy

   # Deploy Pages (frontend)
   pnpm build
   wrangler pages deploy dist
   ```

### Custom Domain Setup

1. Add your domain to Cloudflare
2. Configure DNS records:
   - `adele.yourdomain.com` → Cloudflare Pages
   - `api.adele.yourdomain.com` → Cloudflare Worker

3. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "api.adele.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```

## Development

### Local Development

```bash
# Start frontend dev server
pnpm dev

# Start Worker locally (in another terminal)
wrangler dev

# Run tests
pnpm test
```

### Environment Variables

Create `.dev.vars` for local development:

```env
JWT_SECRET=your-development-secret
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database Migrations

```bash
# Generate migration
pnpm drizzle-kit generate:sqlite

# Apply migration locally
wrangler d1 migrations apply adele-db --local

# Apply migration to production
wrangler d1 migrations apply adele-db
```

## API

### Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Chat
- `GET /api/chat/:projectId/messages` - Get messages
- `POST /api/chat/:projectId/messages` - Send message

#### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template

#### Stripe
- `GET /api/stripe/plans` - Get pricing plans
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create billing portal session

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [docs.adele.ayonix.com](https://docs.adele.ayonix.com)
- Issues: [GitHub Issues](https://github.com/drsadivural/adele/issues)
- Email: support@adele.ayonix.com

---

<p align="center">
  Built with ❤️ by the ADELE Team
</p>
