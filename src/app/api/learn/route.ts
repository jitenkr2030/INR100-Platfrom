import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get learning content from database
    const content = await db.learnContent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        progress: {
          where: {
            // In a real app, you'd filter by authenticated user
            // userId: getUserIdFromToken(request)
          }
        }
      }
    });

    // Mock data for demonstration
    const mockContent = [
      {
        id: '1',
        title: 'Introduction to Stock Market',
        content: 'Learn the basics of stock market investing...',
        type: 'ARTICLE',
        category: 'Basics',
        difficulty: 1,
        duration: 15,
        xpReward: 10,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Understanding Mutual Funds',
        content: 'Comprehensive guide to mutual fund investing...',
        type: 'VIDEO',
        category: 'Investment',
        difficulty: 2,
        duration: 30,
        xpReward: 20,
        isActive: true,
        createdAt: new Date()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockContent
    });
  } catch (error) {
    console.error('Get learning content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}