import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  Star, 
  Trophy, 
  Target, 
  Zap,
  Heart,
  MessageCircle,
  ThumbsUp,
  Gift,
  Crown,
  Flame
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: string;
}

interface SocialActivity {
  id: string;
  type: 'lending' | 'borrowing' | 'feedback' | 'referral';
  counterparty: string;
  amount: number;
  status: 'completed' | 'active' | 'disputed';
  timestamp: number;
  reputation: number;
}

const SocialCreditPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Mock data
  const socialStats = {
    overallRating: 4.8,
    totalTransactions: 47,
    successRate: 98.2,
    communityRank: 156,
    referrals: 12,
    trustScore: 892
  };

  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'DeFi Pioneer',
      description: 'Complete your first DeFi transaction',
      icon: Star,
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: '+50 Social Credit'
    },
    {
      id: '2',
      name: 'Trusted Lender',
      description: 'Successfully complete 10 P2P lending transactions',
      icon: Heart,
      rarity: 'rare',
      progress: 8,
      maxProgress: 10,
      unlocked: false,
      reward: '+200 Social Credit + Lender Badge'
    },
    {
      id: '3',
      name: 'Community Builder',
      description: 'Refer 5 users who achieve good credit scores',
      icon: Users,
      rarity: 'epic',
      progress: 3,
      maxProgress: 5,
      unlocked: false,
      reward: '+500 Social Credit + Referral Multiplier'
    },
    {
      id: '4',
      name: 'Governance Guardian',
      description: 'Participate in 25 DAO governance votes',
      icon: Crown,
      rarity: 'legendary',
      progress: 18,
      maxProgress: 25,
      unlocked: false,
      reward: '+1000 Social Credit + Governance NFT'
    }
  ];

  const recentActivity: SocialActivity[] = [
    {
      id: '1',
      type: 'lending',
      counterparty: '0x742d...5b8c',
      amount: 1500,
      status: 'completed',
      timestamp: Date.now() - 86400000,
      reputation: 95
    },
    {
      id: '2',
      type: 'feedback',
      counterparty: '0x891a...2d4f',
      amount: 0,
      status: 'completed',
      timestamp: Date.now() - 172800000,
      reputation: 88
    },
    {
      id: '3',
      type: 'referral',
      counterparty: '0x456b...8e9a',
      amount: 0,
      status: 'active',
      timestamp: Date.now() - 259200000,
      reputation: 0
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lending': return Heart;
      case 'borrowing': return Target;
      case 'feedback': return MessageCircle;
      case 'referral': return Gift;
      default: return Users;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Social Credit & Gamification</h2>
            <p className="text-gray-600 mt-1">
              Build your reputation through community interactions and unlock achievements
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-lg font-semibold text-gray-900">Level 12</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'activity', label: 'Social Activity', icon: MessageCircle },
            { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Social Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.floor(socialStats.overallRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {socialStats.overallRating}
              </div>
              <div className="text-gray-600 font-medium">Community Rating</div>
              <div className="text-sm text-gray-500 mt-1">
                Based on {socialStats.totalTransactions} interactions
              </div>
            </div>

            <div className="card text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {socialStats.successRate}%
              </div>
              <div className="text-gray-600 font-medium">Success Rate</div>
              <div className="text-sm text-gray-500 mt-1">
                {socialStats.totalTransactions} total transactions
              </div>
            </div>

            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                #{socialStats.communityRank}
              </div>
              <div className="text-gray-600 font-medium">Community Rank</div>
              <div className="text-sm text-gray-500 mt-1">
                Top 5% of all users
              </div>
            </div>
          </div>

          {/* Trust Network */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Trust Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Trust Connections</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Verified Lenders</div>
                        <div className="text-sm text-gray-600">High-trust connections</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">8</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Referral Network</div>
                        <div className="text-sm text-gray-600">Users you've referred</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{socialStats.referrals}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Recent Feedback</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">0x742d...5b8c</span>
                      </div>
                      <span className="text-sm text-gray-500">2 days ago</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      "Excellent borrower, repaid on time with clear communication throughout."
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4].map((star) => (
                            <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                          <Star className="w-4 h-4 text-gray-300" />
                        </div>
                        <span className="text-sm text-gray-600">0x891a...2d4f</span>
                      </div>
                      <span className="text-sm text-gray-500">1 week ago</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      "Good experience overall, minor delay in communication but resolved quickly."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Progress */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Achievement Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
                
                return (
                  <div
                    key={achievement.id}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      achievement.unlocked
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                    onClick={() => setSelectedAchievement(achievement)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      {achievement.unlocked && (
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-blue-600">
                      Reward: {achievement.reward}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seasonal Challenges */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Seasonal Challenges</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-purple-600" />
                    <div>
                      <h4 className="font-semibold text-purple-900">DeFi Summer Challenge</h4>
                      <p className="text-sm text-purple-700">Complete 5 different protocol interactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">3/5</div>
                    <div className="text-sm text-purple-600">15 days left</div>
                  </div>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="mt-3 text-sm font-medium text-purple-700">
                  Reward: Exclusive NFT + 1000 Social Credit
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Activity Tab */}
      {activeTab === 'activity' && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Social Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {activity.type} {activity.type === 'referral' ? 'Program' : 'Transaction'}
                      </div>
                      <div className="text-sm text-gray-600">
                        With {activity.counterparty}
                        {activity.amount > 0 && ` • $${activity.amount.toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Community Leaderboard</h3>
          <div className="space-y-4">
            {[
              { rank: 1, address: '0x1234...5678', score: 967, badge: 'Legendary' },
              { rank: 2, address: '0x2345...6789', score: 943, badge: 'Epic' },
              { rank: 3, address: '0x3456...789a', score: 921, badge: 'Epic' },
              { rank: 156, address: 'You', score: 892, badge: 'Rare', isUser: true }
            ].map((user, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  user.isUser ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    user.rank === 1 ? 'bg-yellow-500 text-white' :
                    user.rank === 2 ? 'bg-gray-400 text-white' :
                    user.rank === 3 ? 'bg-orange-500 text-white' :
                    user.isUser ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {user.rank <= 3 ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      user.rank
                    )}
                  </div>
                  <div>
                    <div className={`font-medium ${user.isUser ? 'text-blue-900' : 'text-gray-900'}`}>
                      {user.address}
                    </div>
                    <div className={`text-sm ${user.isUser ? 'text-blue-600' : 'text-gray-600'}`}>
                      {user.badge} Tier
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${user.isUser ? 'text-blue-600' : 'text-gray-900'}`}>
                    {user.score}
                  </div>
                  <div className={`text-sm ${user.isUser ? 'text-blue-600' : 'text-gray-600'}`}>
                    Social Credit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialCreditPanel;