import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, // 'calculate' | 'process' | 'track' | 'payout'
      expertId,
      period, // 'daily' | 'weekly' | 'monthly'
      payoutAmount,
      payoutMethod = 'bank_transfer'
    } = body;

    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'calculate':
        return await calculateCommissions(userId, period);
      
      case 'process':
        return await processCommission(userId, body);
      
      case 'track':
        return await trackCommission(userId, body);
      
      case 'payout':
        return await processPayout(userId, expertId, payoutAmount, payoutMethod);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Commission management error:', error);
    return NextResponse.json(
      { error: 'Commission management failed' },
      { status: 500 }
    );
  }
}

async function calculateCommissions(userId: string, period: string) {
  const now = new Date();
  let startDate: Date;

  // Calculate start date based on period
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get all commissions for the expert in the period
  const commissions = await db.commission.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: startDate,
        lte: now
      },
      status: 'PENDING'
    },
    include: {
      reference: true // Include related transaction/purchase data
    }
  });

  // Calculate summary
  const totalCommissions = commissions.reduce((sum, commission) => sum + commission.amount, 0);
  const commissionByType = commissions.reduce((acc, commission) => {
    if (!acc[commission.type]) {
      acc[commission.type] = { count: 0, total: 0 };
    }
    acc[commission.type].count++;
    acc[commission.type].total += commission.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Calculate platform fees (if applicable)
  const platformFees = totalCommissions * 0.05; // 5% platform fee
  const netCommissions = totalCommissions - platformFees;

  // Check minimum payout threshold
  const minPayoutThreshold = 1000; // ₹1000 minimum
  const eligibleForPayout = netCommissions >= minPayoutThreshold;

  return NextResponse.json({
    period,
    startDate,
    endDate: now,
    commissions: {
      total: totalCommissions,
      count: commissions.length,
      breakdown: commissionByType
    },
    fees: {
      platformFees,
      netCommissions
    },
    payout: {
      eligible: eligibleForPayout,
      amount: eligibleForPayout ? netCommissions : 0,
      threshold: minPayoutThreshold,
      shortfall: eligibleForPayout ? 0 : (minPayoutThreshold - netCommissions)
    },
    details: commissions
  });
}

async function processCommission(userId: string, data: any) {
  const { type, partnerId, amount, currency, percentage, reference, description } = data;

  // Validate commission data
  if (!type || !partnerId || !amount || !currency) {
    return NextResponse.json(
      { error: 'Missing required commission fields' },
      { status: 400 }
    );
  }

  // Create commission record
  const commission = await db.commission.create({
    data: {
      userId: userId,
      partnerId,
      type,
      amount,
      currency,
      percentage: percentage || 0,
      reference,
      description,
      status: 'PENDING'
    }
  });

  // Track commission event
  await db.commissionEvent.create({
    data: {
      commissionId: commission.id,
      eventType: 'CREATED',
      eventData: JSON.stringify(data),
      timestamp: new Date()
    }
  });

  return NextResponse.json({
    message: 'Commission processed successfully',
    commission
  });
}

async function trackCommission(userId: string, data: any) {
  const { commissionId, eventType, eventData } = data;

  // Verify commission exists and belongs to user
  const commission = await db.commission.findFirst({
    where: {
      id: commissionId,
      userId: userId
    }
  });

  if (!commission) {
    return NextResponse.json(
      { error: 'Commission not found' },
      { status: 404 }
    );
  }

  // Create tracking event
  await db.commissionEvent.create({
    data: {
      commissionId,
      eventType,
      eventData: JSON.stringify(eventData),
      timestamp: new Date()
    }
  });

  // Update commission status if needed
  let statusUpdate: any = {};
  switch (eventType) {
    case 'APPROVED':
      statusUpdate = { status: 'APPROVED', approvedAt: new Date() };
      break;
    case 'PAID':
      statusUpdate = { status: 'PAID', paidAt: new Date() };
      break;
    case 'DISPUTED':
      statusUpdate = { status: 'DISPUTED', disputedAt: new Date() };
      break;
    case 'RESOLVED':
      statusUpdate = { status: 'RESOLVED', resolvedAt: new Date() };
      break;
  }

  if (Object.keys(statusUpdate).length > 0) {
    await db.commission.update({
      where: { id: commissionId },
      data: statusUpdate
    });
  }

  return NextResponse.json({
    message: 'Commission tracking updated',
    eventType,
    commissionId
  });
}

async function processPayout(userId: string, expertId: string, payoutAmount: number, payoutMethod: string) {
  // Verify expert
  const expert = await db.user.findUnique({
    where: { id: expertId },
    include: { expertProfile: true }
  });

  if (!expert || !expert.expertProfile?.isVerified) {
    return NextResponse.json(
      { error: 'Expert not found or not verified' },
      { status: 404 }
    );
  }

  // Calculate eligible commissions
  const commissionCalc = await calculateCommissions(expertId, 'all_time');
  
  if (payoutAmount > commissionCalc.fees.netCommissions) {
    return NextResponse.json(
      { error: 'Payout amount exceeds available commissions' },
      { status: 400 }
    );
  }

  // Create payout record
  const payout = await db.payout.create({
    data: {
      expertId,
      amount: payoutAmount,
      currency: 'INR',
      payoutMethod,
      status: 'PROCESSING',
      processedAt: new Date()
    }
  });

  // Process payout based on method
  let payoutResult: any = {};
  
  switch (payoutMethod) {
    case 'bank_transfer':
      payoutResult = await processBankTransfer(expertId, payoutAmount, payout.id);
      break;
    case 'upi':
      payoutResult = await processUPIPayment(expertId, payoutAmount, payout.id);
      break;
    case 'wallet':
      payoutResult = await processWalletTransfer(expertId, payoutAmount, payout.id);
      break;
  }

  // Update payout status
  const finalStatus = payoutResult.success ? 'COMPLETED' : 'FAILED';
  await db.payout.update({
    where: { id: payout.id },
    data: {
      status: finalStatus,
      completedAt: payoutResult.success ? new Date() : null,
      failureReason: payoutResult.success ? null : payoutResult.error
    }
  });

  // Update commission statuses for paid out amounts
  if (payoutResult.success) {
    await updateCommissionStatuses(expertId, payoutAmount);
  }

  return NextResponse.json({
    message: `Payout ${finalStatus.toLowerCase()}`,
    payout: {
      id: payout.id,
      amount: payoutAmount,
      status: finalStatus,
      method: payoutMethod
    },
    ...payoutResult
  });
}

async function processBankTransfer(expertId: string, amount: number, payoutId: string) {
  // In a real implementation, integrate with payment gateway for bank transfers
  const expert = await db.user.findUnique({
    where: { id: expertId },
    select: { name: true, bankDetails: true }
  });

  console.log(`Processing bank transfer of ₹${amount} to ${expert?.name}`);
  
  // Simulate bank transfer processing
  const success = Math.random() > 0.1; // 90% success rate
  
  return {
    success,
    method: 'bank_transfer',
    reference: `TXN${Date.now()}`,
    estimatedArrival: '1-2 business days',
    ...(success ? {} : { error: 'Bank transfer failed. Please check account details.' })
  };
}

async function processUPIPayment(expertId: string, amount: number, payoutId: string) {
  // In a real implementation, integrate with UPI payment gateway
  const expert = await db.user.findUnique({
    where: { id: expertId },
    select: { name: true, upiId: true }
  });

  console.log(`Processing UPI payment of ₹${amount} to ${expert?.upiId}`);
  
  const success = Math.random() > 0.05; // 95% success rate
  
  return {
    success,
    method: 'upi',
    reference: `UPI${Date.now()}`,
    estimatedArrival: 'Instant',
    ...(success ? {} : { error: 'UPI payment failed. Please verify UPI ID.' })
  };
}

async function processWalletTransfer(expertId: string, amount: number, payoutId: string) {
  // Credit to expert's wallet
  try {
    await db.wallet.upsert({
      where: { userId: expertId },
      update: {
        balance: {
          increment: amount
        }
      },
      create: {
        userId: expertId,
        balance: amount
      }
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        userId: expertId,
        type: 'COMMISSION_PAYOUT',
        amount: amount,
        currency: 'INR',
        status: 'COMPLETED',
        reference: payoutId,
        description: 'Commission payout'
      }
    });

    return {
      success: true,
      method: 'wallet',
      reference: `WLT${Date.now()}`,
      message: 'Amount credited to wallet successfully'
    };
  } catch (error) {
    return {
      success: false,
      method: 'wallet',
      error: 'Wallet transfer failed'
    };
  }
}

