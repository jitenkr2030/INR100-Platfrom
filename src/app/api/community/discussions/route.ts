import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause: any = {};

    if (lessonId) {
      whereClause.lessonId = lessonId;
    } else if (courseId) {
      whereClause.courseId = courseId;
    }

    const discussions = await prisma.discussion.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            votes: true,
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                },
                votes: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        votes: true
      },
      orderBy: [
        { isPinned: 'desc' },
        { upvotes: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    return NextResponse.json({
      discussions: discussions.map(discussion => ({
        ...discussion,
        hasVoted: userId ? discussion.votes.some(v => v.userId === userId) : false,
        userVote: userId ? discussion.votes.find(v => v.userId === userId)?.type : null
      })),
      pagination: {
        limit,
        offset,
        hasMore: discussions.length === limit
      }
    });

  } catch (error) {
    console.error('Discussions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lessonId, courseId, title, content, type = 'GENERAL' } = body;

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: 'User ID, title, and content are required' },
        { status: 400 }
      );
    }

    const discussion = await prisma.discussion.create({
      data: {
        userId,
        lessonId,
        courseId,
        title,
        content,
        type: type as any
      },
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

    return NextResponse.json({
      success: true,
      discussion,
      message: 'Discussion created successfully'
    });

  } catch (error) {
    console.error('Discussion creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { discussionId, userId, action } = body;

    if (!discussionId || !userId || !action) {
      return NextResponse.json(
        { error: 'Discussion ID, user ID, and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'vote':
        return await voteDiscussion(body);
      
      case 'add_comment':
        return await addComment(body);
      
      case 'update_status':
        return await updateDiscussionStatus(body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Discussion update error:', error);
    return NextResponse.json(
      { error: 'Failed to update discussion' },
      { status: 500 }
    );
  }
}

async function voteDiscussion(body: any) {
  try {
    const { discussionId, userId, voteType } = body;

    if (!discussionId || !userId || !voteType) {
      return NextResponse.json(
        { error: 'Discussion ID, user ID, and vote type are required' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existingVote = await prisma.discussionVote.findUnique({
      where: {
        discussionId_userId: {
          discussionId,
          userId
        }
      }
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote if same type
        await prisma.discussionVote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Update vote if different type
        await prisma.discussionVote.update({
          where: { id: existingVote.id },
          data: { type: voteType }
        });
      }
    } else {
      // Create new vote
      await prisma.discussionVote.create({
        data: {
          discussionId,
          userId,
          type: voteType
        }
      });
    }

    // Update discussion vote counts
    const votes = await prisma.discussionVote.findMany({
      where: { discussionId }
    });

    const upvotes = votes.filter(v => v.type === 'upvote').length;
    const downvotes = votes.filter(v => v.type === 'downvote').length;

    await prisma.discussion.update({
      where: { id: discussionId },
      data: {
        upvotes,
        downvotes
      }
    });

    return NextResponse.json({
      success: true,
      upvotes,
      downvotes,
      userVote: existingVote?.type === voteType ? null : voteType
    });

  } catch (error) {
    console.error('Vote discussion error:', error);
    return NextResponse.json(
      { error: 'Failed to vote on discussion' },
      { status: 500 }
    );
  }
}

async function addComment(body: any) {
  try {
    const { discussionId, userId, content, parentId } = body;

    if (!discussionId || !userId || !content) {
      return NextResponse.json(
        { error: 'Discussion ID, user ID, and content are required' },
        { status: 400 }
      );
    }

    const comment = await prisma.discussionComment.create({
      data: {
        discussionId,
        userId,
        content,
        parentId
      },
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

    // Update discussion view count
    await prisma.discussion.update({
      where: { id: discussionId },
      data: {
        views: { increment: 1 }
      }
    });

    return NextResponse.json({
      success: true,
      comment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

async function updateDiscussionStatus(body: any) {
  try {
    const { discussionId, userId, status, isPinned, isSolved } = body;

    if (!discussionId || !userId) {
      return NextResponse.json(
        { error: 'Discussion ID and user ID are required' },
        { status: 400 }
      );
    }

    // Check if user is discussion author or has moderator permissions
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId }
    });

    if (!discussion || discussion.userId !== userId) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (isSolved !== undefined) updateData.isSolved = isSolved;

    const updatedDiscussion = await prisma.discussion.update({
      where: { id: discussionId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      discussion: updatedDiscussion,
      message: 'Discussion status updated successfully'
    });

  } catch (error) {
    console.error('Update discussion status error:', error);
    return NextResponse.json(
      { error: 'Failed to update discussion status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get('discussionId');
    const userId = searchParams.get('userId');

    if (!discussionId || !userId) {
      return NextResponse.json(
        { error: 'Discussion ID and user ID are required' },
        { status: 400 }
      );
    }

    // Check if user is discussion author
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId }
    });

    if (!discussion || discussion.userId !== userId) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete discussion and all related data
    await prisma.discussionComment.deleteMany({
      where: { discussionId }
    });

    await prisma.discussionVote.deleteMany({
      where: { discussionId }
    });

    await prisma.discussion.delete({
      where: { id: discussionId }
    });

    return NextResponse.json({
      success: true,
      message: 'Discussion deleted successfully'
    });

  } catch (error) {
    console.error('Discussion deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    );
  }
}