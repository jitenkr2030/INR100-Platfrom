import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let whereClause: any = { userId };
    
    if (courseId) {
      // Get progress for specific course
      const courseProgress = await prisma.courseEnrollment.findMany({
        where: { userId, courseId },
        include: {
          course: {
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId }
                  },
                  quiz: true
                }
              }
            }
          }
        }
      });

      if (courseProgress.length === 0) {
        return NextResponse.json(
          { error: 'Course enrollment not found' },
          { status: 404 }
        );
      }

      const enrollment = courseProgress[0];
      const lessons = enrollment.course.lessons;
      
      const progressData = {
        courseId,
        courseTitle: enrollment.course.title,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        totalLessons: lessons.length,
        completedLessons: lessons.filter(l => 
          l.progress.length > 0 && l.progress[0].status === 'COMPLETED'
        ).length,
        lessons: lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          status: lesson.progress.length > 0 ? lesson.progress[0].status : 'NOT_STARTED',
          timeSpent: lesson.progress.length > 0 ? lesson.progress[0].timeSpent : 0,
          quizScore: lesson.progress.length > 0 ? lesson.progress[0].quizScore : null,
          lastAccessed: lesson.progress.length > 0 ? lesson.progress[0].lastAccessedAt : null
        }))
      };

      return NextResponse.json(progressData);
    } else {
      // Get overall progress across all courses
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { userId, isActive: true },
        include: {
          course: {
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      });

      const overallProgress = enrollments.map(enrollment => {
        const lessons = enrollment.course.lessons;
        const completedLessons = lessons.filter(l => 
          l.progress.length > 0 && l.progress[0].status === 'COMPLETED'
        ).length;

        return {
          courseId: enrollment.courseId,
          courseTitle: enrollment.course.title,
          progress: enrollment.progress,
          totalLessons: lessons.length,
          completedLessons,
          completionPercentage: lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0,
          enrolledAt: enrollment.enrolledAt,
          startedAt: enrollment.startedAt,
          completedAt: enrollment.completedAt
        };
      });

      return NextResponse.json({
        userId,
        totalCourses: enrollments.length,
        activeCourses: overallProgress.filter(p => p.completionPercentage < 100).length,
        completedCourses: overallProgress.filter(p => p.completionPercentage === 100).length,
        courses: overallProgress
      });
    }

  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lessonId, action, timeSpent, notes, bookmarks } = body;

    if (!userId || !lessonId || !action) {
      return NextResponse.json(
        { error: 'userId, lessonId, and action are required' },
        { status: 400 }
      );
    }

    // Check if progress record exists
    let progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    const now = new Date();

    if (!progress) {
      // Create new progress record
      progress = await prisma.userLessonProgress.create({
        data: {
          userId,
          lessonId,
          status: action === 'start' ? 'IN_PROGRESS' : 'NOT_STARTED',
          startTime: action === 'start' ? now : null,
          lastAccessedAt: now,
          timeSpent: timeSpent || 0,
          notes: notes || null,
          bookmarks: bookmarks ? JSON.stringify(bookmarks) : null
        }
      });
    } else {
      // Update existing progress record
      const updateData: any = {
        lastAccessedAt: now,
        attempts: { increment: action === 'start' ? 1 : 0 }
      };

      if (timeSpent) {
        updateData.timeSpent = { increment: timeSpent };
      }

      if (action === 'start') {
        updateData.status = 'IN_PROGRESS';
        if (!progress.startTime) {
          updateData.startTime = now;
        }
      } else if (action === 'complete') {
        updateData.status = 'COMPLETED';
        updateData.completedAt = now;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      if (bookmarks !== undefined) {
        updateData.bookmarks = JSON.stringify(bookmarks);
      }

      progress = await prisma.userLessonProgress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        data: updateData
      });
    }

    // Update course enrollment progress if lesson is completed
    if (action === 'complete') {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { course: true }
      });

      if (lesson) {
        // Calculate overall course progress
        const courseLessons = await prisma.lesson.findMany({
          where: { courseId: lesson.courseId },
          include: {
            progress: {
              where: { userId }
            }
          }
        });

        const completedLessons = courseLessons.filter(l => 
          l.progress.length > 0 && l.progress[0].status === 'COMPLETED'
        ).length;

        const totalLessons = courseLessons.length;
        const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        // Update course enrollment
        await prisma.courseEnrollment.updateMany({
          where: {
            userId,
            courseId: lesson.courseId
          },
          data: {
            progress: progressPercentage,
            startedAt: progressPercentage > 0 ? (progress.startedAt || now) : null,
            completedAt: progressPercentage === 100 ? now : null
          }
        });

        // Award XP for lesson completion
        await awardXpForLessonCompletion(userId, lessonId, lesson.xpReward);
      }
    }

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

