import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const featured = searchParams.get('featured') === 'true';
    const access = searchParams.get('access');

    const skip = (page - 1) * limit;
    const where: any = {
      isActive: true
    };

    if (category) where.category = category;
    if (type) where.resourceType = type;
    if (difficulty) where.difficultyLevel = difficulty;
    if (featured) where.isFeatured = true;
    if (access) where.accessLevel = access;

    const [resources, total] = await Promise.all([
      prisma.premiumResource.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profile: {
                select: {
                  specialization: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              downloads: true,
              ratings: true
            }
          },
          ratings: {
            select: {
              rating: true,
              comment: true
            },
            take: 3,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.premiumResource.count({ where })
    ]);

    const response = {
      success: true,
      data: resources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching premium resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch premium resources' },
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
      resourceType,
      difficultyLevel,
      accessLevel,
      content,
      fileUrl,
      thumbnail,
      tags,
      duration,
      fileSize,
      language,
      createdById,
      isActive = true,
      isFeatured = false
    } = body;

    // Validate required fields
    if (!title || !description || !category || !resourceType || !accessLevel || !createdById) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if creator exists
    const creator = await prisma.user.findUnique({
      where: { id: createdById }
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Invalid creator ID' },
        { status: 400 }
      );
    }

    const resource = await prisma.premiumResource.create({
      data: {
        title,
        description,
        category,
        resourceType,
        difficultyLevel,
        accessLevel,
        content: typeof content === 'object' ? content : {},
        fileUrl,
        thumbnail,
        tags: Array.isArray(tags) ? tags : [],
        duration: duration ? parseInt(duration) : null,
        fileSize: fileSize ? parseInt(fileSize) : null,
        language: language || 'en',
        createdById,
        isActive,
        isFeatured
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                specialization: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: resource,
      message: 'Premium resource created successfully'
    });
  } catch (error) {
    console.error('Error creating premium resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create premium resource' },
      { status: 500 }
    );
  }
}