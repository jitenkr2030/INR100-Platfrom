import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { alertId } = params;

    // Find the alert and verify it belongs to the user
    const alert = await db.securityAlert.findFirst({
      where: {
        id: alertId,
        userId: session.user.id
      }
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    // Resolve the alert
    const updatedAlert = await db.securityAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date()
      }
    });

    return NextResponse.json({
      message: "Security alert resolved successfully",
      alert: updatedAlert
    });

  } catch (error) {
    console.error("Error resolving security alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}