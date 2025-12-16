import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { content, images = [], type = 'REGULAR' } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // In a real app, get user ID from authentication token
    const userId = 'mock-user-id'; // Replace with actual user ID from token

    // Create social post
    const post = await db.socialPost.create({
      data: {
        userId,
        content,
        images: images.length > 0 ? JSON.stringify(images) : null,
        type,
        isPublic: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Create social post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}