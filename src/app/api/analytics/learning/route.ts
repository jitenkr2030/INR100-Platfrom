import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/analytics/learning - Get learning analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      // Default period filtering
      switch (period) {
        case '7d':
          dateFilter = {
            date: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
          };
          break;
        case '30d':
          dateFilter = {
            date: {
              gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            }
          };
          break;
        case '90d':
          dateFilter = {
            date: {
              gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            }
          };
          break;
        case '1y':
          dateFilter = {
            date: {
              gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            }
          };
          break;
      }
    }

    // Get learning analytics data
    const analytics = await prisma.learningAnalytics.findMany({
      where: {
        userId: user.id,
        ...dateFilter
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    // Calculate aggregated metrics
    const totalStudyTime = analytics.reduce((sum, day) => sum + day.totalStudyTime, 0);
    const totalSessions = analytics.reduce((sum, day) => sum + day.sessionsCount, 0);
    const averageSessionTime = totalSessions > 0 ? totalStudyTime / totalSessions : 0;
    const totalContentConsumed = analytics.reduce((sum, day) => sum + day.contentConsumed, 0);
    const totalQuizzes = analytics.reduce((sum, day) => sum + day.quizAttempts, 0);
    const averageQuizScore = totalQuizzes > 0 
      ? analytics.reduce((sum, day) => sum + (day.averageQuizScore * day.quizAttempts), 0) / totalQuizzes 
      : 0;
    const completionRate = analytics.length > 0 
      ? analytics.reduce((sum, day) => sum + day.completionRate, 0) / analytics.length 
      : 0;
    const currentStreak = analytics.find(day => day.streakDays > 0)?.streakDays || 0;

    // Get performance metrics
    const performanceMetrics = await prisma.performanceMetrics.findMany({
      where: {
        userId: user.id,
        period: 'MONTHLY'
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });

    // Get recent recommendations
    const recommendations = await prisma.learningRecommendation.findMany({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'VIEWED', 'CLICKED'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get engagement tracking summary
    const engagementSummary = await prisma.engagementTracking.groupBy({
      by: ['eventType'],
      where: {
        userId: user.id,
        timestamp: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      analytics: {
        summary: {
          totalStudyTime,
          totalSessions,
          averageSessionTime: Math.round(averageSessionTime),
          totalContentConsumed,
          totalQuizzes,
          averageQuizScore: Math.round(averageQuizScore * 100) / 100,
          completionRate: Math.round(completionRate * 100) / 100,
          currentStreak,
          period
        },
        dailyData: analytics.map(day => ({
          date: day.date,
          studyTime: day.totalStudyTime,
          sessions: day.sessionsCount,
          contentConsumed: day.contentConsumed,
          quizScore: day.averageQuizScore,
          completionRate: day.completionRate,
          streakDays: day.streakDays
        })),
        performance: performanceMetrics.map(metric => ({
          type: metric.metricType,
          value: metric.metricValue,
          benchmark: metric.benchmarkValue,
          percentile: metric.percentile,
          trend: metric.trend,
          period: metric.period
        })),
        recommendations,
        engagement: engagementSummary.map(item => ({
          eventType: item.eventType,
          count: item._count.id
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching learning analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning analytics' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/learning - Create/update learning analytics
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      totalStudyTime,
      activeStudyTime,
      contentConsumed,
      videosWatched,
      articlesRead,
      exercisesCompleted,
      simulationsRun,
      quizAttempts,
      averageQuizScore,
      completionRate,
      streakDays,
      interactionsCount,
      scrollDepth,
      focusTime,
      pathsStarted,
      pathsCompleted,
      modulesCompleted,
      discussionsPosted,
      studyGroupActivity,
      expertSessionsAttended
    } = body;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if analytics record exists for today
    let analytics = await prisma.learningAnalytics.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      }
    });

    if (analytics) {
      // Update existing record
      analytics = await prisma.learningAnalytics.update({
        where: { id: analytics.id },
        data: {
          sessionId,
          totalStudyTime: totalStudyTime || analytics.totalStudyTime,
          activeStudyTime: activeStudyTime || analytics.activeStudyTime,
          sessionsCount: analytics.sessionsCount + 1,
          averageSessionTime: Math.round(
            (analytics.totalStudyTime + (totalStudyTime || 0)) / 
            (analytics.sessionsCount + 1)
          ),
          contentConsumed: contentConsumed || analytics.contentConsumed,
          videosWatched: videosWatched || analytics.videosWatched,
          articlesRead: articlesRead || analytics.articlesRead,
          exercisesCompleted: exercisesCompleted || analytics.exercisesCompleted,
          simulationsRun: simulationsRun || analytics.simulationsRun,
          quizAttempts: quizAttempts || analytics.quizAttempts,
          averageQuizScore: averageQuizScore || analytics.averageQuizScore,
          completionRate: completionRate || analytics.completionRate,
          streakDays: streakDays || analytics.streakDays,
          interactionsCount: interactionsCount || analytics.interactionsCount,
          scrollDepth: scrollDepth || analytics.scrollDepth,
          focusTime: focusTime || analytics.focusTime,
          pathsStarted: pathsStarted || analytics.pathsStarted,
          pathsCompleted: pathsCompleted || analytics.pathsCompleted,
          modulesCompleted: modulesCompleted || analytics.modulesCompleted,
          discussionsPosted: discussionsPosted || analytics.discussionsPosted,
          studyGroupActivity: studyGroupActivity || analytics.studyGroupActivity,
          expertSessionsAttended: expertSessionsAttended || analytics.expertSessionsAttended,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      analytics = await prisma.learningAnalytics.create({
        data: {
          userId: user.id,
          date: today,
          sessionId,
          totalStudyTime: totalStudyTime || 0,
          activeStudyTime: activeStudyTime || 0,
          sessionsCount: 1,
          averageSessionTime: totalStudyTime || 0,
          contentConsumed: contentConsumed || 0,
          videosWatched: videosWatched || 0,
          articlesRead: articlesRead || 0,
          exercisesCompleted: exercisesCompleted || 0,
          simulationsRun: simulationsRun || 0,
          quizAttempts: quizAttempts || 0,
          averageQuizScore: averageQuizScore || 0,
          completionRate: completionRate || 0,
          streakDays: streakDays || 0,
          interactionsCount: interactionsCount || 0,
          scrollDepth: scrollDepth || 0,
          focusTime: focusTime || 0,
          pathsStarted: pathsStarted || 0,
          pathsCompleted: pathsCompleted || 0,
          modulesCompleted: modulesCompleted || 0,
          discussionsPosted: discussionsPosted || 0,
          studyGroupActivity: studyGroupActivity || 0,
          expertSessionsAttended: expertSessionsAttended || 0
        }
      });
    }

    return NextResponse.json({
      analytics,
      message: 'Learning analytics updated successfully'
    });

  } catch (error) {
    console.error('Error updating learning analytics:', error);
    return NextResponse.json(
      { error: 'Failed to update learning analytics' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/performance - Get performance metrics
export async function GET(request: NextRequest, { params }: { params: { type?: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type');
    const period = searchParams.get('period') || 'MONTHLY';

    const whereClause: any = {
      userId: user.id,
      period
    };

    if (metricType) {
      whereClause.metricType = metricType;
    }

    const performanceMetrics = await prisma.performanceMetrics.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      performanceMetrics
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}