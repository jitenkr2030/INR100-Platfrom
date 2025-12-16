import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GSTService, InvoiceData } from "@/lib/gst-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const invoiceData: InvoiceData = await request.json();

    // Validate required fields
    if (!invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json(
        { error: "Invoice items are required" },
        { status: 400 }
      );
    }

    if (!invoiceData.billingAddress || !invoiceData.billingAddress.state) {
      return NextResponse.json(
        { error: "Billing address with state is required" },
        { status: 400 }
      );
    }

    // Calculate GST for the invoice
    const gstCalculation = GSTService.calculateInvoiceGST(
      invoiceData.items,
      invoiceData.billingAddress.state,
      invoiceData.shippingAddress?.state
    );

    // Generate invoice number
    const invoiceNumber = GSTService.generateInvoiceNumber('GST');

    // Create invoice record
    const invoice = await db.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        type: invoiceData.type,
        amount: gstCalculation.subtotal,
        gstRate: invoiceData.items[0]?.gstRate || 18, // Use first item's GST rate or default
        gstAmount: gstCalculation.totalGST,
        totalAmount: gstCalculation.totalAmount,
        status: 'PENDING',
        dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        metadata: JSON.stringify({
          items: gstCalculation.items,
          billingAddress: invoiceData.billingAddress,
          shippingAddress: invoiceData.shippingAddress,
          cgstAmount: gstCalculation.cgstTotal,
          sgstAmount: gstCalculation.sgstTotal,
          igstAmount: gstCalculation.igstTotal,
          notes: invoiceData.notes,
          generatedAt: new Date().toISOString()
        })
      }
    });

    // Generate PDF (placeholder - would integrate with PDF generation service)
    const pdfUrl = GSTService.generateInvoicePDF(invoice);

    // Update invoice with PDF URL
    await db.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl }
    });

    return NextResponse.json({
      success: true,
      data: {
        invoice: {
          ...invoice,
          items: gstCalculation.items,
          subtotal: gstCalculation.subtotal,
          cgstAmount: gstCalculation.cgstTotal,
          sgstAmount: gstCalculation.sgstTotal,
          igstAmount: gstCalculation.igstTotal,
          totalGST: gstCalculation.totalGST,
          totalAmount: gstCalculation.totalAmount
        },
        pdfUrl
      }
    });

  } catch (error) {
    console.error("GST invoice generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const whereClause: any = { userId: session.user.id };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const invoices = await db.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Parse metadata for each invoice
    const processedInvoices = invoices.map(invoice => ({
      ...invoice,
      metadata: invoice.metadata ? JSON.parse(invoice.metadata) : null
    }));

    return NextResponse.json({
      success: true,
      data: processedInvoices
    });

  } catch (error) {
    console.error("GST invoices fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}