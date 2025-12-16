import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const riskLevel = searchParams.get('riskLevel');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {
      isActive: true,
      isPublic: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { expert: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (riskLevel && riskLevel !== 'all') {
      const riskLevels = riskLevel.split(',').map(Number);
      where.riskLevel = { in: riskLevels };
    }

    const templates = await db.portfolioTemplate.findMany({
      where,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true,
            rating: true
          }
        },
        _count: {
          select: {
            copies: true
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate performance metrics
    const templatesWithMetrics = await Promise.all(
      templates.map(async (template) => {
        const copies = await db.portfolioCopy.findMany({
          where: { templateId: template.id },
          include: {
            performance: true
          }
        });

        const totalCopies = copies.length;
        const avgPerformance = copies.length > 0 
          ? copies.reduce((sum, copy) => sum + (copy.performance?.totalReturn || 0), 0) / copies.length
          : 0;

        return {
          ...template,
          copies: totalCopies,
          avgPerformance,
          expert: {
            ...template.expert,
            totalEarnings: 0 // Will be calculated separately
          }
        };
      })
    );

    const total = await db.portfolioTemplate.count({ where });

    return NextResponse.json({
      templates: templatesWithMetrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get portfolio templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Verify user is an expert
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { expertProfile: true }
    });

    if (!user || !user.expertProfile || !user.expertProfile.isVerified) {
      return NextResponse.json(
        { error: 'Only verified experts can create portfolio templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      riskLevel,
      expectedReturn,
      minInvestment,
      maxInvestment,
      allocation,
      tags,
      isPublic = true
    } = body;

    // Validate required fields
    if (!name || !description || !riskLevel || !minInvestment || !allocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate allocation sums to 100%
    const totalAllocation = allocation.reduce((sum: number, item: any) => sum + item.percentage, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Allocation percentages must sum to 100%' },
        { status: 400 }
      );
    }

    const template = await db.portfolioTemplate.create({
      data: {
        name,
        description,
        category,
        riskLevel,
        expectedReturn,
        minInvestment,
        maxInvestment,
        allocation: JSON.stringify(allocation),
        tags: tags ? JSON.stringify(tags) : null,
        isPublic,
        expertId: userId
      },
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

    return NextResponse.json({
      template,
      message: 'Portfolio template created successfully'
    });

  } catch (error) {
    console.error('Create portfolio template error:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio template' },
      { status: 500 }
    );
  }
}