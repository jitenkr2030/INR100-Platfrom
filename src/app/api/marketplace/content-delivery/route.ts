import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, // 'deliver' | 'access' | 'download' | 'share'
      itemType, // 'insight' | 'portfolio_copy' | 'newsletter'
      itemId,
      deliveryMethod = 'in_app', // 'in_app' | 'email' | 'sms' | 'push'
      metadata = {}
    } = body;

    // Get user ID from headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'deliver':
        return await deliverContent(userId, itemType, itemId, deliveryMethod, metadata);
      
      case 'access':
        return await accessContent(userId, itemType, itemId);
      
      case 'download':
        return await downloadContent(userId, itemType, itemId);
      
      case 'share':
        return await shareContent(userId, itemType, itemId, metadata);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Content delivery error:', error);
    return NextResponse.json(
      { error: 'Content delivery failed' },
      { status: 500 }
    );
  }
}

async function deliverContent(
  userId: string, 
  itemType: string, 
  itemId: string, 
  deliveryMethod: string, 
  metadata: any
) {
  // Verify user has access to the content
  const hasAccess = await verifyAccess(userId, itemType, itemId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied. Content not purchased or subscription expired.' },
      { status: 403 }
    );
  }

  // Create delivery record
  const delivery = await db.contentDelivery.create({
    data: {
      userId,
      itemType,
      itemId,
      deliveryMethod,
      status: 'PENDING',
      metadata: JSON.stringify(metadata),
      deliveredAt: new Date()
    }
  });

  // Process delivery based on method
  let deliveryResult: any = {};

  switch (deliveryMethod) {
    case 'in_app':
      deliveryResult = await deliverInApp(userId, itemType, itemId);
      break;
    
    case 'email':
      deliveryResult = await deliverViaEmail(userId, itemType, itemId, metadata);
      break;
    
    case 'sms':
      deliveryResult = await deliverViaSMS(userId, itemType, itemId, metadata);
      break;
    
    case 'push':
      deliveryResult = await deliverViaPush(userId, itemType, itemId, metadata);
      break;
  }

  // Update delivery status
  await db.contentDelivery.update({
    where: { id: delivery.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      deliveryResult: JSON.stringify(deliveryResult)
    }
  });

  // Track engagement
  await trackContentEngagement(userId, itemType, itemId, 'delivered');

  return NextResponse.json({
    message: 'Content delivered successfully',
    deliveryId: delivery.id,
    deliveryMethod,
    ...deliveryResult
  });
}

async function accessContent(userId: string, itemType: string, itemId: string) {
  // Verify access
  const hasAccess = await verifyAccess(userId, itemType, itemId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  let content: any = null;

  switch (itemType) {
    case 'insight':
      content = await db.expertInsight.findUnique({
        where: { id: itemId },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              avatar: true,
              verified: true
            }
          }
        }
      });
      break;

    case 'portfolio_copy':
      content = await db.portfolioCopy.findUnique({
        where: { id: itemId },
        include: {
          template: {
            include: {
              expert: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          holdings: true,
          performance: true
        }
      });
      break;

    case 'newsletter':
      content = await db.newsletter.findUnique({
        where: { id: itemId },
        include: {
          expert: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          issues: {
            orderBy: { publishedAt: 'desc' },
            take: 10
          }
        }
      });
      break;
  }

  if (!content) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    );
  }

  // Track access
  await trackContentEngagement(userId, itemType, itemId, 'accessed');

  // Update access statistics
  await updateAccessStats(itemType, itemId);

  return NextResponse.json({
    content,
    accessedAt: new Date(),
    accessCount: await getAccessCount(userId, itemType, itemId)
  });
}

