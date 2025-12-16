import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'weekly'; // weekly, monthly, all_time
    const category = searchParams.get('category') || 'overall'; // overall, course_specific
    const limit = parseInt(searchParams.get('limit') || '10');

    let period = '';
    const now = new Date();

    // Calculate period based on type
    switch (type) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        period = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        period = monthStart.toISOString().split('T')[0];
        break;
      case 'all_time':
        period = 'all_time';
        break;
    }

    // Find or create leaderboard
    let leaderboard = await prisma.leaderboard.findFirst({
      where: {
        type: type as any,
        category,
        period
      }
    });

    if (!leaderboard && type !== 'all_time') {
      // Create new leaderboard entry for this period
      leaderboard = await prisma.leaderboard.create({
        data: {
          type: type as any,
          category,
          period,
          isActive: true
        }
      });
    }

    let leaderboardEntries = [];

    if (type === 'all_time') {
      // Get all-time rankings based on total XP
      const topUsers = await prisma.user.findMany({
        orderBy: { xp: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          avatar: true,
          level: true,
          xp: true,
          streak: true
        }
      });

      leaderboardEntries = topUsers.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        level: user.level,
        score: user.xp,
        streak: user.streak
      }));
    } else {
      // Get period-specific rankings
      if (leaderboard) {
        const entries = await prisma.leaderboardEntry.findMany({
          where: { leaderboardId: leaderboard.id },
          orderBy: { rank: 'asc' },
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                level: true
              }
            }
          }
        });

        leaderboardEntries = entries.map(entry => ({
          rank: entry.rank,
          userId: entry.userId,
          userName: entry.user.name,
          userAvatar: entry.user.avatar,
          level: entry.user.level,
          score: entry.score,
          metadata: entry.metadata ? JSON.parse(entry.metadata) : null
        }));
      }
    }

    // If no entries exist for the period, generate them
    if (leaderboardEntries.length === 0 && leaderboard) {
      await generateLeaderboardEntries(leaderboard.id, type, category);
      
      // Fetch the generated entries
      const entries = await prisma.leaderboardEntry.findMany({
        where: { leaderboardId: leaderboard.id },
        orderBy: { rank: 'asc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              level: true
            }
          }
        }
      });

      leaderboardEntries = entries.map(entry => ({
        rank: entry.rank,
        userId: entry.userId,
        userName: entry.user.name,
        userAvatar: entry.user.avatar,
        level: entry.user.level,
        score: entry.score,
        metadata: entry.metadata ? JSON.parse(entry.metadata) : null
      }));
    }

    return NextResponse.json({
      type,
      category,
      period,
      leaderboard: leaderboard ? {
        id: leaderboard.id,
        isActive: leaderboard.isActive,
        createdAt: leaderboard.createdAt
      } : null,
      entries: leaderboardEntries
    });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, userId } = body;

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Type and userId are required' },
        { status: 400 }
      );
    }

    // Get user's current stats
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

    let period = '';
    const now = new Date();

    // Calculate period
    switch (type) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        period = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        period = monthStart.toISOString().split('T')[0];
        break;
    }

    // Find or create leaderboard
    let leaderboard = await prisma.leaderboard.findFirst({
      where: {
        type: type as any,
        category: category || 'overall',
        period
      }
    });

    if (!leaderboard) {
      leaderboard = await prisma.leaderboard.create({
        data: {
          type: type as any,
          category: category || 'overall',
          period,
          isActive: true
        }
      });
    }

    // Calculate score based on type
    let score = 0;
    let metadata: any = {};

    switch (type) {
      case 'weekly':
        // Get XP earned this week
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weeklyXp = await prisma.userXpTransaction.aggregate({
          where: {
            userId,
            createdAt: {
              gte: weekStart
            }
          },
          _sum: {
            amount: true
          }
        });

        score = weeklyXp._sum.amount || 0;
        metadata = {
          weeklyXp: score,
          streak: user.streak,
          level: user.level
        };
        break;

      case 'monthly':
        // Get XP earned this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);

        const monthlyXp = await prisma.userXpTransaction.aggregate({
          where: {
            userId,
            createdAt: {
              gte: monthStart
            }
          },
          _sum: {
            amount: true
          }
        });

        score = monthlyXp._sum.amount || 0;
        metadata = {
          monthlyXp: score,
          streak: user.streak,
          level: user.level
        };
        break;

      default:
        score = user.xp;
        metadata = {
          totalXp: user.xp,
          streak: user.streak,
          level: user.level
        };
    }

    // Update or create leaderboard entry
    const existingEntry = await prisma.leaderboardEntry.findUnique({
      where: {
        leaderboardId_userId: {
          leaderboardId: leaderboard.id,
          userId
        }
      }
    });

    if (existingEntry) {
      await prisma.leaderboardEntry.update({
        where: {
          leaderboardId_userId: {
            leaderboardId: leaderboard.id,
            userId
          }
        },
        data: {
          score,
          metadata: JSON.stringify(metadata)
        }
      });
    } else {
      await prisma.leaderboardEntry.create({
        data: {
          leaderboardId: leaderboard.id,
          userId,
          score,
          rank: 0, // Will be updated when rankings are recalculated
          metadata: JSON.stringify(metadata)
        }
      });
    }

    // Recalculate rankings
    await recalculateRankings(leaderboard.id);

    return NextResponse.json({
      success: true,
      message: 'Leaderboard entry updated successfully'
    });

  } catch (error) {
    console.error('Leaderboard update error:', error);
    return NextResponse.json(
      { error: 'Failed to update leaderboard entry' },
      { status: 500 }
    );
  }
}

