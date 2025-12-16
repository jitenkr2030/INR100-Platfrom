'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  Flame,
  Zap,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  level: number;
  score: number;
  streak?: number;
  metadata?: any;
}

interface LeaderboardData {
  type: string;
  category: string;
  period: string;
  entries: LeaderboardEntry[];
}

export default function LeaderboardPage() {
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardData | null>(null);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardData | null>(null);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardData | null>(null);
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch different leaderboards in parallel
      const [
        weeklyResponse,
        monthlyResponse,
        allTimeResponse,
        userPositionResponse
      ] = await Promise.all([
        fetch('/api/leaderboard?type=weekly&limit=50'),
        fetch('/api/leaderboard?type=monthly&limit=50'),
        fetch('/api/leaderboard?type=all_time&limit=50'),
        fetch('/api/xp', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leaderboard_position', userId: 'demo-user-id' })
        })
      ]);

      const weeklyData = await weeklyResponse.json();
      const monthlyData = await monthlyResponse.json();
      const allTimeData = await allTimeResponse.json();
      const userPositionData = await userPositionResponse.json();

      setWeeklyLeaderboard(weeklyData);
      setMonthlyLeaderboard(monthlyData);
      setAllTimeLeaderboard(allTimeData);
      setCurrentUserPosition(userPositionData.position);

    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreIcon = (type: string) => {
    switch (type) {
      case 'weekly':
        return <TrendingUp className="w-4 h-4" />;
      case 'monthly':
        return <Target className="w-4 h-4" />;
      case 'all_time':
        return <Award className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const formatPeriod = (type: string, period: string) => {
    if (period === 'all_time') return 'All Time';
    
    const date = new Date(period);
    if (type === 'weekly') {
      const weekStart = new Date(date);
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `Week of ${weekStart.toLocaleDateString()}`;
    } else if (type === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return period;
  };

  const LeaderboardTable = ({ data, type }: { data: LeaderboardData | null; type: string }) => {
    if (!data || !data.entries || data.entries.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">
              Leaderboard data will appear here once users start earning points.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {getScoreIcon(type)}
            <span className="ml-2">
              {type === 'weekly' ? 'Weekly' : type === 'monthly' ? 'Monthly' : 'All Time'} Leaderboard
            </span>
          </CardTitle>
          <CardDescription>
            {formatPeriod(type, data.period)} • {data.entries.length} participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.entries.map((entry, index) => (
              <div 
                key={entry.userId}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  entry.rank <= 3 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    {entry.userAvatar ? (
                      <img 
                        src={entry.userAvatar} 
                        alt={entry.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {entry.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{entry.userName}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          Level {entry.level}
                        </Badge>
                        {entry.streak && (
                          <div className="flex items-center">
                            <Flame className="w-3 h-3 mr-1 text-orange-500" />
                            {entry.streak} days
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {getScoreIcon(type)}
                    <span className="font-bold text-lg">{entry.score.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {type === 'all_time' ? 'Total XP' : 'Weekly XP'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getCurrentUserRank = () => {
    if (currentUserPosition === null) return null;
    
    let data;
    switch (activeTab) {
      case 'weekly':
        data = weeklyLeaderboard;
        break;
      case 'monthly':
        data = monthlyLeaderboard;
        break;
      case 'all_time':
        data = allTimeLeaderboard;
        break;
      default:
        data = weeklyLeaderboard;
    }

    if (!data || !data.entries) return null;

    const userEntry = data.entries.find(entry => entry.userId === 'demo-user-id');
    return userEntry || { rank: currentUserPosition, score: 0, level: 1 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentUserRank = getCurrentUserRank();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center">
          <Trophy className="w-10 h-10 mr-4 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-gray-600 text-lg">Compete with fellow learners and climb the ranks</p>
      </div>

      {/* Your Ranking Card */}
      {currentUserRank && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Star className="w-5 h-5 mr-2" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(currentUserRank.rank)}`}>
                  {getRankIcon(currentUserRank.rank)}
                </div>
                <div>
                  <p className="font-medium">Rank #{currentUserRank.rank}</p>
                  <p className="text-sm text-muted-foreground">Level {currentUserRank.level}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {getScoreIcon(activeTab)}
                  <span className="font-bold text-lg">{currentUserRank.score.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeTab === 'all_time' ? 'Total XP' : `${activeTab} XP`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="all_time" className="flex items-center">
            <Award className="w-4 h-4 mr-2" />
            All Time
          </TabsTrigger>
        </TabsList>

        {/* Weekly Leaderboard */}
        <TabsContent value="weekly">
          <LeaderboardTable data={weeklyLeaderboard} type="weekly" />
        </TabsContent>

        {/* Monthly Leaderboard */}
        <TabsContent value="monthly">
          <LeaderboardTable data={monthlyLeaderboard} type="monthly" />
        </TabsContent>

        {/* All Time Leaderboard */}
        <TabsContent value="all_time">
          <LeaderboardTable data={allTimeLeaderboard} type="all_time" />
        </TabsContent>
      </Tabs>

      {/* Leaderboard Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <TrendingUp className="w-5 h-5 mr-2" />
              Weekly Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Earn XP throughout the week to climb the weekly leaderboard. 
              Rankings reset every Monday.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Target className="w-5 h-5 mr-2" />
              Monthly Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monthly leaderboards track your consistent learning over longer periods. 
              Perfect for serious learners!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-purple-600">
              <Award className="w-5 h-5 mr-2" />
              All Time Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The ultimate ranking showing your total XP earned since joining. 
              These are the true learning champions!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            How to Earn Points
          </CardTitle>
          <CardDescription>
            Various activities contribute to your leaderboard position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Complete Lessons</h4>
              <p className="text-xs text-muted-foreground">+10-50 XP per lesson</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Pass Quizzes</h4>
              <p className="text-xs text-muted-foreground">+25-100 XP per quiz</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Maintain Streaks</h4>
              <p className="text-xs text-muted-foreground">+5-25 XP per day</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm mb-1">Achieve Milestones</h4>
              <p className="text-xs text-muted-foreground">+50-1000 XP per milestone</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}