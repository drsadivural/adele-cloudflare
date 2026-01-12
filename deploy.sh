#!/bin/bash

# ADELE Deployment Script
# This script deploys the ADELE application to Cloudflare

set -e

echo "=========================================="
echo "ADELE Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo -e "${YELLOW}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Cloudflare${NC}"
    echo "Run: wrangler login"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"

# Step 1: Install dependencies
echo ""
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 2: Build the frontend
echo ""
echo -e "${YELLOW}Step 2: Building frontend...${NC}"
pnpm run build
echo -e "${GREEN}✓ Frontend built${NC}"

# Step 3: Apply database migrations
echo ""
echo -e "${YELLOW}Step 3: Applying database migrations...${NC}"
echo "This will apply migrations to the production D1 database."

# Check if migrations exist
if [ -d "migrations" ] && [ "$(ls -A migrations/*.sql 2>/dev/null)" ]; then
    echo "Found migration files:"
    ls -la migrations/*.sql
    
    # Apply each migration
    for migration in migrations/*.sql; do
        echo "Applying: $migration"
        wrangler d1 execute adele-db --remote --file="$migration" || {
            echo -e "${YELLOW}Warning: Migration may have already been applied or failed${NC}"
        }
    done
    echo -e "${GREEN}✓ Migrations applied${NC}"
else
    echo -e "${YELLOW}No migration files found in migrations/ directory${NC}"
fi

# Step 4: Deploy the Worker (API)
echo ""
echo -e "${YELLOW}Step 4: Deploying Worker (API backend)...${NC}"
wrangler deploy
echo -e "${GREEN}✓ Worker deployed${NC}"

# Step 5: Deploy Pages (Frontend)
echo ""
echo -e "${YELLOW}Step 5: Deploying Pages (Frontend)...${NC}"
wrangler pages deploy dist --project-name=adele
echo -e "${GREEN}✓ Pages deployed${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Your application is now live at:"
echo "  - Frontend: https://adele.ayonix.com"
echo "  - API: https://adele-api.ayonix.com"
echo ""
echo "If you need to set secrets, run:"
echo "  wrangler secret put STRIPE_SECRET_KEY"
echo "  wrangler secret put STRIPE_WEBHOOK_SECRET"
echo "  wrangler secret put OPENAI_API_KEY"
echo "  wrangler secret put JWT_SECRET"
echo ""
