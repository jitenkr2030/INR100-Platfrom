import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, // 'create' | 'respond' | 'resolve' | 'escalate'
      type, // 'payment' | 'content' | 'performance' | 'service'
      itemType, // 'insight' | 'portfolio_copy' | 'newsletter'
      itemId,
      subject,
      description,
      evidence = [],
      priority = 'medium',
      response,
      resolution
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
      case 'create':
        return await createDispute(userId, type, itemType, itemId, subject, description, evidence, priority);
      
      case 'respond':
        return await respondToDispute(userId, body);
      
      case 'resolve':
        return await resolveDispute(userId, body);
      
      case 'escalate':
        return await escalateDispute(userId, body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Dispute management error:', error);
    return NextResponse.json(
      { error: 'Dispute management failed' },
      { status: 500 }
    );
  }
}

async function createDispute(
  userId: string,
  type: string,
  itemType: string,
  itemId: string,
  subject: string,
  description: string,
  evidence: any[],
  priority: string
) {
  // Validate dispute data
  if (!type || !itemType || !itemId || !subject || !description) {
    return NextResponse.json(
      { error: 'Missing required dispute fields' },
      { status: 400 }
    );
  }

  // Verify user has standing to dispute
  const hasStanding = await verifyDisputeStanding(userId, itemType, itemId);
  if (!hasStanding) {
    return NextResponse.json(
      { error: 'No standing to dispute this item' },
      { status: 403 }
    );
  }

  // Check for existing dispute
  const existingDispute = await db.dispute.findFirst({
    where: {
      userId,
      itemType,
      itemId,
      status: { in: ['OPEN', 'UNDER_REVIEW'] }
    }
  });

  if (existingDispute) {
    return NextResponse.json(
      { error: 'An active dispute already exists for this item' },
      { status: 400 }
    );
  }

  // Create dispute
  const dispute = await db.dispute.create({
    data: {
      userId,
      type,
      itemType,
      itemId,
      subject,
      description,
      priority,
      status: 'OPEN',
      evidence: JSON.stringify(evidence),
      createdAt: new Date()
    }
  });

  // Create initial dispute event
  await db.disputeEvent.create({
    data: {
      disputeId: dispute.id,
      eventType: 'CREATED',
      eventData: JSON.stringify({
        userId,
        type,
        itemType,
        itemId,
        subject,
        description,
        priority
      }),
      timestamp: new Date()
    }
  });

  // Auto-assign to appropriate team member based on type
  const assignedTo = await assignDisputeHandler(type, priority);
  
  if (assignedTo) {
    await db.dispute.update({
      where: { id: dispute.id },
      data: {
        assignedTo,
        status: 'UNDER_REVIEW'
      }
    });
  }

  // Send notifications
  await sendDisputeNotifications(dispute.id, 'created');

  return NextResponse.json({
    message: 'Dispute created successfully',
    dispute: {
      id: dispute.id,
      type,
      subject,
      status: 'OPEN',
      estimatedResolutionTime: getEstimatedResolutionTime(type, priority)
    },
    nextSteps: [
      'Dispute has been logged and assigned to our team',
      'You will receive updates via email and in-app notifications',
      'Expected resolution time: ' + getEstimatedResolutionTime(type, priority)
    ]
  });
}

async function respondToDispute(userId: string, data: any) {
  const { disputeId, response, attachments = [] } = data;

  // Verify dispute exists and user has permission to respond
  const dispute = await db.dispute.findUnique({
    where: { id: disputeId }
  });

  if (!dispute) {
    return NextResponse.json(
      { error: 'Dispute not found' },
      { status: 404 }
    );
  }

  // Check if user can respond (disputant or assigned handler)
  const canRespond = dispute.userId === userId || dispute.assignedTo === userId;
  if (!canRespond) {
    return NextResponse.json(
      { error: 'Not authorized to respond to this dispute' },
      { status: 403 }
    );
  }

  // Create response
  const disputeResponse = await db.disputeResponse.create({
    data: {
      disputeId,
      responderId: userId,
      response,
      attachments: JSON.stringify(attachments),
      timestamp: new Date()
    }
  });

  // Add dispute event
  await db.disputeEvent.create({
    data: {
      disputeId,
      eventType: 'RESPONSE_ADDED',
      eventData: JSON.stringify({
        responderId: userId,
        response,
        attachments
      }),
      timestamp: new Date()
    }
  });

  // Update dispute status if needed
  let statusUpdate: any = {};
  if (dispute.status === 'OPEN') {
    statusUpdate = { status: 'UNDER_REVIEW' };
  }

  if (Object.keys(statusUpdate).length > 0) {
    await db.dispute.update({
      where: { id: disputeId },
      data: statusUpdate
    });
  }

  // Send notifications about new response
  await sendDisputeNotifications(disputeId, 'response_added');

  return NextResponse.json({
    message: 'Response added successfully',
    response: disputeResponse
  });
}

