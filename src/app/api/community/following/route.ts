import { NextRequest, NextResponse } from 'next/server';
import { FollowRelationship, User } from '../types';

const mockFollowRelationships: FollowRelationship[] = [
  {
    id: 'follow_1',
    followerId: 'user_current',
    followingId: 'user1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    notifications: true
  },
  {
    id: 'follow_2',
    followerId: 'user_current',
    followingId: 'user3',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    notifications: true
  }
];

const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'ananya_sharma',
    displayName: 'Dr. Ananya Sharma',
    email: 'ananya@example.com',
    avatar: '/avatars/expert1.jpg',
    bio: 'CFP | 15+ years experience | Specialized in equity research',
    verified: true,
    followers: 15420,
    following: 892,
    posts: 245,
    joinedAt: '2023-01-15T00:00:00Z',
    lastActive: new Date().toISOString(),
    level: 10,
    xp: 15420,
    totalReturns: 28.5,
    portfolioValue: 2500000,
    preferences: {
      publicProfile: true,
      allowMessages: true,
      showPortfolio: true,
      emailNotifications: true,
      pushNotifications: true
    },
    settings: {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kolkata',
      privacy: {
        showOnlineStatus: true,
        showActivityStatus: true
      }
    }
  },
  {
    id: 'user2',
    username: 'rajesh_invests',
    displayName: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    avatar: '/avatars/expert2.jpg',
    bio: 'Technical Analysis Expert | Options Trader | Market Mentor',
    verified: true,
    followers: 12350,
    following: 567,
    posts: 189,
    joinedAt: '2023-02-20T00:00:00Z',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    level: 9,
    xp: 12350,
    totalReturns: 32.1,
    portfolioValue: 1800000,
    preferences: {
      publicProfile: true,
      allowMessages: false,
      showPortfolio: true,
      emailNotifications: true,
      pushNotifications: false
    },
    settings: {
      theme: 'dark',
      language: 'en',
      timezone: 'Asia/Kolkata',
      privacy: {
        showOnlineStatus: false,
        showActivityStatus: true
      }
    }
  },
  {
    id: 'user3',
    username: 'priya_finance',
    displayName: 'Priya Singh',
    email: 'priya@example.com',
    avatar: '/avatars/expert3.jpg',
    bio: 'Mutual Fund Specialist | SIP Expert | Financial Educator',
    verified: false,
    followers: 9870,
    following: 423,
    posts: 156,
    joinedAt: '2023-03-10T00:00:00Z',
    lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    level: 8,
    xp: 9870,
    totalReturns: 18.7,
    portfolioValue: 1200000,
    preferences: {
      publicProfile: true,
      allowMessages: true,
      showPortfolio: false,
      emailNotifications: true,
      pushNotifications: true
    },
    settings: {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kolkata',
      privacy: {
        showOnlineStatus: true,
        showActivityStatus: false
      }
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');
    const action = searchParams.get('action') || 'followers'; // followers, following, isFollowing, suggestions

    switch (action) {
      case 'followers':
        return getFollowers(targetUserId || userId);
      case 'following':
        return getFollowing(targetUserId || userId);
      case 'isFollowing':
        return checkIsFollowing(userId, targetUserId);
      case 'suggestions':
        return getFollowSuggestions(userId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Get following error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUserId, action, data } = body;
    const currentUserId = 'user_current'; // In real implementation, get from JWT

    switch (action) {
      case 'follow':
        return handleFollow(currentUserId, targetUserId);
      case 'unfollow':
        return handleUnfollow(currentUserId, targetUserId);
      case 'updateNotifications':
        return handleUpdateNotifications(currentUserId, targetUserId, data.notifications);
      case 'block':
        return handleBlock(currentUserId, targetUserId);
      case 'unblock':
        return handleUnblock(currentUserId, targetUserId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Following action error:', error);
    return NextResponse.json(
      { error: 'Failed to process following action' },
      { status: 500 }
    );
  }
}

async function getFollowers(userId: string) {
  try {
    const followerIds = mockFollowRelationships
      .filter(rel => rel.followingId === userId)
      .map(rel => rel.followerId);

    const followers = mockUsers.filter(user => followerIds.includes(user.id));

    return NextResponse.json({
      success: true,
      followers
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    );
  }
}

async function getFollowing(userId: string) {
  try {
    const followingIds = mockFollowRelationships
      .filter(rel => rel.followerId === userId)
      .map(rel => rel.followingId);

    const following = mockUsers.filter(user => followingIds.includes(user.id));

    return NextResponse.json({
      success: true,
      following
    });
  } catch (error) {
    console.error('Get following error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following' },
      { status: 500 }
    );
  }
}

async function checkIsFollowing(currentUserId: string, targetUserId: string) {
  try {
    const isFollowing = mockFollowRelationships.some(
      rel => rel.followerId === currentUserId && rel.followingId === targetUserId
    );

    return NextResponse.json({
      success: true,
      isFollowing
    });
  } catch (error) {
    console.error('Check isFollowing error:', error);
    return NextResponse.json(
      { error: 'Failed to check following status' },
      { status: 500 }
    );
  }
}

async function getFollowSuggestions(currentUserId: string) {
  try {
    // Get users that current user is not following
    const followingIds = mockFollowRelationships
      .filter(rel => rel.followerId === currentUserId)
      .map(rel => rel.followingId);

    const suggestions = mockUsers
      .filter(user => 
        user.id !== currentUserId && 
        !followingIds.includes(user.id)
      )
      .sort((a, b) => b.followers - a.followers) // Sort by follower count
      .slice(0, 10); // Limit to 10 suggestions

    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

async function handleFollow(followerId: string, followingId: string) {
  try {
    // Check if already following
    const existingFollow = mockFollowRelationships.find(
      rel => rel.followerId === followerId && rel.followingId === followingId
    );

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Create new follow relationship
    const newFollow: FollowRelationship = {
      id: `follow_${Date.now()}`,
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
      notifications: true
    };

    mockFollowRelationships.push(newFollow);

    // Update user follower/following counts (in real implementation, update database)
    const followerUser = mockUsers.find(user => user.id === followerId);
    const followingUser = mockUsers.find(user => user.id === followingId);

    if (followingUser) {
      followingUser.followers++;
    }

    if (followerUser) {
      followerUser.following++;
    }

    // Generate notification for followed user
    // In real implementation, create notification record
    console.log(`User ${followerId} started following ${followingId}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user',
      follow: newFollow
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

async function handleUnfollow(followerId: string, followingId: string) {
  try {
    // Find and remove follow relationship
    const followIndex = mockFollowRelationships.findIndex(
      rel => rel.followerId === followerId && rel.followingId === followingId
    );

    if (followIndex === -1) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 400 }
      );
    }

    mockFollowRelationships.splice(followIndex, 1);

    // Update user follower/following counts
    const followerUser = mockUsers.find(user => user.id === followerId);
    const followingUser = mockUsers.find(user => user.id === followingId);

    if (followingUser && followingUser.followers > 0) {
      followingUser.followers--;
    }

    if (followerUser && followerUser.following > 0) {
      followerUser.following--;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

async function handleUpdateNotifications(followerId: string, followingId: string, notifications: boolean) {
  try {
    const followRelationship = mockFollowRelationships.find(
      rel => rel.followerId === followerId && rel.followingId === followingId
    );

    if (!followRelationship) {
      return NextResponse.json(
        { error: 'Follow relationship not found' },
        { status: 404 }
      );
    }

    followRelationship.notifications = notifications;

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
      notifications
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

async function handleBlock(blockerId: string, blockedId: string) {
  try {
    // In real implementation, create block record
    console.log(`User ${blockerId} blocked ${blockedId}`);

    // Also unfollow if following
    const followIndex = mockFollowRelationships.findIndex(
      rel => rel.followerId === blockerId && rel.followingId === blockedId
    );

    if (followIndex !== -1) {
      mockFollowRelationships.splice(followIndex, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}

async function handleUnblock(blockerId: string, blockedId: string) {
  try {
    // In real implementation, remove block record
    console.log(`User ${blockerId} unblocked ${blockedId}`);

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}