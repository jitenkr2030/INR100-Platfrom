import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { DeviceManager } from "@/lib/device-manager";
import { FraudDetectionService } from "@/lib/fraud-detection";
import { ActivityCategory } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password } = await request.json();

    if (!password) {
      // Log failed login attempt
      try {
        const clientInfo = FraudDetectionService.extractClientInfo(request);
        await FraudDetectionService.logActivity({
          userId: "unknown", // We don't know the user ID yet
          action: "LOGIN_FAILED",
          category: ActivityCategory.AUTHENTICATION,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          metadata: { email, phone, reason: "Missing password" }
        });
      } catch (logError) {
        console.error("Error logging failed login:", logError);
      }

      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      // Log failed login attempt
      try {
        const clientInfo = FraudDetectionService.extractClientInfo(request);
        await FraudDetectionService.logActivity({
          userId: "unknown",
          action: "LOGIN_FAILED",
          category: ActivityCategory.AUTHENTICATION,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          metadata: { email, phone, reason: "Missing email or phone" }
        });
      } catch (logError) {
        console.error("Error logging failed login:", logError);
      }

      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (!user) {
      // Log failed login attempt
      try {
        const clientInfo = FraudDetectionService.extractClientInfo(request);
        await FraudDetectionService.logActivity({
          userId: "unknown",
          action: "LOGIN_FAILED",
          category: ActivityCategory.AUTHENTICATION,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          metadata: { email, phone, reason: "User not found" }
        });
      } catch (logError) {
        console.error("Error logging failed login:", logError);
      }

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      // Log failed login attempt
      try {
        const clientInfo = FraudDetectionService.extractClientInfo(request);
        await FraudDetectionService.logActivity({
          userId: user.id,
          action: "LOGIN_FAILED",
          category: ActivityCategory.AUTHENTICATION,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          metadata: { email, phone, reason: "Invalid password" }
        });
      } catch (logError) {
        console.error("Error logging failed login:", logError);
      }

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Register device
    let device;
    try {
      const deviceInfo = DeviceManager.extractDeviceInfo(request);
      device = await DeviceManager.registerDevice(user.id, deviceInfo);
    } catch (deviceError) {
      console.error("Device registration error:", deviceError);
      // Don't fail login if device registration fails, just log the error
    }

    // Log successful login
    try {
      const clientInfo = FraudDetectionService.extractClientInfo(request);
      await FraudDetectionService.logActivity({
        userId: user.id,
        action: "LOGIN_SUCCESS",
        category: ActivityCategory.AUTHENTICATION,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceId: device?.id,
        metadata: { email, phone, deviceRegistered: !!device }
      });
    } catch (logError) {
      console.error("Error logging successful login:", logError);
    }

    // Return user data without sensitive information
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      requiresOTP: !user.isVerified
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}