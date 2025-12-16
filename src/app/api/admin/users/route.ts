import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface UserUpdateRequest {
  userId: string;
  name?: string;
  phone?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  kycStatus?: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  riskProfile?: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  subscriptionTier?: "BASIC" | "PREMIUM" | "PROFESSIONAL";
  isVerified?: boolean;
  level?: number;
  xp?: number;
  streak?: number;
}

interface UserFilterRequest {
  page?: number;
  limit?: number;
  search?: string;
  kycStatus?: string;
  riskProfile?: string;
  subscriptionTier?: string;
  isVerified?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const kycStatus = searchParams.get("kycStatus");
    const riskProfile = searchParams.get("riskProfile");
    const subscriptionTier = searchParams.get("subscriptionTier");
    const isVerified = searchParams.get("isVerified");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (kycStatus) where.kycStatus = kycStatus;
    if (riskProfile) where.riskProfile = riskProfile;
    if (subscriptionTier) where.subscriptionTier = subscriptionTier;
    if (isVerified !== null) where.isVerified = isVerified === "true";

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        kycStatus: true,
        riskProfile: true,
        isVerified: true,
        level: true,
        xp: true,
        streak: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            portfolios: true,
            orders: true,
            transactions: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await db.user.count({ where });

    // Calculate statistics
    const stats = await db.user.groupBy({
      by: ["kycStatus"],
      where,
      _count: { _all: true },
    });

    const riskProfileStats = await db.user.groupBy({
      by: ["riskProfile"],
      where,
      _count: { _all: true },
    });

    const subscriptionStats = await db.user.groupBy({
      by: ["subscriptionTier"],
      where,
      _count: { _all: true },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statistics: {
        byKYCStatus: stats.reduce((acc, item) => {
          acc[item.kycStatus] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        byRiskProfile: riskProfileStats.reduce((acc, item) => {
          acc[item.riskProfile || "UNKNOWN"] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        bySubscriptionTier: subscriptionStats.reduce((acc, item) => {
          acc[item.subscriptionTier] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        totalUsers: total,
      },
      filters: {
        search,
        kycStatus,
        riskProfile,
        subscriptionTier,
        isVerified,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      },
    });

  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body: UserUpdateRequest = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        kycStatus: true,
        riskProfile: true,
        isVerified: true,
        level: true,
        xp: true,
        streak: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log admin activity
    const adminId = request.headers.get("x-admin-id");
    if (adminId) {
      await db.adminActivityLog.create({
        data: {
          adminId,
          action: "UPDATE_USER",
          entity: "User",
          entityId: userId,
          changes: JSON.stringify({ before: existingUser, after: updatedUser }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update user error:", error);
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

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting a flag or archiving
    // For now, we'll just return an error as deletion might not be appropriate
    // In a real system, you might want to anonymize data instead of deleting

    return NextResponse.json(
      { error: "User deletion not implemented for security reasons" },
      { status: 501 }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}