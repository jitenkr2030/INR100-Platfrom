import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { FraudDetectionService } from '@/lib/fraud-detection';
import { ActivityCategory } from '@prisma/client';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('Received webhook event:', event.event);

    // Log webhook event for fraud detection
    try {
      const clientInfo = FraudDetectionService.extractClientInfo(request);
      await FraudDetectionService.logActivity({
        userId: "system", // System activity
        action: `WEBHOOK_${event.event}`,
        category: ActivityCategory.PAYMENT,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        metadata: { 
          eventType: event.event, 
          eventId: event.event_id,
          payload: event.payload 
        }
      });
    } catch (logError) {
      console.error("Error logging webhook activity:", logError);
    }

    // Handle different event types
    switch (event.event) {
      // Payment Events
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;

      // Subscription Events
      case 'subscription.created':
        await handleSubscriptionCreated(event.payload.subscription.entity);
        break;
      
      case 'subscription.authenticated':
        await handleSubscriptionAuthenticated(event.payload.subscription.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      
      case 'subscription.paused':
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      
      case 'subscription.halted':
        await handleSubscriptionHalted(event.payload.subscription.entity);
        break;

      // Invoice Events
      case 'invoice.generated':
        await handleInvoiceGenerated(event.payload.invoice.entity);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.payload.invoice.entity);
        break;
      
      case 'invoice.cancelled':
        await handleInvoiceCancelled(event.payload.invoice.entity);
        break;
      
      default:
        console.log('Unhandled event type:', event.event);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    // Find transaction by Razorpay order ID
    const transaction = await db.transaction.findFirst({
      where: {
        reference: payment.order_id,
        status: 'PENDING'
      },
      include: {
        user: true,
        wallet: true
      }
    });

    if (!transaction) {
      console.error('Transaction not found for payment:', payment.id);
      return;
    }

    // Update transaction status
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        metadata: JSON.stringify({
          ...JSON.parse(transaction.metadata || '{}'),
          razorpay_payment_id: payment.id,
          razorpay_captured_at: new Date().toISOString(),
          payment_method: payment.method,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa,
          email: payment.email,
          contact: payment.contact
        })
      }
    });

    // Update or create wallet
    const wallet = await db.wallet.upsert({
      where: { userId: transaction.userId },
      update: {
        balance: {
          increment: transaction.amount
        }
      },
      create: {
        userId: transaction.userId,
        balance: transaction.amount,
        currency: transaction.currency
      }
    });

    // Create wallet transaction record
    await db.transaction.create({
      data: {
        userId: transaction.userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: transaction.amount,
        currency: transaction.currency,
        status: 'COMPLETED',
        reference: payment.id,
        description: `Wallet deposit via ${payment.method}`,
        metadata: JSON.stringify({
          razorpay_payment_id: payment.id,
          payment_method: payment.method,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa
        })
      }
    });

    console.log(`Payment captured successfully: ${payment.id} for order ${payment.order_id}`);

  } catch (error) {
    console.error('Error handling payment capture:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    // Update transaction status to failed
    const transaction = await db.transaction.findFirst({
      where: {
        reference: payment.order_id,
        status: 'PENDING'
      }
    });

    if (transaction) {
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            razorpay_payment_id: payment.id,
            razorpay_failed_at: new Date().toISOString(),
            failure_reason: payment.error_description
          })
        }
      });
    }

    console.log(`Payment failed: ${payment.id} for order ${payment.order_id}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentAuthorized(payment: any) {
  console.log(`Payment authorized: ${payment.id} for order ${payment.order_id}`);
  // This is for 3DS payments that need additional verification
}

async function handleOrderPaid(order: any) {
  console.log(`Order paid: ${order.id} with amount ${order.amount}`);
  // Additional processing if needed
}

// Subscription Event Handlers
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log(`Subscription created: ${subscription.id} for customer ${subscription.customer_id}`);
    
    // Find user by customer ID or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: subscription.customer_email },
          { phone: subscription.customer_contact }
        ]
      }
    });

    if (user) {
      // Create subscription record
      await db.subscription.create({
        data: {
          userId: user.id,
          tier: subscription.notes?.tier || 'BASIC',
          planType: subscription.notes?.planType || 'MONTHLY',
          amount: subscription.amount / 100, // Convert from paise to rupees
          currency: subscription.currency,
          status: 'ACTIVE',
          startDate: new Date(subscription.start_at * 1000),
          endDate: new Date(subscription.end_at * 1000),
          autoRenew: !subscription.ended_at,
          metadata: JSON.stringify({
            razorpay_subscription_id: subscription.id,
            customer_id: subscription.customer_id,
            plan_id: subscription.plan_id,
            short_url: subscription.short_url,
            notes: subscription.notes
          })
        }
      });
    }

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionAuthenticated(subscription: any) {
  try {
    console.log(`Subscription authenticated: ${subscription.id}`);
    
    // Update subscription status
    await db.subscription.updateMany({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: subscription.id
        }
      },
      data: {
        status: 'ACTIVE',
        metadata: {
          path: ['authenticated_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling subscription authenticated:', error);
  }
}

async function handleSubscriptionCharged(subscription: any) {
  try {
    console.log(`Subscription charged: ${subscription.id} for payment ${subscription.payment_id}`);
    
    // Find subscription by Razorpay subscription ID
    const dbSubscription = await db.subscription.findFirst({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: subscription.id
        }
      }
    });

    if (dbSubscription) {
      // Update subscription end date
      await db.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          endDate: new Date(subscription.end_at * 1000),
          metadata: {
            path: ['last_charged_at'],
            set: new Date().toISOString()
          }
        }
      });

      // Create transaction record for the subscription charge
      await db.transaction.create({
        data: {
          userId: dbSubscription.userId,
          type: 'SUBSCRIPTION',
          amount: subscription.amount / 100,
          currency: subscription.currency,
          status: 'COMPLETED',
          reference: subscription.payment_id,
          description: `Subscription renewal - ${dbSubscription.tier} plan`,
          metadata: JSON.stringify({
            razorpay_subscription_id: subscription.id,
            razorpay_payment_id: subscription.payment_id,
            charge_at: subscription.charge_at,
            subscription_tier: dbSubscription.tier
          })
        }
      });
    }

  } catch (error) {
    console.error('Error handling subscription charged:', error);
  }
}

async function handleSubscriptionPaused(subscription: any) {
  try {
    console.log(`Subscription paused: ${subscription.id}`);
    
    // Update subscription status
    await db.subscription.updateMany({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: subscription.id
        }
      },
      data: {
        status: 'PAUSED',
        metadata: {
          path: ['paused_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling subscription paused:', error);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  try {
    console.log(`Subscription resumed: ${subscription.id}`);
    
    // Update subscription status
    await db.subscription.updateMany({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: subscription.id
        }
      },
      data: {
        status: 'ACTIVE',
        endDate: new Date(subscription.end_at * 1000),
        metadata: {
          path: ['resumed_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling subscription resumed:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    console.log(`Subscription cancelled: ${subscription.id}`);
    
    // Update subscription status
    await db.subscription.updateMany({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: subscription.id
        }
      },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
        endDate: new Date(subscription.end_at * 1000),
        metadata: {
          path: ['cancelled_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleSubscriptionHalted(subscription: any) {
  try {
    console.log(`Subscription halted: ${subscription.id} due to failed payments`);
    
    // Update subscription status
    await db.subscription.updateMany({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: subscription.id
        }
      },
      data: {
        status: 'HALTED',
        autoRenew: false,
        metadata: {
          path: ['halted_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling subscription halted:', error);
  }
}

// Invoice Event Handlers
async function handleInvoiceGenerated(invoice: any) {
  try {
    console.log(`Invoice generated: ${invoice.id} for subscription ${invoice.subscription_id}`);
    
    // Find subscription by Razorpay subscription ID
    const subscription = await db.subscription.findFirst({
      where: {
        metadata: {
          path: ['razorpay_subscription_id'],
          equals: invoice.subscription_id
        }
      }
    });

    if (subscription) {
      // Create invoice record
      await db.invoice.create({
        data: {
          userId: subscription.userId,
          invoiceNumber: invoice.id,
          type: 'SUBSCRIPTION',
          amount: invoice.amount / 100,
          currency: invoice.currency,
          gstRate: 18.0, // Default GST rate
          metadata: JSON.stringify({
            razorpay_invoice_id: invoice.id,
            razorpay_subscription_id: invoice.subscription_id,
            invoice_date: invoice.date,
            due_date: invoice.due_date,
            line_items: invoice.line_items,
            notes: invoice.notes
          })
        }
      });
    }

  } catch (error) {
    console.error('Error handling invoice generated:', error);
  }
}

async function handleInvoicePaid(invoice: any) {
  try {
    console.log(`Invoice paid: ${invoice.id} with payment ${invoice.payment_id}`);
    
    // Update invoice status
    await db.invoice.updateMany({
      where: {
        invoiceNumber: invoice.id
      },
      data: {
        metadata: {
          path: ['paid_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoiceCancelled(invoice: any) {
  try {
    console.log(`Invoice cancelled: ${invoice.id}`);
    
    // Update invoice status
    await db.invoice.updateMany({
      where: {
        invoiceNumber: invoice.id
      },
      data: {
        metadata: {
          path: ['cancelled_at'],
          set: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error handling invoice cancelled:', error);
  }
}