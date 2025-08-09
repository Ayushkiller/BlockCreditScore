import React, { useState } from 'react';
import { 
  TrendingUp, 
  Shield, 
  Users, 
  Zap, 
  Award,
  Eye,
  EyeOff,
  RefreshCw,
  Star,
  Target,
  Brain,
  Lock
} from 'lucide-react';
import { useCreditIntelligence } from '../contexts/CreditIntelligenceContext';

interface CreditDimension {
  name: string;
  score: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: number;
  icon: React.ComponentType<any>;
  color: string;
}

const CreditDashboard: React.FC = () => {
  const { 
    profile, 
    loading, 
    privacyMode, 
    setPrivacyMode, 
    connectedAddress,
    refreshProfile 
  } = useCreditIntelligence();

  // Transform profile data for display
  const displayDimensions: CreditDimension[] = profile ? [
    {
      name: 'DeFi Reliability',
      score: profile.dimensions.defiReliability.score,
      confidence: profile.dimensions.defiReliability.confidence,
      trend: profile.dimensions.defiReliability.trend,
      dataPoints: profile.dimensions.defiReliability.dataPoints,
      icon: Shield,
      color: 'blue'
    },
    {
      name: 'Trading Consistency',
      score: profile.dimensions.tradingConsistency.score,
      confidence: profile.dimensions.tradingConsistency.confidence,
      trend: profile.dimensions.tradingConsistency.trend,
      dataPoints: profile.dimensions.tradingConsistency.dataPoints,
      icon: TrendingUp,
      color: 'green'
    },
    {
      name: 'Staking Commitment',
      score: profile.dimensions.stakingCommitment.score,
      confidence: profile.dimensions.stakingCommitment.confidence,
      trend: profile.dimensions.stakingCommitment.trend,
      dataPoints: profile.dimensions.stakingCommitment.dataPoints,
      icon: Zap,
      color: 'yellow'
    },
    {
      name: 'Governance Participation',
      score: profile.dimensions.governanceParticipation.score,
      confidence: profile.dimensions.governanceParticipation.confidence,
      trend: profile.dimensions.governanceParticipation.trend,
      dataPoints: profile.dimensions.governanceParticipation.dataPoints,
      icon: Users,
      color: 'purple'
    },
    {
      name: 'Liquidity Provider',
      score: profile.dimensions.liquidityProvider.score,
      confidence: profile.dimensions.liquidityProvider.confidence,
      trend: profile.dimensions.liquidityProvider.trend,
      dataPoints: profile.dimensions.liquidityProvider.dataPoints,
      icon: Target,
      color: 'indigo'
    }
  ] : [];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'text-gray-600';
      case 'Gold': return 'text-yellow-600';
      case 'Silver': return 'text-gray-500';
      case 'Bronze': return 'text-orange-600';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading credit profile...</span>
      </div>
    );
  }

  if (!connectedAddress) {
    return (
      <div className="card text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Wallet Connected</h3>
        <p className="text-gray-600 mb-4">Connect your wallet to view your credit intelligence profile</p>
        <p className="text-sm text-gray-500">Use the wallet connection button in the header to get started</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Credit Profile Found</h3>
        <p className="text-gray-600 mb-4">No credit data found for this address</p>
        <button onClick={refreshProfile} className="btn btn-primary">
          Refresh Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Privacy Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Credit Intelligence Profile</h2>
            <p className="text-gray-600 mt-1">
              Wallet: {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                privacyMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{privacyMode ? 'Privacy Mode' : 'Public Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overall Score and Tier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="mb-4">
            <div className={`text-6xl font-bold ${getScoreColor(profile.overallScore)}`}>
              {privacyMode ? '***' : profile.overallScore}
            </div>
            <div className="text-gray-600 font-medium">Overall Credit Score</div>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(profile.tier)} bg-gray-100`}>
            <Star className="w-4 h-4 mr-1" />
            {profile.tier} Tier
          </div>
        </div>

        <div className="card text-center">
          <div className="mb-4">
            <div className="text-4xl font-bold text-blue-600">
              {privacyMode ? '***' : profile.socialCredit.trustScore}
            </div>
            <div className="text-gray-600 font-medium">Social Credit Score</div>
          </div>
          <div className="text-sm text-gray-600">
            Based on P2P lending and community feedback
          </div>
        </div>

        <div className="card text-center">
          <div className="mb-4">
            <div className="text-4xl font-bold text-purple-600">
              {profile.achievements.length}
            </div>
            <div className="text-gray-600 font-medium">Achievements Unlocked</div>
          </div>
          <div className="flex justify-center space-x-1">
            {profile.achievements.slice(0, 3).map((_, index) => (
              <Award key={index} className="w-5 h-5 text-yellow-500" />
            ))}
            {profile.achievements.length > 3 && (
              <span className="text-sm text-gray-500">+{profile.achievements.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* Credit Dimensions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Credit Dimensions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayDimensions.map((dimension, index) => {
            const Icon = dimension.icon;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${dimension.color}-100`}>
                      <Icon className={`w-6 h-6 text-${dimension.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{dimension.name}</h4>
                      <div className="text-sm text-gray-600">
                        {dimension.dataPoints} data points
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                      {privacyMode ? '***' : dimension.score}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getTrendIcon(dimension.trend)} {dimension.trend}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Score</span>
                    <span>{privacyMode ? '***' : `${dimension.score}/1000`}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${dimension.color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: privacyMode ? '0%' : `${dimension.score / 10}%` }}
                    ></div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Confidence</span>
                  <span className={`font-medium ${dimension.confidence >= 80 ? 'text-green-600' : dimension.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {privacyMode ? '***' : `${dimension.confidence}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Predictions */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">AI Risk Predictions</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-1" />
            ML Confidence: {privacyMode ? '***' : `${profile.predictions.confidence}%`}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {privacyMode ? '***' : `${profile.predictions.risk30d}%`}
            </div>
            <div className="text-green-700 font-medium">30-Day Risk</div>
            <div className="text-sm text-green-600 mt-1">Low Risk</div>
          </div>
          
          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {privacyMode ? '***' : `${profile.predictions.risk90d}%`}
            </div>
            <div className="text-yellow-700 font-medium">90-Day Risk</div>
            <div className="text-sm text-yellow-600 mt-1">Moderate Risk</div>
          </div>
          
          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {privacyMode ? '***' : `${profile.predictions.risk180d}%`}
            </div>
            <div className="text-orange-700 font-medium">180-Day Risk</div>
            <div className="text-sm text-orange-600 mt-1">Elevated Risk</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">AI Insights</h4>
              <p className="text-blue-800 text-sm mt-1">
                Your risk profile shows strong DeFi engagement with consistent staking behavior. 
                Consider increasing governance participation to improve long-term predictions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Achievements & Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">{achievement.name}</div>
                <div className="text-sm text-yellow-700">Unlocked</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Next Achievements</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Governance Master (Vote in 10 proposals)</span>
              <span className="text-sm font-medium text-gray-900">7/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Improvement Recommendations</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900">Boost Governance Participation</h4>
              <p className="text-blue-800 text-sm mt-1">
                Your governance score is below average. Participate in 3 more DAO votes to reach the next tier.
              </p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                Find Active Proposals →
              </button>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
            <Shield className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-green-900">Maintain DeFi Consistency</h4>
              <p className="text-green-800 text-sm mt-1">
                Great job! Your DeFi reliability is excellent. Keep up the consistent behavior patterns.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg">
            <Target className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h4 className="font-medium text-yellow-900">Diversify Liquidity Provision</h4>
              <p className="text-yellow-800 text-sm mt-1">
                Consider providing liquidity to 2-3 additional protocols to improve your LP dimension score.
              </p>
              <button className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 font-medium">
                Explore Opportunities →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditDashboard;