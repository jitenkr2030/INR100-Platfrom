'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Award,
  Zap,
  Calendar,
  BarChart3,
  Users
} from 'lucide-react';

interface UserStats {
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  completedLessons: number;
  completedCourses: number;
  totalTimeSpent: number;
  perfectScores: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: string;
  xpReward: number;
}

interface LeaderboardEntry {
  rank: number;
  userName: string;
  score: number;
  level: number;
}

interface Session {
  id: string;
  sessionType: string;
  startTime: string;
  duration: number;
  lesson?: {
    title: string;
    course: {
      title: string;
    };
  };
}

export default function LearningDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate user ID - in real app, get from auth
      const userId = 'demo-user-id';
      
      // Fetch all dashboard data in parallel
      const [
        progressResponse,
        achievementsResponse,
        leaderboardResponse,
        sessionsResponse
      ] = await Promise.all([
        fetch(`/api/progress?userId=${userId}`),
        fetch(`/api/achievements?userId=${userId}`),
        fetch('/api/leaderboard?type=weekly&limit=5'),
        fetch(`/api/sessions?userId=${userId}&limit=5`)
      ]);

      const progressData = await progressResponse.json();
      const achievementsData = await achievementsResponse.json();
      const leaderboardData = await leaderboardResponse.json();
      const sessionsData = await sessionsResponse.json();

      // Process progress data
      if (progressData.courses) {
        const stats = calculateUserStats(progressData.courses);
        setUserStats(stats);
      }

      // Process achievements data
      setMilestones(achievementsData.milestones?.earned || []);

      // Process leaderboard data
      setLeaderboard(leaderboardData.entries || []);

      // Process sessions data
      setRecentSessions(sessionsData.sessions || []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (courses: any[]): UserStats => {
    const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
    const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
    
    return {
      level: 5, // This would come from user data
      xp: 1250, // This would come from user data
      currentStreak: 7, // This would come from streak API
      longestStreak: 12, // This would come from streak API
      completedLessons,
      completedCourses: courses.filter(c => c.completionPercentage === 100).length,
      totalTimeSpent: 480, // 8 hours in minutes
      perfectScores: 3
    };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your learning streak today!";
    if (streak < 7) return `${streak} days - Keep it going!`;
    if (streak < 30) return `${streak} days - You're on fire! 🔥`;
    return `${streak} days - Amazing dedication! 🌟`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your progress and achievements</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-3 py-1">
            <Star className="w-4 h-4 mr-1" />
            Level {userStats?.level || 1}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            {userStats?.xp || 0} XP
          </Badge>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{userStats?.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">
              {getStreakMessage(userStats?.currentStreak || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userStats?.completedLessons || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userStats?.completedCourses || 0} courses completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatTime(userStats?.totalTimeSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total learning time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfect Scores</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{userStats?.perfectScores || 0}</div>
            <p className="text-xs text-muted-foreground">
              Quiz achievements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Level {userStats?.level || 1}</span>
                  <span className="text-sm text-muted-foreground">
                    {userStats?.xp || 0} / {((userStats?.level || 1) * (userStats?.level || 1)) * 100} XP
                  </span>
                </div>
                <Progress 
                  value={userStats ? ((userStats.xp % ((userStats.level * userStats.level) * 100)) / ((userStats.level * userStats.level) * 100)) * 100 : 0} 
                  className="w-full" 
                />
                <p className="text-xs text-muted-foreground">
                  {((userStats?.level || 1) * (userStats?.level || 1)) * 100 - (userStats?.xp || 0)} XP to next level
                </p>
              </CardContent>
            </Card>

            {/* Streak Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flame className="w-5 h-5 mr-2" />
                  Streak Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Streak</span>
                  <span className="text-sm text-muted-foreground">
                    {userStats?.currentStreak || 0} days
                  </span>
                </div>
                <Progress 
                  value={Math.min(((userStats?.currentStreak || 0) / 30) * 100, 100)} 
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Longest: {userStats?.longestStreak || 0} days</span>
                  <span>Goal: 30 days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Learning Activity
              </CardTitle>
              <CardDescription>Your latest study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">
                            {session.lesson?.title || `${session.sessionType} Session`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.lesson?.course?.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatTime(Math.floor(session.duration / 60))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity. Start learning to see your progress here!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Milestones you've unlocked</CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestones.slice(0, 6).map((milestone) => (
                    <div key={milestone.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{milestone.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              +{milestone.xpReward} XP
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(milestone.achievedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No achievements yet. Keep learning to unlock your first milestone!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Weekly Leaderboard
              </CardTitle>
              <CardDescription>See how you rank against other learners</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500 text-white' :
                          entry.rank === 2 ? 'bg-gray-400 text-white' :
                          entry.rank === 3 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{entry.userName}</p>
                          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{entry.score} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No leaderboard data available yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Statistics</CardTitle>
              <CardDescription>Detailed breakdown of your learning activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{userStats?.completedLessons || 0}</div>
                  <p className="text-sm text-muted-foreground">Lessons Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{userStats?.completedCourses || 0}</div>
                  <p className="text-sm text-muted-foreground">Courses Finished</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{userStats?.perfectScores || 0}</div>
                  <p className="text-sm text-muted-foreground">Perfect Scores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}