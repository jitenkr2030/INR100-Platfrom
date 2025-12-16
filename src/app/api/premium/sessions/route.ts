import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/premium/sessions - Get expert sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'upcoming'; // upcoming, live, completed, all
    const sessionType = searchParams.get('type') || '';
    const instructor = searchParams.get('instructor') || '';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const now = new Date();

    // Build where clause
    let whereClause: any = {};

    switch (status) {
      case 'upcoming':
        whereClause.scheduledAt = { gte: now };
        whereClause.status = 'SCHEDULED';
        break;
      case 'live':
        whereClause.scheduledAt = { lte: now };
        whereClause.status = 'LIVE';
        break;
      case 'completed':
        whereClause.status = 'COMPLETED';
        break;
    }

    if (sessionType) whereClause.sessionType = sessionType;
    if (instructor) {
      whereClause.OR = [
        { instructorName: { contains: instructor, mode: 'insensitive' } },
        { instructorTitle: { contains: instructor, mode: 'insensitive' } }
      ];
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructorName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const sessions = await prisma.expertSession.findMany({
      where: whereClause,
      include: {
        attendees: user ? {
          where: { userId: user.id }
        } : false,
        premiumCourse: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      skip: offset
    });

    const sessionsWithStatus = sessions.map(session => {
      const isAttending = user ? session.attendees.length > 0 : false;
      const isLive = session.status === 'LIVE';
      const canJoin = isAttending && (isLive || new Date(session.scheduledAt) <= now);
      
      return {
        ...session,
        isAttending,
        isLive,
        canJoin,
        attendeeCount: session._count.attendees
      };
    });

    const total = await prisma.expertSession.count({ where: whereClause });

    return NextResponse.json({
      sessions: sessionsWithStatus,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching expert sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expert sessions' },
      { status: 500 }
    );
  }
}

// POST /api/premium/sessions - Create expert session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    // This would be implemented based on your user role system

    const body = await request.json();
    const {
      premiumCourseId,
      title,
      description,
      sessionType,
      instructorName,
      instructorTitle,
      scheduledAt,
      duration,
      maxAttendees,
      price,
      meetingLink,
      tags
    } = body;

    if (!title || !description || !sessionType || !scheduledAt) {
      return NextResponse.json(
        { error: 'Title, description, session type, and scheduled time are required' },
        { status: 400 }
      );
    }

    const sessionDateTime = new Date(scheduledAt);
    if (sessionDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Session must be scheduled for the future' },
        { status: 400 }
      );
    }

    const expertSession = await prisma.expertSession.create({
      data: {
        premiumCourseId,
        title,
        description,
        sessionType,
        instructorId: user.id,
        instructorName: instructorName || user.name,
        instructorTitle,
        scheduledAt: sessionDateTime,
        duration: duration || 60,
        maxAttendees: maxAttendees || 50,
        price: price || 0,
        meetingLink,
        tags: tags ? JSON.stringify(tags) : null,
        status: 'SCHEDULED'
      }
    });

    return NextResponse.json({
      session: expertSession,
      message: 'Expert session created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating expert session:', error);
    return NextResponse.json(
      { error: 'Failed to create expert session' },
      { status: 500 }
    );
  }
}

// GET /api/premium/sessions/[id] - Get specific expert session
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const { id } = params;

    const session = await prisma.expertSession.findUnique({
      where: { id },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        premiumCourse: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const isAttending = user ? session.attendees.some(attendee => attendee.userId === user.id) : false;
    const isLive = session.status === 'LIVE';
    const canJoin = isAttending && (isLive || new Date(session.scheduledAt) <= now);

    return NextResponse.json({
      session: {
        ...session,
        isAttending,
        isLive,
        canJoin
      }
    });

  } catch (error) {
    console.error('Error fetching expert session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expert session' },
      { status: 500 }
    );
  }
}

// POST /api/premium/sessions/[id]/register - Register for expert session
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if session exists
    const session = await prisma.expertSession.findUnique({
      where: { id }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is in the past
    if (new Date(session.scheduledAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot register for past sessions' },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingRegistration = await prisma.sessionAttendee.findUnique({
      where: {
        expertSessionId_userId: {
          expertSessionId: id,
          userId: user.id
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this session' },
        { status: 400 }
      );
    }

    // Check attendee limit
    if (session.currentAttendees >= session.maxAttendees) {
      return NextResponse.json(
        { error: 'Session is full' },
        { status: 400 }
      );
    }

    const attendee = await prisma.sessionAttendee.create({
      data: {
        expertSessionId: id,
        userId: user.id,
        paymentStatus: session.price > 0 ? 'PENDING' : 'COMPLETED'
      }
    });

    // Update session attendee count
    await prisma.expertSession.update({
      where: { id },
      data: {
        currentAttendees: { increment: 1 }
      }
    });

    return NextResponse.json({
      attendee,
      message: 'Successfully registered for session'
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering for expert session:', error);
    return NextResponse.json(
      { error: 'Failed to register for session' },
      { status: 500 }
    );
  }
}

// PUT /api/premium/sessions/[id]/feedback - Submit session feedback
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { rating, feedback } = body;

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user is registered for this session
    const attendee = await prisma.sessionAttendee.findUnique({
      where: {
        expertSessionId_userId: {
          expertSessionId: id,
          userId: user.id
        }
      }
    });

    if (!attendee) {
      return NextResponse.json(
        { error: 'Not registered for this session' },
        { status: 404 }
      );
    }

    const updatedAttendee = await prisma.sessionAttendee.update({
      where: { id: attendee.id },
      data: {
        rating,
        feedback,
        attendedAt: new Date()
      }
    });

    return NextResponse.json({
      attendee: updatedAttendee,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting session feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}