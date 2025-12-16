/**
 * Welcome Screen for INR100 Mobile App
 * First screen users see when opening the app
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

// Navigation
import { useNavigation } from '@react-navigation/native';

// Services
import AuthService from '../../services/AuthService';
import AnalyticsService from '../../services/AnalyticsService';

// Styles
import { Colors, Typography, Spacing, GlobalStyles } from '../../styles/GlobalStyles';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Welcome', 'WelcomeScreen');

    // Check if user is already authenticated
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const isAuthenticated = await AuthService.getInstance().isAuthenticated();
      if (isAuthenticated) {
        const sessionValid = await AuthService.getInstance().validateSession();
        if (sessionValid.valid) {
          // User is authenticated and session is valid
          setTimeout(() => {
            navigation.replace('Main');
          }, 2000);
        } else if (sessionValid.requiresReAuth) {
          // Requires re-authentication
          setTimeout(() => {
            navigation.navigate('BiometricSetup');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Authentication check error:', error);
    }
  };

  const handleGetStarted = () => {
    AnalyticsService.getInstance().trackEvent('welcome_get_started_clicked');
    navigation.navigate('Register');
  };

  const handleSignIn = () => {
    AnalyticsService.getInstance().trackEvent('welcome_sign_in_clicked');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo and Animation */}
          <View style={styles.logoContainer}>
            <LottieView
              source={require('../../assets/animations/welcome.json')}
              autoPlay
              loop
              style={styles.animation}
            />
            <Text style={styles.appTitle}>INR100</Text>
            <Text style={styles.appSubtitle}>Start Investing with Just ₹100</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Why Choose INR100?</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>💰</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Micro Investing</Text>
                <Text style={styles.featureDescription}>
                  Start with just ₹100 in stocks, mutual funds, and more
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🤖</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>AI-Powered Insights</Text>
                <Text style={styles.featureDescription}>
                  Get personalized recommendations and market analysis
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🎮</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Gamified Learning</Text>
                <Text style={styles.featureDescription}>
                  Learn investing while earning XP and badges
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>👥</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Social Investing</Text>
                <Text style={styles.featureDescription}>
                  Follow experts and copy successful portfolios
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.getStartedButton} 
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustContainer}>
            <Text style={styles.trustText}>
              Trusted by 50,000+ Investors • SEBI Registered • Bank-Level Security
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: Spacing.md,
  },
  appTitle: {
    fontSize: Typography.fontSize['5xl'],
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primaryLight,
    textAlign: 'center',
    fontWeight: '300',
  },
  featuresContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  featuresTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryLight,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingVertical: Spacing.lg,
  },
  getStartedButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  getStartedButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
  signInButton: {
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  trustContainer: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  trustText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primaryLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default WelcomeScreen;