async function resolveDispute(userId: string, data: any) {
  const { disputeId, resolution, resolutionType, compensation = 0 } = data;

  // Only assigned handlers or admins can resolve disputes
  const dispute = await db.dispute.findUnique({
    where: { id: disputeId }
  });

  if (!dispute) {
    return NextResponse.json(
      { error: 'Dispute not found' },
      { status: 404 }
    );
  }

  // Check authorization
  const isAuthorized = dispute.assignedTo === userId || userId === 'admin'; // Simplified admin check
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Not authorized to resolve this dispute' },
      { status: 403 }
    );
  }

  // Update dispute
  await db.dispute.update({
    where: { id: disputeId },
    data: {
      status: 'RESOLVED',
      resolution,
      resolutionType,
      compensation,
      resolvedBy: userId,
      resolvedAt: new Date()
    }
  });

  // Add resolution event
  await db.disputeEvent.create({
    data: {
      disputeId,
      eventType: 'RESOLVED',
      eventData: JSON.stringify({
        resolvedBy: userId,
        resolution,
        resolutionType,
        compensation
      }),
      timestamp: new Date()
    }
  });

  // Process compensation if applicable
  if (compensation > 0) {
    await processCompensation(dispute, compensation);
  }

  // Send resolution notifications
  await sendDisputeNotifications(disputeId, 'resolved');

  return NextResponse.json({
    message: 'Dispute resolved successfully',
    resolution: {
      type: resolutionType,
      compensation,
      resolvedAt: new Date()
    }
  });
}

async function escalateDispute(userId: string, data: any) {
  const { disputeId, reason, priority } = data;

  const dispute = await db.dispute.findUnique({
    where: { id: disputeId }
  });

  if (!dispute) {
    return NextResponse.json(
      { error: 'Dispute not found' },
      { status: 404 }
    );
  }

  // Check if escalation is allowed
  const canEscalate = dispute.userId === userId || dispute.assignedTo === userId;
  if (!canEscalate) {
    return NextResponse.json(
      { error: 'Not authorized to escalate this dispute' },
      { status: 403 }
    );
  }

  // Update dispute
  await db.dispute.update({
    where: { id: disputeId },
    data: {
      priority: priority || 'high',
      status: 'ESCALATED',
      escalatedAt: new Date(),
      escalatedBy: userId,
      escalationReason: reason
    }
  });

  // Add escalation event
  await db.disputeEvent.create({
    data: {
      disputeId,
      eventType: 'ESCALATED',
      eventData: JSON.stringify({
        escalatedBy: userId,
        reason,
        newPriority: priority || 'high'
      }),
      timestamp: new Date()
    }
  });

  // Reassign to senior handler
  const seniorHandler = await assignSeniorHandler();
  if (seniorHandler) {
    await db.dispute.update({
      where: { id: disputeId },
      data: { assignedTo: seniorHandler }
    });
  }

  // Send escalation notifications
  await sendDisputeNotifications(disputeId, 'escalated');

  return NextResponse.json({
    message: 'Dispute escalated successfully',
    assignedTo: seniorHandler,
    newPriority: priority || 'high'
  });
}

async function verifyDisputeStanding(userId: string, itemType: string, itemId: string): Promise<boolean> {
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
          id: itemId
        }
      });
      return !!portfolioCopy;

    case 'newsletter':
      const subscription = await db.newsletterSubscription.findFirst({
        where: {
          userId,
          newsletterId: itemId
        }
      });
      return !!subscription;

    default:
      return false;
  }
}

async function assignDisputeHandler(type: string, priority: string): Promise<string | null> {
  // In a real implementation, this would assign to appropriate team members
  // based on their workload, expertise, and availability
  
  const handlers = {
    payment: 'handler-payment-1',
    content: 'handler-content-1',
    performance: 'handler-performance-1',
    service: 'handler-service-1'
  };

  const handler = handlers[type as keyof typeof handlers];
  return handler || null;
}

async function assignSeniorHandler(): Promise<string | null> {
  // Assign to senior dispute handler
  return 'senior-handler-1';
}

function getEstimatedResolutionTime(type: string, priority: string): string {
  const baseTimes = {
    payment: '2-3 business days',
    content: '1-2 business days',
    performance: '3-5 business days',
    service: '1-2 business days'
  };

  const baseTime = baseTimes[type as keyof typeof baseTimes] || '2-3 business days';
  
  if (priority === 'high') return '1 business day';
  if (priority === 'low') return '5-7 business days';
  
  return baseTime;
}

async function processCompensation(dispute: any, amount: number) {
  // Credit compensation to user's wallet
  await db.wallet.upsert({
    where: { userId: dispute.userId },
    update: {
      balance: {
        increment: amount
      }
    },
    create: {
      userId: dispute.userId,
      balance: amount
    }
  });

  // Create transaction record
  await db.transaction.create({
    data: {
      userId: dispute.userId,
      type: 'DISPUTE_COMPENSATION',
      amount: amount,
      currency: 'INR',
      status: 'COMPLETED',
      reference: dispute.id,
      description: `Dispute compensation - ${dispute.subject}`
    }
  });

  // Create commission adjustment if expert was involved
  if (dispute.itemType === 'insight') {
    // Reverse commission for the expert
    const insight = await db.expertInsight.findUnique({
      where: { id: dispute.itemId },
      include: { purchases: { where: { userId: dispute.userId } } }
    });

    if (insight?.purchases[0]) {
      const purchase = insight.purchases[0];
      const commissionRate = 0.20;
      const commissionAmount = purchase.amount * commissionRate;

      await db.commission.updateMany({
        where: {
          reference: purchase.id,
          type: 'EXPERT_INSIGHT_SALE'
        },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversalReason: `Dispute resolution - ${dispute.subject}`
        }
      });
    }
  }
}

async function sendDisputeNotifications(disputeId: string, eventType: string) {
  // In a real implementation, send email/SMS/push notifications
  console.log(`Sending ${eventType} notification for dispute ${disputeId}`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const includeResponses = searchParams.get('includeResponses') === 'true';

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get('x-user-id');
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const where: any = { userId: targetUserId };
    if (status) where.status = status;
    if (type) where.type = type;

    const disputes = await db.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: includeResponses ? {
        responses: {
          orderBy: { timestamp: 'asc' }
        }
      } : undefined
    });

    const summary = {
      total: disputes.length,
      open: disputes.filter(d => d.status === 'OPEN').length,
      underReview: disputes.filter(d => d.status === 'UNDER_REVIEW').length,
      escalated: disputes.filter(d => d.status === 'ESCALATED').length,
      resolved: disputes.filter(d => d.status === 'RESOLVED').length,
      avgResolutionTime: await calculateAverageResolutionTime(targetUserId)
    };

    return NextResponse.json({
      disputes,
      summary
    });

  } catch (error) {
    console.error('Get disputes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

async function calculateAverageResolutionTime(userId: string): Promise<number> {
  const resolvedDisputes = await db.dispute.findMany({
    where: {
      userId,
      status: 'RESOLVED',
      resolvedAt: { not: null }
    },
    select: {
      createdAt: true,
      resolvedAt: true
    }
  });

  if (resolvedDisputes.length === 0) return 0;

  const totalResolutionTime = resolvedDisputes.reduce((sum, dispute) => {
    const resolutionTime = dispute.resolvedAt!.getTime() - dispute.createdAt.getTime();
    return sum + resolutionTime;
  }, 0);

  return Math.round(totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60 * 24)); // Convert to days
}