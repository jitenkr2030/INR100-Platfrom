'use client';

import { useState, useEffect, useCallback } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'trading' | 'learning' | 'social' | 'streak' | 'special';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinReward: number;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  requirements: AchievementRequirement[];
  tier?: number;
  isUnlocked?: boolean;
}

interface AchievementRequirement {
  type: 'trades' | 'amount' | 'streak' | 'learning' | 'social' | 'referrals';
  target: number;
  current: number;
  unit: string;
}

interface UserLevel {
  level: number;
  currentXp: number;
  xpToNext: number;
  totalXp: number;
  title: string;
  perks: string[];
  nextLevelTitle?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  startDate: Date;
  endDate: Date;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward;
  participants?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  progress?: number;
  maxProgress?: number;
}

interface ChallengeRequirement {
  type: 'trades' | 'amount' | 'streak' | 'learning' | 'social';
  target: number;
  current: number;
  unit: string;
}

interface ChallengeReward {
  xp: number;
  coins: number;
  badge?: string;
  perks?: string[];
  cashback?: number;
}

interface Leaderboard {
  id: string;
  type: 'overall' | 'weekly' | 'monthly' | 'category';
  category?: 'trading' | 'learning' | 'social';
  period: string;
  entries: LeaderboardEntry[];
  userRank?: number;
  userScore?: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  change: number; // Rank change from previous period
  badge?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  verificationLevel: 'none' | 'basic' | 'verified' | 'premium';
  requirements: BadgeRequirement[];
  perks: string[];
  isEarned?: boolean;
  earnedAt?: Date;
}

interface BadgeRequirement {
  type: 'trades' | 'amount' | 'streak' | 'learning' | 'social' | 'referrals';
  target: number;
  description: string;
}

interface UseGamificationReturn {
  // User state
  userLevel: UserLevel;
  userXp: number;
  userCoins: number;
  totalXp: number;
  
  // Achievements
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  progressAchievements: Achievement[];
  
  // Challenges
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  availableChallenges: Challenge[];
  
  // Leaderboards
  leaderboards: Leaderboard[];
  
  // Badges
  badges: Badge[];
  earnedBadges: Badge[];
  
  // Actions
  checkAchievements: () => Promise<void>;
  claimAchievement: (achievementId: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  claimChallengeReward: (challengeId: string) => Promise<void>;
  shareAchievement: (achievementId: string, platform: string) => Promise<void>;
  refreshLeaderboards: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useGamification = (): UseGamificationReturn => {
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXp: 0,
    xpToNext: 100,
    totalXp: 0,
    title: 'Novice Trader',
    perks: []
  });
  
  const [userXp, setUserXp] = useState(0);
  const [userCoins, setUserCoins] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user gamification data
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [levelResponse, achievementsResponse, challengesResponse, leaderboardsResponse, badgesResponse] = await Promise.all([
        fetch('/api/gamification/level'),
        fetch('/api/gamification/achievements'),
        fetch('/api/gamification/challenges'),
        fetch('/api/gamification/leaderboards'),
        fetch('/api/gamification/badges')
      ]);

      if (!levelResponse.ok || !achievementsResponse.ok || !challengesResponse.ok || !leaderboardsResponse.ok || !badgesResponse.ok) {
        throw new Error('Failed to fetch gamification data');
      }

      const [levelData, achievementsData, challengesData, leaderboardsData, badgesData] = await Promise.all([
        levelResponse.json(),
        achievementsResponse.json(),
        challengesResponse.json(),
        leaderboardsResponse.json(),
        badgesResponse.json()
      ]);

      setUserLevel(levelData);
      setUserXp(levelData.currentXp);
      setTotalXp(levelData.totalXp);
      setAchievements(achievementsData);
      setChallenges(challengesData);
      setLeaderboards(leaderboardsData);
      setBadges(badgesData);
      
