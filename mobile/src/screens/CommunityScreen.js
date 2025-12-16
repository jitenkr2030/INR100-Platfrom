/**
 * Community Screen for INR100 Mobile App
 * Social investing features and community interactions
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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';

// Services
import APIService from '../../services/APIService';
import AnalyticsService from '../../services/AnalyticsService';

// Styles
import { Colors, Typography, Spacing, BorderRadius, GlobalStyles } from '../../styles/GlobalStyles';

const { width } = Dimensions.get('window');

const CommunityScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'experts', 'portfolios'
  const [feedPosts, setFeedPosts] = useState([]);
  const [experts, setExperts] = useState([]);
  const [popularPortfolios, setPopularPortfolios] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);

  const tabs = [
    { id: 'feed', name: 'Feed', icon: 'home-outline' },
    { id: 'experts', name: 'Experts', icon: 'people-outline' },
    { id: 'portfolios', name: 'Portfolios', icon: 'briefcase-outline' },
  ];

  useEffect(() => {
    loadCommunityData();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Community', 'CommunityScreen');
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      
      const apiService = APIService.getInstance();
      
      // Load community feed
      const feedResult = await apiService.getCommunityFeed();
      if (feedResult.success) {
        setFeedPosts(feedResult.data.posts || []);
      }

      // Load experts (mock data for now)
      setExperts([
        {
          id: 1,
          name: 'Rajesh Kumar',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          followers: 12500,
          verified: true,
          specialty: 'Equity Markets',
          return: 24.5,
        },
        {
          id: 2,
          name: 'Priya Sharma',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          followers: 8900,
          verified: true,
          specialty: 'Mutual Funds',
          return: 18.2,
        },
        {
          id: 3,
          name: 'Amit Patel',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          followers: 15600,
          verified: true,
          specialty: 'Global Markets',
          return: 31.8,
        },
      ]);

      // Load popular portfolios (mock data)
      setPopularPortfolios([
        {
          id: 1,
          name: 'Tech Growth Portfolio',
          creator: 'Rajesh Kumar',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          followers: 2300,
          totalValue: 125000,
          returns: 24.5,
          riskLevel: 'Moderate',
          holdings: [
            { symbol: 'RELIANCE', allocation: 25 },
            { symbol: 'TCS', allocation: 20 },
            { symbol: 'HDFCBANK', allocation: 18 },
            { symbol: 'INFY', allocation: 15 },
            { symbol: 'ICICIBANK', allocation: 12 },
          ],
        },
        {
          id: 2,
          name: 'Dividend Aristocrats',
          creator: 'Priya Sharma',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          followers: 1800,
          totalValue: 89000,
          returns: 18.2,
          riskLevel: 'Conservative',
          holdings: [
            { symbol: 'HDFCBANK', allocation: 30 },
            { symbol: 'RELIANCE', allocation: 25 },
            { symbol: 'KOTAKBANK', allocation: 20 },
            { symbol: 'SBIN', allocation: 15 },
            { symbol: 'AXISBANK', allocation: 10 },
          ],
        },
      ]);

    } catch (error) {
      console.error('Load community data error:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const refreshCommunityData = async () => {
    setRefreshing(true);
    await loadCommunityData();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    try {
      const apiService = APIService.getInstance();
      const result = await apiService.createSocialPost(newPostContent);

      if (result.success) {
        // Track social post
        await AnalyticsService.getInstance().trackSocialPost('REGULAR');
        
        Alert.alert('Success!', 'Your post has been shared with the community');
        setNewPostContent('');
        setShowNewPost(false);
        refreshCommunityData();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      // Mock like functionality
      setFeedPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likes: post.likes + 1, liked: !post.liked }
            : post
        )
      );

      await AnalyticsService.getInstance().trackSocialEngagement(postId, 'like');
    } catch (error) {
      console.error('Like post error:', error);
    }
  };

  const handleCopyPortfolio = async (portfolioId) => {
    Alert.alert(
      'Copy Portfolio',
      'Do you want to copy this portfolio? This will replicate the same asset allocation.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Copy Portfolio',
          onPress: () => {
            // Handle portfolio copying logic
            Alert.alert('Success!', 'Portfolio copied to your account');
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatFollowers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Community</Text>
      <Text style={styles.headerSubtitle}>Connect with fellow investors</Text>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? Colors.white : Colors.gray600}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.tabButtonTextActive,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFeed = () => (
    <View style={styles.content}>
      {/* New Post Button */}
      <View style={styles.newPostContainer}>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => setShowNewPost(!showNewPost)}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.newPostButtonText}>Share an update</Text>
        </TouchableOpacity>
      </View>

      {/* New Post Input */}
      {showNewPost && (
        <View style={styles.newPostInputContainer}>
          <TextInput
            style={styles.newPostInput}
            placeholder="What's on your mind? Share your investment thoughts..."
            placeholderTextColor={Colors.gray400}
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            maxLength={500}
          />
          <View style={styles.newPostActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowNewPost(false);
                setNewPostContent('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.postButton,
                !newPostContent.trim() && styles.postButtonDisabled,
              ]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim()}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feed Posts */}
      {feedPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={Colors.gray300} />
          <Text style={styles.emptyStateTitle}>No posts yet</Text>
          <Text style={styles.emptyStateText}>
            Be the first to share your investment insights!
          </Text>
        </View>
      ) : (
        feedPosts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{post.user.name}</Text>
                  {post.user.verified && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  )}
                </View>
                <Text style={styles.postTime}>
                  {new Date(post.createdAt).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.postContent}>{post.content}</Text>
            
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLikePost(post.id)}
              >
                <Ionicons
                  name={post.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={post.liked ? Colors.error : Colors.gray600}
                />
                <Text style={[
                  styles.actionButtonText,
                  post.liked && { color: Colors.error }
                ]}>
                  {post.likes}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.gray600} />
                <Text style={styles.actionButtonText}>{post.comments}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderExperts = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Investment Experts</Text>
      {experts.map((expert) => (
        <View key={expert.id} style={styles.expertCard}>
          <Image source={{ uri: expert.avatar }} style={styles.expertAvatar} />
          <View style={styles.expertInfo}>
            <View style={styles.expertNameRow}>
              <Text style={styles.expertName}>{expert.name}</Text>
              {expert.verified && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.expertSpecialty}>{expert.specialty}</Text>
            <View style={styles.expertStats}>
              <Text style={styles.expertFollowers}>
                {formatFollowers(expert.followers)} followers
              </Text>
              <Text style={styles.expertReturn}>
                +{expert.return}% returns
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderPortfolios = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Popular Portfolios</Text>
      {popularPortfolios.map((portfolio) => (
        <View key={portfolio.id} style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <Image source={{ uri: portfolio.avatar }} style={styles.portfolioAvatar} />
            <View style={styles.portfolioInfo}>
              <Text style={styles.portfolioName}>{portfolio.name}</Text>
              <Text style={styles.portfolioCreator}>by {portfolio.creator}</Text>
              <View style={styles.portfolioStats}>
                <Text style={styles.portfolioFollowers}>
                  {formatFollowers(portfolio.followers)} followers
                </Text>
                <Text style={styles.portfolioValue}>
                  {formatCurrency(portfolio.totalValue)}
                </Text>
              </View>
            </View>
            <View style={styles.portfolioReturns}>
              <Text style={[
                styles.portfolioReturnText,
                portfolio.returns >= 0 ? styles.profitText : styles.lossText
              ]}>
                +{portfolio.returns}%
              </Text>
              <Text style={styles.portfolioRisk}>{portfolio.riskLevel}</Text>
            </View>
          </View>
          
          <View style={styles.holdingsContainer}>
            <Text style={styles.holdingsTitle}>Top Holdings</Text>
            {portfolio.holdings.map((holding, index) => (
              <View key={index} style={styles.holdingItem}>
                <Text style={styles.holdingSymbol}>{holding.symbol}</Text>
                <Text style={styles.holdingAllocation}>{holding.allocation}%</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.portfolioActions}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => handleCopyPortfolio(portfolio.id)}
            >
              <Text style={styles.copyButtonText}>Copy Portfolio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewButton}>
              <Ionicons name="eye-outline" size={16} color={Colors.primary} />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshCommunityData} />
        }
      >
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'experts' && renderExperts()}
        {activeTab === 'portfolios' && renderPortfolios()}
      </ScrollView>
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
    color: Colors.gray600,
    marginLeft: Spacing.xs,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  newPostContainer: {
    paddingVertical: Spacing.md,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  newPostButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray700,
    marginLeft: Spacing.sm,
  },
  newPostInputContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  newPostInput: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray900,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  newPostActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray600,
  },
  postButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
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
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginRight: Spacing.xs,
  },
  postTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray500,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  postContent: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray900,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginLeft: Spacing.xs,
  },
  expertCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  expertInfo: {
    flex: 1,
  },
  expertNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  expertName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginRight: Spacing.xs,
  },
  expertSpecialty: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  expertStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expertFollowers: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  expertReturn: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  followButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  portfolioCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  portfolioAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  portfolioCreator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  portfolioFollowers: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  portfolioValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  portfolioReturns: {
    alignItems: 'flex-end',
  },
  portfolioReturnText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  portfolioRisk: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
  },
  holdingsContainer: {
    marginBottom: Spacing.md,
  },
  holdingsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  holdingSymbol: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray700,
  },
  holdingAllocation: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray900,
  },
  portfolioActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    flex: 1,
    marginRight: Spacing.sm,
  },
  copyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  viewButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  profitText: {
    color: Colors.profit,
  },
  lossText: {
    color: Colors.loss,
  },
});

export default CommunityScreen;