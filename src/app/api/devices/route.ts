import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/devices - Get user's devices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const devices = await db.userDevice.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: {
        lastSeenAt: 'desc'
      }
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/devices - Register a new device
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deviceId, deviceType, deviceName, platform, browser, ipAddress, location } = await request.json();

    if (!deviceId || !deviceType || !ipAddress) {
      return NextResponse.json(
        { error: "Device ID, type, and IP address are required" },
        { status: 400 }
      );
    }

    // Check device limit (max 3 devices per user)
    const activeDevicesCount = await db.userDevice.count({
      where: {
        userId: session.user.id,
        isActive: true
      }
    });

    if (activeDevicesCount >= 3) {
      return NextResponse.json(
        { error: "Maximum device limit reached. You can only have 3 active devices." },
        { status: 403 }
      );
    }

    // Check if device already exists
    const existingDevice = await db.userDevice.findUnique({
      where: {
        userId_deviceId: {
          userId: session.user.id,
          deviceId
        }
      }
    });

    let device;
    
    if (existingDevice) {
      // Update existing device
      device = await db.userDevice.update({
        where: { id: existingDevice.id },
        data: {
          deviceName,
          platform,
          browser,
          ipAddress,
          location,
          isActive: true,
          lastSeenAt: new Date()
        }
      });
    } else {
      // Create new device
      device = await db.userDevice.create({
        data: {
          userId: session.user.id,
          deviceId,
          deviceType,
          deviceName,
          platform,
          browser,
          ipAddress,
          location,
          isActive: true,
          lastSeenAt: new Date()
        }
      });
    }

    return NextResponse.json({
      message: "Device registered successfully",
      device
    });

  } catch (error) {
    console.error("Error registering device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}