async function generateLeaderboardEntries(leaderboardId: string, type: string, category: string) {
  try {
    const now = new Date();
    let startDate: Date;
    let scoreField = 'xp';

    // Set date range based on leaderboard type
    switch (type) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        scoreField = 'weeklyXp';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        scoreField = 'monthlyXp';
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get users with their XP data for the period
    const users = await prisma.user.findMany({
      include: {
        userLevel: true,
        xpTransactions: type !== 'all_time' ? {
          where: {
            createdAt: {
              gte: startDate
            }
          }
        } : false
      }
    });

    const leaderboardEntries = [];

    for (const user of users) {
      let score = 0;

      if (type === 'all_time') {
        score = user.xp;
      } else {
        // Calculate period-specific XP
        const periodXp = user.xpTransactions?.reduce((sum, transaction) => {
          return sum + transaction.amount;
        }, 0) || 0;
        score = periodXp;
      }

      if (score > 0) {
        leaderboardEntries.push({
          leaderboardId,
          userId: user.id,
          score,
          rank: 0,
          metadata: JSON.stringify({
            totalXp: user.xp,
            streak: user.streak,
            level: user.level,
            name: user.name
          })
        });
      }
    }

    // Sort by score and assign ranks
    leaderboardEntries.sort((a, b) => b.score - a.score);

    for (let i = 0; i < leaderboardEntries.length; i++) {
      leaderboardEntries[i].rank = i + 1;
    }

    // Create entries in batch
    if (leaderboardEntries.length > 0) {
      await prisma.leaderboardEntry.createMany({
        data: leaderboardEntries
      });
    }

  } catch (error) {
    console.error('Generate leaderboard entries error:', error);
  }
}

async function recalculateRankings(leaderboardId: string) {
  try {
    // Get all entries for this leaderboard
    const entries = await prisma.leaderboardEntry.findMany({
      where: { leaderboardId },
      orderBy: { score: 'desc' }
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      await prisma.leaderboardEntry.update({
        where: { id: entries[i].id },
        data: { rank: i + 1 }
      });
    }
  } catch (error) {
    console.error('Recalculate rankings error:', error);
  }
}