import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');
    const size = searchParams.get('size');
    const plan = searchParams.get('plan');

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (industry) where.industry = industry;
    if (size) where.companySize = size;
    if (plan) where.subscriptionPlan = plan;

    const [corporations, total] = await Promise.all([
      prisma.corporateClient.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              employees: true,
              courses: true,
              trainingSessions: true
            }
          },
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              department: true,
              enrolledAt: true
            },
            take: 5,
            orderBy: {
              enrolledAt: 'desc'
            }
          },
          subscription: {
            select: {
              plan: true,
              status: true,
              startDate: true,
              endDate: true,
              price: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.corporateClient.count({ where })
    ]);

    const response = {
      success: true,
      data: corporations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching corporate clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch corporate clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      industry,
      companySize,
      address,
      website,
      subscriptionPlan,
      subscriptionPrice,
      maxEmployees,
      features,
      customRequirements,
      startDate,
      endDate,
      status = 'ACTIVE'
    } = body;

    // Validate required fields
    if (!companyName || !contactPerson || !email || !industry || !subscriptionPlan) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existing = await prisma.corporateClient.findFirst({
      where: {
        OR: [
          { email },
          { companyName }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Company already registered' },
        { status: 400 }
      );
    }

    const [corporate, subscription] = await prisma.$transaction(async (tx) => {
      // Create corporate client
      const corporate = await tx.corporateClient.create({
        data: {
          companyName,
          contactPerson,
          email,
          phone,
          industry,
          companySize,
          address,
          website,
          subscriptionPlan,
          maxEmployees: maxEmployees ? parseInt(maxEmployees) : null,
          features: Array.isArray(features) ? features : [],
          customRequirements: Array.isArray(customRequirements) ? customRequirements : [],
          status
        }
      });

      // Create subscription
      const sub = await tx.corporateSubscription.create({
        data: {
          corporateClientId: corporate.id,
          plan: subscriptionPlan,
          status: 'ACTIVE',
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          price: subscriptionPrice ? parseFloat(subscriptionPrice) : null,
          autoRenew: true
        }
      });

      return [corporate, sub];
    });

    return NextResponse.json({
      success: true,
      data: {
        corporate,
        subscription
      },
      message: 'Corporate client created successfully'
    });
  } catch (error) {
    console.error('Error creating corporate client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create corporate client' },
      { status: 500 }
    );
  }
}