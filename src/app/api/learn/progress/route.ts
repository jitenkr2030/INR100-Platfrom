import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { contentId, progress, completed } = await request.json();

    if (!contentId || progress === undefined) {
      return NextResponse.json(
        { error: 'Content ID and progress are required' },
        { status: 400 }
      );
    }

    // In a real app, get user ID from authentication token
    const userId = 'mock-user-id'; // Replace with actual user ID from token

    // Update or create learning progress
    const updatedProgress = await db.learnProgress.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: {
        progress,
        status: completed ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: completed ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentId,
        progress,
        status: completed ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: completed ? new Date() : null
      }
    });

    // If completed, award XP to user
    if (completed) {
      const content = await db.learnContent.findUnique({
        where: { id: contentId }
      });

      if (content) {
        await db.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: content.xpReward
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedProgress
    });
  } catch (error) {
    console.error('Update learning progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}