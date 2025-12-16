/**
 * Authentication Service for INR100 Mobile App
 * Handles user authentication, session management, and security
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIService } from './APIService';
import BiometricService from './BiometricService';
import AnalyticsService from './AnalyticsService';
import { MMKV } from 'react-native-mmkv';

class AuthService {
  static instance = null;
  static mmkv = new MMKV();

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Authentication State Management
  async login(credentials) {
    try {
      console.log('🔐 Starting login process');
      
      const apiService = APIService.getInstance();
      const result = await apiService.login(credentials);
      
      if (result.success) {
        const { token, user } = result.data;
        
        // Store authentication data
        await this.setAuthToken(token);
        await this.setUserInfo(user);
        await this.setLoginTimestamp();
        
        // Track login
        await AnalyticsService.getInstance().trackUserLogin(credentials.method || 'email');
        await AnalyticsService.getInstance().trackUser(user);
        
        console.log('✅ Login successful');
        return { success: true, user };
      } else {
        console.log('❌ Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      console.log('📝 Starting registration process');
      
      const apiService = APIService.getInstance();
      const result = await apiService.register(userData);
      
      if (result.success) {
        // Track registration
        await AnalyticsService.getInstance().trackUserRegistration(userData);
        
        console.log('✅ Registration successful');
        return { success: true, data: result.data };
      } else {
        console.log('❌ Registration failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      console.log('🚪 Starting logout process');
      
      const apiService = APIService.getInstance();
      await apiService.logout();
      
      // Clear all stored data
      await this.clearAuthData();
      
      // Track logout
      await AnalyticsService.getInstance().trackUserLogout();
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if server request fails
      await this.clearAuthData();
      return { success: true };
    }
  }

  async sendOTP(phoneOrEmail) {
    try {
      console.log('📱 Sending OTP');
      
      const apiService = APIService.getInstance();
      const result = await apiService.sendOTP(phoneOrEmail);
      
      if (result.success) {
        console.log('✅ OTP sent successfully');
        return { success: true, data: result.data };
      } else {
        console.log('❌ OTP sending failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyOTP(phoneOrEmail, otp) {
    try {
      console.log('🔍 Verifying OTP');
      
      const apiService = APIService.getInstance();
      const result = await apiService.verifyOTP(phoneOrEmail, otp);
      
      if (result.success) {
        console.log('✅ OTP verified successfully');
        return { success: true, data: result.data };
      } else {
        console.log('❌ OTP verification failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      console.log('🔑 Starting password reset');
      
      const apiService = APIService.getInstance();
      const result = await apiService.resetPassword(email);
      
      if (result.success) {
        console.log('✅ Password reset email sent');
        return { success: true, data: result.data };
      } else {
        console.log('❌ Password reset failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Session Management
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      const user = await this.getUserInfo();
      
      if (!token || !user) {
        return false;
      }

      // Check if session is still valid
      const loginTime = await this.getLoginTimestamp();
      const currentTime = Date.now();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
      
      if (loginTime && (currentTime - loginTime) > sessionTimeout) {
        console.log('⏰ Session expired');
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  async refreshSession() {
    try {
      const apiService = APIService.getInstance();
      const result = await apiService.refreshToken();
      
      if (result.success) {
        const { token } = result.data;
        await this.setAuthToken(token);
        await this.setLoginTimestamp();
        
        console.log('✅ Session refreshed');
        return { success: true };
      } else {
        console.log('❌ Session refresh failed');
        await this.logout();
        return { success: false };
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      await this.logout();
      return { success: false };
    }
  }

  // Biometric Authentication
  async authenticateWithBiometrics() {
    try {
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.authenticate();
      
      if (result.success) {
        console.log('✅ Biometric authentication successful');
        
        // Check if user has stored credentials
        const storedCredentials = await biometricService.getBiometricToken();
        if (storedCredentials) {
          // Auto-login with stored credentials
          return await this.loginWithStoredCredentials(storedCredentials);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginWithStoredCredentials(credentials) {
    try {
      const { email, password } = JSON.parse(credentials);
      return await this.login({ email, password });
    } catch (error) {
      console.error('Login with stored credentials error:', error);
      return { success: false, error: error.message };
    }
  }

  async enableBiometricLogin() {
    try {
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.enableBiometricLogin();
      
      if (result) {
        // Store current credentials for biometric login
        const user = await this.getUserInfo();
        const credentials = JSON.stringify({
          email: user.email,
          password: user.password, // In production, encrypt this
        });
        
        await biometricService.storeBiometricToken(credentials);
        console.log('✅ Biometric login enabled');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Enable biometric login error:', error);
      return false;
    }
  }

  async disableBiometricLogin() {
    try {
      const biometricService = BiometricService.getInstance();
      const result = await biometricService.disableBiometricLogin();
      
      if (result) {
        console.log('✅ Biometric login disabled');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Disable biometric login error:', error);
      return false;
    }
  }

  // User Profile Management
  async updateProfile(profileData) {
    try {
      const apiService = APIService.getInstance();
      const result = await apiService.updateProfile(profileData);
      
      if (result.success) {
        // Update stored user info
        await this.setUserInfo(result.data.user);
        console.log('✅ Profile updated');
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const apiService = APIService.getInstance();
      const result = await apiService.changePassword({
        currentPassword,
        newPassword,
      });
      
      if (result.success) {
        console.log('✅ Password changed');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Security Features
  async setupTwoFactorAuth() {
    try {
      const apiService = APIService.getInstance();
      const result = await apiService.setupTwoFactorAuth();
      
      if (result.success) {
        console.log('✅ Two-factor authentication setup initiated');
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Setup 2FA error:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyTwoFactorAuth(code) {
    try {
      const apiService = APIService.getInstance();
      const result = await apiService.verifyTwoFactorAuth(code);
      
      if (result.success) {
        console.log('✅ Two-factor authentication verified');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      return { success: false, error: error.message };
    }
  }

  // Data Storage Methods
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('auth_token', token);
      AuthService.mmkv.set('auth_token', token);
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
      AuthService.mmkv.set('user_info', JSON.stringify(user));
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

  async getCurrentUser() {
    try {
      return await this.getUserInfo();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async setLoginTimestamp() {
    try {
      const timestamp = Date.now();
      await AsyncStorage.setItem('login_timestamp', timestamp.toString());
      AuthService.mmkv.set('login_timestamp', timestamp);
    } catch (error) {
      console.error('Set login timestamp error:', error);
    }
  }

  async getLoginTimestamp() {
    try {
      const timestamp = await AsyncStorage.getItem('login_timestamp');
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Get login timestamp error:', error);
      return null;
    }
  }

  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        'auth_token',
        'user_info',
        'login_timestamp',
        'biometric_preference',
      ]);
      
      AuthService.mmkv.clearAll();
    } catch (error) {
      console.error('Clear auth data error:', error);
    }
  }

  // Utility Methods
  async isFirstTimeUser() {
    try {
      const isFirstTime = await AsyncStorage.getItem('first_time_user');
      return isFirstTime === null;
    } catch (error) {
      console.error('Check first time user error:', error);
      return true;
    }
  }

  async setFirstTimeUserCompleted() {
    try {
      await AsyncStorage.setItem('first_time_user', 'false');
    } catch (error) {
      console.error('Set first time user completed error:', error);
    }
  }

  async getDeviceInfo() {
    try {
      const deviceInfo = await AsyncStorage.getItem('device_info');
      return deviceInfo ? JSON.parse(deviceInfo) : null;
    } catch (error) {
      console.error('Get device info error:', error);
      return null;
    }
  }

  async setDeviceInfo(deviceInfo) {
    try {
      await AsyncStorage.setItem('device_info', JSON.stringify(deviceInfo));
    } catch (error) {
      console.error('Set device info error:', error);
    }
  }

  // Session Security
  async validateSession() {
    try {
      const isValid = await this.isAuthenticated();
      
      if (isValid) {
        // Additional security checks
        const biometricEnabled = await BiometricService.getInstance().isBiometricEnabled();
        const lastAuth = await BiometricService.getInstance().getLastAuthTime();
        
        // Require re-authentication if biometric is enabled and last auth was more than 1 hour ago
        if (biometricEnabled && lastAuth) {
          const hoursSinceLastAuth = (Date.now() - lastAuth) / (1000 * 60 * 60);
          if (hoursSinceLastAuth > 1) {
            return { valid: false, requiresReAuth: true };
          }
        }
      }
      
      return { valid: isValid, requiresReAuth: false };
    } catch (error) {
      console.error('Validate session error:', error);
      return { valid: false, requiresReAuth: true };
    }
  }
}

export default AuthService;