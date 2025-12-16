/**
 * Payment Service for INR100 Mobile App
 * Handles UPI, wallet, and other payment integrations
 */

import { Linking, Platform, Alert } from 'react-native';
import { APIService } from './APIService';

class PaymentService {
  static instance = null;

  static getInstance() {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // UPI Payment Methods
  async initiateUPIPayment(amount, description = 'Add Money to INR100 Wallet') {
    try {
      // Create UPI payment order
      const result = await APIService.getInstance().createUPIOrder(amount);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const { upiLink, orderId, qrCode } = result.data;

      // Open UPI app or show QR code
      if (upiLink) {
        const opened = await this.openUPIApp(upiLink);
        if (!opened) {
          // Fallback to QR code payment
          return {
            success: true,
            method: 'QR_CODE',
            data: {
              orderId,
              qrCode,
              amount,
              description,
            }
          };
        }
      }

      return {
        success: true,
        method: 'UPI_LINK',
        data: {
          orderId,
          upiLink,
          amount,
          description,
        }
      };

    } catch (error) {
      console.error('UPI payment initiation error:', error);
      return {
        success: false,
        error: error.message || 'UPI payment failed'
      };
    }
  }

  async openUPIApp(upiLink) {
    try {
      const canOpen = await Linking.canOpenURL(upiLink);
      
      if (canOpen) {
        await Linking.openURL(upiLink);
        return true;
      } else {
        console.log('No UPI app found, showing QR code instead');
        return false;
      }
    } catch (error) {
      console.error('Open UPI app error:', error);
      return false;
    }
  }

  // UPI App Detection and Handling
  getSupportedUPIApps() {
    const upiApps = {
      'phonepe': 'PhonePe',
      'gpay': 'Google Pay',
      'paytm': 'Paytm',
      'bhim': 'BHIM UPI',
      'amazonpay': 'Amazon Pay',
      'whatsapp': 'WhatsApp Pay',
      'airtel': 'Airtel Thanks',
      'mobikwik': 'MobiKwik',
      'freecharge': 'FreeCharge',
      'jio': 'JioMoney',
      'swiggy': 'Swiggy Money',
    };

    return upiApps;
  }

  async detectInstalledUPIApps() {
    const upiApps = this.getSupportedUPIApps();
    const installedApps = [];

    for (const [packageName, appName] of Object.entries(upiApps)) {
      try {
        const canOpen = await Linking.canOpenURL(`upi://${packageName}`);
        if (canOpen) {
          installedApps.push({ packageName, appName });
        }
      } catch (error) {
        console.error(`Check ${appName} error:`, error);
      }
    }

    return installedApps;
  }

  // Payment Verification
  async verifyPayment(orderId) {
    try {
      const result = await APIService.getInstance().verifyPayment(orderId);
      
      if (result.success) {
        const { status, transactionId, amount } = result.data;
        
        return {
          success: true,
          data: {
            orderId,
            status,
            transactionId,
            amount,
            verifiedAt: new Date().toISOString(),
          }
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  // Net Banking Payment
  async initiateNetBankingPayment(amount, bankId) {
    try {
      const result = await APIService.getInstance().addMoney(amount, {
        type: 'NET_BANKING',
        bankId,
      });

      if (result.success) {
        const { redirectUrl, orderId } = result.data;
        
        // Open banking website
        if (redirectUrl) {
          await Linking.openURL(redirectUrl);
        }

        return {
          success: true,
          method: 'NET_BANKING',
          data: {
            orderId,
            redirectUrl,
            amount,
          }
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Net banking payment error:', error);
      return {
        success: false,
        error: error.message || 'Net banking payment failed'
      };
    }
  }

  // Card Payment
  async initiateCardPayment(amount, cardDetails) {
    try {
      const result = await APIService.getInstance().addMoney(amount, {
        type: 'CARD',
        ...cardDetails,
      });

      if (result.success) {
        const { paymentUrl, orderId } = result.data;
        
        // Open payment gateway
        if (paymentUrl) {
          await Linking.openURL(paymentUrl);
        }

        return {
          success: true,
          method: 'CARD',
          data: {
            orderId,
            paymentUrl,
            amount,
          }
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        error: error.message || 'Card payment failed'
      };
    }
  }

  // Wallet Payment
  async initiateWalletPayment(amount, walletType) {
    try {
      const result = await APIService.getInstance().addMoney(amount, {
        type: 'WALLET',
        walletType,
      });

      if (result.success) {
        const { walletUrl, orderId } = result.data;
        
        // Open wallet app
        if (walletUrl) {
          await Linking.openURL(walletUrl);
        }

        return {
          success: true,
          method: 'WALLET',
          data: {
            orderId,
            walletUrl,
            amount,
            walletType,
          }
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
      return {
        success: false,
        error: error.message || 'Wallet payment failed'
      };
    }
  }

  // UPI Intent Flow
  async initiateUPIIntent(amount, payeeVPA, payeeName, transactionRef) {
    try {
      const upiUrl = this.buildUPIUrl({
        pa: payeeVPA, // Payee VPA
        pn: payeeName, // Payee Name
        tn: 'Add Money to INR100 Wallet', // Transaction Note
        am: amount.toString(), // Amount
        cu: 'INR', // Currency
        tr: transactionRef, // Transaction Reference
        url: 'https://inr100.com/transaction-success', // Callback URL
      });

      const canOpen = await Linking.canOpenURL(upiUrl);
      
      if (canOpen) {
        await Linking.openURL(upiUrl);
        return {
          success: true,
          method: 'UPI_INTENT',
          data: {
            upiUrl,
            amount,
            transactionRef,
          }
        };
      } else {
        throw new Error('No UPI app found');
      }
    } catch (error) {
      console.error('UPI Intent error:', error);
      return {
        success: false,
        error: error.message || 'UPI Intent failed'
      };
    }
  }

  // UPI URL Builder
  buildUPIUrl(params) {
    const baseUrl = 'upi://pay';
    const queryParams = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `${baseUrl}?${queryParams}`;
  }

  // QR Code Payment
  async generateQRPayment(amount, merchantVPA) {
    try {
      const result = await APIService.getInstance().createUPIOrder(amount);
      
      if (result.success) {
        const { qrCode, orderId } = result.data;
        
        return {
          success: true,
          method: 'QR_CODE',
          data: {
            qrCode,
            orderId,
            amount,
            merchantVPA,
          }
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('QR payment generation error:', error);
      return {
        success: false,
        error: error.message || 'QR payment generation failed'
      };
    }
  }

  // Payment Status Tracking
  async trackPaymentStatus(orderId, callback) {
    const interval = setInterval(async () => {
      try {
        const result = await this.verifyPayment(orderId);
        
        if (result.success) {
          clearInterval(interval);
          callback(result.data);
        }
      } catch (error) {
        console.error('Payment status tracking error:', error);
        clearInterval(interval);
        callback({ error: error.message });
      }
    }, 3000); // Check every 3 seconds

    // Stop tracking after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 5 * 60 * 1000);
  }

  // Payment History
  async getPaymentHistory() {
    try {
      const result = await APIService.getInstance().getTransactions();
      
      if (result.success) {
        const payments = result.data.filter(transaction => 
          transaction.type === 'DEPOSIT' || transaction.type === 'PAYMENT'
        );
        
        return {
          success: true,
          data: payments
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Payment history error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch payment history'
      };
    }
  }

  // Payment Methods Management
  async savePaymentMethod(paymentMethod) {
    try {
      // Save payment method to secure storage
      const { BiometricService } = await import('./BiometricService');
      await BiometricService.getInstance().storeSecureData('payment_methods', paymentMethod);
      
      return { success: true };
    } catch (error) {
      console.error('Save payment method error:', error);
      return { success: false, error: error.message };
    }
  }

  async getSavedPaymentMethods() {
    try {
      const { BiometricService } = await import('./BiometricService');
      const methods = await BiometricService.getInstance().getSecureData('payment_methods');
      
      return {
        success: true,
        data: methods || []
      };
    } catch (error) {
      console.error('Get saved payment methods error:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment Security
  async validatePaymentSecurity(paymentData) {
    try {
      const { amount, paymentMethod } = paymentData;
      
      // Check for suspicious patterns
      if (amount > 100000) { // More than 1 Lakh
        Alert.alert(
          'High Amount Alert',
          'You are about to make a large payment. Please verify the details carefully.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => this.proceedWithPayment(paymentData) }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Payment security validation error:', error);
      return false;
    }
  }

  async proceedWithPayment(paymentData) {
    // Additional security checks for high-value transactions
    const { BiometricService } = await import('./BiometricService');
    
    const biometricResult = await BiometricService.getInstance().authenticateForTransaction(
      'Authenticate to complete high-value transaction'
    );

    if (biometricResult.success) {
      return true;
    } else {
      Alert.alert('Authentication Failed', 'Unable to authenticate transaction');
      return false;
    }
  }

  // UPI Deep Link Handling
  async handleUPICallback(url) {
    try {
      const params = new URLSearchParams(url.split('?')[1]);
      const status = params.get('status');
      const txnId = params.get('txnId');
      const responseCode = params.get('responseCode');

      return {
        success: status === 'SUCCESS',
        data: {
          status,
          txnId,
          responseCode,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('UPI callback handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default PaymentService;