# Payment & Subscription System - INR100 Platform

## Overview

The Payment & Subscription System is a comprehensive financial infrastructure designed to handle secure payment processing, subscription management, invoice generation, refund processing, and payment recovery across multiple gateways. This system provides enterprise-grade payment processing with robust error handling, fraud prevention, and automated recovery mechanisms.

## 🎯 Key Features

### Core Payment Processing
- **Multi-Gateway Support**: Stripe, Razorpay, PayPal integration
- **Secure Payment Flow**: PCI-compliant payment processing
- **Real-time Processing**: Instant payment confirmation and updates
- **Currency Support**: Multiple currencies with proper formatting
- **Payment Methods**: Cards, bank transfers, digital wallets, UPI, net banking

### Subscription Management
- **Recurring Billing**: Automated subscription renewals
- **Plan Management**: Flexible pricing tiers and intervals
- **Subscription Lifecycle**: Trial periods, upgrades, downgrades, cancellations
- **Proration Handling**: Automatic proration for plan changes
- **Retention Management**: Automated dunning and recovery processes

### Invoice & Billing
- **Invoice Generation**: Automated invoice creation and delivery
- **Billing History**: Complete transaction records and searchable history
- **PDF Generation**: Professional invoice formatting
- **Email Delivery**: Automated invoice sending
- **Payment Tracking**: Real-time payment status updates

### Refund Processing
- **Automated Refunds**: One-click refund processing
- **Partial Refunds**: Support for partial refund amounts
- **Refund Tracking**: Complete refund audit trail
- **Subscription Adjustments**: Automatic subscription modifications after refunds

### Payment Recovery
- **Dunning Management**: Automated payment failure recovery
- **Smart Retries**: Intelligent retry scheduling and logic
- **Payment Method Updates**: Seamless payment method changes
- **Subscription Preservation**: Efforts to maintain subscriber relationships

## 📁 File Structure

```
src/
├── app/api/
│   ├── payments/
│   │   ├── process/route.ts          # Payment processing endpoint
│   │   ├── gateways/route.ts         # Multi-gateway integration
│   │   └── recovery/route.ts         # Payment failure recovery
│   ├── subscriptions/
│   │   └── manage/route.ts           # Subscription management
│   └── invoices/
│       └── manage/route.ts           # Invoice generation & management
├── components/payments/
│   ├── PaymentForm.tsx               # Payment processing form
│   └── SubscriptionManagement.tsx    # Subscription dashboard
├── app/payments/
│   └── page.tsx                      # Main payments page
└── database/
    └── payments_schema.sql           # Complete database schema
```

## 🔧 API Endpoints

### Payment Processing (`/api/payments/process`)

**POST** - Process a payment
```typescript
{
  "amount": 29.99,
  "currency": "usd",
  "paymentMethodId": "pm_123",
  "customerId": "cus_123",
  "description": "Monthly Subscription",
  "metadata": {
    "subscriptionId": "sub_123",
    "plan": "pro"
  }
}
```

**Response:**
```typescript
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentId": "pi_xxx",
  "status": "requires_payment_method"
}
```

### Multi-Gateway Integration (`/api/payments/gateways`)

**GET** - List supported gateways
```typescript
{
  "gateways": [
    {
      "id": "stripe",
      "name": "Stripe",
      "supportedMethods": ["card", "bank_transfer", "wallet"],
      "supportedCurrencies": ["usd", "eur", "gbp"],
      "processingFee": 0.029
    },
    {
      "id": "razorpay",
      "name": "Razorpay",
      "supportedMethods": ["card", "netbanking", "wallet", "upi"],
      "supportedCurrencies": ["inr"],
      "processingFee": 0.02
    }
  ]
}
```

**POST** - Process payment through specific gateway
```typescript
{
  "amount": 1000,
  "currency": "inr",
  "gateway": "razorpay",
  "customerId": "cust_123",
  "description": "Premium Plan Purchase",
  "paymentMethod": "upi"
}
```

### Subscription Management (`/api/subscriptions/manage`)

