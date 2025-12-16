'use client';

import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const { format, data } = await request.json();
    
    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let blob: Blob;

    switch (format) {
      case 'pdf':
        blob = await generatePDFReport(data);
        break;
      case 'excel':
        blob = await generateExcelReport(data);
        break;
      case 'csv':
        blob = await generateCSVReport(data);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return new NextResponse(blob, {
      headers: {
        'Content-Type': getContentType(format),
        'Content-Disposition': `attachment; filename="portfolio-report-${Date.now()}.${format}"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

async function generatePDFReport(data: any): Promise<Blob> {
  const doc = new jsPDF();
  const { portfolioAnalytics, assetPerformance, riskMetrics } = data;

  // Title
  doc.setFontSize(20);
  doc.text('Portfolio Analytics Report', 20, 30);

  // Date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

  // Portfolio Summary
  doc.setFontSize(16);
  doc.text('Portfolio Summary', 20, 65);
  
  doc.setFontSize(12);
  const summaryData = [
    `Total Value: ₹${(portfolioAnalytics?.totalValue || 0).toLocaleString()}`,
    `Day Change: ₹${(portfolioAnalytics?.dayChange || 0).toLocaleString()} (${(portfolioAnalytics?.dayChangePercent || 0).toFixed(2)}%)`,
    `Total Return: ₹${(portfolioAnalytics?.totalReturn || 0).toLocaleString()} (${(portfolioAnalytics?.totalReturnPercent || 0).toFixed(2)}%)`,
    `Annualized Return: ${(portfolioAnalytics?.annualizedReturn || 0).toFixed(2)}%`,
    `Volatility: ${(portfolioAnalytics?.volatility || 0).toFixed(2)}%`,
    `Sharpe Ratio: ${(portfolioAnalytics?.sharpeRatio || 0).toFixed(2)}`
  ];

  summaryData.forEach((item, index) => {
    doc.text(item, 20, 80 + (index * 8));
  });

  // Asset Performance
  doc.setFontSize(16);
  doc.text('Top Holdings', 20, 150);
  
  doc.setFontSize(12);
  doc.text('Symbol', 20, 165);
  doc.text('Allocation', 80, 165);
  doc.text('Day Change %', 130, 165);
  doc.text('Total Return %', 180, 165);

  assetPerformance?.slice(0, 10).forEach((asset: any, index: number) => {
    const y = 175 + (index * 8);
    doc.text(asset.symbol, 20, y);
    doc.text(`${asset.allocation.toFixed(1)}%`, 80, y);
    doc.text(`${asset.dayChangePercent.toFixed(2)}%`, 130, y);
    doc.text(`${asset.totalReturnPercent.toFixed(2)}%`, 180, y);
  });

  // Risk Analysis
  if (riskMetrics) {
    doc.setFontSize(16);
    doc.text('Risk Analysis', 20, 280);
    
    doc.setFontSize(12);
    const riskData = [
      `Portfolio Risk: ${riskMetrics.portfolioRisk.toFixed(2)}%`,
      `Diversification Score: ${riskMetrics.diversificationScore.toFixed(0)}/100`,
      `Concentration Risk: ${riskMetrics.concentrationRisk.toFixed(1)}%`,
      `Risk Level: ${riskMetrics.riskLevel}`
    ];

    riskData.forEach((item, index) => {
      doc.text(item, 20, 295 + (index * 8));
    });
  }

  return doc.output('blob');
}

async function generateExcelReport(data: any): Promise<Blob> {
  const workbook = XLSX.utils.book_new();
  const { portfolioAnalytics, assetPerformance, riskMetrics } = data;

  // Portfolio Summary Sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Value', portfolioAnalytics?.totalValue || 0],
    ['Day Change', portfolioAnalytics?.dayChange || 0],
    ['Day Change %', portfolioAnalytics?.dayChangePercent || 0],
    ['Total Return', portfolioAnalytics?.totalReturn || 0],
    ['Total Return %', portfolioAnalytics?.totalReturnPercent || 0],
    ['Annualized Return %', portfolioAnalytics?.annualizedReturn || 0],
    ['Volatility %', portfolioAnalytics?.volatility || 0],
    ['Sharpe Ratio', portfolioAnalytics?.sharpeRatio || 0],
    ['Max Drawdown %', portfolioAnalytics?.maxDrawdown || 0],
    ['Beta', portfolioAnalytics?.beta || 0],
    ['Alpha', portfolioAnalytics?.alpha || 0]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Portfolio Summary');

  // Asset Performance Sheet
  const assetData = [
    ['Symbol', 'Name', 'Allocation %', 'Value', 'Day Change', 'Day Change %', 'Total Return', 'Total Return %', 'Volatility', 'Beta']
  ];

  assetPerformance?.forEach((asset: any) => {
    assetData.push([
      asset.symbol,
      asset.name,
      asset.allocation,
      asset.value,
      asset.dayChange,
      asset.dayChangePercent,
      asset.totalReturn,
      asset.totalReturnPercent,
      asset.volatility,
      asset.beta
    ]);
  });

  const assetSheet = XLSX.utils.aoa_to_sheet(assetData);
  XLSX.utils.book_append_sheet(workbook, assetSheet, 'Asset Performance');

  // Risk Analysis Sheet
  if (riskMetrics) {
    const riskData = [
      ['Metric', 'Value'],
      ['Portfolio Risk %', riskMetrics.portfolioRisk],
      ['Diversification Score', riskMetrics.diversificationScore],
      ['Concentration Risk %', riskMetrics.concentrationRisk],
      ['Risk Level', riskMetrics.riskLevel]
    ];

    // Add sector exposure
    Object.entries(riskMetrics.sectorExposure).forEach(([sector, exposure]) => {
      riskData.push([`Sector - ${sector}`, exposure]);
    });

    // Add geographic exposure
    Object.entries(riskMetrics.geographicExposure).forEach(([geo, exposure]) => {
      riskData.push([`Geographic - ${geo}`, exposure]);
    });

    const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
    XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Analysis');
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function generateCSVReport(data: any): Promise<Blob> {
  const { assetPerformance } = data;
  
  let csv = 'Symbol,Name,Allocation %,Value,Day Change,Day Change %,Total Return,Total Return %,Volatility,Beta\n';
  
  assetPerformance?.forEach((asset: any) => {
    csv += `${asset.symbol},${asset.name},${asset.allocation},${asset.value},${asset.dayChange},${asset.dayChangePercent},${asset.totalReturn},${asset.totalReturnPercent},${asset.volatility},${asset.beta}\n`;
  });

  return new Blob([csv], { type: 'text/csv' });
}

function getContentType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}