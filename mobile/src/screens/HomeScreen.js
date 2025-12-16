import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../styles/GlobalStyles';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const authService = require('../services/AuthService').AuthService;
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log('No user logged in');
      }
    };

    checkUser();
  }, []);

  const features = [
    {
      icon: 'trending-up',
      title: 'Smart Investing',
      description: 'AI-powered portfolio recommendations',
      color: '#4CAF50'
    },
    {
      icon: 'shield-checkmark',
      title: 'Secure & Safe',
      description: 'Bank-grade security with biometric auth',
      color: '#2196F3'
    },
    {
      icon: 'wallet',
      title: 'UPI Payments',
      description: 'Seamless UPI integration for quick transactions',
      color: '#FF9800'
    },
    {
      icon: 'school',
      title: 'Learn & Grow',
      description: 'Educational content and market insights',
      color: '#9C27B0'
    },
    {
      icon: 'people',
      title: 'Social Investing',
      description: 'Follow and copy successful investors',
      color: '#E91E63'
    },
    {
      icon: 'camera',
      title: 'Quick KYC',
      description: 'Instant verification with camera scanning',
      color: '#795548'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '50K+', icon: 'people' },
    { label: 'Portfolio Value', value: '₹2.5Cr+', icon: 'trending-up' },
    { label: 'Success Rate', value: '94%', icon: 'checkmark-circle' },
    { label: 'Countries', value: '15+', icon: 'globe' }
  ];

  const handleGetStarted = () => {
    navigation.navigate('Auth', { screen: 'Welcome' });
  };

  const handleExploreApp = () => {
    navigation.navigate('Dashboard', { screen: 'MainTabs' });
  };

  const renderHeroSection = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={48} color="#fff" />
            <Text style={styles.appName}>INR100</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            Your Financial Future{'\n'}Starts Here
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Join thousands of smart investors building wealth with AI-powered insights, secure transactions, and comprehensive financial education.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleExploreApp}
            >
              <Text style={styles.secondaryButtonText}>Explore App</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroStats}>
            {stats.slice(0, 2).map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Ionicons name={stat.icon} size={16} color="#fff" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>Why Choose INR100?</Text>
      <Text style={styles.sectionSubtitle}>
        Experience the future of smart investing with our comprehensive platform
      </Text>
      
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.featureCard}
            onPress={() => {
              // Navigate to specific feature screens
              switch(feature.title) {
                case 'Smart Investing':
                  navigation.navigate('AI');
                  break;
                case 'Secure & Safe':
                  navigation.navigate('Dashboard');
                  break;
                case 'UPI Payments':
                  navigation.navigate('Wallet');
                  break;
                case 'Learn & Grow':
                  navigation.navigate('Learn');
                  break;
                case 'Social Investing':
                  navigation.navigate('Community');
                  break;
                case 'Quick KYC':
                  navigation.navigate('Auth', { screen: 'Register' });
                  break;
                default:
                  break;
              }
            }}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
              <Ionicons name={feature.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        style={styles.statsGradient}
      >
        <Text style={styles.statsTitle}>Trusted by Investors Worldwide</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statBox}>
              <Ionicons name={stat.icon} size={24} color="#fff" />
              <Text style={styles.statBoxValue}>{stat.value}</Text>
              <Text style={styles.statBoxLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );

  const renderTestimonials = () => (
    <View style={styles.testimonialsSection}>
      <Text style={styles.sectionTitle}>What Our Users Say</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.testimonialsScroll}
        contentContainerStyle={styles.testimonialsContent}
      >
        {[
          {
            name: 'Rajesh Kumar',
            role: 'Software Engineer',
            text: 'INR100 helped me grow my portfolio by 150% in just 6 months. The AI recommendations are incredibly accurate!',
            rating: 5
          },
          {
            name: 'Priya Sharma',
            role: 'Marketing Manager',
            text: 'The educational content and social investing features make learning about investments fun and engaging.',
            rating: 5
          },
          {
            name: 'Amit Patel',
            role: 'Business Owner',
            text: 'Secure, user-friendly, and packed with features. INR100 is my go-to app for all investment needs.',
            rating: 5
          }
        ].map((testimonial, index) => (
          <View key={index} style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.avatarText}>
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.testimonialInfo}>
                <Text style={styles.testimonialName}>{testimonial.name}</Text>
                <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                <View style={styles.ratingContainer}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FFD700" />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderCTASection = () => (
    <View style={styles.ctaSection}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.ctaGradient}
      >
        <Text style={styles.ctaTitle}>Ready to Start Your Investment Journey?</Text>
        <Text style={styles.ctaText}>
          Join INR100 today and experience the future of smart investing with AI-powered insights and secure transactions.
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.ctaButtonText}>Start Investing Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#4facfe" style={styles.ctaButtonIcon} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeroSection()}
        {renderFeatures()}
        {renderStats()}
        {renderTestimonials()}
        {renderCTASection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroContainer: {
    marginBottom: 30,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.9,
  },
  heroButtons: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: GlobalStyles.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  statsSection: {
    marginBottom: 30,
  },
  statsGradient: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  testimonialsSection: {
    marginBottom: 30,
  },
  testimonialsScroll: {
    paddingLeft: 24,
  },
  testimonialsContent: {
    paddingRight: 24,
  },
  testimonialCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testimonialHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
  },
  testimonialRole: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  testimonialText: {
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
    lineHeight: 20,
  },
  ctaSection: {
    marginBottom: 30,
  },
  ctaGradient: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4facfe',
  },
  ctaButtonIcon: {
    marginLeft: 8,
  },
});

export default HomeScreen;