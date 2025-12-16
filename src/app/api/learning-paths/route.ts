import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const pathId = searchParams.get('pathId');
    const isActive = searchParams.get('isActive') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (pathId) {
      // Get specific learning path with details
      const learningPath = await prisma.learningPath.findUnique({
        where: { id: pathId },
        include: {
          profile: true,
          pathItems: {
            include: {
              lesson: {
                include: {
                  course: true
                }
              },
              course: true
            },
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      if (!learningPath) {
        return NextResponse.json(
          { error: 'Learning path not found' },
          { status: 404 }
        );
      }

      // Calculate progress
      const totalItems = learningPath.pathItems.length;
      const completedItems = learningPath.pathItems.filter(item => item.isCompleted).length;
      const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return NextResponse.json({
        ...learningPath,
        progress: progressPercentage,
        stats: {
          totalItems,
          completedItems,
          remainingItems: totalItems - completedItems,
          estimatedTimeRemaining: calculateEstimatedTime(learningPath.pathItems.filter(item => !item.isCompleted))
        }
      });
    } else {
      // Get user's learning paths
      const whereClause: any = { userId };
      if (isActive !== null) {
        whereClause.isActive = isActive;
      }

      const learningPaths = await prisma.learningPath.findMany({
        where: whereClause,
        include: {
          profile: true,
          pathItems: {
            select: {
              id: true,
              isCompleted: true,
              score: true,
              timeSpent: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const pathsWithProgress = learningPaths.map(path => {
        const totalItems = path.pathItems.length;
        const completedItems = path.pathItems.filter(item => item.isCompleted).length;
        const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        return {
          ...path,
          progress: progressPercentage,
          stats: {
            totalItems,
            completedItems,
            remainingItems: totalItems - completedItems,
            averageScore: calculateAverageScore(path.pathItems)
          }
        };
      });

      return NextResponse.json({
        paths: pathsWithProgress
      });
    }

  } catch (error) {
    console.error('Learning paths fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning paths' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      title, 
      description, 
      goal, 
      targetDuration, 
      lessonIds = [],
      courseIds = [],
      profileId 
    } = body;

    if (!userId || !title || !goal) {
      return NextResponse.json(
        { error: 'User ID, title, and goal are required' },
        { status: 400 }
      );
    }

    // Get or create learning profile
    let learningProfile;
    if (profileId) {
      learningProfile = await prisma.learningProfile.findUnique({
        where: { id: profileId }
      });
    } else {
      learningProfile = await prisma.learningProfile.findUnique({
        where: { userId }
      });
    }

    if (!learningProfile) {
      // Create default learning profile
      learningProfile = await prisma.learningProfile.create({
        data: {
          userId
        }
      });
    }

    // Create learning path
    const learningPath = await prisma.learningPath.create({
      data: {
        userId,
        profileId: learningProfile.id,
        title,
        description,
        goal,
        targetDuration,
        startedAt: new Date()
      }
    });

    // Add lessons to path
    let order = 0;
    const pathItems = [];

    // Add lessons
    for (const lessonId of lessonIds) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true }
      });

      if (lesson) {
        const pathItem = await prisma.learningPathItem.create({
          data: {
            pathId: learningPath.id,
            lessonId: lesson.id,
            order: order++
          }
        });
        pathItems.push(pathItem);
      }
    }

    // Add courses
    for (const courseId of courseIds) {
      const course = await prisma.courseCategory.findUnique({
        where: { id: courseId }
      });

      if (course) {
        const pathItem = await prisma.learningPathItem.create({
          data: {
            pathId: learningPath.id,
            courseId: course.id,
            order: order++
          }
        });
        pathItems.push(pathItem);
      }
    }

    return NextResponse.json({
      success: true,
      path: learningPath,
      pathItems,
      message: 'Learning path created successfully'
    });

  } catch (error) {
    console.error('Learning path creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create learning path' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      pathId, 
      title, 
      description, 
      goal, 
      targetDuration,
      isCompleted,
      progress 
    } = body;

    if (!pathId) {
      return NextResponse.json(
        { error: 'Path ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (goal !== undefined) updateData.goal = goal;
    if (targetDuration !== undefined) updateData.targetDuration = targetDuration;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }
    if (progress !== undefined) updateData.progress = progress;

    const updatedPath = await prisma.learningPath.update({
      where: { id: pathId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      path: updatedPath,
      message: 'Learning path updated successfully'
    });

  } catch (error) {
    console.error('Learning path update error:', error);
    return NextResponse.json(
      { error: 'Failed to update learning path' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');

    if (!pathId) {
      return NextResponse.json(
        { error: 'Path ID is required' },
        { status: 400 }
      );
    }

    // Delete path items first
    await prisma.learningPathItem.deleteMany({
      where: { pathId }
    });

    // Delete the learning path
    await prisma.learningPath.delete({
      where: { id: pathId }
    });

    return NextResponse.json({
      success: true,
      message: 'Learning path deleted successfully'
    });

  } catch (error) {
    console.error('Learning path deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete learning path' },
      { status: 500 }
    );
  }
}

// Additional endpoint for path progress updates
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pathId, itemId, data } = body;

    if (!action || !pathId) {
      return NextResponse.json(
        { error: 'Action and path ID are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update_item_progress':
        return await updateItemProgress(itemId, data);
      
      case 'complete_item':
        return await completeItem(itemId, data);
      
      case 'generate_recommendations':
        return await generateRecommendations(pathId);
      
      case 'get_analytics':
        return await getPathAnalytics(pathId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Learning path action error:', error);
    return NextResponse.json(
      { error: 'Failed to process learning path action' },
      { status: 500 }
    );
  }
}

async function updateItemProgress(itemId: string, data: any) {
  try {
    const { score, timeSpent, completed } = data;

    const updateData: any = {};
    if (score !== undefined) updateData.score = score;
    if (timeSpent !== undefined) updateData.timeSpent = timeSpent;
    if (completed !== undefined) {
      updateData.isCompleted = completed;
      if (completed) {
        updateData.completedAt = new Date();
      }
    }

    const updatedItem = await prisma.learningPathItem.update({
      where: { id: itemId },
      data: updateData
    });

    // Update overall path progress
    await updatePathProgress(updatedItem.pathId);

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: 'Item progress updated successfully'
    });

  } catch (error) {
    console.error('Update item progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update item progress' },
      { status: 500 }
    );
  }
}

async function completeItem(itemId: string, data: any) {
  try {
    const { score, timeSpent } = data || {};

    const updatedItem = await prisma.learningPathItem.update({
      where: { id: itemId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        score: score || null,
        timeSpent: timeSpent || null
      }
    });

    // Update overall path progress
    await updatePathProgress(updatedItem.pathId);

    // Award XP for completion
    if (updatedItem.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: updatedItem.lessonId }
      });
      
      if (lesson) {
        await awardXpForCompletion(updatedItem.pathId, lesson.xpReward);
      }
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: 'Item completed successfully'
    });

  } catch (error) {
    console.error('Complete item error:', error);
    return NextResponse.json(
      { error: 'Failed to complete item' },
      { status: 500 }
    );
  }
}

async function generateRecommendations(pathId: string) {
  try {
    const path = await prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        profile: true,
        user: true
      }
    });

    if (!path) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Generate recommendations based on learning profile and progress
    const recommendations = await generateSmartRecommendations(path.profile, path.user.id);

    return NextResponse.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Generate recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function getPathAnalytics(pathId: string) {
  try {
    const path = await prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        pathItems: {
          include: {
            lesson: true,
            course: true
          }
        }
      }
    });

    if (!path) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    const analytics = calculatePathAnalytics(path);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get path analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get path analytics' },
      { status: 500 }
    );
  }
}

