import { NextRequest, NextResponse } from 'next/server';
import { ContentReport, ModerationAction } from '../types';

const mockReports: ContentReport[] = [
  {
    id: 'report_1',
    reporterId: 'user5',
    contentType: 'post',
    contentId: 'post_5',
    reason: 'spam',
    description: 'This post appears to be promotional content for a trading course',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'report_2',
    reporterId: 'user6',
    contentType: 'comment',
    contentId: 'comment_15',
    reason: 'harassment',
    description: 'User is being abusive and using inappropriate language',
    status: 'reviewed',
    reviewedBy: 'moderator1',
    reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    action: 'warning',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },
  {
    id: 'report_3',
    reporterId: 'user7',
    contentType: 'user',
    contentId: 'user_suspicious',
    reason: 'misinformation',
    description: 'User is spreading false information about market movements',
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  }
];

const mockModerationActions: ModerationAction[] = [
  {
    id: 'action_1',
    moderatorId: 'moderator1',
    contentType: 'comment',
    contentId: 'comment_15',
    action: 'warn',
    reason: 'Harassment and inappropriate language',
    notes: 'User issued warning for abusive behavior. Further violations may result in suspension.',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'action_2',
    moderatorId: 'admin1',
    contentType: 'post',
    contentId: 'post_3',
    action: 'remove',
    reason: 'Spam and promotional content',
    notes: 'Removed promotional post that violated community guidelines',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'reports';
    const status = searchParams.get('status'); // pending, reviewed, resolved, dismissed
    const contentType = searchParams.get('contentType'); // post, comment, user, group
    const moderatorId = searchParams.get('moderatorId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'reports':
        return getReports({ status, contentType, moderatorId, limit, offset });
      case 'actions':
        return getModerationActions({ moderatorId, limit, offset });
      case 'dashboard':
        return getModerationDashboard();
      case 'stats':
        return getModerationStats();
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Get moderation data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation data' },
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
      case 'report':
        return createReport(currentUserId, data);
      case 'review':
        return reviewReport(data.reportId, data.action, data.reason, data.notes, currentUserId);
      case 'moderate':
        return takeModerationAction(data.action, data.contentType, data.contentId, data.reason, data.notes, currentUserId);
      case 'appeal':
        return appealDecision(data.reportId, data.reason, currentUserId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json(
      { error: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, action, data } = body;

    switch (action) {
      case 'updateStatus':
        return updateReportStatus(reportId, data.status, data.moderatorId);
      case 'assignModerator':
        return assignModerator(reportId, data.moderatorId, data.assignedBy);
      case 'escalate':
        return escalateReport(reportId, data.escalationReason, data.escalatedBy);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Update moderation error:', error);
    return NextResponse.json(
      { error: 'Failed to update moderation' },
      { status: 500 }
    );
  }
}

async function getReports(params: { status?: string | null; contentType?: string | null; moderatorId?: string | null; limit: number; offset: number }) {
  try {
    let reports = [...mockReports];

    // Filter by status
    if (params.status) {
      reports = reports.filter(report => report.status === params.status);
    }

    // Filter by content type
    if (params.contentType) {
      reports = reports.filter(report => report.contentType === params.contentType);
    }

    // Filter by assigned moderator
    if (params.moderatorId) {
      reports = reports.filter(report => report.reviewedBy === params.moderatorId);
    }

    // Sort by creation date (newest first)
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedReports = reports.slice(params.offset, params.offset + params.limit);

    return NextResponse.json({
      success: true,
      reports: paginatedReports,
      hasMore: params.offset + params.limit < reports.length,
      total: reports.length
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

async function getModerationActions(params: { moderatorId?: string | null; limit: number; offset: number }) {
  try {
    let actions = [...mockModerationActions];

    // Filter by moderator
    if (params.moderatorId) {
      actions = actions.filter(action => action.moderatorId === params.moderatorId);
    }

    // Sort by creation date (newest first)
    actions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedActions = actions.slice(params.offset, params.offset + params.limit);

    return NextResponse.json({
      success: true,
      actions: paginatedActions,
      hasMore: params.offset + params.limit < actions.length,
      total: actions.length
    });
  } catch (error) {
    console.error('Get moderation actions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation actions' },
      { status: 500 }
    );
  }
}

async function getModerationDashboard() {
  try {
    const stats = {
      totalReports: mockReports.length,
      pendingReports: mockReports.filter(r => r.status === 'pending').length,
      reviewedReports: mockReports.filter(r => r.status === 'reviewed').length,
      resolvedReports: mockReports.filter(r => r.status === 'resolved').length,
      dismissedReports: mockReports.filter(r => r.status === 'dismissed').length,
      totalActions: mockModerationActions.length,
      recentActions: mockModerationActions.slice(0, 5),
      topReasons: [
        { reason: 'spam', count: 15 },
        { reason: 'harassment', count: 8 },
        { reason: 'misinformation', count: 6 },
        { reason: 'inappropriate', count: 4 }
      ],
      averageResponseTime: '2.5 hours',
      moderationTrend: [
        { date: '2024-01-01', reports: 12, actions: 8 },
        { date: '2024-01-02', reports: 18, actions: 12 },
        { date: '2024-01-03', reports: 15, actions: 10 },
        { date: '2024-01-04', reports: 22, actions: 15 },
        { date: '2024-01-05', reports: 19, actions: 14 }
      ]
    };

    return NextResponse.json({
      success: true,
      dashboard: stats
    });
  } catch (error) {
    console.error('Get moderation dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation dashboard' },
      { status: 500 }
    );
  }
}

async function getModerationStats() {
  try {
    const stats = {
      totalReports: mockReports.length,
      pendingReports: mockReports.filter(r => r.status === 'pending').length,
      averageResolutionTime: '3.2 hours',
      reportsByType: {
        post: mockReports.filter(r => r.contentType === 'post').length,
        comment: mockReports.filter(r => r.contentType === 'comment').length,
        user: mockReports.filter(r => r.contentType === 'user').length,
        group: mockReports.filter(r => r.contentType === 'group').length
      },
      reportsByReason: {
        spam: mockReports.filter(r => r.reason === 'spam').length,
        harassment: mockReports.filter(r => r.reason === 'harassment').length,
        misinformation: mockReports.filter(r => r.reason === 'misinformation').length,
        inappropriate: mockReports.filter(r => r.reason === 'inappropriate').length,
        copyright: mockReports.filter(r => r.reason === 'copyright').length,
        other: mockReports.filter(r => r.reason === 'other').length
      },
      actionEffectiveness: {
        warnings: mockModerationActions.filter(a => a.action === 'warn').length,
        removals: mockModerationActions.filter(a => a.action === 'remove').length,
        suspensions: mockModerationActions.filter(a => a.action === 'suspend').length,
        bans: mockModerationActions.filter(a => a.action === 'ban').length
      }
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation stats' },
      { status: 500 }
    );
  }
}

async function createReport(reporterId: string, data: any) {
  try {
    const { contentType, contentId, reason, description } = data;

    // Validate required fields
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Content type, content ID, and reason are required' },
        { status: 400 }
      );
    }

    // Check if user already reported this content recently
    const existingReport = mockReports.find(
      report => 
        report.reporterId === reporterId && 
        report.contentId === contentId && 
        report.contentType === contentType &&
        report.status === 'pending'
    );

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      );
    }

    const newReport: ContentReport = {
      id: `report_${Date.now()}`,
      reporterId,
      contentType,
      contentId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    mockReports.unshift(newReport);

    // In real implementation, this would trigger notifications to moderators
    console.log('New content report created:', newReport);

    return NextResponse.json({
      success: true,
      report: newReport,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

async function reviewReport(reportId: string, action: string, reason: string, notes: string, moderatorId: string) {
  try {
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report status
    report.status = 'reviewed';
    report.reviewedBy = moderatorId;
    report.reviewedAt = new Date().toISOString();

    let moderationAction: string;
    switch (action) {
      case 'approve':
        moderationAction = 'none';
        report.action = 'none';
        report.status = 'resolved';
        break;
      case 'remove':
        moderationAction = 'remove';
        report.action = 'removed';
        report.status = 'resolved';
        await takeModerationAction('remove', report.contentType, report.contentId, reason, notes, moderatorId);
        break;
      case 'warn':
        moderationAction = 'warn';
        report.action = 'warning';
        report.status = 'resolved';
        await takeModerationAction('warn', report.contentType, report.contentId, reason, notes, moderatorId);
        break;
      case 'suspend':
        moderationAction = 'suspend';
        report.action = 'suspended';
        report.status = 'resolved';
        await takeModerationAction('suspend', report.contentType, report.contentId, reason, notes, moderatorId);
        break;
      case 'dismiss':
        moderationAction = 'none';
        report.action = 'none';
        report.status = 'dismissed';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Report reviewed successfully'
    });
  } catch (error) {
    console.error('Review report error:', error);
    return NextResponse.json(
      { error: 'Failed to review report' },
      { status: 500 }
    );
  }
}

async function takeModerationAction(action: string, contentType: string, contentId: string, reason: string, notes: string, moderatorId: string) {
  try {
    const moderationAction: ModerationAction = {
      id: `action_${Date.now()}`,
      moderatorId,
      contentType,
      contentId,
      action: action as any,
      reason,
      notes,
      createdAt: new Date().toISOString()
    };

    mockModerationActions.unshift(moderationAction);

    // Execute the actual moderation action
    await executeModerationAction(action, contentType, contentId, moderatorId);

    return NextResponse.json({
      success: true,
      action: moderationAction,
      message: 'Moderation action taken successfully'
    });
  } catch (error) {
    console.error('Take moderation action error:', error);
    return NextResponse.json(
      { error: 'Failed to take moderation action' },
      { status: 500 }
    );
  }
}

async function executeModerationAction(action: string, contentType: string, contentId: string, moderatorId: string) {
  try {
    console.log(`Executing moderation action: ${action} on ${contentType} ${contentId} by moderator ${moderatorId}`);

    switch (action) {
      case 'remove':
        // Remove the content
        console.log(`Removing ${contentType} ${contentId}`);
        // In real implementation, remove from database
        break;
      
      case 'warn':
        // Send warning to user
        console.log(`Sending warning to user for ${contentType} ${contentId}`);
        // In real implementation, create warning notification
        break;
      
      case 'suspend':
        // Suspend user's account
        console.log(`Suspending user for ${contentType} ${contentId}`);
        // In real implementation, update user status
        break;
      
      case 'ban':
        // Ban user's account
        console.log(`Banning user for ${contentType} ${contentId}`);
        // In real implementation, update user status
        break;
      
      case 'approve':
        // Approve content
        console.log(`Approving ${contentType} ${contentId}`);
        // In real implementation, update content status
        break;
    }
  } catch (error) {
    console.error('Execute moderation action error:', error);
    throw error;
  }
}

async function appealDecision(reportId: string, reason: string, userId: string) {
  try {
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // In real implementation, create appeal record
    console.log(`User ${userId} appealed decision on report ${reportId}: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully'
    });
  } catch (error) {
    console.error('Appeal decision error:', error);
    return NextResponse.json(
      { error: 'Failed to submit appeal' },
      { status: 500 }
    );
  }
}

async function updateReportStatus(reportId: string, status: string, moderatorId: string) {
  try {
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    report.status = status as any;
    if (status === 'reviewed') {
      report.reviewedBy = moderatorId;
      report.reviewedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Report status updated successfully'
    });
  } catch (error) {
    console.error('Update report status error:', error);
    return NextResponse.json(
      { error: 'Failed to update report status' },
      { status: 500 }
    );
  }
}

async function assignModerator(reportId: string, moderatorId: string, assignedBy: string) {
  try {
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // In real implementation, assign moderator and notify
    console.log(`Report ${reportId} assigned to moderator ${moderatorId} by ${assignedBy}`);

    return NextResponse.json({
      success: true,
      message: 'Moderator assigned successfully'
    });
  } catch (error) {
    console.error('Assign moderator error:', error);
    return NextResponse.json(
      { error: 'Failed to assign moderator' },
      { status: 500 }
    );
  }
}

async function escalateReport(reportId: string, escalationReason: string, escalatedBy: string) {
  try {
    const report = mockReports.find(r => r.id === reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // In real implementation, escalate to higher-level moderators
    console.log(`Report ${reportId} escalated by ${escalatedBy}: ${escalationReason}`);

    return NextResponse.json({
      success: true,
      message: 'Report escalated successfully'
    });
  } catch (error) {
    console.error('Escalate report error:', error);
    return NextResponse.json(
      { error: 'Failed to escalate report' },
      { status: 500 }
    );
  }
}