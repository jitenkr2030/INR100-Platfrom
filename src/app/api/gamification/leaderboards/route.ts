'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overall'; // overall, weekly, monthly, category
    const category = searchParams.get('category'); // trading, learning, social

    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 501 });
    }

    let leaderboards = [];

    if (type === 'overall') {
      leaderboards = await generateOverallLeaderboard(userId);
    } else if (type === 'weekly') {
      leaderboards = await generateWeeklyLeaderboard(userId);
    } else if (type === 'monthly') {
      leaderboards = await generateMonthlyLeaderboard(userId);
    } else if (type === 'category') {
      leaderboards = await generateCategoryLeaderboard(userId, category || 'trading');
    }

    return NextResponse.json(leaderboards);
  } catch (error) {
    console.error('Leaderboards error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboards' }, { status: 500 });
  }
}

async function generateOverallLeaderboard(userId: string) {
  // Get top users by total XP
  const topUsers = await prisma.userLevel.findMany({
    orderBy: { totalXp: 'desc' },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  // Transform to leaderboard entries
  const entries = topUsers.map((userLevel, index) => ({
    rank: index + 1,
    userId: userLevel.user.id,
    username: userLevel.user.name || `User${userLevel.user.id.slice(-4)}`,
    avatar: userLevel.user.avatar,
    score: userLevel.totalXp,
    change: calculateRankChange(userLevel.user.id, index + 1), // Mock rank change
    badge: getBadgeForRank(index + 1)
  }));

  // Get current user's rank
  const currentUserLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  const userRank = currentUserLevel ? 
    entries.findIndex(entry => entry.userId === userId) + 1 : null;
  const userScore = currentUserLevel?.totalXp || 0;

  return [{
    id: 'overall-leaderboard',
    type: 'overall',
    period: 'All Time',
    entries,
    userRank,
    userScore
  }];
}

async function generateWeeklyLeaderboard(userId: string) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get users with XP earned this week
  const weeklyXp = await prisma.userXpTransaction.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startOfWeek
      }
    },
    _sum: {
      amount: true
    }
  });

  // Sort by weekly XP
  weeklyXp.sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0));

  // Get top 100 users
  const topUserIds = weeklyXp.slice(0, 100).map(xp => xp.userId);
  
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: topUserIds
      }
    },
    select: {
      id: true,
      name: true,
      avatar: true
    }
  });

  // Create entries
  const entries = weeklyXp.slice(0, 100).map((xp, index) => {
    const user = users.find(u => u.id === xp.userId);
    return {
      rank: index + 1,
      userId: xp.userId,
      username: user?.name || `User${xp.userId.slice(-4)}`,
      avatar: user?.avatar,
      score: xp._sum.amount || 0,
      change: calculateRankChange(xp.userId, index + 1), // Mock rank change
      badge: getBadgeForRank(index + 1)
    };
  });

  // Get current user's rank
  const userWeeklyXp = weeklyXp.find(xp => xp.userId === userId);
  const userRank = userWeeklyXp ? 
    entries.findIndex(entry => entry.userId === userId) + 1 : null;
  const userScore = userWeeklyXp?._sum.amount || 0;

  return [{
    id: 'weekly-leaderboard',
    type: 'weekly',
    period: getCurrentWeekRange(),
    entries,
    userRank,
    userScore
  }];
}

async function generateMonthlyLeaderboard(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Get users with XP earned this month
  const monthlyXp = await prisma.userXpTransaction.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startOfMonth
      }
    },
    _sum: {
      amount: true
    }
  });

  // Sort by monthly XP
  monthlyXp.sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0));

  // Get top 100 users
  const topUserIds = monthlyXp.slice(0, 100).map(xp => xp.userId);
  
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: topUserIds
      }
    },
    select: {
      id: true,
      name: true,
      avatar: true
    }
  });

  // Create entries
  const entries = monthlyXp.slice(0, 100).map((xp, index) => {
    const user = users.find(u => u.id === xp.userId);
    return {
      rank: index + 1,
      userId: xp.userId,
      username: user?.name || `User${xp.userId.slice(-4)}`,
      avatar: user?.avatar,
      score: xp._sum.amount || 0,
      change: calculateRankChange(xp.userId, index + 1), // Mock rank change
      badge: getBadgeForRank(index + 1)
    };
  });

  // Get current user's rank
  const userMonthlyXp = monthlyXp.find(xp => xp.userId === userId);
  const userRank = userMonthlyXp ? 
    entries.findIndex(entry => entry.userId === userId) + 1 : null;
  const userScore = userMonthlyXp?._sum.amount || 0;

  return [{
    id: 'monthly-leaderboard',
    type: 'monthly',
    period: getCurrentMonthRange(),
    entries,
    userRank,
    userScore
  }];
}

