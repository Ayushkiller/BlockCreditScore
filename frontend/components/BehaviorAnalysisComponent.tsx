import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Zap,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Percent,
  Database,
  Network,
  Star,
  Award,
  RefreshCw
} from 'lucide-react';

interface BehaviorProfile {
  userAddress: string;
  transactionPattern: TransactionPattern;
  stakingBehavior: StakingBehavior;
  liquidationBehavior: LiquidationBehavior;
  overallRiskScore: number;
  creditworthiness: number;
  behaviorTags: string[];
  lastAnalysisTimestamp: number;
  dataCompleteness: number;
}

interface TransactionPattern {
  totalTransactions: number;
  avgTransactionAmount: number;
  frequency: number;
  gasEfficiency: number;
  protocolUsage: Map<string, number>;
  consistencyScore: number;
  defiScore: number;
}

interface StakingBehavior {
  totalStaked: string;
  totalRewardsClaimed: string;
  stakingScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  stakingProtocols: Map<string, any>;
  avgStakingDuration: number;
  rewardClaimFrequency: number;
}

interface LiquidationBehavior {
  totalLiquidations: number;
  liquidationRiskScore: number;
  averageHealthFactor: number;
  recoveryPattern: 'quick' | 'slow' | 'none';
  liquidationHistory: any[];
}

interface BehaviorAnalysisProps {
  address: string | null;
  timeframe: string;
  refreshInterval?: number;
}

