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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, active, completed, available

    // Get user's challenge participation
    const userMissions = await prisma.userMission.findMany({
      where: { userId },
      include: {
        mission: true
      }
    });

    // Transform to challenge format
    const challenges = userMissions.map(userMission => {
      const mission = userMission.mission;
      
      return {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        category: determineChallengeCategory(mission.type),
        difficulty: determineDifficulty(mission.targetValue),
        startDate: mission.startDate,
        endDate: mission.endDate,
        requirements: [
          {
            type: mission.type.toLowerCase(),
            target: mission.targetValue,
            current: userMission.progress,
            unit: getUnitForType(mission.type)
          }
        ],
        rewards: {
          xp: mission.xpReward,
          coins: mission.coinReward,
          badge: getBadgeForChallenge(mission.type, mission.targetValue),
          perks: getPerksForChallenge(mission.type, mission.targetValue),
          cashback: getCashbackForChallenge(mission.type, mission.targetValue)
        },
        participants: Math.floor(Math.random() * 1000) + 100, // Mock participant count
        isActive: userMission.status === 'ACTIVE',
        isCompleted: userMission.status === 'COMPLETED',
        progress: userMission.progress,
        maxProgress: mission.targetValue
      };
    });

    // Filter based on type
    let filteredChallenges = challenges;
    if (type === 'active') {
      filteredChallenges = challenges.filter(c => c.isActive);
    } else if (type === 'completed') {
      filteredChallenges = challenges.filter(c => c.isCompleted);
    } else if (type === 'available') {
      filteredChallenges = challenges.filter(c => !c.isActive && !c.isCompleted);
    }

    return NextResponse.json(filteredChallenges);
  } catch (error) {
    console.error('Challenges error:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, challengeId } = await request.json();
    
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;

    if (action === 'join') {
      result = await joinChallenge(userId, challengeId);
    } else if (action === 'claim') {
      result = await claimChallengeReward(userId, challengeId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Challenge action error:', error);
    return NextResponse.json({ error: 'Failed to process challenge action' }, { status: 500 });
  }
}

async function joinChallenge(userId: string, challengeId: string) {
  // Check if challenge exists
  const mission = await prisma.mission.findUnique({
    where: { id: challengeId }
  });

  if (!mission) {
    throw new Error('Challenge not found');
  }

  // Check if user already joined
  const existingUserMission = await prisma.userMission.findFirst({
    where: {
      userId,
      missionId: challengeId
    }
  });

  if (existingUserMission) {
    throw new Error('Already joined this challenge');
  }

  // Check if challenge is still active
  const now = new Date();
  if (now < mission.startDate || now > mission.endDate) {
    throw new Error('Challenge is not currently active');
  }

  // Join the challenge
  const userMission = await prisma.userMission.create({
    data: {
      userId,
      missionId: challengeId,
      status: 'ACTIVE',
      progress: 0
    }
  });

  return {
    success: true,
    message: 'Successfully joined challenge',
    challenge: {
      id: mission.id,
      title: mission.title,
      description: mission.description
    }
  };
}

async function claimChallengeReward(userId: string, challengeId: string) {
  // Get user's mission progress
  const userMission = await prisma.userMission.findFirst({
    where: {
      userId,
      missionId: challengeId
    },
    include: {
      mission: true
    }
  });

  if (!userMission) {
    throw new Error('Challenge not found or not joined');
  }

  if (userMission.status !== 'COMPLETED') {
    throw new Error('Challenge not completed yet');
  }

  // Get the mission details
  const mission = userMission.mission;

  // Award rewards
  const xpReward = mission.xpReward;
  const coinReward = mission.coinReward;

  // Update user level
  await updateUserLevel(userId, xpReward, coinReward, 'challenge');

  // Record XP transaction
  await prisma.userXpTransaction.create({
    data: {
      userId,
      type: 'EARNED',
      amount: xpReward,
      source: 'CHALLENGE',
      description: `Challenge completed: ${mission.title}`,
      createdAt: new Date()
    }
  });

  // Award badge if applicable
  const badgeId = getBadgeForChallenge(mission.type, mission.targetValue);
  if (badgeId) {
    await awardBadge(userId, badgeId);
  }

  // Mark challenge as claimed
  await prisma.userMission.update({
    where: { id: userMission.id },
    data: { status: 'CLAIMED' }
  });

  return {
    success: true,
    reward: {
      xp: xpReward,
      coins: coinReward,
      badge: badgeId
    },
    message: 'Challenge reward claimed successfully'
  };
}

async function awardBadge(userId: string, badgeId: string) {
  try {
    await prisma.userSkillBadge.create({
      data: {
        userId,
        skillBadgeId: badgeId,
        earnedAt: new Date()
      }
    });
  } catch (error) {
    // Badge might already be awarded, which is fine
    console.log('Badge already awarded or error:', error);
  }
}

function determineChallengeCategory(missionType: string): 'daily' | 'weekly' | 'monthly' | 'special' {
  const type = missionType.toLowerCase();
  
  if (type.includes('daily') || type.includes('streak')) {
    return 'daily';
  } else if (type.includes('weekly')) {
    return 'weekly';
  } else if (type.includes('monthly')) {
    return 'monthly';
  } else {
    return 'special';
  }
}

function determineDifficulty(targetValue: number): 'easy' | 'medium' | 'hard' | 'expert' {
  if (targetValue <= 10) return 'easy';
  if (targetValue <= 50) return 'medium';
  if (targetValue <= 100) return 'hard';
  return 'expert';
}

function getUnitForType(missionType: string): string {
  const type = missionType.toLowerCase();
  
  if (type.includes('trade') || type.includes('order')) {
    return 'trades';
  } else if (type.includes('amount') || type.includes('investment')) {
    return '₹';
  } else if (type.includes('learning') || type.includes('lesson')) {
    return 'lessons';
  } else if (type.includes('social') || type.includes('share')) {
    return 'posts';
  } else if (type.includes('referral')) {
    return 'referrals';
  } else {
    return 'points';
  }
}

function getBadgeForChallenge(missionType: string, targetValue: number): string | null {
  // Return badge ID based on challenge type and difficulty
  const challengeBadges = {
    'first_trade': 'first_trade_badge',
    'daily_trader_7': 'daily_trader_7_badge',
    'big_investor': 'big_investor_badge',
    'social_butterfly': 'social_butterfly_badge',
    'learning_master': 'learning_master_badge'
  };

  const typeKey = missionType.toLowerCase().replace(/\s+/g, '_');
  return challengeBadges[typeKey as keyof typeof challengeBadges] || null;
}

function getPerksForChallenge(missionType: string, targetValue: number): string[] {
  const perks = [];
  
  if (targetValue >= 100) {
    perks.push('Premium support');
  }
  if (targetValue >= 500) {
    perks.push('Advanced analytics');
  }
  if (targetValue >= 1000) {
    perks.push('VIP status');
  }
  
  return perks;
}

function getCashbackForChallenge(missionType: string, targetValue: number): number {
  // Return cashback amount based on challenge value
  if (targetValue >= 10000) return 100; // ₹100 cashback
  if (targetValue >= 50000) return 250; // ₹250 cashback
  if (targetValue >= 100000) return 500; // ₹500 cashback
  return 0;
}

async function updateUserLevel(userId: string, xp: number, coins: number, action: string) {
  // Update user level with new XP
  // This would integrate with your existing level system
  console.log(`Updating user ${userId} level: +${xp} XP, +${coins} coins for ${action}`);
  
  // You would implement the actual level update logic here
  // Similar to the level API implementation
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}