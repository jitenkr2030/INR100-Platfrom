import { NextRequest, NextResponse } from 'next/server';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
  joinedAt: string;
  lastActive: string;
  level: number;
  xp: number;
  totalReturns: number;
  portfolioValue: number;
  preferences: {
    publicProfile: boolean;
    allowMessages: boolean;
    showPortfolio: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  settings: {
    theme: string;
    language: string;
    timezone: string;
    privacy: {
      showOnlineStatus: boolean;
      showActivityStatus: boolean;
    };
  };
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
    level: number;
  };
  content: string;
  type: 'analysis' | 'achievement' | 'question' | 'discussion' | 'educational' | 'news';
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    thumbnail?: string;
  }[];
  tags: string[];
  mentions: string[];
  visibility: 'public' | 'followers' | 'private';
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  featured?: boolean;
  reported?: boolean;
  moderated?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
  };
  content: string;
  mentions: string[];
  likes: number;
  replies: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string; // for nested replies
  moderated?: boolean;
}

export interface FollowRelationship {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  notifications: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'achievement' | 'challenge' | 'message' | 'group';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  media?: {
    type: 'image' | 'document';
    url: string;
    name?: string;
    size?: number;
  };
  read: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    online?: boolean;
    lastSeen?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  muted: boolean;
  pinned: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  type: 'public' | 'private' | 'invite-only';
  category: string;
  tags: string[];
  memberCount: number;
  moderators: string[];
  createdBy: string;
  createdAt: string;
  rules: string[];
  settings: {
    allowMemberPosts: boolean;
    requireApproval: boolean;
    allowMessaging: boolean;
    postModeration: boolean;
  };
  isJoined: boolean;
  isPending: boolean;
  lastActivity: string;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  status: 'active' | 'pending' | 'banned';
  permissions: string[];
}

export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: 'post' | 'comment' | 'user' | 'group';
  contentId: string;
  reason: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'copyright' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  action?: 'removed' | 'warning' | 'suspended' | 'none';
  createdAt: string;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  contentType: 'post' | 'comment' | 'user' | 'group';
  contentId: string;
  action: 'remove' | 'warn' | 'suspend' | 'ban' | 'approve';
  reason: string;
  duration?: number; // in hours
  notes: string;
  createdAt: string;
}