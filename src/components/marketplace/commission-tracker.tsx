"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface CommissionData {
  id: string;
  type: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED';
  createdAt: Date;
  description: string;
  percentage: number;
}

interface PayoutData {
  id: string;
  amount: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  payoutMethod: string;
  processedAt: Date;
}

export function CommissionTracker() {
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    totalPayouts: 0
  });

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/commissions', {
        headers: { 'x-user-id': 'user-123' }
      });

      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setPayouts(data.payouts?.payouts || []);
        setSummary({
          totalCommissions: data.summary?.totalCommissions || 0,
          paidCommissions: data.summary?.paidCommissions || 0,
          pendingCommissions: data.summary?.pendingCommissions || 0,
          totalPayouts: data.payouts?.totalAmount || 0
        });
      }
    } catch (error) {
      console.error('Failed to load commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    try {
      const amount = prompt('Enter payout amount (minimum ₹1,000):');
      if (!amount || parseFloat(amount) < 1000) {
        alert('Minimum payout amount is ₹1,000');
        return;
      }

      const response = await fetch('/api/marketplace/commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123'
        },
        body: JSON.stringify({
          action: 'payout',
          expertId: 'user-123',
          payoutAmount: parseFloat(amount),
          payoutMethod: 'bank_transfer'
        })
      });

      if (response.ok) {
        alert('Payout request submitted successfully!');
        loadCommissionData();
      } else {
        const error = await response.json();
        alert(error?.error || 'Payout request failed');
      }
    } catch (error) {
      console.error('Payout request error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'REVERSED':
        return 'bg-red-100 text-red-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />;
      case 'FAILED':
      case 'REVERSED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading commission data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-xl font-bold">{formatCurrency(summary.paidCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{formatCurrency(summary.pendingCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalPayouts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>
          <Button onClick={handlePayoutRequest} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Track all your earnings from the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No commissions yet</p>
                  <p className="text-sm">Start selling your expertise to earn commissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getStatusColor(commission.status)}`}>
                          {getStatusIcon(commission.status)}
                        </div>
                        <div>
                          <p className="font-medium">{commission.type.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-600">{commission.description}</p>
                          <p className="text-xs text-gray-500">
                            {commission.createdAt.toLocaleDateString()} • {commission.percentage}% commission
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(commission.amount)}</p>
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Track your payout requests and status</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payouts yet</p>
                  <p className="text-sm">Request a payout to receive your earnings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getStatusColor(payout.status)}`}>
                          {getStatusIcon(payout.status)}
                        </div>
                        <div>
                          <p className="font-medium">{payout.payoutMethod.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-600">
                            Processed: {payout.processedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(payout.amount)}</p>
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}