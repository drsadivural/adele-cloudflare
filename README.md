# ADELE - AI-Powered No-Code Application Builder

<p align="center">
  <img src="public/adele-logo.png" alt="ADELE Logo" width="200">
</p>

<p align="center">
  <strong>Build enterprise-grade applications with natural language</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#api-configuration">API Configuration</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## Overview

ADELE (Advanced Development Environment for Limitless Engineering) is a comprehensive no-code application builder that uses AI agents to generate full-stack applications from natural language descriptions. Built on Cloudflare's edge infrastructure for global performance and reliability.

**Key Highlights:**
- 🤖 Multi-agent AI system with 7 specialized agents
- 🎨 Apple-style minimalist interface
- 🔐 Independent authentication (no external dependencies)
- 💳 Stripe subscription management
- 📊 Admin dashboard with API configuration
- 🛡️ Enterprise-grade security with rate limiting

---

## Features

### Multi-Agent AI System
- **Coordinator Agent** - Orchestrates tasks and breaks down complex requirements
- **Research Agent** - Gathers information from documentation and best practices
- **Coder Agent** - Generates frontend (React/TypeScript) and backend (FastAPI/Python) code
- **Database Agent** - Designs schemas and manages migrations
- **Security Agent** - Implements authentication, authorization, and validation
- **Reporter Agent** - Generates documentation and deployment guides
- **Browser Agent** - Tests UI and handles web automation

### Authentication Options
- Email/password registration and login
- **Social Login:**
  - Continue with Google
  - Continue with Apple
  - Continue with Microsoft
  - Continue with Facebook
  - Continue with GitHub
- Phone number authentication
- JWT-based session management
- Password reset with email verification

### Apple-Style Interface
- Clean, minimalist design with smooth animations
- Dark/light mode support
- Responsive layout for all devices
- Glassmorphism effects and subtle gradients

### Subscription Tiers
| Plan | Price | Features |
|------|-------|----------|
| Free | $0/mo | 3 projects, basic AI, community support |
| Pro | $29/mo | Unlimited projects, priority AI, email support |
| Enterprise | $99/mo | Custom integrations, dedicated support, SLA |

### Admin Dashboard
- User management with role-based access
- API configuration panel for all services
- Analytics and metrics visualization
- Template management
- Monitoring and logging dashboard

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Authentication | 5 requests/minute |
| API (Free tier) | 100 requests/hour |
| API (Pro tier) | 1000 requests/hour |
| API (Enterprise) | 10000 requests/hour |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/) package manager
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) v3+
- [Cloudflare account](https://dash.cloudflare.com/sign-up)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/drsadivural/adele-cloudflare.git
cd adele-cloudflare

# Install dependencies
pnpm install
```

### Step 2: Local Development

```bash
# Create local environment file
cat > .dev.vars << EOF
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
OPENAI_API_KEY=sk-your-openai-api-key
EOF

# Start frontend dev server (Terminal 1)
pnpm dev

# Start Worker locally (Terminal 2)
wrangler dev --local --persist
```

Open `http://localhost:5173` in your browser.

---

## Deployment

### Step 1: Cloudflare Authentication

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Step 2: Create Cloudflare Resources

```bash
# Create D1 Database
wrangler d1 create adele-db
# Output: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Create KV Namespaces
wrangler kv:namespace create SESSIONS
# Output: id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

wrangler kv:namespace create RATE_LIMIT
# Output: id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"

# Create R2 Bucket (optional, for file storage)
wrangler r2 bucket create adele-storage
```

### Step 3: Update Configuration

Edit `wrangler.toml` with your resource IDs:

```toml
name = "adele-api"
main = "worker/index.ts"
compatibility_date = "2024-01-01"

# Replace with your database ID
[[d1_databases]]
binding = "DB"
database_name = "adele-db"
database_id = "YOUR_DATABASE_ID_HERE"

# Replace with your KV namespace IDs
[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_SESSIONS_KV_ID_HERE"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "YOUR_RATE_LIMIT_KV_ID_HERE"

# R2 bucket (optional)
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "adele-storage"
```

### Step 4: Run Database Migrations

```bash
# Apply migrations to D1
wrangler d1 execute adele-db --file=./migrations/0001_initial.sql
```

### Step 5: Set Secrets

```bash
# Required: JWT Secret (minimum 32 characters)
wrangler secret put JWT_SECRET
# Enter: your-super-secret-jwt-key-minimum-32-characters-long

# Recommended: OpenAI API Key (for AI features)
wrangler secret put OPENAI_API_KEY
# Enter: sk-your-openai-api-key

# Optional: Resend API Key (for emails)
wrangler secret put RESEND_API_KEY
# Enter: re_your-resend-api-key

# Optional: Stripe Keys (for payments)
wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_live_your-stripe-secret-key

wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_your-webhook-secret
```

### Step 6: Deploy

```bash
# Deploy the Worker (API backend)
wrangler deploy

# Build the frontend
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=adele
```

### Step 7: Configure Custom Domain

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **adele** → **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `adele.ayonix.com`)
5. Follow the DNS configuration instructions

