/**
 * Learn Screen for INR100 Mobile App
 * Learning academy with gamified experience
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
  Image,
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

const { width } = Dimensions.get('window');

const LearnScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [learningData, setLearningData] = useState({
    userStats: null,
    courses: [],
    achievements: [],
    streak: 0,
    xp: 0,
    level: 1,
  });
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', name: 'All Courses', icon: 'grid-outline' },
    { id: 'BASICS', name: 'Investing Basics', icon: 'school-outline' },
    { id: 'STOCKS', name: 'Stock Market', icon: 'trending-up-outline' },
    { id: 'MUTUAL_FUNDS', name: 'Mutual Funds', icon: 'pie-chart-outline' },
    { id: 'PORTFOLIO', name: 'Portfolio', icon: 'briefcase-outline' },
    { id: 'RISK', name: 'Risk Management', icon: 'shield-checkmark-outline' },
  ];

  useEffect(() => {
    loadLearningData();
    
    // Track screen view
    AnalyticsService.getInstance().trackScreenView('Learn', 'LearnScreen');
  }, []);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      
      const apiService = APIService.getInstance();
      
      // Load learning content
      const contentResult = await apiService.getLearningContent();
      if (contentResult.success) {
        setLearningData(prev => ({ ...prev, courses: contentResult.data }));
      }

      // Load user stats
      const statsResult = await apiService.getUserStats();
      if (statsResult.success) {
        const { learningStats } = statsResult.data;
        setLearningData(prev => ({
          ...prev,
          userStats: learningStats,
          streak: learningStats.studyStreak,
          xp: learningStats.totalXP,
          level: learningStats.level,
        }));
      }

      // Mock achievements data
      setLearningData(prev => ({
        ...prev,
        achievements: [
          {
            id: 1,
            name: 'First Steps',
            description: 'Complete your first course',
            icon: 'trophy-outline',
            earned: true,
            xpReward: 100,
          },
          {
            id: 2,
            name: 'Knowledge Seeker',
            description: 'Complete 5 courses',
            icon: 'book-outline',
            earned: true,
            xpReward: 250,
          },
          {
            id: 3,
            name: 'Weekly Warrior',
            description: 'Learn for 7 days straight',
            icon: 'flame-outline',
            earned: false,
            xpReward: 500,
          },
        ],
      }));

    } catch (error) {
      console.error('Load learning data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshLearningData = async () => {
    setRefreshing(true);
    await loadLearningData();
    setRefreshing(false);
  };

  const handleStartCourse = async (course) => {
    // Track learning start
    await AnalyticsService.getInstance().trackLearningStart(course.id, course.type);
    
    navigation.navigate('CourseDetail', { course });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return Colors.success;
    if (progress >= 50) return Colors.warning;
    return Colors.gray400;
  };

  const filteredCourses = learningData.courses.filter(course => {
    return activeCategory === 'ALL' || course.category === activeCategory;
  });

  const renderHeader = () => {
    const { streak, xp, level } = learningData;
    const xpForNextLevel = level * 1000;
    const progress = (xp % 1000) / 1000 * 100;

    return (
      <LinearGradient
        colors={[Colors.accent, Colors.accentDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Learn & Earn</Text>
        <Text style={styles.headerSubtitle}>
          Build your investing knowledge
        </Text>

        {/* User Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
              <Ionicons name="flame" size={16} color={Colors.accent} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
              <Ionicons name="medal" size={16} color={Colors.accent} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{xp}</Text>
              <Text style={styles.statLabel}>XP</Text>
              <Ionicons name="star" size={16} color={Colors.accent} />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {xp} / {xpForNextLevel} XP to Level {level + 1}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            activeCategory === category.id && styles.categoryButtonActive,
          ]}
          onPress={() => setActiveCategory(category.id)}
        >
          <Ionicons
            name={category.icon}
            size={20}
            color={activeCategory === category.id ? Colors.white : Colors.gray600}
          />
          <Text
            style={[
              styles.categoryButtonText,
              activeCategory === category.id && styles.categoryButtonTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAchievements = () => {
    const achievements = learningData.achievements;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={[
              styles.achievementCard,
              achievement.earned && styles.achievementCardEarned
            ]}>
              <View style={[
                styles.achievementIcon,
                achievement.earned ? styles.achievementIconEarned : styles.achievementIconLocked
              ]}>
                <Ionicons 
                  name={achievement.icon} 
                  size={24} 
                  color={achievement.earned ? Colors.white : Colors.gray400} 
                />
              </View>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              <Text style={styles.achievementXP}>+{achievement.xpReward} XP</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCourseCard = (course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      onPress={() => handleStartCourse(course)}
    >
      <View style={styles.courseHeader}>
        <Image source={{ uri: course.thumbnail }} style={styles.courseThumbnail} />
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
          <View style={styles.courseMeta}>
            <View style={styles.courseMetaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.gray500} />
              <Text style={styles.courseMetaText}>{course.duration} min</Text>
            </View>
            <View style={styles.courseMetaItem}>
              <Ionicons name="star-outline" size={14} color={Colors.gray500} />
              <Text style={styles.courseMetaText}>{course.difficulty}/5</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.courseProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercentage}>{course.progress || 0}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${course.progress || 0}%`,
                backgroundColor: getProgressColor(course.progress || 0)
              }
            ]} 
          />
        </View>
      </View>
      
      <TouchableOpacity style={styles.continueButton}>
        <Text style={styles.continueButtonText}>
          {course.progress > 0 ? 'Continue' : 'Start Course'}
        </Text>
        <Ionicons name="play-circle-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('DailyQuiz')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}20` }]}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Daily Quiz</Text>
          <Text style={styles.quickActionSubtitle}>Test your knowledge</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('LearningPath')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.secondary}20` }]}>
            <Ionicons name="map-outline" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.quickActionTitle}>Learning Path</Text>
          <Text style={styles.quickActionSubtitle}>Structured learning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('VideoLessons')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.accent}20` }]}>
            <Ionicons name="videocam-outline" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.quickActionTitle}>Video Lessons</Text>
          <Text style={styles.quickActionSubtitle}>Watch & learn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('Glossary')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.info}20` }]}>
            <Ionicons name="book-outline" size={24} color={Colors.info} />
          </View>
          <Text style={styles.quickActionTitle}>Investment Glossary</Text>
          <Text style={styles.quickActionSubtitle}>Learn terms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshLearningData} />
        }
      >
        {renderCategoryFilter()}
        {renderAchievements()}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Courses ({filteredCourses.length})
          </Text>
          {filteredCourses.map(renderCourseCard)}
        </View>

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
  scrollView: {
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
    color: Colors.accentLight,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray200,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
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
  section: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
  achievementCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    alignItems: 'center',
    minWidth: 120,
  },
  achievementCardEarned: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  achievementIconEarned: {
    backgroundColor: Colors.accent,
  },
  achievementIconLocked: {
    backgroundColor: Colors.gray200,
  },
  achievementName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  achievementDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  achievementXP: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  courseThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  courseDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray600,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  courseMeta: {
    flexDirection: 'row',
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  courseMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray500,
    marginLeft: Spacing.xs,
  },
  courseProgress: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.gray700,
  },
  progressPercentage: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray900,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: Colors.white,
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

export default LearnScreen;