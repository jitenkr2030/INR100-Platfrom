import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'all'; // all, milestones, badges

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let milestones: any[] = [];
    let badges: any[] = [];

    if (type === 'all' || type === 'milestones') {
      milestones = await prisma.learningMilestone.findMany({
        where: { userId },
        orderBy: { achievedAt: 'desc' },
        include: {
          badge: {
            select: {
              id: true,
              name: true,
              icon: true,
              category: true
            }
          }
        }
      });
    }

    if (type === 'all' || type === 'badges') {
      badges = await prisma.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        include: {
          badge: true
        }
      });
    }

    // Get available badges (not earned yet)
    const earnedBadgeIds = badges.map(ub => ub.badgeId);
    const availableBadges = await prisma.badge.findMany({
      where: {
        isActive: true,
        id: {
          notIn: earnedBadgeIds
        }
      },
      orderBy: { xpReward: 'desc' }
    });

    // Get user's current stats for progress tracking
    const userStats = await getUserStats(userId);

    return NextResponse.json({
      milestones: {
        earned: milestones,
        total: milestones.length,
        progress: calculateMilestoneProgress(userStats)
      },
      badges: {
        earned: badges,
        available: availableBadges,
        total: badges.length
      },
      userStats
    });

  } catch (error) {
    console.error('Achievements fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, milestoneType, badgeId } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'check_milestones':
        return await checkAndAwardMilestones(userId);
      
      case 'award_badge':
        if (!badgeId) {
          return NextResponse.json(
            { error: 'Badge ID is required for badge award action' },
            { status: 400 }
          );
        }
        return await awardBadge(userId, badgeId);
      
      case 'get_progress':
        const userStats = await getUserStats(userId);
        return NextResponse.json({
          progress: calculateMilestoneProgress(userStats)
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Achievements action error:', error);
    return NextResponse.json(
      { error: 'Failed to process achievement action' },
      { status: 500 }
    );
  }
}

async function checkAndAwardMilestones(userId: string) {
  try {
    const userStats = await getUserStats(userId);
    const newMilestones = [];

    // Check for different types of milestones
    const milestoneChecks = [
      { type: 'FIRST_LESSON', condition: userStats.completedLessons >= 1 },
      { type: 'FIRST_COURSE', condition: userStats.completedCourses >= 1 },
      { type: 'COURSE_COMPLETE', condition: userStats.completedCourses >= 1 },
      { type: 'STREAK_7_DAYS', condition: userStats.longestStreak >= 7 },
      { type: 'STREAK_30_DAYS', condition: userStats.longestStreak >= 30 },
      { type: 'XP_LEVEL_10', condition: userStats.level >= 10 },
      { type: 'XP_LEVEL_25', condition: userStats.level >= 25 },
      { type: 'XP_LEVEL_50', condition: userStats.level >= 50 },
      { type: 'PERFECT_SCORE', condition: userStats.perfectScores >= 1 },
      { type: 'SPEED_LEARNER', condition: userStats.fastCompletions >= 5 },
      { type: 'DEDICATED_STUDENT', condition: userStats.totalTimeSpent >= 600 }, // 10 hours
      { type: 'KNOWLEDGE_SEEKER', condition: userStats.totalLessons >= 20 },
      { type: 'COURSE_EXPERT', condition: userStats.completedCourses >= 5 }
    ];

    for (const check of milestoneChecks) {
      if (check.condition) {
        const existing = await prisma.learningMilestone.findFirst({
          where: { userId, milestone: check.type as any }
        });

        if (!existing) {
          const milestone = await prisma.learningMilestone.create({
            data: {
              userId,
              milestone: check.type as any,
              title: getMilestoneTitle(check.type),
              description: getMilestoneDescription(check.type),
              xpReward: getMilestoneXpReward(check.type)
            }
          });

          newMilestones.push(milestone);

          // Award XP for milestone
          await prisma.userXpTransaction.create({
            data: {
              userId,
              type: 'MILESTONE_REWARD',
              amount: milestone.xpReward,
              source: 'MILESTONE',
              referenceId: milestone.id,
              description: `Achieved milestone: ${milestone.title}`
            }
          });

          // Update user's total XP and level
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userLevel: true }
          });

          if (user) {
            const currentXp = user.xp + milestone.xpReward;
            const newLevel = calculateLevelFromXp(currentXp);
            const xpToNext = calculateXpToNextLevel(newLevel);

            await prisma.user.update({
              where: { id: userId },
              data: {
                xp: currentXp,
                level: newLevel
              }
            });

            // Update user level record
            if (user.userLevel) {
              await prisma.userLevel.update({
                where: { userId },
                data: {
                  level: newLevel,
                  currentXp: currentXp,
                  xpToNext,
                  totalXp: currentXp,
                  levelUpAt: newLevel > user.level ? new Date() : user.userLevel.levelUpAt
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
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      newMilestones,
      message: newMilestones.length > 0 
        ? `Congratulations! You earned ${newMilestones.length} new milestone(s)!` 
        : 'No new milestones at this time'
    });

  } catch (error) {
    console.error('Check milestones error:', error);
    return NextResponse.json(
      { error: 'Failed to check milestones' },
      { status: 500 }
    );
  }
}

async function awardBadge(userId: string, badgeId: string) {
  try {
    // Check if user already has this badge
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User already has this badge' },
        { status: 400 }
      );
    }

    // Get badge details
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId }
    });

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // Award badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId
      }
    });

    // Award XP if badge has XP reward
    if (badge.xpReward > 0) {
      await prisma.userXpTransaction.create({
        data: {
          userId,
          type: 'BADGE_REWARD',
          amount: badge.xpReward,
          source: 'BADGE',
          referenceId: badgeId,
          description: `Earned badge: ${badge.name} (+${badge.xpReward} XP)`
        }
      });

      // Update user's XP
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userLevel: true }
      });

      if (user) {
        const currentXp = user.xp + badge.xpReward;
        const newLevel = calculateLevelFromXp(currentXp);

        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: currentXp,
            level: newLevel
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      badge: userBadge,
      message: `Congratulations! You earned the "${badge.name}" badge!`
    });

  } catch (error) {
    console.error('Award badge error:', error);
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    );
  }
}

