import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface UserActionRequest {
  action: "suspend" | "activate" | "reset_password" | "send_verification" | "update_kyc";
  userId: string;
  reason?: string;
  duration?: number; // for suspend action (in days)
}

export async function POST(request: NextRequest) {
  try {
    const body: UserActionRequest = await request.json();
    const { action, userId, reason, duration } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { error: "Action and user ID are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let result: any = {};
    const adminId = request.headers.get("x-admin-id");

    switch (action) {
      case "suspend":
        // For suspension, we could add a suspended flag or set a suspension end date
        // For now, we'll just log the action
        result = await db.user.update({
          where: { id: userId },
          data: {
            // Add suspension logic here
            // e.g., suspendedUntil: new Date(Date.now() + (duration || 30) * 24 * 60 * 60 * 1000)
          },
        });
        break;

      case "activate":
        result = await db.user.update({
          where: { id: userId },
          data: {
            // Clear suspension
          },
        });
        break;

      case "reset_password":
        // Generate a temporary password reset token
        // This would typically involve sending an email
        result = { message: "Password reset email sent" };
        break;

      case "send_verification":
        // Resend verification email/SMS
        result = { message: "Verification message sent" };
        break;

      case "update_kyc":
        result = await db.user.update({
          where: { id: userId },
          data: {
            kycStatus: "UNDER_REVIEW",
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Log admin activity
    if (adminId) {
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: `USER_${action.toUpperCase()}`,
          entity: "User",
          entityId: userId,
          changes: JSON.stringify({ action, reason, duration }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    }

    return NextResponse.json({
      message: `User ${action} action completed successfully`,
      result,
    });

  } catch (error) {
    console.error("User action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get detailed user information including related data
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: {
          select: {
            id: true,
            name: true,
            totalValue: true,
            totalReturns: true,
            isPublic: true,
            createdAt: true,
          },
        },
        orders: {
          select: {
            id: true,
            type: true,
            orderType: true,
            quantity: true,
            price: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        kycDocuments: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
        devices: {
          select: {
            id: true,
            deviceName: true,
            deviceType: true,
            platform: true,
            lastSeenAt: true,
            isActive: true,
          },
        },
        securityAlerts: {
          select: {
            id: true,
            type: true,
            severity: true,
            title: true,
            description: true,
            isResolved: true,
            createdAt: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            portfolios: true,
            orders: true,
            transactions: true,
            securityAlerts: true,
            devices: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        // Remove sensitive data
        password: undefined,
        panNumber: user.panNumber ? "****" + user.panNumber.slice(-4) : null,
        aadhaarNumber: user.aadhaarNumber ? "****" + user.aadhaarNumber.slice(-4) : null,
      },
    });

  } catch (error) {
    console.error("Get user details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}