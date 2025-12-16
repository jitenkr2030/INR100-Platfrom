import { NextRequest, NextResponse } from 'next/server';
import { brokerIntegrationService, OrderRequest, OrderResponse } from '@/lib/broker-integration';

export interface BracketOrderRequest extends OrderRequest {
  squareOff: number;
  stopLoss: number;
  trailingStopLoss?: number;
}

export interface GTTOrderRequest {
  symbol: string;
  triggerPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  quantity: number;
  transactionType: 'BUY' | 'SELL';
}

export interface OCOOrderRequest {
  primaryOrder: OrderRequest;
  stopOrder: OrderRequest;
  targetOrder: OrderRequest;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderType, orderData } = body;

    let result: OrderResponse;

    switch (orderType) {
      case 'bracket':
        result = await brokerIntegrationService.placeBracketOrder(orderData as BracketOrderRequest);
        break;
      
      case 'gtt':
        result = await brokerIntegrationService.placeGTTOrder(orderData);
        break;
      
      case 'oco':
        // OCO (One Cancels Other) order
        const ocoResult = await handleOCOOrder(orderData as OCOOrderRequest);
        result = ocoResult;
        break;
      
      case 'iceberg':
        // Iceberg order for large quantities
        result = await placeIcebergOrder(orderData);
        break;
      
      case 'immediate-or-cancel':
        // IOC order
        const iocOrder = { ...orderData, validity: 'IOC' as const };
        result = await brokerIntegrationService.placeOrder(iocOrder);
        break;
      
      case 'fill-or-kill':
        // FOK order - must be filled completely or cancelled
        result = await placeFOKOrder(orderData);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported order type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      order: result
    });
  } catch (error) {
    console.error('Advanced order placement error:', error);
    return NextResponse.json(
      { error: 'Failed to place advanced order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderType = searchParams.get('type');

    switch (orderType) {
      case 'bracket':
        const bracketOrders = await getBracketOrders();
        return NextResponse.json({
          success: true,
          orders: bracketOrders
        });
      
      case 'gtt':
        const gttOrders = await brokerIntegrationService.getGTTOrders();
        return NextResponse.json(gttOrders);
      
      case 'oco':
        const ocoOrders = await getOCOOrders();
        return NextResponse.json({
          success: true,
          orders: ocoOrders
        });
      
      default:
        // Return all advanced orders
        const [bracket, gtt, oco] = await Promise.all([
          getBracketOrders(),
          brokerIntegrationService.getGTTOrders(),
          getOCOOrders()
        ]);

        return NextResponse.json({
          success: true,
          orders: {
            bracket,
            gtt: gtt.data || [],
            oco
          }
        });
    }
  } catch (error) {
    console.error('Get advanced orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced orders' },
      { status: 500 }
    );
  }
}

async function handleOCOOrder(orderData: OCOOrderRequest): Promise<OrderResponse> {
  try {
    // Place primary order first
    const primaryResult = await brokerIntegrationService.placeOrder(orderData.primaryOrder);
    
    if (primaryResult.status === 'COMPLETED' || primaryResult.status === 'OPEN') {
      // Place both stop and target orders
      const [stopResult, targetResult] = await Promise.all([
        brokerIntegrationService.placeOrder(orderData.stopOrder),
        brokerIntegrationService.placeOrder(orderData.targetOrder)
      ]);

      // Link orders so if one executes, the others are cancelled
      await linkOCOOrders(primaryResult.orderId, [stopResult.orderId, targetResult.orderId]);

      return {
        orderId: primaryResult.orderId,
        status: primaryResult.status,
        message: 'OCO order placed successfully',
        data: {
          primary: primaryResult,
          stop: stopResult,
          target: targetResult
        }
      };
    } else {
      return primaryResult;
    }
  } catch (error) {
    return {
      orderId: '',
      status: 'FAILED',
      message: 'Failed to place OCO order'
    };
  }
}

async function placeIcebergOrder(orderData: any): Promise<OrderResponse> {
  try {
    const { quantity, displayQuantity, ...otherParams } = orderData;
    
    // Split large order into smaller chunks
    const chunks = [];
    let remainingQuantity = quantity;
    let chunkNumber = 1;

    while (remainingQuantity > 0) {
      const currentChunkSize = Math.min(displayQuantity, remainingQuantity);
      const chunkOrder = {
        ...otherParams,
        quantity: currentChunkSize,
        disclosedQuantity: currentChunkSize
      };

      const result = await brokerIntegrationService.placeOrder(chunkOrder);
      chunks.push({
        chunkNumber,
        quantity: currentChunkSize,
        orderId: result.orderId,
        status: result.status
      });

      remainingQuantity -= currentChunkSize;
      chunkNumber++;
    }

    return {
      orderId: `iceberg_${Date.now()}`,
      status: 'OPEN',
      message: `Iceberg order placed with ${chunks.length} chunks`,
      data: { chunks }
    };
  } catch (error) {
    return {
      orderId: '',
      status: 'FAILED',
      message: 'Failed to place iceberg order'
    };
  }
}

async function placeFOKOrder(orderData: any): Promise<OrderResponse> {
  try {
    // FOK orders must be filled completely or cancelled
    const fokOrder = { ...orderData, validity: 'FOK' };
    
    // Check if sufficient liquidity exists
    const marketDepth = await getMarketDepth(orderData.symbol);
    const availableQuantity = marketDepth.bidQuantity + marketDepth.askQuantity;
    
    if (availableQuantity < orderData.quantity) {
      return {
        orderId: '',
        status: 'REJECTED',
        message: 'Insufficient liquidity for FOK order'
      };
    }

    const result = await brokerIntegrationService.placeOrder(fokOrder);
    
    // If not filled immediately, cancel it
    if (result.status === 'OPEN') {
      setTimeout(async () => {
        await brokerIntegrationService.cancelOrder(result.orderId);
      }, 1000); // Cancel after 1 second if not filled
    }

    return result;
  } catch (error) {
    return {
      orderId: '',
      status: 'FAILED',
      message: 'Failed to place FOK order'
    };
  }
}

async function getBracketOrders(): Promise<any[]> {
  // Mock bracket orders
  return [
    {
      id: 'B001',
      symbol: 'RELIANCE',
      quantity: 100,
      price: 2450,
      status: 'ACTIVE',
      squareOff: 2500,
      stopLoss: 2400,
      createdAt: new Date().toISOString()
    }
  ];
}

async function getOCOOrders(): Promise<any[]> {
  // Mock OCO orders
  return [
    {
      id: 'OCO001',
      symbol: 'TCS',
      primaryOrderId: 'ORD001',
      stopOrderId: 'ORD002',
      targetOrderId: 'ORD003',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }
  ];
}

async function linkOCOOrders(primaryOrderId: string, relatedOrderIds: string[]): Promise<void> {
  // In production, this would create database relationships
  console.log(`Linking OCO orders: ${primaryOrderId} with ${relatedOrderIds.join(', ')}`);
}

async function getMarketDepth(symbol: string): Promise<any> {
  // Mock market depth data
  return {
    bidQuantity: 1000,
    askQuantity: 1000,
    bids: [{ price: 2449, quantity: 100 }],
    asks: [{ price: 2450, quantity: 100 }]
  };
}