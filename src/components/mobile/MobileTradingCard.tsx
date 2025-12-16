'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface MobileTradingCardProps {
  asset: {
    id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    type: string;
  };
  onTrade?: (data: any) => void;
  className?: string;
}

export const MobileTradingCard: React.FC<MobileTradingCardProps> = ({
  asset,
  onTrade,
  className = ''
}) => {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<string>('');
  const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [price, setPrice] = useState<string>('');

  const { isOnline } = usePWA();
  const { addOfflineData } = useOfflineSync();

  const handleQuickTrade = (tradeQuantity: number) => {
    const tradeData = {
      type: 'order',
      action: 'create',
      data: {
        assetId: asset.id,
        orderType: orderMode,
        orderSide: orderType,
        quantity: tradeQuantity,
        price: orderMode === 'LIMIT' ? parseFloat(price) : asset.currentPrice,
        totalAmount: tradeQuantity * (orderMode === 'LIMIT' ? parseFloat(price) : asset.currentPrice)
      }
    };

    if (isOnline) {
      onTrade?.(tradeData);
    } else {
      // Add to offline queue
      addOfflineData(tradeData);
      // Show offline notification
      alert('Trade queued for sync when online');
    }
  };

  const handleCustomTrade = () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (orderMode === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      alert('Please enter a valid price for limit orders');
      return;
    }

    handleQuickTrade(qty);
  };

  const isPositive = asset.change >= 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{asset.symbol}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-600">{asset.name}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">₹{asset.currentPrice.toLocaleString()}</p>
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{asset.change.toFixed(2)} ({isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <Badge variant="outline">{asset.type}</Badge>
        </div>

        {/* Order Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={orderType === 'BUY' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setOrderType('BUY')}
          >
            Buy
          </Button>
          <Button
            variant={orderType === 'SELL' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setOrderType('SELL')}
          >
            Sell
          </Button>
        </div>

        {/* Order Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={orderMode === 'MARKET' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setOrderMode('MARKET')}
          >
            Market
          </Button>
          <Button
            variant={orderMode === 'LIMIT' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setOrderMode('LIMIT')}
          >
            Limit
          </Button>
        </div>

        {/* Price Input for Limit Orders */}
        {orderMode === 'LIMIT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit Price (₹)
            </label>
            <Input
              type="number"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Quick Quantity Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 10, 50, 100].map((qty) => (
            <Button
              key={qty}
              variant="outline"
              size="sm"
              onClick={() => setQuantity(qty.toString())}
              className="text-xs"
            >
              {qty}
            </Button>
          ))}
        </div>

        {/* Quick Trade Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 10, 50].map((qty) => (
            <Button
              key={qty}
              size="sm"
              variant={orderType === 'BUY' ? 'default' : 'destructive'}
              onClick={() => handleQuickTrade(qty)}
              className="flex items-center space-x-1"
            >
              {orderType === 'BUY' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span>{qty}</span>
            </Button>
          ))}
        </div>

        {/* Custom Trade Button */}
        <Button
          onClick={handleCustomTrade}
          className="w-full"
          variant={orderType === 'BUY' ? 'default' : 'destructive'}
          disabled={!quantity || (orderMode === 'LIMIT' && !price)}
        >
          {orderType === 'BUY' ? 'Buy' : 'Sell'} {quantity || '0'} {asset.symbol}
        </Button>

        {/* Total Amount Display */}
        {quantity && (
          <div className="text-center text-sm text-gray-600">
            Total: ₹{(
              parseFloat(quantity || '0') * 
              (orderMode === 'LIMIT' ? parseFloat(price || '0') : asset.currentPrice)
            ).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileTradingCard;