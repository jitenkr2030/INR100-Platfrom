---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 30450220507a405495106555fa1b9309c7ce7b2462c2623f428a0360ec019ae22ca5d080022100e50f5935fa9e5a0ca8f53b9eeb84aeb435fcb09d900619a360aedde14c8ec785
    ReservedCode2: 304402205096a846f725dfc65945e1c1caa101f762d77587fb3ca71195ed03c9782d5d71022020052fcef98b5ca17e3aa589b4e1dd7e9d952288bff69a16a6a1b48e8d0279b2
---

# Environment Variables Setup for Vercel Deployment

This document outlines all the environment variables required for the INR100 Platform deployment on Vercel.

## Required Environment Variables

### 1. Database Configuration
```
DATABASE_URL=sqlite:./dev.db
```
For production, you should use a proper database URL. For Vercel, you can use:
- **SQLite**: `file:./dev.db` (for development)
- **PostgreSQL**: `postgresql://user:password@host:port/database`
- **MySQL**: `mysql://user:password@host:port/database`

### 2. Authentication
```
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
NEXTAUTH_URL=https://your-app.vercel.app
```

### 3. Payment Gateway (Razorpay)
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 4. Push Notifications
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 5. Broker Integration (Optional)
```
BROKER_CLIENT_ID=your_broker_client_id
BROKER_CLIENT_SECRET=your_broker_client_secret
UPSTOX_CLIENT_ID=your_upstox_client_id
UPSTOX_CLIENT_SECRET=your_upstox_client_secret
NEXT_PUBLIC_UPSTOX_CLIENT_ID=your_public_upstox_client_id
```

### 6. Monitoring & Analytics (Optional)
```
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_VITALS_URL=your_vitals_url
```

### 7. Node Environment
```
NODE_ENV=production
```

## How to Set Up Environment Variables in Vercel

### Method 1: Through Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Select "Environment Variables" from the left menu
4. Add each variable with its value:
   - **Name**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select "Production", "Preview", and "Development" as needed

### Method 2: Through Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add RAZORPAY_KEY_ID production
vercel env add RAZORPAY_KEY_SECRET production
vercel env add RAZORPAY_WEBHOOK_SECRET production
```

## Minimum Required Variables for Deployment

For the app to work with basic functionality, you need at least these variables:

```bash
DATABASE_URL=sqlite:./dev.db
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Generating Required Secrets

### NEXTAUTH_SECRET
Generate a random secret:
```bash
openssl rand -base64 32
# Or use: https://generate-secret.vercel.app/
```

### Razorpay Credentials
1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live keys
4. Copy Key ID and Key Secret

### VAPID Keys (for Push Notifications)
Generate using:
```bash
npx web-push generate-vapid-keys
```

## Environment-Specific Values

### Development
```bash
DATABASE_URL=sqlite:./dev.db
NEXTAUTH_SECRET=dev-secret-key-for-testing-only
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Production
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Security Best Practices

1. **Never commit environment variables to git**
2. **Use different values for development and production**
3. **Rotate secrets regularly**
4. **Use Vercel's environment variable protection**
5. **Limit access to production secrets**

## Testing Environment Variables

After setting up the variables, you can test them by:

1. **Redeploying** your application on Vercel
2. **Checking the build logs** for any missing variable errors
3. **Testing the application** functionality

## Troubleshooting

### Common Issues

1. **"database_url" secret does not exist**
   - Make sure you've added the `DATABASE_URL` variable in Vercel dashboard
   - Check that the variable name is exactly `DATABASE_URL` (case-sensitive)

2. **Build fails due to missing variables**
   - Add all required variables before deployment
   - Some variables are needed during build time

3. **Authentication not working**
   - Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are correctly set
   - Ensure `NEXTAUTH_URL` matches your deployed URL

### Getting Help

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Ensure variable names match exactly (case-sensitive)
4. Contact Vercel support if needed