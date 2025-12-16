import { NextRequest, NextResponse } from "next/server";
import { BiometricAuthService } from "@/lib/security/biometric-auth";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const biometricService = BiometricAuthService.getInstance();
const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    const biometricData = await biometricService.getBiometricData(userId);
    const devices = await biometricService.getBiometricDevices(userId);

    return NextResponse.json({
      biometricData,
      devices,
      totalDevices: devices.length,
    });
  } catch (error) {
    console.error('Biometric data error:', error);
    return NextResponse.json(
      { error: 'Failed to get biometric data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, biometricType, biometricData, deviceId } = body;
    
    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';

    switch (action) {
      case 'register':
        if (!biometricType || !biometricData || !deviceId) {
          return NextResponse.json(
            { error: 'Biometric type, data, and device ID are required' },
            { status: 400 }
          );
        }

        const registerResult = await biometricService.registerBiometric(
          userId,
          deviceId,
          biometricType,
          biometricData
        );

        if (registerResult.success) {
          await auditService.logSecurityEvent(
            userId,
            'BIOMETRIC_REGISTERED',
            'authentication',
            undefined,
            { biometricType, deviceId },
            request
          );
        }

        return NextResponse.json(registerResult);

      case 'authenticate':
        if (!biometricType || !biometricData || !deviceId) {
          return NextResponse.json(
            { error: 'Biometric type, data, and device ID are required' },
            { status: 400 }
          );
        }

        const authResult = await biometricService.authenticateBiometric(
          userId,
          deviceId,
          biometricType,
          biometricData
        );

        await auditService.logSecurityEvent(
          userId,
          authResult.success ? 'BIOMETRIC_AUTH_SUCCESS' : 'BIOMETRIC_AUTH_FAILED',
          'authentication',
          undefined,
          { biometricType, deviceId, confidence: authResult.confidence },
          request
        );

        return NextResponse.json(authResult);

      case 'remove':
        if (!biometricType || !deviceId) {
          return NextResponse.json(
            { error: 'Biometric type and device ID are required' },
            { status: 400 }
          );
        }

        const removeResult = await biometricService.removeBiometric(
          userId,
          deviceId,
          biometricType
        );

        if (removeResult) {
          await auditService.logSecurityEvent(
            userId,
            'BIOMETRIC_REMOVED',
            'authentication',
            undefined,
            { biometricType, deviceId },
            request
          );
        }

        return NextResponse.json({ success: removeResult });

      case 'check-support':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID is required' },
            { status: 400 }
          );
        }

        const supportResult = await biometricService.checkBiometricSupport(deviceId);
        return NextResponse.json(supportResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Biometric API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}