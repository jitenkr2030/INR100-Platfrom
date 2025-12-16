import { NextRequest, NextResponse } from "next/server";
import { SuspiciousActivityService } from "@/lib/security/suspicious-activity";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const suspiciousActivityService = SuspiciousActivityService.getInstance();
const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    const limit = parseInt(searchParams.get('limit') || '50');

    const activities = await suspiciousActivityService.getSuspiciousActivities(userId, limit);
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Suspicious activities error:', error);
    return NextResponse.json(
      { error: 'Failed to get suspicious activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, activityId, resolution, transactionData, loginData } = body;
    
    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'analyze-login':
        if (!loginData || !loginData.ipAddress || !loginData.userAgent) {
          return NextResponse.json(
            { error: 'Login data with IP address and user agent are required' },
            { status: 400 }
          );
        }

        const loginAnalysis = await suspiciousActivityService.analyzeLoginAttempt(
          userId,
          loginData.email,
          loginData.ipAddress,
          loginData.userAgent,
          loginData.deviceId
        );

        return NextResponse.json(loginAnalysis);

      case 'analyze-transaction':
        if (!transactionData || !transactionData.amount || !transactionData.currency) {
          return NextResponse.json(
            { error: 'Transaction data with amount and currency are required' },
            { status: 400 }
          );
        }

        const transactionAnalysis = await suspiciousActivityService.analyzeTransaction(
          userId,
          transactionData
        );

        return NextResponse.json(transactionAnalysis);

      case 'resolve-activity':
        if (!activityId || !resolution) {
          return NextResponse.json(
            { error: 'Activity ID and resolution are required' },
            { status: 400 }
          );
        }

        const resolveResult = await suspiciousActivityService.resolveSuspiciousActivity(
          activityId,
          resolution
        );

        if (resolveResult) {
          await auditService.logSecurityEvent(
            userId,
            'SUSPICIOUS_ACTIVITY_RESOLVED',
            'security',
            activityId,
            { resolution },
            request
          );
        }

        return NextResponse.json({ success: resolveResult });

      case 'get-metrics':
        const metrics = await suspiciousActivityService.getSecurityMetrics();
        return NextResponse.json(metrics);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Suspicious activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}