async function updatePathProgress(pathId: string) {
  const pathItems = await prisma.learningPathItem.findMany({
    where: { pathId }
  });

  const totalItems = pathItems.length;
  const completedItems = pathItems.filter(item => item.isCompleted).length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  await prisma.learningPath.update({
    where: { id: pathId },
    data: {
      progress: progressPercentage,
      isCompleted: progressPercentage === 100,
      completedAt: progressPercentage === 100 ? new Date() : null
    }
  });
}

async function awardXpForCompletion(pathId: string, xpReward: number) {
  try {
    const path = await prisma.learningPath.findUnique({
      where: { id: pathId }
    });

    if (path) {
      await prisma.userXpTransaction.create({
        data: {
          userId: path.userId,
          type: 'LESSON_COMPLETED',
          amount: xpReward,
          source: 'LEARNING_PATH',
          referenceId: pathId,
          description: `Completed lesson in learning path: ${path.title}`
        }
      });
    }
  } catch (error) {
    console.error('Award XP error:', error);
  }
}

async function generateSmartRecommendations(profile: any, userId: string) {
  // This would implement sophisticated recommendation logic
  // For now, return placeholder recommendations
  return [
    {
      type: 'lesson',
      id: 'lesson-1',
      title: 'Advanced Technical Analysis',
      reason: 'Based on your interest in technical analysis and current progress',
      confidence: 0.85
    },
    {
      type: 'course',
      id: 'course-1',
      title: 'Options Trading Masterclass',
      reason: 'Recommended for advancing your trading skills',
      confidence: 0.78
    }
  ];
}

function calculatePathAnalytics(path: any) {
  const pathItems = path.pathItems;
  const completedItems = pathItems.filter((item: any) => item.isCompleted);
  
  const totalTimeSpent = completedItems.reduce((sum: number, item: any) => sum + (item.timeSpent || 0), 0);
  const averageScore = completedItems.length > 0 
    ? completedItems.reduce((sum: number, item: any) => sum + (item.score || 0), 0) / completedItems.length 
    : 0;
  
  const completionRate = pathItems.length > 0 ? (completedItems.length / pathItems.length) * 100 : 0;
  const estimatedTimeRemaining = pathItems
    .filter((item: any) => !item.isCompleted)
    .reduce((sum: number, item: any) => sum + (item.lesson?.duration || 30), 0);

  return {
    totalItems: pathItems.length,
    completedItems: completedItems.length,
    completionRate,
    totalTimeSpent,
    averageScore,
    estimatedTimeRemaining,
    progress: path.progress
  };
}

function calculateEstimatedTime(remainingItems: any[]) {
  return remainingItems.reduce((sum, item) => {
    return sum + (item.lesson?.duration || item.course?.duration || 30);
  }, 0);
}

function calculateAverageScore(items: any[]) {
  const scoredItems = items.filter(item => item.score !== null);
  if (scoredItems.length === 0) return 0;
  
  return scoredItems.reduce((sum, item) => sum + item.score, 0) / scoredItems.length;
}