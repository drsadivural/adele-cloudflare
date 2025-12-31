#!/bin/bash
# ADELE - EC2 Instance Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e

echo "=========================================="
echo "ADELE - EC2 Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Get domain from user
read -p "Enter your domain name (e.g., adele.ayonix.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain name is required${NC}"
    exit 1
fi

read -p "Enter your email for SSL certificates: " EMAIL
if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required for SSL certificates${NC}"
    exit 1
fi

echo -e "${GREEN}Starting setup for domain: $DOMAIN${NC}"

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group
    usermod -aG docker ubuntu
fi

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Configure fail2ban
echo -e "${YELLOW}Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Create application directory
echo -e "${YELLOW}Setting up application directory...${NC}"
APP_DIR="/opt/adele"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone the repository
echo -e "${YELLOW}Cloning ADELE repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    git pull origin main
else
    git clone https://github.com/drsadivural/adele-cloudflare.git .
fi

# Create required directories
mkdir -p certbot/conf certbot/www nginx/conf.d

# Update nginx configuration with domain
echo -e "${YELLOW}Configuring nginx for $DOMAIN...${NC}"
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx/conf.d/adele.conf

# Create initial nginx config for SSL certificate generation
cat > nginx/conf.d/initial.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'ADELE is being set up...';
        add_header Content-Type text/plain;
    }
}
EOF

# Copy environment template
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
fi

# Generate random passwords
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)

# Update .env with generated values
sed -i "s/your_very_long_random_jwt_secret_at_least_32_characters/$JWT_SECRET/g" .env
sed -i "s/your_secure_password_here/$POSTGRES_PASSWORD/g" .env
sed -i "s/your_redis_password_here/$REDIS_PASSWORD/g" .env
sed -i "s/your_password/$POSTGRES_PASSWORD/g" .env
sed -i "s/your_redis_password/$REDIS_PASSWORD/g" .env
sed -i "s/https:\/\/adele.yourdomain.com/https:\/\/$DOMAIN/g" .env

# Start nginx for SSL certificate generation
echo -e "${YELLOW}Starting nginx for SSL certificate generation...${NC}"
docker-compose up -d nginx

# Wait for nginx to start
sleep 5

# Get SSL certificate
echo -e "${YELLOW}Obtaining SSL certificate from Let's Encrypt...${NC}"
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Remove initial config and use full config
rm -f nginx/conf.d/initial.conf

# Restart all services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose down
docker-compose up -d

# Create systemd service for auto-start
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/adele.service << EOF
[Unit]
Description=ADELE Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable adele

# Create SSL renewal cron job
echo -e "${YELLOW}Setting up SSL certificate auto-renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * cd $APP_DIR && docker-compose run --rm certbot renew --quiet && docker-compose exec nginx nginx -s reload") | crontab -

# Create backup script
echo -e "${YELLOW}Creating backup script...${NC}"
cat > $APP_DIR/scripts/backup.sh << 'EOF'
#!/bin/bash
# ADELE Backup Script

BACKUP_DIR="/opt/adele/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U adele adele > $BACKUP_DIR/db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF
chmod +x $APP_DIR/scripts/backup.sh

# Add daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh") | crontab -

# Print completion message
echo ""
echo -e "${GREEN}=========================================="
echo "ADELE Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "Your ADELE instance is now running at: ${GREEN}https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Please complete these steps:${NC}"
echo "1. Edit /opt/adele/.env with your API keys:"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - RESEND_API_KEY"
echo "   - OAuth credentials (Google, GitHub, etc.)"
echo ""
echo "2. Restart the application after editing .env:"
echo "   cd /opt/adele && docker-compose restart"
echo ""
echo "3. Run database migrations:"
echo "   cd /opt/adele && docker-compose exec adele pnpm db:migrate"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo "  View logs:     docker-compose logs -f"
echo "  Restart:       docker-compose restart"
echo "  Stop:          docker-compose down"
echo "  Start:         docker-compose up -d"
echo "  Backup:        ./scripts/backup.sh"
echo ""
