import { NextRequest, NextResponse } from "next/server";
import { AdvancedKYCService } from "@/lib/security/advanced-kyc";
import { AuditLoggingService } from "@/lib/security/audit-logging";

const kycService = AdvancedKYCService.getInstance();
const auditService = AuditLoggingService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    const isAdmin = request.headers.get('x-admin') === 'true';

    switch (action) {
      case 'status':
        const status = await kycService.getKYCStatus(userId);
        return NextResponse.json({ status });

      case 'pending':
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
        const pending = await kycService.getPendingVerifications();
        return NextResponse.json({ pending });

      case 'statistics':
        const stats = await kycService.getKYCStatistics();
        return NextResponse.json(stats);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('KYC API error:', error);
    return NextResponse.json(
      { error: 'Failed to get KYC data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, level, verificationId, documentType, fileData, reviewerId, approved, notes } = body;
    
    // Get user ID from session/token (simplified - in production use proper auth)
    const userId = request.headers.get('x-user-id') || 'demo-user-id';
    const isAdmin = request.headers.get('x-admin') === 'true';

    switch (action) {
      case 'start':
        if (!level || !['basic', 'enhanced', 'premium'].includes(level)) {
          return NextResponse.json(
            { error: 'Valid KYC level is required (basic, enhanced, premium)' },
            { status: 400 }
          );
        }

        const startResult = await kycService.startKYCVerification(userId, level);
        return NextResponse.json(startResult);

      case 'upload-document':
        if (!verificationId || !documentType || !fileData) {
          return NextResponse.json(
            { error: 'Verification ID, document type, and file data are required' },
            { status: 400 }
          );
        }

        const uploadResult = await kycService.uploadKYCDocument(
          verificationId,
          documentType,
          fileData
        );

        return NextResponse.json(uploadResult);

      case 'manual-verify':
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }

        if (!verificationId || reviewerId === undefined || approved === undefined) {
          return NextResponse.json(
            { error: 'Verification ID, reviewer ID, and approval status are required' },
            { status: 400 }
          );
        }

        const verifyResult = await kycService.verifyKYCManually(
          verificationId,
          reviewerId,
          approved,
          notes
        );

        return NextResponse.json(verifyResult);

      case 'auto-verify':
        if (!verificationId) {
          return NextResponse.json(
            { error: 'Verification ID is required' },
            { status: 400 }
          );
        }

        const autoVerifyResult = await kycService.autoVerifyKYC(verificationId);
        return NextResponse.json(autoVerifyResult);

      case 'update-level':
        if (!verificationId || !level || !['basic', 'enhanced', 'premium'].includes(level)) {
          return NextResponse.json(
            { error: 'Valid verification ID and KYC level are required' },
            { status: 400 }
          );
        }

        const updateResult = await kycService.updateVerificationLevel(verificationId, level);
        return NextResponse.json(updateResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('KYC API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}