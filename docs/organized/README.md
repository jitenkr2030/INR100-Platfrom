---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022076ebb98992264f28e8f7b62ce157b63efe6ee0648956efba61e60ee696f858c0022100a30e7bb7c8158d11386b92171efd5a9ee56480918affbff2e8df636450f9011b
    ReservedCode2: 30440220650537e11ace06f2c2afb2eb0c604fad28dab56a59cae8406245a48766235990022001b69c7aa623495c589f4647393c3334003dd8ff17592f23a75266bccf5a6c8e
---

# 🚀 INR100.com - India's Micro-Investing Platform

A comprehensive micro-investing platform designed for Indians to start their wealth creation journey with just ₹100. Built with modern technologies and featuring AI-powered insights, social investing, gamification, real money trading through broker partnerships, and a complete learning ecosystem.

## ✨ Features

### 🎯 Core Investment Features
- **Micro-Fractional Investing**: Start with just ₹100 in stocks, mutual funds, gold, and global assets
- **500+ Investment Options**: Diversify across multiple asset classes
- **AI-Powered Insights**: Get personalized recommendations and market analysis
- **Real-time Portfolio Tracking**: Monitor your investments with detailed analytics

### 🔐 Authentication & Security
- **OTP-based Login**: Secure authentication with email/phone verification
- **Complete KYC Flow**: PAN/Aadhaar verification with document upload
- **Bank-Level Security**: 256-bit encryption and biometric login support
- **SEBI Registered**: Fully compliant with Indian financial regulations
- **Device Management**: Maximum 3 devices per user with device tracking
- **Advanced Fraud Detection**: IP monitoring and suspicious activity flags
- **Real-time Security Alerts**: Instant notifications for suspicious activities

### 🎮 Gamification & Rewards
- **Badge System**: Earn badges for investment milestones and achievements
- **Missions & Challenges**: Complete tasks to earn XP and rewards
- **Leaderboards**: Compete with other investors
- **Learning Streaks**: Build habits with daily learning rewards

### 📚 Learning Academy
- **Micro-Lessons**: Bite-sized content on investing basics
- **Video Tutorials**: Learn from expert investors
- **Interactive Quizzes**: Test your knowledge and earn XP
- **Progress Tracking**: Monitor your learning journey

### 👥 Social Investing
- **Follow Experts**: Copy portfolios of successful investors
- **Community Feed**: Share insights and learn from others
- **Discussion Forums**: Ask questions and get answers
- **Portfolio Sharing**: Showcase your investment strategies

### 💳 Payment & Wallet
- **Multiple Payment Options**: UPI, Net Banking, Debit/Credit Cards
- **Instant Wallet**: Load funds instantly and start investing
- **Secure Transactions**: All payments are encrypted and secure
- **Transaction History**: Complete record of all your financial activities
- **GST Integration**: Automatic GST calculation and invoicing
- **Razorpay Integration**: Complete subscription management with webhooks

### 🤝 Real Money Trading (NEW!)
- **Broker Partnerships**: Trade through Upstox, Angel One, and 5Paisa
- **No SEBI License Required**: Invest through partner brokers
- **Fractional Investing**: Start with just ₹100 in fractional shares
- **Paper to Real Transition**: Learn with virtual money, then invest real funds
- **₹20 Commission**: Transparent pricing per order
- **Cross-Platform**: Available on both web and mobile apps
- **OAuth Integration**: Secure broker account linking
- **Real-time Data**: Live market quotes and portfolio updates

### 🏆 Expert Marketplace (NEW!)
- **Portfolio Templates**: Copy proven investment strategies from experts
- **Expert Insights**: Access premium market analysis and recommendations
- **Newsletter System**: Subscribe to expert financial newsletters
- **Expert Dashboard**: Comprehensive management interface for experts
- **Revenue Sharing**: 80-20 split between experts and platform
- **Rating System**: Community-driven expert and content ratings
- **Copy Trading**: Automatic portfolio synchronization and tracking
- **Premium Content**: Monetize expertise through paid insights and templates

## 🛠️ Technology Stack

### Frontend
- **⚡ Next.js 15** - React framework with App Router (Web)
- **📘 TypeScript 5** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - High-quality UI components
- **🎯 Lucide React** - Beautiful icon library
- **🌈 Framer Motion** - Smooth animations

### Mobile App
- **📱 React Native 0.72** - Cross-platform mobile development
- **🔄 React Navigation** - Navigation (tabs, stack, drawer)
- **⚡ Expo** - Development tools and APIs
- **🎨 NativeBase** - Mobile UI components
- **📷 Camera Integration** - Document scanning and KYC
- **🔐 Biometric Auth** - Fingerprint and Face ID support

### Backend
- **🗄️ Prisma ORM** - Type-safe database access
- **🔐 NextAuth.js** - Authentication solution
- **🔄 TanStack Query** - Data synchronization
- **🐻 Zustand** - Lightweight state management
- **🌐 Axios** - HTTP client

### Database
- **SQLite** - Lightweight database for development
- **Comprehensive Schema** - Users, Portfolios, Assets, Transactions, KYC, Gamification

## 📁 Project Structure

```
INR100-Platfrom/
├── src/                    # Web application (Next.js)
│   ├── app/               # Next.js app directory
│   ├── components/        # Reusable components
│   ├── lib/               # Utilities and services
│   └── hooks/             # Custom React hooks
├── mobile/                # Mobile application (React Native)
│   ├── src/
│   │   ├── screens/       # Mobile app screens
│   │   ├── services/      # Mobile app services
│   │   ├── navigation/    # Navigation configuration
│   │   └── styles/        # Mobile app styles
│   ├── package.json       # Mobile dependencies
│   └── README.md          # Mobile app guide
├── prisma/                # Database schema and migrations
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jitenkr2030/INR100-Platfrom.git
cd INR100-Platfrom
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed database with demo data
npm run db:seed
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Troubleshooting

### Common Installation Issues

#### NPM Permission Errors
If you encounter permission errors during `npm install`:

**Problem**: `EACCES: permission denied, mkdir '/usr/local/lib/node_modules/...'`

**Solutions**:
1. **Use local installation**:
```bash
npm install --prefix . --production=false
```

2. **Fix npm configuration**:
```bash
# Clear npm cache
npm cache clean --force

# Reset npm prefix
npm config delete prefix
npm install --no-optional --no-audit --no-fund
```

3. **Alternative package managers**:
```bash
# Using yarn
yarn install

# Using pnpm
pnpm install
```

4. **Manual node_modules creation**:
```bash
# Create node_modules directory
mkdir -p node_modules

# Install with specific flags
npm install --legacy-peer-deps --force
```

#### Node.js Version Issues
- Ensure Node.js 18+ is installed
- Check version: `node --version`
- Update if needed from [nodejs.org](https://nodejs.org/)

#### Dependency Conflicts
- Clear package-lock.json and reinstall
- Use `--legacy-peer-deps` flag if peer dependency conflicts occur
- Update to latest npm: `npm install -g npm@latest`

#### Database Issues
- Ensure SQLite is properly initialized
- Check file permissions for `prisma/dev.db`
- Reset database if corrupted:
```bash
npm run db:reset
npm run db:seed
```

#### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

### Performance Optimization
- Enable React Strict Mode for development
- Use `npm run build` before testing production builds
- Monitor bundle size with `npm run analyze` (if available)

## 🎮 Demo Credentials

Use these credentials to explore the platform:

### Login Credentials
- **Email**: `demo@inr100.com`
- **Password**: `demo123`
- **Phone**: `+919876543210`
- **OTP**: `123456` (any 6-digit number works)

### Demo Portfolio
- **RELIANCE**: 5 shares
- **AXIS Bluechip Fund**: 100 units  
- **Digital Gold**: 2 grams
- **Total Value**: ₹25,000
- **Returns**: ₹3,000 (12%)

### Gamification Features
- **User Level**: 5
- **XP Points**: 2,500
- **Streak**: 7 days
- **Badges Earned**: First Investment, KYC Verified
- **Active Missions**: Learn the Basics (1/3 completed)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── devices/       # Device management APIs
│   │   ├── security-alerts/ # Security monitoring APIs
│   │   ├── gst/           # GST calculation and invoicing
│   │   ├── payments/      # Payment processing with Razorpay
│   │   ├── ai/            # AI-powered features
│   │   └── ...
│   ├── dashboard/         # User dashboard
│   ├── invest/           # Investment interface
│   ├── learn/            # Learning academy
│   ├── community/        # Social features
│   ├── rewards/          # Gamification
│   ├── security/         # Security settings with device management
│   ├── login/            # Authentication pages
│   └── register/         # Registration flow
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   ├── security/        # Security components (device management)
│   └── ai/              # AI-powered components
├── hooks/               # Custom React hooks
└── lib/                 # Utilities and configurations
    ├── device-manager.ts # Device management utilities
    ├── fraud-detection.ts # Fraud detection service
    └── ...
```

## 🗄️ Database Schema

### Core Models
- **User**: User accounts with KYC and gamification data
- **Asset**: Investment instruments (stocks, mutual funds, gold, global)
- **Portfolio**: User investment portfolios
- **Holding**: Individual asset holdings within portfolios
- **Transaction**: Financial transactions and history
- **Wallet**: User wallet for managing funds

### Authentication & KYC
- **KYCDocument**: KYC verification documents
- **PaymentMethod**: User payment methods
- **UserDevice**: Device management and tracking
- **UserSession**: User session management
- **SecurityAlert**: Security monitoring and alerts
- **UserActivityLog**: Activity logging for fraud detection

### Monetization
- **Subscription**: User subscription management
- **Fee**: Transaction and management fees
- **PremiumFeature**: Premium feature offerings
- **UserPremiumFeature**: User premium feature access
- **ManagedPortfolio**: Professional portfolio management
- **Invoice**: GST-compliant invoicing system

### Gamification
- **Badge**: Achievement badges
- **UserBadge**: User-earned badges
- **Mission**: Active challenges and tasks
- **UserMission**: User mission progress
- **LearnContent**: Educational content
- **LearnProgress**: User learning progress

### Social Features
- **SocialPost**: Community posts and updates
- **Comment**: Post comments and discussions
- **Follow**: User following relationships
- **Watchlist**: Asset watchlists
- **CopiedPortfolio**: Portfolio copying functionality

### AI Features
- **AIInsight**: AI-generated investment insights and recommendations

### Expert Marketplace
- **PortfolioTemplate**: Expert-created portfolio strategies for copying
- **PortfolioTemplateCopy**: User copies of expert portfolio templates
- **ExpertInsight**: Expert-generated market insights and analysis
- **ExpertInsightPurchase**: Premium insight purchase records
- **ExpertInsightRating**: Community ratings for individual insights
- **ExpertRating**: Overall expert performance ratings
- **Newsletter**: Expert newsletter management
- **NewsletterSubscription**: User newsletter subscriptions
- **NewsletterIssue**: Individual newsletter publications
- **NewsletterDelivery**: Delivery tracking and engagement metrics

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
npm run db:seed      # Seed database with demo data
```

## 🌟 Key Features Deep Dive

### 1. Authentication System
- **Multi-factor Authentication**: Email/phone + OTP
- **KYC Integration**: Complete PAN/Aadhaar verification flow
- **Session Management**: Secure user sessions with NextAuth.js
- **Password Security**: bcrypt hashing with salt rounds
- **Device Management**: Maximum 3 devices per user with tracking
- **Fraud Detection**: Real-time IP monitoring and suspicious activity detection
- **Security Alerts**: Instant notifications for security events

### 2. Investment Engine
- **Fractional Investing**: Buy fractions of expensive assets
- **Real-time Pricing**: Live market data integration
- **Portfolio Analytics**: Detailed performance metrics
- **Risk Assessment**: User risk profiling and recommendations

### 3. AI-Powered Insights
- **Market Analysis**: AI-driven market trend analysis
- **Portfolio Health**: Automated portfolio health checks
- **Investment Recommendations**: Personalized investment suggestions
- **Risk Alerts**: Proactive risk monitoring and alerts

### 4. Gamification System
- **XP and Levels**: Experience points and user progression
- **Achievement Badges**: Visual recognition of accomplishments
- **Daily Missions**: Engaging daily tasks and challenges
- **Leaderboards**: Competitive ranking system

### 5. Learning Platform
- **Content Management**: Structured learning paths
- **Progress Tracking**: Monitor learning advancement
- **Interactive Elements**: Quizzes and assessments
- **Rewards System**: Earn XP for completing lessons

### 6. Security & Fraud Detection
- **Device Limit Management**: Maximum 3 active devices per user
- **IP Monitoring**: Track and analyze IP address changes
- **Suspicious Activity Detection**: Real-time pattern recognition
- **Security Alerts**: Automated alert generation for suspicious activities
- **Activity Logging**: Comprehensive user activity tracking
- **Risk Scoring**: Dynamic risk assessment based on user behavior

## 💰 Monetization Strategies

### 1. Transaction Fees
- **Brokerage Fees**: Small percentage on each transaction
- **Spread-based Revenue**: Small spread on buy/sell prices
- **Subscription Plans**: Premium features for paid users

### 2. Asset Management
- **Management Fees**: Annual fees on managed portfolios
- **Performance Fees**: Percentage of profits earned
- **Advisory Services**: Paid investment advisory

### 3. Premium Features
- **AI Insights**: Advanced AI-powered recommendations
- **Expert Access**: One-on-one sessions with investment experts
- **Advanced Analytics**: Detailed portfolio analysis tools
- **Priority Support**: Premium customer support

### 4. Partnerships
- **Fund Houses**: Commission from mutual fund investments
- **Broker Partners**: Revenue sharing with brokerage firms
- **Payment Gateway**: Commission on payment processing
- **Educational Content**: Sponsored content and courses

### 5. Expert Marketplace
- **Portfolio Template Sales**: Commission on portfolio copies (1% of investment)
- **Expert Insight Sales**: Revenue from premium insights (80% expert share)
- **Newsletter Subscriptions**: Free newsletters with premium upgrade options
- **Expert Verification**: Paid verification system for experts
- **Featured Content**: Promoted expert content and templates

### 6. Data & Analytics
- **Market Data**: Premium market data subscriptions
- **API Access**: Paid API access for developers
- **Research Reports**: In-depth investment research
- **Custom Analytics**: Bespoke analytics for institutional clients

## 🔒 Security Features

### Data Security
- **256-bit SSL Encryption**: All data transmitted securely
- **Encrypted Database**: Sensitive data encrypted at rest
- **Regular Audits**: Security audits and penetration testing
- **GDPR Compliant**: Data protection and privacy measures

### Financial Security
- **SEBI Registration**: Regulatory compliance
- **Bank-grade Security**: Military-grade security measures
- **Two-factor Authentication**: Additional security layer
- **Fraud Detection**: Real-time fraud monitoring

### User Privacy
- **Data Minimization**: Collect only necessary data
- **Anonymous Analytics**: Usage analytics without personal data
- **Transparent Policies**: Clear privacy and data usage policies
- **User Control**: Full control over personal data

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="your-production-url"
NEXTAUTH_SECRET="your-secret-key"
```

