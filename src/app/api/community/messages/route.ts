import { NextRequest, NextResponse } from 'next/server';
import { Message, Conversation } from '../types';

const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    participants: [
      {
        id: 'user1',
        username: 'ananya_sharma',
        displayName: 'Dr. Ananya Sharma',
        avatar: '/avatars/expert1.jpg',
        online: true,
        lastSeen: new Date().toISOString()
      },
      {
        id: 'user_current',
        username: 'current_user',
        displayName: 'Current User',
        avatar: '/avatars/current.jpg',
        online: true,
        lastSeen: new Date().toISOString()
      }
    ],
    lastMessage: {
      id: 'msg_5',
      conversationId: 'conv_1',
      senderId: 'user1',
      sender: {
        username: 'ananya_sharma',
        displayName: 'Dr. Ananya Sharma',
        avatar: '/avatars/expert1.jpg'
      },
      content: 'Thanks for the question! Feel free to reach out anytime.',
      type: 'text',
      read: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    archived: false,
    muted: false,
    pinned: false
  },
  {
    id: 'conv_2',
    participants: [
      {
        id: 'user2',
        username: 'rajesh_invests',
        displayName: 'Rajesh Kumar',
        avatar: '/avatars/expert2.jpg',
        online: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user_current',
        username: 'current_user',
        displayName: 'Current User',
        avatar: '/avatars/current.jpg',
        online: true,
        lastSeen: new Date().toISOString()
      }
    ],
    lastMessage: {
      id: 'msg_3',
      conversationId: 'conv_2',
      senderId: 'user_current',
      sender: {
        username: 'current_user',
        displayName: 'Current User',
        avatar: '/avatars/current.jpg'
      },
      content: 'Thanks for sharing your insights on technical analysis!',
      type: 'text',
      read: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    unreadCount: 1,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    archived: false,
    muted: false,
    pinned: true
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user1',
    sender: {
      username: 'ananya_sharma',
      displayName: 'Dr. Ananya Sharma',
      avatar: '/avatars/expert1.jpg'
    },
    content: 'Hi! I saw your question about IT sector analysis. Happy to help!',
    type: 'text',
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'user_current',
    sender: {
      username: 'current_user',
      displayName: 'Current User',
      avatar: '/avatars/current.jpg'
    },
    content: 'Thank you so much! I would love to understand more about your investment strategy.',
    type: 'text',
    read: true,
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    senderId: 'user1',
    sender: {
      username: 'ananya_sharma',
      displayName: 'Dr. Ananya Sharma',
      avatar: '/avatars/expert1.jpg'
    },
    content: 'My strategy focuses on fundamental analysis combined with sector rotation. I believe in investing in quality companies with strong management and competitive moats.',
    type: 'text',
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg_4',
    conversationId: 'conv_1',
    senderId: 'user_current',
    sender: {
      username: 'current_user',
      displayName: 'Current User',
      avatar: '/avatars/current.jpg'
    },
    content: 'That makes perfect sense. How do you identify companies with strong competitive moats?',
    type: 'text',
    read: true,
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg_5',
    conversationId: 'conv_1',
    senderId: 'user1',
    sender: {
      username: 'ananya_sharma',
      displayName: 'Dr. Ananya Sharma',
      avatar: '/avatars/expert1.jpg'
    },
    content: 'Thanks for the question! Feel free to reach out anytime.',
    type: 'text',
    read: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'conversations';
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'conversations':
        return getConversations(userId, limit, offset);
      case 'messages':
        return getMessages(conversationId, limit, offset);
      case 'online':
        return getOnlineUsers();
      case 'search':
        return searchUsers(searchParams.get('query'));
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    const currentUserId = 'user_current'; // In real implementation, get from JWT

    switch (action) {
      case 'send':
        return sendMessage(currentUserId, data);
      case 'createConversation':
        return createConversation(currentUserId, data.participantId);
      case 'markRead':
        return markMessagesRead(data.conversationId, currentUserId);
      case 'archive':
        return archiveConversation(data.conversationId, currentUserId);
      case 'unarchive':
        return unarchiveConversation(data.conversationId, currentUserId);
      case 'mute':
        return muteConversation(data.conversationId, currentUserId);
      case 'unmute':
        return unmuteConversation(data.conversationId, currentUserId);
      case 'pin':
        return pinConversation(data.conversationId, currentUserId);
      case 'unpin':
        return unpinConversation(data.conversationId, currentUserId);
      case 'delete':
        return deleteConversation(data.conversationId, currentUserId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Message action error:', error);
    return NextResponse.json(
      { error: 'Failed to process message action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content } = body;
    const currentUserId = 'user_current'; // In real implementation, get from JWT

    const message = mockMessages.find(msg => msg.id === messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.senderId !== currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    message.content = content.trim();
    message.editedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const message = mockMessages.find(msg => msg.id === messageId);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.senderId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete - mark as deleted rather than remove
    message.deletedAt = new Date().toISOString();
    message.content = 'This message was deleted';

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

async function getConversations(userId: string, limit: number, offset: number) {
  try {
    const userConversations = mockConversations.filter(conv =>
      conv.participants.some(p => p.id === userId)
    );

    // Sort by last activity
    userConversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const paginatedConversations = userConversations.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      conversations: paginatedConversations,
      hasMore: offset + limit < userConversations.length,
      total: userConversations.length
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

async function getMessages(conversationId: string, limit: number, offset: number) {
  try {
    const messages = mockMessages
      .filter(msg => msg.conversationId === conversationId && !msg.deletedAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const paginatedMessages = messages.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      messages: paginatedMessages,
      hasMore: offset + limit < messages.length,
      total: messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

async function getOnlineUsers() {
  try {
    const onlineUsers = mockConversations
      .flatMap(conv => conv.participants)
      .filter(user => user.online)
      .filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

    return NextResponse.json({
      success: true,
      users: onlineUsers
    });
  } catch (error) {
    console.error('Get online users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}

async function searchUsers(query: string) {
  try {
    if (!query) {
      return NextResponse.json({
        success: true,
        users: []
      });
    }

    const searchResults = mockConversations
      .flatMap(conv => conv.participants)
      .filter(user =>
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase())
      )
      .filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

    return NextResponse.json({
      success: true,
      users: searchResults
    });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

async function sendMessage(senderId: string, data: any) {
  try {
    const { conversationId, content, type, media } = data;

    let conversation = mockConversations.find(conv => conv.id === conversationId);
    
    // If conversation doesn't exist, create it
    if (!conversation) {
      conversation = await createConversation(senderId, data.recipientId);
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: conversation.id,
      senderId,
      sender: conversation.participants.find(p => p.id === senderId)!,
      content: content.trim(),
      type: type || 'text',
      media: media || undefined,
      read: false,
      createdAt: new Date().toISOString()
    };

    mockMessages.push(newMessage);

    // Update conversation
    conversation.lastMessage = newMessage;
    conversation.updatedAt = new Date().toISOString();
    conversation.unreadCount++;

    return NextResponse.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

async function createConversation(currentUserId: string, participantId: string) {
  try {
    // Check if conversation already exists
    const existingConversation = mockConversations.find(conv =>
      conv.participants.length === 2 &&
      conv.participants.some(p => p.id === currentUserId) &&
      conv.participants.some(p => p.id === participantId)
    );

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation (mock participants)
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      participants: [
        {
          id: currentUserId,
          username: 'current_user',
          displayName: 'Current User',
          avatar: '/avatars/current.jpg',
          online: true,
          lastSeen: new Date().toISOString()
        },
        {
          id: participantId,
          username: 'participant',
          displayName: 'Participant User',
          avatar: '/avatars/participant.jpg',
          online: false,
          lastSeen: new Date().toISOString()
        }
      ],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      muted: false,
      pinned: false
    };

    mockConversations.unshift(newConversation);

    return newConversation;
  } catch (error) {
    console.error('Create conversation error:', error);
    throw error;
  }
}

async function markMessagesRead(conversationId: string, userId: string) {
  try {
    const messages = mockMessages.filter(msg => 
      msg.conversationId === conversationId && 
      !msg.read && 
      msg.senderId !== userId
    );

    messages.forEach(message => {
      message.read = true;
    });

    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
    }

    return NextResponse.json({
      success: true,
      messagesRead: messages.length
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}

async function archiveConversation(conversationId: string, userId: string) {
  try {
    const conversation = mockConversations.find(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    conversation.archived = true;

    return NextResponse.json({
      success: true,
      message: 'Conversation archived'
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to archive conversation' },
      { status: 500 }
    );
  }
}

async function unarchiveConversation(conversationId: string, userId: string) {
  try {
    const conversation = mockConversations.find(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    conversation.archived = false;

    return NextResponse.json({
      success: true,
      message: 'Conversation unarchived'
    });
  } catch (error) {
    console.error('Unarchive conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to unarchive conversation' },
      { status: 500 }
    );
  }
}

async function muteConversation(conversationId: string, userId: string) {
  try {
    const conversation = mockConversations.find(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    conversation.muted = true;

    return NextResponse.json({
      success: true,
      message: 'Conversation muted'
    });
  } catch (error) {
    console.error('Mute conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to mute conversation' },
      { status: 500 }
    );
  }
}

async function unmuteConversation(conversationId: string, userId: string) {
  try {
    const conversation = mockConversations.find(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    conversation.muted = false;

    return NextResponse.json({
      success: true,
      message: 'Conversation unmuted'
    });
  } catch (error) {
    console.error('Unmute conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to unmute conversation' },
      { status: 500 }
    );
  }
}

async function pinConversation(conversationId: string, userId: string) {
  try {
    const conversation = mockConversations.find(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    conversation.pinned = true;

    return NextResponse.json({
      success: true,
      message: 'Conversation pinned'
    });
  } catch (error) {
    console.error('Pin conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to pin conversation' },
      { status: 500 }
    );
  }
}

async function unpinConversation(conversationId: string, userId: string) {
  try {
    const conversation = mockConversations.find(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    conversation.pinned = false;

    return NextResponse.json({
      success: true,
      message: 'Conversation unpinned'
    });
  } catch (error) {
    console.error('Unpin conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to unpin conversation' },
      { status: 500 }
    );
  }
}

async function deleteConversation(conversationId: string, userId: string) {
  try {
    const conversationIndex = mockConversations.findIndex(conv => 
      conv.id === conversationId && 
      conv.participants.some(p => p.id === userId)
    );

    if (conversationIndex === -1) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as archived
    mockConversations[conversationIndex].archived = true;

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}