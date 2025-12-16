import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's current XP and level info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userLevel: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get XP transaction history
    const xpTransactions = await prisma.userXpTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get XP statistics
    const xpStats = await getXpStatistics(userId);

    // Get level progress
    const levelProgress = calculateLevelProgress(user.xp, user.level);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        currentXp: user.xp,
        totalXp: user.xp // This could be different if we track lifetime XP separately
      },
      levelProgress,
      xpStats,
      transactions: xpTransactions,
      pagination: {
        limit,
        offset,
        hasMore: xpTransactions.length === limit
      }
    });

  } catch (error) {
    console.error('XP fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XP data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      type, 
      amount, 
      source, 
      referenceId, 
      description 
    } = body;

    if (!userId || !type || amount === undefined) {
      return NextResponse.json(
        { error: 'User ID, type, and amount are required' },
        { status: 400 }
      );
    }

    // Validate XP transaction type
    const validTypes = [
      'LESSON_COMPLETED', 
      'QUIZ_PASSED', 
      'COURSE_COMPLETED', 
      'STREAK_BONUS', 
      'MILESTONE_REWARD', 
      'BADGE_REWARD', 
      'PENALTY', 
      'ADMIN_ADJUSTMENT'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid XP transaction type' },
        { status: 400 }
      );
    }

    // Create XP transaction record
    const transaction = await prisma.userXpTransaction.create({
      data: {
        userId,
        type: type as any,
        amount,
        source: source || type,
        referenceId: referenceId || null,
        description: description || `${type.replace('_', ' ').toLowerCase()}`
      }
    });

    // Update user's total XP
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userLevel: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const newTotalXp = user.xp + amount;
    const newLevel = calculateLevelFromXp(newTotalXp);
    const xpToNext = calculateXpToNextLevel(newLevel);
    const leveledUp = newLevel > user.level;

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newTotalXp,
        level: newLevel
      }
    });

    // Update or create user level record
    if (user.userLevel) {
      await prisma.userLevel.update({
        where: { userId },
        data: {
          level: newLevel,
          currentXp: newTotalXp,
          xpToNext,
          totalXp: newTotalXp,
          levelUpAt: leveledUp ? new Date() : user.userLevel.levelUpAt
        }
      });
    } else {
      await prisma.userLevel.create({
        data: {
          userId,
          level: newLevel,
          currentXp: newTotalXp,
          xpToNext,
          totalXp: newTotalXp,
          levelUpAt: newLevel > 1 ? new Date() : null
        }
      });
    }

    return NextResponse.json({
      success: true,
      transaction,
      user: {
        level: newLevel,
        currentXp: newTotalXp,
        xpToNext,
        leveledUp
      },
      message: leveledUp 
        ? `🎉 Congratulations! You leveled up to level ${newLevel}!`
        : `+${amount} XP earned!`
    });

  } catch (error) {
    console.error('XP transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to process XP transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, adjustment, reason } = body;

    if (!userId || adjustment === undefined) {
      return NextResponse.json(
        { error: 'User ID and adjustment are required' },
        { status: 400 }
      );
    }

    // Create admin adjustment transaction
    const transaction = await prisma.userXpTransaction.create({
      data: {
        userId,
        type: 'ADMIN_ADJUSTMENT',
        amount: adjustment,
        source: 'ADMIN_ADJUSTMENT',
        description: reason || 'Administrative XP adjustment'
      }
    });

    // Update user's XP
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userLevel: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const newTotalXp = Math.max(0, user.xp + adjustment); // Prevent negative XP
    const newLevel = calculateLevelFromXp(newTotalXp);
    const xpToNext = calculateXpToNextLevel(newLevel);
    const leveledUp = newLevel > user.level;

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newTotalXp,
        level: newLevel
      }
    });

    // Update user level record
    if (user.userLevel) {
      await prisma.userLevel.update({
        where: { userId },
        data: {
          level: newLevel,
          currentXp: newTotalXp,
          xpToNext,
          totalXp: newTotalXp,
          levelUpAt: leveledUp ? new Date() : user.userLevel.levelUpAt
        }
      });
    }

    return NextResponse.json({
      success: true,
      transaction,
      user: {
        level: newLevel,
        currentXp: newTotalXp,
        xpToNext,
        leveledUp
      },
      message: `XP adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`
    });

  } catch (error) {
    console.error('XP adjustment error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust XP' },
      { status: 500 }
    );
  }
}

