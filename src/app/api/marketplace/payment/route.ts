import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      itemType, // 'insight' | 'portfolio_copy' | 'subscription'
      itemId, 
      amount, 
      paymentMethod = 'wallet', // 'wallet' | 'upi' | 'card' | 'netbanking'
      metadata = {} 
    } = body;

    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    if (!itemType || !itemId || !amount) {
      return NextResponse.json(
        { error: 'Item type, ID, and amount are required' },
        { status: 400 }
      );
    }

    // Verify item exists and get details
    let itemDetails: any = null;
    let expertId: string | null = null;

    switch (itemType) {
      case 'insight':
        const insight = await db.expertInsight.findUnique({
          where: { id: itemId },
          include: { expert: true }
        });
        if (!insight || !insight.isActive) {
          return NextResponse.json(
            { error: 'Insight not found or inactive' },
            { status: 404 }
          );
        }
        if (insight.price !== amount) {
          return NextResponse.json(
            { error: 'Payment amount mismatch' },
            { status: 400 }
          );
        }
        itemDetails = insight;
        expertId = insight.expertId;
        break;

      case 'portfolio_copy':
        const template = await db.portfolioTemplate.findUnique({
          where: { id: itemId },
          include: { expert: true }
        });
        if (!template || !template.isActive || !template.isPublic) {
          return NextResponse.json(
            { error: 'Portfolio template not found or inactive' },
            { status: 404 }
          );
        }
        if (template.minInvestment > amount) {
          return NextResponse.json(
            { error: `Minimum investment required is ₹${template.minInvestment}` },
            { status: 400 }
          );
        }
        itemDetails = template;
        expertId = template.expertId;
        break;

      case 'subscription':
        const subscription = await db.subscriptionPlan.findUnique({
          where: { id: itemId },
          include: { expert: true }
        });
        if (!subscription || !subscription.isActive) {
          return NextResponse.json(
            { error: 'Subscription plan not found or inactive' },
            { status: 404 }
          );
        }
        if (subscription.price !== amount) {
          return NextResponse.json(
            { error: 'Payment amount mismatch' },
            { status: 400 }
          );
        }
        itemDetails = subscription;
        expertId = subscription.expertId;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid item type' },
          { status: 400 }
        );
    }

    // Check user's wallet balance for wallet payments
    if (paymentMethod === 'wallet') {
      const userWallet = await db.wallet.findUnique({
        where: { userId }
      });

      if (!userWallet || userWallet.balance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        );
      }
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        itemType,
        itemId,
        amount,
        currency: 'INR',
        paymentMethod,
        status: 'PENDING',
        metadata: JSON.stringify(metadata)
      }
    });

    // For wallet payments, process immediately
    if (paymentMethod === 'wallet') {
      try {
        const result = await processWalletPayment(payment.id, userId, expertId, itemType, itemId, amount);
        return NextResponse.json({
          paymentId: payment.id,
          status: 'COMPLETED',
          ...result
        });
      } catch (error) {
        // Update payment status to failed
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        });
        
        return NextResponse.json(
          { error: 'Payment processing failed' },
          { status: 400 }
        );
      }
    }

    // For other payment methods, return payment ID for further processing
    return NextResponse.json({
      paymentId: payment.id,
      status: 'PENDING',
      message: 'Payment initiated. Please complete the payment process.',
      nextSteps: {
        upi: 'Redirect to UPI app',
        card: 'Redirect to payment gateway',
        netbanking: 'Redirect to bank selection'
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

async function processWalletPayment(
  paymentId: string, 
  userId: string, 
  expertId: string | null, 
  itemType: string, 
  itemId: string, 
  amount: number
) {
  // Create transaction record
  await db.transaction.create({
    data: {
      userId,
      type: 'INVESTMENT',
      amount: -amount,
      currency: 'INR',
      status: 'COMPLETED',
      reference: paymentId,
      description: `Purchase: ${itemType} - ${itemId}`
    }
  });

  // Deduct from user's wallet
  await db.wallet.update({
    where: { userId },
    data: {
      balance: {
        decrement: amount
      }
    }
  });

  // Create purchase record based on item type
  let purchase: any;
  let commissionAmount = 0;
  let commissionRate = 0;

  switch (itemType) {
    case 'insight':
      purchase = await db.expertInsightPurchase.create({
        data: {
          userId,
          insightId: itemId,
          amount,
          currency: 'INR',
          status: 'COMPLETED',
          paymentId
        }
      });
      commissionRate = 0.20; // 20% commission for insights
      break;

    case 'portfolio_copy':
      purchase = await db.portfolioCopy.create({
        data: {
          userId,
          templateId: itemId,
          initialInvestment: amount,
          currentValue: amount,
          status: 'ACTIVE',
          copyDate: new Date(),
          paymentId
        }
      });
      commissionRate = 0.02; // 2% commission for portfolio copies
      break;

    case 'subscription':
      purchase = await db.subscriptionPurchase.create({
        data: {
          userId,
          planId: itemId,
          amount,
          currency: 'INR',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          paymentId
        }
      });
      commissionRate = 0.30; // 30% commission for subscriptions
      break;
  }

  commissionAmount = amount * commissionRate;

  // Create commission for expert if applicable
  if (expertId && commissionAmount > 0) {
    await db.commission.create({
      data: {
        userId: expertId,
        partnerId: userId,
        type: `${itemType.toUpperCase()}_SALE`,
        amount: commissionAmount,
        currency: 'INR',
        percentage: commissionRate * 100,
        reference: paymentId,
        description: `Commission from ${itemType} sale`,
        status: 'PENDING'
      }
    });
  }

  // Update payment status to completed
  await db.payment.update({
    where: { id: paymentId },
    data: { status: 'COMPLETED' }
  });

  return {
    purchase,
    commission: {
      expertShare: commissionAmount,
      platformShare: amount - commissionAmount,
      rate: commissionRate * 100
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const paymentId = searchParams.get('paymentId');

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const where: any = { userId: targetUserId };
    if (paymentId) where.id = paymentId;

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      successfulPayments: payments.filter(p => p.status === 'COMPLETED').length,
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      failedPayments: payments.filter(p => p.status === 'FAILED').length
    };

    return NextResponse.json({
      payments,
      summary
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}