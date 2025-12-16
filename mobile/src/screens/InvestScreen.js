/**
 * Investment Screen for INR100 Mobile App
 * Asset investment interface with multi-asset support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';

// Services
import APIService from '../../services/APIService';
import AnalyticsService from '../../services/AnalyticsService';
import BiometricService from '../../services/BiometricService';

// Styles
import { Colors, Typography, Spacing, BorderRadius, GlobalStyles } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

const InvestScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assets, setAssets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [tradingMode, setTradingMode] = useState('paper'); // 'paper' or 'real'
  const [hasBrokerConnection, setHasBrokerConnection] = useState(false);

  const categories = [
    { id: 'ALL', name: 'All Assets', icon: 'grid-outline' },
    { id: 'STOCK', name: 'Stocks', icon: 'trending-up-outline' },
    { id: 'MUTUAL_FUND', name: 'Mutual Funds', icon: 'pie-chart-outline' },
    { id: 'GOLD', name: 'Gold', icon: 'cash-outline' },
    { id: 'GLOBAL', name: 'Global', icon: 'globe-outline' },
    { id: 'ETF', name: 'ETFs', icon: 'bar-chart-outline' },
  ];

  useEffect(() => {
    loadAssets();
    checkBrokerConnection();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Invest', 'InvestScreen');
  }, []);

  const checkBrokerConnection = async () => {
    try {
      const BrokerIntegrationService = require('../../services/BrokerIntegrationService').BrokerIntegrationService;
      const activeBroker = BrokerIntegrationService.getActiveBroker();
      setHasBrokerConnection(!!activeBroker);
    } catch (error) {
      console.error('Error checking broker connection:', error);
      setHasBrokerConnection(false);
    }
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      const apiService = APIService.getInstance();
      const result = await apiService.getAssets();
      
      if (result.success) {
        setAssets(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Load assets error:', error);
      Alert.alert('Error', 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const refreshAssets = async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'ALL' || asset.type === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (percentage) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const handleInvest = async (asset) => {
    if (!investmentAmount || parseFloat(investmentAmount) < 100) {
      Alert.alert('Error', 'Minimum investment amount is ₹100');
      return;
    }

    // Check if biometric authentication is needed for high amounts
    const amount = parseFloat(investmentAmount);
    if (amount > 10000) {
      const biometricResult = await BiometricService.getInstance().authenticateForTransaction(
        'Authenticate to complete investment'
      );
      
      if (!biometricResult.success) {
        Alert.alert('Authentication Failed', 'Investment cancelled');
        return;
      }
    }

    try {
      const apiService = APIService.getInstance();
      const orderData = {
        assetId: asset.id,
        symbol: asset.symbol,
        amount: amount,
        type: 'MARKET',
        side: 'BUY',
        assetType: asset.type,
      };

      const result = await apiService.placeOrder(orderData);

      if (result.success) {
        // Track investment
        await AnalyticsService.getInstance().trackInvestmentComplete(orderData);
        
        Alert.alert(
          'Investment Successful! 🎉',
          `You have invested ₹${amount} in ${asset.symbol}`,
          [
            {
              text: 'View Portfolio',
              onPress: () => navigation.navigate('Portfolio'),
            },
            {
              text: 'Continue Investing',
              onPress: () => {
                setInvestmentAmount('');
                setSelectedAsset(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Investment Failed', result.error);
      }
    } catch (error) {
      console.error('Investment error:', error);
      Alert.alert('Error', 'Investment failed. Please try again.');
    }
  };

  const renderCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Ionicons
            name={category.icon}
            size={20}
            color={selectedCategory === category.id ? Colors.white : Colors.gray600}
          />
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={20} color={Colors.gray400} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search stocks, funds, or assets..."
        placeholderTextColor={Colors.gray400}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle-outline" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderInvestmentAmount = () => (
    <View style={styles.investmentContainer}>
      <Text style={styles.investmentLabel}>Investment Amount</Text>
      <View style={styles.amountInputContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="100"
          placeholderTextColor={Colors.gray400}
          value={investmentAmount}
          onChangeText={setInvestmentAmount}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.quickAmounts}>
        {[100, 500, 1000, 2000, 5000].map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.quickAmountButton}
            onPress={() => setInvestmentAmount(amount.toString())}
          >
            <Text style={styles.quickAmountText}>₹{amount}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.minimumText}>Minimum investment: ₹100</Text>
    </View>
  );

  const renderAssetCard = (asset) => (
    <TouchableOpacity
      key={asset.id}
      style={styles.assetCard}
      onPress={() => setSelectedAsset(asset)}
    >
      <View style={styles.assetHeader}>
        <View>
          <Text style={styles.assetSymbol}>{asset.symbol}</Text>
          <Text style={styles.assetName}>{asset.name}</Text>
          <Text style={styles.assetCategory}>{asset.category}</Text>
        </View>
        <View style={styles.assetPrice}>
          <Text style={styles.currentPrice}>{formatCurrency(asset.currentPrice)}</Text>
          <Text style={[
            styles.priceChange,
            asset.changePercent >= 0 ? styles.profitText : styles.lossText
          ]}>
            {formatPercentage(asset.changePercent)}
          </Text>
        </View>
      </View>

      {asset.chartData && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: asset.chartData.labels,
              datasets: [{
                data: asset.chartData.values,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 2,
              }]
            }}
            width={width - 64}
            height={60}
            chartConfig={{
              backgroundColor: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              style: { borderRadius: BorderRadius.md },
            }}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
          />
        </View>
      )}

      <View style={styles.assetActions}>
        <TouchableOpacity
          style={styles.investButton}
          onPress={() => handleInvest(asset)}
        >
          <Text style={styles.investButtonText}>Invest ₹100</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedAssets = () => {
    const featuredAssets = assets.filter(asset => asset.featured).slice(0, 3);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Investments</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredAssets.map((asset) => (
            <View key={asset.id} style={styles.featuredCard}>
              <Text style={styles.featuredSymbol}>{asset.symbol}</Text>
              <Text style={styles.featuredName}>{asset.name}</Text>
              <Text style={styles.featuredPrice}>{formatCurrency(asset.currentPrice)}</Text>
              <Text style={[
                styles.featuredChange,
                asset.changePercent >= 0 ? styles.profitText : styles.lossText
              ]}>
                {formatPercentage(asset.changePercent)}
              </Text>
              <TouchableOpacity
                style={styles.featuredInvestButton}
                onPress={() => handleInvest(asset)}
              >
                <Text style={styles.featuredInvestButtonText}>Invest Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAssets} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invest</Text>
          <Text style={styles.headerSubtitle}>Start your wealth creation journey</Text>
        </View>

        {/* Trading Mode Selector */}
        <View style={styles.tradingModeContainer}>
          <Text style={styles.tradingModeTitle}>Trading Mode</Text>
          <View style={styles.tradingModeButtons}>
            <TouchableOpacity
              style={[
                styles.tradingModeButton,
                tradingMode === 'paper' && styles.activeTradingModeButton
              ]}
              onPress={() => setTradingMode('paper')}
            >
              <Ionicons 
                name="library-outline" 
                size={20} 
                color={tradingMode === 'paper' ? '#fff' : Colors.primary} 
              />
              <Text style={[
                styles.tradingModeButtonText,
                tradingMode === 'paper' && styles.activeTradingModeButtonText
              ]}>
                Paper Trading
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tradingModeButton,
                tradingMode === 'real' && styles.activeTradingModeButton,
                !hasBrokerConnection && styles.disabledTradingModeButton
              ]}
              onPress={() => {
                if (hasBrokerConnection) {
                  setTradingMode('real');
                } else {
                  Alert.alert(
                    'Broker Setup Required',
                    'Connect your broker account to start real money trading.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Setup Broker', 
                        onPress: () => navigation.navigate('BrokerSetup')
                      }
                    ]
                  );
                }
              }}
              disabled={!hasBrokerConnection}
            >
              <Ionicons 
                name="trending-up" 
                size={20} 
                color={tradingMode === 'real' && hasBrokerConnection ? '#fff' : Colors.gray400} 
              />
              <Text style={[
                styles.tradingModeButtonText,
                tradingMode === 'real' && hasBrokerConnection && styles.activeTradingModeButtonText,
                !hasBrokerConnection && styles.disabledTradingModeButtonText
              ]}>
                Real Trading
              </Text>
              {!hasBrokerConnection && (
                <Ionicons name="link-outline" size={16} color={Colors.gray400} />
              )}
            </TouchableOpacity>
          </View>
          
          {tradingMode === 'real' && hasBrokerConnection && (
            <TouchableOpacity
              style={styles.realTradingBridge}
              onPress={() => navigation.navigate('RealTrading')}
            >
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
              <Text style={styles.realTradingBridgeText}>Go to Real Trading</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        {renderSearchBar()}

        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Investment Amount */}
        {renderInvestmentAmount()}

        {/* Featured Assets */}
        {renderFeaturedAssets()}

        {/* All Assets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Assets ({filteredAssets.length})
          </Text>
          {filteredAssets.map(renderAssetCard)}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {selectedAsset && (
        <View style={styles.bottomAction}>
          <View style={styles.selectedAssetInfo}>
            <Text style={styles.selectedAssetSymbol}>{selectedAsset.symbol}</Text>
            <Text style={styles.selectedAssetPrice}>
              {formatCurrency(selectedAsset.currentPrice)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.investNowButton}
            onPress={() => handleInvest(selectedAsset)}
          >
            <Text style={styles.investNowButtonText}>
              Invest {investmentAmount ? `₹${investmentAmount}` : '₹100'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.gray900,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.gray600,
    marginLeft: Spacing.xs,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  investmentContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  investmentLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.primary,
  },
  amountInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.gray900,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quickAmountButton: {
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickAmountText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.gray700,
  },
  minimumText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  featuredCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    minWidth: 150,
    alignItems: 'center',
  },
  featuredSymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  featuredName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  featuredPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  featuredChange: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  featuredInvestButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  featuredInvestButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  assetCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  assetSymbol: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  assetName: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  assetCategory: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
  },
  assetPrice: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  priceChange: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: Spacing.md,
  },
  assetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  investButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  investButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  moreButton: {
    padding: Spacing.sm,
  },
  bottomAction: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedAssetInfo: {
    flex: 1,
  },
  selectedAssetSymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
  },
  selectedAssetPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  investNowButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  investNowButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  profitText: {
    color: Colors.profit,
  },
  lossText: {
    color: Colors.loss,
  },
  tradingModeContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tradingModeTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  tradingModeButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tradingModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  activeTradingModeButton: {
    backgroundColor: Colors.primary,
  },
  disabledTradingModeButton: {
    opacity: 0.6,
  },
  tradingModeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  activeTradingModeButtonText: {
    color: Colors.white,
  },
  disabledTradingModeButtonText: {
    color: Colors.gray400,
  },
  realTradingBridge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  realTradingBridgeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
});

export default InvestScreen;