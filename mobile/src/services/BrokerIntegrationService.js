/**
 * Broker Integration Service for INR100 Mobile App
 * Supports multiple broker partners for real money investing
 */

import { APIService } from './APIService';

class BrokerIntegrationService {
  constructor() {
    this.activeBroker = null;
    this.brokerConfigs = {
      upstox: {
        name: 'Upstox',
        apiUrl: 'https://api.upstox.com/v3',
        wsUrl: 'wss://api.upstox.com/stream',
        authUrl: 'https://login.upstox.com/oauth2/authorize',
        logo: 'upstox-logo.png',
        features: ['Equity', 'Derivatives', 'MF', 'ETF', 'Fractional'],
        commission: '₹20 per order',
        minAmount: 100,
        supportedActions: ['BUY', 'SELL']
      },
      angel: {
        name: 'Angel One',
        apiUrl: 'https://apidev.angelone.in/smartapi',
        wsUrl: 'wss://apidev.angelone.in/smartapi/ws',
        authUrl: 'https://smartapi.angelone.in/api/oauth/authorize',
        logo: 'angel-logo.png',
        features: ['Equity', 'Derivatives', 'MF', 'ETF', 'Fractional'],
        commission: '₹20 per order',
        minAmount: 100,
        supportedActions: ['BUY', 'SELL']
      },
      fivepaisa: {
        name: '5Paisa',
        apiUrl: 'https://openapi.5paisa.com/mobile_app/api/1.0',
        wsUrl: 'wss://openapi.5paisa.com/ws',
        authUrl: 'https://web.5paisa.com/api/oauth/authorize',
        logo: '5paisa-logo.png',
        features: ['Equity', 'Derivatives', 'MF', 'ETF', 'Fractional'],
        commission: '₹20 per order',
        minAmount: 100,
        supportedActions: ['BUY', 'SELL']
      }
    };
  }

