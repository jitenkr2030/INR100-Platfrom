/**
 * Wallet Screen for INR100 Mobile App
 * Wallet management with payment integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Services
import APIService from '../../services/APIService';
import PaymentService from '../../services/PaymentService';
import AnalyticsService from '../../services/AnalyticsService';
import BiometricService from '../../services/BiometricService';

// Styles
import { Colors, Typography, Spacing, BorderRadius, GlobalStyles } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

const WalletScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    paymentMethods: [],
  });
  const [addAmount, setAddAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: 'phone-portrait-outline', color: Colors.secondary },
    { id: 'netbanking', name: 'Net Banking', icon: 'card-outline', color: Colors.primary },
    { id: 'card', name: 'Debit/Credit Card', icon: 'card-outline', color: Colors.accent },
    { id: 'wallet', name: 'Digital Wallet', icon: 'wallet-outline', color: Colors.info },
  ];

  useEffect(() => {
    loadWalletData();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Wallet', 'WalletScreen');
    
    // Setup refresh on focus
    const unsubscribe = navigation.addListener('focus', () => {
      refreshWalletData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      const apiService = APIService.getInstance();
      
      // Fetch wallet balance
      const walletResult = await apiService.getWallet();
      if (walletResult.success) {
        setWalletData(prev => ({ ...prev, balance: walletResult.data.balance }));
      }

      // Fetch transactions
      const transactionsResult = await apiService.getTransactions();
      if (transactionsResult.success) {
        const walletTransactions = transactionsResult.data.filter(
          transaction => transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAWAL'
        );
        setWalletData(prev => ({ ...prev, transactions: walletTransactions }));
      }

      // Fetch payment methods
      const paymentMethodsResult = await PaymentService.getInstance().getSavedPaymentMethods();
      if (paymentMethodsResult.success) {
        setWalletData(prev => ({ ...prev, paymentMethods: paymentMethodsResult.data }));
      }

    } catch (error) {
      console.error('Load wallet data error:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const refreshWalletData = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleAddMoney = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(addAmount);
    
    // Check for high amount requiring biometric authentication
    if (amount > 10000) {
      const biometricResult = await BiometricService.getInstance().authenticateForTransaction(
        'Authenticate to add money to wallet'
      );
      
      if (!biometricResult.success) {
        Alert.alert('Authentication Failed', 'Transaction cancelled');
        return;
      }
    }

    try {
      const paymentService = PaymentService.getInstance();
      let result;

      switch (selectedPaymentMethod?.id) {
        case 'upi':
          result = await paymentService.initiateUPIPayment(amount, 'Add money to INR100 Wallet');
          break;
        case 'netbanking':
          result = await paymentService.initiateNetBankingPayment(amount, 'bank_id');
          break;
        case 'card':
          result = await paymentService.initiateCardPayment(amount, { cardType: 'debit' });
          break;
        case 'wallet':
          result = await paymentService.initiateWalletPayment(amount, 'inr100_wallet');
          break;
        default:
          // Default to UPI
          result = await paymentService.initiateUPIPayment(amount, 'Add money to INR100 Wallet');
      }

      if (result.success) {
        // Track payment start
        await AnalyticsService.getInstance().trackPaymentStart(amount, selectedPaymentMethod?.id || 'upi');
        
        Alert.alert(
          'Payment Initiated! 📱',
          'Complete the payment in your preferred app',
          [
            {
              text: 'Track Payment',
              onPress: () => trackPaymentStatus(result.data.orderId),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );

        // Reset form
        setAddAmount('');
        setSelectedPaymentMethod(null);
      } else {
        Alert.alert('Payment Failed', result.error);
      }
    } catch (error) {
      console.error('Add money error:', error);
      Alert.alert('Error', 'Failed to initiate payment');
    }
  };

  const trackPaymentStatus = (orderId) => {
    const paymentService = PaymentService.getInstance();
    paymentService.trackPaymentStatus(orderId, (status) => {
      if (status.error) {
        Alert.alert('Payment Failed', status.error);
      } else if (status.status === 'SUCCESS') {
        Alert.alert('Payment Successful! 🎉', 'Money added to your wallet');
        refreshWalletData();
      }
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'arrow-down-circle-outline';
      case 'WITHDRAWAL':
        return 'arrow-up-circle-outline';
      default:
        return 'swap-horizontal-outline';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return Colors.profit;
      case 'WITHDRAWAL':
        return Colors.loss;
      default:
        return Colors.gray600;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Wallet</Text>
      <Text style={styles.headerSubtitle}>Manage your funds</Text>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(walletData.balance)}
        </Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.addMoneyButton} onPress={() => {}}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addMoneyButtonText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.withdrawButton}
            onPress={() => navigation.navigate('Withdraw')}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.primary} />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Add Money</Text>
      <Text style={styles.sectionSubtitle}>Choose your payment method</Text>
      
      <View style={styles.paymentMethods}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod?.id === method.id && styles.paymentMethodCardActive,
            ]}
            onPress={() => setSelectedPaymentMethod(method)}
          >
            <View style={[styles.paymentMethodIcon, { backgroundColor: `${method.color}20` }]}>
              <Ionicons name={method.icon} size={24} color={method.color} />
            </View>
            <Text style={styles.paymentMethodName}>{method.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedPaymentMethod && (
        <View style={styles.amountInputContainer}>
          <Text style={styles.amountLabel}>Amount to add</Text>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor={Colors.gray400}
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.quickAmounts}>
            {[500, 1000, 2000, 5000, 10000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountButton}
                onPress={() => setAddAmount(amount.toString())}
              >
                <Text style={styles.quickAmountText}>₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.addMoneyActionButton,
              (!addAmount || parseFloat(addAmount) < 100) && styles.disabledButton,
            ]}
            onPress={handleAddMoney}
            disabled={!addAmount || parseFloat(addAmount) < 100}
          >
            <Text style={styles.addMoneyActionButtonText}>
              Add {addAmount ? `₹${addAmount}` : '₹100'} via {selectedPaymentMethod.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {walletData.transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color={Colors.gray300} />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add money to your wallet to start investing
          </Text>
        </View>
      ) : (
        walletData.transactions.slice(0, 5).map((transaction, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons
                name={getTransactionIcon(transaction.type)}
                size={20}
                color={getTransactionColor(transaction.type)}
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: getTransactionColor(transaction.type) }
            ]}>
              {transaction.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(transaction.amount)}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Invest')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}20` }]}>
            <Ionicons name="trending-up" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Start Investing</Text>
          <Text style={styles.quickActionSubtitle}>Begin your journey</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Transactions')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.accent}20` }]}>
            <Ionicons name="time-outline" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.quickActionTitle}>Transaction History</Text>
          <Text style={styles.quickActionSubtitle}>View all transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('PaymentMethods')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.secondary}20` }]}>
            <Ionicons name="card-outline" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.quickActionTitle}>Payment Methods</Text>
          <Text style={styles.quickActionSubtitle}>Manage saved methods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Help')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.info}20` }]}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.info} />
          </View>
          <Text style={styles.quickActionTitle}>Help & Support</Text>
          <Text style={styles.quickActionSubtitle}>Get assistance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshWalletData} />
        }
      >
        {renderHeader()}
        {renderPaymentMethods()}
        {renderRecentTransactions()}
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
    marginBottom: Spacing.lg,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
  },
  addMoneyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoneyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  withdrawButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.sm,
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
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  paymentMethodCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.transparent,
  },
  paymentMethodCardActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}05`,
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentMethodName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.gray700,
    textAlign: 'center',
  },
  amountInputContainer: {
    marginTop: Spacing.md,
  },
  amountLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
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
    marginBottom: Spacing.lg,
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
  addMoneyActionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addMoneyActionButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.white,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray600,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray500,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray600,
    textAlign: 'center',
  },
});

export default WalletScreen;