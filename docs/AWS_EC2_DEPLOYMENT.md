# ADELE - AWS EC2 Deployment Guide

This guide provides step-by-step instructions for deploying ADELE (AI-Powered No-Code Application Builder) to Amazon Web Services (AWS) EC2 instances. The deployment uses Docker containers for consistent and reproducible environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [EC2 Instance Creation](#ec2-instance-creation)
4. [Security Group Configuration](#security-group-configuration)
5. [Domain and DNS Setup](#domain-and-dns-setup)
6. [Deployment Steps](#deployment-steps)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Environment Configuration](#environment-configuration)
9. [Database Setup](#database-setup)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before beginning the deployment, ensure you have the following:

| Requirement | Description |
|-------------|-------------|
| AWS Account | Active AWS account with billing enabled |
| Domain Name | A registered domain (e.g., adele.yourdomain.com) |
| SSH Key Pair | AWS key pair for EC2 access |
| API Keys | OpenAI, Stripe, Resend, and other service API keys |

---

## AWS Account Setup

### Step 1: Create an AWS Account

If you don't have an AWS account, visit [aws.amazon.com](https://aws.amazon.com) and create one. You'll need a credit card for billing purposes, though the free tier covers many services for the first 12 months.

### Step 2: Create an IAM User

For security best practices, create an IAM user instead of using the root account:

1. Navigate to **IAM** in the AWS Console
2. Click **Users** → **Add users**
3. Enter a username (e.g., `adele-admin`)
4. Select **AWS Management Console access**
5. Attach the **AdministratorAccess** policy (or create a custom policy with EC2, RDS, and Route53 permissions)
6. Download the credentials CSV file

### Step 3: Create an SSH Key Pair

1. Navigate to **EC2** → **Key Pairs**
2. Click **Create key pair**
3. Name it `adele-key`
4. Select **RSA** and **.pem** format
5. Download and save the `.pem` file securely
6. Set proper permissions: `chmod 400 adele-key.pem`

---

## EC2 Instance Creation

### Recommended Instance Types

| Use Case | Instance Type | vCPUs | Memory | Monthly Cost (approx.) |
|----------|--------------|-------|--------|------------------------|
| Development/Testing | t3.small | 2 | 2 GB | $15 |
| Small Production | t3.medium | 2 | 4 GB | $30 |
| Medium Production | t3.large | 2 | 8 GB | $60 |
| Large Production | t3.xlarge | 4 | 16 GB | $120 |

### Step 1: Launch EC2 Instance

1. Navigate to **EC2** → **Instances** → **Launch instances**

2. **Name and tags**: Enter `ADELE-Production`

3. **Application and OS Images**: 
   - Select **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
   - Architecture: **64-bit (x86)**

4. **Instance type**: Select based on your needs (t3.medium recommended for production)

5. **Key pair**: Select `adele-key` (created earlier)

6. **Network settings**:
   - VPC: Default VPC
   - Subnet: No preference
   - Auto-assign public IP: **Enable**

7. **Configure storage**: 
   - Root volume: **30 GB** gp3 SSD (minimum)
   - For production with file uploads: **50-100 GB**

8. Click **Launch instance**

### Step 2: Allocate Elastic IP (Recommended)

An Elastic IP ensures your server keeps the same IP address even after restarts:

1. Navigate to **EC2** → **Elastic IPs**
2. Click **Allocate Elastic IP address**
3. Click **Allocate**
4. Select the new IP → **Actions** → **Associate Elastic IP address**
5. Select your ADELE instance
6. Click **Associate**

---

## Security Group Configuration

### Create Security Group

1. Navigate to **EC2** → **Security Groups** → **Create security group**

2. **Basic details**:
   - Name: `adele-security-group`
   - Description: Security group for ADELE application
   - VPC: Default VPC

3. **Inbound rules** - Add the following:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP/32 | SSH access (restrict to your IP) |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Application port (optional, for testing) |

4. **Outbound rules**: Keep default (Allow all)

5. Click **Create security group**

6. Assign to your EC2 instance:
   - Select instance → **Actions** → **Security** → **Change security groups**
   - Add `adele-security-group`

---

## Domain and DNS Setup

### Option A: Using Route 53 (Recommended)

1. Navigate to **Route 53** → **Hosted zones**
2. Select your domain or create a new hosted zone
3. Click **Create record**
4. Configure:
   - Record name: `adele` (for adele.yourdomain.com)
   - Record type: **A**
   - Value: Your EC2 Elastic IP address
   - TTL: 300
5. Click **Create records**

### Option B: Using External DNS Provider

Add an A record pointing to your EC2 Elastic IP:

```
Type: A
Name: adele (or @ for root domain)
Value: YOUR_ELASTIC_IP
TTL: 300
```

---

## Deployment Steps

### Step 1: Connect to Your EC2 Instance

```bash
ssh -i adele-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2: Run the Automated Setup Script

The easiest way to deploy is using our automated setup script:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/drsadivural/adele-cloudflare/main/scripts/ec2-setup.sh -o ec2-setup.sh
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

The script will:
- Update system packages
- Install Docker and Docker Compose
- Configure the firewall
- Set up fail2ban for security
- Clone the ADELE repository
- Generate secure passwords
- Obtain SSL certificates
- Start all services

### Step 3: Manual Deployment (Alternative)

If you prefer manual control:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
sudo mkdir -p /opt/adele
cd /opt/adele
sudo git clone https://github.com/drsadivural/adele-cloudflare.git .

# Configure environment
sudo cp .env.example .env
sudo nano .env  # Edit with your values

# Update nginx config with your domain
sudo sed -i 's/YOUR_DOMAIN/adele.yourdomain.com/g' nginx/conf.d/adele.conf

# Start services
sudo docker-compose up -d
```

---

## SSL Certificate Setup

### Automatic SSL with Let's Encrypt

The setup script handles SSL automatically. For manual setup:

```bash
cd /opt/adele

# Create initial nginx config for certificate generation
cat > nginx/conf.d/initial.conf << EOF
server {
    listen 80;
    server_name YOUR_DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF

# Start nginx
docker-compose up -d nginx

# Obtain certificate
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your@email.com \
    --agree-tos \
    --no-eff-email \
    -d YOUR_DOMAIN

# Remove initial config and restart
rm nginx/conf.d/initial.conf
docker-compose restart nginx
```

### Certificate Renewal

Certificates auto-renew via cron job. To manually renew:

```bash
cd /opt/adele
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

---

## Environment Configuration

### Required Environment Variables

Edit `/opt/adele/.env` with your configuration:

```bash
sudo nano /opt/adele/.env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens (auto-generated) | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | Optional |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Optional |

### Applying Configuration Changes

After editing `.env`:

```bash
cd /opt/adele
docker-compose down
docker-compose up -d
```

---

## Database Setup

### Initialize Database

The database is automatically initialized when PostgreSQL starts. To manually run migrations:

```bash
cd /opt/adele
docker-compose exec adele node -e "require('./server/migrate.js')"
```

### Database Backup

Create a backup:

```bash
cd /opt/adele
docker-compose exec -T postgres pg_dump -U adele adele > backup_$(date +%Y%m%d).sql
```

Restore from backup:

```bash
cat backup_20241231.sql | docker-compose exec -T postgres psql -U adele adele
```

### Automated Backups

The setup script creates a daily backup cron job. To manually configure:

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/adele/scripts/backup.sh") | crontab -
```

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f adele
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Check Service Status

```bash
docker-compose ps
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart adele
```

### Update Application

```bash
cd /opt/adele
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Resource Monitoring

```bash
# Docker stats
docker stats

# System resources
htop
df -h
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Cannot connect to server | Check security group allows ports 80/443 |
| SSL certificate error | Verify domain DNS points to EC2 IP |
| Database connection failed | Check DATABASE_URL in .env |
| Out of memory | Upgrade to larger instance type |
| Permission denied | Run commands with `sudo` |

### Debug Commands

```bash
# Check Docker containers
docker ps -a

# View container logs
docker logs adele-app

# Enter container shell
docker exec -it adele-app sh

# Test database connection
docker exec -it adele-postgres psql -U adele -d adele -c "SELECT 1"

# Check nginx config
docker exec adele-nginx nginx -t

# Check disk space
df -h

# Check memory
free -m
```

### Reset Everything

If you need to start fresh:

```bash
cd /opt/adele
docker-compose down -v  # Warning: This deletes all data!
docker system prune -af
docker-compose up -d
```

---

## Cost Optimization

### Recommendations

1. **Use Reserved Instances**: Save up to 72% with 1-year commitments
2. **Right-size your instance**: Start small and scale as needed
3. **Use Spot Instances**: For non-production environments (up to 90% savings)
4. **Enable Auto-scaling**: For variable traffic patterns
5. **Monitor with CloudWatch**: Set up billing alerts

### Estimated Monthly Costs

| Component | Cost (USD) |
|-----------|------------|
| EC2 t3.medium | $30 |
| EBS 50GB | $5 |
| Elastic IP | $4 |
| Data Transfer (50GB) | $5 |
| **Total** | **~$44/month** |

---

## Security Best Practices

1. **Keep software updated**: Run `sudo apt-get update && sudo apt-get upgrade` regularly
2. **Use strong passwords**: All auto-generated passwords are 24+ characters
3. **Restrict SSH access**: Only allow your IP in security group
4. **Enable 2FA**: For AWS console access
5. **Regular backups**: Automated daily backups are configured
6. **Monitor logs**: Check for suspicious activity
7. **Use HTTPS only**: HTTP redirects to HTTPS automatically

---

## Support

For issues or questions:

- GitHub Issues: [github.com/drsadivural/adele-cloudflare/issues](https://github.com/drsadivural/adele-cloudflare/issues)
- Documentation: [github.com/drsadivural/adele-cloudflare/docs](https://github.com/drsadivural/adele-cloudflare/docs)

---

*Last updated: December 2024*
