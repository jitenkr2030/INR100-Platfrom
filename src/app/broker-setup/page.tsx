'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Users, 
  Clock, 
  ArrowRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { brokerIntegrationService } from '@/lib/broker-integration';
import Link from 'next/link';

interface Broker {
  id: string;
  name: string;
  logo: string;
  features: string[];
  commission: string;
  minAmount: number;
}

interface AccountInfo {
  brokerName: string;
  accountNumber: string;
  tradingAccess: boolean;
  marginAvailable: number;
  lastUpdated: string;
}

const BrokerSetupPage = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [activeTab, setActiveTab] = useState('setup');

  useEffect(() => {
    loadAvailableBrokers();
    loadCurrentSetup();
  }, []);

  const loadAvailableBrokers = async () => {
    try {
      const availableBrokers = brokerIntegrationService.getAvailableBrokers();
      setBrokers(availableBrokers);
    } catch (error) {
      console.error('Error loading brokers:', error);
    }
  };

  const loadCurrentSetup = async () => {
    try {
      const activeBroker = brokerIntegrationService.getActiveBroker();
      if (activeBroker) {
        setSelectedBroker(activeBroker.name.toLowerCase());
        
        // Load account information
        const accountResult = await brokerIntegrationService.getAccountInfo();
        if (accountResult.success && accountResult.account) {
          setAccountInfo(accountResult.account);
        }
      }
    } catch (error) {
      console.error('Error loading current setup:', error);
    }
  };

  const handleBrokerSelect = async (brokerId: string) => {
    setIsLoading(true);
    
    try {
      const result = await brokerIntegrationService.initializeBroker(brokerId);
      
      if (result.success) {
        setSelectedBroker(brokerId);
        alert(`You have selected ${result.broker?.name} as your trading partner. You will be redirected to authorize your account.`);
        await startAuthorization();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to select broker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startAuthorization = async () => {
    try {
      const authResult = await brokerIntegrationService.startAuthentication();
      
      if (authResult.success) {
        alert('You will be redirected to your broker\'s authorization page. Please complete the authentication process.');
        setActiveTab('authorization');
      } else {
        alert(`Error: ${authResult.error}`);
      }
    } catch (error) {
      alert('Failed to start authorization process.');
    }
  };

  const completeAuthorization = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be called with the authorization code from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (authCode && state) {
        const accountResult = await brokerIntegrationService.handleAuthCallback(authCode, state);
        
        if (accountResult.success && accountResult.accountInfo) {
          setAccountInfo(accountResult.accountInfo);
          alert('Setup Complete! Your broker account has been successfully linked. You can now start investing with real money.');
          setActiveTab('complete');
        } else {
          alert('Authorization Failed: Please try the authorization process again.');
        }
      } else {
        // Simulate successful authorization for demo
        const accountResult = await brokerIntegrationService.getAccountInfo();
        if (accountResult.success && accountResult.account) {
          setAccountInfo(accountResult.account);
          alert('Setup Complete! Your broker account has been successfully linked. You can now start investing with real money.');
          setActiveTab('complete');
        }
      }
    } catch (error) {
      alert('Failed to complete authorization.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect your broker account? You will need to re-authorize to continue trading.')) {
      disconnectBroker();
    }
  };

  const disconnectBroker = async () => {
    try {
      // Clear broker selection
      setSelectedBroker(null);
      setAccountInfo(null);
      localStorage.removeItem('preferred_broker');
      document.cookie = 'broker_tokens=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      alert('Your broker account has been disconnected. You can connect a different broker anytime from settings.');
    } catch (error) {
      alert('Failed to disconnect broker.');
    }
  };

  const renderCurrentSetup = () => {
    if (!accountInfo && !selectedBroker) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Current Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">{accountInfo.brokerName}</h3>
                    <p className="text-sm text-gray-600">Account: {accountInfo.accountNumber}</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Available Cash</p>
                  <p className="font-semibold text-lg">₹{accountInfo.marginAvailable.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={accountInfo.tradingAccess ? "default" : "secondary"}>
                    {accountInfo.tradingAccess ? 'Active' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm">{new Date(accountInfo.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Authorization Pending</h3>
              <p className="text-gray-600 mb-4">
                Please complete the broker authorization to start trading
              </p>
              <Button onClick={startAuthorization}>
                Resume Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderBrokerCard = (broker: Broker) => (
    <Card 
      key={broker.id} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedBroker === broker.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => !isLoading && handleBrokerSelect(broker.id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{broker.name}</CardTitle>
              <CardDescription>{broker.commission}</CardDescription>
            </div>
          </div>
          {selectedBroker === broker.id && (
            <CheckCircle className="h-6 w-6 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {broker.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Min. Investment: ₹{broker.minAmount}
            </span>
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Broker Setup</h1>
        <p className="text-gray-600">
          Connect your broker account to start investing with real money
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="authorization">Authorization</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {renderCurrentSetup()}
          
          {!selectedBroker && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Broker</CardTitle>
                  <CardDescription>
                    Select from our trusted broker partners to start your investment journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brokers.map(renderBrokerCard)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why Partner with Us?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">SEBI Registered Brokers</h4>
                        <p className="text-sm text-gray-600">Full regulatory compliance and security</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">AI-Powered Fractional Investing</h4>
                        <p className="text-sm text-gray-600">Start with small amounts as low as ₹100</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Transparent Commission</h4>
                        <p className="text-sm text-gray-600">₹20 per order with no hidden charges</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Dedicated Support</h4>
                        <p className="text-sm text-gray-600">24/7 customer support and assistance</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="authorization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Authorization</CardTitle>
              <CardDescription>
                Finish connecting your broker account to start trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You will be redirected to your broker's authorization page. Please complete the authentication process and return here.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button onClick={startAuthorization}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Start Authorization
                </Button>
                <Button 
                  variant="outline" 
                  onClick={completeAuthorization}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'I\'ve Completed Authorization'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complete" className="space-y-6">
          {accountInfo ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Setup Complete!
                </CardTitle>
                <CardDescription>
                  Your broker account has been successfully linked
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can now start investing with real money through your {accountInfo.brokerName} account.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-4">
                  <Link href="/real-trading">
                    <Button>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Start Real Trading
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Authorization Required</h3>
                <p className="text-gray-600 mb-4">
                  Please complete the broker authorization process first.
                </p>
                <Button onClick={() => setActiveTab('setup')}>
                  Go to Setup
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerSetupPage;