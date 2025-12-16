/**
 * Offline Storage Service for INR100 Mobile App
 * Handles offline data storage, caching, and synchronization
 */

import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIService } from './APIService';

class OfflineStorageService {
  static instance = null;
  static mmkv = new MMKV();

  static getInstance() {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  // Cache Management
  async cacheData(key, data, expiryMinutes = 60) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: expiryMinutes * 60 * 1000, // Convert to milliseconds
      };

      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      OfflineStorageService.mmkv.set(`cache_${key}`, JSON.stringify(cacheData));
      
      console.log(`✅ Data cached: ${key}`);
    } catch (error) {
      console.error('Cache data error:', error);
    }
  }

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      
      if (!cached) {
        // Try MMKV as fallback
        const mmkvData = OfflineStorageService.mmkv.getString(`cache_${key}`);
        if (mmkvData) {
          const parsed = JSON.parse(mmkvData);
          return this.isCacheValid(parsed) ? parsed.data : null;
        }
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      if (this.isCacheValid(cacheData)) {
        return cacheData.data;
      } else {
        // Remove expired cache
        await this.removeCachedData(key);
        return null;
      }
    } catch (error) {
      console.error('Get cached data error:', error);
      return null;
    }
  }

  isCacheValid(cacheData) {
    const now = Date.now();
    return cacheData.timestamp + cacheData.expiry > now;
  }

  async removeCachedData(key) {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      OfflineStorageService.mmkv.delete(`cache_${key}`);
    } catch (error) {
      console.error('Remove cached data error:', error);
    }
  }

  async clearExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const cacheData = JSON.parse(data);
          if (!this.isCacheValid(cacheData)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
      
      console.log('✅ Expired cache cleared');
    } catch (error) {
      console.error('Clear expired cache error:', error);
    }
  }

  // Portfolio Data Caching
  async cachePortfolio(portfolioData) {
    await this.cacheData('portfolio', portfolioData, 30); // 30 minutes cache
  }

  async getCachedPortfolio() {
    return await this.getCachedData('portfolio');
  }

  async cacheMarketData(marketData) {
    await this.cacheData('market_data', marketData, 5); // 5 minutes cache for market data
  }

  async getCachedMarketData() {
    return await this.getCachedData('market_data');
  }

  // Offline Queue Management
  async addToOfflineQueue(action) {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        ...action,
        id: Date.now().toString(),
        timestamp: Date.now(),
        retries: 0,
      });
      
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
      console.log('✅ Action added to offline queue:', action.type);
      
      return true;
    } catch (error) {
      console.error('Add to offline queue error:', error);
      return false;
    }
  }

  async getOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Get offline queue error:', error);
      return [];
    }
  }

  async removeFromOfflineQueue(actionId) {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter(item => item.id !== actionId);
      await AsyncStorage.setItem('offline_queue', JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Remove from offline queue error:', error);
    }
  }

  async processOfflineQueue() {
    try {
      const queue = await this.getOfflineQueue();
      const apiService = APIService.getInstance();
      const processed = [];

      for (const action of queue) {
        try {
          let result;
          
          switch (action.type) {
            case 'PLACE_ORDER':
              result = await apiService.placeOrder(action.data);
              break;
            case 'CANCEL_ORDER':
              result = await apiService.cancelOrder(action.data.orderId);
              break;
            case 'ADD_MONEY':
              result = await apiService.addMoney(action.data.amount, action.data.paymentMethod);
              break;
            case 'UPDATE_PROFILE':
              result = await apiService.updateProfile(action.data);
              break;
            case 'CREATE_POST':
              result = await apiService.createSocialPost(action.data.content, action.data.images);
              break;
            default:
              console.warn('Unknown offline action type:', action.type);
              continue;
          }

          if (result.success) {
            processed.push(action.id);
            console.log('✅ Offline action processed:', action.type);
          } else {
            // Increment retry count
            action.retries++;
            if (action.retries >= 3) {
              processed.push(action.id);
              console.log('❌ Offline action failed after max retries:', action.type);
            }
          }
        } catch (error) {
          console.error('Process offline action error:', error);
          action.retries++;
          if (action.retries >= 3) {
            processed.push(action.id);
          }
        }
      }

      // Remove processed actions
      for (const id of processed) {
        await this.removeFromOfflineQueue(id);
      }

      return {
        success: true,
        processed: processed.length,
        remaining: queue.length - processed.length,
      };
    } catch (error) {
      console.error('Process offline queue error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync Management
  async syncWhenOnline() {
    try {
      const isOnline = await this.checkNetworkStatus();
      
      if (!isOnline) {
        console.log('📱 Device offline, skipping sync');
        return { success: false, error: 'Device offline' };
      }

      console.log('🔄 Starting offline sync...');
      
      // Process offline queue
      const queueResult = await this.processOfflineQueue();
      
      // Refresh cached data
      await this.refreshCachedData();
      
      console.log('✅ Offline sync completed');
      return queueResult;
    } catch (error) {
      console.error('Sync when online error:', error);
      return { success: false, error: error.message };
    }
  }

  async refreshCachedData() {
    try {
      const apiService = APIService.getInstance();
      
      // Refresh portfolio
      const portfolioResult = await apiService.getPortfolio();
      if (portfolioResult.success) {
        await this.cachePortfolio(portfolioResult.data);
      }

      // Refresh market data
      const marketResult = await apiService.getMarketData();
      if (marketResult.success) {
        await this.cacheMarketData(marketResult.data);
      }

      console.log('✅ Cached data refreshed');
    } catch (error) {
      console.error('Refresh cached data error:', error);
    }
  }

  async checkNetworkStatus() {
    try {
      // Simple network check - in real app, use NetInfo library
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // User Preferences
  async saveUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      OfflineStorageService.mmkv.set('user_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Save user preferences error:', error);
    }
  }

  async getUserPreferences() {
    try {
      const preferences = await AsyncStorage.getItem('user_preferences');
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Get user preferences error:', error);
      return null;
    }
  }

  // Search History
  async addToSearchHistory(query, type = 'asset') {
    try {
      const history = await this.getSearchHistory();
      const newEntry = {
        query,
        type,
        timestamp: Date.now(),
      };

      // Remove duplicate entries
      const filteredHistory = history.filter(item => item.query !== query);
      
      // Add new entry at the beginning
      filteredHistory.unshift(newEntry);
      
      // Keep only last 50 entries
      const trimmedHistory = filteredHistory.slice(0, 50);
      
      await AsyncStorage.setItem('search_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Add to search history error:', error);
    }
  }

  async getSearchHistory() {
    try {
      const history = await AsyncStorage.getItem('search_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Get search history error:', error);
      return [];
    }
  }

  async clearSearchHistory() {
    try {
      await AsyncStorage.removeItem('search_history');
    } catch (error) {
      console.error('Clear search history error:', error);
    }
  }

  // Watchlist Management
  async cacheWatchlist(watchlist) {
    await this.cacheData('watchlist', watchlist, 60); // 1 hour cache
  }

  async getCachedWatchlist() {
    return await this.getCachedData('watchlist');
  }

  async saveWatchlist(watchlist) {
    try {
      await AsyncStorage.setItem('watchlist', JSON.stringify(watchlist));
      await this.cacheWatchlist(watchlist);
    } catch (error) {
      console.error('Save watchlist error:', error);
    }
  }

  async getSavedWatchlist() {
    try {
      const watchlist = await AsyncStorage.getItem('watchlist');
      return watchlist ? JSON.parse(watchlist) : [];
    } catch (error) {
      console.error('Get saved watchlist error:', error);
      return [];
    }
  }

  // Learning Progress
  async cacheLearningProgress(progress) {
    await this.cacheData('learning_progress', progress, 120); // 2 hours cache
  }

  async getCachedLearningProgress() {
    return await this.getCachedData('learning_progress');
  }

  async saveLearningProgress(progress) {
    try {
      await AsyncStorage.setItem('learning_progress', JSON.stringify(progress));
      await this.cacheLearningProgress(progress);
    } catch (error) {
      console.error('Save learning progress error:', error);
    }
  }

  async getSavedLearningProgress() {
    try {
      const progress = await AsyncStorage.getItem('learning_progress');
      return progress ? JSON.parse(progress) : {};
    } catch (error) {
      console.error('Get saved learning progress error:', error);
      return {};
    }
  }

  // Data Cleanup
  async clearAllCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      await AsyncStorage.multiRemove(cacheKeys);
      
      // Clear MMKV cache
      OfflineStorageService.mmkv.clearAll();
      
      console.log('✅ All cache cleared');
    } catch (error) {
      console.error('Clear all cache error:', error);
    }
  }

  async getStorageUsage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return {
        totalSize,
        keyCount: keys.length,
        formattedSize: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('Get storage usage error:', error);
      return { totalSize: 0, keyCount: 0, formattedSize: '0 B' };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Background Sync Setup
  setupBackgroundSync() {
    // Set up periodic background sync
    setInterval(async () => {
      const isOnline = await this.checkNetworkStatus();
      if (isOnline) {
        await this.syncWhenOnline();
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  // ========================================
  // PHASE 4: ADVANCED OFFLINE FEATURES
  // ========================================

  // Download content for offline access
  async downloadContentForOffline(contentId, contentType, metadata = {}) {
    try {
      console.log(`📥 Downloading ${contentType} for offline access: ${contentId}`);

      // Add to offline content tracking
      const offlineContent = {
        id: `offline_${contentId}_${Date.now()}`,
        contentId,
        contentType,
        title: metadata.title || 'Unknown Content',
        status: 'DOWNLOADING',
        progress: 0,
        createdAt: new Date().toISOString(),
        ...metadata
      };

      // Store offline content metadata
      await this.cacheData(`offline_content_${contentId}`, offlineContent, 24 * 60 * 24); // 24 hours expiry

      // Notify server about offline content request
      try {
        const response = await fetch('/api/mobile/offline-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            contentType,
            title: metadata.title,
            expiresIn: metadata.expiresIn || 168 // 1 week default
          }),
        });

        if (response.ok) {
          console.log('✅ Offline content registered with server');
        }
      } catch (error) {
        console.warn('⚠️ Failed to register offline content with server:', error);
      }

      // Simulate download progress (in real app, this would be actual file download)
      this.simulateDownloadProgress(contentId);

      return offlineContent;
    } catch (error) {
      console.error('❌ Error downloading content for offline:', error);
      throw error;
    }
  }

  // Simulate download progress (placeholder for real implementation)
  async simulateDownloadProgress(contentId) {
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark as completed
        await this.markOfflineContentAsCompleted(contentId);
      } else {
        // Update progress
        const offlineContent = await this.getOfflineContent(contentId);
        if (offlineContent) {
          offlineContent.progress = progress;
          offlineContent.status = 'DOWNLOADING';
          await this.cacheData(`offline_content_${contentId}`, offlineContent, 24 * 60 * 24);
        }
      }
    }, 1000);
  }

  // Mark offline content as completed
  async markOfflineContentAsCompleted(contentId) {
    try {
      const offlineContent = await this.getOfflineContent(contentId);
      if (offlineContent) {
        offlineContent.status = 'COMPLETED';
        offlineContent.progress = 100;
        offlineContent.downloadedAt = new Date().toISOString();
        
        await this.cacheData(`offline_content_${contentId}`, offlineContent, 24 * 60 * 24);
        
        // Update server
        try {
          await fetch(`/api/mobile/offline-content/${offlineContent.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              downloadStatus: 'COMPLETED',
              syncStatus: 'SYNCED'
            }),
          });
        } catch (error) {
          console.warn('⚠️ Failed to update server about offline completion:', error);
        }
        
        console.log('✅ Offline content download completed:', contentId);
      }
    } catch (error) {
      console.error('❌ Error marking offline content as completed:', error);
    }
  }

  // Get offline content
  async getOfflineContent(contentId) {
    try {
      const offlineContent = await this.getCachedData(`offline_content_${contentId}`);
      return offlineContent;
    } catch (error) {
      console.error('❌ Error getting offline content:', error);
      return null;
    }
  }

  // Get all offline content
  async getAllOfflineContent() {
    try {
      const offlineContent = [];
      
      // Get all offline content keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('cache_offline_content_'));
      
      for (const key of offlineKeys) {
        const content = await AsyncStorage.getItem(key);
        if (content) {
          offlineContent.push(JSON.parse(content).data);
        }
      }
      
      return offlineContent;
    } catch (error) {
      console.error('❌ Error getting all offline content:', error);
      return [];
    }
  }

  // Remove offline content
  async removeOfflineContent(contentId) {
    try {
      await AsyncStorage.removeItem(`cache_offline_content_${contentId}`);
      
      // Notify server
      try {
        const offlineContent = await this.getOfflineContent(contentId);
        if (offlineContent && offlineContent.id) {
          await fetch(`/api/mobile/offline-content/${offlineContent.id}`, {
            method: 'DELETE',
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to remove offline content from server:', error);
      }
      
      console.log('✅ Offline content removed:', contentId);
    } catch (error) {
      console.error('❌ Error removing offline content:', error);
      throw error;
    }
  }

  // Check offline content storage usage
  async getOfflineStorageUsage() {
    try {
      const offlineContent = await this.getAllOfflineContent();
      
      const totalSize = offlineContent.reduce((sum, content) => {
        return sum + (content.fileSize || 0);
      }, 0);
      
      const completedCount = offlineContent.filter(content => content.status === 'COMPLETED').length;
      const downloadingCount = offlineContent.filter(content => content.status === 'DOWNLOADING').length;
      
      return {
        totalSize,
        completedCount,
        downloadingCount,
        totalCount: offlineContent.length,
        storageUsed: this.formatBytes(totalSize)
      };
    } catch (error) {
      console.error('❌ Error getting offline storage usage:', error);
      return {
        totalSize: 0,
        completedCount: 0,
        downloadingCount: 0,
        totalCount: 0,
        storageUsed: '0 B'
      };
    }
  }

  // Format bytes to human readable format
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Sync offline content when online
  async syncOfflineContent() {
    try {
      const offlineContent = await this.getAllOfflineContent();
      
      for (const content of offlineContent) {
        if (content.syncStatus === 'PENDING') {
          // Sync progress or completion status
          console.log('🔄 Syncing offline content:', content.id);
          
          // This would implement actual sync logic
          // For now, just mark as synced
          content.syncStatus = 'SYNCED';
          await this.cacheData(`offline_content_${content.contentId}`, content, 24 * 60 * 24);
        }
      }
      
      console.log('✅ Offline content sync completed');
    } catch (error) {
      console.error('❌ Error syncing offline content:', error);
    }
  }

  // Cache voice learning settings
  async cacheVoiceLearningSettings(settings) {
    try {
      await this.cacheData('voice_learning_settings', settings, 24 * 60 * 24); // 24 hours
      console.log('✅ Voice learning settings cached');
    } catch (error) {
      console.error('❌ Error caching voice learning settings:', error);
    }
  }

  // Get voice learning settings
  async getVoiceLearningSettings() {
    try {
      const settings = await this.getCachedData('voice_learning_settings');
      return settings || {
        voiceEnabled: true,
        voiceSpeed: 1.0,
        autoPlay: false
      };
    } catch (error) {
      console.error('❌ Error getting voice learning settings:', error);
      return {
        voiceEnabled: true,
        voiceSpeed: 1.0,
        autoPlay: false
      };
    }
  }

  // Save voice learning progress
  async saveVoiceLearningProgress(contentId, progress) {
    try {
      const existingProgress = await this.getVoiceLearningProgress(contentId) || {};
      const updatedProgress = {
        ...existingProgress,
        ...progress,
        lastUpdated: new Date().toISOString()
      };
      
      await this.cacheData(`voice_progress_${contentId}`, updatedProgress, 24 * 60 * 24);
      
      // Sync with server
      try {
        await fetch('/api/mobile/voice-learning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            contentType: progress.contentType || 'lesson',
            ...progress
          }),
        });
      } catch (error) {
        console.warn('⚠️ Failed to sync voice learning progress with server:', error);
      }
      
      console.log('✅ Voice learning progress saved:', contentId);
    } catch (error) {
      console.error('❌ Error saving voice learning progress:', error);
    }
  }

  // Get voice learning progress
  async getVoiceLearningProgress(contentId) {
    try {
      return await this.getCachedData(`voice_progress_${contentId}`);
    } catch (error) {
      console.error('❌ Error getting voice learning progress:', error);
      return null;
    }
  }
}

export default OfflineStorageService;