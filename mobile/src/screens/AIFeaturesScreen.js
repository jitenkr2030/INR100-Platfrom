/**
 * AI Features Screen for INR100 Mobile App
 * AI-powered insights and chat interface
 */

import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Services
import APIService from '../../services/APIService';
import AnalyticsService from '../../services/AnalyticsService';

// Styles
import { Colors, Typography, Spacing, BorderRadius, GlobalStyles } from '../../styles/GlobalStyles';

const { width, height } = Dimensions.get('window');

const AIFeaturesScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'chat'
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: 'Hello! I\'m your AI investment advisor. I can help you with portfolio analysis, investment recommendations, market insights, and answer any questions about investing. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [aiInsights, setAIInsights] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const quickPrompts = [
    'Analyze my portfolio',
    'Best stocks to buy now?',
    'Market trends today',
    'Investment strategies',
    'Risk assessment',
    'Portfolio rebalancing',
  ];

  useEffect(() => {
    loadAIInsights();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('AI Features', 'AIFeaturesScreen');
  }, []);

  const loadAIInsights = async () => {
    try {
      setLoading(true);
      
      const apiService = APIService.getInstance();
      const result = await apiService.getAIInsights();
      
      if (result.success) {
        setAIInsights(result.data);
      } else {
        console.log('Failed to load AI insights:', result.error);
      }
    } catch (error) {
      console.error('Load AI insights error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAIInsights = async () => {
    setRefreshing(true);
    await loadAIInsights();
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      message: chatMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const apiService = APIService.getInstance();
      const result = await apiService.chatWithAI(chatMessage);

      if (result.success) {
        const aiResponse = {
          id: chatMessages.length + 2,
          type: 'ai',
          message: result.data.message,
          timestamp: new Date(),
        };

        setChatMessages(prev => [...prev, aiResponse]);
      } else {
        const errorMessage = {
          id: chatMessages.length + 2,
          type: 'ai',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: chatMessages.length + 2,
        type: 'ai',
        message: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickPrompt = (prompt) => {
    setChatMessage(prompt);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.header}
    >
      <Text style={styles.headerTitle}>AI Assistant</Text>
      <Text style={styles.headerSubtitle}>
        Your intelligent investment companion
      </Text>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'insights' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('insights')}
        >
          <Ionicons
            name="analytics-outline"
            size={20}
            color={activeTab === 'insights' ? Colors.white : Colors.primaryLight}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'insights' && styles.tabButtonTextActive,
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'chat' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={activeTab === 'chat' ? Colors.white : Colors.primaryLight}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'chat' && styles.tabButtonTextActive,
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderInsights = () => (
    <View style={styles.content}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading AI insights...</Text>
        </View>
      ) : aiInsights.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="brain-outline" size={64} color={Colors.gray300} />
          <Text style={styles.emptyStateTitle}>No insights available</Text>
          <Text style={styles.emptyStateText}>
            Check back later for personalized AI insights about your investments
          </Text>
          <TouchableOpacity style={styles.generateInsightsButton}>
            <Text style={styles.generateInsightsButtonText}>Generate Insights</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsTitle}>Latest Insights</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshAIInsights}
              disabled={refreshing}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={Colors.primary}
                style={{ transform: [{ rotate: refreshing ? '360deg' : '0deg' }] }}
              />
            </TouchableOpacity>
          </View>

          {aiInsights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon}>
                  <Ionicons
                    name={getInsightIcon(insight.type)}
                    size={24}
                    color={getInsightColor(insight.type)}
                  />
                </View>
                <View style={styles.insightInfo}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightType}>
                    {formatInsightType(insight.type)}
                  </Text>
                </View>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: `${getConfidenceColor(insight.confidence)}20` }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: getConfidenceColor(insight.confidence) }
                  ]}>
                    {Math.round(insight.confidence * 100)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.insightContent}>{insight.content}</Text>
              <Text style={styles.insightTimestamp}>
                {new Date(insight.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderChat = () => (
    <View style={styles.content}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatMessages.map((msg) => (
          <View key={msg.id} style={[
            styles.messageContainer,
            msg.type === 'user' ? styles.userMessage : styles.aiMessage
          ]}>
            {msg.type === 'ai' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="brain" size={20} color={Colors.white} />
              </View>
            )}
            <View style={[
              styles.messageBubble,
              msg.type === 'user' ? styles.userBubble : styles.aiBubble
            ]}>
              <Text style={[
                styles.messageText,
                msg.type === 'user' ? styles.userMessageText : styles.aiMessageText
              ]}>
                {msg.message}
              </Text>
              <Text style={styles.messageTimestamp}>
                {formatTimestamp(msg.timestamp)}
              </Text>
            </View>
          </View>
        ))}

        {chatLoading && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="brain" size={20} color={Colors.white} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      <View style={styles.quickPromptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickPrompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickPromptButton}
              onPress={() => handleQuickPrompt(prompt)}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Input */}
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask me anything about investing..."
          placeholderTextColor={Colors.gray400}
          value={chatMessage}
          onChangeText={setChatMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !chatMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!chatMessage.trim() || chatLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={chatMessage.trim() ? Colors.white : Colors.gray400}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getInsightIcon = (type) => {
    switch (type) {
      case 'PORTFOLIO_HEALTH':
        return 'fitness-outline';
      case 'MARKET_TREND':
        return 'trending-up-outline';
      case 'RISK_ALERT':
        return 'warning-outline';
      case 'OPPORTUNITY':
        return 'flash-outline';
      case 'RECOMMENDATION':
        return 'bulb-outline';
      case 'PERFORMANCE_ANALYSIS':
        return 'analytics-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'PORTFOLIO_HEALTH':
        return Colors.primary;
      case 'MARKET_TREND':
        return Colors.secondary;
      case 'RISK_ALERT':
        return Colors.error;
      case 'OPPORTUNITY':
        return Colors.accent;
      case 'RECOMMENDATION':
        return Colors.info;
      case 'PERFORMANCE_ANALYSIS':
        return Colors.secondary;
      default:
        return Colors.gray600;
    }
  };

  const formatInsightType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return Colors.success;
    if (confidence >= 0.6) return Colors.warning;
    return Colors.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {activeTab === 'insights' ? renderInsights() : renderChat()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
  },
  tabButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primaryLight,
    marginLeft: Spacing.xs,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  content: {
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.gray700,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  generateInsightsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  generateInsightsButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  insightsTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.gray900,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  insightCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  insightIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  insightType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  insightContent: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray700,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  insightTimestamp: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.sm,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  messageText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  aiMessageText: {
    color: Colors.gray900,
  },
  messageTimestamp: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray400,
    marginHorizontal: 2,
  },
  quickPromptsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  quickPromptButton: {
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  quickPromptText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray700,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    fontSize: Typography.fontSize.base,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
});

export default AIFeaturesScreen;