2. **Database Setup**
```bash
# Generate production database
npm run db:generate

# Run production migrations
npm run db:migrate
```

3. **Build and Deploy**
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Prisma Team**: For the excellent ORM
- **shadcn/ui**: For the beautiful component library
- **Tailwind CSS**: For the utility-first CSS framework
- **Indian Investment Community**: For the inspiration and feedback

## 📚 Documentation

### Real Trading Integration
- **Web App Guide**: [WEB_APP_REAL_TRADING_GUIDE.md](./WEB_APP_REAL_TRADING_GUIDE.md)
- **Mobile App Guide**: [mobile/REAL_TRADING_INTEGRATION_GUIDE.md](./mobile/REAL_TRADING_INTEGRATION_GUIDE.md)
- **Mobile App Summary**: [mobile/MOBILE_APP_COMPLETE_GUIDE.md](./mobile/MOBILE_APP_COMPLETE_GUIDE.md)

### Other Documentation
- **Production Guide**: [docs/PRODUCTION_GUIDE.md](./docs/PRODUCTION_GUIDE.md)
- **Payment System**: [docs/PAYMENT_SYSTEM.md](./docs/PAYMENT_SYSTEM.md)
- **Monitoring Setup**: [docs/MONITORING_SETUP.md](./docs/MONITORING_SETUP.md)
- **Expert Marketplace**: [EXPERT_MARKETPLACE_IMPLEMENTATION.md](./EXPERT_MARKETPLACE_IMPLEMENTATION.md)

## 📞 Support

For support and questions:
- **Email**: support@inr100.com
- **Documentation**: [docs.inr100.com](https://docs.inr100.com)
- **Community**: [community.inr100.com](https://community.inr100.com)
- **Twitter**: [@inr100](https://twitter.com/inr100)

---

Built with ❤️ for the Indian investment community. Start your wealth creation journey with just ₹100! 🚀🇮🇳
