/**
 * Global Colors and Styles for INR100 Mobile App
 */

import { StyleSheet, Platform } from 'react-native';

// Primary Colors
export const Colors = {
  primary: '#2563eb', // Blue
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',
  
  secondary: '#059669', // Green
  secondaryDark: '#047857',
  secondaryLight: '#10b981',
  
  accent: '#f59e0b', // Orange
  accentDark: '#d97706',
  accentLight: '#fbbf24',
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Gray Scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Financial Colors
  profit: '#059669',
  loss: '#dc2626',
  neutral: '#6b7280',
  
  // Background Colors
  background: '#f9fafb',
  cardBackground: '#ffffff',
  modalBackground: 'rgba(0, 0, 0, 0.5)',
};

// Typography
export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  sm: {
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  md: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  lg: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
};

// Global Styles
export const GlobalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadows.sm,
  },
  
  // Text Styles
  heading1: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  
  heading2: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  
  heading3: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  
  bodyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray700,
    lineHeight: Typography.lineHeight.normal,
  },
  
  caption: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray500,
  },
  
  // Button Styles
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  
  // Input Styles
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    backgroundColor: Colors.white,
  },
  
  // Flexbox Styles
  row: {
    flexDirection: 'row',
  },
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  justifyCenter: {
    justifyContent: 'center',
  },
  
  justifyBetween: {
    justifyContent: 'space-between',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  // Spacing Helpers
  mb: {
    marginBottom: Spacing.md,
  },
  
  mt: {
    marginTop: Spacing.md,
  },
  
  ml: {
    marginLeft: Spacing.md,
  },
  
  mr: {
    marginRight: Spacing.md,
  },
  
  p: {
    padding: Spacing.md,
  },
  
  px: {
    paddingHorizontal: Spacing.md,
  },
  
  py: {
    paddingVertical: Spacing.md,
  },
  
  // Financial Specific Styles
  profitText: {
    color: Colors.profit,
    fontWeight: '600',
  },
  
  lossText: {
    color: Colors.loss,
    fontWeight: '600',
  },
  
  neutralText: {
    color: Colors.neutral,
    fontWeight: '600',
  },
  
  // Status Styles
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  
  successBadge: {
    backgroundColor: `${Colors.success}20`,
    color: Colors.success,
  },
  
  warningBadge: {
    backgroundColor: `${Colors.warning}20`,
    color: Colors.warning,
  },
  
  errorBadge: {
    backgroundColor: `${Colors.error}20`,
    color: Colors.error,
  },
});

// Theme exports
export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  styles: GlobalStyles,
};

export default GlobalStyles;