For the API, add a route in `wrangler.toml`:
```toml
routes = [
  { pattern = "api.adele.ayonix.com/*", zone_name = "ayonix.com" }
]
```

---

## API Configuration

ADELE provides an Admin panel for configuring all external APIs. Access it at **Admin → API Config** after logging in as an admin.

### Creating the First Admin User

After deployment, the first user to register will be a regular user. To make them an admin:

```bash
# Connect to D1 and update the user role
wrangler d1 execute adele-db --command="UPDATE users SET role='admin' WHERE email='your-email@example.com'"
```

### Configurable APIs

#### 📧 Email Service (Resend)

| Key | Description | How to Get |
|-----|-------------|------------|
| `RESEND_API_KEY` | API key for sending emails | [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Verified sender email | Must be verified in Resend |
| `RESEND_FROM_NAME` | Sender display name | e.g., "ADELE" |

#### 🤖 LLM Providers

**OpenAI:**
| Key | Description | Default |
|-----|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | Model to use | gpt-4-turbo-preview |
| `OPENAI_MAX_TOKENS` | Max tokens per request | 4096 |
| `OPENAI_ORG_ID` | Organization ID | Optional |

**Anthropic:**
| Key | Description | Default |
|-----|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `ANTHROPIC_MODEL` | Model to use | claude-3-sonnet-20240229 |

**Google AI:**
| Key | Description | Default |
|-----|-------------|---------|
| `GOOGLE_AI_API_KEY` | Google AI API key | Required |
| `GOOGLE_AI_MODEL` | Model to use | gemini-pro |

#### 🎤 Voice Services

**ElevenLabs (Text-to-Speech):**
| Key | Description |
|-----|-------------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Default voice ID |
| `ELEVENLABS_MODEL` | Model (eleven_monolingual_v1) |

**OpenAI Whisper (Speech-to-Text):**
Uses the same `OPENAI_API_KEY` configured above.

#### 💳 Payment Processing (Stripe)

| Key | Description | How to Get |
|-----|-------------|------------|
| `STRIPE_PUBLISHABLE_KEY` | Public key for frontend | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_SECRET_KEY` | Secret key for backend | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Webhooks section |

#### 🔐 Social Authentication

**Google OAuth:**
| Key | Description |
|-----|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |

**Apple Sign In:**
| Key | Description |
|-----|-------------|
| `APPLE_CLIENT_ID` | Services ID |
| `APPLE_TEAM_ID` | Team ID |
| `APPLE_KEY_ID` | Key ID |
| `APPLE_PRIVATE_KEY` | Private key (PEM format) |

**Microsoft OAuth:**
| Key | Description |
|-----|-------------|
| `MICROSOFT_CLIENT_ID` | Application (client) ID |
| `MICROSOFT_CLIENT_SECRET` | Client secret |

**GitHub OAuth:**
| Key | Description |
|-----|-------------|
| `GITHUB_CLIENT_ID` | OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | OAuth App client secret |

**Facebook OAuth:**
| Key | Description |
|-----|-------------|
| `FACEBOOK_APP_ID` | App ID |
| `FACEBOOK_APP_SECRET` | App secret |

#### 📊 Monitoring (Sentry)

| Key | Description |
|-----|-------------|
| `SENTRY_DSN` | Sentry DSN for error tracking |

---

## Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Cloudflare Workers, Hono.js |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Sessions | Cloudflare KV |
| Authentication | JWT, bcrypt |
| Payments | Stripe |
| Email | Resend |

### Project Structure

```
adele-cloudflare/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── lib/                # Utilities and API client
│   └── pages/              # Page components
├── worker/                 # Cloudflare Worker (API)
│   ├── routes/             # API route handlers
│   │   ├── auth.ts         # Authentication routes
│   │   ├── oauth.ts        # Social authentication
│   │   ├── projects.ts     # Project management
│   │   ├── chat.ts         # AI chat
│   │   ├── admin.ts        # Admin routes
│   │   └── stripe.ts       # Payment routes
│   ├── middleware/         # Middleware
│   │   └── rateLimit.ts    # Rate limiting
│   ├── services/           # Business logic
│   │   ├── email.ts        # Email service
│   │   └── monitoring.ts   # Logging & monitoring
│   └── index.ts            # Worker entry point
├── drizzle/                # Database schema
├── migrations/             # SQL migration files
├── public/                 # Static assets
├── scripts/                # Deployment scripts
└── wrangler.toml           # Cloudflare configuration
```

### Database Schema

| Table | Description |
|-------|-------------|
| `users` | User accounts and authentication |
| `projects` | User projects |
| `generated_files` | Code files generated by agents |
| `agent_tasks` | Task queue for AI agents |
| `chat_messages` | Conversation history |
| `app_templates` | Pre-built application templates |
| `project_versions` | Version control snapshots |
| `user_settings` | User preferences |
| `tool_connections` | External tool integrations |
| `admin_config` | API configuration storage |
| `analytics_events` | Usage analytics |
| `sessions` | JWT refresh tokens |
| `password_reset_tokens` | Password reset tokens |

---

## API Reference

### Authentication

All authenticated endpoints require a Bearer token:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

#### OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oauth/:provider` | Initiate OAuth flow |
| GET | `/api/oauth/:provider/callback` | OAuth callback |

#### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

#### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/:projectId/messages` | Get chat messages |
| POST | `/api/chat/:projectId/messages` | Send message to AI |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Get platform statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/api-configs` | Get API configurations |
| POST | `/api/admin/api-configs` | Save API configuration |
| POST | `/api/admin/test-api/:provider` | Test API connection |

---

## Troubleshooting

### Common Issues

**"Database not found" error:**
```bash
# Ensure migrations are applied
wrangler d1 execute adele-db --file=./migrations/0001_initial.sql
```

**"JWT_SECRET not set" error:**
```bash
# Set the JWT secret
wrangler secret put JWT_SECRET
```

**Social login not working:**
1. Verify OAuth credentials in Admin → API Config
2. Ensure callback URLs are correctly configured in each provider's dashboard
3. Check that the domain is whitelisted

**Emails not sending:**
1. Verify Resend API key in Admin → API Config
2. Ensure sender email is verified in Resend
3. Check Resend dashboard for delivery logs

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- 📧 Email: support@ayonix.com
- 🐛 Issues: [GitHub Issues](https://github.com/drsadivural/adele-cloudflare/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/drsadivural/adele-cloudflare/wiki)

---

<p align="center">
  Made with ❤️ by the ADELE Team
</p>
