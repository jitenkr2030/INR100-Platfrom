import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // VIDEO, AUDIO, IMAGE, etc.
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause: any = { isActive: true };
    
    if (type) {
      whereClause.type = type;
    }

    // Get media content based on context
    if (lessonId) {
      // Get media for specific lesson
      const lessonMedia = await prisma.lessonMedia.findMany({
        where: { lessonId },
        include: {
          media: true
        },
        orderBy: { order: 'asc' }
      });

      return NextResponse.json({
        lessonId,
        media: lessonMedia.map(lm => ({
          id: lm.media.id,
          title: lm.media.title,
          description: lm.media.description,
          type: lm.media.type,
          url: lm.media.url,
          thumbnailUrl: lm.media.thumbnailUrl,
          duration: lm.media.duration,
          order: lm.order,
          isRequired: lm.isRequired,
          startTime: lm.startTime,
          endTime: lm.endTime,
          notes: lm.notes
        }))
      });
    } else if (courseId) {
      // Get media for specific course
      const courseMedia = await prisma.courseMedia.findMany({
        where: { courseId },
        include: {
          media: true
        },
        orderBy: { order: 'asc' }
      });

      return NextResponse.json({
        courseId,
        media: courseMedia.map(cm => ({
          id: cm.media.id,
          title: cm.media.title,
          description: cm.media.description,
          type: cm.media.type,
          url: cm.media.url,
          thumbnailUrl: cm.media.thumbnailUrl,
          duration: cm.media.duration,
          category: cm.category,
          order: cm.order
        }))
      });
    } else {
      // Get all media content with filtering
      const mediaContent = await prisma.mediaContent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return NextResponse.json({
        media: mediaContent,
        pagination: {
          limit,
          offset,
          hasMore: mediaContent.length === limit
        }
      });
    }

  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      type, 
      url, 
      thumbnailUrl, 
      duration, 
      fileSize, 
      quality, 
      tags,
      lessonId,
      courseId,
      category,
      order = 0,
      isRequired = false,
      startTime,
      endTime,
      notes
    } = body;

    if (!title || !type || !url) {
      return NextResponse.json(
        { error: 'Title, type, and URL are required' },
        { status: 400 }
      );
    }

    // Create media content
    const mediaContent = await prisma.mediaContent.create({
      data: {
        title,
        description,
        type: type as any,
        url,
        thumbnailUrl,
        duration,
        fileSize,
        quality,
        tags: tags ? JSON.stringify(tags) : null
      }
    });

    // Associate with lesson or course if provided
    if (lessonId) {
      await prisma.lessonMedia.create({
        data: {
          lessonId,
          mediaId: mediaContent.id,
          order,
          isRequired,
          startTime,
          endTime,
          notes
        }
      });
    } else if (courseId) {
      await prisma.courseMedia.create({
        data: {
          courseId,
          mediaId: mediaContent.id,
          category: category || 'supplementary',
          order
        }
      });
    }

    return NextResponse.json({
      success: true,
      media: mediaContent,
      message: 'Media content created successfully'
    });

  } catch (error) {
    console.error('Media creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create media content' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      title, 
      description, 
      url, 
      thumbnailUrl, 
      duration, 
      fileSize, 
      quality, 
      tags,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updateData.duration = duration;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (quality !== undefined) updateData.quality = quality;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedMedia = await prisma.mediaContent.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      media: updatedMedia,
      message: 'Media content updated successfully'
    });

  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json(
      { error: 'Failed to update media content' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Delete associated lesson/course media first
    await prisma.lessonMedia.deleteMany({
      where: { mediaId: id }
    });

    await prisma.courseMedia.deleteMany({
      where: { mediaId: id }
    });

    // Delete the media content
    await prisma.mediaContent.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Media content deleted successfully'
    });

  } catch (error) {
    console.error('Media deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media content' },
      { status: 500 }
    );
  }
}

// Additional endpoint for media analytics
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mediaId, userId } = body;

    if (!action || !mediaId) {
      return NextResponse.json(
        { error: 'Action and media ID are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'track_view':
        // Track media view/usage
        // This could be extended to track view duration, completion rate, etc.
        return NextResponse.json({
          success: true,
          message: 'Media view tracked successfully'
        });

      case 'get_analytics':
        // Get analytics for media content
        const analytics = await getMediaAnalytics(mediaId);
        return NextResponse.json(analytics);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Media action error:', error);
    return NextResponse.json(
      { error: 'Failed to process media action' },
      { status: 500 }
    );
  }
}

async function getMediaAnalytics(mediaId: string) {
  try {
    // This would typically include view counts, completion rates, etc.
    // For now, return basic information
    const media = await prisma.mediaContent.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      return { error: 'Media not found' };
    }

    return {
      media: {
        id: media.id,
        title: media.title,
        type: media.type,
        duration: media.duration,
        createdAt: media.createdAt
      },
      analytics: {
        views: 0, // This would come from a view tracking table
        completionRate: 0,
        averageWatchTime: 0,
        userEngagement: 0
      }
    };

  } catch (error) {
    console.error('Get media analytics error:', error);
    return { error: 'Failed to get analytics' };
  }
}