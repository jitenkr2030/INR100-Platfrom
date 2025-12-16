import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FraudDetectionService } from "@/lib/fraud-detection";
import { ActivityCategory } from "@prisma/client";

// GET /api/activity-logs - Get user's activity logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const category = searchParams.get("category") as ActivityCategory;

    const whereClause: any = { userId: session.user.id };
    if (category) {
      whereClause.category = category;
    }

    const logs = await db.userActivityLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/activity-logs - Log an activity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action, category, deviceId, metadata } = await request.json();

    if (!action || !category) {
      return NextResponse.json(
        { error: "Action and category are required" },
        { status: 400 }
      );
    }

    const clientInfo = FraudDetectionService.extractClientInfo(request);

    const activityLog = await FraudDetectionService.logActivity({
      userId: session.user.id,
      action,
      category,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      deviceId,
      metadata
    });

    return NextResponse.json({
      message: "Activity logged successfully",
      log: activityLog
    });

  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}