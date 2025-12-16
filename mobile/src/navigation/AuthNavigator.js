/**
 * Authentication Navigator for INR100 Mobile App
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';
import KYCIntroScreen from '../screens/auth/KYCIntroScreen';
import KYCScreen from '../screens/auth/KYCScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardOverlayEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="KYCIntro" component={KYCIntroScreen} />
      <Stack.Screen name="KYC" component={KYCScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;