async function updateCommissionStatuses(expertId: string, payoutAmount: number) {
  // Mark commissions as paid, starting with the oldest
  const commissions = await db.commission.findMany({
    where: {
      userId: expertId,
      status: { in: ['PENDING', 'APPROVED'] }
    },
    orderBy: { createdAt: 'asc' }
  });

  let remainingAmount = payoutAmount;
  
  for (const commission of commissions) {
    if (remainingAmount <= 0) break;
    
    const payAmount = Math.min(commission.amount, remainingAmount);
    
    await db.commission.update({
      where: { id: commission.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidAmount: payAmount
      }
    });
    
    remainingAmount -= payAmount;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const expertId = searchParams.get('expertId');
    const status = searchParams.get('status');
    const period = searchParams.get('period');

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // For experts, default to their own ID
    const queryUserId = expertId || targetUserId;

    const where: any = { userId: queryUserId };
    if (status) where.status = status;

    // Apply period filter
    if (period) {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      where.createdAt = { gte: startDate };
    }

    const commissions = await db.commission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate summary
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0);

    // Get payout history
    const payouts = await db.payout.findMany({
      where: { expertId: queryUserId },
      orderBy: { processedAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      commissions,
      summary: {
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        commissionCount: commissions.length
      },
      payouts: {
        total: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        successful: payouts.filter(p => p.status === 'COMPLETED').length,
        failed: payouts.filter(p => p.status === 'FAILED').length
      }
    });

  } catch (error) {
    console.error('Get commissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}