      // Mock coin balance (in real app, this would come from user data)
      setUserCoins(levelData.totalXp * 0.1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for new achievements
  const checkAchievements = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/achievements/check', {
        method: 'POST'
      });

      if (response.ok) {
        const newAchievements = await response.json();
        if (newAchievements.length > 0) {
          // Update achievements list
          setAchievements(prev => prev.map(achievement => {
            const newAchievement = newAchievements.find((na: Achievement) => na.id === achievement.id);
            return newAchievement || achievement;
          }));
          
          // Show achievement notification
          console.log('New achievements unlocked:', newAchievements);
        }
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
  }, []);

  // Claim achievement reward
  const claimAchievement = useCallback(async (achievementId: string) => {
    try {
      const response = await fetch(`/api/gamification/achievements/${achievementId}/claim`, {
        method: 'POST'
      });

      if (response.ok) {
        const reward = await response.json();
        
        // Update user data
        setUserXp(prev => prev + reward.xp);
        setUserCoins(prev => prev + reward.coins);
        setTotalXp(prev => prev + reward.xp);
        
        // Mark achievement as claimed
        setAchievements(prev => prev.map(achievement => 
          achievement.id === achievementId 
            ? { ...achievement, unlockedAt: new Date() }
            : achievement
        ));
        
        return reward;
      }
    } catch (err) {
      setError('Failed to claim achievement reward');
      throw err;
    }
  }, []);

  // Join a challenge
  const joinChallenge = useCallback(async (challengeId: string) => {
    try {
      const response = await fetch(`/api/gamification/challenges/${challengeId}/join`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh challenges to update participation status
        await fetchUserData();
      }
    } catch (err) {
      setError('Failed to join challenge');
      throw err;
    }
  }, [fetchUserData]);

  // Claim challenge reward
  const claimChallengeReward = useCallback(async (challengeId: string) => {
    try {
      const response = await fetch(`/api/gamification/challenges/${challengeId}/claim`, {
        method: 'POST'
      });

      if (response.ok) {
        const reward = await response.json();
        
        // Update user data
        setUserXp(prev => prev + reward.xp);
        setUserCoins(prev => prev + reward.coins);
        setTotalXp(prev => prev + reward.xp);
        
        // Mark challenge as completed
        setChallenges(prev => prev.map(challenge => 
          challenge.id === challengeId 
            ? { ...challenge, isCompleted: true }
            : challenge
        ));
        
        return reward;
      }
    } catch (err) {
      setError('Failed to claim challenge reward');
      throw err;
    }
  }, []);

  // Share achievement on social media
  const shareAchievement = useCallback(async (achievementId: string, platform: string) => {
    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) return;

      const shareData = {
        title: `I just unlocked: ${achievement.title}!`,
        text: achievement.description,
        url: `${window.location.origin}/achievements/${achievementId}`
      };

      if (platform === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}`;
        window.open(twitterUrl, '_blank');
      } else if (platform === 'linkedin') {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
        window.open(linkedinUrl, '_blank');
      } else if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
        window.open(facebookUrl, '_blank');
      }

      // Record share for gamification
      await fetch('/api/gamification/social/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId, platform })
      });

    } catch (err) {
      setError('Failed to share achievement');
      throw err;
    }
  }, [achievements]);

  // Refresh leaderboards
  const refreshLeaderboards = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/leaderboards');
      if (response.ok) {
        const leaderboardsData = await response.json();
        setLeaderboards(leaderboardsData);
      }
    } catch (err) {
      console.error('Failed to refresh leaderboards:', err);
    }
  }, []);

  // Computed properties
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const progressAchievements = achievements.filter(a => !a.unlockedAt && a.progress !== undefined);
  const activeChallenges = challenges.filter(c => c.isActive);
  const completedChallenges = challenges.filter(c => c.isCompleted);
  const availableChallenges = challenges.filter(c => !c.isActive && !c.isCompleted);
  const earnedBadges = badges.filter(b => b.isEarned);

  // Initialize data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Check achievements periodically
  useEffect(() => {
    const interval = setInterval(checkAchievements, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkAchievements]);

  return {
    // User state
    userLevel,
    userXp,
    userCoins,
    totalXp,
    
    // Achievements
    achievements,
    unlockedAchievements,
    progressAchievements,
    
    // Challenges
    activeChallenges,
    completedChallenges,
    availableChallenges,
    
    // Leaderboards
    leaderboards,
    
    // Badges
    badges,
    earnedBadges,
    
    // Actions
    checkAchievements,
    claimAchievement,
    joinChallenge,
    claimChallengeReward,
    shareAchievement,
    refreshLeaderboards,
    
    // Loading states
    isLoading,
    error
  };
};