async function generateCategoryLeaderboard(userId: string, category: string) {
  let metric: string;
  let startDate: Date;

  if (category === 'trading') {
    // Trading leaderboard based on completed orders
    metric = 'order_count';
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
  } else if (category === 'learning') {
    // Learning leaderboard based on completed lessons
    metric = 'lesson_completion';
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
  } else if (category === 'social') {
    // Social leaderboard based on posts and engagement
    metric = 'social_score';
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
  } else {
    throw new Error('Invalid category');
  }

  // Get category-specific metrics
  const categoryData = await getCategoryMetrics(category, startDate);

  // Sort by score
  categoryData.sort((a, b) => b.score - a.score);

  // Get top 100
  const topEntries = categoryData.slice(0, 100);

  const entries = topEntries.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    username: entry.username,
    avatar: entry.avatar,
    score: entry.score,
    change: calculateRankChange(entry.userId, index + 1),
    badge: getBadgeForRank(index + 1)
  }));

  // Get current user's rank
  const userEntry = categoryData.find(entry => entry.userId === userId);
  const userRank = userEntry ? 
    entries.findIndex(entry => entry.userId === userId) + 1 : null;
  const userScore = userEntry?.score || 0;

  return [{
    id: `${category}-leaderboard`,
    type: 'category',
    category,
    period: 'Last 30 Days',
    entries,
    userRank,
    userScore
  }];
}

async function getCategoryMetrics(category: string, startDate: Date) {
  let metrics = [];

  if (category === 'trading') {
    // Get trading metrics
    const orders = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        status: 'EXECUTED'
      },
      _count: { id: true }
    });

    const users = await prisma.user.findMany({
      where: {
        id: { in: orders.map(o => o.userId) }
      },
      select: {
        id: true,
        name: true,
        avatar: true
      }
    });

    metrics = orders.map(order => {
      const user = users.find(u => u.id === order.userId);
      return {
        userId: order.userId,
        username: user?.name || `User${order.userId.slice(-4)}`,
        avatar: user?.avatar,
        score: order._count.id || 0
      };
    });
  } else if (category === 'learning') {
    // Get learning metrics
    const lessons = await prisma.userLessonProgress.groupBy({
      by: ['userId'],
      where: {
        completedAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _count: { id: true }
    });

    const users = await prisma.user.findMany({
      where: {
        id: { in: lessons.map(l => l.userId) }
      },
      select: {
        id: true,
        name: true,
        avatar: true
      }
    });

    metrics = lessons.map(lesson => {
      const user = users.find(u => u.id === lesson.userId);
      return {
        userId: lesson.userId,
        username: user?.name || `User${lesson.userId.slice(-4)}`,
        avatar: user?.avatar,
        score: lesson._count.id || 0
      };
    });
  } else if (category === 'social') {
    // Get social metrics
    const posts = await prisma.socialPost.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    });

    const users = await prisma.user.findMany({
      where: {
        id: { in: posts.map(p => p.userId) }
      },
      select: {
        id: true,
        name: true,
        avatar: true
      }
    });

    metrics = posts.map(post => {
      const user = users.find(u => u.id === post.userId);
      return {
        userId: post.userId,
        username: user?.name || `User${post.userId.slice(-4)}`,
        avatar: user?.avatar,
        score: post._count.id || 0
      };
    });
  }

  return metrics;
}

function calculateRankChange(userId: string, currentRank: number): number {
  // Mock rank change calculation
  // In reality, you'd compare with previous period's rankings
  const previousRank = currentRank + Math.floor(Math.random() * 6) - 3; // -3 to +3
  return previousRank - currentRank;
}

function getBadgeForRank(rank: number): string | undefined {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank <= 10) return '⭐';
  if (rank <= 50) return '🌟';
  return undefined;
}

function getCurrentWeekRange(): string {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function getCurrentMonthRange(): string {
  const start = new Date();
  start.setDate(1);
  
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  end.setDate(0);
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}