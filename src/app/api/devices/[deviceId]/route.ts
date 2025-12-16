import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deviceId } = params;

    // Find the device and verify it belongs to the user
    const device = await db.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: session.user.id
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Deactivate the device and its sessions
    await db.userDevice.update({
      where: { id: deviceId },
      data: {
        isActive: false
      }
    });

    // Also deactivate all sessions for this device
    await db.userSession.updateMany({
      where: {
        deviceId: deviceId,
        userId: session.user.id
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      message: "Device removed successfully"
    });

  } catch (error) {
    console.error("Error removing device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}