/**
 * Dashboard Screen for INR100 Mobile App
 * Main screen showing portfolio overview, market data, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';

// Services
import APIService from '../../services/APIService';
import AnalyticsService from '../../services/AnalyticsService';
import OfflineStorageService from '../../services/OfflineStorageService';

// Styles
import { Colors, Typography, Spacing, BorderRadius, GlobalStyles } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    portfolio: null,
    marketData: [],
    userStats: null,
    recentTransactions: [],
    topHoldings: [],
  });

  useEffect(() => {
    loadDashboardData();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Dashboard', 'DashboardScreen');
    
    // Setup refresh on focus
    const unsubscribe = navigation.addListener('focus', () => {
      refreshDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to get cached data first for faster loading
      const cachedPortfolio = await OfflineStorageService.getInstance().getCachedPortfolio();
      const cachedMarketData = await OfflineStorageService.getInstance().getCachedMarketData();
      
      if (cachedPortfolio) {
        setDashboardData(prev => ({ ...prev, portfolio: cachedPortfolio }));
      }
      
      if (cachedMarketData) {
        setDashboardData(prev => ({ ...prev, marketData: cachedMarketData }));
      }

      // Load fresh data from API
      await fetchDashboardData();
      
    } catch (error) {
      console.error('Load dashboard data error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const apiService = APIService.getInstance();
      
      // Fetch portfolio data
      const portfolioResult = await apiService.getPortfolio();
      if (portfolioResult.success) {
        setDashboardData(prev => ({ ...prev, portfolio: portfolioResult.data }));
        await OfflineStorageService.getInstance().cachePortfolio(portfolioResult.data);
      }

      // Fetch market data
      const marketResult = await apiService.getMarketData();
      if (marketResult.success) {
        setDashboardData(prev => ({ ...prev, marketData: marketResult.data }));
        await OfflineStorageService.getInstance().cacheMarketData(marketResult.data);
      }

      // Fetch user stats
      const statsResult = await apiService.getUserStats();
      if (statsResult.success) {
        setDashboardData(prev => ({ ...prev, userStats: statsResult.data }));
      }

      // Fetch transactions
      const transactionsResult = await apiService.getTransactions();
      if (transactionsResult.success) {
        const recentTransactions = transactionsResult.data.slice(0, 5);
        setDashboardData(prev => ({ ...prev, recentTransactions }));
      }

    } catch (error) {
      console.error('Fetch dashboard data error:', error);
    }
  };

  const refreshDashboardData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const renderHeader = () => {
    const portfolio = dashboardData.portfolio;
    
    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning!</Text>
            <Text style={styles.userName}>Welcome back</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {portfolio && (
          <View style={styles.portfolioSummary}>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>
              {formatCurrency(portfolio.totalValue)}
            </Text>
            <View style={styles.portfolioChange}>
              <Text style={[
                styles.portfolioChangeText,
                portfolio.returns >= 0 ? styles.profitText : styles.lossText
              ]}>
                {portfolio.returns >= 0 ? '+' : ''}{formatCurrency(portfolio.returns)}
              </Text>
              <Text style={[
                styles.portfolioChangePercent,
                portfolio.returnsPercent >= 0 ? styles.profitText : styles.lossText
              ]}>
                ({formatPercentage(portfolio.returnsPercent)})
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Invest')}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${Colors.primary}20` }]}>
            <Ionicons name="trending-up" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Invest</Text>
          <Text style={styles.actionSubtitle}>Start investing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Wallet')}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${Colors.secondary}20` }]}>
            <Ionicons name="wallet" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.actionTitle}>Wallet</Text>
          <Text style={styles.actionSubtitle}>Add money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Learn')}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${Colors.accent}20` }]}>
            <Ionicons name="book" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.actionTitle}>Learn</Text>
          <Text style={styles.actionSubtitle}>Continue learning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Portfolio')}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${Colors.info}20` }]}>
            <Ionicons name="briefcase" size={24} color={Colors.info} />
          </View>
          <Text style={styles.actionTitle}>Portfolio</Text>
          <Text style={styles.actionSubtitle}>View details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMarketOverview = () => {
    const marketData = dashboardData.marketData.slice(0, 4);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Market')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {marketData.map((item, index) => (
            <View key={index} style={styles.marketCard}>
              <Text style={styles.marketSymbol}>{item.symbol}</Text>
              <Text style={styles.marketName}>{item.name}</Text>
              <Text style={styles.marketPrice}>{formatCurrency(item.currentPrice)}</Text>
              <Text style={[
                styles.marketChange,
                item.changePercent >= 0 ? styles.profitText : styles.lossText
              ]}>
                {formatPercentage(item.changePercent)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPerformanceChart = () => {
    const portfolio = dashboardData.portfolio;
    if (!portfolio?.performanceData) return null;

    const chartData = {
      labels: portfolio.performanceData.labels,
      datasets: [{
        data: portfolio.performanceData.values,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 2,
      }]
    };

    const chartConfig = {
      backgroundColor: Colors.white,
      backgroundGradientFrom: Colors.white,
      backgroundGradientTo: Colors.white,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
      style: {
        borderRadius: BorderRadius.lg,
      },
      propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: Colors.primary,
      },
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>
    );
  };

  const renderRecentTransactions = () => {
    const transactions = dashboardData.recentTransactions;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {transactions.map((transaction, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons 
                name={transaction.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'} 
                size={20} 
                color={transaction.type === 'DEPOSIT' ? Colors.secondary : Colors.error} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              transaction.type === 'DEPOSIT' ? styles.profitText : styles.lossText
            ]}>
              {transaction.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(transaction.amount)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshDashboardData} />
        }
      >
        {renderHeader()}
        {renderQuickActions()}
        {renderMarketOverview()}
        {renderPerformanceChart()}
        {renderRecentTransactions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray600,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontWeight: '500',
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.white,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  portfolioSummary: {
    alignItems: 'center',
  },
  portfolioLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
  },
  portfolioValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioChangeText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  portfolioChangePercent: {
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.gray900,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  marketCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 120,
    alignItems: 'center',
  },
  marketSymbol: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  marketName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  marketPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  marketChange: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  chart: {
    borderRadius: BorderRadius.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  profitText: {
    color: Colors.profit,
  },
  lossText: {
    color: Colors.loss,
  },
});

export default DashboardScreen;