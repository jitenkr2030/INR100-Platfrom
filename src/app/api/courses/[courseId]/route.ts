import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/courses/[courseId] - Get course details with lessons
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    const userId = request.headers.get('x-user-id') || '';

    const course = await prisma.courseCategory.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                progress: userId ? {
                  where: { userId }
                } : false
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: {
              where: userId ? { userId } : false
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled
    let enrollment = null;
    if (userId) {
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });
    }

    // Get user's progress if enrolled
    let lessonProgress = [];
    if (userId && enrollment) {
      lessonProgress = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          lessonId: {
            in: course.lessons.map(l => l.id)
          }
        }
      });
    }

    return NextResponse.json({
      course,
      enrollment,
      lessonProgress
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId] - Enroll in course
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check if course exists
    const course = await prisma.courseCategory.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        enrolledAt: new Date()
      }
    });

    // Initialize lesson progress for all lessons
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    });

    if (lessons.length > 0) {
      await prisma.userLessonProgress.createMany({
        data: lessons.map(lesson => ({
          userId,
          lessonId: lesson.id,
          status: 'NOT_STARTED' as any
        }))
      });
    }

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId] - Update course progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Find enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // Mark course as started
      const updatedEnrollment = await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          startedAt: new Date()
        }
      });

      return NextResponse.json({ enrollment: updatedEnrollment });
    }

    if (action === 'complete') {
      // Mark course as completed
      const lessons = await prisma.lesson.findMany({
        where: { courseId }
      });

      const completedLessons = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: lessons.map(l => l.id) },
          status: 'COMPLETED'
        }
      });

      // Check if all lessons are completed
      if (completedLessons.length === lessons.length) {
        const updatedEnrollment = await prisma.courseEnrollment.update({
          where: { id: enrollment.id },
          data: {
            completedAt: new Date(),
            progress: 100
          }
        });

        return NextResponse.json({ enrollment: updatedEnrollment });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating course progress:', error);
    return NextResponse.json(
      { error: 'Failed to update course progress' },
      { status: 500 }
    );
  }
}