**GET** - Retrieve customer subscriptions
```typescript
// Query: ?customerId=cus_123
{
  "subscriptions": [
    {
      "id": "sub_123",
      "status": "active",
      "plan": {
        "name": "Pro Monthly",
        "price": 29.99,
        "currency": "usd",
        "interval": "month"
      },
      "currentPeriodStart": "2025-01-01T00:00:00Z",
      "currentPeriodEnd": "2025-02-01T00:00:00Z"
    }
  ]
}
```

**POST** - Create new subscription
```typescript
{
  "priceId": "price_123",
  "customerId": "cus_123",
  "paymentMethodId": "pm_123",
  "trialPeriodDays": 14,
  "metadata": {
    "source": "website",
    "campaign": "summer_promo"
  }
}
```

**PATCH** - Update subscription
```typescript
{
  "subscriptionId": "sub_123",
  "priceId": "price_new_plan",
  "cancelAtPeriodEnd": false,
  "metadata": {
    "upgradeReason": "user_requested"
  }
}
```

### Invoice Management (`/api/invoices/manage`)

**GET** - Retrieve invoices
```typescript
// Query: ?customerId=cus_123&limit=10
{
  "invoices": [
    {
      "id": "in_123",
      "amount": 29.99,
      "currency": "usd",
      "status": "paid",
      "invoiceUrl": "https://invoice.stripe.com/i/xxx",
      "pdfUrl": "https://pay.stripe.com/invoice/xxx/pdf",
      "dueDate": "2025-01-31T23:59:59Z",
      "paidAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**POST** - Create new invoice
```typescript
{
  "customerId": "cus_123",
  "subscriptionId": "sub_123",
  "description": "Monthly Service - January 2025",
  "dueDate": "2025-01-31T23:59:59Z",
  "items": [
    {
      "amount": 29.99,
      "currency": "usd",
      "description": "Pro Monthly Plan",
      "quantity": 1
    }
  ],
  "sendEmail": true
}
```

### Refapi/refunds/processund Processing (`/`)

**POST** - Process refund
```typescript
{
  "paymentIntentId": "pi_123",
  "amount": 15.00,
  "reason": "requested_by_customer",
  "metadata": {
    "refundReason": "service_issue",
    "supportTicket": "TICKET-123"
  }
}
```

**Response:**
```typescript
{
  "refundId": "re_123",
  "amount": 15.00,
  "currency": "usd",
  "status": "succeeded",
  "estimatedArrival": 1642098000
}
```

### Payment Recovery (`/api/payments/recovery`)

**POST** - Handle payment failure recovery
```typescript
{
  "action": "retry_payment",
  "paymentIntentId": "pi_123",
  "retryCount": 1,
  "maxRetries": 3,
  "metadata": {
    "failureReason": "card_declined"
  }
}
```

**Actions supported:**
- `retry_payment`: Retry failed payment
- `update_payment_method`: Update customer's payment method
- `send_dunning_notice`: Send payment failure notification
- `cancel_subscription`: Cancel subscription due to payment failure
- `schedule_retry`: Schedule payment retry for later

## 🏗️ Database Schema

### Core Tables

**payments**
```sql
- id (VARCHAR) - Payment identifier
- user_id (VARCHAR) - Customer reference
- amount (DECIMAL) - Payment amount
- currency (VARCHAR) - Currency code
- status (ENUM) - Payment status
- gateway (ENUM) - Payment gateway used
- payment_method (VARCHAR) - Payment method used
- processing_fee (DECIMAL) - Gateway processing fee
- retry_count (INTEGER) - Number of retry attempts
- refunded_amount (DECIMAL) - Total refunded amount
```

**subscriptions**
```sql
- id (VARCHAR) - Subscription identifier
- user_id (VARCHAR) - Customer reference
- status (ENUM) - Subscription status
- plan_name (VARCHAR) - Plan name
- plan_price (DECIMAL) - Plan price
- plan_interval (ENUM) - Billing interval
- current_period_start (TIMESTAMP) - Current period start
- current_period_end (TIMESTAMP) - Current period end
- cancel_at_period_end (BOOLEAN) - Cancel at period end flag
```

**invoices**
```sql
- id (VARCHAR) - Invoice identifier
- user_id (VARCHAR) - Customer reference
- amount (DECIMAL) - Invoice amount
- status (ENUM) - Invoice status
- invoice_url (VARCHAR) - Hosted invoice URL
- invoice_pdf (VARCHAR) - PDF invoice URL
- due_date (TIMESTAMP) - Payment due date
- paid_at (TIMESTAMP) - Payment timestamp
```

### Recovery Tables

**dunning_notices**
```sql
- id (SERIAL) - Notice identifier
- user_id (VARCHAR) - Customer reference
- type (ENUM) - Notice type
- status (ENUM) - Notice status
- sent_at (TIMESTAMP) - When notice was sent
- message (TEXT) - Notice content
```

**scheduled_retries**
```sql
- id (SERIAL) - Retry identifier
- payment_id (VARCHAR) - Payment reference
- scheduled_at (TIMESTAMP) - When to retry
- retry_count (INTEGER) - Current retry attempt
- status (ENUM) - Retry status
- error_message (TEXT) - Last error message
```

## 🖥️ UI Components

### PaymentForm Component

**Features:**
- Multi-gateway selection
- Saved payment methods
- Real-time form validation
- PCI-compliant card input
- Payment method management
- Processing fee calculation
- Error handling and recovery

**Props:**
```typescript
interface PaymentFormProps {
  amount: number
  currency: string
  description: string
  customerId?: string
  subscriptionId?: string
  onSuccess: (result: any) => void
  onError: (error: string) => void
  allowSaveCard?: boolean
}
```

### SubscriptionManagement Component

**Features:**
- Active subscription overview
- Plan upgrade/downgrade
- Subscription cancellation
- Billing history
- Payment method management
- Dunning notice handling
- Subscription analytics

**Tab Structure:**
- **Overview**: Current subscriptions and quick actions
- **Billing**: Invoice history and downloads
- **Payment Methods**: Saved cards and payment options

### PaymentsPage Component

**Features:**
- Comprehensive payment dashboard
- Transaction history
- Quick payment processing
- Subscription management
- Payment method administration
- Recovery status monitoring

## 🔒 Security Features

### Payment Security
- **PCI Compliance**: Stripe handles all sensitive card data
- **Tokenization**: No raw card data stored in database
- **Encrypted Storage**: All sensitive data encrypted at rest
- **HTTPS Only**: All API endpoints require HTTPS
- **Webhook Verification**: Valid webhook signatures

### Fraud Prevention
- **Velocity Checking**: Prevent rapid-fire payments
- **Amount Limits**: Configurable transaction limits
- **Geographic Restrictions**: Country-based payment rules
- **Risk Scoring**: Automatic risk assessment
- **Manual Review**: Flag suspicious transactions

### Data Protection
- **GDPR Compliance**: Right to deletion and data portability
- **Data Minimization**: Store only necessary payment data
- **Audit Logging**: Complete audit trail of all operations
- **Access Control**: Role-based access to payment functions
- **Regular Patches**: Keep all dependencies updated

## 💰 Pricing & Fees

### Gateway Comparison

| Gateway | Processing Fee | Supported Methods | Currencies |
|---------|---------------|-------------------|------------|
| Stripe | 2.9% + 30¢ | Cards, Bank Transfer, Wallets | 135+ |
| Razorpay | 2% | Cards, UPI, Net Banking, Wallets | INR |
| PayPal | 3.4% + 30¢ | PayPal, Cards | 200+ |

### Fee Calculation Example
```typescript
const calculateFees = (amount: number, gateway: string) => {
  const fees = {
    stripe: 0.029,
    razorpay: 0.02,
    paypal: 0.034
  }
  
  const processingFee = amount * fees[gateway]
  const fixedFee = gateway === 'razorpay' ? 0 : 0.30
  
  return {
    processingFee,
    fixedFee,
    total: processingFee + fixedFee,
    finalAmount: amount + processingFee + fixedFee
  }
}
```

## 📊 Analytics & Reporting

### Key Metrics
- **Monthly Recurring Revenue (MRR)**
- **Annual Recurring Revenue (ARR)**
- **Customer Lifetime Value (CLV)**
- **Churn Rate**
- **Payment Failure Rate**
- **Average Revenue Per User (ARPU)**

### Revenue Analytics
```sql
-- Monthly Recurring Revenue
SELECT 
    DATE_TRUNC('month', current_period_start) as month,
    SUM(plan_price) as mrr
