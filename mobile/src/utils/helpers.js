/**
 * Utility Functions for INR100 Mobile App
 * Common helper functions and constants
 */

import { Alert, Linking, Platform, Share } from 'react-native';
import Toast from 'react-native-root-toast';
import moment from 'moment';

// Color and formatting utilities
export const formatCurrency = (amount, showSymbol = true) => {
  const symbol = showSymbol ? '₹' : '';
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPercentage = (percentage, showSign = true) => {
  const sign = showSign && percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
};

export const formatDate = (date, format = 'MMM DD, YYYY') => {
  return moment(date).format(format);
};

export const formatTime = (date) => {
  return moment(date).fromNow();
};

export const formatNumber = (number, decimals = 2) => {
  return number.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const isValidPAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const isValidAadhaar = (aadhaar) => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar);
};

// String utilities
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Array utilities
export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const sortBy = (array, key, ascending = true) => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (ascending) {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
};

// Number utilities
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const roundToDecimal = (number, decimals = 2) => {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const generateRandomId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Date utilities
export const isToday = (date) => {
  return moment(date).isSame(moment(), 'day');
};

export const isYesterday = (date) => {
  return moment(date).isSame(moment().subtract(1, 'day'), 'day');
};

export const getDaysInMonth = (year, month) => {
  return moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
};

// URL utilities
export const openURL = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      showToast('Cannot open URL', 'error');
      return false;
    }
  } catch (error) {
    console.error('Open URL error:', error);
    showToast('Failed to open URL', 'error');
    return false;
  }
};

export const makePhoneCall = (phoneNumber) => {
  const url = `tel:${phoneNumber}`;
  return openURL(url);
};

export const sendEmail = (to, subject = '', body = '') => {
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return openURL(url);
};

// Share utilities
export const shareContent = async (content, url = null) => {
  try {
    const shareOptions = {
      message: content,
      url: url,
    };

    await Share.share(shareOptions);
    return true;
  } catch (error) {
    console.error('Share content error:', error);
    showToast('Failed to share content', 'error');
    return false;
  }
};

export const shareApp = async () => {
  const appStoreUrl = Platform.OS === 'ios' 
    ? 'https://apps.apple.com/app/inr100' 
    : 'https://play.google.com/store/apps/details?id=com.inr100.mobile';
    
  const shareText = 'Check out INR100 - Start investing with just ₹100! Download the app: ';
  return await shareContent(shareText, appStoreUrl);
};

// Toast utilities
export const showToast = (message, type = 'info', duration = 3000) => {
  const toastOptions = {
    duration,
    position: Toast.positions.TOP,
    animation: true,
    hideOnPress: true,
    delay: 0,
  };

  switch (type) {
    case 'success':
      Toast.show(message, { ...toastOptions, backgroundColor: '#10b981' });
      break;
    case 'error':
      Toast.show(message, { ...toastOptions, backgroundColor: '#ef4444' });
      break;
    case 'warning':
      Toast.show(message, { ...toastOptions, backgroundColor: '#f59e0b' });
      break;
    default:
      Toast.show(message, toastOptions);
  }
};

export const showAlert = (title, message, buttons = null) => {
  const defaultButtons = [{ text: 'OK', style: 'default' }];
  Alert.alert(title, message, buttons || defaultButtons);
};

// File utilities
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Animation utilities
export const createFadeAnimation = (fadeAnim, toValue = 1, duration = 300) => {
  return new Promise((resolve) => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(resolve);
  });
};

export const createSlideAnimation = (slideAnim, toValue = 0, duration = 300) => {
  return new Promise((resolve) => {
    slideAnim.setValue(50);
    Animated.timing(slideAnim, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(resolve);
  });
};

// Storage utilities
export const getFromStorage = async (key, defaultValue = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Get from storage error:', error);
    return defaultValue;
  }
};

export const saveToStorage = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Save to storage error:', error);
    return false;
  }
};

export const removeFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Remove from storage error:', error);
    return false;
  }
};

// Network utilities
export const isOnline = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Device utilities
export const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isTablet: width >= 768,
    screenWidth: width,
    screenHeight: height,
  };
};

// Color utilities
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getStatusBarColor = (backgroundColor) => {
  // Simple algorithm to determine if status bar should be light or dark
  const rgb = parseInt(backgroundColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  // Calculate luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  return luminance > 186 ? 'dark-content' : 'light-content';
};

// Constants
export const SCREEN_DIMENSIONS = {
  width,
  height,
};

export const API_ENDPOINTS = {
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
};

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  userInfo: 'user_info',
  preferences: 'user_preferences',
  onboarding: 'onboarding_completed',
};

export const VALIDATION_RULES = {
  email: isValidEmail,
  phone: isValidPhone,
  pan: isValidPAN,
  aadhaar: isValidAadhaar,
};

export const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#059669',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const NOTIFICATION_TYPES = {
  portfolio: 'portfolio_update',
  price: 'price_alert',
  kyc: 'kyc_status',
  order: 'order_executed',
  payment: 'payment_success',
  learning: 'learning_reminder',
  social: 'social_activity',
};