async function downloadContent(userId: string, itemType: string, itemId: string) {
  // Verify access
  const hasAccess = await verifyAccess(userId, itemType, itemId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Generate download URL or content
  const downloadUrl = await generateDownloadUrl(userId, itemType, itemId);
  
  // Track download
  await trackContentEngagement(userId, itemType, itemId, 'downloaded');

  return NextResponse.json({
    downloadUrl,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    format: 'pdf',
    size: '2.5 MB'
  });
}

async function shareContent(userId: string, itemType: string, itemId: string, metadata: any) {
  // Verify access
  const hasAccess = await verifyAccess(userId, itemType, itemId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Generate shareable link
  const shareToken = await generateShareToken(userId, itemType, itemId);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareToken}`;

  // Track sharing
  await trackContentEngagement(userId, itemType, itemId, 'shared');

  // Create share record
  await db.contentShare.create({
    data: {
      userId,
      itemType,
      itemId,
      shareToken,
      shareMethod: metadata.method || 'link',
      sharedAt: new Date()
    }
  });

  return NextResponse.json({
    shareUrl,
    shareToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    message: 'Content shared successfully'
  });
}

async function verifyAccess(userId: string, itemType: string, itemId: string): Promise<boolean> {
  switch (itemType) {
    case 'insight':
      const insightPurchase = await db.expertInsightPurchase.findFirst({
        where: {
          userId,
          insightId: itemId
        }
      });
      return !!insightPurchase;

    case 'portfolio_copy':
      const portfolioCopy = await db.portfolioCopy.findFirst({
        where: {
          userId,
          id: itemId,
          status: 'ACTIVE'
        }
      });
      return !!portfolioCopy;

    case 'newsletter':
      const subscription = await db.newsletterSubscription.findFirst({
        where: {
          userId,
          newsletterId: itemId,
          status: 'ACTIVE'
        }
      });
      return !!subscription;

    default:
      return false;
  }
}

async function deliverInApp(userId: string, itemType: string, itemId: string) {
  // For in-app delivery, just mark as delivered
  return {
    method: 'in_app',
    message: 'Content available in your dashboard'
  };
}

async function deliverViaEmail(userId: string, itemType: string, itemId: string, metadata: any) {
  // In a real implementation, integrate with email service
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  });

  // Simulate email sending
  console.log(`Sending email to ${user?.email} for ${itemType}: ${itemId}`);
  
  return {
    method: 'email',
    recipient: user?.email,
    message: 'Content sent to your email'
  };
}

async function deliverViaSMS(userId: string, itemType: string, itemId: string, metadata: any) {
  // In a real implementation, integrate with SMS service
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { phoneNumber: true }
  });

  console.log(`Sending SMS to ${user?.phoneNumber} for ${itemType}: ${itemId}`);
  
  return {
    method: 'sms',
    recipient: user?.phoneNumber,
    message: 'Content link sent via SMS'
  };
}

async function deliverViaPush(userId: string, itemType: string, itemId: string, metadata: any) {
  // In a real implementation, integrate with push notification service
  console.log(`Sending push notification to user ${userId} for ${itemType}: ${itemId}`);
  
  return {
    method: 'push',
    message: 'Push notification sent'
  };
}

async function trackContentEngagement(userId: string, itemType: string, itemId: string, action: string) {
  await db.contentEngagement.create({
    data: {
      userId,
      itemType,
      itemId,
      action,
      engagedAt: new Date()
    }
  });
}

async function updateAccessStats(itemType: string, itemId: string) {
  const tableMap = {
    insight: db.expertInsight,
    portfolio_copy: db.portfolioCopy,
    newsletter: db.newsletter
  };

  const table = tableMap[itemType as keyof typeof tableMap];
  if (table) {
    await table.update({
      where: { id: itemId },
      data: {
        accessCount: {
          increment: 1
        }
      }
    });
  }
}

async function getAccessCount(userId: string, itemType: string, itemId: string): Promise<number> {
  const engagement = await db.contentEngagement.findMany({
    where: {
      userId,
      itemType,
      itemId,
      action: 'accessed'
    }
  });
  return engagement.length;
}

async function generateDownloadUrl(userId: string, itemType: string, itemId: string): Promise<string> {
  // In a real implementation, generate secure download URLs
  const token = Buffer.from(`${userId}:${itemType}:${itemId}:${Date.now()}`).toString('base64');
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/download/${token}`;
}

async function generateShareToken(userId: string, itemType: string, itemId: string): Promise<string> {
  // Generate secure share token
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const itemType = searchParams.get('itemType');
    const itemId = searchParams.get('itemId');

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const where: any = { userId: targetUserId };
    if (itemType) where.itemType = itemType;
    if (itemId) where.itemId = itemId;

    const deliveries = await db.contentDelivery.findMany({
      where,
      orderBy: { deliveredAt: 'desc' },
      take: 50
    });

    const engagements = await db.contentEngagement.findMany({
      where: { userId: targetUserId },
      orderBy: { engagedAt: 'desc' },
      take: 100
    });

    return NextResponse.json({
      deliveries,
      engagements,
      summary: {
        totalDeliveries: deliveries.length,
        totalEngagements: engagements.length,
        recentActivity: engagements.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Get content delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content delivery data' },
      { status: 500 }
    );
  }
}