import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/analytics/engagement - Get engagement tracking data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const eventType = searchParams.get('eventType');
    const page = searchParams.get('page');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: user.id
    };

    if (sessionId) whereClause.sessionId = sessionId;
    if (eventType) whereClause.eventType = eventType;
    if (page) whereClause.page = page;
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const engagementData = await prisma.engagementTracking.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.engagementTracking.count({ where: whereClause });

    // Get engagement summary
    const engagementSummary = await prisma.engagementTracking.groupBy({
      by: ['eventType'],
      where: {
        userId: user.id,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      _count: {
        id: true
      },
      _avg: {
        duration: true
      }
    });

    // Get page-wise engagement
    const pageEngagement = await prisma.engagementTracking.groupBy({
      by: ['page'],
      where: {
        userId: user.id,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      engagementData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        byEventType: engagementSummary.map(item => ({
          eventType: item.eventType,
          count: item._count.id,
          averageDuration: item._avg.duration || 0
        })),
        byPage: pageEngagement.map(item => ({
          page: item.page,
          count: item._count.id
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/engagement - Track engagement event
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      eventType,
      eventData,
      page,
      component,
      action,
      timestamp,
      duration,
      metadata
    } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Session ID and event type are required' },
        { status: 400 }
      );
    }

    const engagementEvent = await prisma.engagementTracking.create({
      data: {
        userId: user.id,
        sessionId,
        eventType,
        eventData: eventData ? JSON.stringify(eventData) : null,
        page,
        component,
        action,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        duration,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    return NextResponse.json({
      engagementEvent,
      message: 'Engagement event tracked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error tracking engagement event:', error);
    return NextResponse.json(
      { error: 'Failed to track engagement event' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/engagement/summary - Get engagement summary
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get daily engagement counts
    const dailyEngagement = await prisma.engagementTracking.groupBy({
      by: ['timestamp'],
      where: {
        userId: user.id,
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get event type distribution
    const eventTypeDistribution = await prisma.engagementTracking.groupBy({
      by: ['eventType'],
      where: {
        userId: user.id,
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get session statistics
    const sessionStats = await prisma.engagementTracking.groupBy({
      by: ['sessionId'],
      where: {
        userId: user.id,
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        duration: true
      }
    });

    const totalSessions = sessionStats.length;
    const totalEvents = dailyEngagement.reduce((sum, day) => sum + day._count.id, 0);
    const averageEventsPerSession = totalSessions > 0 ? totalEvents / totalSessions : 0;
    const averageSessionDuration = sessionStats.length > 0 
      ? sessionStats.reduce((sum, session) => sum + (session._avg.duration || 0), 0) / sessionStats.length 
      : 0;

    return NextResponse.json({
      summary: {
        period,
        totalSessions,
        totalEvents,
        averageEventsPerSession: Math.round(averageEventsPerSession * 100) / 100,
        averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
        startDate,
        endDate: now
      },
      dailyEngagement: dailyEngagement.map(day => ({
        date: day.timestamp,
        eventCount: day._count.id
      })),
      eventTypeDistribution: eventTypeDistribution.map(item => ({
        eventType: item.eventType,
        count: item._count.id,
        percentage: Math.round((item._count.id / totalEvents) * 100 * 100) / 100
      })),
      sessionStatistics: sessionStats.map(session => ({
        sessionId: session.sessionId,
        eventCount: session._count.id,
        averageDuration: session._avg.duration || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching engagement summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement summary' },
      { status: 500 }
    );
  }
}