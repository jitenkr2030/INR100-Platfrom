import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/premium/courses - Get premium courses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {
      isActive: true,
      isPublished: true
    };

    if (category) whereClause.category = category;
    if (level) whereClause.level = level;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructorName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const courses = await prisma.premiumCourse.findMany({
      where: whereClause,
      include: {
        enrollments: user ? {
          where: { userId: user.id }
        } : false,
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            resources: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { featured ? { enrollments: { _count: 'desc' } } : {} }
      ],
      take: limit,
      skip: offset
    });

    const coursesWithEnrollment = courses.map(course => ({
      ...course,
      isEnrolled: user ? course.enrollments.length > 0 : false,
      enrollmentCount: course._count.enrollments,
      sessionCount: course._count.sessions,
      resourceCount: course._count.resources
    }));

    const total = await prisma.premiumCourse.count({ where: whereClause });

    return NextResponse.json({
      courses: coursesWithEnrollment,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching premium courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium courses' },
      { status: 500 }
    );
  }
}

// POST /api/premium/courses - Create premium course (instructor/admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    // This would be implemented based on your user role system

    const body = await request.json();
    const {
      title,
      description,
      category,
      level,
      price,
      originalPrice,
      duration,
      lessons,
      instructorName,
      instructorBio,
      thumbnailUrl,
      trailerUrl,
      tags,
      prerequisites,
      learningOutcomes,
      certificateIncluded
    } = body;

    if (!title || !description || !category || !level) {
      return NextResponse.json(
        { error: 'Title, description, category, and level are required' },
        { status: 400 }
      );
    }

    const premiumCourse = await prisma.premiumCourse.create({
      data: {
        title,
        description,
        category,
        level,
        price: price || 0,
        originalPrice,
        duration: duration || 0,
        lessons: lessons || 0,
        instructorId: user.id,
        instructorName: instructorName || user.name,
        instructorBio,
        thumbnailUrl,
        trailerUrl,
        tags: tags ? JSON.stringify(tags) : null,
        prerequisites: prerequisites ? JSON.stringify(prerequisites) : null,
        learningOutcomes: learningOutcomes ? JSON.stringify(learningOutcomes) : null,
        certificateIncluded: certificateIncluded || false
      }
    });

    return NextResponse.json({
      course: premiumCourse,
      message: 'Premium course created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating premium course:', error);
    return NextResponse.json(
      { error: 'Failed to create premium course' },
      { status: 500 }
    );
  }
}

// GET /api/premium/courses/[id] - Get specific premium course
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const { id } = params;

    const course = await prisma.premiumCourse.findUnique({
      where: { id },
      include: {
        enrollments: user ? {
          where: { userId: user.id }
        } : false,
        sessions: {
          where: { status: { in: ['SCHEDULED', 'LIVE'] } },
          orderBy: { scheduledAt: 'asc' },
          take: 5
        },
        resources: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            resources: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const isEnrolled = user ? course.enrollments.length > 0 : false;

    return NextResponse.json({
      course: {
        ...course,
        isEnrolled,
        enrollmentCount: course._count.enrollments,
        sessionCount: course._count.sessions,
        resourceCount: course._count.resources
      }
    });

  } catch (error) {
    console.error('Error fetching premium course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium course' },
      { status: 500 }
    );
  }
}

// POST /api/premium/courses/[id]/enroll - Enroll in premium course
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if course exists
    const course = await prisma.premiumCourse.findUnique({
      where: { id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.premiumEnrollment.findUnique({
      where: {
        userId_premiumCourseId: {
          userId: user.id,
          premiumCourseId: id
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Check enrollment limit
    if (course.enrollmentLimit) {
      const currentEnrollments = await prisma.premiumEnrollment.count({
        where: { premiumCourseId: id }
      });

      if (currentEnrollments >= course.enrollmentLimit) {
        return NextResponse.json(
          { error: 'Course enrollment limit reached' },
          { status: 400 }
        );
      }
    }

    const enrollment = await prisma.premiumEnrollment.create({
      data: {
        userId: user.id,
        premiumCourseId: id,
        paymentStatus: course.price > 0 ? 'PENDING' : 'COMPLETED'
      }
    });

    return NextResponse.json({
      enrollment,
      message: 'Successfully enrolled in course'
    }, { status: 201 });

  } catch (error) {
    console.error('Error enrolling in premium course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// PUT /api/premium/courses/[id]/progress - Update course progress
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { progress } = body;

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.premiumEnrollment.findUnique({
      where: {
        userId_premiumCourseId: {
          userId: user.id,
          premiumCourseId: id
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    const updatedEnrollment = await prisma.premiumEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progress,
        lastAccessedAt: new Date(),
        completedAt: progress === 100 ? new Date() : null,
        certificateIssued: progress === 100 ? true : enrollment.certificateIssued
      }
    });

    return NextResponse.json({
      enrollment: updatedEnrollment,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating course progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}