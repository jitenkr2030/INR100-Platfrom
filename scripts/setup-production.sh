#!/bin/bash

# Production Deployment Setup Script
# This script helps configure the production environment with live Razorpay credentials

set -e

echo "🚀 INR100 Platform - Production Deployment Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file already exists. This script will create a backup.${NC}"
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create production .env file
echo -e "${GREEN}Creating production environment configuration...${NC}"
cp .env.production.example .env

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local variable="$2"
    local default="$3"
    local required="$4"
    
    while true; do
        read -p "$prompt [$default]: " input
        input="${input:-$default}"
        
        if [ -z "$input" ] && [ "$required" = "true" ]; then
            echo -e "${RED}Error: This field is required.${NC}"
            continue
        fi
        
        sed -i "s|^$variable=.*|$variable=\"$input\"|" .env
        break
    done
}

echo ""
echo "📋 Production Configuration"
echo "========================="

# Essential configuration
prompt_input "Enter your domain name" "NEXT_PUBLIC_APP_URL" "https://your-domain.com" "true"
prompt_input "Enter NextAuth secret" "NEXTAUTH_SECRET" "$(openssl rand -base64 32)" "true"
prompt_input "Enter JWT secret" "JWT_SECRET" "$(openssl rand -base64 32)" "true"
prompt_input "Enter encryption key" "ENCRYPTION_KEY" "$(openssl rand -base64 32)" "true"

echo ""
echo "💳 Razorpay Production Configuration"
echo "=================================="

echo -e "${YELLOW}IMPORTANT: Please enter your LIVE Razorpay credentials, not test credentials.${NC}"
echo ""

prompt_input "Enter Razorpay Live Key ID" "RAZORPAY_KEY_ID" "" "true"
prompt_input "Enter Razorpay Live Key Secret" "RAZORPAY_KEY_SECRET" "" "true"
prompt_input "Enter Razorpay Webhook Secret" "RAZORPAY_WEBHOOK_SECRET" "" "true"

echo ""
echo "📧 Email Configuration"
echo "====================="

prompt_input "Enter SMTP host" "SMTP_HOST" "smtp.gmail.com" "false"
prompt_input "Enter SMTP port" "SMTP_PORT" "587" "false"
prompt_input "Enter SMTP username" "SMTP_USER" "" "false"
prompt_input "Enter SMTP password" "SMTP_PASSWORD" "" "false"
prompt_input "Enter SMTP from address" "SMTP_FROM" "noreply@INR100.com" "false"

echo ""
echo "🤖 AI Service Configuration"
echo "=========================="

prompt_input "Enter ZAI API key" "ZAI_API_KEY" "" "false"
prompt_input "Enter ZAI API URL" "ZAI_API_URL" "https://api.zai.dev" "false"

echo ""
echo "📊 Analytics Configuration"
echo "========================="

prompt_input "Enter Google Analytics ID" "GOOGLE_ANALYTICS_ID" "" "false"
prompt_input "Enter Mixpanel token" "MIXPANEL_TOKEN" "" "false"

echo ""
echo "🔧 Optional Configuration"
echo "======================="

prompt_input "Enter Alpha Vantage API key" "ALPHA_VANTAGE_API_KEY" "" "false"
prompt_input "Enter FMP API key" "FMP_API_KEY" "" "false"

prompt_input "Enter Google Client ID" "GOOGLE_CLIENT_ID" "" "false"
prompt_input "Enter Google Client Secret" "GOOGLE_CLIENT_SECRET" "" "false"

prompt_input "Enter GitHub Client ID" "GITHUB_CLIENT_ID" "" "false"
prompt_input "Enter GitHub Client Secret" "GITHUB_CLIENT_SECRET" "" "false"

echo ""
echo "🗄️ Database Configuration"
echo "======================="

read -p "Use SQLite for production? (y/N): " use_sqlite
if [[ $use_sqlite =~ ^[Yy]$ ]]; then
    sed -i 's|^DATABASE_URL=.*|DATABASE_URL="file:./prisma/prod.db"|' .env
else
    prompt_input "Enter database URL" "DATABASE_URL" "" "true"
fi

read -p "Use Redis for caching? (y/N): " use_redis
if [[ $use_redis =~ ^[Yy]$ ]]; then
    prompt_input "Enter Redis URL" "REDIS_URL" "redis://localhost:6379" "false"
else
    sed -i '/^REDIS_URL=/d' .env
fi

echo ""
echo "🔒 Security Configuration"
echo "======================="

# Generate secure secrets if not provided
if ! grep -q "NEXTAUTH_SECRET=" .env || [[ $(grep "NEXTAUTH_SECRET=" .env | cut -d'"' -f2) == "your-production-secret-key-minimum-32-characters-long" ]]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env
fi

if ! grep -q "JWT_SECRET=" .env || [[ $(grep "JWT_SECRET=" .env | cut -d'"' -f2) == "your-jwt-secret-key-minimum-32-characters" ]]; then
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|" .env
fi

if ! grep -q "ENCRYPTION_KEY=" .env || [[ $(grep "ENCRYPTION_KEY=" .env | cut -d'"' -f2) == "your-encryption-key-32-characters" ]]; then
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"|" .env
fi

echo ""
echo "📋 Production Build Configuration"
echo "================================="

# Update next.config.ts for production
cat > next.config.ts << 'EOF'
import { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    domains: ['your-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Production-specific optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default withNextIntl(nextConfig);
EOF

echo ""
echo "🔍 Razorpay Webhook Setup"
echo "========================="

echo -e "${YELLOW}Please follow these steps to configure Razorpay webhooks:${NC}"
echo ""
echo "1. Log in to your Razorpay Dashboard"
echo "2. Go to Settings → Webhooks"
echo "3. Add a new webhook with the following URL:"
echo "   ${NEXT_PUBLIC_APP_URL}/api/payments/webhook"
echo ""
echo "4. Enable the following webhook events:"
echo "   ✅ payment.captured"
echo "   ✅ payment.failed"
echo "   ✅ payment.authorized"
echo "   ✅ order.paid"
echo "   ✅ subscription.created"
echo "   ✅ subscription.authenticated"
echo "   ✅ subscription.charged"
echo "   ✅ subscription.paused"
echo "   ✅ subscription.resumed"
echo "   ✅ subscription.cancelled"
echo "   ✅ subscription.halted"
echo "   ✅ invoice.generated"
echo "   ✅ invoice.paid"
echo "   ✅ invoice.cancelled"
echo ""
echo "5. Use the webhook secret from your .env file"
echo ""

echo "🚀 Deployment Commands"
echo "====================="
echo ""
echo "Build the application:"
echo "  npm run build"
echo ""
echo "Start the production server:"
echo "  npm start"
echo ""
echo "Or using Docker:"
echo "  docker build -t inr100-platform ."
echo "  docker run -p 3000:3000 inr100-platform"
echo ""

echo "✅ Configuration Complete!"
echo "========================="
echo ""
echo -e "${GREEN}Your production environment has been configured successfully.${NC}"
echo ""
echo "Next steps:"
echo "1. Review the .env file for accuracy"
echo "2. Set up your Razorpay webhooks"
echo "3. Run database migrations: npm run db:migrate"
echo "4. Build the application: npm run build"
echo "5. Deploy to your production environment"
echo ""
echo "Important security notes:"
echo "- Keep your .env file secure and never commit it to version control"
echo "- Use strong, unique secrets for all authentication keys"
echo "- Regularly rotate your secrets and API keys"
echo "- Monitor your Razorpay dashboard for suspicious activity"
echo ""
echo -e "${YELLOW}Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)${NC}"