  /**
   * Initialize broker integration
   */
  async initializeBroker(brokerName) {
    try {
      const config = this.brokerConfigs[brokerName];
      if (!config) {
        throw new Error(`Broker ${brokerName} not supported`);
      }

      this.activeBroker = brokerName;
      
      // Initialize API connection
      await this.initializeAPIConnection(config);
      
      // Store user preference
      await this.storeBrokerPreference(brokerName);
      
      return {
        success: true,
        broker: config,
        message: `${config.name} broker initialized successfully`
      };
    } catch (error) {
      console.error('Broker initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get broker list
   */
  getAvailableBrokers() {
    return Object.entries(this.brokerConfigs).map(([key, config]) => ({
      id: key,
      name: config.name,
      logo: config.logo,
      features: config.features,
      commission: config.commission,
      minAmount: config.minAmount
    }));
  }

  /**
   * Get current active broker
   */
  getActiveBroker() {
    return this.activeBroker ? this.brokerConfigs[this.activeBroker] : null;
  }

  /**
   * Start broker authentication flow
   */
  async startAuthentication() {
    try {
      const broker = this.getActiveBroker();
      if (!broker) {
        throw new Error('No broker selected');
      }

      // Generate OAuth URL
      const authUrl = await this.generateAuthUrl(broker);
      
      // Open browser for authentication
      return {
        success: true,
        authUrl: authUrl,
        message: 'Redirecting to broker authentication'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle authentication callback
   */
  async handleAuthCallback(authCode, state) {
    try {
      const broker = this.getActiveBroker();
      if (!broker) {
        throw new Error('No broker selected');
      }

      // Exchange auth code for tokens
      const tokens = await this.exchangeAuthCode(authCode, broker);
      
      // Store tokens securely
      await this.storeAuthTokens(tokens);
      
      // Verify account access
      const accountInfo = await this.getAccountInfo();
      
      return {
        success: true,
        accountInfo: accountInfo,
        message: 'Authentication successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo() {
    try {
      const broker = this.getActiveBroker();
      if (!broker) {
        throw new Error('No broker selected');
      }

      const response = await APIService.get('/broker/account-info');
      
      return {
        success: true,
        account: {
          brokerName: broker.name,
          accountNumber: response.data.account_number,
          tradingAccess: response.data.trading_access,
          fundLimits: response.data.fund_limits,
          marginAvailable: response.data.margin_available,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance() {
    try {
      const response = await APIService.get('/broker/balance');
      
      return {
        success: true,
        balance: {
          availableCash: response.data.available_cash,
          totalBalance: response.data.total_balance,
          marginUsed: response.data.margin_used,
          unrealizedPnL: response.data.unrealized_pnl
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user holdings
   */
  async getHoldings() {
    try {
      const response = await APIService.get('/broker/holdings');
      
      return {
        success: true,
        holdings: response.data.map(holding => ({
          symbol: holding.symbol,
          companyName: holding.company_name,
          quantity: holding.quantity,
          avgPrice: holding.avg_price,
          currentPrice: holding.current_price,
          ltp: holding.ltp,
          pnl: holding.pnl,
          pnlPercentage: holding.pnl_percentage,
          isin: holding.isin,
          exchange: holding.exchange
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Place order
   */
  async placeOrder(orderData) {
    try {
      const broker = this.getActiveBroker();
      if (!broker) {
        throw new Error('No broker selected');
      }

      // Validate order data
      this.validateOrderData(orderData);
      
      // Prepare order request
      const orderRequest = this.prepareOrderRequest(orderData, broker);
      
      // Place order through broker API
      const response = await APIService.post('/broker/orders', orderRequest);
      
      return {
        success: true,
        order: {
          orderId: response.data.order_id,
          status: response.data.status,
          symbol: orderData.symbol,
          quantity: orderData.quantity,
          price: orderData.price,
          timestamp: new Date().toISOString()
        },
        message: 'Order placed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Place fractional order
   */
  async placeFractionalOrder(orderData) {
    try {
      // Calculate fractional quantity based on investment amount
      const fractionalData = this.calculateFractionalOrder(orderData);
      
      // Place order with fractional quantity
      const result = await this.placeOrder(fractionalData);
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId) {
    try {
      const response = await APIService.get(`/broker/orders/${orderId}`);
      
      return {
        success: true,
        orderStatus: {
          orderId: orderId,
          status: response.data.status,
          quantity: response.data.quantity,
          filledQuantity: response.data.filled_quantity,
          averagePrice: response.data.average_price,
          exchange: response.data.exchange,
          timestamp: response.data.timestamp
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      const response = await APIService.delete(`/broker/orders/${orderId}`);
      
      return {
        success: true,
        message: 'Order cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get market quotes
   */
  async getMarketQuotes(symbols) {
    try {
      const response = await APIService.post('/broker/quotes', { symbols });
      
      return {
        success: true,
        quotes: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get watchlist
   */
  async getWatchlist() {
    try {
      const response = await APIService.get('/broker/watchlist');
      
      return {
        success: true,
        watchlist: response.data.map(item => ({
          symbol: item.symbol,
          companyName: item.company_name,
          currentPrice: item.current_price,
          change: item.change,
          changePercent: item.change_percent,
          volume: item.volume,
          marketCap: item.market_cap
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add to watchlist
   */
  async addToWatchlist(symbol) {
    try {
      const response = await APIService.post('/broker/watchlist', { symbol });
      
      return {
        success: true,
        message: 'Added to watchlist'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(symbol) {
    try {
      await APIService.delete(`/broker/watchlist/${symbol}`);
      
      return {
        success: true,
        message: 'Removed from watchlist'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private methods
  async initializeAPIConnection(config) {
    // Initialize WebSocket connection for real-time data
    // Set up authentication headers
    // Configure request interceptors
  }

  async generateAuthUrl(broker) {
    // Generate OAuth authorization URL with state parameter
    const state = this.generateState();
    return `${broker.authUrl}?client_id=${process.env.BROKER_CLIENT_ID}&response_type=code&scope=trading&state=${state}`;
  }

  async exchangeAuthCode(authCode, broker) {
    // Exchange authorization code for access and refresh tokens
    const response = await APIService.post('/broker/token-exchange', {
      authCode: authCode,
      broker: this.activeBroker
    });
    return response.data;
  }

  async storeAuthTokens(tokens) {
    // Store tokens securely in encrypted storage
    // Use Android/iOS secure storage APIs
  }

  async storeBrokerPreference(brokerName) {
    // Store broker preference in user settings
    await APIService.post('/user/broker-preference', { broker: brokerName });
  }

  validateOrderData(orderData) {
    const required = ['symbol', 'quantity', 'price', 'orderType'];
    for (const field of required) {
      if (!orderData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  prepareOrderRequest(orderData, broker) {
    return {
      symbol: orderData.symbol,
      quantity: orderData.quantity,
      price: orderData.price,
      orderType: orderData.orderType, // MARKET, LIMIT
      productType: orderData.productType || 'CNC', // CNC, MIS, NRML
      transactionType: orderData.transactionType, // BUY, SELL
      exchange: orderData.exchange || 'NSE',
      validity: orderData.validity || 'DAY',
      broker: this.activeBroker
    };
  }

  calculateFractionalOrder(orderData) {
    // Calculate fractional quantity based on investment amount
    const amount = orderData.investmentAmount;
    const currentPrice = orderData.currentPrice;
    const fractionalQuantity = amount / currentPrice;
    
    return {
      ...orderData,
      quantity: Math.floor(fractionalQuantity * 100) / 100, // Round to 2 decimal places
      investmentAmount: amount
    };
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const BrokerIntegrationService = new BrokerIntegrationService();