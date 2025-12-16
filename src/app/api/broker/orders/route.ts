import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService } from '@/lib/broker-integration';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Parse request body
    const orderData = await request.json();

    // Place order
    const result = await brokerIntegrationService.placeOrder(orderData);
    
    if (result.success) {
      return NextResponse.json(result.order);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Place order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get orders list (mock implementation)
    return NextResponse.json({
      orders: [
        {
          order_id: 'ORD001',
          symbol: 'RELIANCE',
          quantity: 10,
          price: 2450.75,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}