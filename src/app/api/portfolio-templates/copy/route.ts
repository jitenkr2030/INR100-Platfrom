import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CopyPortfolioTemplateRequest {
  templateId: string;
  initialInvestment: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CopyPortfolioTemplateRequest = await request.json();
    const { templateId, initialInvestment } = body;

    if (!templateId || !initialInvestment) {
      return NextResponse.json(
        { error: "Template ID and initial investment are required" },
        { status: 400 }
      );
    }

    // Get user ID from headers (in real app, get from auth)
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Get the template
    const template = await db.portfolioTemplate.findUnique({
      where: { id: templateId },
      include: {
        expert: {
          select: {
            id: true,
            name: true,
          },
        },
        copies: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Template not found or inactive" },
        { status: 404 }
      );
    }

    // Check if user already copied this template
    if (template.copies.length > 0) {
      return NextResponse.json(
        { error: "You have already copied this template" },
        { status: 400 }
      );
    }

    // Validate investment amount
    if (initialInvestment < template.minInvestment) {
      return NextResponse.json(
        { 
          error: `Minimum investment required is ₹${template.minInvestment.toLocaleString()}` 
        },
        { status: 400 }
      );
    }

    if (template.maxInvestment && initialInvestment > template.maxInvestment) {
      return NextResponse.json(
        { 
          error: `Maximum investment allowed is ₹${template.maxInvestment.toLocaleString()}` 
        },
        { status: 400 }
      );
    }

    // Create the copy record
    const templateCopy = await db.portfolioTemplateCopy.create({
      data: {
        templateId,
        userId,
        investedAmount: initialInvestment,
        currentValue: initialInvestment,
      },
      include: {
        template: {
          include: {
            expert: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update template copy count
    await db.portfolioTemplate.update({
      where: { id: templateId },
      data: {
        copies: {
          increment: 1,
        },
      },
    });

    // Calculate commission for the expert (e.g., 1% of investment)
    const commissionRate = 0.01; // 1% commission
    const commissionAmount = initialInvestment * commissionRate;

    // Create commission record for the expert
    const expertCommission = await db.commission.create({
      data: {
        userId: template.expertId,
        partnerId: "system", // System partner for template copies
        type: "PORTFOLIO_TEMPLATE_COPY",
        amount: commissionAmount,
        currency: "INR",
        percentage: commissionRate * 100,
        reference: templateCopy.id,
        description: `Commission for portfolio template copy - ${template.name}`,
        status: "PENDING",
      },
    });

    // Update the copy record with commission
    await db.portfolioTemplateCopy.update({
      where: { id: templateCopy.id },
      data: {
        commissionPaid: commissionAmount,
      },
    });

    return NextResponse.json({
      message: "Portfolio template copied successfully",
      copy: templateCopy,
      commission: {
        amount: commissionAmount,
        rate: commissionRate * 100,
      },
    });

  } catch (error) {
    console.error("Copy portfolio template error:", error);
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
    const templateId = searchParams.get("templateId");
    const isActive = searchParams.get("isActive");

    // Get user ID from headers if not provided
    const targetUserId = userId || request.headers.get("x-user-id");
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Build where clause
    const where: any = { userId: targetUserId };
    if (templateId) where.templateId = templateId;
    if (isActive !== null) where.isActive = isActive === "true";

    const copies = await db.portfolioTemplateCopy.findMany({
      where,
      include: {
        template: {
          include: {
            expert: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        copiedAt: "desc",
      },
    });

    // Calculate summary statistics
    const summary = {
      totalCopies: copies.length,
      totalInvested: copies.reduce((sum, copy) => sum + copy.investedAmount, 0),
      totalCurrentValue: copies.reduce((sum, copy) => sum + copy.currentValue, 0),
      totalReturns: copies.reduce((sum, copy) => sum + copy.returns, 0),
      totalCommissions: copies.reduce((sum, copy) => sum + copy.commissionPaid, 0),
      averageReturn: copies.length > 0 
        ? copies.reduce((sum, copy) => sum + copy.returnsPercent, 0) / copies.length 
        : 0,
    };

    return NextResponse.json({
      copies,
      summary,
      filters: {
        userId: targetUserId,
        templateId,
        isActive,
      },
    });

  } catch (error) {
    console.error("Get portfolio template copies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}