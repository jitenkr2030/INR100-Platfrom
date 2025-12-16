import { NextRequest, NextResponse } from "next/server";
import { TwoFactorAuthService } from "@/lib/security/two-factor-auth";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const twoFactorService = TwoFactorAuthService.getInstance();
const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    const status = await twoFactorService.getTwoFactorStatus(userId);
    
    return NextResponse.json({
      enabled: !!status,
      method: status?.method || null,
      lastUsed: status?.lastUsed || null,
      hasBackupCodes: status?.backupCodes?.length > 0,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, method, contactInfo, code } = body;
    
    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'enable':
        if (!method || !contactInfo) {
          return NextResponse.json(
            { error: 'Method and contact info are required' },
            { status: 400 }
          );
        }

        const enableResult = await twoFactorService.enableTwoFactor(
          userId,
          method,
          contactInfo
        );

        await auditService.logSecurityEvent(
          userId,
          '2FA_ENABLED',
          'authentication',
          undefined,
          { method, contactInfo },
          request
        );

        return NextResponse.json(enableResult);

      case 'verify':
        if (!code) {
          return NextResponse.json(
            { error: 'Verification code is required' },
            { status: 400 }
          );
        }

        const verifyResult = await twoFactorService.verifyTwoFactor(userId, code);
        
        if (verifyResult.success) {
          await auditService.logSecurityEvent(
            userId,
            '2FA_VERIFIED',
            'authentication',
            undefined,
            { method: 'code_verification' },
            request
          );
        }

        return NextResponse.json(verifyResult);

      case 'disable':
        if (!code) {
          return NextResponse.json(
            { error: 'Verification code is required' },
            { status: 400 }
          );
        }

        const disableResult = await twoFactorService.disableTwoFactor(userId, code);
        
        if (disableResult) {
          await auditService.logSecurityEvent(
            userId,
            '2FA_DISABLED',
            'authentication',
            undefined,
            {},
            request
          );
        }

        return NextResponse.json({ success: disableResult });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('2FA API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}