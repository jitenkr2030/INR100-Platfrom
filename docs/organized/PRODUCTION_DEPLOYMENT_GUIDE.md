---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304502205519b9157046b073d3c7ac5231a2e9532acaaec4f498635fd711ba8dbca693c4022100bb268c7e8984f9b640caec13b45c88116728d99db0275a9354bff63af5a79bd3
    ReservedCode2: 3046022100ea448e6c5968f948bf0db1cf7373969bb28181a51b4336d1086c8d4730a2da38022100abd3d64d4dab52321fc197c7eff230f336fd3ce9964fc9a510ba32de467f5193
---

# INR100 Platform - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the INR100 Platform to production with live Razorpay credentials.

## Prerequisites

- Node.js 18+ installed
- PM2 (Process Manager) installed globally
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- Database (SQLite for simple setups, PostgreSQL for production)
- Redis (optional, for caching)
- Razorpay account with live credentials

## Step 1: Environment Configuration

### 1.1 Run the Production Setup Script

```bash
# Run the interactive setup script
./scripts/setup-production.sh
```

This script will:
- Create a production `.env` file
- Prompt for all necessary configuration values
- Generate secure secrets
- Validate Razorpay credentials
- Provide deployment instructions

### 1.2 Manual Configuration (Alternative)

If you prefer manual configuration, copy the production template:

```bash
cp .env.production.example .env
```

Then update the following critical values:

#### Razorpay Production Credentials
```env
# Replace with your LIVE Razorpay credentials
RAZORPAY_KEY_ID="rzp_live_your-live-key-id"
RAZORPAY_KEY_SECRET="your-live-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-live-webhook-secret"
```

#### Essential Security Settings
```env
# Generate secure secrets (minimum 32 characters)
NEXTAUTH_SECRET="your-secure-secret-here"
JWT_SECRET="your-secure-jwt-secret-here"
ENCRYPTION_KEY="your-secure-encryption-key-here"
```

#### Application Settings
```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
```

## Step 2: Database Setup

### 2.1 SQLite (Simple Setup)

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

### 2.2 PostgreSQL (Production Recommended)

Update your `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/inr100_prod"
```

Then run:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Step 3: Build the Application

```bash
# Install dependencies
npm install --production

# Build the application
npm run build
```

## Step 4: Configure Razorpay Webhooks

### 4.1 Access Razorpay Dashboard

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → Webhooks

### 4.2 Add Webhook Endpoint

**Webhook URL:** `https://your-domain.com/api/payments/webhook`

**Webhook Secret:** Use the same value as `RAZORPAY_WEBHOOK_SECRET` in your `.env` file

### 4.3 Enable Webhook Events

Enable the following events for comprehensive payment tracking:

#### Payment Events
- ✅ `payment.captured`
- ✅ `payment.failed`
- ✅ `payment.authorized`
- ✅ `order.paid`

#### Subscription Events
- ✅ `subscription.created`
- ✅ `subscription.authenticated`
- ✅ `subscription.charged`
- ✅ `subscription.paused`
- ✅ `subscription.resumed`
- ✅ `subscription.cancelled`
- ✅ `subscription.halted`

#### Invoice Events
- ✅ `invoice.generated`
- ✅ `invoice.paid`
- ✅ `invoice.cancelled`

### 4.4 Test Webhook Integration

Use Razorpay's webhook testing feature to verify that your endpoint is working correctly.

## Step 5: Deployment Options

### 5.1 PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'inr100-platform',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 5.2 Docker Deployment

```bash
# Build Docker image
docker build -t inr100-platform .

# Run container
docker run -d \
  --name inr100-platform \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  inr100-platform
```

### 5.3 Systemd Service

```bash
# Create systemd service file
sudo tee /etc/systemd/system/inr100-platform.service > /dev/null <<EOF
[Unit]
Description=INR100 Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/path/to/your/app/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable inr100-platform
sudo systemctl start inr100-platform
```

## Step 6: SSL Configuration

### 6.1 Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static/ {
        alias /path/to/your/app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Let's Encrypt SSL

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 7: Monitoring and Logging

### 7.1 Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs inr100-platform

# Restart application
pm2 restart inr100-platform
```

### 7.2 Health Check Endpoint

The application includes a health check endpoint at `/api/health` that you can use for monitoring:

```bash
curl https://your-domain.com/api/health
```

### 7.3 Log Rotation

```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate configuration
sudo tee /etc/logrotate.d/inr100-platform > /dev/null <<EOF
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
```

## Step 8: Security Hardening

### 8.1 Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 8.2 File Permissions

```bash
# Set proper permissions
chown -R www-data:www-data /path/to/your/app
chmod -R 755 /path/to/your/app
chmod 600 /path/to/your/app/.env
```

### 8.3 Security Headers

Ensure your Nginx configuration includes security headers as shown in Step 6.1.

## Step 9: Backup Strategy

### 9.1 Database Backup

```bash
# SQLite backup
sqlite3 /path/to/database.db ".backup /path/to/backups/db_$(date +%Y%m%d).db"

# PostgreSQL backup
pg_dump inr100_prod > /path/to/backups/db_$(date +%Y%m%d).sql
```

### 9.2 Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d)
DB_PATH="/path/to/database.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sqlite3 $DB_PATH ".backup $BACKUP_DIR/db_$DATE.db"

# Backup environment file (encrypted)
gpg --trust-model always --encrypt -r admin@your-domain.com .env > $BACKUP_DIR/env_$DATE.gpg

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.gpg" -mtime +30 -delete

echo "Backup completed: $DATE"
```

## Step 10: Post-Deployment Checklist

- [ ] Verify HTTPS is working correctly
- [ ] Test Razorpay payment flow with live credentials
- [ ] Confirm webhooks are receiving events
- [ ] Check all admin functionality
- [ ] Verify email notifications are working
- [ ] Test user registration and login
- [ ] Confirm GST calculations are working
- [ ] Check device management functionality
- [ ] Verify fraud detection is active
- [ ] Test subscription management
- [ ] Confirm all API endpoints are responding
- [ ] Check database connections
- [ ] Verify SSL certificate validity
- [ ] Test backup and restore procedures

## Troubleshooting

### Common Issues

1. **Razorpay Webhook Fails**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Ensure SSL certificate is valid

2. **Database Connection Issues**
   - Verify database URL in `.env`
   - Check database service is running
   - Confirm proper file permissions

3. **Payment Processing Errors**
   - Verify Razorpay credentials are correct
   - Check if using live vs test keys
   - Review webhook event configuration

4. **SSL Certificate Issues**
   - Verify certificate chain is complete
   - Check certificate expiration
   - Confirm proper Nginx configuration

### Log Analysis

```bash
# Application logs
pm2 logs inr100-platform

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u inr100-platform -f
```

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test individual components

For Razorpay-specific issues:
1. Contact Razorpay support
2. Check Razorpay status page
3. Review webhook configuration

## Maintenance

### Regular Tasks

- **Daily**: Monitor application logs and performance
- **Weekly**: Check for security updates and backup verification
- **Monthly**: Review SSL certificates and update dependencies
- **Quarterly**: Full security audit and performance optimization

### Updates

```bash
# Update dependencies
npm update

# Rebuild application
npm run build

# Restart application
pm2 restart inr100-platform
```

---

This guide covers the essential steps for deploying the INR100 Platform to production with live Razorpay credentials. Always test thoroughly in a staging environment before deploying to production.