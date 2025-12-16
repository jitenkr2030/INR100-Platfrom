import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const streak = await prisma.learningStreak.findUnique({
      where: { userId }
    });

    if (!streak) {
      // Create initial streak record
      const newStreak = await prisma.learningStreak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          totalActiveDays: 0
        }
      });
      return NextResponse.json(newStreak);
    }

    return NextResponse.json(streak);

  } catch (error) {
    console.error('Streak fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, activityType = 'learning' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await prisma.learningStreak.findUnique({
      where: { userId }
    });

    if (!streak) {
      // Create new streak record
      streak = await prisma.learningStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          streakStartDate: today,
          totalActiveDays: 1
        }
      });

      // Award streak bonus XP
      await awardStreakBonusXp(userId, 1);
      await checkStreakMilestones(userId, 1);

      return NextResponse.json({
        success: true,
        streak,
        message: 'Streak started! 🎉'
      });
    }

    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    lastActivity?.setHours(0, 0, 0, 0);

    const daysDifference = lastActivity ? 
      Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    let updatedStreak;
    let message = '';

    if (daysDifference === 0) {
      // Same day - already counted
      message = 'Already active today! Come back tomorrow for another streak day.';
      updatedStreak = streak;
    } else if (daysDifference === 1) {
      // Consecutive day - extend streak
      const newStreak = streak.currentStreak + 1;
      updatedStreak = await prisma.learningStreak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(streak.longestStreak, newStreak),
          lastActivityDate: today,
          totalActiveDays: streak.totalActiveDays + 1
        }
      });

      // Award streak bonus XP
      await awardStreakBonusXp(userId, newStreak);
      await checkStreakMilestones(userId, newStreak);

      message = `Streak extended! ${newStreak} days in a row 🔥`;
    } else {
      // Streak broken - start new streak
      updatedStreak = await prisma.learningStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActivityDate: today,
          streakStartDate: today,
          totalActiveDays: streak.totalActiveDays + 1
        }
      });

      // Award streak reset bonus
      await awardStreakBonusXp(userId, 1);

      message = 'New streak started! Let\'s build that habit again 💪';
    }

    return NextResponse.json({
      success: true,
      streak: updatedStreak,
      message
    });

  } catch (error) {
    console.error('Streak update error:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, streakData } = body;

    if (!userId || !streakData) {
      return NextResponse.json(
        { error: 'User ID and streak data are required' },
        { status: 400 }
      );
    }

    const updatedStreak = await prisma.learningStreak.update({
      where: { userId },
      data: streakData
    });

    return NextResponse.json({
      success: true,
      streak: updatedStreak
    });

  } catch (error) {
    console.error('Streak update error:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}

async function awardStreakBonusXp(userId: string, streakLength: number) {
  try {
    // Bonus XP based on streak length
    const bonusXp = Math.min(streakLength * 5, 50); // Cap at 50 XP

    if (bonusXp > 0) {
      // Create XP transaction record
      await prisma.userXpTransaction.create({
        data: {
          userId,
          type: 'STREAK_BONUS',
          amount: bonusXp,
          source: 'STREAK_BONUS',
          description: `Streak bonus: ${streakLength} days = ${bonusXp} XP`
        }
      });

      // Update user's total XP
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userLevel: true }
      });

      if (user) {
        const currentXp = user.xp + bonusXp;
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
  } catch (error) {
    console.error('Streak bonus XP error:', error);
  }
}

async function checkStreakMilestones(userId: string, streakLength: number) {
  const milestones = [];

  if (streakLength === 7) milestones.push('STREAK_7_DAYS');
  if (streakLength === 30) milestones.push('STREAK_30_DAYS');

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
          xpReward: 100
        }
      });

      // Award milestone XP
      await prisma.userXpTransaction.create({
        data: {
          userId,
          type: 'MILESTONE_REWARD',
          amount: 100,
          source: 'MILESTONE',
          description: `Achieved milestone: ${getMilestoneTitle(milestone)}`
        }
      });
    }
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

function getMilestoneTitle(milestone: string): string {
  const titles: Record<string, string> = {
    'STREAK_7_DAYS': 'Week Warrior',
    'STREAK_30_DAYS': 'Consistency Champion'
  };
  return titles[milestone] || milestone;
}

function getMilestoneDescription(milestone: string): string {
  const descriptions: Record<string, string> = {
    'STREAK_7_DAYS': 'Maintained a 7-day learning streak!',
    'STREAK_30_DAYS': 'Achieved a 30-day learning streak - amazing dedication!'
  };
  return descriptions[milestone] || milestone;
}