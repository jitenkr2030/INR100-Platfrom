/**
 * Notification Service for INR100 Mobile App
 * Handles push notifications, local notifications, and real-time updates
 */

import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

class NotificationService {
  static instance = null;

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    try {
      // Configure push notifications
      PushNotification.configure({
        onRegister: (token) => {
          console.log('FCM Token:', token);
          this.registerToken(token);
        },
        onNotification: (notification) => {
          console.log('Notification received:', notification);
          this.handleNotification(notification);
        },
        onAction: (notification) => {
          console.log('Notification action:', notification.action);
          this.handleNotificationAction(notification);
        },
        onRegistrationError: (err) => {
          console.error('Notification registration error:', err.message);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: Platform.OS === 'ios',
      });

      // Phase 4: Enhanced notification handling
      this.setupLearningReminders();
      this.setupStreakAlerts();

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'inr100-notifications',
            channelName: 'INR100 Notifications',
            channelDescription: 'Notifications for INR100 Mobile App',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          (created) => console.log(`Channel created: ${created}`)
        );
      }

      // Request permission for notifications
      await this.requestPermission();

      // Setup FCM messaging
      await this.setupFCM();

      console.log('✅ Notification Service initialized');
    } catch (error) {
      console.error('❌ Notification Service initialization error:', error);
    }
  }

  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async setupFCM() {
    try {
      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // Listen for token refresh
      messaging().onTokenRefresh((newToken) => {
        console.log('FCM Token refreshed:', newToken);
        this.registerToken(newToken);
      });

      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Background message:', remoteMessage);
        this.handleNotification(remoteMessage);
      });

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground message:', remoteMessage);
        this.handleNotification(remoteMessage);
      });

      // Handle notification opened from quit state
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log('Notification opened from quit state:', remoteMessage);
            this.handleNotification(remoteMessage);
          }
        });

      // Handle notification opened from background state
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('Notification opened from background:', remoteMessage);
        this.handleNotification(remoteMessage);
      });

    } catch (error) {
      console.error('FCM setup error:', error);
    }
  }

  async registerToken(token) {
    try {
      // Send token to backend
      const { APIService } = await import('./APIService');
      await APIService.registerFCMToken(token);
    } catch (error) {
      console.error('Token registration error:', error);
    }
  }

  handleNotification(notification) {
    try {
      const { data, title, body, userInteraction } = notification;

      // Handle specific notification types
      if (data?.type) {
        switch (data.type) {
          case 'portfolio_update':
            this.handlePortfolioUpdate(data);
            break;
          case 'price_alert':
            this.handlePriceAlert(data);
            break;
          case 'kyc_status':
            this.handleKYCStatus(data);
            break;
          case 'order_executed':
            this.handleOrderExecuted(data);
            break;
          case 'payment_success':
            this.handlePaymentSuccess(data);
            break;
          case 'learning_reminder':
            this.handleLearningReminder(data);
            break;
          case 'social_activity':
            this.handleSocialActivity(data);
            break;
          default:
            console.log('Unknown notification type:', data.type);
        }
      }

      // Show local notification
      if (!userInteraction) {
        this.showLocalNotification(title, body, data);
      }
    } catch (error) {
      console.error('Notification handling error:', error);
    }
  }

  handlePortfolioUpdate(data) {
    console.log('Portfolio update:', data);
    // Update portfolio data in store
    // Navigate to portfolio screen if app is open
  }

  handlePriceAlert(data) {
    console.log('Price alert:', data);
    // Show price alert
    PushNotification.localNotification({
      title: 'Price Alert!',
      message: `${data.symbol} reached ₹${data.targetPrice}`,
      channelId: 'inr100-notifications',
    });
  }

  handleKYCStatus(data) {
    console.log('KYC status:', data);
    PushNotification.localNotification({
      title: 'KYC Status Update',
      message: data.status === 'approved' ? 'Your KYC has been approved!' : 'KYC verification pending',
      channelId: 'inr100-notifications',
    });
  }

  handleOrderExecuted(data) {
    console.log('Order executed:', data);
    PushNotification.localNotification({
      title: 'Order Executed!',
      message: `Your ${data.orderType} order for ${data.symbol} has been executed`,
      channelId: 'inr100-notifications',
    });
  }

  handlePaymentSuccess(data) {
    console.log('Payment success:', data);
    PushNotification.localNotification({
      title: 'Payment Successful!',
      message: `₹${data.amount} has been added to your wallet`,
      channelId: 'inr100-notifications',
    });
  }

  handleLearningReminder(data) {
    console.log('Learning reminder:', data);
    PushNotification.localNotification({
      title: 'Time to Learn!',
      message: 'Complete your daily learning goal to earn XP',
      channelId: 'inr100-notifications',
    });
  }

  handleSocialActivity(data) {
    console.log('Social activity:', data);
    PushNotification.localNotification({
      title: 'New Activity',
      message: data.message,
      channelId: 'inr100-notifications',
    });
  }

  showLocalNotification(title, message, data = {}) {
    PushNotification.localNotification({
      title,
      message,
      channelId: 'inr100-notifications',
      userInfo: data,
      playSound: true,
      soundName: 'default',
    });
  }

  // Schedule notifications
  scheduleLearningReminder() {
    PushNotification.localNotificationSchedule({
      title: 'Learning Reminder',
      message: 'Complete your daily learning goal to earn XP and badges!',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      channelId: 'inr100-notifications',
      repeatType: 'day',
    });
  }

  schedulePriceAlerts(alerts) {
    alerts.forEach((alert) => {
      PushNotification.localNotificationSchedule({
        title: 'Price Alert',
        message: `${alert.symbol} has reached ₹${alert.targetPrice}`,
        date: new Date(alert.scheduledTime),
        channelId: 'inr100-notifications',
        userInfo: { type: 'price_alert', ...alert },
      });
    });
  }

  // Cancel all notifications
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Cancel specific notification
  cancelNotification(id) {
    PushNotification.cancelLocalNotification(id);
  }

  // Get badge count
  async getBadgeCount() {
    if (Platform.OS === 'ios') {
      return await PushNotificationIOS.getApplicationIconBadgeNumber();
    }
    return 0;
  }

  // Set badge count
  async setBadgeCount(count) {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setApplicationIconBadgeNumber(count);
    }
  }

  // ========================================
  // PHASE 4: ADVANCED NOTIFICATION FEATURES
  // ========================================

  // Setup learning reminders
  async setupLearningReminders() {
    // Schedule daily learning reminders
    PushNotification.localNotificationSchedule({
      message: 'Time for your daily learning session! 📚',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      repeatType: 'day',
      actions: ['Start Learning', 'Snooze'],
      userInfo: {
        type: 'LEARNING_REMINDER',
        priority: 'HIGH'
      }
    });

    // Schedule streak maintenance reminders
    PushNotification.localNotificationSchedule({
      message: 'Don\'t break your learning streak! 🔥',
      date: new Date(Date.now() + 20 * 60 * 60 * 1000), // 8 PM today
      repeatType: 'day',
      actions: ['Continue Learning', 'Remind Later'],
      userInfo: {
        type: 'STREAK_ALERT',
        priority: 'HIGH'
      }
    });
  }

  // Setup streak alerts
  async setupStreakAlerts() {
    // Weekly streak achievement notification
    PushNotification.localNotificationSchedule({
      message: '🎉 Amazing! You\'ve maintained your learning streak for a week!',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      repeatType: 'week',
      actions: ['View Achievements', 'Share Success'],
      userInfo: {
        type: 'STREAK_ACHIEVEMENT',
        priority: 'HIGH'
      }
    });
  }

  // Handle notification actions (Phase 4)
  async handleNotificationAction(notification) {
    const { action, userInfo } = notification;
    
    switch (action) {
      case 'Start Learning':
        // Navigate to learning screen
        this.navigateToScreen('Learn');
        break;
      case 'Continue Learning':
        // Continue current learning session
        this.continueLearning();
        break;
      case 'View Achievements':
        // Navigate to achievements screen
        this.navigateToScreen('Achievements');
        break;
      case 'Share Success':
        // Open sharing modal
        this.shareSuccess();
        break;
      case 'Remind Later':
        // Schedule reminder for later
        this.scheduleReminderLater(userInfo.type);
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  // Navigate to specific screen
  navigateToScreen(screenName) {
    // This would integrate with your navigation system
    console.log(`Navigating to ${screenName}`);
    // Implementation would depend on your navigation library
  }

  // Continue learning session
  continueLearning() {
    // Resume or start a new learning session
    console.log('Continuing learning session');
    // Implementation would integrate with learning state management
  }

  // Share success on social media
  shareSuccess() {
    // Open native sharing dialog
    console.log('Sharing learning success');
    // Implementation would use react-native-share or similar
  }

  // Schedule reminder for later
  scheduleReminderLater(type) {
    const delayMap = {
      'STREAK_ALERT': 2 * 60 * 60 * 1000, // 2 hours
      'LEARNING_REMINDER': 4 * 60 * 60 * 1000, // 4 hours
    };

    const delay = delayMap[type] || 60 * 60 * 1000; // Default 1 hour

    PushNotification.localNotificationSchedule({
      message: 'Learning reminder - Don\'t forget! 📖',
      date: new Date(Date.now() + delay),
      userInfo: { type, isReminder: true }
    });
  }

  // Send learning milestone notification
  async sendLearningMilestoneNotification(milestone) {
    PushNotification.localNotification({
      message: `🎯 ${milestone.title}`,
      subText: milestone.description,
      bigPictureUrl: milestone.imageUrl,
      actions: ['View Details', 'Share'],
      userInfo: {
        type: 'ACHIEVEMENT',
        milestoneId: milestone.id
      }
    });
  }

  // Send certificate ready notification
  async sendCertificateNotification(courseTitle) {
    PushNotification.localNotification({
      message: `🎓 Certificate Ready!`,
      subText: `Congratulations! Your ${courseTitle} certificate is ready for download.`,
      actions: ['Download', 'Share'],
      userInfo: {
        type: 'CERTIFICATE_READY',
        courseTitle
      }
    });
  }

  // Send expert session notification
  async sendExpertSessionNotification(session) {
    PushNotification.localNotification({
      message: `🔴 Live: ${session.title}`,
      subText: `${session.expertName} is hosting a session now`,
      ongoing: true,
      actions: ['Join Now', 'Set Reminder'],
      userInfo: {
        type: 'EXPERT_SESSION',
        sessionId: session.id
      }
    });
  }

  // Send push notification to server (for remote notifications)
  async sendNotificationToServer(notificationData) {
    try {
      const response = await fetch('/api/mobile/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification to server');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification to server:', error);
      throw error;
    }
  }

  // Mark notification as read on server
  async markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`/api/mobile/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

export default NotificationService;