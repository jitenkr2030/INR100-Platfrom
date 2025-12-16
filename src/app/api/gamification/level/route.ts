'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user level record
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    if (!userLevel) {
      // Create initial level record
      userLevel = await prisma.userLevel.create({
        data: {
          userId,
          level: 1,
          currentXp: 0,
          xpToNext: 100,
          totalXp: 0
        }
      });
    }

    // Calculate level progression
    const levelData = calculateLevelProgression(userLevel);

    return NextResponse.json(levelData);
  } catch (error) {
    console.error('User level error:', error);
    return NextResponse.json({ error: 'Failed to fetch user level' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { xp, coins, action } = await request.json();
    
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user level with new XP
    const updatedLevel = await updateUserLevel(userId, xp, coins, action);

    return NextResponse.json(updatedLevel);
  } catch (error) {
    console.error('Level update error:', error);
    return NextResponse.json({ error: 'Failed to update level' }, { status: 500 });
  }
}

function calculateLevelProgression(userLevel: any) {
  const { level, currentXp, xpToNext, totalXp } = userLevel;
  
  // Define level titles and perks
  const levelTitles = [
    'Novice Trader',    // Level 1
    'Apprentice',       // Level 2
    'Student',          // Level 3
    'Practitioner',     // Level 4
    'Skilled Trader',   // Level 5
    'Expert',           // Level 6
    'Master',           // Level 7
    'Guru',             // Level 8
    'Legend',           // Level 9
    'Champion',         // Level 10
    'Elite Trader',     // Level 11+
  ];

  const levelPerks = [
    [], // Level 1
    ['Basic analytics'], // Level 2
    ['Advanced charts', 'Priority support'], // Level 3
    ['Custom watchlists', 'API access'], // Level 4
    ['Premium insights', 'Expert sessions'], // Level 5
    ['Portfolio optimization', 'Tax reports'], // Level 6
    ['VIP support', 'Early access features'], // Level 7
    ['Personal advisor', 'Custom research'], // Level 8
    ['Exclusive content', 'Partner benefits'], // Level 9
    ['Premium rewards', 'Platform credits'], // Level 10
    ['Elite status', 'All perks unlocked'] // Level 11+
  ];

  const currentTitleIndex = Math.min(level - 1, levelTitles.length - 1);
  const nextTitleIndex = Math.min(level, levelTitles.length - 1);
  
  return {
    level,
    currentXp,
    xpToNext,
    totalXp,
    title: levelTitles[currentTitleIndex],
    nextLevelTitle: level < 11 ? levelTitles[nextTitleIndex] : undefined,
    perks: levelPerks[currentTitleIndex] || [],
    progressPercentage: xpToNext > 0 ? (currentXp / xpToNext) * 100 : 0,
    isMaxLevel: level >= 50 // Maximum level of 50
  };
}

async function updateUserLevel(userId: string, xpGained: number, coinsGained: number, action: string) {
  // Get current level
  let userLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  if (!userLevel) {
    // Create initial level record
    userLevel = await prisma.userLevel.create({
      data: {
        userId,
        level: 1,
        currentXp: 0,
        xpToNext: 100,
        totalXp: 0
      }
    });
  }

  let newLevel = userLevel.level;
  let newCurrentXp = userLevel.currentXp + xpGained;
  let newTotalXp = userLevel.totalXp + xpGained;
  let newXpToNext = userLevel.xpToNext;

  // Level up logic
  while (newCurrentXp >= newXpToNext && newLevel < 50) {
    newCurrentXp -= newXpToNext;
    newLevel += 1;
    
    // Calculate next level XP requirement (increasing difficulty)
    newXpToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
  }

  // Update user level record
  const updatedLevel = await prisma.userLevel.update({
    where: { userId },
    data: {
      level: newLevel,
      currentXp: newCurrentXp,
      totalXp: newTotalXp,
      xpToNext: newXpToNext,
      updatedAt: new Date()
    }
  });

  // Update user coins if any
  if (coinsGained > 0) {
    // You would need to implement a user coins/wallet system
    // For now, we'll just log it
    console.log(`User ${userId} gained ${coinsGained} coins for ${action}`);
  }

  // Record XP transaction
  await prisma.userXpTransaction.create({
    data: {
      userId,
      type: 'EARNED',
      amount: xpGained,
      source: action,
      description: `XP earned from ${action}`,
      createdAt: new Date()
    }
  });

  // Check for level up achievements
  if (newLevel > userLevel.level) {
    // Trigger level up achievement check
    await checkLevelUpAchievements(userId, newLevel);
  }

  return calculateLevelProgression(updatedLevel);
}

async function checkLevelUpAchievements(userId: string, newLevel: number) {
  // Define level-based achievements
  const levelAchievements = [
    { level: 5, achievementId: 'level_5' },
    { level: 10, achievementId: 'level_10' },
    { level: 25, achievementId: 'level_25' },
    { level: 50, achievementId: 'level_50' }
  ];

  const levelAchievement = levelAchievements.find(la => la.level === newLevel);
  
  if (levelAchievement) {
    // Check if user already has this achievement
    const existingAchievement = await prisma.userBadge.findFirst({
      where: {
        userId,
        badge: {
          name: levelAchievement.achievementId
        }
      }
    });

    if (!existingAchievement) {
      // Award the achievement (implementation depends on your achievement system)
      console.log(`User ${userId} reached level ${newLevel} - Achievement unlocked!`);
    }
  }
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}