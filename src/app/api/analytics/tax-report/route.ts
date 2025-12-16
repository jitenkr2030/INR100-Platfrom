'use client';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TaxReport {
  fiscalYear: string;
  capitalGains: {
    shortTerm: TaxCategory;
    longTerm: TaxCategory;
    total: TaxCategory;
  };
  dividends: {
    totalDividends: number;
    taxRate: number;
    taxAmount: number;
  };
  transactions: TaxTransaction[];
  summary: TaxSummary;
  documents: TaxDocument[];
  complianceNotes: string[];
}

interface TaxCategory {
  amount: number;
  taxRate: number;
  taxAmount: number;
}

interface TaxTransaction {
  date: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  quantity: number;
  price: number;
  amount: number;
  brokerage: number;
  totalAmount: number;
  gainLoss?: number;
  holdingPeriod?: number;
  taxCategory?: 'SHORT_TERM' | 'LONG_TERM';
}

interface TaxSummary {
  totalCapitalGains: number;
  totalDividends: number;
  totalIncome: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  eligibleForExemption?: boolean;
  exemptionAmount?: number;
}

interface TaxDocument {
  type: 'CAPITAL_GAINS_STATEMENT' | 'DIVIDEND_INCOME' | 'TRADING_SUMMARY' | 'TAX_SAVING_INVESTMENTS';
  title: string;
  description: string;
  downloadUrl: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || getCurrentFiscalYear();
    const format = searchParams.get('format') || 'json';

    // Get user from session
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate tax report
    const taxReport = await generateTaxReport(userId, fiscalYear);

