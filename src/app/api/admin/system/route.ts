import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface SystemConfigRequest {
  key: string;
  value: string;
  description?: string;
  category?: string;
}

interface SystemHealthResponse {
  status: "healthy" | "warning" | "critical";
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: string;
    responseTime: number;
    connections: number;
  };
  services: {
    [key: string]: {
      status: "up" | "down" | "warning";
      responseTime?: number;
      lastCheck: string;
    };
  };
  metrics: {
    activeUsers: number;
    totalUsers: number;
    todayTransactions: number;
    systemLoad: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "health";

    switch (type) {
      case "health":
        return await getSystemHealth();
      case "metrics":
        return await getSystemMetrics();
      case "config":
        return await getSystemConfig();
      case "logs":
        return await getSystemLogs();
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("System status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getSystemHealth(): Promise<NextResponse> {
  try {
    // Get basic system metrics
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Database health check
    const dbStart = Date.now();
    await db.user.count();
    const dbResponseTime = Date.now() - dbStart;

    // Get user counts
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({
      where: {
        lastLoginAt: {
          gte: yesterday,
        },
      },
    });

    // Get transaction counts
    const todayTransactions = await db.transaction.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    });

    // Calculate system load (simplified)
    const systemLoad = Math.min(100, (activeUsers / 1000) * 10);

    // Determine overall health status
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (dbResponseTime > 1000 || systemLoad > 80) {
      status = "warning";
    }
    if (dbResponseTime > 5000 || systemLoad > 95) {
      status = "critical";
    }

    const healthData: SystemHealthResponse = {
      status,
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      },
      database: {
        status: dbResponseTime < 100 ? "healthy" : dbResponseTime < 1000 ? "slow" : "critical",
        responseTime: dbResponseTime,
        connections: 1, // Simplified for this example
      },
      services: {
        api: {
          status: "up",
          responseTime: dbResponseTime,
          lastCheck: now.toISOString(),
        },
        database: {
          status: dbResponseTime < 100 ? "up" : "warning",
          responseTime: dbResponseTime,
          lastCheck: now.toISOString(),
        },
        email: {
          status: "up",
          lastCheck: now.toISOString(),
        },
        payment: {
          status: "up",
          lastCheck: now.toISOString(),
        },
      },
      metrics: {
        activeUsers,
        totalUsers,
        todayTransactions,
        systemLoad,
      },
    };

    return NextResponse.json(healthData);

  } catch (error) {
    return NextResponse.json(
      {
        status: "critical",
        error: "Failed to get system health",
      },
      { status: 500 }
    );
  }
}

async function getSystemMetrics() {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User metrics
    const totalUsers = await db.user.count();
    const newUsersThisMonth = await db.user.count({
      where: {
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    // Transaction metrics
    const totalTransactions = await db.transaction.count();
    const transactionsThisMonth = await db.transaction.count({
      where: {
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    // Revenue metrics
    const revenueThisMonth = await db.transaction.aggregate({
      where: {
        type: "INVESTMENT",
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Expert marketplace metrics
    const expertInsights = await db.expertInsight.count();
    const portfolioTemplates = await db.portfolioTemplate.count();
    const newsletters = await db.newsletter.count();

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        growthRate: totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0,
      },
      transactions: {
        total: totalTransactions,
        thisMonth: transactionsThisMonth,
      },
      revenue: {
        thisMonth: revenueThisMonth._sum.amount || 0,
      },
      expertMarketplace: {
        totalInsights: expertInsights,
        totalTemplates: portfolioTemplates,
        totalNewsletters: newsletters,
      },
      generatedAt: now.toISOString(),
    });

  } catch (error) {
    console.error("Get system metrics error:", error);
    return NextResponse.json(
      { error: "Failed to get system metrics" },
      { status: 500 }
    );
  }
}

async function getSystemConfig() {
  try {
    const configs = await db.systemConfig.findMany({
      orderBy: {
        category: "asc",
        key: "asc",
      },
    });

    // Group by category
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push({
        key: config.key,
        value: JSON.parse(config.value),
        description: config.description,
        isEditable: config.isEditable,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      configs: groupedConfigs,
      totalConfigs: configs.length,
    });

  } catch (error) {
    console.error("Get system config error:", error);
    return NextResponse.json(
      { error: "Failed to get system configuration" },
      { status: 500 }
    );
  }
}

async function getSystemLogs() {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const level = searchParams.get("level");
    const entity = searchParams.get("entity");

    // Get admin activity logs
    const where: any = {};
    if (entity) where.entity = entity;

    const logs = await db.adminActivityLog.findMany({
      where,
      include: {
        admin: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        changes: log.changes,
        admin: {
          email: log.admin.user.email,
          name: log.admin.user.name,
        },
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      totalLogs: logs.length,
    });

  } catch (error) {
    console.error("Get system logs error:", error);
    return NextResponse.json(
      { error: "Failed to get system logs" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: SystemConfigRequest = await request.json();
    const { key, value, description, category } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID required" },
        { status: 401 }
      );
    }

    // Check if config exists
    const existingConfig = await db.systemConfig.findUnique({
      where: { key },
    });

    let config;
    if (existingConfig) {
      // Update existing config
      config = await db.systemConfig.update({
        where: { key },
        data: {
          value: JSON.stringify(value),
          description,
          category: category || existingConfig.category,
          updatedBy: adminId,
        },
      });
    } else {
      // Create new config
      config = await db.systemConfig.create({
        data: {
          key,
          value: JSON.stringify(value),
          description,
          category: category || "general",
          updatedBy: adminId,
        },
      });
    }

    // Log admin activity
    await db.adminActivityLog.create({
      data: {
        adminId,
        action: "UPDATE_SYSTEM_CONFIG",
        entity: "SystemConfig",
        entityId: config.id,
        changes: JSON.stringify({ key, value, description, category }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      message: "System configuration updated successfully",
      config: {
        key: config.key,
        value: JSON.parse(config.value),
        description: config.description,
        category: config.category,
        updatedAt: config.updatedAt,
      },
    });

  } catch (error) {
    console.error("Update system config error:", error);
    return NextResponse.json(
      { error: "Failed to update system configuration" },
      { status: 500 }
    );
  }
}