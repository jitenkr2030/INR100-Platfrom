/**
 * Analytics Service for INR100 Mobile App
 * Handles user behavior tracking, app analytics, and performance monitoring
 */

import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import perf from '@react-native-firebase/perf';
import { APIService } from './APIService';
import { OfflineStorageService } from './OfflineStorageService';

class AnalyticsService {
  static instance = null;

  static getInstance() {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async initialize() {
    try {
      console.log('📊 Initializing Analytics Service');
      
      // Set user properties
      await this.setDefaultUserProperties();
      
      // Track app initialization
      await this.trackEvent('app_initialized', {
        platform: 'mobile',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Analytics Service initialized');
    } catch (error) {
      console.error('❌ Analytics initialization error:', error);
    }
  }

  async setDefaultUserProperties() {
    try {
      await analytics().setUserProperty('platform', 'mobile');
      await analytics().setUserProperty('app_version', '1.0.0');
      await analytics().setUserProperty('installation_source', 'direct');
    } catch (error) {
      console.error('Set user properties error:', error);
    }
  }

  // User Tracking
  async trackUser(user) {
    try {
      if (user) {
        await analytics().setUserId(user.id);
        await analytics().setUserProperties({
          user_type: user.subscriptionTier || 'basic',
          kyc_status: user.kycStatus,
          investor_level: user.level,
          total_xp: user.xp,
          streak_days: user.streak,
        });
        
        console.log('✅ User properties set');
      }
    } catch (error) {
      console.error('Track user error:', error);
    }
  }

  async trackUserRegistration(userData) {
    try {
      await analytics().logEvent('sign_up', {
        method: userData.registrationMethod || 'email',
        user_type: userData.subscriptionTier || 'basic',
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ User registration tracked');
    } catch (error) {
      console.error('Track user registration error:', error);
    }
  }

  async trackUserLogin(method = 'email') {
    try {
      await analytics().logEvent('login', {
        method,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ User login tracked');
    } catch (error) {
      console.error('Track user login error:', error);
    }
  }

  async trackUserLogout() {
    try {
      await analytics().logEvent('logout', {
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ User logout tracked');
    } catch (error) {
      console.error('Track user logout error:', error);
    }
  }

  // Investment Tracking
  async trackInvestmentStart(amount, assetType) {
    try {
      await analytics().logEvent('investment_start', {
        amount,
        asset_type: assetType,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Investment start tracked');
    } catch (error) {
      console.error('Track investment start error:', error);
    }
  }

  async trackInvestmentComplete(orderData) {
    try {
      await analytics().logEvent('investment_complete', {
        amount: orderData.totalAmount,
        asset_symbol: orderData.symbol,
        asset_type: orderData.assetType,
        order_type: orderData.type,
        timestamp: new Date().toISOString(),
      });
      
      // Track to custom analytics endpoint
      await this.sendToCustomAnalytics('investment_complete', orderData);
      
      console.log('✅ Investment complete tracked');
    } catch (error) {
      console.error('Track investment complete error:', error);
    }
  }

  async trackOrderPlacement(orderData) {
    try {
      await analytics().logEvent('order_placed', {
        amount: orderData.amount,
        asset_symbol: orderData.symbol,
        order_type: orderData.type,
        order_side: orderData.side,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Order placement tracked');
    } catch (error) {
      console.error('Track order placement error:', error);
    }
  }

  async trackPortfolioView(portfolioValue) {
    try {
      await analytics().logEvent('view_portfolio', {
        portfolio_value: portfolioValue,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Portfolio view tracked');
    } catch (error) {
      console.error('Track portfolio view error:', error);
    }
  }

  // Learning Tracking
  async trackLearningStart(contentId, contentType) {
    try {
      await analytics().logEvent('learning_start', {
        content_id: contentId,
        content_type: contentType,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Learning start tracked');
    } catch (error) {
      console.error('Track learning start error:', error);
    }
  }

  async trackLearningComplete(contentId, duration) {
    try {
      await analytics().logEvent('learning_complete', {
        content_id: contentId,
        duration_minutes: duration,
        timestamp: new Date().toISOString(),
      });
      
      // Track learning milestones
      await this.trackLearningMilestone();
      
      console.log('✅ Learning complete tracked');
    } catch (error) {
      console.error('Track learning complete error:', error);
    }
  }

  async trackLearningMilestone() {
    try {
      const apiService = APIService.getInstance();
      const stats = await apiService.getUserStats();
      
      if (stats.success) {
        const { learningStats } = stats.data;
        
        if (learningStats.completedCourses >= 5) {
          await analytics().logEvent('learning_milestone', {
            milestone: '5_courses_completed',
            total_courses: learningStats.completedCourses,
          });
        }
        
        if (learningStats.studyStreak >= 7) {
          await analytics().logEvent('learning_milestone', {
            milestone: '7_day_streak',
            streak_days: learningStats.studyStreak,
          });
        }
      }
    } catch (error) {
      console.error('Track learning milestone error:', error);
    }
  }

  // Social Tracking
  async trackSocialPost(contentType) {
    try {
      await analytics().logEvent('social_post_created', {
        content_type: contentType,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Social post tracked');
    } catch (error) {
      console.error('Track social post error:', error);
    }
  }

  async trackSocialEngagement(postId, engagementType) {
    try {
      await analytics().logEvent('social_engagement', {
        post_id: postId,
        engagement_type: engagementType, // like, comment, share
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Social engagement tracked');
    } catch (error) {
      console.error('Track social engagement error:', error);
    }
  }

  async trackCommunityVisit() {
    try {
      await analytics().logEvent('visit_community', {
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Community visit tracked');
    } catch (error) {
      console.error('Track community visit error:', error);
    }
  }

  // Payment Tracking
  async trackPaymentStart(amount, paymentMethod) {
    try {
      await analytics().logEvent('payment_start', {
        amount,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Payment start tracked');
    } catch (error) {
      console.error('Track payment start error:', error);
    }
  }

  async trackPaymentComplete(paymentData) {
    try {
      await analytics().logEvent('payment_complete', {
        amount: paymentData.amount,
        payment_method: paymentData.method,
        transaction_id: paymentData.transactionId,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Payment complete tracked');
    } catch (error) {
      console.error('Track payment complete error:', error);
    }
  }

  async trackPaymentFailure(error, paymentData) {
    try {
      await analytics().logEvent('payment_failure', {
        amount: paymentData?.amount,
        payment_method: paymentData?.method,
        error_code: error.code,
        error_message: error.message,
        timestamp: new Date().toISOString(),
      });
      
      // Log to crashlytics for payment issues
      await crashlytics().recordError(error);
      
      console.log('✅ Payment failure tracked');
    } catch (trackingError) {
      console.error('Track payment failure error:', trackingError);
    }
  }

  // Navigation Tracking
  async trackScreenView(screenName, screenClass) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass,
      });
      
      console.log(`✅ Screen view tracked: ${screenName}`);
    } catch (error) {
      console.error('Track screen view error:', error);
    }
  }

  async trackNavigation(fromScreen, toScreen) {
    try {
      await analytics().logEvent('navigation', {
        from_screen: fromScreen,
        to_screen: toScreen,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Navigation tracked');
    } catch (error) {
      console.error('Track navigation error:', error);
    }
  }

  // Feature Usage Tracking
  async trackFeatureUse(featureName, properties = {}) {
    try {
      await analytics().logEvent('feature_use', {
        feature_name: featureName,
        ...properties,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`✅ Feature use tracked: ${featureName}`);
    } catch (error) {
      console.error('Track feature use error:', error);
    }
  }

  async trackSearch(query, resultsCount) {
    try {
      await analytics().logEvent('search', {
        search_term: query,
        results_count: resultsCount,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Search tracked');
    } catch (error) {
      console.error('Track search error:', error);
    }
  }

  async trackShare(contentType, sharedWith) {
    try {
      await analytics().logEvent('share_content', {
        content_type: contentType,
        shared_with: sharedWith, // whatsapp, email, etc.
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Share tracked');
    } catch (error) {
      console.error('Track share error:', error);
    }
  }

  // Performance Tracking
  async startTrace(traceName) {
    try {
      const trace = await perf().startTrace(traceName);
      return trace;
    } catch (error) {
      console.error('Start trace error:', error);
      return null;
    }
  }

  async stopTrace(trace, metrics = {}) {
    try {
      if (trace) {
        // Add custom metrics
        Object.entries(metrics).forEach(([key, value]) => {
          trace.putMetric(key, value);
        });
        
        await trace.stop();
        console.log('✅ Trace stopped:', trace.traceName);
      }
    } catch (error) {
      console.error('Stop trace error:', error);
    }
  }

  async trackAppPerformance(operation, duration, success) {
    try {
      await analytics().logEvent('app_performance', {
        operation,
        duration_ms: duration,
        success,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ App performance tracked');
    } catch (error) {
      console.error('Track app performance error:', error);
    }
  }

  // Error Tracking
  async trackError(error, context = {}) {
    try {
      await crashlytics().recordError(error);
      
      await analytics().logEvent('app_error', {
        error_message: error.message,
        error_stack: error.stack,
        ...context,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Error tracked');
    } catch (trackingError) {
      console.error('Track error error:', trackingError);
    }
  }

  // Custom Analytics
  async sendToCustomAnalytics(eventName, data) {
    try {
      const apiService = APIService.getInstance();
      await apiService.trackEvent(eventName, data);
    } catch (error) {
      console.error('Send to custom analytics error:', error);
    }
  }

  // User Behavior Analysis
  async trackUserJourney(screenSequence) {
    try {
      await analytics().logEvent('user_journey', {
        screen_sequence: screenSequence.join(' > '),
        journey_length: screenSequence.length,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ User journey tracked');
    } catch (error) {
      console.error('Track user journey error:', error);
    }
  }

  async trackSessionStart() {
    try {
      await analytics().logEvent('session_start', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Track session start error:', error);
    }
  }

  async trackSessionEnd(sessionDuration) {
    try {
      await analytics().logEvent('session_end', {
        session_duration_seconds: sessionDuration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Track session end error:', error);
    }
  }

  // Funnel Analysis
  async trackFunnelStep(funnelName, stepName, stepNumber) {
    try {
      await analytics().logEvent('funnel_step', {
        funnel_name: funnelName,
        step_name: stepName,
        step_number: stepNumber,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`✅ Funnel step tracked: ${funnelName} - ${stepName}`);
    } catch (error) {
      console.error('Track funnel step error:', error);
    }
  }

  // A/B Testing
  async trackABTest(testName, variant) {
    try {
      await analytics().logEvent('ab_test', {
        test_name: testName,
        variant,
        timestamp: new Date().toISOString(),
      });
      
      await analytics().setUserProperty(`ab_test_${testName}`, variant);
      
      console.log(`✅ A/B test tracked: ${testName} - ${variant}`);
    } catch (error) {
      console.error('Track A/B test error:', error);
    }
  }

  // Cohort Analysis
  async trackCohortEntry(cohortType, cohortValue) {
    try {
      await analytics().setUserProperty(`cohort_${cohortType}`, cohortValue);
      
      await analytics().logEvent('cohort_entry', {
        cohort_type: cohortType,
        cohort_value: cohortValue,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`✅ Cohort entry tracked: ${cohortType} - ${cohortValue}`);
    } catch (error) {
      console.error('Track cohort entry error:', error);
    }
  }

  // Real-time Analytics
  async trackRealTimeEvent(eventName, data) {
    try {
      // Send to custom real-time analytics
      const apiService = APIService.getInstance();
      await apiService.trackRealTimeEvent(eventName, data);
      
      console.log(`✅ Real-time event tracked: ${eventName}`);
    } catch (error) {
      console.error('Track real-time event error:', error);
    }
  }
}

export default AnalyticsService;