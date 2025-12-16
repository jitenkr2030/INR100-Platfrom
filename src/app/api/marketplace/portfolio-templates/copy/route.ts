import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, initialInvestment } = body;

    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    if (!templateId || !initialInvestment) {
      return NextResponse.json(
        { error: 'Template ID and initial investment are required' },
        { status: 400 }
      );
    }

    // Get the template
    const template = await db.portfolioTemplate.findUnique({
      where: { id: templateId },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    if (!template || !template.isActive || !template.isPublic) {
      return NextResponse.json(
        { error: 'Portfolio template not found or inactive' },
        { status: 404 }
      );
    }

    // Check minimum investment requirement
    if (initialInvestment < template.minInvestment) {
      return NextResponse.json(
        { error: `Minimum investment required is ₹${template.minInvestment.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Check if user already has a copy of this template
    const existingCopy = await db.portfolioCopy.findFirst({
      where: {
        templateId,
        userId,
        status: 'ACTIVE'
      }
    });

    if (existingCopy) {
      return NextResponse.json(
        { error: 'You already have an active copy of this portfolio' },
        { status: 400 }
      );
    }

    // Check user's wallet balance
    const userWallet = await db.wallet.findUnique({
      where: { userId }
    });

    if (!userWallet || userWallet.balance < initialInvestment) {
      return NextResponse.json(
        { error: 'Insufficient balance to copy this portfolio' },
        { status: 400 }
      );
    }

    // Parse allocation
    const allocation = JSON.parse(template.allocation);

    // Create portfolio copy
    const portfolioCopy = await db.portfolioCopy.create({
      data: {
        userId,
        templateId,
        initialInvestment,
        currentValue: initialInvestment,
        status: 'ACTIVE',
        copyDate: new Date()
      }
    });

    // Create individual holdings based on allocation
    const holdings = allocation.map((item: any) => ({
      portfolioCopyId: portfolioCopy.id,
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      quantity: (initialInvestment * item.percentage / 100) / (item.currentPrice || 100), // Simplified calculation
      averagePrice: item.currentPrice || 100,
      currentPrice: item.currentPrice || 100,
      totalValue: (initialInvestment * item.percentage / 100),
      allocation: item.percentage,
      purchaseDate: new Date()
    }));

    await db.portfolioHolding.createMany({
      data: holdings
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        userId,
        type: 'INVESTMENT',
        amount: -initialInvestment,
        currency: 'INR',
        status: 'COMPLETED',
        reference: portfolioCopy.id,
        description: `Copied portfolio: ${template.name}`
      }
    });

    // Deduct from user's wallet
    await db.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: initialInvestment
        }
      }
    });

    // Create commission for expert
    const commissionRate = 0.02; // 2% commission on portfolio copy
    const commissionAmount = initialInvestment * commissionRate;

    await db.commission.create({
      data: {
        userId: template.expertId,
        partnerId: userId,
        type: 'PORTFOLIO_COPY',
        amount: commissionAmount,
        currency: 'INR',
        percentage: commissionRate * 100,
        reference: portfolioCopy.id,
        description: `Commission from portfolio copy: ${template.name}`,
        status: 'PENDING'
      }
    });

    // Create performance tracking record
    await db.portfolioPerformance.create({
      data: {
        portfolioCopyId: portfolioCopy.id,
        totalReturn: 0,
        percentageReturn: 0,
        benchmarkReturn: 0,
        alpha: 0,
        beta: 1,
        sharpeRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        trackingDate: new Date()
      }
    });

    // Update template copy count
    await db.portfolioTemplate.update({
      where: { id: templateId },
      data: {
        copies: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      message: 'Portfolio copied successfully',
      portfolioCopy: {
        id: portfolioCopy.id,
        templateName: template.name,
        initialInvestment,
        currentValue: initialInvestment,
        copyDate: portfolioCopy.copyDate,
        status: portfolioCopy.status
      },
      expert: template.expert,
      commission: {
        expertShare: commissionAmount,
        rate: commissionRate * 100
      }
    });

  } catch (error) {
    console.error('Copy portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to copy portfolio' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const portfolioCopies = await db.portfolioCopy.findMany({
      where: { userId: targetUserId },
      include: {
        template: {
          include: {
            expert: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        performance: true,
        holdings: {
          orderBy: { totalValue: 'desc' }
        }
      },
      orderBy: { copyDate: 'desc' }
    });

    return NextResponse.json({
      portfolioCopies,
      summary: {
        totalCopies: portfolioCopies.length,
        totalInvestment: portfolioCopies.reduce((sum, copy) => sum + copy.initialInvestment, 0),
        currentValue: portfolioCopies.reduce((sum, copy) => sum + copy.currentValue, 0)
      }
    });

  } catch (error) {
    console.error('Get portfolio copies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio copies' },
      { status: 500 }
    );
  }
}