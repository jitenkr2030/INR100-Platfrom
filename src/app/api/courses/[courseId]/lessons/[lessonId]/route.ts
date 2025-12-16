import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/courses/[courseId]/lessons/[lessonId] - Get specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const { courseId, lessonId } = params;
    const userId = request.headers.get('x-user-id') || '';

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId
      },
      include: {
        course: true,
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        },
        ...(userId && {
          progress: {
            where: { userId }
          }
        })
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Get user's progress for this lesson
    let userProgress = null;
    if (userId) {
      userProgress = await prisma.userLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      });

      // If no progress record exists, create one
      if (!userProgress) {
        userProgress = await prisma.userLessonProgress.create({
          data: {
            userId,
            lessonId,
            status: 'NOT_STARTED'
          }
        });
      }
    }

    // Get next and previous lessons
    const [nextLesson, prevLesson] = await Promise.all([
      prisma.lesson.findFirst({
        where: {
          courseId,
          order: { gt: lesson.order }
        },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true }
      }),
      prisma.lesson.findFirst({
        where: {
          courseId,
          order: { lt: lesson.order }
        },
        orderBy: { order: 'desc' },
        select: { id: true, title: true, order: true }
      })
    ]);

    // Parse JSON fields
    const parsedLesson = {
      ...lesson,
      interactiveElements: lesson.interactiveElements ? JSON.parse(lesson.interactiveElements) : null,
      embeddedVideos: lesson.embeddedVideos ? JSON.parse(lesson.embeddedVideos) : null,
      dragDropActivities: lesson.dragDropActivities ? JSON.parse(lesson.dragDropActivities) : null
    };

    return NextResponse.json({
      lesson: parsedLesson,
      userProgress,
      nextLesson,
      prevLesson
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/lessons/[lessonId] - Update lesson progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const { courseId, lessonId } = params;
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { action, timeSpent, quizScore } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Get current progress
    let progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (!progress) {
      progress = await prisma.userLessonProgress.create({
        data: {
          userId,
          lessonId,
          status: 'NOT_STARTED'
        }
      });
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    if (action === 'start') {
      updateData.status = 'IN_PROGRESS';
    }

    if (action === 'progress') {
      updateData.status = 'IN_PROGRESS';
      if (timeSpent) {
        updateData.timeSpent = progress.timeSpent + timeSpent;
      }
      if (quizScore) {
        updateData.quizScore = quizScore;
      }
    }

    if (action === 'complete') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
      if (timeSpent) {
        updateData.timeSpent = progress.timeSpent + timeSpent;
      }
      if (quizScore) {
        updateData.quizScore = quizScore;
      }
    }

    const updatedProgress = await prisma.userLessonProgress.update({
      where: { id: progress.id },
      data: updateData
    });

    // If lesson completed, check if we need to update course progress
    if (action === 'complete') {
      // Get all lessons in the course
      const allLessons = await prisma.lesson.findMany({
        where: { courseId }
      });

      // Get all completed lessons
      const completedLessons = await prisma.userLessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: allLessons.map(l => l.id) },
          status: 'COMPLETED'
        }
      });

      // Calculate course progress
      const courseProgress = (completedLessons.length / allLessons.length) * 100;

      // Update course enrollment
      await prisma.courseEnrollment.updateMany({
        where: {
          userId,
          courseId
        },
        data: {
          progress: courseProgress
        }
      });
    }

    return NextResponse.json({ progress: updatedProgress });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson progress' },
      { status: 500 }
    );
  }
}
