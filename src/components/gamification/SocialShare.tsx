'use client'

import React, { useState } from 'react'
import { Share2, Twitter, Facebook, Linkedin, Instagram, Copy, Check, Download, Trophy, Star } from 'lucide-react'
import { useGamification } from '@/hooks/useGamification'

interface SocialShareProps {
  achievement?: {
    id: string
    title: string
    description: string
    badge?: string
    level?: number
    xp?: number
  }
  className?: string
}

export default function SocialShare({ achievement, className = '' }: SocialShareProps) {
  const { userProfile } = useGamification()
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareText, setShareText] = useState('')

  // Generate shareable content
  const generateShareText = () => {
    if (achievement) {
      return `🏆 Just achieved: ${achievement.title}! 

${achievement.description}

Level ${achievement.level || 1} • ${achievement.xp || 0} XP
Join me on INR100 Platform! 🚀`
    }
    
    return `🔥 I'm ${streakDays} days into my streak on INR100 Platform! 

Level ${userProfile.level} • ${userProfile.xp} XP
${userProfile.rank} rank worldwide

Join the challenge! 💪`
  }

  const streakDays = 0 // This should come from streak data

  React.useEffect(() => {
    setShareText(generateShareText())
  }, [achievement, userProfile, streakDays])

  const shareOptions = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`
        window.open(url, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`
        window.open(url, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(shareText)}`
        window.open(url, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  ]

  const downloadAchievementImage = () => {
    // Create a canvas for the achievement image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    canvas.width = 800
    canvas.height = 600

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600)
    gradient.addColorStop(0, '#4F46E5')
    gradient.addColorStop(1, '#7C3AED')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 600)

    // Achievement content
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'

    // Title
    ctx.font = 'bold 48px Arial'
    ctx.fillText('Achievement Unlocked!', 400, 150)

    // Achievement title
    ctx.font = 'bold 36px Arial'
    ctx.fillText(achievement?.title || 'Level Progress', 400, 250)

    // Achievement description
    ctx.font = '24px Arial'
    const lines = (achievement?.description || 'Keep up the great work!').split('\n')
    lines.forEach((line, index) => {
      ctx.fillText(line, 400, 320 + (index * 35))
    })

    // Level/XP info
    ctx.font = 'bold 32px Arial'
    ctx.fillText(`Level ${userProfile.level} • ${userProfile.xp} XP`, 400, 450)

    // Footer
    ctx.font = '20px Arial'
    ctx.fillText('INR100 Platform', 400, 520)

    // Download
    const link = document.createElement('a')
    link.download = `achievement-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <>
      <div className={`inline-flex ${className}`}>
        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Share Your Achievement</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Inspire others with your progress!
                </p>
              </div>

              {/* Achievement Preview */}
              {achievement && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {achievement.badge || '🏆'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Level {achievement.level}</span>
                    <span className="text-gray-500">{achievement.xp} XP</span>
                  </div>
                </div>
              )}

              {/* Share Text Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Share Message</label>
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    className="w-full bg-transparent text-sm resize-none border-none outline-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Share via</label>
                <div className="grid grid-cols-2 gap-3">
                  {shareOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.name}
                        onClick={option.action}
                        className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white transition-colors ${option.color}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{option.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Download Image Option */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Or download image</label>
                <button
                  onClick={downloadAchievementImage}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Download Achievement Image</span>
                </button>
              </div>

              {/* Close Button */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Quick share button for achievements
export function AchievementShareButton({ achievement }: { achievement: any }) {
  return (
    <SocialShare 
      achievement={achievement} 
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    />
  )
}

// Quick share button for streak
export function StreakShareButton() {
  return (
    <SocialShare className="opacity-0 group-hover:opacity-100 transition-opacity" />
  )
}