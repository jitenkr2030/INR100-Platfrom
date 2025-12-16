/**
 * Root Navigation for INR100 Mobile App
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Icon Library
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import AuthNavigator from './AuthNavigator';
import DashboardScreen from '../screens/DashboardScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import InvestScreen from '../screens/InvestScreen';
import RealTradingScreen from '../screens/RealTradingScreen';
import BrokerSetupScreen from '../screens/BrokerSetupScreen';
import AIFeaturesScreen from '../screens/AIFeaturesScreen';
import LearnScreen from '../screens/LearnScreen';
import CommunityScreen from '../screens/CommunityScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Custom Components
import CustomDrawer from '../components/navigation/CustomDrawer';
import { Colors } from '../styles/GlobalStyles';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Portfolio':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Invest':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'AI':
              iconName = focused ? 'brain' : 'brain-outline';
              break;
            case 'Learn':
              iconName = focused ? 'book' : 'book-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray200,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Portfolio" 
        component={PortfolioScreen}
      />
      <Tab.Screen 
        name="Invest" 
        component={InvestScreen}
        options={{ tabBarLabel: 'Trade' }}
      />
      <Tab.Screen 
        name="AI" 
        component={AIFeaturesScreen}
        options={{ tabBarLabel: 'AI Features' }}
      />
      <Tab.Screen 
        name="Learn" 
        component={LearnScreen}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator with Drawer
const MainStackNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={CustomDrawer}
      screenOptions={{
        drawerActiveBackgroundColor: Colors.primaryLight,
        drawerActiveTintColor: Colors.white,
        drawerInactiveTintColor: Colors.gray600,
        drawerStyle: {
          backgroundColor: Colors.white,
          width: 280,
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          drawerLabel: 'Wallet',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          drawerLabel: 'Community',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="BrokerSetup" 
        component={BrokerSetupScreen}
        options={{
          drawerLabel: 'Broker Setup',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="RealTrading" 
        component={RealTradingScreen}
        options={{
          drawerLabel: 'Real Trading',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Dashboard" component={MainStackNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;