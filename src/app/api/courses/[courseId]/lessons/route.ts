import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/courses/[courseId]/lessons - Get all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    const userId = request.headers.get('x-user-id') || '';

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        quiz: {
          include: {
            _count: {
              select: {
                questions: true,
                attempts: userId ? {
                  where: { userId }
                } : false
              }
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

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/lessons - Create a new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;
    const body = await request.json();
    const {
      title,
      content,
      type,
      duration,
      difficulty,
      xpReward = 10,
      isPremium = false,
      prerequisites = [],
      interactiveElements,
      embeddedVideos,
      dragDropActivities
    } = body;

    // Validate required fields
    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    // Get next order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    });

    const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content,
        type: type as any,
        order: nextOrder,
        duration: duration || 10,
        difficulty: difficulty || 'beginner',
        xpReward,
        isPremium,
        prerequisites,
        interactiveElements: interactiveElements ? JSON.stringify(interactiveElements) : null,
        embeddedVideos: embeddedVideos ? JSON.stringify(embeddedVideos) : null,
        dragDropActivities: dragDropActivities ? JSON.stringify(dragDropActivities) : null
      },
      include: {
        course: true
      }
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
