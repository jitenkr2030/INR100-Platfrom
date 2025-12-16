/**
 * Biometric Authentication Service for INR100 Mobile App
 * Handles fingerprint and face recognition authentication
 */

import ReactNativeBiometrics from 'react-native-biometrics';
import Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

class BiometricService {
  static instance = null;

  static getInstance() {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  async setup() {
    try {
      const supported = await this.isSupported();
      if (supported) {
        console.log('✅ Biometric authentication supported');
        await this.enrollBiometrics();
      } else {
        console.log('❌ Biometric authentication not supported');
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
    }
  }

  async isSupported() {
    try {
      const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable();
      
      if (!available) {
        console.log('Biometric sensor not available');
        return false;
      }

      console.log(`Biometric type: ${biometryType}`);
      return true;
    } catch (error) {
      console.error('Biometric support check error:', error);
      return false;
    }
  }

  async enrollBiometrics() {
    try {
      const enrolled = await ReactNativeBiometrics.isEnrolled();
      
      if (!enrolled) {
        console.log('No biometrics enrolled, prompting enrollment');
        const result = await ReactNativeBiometrics.simplePrompt({
          promptMessage: 'Enable biometric authentication',
          fallbackLabel: 'Use password instead',
        });

        if (result.success) {
          console.log('✅ Biometric enrollment successful');
          await this.storeBiometricPreference(true);
        }
      } else {
        console.log('✅ Biometrics already enrolled');
        await this.storeBiometricPreference(true);
      }
    } catch (error) {
      console.error('Biometric enrollment error:', error);
    }
  }

  async authenticate(reason = 'Authenticate to access INR100') {
    try {
      // Check if user has enabled biometric authentication
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      // Check if biometrics are still available
      const supported = await this.isSupported();
      if (!supported) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      // Perform authentication
      const result = await ReactNativeBiometrics.simplePrompt({
        promptMessage: reason,
        fallbackLabel: 'Use password instead',
      });

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        await this.storeLastAuthTime();
        return { success: true };
      } else {
        console.log('❌ Biometric authentication failed');
        return { success: false, error: 'Authentication cancelled' };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticateForTransaction(reason = 'Authenticate to complete transaction') {
    try {
      // Additional security for financial transactions
      const result = await this.authenticate(reason);
      
      if (result.success) {
        // Store transaction context for audit
        await this.storeTransactionContext({
          timestamp: new Date().toISOString(),
          type: 'transaction',
          reason: reason,
        });
      }

      return result;
    } catch (error) {
      console.error('Transaction authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  async enableBiometricLogin() {
    try {
      const supported = await this.isSupported();
      if (!supported) {
        throw new Error('Biometric authentication not supported on this device');
      }

      // Store user's biometric preference
      await Keychain.setInternetCredentials(
        'inr100_biometric_preference',
        'enabled',
        'true'
      );

      console.log('✅ Biometric login enabled');
      return true;
    } catch (error) {
      console.error('Enable biometric login error:', error);
      throw error;
    }
  }

  async disableBiometricLogin() {
    try {
      await Keychain.resetInternetCredentials('inr100_biometric_preference');
      await Keychain.resetInternetCredentials('inr100_biometric_token');
      
      console.log('✅ Biometric login disabled');
      return true;
    } catch (error) {
      console.error('Disable biometric login error:', error);
      throw error;
    }
  }

  async isBiometricEnabled() {
    try {
      const credentials = await Keychain.getInternetCredentials('inr100_biometric_preference');
      return credentials && credentials.password === 'true';
    } catch (error) {
      console.error('Check biometric preference error:', error);
      return false;
    }
  }

  async storeBiometricPreference(enabled) {
    try {
      await Keychain.setInternetCredentials(
        'inr100_biometric_preference',
        'preference',
        enabled ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Store biometric preference error:', error);
    }
  }

  async storeBiometricToken(token) {
    try {
      await Keychain.setInternetCredentials(
        'inr100_biometric_token',
        'token',
        token
      );
    } catch (error) {
      console.error('Store biometric token error:', error);
    }
  }

  async getBiometricToken() {
    try {
      const credentials = await Keychain.getInternetCredentials('inr100_biometric_token');
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Get biometric token error:', error);
      return null;
    }
  }

  async storeLastAuthTime() {
    try {
      const timestamp = new Date().toISOString();
      await Keychain.setInternetCredentials(
        'inr100_last_auth',
        'timestamp',
        timestamp
      );
    } catch (error) {
      console.error('Store last auth time error:', error);
    }
  }

  async getLastAuthTime() {
    try {
      const credentials = await Keychain.getInternetCredentials('inr100_last_auth');
      return credentials ? new Date(credentials.password) : null;
    } catch (error) {
      console.error('Get last auth time error:', error);
      return null;
    }
  }

  async shouldReAuthenticate(timeoutMinutes = 5) {
    try {
      const lastAuth = await this.getLastAuthTime();
      if (!lastAuth) return true;

      const now = new Date();
      const diffMinutes = (now - lastAuth) / (1000 * 60);
      return diffMinutes >= timeoutMinutes;
    } catch (error) {
      console.error('Check re-authentication need error:', error);
      return true;
    }
  }

  async storeTransactionContext(context) {
    try {
      const contextString = JSON.stringify(context);
      await Keychain.setInternetCredentials(
        'inr100_transaction_context',
        'context',
        contextString
      );
    } catch (error) {
      console.error('Store transaction context error:', error);
    }
  }

  async getTransactionContext() {
    try {
      const credentials = await Keychain.getInternetCredentials('inr100_transaction_context');
      return credentials ? JSON.parse(credentials.password) : null;
    } catch (error) {
      console.error('Get transaction context error:', error);
      return null;
    }
  }

  // Secure storage for sensitive data
  async storeSecureData(key, data) {
    try {
      const dataString = JSON.stringify(data);
      await Keychain.setInternetCredentials(
        `inr100_secure_${key}`,
        key,
        dataString
      );
    } catch (error) {
      console.error('Store secure data error:', error);
    }
  }

  async getSecureData(key) {
    try {
      const credentials = await Keychain.getInternetCredentials(`inr100_secure_${key}`);
      return credentials ? JSON.parse(credentials.password) : null;
    } catch (error) {
      console.error('Get secure data error:', error);
      return null;
    }
  }

  async clearSecureData(key) {
    try {
      await Keychain.resetInternetCredentials(`inr100_secure_${key}`);
    } catch (error) {
      console.error('Clear secure data error:', error);
    }
  }

  // Device security check
  async checkDeviceSecurity() {
    try {
      const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable();
      const enrolled = await ReactNativeBiometrics.isEnrolled();

      return {
        supported: available,
        enrolled,
        biometryType,
        secure: available && enrolled,
      };
    } catch (error) {
      console.error('Device security check error:', error);
      return {
        supported: false,
        enrolled: false,
        biometryType: null,
        secure: false,
      };
    }
  }

  // Create biometric backup key
  async createBackupKey() {
    try {
      const { publicKey } = await ReactNativeBiometrics.createKeys();
      await this.storeSecureData('backup_key', { publicKey });
      return publicKey;
    } catch (error) {
      console.error('Create backup key error:', error);
      throw error;
    }
  }

  // Validate biometric signature
  async validateSignature(data) {
    try {
      const signature = await ReactNativeBiometrics.createSignature({
        promptMessage: 'Sign transaction',
        payload: data,
      });

      return signature;
    } catch (error) {
      console.error('Validate signature error:', error);
      throw error;
    }
  }
}

export default BiometricService;