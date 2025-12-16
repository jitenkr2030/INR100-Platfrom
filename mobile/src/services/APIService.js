/**
 * API Service for INR100 Mobile App
 * Handles all backend communication and data management
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import { config } from '../utils/appInfo';

class APIService {
  static instance = null;
  static baseURL = config.api.baseURL;
  
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: APIService.baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.mmkv = new MMKV();
  }

  static getInstance() {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add auth token
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device info
        config.headers['X-Device-ID'] = await this.getDeviceId();
        config.headers['X-Platform'] = 'mobile';
        config.headers['X-App-Version'] = '1.0.0';

        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        
        // Handle 401 - Unauthorized
        if (error.response?.status === 401) {
          await this.handleUnauthorized();
        }

        // Handle 403 - Forbidden
        if (error.response?.status === 403) {
          await this.handleForbidden();
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(credentials) {
    try {
      const response = await this.axiosInstance.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      await this.setAuthToken(token);
      await this.setUserInfo(user);
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  }

  async register(userData) {
    try {
      const response = await this.axiosInstance.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  }

  async sendOTP(phoneOrEmail) {
    try {
      const response = await this.axiosInstance.post('/auth/verify-otp', { 
        phoneOrEmail 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'OTP sending failed' };
    }
  }

  async verifyOTP(phoneOrEmail, otp) {
    try {
      const response = await this.axiosInstance.post('/auth/verify-otp', { 
        phoneOrEmail, 
        otp 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'OTP verification failed' };
    }
  }

  async logout() {
    try {
      await this.axiosInstance.post('/auth/logout');
      await this.clearAuthData();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      await this.clearAuthData(); // Clear local data even if server request fails
      return { success: true };
    }
  }

  async resetPassword(email) {
    try {
      const response = await this.axiosInstance.post('/auth/password-reset', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Password reset failed' };
    }
  }

  // Portfolio Methods
  async getPortfolio() {
    try {
      const response = await this.axiosInstance.get('/portfolio');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch portfolio' };
    }
  }

  async getPortfolioHoldings() {
    try {
      const response = await this.axiosInstance.get('/portfolio/holdings');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch holdings' };
    }
  }

  async getPortfolioPerformance(period = '1M') {
    try {
      const response = await this.axiosInstance.get(`/portfolio/performance?period=${period}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch performance' };
    }
  }

  // Investment/Trading Methods
  async getAssets() {
    try {
      const response = await this.axiosInstance.get('/market-data');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch assets' };
    }
  }

  async getAssetDetails(symbol) {
    try {
      const response = await this.axiosInstance.get(`/market-data/${symbol}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch asset details' };
    }
  }

  async placeOrder(orderData) {
    try {
      const response = await this.axiosInstance.post('/orders', orderData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Order placement failed' };
    }
  }

  async getOrders(status = 'ALL') {
    try {
      const response = await this.axiosInstance.get(`/orders?status=${status}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch orders' };
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await this.axiosInstance.delete(`/orders/${orderId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Order cancellation failed' };
    }
  }

  // Market Data Methods
  async getMarketData() {
    try {
      const response = await this.axiosInstance.get('/market-data');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch market data' };
    }
  }

  async getMarketDataRealtime() {
    try {
      const response = await this.axiosInstance.get('/market-data/realtime');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch realtime data' };
    }
  }

  async getMarketIndices() {
    try {
      const response = await this.axiosInstance.get('/market-data/indices');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch indices' };
    }
  }

  // Payment/Wallet Methods
  async getWallet() {
    try {
      const response = await this.axiosInstance.get('/wallet');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch wallet' };
    }
  }

  async addMoney(amount, paymentMethod) {
    try {
      const response = await this.axiosInstance.post('/payments/create-order', {
        amount,
        paymentMethod,
        type: 'ADD_MONEY'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Payment failed' };
    }
  }

  async createUPIOrder(amount) {
    try {
      const response = await this.axiosInstance.post('/payments/upi', {
        amount,
        type: 'ADD_MONEY'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'UPI payment failed' };
    }
  }

  async verifyPayment(orderId) {
    try {
      const response = await this.axiosInstance.post('/payments/verify', { orderId });
      return { success: true, data: response.data };
    catch (error) {
      return { success: false, error: error.response?.data?.message || 'Payment verification failed' };
    }
  }

  async getTransactions() {
    try {
      const response = await this.axiosInstance.get('/transactions');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch transactions' };
    }
  }

  // KYC Methods
  async getKYCStatus() {
    try {
      const response = await this.axiosInstance.get('/auth/kyc');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch KYC status' };
    }
  }

  async submitKYCDocument(documentData) {
    try {
      const response = await this.axiosInstance.post('/auth/kyc', documentData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'KYC submission failed' };
    }
  }

  // Learning Methods
  async getLearningContent() {
    try {
      const response = await this.axiosInstance.get('/learn');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch learning content' };
    }
  }

  async updateLearningProgress(contentId, progress) {
    try {
      const response = await this.axiosInstance.put('/learn/progress', {
        contentId,
        progress,
        completed: progress >= 100
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update progress' };
    }
  }

  async getUserStats() {
    try {
      const response = await this.axiosInstance.get('/analytics');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch user stats' };
    }
  }

  // AI Methods
  async getAIInsights() {
    try {
      const response = await this.axiosInstance.get('/ai/insights');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch AI insights' };
    }
  }

  async chatWithAI(message) {
    try {
      const response = await this.axiosInstance.post('/ai/chat', { message });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'AI chat failed' };
    }
  }

  // Social Methods
  async getCommunityFeed() {
    try {
      const response = await this.axiosInstance.get('/community');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch community feed' };
    }
  }

  async createSocialPost(content, images = []) {
    try {
      const response = await this.axiosInstance.post('/community/post', {
        content,
        images,
        type: 'REGULAR'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Post creation failed' };
    }
  }

  // Utility Methods
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('auth_token', token);
      this.mmkv.set('auth_token', token);
    } catch (error) {
      console.error('Set auth token error:', error);
    }
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  async setUserInfo(user) {
    try {
      await AsyncStorage.setItem('user_info', JSON.stringify(user));
      this.mmkv.set('user_info', JSON.stringify(user));
    } catch (error) {
      console.error('Set user info error:', error);
    }
  }

  async getUserInfo() {
    try {
      const userInfo = await AsyncStorage.getItem('user_info');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Get device ID error:', error);
      return 'unknown_device';
    }
  }

  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user_info']);
      this.mmkv.clearAll();
    } catch (error) {
      console.error('Clear auth data error:', error);
    }
  }

  async handleUnauthorized() {
    console.log('Handling unauthorized request');
    await this.clearAuthData();
    // Navigation will be handled by auth state management
  }

  async handleForbidden() {
    console.log('Handling forbidden request');
    // Show error message to user
  }

  async registerFCMToken(token) {
    try {
      await this.axiosInstance.post('/auth/fcm-token', { token });
      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('FCM token registration error:', error);
    }
  }
}

export default APIService;