async function getUserStats(userId: string) {
  // Get user basic stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      learningStreak: true,
      userLevel: true,
      certificates: true
    }
  });

  if (!user) return null;

  // Get lesson progress stats
  const lessonProgress = await prisma.userLessonProgress.findMany({
    where: { userId },
    include: { lesson: true }
  });

  // Get course enrollment stats
  const courseEnrollments = await prisma.courseEnrollment.findMany({
    where: { userId, isActive: true }
  });

  // Get quiz stats
  const quizAttempts = await prisma.userQuizAttempt.findMany({
    where: { userId, passed: true }
  });

  // Calculate stats
  const completedLessons = lessonProgress.filter(p => p.status === 'COMPLETED').length;
  const completedCourses = courseEnrollments.filter(e => e.progress === 100).length;
  const totalLessons = lessonProgress.length;
  const totalTimeSpent = lessonProgress.reduce((sum, p) => sum + p.timeSpent, 0);
  const perfectScores = quizAttempts.filter(a => a.score === 100).length;
  const fastCompletions = lessonProgress.filter(p => 
    p.status === 'COMPLETED' && p.timeSpent > 0 && p.timeSpent < (p.lesson?.duration || 30) * 0.5
  ).length;

  return {
    level: user.level,
    xp: user.xp,
    currentStreak: user.learningStreak?.currentStreak || 0,
    longestStreak: user.learningStreak?.longestStreak || 0,
    completedLessons,
    completedCourses,
    totalLessons,
    totalTimeSpent,
    perfectScores,
    fastCompletions,
    certificates: user.certificates.length
  };
}

function calculateMilestoneProgress(userStats: any) {
  if (!userStats) return [];

  const milestones = [
    { type: 'FIRST_LESSON', current: userStats.completedLessons, target: 1 },
    { type: 'FIRST_COURSE', current: userStats.completedCourses, target: 1 },
    { type: 'COURSE_COMPLETE', current: userStats.completedCourses, target: 5 },
    { type: 'STREAK_7_DAYS', current: userStats.longestStreak, target: 7 },
    { type: 'STREAK_30_DAYS', current: userStats.longestStreak, target: 30 },
    { type: 'XP_LEVEL_10', current: userStats.level, target: 10 },
    { type: 'XP_LEVEL_25', current: userStats.level, target: 25 },
    { type: 'XP_LEVEL_50', current: userStats.level, target: 50 },
    { type: 'PERFECT_SCORE', current: userStats.perfectScores, target: 1 },
    { type: 'SPEED_LEARNER', current: userStats.fastCompletions, target: 5 },
    { type: 'DEDICATED_STUDENT', current: Math.floor(userStats.totalTimeSpent / 60), target: 600 }, // in hours
    { type: 'KNOWLEDGE_SEEKER', current: userStats.totalLessons, target: 20 },
    { type: 'COURSE_EXPERT', current: userStats.completedCourses, target: 10 }
  ];

  return milestones.map(milestone => ({
    ...milestone,
    progress: Math.min((milestone.current / milestone.target) * 100, 100),
    isCompleted: milestone.current >= milestone.target
  }));
}

function getMilestoneTitle(milestone: string): string {
  const titles: Record<string, string> = {
    'FIRST_LESSON': 'Getting Started',
    'FIRST_COURSE': 'Course Completer',
    'COURSE_COMPLETE': 'Dedicated Learner',
    'STREAK_7_DAYS': 'Week Warrior',
    'STREAK_30_DAYS': 'Consistency Champion',
    'XP_LEVEL_10': 'Rising Star',
    'XP_LEVEL_25': 'Knowledge Seeker',
    'XP_LEVEL_50': 'Learning Expert',
    'PERFECT_SCORE': 'Perfect Score',
    'SPEED_LEARNER': 'Speed Learner',
    'DEDICATED_STUDENT': 'Dedicated Student',
    'KNOWLEDGE_SEEKER': 'Knowledge Seeker',
    'COURSE_EXPERT': 'Course Expert'
  };
  return titles[milestone] || milestone;
}

function getMilestoneDescription(milestone: string): string {
  const descriptions: Record<string, string> = {
    'FIRST_LESSON': 'Completed your first lesson!',
    'FIRST_COURSE': 'Completed your first course!',
    'COURSE_COMPLETE': 'Completed 5 courses!',
    'STREAK_7_DAYS': 'Maintained a 7-day learning streak!',
    'STREAK_30_DAYS': 'Achieved a 30-day learning streak!',
    'XP_LEVEL_10': 'Reached level 10!',
    'XP_LEVEL_25': 'Reached level 25!',
    'XP_LEVEL_50': 'Reached level 50!',
    'PERFECT_SCORE': 'Achieved a perfect quiz score!',
    'SPEED_LEARNER': 'Completed 5 lessons quickly!',
    'DEDICATED_STUDENT': 'Spent 10+ hours learning!',
    'KNOWLEDGE_SEEKER': 'Completed 20 lessons!',
    'COURSE_EXPERT': 'Completed 10 courses!'
  };
  return descriptions[milestone] || milestone;
}

function getMilestoneXpReward(milestone: string): number {
  const rewards: Record<string, number> = {
    'FIRST_LESSON': 25,
    'FIRST_COURSE': 100,
    'COURSE_COMPLETE': 200,
    'STREAK_7_DAYS': 150,
    'STREAK_30_DAYS': 500,
    'XP_LEVEL_10': 200,
    'XP_LEVEL_25': 500,
    'XP_LEVEL_50': 1000,
    'PERFECT_SCORE': 75,
    'SPEED_LEARNER': 100,
    'DEDICATED_STUDENT': 300,
    'KNOWLEDGE_SEEKER': 250,
    'COURSE_EXPERT': 750
  };
  return rewards[milestone] || 50;
}

function calculateLevelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calculateXpToNextLevel(level: number): number {
  return (level * level) * 100;
}