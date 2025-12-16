import { NextRequest, NextResponse } from "next/server";
import { GSTService, GSTCalculationInput } from "@/lib/gst-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      amount,
      gstRate,
      state,
      isInterState,
      isExport,
      isExempt
    }: GSTCalculationInput = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const result = GSTService.calculateGST({
      amount,
      gstRate,
      state: state || "MAHARASHTRA",
      isInterState: isInterState || false,
      isExport: isExport || false,
      isExempt: isExempt || false
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("GST calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "rates":
        // Get GST rates for different services
        const rates = {
          SUBSCRIPTION: GSTService.getGSTRateForService("SUBSCRIPTION"),
          PREMIUM_FEATURES: GSTService.getGSTRateForService("PREMIUM_FEATURES"),
          TRADING_FEES: GSTService.getGSTRateForService("TRADING_FEES"),
          GST_PAYMENT: GSTService.getGSTRateForService("GST_PAYMENT"),
          DEFAULT: GSTService.getGSTRateForService("DEFAULT")
        };

        return NextResponse.json({
          success: true,
          data: rates
        });

      case "sac-codes":
        // Get SAC codes for different services
        const sacCodes = {
          SUBSCRIPTION: GSTService.getSACCodeForService("SUBSCRIPTION"),
          PREMIUM_FEATURES: GSTService.getSACCodeForService("PREMIUM_FEATURES"),
          TRADING_FEES: GSTService.getSACCodeForService("TRADING_FEES"),
          CONSULTING: GSTService.getSACCodeForService("CONSULTING"),
          SOFTWARE: GSTService.getSACCodeForService("SOFTWARE"),
          DEFAULT: GSTService.getSACCodeForService("DEFAULT")
        };

        return NextResponse.json({
          success: true,
          data: sacCodes
        });

      case "state-codes":
        // Get state codes
        return NextResponse.json({
          success: true,
          data: GSTService["STATE_CODES"] // Access private property for API
        });

      case "validate-gstin":
        // Validate GSTIN
        const gstin = searchParams.get("gstin");
        if (!gstin) {
          return NextResponse.json(
            { error: "GSTIN is required" },
            { status: 400 }
          );
        }

        const isValid = GSTService.validateGSTIN(gstin);
        return NextResponse.json({
          success: true,
          data: {
            gstin: GSTService.formatGSTIN(gstin),
            isValid
          }
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("GST API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}