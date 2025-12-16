import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService } from '@/lib/broker-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker');
    
    if (!brokerId) {
      return NextResponse.json(
        { error: 'Broker ID is required' },
        { status: 400 }
      );
    }

    const result = await brokerIntegrationService.initializeBroker(brokerId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        broker: result.broker,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Broker initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}