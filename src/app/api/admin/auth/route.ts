import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface AdminAuthRequest {
  email: string;
  password?: string;
  token?: string;
}

interface CheckPermissionRequest {
  permission: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminAuthRequest = await request.json();
    const { email, password, token } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      include: {
        adminUser: {
          include: {
            role: true,
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

    // Check if user is an admin
    if (!user.adminUser) {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Check if admin user is active
    if (!user.adminUser.isActive) {
      return NextResponse.json(
        { error: "Admin account is inactive" },
        { status: 403 }
      );
    }

    // Check if admin role is active
    if (!user.adminUser.role.isActive) {
      return NextResponse.json(
        { error: "Admin role is inactive" },
        { status: 403 }
      );
    }

    // Update last login time
    await db.adminUser.update({
      where: { id: user.adminUser.id },
      data: { lastLoginAt: new Date() },
    });

    // Log admin activity
    await db.adminActivityLog.create({
      data: {
        adminId: user.adminUser.id,
        action: "ADMIN_LOGIN",
        entity: "AdminUser",
        entityId: user.adminUser.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Combine role permissions with user-specific permissions
    const rolePermissions = user.adminUser.role.permissions || [];
    const userPermissions = user.adminUser.permissions || [];
    const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

    return NextResponse.json({
      message: "Admin authentication successful",
      admin: {
        id: user.adminUser.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.adminUser.role.id,
          name: user.adminUser.role.name,
          description: user.adminUser.role.description,
        },
        permissions: allPermissions,
        lastLoginAt: user.adminUser.lastLoginAt,
      },
    });

  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const permission = searchParams.get("permission");
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find admin user
    const adminUser = await db.adminUser.findUnique({
      where: { userId },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    if (!adminUser.isActive) {
      return NextResponse.json(
        { error: "Admin account is inactive" },
        { status: 403 }
      );
    }

    // Check permission if specified
    if (permission) {
      const rolePermissions = adminUser.role.permissions || [];
      const userPermissions = adminUser.permissions || [];
      const hasPermission = rolePermissions.includes(permission) || userPermissions.includes(permission);

      return NextResponse.json({
        hasPermission,
        admin: {
          id: adminUser.id,
          userId: adminUser.userId,
          email: adminUser.user.email,
          name: adminUser.user.name,
          role: adminUser.role.name,
        },
      });
    }

    // Return admin info without permission check
    const rolePermissions = adminUser.role.permissions || [];
    const userPermissions = adminUser.permissions || [];
    const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

    return NextResponse.json({
      admin: {
        id: adminUser.id,
        userId: adminUser.userId,
        email: adminUser.user.email,
        name: adminUser.user.name,
        role: {
          id: adminUser.role.id,
          name: adminUser.role.name,
          description: adminUser.role.description,
        },
        permissions: allPermissions,
        lastLoginAt: adminUser.lastLoginAt,
        isActive: adminUser.isActive,
      },
    });

  } catch (error) {
    console.error("Get admin info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}