#!/bin/bash
# ADELE EC2 Quick Deploy Script
# Usage: ./ec2-deploy.sh [domain] [email]

set -e

DOMAIN=${1:-""}
EMAIL=${2:-""}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./ec2-deploy.sh <domain> <email>"
    echo "Example: ./ec2-deploy.sh adele.example.com admin@example.com"
    exit 1
fi

echo "=========================================="
echo "ADELE EC2 Quick Deploy"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "=========================================="

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main 2>/dev/null || true

# Update domain in nginx config
echo "Configuring nginx for $DOMAIN..."
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx/conf.d/adele.conf

# Generate secrets if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    REDIS_PASSWORD=$(openssl rand -base64 24)
    
    sed -i "s/your_very_long_random_jwt_secret_at_least_32_characters/$JWT_SECRET/g" .env
    sed -i "s/your_secure_password_here/$POSTGRES_PASSWORD/g" .env
    sed -i "s/your_redis_password_here/$REDIS_PASSWORD/g" .env
    sed -i "s/your_password/$POSTGRES_PASSWORD/g" .env
    sed -i "s/your_redis_password/$REDIS_PASSWORD/g" .env
    sed -i "s/https:\/\/adele.yourdomain.com/https:\/\/$DOMAIN/g" .env
fi

# Build and start services
echo "Building Docker images..."
docker-compose build

echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Get SSL certificate
echo "Obtaining SSL certificate..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN || echo "SSL certificate already exists or failed"

# Restart nginx to apply SSL
docker-compose restart nginx

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your ADELE instance is now running at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Restart: docker-compose restart"
echo ""
