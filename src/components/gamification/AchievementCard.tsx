'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Gift, 
  Share2,
  Lock,
  CheckCircle
} from 'lucide-react';

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
  requirements: any[];
  tier?: number;
  isUnlocked?: boolean;
}

interface AchievementCardProps {
  achievement: Achievement;
  onClaim?: () => void;
  onShare?: (platform: string) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onClaim,
  onShare
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trading':
        return '📈';
      case 'learning':
        return '📚';
      case 'social':
        return '👥';
      case 'streak':
        return '🔥';
      default:
        return '⭐';
    }
  };

  const progressPercentage = achievement.maxProgress ? 
    (achievement.progress! / achievement.maxProgress) * 100 : 0;

  const canClaim = achievement.isUnlocked && !achievement.unlockedAt;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      achievement.isUnlocked ? 'ring-2 ring-green-200' : ''
    }`}>
      {/* Rarity Border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(achievement.rarity)} opacity-10`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center text-white font-bold text-xl`}>
              {achievement.isUnlocked ? (
                <Trophy className="h-6 w-6" />
              ) : (
                <span>{getCategoryIcon(achievement.category)}</span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{achievement.title}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {achievement.category}
              </Badge>
            </div>
          </div>
          
          {/* Rarity Badge */}
          <Badge 
            variant="secondary" 
            className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white border-0`}
          >
            {achievement.rarity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{achievement.description}</p>

        {/* Progress Bar */}
        {!achievement.isUnlocked && achievement.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{achievement.progress}/{achievement.maxProgress}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Requirements */}
        {achievement.requirements.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Requirements:</p>
            {achievement.requirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                {achievement.isUnlocked ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                )}
                <span className={achievement.isUnlocked ? 'text-green-600' : 'text-gray-600'}>
                  {req.description || `${req.target} ${req.unit}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">+{achievement.xpReward} XP</span>
            </div>
            {achievement.coinReward > 0 && (
              <div className="flex items-center space-x-1">
                <Gift className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">+{achievement.coinReward} coins</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {achievement.isUnlocked && (
              <>
                {!achievement.unlockedAt && (
                  <Button size="sm" onClick={onClaim}>
                    Claim
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onShare?.('twitter')}>
                  <Share2 className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {!achievement.isUnlocked && (
              <div className="flex items-center space-x-1 text-gray-500">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Unlocked Timestamp */}
        {achievement.unlockedAt && (
          <div className="text-xs text-green-600 text-center">
            Unlocked on {achievement.unlockedAt.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementCard;