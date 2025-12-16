import { NextRequest, NextResponse } from "next/server";
import { SecurityManager } from "@/lib/security/security-manager";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const securityManager = SecurityManager.getInstance();
const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'dashboard':
        const dashboardData = await securityManager.getSecurityDashboard(userId);
        return NextResponse.json(dashboardData);

      case 'health-check':
        const healthCheck = await securityManager.performHealthCheck();
        return NextResponse.json(healthCheck);

      case 'metrics':
        const metrics = await auditService.getSecurityMetrics();
        return NextResponse.json(metrics);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'security-check':
        const securityCheck = await securityManager.performSecurityCheck(
          userId,
          data.email,
          request,
          data.deviceInfo
        );
        return NextResponse.json(securityCheck);

      case 'secure-login':
        const loginResult = await securityManager.secureLogin(
          data.credentials,
          request,
          data.twoFactorCode,
          data.biometricData
        );
        return NextResponse.json(loginResult);

      case 'update-config':
        securityManager.updateConfig(data.config);
        await auditService.logSecurityEvent(userId, 'SECURITY_CONFIG_UPDATED', 'security', undefined, data.config, request);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}