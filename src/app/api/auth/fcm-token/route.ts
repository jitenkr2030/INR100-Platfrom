import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, platform = "mobile" } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: "User ID and token are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if token already exists
    const existingToken = await db.notificationToken.findFirst({
      where: {
        userId,
        token,
      },
    });

    if (existingToken) {
      // Update existing token with last used timestamp
      await db.notificationToken.update({
        where: { id: existingToken.id },
        data: {
          lastUsedAt: new Date(),
          isActive: true,
        },
      });

      return NextResponse.json({
        message: "Token updated successfully",
        tokenId: existingToken.id,
      });
    }

    // Create new notification token
    const notificationToken = await db.notificationToken.create({
      data: {
        userId,
        token,
        platform,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Token registered successfully",
      tokenId: notificationToken.id,
    });

  } catch (error) {
    console.error("Register FCM token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    if (!userId || !token) {
      return NextResponse.json(
        { error: "User ID and token are required" },
        { status: 400 }
      );
    }

    // Deactivate the token instead of deleting
    await db.notificationToken.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Token deactivated successfully",
    });

  } catch (error) {
    console.error("Deactivate FCM token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}