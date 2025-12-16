import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // LESSON, QUIZ, COURSE_REVIEW
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { userId };
    if (type) {
      whereClause.sessionType = type;
    }

    const sessions = await prisma.learningSession.findMany({
      where: whereClause,
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                title: true
              }
            }
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    // Calculate session analytics
    const totalSessions = await prisma.learningSession.count({
      where: { userId }
    });

    const totalTimeSpent = await prisma.learningSession.aggregate({
      where: { userId, endTime: { not: null } },
      _sum: { duration: true }
    });

    const avgSessionDuration = await prisma.learningSession.aggregate({
      where: { userId, endTime: { not: null } },
      _avg: { duration: true }
    });

    // Get session type distribution
    const sessionTypeStats = await prisma.learningSession.groupBy({
      by: ['sessionType'],
      where: { userId },
      _count: { sessionType: true },
      _sum: { duration: true }
    });

    return NextResponse.json({
      sessions,
      analytics: {
        totalSessions,
        totalTimeSpent: totalTimeSpent._sum.duration || 0,
        avgSessionDuration: Math.round(avgSessionDuration._avg.duration || 0),
        sessionTypeDistribution: sessionTypeStats.map(stat => ({
          type: stat.sessionType,
          count: stat._count.sessionType,
          totalTime: stat._sum.duration || 0
        }))
      },
      pagination: {
        limit,
        offset,
        hasMore: sessions.length === limit
      }
    });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      sessionType, 
      lessonId, 
      courseId, 
      quizId,
      startTime 
    } = body;

    if (!userId || !sessionType) {
      return NextResponse.json(
        { error: 'User ID and session type are required' },
        { status: 400 }
      );
    }

    // Create new learning session
    const session = await prisma.learningSession.create({
      data: {
        userId,
        sessionType,
        startTime: startTime ? new Date(startTime) : new Date(),
        lessonId: lessonId || null,
        courseId: courseId || null,
        quizId: quizId || null
      }
    });

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, endTime, duration } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get existing session
    const existingSession = await prisma.learningSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const sessionEndTime = endTime ? new Date(endTime) : now;
    
    // Calculate duration if not provided
    let sessionDuration = duration;
    if (!sessionDuration && existingSession.startTime) {
      sessionDuration = Math.floor((sessionEndTime.getTime() - existingSession.startTime.getTime()) / 1000);
    }

    // Update session
    const updatedSession = await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        endTime: sessionEndTime,
        duration: sessionDuration || 0
      }
    });

    // Update lesson progress if this is a lesson session
    if (existingSession.lessonId && sessionDuration) {
      await updateLessonProgressTime(existingSession.userId, existingSession.lessonId, sessionDuration);
    }

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

async function updateLessonProgressTime(userId: string, lessonId: string, timeSpent: number) {
  try {
    // Find existing progress record
    let progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (progress) {
      // Update existing record
      await prisma.userLessonProgress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        data: {
          timeSpent: { increment: Math.floor(timeSpent / 60) }, // Convert seconds to minutes
          lastAccessedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Update lesson progress time error:', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await prisma.learningSession.delete({
      where: { id: sessionId }
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// Additional endpoint for session analytics
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, dateRange } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'analytics':
        return await getSessionAnalytics(userId, dateRange);
      
      case 'daily_stats':
        return await getDailySessionStats(userId, dateRange);
      
      case 'weekly_summary':
        return await getWeeklySessionSummary(userId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Session analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to process session analytics' },
      { status: 500 }
    );
  }
}

async function getSessionAnalytics(userId: string, dateRange?: { start: string; end: string }) {
  try {
    const whereClause: any = { userId };
    
    if (dateRange) {
      whereClause.startTime = {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end)
      };
    }

    // Get various analytics
    const [
      totalSessions,
      totalTimeSpent,
      sessionTypeStats,
      dailyActivity,
      weeklyActivity,
      longestSession,
      avgSessionTime
    ] = await Promise.all([
      prisma.learningSession.count({ where: whereClause }),
      
      prisma.learningSession.aggregate({
        where: { ...whereClause, endTime: { not: null } },
        _sum: { duration: true }
      }),
      
      prisma.learningSession.groupBy({
        by: ['sessionType'],
        where: whereClause,
        _count: { sessionType: true },
        _sum: { duration: true }
      }),
      
      getDailyActivity(userId, dateRange),
      
      getWeeklyActivity(userId),
      
      prisma.learningSession.findFirst({
        where: { ...whereClause, endTime: { not: null } },
        orderBy: { duration: 'desc' }
      }),
      
      prisma.learningSession.aggregate({
        where: { ...whereClause, endTime: { not: null } },
        _avg: { duration: true }
      })
    ]);

    return NextResponse.json({
      analytics: {
        totalSessions,
        totalTimeSpent: totalTimeSpent._sum.duration || 0,
        avgSessionDuration: Math.round(avgSessionTime._avg.duration || 0),
        longestSession: longestSession?.duration || 0,
        sessionTypeBreakdown: sessionTypeStats.map(stat => ({
          type: stat.sessionType,
          count: stat._count.sessionType,
          totalTime: stat._sum.duration || 0,
          percentage: totalSessions > 0 ? (stat._count.sessionType / totalSessions) * 100 : 0
        })),
        dailyActivity,
        weeklyActivity
      }
    });

  } catch (error) {
    console.error('Get session analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get session analytics' },
      { status: 500 }
    );
  }
}

async function getDailyActivity(userId: string, dateRange?: { start: string; end: string }) {
  try {
    const whereClause: any = { userId };
    
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.startTime = {
        gte: startDate,
        lte: endDate
      };
    }

    const sessions = await prisma.learningSession.findMany({
      where: whereClause,
      select: {
        startTime: true,
        duration: true,
        sessionType: true
      }
    });

    // Group by date
    const dailyStats: Record<string, { date: string; sessions: number; timeSpent: number; types: Record<string, number> }> = {};

    sessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          sessions: 0,
          timeSpent: 0,
          types: {}
        };
      }
      
      dailyStats[date].sessions += 1;
      dailyStats[date].timeSpent += session.duration || 0;
      dailyStats[date].types[session.sessionType] = (dailyStats[date].types[session.sessionType] || 0) + 1;
    });

    return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

  } catch (error) {
    console.error('Get daily activity error:', error);
    return [];
  }
}

async function getWeeklyActivity(userId: string) {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const sessions = await prisma.learningSession.findMany({
      where: {
        userId,
        startTime: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      select: {
        startTime: true,
        duration: true,
        sessionType: true
      }
    });

    // Group by day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyStats = days.map((day, index) => {
      const daySessions = sessions.filter(s => {
        const sessionDay = s.startTime.getDay();
        return sessionDay === index;
      });

      return {
        day,
        sessions: daySessions.length,
        timeSpent: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        types: daySessions.reduce((acc, s) => {
          acc[s.sessionType] = (acc[s.sessionType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    });

    return weeklyStats;

  } catch (error) {
    console.error('Get weekly activity error:', error);
    return [];
  }
}

async function getDailySessionStats(userId: string, dateRange?: { start: string; end: string }) {
  // This would return detailed stats for each day in the range
  return await getDailyActivity(userId, dateRange);
}

async function getWeeklySessionSummary(userId: string) {
  // This would return a summary of the current week
  return await getWeeklyActivity(userId);
}