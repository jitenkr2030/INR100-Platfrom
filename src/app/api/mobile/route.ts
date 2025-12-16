import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/mobile/offline-content - Get offline content
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, DOWNLOADING, COMPLETED, FAILED, EXPIRED
    const contentType = searchParams.get('contentType'); // course, lesson, media
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: user.id
    };

    if (status) whereClause.downloadStatus = status;
    if (contentType) whereClause.contentType = contentType;

    const offlineContent = await prisma.offlineContent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.offlineContent.count({ where: whereClause });

    // Calculate total storage used
    const storageUsed = offlineContent
      .filter(content => content.downloadStatus === 'COMPLETED')
      .reduce((sum, content) => sum + content.fileSize, 0);

    return NextResponse.json({
      offlineContent,
      storage: {
        used: storageUsed,
        total: null, // Could be calculated based on user subscription
        percentage: null
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching offline content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offline content' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/offline-content - Add content for offline access
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      contentId,
      contentType,
      title,
      filePath,
      fileSize,
      expiresIn // hours
    } = body;

    if (!contentId || !contentType || !title) {
      return NextResponse.json(
        { error: 'Content ID, type, and title are required' },
        { status: 400 }
      );
    }

    // Check if content already exists
    const existingContent = await prisma.offlineContent.findFirst({
      where: {
        userId: user.id,
        contentId,
        contentType
      }
    });

    if (existingContent) {
      return NextResponse.json(
        { error: 'Content already added for offline access' },
        { status: 400 }
      );
    }

    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
      : null;

    const offlineContent = await prisma.offlineContent.create({
      data: {
        userId: user.id,
        contentId,
        contentType,
        title,
        filePath: filePath || '',
        fileSize: fileSize || 0,
        expiresAt,
        downloadStatus: 'PENDING',
        syncStatus: 'PENDING'
      }
    });

    return NextResponse.json({
      offlineContent,
      message: 'Content added for offline access'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding offline content:', error);
    return NextResponse.json(
      { error: 'Failed to add offline content' },
      { status: 500 }
    );
  }
}

// PUT /api/mobile/offline-content/:id - Update offline content status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      downloadStatus,
      syncStatus,
      filePath,
      fileSize,
      lastAccessedAt
    } = body;

    // Verify content belongs to user
    const existingContent = await prisma.offlineContent.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Offline content not found' },
        { status: 404 }
      );
    }

    const offlineContent = await prisma.offlineContent.update({
      where: { id },
      data: {
        downloadStatus,
        syncStatus,
        filePath,
        fileSize,
        lastAccessedAt: lastAccessedAt ? new Date(lastAccessedAt) : undefined,
        downloadedAt: downloadStatus === 'COMPLETED' ? new Date() : undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      offlineContent,
      message: 'Offline content updated successfully'
    });

  } catch (error) {
    console.error('Error updating offline content:', error);
    return NextResponse.json(
      { error: 'Failed to update offline content' },
      { status: 500 }
    );
  }
}

// DELETE /api/mobile/offline-content/:id - Remove offline content
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify content belongs to user
    const existingContent = await prisma.offlineContent.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Offline content not found' },
        { status: 404 }
      );
    }

    await prisma.offlineContent.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Offline content removed successfully'
    });

  } catch (error) {
    console.error('Error removing offline content:', error);
    return NextResponse.json(
      { error: 'Failed to remove offline content' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/notifications - Get push notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, unread, read
    const type = searchParams.get('type'); // notification type filter
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: user.id
    };

    if (status === 'unread') {
      whereClause.isRead = false;
    } else if (status === 'read') {
      whereClause.isRead = true;
    }

    if (type) {
      whereClause.type = type;
    }

    const notifications = await prisma.pushNotification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.pushNotification.count({ where: whereClause });
    const unreadCount = await prisma.pushNotification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/notifications - Create/send push notification
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      body: notificationBody,
      type,
      data,
      scheduledFor,
      priority = 'NORMAL'
    } = body;

    if (!title || !notificationBody || !type) {
      return NextResponse.json(
        { error: 'Title, body, and type are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.pushNotification.create({
      data: {
        userId: user.id,
        title,
        body: notificationBody,
        type,
        data: data ? JSON.stringify(data) : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        priority,
        sentAt: scheduledFor ? null : new Date()
      }
    });

    return NextResponse.json({
      notification,
      message: 'Notification created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT /api/mobile/notifications/:id/read - Mark notification as read
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify notification belongs to user
    const existingNotification = await prisma.pushNotification.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notification = await prisma.pushNotification.update({
      where: { id },
      data: {
        isRead: true,
        clickedAt: new Date()
      }
    });

    return NextResponse.json({
      notification,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/voice-learning - Get voice learning settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    const whereClause: any = {
      userId: user.id
    };

    if (contentId && contentType) {
      whereClause.contentId = contentId;
      whereClause.contentType = contentType;
    }

    const voiceLearningData = await prisma.voiceLearning.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      voiceLearningData
    });

  } catch (error) {
    console.error('Error fetching voice learning data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice learning data' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/voice-learning - Create/update voice learning progress
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      contentId,
      contentType,
      voiceSettings,
      playbackSettings,
      lastPosition,
      totalDuration,
      completed
    } = body;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Content ID and type are required' },
        { status: 400 }
      );
    }

    // Check if voice learning record exists
    let voiceLearning = await prisma.voiceLearning.findFirst({
      where: {
        userId: user.id,
        contentId,
        contentType
      }
    });

    if (voiceLearning) {
      // Update existing record
      voiceLearning = await prisma.voiceLearning.update({
        where: { id: voiceLearning.id },
        data: {
          voiceSettings,
          playbackSettings,
          lastPosition: lastPosition || voiceLearning.lastPosition,
          totalDuration: totalDuration || voiceLearning.totalDuration,
          completed: completed !== undefined ? completed : voiceLearning.completed,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new record
      voiceLearning = await prisma.voiceLearning.create({
        data: {
          userId: user.id,
          contentId,
          contentType,
          voiceSettings,
          playbackSettings,
          lastPosition: lastPosition || 0,
          totalDuration,
          completed: completed || false
        }
      });
    }

    return NextResponse.json({
      voiceLearning,
      message: 'Voice learning progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating voice learning progress:', error);
    return NextResponse.json(
      { error: 'Failed to update voice learning progress' },
      { status: 500 }
    );
  }
}