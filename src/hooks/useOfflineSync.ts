'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  id: string;
  type: 'portfolio' | 'order' | 'transaction' | 'watchlist' | 'learning-progress';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  synced: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  pendingSync: number;
  lastSyncAt: Date | null;
  isSyncing: boolean;
}

interface UseOfflineSyncReturn extends SyncStatus {
  addOfflineData: (data: Omit<OfflineData, 'id' | 'timestamp' | 'synced'>) => void;
  syncData: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getOfflineData: () => OfflineData[];
}

const OFFLINE_STORAGE_KEY = 'inr100-offline-data';

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingSync: 0,
    lastSyncAt: null,
    isSyncing: false
  });

  // Load offline data from localStorage on mount
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const dataWithDates = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setOfflineData(dataWithDates);
          setSyncStatus(prev => ({
            ...prev,
            pendingSync: dataWithDates.filter((item: OfflineData) => !item.synced).length
          }));
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadOfflineData();

    // Listen for online/offline events
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      syncData();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save offline data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineData));
      setSyncStatus(prev => ({
        ...prev,
        pendingSync: offlineData.filter(item => !item.synced).length
      }));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, [offlineData]);

  // Generate unique ID for offline data
  const generateId = useCallback(() => {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new offline data
  const addOfflineData = useCallback((data: Omit<OfflineData, 'id' | 'timestamp' | 'synced'>) => {
    const newData: OfflineData = {
      ...data,
      id: generateId(),
      timestamp: new Date(),
      synced: false
    };

    setOfflineData(prev => [...prev, newData]);
  }, [generateId]);

  // Sync data with server
  const syncData = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) {
      return;
    }

    const unsyncedData = offlineData.filter(item => !item.synced);
    if (unsyncedData.length === 0) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const syncPromises = unsyncedData.map(async (item) => {
        try {
          await fetch('/api/offline/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          });

          return { id: item.id, success: true };
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          return { id: item.id, success: false };
        }
      });

      const results = await Promise.all(syncPromises);
      
      // Update sync status for successful syncs
      setOfflineData(prev => 
        prev.map(item => {
          const result = results.find(r => r.id === item.id);
          return result && result.success 
            ? { ...item, synced: true }
            : item;
        })
      );

      setSyncStatus(prev => ({
        ...prev,
        lastSyncAt: new Date(),
        isSyncing: false
      }));

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [offlineData, syncStatus.isOnline, syncStatus.isSyncing]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await fetch('/api/offline/clear', {
        method: 'DELETE',
      });

      setOfflineData([]);
      setSyncStatus(prev => ({
        ...prev,
        pendingSync: 0,
        lastSyncAt: new Date()
      }));

      localStorage.removeItem(OFFLINE_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, []);

  // Get all offline data
  const getOfflineData = useCallback(() => {
    return offlineData;
  }, [offlineData]);

  return {
    ...syncStatus,
    addOfflineData,
    syncData,
    clearOfflineData,
    getOfflineData
  };
};

export default useOfflineSync;