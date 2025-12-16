/**
 * INR100 Mobile App - Main Entry Point
 * India's Premier Micro-Investing Platform
 */

import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-root-toast';
import SplashScreen from 'react-native-splash-screen';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Services
import NotificationService from './src/services/NotificationService';
import BiometricService from './src/services/BiometricService';
import AnalyticsService from './src/services/AnalyticsService';

// Utils
import { Colors, GlobalStyles } from './src/styles/GlobalStyles';
import { showToast } from './src/utils/helpers';

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Hide splash screen after app initialization
      setTimeout(() => {
        SplashScreen.hide();
      }, 2000);

      // Initialize services
      await initializeServices();
      
      // Setup analytics
      AnalyticsService.initialize();
      
      console.log('✅ INR100 Mobile App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      showToast('Failed to initialize app. Please restart.', 'error');
    }
  };

  const initializeServices = async () => {
    try {
      // Initialize notification service
      await NotificationService.initialize();
      
      // Setup biometric service
      await BiometricService.setup();
      
      // Initialize other services...
      console.log('🔧 All services initialized');
    } catch (error) {
      console.error('Service initialization error:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={Colors.primary}
          translucent={false}
        />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;