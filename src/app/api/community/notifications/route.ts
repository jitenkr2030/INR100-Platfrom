import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '../types';

const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    userId: 'user_current',
    type: 'like',
    title: 'New Like',
    message: 'Dr. Ananya Sharma liked your post about IT sector analysis',
    data: {
      postId: '1',
      likerId: 'user1',
      likerName: 'Dr. Ananya Sharma'
    },
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
  },
  {
    id: 'notif_2',
    userId: 'user_current',
    type: 'comment',
    title: 'New Comment',
    message: 'Mohit Sharma commented on your post: "Great analysis! Which specific IT stocks are you recommending?"',
    data: {
      postId: '1',
      commentId: 'c1',
      commenterId: 'user4',
      commenterName: 'Mohit Sharma'
    },
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
  },
  {
    id: 'notif_3',
    userId: 'user_current',
    type: 'follow',
    title: 'New Follower',
    message: 'Priya Singh started following you',
    data: {
      followerId: 'user3',
      followerName: 'Priya Singh'
    },
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'notif_4',
    userId: 'user_current',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Dr. Ananya Sharma mentioned you in a comment',
    data: {
      postId: '1',
      commentId: 'c2',
      mentionerId: 'user1',
      mentionerName: 'Dr. Ananya Sharma'
    },
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
  },
  {
    id: 'notif_5',
    userId: 'user_current',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve reached Level 5 in the community',
    data: {
      achievement: 'level_5',
      newLevel: 5
    },
    read: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
  },
  {
    id: 'notif_6',
    userId: 'user_current',
    type: 'message',
    title: 'New Message',
    message: 'Rajesh Kumar sent you a message',
    data: {
      conversationId: 'conv_2',
      senderId: 'user2',
      senderName: 'Rajesh Kumar'
    },
    read: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_current';
    const type = searchParams.get('type'); // like, comment, follow, mention, achievement, challenge, message, group
    const read = searchParams.get('read'); // true, false, all
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let notifications = mockNotifications.filter(notif => notif.userId === userId);

    // Filter by type
    if (type) {
      notifications = notifications.filter(notif => notif.type === type);
    }

    // Filter by read status
    if (read !== null && read !== 'all') {
      const isRead = read === 'true';
      notifications = notifications.filter(notif => notif.read === isRead);
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    // Calculate unread count
    const unreadCount = mockNotifications.filter(notif => 
      notif.userId === userId && !notif.read
    ).length;

    return NextResponse.json({
      success: true,
      notifications: paginatedNotifications,
      unreadCount,
      hasMore: offset + limit < notifications.length,
      total: notifications.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'User ID, type, title, and message are required' },
        { status: 400 }
      );
    }

    const newNotification: Notification = {
      id: `notif_${Date.now()}`,
      userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    mockNotifications.unshift(newNotification);

    // In real implementation, this would trigger a real-time notification
    // (WebSocket, push notification, email, etc.)
    console.log('New notification created:', newNotification);

    return NextResponse.json({
      success: true,
      notification: newNotification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notificationIds, data } = body;

    switch (action) {
      case 'markRead':
        return markNotificationsAsRead(notificationIds);
      case 'markUnread':
        return markNotificationsAsUnread(notificationIds);
      case 'markAllRead':
        return markAllNotificationsAsRead(data.userId);
      case 'delete':
        return deleteNotifications(notificationIds);
      case 'deleteAll':
        return deleteAllNotifications(data.userId);
      case 'updatePreferences':
        return updateNotificationPreferences(data.userId, data.preferences);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// Helper functions
async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    let markedCount = 0;

    mockNotifications.forEach(notification => {
      if (notificationIds.includes(notification.id) && !notification.read) {
        notification.read = true;
        markedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: `${markedCount} notifications marked as read`,
      markedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

async function markNotificationsAsUnread(notificationIds: string[]) {
  try {
    let unmarkedCount = 0;

    mockNotifications.forEach(notification => {
      if (notificationIds.includes(notification.id) && notification.read) {
        notification.read = false;
        unmarkedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: `${unmarkedCount} notifications marked as unread`,
      unmarkedCount
    });
  } catch (error) {
    console.error('Mark as unread error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as unread' },
      { status: 500 }
    );
  }
}

async function markAllNotificationsAsRead(userId: string) {
  try {
    let markedCount = 0;

    mockNotifications.forEach(notification => {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        markedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: `All ${markedCount} notifications marked as read`,
      markedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

async function deleteNotifications(notificationIds: string[]) {
  try {
    let deletedCount = 0;

    for (let i = mockNotifications.length - 1; i >= 0; i--) {
      if (notificationIds.includes(mockNotifications[i].id)) {
        mockNotifications.splice(i, 1);
        deletedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} notifications deleted`,
      deletedCount
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}

async function deleteAllNotifications(userId: string) {
  try {
    const initialLength = mockNotifications.length;
    
    // Filter out notifications for the user
    const remainingNotifications = mockNotifications.filter(
      notification => notification.userId !== userId
    );
    
    const deletedCount = initialLength - remainingNotifications.length;
    mockNotifications.length = 0;
    mockNotifications.push(...remainingNotifications);

    return NextResponse.json({
      success: true,
      message: `${deletedCount} notifications deleted`,
      deletedCount
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to delete all notifications' },
      { status: 500 }
    );
  }
}

async function updateNotificationPreferences(userId: string, preferences: any) {
  try {
    // In real implementation, save preferences to user profile
    console.log('Updating notification preferences for user:', userId, preferences);

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
      preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

// Notification creation helpers for different events
export async function createLikeNotification(postAuthorId: string, likerId: string, likerName: string, postId: string) {
  if (postAuthorId === likerId) return; // Don't notify for self-likes

  return await createNotification({
    userId: postAuthorId,
    type: 'like',
    title: 'New Like',
    message: `${likerName} liked your post`,
    data: {
      postId,
      likerId,
      likerName
    }
  });
}

export async function createCommentNotification(postAuthorId: string, commenterId: string, commenterName: string, postId: string, commentId: string, commentContent: string) {
  if (postAuthorId === commenterId) return; // Don't notify for self-comments

  return await createNotification({
    userId: postAuthorId,
    type: 'comment',
    title: 'New Comment',
    message: `${commenterName} commented: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
    data: {
      postId,
      commentId,
      commenterId,
      commenterName
    }
  });
}

export async function createFollowNotification(followedUserId: string, followerId: string, followerName: string) {
  if (followedUserId === followerId) return; // Don't notify for self-follow

  return await createNotification({
    userId: followedUserId,
    type: 'follow',
    title: 'New Follower',
    message: `${followerName} started following you`,
    data: {
      followerId,
      followerName
    }
  });
}

export async function createMentionNotification(mentionedUserId: string, mentionerId: string, mentionerName: string, postId: string, commentId?: string) {
  if (mentionedUserId === mentionerId) return; // Don't notify for self-mentions

  return await createNotification({
    userId: mentionedUserId,
    type: 'mention',
    title: 'You were mentioned',
    message: `${mentionerName} mentioned you in a ${commentId ? 'comment' : 'post'}`,
    data: {
      postId,
      commentId,
      mentionerId,
      mentionerName
    }
  });
}

export async function createMessageNotification(recipientId: string, senderId: string, senderName: string, conversationId: string) {
  if (recipientId === senderId) return; // Don't notify for self-messages

  return await createNotification({
    userId: recipientId,
    type: 'message',
    title: 'New Message',
    message: `${senderName} sent you a message`,
    data: {
      conversationId,
      senderId,
      senderName
    }
  });
}

export async function createAchievementNotification(userId: string, achievement: string, data: any) {
  return await createNotification({
    userId,
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: `Congratulations! You've ${getAchievementMessage(achievement, data)}`,
    data: {
      achievement,
      ...data
    }
  });
}

function getAchievementMessage(achievement: string, data: any): string {
  switch (achievement) {
    case 'level_up':
      return `reached Level ${data.newLevel} in the community`;
    case 'first_post':
      return 'made your first post';
    case 'first_follower':
      return 'gained your first follower';
    case 'post_viral':
      return 'created a viral post';
    case 'helpful_member':
      return 'become a helpful community member';
    case 'streak':
      return `maintained a ${data.days}-day activity streak`;
    default:
      return 'achieved a new milestone';
  }
}

async function createNotification(notificationData: any) {
  try {
    const newNotification: Notification = {
      id: `notif_${Date.now()}`,
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      read: false,
      createdAt: new Date().toISOString()
    };

    mockNotifications.unshift(newNotification);

    // In real implementation, trigger real-time delivery
    console.log('Notification created:', newNotification);

    return newNotification;
  } catch (error) {
    console.error('Create notification helper error:', error);
    throw error;
  }
}