// Additional endpoint for XP statistics
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'statistics':
        const stats = await getXpStatistics(userId);
        return NextResponse.json(stats);
      
      case 'leaderboard_position':
        const position = await getUserLeaderboardPosition(userId);
        return NextResponse.json(position);
      
      case 'level_requirements':
        const requirements = getLevelRequirements();
        return NextResponse.json(requirements);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('XP statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to get XP statistics' },
      { status: 500 }
    );
  }
}

async function getXpStatistics(userId: string) {
  try {
    // Get all XP transactions for the user
    const transactions = await prisma.userXpTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate various statistics
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    // XP earned by source
    const xpBySource = transactions.reduce((acc, transaction) => {
      const source = transaction.source;
      if (!acc[source]) {
        acc[source] = { earned: 0, count: 0 };
      }
      if (transaction.amount > 0) {
        acc[source].earned += transaction.amount;
        acc[source].count += 1;
      }
      return acc;
    }, {} as Record<string, { earned: number; count: number }>);

    // XP earned by month (last 6 months)
    const monthlyXp = getMonthlyXpData(transactions);

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentXp = transactions
      .filter(t => t.createdAt >= weekAgo && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    // Streak bonuses
    const streakBonuses = transactions
      .filter(t => t.type === 'STREAK_BONUS')
      .reduce((sum, t) => sum + t.amount, 0);

    // Milestone rewards
    const milestoneRewards = transactions
      .filter(t => t.type === 'MILESTONE_REWARD')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEarned,
      totalSpent,
      currentXp: transactions.length > 0 ? 
        transactions[0].userId ? transactions[0].userId : 0 : 0, // This would be calculated from user table
      recentActivityXp: recentXp,
      streakBonuses,
      milestoneRewards,
      xpBySource,
      monthlyXp,
      transactionCount: transactions.length
    };

  } catch (error) {
    console.error('Get XP statistics error:', error);
    return {};
  }
}

function getMonthlyXpData(transactions: any[]) {
  const monthlyData: Record<string, number> = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
    monthlyData[monthKey] = 0;
  }

  // Sum XP by month
  transactions.forEach(transaction => {
    if (transaction.amount > 0) {
      const monthKey = transaction.createdAt.toISOString().substring(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += transaction.amount;
      }
    }
  });

  return Object.entries(monthlyData).map(([month, xp]) => ({
    month,
    xp
  }));
}

async function getUserLeaderboardPosition(userId: string) {
  try {
    // Get user's current XP
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Count users with higher XP
    const higherXpUsers = await prisma.user.count({
      where: {
        xp: {
          gt: user.xp
        }
      }
    });

    const position = higherXpUsers + 1;

    // Get total active users (users with XP > 0)
    const totalUsers = await prisma.user.count({
      where: {
        xp: {
          gt: 0
        }
      }
    });

    return {
      position,
      totalUsers,
      percentile: totalUsers > 0 ? Math.round(((totalUsers - position + 1) / totalUsers) * 100) : 0,
      userXp: user.xp
    };

  } catch (error) {
    console.error('Get leaderboard position error:', error);
    return { error: 'Failed to get leaderboard position' };
  }
}

function getLevelRequirements() {
  const levels = [];
  
  for (let level = 1; level <= 100; level++) {
    const xpRequired = (level * level) * 100;
    const totalXpForLevel = level === 1 ? 0 : levels[level - 2].totalXp + xpRequired;
    
    levels.push({
      level,
      xpRequired,
      totalXpForLevel
    });
  }

  return levels;
}

function calculateLevelFromXp(xp: number): number {
  // Level formula: Level = floor(sqrt(XP / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calculateXpToNextLevel(level: number): number {
  // XP needed for next level: (level^2) * 100
  return (level * level) * 100;
}

function calculateLevelProgress(currentXp: number, currentLevel: number) {
  const xpForCurrentLevel = currentLevel === 1 ? 0 : ((currentLevel - 1) * (currentLevel - 1)) * 100;
  const xpForNextLevel = (currentLevel * currentLevel) * 100;
  const xpInCurrentLevel = currentXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  const progress = xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 100;

  return {
    currentLevel,
    currentXp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progress: Math.round(progress),
    isMaxLevel: currentLevel >= 100
  };
}