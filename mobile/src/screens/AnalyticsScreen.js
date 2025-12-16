/**
 * Analytics Screen for INR100 Mobile App
 * Displays learning analytics, performance metrics, and insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GlobalStyles } from '../styles/GlobalStyles';
import { APIService } from '../services/APIService';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await APIService.get(`/analytics/learning?period=${selectedPeriod}`);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Analytics loading error:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getChartConfig = () => ({
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6366f1'
    }
  });

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Icon name="schedule" size={24} color="#6366f1" />
          <Text style={styles.metricValue}>{formatTime(analytics?.analytics?.summary?.totalStudyTime || 0)}</Text>
          <Text style={styles.metricLabel}>Study Time</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Icon name="trending-up" size={24} color="#10b981" />
          <Text style={styles.metricValue}>{analytics?.analytics?.summary?.currentStreak || 0}</Text>
          <Text style={styles.metricLabel}>Day Streak</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Icon name="school" size={24} color="#f59e0b" />
          <Text style={styles.metricValue}>{analytics?.analytics?.summary?.totalContentConsumed || 0}</Text>
          <Text style={styles.metricLabel}>Content Done</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Icon name="psychology" size={24} color="#8b5cf6" />
          <Text style={styles.metricValue}>{analytics?.analytics?.summary?.averageQuizScore?.toFixed(1) || 0}%</Text>
          <Text style={styles.metricLabel}>Avg Score</Text>
        </View>
      </View>

      {/* Study Time Chart */}
      {analytics?.analytics?.dailyData && analytics.analytics.dailyData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Study Time</Text>
          <LineChart
            data={{
              labels: analytics.analytics.dailyData.slice(-7).map(day => 
                new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
              datasets: [{
                data: analytics.analytics.dailyData.slice(-7).map(day => day.studyTime)
              }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={getChartConfig()}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Performance Summary */}
      <View style={styles.performanceContainer}>
        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Completion Rate</Text>
          <Text style={styles.performanceValue}>
            {analytics?.analytics?.summary?.completionRate?.toFixed(1) || 0}%
          </Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Sessions Count</Text>
          <Text style={styles.performanceValue}>
            {analytics?.analytics?.summary?.totalSessions || 0}
          </Text>
        </View>
        <View style={styles.performanceItem}>
          <Text style={styles.performanceLabel}>Avg Session Time</Text>
          <Text style={styles.performanceValue}>
            {formatTime(analytics?.analytics?.summary?.averageSessionTime || 0)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEngagementTab = () => (
    <View style={styles.tabContent}>
      {/* Engagement Metrics */}
      <View style={styles.engagementGrid}>
        {analytics?.analytics?.engagement?.map((item, index) => (
          <View key={index} style={styles.engagementCard}>
            <Text style={styles.engagementType}>{item.eventType.replace('_', ' ')}</Text>
            <Text style={styles.engagementCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Engagement Chart */}
      {analytics?.analytics?.engagement && analytics.analytics.engagement.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Engagement by Event Type</Text>
          <PieChart
            data={analytics.analytics.engagement.map((item, index) => ({
              name: item.eventType.replace('_', ' '),
              population: item.count,
              color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
              legendFontColor: '#7F7F7F',
              legendFontSize: 12
            }))}
            width={screenWidth - 40}
            height={220}
            chartConfig={getChartConfig()}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </View>
      )}
    </View>
  );

  const renderRecommendationsTab = () => (
    <View style={styles.tabContent}>
      {analytics?.analytics?.recommendations && analytics.analytics.recommendations.length > 0 ? (
        <View style={styles.recommendationsList}>
          {analytics.analytics.recommendations.map((recommendation, index) => (
            <TouchableOpacity key={index} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: recommendation.priority === 'HIGH' ? '#ef4444' : 
                    recommendation.priority === 'MEDIUM' ? '#f59e0b' : '#6b7280' }
                ]}>
                  <Text style={styles.priorityText}>{recommendation.priority}</Text>
                </View>
              </View>
              <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
              <Text style={styles.recommendationReason}>Reason: {recommendation.reason}</Text>
              <Text style={styles.confidenceScore}>
                Confidence: {Math.round(recommendation.confidence * 100)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="lightbulb" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No recommendations available</Text>
          <Text style={styles.emptyStateSubtext}>
            Continue learning to get personalized suggestions
          </Text>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['overview', 'engagement', 'recommendations'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['7d', '30d', '90d', '1y'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[styles.periodButton, selectedPeriod === period && styles.selectedPeriod]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[styles.periodText, selectedPeriod === period && styles.selectedPeriodText]}>
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !analytics) {
    return (
      <View style={[GlobalStyles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Analytics</Text>
        <TouchableOpacity onPress={loadAnalytics}>
          <Icon name="refresh" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'engagement' && renderEngagementTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  selectedPeriod: {
    backgroundColor: '#6366f1',
  },
  periodText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedPeriodText: {
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  performanceContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  engagementCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  engagementType: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  engagementCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  recommendationReason: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  confidenceScore: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;