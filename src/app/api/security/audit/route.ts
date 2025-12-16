import { NextRequest, NextResponse } from "next/server";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    const isAdmin = request.headers.get('x-admin') === 'true';

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    switch (action) {
      case 'user-logs':
        const userLogs = await auditService.getUserAuditLogs(userId, start, end, limit);
        return NextResponse.json({ logs: userLogs });

      case 'compliance-report':
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
        
        if (!start || !end) {
          return NextResponse.json(
            { error: 'Start date and end date are required for compliance report' },
            { status: 400 }
          );
        }

        const report = await auditService.getComplianceReport(start, end);
        return NextResponse.json(report);

      case 'security-metrics':
        const metrics = await auditService.getSecurityMetrics();
        return NextResponse.json(metrics);

      case 'export':
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
        
        if (!start || !end) {
          return NextResponse.json(
            { error: 'Start date and end date are required for export' },
            { status: 400 }
          );
        }

        const format = searchParams.get('format') as 'json' | 'csv' || 'json';
        const exportData = await auditService.exportAuditLogs(start, end, format);
        
        return new NextResponse(exportData.data, {
          headers: {
            'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
            'Content-Disposition': `attachment; filename="${exportData.filename}"`,
          },
        });

      case 'search':
        const query = {
          userId: searchParams.get('userId') || undefined,
          action: searchParams.get('action') || undefined,
          resource: searchParams.get('resource') || undefined,
          ipAddress: searchParams.get('ipAddress') || undefined,
          startDate: start,
          endDate: end,
          riskScoreMin: searchParams.get('riskScoreMin') ? parseInt(searchParams.get('riskScoreMin')!) : undefined,
          riskScoreMax: searchParams.get('riskScoreMax') ? parseInt(searchParams.get('riskScoreMax')!) : undefined,
        };

        const searchResults = await auditService.searchAuditLogs(query, limit);
        return NextResponse.json({ results: searchResults });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, event, metadata } = body;
    
    // Get user ID from session/token (simplified - in production use proper auth)
    const currentUserId = request.headers.get('x-user-id') || 'demo-user-id';
    const isAdmin = request.headers.get('x-admin') === 'true';

    switch (action) {
      case 'log-event':
        if (!userId || !event) {
          return NextResponse.json(
            { error: 'User ID and event are required' },
            { status: 400 }
          );
        }

        const logId = await auditService.logSecurityEvent(
          userId,
          event,
          'manual',
          undefined,
          metadata,
          request
        );

        return NextResponse.json({ success: true, logId });

      case 'cleanup':
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        const cleanedCount = await auditService.cleanupExpiredLogs();
        return NextResponse.json({ cleanedCount });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}