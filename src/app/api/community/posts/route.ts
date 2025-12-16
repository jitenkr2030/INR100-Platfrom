import { NextRequest, NextResponse } from 'next/server';
import { Post, Comment } from '../types';

const mockPosts: Post[] = [
  {
    id: '1',
    authorId: 'user1',
    author: {
      username: 'ananya_sharma',
      displayName: 'Dr. Ananya Sharma',
      avatar: '/avatars/expert1.jpg',
      verified: true,
      level: 10
    },
    content: "Market analysis: IT sector showing strong momentum. Q3 results have been better than expected. Recommended to accumulate quality IT stocks for long-term gains. #ITStocks #MarketAnalysis",
    type: 'analysis',
    tags: ['ITStocks', 'MarketAnalysis'],
    mentions: [],
    visibility: 'public',
    likes: 234,
    comments: 45,
    shares: 12,
    views: 1520,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    featured: true
  },
  {
    id: '2',
    authorId: 'user2',
    author: {
      username: 'rahul_investor',
      displayName: 'Rahul Kumar',
      avatar: '/avatars/user1.jpg',
      verified: false,
      level: 5
    },
    content: "Just completed my first year of SIP investments! Started with ₹5000/month and now seeing consistent returns. Thank you INR100 for making investing so accessible! 🎉 #SIPSuccess #InvestmentJourney",
    type: 'achievement',
    tags: ['SIPSuccess', 'InvestmentJourney'],
    mentions: [],
    visibility: 'public',
    likes: 156,
    comments: 23,
    shares: 8,
    views: 890,
    isLiked: true,
    isSaved: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    authorId: 'user3',
    author: {
      username: 'priya_finance',
      displayName: 'Priya Singh',
      avatar: '/avatars/expert3.jpg',
      verified: false,
      level: 8
    },
    content: "New video alert: Understanding Debt Funds - A complete guide for conservative investors. Link in bio! Learn how to balance your portfolio with fixed income instruments. #DebtFunds #FinancialEducation",
    type: 'educational',
    tags: ['DebtFunds', 'FinancialEducation'],
    mentions: [],
    visibility: 'public',
    likes: 89,
    comments: 15,
    shares: 5,
    views: 456,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

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
    replies: 0,
    isLiked: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
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
    replies: 1,
    isLiked: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'feed';
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort') || 'recent'; // recent, popular, trending

    let posts = [...mockPosts];

    // Filter by type
    switch (type) {
      case 'user':
        if (userId) {
          posts = posts.filter(post => post.authorId === userId);
        }
        break;
      case 'following':
        // In real implementation, filter posts by followed users
        break;
      case 'popular':
        posts.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
        break;
      case 'trending':
        // Calculate trending score based on recent engagement
        posts.sort((a, b) => {
          const aScore = (a.likes + a.comments + a.shares) / ((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
          const bScore = (b.likes + b.comments + b.shares) / ((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60));
          return bScore - aScore;
        });
        break;
      default:
        // Recent posts (default)
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply pagination
    const paginatedPosts = posts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      posts: paginatedPosts,
      hasMore: offset + limit < posts.length,
      total: posts.length
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, type, tags, mentions, visibility, media } = body;

    // Validate required fields
    if (!content || !type) {
      return NextResponse.json(
        { error: 'Content and type are required' },
        { status: 400 }
      );
    }

    // In real implementation, get user from JWT token
    const currentUser = {
      id: 'current_user',
      username: 'current_user',
      displayName: 'Current User',
      avatar: '/avatars/current.jpg',
      verified: false,
      level: 5
    };

    const newPost: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      author: {
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        verified: currentUser.verified,
        level: currentUser.level
      },
      content: content.trim(),
      type,
      media: media || [],
      tags: tags || [],
      mentions: mentions || [],
      visibility: visibility || 'public',
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock posts (in real implementation, save to database)
    mockPosts.unshift(newPost);

    // Generate notifications for mentions
    if (mentions && mentions.length > 0) {
      // In real implementation, create notification records
      console.log('Generating notifications for mentions:', mentions);
    }

    return NextResponse.json({
      success: true,
      post: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, action, data } = body;

    switch (action) {
      case 'like':
        return handleLikePost(postId, data.userId);
      case 'save':
        return handleSavePost(postId, data.userId);
      case 'share':
        return handleSharePost(postId);
      case 'pin':
        return handlePinPost(postId, data.pinned);
      case 'feature':
        return handleFeaturePost(postId, data.featured);
      case 'report':
        return handleReportPost(postId, data.userId, data.reason);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Find post index
    const postIndex = mockPosts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = mockPosts[postIndex];

    // Check if user owns the post or has admin privileges
    if (post.authorId !== userId) {
      // In real implementation, check for admin/moderator privileges
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove post
    mockPosts.splice(postIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// Helper functions
async function handleLikePost(postId: string, userId: string) {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Toggle like status
  if (post.isLiked) {
    post.likes--;
    post.isLiked = false;
  } else {
    post.likes++;
    post.isLiked = true;
  }

  return NextResponse.json({
    success: true,
    post: {
      likes: post.likes,
      isLiked: post.isLiked
    }
  });
}

async function handleSavePost(postId: string, userId: string) {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  post.isSaved = !post.isSaved;

  return NextResponse.json({
    success: true,
    post: {
      isSaved: post.isSaved
    }
  });
}

async function handleSharePost(postId: string) {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  post.shares++;

  return NextResponse.json({
    success: true,
    post: {
      shares: post.shares
    }
  });
}

async function handlePinPost(postId: string, pinned: boolean) {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  post.pinned = pinned;

  return NextResponse.json({
    success: true,
    post: {
      pinned: post.pinned
    }
  });
}

async function handleFeaturePost(postId: string, featured: boolean) {
  const post = mockPosts.find(p => p.id === postId);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  post.featured = featured;

  return NextResponse.json({
    success: true,
    post: {
      featured: post.featured
    }
  });
}

async function handleReportPost(postId: string, userId: string, reason: string) {
  // In real implementation, create a content report
  console.log('Reporting post:', postId, 'by user:', userId, 'reason:', reason);

  return NextResponse.json({
    success: true,
    message: 'Post reported successfully'
  });
}