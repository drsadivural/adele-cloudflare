#!/bin/bash

# ADELE - Cloudflare Setup Script
# This script creates all required Cloudflare resources for ADELE

set -e

echo "🚀 ADELE Cloudflare Setup"
echo "========================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
echo "📋 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

echo ""
echo "✅ Authenticated with Cloudflare"
echo ""

# Get account ID
ACCOUNT_ID=$(wrangler whoami --json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Account ID: $ACCOUNT_ID"
echo ""

# Create D1 Database
echo "📦 Creating D1 Database..."
D1_OUTPUT=$(wrangler d1 create adele-db 2>&1 || true)
if echo "$D1_OUTPUT" | grep -q "already exists"; then
    echo "   Database 'adele-db' already exists"
    D1_ID=$(wrangler d1 list --json 2>/dev/null | grep -o '"uuid":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    D1_ID=$(echo "$D1_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)
    echo "   Created database with ID: $D1_ID"
fi

# Create KV Namespace
echo "📦 Creating KV Namespace..."
KV_OUTPUT=$(wrangler kv:namespace create "SESSIONS" 2>&1 || true)
if echo "$KV_OUTPUT" | grep -q "already exists"; then
    echo "   KV namespace 'adele-sessions' already exists"
    KV_ID=$(wrangler kv:namespace list --json 2>/dev/null | grep -A1 '"title":"adele-SESSIONS"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
else
    KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    echo "   Created KV namespace with ID: $KV_ID"
fi

# Create R2 Bucket
echo "📦 Creating R2 Bucket..."
R2_OUTPUT=$(wrangler r2 bucket create adele-storage 2>&1 || true)
if echo "$R2_OUTPUT" | grep -q "already exists"; then
    echo "   R2 bucket 'adele-storage' already exists"
else
    echo "   Created R2 bucket: adele-storage"
fi

echo ""
echo "✅ All Cloudflare resources created!"
echo ""

# Update wrangler.toml with the IDs
echo "📝 Updating wrangler.toml..."
cat > wrangler.toml << EOF
name = "adele-api"
main = "worker/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "adele-db"
database_id = "$D1_ID"

# KV Namespace for sessions
[[kv_namespaces]]
binding = "SESSIONS"
id = "$KV_ID"

# R2 Bucket for file storage
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "adele-storage"

# Environment variables (set via wrangler secret)
# JWT_SECRET - for signing JWTs
# OPENAI_API_KEY - for AI features
# RESEND_API_KEY - for email service
# STRIPE_SECRET_KEY - for payments
# STRIPE_WEBHOOK_SECRET - for Stripe webhooks

[vars]
APP_URL = "https://adele.ayonix.com"
APP_NAME = "ADELE"
FROM_EMAIL = "noreply@ayonix.com"
EOF

echo "✅ wrangler.toml updated"
echo ""

# Run database migrations
echo "📊 Running database migrations..."
wrangler d1 execute adele-db --file=./migrations/0001_initial.sql
echo "✅ Database migrations complete"
echo ""

# Set up secrets
echo "🔐 Setting up secrets..."
echo ""
echo "Please enter the following secrets (press Enter to skip):"
echo ""

read -p "JWT_SECRET (leave empty to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "   Generated JWT_SECRET"
fi
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET

read -p "OPENAI_API_KEY: " OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY
fi

read -p "RESEND_API_KEY: " RESEND_API_KEY
if [ -n "$RESEND_API_KEY" ]; then
    echo "$RESEND_API_KEY" | wrangler secret put RESEND_API_KEY
fi

read -p "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
    echo "$STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY
fi

read -p "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "$STRIPE_WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET
fi

echo ""
echo "✅ Secrets configured"
echo ""

# Deploy the worker
echo "🚀 Deploying Worker..."
wrangler deploy
echo ""
echo "✅ Worker deployed!"
echo ""

# Build and deploy Pages
echo "🌐 Building frontend..."
pnpm build
echo ""

echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name=adele
echo ""

echo "============================================"
echo "🎉 ADELE Deployment Complete!"
echo "============================================"
echo ""
echo "Your ADELE instance is now running on Cloudflare!"
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard > Pages > adele"
echo "2. Add custom domain: adele.ayonix.com"
echo "3. Configure DNS records for ayonix.com"
echo ""
echo "API Endpoint: https://adele-api.<your-subdomain>.workers.dev"
echo "Frontend: https://adele.pages.dev (or your custom domain)"
echo ""
echo "To update the deployment, run: ./scripts/deploy.sh"
echo ""
