import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    
    // Filter by type
    switch (type) {
      case 'trades':
        where.orderMode = { in: ['BUY', 'SELL'] };
        break;
      case 'dividends':
        where.type = 'DIVIDEND';
        break;
      case 'sip':
        where.type = 'SIP';
        break;
      case 'withdrawals':
        where.type = 'WITHDRAWAL';
        break;
      case 'deposits':
        where.type = 'DEPOSIT';
        break;
    }

    // Filter by status
    if (status) where.status = status;

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.investmentTransaction.findMany({
        where,
        include: {
          order: {
            include: {
              asset: {
                select: {
                  name: true,
                  symbol: true,
                  type: true
                }
              }
            }
          },
          settlement: {
            select: {
              status: true,
              settledAmount: true,
              settledDate: true,
              settlementId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.investmentTransaction.count({ where })
    ]);

    // Get transaction statistics
    const stats = await getTransactionStatistics(userId, type, startDate, endDate);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      statistics: stats
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, userId, data } = body;

    switch (action) {
      case 'create_settlement':
        return await createSettlement(userId, data);
      
      case 'update_settlement_status':
        return await updateSettlementStatus(data);
      
      case 'process_dividend':
        return await processDividend(userId, data);
      
      case 'process_sip':
        return await processSIP(userId, data);
      
      case 'export_transactions':
        return await exportTransactions(userId, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Transaction action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute transaction action' },
      { status: 500 }
    );
  }
}

// Create settlement record
async function createSettlement(userId: string, data: any) {
  const { transactionId, settlementDate, amount, charges } = data;

  if (!transactionId || !amount) {
    return NextResponse.json(
      { error: 'Transaction ID and amount are required' },
      { status: 400 }
    );
  }

  const settlement = await prisma.investmentSettlement.create({
    data: {
      userId,
      transactionId,
      settlementDate: settlementDate ? new Date(settlementDate) : new Date(),
      amount: parseFloat(amount),
      charges: charges ? parseFloat(charges) : 0,
      netAmount: parseFloat(amount) - (charges ? parseFloat(charges) : 0),
      status: 'PENDING',
      createdAt: new Date()
    }
  });

  // Update transaction status
  await prisma.investmentTransaction.update({
    where: { id: transactionId },
    data: {
      status: 'PENDING_SETTLEMENT',
      settlementId: settlement.id
    }
  });

  return NextResponse.json({
    success: true,
    settlement,
    message: 'Settlement created successfully'
  });
}

// Update settlement status
async function updateSettlementStatus(data: any) {
  const { settlementId, status, settledAmount, settledDate, remarks } = data;

  if (!settlementId || !status) {
    return NextResponse.json(
      { error: 'Settlement ID and status are required' },
      { status: 400 }
    );
  }

  const updatedSettlement = await prisma.investmentSettlement.update({
    where: { id: settlementId },
    data: {
      status,
      settledAmount: settledAmount ? parseFloat(settledAmount) : null,
      settledDate: settledDate ? new Date(settledDate) : null,
      remarks,
      updatedAt: new Date()
    }
  });

  // Update related transaction status
  const transaction = await prisma.investmentTransaction.findFirst({
    where: { settlementId }
  });

  if (transaction) {
    const newTransactionStatus = status === 'COMPLETED' ? 'SETTLED' : 'SETTLEMENT_FAILED';
    
    await prisma.investmentTransaction.update({
      where: { id: transaction.id },
      data: { status: newTransactionStatus }
    });
  }

  return NextResponse.json({
    success: true,
    settlement: updatedSettlement,
    message: `Settlement ${status.toLowerCase()} successfully`
  });
}

// Process dividend
async function processDividend(userId: string, data: any) {
  const { assetId, dividendPerShare, recordDate, paymentDate } = data;

  if (!assetId || !dividendPerShare) {
    return NextResponse.json(
      { error: 'Asset ID and dividend per share are required' },
      { status: 400 }
    );
  }

  // Get user's holding for this asset
  const holding = await prisma.portfolioHolding.findFirst({
    where: { userId, assetId }
  });

  if (!holding) {
    return NextResponse.json(
      { error: 'No holding found for this asset' },
      { status: 404 }
    );
  }

  const totalDividend = holding.quantity * parseFloat(dividendPerShare);
  const tds = totalDividend * 0.1; // 10% TDS
  const netDividend = totalDividend - tds;

  // Create dividend transaction
  const dividendTransaction = await prisma.investmentTransaction.create({
    data: {
      userId,
      assetId,
      type: 'DIVIDEND',
      orderMode: 'RECEIVE',
      quantity: holding.quantity,
      price: parseFloat(dividendPerShare),
      totalAmount: totalDividend,
      brokerage: 0,
      netAmount: netDividend,
      tds: tds,
      status: 'PENDING',
      recordDate: recordDate ? new Date(recordDate) : null,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      createdAt: new Date()
    }
  });

  // Create dividend settlement
  const settlement = await prisma.investmentSettlement.create({
    data: {
      userId,
      transactionId: dividendTransaction.id,
      settlementDate: paymentDate ? new Date(paymentDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      amount: netDividend,
      charges: 0,
      netAmount: netDividend,
      status: 'PENDING',
      createdAt: new Date()
    }
  });

  // Update dividend transaction
  await prisma.investmentTransaction.update({
    where: { id: dividendTransaction.id },
    data: { settlementId: settlement.id }
  });

  return NextResponse.json({
    success: true,
    transaction: dividendTransaction,
    settlement,
    message: 'Dividend processed successfully'
  });
}

// Process SIP
async function processSIP(userId: string, data: any) {
  const { sipId, amount, nav } = data;

  if (!sipId || !amount || !nav) {
    return NextResponse.json(
      { error: 'SIP ID, amount, and NAV are required' },
      { status: 400 }
    );
  }

  // Get SIP details
  const sip = await prisma.sIP.findFirst({
    where: { id: sipId, userId }
  });

  if (!sip) {
    return NextResponse.json(
      { error: 'SIP not found' },
      { status: 404 }
    );
  }

  const units = parseFloat(amount) / parseFloat(nav);
  const brokerage = Math.max(parseFloat(amount) * 0.001, 20); // 0.1% or minimum ₹20
  const netAmount = parseFloat(amount) - brokerage;

  // Create SIP transaction
  const sipTransaction = await prisma.investmentTransaction.create({
    data: {
      userId,
      assetId: sip.assetId,
      type: 'SIP',
      orderMode: 'BUY',
      quantity: units,
      price: parseFloat(nav),
      totalAmount: parseFloat(amount),
      brokerage: brokerage,
      netAmount: netAmount,
      status: 'COMPLETED',
      createdAt: new Date()
    }
  });

  // Update portfolio holding
  const existingHolding = await prisma.portfolioHolding.findFirst({
    where: { userId, assetId: sip.assetId }
  });

  if (existingHolding) {
    const newQuantity = existingHolding.quantity + units;
    const newAvgPrice = ((existingHolding.quantity * existingHolding.avgPrice) + (units * parseFloat(nav))) / newQuantity;
    
    await prisma.portfolioHolding.update({
      where: { id: existingHolding.id },
      data: {
        quantity: newQuantity,
        avgPrice: newAvgPrice,
        totalInvested: newQuantity * newAvgPrice,
        updatedAt: new Date()
      }
    });
  } else {
    await prisma.portfolioHolding.create({
      data: {
        userId,
        assetId: sip.assetId,
        quantity: units,
        avgPrice: parseFloat(nav),
        totalInvested: units * parseFloat(nav),
        createdAt: new Date()
      }
    });
  }

  // Update SIP record
  await prisma.sIP.update({
    where: { id: sipId },
    data: {
      lastInstallmentDate: new Date(),
      totalAmount: sip.totalAmount + parseFloat(amount),
      totalUnits: sip.totalUnits + units,
      installmentsCompleted: sip.installmentsCompleted + 1
    }
  });

  return NextResponse.json({
    success: true,
    transaction: sipTransaction,
    units: units,
    message: 'SIP installment processed successfully'
  });
}

// Export transactions
async function exportTransactions(userId: string, data: any) {
  const { type, startDate, endDate, format } = data;

  const where: any = { userId };
  
  if (type && type !== 'all') {
    switch (type) {
      case 'trades':
        where.orderMode = { in: ['BUY', 'SELL'] };
        break;
      case 'dividends':
        where.type = 'DIVIDEND';
        break;
    }
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const transactions = await prisma.investmentTransaction.findMany({
    where,
    include: {
      order: {
        include: {
          asset: {
            select: {
              name: true,
              symbol: true,
              type: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format data for export
  const exportData = transactions.map(tx => ({
    'Transaction ID': tx.id,
    'Date': tx.createdAt.toISOString().split('T')[0],
    'Type': tx.type,
    'Asset': tx.order?.asset?.name || tx.assetId,
    'Symbol': tx.order?.asset?.symbol || tx.assetId,
    'Mode': tx.orderMode,
    'Quantity': tx.quantity,
    'Price': tx.price,
    'Total Amount': tx.totalAmount,
    'Brokerage': tx.brokerage,
    'Net Amount': tx.netAmount,
    'Status': tx.status,
    'TDS': tx.tds || 0
  }));

  return NextResponse.json({
    success: true,
    data: exportData,
    totalRecords: exportData.length,
    exportDate: new Date().toISOString()
  });
}

// Helper functions
async function getTransactionStatistics(userId: string, type: string, startDate?: string, endDate?: string) {
  const where: any = { userId };
  
  // Apply type filter
  switch (type) {
    case 'trades':
      where.orderMode = { in: ['BUY', 'SELL'] };
      break;
    case 'dividends':
      where.type = 'DIVIDEND';
      break;
    case 'sip':
      where.type = 'SIP';
      break;
  }

  // Apply date filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [
    totalTransactions,
    totalAmount,
    buyTransactions,
    sellTransactions,
    dividendTransactions,
    sipTransactions,
    pendingTransactions,
    completedTransactions
  ] = await Promise.all([
    prisma.investmentTransaction.count({ where }),
    
    prisma.investmentTransaction.aggregate({
      where,
      _sum: { netAmount: true }
    }),
    
    prisma.investmentTransaction.count({
      where: { ...where, orderMode: 'BUY' }
    }),
    
    prisma.investmentTransaction.count({
      where: { ...where, orderMode: 'SELL' }
    }),
    
    prisma.investmentTransaction.count({
      where: { ...where, type: 'DIVIDEND' }
    }),
    
    prisma.investmentTransaction.count({
      where: { ...where, type: 'SIP' }
    }),
    
    prisma.investmentTransaction.count({
      where: { ...where, status: 'PENDING' }
    }),
    
    prisma.investmentTransaction.count({
      where: { ...where, status: 'COMPLETED' }
    })
  ]);

  return {
    totalTransactions,
    totalAmount: totalAmount._sum.netAmount || 0,
    buyTransactions,
    sellTransactions,
    dividendTransactions,
    sipTransactions,
    pendingTransactions,
    completedTransactions,
    successRate: totalTransactions > 0 ? (completedTransactions / totalTransactions * 100).toFixed(2) : 0
  };
}

// Settlement status tracking
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settlementId, action, userId } = body;

    if (!settlementId || !action) {
      return NextResponse.json(
        { error: 'Settlement ID and action are required' },
        { status: 400 }
      );
    }

    const settlement = await prisma.investmentSettlement.findFirst({
      where: { id: settlementId, userId }
    });

    if (!settlement) {
      return NextResponse.json(
        { error: 'Settlement not found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'mark_settled':
        result = await markSettlementCompleted(settlement);
        break;
      
      case 'mark_failed':
        result = await markSettlementFailed(settlement, body.reason);
        break;
      
      case 'schedule':
        result = await scheduleSettlement(settlement, body.scheduledDate);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      settlement: result,
      message: `Settlement ${action} successfully`
    });
  } catch (error) {
    console.error('Settlement update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settlement' },
      { status: 500 }
    );
  }
}

async function markSettlementCompleted(settlement: any) {
  const updatedSettlement = await prisma.investmentSettlement.update({
    where: { id: settlement.id },
    data: {
      status: 'COMPLETED',
      settledAmount: settlement.netAmount,
      settledDate: new Date(),
      updatedAt: new Date()
    }
  });

  // Update related transaction
  if (settlement.transactionId) {
    await prisma.investmentTransaction.update({
      where: { id: settlement.transactionId },
      data: { status: 'SETTLED' }
    });
  }

  return updatedSettlement;
}

async function markSettlementFailed(settlement: any, reason: string) {
  const updatedSettlement = await prisma.investmentSettlement.update({
    where: { id: settlement.id },
    data: {
      status: 'FAILED',
      remarks: reason,
      updatedAt: new Date()
    }
  });

  // Update related transaction
  if (settlement.transactionId) {
    await prisma.investmentTransaction.update({
      where: { id: settlement.transactionId },
      data: { status: 'SETTLEMENT_FAILED' }
    });
  }

  return updatedSettlement;
}

async function scheduleSettlement(settlement: any, scheduledDate: string) {
  const updatedSettlement = await prisma.investmentSettlement.update({
    where: { id: settlement.id },
    data: {
      settlementDate: new Date(scheduledDate),
      status: 'SCHEDULED',
      updatedAt: new Date()
    }
  });

  // Update related transaction
  if (settlement.transactionId) {
    await prisma.investmentTransaction.update({
      where: { id: settlement.transactionId },
      data: { status: 'PENDING_SETTLEMENT' }
    });
  }

  return updatedSettlement;
}