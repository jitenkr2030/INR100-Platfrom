import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Razorpay configuration validation
interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  environment: 'test' | 'production';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified - in production, implement proper role-based access)
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.email !== "admin@inr100.com") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const config: RazorpayConfig = {
      keyId: process.env.RAZORPAY_KEY_ID || "",
      keySecret: process.env.RAZORPAY_KEY_SECRET ? "***" : "",
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ? "***" : "",
      environment: process.env.NODE_ENV === "production" ? "production" : "test"
    };

    // Validate configuration
    const validation = validateRazorpayConfig(config);

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        keySecret: config.keySecret ? "***configured***" : "",
        webhookSecret: config.webhookSecret ? "***configured***" : ""
      },
      validation
    });

  } catch (error) {
    console.error("Error fetching Razorpay config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.email !== "admin@inr100.com") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { keyId, keySecret, webhookSecret, environment } = await request.json();

    // Validate input
    if (!keyId || !keySecret || !webhookSecret) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate Razorpay key format
    if (!validateRazorpayKeyId(keyId)) {
      return NextResponse.json(
        { error: "Invalid Razorpay Key ID format" },
        { status: 400 }
      );
    }

    // Test the credentials by making a simple API call
    const isValid = await testRazorpayCredentials(keyId, keySecret);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Razorpay credentials" },
        { status: 400 }
      );
    }

    // In a real application, you would update environment variables
    // For this example, we'll just return success
    return NextResponse.json({
      success: true,
      message: "Razorpay configuration validated successfully",
      warnings: environment === "production" ? [
        "Production keys detected - ensure these are live credentials",
        "Update your .env file with the new credentials",
        "Restart the application after updating environment variables"
      ] : [
        "Test keys detected - suitable for development only",
        "Replace with production keys before going live"
      ]
    });

  } catch (error) {
    console.error("Error updating Razorpay config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function validateRazorpayConfig(config: RazorpayConfig) {
  const issues: string[] = [];

  if (!config.keyId) {
    issues.push("Razorpay Key ID is not configured");
  } else if (!validateRazorpayKeyId(config.keyId)) {
    issues.push("Razorpay Key ID format is invalid");
  }

  if (!config.keySecret) {
    issues.push("Razorpay Key Secret is not configured");
  }

  if (!config.webhookSecret) {
    issues.push("Webhook Secret is not configured");
  }

  if (config.environment === "production") {
    if (config.keyId.startsWith("rzp_test_")) {
      issues.push("Test keys detected in production environment");
    }
  } else {
    if (!config.keyId.startsWith("rzp_test_")) {
      issues.push("Production keys detected in test environment");
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

function validateRazorpayKeyId(keyId: string): boolean {
  // Razorpay Key ID format: rzp_live_XXXXXXXXXXXXXXXX or rzp_test_XXXXXXXXXXXXXXXX
  const pattern = /^rzp_(live|test)_[A-Za-z0-9]{14,}$/;
  return pattern.test(keyId);
}

async function testRazorpayCredentials(keyId: string, keySecret: string): Promise<boolean> {
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/payments', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    // We don't care about the response content, just that it's authorized
    return response.status !== 401;
  } catch (error) {
    console.error("Error testing Razorpay credentials:", error);
    return false;
  }
}