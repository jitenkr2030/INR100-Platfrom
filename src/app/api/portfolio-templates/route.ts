import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PortfolioTemplateRequest {
  name: string;
  description: string;
  strategy: string;
  riskLevel: number;
  expectedReturn?: number;
  minInvestment: number;
  maxInvestment?: number;
  categories?: string[];
  tags?: string[];
  isPublic?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get("expertId");
    const riskLevel = searchParams.get("riskLevel");
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const isPublic = searchParams.get("isPublic");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause
    const where: any = {};
    if (expertId) where.expertId = expertId;
    if (riskLevel) where.riskLevel = parseInt(riskLevel);
    if (isActive !== null) where.isActive = isActive === "true";
    if (isPublic !== null) where.isPublic = isPublic === "true";
    
    if (category) {
      where.categories = {
        contains: category,
        mode: "insensitive"
      };
    }

    // Get templates with pagination
    const templates = await db.portfolioTemplate.findMany({
      where,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        copies: {
          select: {
            id: true,
            userId: true,
          },
        },
        _count: {
          select: {
            copies: true,
          },
        },
      },
      orderBy: [
        { rating: "desc" },
        { copies: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const total = await db.portfolioTemplate.count({ where });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        expertId,
        riskLevel,
        category,
        isActive,
        isPublic,
      },
    });

  } catch (error) {
    console.error("Get portfolio templates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PortfolioTemplateRequest = await request.json();
    const { 
      name, 
      description, 
      strategy, 
      riskLevel, 
      expectedReturn, 
      minInvestment, 
      maxInvestment, 
      categories, 
      tags, 
      isPublic 
    } = body;

    if (!name || !description || !strategy || riskLevel === undefined || !minInvestment) {
      return NextResponse.json(
        { error: "Name, description, strategy, risk level, and minimum investment are required" },
        { status: 400 }
      );
    }

    // Get expert ID from headers (in real app, get from auth)
    const expertId = request.headers.get("x-user-id");
    if (!expertId) {
      return NextResponse.json(
        { error: "Expert ID is required" },
        { status: 401 }
      );
    }

    // Validate risk level (1-5)
    if (riskLevel < 1 || riskLevel > 5) {
      return NextResponse.json(
        { error: "Risk level must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate investment amounts
    if (maxInvestment && maxInvestment < minInvestment) {
      return NextResponse.json(
        { error: "Maximum investment must be greater than or equal to minimum investment" },
        { status: 400 }
      );
    }

    // Create portfolio template
    const template = await db.portfolioTemplate.create({
      data: {
        expertId,
        name,
        description,
        strategy,
        riskLevel,
        expectedReturn,
        minInvestment,
        maxInvestment,
        categories: categories ? JSON.stringify(categories) : null,
        tags: tags ? JSON.stringify(tags) : null,
        isPublic: isPublic ?? true,
      },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Portfolio template created successfully",
      template,
    });

  } catch (error) {
    console.error("Create portfolio template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, ...updateData } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Process arrays for JSON fields
    if (updateData.categories && Array.isArray(updateData.categories)) {
      updateData.categories = JSON.stringify(updateData.categories);
    }
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    const template = await db.portfolioTemplate.update({
      where: { id: templateId },
      data: updateData,
      include: {
        expert: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Portfolio template updated successfully",
      template,
    });

  } catch (error) {
    console.error("Update portfolio template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await db.portfolioTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Portfolio template deactivated successfully",
    });

  } catch (error) {
    console.error("Delete portfolio template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}