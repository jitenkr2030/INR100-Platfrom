/**
 * Portfolio Screen for INR100 Mobile App
 * Shows detailed portfolio breakdown, holdings, and performance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PieChart, LineChart } from 'react-native-chart-kit';

// Services
import APIService from '../../services/APIService';
import AnalyticsService from '../../services/AnalyticsService';
import OfflineStorageService from '../../services/OfflineStorageService';

// Styles
import { Colors, Typography, Spacing, BorderRadius, GlobalStyles } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

const PortfolioScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioData, setPortfolioData] = useState({
    overview: null,
    holdings: [],
    performance: null,
    allocation: [],
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  useEffect(() => {
    loadPortfolioData();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Portfolio', 'PortfolioScreen');
    
    // Setup refresh on focus
    const unsubscribe = navigation.addListener('focus', () => {
      refreshPortfolioData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Try to get cached data first
      const cachedPortfolio = await OfflineStorageService.getInstance().getCachedPortfolio();
      if (cachedPortfolio) {
        setPortfolioData(prev => ({ ...prev, overview: cachedPortfolio }));
      }

      // Load fresh data
      await fetchPortfolioData();
      
    } catch (error) {
      console.error('Load portfolio data error:', error);
      Alert.alert('Error', 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioData = async () => {
    try {
      const apiService = APIService.getInstance();
      
      // Fetch portfolio overview
      const overviewResult = await apiService.getPortfolio();
      if (overviewResult.success) {
        setPortfolioData(prev => ({ ...prev, overview: overviewResult.data }));
        await OfflineStorageService.getInstance().cachePortfolio(overviewResult.data);
      }

      // Fetch holdings
      const holdingsResult = await apiService.getPortfolioHoldings();
      if (holdingsResult.success) {
        setPortfolioData(prev => ({ ...prev, holdings: holdingsResult.data }));
      }

      // Fetch performance data
      const performanceResult = await apiService.getPortfolioPerformance(selectedTimeframe);
      if (performanceResult.success) {
        setPortfolioData(prev => ({ ...prev, performance: performanceResult.data }));
      }

      // Generate allocation data from holdings
      if (holdingsResult.success) {
        const allocation = generateAllocationData(holdingsResult.data);
        setPortfolioData(prev => ({ ...prev, allocation }));
      }

    } catch (error) {
      console.error('Fetch portfolio data error:', error);
    }
  };

  const refreshPortfolioData = async () => {
    setRefreshing(true);
    await fetchPortfolioData();
    setRefreshing(false);
  };

  const generateAllocationData = (holdings) => {
    const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
    
    return holdings.map(holding => ({
      name: holding.asset.symbol,
      value: holding.totalValue,
      color: getRandomColor(),
      legendFontColor: Colors.gray700,
      legendFontSize: 12,
    })).map(item => ({
      ...item,
      percentage: ((item.value / totalValue) * 100).toFixed(1),
    }));
  };

  const getRandomColor = () => {
    const colors = [Colors.primary, Colors.secondary, Colors.accent, Colors.info, Colors.success];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const renderHeader = () => {
    const overview = portfolioData.overview;
    if (!overview) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Portfolio</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshPortfolioData}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={Colors.white} 
              style={{ transform: [{ rotate: refreshing ? '360deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.totalValue}>
          <Text style={styles.totalValueLabel}>Total Value</Text>
          <Text style={styles.totalValueAmount}>
            {formatCurrency(overview.totalValue)}
          </Text>
          <View style={styles.totalChange}>
            <Text style={[
              styles.totalChangeText,
              overview.returns >= 0 ? styles.profitText : styles.lossText
            ]}>
              {overview.returns >= 0 ? '+' : ''}{formatCurrency(overview.returns)}
            </Text>
            <Text style={[
              styles.totalChangePercent,
              overview.returnsPercent >= 0 ? styles.profitText : styles.lossText
            ]}>
              ({formatPercentage(overview.returnsPercent)})
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Invested</Text>
            <Text style={styles.statValue}>{formatCurrency(overview.totalInvested)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today's P&L</Text>
            <Text style={[
              styles.statValue,
              overview.todayChange >= 0 ? styles.profitText : styles.lossText
            ]}>
              {overview.todayChange >= 0 ? '+' : ''}{formatCurrency(overview.todayChange)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Holdings</Text>
            <Text style={styles.statValue}>{overview.holdingsCount}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPerformanceChart = () => {
    const performance = portfolioData.performance;
    if (!performance) return null;

    const chartData = {
      labels: performance.labels,
      datasets: [{
        data: performance.values,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 3,
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
        r: "6",
        strokeWidth: "2",
        stroke: Colors.primary,
      },
    };

    const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y'];
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.timeframeSelector}>
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive
                ]}
                onPress={() => {
                  setSelectedTimeframe(timeframe);
                  fetchPortfolioData();
                }}
              >
                <Text style={[
                  styles.timeframeButtonText,
                  selectedTimeframe === timeframe && styles.timeframeButtonTextActive
                ]}>
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={true}
          />
        </View>
      </View>
    );
  };

  const renderAllocation = () => {
    const allocation = portfolioData.allocation;
    if (!allocation || allocation.length === 0) return null;

    const chartConfig = {
      backgroundColor: 'transparent',
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asset Allocation</Text>
        <View style={styles.allocationContainer}>
          <PieChart
            data={allocation}
            width={width - 48}
            height={200}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
          />
        </View>
        <View style={styles.allocationLegend}>
          {allocation.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name} ({item.percentage}%)</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHoldings = () => {
    const holdings = portfolioData.holdings;
    if (!holdings || holdings.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        {holdings.map((holding, index) => (
          <TouchableOpacity
            key={index}
            style={styles.holdingItem}
            onPress={() => navigation.navigate('AssetDetail', { symbol: holding.asset.symbol })}
          >
            <View style={styles.holdingInfo}>
              <Text style={styles.holdingSymbol}>{holding.asset.symbol}</Text>
              <Text style={styles.holdingName}>{holding.asset.name}</Text>
              <Text style={styles.holdingQuantity}>{holding.quantity} shares</Text>
            </View>
            <View style={styles.holdingValues}>
              <Text style={styles.holdingCurrentValue}>
                {formatCurrency(holding.currentPrice)}
              </Text>
              <Text style={styles.holdingTotalValue}>
                {formatCurrency(holding.totalValue)}
              </Text>
              <Text style={[
                styles.holdingReturn,
                holding.returns >= 0 ? styles.profitText : styles.lossText
              ]}>
                {holding.returns >= 0 ? '+' : ''}{formatCurrency(holding.returns)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Invest')}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Buy More</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Ionicons name="wallet-outline" size={24} color={Colors.secondary} />
          <Text style={styles.actionButtonText}>Add Money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Ionicons name="time-outline" size={24} color={Colors.accent} />
          <Text style={styles.actionButtonText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Ionicons name="analytics-outline" size={24} color={Colors.info} />
          <Text style={styles.actionButtonText}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshPortfolioData} />
        }
      >
        {renderHeader()}
        {renderPerformanceChart()}
        {renderAllocation()}
        {renderHoldings()}
        {renderQuickActions()}
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
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.white,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  totalValue: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalValueLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
  },
  totalValueAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  totalChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalChangeText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  totalChangePercent: {
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
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
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  timeframeButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  timeframeButtonActive: {
    backgroundColor: Colors.primary,
  },
  timeframeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.gray600,
  },
  timeframeButtonTextActive: {
    color: Colors.white,
  },
  chartContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  chart: {
    borderRadius: BorderRadius.lg,
  },
  allocationContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  allocationLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray700,
  },
  holdingItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingSymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  holdingName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.xs,
  },
  holdingQuantity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
  },
  holdingValues: {
    alignItems: 'flex-end',
  },
  holdingCurrentValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  holdingTotalValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  holdingReturn: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.gray700,
    marginTop: Spacing.sm,
  },
  profitText: {
    color: Colors.profit,
  },
  lossText: {
    color: Colors.loss,
  },
});

export default PortfolioScreen;