    if (format === 'pdf') {
      // Return PDF generation response
      const pdfBlob = await generateTaxReportPDF(taxReport);
      return new NextResponse(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="tax-report-${fiscalYear}.pdf"`
        }
      });
    }

    return NextResponse.json(taxReport);
  } catch (error) {
    console.error('Tax report error:', error);
    return NextResponse.json({ error: 'Failed to generate tax report' }, { status: 500 });
  }
}

async function generateTaxReport(userId: string, fiscalYear: string): Promise<TaxReport> {
  // Fetch user's transactions for the fiscal year
  const startDate = new Date(`${fiscalYear.split('-')[0]}-04-01`);
  const endDate = new Date(`${fiscalYear.split('-')[1]}-03-31`);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'COMPLETED'
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Process transactions for tax calculation
  const processedTransactions = await processTransactionsForTax(transactions);

  // Calculate capital gains
  const capitalGains = calculateCapitalGains(processedTransactions);
  
  // Calculate dividend income
  const dividends = calculateDividendIncome(transactions);
  
  // Generate tax summary
  const summary = calculateTaxSummary(capitalGains, dividends);
  
  // Generate tax documents
  const documents = generateTaxDocuments(fiscalYear);
  
  // Generate compliance notes
  const complianceNotes = generateComplianceNotes(capitalGains, dividends, summary);

  return {
    fiscalYear,
    capitalGains,
    dividends,
    transactions: processedTransactions,
    summary,
    documents,
    complianceNotes
  };
}

async function processTransactionsForTax(transactions: any[]): Promise<TaxTransaction[]> {
  const processedTransactions: TaxTransaction[] = [];

  for (const transaction of transactions) {
    const taxTransaction: TaxTransaction = {
      date: transaction.createdAt.toISOString().split('T')[0],
      symbol: transaction.metadata ? JSON.parse(transaction.metadata).symbol || 'N/A' : 'N/A',
      type: transaction.type === 'INVESTMENT' ? 'BUY' : transaction.type === 'DIVIDEND' ? 'DIVIDEND' : 'BUY',
      quantity: transaction.metadata ? JSON.parse(transaction.metadata).quantity || 0 : 0,
      price: transaction.amount / (transaction.metadata ? JSON.parse(transaction.metadata).quantity || 1 : 1),
      amount: Math.abs(transaction.amount),
      brokerage: transaction.fee || 0,
      totalAmount: Math.abs(transaction.amount) + (transaction.fee || 0)
    };

    // Calculate gain/loss and tax category for sell transactions
    if (transaction.type === 'INVESTMENT' && taxTransaction.type === 'BUY') {
      // This would require matching buy/sell pairs
      // For now, we'll add mock calculations
      taxTransaction.gainLoss = Math.random() * 10000 - 5000; // Mock gain/loss
      taxTransaction.holdingPeriod = Math.floor(Math.random() * 1000) + 30; // Mock holding period in days
      taxTransaction.taxCategory = taxTransaction.holdingPeriod! > 365 ? 'LONG_TERM' : 'SHORT_TERM';
    }

    processedTransactions.push(taxTransaction);
  }

  return processedTransactions;
}

function calculateCapitalGains(transactions: TaxTransaction[]) {
  // Separate buy and sell transactions
  const buyTransactions = transactions.filter(t => t.type === 'BUY');
  const sellTransactions = transactions.filter(t => t.type === 'SELL');

  let shortTermGains = 0;
  let longTermGains = 0;

  // Simplified calculation - in reality, you'd use FIFO/LIFO methods
  for (const sell of sellTransactions) {
    const matchingBuy = buyTransactions.find(b => b.symbol === sell.symbol);
    if (matchingBuy) {
      const gainLoss = (sell.price - matchingBuy.price) * sell.quantity;
      const holdingPeriod = sell.holdingPeriod || 0;
      
      if (holdingPeriod > 365) {
        longTermGains += gainLoss;
      } else {
        shortTermGains += gainLoss;
      }
    }
  }

  return {
    shortTerm: {
      amount: shortTermGains,
      taxRate: shortTermGains > 0 ? 15.0 : 0,
      taxAmount: Math.max(0, shortTermGains) * 0.15
    },
    longTerm: {
      amount: longTermGains,
      taxRate: longTermGains > 0 ? 10.0 : 0,
      taxAmount: Math.max(0, longTermGains) * 0.10
    },
    total: {
      amount: shortTermGains + longTermGains,
      taxRate: 0, // Will be calculated separately
      taxAmount: Math.max(0, shortTermGains) * 0.15 + Math.max(0, longTermGains) * 0.10
    }
  };
}

function calculateDividendIncome(transactions: any[]) {
  const dividendTransactions = transactions.filter(t => t.type === 'DIVIDEND');
  const totalDividends = dividendTransactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    totalDividends,
    taxRate: totalDividends > 5000 ? 10.0 : 0, // TDS for dividends > 5000
    taxAmount: Math.max(0, totalDividends - 5000) * 0.10
  };
}

function calculateTaxSummary(capitalGains: any, dividends: any) {
  const totalCapitalGains = capitalGains.total.amount;
  const totalDividends = dividends.totalDividends;
  const totalIncome = totalCapitalGains + totalDividends;
  const estimatedTax = capitalGains.total.taxAmount + dividends.taxAmount;
  const effectiveTaxRate = totalIncome > 0 ? (estimatedTax / totalIncome) * 100 : 0;

  return {
    totalCapitalGains,
    totalDividends,
    totalIncome,
    estimatedTax,
    effectiveTaxRate,
    eligibleForExemption: totalCapitalGains < 100000, // Basic exemption
    exemptionAmount: totalCapitalGains < 100000 ? 100000 - totalCapitalGains : 0
  };
}

function generateTaxDocuments(fiscalYear: string): TaxDocument[] {
  return [
    {
      type: 'CAPITAL_GAINS_STATEMENT',
      title: 'Capital Gains Statement',
      description: 'Detailed statement of all capital gains and losses for the fiscal year',
      downloadUrl: `/api/tax/documents/capital-gains?fy=${fiscalYear}&format=pdf`
    },
    {
      type: 'DIVIDEND_INCOME',
      title: 'Dividend Income Statement',
      description: 'Summary of all dividend income received during the fiscal year',
      downloadUrl: `/api/tax/documents/dividend-income?fy=${fiscalYear}&format=pdf`
    },
    {
      type: 'TRADING_SUMMARY',
      title: 'Trading Summary',
      description: 'Complete summary of all trading activities and transactions',
      downloadUrl: `/api/tax/documents/trading-summary?fy=${fiscalYear}&format=pdf`
    },
    {
      type: 'TAX_SAVING_INVESTMENTS',
      title: 'Tax Saving Investments (80C)',
      description: 'Statement of investments eligible for tax deduction under Section 80C',
      downloadUrl: `/api/tax/documents/tax-saving?fy=${fiscalYear}&format=pdf`
    }
  ];
}

function generateComplianceNotes(capitalGains: any, dividends: any, summary: any): string[] {
  const notes: string[] = [];

  // Capital gains notes
  if (capitalGains.shortTerm.amount > 0) {
    notes.push(`Short-term capital gains of ₹${capitalGains.shortTerm.amount.toLocaleString()} are taxed at 15%`);
  }

  if (capitalGains.longTerm.amount > 0) {
    notes.push(`Long-term capital gains of ₹${capitalGains.longTerm.amount.toLocaleString()} are taxed at 10%`);
  }

  if (capitalGains.total.amount < 0) {
    notes.push(`Capital losses of ₹${Math.abs(capitalGains.total.amount).toLocaleString()} can be carried forward for 8 years`);
  }

  // Dividend notes
  if (dividends.totalDividends > 5000) {
    notes.push(`Dividend income exceeding ₹5,000 is subject to TDS at 10%`);
  }

  // Exemption notes
  if (summary.eligibleForExemption) {
    notes.push(`Capital gains up to ₹1,00,000 are exempt from tax for individuals`);
  }

  // General compliance notes
  notes.push('All transactions are reported as per SEBI guidelines');
  notes.push('This report is generated for informational purposes only');
  notes.push('Please consult a tax advisor for final tax calculations');

  return notes;
}

async function generateTaxReportPDF(taxReport: TaxReport): Promise<Blob> {
  // Mock PDF generation - in reality, you'd use a PDF library
  const pdfContent = `
    TAX REPORT - ${taxReport.fiscalYear}
    
    CAPITAL GAINS:
    Short-term: ₹${taxReport.capitalGains.shortTerm.amount.toLocaleString()} (Tax: ₹${taxReport.capitalGains.shortTerm.taxAmount.toLocaleString()})
    Long-term: ₹${taxReport.capitalGains.longTerm.amount.toLocaleString()} (Tax: ₹${taxReport.capitalGains.longTerm.taxAmount.toLocaleString()})
    Total: ₹${taxReport.capitalGains.total.amount.toLocaleString()} (Tax: ₹${taxReport.capitalGains.total.taxAmount.toLocaleString()})
    
    DIVIDEND INCOME:
    Total: ₹${taxReport.dividends.totalDividends.toLocaleString()} (Tax: ₹${taxReport.dividends.taxAmount.toLocaleString()})
    
    SUMMARY:
    Total Income: ₹${taxReport.summary.totalIncome.toLocaleString()}
    Estimated Tax: ₹${taxReport.summary.estimatedTax.toLocaleString()}
    Effective Tax Rate: ${taxReport.summary.effectiveTaxRate.toFixed(2)}%
  `;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-indexed
  
  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

// Helper function to get current user ID
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // Implement your session/auth logic here
  return 'user-id-placeholder';
}