async function awardXpForLessonCompletion(userId: string, lessonId: string, xpReward: number) {
  try {
    // Create XP transaction record
    await prisma.userXpTransaction.create({
      data: {
        userId,
        type: 'LESSON_COMPLETED',
        amount: xpReward,
        source: 'LESSON_COMPLETED',
        referenceId: lessonId,
        description: `Completed lesson and earned ${xpReward} XP`
      }
    });

    // Update user's total XP and check for level up
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userLevel: true }
    });

    if (!user) return;

    const currentXp = user.xp + xpReward;
    const newLevel = calculateLevelFromXp(currentXp);
    const xpToNext = calculateXpToNextLevel(newLevel);

    // Update user level and XP
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: currentXp,
        level: newLevel
      }
    });

    // Update or create user level record
    if (user.userLevel) {
      await prisma.userLevel.update({
        where: { userId },
        data: {
          level: newLevel,
          currentXp: currentXp,
          xpToNext,
          totalXp: currentXp,
          levelUpAt: newLevel > user.level ? now : user.userLevel.levelUpAt
        }
      });
    } else {
      await prisma.userLevel.create({
        data: {
          userId,
          level: newLevel,
          currentXp: currentXp,
          xpToNext,
          totalXp: currentXp,
          levelUpAt: newLevel > 1 ? new Date() : null
        }
      });
    }

    // Check for milestone achievements
    await checkForMilestones(userId, newLevel, currentXp);

  } catch (error) {
    console.error('XP award error:', error);
  }
}

function calculateLevelFromXp(xp: number): number {
  // Level formula: Level = floor(sqrt(XP / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calculateXpToNextLevel(level: number): number {
  // XP needed for next level: (level^2) * 100
  return (level * level) * 100;
}

async function checkForMilestones(userId: string, level: number, totalXp: number) {
  const milestones = [];

  if (level >= 10) milestones.push('XP_LEVEL_10');
  if (level >= 25) milestones.push('XP_LEVEL_25');
  if (level >= 50) milestones.push('XP_LEVEL_50');

  for (const milestone of milestones) {
    const existing = await prisma.learningMilestone.findFirst({
      where: { userId, milestone: milestone as any }
    });

    if (!existing) {
      await prisma.learningMilestone.create({
        data: {
          userId,
          milestone: milestone as any,
          title: getMilestoneTitle(milestone),
          description: getMilestoneDescription(milestone),
          xpReward: 50
        }
      });

      // Award milestone XP
      await prisma.userXpTransaction.create({
        data: {
          userId,
          type: 'MILESTONE_REWARD',
          amount: 50,
          source: 'MILESTONE',
          description: `Achieved milestone: ${getMilestoneTitle(milestone)}`
        }
      });
    }
  }
}

function getMilestoneTitle(milestone: string): string {
  const titles: Record<string, string> = {
    'XP_LEVEL_10': 'Rising Star',
    'XP_LEVEL_25': 'Knowledge Seeker',
    'XP_LEVEL_50': 'Learning Expert'
  };
  return titles[milestone] || milestone;
}

function getMilestoneDescription(milestone: string): string {
  const descriptions: Record<string, string> = {
    'XP_LEVEL_10': 'Reached level 10 - You\'re making great progress!',
    'XP_LEVEL_25': 'Reached level 25 - Your dedication is paying off!',
    'XP_LEVEL_50': 'Reached level 50 - You\'re a true learning expert!'
  };
  return descriptions[milestone] || milestone;
}