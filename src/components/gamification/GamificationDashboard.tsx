'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Star, 
  Crown,
  TrendingUp,
  Users,
  Award,
  Zap,
  Gift,
  Share2,
  Calendar,
  Trophy as TrophyIcon,
  Medal,
  Flame,
  Gift as GiftIcon,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { AchievementCard } from './AchievementCard';
import { ChallengeCard } from './ChallengeCard';
import { LeaderboardCard } from './LeaderboardCard';
import { BadgeCard } from './BadgeCard';
import { LevelProgressCard } from './LevelProgressCard';
import { StreakCard } from './StreakCard';

interface GamificationDashboardProps {
  className?: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const {
    userLevel,
    userXp,
    userCoins,
    totalXp,
    achievements,
    unlockedAchievements,
    progressAchievements,
    activeChallenges,
    completedChallenges,
    availableChallenges,
    leaderboards,
    badges,
    earnedBadges,
    checkAchievements,
    claimAchievement,
    joinChallenge,
    claimChallengeReward,
    shareAchievement,
    refreshLeaderboards,
    isLoading,
    error
  } = useGamification();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading gamification...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading gamification data: {error}</p>
        <Button onClick={checkAchievements} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const handleClaimAchievement = async (achievementId: string) => {
    try {
      await claimAchievement(achievementId);
      // Show success notification
    } catch (error) {
      console.error('Failed to claim achievement:', error);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
      // Show success notification
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const handleClaimChallengeReward = async (challengeId: string) => {
    try {
      await claimChallengeReward(challengeId);
      // Show success notification
    } catch (error) {
      console.error('Failed to claim challenge reward:', error);
    }
  };

  const handleShareAchievement = async (achievementId: string, platform: string) => {
    try {
      await shareAchievement(achievementId, platform);
    } catch (error) {
      console.error('Failed to share achievement:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gamification & Rewards</h1>
          <p className="text-gray-600 mt-1">Track your progress, earn rewards, and compete with others</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total XP</p>
            <p className="text-2xl font-bold">{totalXp.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Coins</p>
            <p className="text-2xl font-bold text-yellow-600">₹{userCoins.toFixed(0)}</p>
          </div>
          <Button onClick={checkAchievements} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Check Achievements
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LevelProgressCard level={userLevel} />
        <StreakCard />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unlockedAchievements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {achievements.length} unlocked
            </p>
            <Progress 
              value={(unlockedAchievements.length / achievements.length) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Badges</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnedBadges.length}
            </div>
            <p className="text-xs text-muted-foreground">
              verified badges
            </p>
            <div className="flex mt-2">
              {earnedBadges.slice(0, 3).map((badge, index) => (
                <div 
                  key={badge.id}
                  className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xs font-bold text-white -ml-1 first:ml-0"
                  title={badge.name}
                >
                  🏆
                </div>
              ))}
              {earnedBadges.length > 3 && (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 -ml-1">
                  +{earnedBadges.length - 3}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unlockedAchievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">+{achievement.xpReward} XP</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShareAchievement(achievement.id, 'twitter')}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {unlockedAchievements.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No achievements unlocked yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Active Challenges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeChallenges.slice(0, 3).map((challenge) => (
                    <div key={challenge.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                        <Progress 
                          value={(challenge.progress! / challenge.maxProgress!) * 100} 
                          className="mt-2 h-2" 
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {challenge.progress}/{challenge.maxProgress}
                        </p>
                        <p className="text-xs text-blue-600">+{challenge.rewards.xp} XP</p>
                      </div>
                    </div>
                  ))}
                  {activeChallenges.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No active challenges</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Leaderboard</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshLeaderboards}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboards[0]?.entries.slice(0, 5).map((entry) => (
                  <div key={entry.userId} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <span className="text-sm font-bold">#{entry.rank}</span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.score.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Achievement Gallery</h3>
            <div className="flex space-x-2">
              <Badge variant="outline">
                {unlockedAchievements.length} Unlocked
              </Badge>
              <Badge variant="secondary">
                {progressAchievements.length} In Progress
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onClaim={() => handleClaimAchievement(achievement.id)}
                onShare={(platform) => handleShareAchievement(achievement.id, platform)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Challenges</h3>
            <div className="flex space-x-2">
              <Badge variant="default">
                {activeChallenges.length} Active
              </Badge>
              <Badge variant="secondary">
                {completedChallenges.length} Completed
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={() => handleJoinChallenge(challenge.id)}
                    onClaimReward={() => handleClaimChallengeReward(challenge.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="available">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={() => handleJoinChallenge(challenge.id)}
                    onClaimReward={() => handleClaimChallengeReward(challenge.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onJoin={() => handleJoinChallenge(challenge.id)}
                    onClaimReward={() => handleClaimChallengeReward(challenge.id)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leaderboards</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshLeaderboards}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            {leaderboards.map((leaderboard) => (
              <LeaderboardCard
                key={leaderboard.id}
                leaderboard={leaderboard}
              />
            ))}
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Badge Collection</h3>
            <div className="flex space-x-2">
              <Badge variant="default">
                {earnedBadges.length} Earned
              </Badge>
              <Badge variant="secondary">
                {badges.length - earnedBadges.length} Available
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
              />
            ))}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Coin Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">₹{userCoins.toFixed(0)}</div>
                <p className="text-sm text-gray-600 mt-2">Available for rewards</p>
                <Button className="mt-4 w-full">
                  <Gift className="h-4 w-4 mr-2" />
                  Redeem Rewards
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Level Perks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userLevel.perks.map((perk, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{perk}</span>
                    </div>
                  ))}
                  {userLevel.perks.length === 0 && (
                    <p className="text-sm text-gray-500">No perks unlocked yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Reward History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Achievement rewards</span>
                    <span className="font-medium">+500 XP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Challenge completion</span>
                    <span className="font-medium">+250 XP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Social sharing</span>
                    <span className="font-medium">+50 XP</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  View All History
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard;