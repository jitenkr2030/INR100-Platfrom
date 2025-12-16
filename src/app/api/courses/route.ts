import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/courses - Get all course categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const courses = await prisma.courseCategory.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      level,
      duration,
      lessons,
      xpReward,
      importance,
      icon,
      color,
      order = 0
    } = body;

    // Validate required fields
    if (!title || !description || !category || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = await prisma.courseCategory.create({
      data: {
        title,
        description,
        category,
        level,
        duration: duration || '',
        lessons: lessons || 0,
        xpReward: xpReward || 0,
        importance: importance || 'medium',
        icon: icon || '',
        color: color || '',
        order
      }
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
