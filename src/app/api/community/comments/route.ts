import { NextRequest, NextResponse } from 'next/server';
import { Comment } from '../types';

const mockComments: Comment[] = [
  {
    id: 'c1',
    postId: '1',
    authorId: 'user4',
    author: {
      username: 'mohit_trader',
      displayName: 'Mohit Sharma',
      avatar: '/avatars/user2.jpg',
      verified: false
    },
    content: "Great analysis! Which specific IT stocks are you recommending?",
    mentions: [],
    likes: 12,
    replies: 1,
    isLiked: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'c2',
    postId: '1',
    authorId: 'user1',
    author: {
      username: 'ananya_sharma',
      displayName: 'Dr. Ananya Sharma',
      avatar: '/avatars/expert1.jpg',
      verified: true
    },
    content: "@mohit_trader I'm particularly bullish on Infosys, TCS, and HCL Tech. Strong fundamentals and reasonable valuations.",
    mentions: ['mohit_trader'],
    likes: 8,
    replies: 0,
    isLiked: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'c3',
    postId: '2',
    authorId: 'user5',
    author: {
      username: 'sneha_invests',
      displayName: 'Sneha Gupta',
      avatar: '/avatars/user3.jpg',
      verified: false
    },
    content: "Congratulations! 🎉 SIP consistency is key to building wealth. Keep it up!",
    mentions: [],
    likes: 5,
    replies: 0,
    isLiked: true,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const commentId = searchParams.get('commentId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort') || 'recent'; // recent, popular

    if (commentId) {
      // Get specific comment
      const comment = mockComments.find(c => c.id === commentId);
      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        comment
      });
    }

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    let comments = mockComments.filter(comment => comment.postId === postId);

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        comments.sort((a, b) => (b.likes + b.replies) - (a.likes + a.replies));
        break;
      default:
        comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Apply pagination
    const paginatedComments = comments.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      comments: paginatedComments,
      hasMore: offset + limit < comments.length,
      total: comments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content, mentions, parentId } = body;

    // Validate required fields
    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // In real implementation, get user from JWT token
    const currentUser = {
      id: 'current_user',
      username: 'current_user',
      displayName: 'Current User',
      avatar: '/avatars/current.jpg',
      verified: false
    };

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      authorId: currentUser.id,
      author: {
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        verified: currentUser.verified
      },
      content: content.trim(),
      mentions: mentions || [],
      likes: 0,
      replies: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: parentId || undefined
    };

    // Add to mock comments
    mockComments.push(newComment);

    // Update parent comment reply count if this is a reply
    if (parentId) {
      const parentComment = mockComments.find(c => c.id === parentId);
      if (parentComment) {
        parentComment.replies++;
      }
    }

    // Generate notifications for mentions and post author
    if (mentions && mentions.length > 0) {
      // In real implementation, create notification records
      console.log('Generating notifications for comment mentions:', mentions);
    }

    // Notify post author if not the same user
    // In real implementation, create notification for post author
    console.log('Notifying post author of new comment');

    return NextResponse.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, action, data } = body;

    switch (action) {
      case 'like':
        return handleLikeComment(commentId, data.userId);
      case 'edit':
        return handleEditComment(commentId, data.content, data.userId);
      case 'report':
        return handleReportComment(commentId, data.userId, data.reason);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Find comment index
    const commentIndex = mockComments.findIndex(comment => comment.id === commentId);
    
    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = mockComments[commentIndex];

    // Check if user owns the comment
    if (comment.authorId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove comment
    mockComments.splice(commentIndex, 1);

    // Update parent comment reply count if this was a reply
    if (comment.parentId) {
      const parentComment = mockComments.find(c => c.id === comment.parentId);
      if (parentComment && parentComment.replies > 0) {
        parentComment.replies--;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

// Helper functions
async function handleLikeComment(commentId: string, userId: string) {
  const comment = mockComments.find(c => c.id === commentId);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Toggle like status
  if (comment.isLiked) {
    comment.likes--;
    comment.isLiked = false;
  } else {
    comment.likes++;
    comment.isLiked = true;
  }

  return NextResponse.json({
    success: true,
    comment: {
      likes: comment.likes,
      isLiked: comment.isLiked
    }
  });
}

async function handleEditComment(commentId: string, content: string, userId: string) {
  const comment = mockComments.find(c => c.id === commentId);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Check if user owns the comment
  if (comment.authorId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  comment.content = content.trim();
  comment.updatedAt = new Date().toISOString();

  return NextResponse.json({
    success: true,
    comment
  });
}

async function handleReportComment(commentId: string, userId: string, reason: string) {
  // In real implementation, create a content report
  console.log('Reporting comment:', commentId, 'by user:', userId, 'reason:', reason);

  return NextResponse.json({
    success: true,
    message: 'Comment reported successfully'
  });
}