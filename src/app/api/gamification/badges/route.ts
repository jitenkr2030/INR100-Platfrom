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
    const category = searchParams.get('category'); // all, trading, learning, social, special
    const rarity = searchParams.get('rarity'); // all, common, rare, epic, legendary
    const earned = searchParams.get('earned'); // all, earned, unearned

    // Get all available badges
    const allBadges = await prisma.skillBadge.findMany({
      where: { isActive: true },
      include: {
        userSkillBadges: {
          where: { userId }
        }
      }
    });

    // Transform to badge format
    let badges = allBadges.map(badge => {
      const userBadge = badge.userSkillBadges[0];
      
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.iconUrl || 'default-badge.png',
        category: badge.category,
        rarity: mapBadgeLevelToRarity(badge.level),
        verificationLevel: determineVerificationLevel(badge),
        requirements: parseBadgeRequirements(badge.requirements),
        perks: getBadgePerks(badge),
        isEarned: !!userBadge,
        earnedAt: userBadge?.earnedAt,
        verificationId: userBadge?.verificationId,
        metadata: userBadge?.metadata ? JSON.parse(userBadge.metadata) : null
      };
    });

    // Filter by category
    if (category && category !== 'all') {
      badges = badges.filter(badge => 
        badge.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by rarity
    if (rarity && rarity !== 'all') {
      badges = badges.filter(badge => badge.rarity === rarity);
    }

    // Filter by earned status
    if (earned === 'earned') {
      badges = badges.filter(badge => badge.isEarned);
    } else if (earned === 'unearned') {
      badges = badges.filter(badge => !badge.isEarned);
    }

    return NextResponse.json(badges);
  } catch (error) {
    console.error('Badges error:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, badgeId, verificationData } = await request.json();
    
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;

    if (action === 'verify') {
      result = await verifyBadge(userId, badgeId, verificationData);
    } else if (action === 'share') {
      result = await shareBadge(userId, badgeId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Badge action error:', error);
    return NextResponse.json({ error: 'Failed to process badge action' }, { status: 500 });
  }
}

async function verifyBadge(userId: string, badgeId: string, verificationData: any) {
  // Check if badge exists
  const badge = await prisma.skillBadge.findUnique({
    where: { id: badgeId }
  });

  if (!badge) {
    throw new Error('Badge not found');
  }

  // Check if user already has this badge
  const existingUserBadge = await prisma.userSkillBadge.findFirst({
    where: {
      userId,
      skillBadgeId: badgeId
    }
  });

  if (existingUserBadge) {
    throw new Error('Badge already earned');
  }

  // Check verification requirements
  const requirements = parseBadgeRequirements(badge.requirements);
  const verificationResult = await verifyRequirements(userId, requirements, verificationData);

  if (!verificationResult.isValid) {
    throw new Error('Verification failed: ' + verificationResult.reason);
  }

  // Award the badge
  const userBadge = await prisma.userSkillBadge.create({
    data: {
      userId,
      skillBadgeId: badgeId,
      earnedAt: new Date(),
      verificationId: verificationResult.verificationId,
      metadata: JSON.stringify(verificationData)
    }
  });

  // Award XP and coins
  const xpReward = badge.xpReward || 0;
  await awardBadgeReward(userId, xpReward);

  return {
    success: true,
    message: 'Badge verified and awarded successfully',
    badge: {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      verificationLevel: determineVerificationLevel(badge)
    },
    reward: {
      xp: xpReward
    }
  };
}

async function shareBadge(userId: string, badgeId: string) {
  // Check if user has the badge
  const userBadge = await prisma.userSkillBadge.findFirst({
    where: {
      userId,
      skillBadgeId: badgeId
    },
    include: {
      skillBadge: true
    }
  });

  if (!userBadge) {
    throw new Error('Badge not found or not earned');
  }

  // Record share for analytics
  await prisma.userXpTransaction.create({
    data: {
      userId,
      type: 'EARNED',
      amount: 5, // Small XP reward for sharing
      source: 'SOCIAL_SHARE',
      description: `Shared badge: ${userBadge.skillBadge.name}`,
      createdAt: new Date()
    }
  });

  return {
    success: true,
    message: 'Badge share recorded',
    shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/badges/${badgeId}/share/${userBadge.verificationId}`
  };
}

async function verifyRequirements(userId: string, requirements: any[], verificationData: any) {
  // Verify each requirement
  for (const requirement of requirements) {
    const isValid = await verifySingleRequirement(userId, requirement, verificationData);
    if (!isValid) {
      return {
        isValid: false,
        reason: `Requirement not met: ${requirement.description}`
      };
    }
  }

  return {
    isValid: true,
    verificationId: generateVerificationId()
  };
}

async function verifySingleRequirement(userId: string, requirement: any, verificationData: any) {
  const { type, target, description } = requirement;

  switch (type) {
    case 'trades':
      const tradeCount = await prisma.order.count({
        where: { userId, status: 'EXECUTED' }
      });
      return tradeCount >= target;

    case 'amount':
      const totalAmount = await prisma.transaction.aggregate({
        where: { 
          userId, 
          status: 'COMPLETED',
          type: 'INVESTMENT'
        },
        _sum: { amount: true }
      });
      return (totalAmount._sum.amount || 0) >= target;

    case 'learning':
      const completedLessons = await prisma.userLessonProgress.count({
        where: { 
          userId, 
          status: 'COMPLETED' 
        }
      });
      return completedLessons >= target;

    case 'social':
      const socialPosts = await prisma.socialPost.count({
        where: { userId }
      });
      return socialPosts >= target;

    case 'referrals':
      // This would require a referral system
      const referralCount = 0; // Mock implementation
      return referralCount >= target;

    case 'streak':
      // This would require a streak tracking system
      const streakDays = 0; // Mock implementation
      return streakDays >= target;

    case 'verification':
      // For verified badges, check specific verification criteria
      return verifySpecificRequirement(type, verificationData);

    default:
      return false;
  }
}

async function verifySpecificRequirement(type: string, verificationData: any): Promise<boolean> {
  switch (type) {
    case 'verified_trader':
      return verificationData.tradingLicense && 
             verificationData.sebiRegistration &&
             verificationData.experienceYears >= 2;

    case 'verified_analyst':
      return verificationData.cfa charter && 
             verificationData.analysisExperience >= 3 &&
             verificationData.certifications?.includes('CFA');

    case 'verified_educator':
      return verificationData.teachingExperience >= 5 &&
             verificationData.qualifications?.includes('finance') &&
             verificationData.studentsCount >= 100;

    case 'verified_institution':
      return verificationData.licenseNumber &&
             verificationData.institutionType &&
             verificationData.registrationDate;

    default:
      return false;
  }
}

function mapBadgeLevelToRarity(level: string): 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive' {
  const levelMap = {
    'BRONZE': 'common',
    'SILVER': 'rare',
    'GOLD': 'epic',
    'PLATINUM': 'legendary',
    'DIAMOND': 'exclusive'
  };
  
  return levelMap[level as keyof typeof levelMap] || 'common';
}

function determineVerificationLevel(badge: any): 'none' | 'basic' | 'verified' | 'premium' {
  const name = badge.name.toLowerCase();
  
  if (name.includes('verified') || name.includes('certified')) {
    return 'verified';
  } else if (name.includes('premium') || name.includes('elite')) {
    return 'premium';
  } else if (name.includes('expert') || name.includes('master')) {
    return 'basic';
  } else {
    return 'none';
  }
}

function parseBadgeRequirements(requirementsJson: string): any[] {
  try {
    return JSON.parse(requirementsJson || '[]');
  } catch {
    return [];
  }
}

function getBadgePerks(badge: any): string[] {
  const name = badge.name.toLowerCase();
  const perks = [];

  if (name.includes('verified')) {
    perks.push('Verified badge display', 'Priority support', 'Enhanced profile');
  } else if (name.includes('expert')) {
    perks.push('Expert badge', 'Content creation rights', 'Mentorship opportunities');
  } else if (name.includes('elite')) {
    perks.push('Elite status', 'Exclusive content', 'VIP events');
  } else if (name.includes('legendary')) {
    perks.push('Legendary status', 'Platform ambassador', 'Revenue sharing');
  }

  return perks;
}

function generateVerificationId(): string {
  return `VER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function awardBadgeReward(userId: string, xpReward: number) {
  // Update user level with XP
  // This would integrate with your existing level system
  console.log(`Awarding ${xpReward} XP to user ${userId} for badge`);
  
  // Record XP transaction
  await prisma.userXpTransaction.create({
    data: {
      userId,
      type: 'EARNED',
      amount: xpReward,
      source: 'BADGE',
      description: 'Badge earned',
      createdAt: new Date()
    }
  });
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}