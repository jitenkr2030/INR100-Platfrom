'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Percent,
  Receipt,
  Shield
} from 'lucide-react';

interface TaxReportSectionProps {
  className?: string;
}

export const TaxReportSection: React.FC<TaxReportSectionProps> = ({
  className = ''
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2024-25');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock tax data
  const taxData = {
    '2024-25': {
      capitalGains: {
        shortTerm: { amount: 15000, taxRate: 15, taxAmount: 2250 },
        longTerm: { amount: 35000, taxRate: 10, taxAmount: 3500 },
        total: { amount: 50000, taxAmount: 5750 }
      },
      dividends: {
        totalDividends: 8000,
        taxRate: 10,
        taxAmount: 800
      },
      summary: {
        totalCapitalGains: 50000,
        totalDividends: 8000,
        totalIncome: 58000,
        estimatedTax: 6550,
        effectiveTaxRate: 11.3,
        eligibleForExemption: false,
        exemptionAmount: 0
      },
      transactions: [
        { date: '2024-04-15', symbol: 'RELIANCE', type: 'BUY', quantity: 100, price: 2500, amount: 250000 },
        { date: '2024-06-20', symbol: 'RELIANCE', type: 'SELL', quantity: 50, price: 2750, amount: 137500, gainLoss: 12500 },
        { date: '2024-08-10', symbol: 'TCS', type: 'BUY', quantity: 50, price: 3800, amount: 190000 },
        { date: '2024-10-15', symbol: 'TCS', type: 'SELL', quantity: 25, price: 4100, amount: 102500, gainLoss: 7500 }
      ],
      documents: [
        { type: 'CAPITAL_GAINS_STATEMENT', title: 'Capital Gains Statement', status: 'ready' },
        { type: 'DIVIDEND_INCOME', title: 'Dividend Income Statement', status: 'ready' },
        { type: 'TRADING_SUMMARY', title: 'Trading Summary', status: 'ready' },
        { type: 'TAX_SAVING_INVESTMENTS', title: 'Tax Saving Investments (80C)', status: 'ready' }
      ]
    },
    '2023-24': {
      capitalGains: {
        shortTerm: { amount: -5000, taxRate: 15, taxAmount: 0 },
        longTerm: { amount: 25000, taxRate: 10, taxAmount: 2500 },
        total: { amount: 20000, taxAmount: 2500 }
      },
      dividends: {
        totalDividends: 6000,
        taxRate: 10,
        taxAmount: 100
      },
      summary: {
        totalCapitalGains: 20000,
        totalDividends: 6000,
        totalIncome: 26000,
        estimatedTax: 2600,
        effectiveTaxRate: 10.0,
        eligibleForExemption: true,
        exemptionAmount: 80000
      },
      transactions: [],
      documents: []
    }
  };

  const currentData = taxData[selectedFiscalYear as keyof typeof taxData] || taxData['2024-25'];

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/analytics/tax-report?fiscalYear=${selectedFiscalYear}&format=${format}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${selectedFiscalYear}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to generate tax report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDocument = async (docType: string) => {
    try {
      const response = await fetch(`/api/tax/documents/${docType.toLowerCase()}?fy=${selectedFiscalYear}&format=pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docType}-${selectedFiscalYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default">Ready</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tax Reporting & Compliance</h2>
          <p className="text-gray-600">Generate tax reports and compliance documents</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedFiscalYear} 
            onChange={(e) => setSelectedFiscalYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024-25">FY 2024-25</option>
            <option value="2023-24">FY 2023-24</option>
            <option value="2022-23">FY 2022-23</option>
          </select>
          
          <Button 
            onClick={() => handleGenerateReport('pdf')}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => handleGenerateReport('excel')}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Tax Summary</TabsTrigger>
          <TabsTrigger value="capital-gains">Capital Gains</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Tax Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Capital Gains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{currentData.summary.totalCapitalGains.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {currentData.summary.totalCapitalGains >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  <span className={currentData.summary.totalCapitalGains >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Taxable Amount
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dividend Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{currentData.dividends.totalDividends.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  TDS: ₹{currentData.dividends.taxAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tax Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{currentData.summary.estimatedTax.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Effective Rate: {currentData.summary.effectiveTaxRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tax Exemption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{currentData.summary.exemptionAmount?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentData.summary.eligibleForExemption ? 'Available' : 'Not Applicable'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Calculation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Tax Calculation Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Short-term Capital Gains</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gains:</span>
                        <span>₹{currentData.capitalGains.shortTerm.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Rate:</span>
                        <span>{currentData.capitalGains.shortTerm.taxRate}%</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Tax:</span>
                        <span>₹{currentData.capitalGains.shortTerm.taxAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Long-term Capital Gains</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gains:</span>
                        <span>₹{currentData.capitalGains.longTerm.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Rate:</span>
                        <span>{currentData.capitalGains.longTerm.taxRate}%</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Tax:</span>
                        <span>₹{currentData.capitalGains.longTerm.taxAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Dividend Income</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Income:</span>
                        <span>₹{currentData.dividends.totalDividends.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TDS Rate:</span>
                        <span>{currentData.dividends.taxRate}%</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>TDS:</span>
                        <span>₹{currentData.dividends.taxAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Tax Liability:</span>
                    <span className="text-red-600">₹{currentData.summary.estimatedTax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capital Gains Tab */}
        <TabsContent value="capital-gains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capital Gains Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-right p-2">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.transactions.map((transaction, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{transaction.date}</td>
                        <td className="p-2 font-medium">{transaction.symbol}</td>
                        <td className="p-2">
                          <Badge variant={transaction.type === 'BUY' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{transaction.quantity}</td>
                        <td className="p-2 text-right">₹{transaction.price.toLocaleString()}</td>
                        <td className="p-2 text-right">₹{transaction.amount.toLocaleString()}</td>
                        <td className={`p-2 text-right ${transaction.gainLoss && transaction.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.gainLoss ? `₹${transaction.gainLoss.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Tax Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-gray-600">{doc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getComplianceBadge(doc.status)}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadDocument(doc.type)}
                        disabled={doc.status !== 'ready'}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Compliance Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">All transactions reported to income tax department</p>
                    <p className="text-sm text-gray-600">As per SEBI guidelines</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Tax documents ready for filing</p>
                    <p className="text-sm text-gray-600">All required documents generated</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Reminder: File ITR before due date</p>
                    <p className="text-sm text-gray-600">Due date for FY 2024-25: July 31, 2025</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Important Notes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• This report is generated for informational purposes only</li>
                    <li>• Please consult a tax advisor for final tax calculations</li>
                    <li>• Keep all transaction records for audit purposes</li>
                    <li>• Report all income sources in your ITR filing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxReportSection;