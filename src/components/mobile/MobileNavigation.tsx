'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
  TrendingUp,
  BookOpen,
  Users,
  User,
  Bell,
  Search,
  Menu,
  X,
  Fingerprint,
  Shield
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface MobileNavigationProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage = 'home',
  onPageChange,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { isOnline, pushNotificationsEnabled } = usePWA();
  const { pendingSync } = useOfflineSync();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: TrendingUp
    },
    {
      id: 'learn',
      label: 'Learn',
      icon: BookOpen
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      requiresAuth: true
    }
  ];

  // Check for biometric authentication support
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if ('credentials' in navigator) {
        try {
          const isSupported = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricSupported(isSupported);
        } catch (error) {
          console.log('Biometric authentication not supported');
        }
      }
    };

    checkBiometricSupport();
  }, []);

  // Simulate notifications count (in real app, this would come from your notification system)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random notification updates
      setNotifications(Math.floor(Math.random() * 5));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleBiometricAuth = async () => {
    if (!biometricSupported) {
      alert('Biometric authentication not supported on this device');
      return;
    }

    try {
      // This is a placeholder for WebAuthn/biometric authentication
      // In a real implementation, you would:
      // 1. Get authentication options from your server
      // 2. Use navigator.credentials.create() or navigator.credentials.get()
      // 3. Verify the response with your server
      
      const authOptions = {
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5]),
          timeout: 60000,
          userVerification: 'required'
        }
      };

      // Simulate successful authentication
      setIsAuthenticated(true);
      alert('Biometric authentication successful!');
      
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const handleNavClick = (itemId: string) => {
    onPageChange?.(itemId);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Main Mobile Navigation Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        <div className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around items-center">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {item.id === 'profile' && notifications > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {notifications}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
            
            {/* Menu Toggle */}
            <button
              onClick={toggleMenu}
              className="flex flex-col items-center space-y-1 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="text-xs font-medium">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Extended Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMenu}>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Menu</h2>
                <Button variant="ghost" size="sm" onClick={toggleMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Status Indicators */}
              <div className="flex space-x-2 mb-6">
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
                {pushNotificationsEnabled && (
                  <Badge variant="outline">
                    <Bell className="h-3 w-3 mr-1" />
                    Notifications
                  </Badge>
                )}
                {pendingSync > 0 && (
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    {pendingSync} pending
                  </Badge>
                )}
              </div>

              {/* Biometric Authentication */}
              {biometricSupported && !isAuthenticated && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Secure Authentication</h3>
                      <p className="text-sm text-gray-600">
                        Enable biometric login for enhanced security
                      </p>
                    </div>
                    <Button
                      onClick={handleBiometricAuth}
                      size="sm"
                      variant="outline"
                    >
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Setup
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.id === 'profile' && notifications > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {notifications}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Additional Menu Items */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-50 text-gray-700">
                  <Search className="h-5 w-5" />
                  <span className="font-medium">Search</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-50 text-gray-700">
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notifications</span>
                  {notifications > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {notifications}
                    </Badge>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;