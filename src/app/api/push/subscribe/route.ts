'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    // Get user from session (you'll need to implement session management)
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Save subscription to database
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint
        }
      },
      update: {
        keys: subscription.keys,
        userAgent: request.headers.get('user-agent') || '',
        updatedAt: new Date()
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: request.headers.get('user-agent') || ''
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  // This is a placeholder - you need to integrate with your auth system
  return 'user-id-placeholder';
}