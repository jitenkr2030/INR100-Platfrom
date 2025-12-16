'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  Bell,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import MobileTradingCard from './MobileTradingCard';
import CameraCapture from './CameraCapture';
import MobileNavigation from './MobileNavigation';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  type: string;
}

interface MobileDashboardProps {
  className?: string;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    isOnline, 
    isInstallable, 
    isInstalled, 
    serviceWorkerRegistered,
    updateAvailable,
    installApp,
    updateApp,
    clearCache
  } = usePWA();

  const { 
    isOnline: offlineIsOnline, 
    pendingSync, 
    lastSyncAt,
    syncData 
  } = useOfflineSync();

  // Mock portfolio data
  const portfolioData = {
    totalValue: 125000,
    dayChange: 2500,
    dayChangePercent: 2.04,
    cashBalance: 15000
  };

  // Mock assets data
  useEffect(() => {
    const mockAssets: Asset[] = [
      {
        id: '1',
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        currentPrice: 2850.75,
        change: 45.30,
        changePercent: 1.61,
        type: 'STOCK'
      },
      {
        id: '2',
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        currentPrice: 3920.40,
        change: -28.60,
        changePercent: -0.72,
        type: 'STOCK'
      },
      {
        id: '3',
        symbol: 'HDFCBANK',
        name: 'HDFC Bank',
        currentPrice: 1675.20,
        change: 12.85,
        changePercent: 0.77,
        type: 'STOCK'
      }
    ];
    setAssets(mockAssets);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const handleTrade = (tradeData: any) => {
    console.log('Trade executed:', tradeData);
    // In a real app, this would call your trading API
  };

  const handleDocumentCapture = (imageBlob: Blob, fileName: string) => {
    console.log('Document captured:', fileName);
    // In a real app, this would upload the document
  };

  const renderHomePage = () => (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Portfolio</CardTitle>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">
                {showBalance ? `₹${portfolioData.totalValue.toLocaleString()}` : '₹••••••'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's P&L</p>
                <div className="flex items-center space-x-1">
                  {portfolioData.dayChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {portfolioData.dayChange >= 0 ? '+' : ''}₹{portfolioData.dayChange.toLocaleString()} 
                    ({portfolioData.dayChangePercent >= 0 ? '+' : ''}{portfolioData.dayChangePercent}%)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Cash</p>
                <p className="font-medium">₹{portfolioData.cashBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20"
              onClick={() => setCurrentPage('trading')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Trade</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20"
              onClick={() => setCurrentPage('kyc')}
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm">KYC</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center space-y-2 h-20"
              onClick={() => setCurrentPage('wallet')}
            >
              <Wallet className="h-6 w-6" />
              <span className="text-sm">Wallet</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Market Overview</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assets.slice(0, 3).map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{asset.symbol}</p>
                  <p className="text-sm text-gray-600">₹{asset.currentPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    {asset.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      asset.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.change >= 0 ? '+' : ''}{asset.changePercent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTradingPage = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quick Trade</h2>
        <Badge variant={isOnline ? "default" : "destructive"}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>
      
      {assets.map((asset) => (
        <MobileTradingCard
          key={asset.id}
          asset={asset}
          onTrade={handleTrade}
        />
      ))}
    </div>
  );

  const renderKYCPage = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Document Upload</h2>
      
      <CameraCapture
        documentType="PAN_CARD"
        onCapture={handleDocumentCapture}
      />
      
      <CameraCapture
        documentType="AADHAAR_FRONT"
        onCapture={handleDocumentCapture}
      />
      
      <CameraCapture
        documentType="AADHAAR_BACK"
        onCapture={handleDocumentCapture}
      />
      
      <CameraCapture
        documentType="SELFIE"
        onCapture={handleDocumentCapture}
      />
    </div>
  );

  const renderSettingsPage = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      
      {/* PWA Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">App Installation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstallable && !isInstalled && (
            <Button onClick={installApp} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
          
          {updateAvailable && (
            <Button onClick={updateApp} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Available
            </Button>
          )}
          
          <Button 
            onClick={clearCache} 
            variant="outline" 
            className="w-full"
          >
            Clear Cache
          </Button>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>Installed: {isInstalled ? 'Yes' : 'No'}</p>
            <p>Service Worker: {serviceWorkerRegistered ? 'Active' : 'Inactive'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Offline Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Offline Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <Badge variant={offlineIsOnline ? "default" : "destructive"}>
              {offlineIsOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Pending Sync</span>
            <Badge variant="outline">{pendingSync} items</Badge>
          </div>
          
          {lastSyncAt && (
            <div className="flex items-center justify-between">
              <span>Last Sync</span>
              <span className="text-sm text-gray-600">
                {lastSyncAt.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {offlineIsOnline && pendingSync > 0 && (
            <Button onClick={syncData} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'trading':
        return renderTradingPage();
      case 'kyc':
        return renderKYCPage();
      case 'settings':
        return renderSettingsPage();
      default:
        return renderHomePage();
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">INR100</h1>
          <div className="flex items-center space-x-2">
            {pendingSync > 0 && (
              <Badge variant="outline">
                <Bell className="h-3 w-3 mr-1" />
                {pendingSync}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {renderCurrentPage()}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default MobileDashboard;