/**
 * Custom Drawer Component for INR100 Mobile App
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Services
import { AuthService } from '../services/AuthService';
import { Colors, Typography, Spacing, GlobalStyles } from '../styles/GlobalStyles';

const CustomDrawer = (props) => {
  const userInfo = AuthService.getCurrentUser();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'home-outline',
      route: 'Main',
    },
    {
      label: 'Portfolio',
      icon: 'briefcase-outline',
      route: 'Portfolio',
    },
    {
      label: 'Invest',
      icon: 'trending-up-outline',
      route: 'Invest',
    },
    {
      label: 'Market',
      icon: 'stats-chart-outline',
      route: 'Market',
    },
    {
      label: 'Wallet',
      icon: 'wallet-outline',
      route: 'Wallet',
    },
    {
      label: 'Learn',
      icon: 'book-outline',
      route: 'Learn',
    },
    {
      label: 'Community',
      icon: 'people-outline',
      route: 'Community',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            props.navigation.navigate('Auth');
          },
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: userInfo?.avatar || 'https://via.placeholder.com/80x80',
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarIcon}>
            <Ionicons name="camera" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{userInfo?.name || 'User Name'}</Text>
        <Text style={styles.userEmail}>{userInfo?.email || 'user@email.com'}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹25,000</Text>
            <Text style={styles.statLabel}>Portfolio Value</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Level 5</Text>
            <Text style={styles.statLabel}>Investor Level</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <DrawerItem
            key={index}
            label={item.label}
            icon={({ color, size }) => (
              <Ionicons name={item.icon} size={size} color={color} />
            )}
            onPress={() => props.navigation.navigate(item.route)}
            labelStyle={styles.menuLabel}
            style={styles.menuItem}
          />
        ))}
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <DrawerItem
          label="Settings"
          icon={({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Profile')}
          labelStyle={styles.menuLabel}
          style={styles.menuItem}
        />
        <DrawerItem
          label="Help & Support"
          icon={({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          )}
          onPress={() => {
            // Navigate to support
          }}
          labelStyle={styles.menuLabel}
          style={styles.menuItem}
        />
        <DrawerItem
          label="About"
          icon={({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          )}
          onPress={() => {
            // Navigate to about
          }}
          labelStyle={styles.menuLabel}
          style={styles.menuItem}
        />
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray300,
  },
  menuSection: {
    marginTop: Spacing.md,
  },
  settingsSection: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.md,
  },
  menuItem: {
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 1,
  },
  menuLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray700,
  },
  logoutSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${Colors.error}10`,
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    color: Colors.error,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
});

export default CustomDrawer;