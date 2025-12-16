'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  BookOpen, 
  Clock, 
  Award,
  TrendingUp,
  Zap,
  Crown,
  Medal,
  CheckCircle,
  Lock
} from 'lucide-react';

interface Milestone {
  id: string;
  milestone: string;
  title: string;
  description: string;
  achievedAt: string;
  xpReward: number;
}

interface Badge {
  id: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xpReward: number;
  };
  earnedAt: string;
}

interface AvailableBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
}

interface MilestoneProgress {
  type: string;
  current: number;
  target: number;
  progress: number;
  isCompleted: boolean;
}

export default function AchievementsPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<AvailableBadge[]>([]);
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('milestones');

  useEffect(() => {
    fetchAchievementsData();
  }, []);

  const fetchAchievementsData = async () => {
    try {
      setLoading(true);
      
      // Simulate user ID - in real app, get from auth
      const userId = 'demo-user-id';
      
      const response = await fetch(`/api/achievements?userId=${userId}`);
      const data = await response.json();

      setMilestones(data.milestones?.earned || []);
      setEarnedBadges(data.badges?.earned || []);
      setAvailableBadges(data.badges?.available || []);
      setMilestoneProgress(data.milestones?.progress || []);

    } catch (error) {
      console.error('Failed to fetch achievements data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'FIRST_LESSON': <BookOpen className="w-6 h-6" />,
      'FIRST_COURSE': <Trophy className="w-6 h-6" />,
      'COURSE_COMPLETE': <Award className="w-6 h-6" />,
      'STREAK_7_DAYS': <Flame className="w-6 h-6" />,
      'STREAK_30_DAYS': <Crown className="w-6 h-6" />,
      'XP_LEVEL_10': <Star className="w-6 h-6" />,
      'XP_LEVEL_25': <Zap className="w-6 h-6" />,
      'XP_LEVEL_50': <Medal className="w-6 h-6" />,
      'PERFECT_SCORE': <Target className="w-6 h-6" />,
      'SPEED_LEARNER': <TrendingUp className="w-6 h-6" />
    };
    return icons[type] || <Trophy className="w-6 h-6" />;
  };

  const getMilestoneColor = (type: string) => {
    const colors: Record<string, string> = {
      'FIRST_LESSON': 'text-blue-600 bg-blue-100',
      'FIRST_COURSE': 'text-green-600 bg-green-100',
      'COURSE_COMPLETE': 'text-purple-600 bg-purple-100',
      'STREAK_7_DAYS': 'text-orange-600 bg-orange-100',
      'STREAK_30_DAYS': 'text-red-600 bg-red-100',
      'XP_LEVEL_10': 'text-yellow-600 bg-yellow-100',
      'XP_LEVEL_25': 'text-indigo-600 bg-indigo-100',
      'XP_LEVEL_50': 'text-pink-600 bg-pink-100',
      'PERFECT_SCORE': 'text-emerald-600 bg-emerald-100',
      'SPEED_LEARNER': 'text-cyan-600 bg-cyan-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalEarnedXP = milestones.reduce((sum, m) => sum + m.xpReward, 0) + 
                       earnedBadges.reduce((sum, b) => sum + (b.badge.xpReward || 0), 0);

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
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center">
          <Trophy className="w-10 h-10 mr-4 text-yellow-500" />
          Achievements
        </h1>
        <p className="text-gray-600 text-lg">Track your learning milestones and unlock rewards</p>
        
        {/* Achievement Stats */}
        <div className="flex justify-center space-x-8 mt-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{milestones.length}</div>
            <div className="text-sm text-gray-600">Milestones</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{earnedBadges.length}</div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{totalEarnedXP}</div>
            <div className="text-sm text-gray-600">XP from Achievements</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          {milestones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-full ${getMilestoneColor(milestone.milestone)}`}>
                        {getMilestoneIcon(milestone.milestone)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        +{milestone.xpReward} XP
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Achieved</span>
                      <span>{formatDate(milestone.achievedAt)}</span>
                    </div>
                    <div className="mt-3 flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  </CardContent>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-bl-full"></div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones Yet</h3>
                <p className="text-gray-600">
                  Start learning to unlock your first achievement milestone!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Tabs defaultValue="earned" className="space-y-4">
            <TabsList>
              <TabsTrigger value="earned">Earned Badges ({earnedBadges.length})</TabsTrigger>
              <TabsTrigger value="available">Available Badges ({availableBadges.length})</TabsTrigger>
            </TabsList>

            {/* Earned Badges */}
            <TabsContent value="earned">
              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {earnedBadges.map((badge) => (
                    <Card key={badge.id} className="relative overflow-hidden">
                      <CardHeader className="text-center pb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-sm">{badge.badge.name}</CardTitle>
                        <CardDescription className="text-xs">{badge.badge.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center">
                          <Badge variant="secondary" className="text-xs mb-2">
                            {badge.badge.category}
                          </Badge>
                          <div className="flex items-center justify-center text-green-600 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Earned {formatDate(badge.earnedAt)}
                          </div>
                        </div>
                      </CardContent>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-400/30 to-transparent rounded-bl-full"></div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Earned</h3>
                    <p className="text-gray-600">
                      Complete learning activities to earn your first badge!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Available Badges */}
            <TabsContent value="available">
              {availableBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {availableBadges.map((badge) => (
                    <Card key={badge.id} className="relative overflow-hidden opacity-75">
                      <CardHeader className="text-center pb-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Lock className="w-8 h-8 text-gray-400" />
                        </div>
                        <CardTitle className="text-sm">{badge.name}</CardTitle>
                        <CardDescription className="text-xs">{badge.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs mb-2">
                            {badge.category}
                          </Badge>
                          <div className="flex items-center justify-center text-gray-500 text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </div>
                        </div>
                      </CardContent>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gray-400/20 to-transparent rounded-bl-full"></div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Badges Earned!</h3>
                    <p className="text-gray-600">
                      Congratulations! You've earned all available badges.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Milestone Progress
              </CardTitle>
              <CardDescription>Track your progress toward various achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {milestoneProgress.length > 0 ? (
                <div className="space-y-6">
                  {milestoneProgress.map((progress) => (
                    <div key={progress.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getMilestoneIcon(progress.type)}
                          <span className="text-sm font-medium">
                            {progress.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {progress.current} / {progress.target}
                        </div>
                      </div>
                      <Progress 
                        value={progress.progress} 
                        className="w-full" 
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{Math.round(progress.progress)}% complete</span>
                        {progress.isCompleted && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No progress data available yet. Start learning to see your progress!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievement Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {milestones.filter(m => 
                    ['FIRST_LESSON', 'FIRST_COURSE', 'COURSE_COMPLETE'].includes(m.milestone)
                  ).length}
                </div>
                <p className="text-sm text-muted-foreground">Learning milestones completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <Flame className="w-5 h-5 mr-2" />
                  Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {milestones.filter(m => 
                    ['STREAK_7_DAYS', 'STREAK_30_DAYS'].includes(m.milestone)
                  ).length}
                </div>
                <p className="text-sm text-muted-foreground">Streak milestones achieved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <Star className="w-5 h-5 mr-2" />
                  Excellence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {milestones.filter(m => 
                    ['XP_LEVEL_10', 'XP_LEVEL_25', 'XP_LEVEL_50', 'PERFECT_SCORE'].includes(m.milestone)
                  ).length}
                </div>
                <p className="text-sm text-muted-foreground">Excellence milestones reached</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}