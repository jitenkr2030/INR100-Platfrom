import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService } from '@/lib/broker-integration';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Get account information
    const result = await brokerIntegrationService.getAccountInfo();
    
    if (result.success) {
      return NextResponse.json(result.account);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Account info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}