import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../styles/GlobalStyles';

const BrokerSetupScreen = ({ navigation, route }) => {
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    loadAvailableBrokers();
    loadCurrentSetup();
  }, []);

  const loadAvailableBrokers = async () => {
    try {
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      const availableBrokers = BrokerIntegrationService.getAvailableBrokers();
      setBrokers(availableBrokers);
    } catch (error) {
      console.error('Error loading brokers:', error);
    }
  };

  const loadCurrentSetup = async () => {
    try {
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      const activeBroker = BrokerIntegrationService.getActiveBroker();
      if (activeBroker) {
        setSelectedBroker(activeBroker.name.toLowerCase());
        
        // Load account information
        const accountResult = await BrokerIntegrationService.getAccountInfo();
        if (accountResult.success) {
          setAccountInfo(accountResult.account);
        }
      }
    } catch (error) {
      console.error('Error loading current setup:', error);
    }
  };

  const handleBrokerSelect = async (brokerId) => {
    setIsLoading(true);
    
    try {
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      
      const result = await BrokerIntegrationService.initializeBroker(brokerId);
      
      if (result.success) {
        setSelectedBroker(brokerId);
        Alert.alert(
          'Broker Selected',
          `You have selected ${result.broker.name} as your trading partner. You will be redirected to authorize your account.`,
          [
            {
              text: 'Continue',
              onPress: () => startAuthorization()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select broker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startAuthorization = async () => {
    try {
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      
      const authResult = await BrokerIntegrationService.startAuthentication();
      
      if (authResult.success) {
        // In a real implementation, this would open a WebBrowser or redirect
        Alert.alert(
          'Authorization Required',
          'You will be redirected to your broker\'s authorization page. Please complete the authentication process.',
          [
            {
              text: 'I\'ve Authorized',
              onPress: () => completeAuthorization()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', authResult.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start authorization process.');
    }
  };

  const completeAuthorization = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be called with the authorization code
      const BrokerIntegrationService = require('../services/BrokerIntegrationService').BrokerIntegrationService;
      
      // Simulate successful authorization
      const accountResult = await BrokerIntegrationService.getAccountInfo();
      
      if (accountResult.success) {
        setAccountInfo(accountResult.account);
        Alert.alert(
          'Setup Complete!',
          'Your broker account has been successfully linked. You can now start investing with real money.',
          [
            {
              text: 'Start Investing',
              onPress: () => navigation.navigate('Invest', { screen: 'RealTrading' })
            }
          ]
        );
      } else {
        Alert.alert('Authorization Failed', 'Please try the authorization process again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete authorization.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Broker',
      'Are you sure you want to disconnect your broker account? You will need to re-authorize to continue trading.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectBroker()
        }
      ]
    );
  };

  const disconnectBroker = async () => {
    try {
      // Clear broker selection
      setSelectedBroker(null);
      setAccountInfo(null);
      
      Alert.alert(
        'Broker Disconnected',
        'Your broker account has been disconnected. You can connect a different broker anytime from settings.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect broker.');
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.headerGradient}
    >
      <Text style={styles.headerTitle}>Broker Setup</Text>
      <Text style={styles.headerSubtitle}>
        Connect your broker account to start investing with real money
      </Text>
    </LinearGradient>
  );

  const renderCurrentSetup = () => {
    if (!accountInfo && !selectedBroker) return null;

    return (
      <View style={styles.currentSetupContainer}>
        <Text style={styles.sectionTitle}>Current Setup</Text>
        
        {accountInfo ? (
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.brokerInfo}>
                <Ionicons name="shield-checkmark" size={24} color={GlobalStyles.colors.primary} />
                <Text style={styles.brokerName}>{accountInfo.brokerName}</Text>
              </View>
              <TouchableOpacity onPress={handleDisconnect}>
                <Ionicons name="close-circle" size={24} color="#ff4757" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.accountDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account:</Text>
                <Text style={styles.detailValue}>{accountInfo.accountNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Available Cash:</Text>
                <Text style={styles.detailValue}>₹{accountInfo.marginAvailable.toLocaleString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: accountInfo.tradingAccess ? '#4CAF50' : '#ff9800' }]}>
                  <Text style={styles.statusText}>
                    {accountInfo.tradingAccess ? 'Active' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.pendingCard}>
            <Ionicons name="time" size={48} color="#ff9800" />
            <Text style={styles.pendingTitle}>Authorization Pending</Text>
            <Text style={styles.pendingText}>
              Please complete the broker authorization to start trading
            </Text>
            <TouchableOpacity 
              style={styles.resumeButton}
              onPress={startAuthorization}
            >
              <Text style={styles.resumeButtonText}>Resume Setup</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderBrokerList = () => (
    <View style={styles.brokersSection}>
      <Text style={styles.sectionTitle}>Choose Your Broker</Text>
      <Text style={styles.sectionSubtitle}>
        Select from our trusted broker partners to start your investment journey
      </Text>
      
      <View style={styles.brokersList}>
        {brokers.map((broker) => (
          <TouchableOpacity
            key={broker.id}
            style={[
              styles.brokerCard,
              selectedBroker === broker.id && styles.selectedBrokerCard
            ]}
            onPress={() => handleBrokerSelect(broker.id)}
            disabled={isLoading}
          >
            <View style={styles.brokerHeader}>
              <View style={styles.brokerLogo}>
                <Ionicons name="business" size={32} color={GlobalStyles.colors.primary} />
              </View>
              <View style={styles.brokerInfo}>
                <Text style={styles.brokerTitle}>{broker.name}</Text>
                <Text style={styles.brokerCommission}>{broker.commission}</Text>
              </View>
              {selectedBroker === broker.id && (
                <Ionicons name="checkmark-circle" size={24} color={GlobalStyles.colors.primary} />
              )}
            </View>
            
            <View style={styles.brokerFeatures}>
              {broker.features.map((feature, index) => (
                <View key={index} style={styles.featureChip}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.brokerFooter}>
              <Text style={styles.minAmountText}>Min. Investment: ₹{broker.minAmount}</Text>
              <Ionicons name="arrow-forward" size={20} color={GlobalStyles.colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBenefits = () => (
    <View style={styles.benefitsSection}>
      <Text style={styles.sectionTitle}>Why Partner with Us?</Text>
      
      <View style={styles.benefitsList}>
        <View style={styles.benefitItem}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>SEBI registered brokers with full regulatory compliance</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>AI-powered fractional investing for small amounts</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="wallet" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Transparent commission structure</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="analytics" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Advanced portfolio analytics and insights</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="support" size={24} color="#4CAF50" />
          <Text style={styles.benefitText}>Dedicated customer support and assistance</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderCurrentSetup()}
        {!selectedBroker && renderBrokerList()}
        {renderBenefits()}
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
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  currentSetupContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 16,
  },
  accountCard: {
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
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brokerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brokerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginLeft: 8,
  },
  accountDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: GlobalStyles.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  brokersSection: {
    margin: 20,
  },
  brokersList: {
    gap: 16,
  },
  brokerCard: {
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
  selectedBrokerCard: {
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary,
  },
  brokerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brokerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  brokerInfo: {
    flex: 1,
  },
  brokerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 4,
  },
  brokerCommission: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
  },
  brokerFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  featureChip: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: GlobalStyles.colors.primary,
    fontWeight: '600',
  },
  brokerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  minAmountText: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
  },
  benefitsSection: {
    margin: 20,
    marginBottom: 30,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: GlobalStyles.colors.textPrimary,
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default BrokerSetupScreen;