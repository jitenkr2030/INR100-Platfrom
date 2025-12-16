'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const offlineData = await request.json();
    
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process the offline data based on type
    let result;
    switch (offlineData.type) {
      case 'portfolio':
        result = await syncPortfolio(userId, offlineData);
        break;
      case 'order':
        result = await syncOrder(userId, offlineData);
        break;
      case 'transaction':
        result = await syncTransaction(userId, offlineData);
        break;
      case 'watchlist':
        result = await syncWatchlist(userId, offlineData);
        break;
      case 'learning-progress':
        result = await syncLearningProgress(userId, offlineData);
        break;
      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Offline sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

async function syncPortfolio(userId: string, data: any) {
  const { action, data: portfolioData } = data;

  if (action === 'create') {
    return await prisma.portfolio.create({
      data: {
        userId,
        ...portfolioData
      }
    });
  } else if (action === 'update') {
    return await prisma.portfolio.update({
      where: { id: portfolioData.id },
      data: portfolioData
    });
  } else if (action === 'delete') {
    return await prisma.portfolio.delete({
      where: { id: portfolioData.id }
    });
  }
}

async function syncOrder(userId: string, data: any) {
  const { action, data: orderData } = data;

  if (action === 'create') {
    return await prisma.order.create({
      data: {
        userId,
        ...orderData
      }
    });
  } else if (action === 'update') {
    return await prisma.order.update({
      where: { id: orderData.id },
      data: orderData
    });
  } else if (action === 'delete') {
    return await prisma.order.delete({
      where: { id: orderData.id }
    });
  }
}

async function syncTransaction(userId: string, data: any) {
  const { action, data: transactionData } = data;

  if (action === 'create') {
    return await prisma.transaction.create({
      data: {
        userId,
        ...transactionData
      }
    });
  } else if (action === 'update') {
    return await prisma.transaction.update({
      where: { id: transactionData.id },
      data: transactionData
    });
  } else if (action === 'delete') {
    return await prisma.transaction.delete({
      where: { id: transactionData.id }
    });
  }
}

async function syncWatchlist(userId: string, data: any) {
  const { action, data: watchlistData } = data;

  if (action === 'create') {
    return await prisma.watchlistItem.create({
      data: {
        userId,
        ...watchlistData
      }
    });
  } else if (action === 'update') {
    return await prisma.watchlistItem.update({
      where: { id: watchlistData.id },
      data: watchlistData
    });
  } else if (action === 'delete') {
    return await prisma.watchlistItem.delete({
      where: { id: watchlistData.id }
    });
  }
}

async function syncLearningProgress(userId: string, data: any) {
  const { action, data: progressData } = data;

  if (action === 'create') {
    return await prisma.userLessonProgress.create({
      data: {
        userId,
        ...progressData
      }
    });
  } else if (action === 'update') {
    return await prisma.userLessonProgress.update({
      where: { id: progressData.id },
      data: progressData
    });
  } else if (action === 'delete') {
    return await prisma.userLessonProgress.delete({
      where: { id: progressData.id }
    });
  }
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}