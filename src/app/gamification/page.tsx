'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Star, Target, Users, Flame, Award, TrendingUp, Calendar } from 'lucide-react'
import GamificationDashboard from '@/components/gamification/GamificationDashboard'
import AchievementCard from '@/components/gamification/AchievementCard'
import StreakTracker from '@/components/gamification/StreakTracker'
import SocialShare from '@/components/gamification/SocialShare'
import { useGamification } from '@/hooks/useGamification'

interface Achievement {
  id: string
  title: string
  description: string
  badge: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  progress: number
  maxProgress: number
  xp: number
  unlocked: boolean
  unlockedAt?: string
}

interface Challenge {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly'
  target: number
  progress: number
  reward: {
    xp: number
    badge?: string
    title?: string
  }
  expiresAt: string
  completed: boolean
}

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  level: number
  xp: number
  avatar?: string
  badge?: string
}

export default function GamificationPage() {
  const { userProfile, achievements, challenges, leaderboard, streakData } = useGamification()
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges' | 'leaderboard' | 'streaks'>('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly')

  // Mock data - in real implementation, this would come from the API
  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first transaction',
      badge: '👶',
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      xp: 100,
      unlocked: true,
      unlockedAt: '2025-01-10T10:00:00Z'
    },
    {
      id: '2',
      title: 'Big Investor',
      description: 'Make a transaction over ₹10,000',
      badge: '💰',
      rarity: 'rare',
      progress: 7500,
      maxProgress: 10000,
      xp: 500,
      unlocked: false
    },
    {
      id: '3',
      title: 'Consistent Trader',
      description: 'Make transactions for 30 consecutive days',
      badge: '📈',
      rarity: 'epic',
      progress: 12,
      maxProgress: 30,
      xp: 1000,
      unlocked: false
    },
    {
      id: '4',
      title: 'Elite Status',
      description: 'Reach level 50',
      badge: '👑',
      rarity: 'legendary',
      progress: 15,
      maxProgress: 50,
      xp: 5000,
      unlocked: false
    }
  ]

  const mockChallenges: Challenge[] = [
    {
      id: '1',
      title: 'Daily Transaction Goal',
      description: 'Complete 3 transactions today',
      type: 'daily',
      target: 3,
      progress: 2,
      reward: { xp: 200, badge: '🎯' },
      expiresAt: '2025-01-14T23:59:59Z',
      completed: false
    },
    {
      id: '2',
      title: 'Weekly Volume Challenge',
      description: 'Achieve ₹50,000 in total transaction volume this week',
      type: 'weekly',
      target: 50000,
      progress: 32500,
      reward: { xp: 1000, title: 'Volume Master' },
      expiresAt: '2025-01-20T23:59:59Z',
      completed: false
    },
    {
      id: '3',
      title: 'Monthly Growth',
      description: 'Increase your portfolio value by 10% this month',
      type: 'monthly',
      target: 10,
      progress: 3.2,
      reward: { xp: 2000, badge: '📊' },
      expiresAt: '2025-01-31T23:59:59Z',
      completed: false
    }
  ]

  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, userId: '1', username: 'CryptoKing', level: 42, xp: 15750, badge: '👑' },
    { rank: 2, userId: '2', username: 'InvestorPro', level: 38, xp: 14200, badge: '💎' },
    { rank: 3, userId: '3', username: 'TradeMaster', level: 35, xp: 12800, badge: '⭐' },
    { rank: 4, userId: '4', username: 'You', level: 15, xp: 5200, badge: '🔥' },
    { rank: 5, userId: '5', username: 'FinanceGuru', level: 14, xp: 4800, badge: '📈' }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
    { id: 'streaks', label: 'Streaks', icon: Flame }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-green-100 text-green-800'
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'monthly': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gamification</h1>
              <p className="text-gray-600 mt-1">Track your progress and compete with others</p>
            </div>
            <div className="flex items-center space-x-4">
              <SocialShare />
            </div>
          </div>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-2xl font-bold text-gray-900">{userProfile.level}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">{userProfile.xp.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{streakData.currentStreak}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rank</p>
                <p className="text-2xl font-bold text-gray-900">#{userProfile.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <GamificationDashboard />
                
                {/* Recent Achievements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockAchievements.filter(a => a.unlocked).slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="relative group">
                        <AchievementCard achievement={achievement} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Challenges */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Challenges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockChallenges.filter(c => !c.completed).slice(0, 2).map((challenge) => (
                      <div key={challenge.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChallengeTypeColor(challenge.type)}`}>
                            {challenge.type}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Reward: {challenge.reward.xp} XP</span>
                            <span>{formatTimeRemaining(challenge.expiresAt)} left</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">All Achievements</h3>
                  <div className="flex space-x-2">
                    {['common', 'rare', 'epic', 'legendary'].map((rarity) => (
                      <button
                        key={rarity}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                          rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                          rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {rarity}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockAchievements.map((achievement) => (
                    <div key={achievement.id} className={`relative rounded-lg border-2 p-4 transition-all hover:shadow-md ${getRarityColor(achievement.rarity)} ${!achievement.unlocked ? 'opacity-60' : ''}`}>
                      <div className="text-center space-y-3">
                        <div className="text-4xl">{achievement.badge}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        </div>
                        {achievement.unlocked ? (
                          <div className="space-y-2">
                            <div className="text-xs text-green-600 font-medium">✓ Unlocked</div>
                            <div className="text-xs text-gray-500">
                              {new Date(achievement.unlockedAt!).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">
                              {achievement.progress}/{achievement.maxProgress}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Reward: {achievement.xp} XP
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <SocialShare achievement={achievement} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Challenges Tab */}
            {activeTab === 'challenges' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Active Challenges</h3>
                  <div className="flex space-x-2">
                    {['daily', 'weekly', 'monthly'].map((type) => (
                      <button
                        key={type}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getChallengeTypeColor(type)}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {mockChallenges.map((challenge) => (
                    <div key={challenge.id} className="bg-white border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChallengeTypeColor(challenge.type)}`}>
                              {challenge.type}
                            </span>
                            {challenge.completed && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{challenge.description}</p>
                        </div>
                        <SocialShare achievement={{
                          id: challenge.id,
                          title: challenge.title,
                          description: challenge.description,
                          level: userProfile.level,
                          xp: challenge.reward.xp
                        }} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium">
                            {challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Reward: {challenge.reward.xp} XP
                            {challenge.reward.badge && ` • ${challenge.reward.badge}`}
                            {challenge.reward.title && ` • ${challenge.reward.title}`}
                          </span>
                          <span className="text-gray-500">
                            {formatTimeRemaining(challenge.expiresAt)} left
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
                  <div className="flex space-x-2">
                    {['weekly', 'monthly', 'all-time'].map((timeframe) => (
                      <button
                        key={timeframe}
                        onClick={() => setSelectedTimeframe(timeframe as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          selectedTimeframe === timeframe
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {timeframe}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {mockLeaderboard.map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-4 ${
                          entry.username === 'You' ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {entry.rank}
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              {entry.avatar || entry.username.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{entry.username}</span>
                                {entry.badge && <span className="text-lg">{entry.badge}</span>}
                              </div>
                              <div className="text-sm text-gray-500">Level {entry.level}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{entry.xp.toLocaleString()} XP</div>
                          <div className="text-sm text-gray-500">Level {entry.level}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Streaks Tab */}
            {activeTab === 'streaks' && (
              <div>
                <StreakTracker />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}