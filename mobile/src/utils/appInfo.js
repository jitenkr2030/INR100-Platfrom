/**
 * App Information and Configuration
 */

export const name = 'INR100';
export const version = '1.0.0';
export const buildNumber = '1';

export const appName = 'INR100 Mobile';

export const config = {
  api: {
    baseURL: 'http://localhost:3000/api', // Update with your backend URL
    timeout: 30000,
  },
  firebase: {
    projectId: 'inr100-mobile-app',
  },
  notifications: {
    channelId: 'inr100-notifications',
    channelName: 'INR100 Notifications',
  },
  biometric: {
    allowedBiometrics: ['TouchID', 'FaceID', 'Biometrics'],
  },
  storage: {
    encryptionEnabled: true,
  },
};