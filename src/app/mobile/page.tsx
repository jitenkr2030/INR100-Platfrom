'use client';

import React, { useEffect } from 'react';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import { usePWA } from '@/hooks/usePWA';

export default function MobileExperiencePage() {
  const { 
    isOnline, 
    isInstallable, 
    isInstalled, 
    serviceWorkerRegistered,
    updateAvailable,
    installApp,
    updateApp
  } = usePWA();

  useEffect(() => {
    // Register service worker on mount
    if ('serviceWorker' in navigator && !serviceWorkerRegistered) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, [serviceWorkerRegistered]);

  // Show install prompt for PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // You can show a custom install banner here
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <MobileDashboard />
      
      {/* PWA Update Banner */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span>New version available!</span>
            <button
              onClick={updateApp}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}