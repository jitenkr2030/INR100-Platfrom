import { NextRequest, NextResponse } from "next/server";
import { SessionManagementService } from "@/lib/security/session-management";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const sessionService = SessionManagementService.getInstance();
const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'sessions':
        const sessions = await sessionService.getUserSessions(userId);
        return NextResponse.json({ sessions });

      case 'stats':
        const stats = await sessionService.getSessionStats();
        return NextResponse.json(stats);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to get session data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionToken, refreshToken, deviceId, metadata } = body;
    
    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'create':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID is required' },
            { status: 400 }
          );
        }

        const sessionData = await sessionService.createSession(
          userId,
          deviceId,
          request,
          metadata
        );

        return NextResponse.json(sessionData);

      case 'validate':
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'Session token is required' },
            { status: 400 }
          );
        }

        const validation = await sessionService.validateSession(sessionToken);
        return NextResponse.json(validation);

      case 'refresh':
        if (!refreshToken) {
          return NextResponse.json(
            { error: 'Refresh token is required' },
            { status: 400 }
          );
        }

        const refreshResult = await sessionService.refreshSession(refreshToken);
        return NextResponse.json(refreshResult);

      case 'terminate':
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'Session token is required' },
            { status: 400 }
          );
        }

        const session = await sessionService.validateSession(sessionToken);
        if (!session.isValid || !session.session) {
          return NextResponse.json(
            { error: 'Invalid session' },
            { status: 400 }
          );
        }

        const terminateResult = await sessionService.deactivateSession(
          session.session.id,
          'User terminated'
        );

        return NextResponse.json({ success: terminateResult });

      case 'terminate-all':
        const keepSessionId = body.keepSessionId;
        const terminateAllResult = await sessionService.terminateAllSessions(userId, keepSessionId);
        
        return NextResponse.json({ success: terminateAllResult });

      case 'analyze':
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'Session token is required' },
            { status: 400 }
          );
        }

        const sessionValidation = await sessionService.validateSession(sessionToken);
        if (!sessionValidation.isValid || !sessionValidation.session) {
          return NextResponse.json(
            { error: 'Invalid session' },
            { status: 400 }
          );
        }

        const analysis = await sessionService.analyzeSessionSecurity(sessionValidation.session.id);
        return NextResponse.json(analysis);

      case 'cleanup':
        const cleanedCount = await sessionService.cleanupExpiredSessions();
        await auditService.logSecurityEvent(
          userId,
          'SESSION_CLEANUP',
          'session',
          undefined,
          { cleanedCount },
          request
        );
        
        return NextResponse.json({ cleanedCount });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}