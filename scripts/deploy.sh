#!/bin/bash

# ADELE Deployment Script for Cloudflare

set -e

echo "🚀 ADELE Deployment Script"
echo "=========================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
echo "📋 Checking Cloudflare authentication..."
wrangler whoami || {
    echo "⚠️  Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
}

# Create D1 database if it doesn't exist
echo "📦 Setting up D1 database..."
DB_INFO=$(wrangler d1 list 2>/dev/null | grep "adele-db" || true)
if [ -z "$DB_INFO" ]; then
    echo "Creating D1 database 'adele-db'..."
    wrangler d1 create adele-db
    echo "⚠️  Please update wrangler.toml with the database_id from above"
    echo "Then run this script again."
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
wrangler d1 execute adele-db --file=./migrations/0001_initial.sql

# Create R2 bucket if it doesn't exist
echo "📁 Setting up R2 storage..."
R2_INFO=$(wrangler r2 bucket list 2>/dev/null | grep "adele-storage" || true)
if [ -z "$R2_INFO" ]; then
    echo "Creating R2 bucket 'adele-storage'..."
    wrangler r2 bucket create adele-storage
fi

# Create KV namespace if it doesn't exist
echo "🔑 Setting up KV namespace..."
KV_INFO=$(wrangler kv:namespace list 2>/dev/null | grep "adele-sessions" || true)
if [ -z "$KV_INFO" ]; then
    echo "Creating KV namespace 'adele-sessions'..."
    wrangler kv:namespace create "adele-sessions"
    echo "⚠️  Please update wrangler.toml with the KV namespace id from above"
fi

# Set secrets
echo "🔐 Setting up secrets..."
echo "Please enter your secrets (or press Enter to skip):"

read -p "JWT_SECRET: " JWT_SECRET
if [ -n "$JWT_SECRET" ]; then
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
fi

read -p "OPENAI_API_KEY: " OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY
fi

read -p "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
    echo "$STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY
fi

read -p "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "$STRIPE_WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET
fi

# Build frontend
echo "🔨 Building frontend..."
pnpm build

# Deploy Worker
echo "☁️  Deploying Worker..."
wrangler deploy

# Deploy Pages
echo "📄 Deploying Pages..."
wrangler pages deploy dist --project-name=adele

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure your custom domain in Cloudflare dashboard"
echo "2. Set up DNS records:"
echo "   - adele.ayonix.com -> Cloudflare Pages"
echo "   - api.adele.ayonix.com -> Cloudflare Worker"
echo "3. Update VITE_API_URL in your frontend build"
echo ""
echo "🎉 ADELE is now live!"
