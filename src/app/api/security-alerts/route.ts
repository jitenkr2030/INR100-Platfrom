import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/security-alerts - Get user's security alerts
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const unresolvedOnly = searchParams.get("unresolved") === "true";

    const whereClause: any = { userId: session.user.id };
    if (unresolvedOnly) {
      whereClause.isResolved = false;
    }

    const alerts = await db.securityAlert.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching security alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/security-alerts - Create a security alert (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified - in production, implement proper role-based access)
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.email !== "admin@inr100.com") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { userId, type, severity, title, description, ipAddress, deviceId, metadata } = await request.json();

    if (!userId || !type || !severity || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await db.securityAlert.create({
      data: {
        userId,
        type,
        severity,
        title,
        description,
        ipAddress,
        deviceId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    return NextResponse.json({
      message: "Security alert created successfully",
      alert
    });

  } catch (error) {
    console.error("Error creating security alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}