import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../styles/GlobalStyles';

const RealTradingScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('fractional'); // fractional, direct, sip
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [balance, setBalance] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [holdings, setHoldings] = useState([]);
  
  // Trading form state
  const [selectedStock, setSelectedStock] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [orderType, setOrderType] = useState('BUY');
  const [fractionalMode, setFractionalMode] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  useEffect(() => {
    loadTradingData();
  }, []);

  const loadTradingData = async () => {
    try {
      setIsLoading(true);
      
      // Load account information
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      
      const [accountResult, balanceResult, watchlistResult, holdingsResult] = await Promise.all([
        BrokerIntegrationService.getAccountInfo(),
        BrokerIntegrationService.getAccountBalance(),
        BrokerIntegrationService.getWatchlist(),
        BrokerIntegrationService.getHoldings()
      ]);

      if (accountResult.success) {
        setAccountInfo(accountResult.account);
      }
      
      if (balanceResult.success) {
        setBalance(balanceResult.balance);
      }
      
      if (watchlistResult.success) {
        setWatchlist(watchlistResult.watchlist);
      }
      
      if (holdingsResult.success) {
        setHoldings(holdingsResult.holdings);
      }
    } catch (error) {
      console.error('Error loading trading data:', error);
      Alert.alert('Error', 'Failed to load trading data. Please check your broker connection.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTradingData();
  };

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setPrice(stock.currentPrice.toString());
  };

  const calculateFractionalQuantity = () => {
    if (!selectedStock || !investmentAmount) return 0;
    
    const amount = parseFloat(investmentAmount);
    const currentPrice = selectedStock.currentPrice;
    
    return Math.floor((amount / currentPrice) * 100) / 100; // Round to 2 decimal places
  };

  const handlePlaceOrder = async () => {
    if (!selectedStock || (!investmentAmount && !quantity)) {
      Alert.alert('Error', 'Please select a stock and enter investment details.');
      return;
    }

    setIsLoading(true);

    try {
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      
      const orderData = {
        symbol: selectedStock.symbol,
        currentPrice: selectedStock.currentPrice,
        orderType: orderType,
        transactionType: orderType,
        ...(fractionalMode ? {
          investmentAmount: parseFloat(investmentAmount),
          fractionalQuantity: calculateFractionalQuantity()
        } : {
          quantity: parseFloat(quantity),
          price: parseFloat(price)
        })
      };

      const result = fractionalMode 
        ? await BrokerIntegrationService.placeFractionalOrder(orderData)
        : await BrokerIntegrationService.placeOrder(orderData);

      if (result.success) {
        Alert.alert(
          'Order Placed!',
          `${orderType} order for ${selectedStock.symbol} has been placed successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setInvestmentAmount('');
                setQuantity('');
                setPrice('');
                loadTradingData(); // Refresh data
              }
            }
          ]
        );
      } else {
        Alert.alert('Order Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Real Trading</Text>
          <Text style={styles.headerSubtitle}>Invest with real money through your broker</Text>
        </View>
        {accountInfo && (
          <View style={styles.brokerBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.brokerText}>{accountInfo.brokerName}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  const renderAccountInfo = () => {
    if (!balance) return null;

    return (
      <View style={styles.accountContainer}>
        <Text style={styles.sectionTitle}>Account Balance</Text>
        <View style={styles.balanceCard}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available Cash</Text>
            <Text style={styles.balanceValue}>₹{balance.availableCash.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.totalBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Unrealized P&L</Text>
            <Text style={[
              styles.balanceValue,
              { color: balance.unrealizedPnL >= 0 ? '#4CAF50' : '#ff4757' }
            ]}>
              {balance.unrealizedPnL >= 0 ? '+' : ''}₹{balance.unrealizedPnL.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTradingTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'fractional' && styles.activeTab]}
        onPress={() => setActiveTab('fractional')}
      >
        <Ionicons name="pie-chart" size={20} color={activeTab === 'fractional' ? '#fff' : GlobalStyles.colors.primary} />
        <Text style={[styles.tabText, activeTab === 'fractional' && styles.activeTabText]}>
          Fractional
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'direct' && styles.activeTab]}
        onPress={() => setActiveTab('direct')}
      >
        <Ionicons name="trending-up" size={20} color={activeTab === 'direct' ? '#fff' : GlobalStyles.colors.primary} />
        <Text style={[styles.tabText, activeTab === 'direct' && styles.activeTabText]}>
          Direct
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'sip' && styles.activeTab]}
        onPress={() => setActiveTab('sip')}
      >
        <Ionicons name="repeat" size={20} color={activeTab === 'sip' ? '#fff' : GlobalStyles.colors.primary} />
        <Text style={[styles.tabText, activeTab === 'sip' && styles.activeTabText]}>
          SIP
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStockSelector = () => (
    <View style={styles.stockSelectorContainer}>
      <Text style={styles.sectionTitle}>Select Stock</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stockList}>
        {watchlist.map((stock, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.stockCard,
              selectedStock?.symbol === stock.symbol && styles.selectedStockCard
            ]}
            onPress={() => handleStockSelect(stock)}
          >
            <Text style={styles.stockSymbol}>{stock.symbol}</Text>
            <Text style={styles.stockPrice}>₹{stock.currentPrice.toFixed(2)}</Text>
            <Text style={[
              styles.stockChange,
              { color: stock.change >= 0 ? '#4CAF50' : '#ff4757' }
            ]}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFractionalTrading = () => (
    <View style={styles.tradingContainer}>
      <Text style={styles.sectionTitle}>Fractional Investing</Text>
      <Text style={styles.sectionSubtitle}>
        Invest any amount starting from ₹100 in fractional shares
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Investment Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={investmentAmount}
            onChangeText={setInvestmentAmount}
            placeholder="Enter amount (min ₹100)"
            keyboardType="numeric"
          />
        </View>

        {selectedStock && investmentAmount && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Order Preview</Text>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Stock:</Text>
              <Text style={styles.previewValue}>{selectedStock.symbol}</Text>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Amount:</Text>
              <Text style={styles.previewValue}>₹{investmentAmount}</Text>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Quantity:</Text>
              <Text style={styles.previewValue}>{calculateFractionalQuantity()} shares</Text>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Est. Cost:</Text>
              <Text style={styles.previewValue}>₹{(calculateFractionalQuantity() * selectedStock.currentPrice).toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderDirectTrading = () => (
    <View style={styles.tradingContainer}>
      <Text style={styles.sectionTitle}>Direct Trading</Text>
      <Text style={styles.sectionSubtitle}>
        Trade full shares with market or limit orders
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Number of shares"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.orderTypeContainer}>
          <Text style={styles.inputLabel}>Order Type</Text>
          <View style={styles.orderTypeButtons}>
            <TouchableOpacity
              style={[styles.orderTypeButton, orderType === 'BUY' && styles.orderTypeButtonActive]}
              onPress={() => setOrderType('BUY')}
            >
              <Text style={[
                styles.orderTypeText,
                orderType === 'BUY' && styles.orderTypeTextActive
              ]}>BUY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.orderTypeButton, orderType === 'SELL' && styles.orderTypeButtonActive]}
              onPress={() => setOrderType('SELL')}
            >
              <Text style={[
                styles.orderTypeText,
                orderType === 'SELL' && styles.orderTypeTextActive
              ]}>SELL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedStock && quantity && price && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Order Preview</Text>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Stock:</Text>
              <Text style={styles.previewValue}>{selectedStock.symbol}</Text>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Quantity:</Text>
              <Text style={styles.previewValue}>{quantity} shares</Text>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Price:</Text>
              <Text style={styles.previewValue}>₹{price}</Text>
            </View>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Total Cost:</Text>
              <Text style={styles.previewValue}>₹{(parseFloat(quantity) * parseFloat(price)).toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderSIPTrading = () => (
    <View style={styles.tradingContainer}>
      <Text style={styles.sectionTitle}>Systematic Investment Plan (SIP)</Text>
      <Text style={styles.sectionSubtitle}>
        Automate your investments with regular SIPs
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SIP Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={investmentAmount}
            onChangeText={setInvestmentAmount}
            placeholder="Enter SIP amount"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Frequency</Text>
          <View style={styles.frequencyButtons}>
            {['Weekly', 'Monthly', 'Quarterly'].map((freq) => (
              <TouchableOpacity key={freq} style={styles.frequencyButton}>
                <Text style={styles.frequencyText}>{freq}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duration</Text>
          <View style={styles.durationButtons}>
            {['6 months', '1 year', '2 years', '5 years'].map((duration) => (
              <TouchableOpacity key={duration} style={styles.durationButton}>
                <Text style={styles.durationText}>{duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderHoldings = () => {
    if (!holdings.length) return null;

    return (
      <View style={styles.holdingsContainer}>
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        
        {holdings.map((holding, index) => (
          <View key={index} style={styles.holdingCard}>
            <View style={styles.holdingHeader}>
              <Text style={styles.holdingSymbol}>{holding.symbol}</Text>
              <Text style={[
                styles.holdingPnl,
                { color: holding.pnl >= 0 ? '#4CAF50' : '#ff4757' }
              ]}>
                {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toFixed(2)} ({holding.pnlPercentage.toFixed(2)}%)
              </Text>
            </View>
            
            <View style={styles.holdingDetails}>
              <View style={styles.holdingDetail}>
                <Text style={styles.holdingDetailLabel}>Qty:</Text>
                <Text style={styles.holdingDetailValue}>{holding.quantity}</Text>
              </View>
              <View style={styles.holdingDetail}>
                <Text style={styles.holdingDetailLabel}>Avg Price:</Text>
                <Text style={styles.holdingDetailValue}>₹{holding.avgPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.holdingDetail}>
                <Text style={styles.holdingDetailLabel}>LTP:</Text>
                <Text style={styles.holdingDetailValue}>₹{holding.currentPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPlaceOrderButton = () => {
    const isValid = selectedStock && 
      ((activeTab === 'fractional' && investmentAmount) || 
       (activeTab === 'direct' && quantity && price));

    return (
      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          !isValid && styles.disabledButton
        ]}
        onPress={handlePlaceOrder}
        disabled={!isValid || isLoading}
      >
        <LinearGradient
          colors={isValid ? ['#4CAF50', '#45a049'] : ['#ccc', '#ccc']}
          style={styles.gradientButton}
        >
          <Ionicons name="trending-up" size={20} color="#fff" />
          <Text style={styles.placeOrderText}>
            {isLoading ? 'Placing Order...' : `Place ${orderType} Order`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderAccountInfo()}
        {renderTradingTabs()}
        {renderStockSelector()}
        
        {activeTab === 'fractional' && renderFractionalTrading()}
        {activeTab === 'direct' && renderDirectTrading()}
        {activeTab === 'sip' && renderSIPTrading()}
        
        {renderHoldings()}
        {renderPlaceOrderButton()}
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
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  brokerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  brokerText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  accountContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.primary,
    marginLeft: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  stockSelectorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  stockList: {
    marginTop: 12,
  },
  stockCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedStockCard: {
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 4,
  },
  stockPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 2,
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  tradingContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: GlobalStyles.colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  previewContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.textPrimary,
  },
  orderTypeContainer: {
    marginBottom: 16,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary,
    alignItems: 'center',
  },
  orderTypeButtonActive: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.primary,
  },
  orderTypeTextActive: {
    color: '#fff',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  frequencyText: {
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  durationText: {
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
  },
  holdingsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  holdingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holdingSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
  },
  holdingPnl: {
    fontSize: 14,
    fontWeight: '600',
  },
  holdingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  holdingDetail: {
    alignItems: 'center',
  },
  holdingDetailLabel: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 2,
  },
  holdingDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.textPrimary,
  },
  placeOrderButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default RealTradingScreen;