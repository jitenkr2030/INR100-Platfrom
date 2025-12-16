import { NextRequest, NextResponse } from 'next/server';
import { Group, GroupMembership, Post } from '../types';

const mockGroups: Group[] = [
  {
    id: 'group_1',
    name: 'Indian Stock Market Traders',
    description: 'A community for Indian stock market traders to share strategies, analysis, and insights. Focus on NSE and BSE listed stocks.',
    avatar: '/groups/indian-stocks.jpg',
    banner: '/groups/indian-stocks-banner.jpg',
    type: 'public',
    category: 'Trading',
    tags: ['NSE', 'BSE', 'Trading', 'Stocks', 'Analysis'],
    memberCount: 15420,
    moderators: ['user1', 'user2'],
    createdBy: 'user1',
    createdAt: '2023-01-15T00:00:00Z',
    rules: [
      'Be respectful to all members',
      'No spam or promotional content',
      'Share only relevant financial information',
      'No personal financial advice',
      'Cite sources for claims and data'
    ],
    settings: {
      allowMemberPosts: true,
      requireApproval: false,
      allowMessaging: true,
      postModeration: false
    },
    isJoined: false,
    isPending: false,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'group_2',
    name: 'SIP & Mutual Fund Investors',
    description: 'For SIP enthusiasts and mutual fund investors. Discuss fund performance, strategies, and long-term wealth building.',
    avatar: '/groups/sip-mf.jpg',
    banner: '/groups/sip-mf-banner.jpg',
    type: 'public',
    category: 'Investment',
    tags: ['SIP', 'Mutual Funds', 'Long-term', 'Wealth Building'],
    memberCount: 8930,
    moderators: ['user3'],
    createdBy: 'user3',
    createdAt: '2023-02-20T00:00:00Z',
    rules: [
      'Focus on long-term investing',
      'Share fund analysis and reviews',
      'No day trading discussions',
      'Be patient and helpful to beginners'
    ],
    settings: {
      allowMemberPosts: true,
      requireApproval: false,
      allowMessaging: true,
      postModeration: true
    },
    isJoined: true,
    isPending: false,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  },
  {
    id: 'group_3',
    name: 'Technical Analysis Masters',
    description: 'Advanced technical analysis techniques, chart patterns, and trading strategies for serious traders.',
    avatar: '/groups/technical-analysis.jpg',
    banner: '/groups/technical-analysis-banner.jpg',
    type: 'private',
    category: 'Trading',
    tags: ['Technical Analysis', 'Charts', 'Indicators', 'Trading'],
    memberCount: 3420,
    moderators: ['user2', 'user4'],
    createdBy: 'user2',
    createdAt: '2023-03-10T00:00:00Z',
    rules: [
      'Advanced level discussions only',
      'Share chart analysis and setups',
      'No fundamental analysis',
      'Verify claims with charts and data'
    ],
    settings: {
      allowMemberPosts: true,
      requireApproval: true,
      allowMessaging: false,
      postModeration: true
    },
    isJoined: false,
    isPending: true,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
  }
];

const mockGroupMemberships: GroupMembership[] = [
  {
    id: 'membership_1',
    groupId: 'group_2',
    userId: 'user_current',
    role: 'member',
    joinedAt: '2023-08-15T00:00:00Z',
    status: 'active',
    permissions: ['post', 'comment', 'react']
  },
  {
    id: 'membership_2',
    groupId: 'group_1',
    userId: 'user1',
    role: 'admin',
    joinedAt: '2023-01-15T00:00:00Z',
    status: 'active',
    permissions: ['post', 'comment', 'react', 'moderate', 'manage_members', 'edit_group']
  }
];

const mockGroupPosts: Post[] = [
  {
    id: 'group_post_1',
    authorId: 'user1',
    author: {
      username: 'ananya_sharma',
      displayName: 'Dr. Ananya Sharma',
      avatar: '/avatars/expert1.jpg',
      verified: true,
      level: 10
    },
    content: "Weekly market update: Nifty 50 showing strong support at 19,500 levels. IT and Banking sectors leading the rally. Key levels to watch: Support 19,400, Resistance 19,800.",
    type: 'analysis',
    tags: ['Nifty', 'Market Update', 'Technical'],
    mentions: [],
    visibility: 'public',
    likes: 89,
    comments: 23,
    shares: 12,
    views: 456,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'groups';
    const userId = searchParams.get('userId') || 'user_current';
    const groupId = searchParams.get('groupId');
    const category = searchParams.get('category');
    const type = searchParams.get('type'); // public, private, all
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'groups':
        return getGroups({ category, type, search, limit, offset });
      case 'myGroups':
        return getMyGroups(userId, limit, offset);
      case 'suggested':
        return getSuggestedGroups(userId, limit, offset);
      case 'group':
        return getGroup(groupId);
      case 'members':
        return getGroupMembers(groupId, limit, offset);
      case 'posts':
        return getGroupPosts(groupId, limit, offset);
      case 'joinRequests':
        return getJoinRequests(groupId, userId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
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
      case 'create':
        return createGroup(currentUserId, data);
      case 'join':
        return joinGroup(currentUserId, data.groupId);
      case 'leave':
        return leaveGroup(currentUserId, data.groupId);
      case 'requestJoin':
        return requestToJoin(currentUserId, data.groupId, data.message);
      case 'approveJoin':
        return approveJoinRequest(data.groupId, data.userId, currentUserId);
      case 'rejectJoin':
        return rejectJoinRequest(data.groupId, data.userId, currentUserId);
      case 'invite':
        return inviteToGroup(currentUserId, data.groupId, data.userIds);
      case 'removeMember':
        return removeMember(data.groupId, data.userId, currentUserId);
      case 'promoteMember':
        return promoteMember(data.groupId, data.userId, currentUserId);
      case 'demoteModerator':
        return demoteModerator(data.groupId, data.userId, currentUserId);
      case 'updateGroup':
        return updateGroup(data.groupId, data.updates, currentUserId);
      case 'deleteGroup':
        return deleteGroup(data.groupId, currentUserId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Group action error:', error);
    return NextResponse.json(
      { error: 'Failed to process group action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, postId, action, data } = body;
    const currentUserId = 'user_current'; // In real implementation, get from JWT

    switch (action) {
      case 'pinPost':
        return pinGroupPost(groupId, postId, data.pinned, currentUserId);
      case 'lockPost':
        return lockGroupPost(groupId, postId, data.locked, currentUserId);
      case 'removePost':
        return removeGroupPost(groupId, postId, currentUserId);
      case 'banUser':
        return banUserFromGroup(groupId, data.userId, currentUserId);
      case 'unbanUser':
        return unbanUserFromGroup(groupId, data.userId, currentUserId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Group update error:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

async function getGroups(params: { category?: string | null; type?: string | null; search?: string | null; limit: number; offset: number }) {
  try {
    let groups = [...mockGroups];

    // Filter by category
    if (params.category) {
      groups = groups.filter(group => 
        group.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    // Filter by type
    if (params.type && params.type !== 'all') {
      groups = groups.filter(group => group.type === params.type);
    }

    // Filter by search query
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      groups = groups.filter(group =>
        group.name.toLowerCase().includes(searchLower) ||
        group.description.toLowerCase().includes(searchLower) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by member count (most popular first)
    groups.sort((a, b) => b.memberCount - a.memberCount);

    // Apply pagination
    const paginatedGroups = groups.slice(params.offset, params.offset + params.limit);

    return NextResponse.json({
      success: true,
      groups: paginatedGroups,
      hasMore: params.offset + params.limit < groups.length,
      total: groups.length
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

async function getMyGroups(userId: string, limit: number, offset: number) {
  try {
    const userMemberships = mockGroupMemberships.filter(
      membership => membership.userId === userId && membership.status === 'active'
    );

    const myGroupIds = userMemberships.map(membership => membership.groupId);
    const myGroups = mockGroups.filter(group => myGroupIds.includes(group.id));

    // Sort by last activity
    myGroups.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

    // Apply pagination
    const paginatedGroups = myGroups.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      groups: paginatedGroups,
      hasMore: offset + limit < myGroups.length,
      total: myGroups.length
    });
  } catch (error) {
    console.error('Get my groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your groups' },
      { status: 500 }
    );
  }
}

async function getSuggestedGroups(userId: string, limit: number, offset: number) {
  try {
    const userMemberships = mockGroupMemberships.filter(
      membership => membership.userId === userId
    );
    const joinedGroupIds = userMemberships.map(membership => membership.groupId);

    // Get groups user hasn't joined
    const suggestedGroups = mockGroups.filter(group => !joinedGroupIds.includes(group.id));

    // Sort by member count (popular groups first)
    suggestedGroups.sort((a, b) => b.memberCount - a.memberCount);

    // Apply pagination
    const paginatedGroups = suggestedGroups.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      groups: paginatedGroups,
      hasMore: offset + limit < suggestedGroups.length,
      total: suggestedGroups.length
    });
  } catch (error) {
    console.error('Get suggested groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested groups' },
      { status: 500 }
    );
  }
}

async function getGroup(groupId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

async function getGroupMembers(groupId: string, limit: number, offset: number) {
  try {
    const memberships = mockGroupMemberships.filter(
      membership => membership.groupId === groupId && membership.status === 'active'
    );

    // In real implementation, fetch user details for each membership
    const members = memberships.map(membership => ({
      id: membership.userId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      permissions: membership.permissions
      // Add user details here
    }));

    // Apply pagination
    const paginatedMembers = members.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      members: paginatedMembers,
      hasMore: offset + limit < members.length,
      total: members.length
    });
  } catch (error) {
    console.error('Get group members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
}

async function getGroupPosts(groupId: string, limit: number, offset: number) {
  try {
    const posts = mockGroupPosts.filter(post => post.authorId === groupId); // Simplified

    // Sort by creation date
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedPosts = posts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      posts: paginatedPosts,
      hasMore: offset + limit < posts.length,
      total: posts.length
    });
  } catch (error) {
    console.error('Get group posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group posts' },
      { status: 500 }
    );
  }
}

async function getJoinRequests(groupId: string, userId: string) {
  try {
    // Check if user is moderator
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // In real implementation, fetch pending join requests
    const joinRequests = []; // Mock empty array

    return NextResponse.json({
      success: true,
      requests: joinRequests
    });
  } catch (error) {
    console.error('Get join requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch join requests' },
      { status: 500 }
    );
  }
}

async function createGroup(creatorId: string, groupData: any) {
  try {
    const { name, description, type, category, tags } = groupData;

    // Validate required fields
    if (!name || !description || !type || !category) {
      return NextResponse.json(
        { error: 'Name, description, type, and category are required' },
        { status: 400 }
      );
    }

    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name,
      description,
      type,
      category,
      tags: tags || [],
      memberCount: 1, // Creator is the first member
      moderators: [creatorId],
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      rules: [
        'Be respectful to all members',
        'No spam or promotional content',
        'Stay on topic',
        'Follow community guidelines'
      ],
      settings: {
        allowMemberPosts: true,
        requireApproval: type === 'private',
        allowMessaging: true,
        postModeration: false
      },
      isJoined: true,
      isPending: false,
      lastActivity: new Date().toISOString()
    };

    mockGroups.push(newGroup);

    // Create membership for creator
    const creatorMembership: GroupMembership = {
      id: `membership_${Date.now()}`,
      groupId: newGroup.id,
      userId: creatorId,
      role: 'admin',
      joinedAt: new Date().toISOString(),
      status: 'active',
      permissions: ['post', 'comment', 'react', 'moderate', 'manage_members', 'edit_group', 'delete_group']
    };

    mockGroupMemberships.push(creatorMembership);

    return NextResponse.json({
      success: true,
      group: newGroup
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

async function joinGroup(userId: string, groupId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = mockGroupMemberships.find(
      membership => membership.groupId === groupId && membership.userId === userId
    );

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return NextResponse.json(
          { error: 'Already a member of this group' },
          { status: 400 }
        );
      } else if (existingMembership.status === 'banned') {
        return NextResponse.json(
          { error: 'You have been banned from this group' },
          { status: 403 }
        );
      }
    }

    // Check if group requires approval
    if (group.type === 'private' || group.settings.requireApproval) {
      // Create pending membership
      const pendingMembership: GroupMembership = {
        id: `membership_${Date.now()}`,
        groupId,
        userId,
        role: 'member',
        joinedAt: new Date().toISOString(),
        status: 'pending',
        permissions: ['post', 'comment', 'react']
      };

      mockGroupMemberships.push(pendingMembership);
      group.isPending = true;

      return NextResponse.json({
        success: true,
        message: 'Join request submitted and pending approval',
        status: 'pending'
      });
    } else {
      // Direct join for public groups
      const membership: GroupMembership = {
        id: `membership_${Date.now()}`,
        groupId,
        userId,
        role: 'member',
        joinedAt: new Date().toISOString(),
        status: 'active',
        permissions: ['post', 'comment', 'react']
      };

      mockGroupMemberships.push(membership);
      group.memberCount++;
      group.isJoined = true;

      return NextResponse.json({
        success: true,
        message: 'Successfully joined the group',
        status: 'joined'
      });
    }
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}

async function leaveGroup(userId: string, groupId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator/admin
    if (group.createdBy === userId) {
      return NextResponse.json(
        { error: 'Group creator cannot leave the group' },
        { status: 400 }
      );
    }

    const membershipIndex = mockGroupMemberships.findIndex(
      membership => membership.groupId === groupId && membership.userId === userId
    );

    if (membershipIndex === -1) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    // Remove membership
    mockGroupMemberships.splice(membershipIndex, 1);
    group.memberCount--;
    group.isJoined = false;

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}

async function requestToJoin(userId: string, groupId: string, message: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Create join request (in real implementation, store separately)
    console.log(`User ${userId} requested to join group ${groupId} with message: ${message}`);

    return NextResponse.json({
      success: true,
      message: 'Join request submitted successfully'
    });
  } catch (error) {
    console.error('Request join error:', error);
    return NextResponse.json(
      { error: 'Failed to submit join request' },
      { status: 500 }
    );
  }
}

async function approveJoinRequest(groupId: string, userId: string, moderatorId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(moderatorId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update membership status
    const membership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (membership && membership.status === 'pending') {
      membership.status = 'active';
      group.memberCount++;
    }

    return NextResponse.json({
      success: true,
      message: 'Join request approved'
    });
  } catch (error) {
    console.error('Approve join request error:', error);
    return NextResponse.json(
      { error: 'Failed to approve join request' },
      { status: 500 }
    );
  }
}

async function rejectJoinRequest(groupId: string, userId: string, moderatorId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(moderatorId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove pending membership
    const membershipIndex = mockGroupMemberships.findIndex(
      m => m.groupId === groupId && m.userId === userId && m.status === 'pending'
    );

    if (membershipIndex !== -1) {
      mockGroupMemberships.splice(membershipIndex, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Join request rejected'
    });
  } catch (error) {
    console.error('Reject join request error:', error);
    return NextResponse.json(
      { error: 'Failed to reject join request' },
      { status: 500 }
    );
  }
}

async function inviteToGroup(inviterId: string, groupId: string, userIds: string[]) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if inviter is a member
    const inviterMembership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === inviterId && m.status === 'active'
    );

    if (!inviterMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Create invitations (in real implementation, send notifications)
    console.log(`User ${inviterId} invited users ${userIds.join(', ')} to group ${groupId}`);

    return NextResponse.json({
      success: true,
      message: `Invitations sent to ${userIds.length} users`
    });
  } catch (error) {
    console.error('Invite to group error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    );
  }
}

async function removeMember(groupId: string, userId: string, moderatorId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(moderatorId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Don't allow removing other moderators
    const targetMembership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (targetMembership && targetMembership.role === 'moderator') {
      return NextResponse.json(
        { error: 'Cannot remove moderators' },
        { status: 403 }
      );
    }

    // Remove membership
    const membershipIndex = mockGroupMemberships.findIndex(
      m => m.groupId === groupId && m.userId === userId
    );

    if (membershipIndex !== -1) {
      mockGroupMemberships.splice(membershipIndex, 1);
      group.memberCount--;
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

async function promoteMember(groupId: string, userId: string, moderatorId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(moderatorId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const membership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (membership) {
      membership.role = 'moderator';
      membership.permissions = ['post', 'comment', 'react', 'moderate', 'manage_members'];
      group.moderators.push(userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Member promoted to moderator'
    });
  } catch (error) {
    console.error('Promote member error:', error);
    return NextResponse.json(
      { error: 'Failed to promote member' },
      { status: 500 }
    );
  }
}

async function demoteModerator(groupId: string, userId: string, adminId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || group.createdBy !== adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const membership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (membership && membership.role === 'moderator') {
      membership.role = 'member';
      membership.permissions = ['post', 'comment', 'react'];
      group.moderators = group.moderators.filter(id => id !== userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Moderator demoted to member'
    });
  } catch (error) {
    console.error('Demote moderator error:', error);
    return NextResponse.json(
      { error: 'Failed to demote moderator' },
      { status: 500 }
    );
  }
}

async function updateGroup(groupId: string, updates: any, userId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit
    const membership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (!membership || !membership.permissions.includes('edit_group')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update group properties
    Object.assign(group, updates);

    return NextResponse.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

async function deleteGroup(groupId: string, userId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Only creator can delete group
    if (group.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Only the group creator can delete the group' },
        { status: 403 }
      );
    }

    // Remove group and all memberships
    const groupIndex = mockGroups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      mockGroups.splice(groupIndex, 1);
    }

    // Remove all memberships for this group
    for (let i = mockGroupMemberships.length - 1; i >= 0; i--) {
      if (mockGroupMemberships[i].groupId === groupId) {
        mockGroupMemberships.splice(i, 1);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}

async function pinGroupPost(groupId: string, postId: string, pinned: boolean, userId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // In real implementation, update post pinned status
    console.log(`${pinned ? 'Pinned' : 'Unpinned'} post ${postId} in group ${groupId}`);

    return NextResponse.json({
      success: true,
      message: `Post ${pinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('Pin post error:', error);
    return NextResponse.json(
      { error: 'Failed to pin post' },
      { status: 500 }
    );
  }
}

async function lockGroupPost(groupId: string, postId: string, locked: boolean, userId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // In real implementation, update post locked status
    console.log(`${locked ? 'Locked' : 'Unlocked'} post ${postId} in group ${groupId}`);

    return NextResponse.json({
      success: true,
      message: `Post ${locked ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    console.error('Lock post error:', error);
    return NextResponse.json(
      { error: 'Failed to lock post' },
      { status: 500 }
    );
  }
}

async function removeGroupPost(groupId: string, postId: string, userId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // In real implementation, remove post from group
    console.log(`Removed post ${postId} from group ${groupId}`);

    return NextResponse.json({
      success: true,
      message: 'Post removed successfully'
    });
  } catch (error) {
    console.error('Remove post error:', error);
    return NextResponse.json(
      { error: 'Failed to remove post' },
      { status: 500 }
    );
  }
}

async function banUserFromGroup(groupId: string, userId: string, moderatorId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(moderatorId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const membership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (membership) {
      membership.status = 'banned';
    }

    return NextResponse.json({
      success: true,
      message: 'User banned from group'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

async function unbanUserFromGroup(groupId: string, userId: string, moderatorId: string) {
  try {
    const group = mockGroups.find(g => g.id === groupId);
    if (!group || !group.moderators.includes(moderatorId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const membership = mockGroupMemberships.find(
      m => m.groupId === groupId && m.userId === userId
    );

    if (membership && membership.status === 'banned') {
      membership.status = 'active';
    }

    return NextResponse.json({
      success: true,
      message: 'User unbanned from group'
    });
  } catch (error) {
    console.error('Unban user error:', error);
    return NextResponse.json(
      { error: 'Failed to unban user' },
      { status: 500 }
    );
  }
}