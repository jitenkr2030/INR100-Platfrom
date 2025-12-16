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

    // Get all achievements
    const allAchievements = await prisma.badge.findMany({
      where: { isActive: true },
      include: {
        userSkillBadges: {
          where: { userId }
        }
      }
    });

    // Transform to achievement format
    const achievements = allAchievements.map(badge => {
      const userBadge = badge.userSkillBadges[0];
      
      return {
        id: badge.id,
        title: badge.name,
        description: badge.description,
        category: determineCategory(badge.name),
        icon: badge.iconUrl || 'default-badge.png',
        rarity: badge.level,
        xpReward: badge.xpReward || 0,
        coinReward: 0, // Could be stored separately
        unlockedAt: userBadge?.earnedAt,
        progress: calculateProgress(badge, userId),
        maxProgress: getMaxProgress(badge),
        requirements: parseRequirements(badge.requirements),
        tier: 1, // Could be enhanced
        isUnlocked: !!userBadge
      };
    });

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Achievements error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { achievementId } = await request.json();
    
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Claim achievement reward
    const achievement = await prisma.badge.findUnique({
      where: { id: achievementId }
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Check if user already has this achievement
    const existingUserBadge = await prisma.userSkillBadge.findFirst({
      where: {
        userId,
        skillBadgeId: achievementId
      }
    });

    if (existingUserBadge) {
      return NextResponse.json({ error: 'Achievement already claimed' }, { status: 400 });
    }

    // Award the achievement
    const userBadge = await prisma.userSkillBadge.create({
      data: {
        userId,
        skillBadgeId: achievementId,
        earnedAt: new Date()
      }
    });

    // Award XP and coins
    const xpReward = achievement.xpReward || 0;
    const coinReward = calculateCoinReward(achievement.level);

    // Update user level
    await updateUserLevel(userId, xpReward, coinReward, 'achievement');

    // Record the reward transaction
    await prisma.userXpTransaction.create({
      data: {
        userId,
        type: 'EARNED',
        amount: xpReward,
        source: 'ACHIEVEMENT',
        description: `Achievement: ${achievement.name}`,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      reward: {
        xp: xpReward,
        coins: coinReward
      },
      achievement: {
        id: achievement.id,
        title: achievement.name,
        description: achievement.description
      }
    });
  } catch (error) {
    console.error('Claim achievement error:', error);
    return NextResponse.json({ error: 'Failed to claim achievement' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check for new achievements based on user activity
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newAchievements = await checkForNewAchievements(userId);

    return NextResponse.json(newAchievements);
  } catch (error) {
    console.error('Check achievements error:', error);
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
  }
}

// Helper functions
function determineCategory(badgeName: string): 'trading' | 'learning' | 'social' | 'streak' | 'special' {
  const name = badgeName.toLowerCase();
  
  if (name.includes('trade') || name.includes('order') || name.includes('investment')) {
    return 'trading';
  } else if (name.includes('learn') || name.includes('course') || name.includes('quiz')) {
    return 'learning';
  } else if (name.includes('share') || name.includes('social') || name.includes('friend')) {
    return 'social';
  } else if (name.includes('streak') || name.includes('consecutive') || name.includes('daily')) {
    return 'streak';
  } else {
    return 'special';
  }
}

function calculateProgress(badge: any, userId: string): number {
  // This would depend on the specific achievement requirements
  // For now, return mock progress
  const requirements = parseRequirements(badge.requirements);
  
  if (requirements.length === 0) return 100; // No requirements = already unlocked
  
  // Mock calculation - in reality, you'd query user activity
  return Math.min(100, Math.random() * 100);
}

function getMaxProgress(badge: any): number {
  const requirements = parseRequirements(badge.requirements);
  return requirements.length > 0 ? requirements[0].target : 1;
}

function parseRequirements(requirementsJson: string): any[] {
  try {
    return JSON.parse(requirementsJson || '[]');
  } catch {
    return [];
  }
}

function calculateCoinReward(level: string): number {
  const rarityMultipliers = {
    'BRONZE': 10,
    'SILVER': 25,
    'GOLD': 50,
    'PLATINUM': 100,
    'DIAMOND': 250
  };
  
  return rarityMultipliers[level as keyof typeof rarityMultipliers] || 10;
}

async function checkForNewAchievements(userId: string) {
  // Get user's current statistics
  const userStats = await getUserStatistics(userId);
  
  // Get all available achievements
  const availableAchievements = await prisma.badge.findMany({
    where: { isActive: true },
    include: {
      userSkillBadges: {
        where: { userId }
      }
    }
  });

  const newAchievements = [];

  for (const achievement of availableAchievements) {
    // Skip if already earned
    if (achievement.userSkillBadges.length > 0) continue;
    
    // Check if requirements are met
    const requirements = parseRequirements(achievement.requirements);
    let allRequirementsMet = true;
    
    for (const requirement of requirements) {
      const currentValue = getStatValue(userStats, requirement.type);
      if (currentValue < requirement.target) {
        allRequirementsMet = false;
        break;
      }
    }
    
    if (allRequirementsMet) {
      // Award the achievement
      const userBadge = await prisma.userSkillBadge.create({
        data: {
          userId,
          skillBadgeId: achievement.id,
          earnedAt: new Date()
        }
      });

      newAchievements.push({
        id: achievement.id,
        title: achievement.name,
        description: achievement.description,
        category: determineCategory(achievement.name),
        icon: achievement.iconUrl || 'default-badge.png',
        rarity: achievement.level,
        xpReward: achievement.xpReward || 0,
        coinReward: calculateCoinReward(achievement.level),
        unlockedAt: new Date(),
        requirements: requirements,
        isUnlocked: true
      });

      // Award XP and coins
      const xpReward = achievement.xpReward || 0;
      const coinReward = calculateCoinReward(achievement.level);
      
      await updateUserLevel(userId, xpReward, coinReward, 'achievement');
    }
  }

  return newAchievements;
}

async function getUserStatistics(userId: string) {
  // Get user's trading statistics
  const [orders, portfolios, socialPosts, learningProgress] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.portfolio.count({ where: { userId } }),
    prisma.socialPost.count({ where: { userId } }),
    prisma.userLessonProgress.count({ where: { userId, status: 'COMPLETED' } })
  ]);

  return {
    totalTrades: orders,
    totalPortfolios: portfolios,
    totalPosts: socialPosts,
    completedLessons: learningProgress,
    totalInvestment: 0, // Would calculate from transactions
    referralCount: 0, // Would get from referral system
    consecutiveDays: 0 // Would calculate from login streak
  };
}

function getStatValue(stats: any, statType: string): number {
  const statMap = {
    'trades': 'totalTrades',
    'portfolios': 'totalPortfolios',
    'social_posts': 'totalPosts',
    'learning_completed': 'completedLessons',
    'amount': 'totalInvestment',
    'referrals': 'referralCount',
    'streak': 'consecutiveDays'
  };

  const statKey = statMap[statType as keyof typeof statMap];
  return statKey ? stats[statKey] || 0 : 0;
}

async function updateUserLevel(userId: string, xp: number, coins: number, action: string) {
  // This would update the user's level and coins
  // Implementation depends on your user level system
  console.log(`Updating user ${userId} level: +${xp} XP, +${coins} coins for ${action}`);
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}