FROM subscriptions 
WHERE status = 'active'
GROUP BY DATE_TRUNC('month', current_period_start)
ORDER BY month;

-- Payment Failure Rate
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    (COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / COUNT(*)) * 100 as failure_rate
FROM payments
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;
```

### Subscription Analytics
```sql
-- Churn Analysis
SELECT 
    DATE_TRUNC('month', canceled_at) as month,
    COUNT(*) as churned_subscriptions,
    SUM(plan_price) as lost_mrr
FROM subscriptions
WHERE canceled_at IS NOT NULL
    AND canceled_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', canceled_at)
ORDER BY month;

-- Cohort Analysis
WITH cohorts AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', created_at) as cohort_month,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as subscription_number
    FROM subscriptions
)
SELECT 
    cohort_month,
    subscription_number,
    COUNT(*) as subscribers,
    COUNT(*) * 100.0 / LAG(COUNT(*)) OVER (PARTITION BY cohort_month ORDER BY subscription_number) as retention_rate
FROM cohorts
GROUP BY cohort_month, subscription_number
ORDER BY cohort_month, subscription_number;
```

## 🔄 Payment Recovery Flow

### Automatic Recovery Process

1. **Payment Failure Detection**
   - Webhook receives failed payment event
   - Payment status updated in database
   - Dunning notice scheduled

2. **Dunning Sequence**
   - Immediate email notification
   - Retry payment after 24 hours
   - Second notice after 3 days
   - Final notice after 7 days

3. **Recovery Actions**
   - Smart retry with different payment method
   - Payment method update request
   - Subscription pause/cancellation
   - Customer service escalation

### Recovery Configuration
```typescript
const dunningConfig = {
  retries: [
    { delay: 24, action: 'retry_payment' },
    { delay: 72, action: 'send_dunning_notice' },
    { delay: 168, action: 'update_payment_method' },
    { delay: 336, action: 'cancel_subscription' }
  ],
  maxRetries: 3,
  enableSmartRetries: true,
  escalateToSupport: true
}
```

## 📱 Mobile Optimization

### Responsive Design
- Touch-optimized payment forms
- Mobile-first subscription management
- Swipe gestures for transaction history
- Responsive invoice viewing
- Mobile wallet integration

### Performance
- Lazy loading for large transaction lists
- Optimized payment form components
- Fast loading payment methods
- Cached subscription data
- Efficient webhook processing

## 🧪 Testing Strategy

### Unit Tests
- Payment calculation accuracy
- Subscription lifecycle management
- Refund processing logic
- Recovery workflow testing
- Currency conversion validation

### Integration Tests
- End-to-end payment flow
- Subscription creation to cancellation
- Invoice generation and delivery
- Multi-gateway compatibility
- Webhook event processing

### Security Tests
- PCI compliance verification
- Encryption at rest and in transit
- Access control validation
- SQL injection prevention
- XSS protection testing

### Load Testing
- High-volume payment processing
- Concurrent subscription operations
- Webhook burst handling
- Database performance under load
- Gateway rate limiting compliance

## 🚀 Implementation Guide

### Setup Steps

1. **Environment Configuration**
   ```bash
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_live_xxx
   RAZORPAY_KEY_SECRET=xxx
   RAZORPAY_WEBHOOK_SECRET=xxx
   
   # Database Configuration
   DATABASE_URL=postgresql://user:pass@localhost:5432/payments
   ```

2. **Database Setup**
   ```bash
   # Run schema migration
   psql -d payments_db -f database/payments_schema.sql
   
   # Create indexes for performance
   psql -d payments_db -f database/indexes.sql
   ```

3. **Webhook Configuration**
   ```typescript
   // Configure webhook endpoints in payment provider dashboards
   https://yourdomain.com/api/webhooks/stripe
   https://yourdomain.com/api/webhooks/razorpay
   ```

4. **Payment Provider Setup**
   - Configure products and prices in Stripe
   - Set up payment methods in Razorpay
   - Configure webhook endpoints
   - Test webhook delivery

### Integration Points

1. **User Authentication**
   ```typescript
   // Link payment data to user accounts
   const payment = await createPayment({
     userId: user.id,
     amount: subscription.price,
     currency: subscription.currency
   })
   ```

2. **Subscription Activation**
   ```typescript
   // Activate features based on subscription status
   useEffect(() => {
     if (subscription?.status === 'active') {
       enablePremiumFeatures()
     }
   }, [subscription])
   ```

3. **Usage Tracking**
   ```typescript
   // Track usage for overage billing
   await trackUsage({
     userId: user.id,
     feature: 'api_calls',
     amount: usageCount
   })
   ```

## 🔍 Monitoring & Alerts

### Key Performance Indicators
- Payment success rate (target: >95%)
- Subscription conversion rate (target: >15%)
- Churn rate (target: <5% monthly)
- Payment failure recovery rate (target: >70%)
- Average time to payment (target: <30 seconds)

### Alert Conditions
- Payment failure rate >10%
- Subscription churn >20%
- Gateway connectivity issues
- Unusual transaction patterns
- High refund rates

### Monitoring Dashboard
```typescript
// Real-time payment metrics
const PaymentMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    paymentFailureRate: 0,
    churnRate: 0
  })

  useEffect(() => {
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard title="Revenue" value={metrics.totalRevenue} />
      <MetricCard title="Active Subs" value={metrics.activeSubscriptions} />
      <MetricCard title="Failure Rate" value={metrics.paymentFailureRate} />
      <MetricCard title="Churn Rate" value={metrics.churnRate} />
    </div>
  )
}
```

## 🔮 Future Enhancements

### Planned Features
1. **Advanced Analytics**: Predictive churn modeling, revenue forecasting
2. **Smart Billing**: AI-powered billing optimization
3. **Enterprise Features**: Multi-tenant billing, bulk operations
4. **Global Expansion**: More payment gateways, local payment methods
5. **Mobile SDKs**: Native mobile payment integration
6. **Blockchain Integration**: Cryptocurrency payment support

### Technical Improvements
1. **Real-time Processing**: WebSocket-based payment updates
2. **Machine Learning**: Fraud detection and payment optimization
3. **API Rate Limiting**: Advanced rate limiting and throttling
4. **Microservices**: Service decomposition for scalability
5. **Event Sourcing**: Complete transaction audit trail

## 📞 Support & Maintenance

### Support Channels
- Technical documentation
- API reference guides
- Video tutorials
- Developer community forum
- Direct developer support

### Maintenance Schedule
- **Daily**: Payment monitoring and recovery processing
- **Weekly**: Performance analytics review
- **Monthly**: Security updates and dependency patches
- **Quarterly**: Feature updates and improvements

### Backup & Recovery
- Daily database backups
- Payment data replication
- Disaster recovery procedures
- Business continuity planning
- Regular recovery testing

---

## 📝 Changelog

### Version 1.0.0 (2025-01-13)
- Initial payment and subscription system implementation
- Multi-gateway integration (Stripe, Razorpay, PayPal)
- Complete subscription lifecycle management
- Invoice generation and delivery system
- Automated refund processing
- Payment failure recovery system
- Comprehensive database schema
- Mobile-responsive UI components
- Complete API documentation
- Security and compliance features

---

*This payment and subscription system provides enterprise-grade financial processing capabilities with robust error handling, fraud prevention, and automated recovery mechanisms for the INR100 Platform.*