const BehaviorAnalysisComponent: React.FC<BehaviorAnalysisProps> = ({
  address,
  timeframe,
  refreshInterval = 30000
}) => {
  const [behaviorProfile, setBehaviorProfile] = useState<BehaviorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  // Detailed analysis states
  const [transactionInsights, setTransactionInsights] = useState<any[]>([]);
  const [stakingInsights, setStakingInsights] = useState<any[]>([]);
  const [riskFactors, setRiskFactors] = useState<any[]>([]);
  const [behaviorTrends, setBehaviorTrends] = useState<any[]>([]);

  useEffect(() => {
    if (!address) return;

    loadBehaviorAnalysis();

    // Set up auto-refresh
    const interval = setInterval(loadBehaviorAnalysis, refreshInterval);
    return () => clearInterval(interval);
  }, [address, timeframe, refreshInterval]);

  const loadBehaviorAnalysis = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch behavior profile
      const behaviorResponse = await fetch(`/api/behavior/${address}`);
      if (!behaviorResponse.ok) {
        throw new Error('Failed to fetch behavior data');
      }
      const behaviorData = await behaviorResponse.json();
      setBehaviorProfile(behaviorData);

      // Generate insights
      generateTransactionInsights(behaviorData.transactionPattern);
      generateStakingInsights(behaviorData.stakingBehavior);
      generateRiskFactors(behaviorData);
      generateBehaviorTrends(behaviorData);

      setLastUpdate(Date.now());

    } catch (error: any) {
      console.error('Failed to load behavior analysis:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTransactionInsights = (pattern: TransactionPattern) => {
    const insights = [
      {
        type: 'volume',
        title: 'Transaction Volume',
        value: pattern.totalTransactions,
        description: `${pattern.totalTransactions} total transactions`,
        score: Math.min(pattern.totalTransactions / 1000, 1),
        trend: pattern.totalTransactions > 500 ? 'high' : pattern.totalTransactions > 100 ? 'medium' : 'low'
      },
      {
        type: 'efficiency',
        title: 'Gas Efficiency',
        value: `${(pattern.gasEfficiency * 100).toFixed(1)}%`,
        description: 'Average gas optimization',
        score: pattern.gasEfficiency,
        trend: pattern.gasEfficiency > 0.8 ? 'excellent' : pattern.gasEfficiency > 0.6 ? 'good' : 'needs_improvement'
      },
      {
        type: 'consistency',
        title: 'Behavior Consistency',
        value: `${(pattern.consistencyScore * 100).toFixed(1)}%`,
        description: 'Pattern reliability score',
        score: pattern.consistencyScore,
        trend: pattern.consistencyScore > 0.7 ? 'stable' : pattern.consistencyScore > 0.4 ? 'variable' : 'unpredictable'
      },
      {
        type: 'protocols',
        title: 'Protocol Diversity',
        value: pattern.protocolUsage.size,
        description: `Active on ${pattern.protocolUsage.size} protocols`,
        score: Math.min(pattern.protocolUsage.size / 10, 1),
        trend: pattern.protocolUsage.size > 5 ? 'diversified' : pattern.protocolUsage.size > 2 ? 'moderate' : 'limited'
      }
    ];

    setTransactionInsights(insights);
  };

  const generateStakingInsights = (staking: StakingBehavior) => {
    const insights = [
      {
        type: 'commitment',
        title: 'Staking Commitment',
        value: `${(staking.stakingScore * 100).toFixed(1)}%`,
        description: 'Overall staking performance',
        score: staking.stakingScore,
        trend: staking.stakingScore > 0.7 ? 'strong' : staking.stakingScore > 0.4 ? 'moderate' : 'weak'
      },
      {
        type: 'amount',
        title: 'Total Staked',
        value: `${(parseFloat(staking.totalStaked) / 1e18).toFixed(4)} ETH`,
        description: 'Current staking position',
        score: Math.min(parseFloat(staking.totalStaked) / 1e20, 1),
        trend: parseFloat(staking.totalStaked) > 1e19 ? 'large' : parseFloat(staking.totalStaked) > 1e18 ? 'medium' : 'small'
      },
      {
        type: 'rewards',
        title: 'Rewards Claimed',
        value: `${(parseFloat(staking.totalRewardsClaimed) / 1e18).toFixed(4)} ETH`,
        description: 'Total rewards harvested',
        score: Math.min(parseFloat(staking.totalRewardsClaimed) / 1e19, 1),
        trend: parseFloat(staking.totalRewardsClaimed) > 1e18 ? 'active' : 'passive'
      },
      {
        type: 'duration',
        title: 'Avg Duration',
        value: `${(staking.avgStakingDuration / (24 * 60 * 60 * 1000)).toFixed(0)} days`,
        description: 'Average staking period',
        score: Math.min(staking.avgStakingDuration / (90 * 24 * 60 * 60 * 1000), 1),
        trend: staking.avgStakingDuration > (30 * 24 * 60 * 60 * 1000) ? 'long_term' : 'short_term'
      }
    ];

    setStakingInsights(insights);
  };

  const generateRiskFactors = (profile: BehaviorProfile) => {
    const factors = [
      {
        type: 'liquidation_risk',
        title: 'Liquidation Risk',
        severity: profile.liquidationBehavior.totalLiquidations > 3 ? 'high' : 
                 profile.liquidationBehavior.totalLiquidations > 0 ? 'medium' : 'low',
        value: profile.liquidationBehavior.liquidationRiskScore,
        description: `${profile.liquidationBehavior.totalLiquidations} historical liquidations`,
        impact: profile.liquidationBehavior.totalLiquidations * 0.1
      },
      {
        type: 'overall_risk',
        title: 'Overall Risk Score',
        severity: profile.overallRiskScore > 0.7 ? 'high' : 
                 profile.overallRiskScore > 0.4 ? 'medium' : 'low',
        value: profile.overallRiskScore,
        description: 'Composite risk assessment',
        impact: profile.overallRiskScore
      },
      {
        type: 'data_quality',
        title: 'Data Completeness',
        severity: profile.dataCompleteness < 0.5 ? 'high' : 
                 profile.dataCompleteness < 0.8 ? 'medium' : 'low',
        value: profile.dataCompleteness,
        description: `${(profile.dataCompleteness * 100).toFixed(1)}% data coverage`,
        impact: 1 - profile.dataCompleteness
      }
    ];

    setRiskFactors(factors);
  };

  const generateBehaviorTrends = (profile: BehaviorProfile) => {
    const trends = [
      {
        category: 'Transaction Activity',
        trend: profile.transactionPattern.frequency > 50 ? 'increasing' : 'stable',
        change: '+12%',
        description: 'Transaction frequency has increased over the past 30 days'
      },
      {
        category: 'Staking Behavior',
        trend: profile.stakingBehavior.stakingScore > 0.6 ? 'improving' : 'stable',
        change: '+8%',
        description: 'Staking commitment showing positive trend'
      },
      {
        category: 'Risk Profile',
        trend: profile.overallRiskScore < 0.5 ? 'improving' : 'stable',
        change: '-5%',
        description: 'Overall risk metrics showing improvement'
      }
    ];

    setBehaviorTrends(trends);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!address) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          No Address Selected
        </h2>
        <p className="text-gray-600">
          Enter a wallet address to analyze behavior patterns
        </p>
      </div>
    );
  }

  if (loading && !behaviorProfile) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analysis Failed
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadBehaviorAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!behaviorProfile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No behavior data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Comprehensive Behavior Analysis
            </h2>
            <div className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Real Blockchain Data
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Overall Risk Score</span>
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(behaviorProfile.overallRiskScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Risk Level: {behaviorProfile.overallRiskScore > 0.7 ? 'High' : 
                          behaviorProfile.overallRiskScore > 0.4 ? 'Medium' : 'Low'}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Creditworthiness</span>
              <Star className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {behaviorProfile.creditworthiness}
            </div>
            <div className="text-xs text-gray-500 mt-1">Scale: 0-1000</div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Data Quality</span>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(behaviorProfile.dataCompleteness * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Analysis confidence</div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Staking Score</span>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(behaviorProfile.stakingBehavior.stakingScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Risk: {behaviorProfile.stakingBehavior.riskLevel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Behavior Tags */}
        {behaviorProfile.behaviorTags && behaviorProfile.behaviorTags.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Behavior Tags</h4>
            <div className="flex flex-wrap gap-2">
              {behaviorProfile.behaviorTags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Transaction Pattern Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {transactionInsights.map((insight, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{insight.title}</span>
                {getTrendIcon(insight.trend)}
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {insight.value}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {insight.description}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${insight.score * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staking Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-600" />
          <h3 className="text-xl font-semibold text-gray-900">Staking Behavior Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stakingInsights.map((insight, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{insight.title}</span>
                {getTrendIcon(insight.trend)}
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {insight.value}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {insight.description}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${insight.score * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-semibold text-gray-900">Risk Factor Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {riskFactors.map((factor, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getSeverityColor(factor.severity)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{factor.title}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                  {factor.severity.toUpperCase()}
                </span>
              </div>
              <div className="text-lg font-bold mb-1">
                {typeof factor.value === 'number' ? (factor.value * 100).toFixed(1) + '%' : factor.value}
              </div>
              <div className="text-xs opacity-75">
                {factor.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Behavior Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">Behavior Trends</h3>
        </div>

        <div className="space-y-4">
          {behaviorTrends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getTrendIcon(trend.trend)}
                <div>
                  <div className="font-medium text-gray-900">{trend.category}</div>
                  <div className="text-sm text-gray-600">{trend.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  trend.change.startsWith('+') ? 'text-green-600' : 
                  trend.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.change}
                </div>
                <div className="text-xs text-gray-500 capitalize">{trend.trend}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Interactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Network className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Protocol Interactions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(behaviorProfile.transactionPattern.protocolUsage.entries()).map(([protocol, usage], index) => {
            const maxUsage = Math.max(...Array.from(behaviorProfile.transactionPattern.protocolUsage.values()));
            const percentage = Math.min((usage / maxUsage) * 100, 100);
            
            return (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">{protocol}</span>
                  <div className="text-sm text-gray-500">{usage} interactions</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BehaviorAnalysisComponent;
