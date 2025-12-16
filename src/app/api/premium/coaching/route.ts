import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const featured = searchParams.get('featured') === 'true';

    const skip = (page - 1) * limit;
    const where: any = {
      isActive: true
    };

    if (category) where.category = category;
    if (difficulty) where.difficultyLevel = difficulty;
    if (featured) where.isFeatured = true;
    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseFloat(priceMin);
      if (priceMax) where.price.lte = parseFloat(priceMax);
    }

    const [coaching, total] = await Promise.all([
      prisma.premiumCoaching.findMany({
        where,
        skip,
        take: limit,
        include: {
          coach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  bio: true,
                  specialization: true,
                  experience: true,
                  rating: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              sessions: true,
              enrollments: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.premiumCoaching.count({ where })
    ]);

    const response = {
      success: true,
      data: coaching,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coaching:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coaching' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      difficultyLevel,
      price,
      duration,
      maxParticipants,
      coachId,
      topics,
      learningObjectives,
      prerequisites,
      materials,
      schedule,
      isActive = true,
      isFeatured = false
    } = body;

    // Validate required fields
    if (!title || !description || !category || !difficultyLevel || !price || !duration || !coachId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if coach exists
    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'EXPERT') {
      return NextResponse.json(
        { success: false, error: 'Invalid coach ID' },
        { status: 400 }
      );
    }

    const coaching = await prisma.premiumCoaching.create({
      data: {
        title,
        description,
        category,
        difficultyLevel,
        price: parseFloat(price),
        duration: parseInt(duration),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        coachId,
        topics: Array.isArray(topics) ? topics : [],
        learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
        prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
        materials: Array.isArray(materials) ? materials : [],
        schedule: typeof schedule === 'object' ? schedule : {},
        isActive,
        isFeatured
      },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                bio: true,
                specialization: true,
                experience: true,
                rating: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: coaching,
      message: 'Coaching program created successfully'
    });
  } catch (error) {
    console.error('Error creating coaching:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coaching program' },
      { status: 500 }
    );
  }
}