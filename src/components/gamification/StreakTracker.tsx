'use client'

import React, { useState, useEffect } from 'react'
import { Flame, Calendar, Gift, Star } from 'lucide-react'
import { useGamification } from '@/hooks/useGamification'

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalDays: number
  lastActivityDate: string
  streakRewards: Array<{
    days: number
    reward: string
    claimed: boolean
  }>
  weeklyGoal: number
  weeklyProgress: number
}

export default function StreakTracker() {
  const { streakData, updateStreak, claimStreakReward } = useGamification()
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any>(null)

  // Calculate streak visualization data
  const streakMilestones = [
    { days: 3, label: '3 Days', icon: '🔥', color: 'bg-orange-500' },
    { days: 7, label: '1 Week', icon: '⚡', color: 'bg-yellow-500' },
    { days: 14, label: '2 Weeks', icon: '🌟', color: 'bg-blue-500' },
    { days: 30, label: '1 Month', icon: '👑', color: 'bg-purple-500' },
    { days: 60, label: '2 Months', icon: '💎', color: 'bg-pink-500' },
    { days: 100, label: '100 Days', icon: '🏆', color: 'bg-amber-500' }
  ]

  const getStreakProgress = (days: number) => {
    if (streakData.currentStreak >= days) return 'completed'
    if (streakData.currentStreak >= days - 7) return 'in-progress'
    return 'pending'
  }

  const getProgressPercentage = (days: number) => {
    return Math.min((streakData.currentStreak / days) * 100, 100)
  }

  const handleClaimReward = (reward: any) => {
    claimStreakReward(reward.days)
    setShowRewardModal(false)
  }

  const weeklyGoalProgress = Math.min((streakData.weeklyProgress / streakData.weeklyGoal) * 100, 100)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Flame className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Streak Tracker</h3>
            <p className="text-sm text-gray-500">Keep the momentum going!</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">{streakData.currentStreak}</div>
          <div className="text-xs text-gray-500">Current Streak</div>
        </div>
      </div>

      {/* Current Streak Display */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🔥</div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {streakData.currentStreak} Day Streak!
              </div>
              <div className="text-sm text-gray-600">
                Longest: {streakData.longestStreak} days
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last Active</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(streakData.lastActivityDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Weekly Goal</span>
          <span className="text-sm text-gray-500">
            {streakData.weeklyProgress}/{streakData.weeklyGoal} days
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${weeklyGoalProgress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {weeklyGoalProgress >= 100 ? 'Weekly goal achieved!' : `${Math.ceil(streakData.weeklyGoal - streakData.weeklyProgress)} days to go`}
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Milestones</h4>
        <div className="space-y-3">
          {streakMilestones.map((milestone) => {
            const progress = getStreakProgress(milestone.days)
            const percentage = getProgressPercentage(milestone.days)
            const isClaimable = progress === 'completed' && !streakData.streakRewards.find(r => r.days === milestone.days)?.claimed
            
            return (
              <div key={milestone.days} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  progress === 'completed' ? milestone.color : 'bg-gray-200'
                } ${progress === 'in-progress' ? 'ring-2 ring-blue-300' : ''}`}>
                  {milestone.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      progress === 'completed' ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {milestone.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.min(streakData.currentStreak, milestone.days)}/{milestone.days}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        progress === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                {isClaimable && (
                  <button
                    onClick={() => {
                      const reward = streakData.streakRewards.find(r => r.days === milestone.days)
                      if (reward) {
                        setSelectedReward(reward)
                        setShowRewardModal(true)
                      }
                    }}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Claim
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Activity Calendar</h4>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => {
            const day = new Date()
            day.setDate(day.getDate() - (27 - i))
            const isActive = streakData.currentStreak >= (27 - i)
            const isToday = day.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={i}
                className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : isToday
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {day.getDate()}
              </div>
            )
          })}
        </div>
        <div className="text-xs text-gray-500 text-center">
          Last 28 days • Orange squares = active days
        </div>
      </div>

      {/* Reward Modal */}
      {showRewardModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Streak Reward Unlocked!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedReward.reward}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Later
                </button>
                <button
                  onClick={() => handleClaimReward(selectedReward)}
                  className="flex-1 px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700"
                >
                  Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Star className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Streak Tip</h4>
            <p className="text-xs text-blue-700 mt-1">
              Set daily reminders to maintain your streak. Even small activities count!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}