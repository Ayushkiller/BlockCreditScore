import React, { useState, useEffect } from "react";
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
  Lock,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  DollarSign,
  Percent,
} from "lucide-react";
import { useCreditIntelligence } from "../contexts/CreditIntelligenceContext";
import RealTimePriceDisplay from "./RealTimePriceDisplay";
import USDValueDisplay from "./USDValueDisplay";
import RealTimeEventMonitor from "./RealTimeEventMonitor";
import RealTimeScoreTracker from "./RealTimeScoreTracker";

interface CreditDimension {
  name: string;
  score: number;
  confidence: number;
  trend: "improving" | "stable" | "declining";
  dataPoints: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface BlockchainEvent {
  id: string;
  eventName: string;
  protocol: string;
  userAddress: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  confirmations: number;
  isConfirmed: boolean;
  amount?: string;
  token?: string;
  status: "pending" | "confirmed" | "failed";
}

interface EventMonitoringStatus {
  isConnected: boolean;
  currentBlock: number;
  eventsPerSecond: number;
  pendingEvents: number;
  confirmedEvents: number;
  provider: string;
  lastUpdate: number;
}

// Real User Behavior Analysis Component with Staking and Liquidation Insights
const RealUserBehaviorAnalysis: React.FC<{
  userAddress: string | null;
  privacyMode: boolean;
}> = ({ userAddress, privacyMode }) => {
  const [behaviorProfile, setBehaviorProfile] = useState<any>(null);
  const [stakingBehavior, setStakingBehavior] = useState<any>(null);
  const [liquidationRisk, setLiquidationRisk] = useState<any>(null);
  const [transactionPatterns, setTransactionPatterns] = useState<any>(null);
  const [behaviorInsights, setBehaviorInsights] = useState<any>(null);
  const [stakingRewards, setStakingRewards] = useState<any[]>([]);
  const [liquidationHistory, setLiquidationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;

    const loadUserBehaviorAnalysis = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );

        // Get comprehensive user behavior analysis using real blockchain data
        const [
          profile,
          staking,
          liquidation,
          patterns,
          insights,
          rewards,
          history,
        ] = await Promise.all([
          creditIntelligenceService.getUserBehaviorProfile?.(userAddress),
          creditIntelligenceService.getStakingBehaviorAnalysis?.(userAddress),
          creditIntelligenceService.getLiquidationRiskIndicators?.(userAddress),
          creditIntelligenceService.getTransactionPatternAnalysis?.(
            userAddress
          ),
          creditIntelligenceService.getUserBehaviorInsights?.(userAddress),
          creditIntelligenceService.getStakingRewardsHistory?.(userAddress),
          creditIntelligenceService.getLiquidationHistory?.(userAddress),
        ]);

        if (profile) {
          setBehaviorProfile(profile);
        }

        if (staking) {
          setStakingBehavior(staking);
        }

        if (liquidation) {
          setLiquidationRisk(liquidation);
        }

        if (patterns) {
          setTransactionPatterns(patterns);
        }

        if (insights) {
          setBehaviorInsights(insights);
        }

        if (rewards) {
          setStakingRewards(rewards);
        }

        if (history) {
          setLiquidationHistory(history);
        }
      } catch (error) {
        console.error("Failed to load user behavior analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserBehaviorAnalysis();

    // Set up real-time updates every 60 seconds
    const interval = setInterval(loadUserBehaviorAnalysis, 60000);
    return () => clearInterval(interval);
  }, [userAddress]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Analyzing user behavior...</span>
        </div>
      </div>
    );
  }

  if (!behaviorProfile) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No behavior data available</p>
          <p className="text-sm">
            Connect a wallet to analyze behavior patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Behavior Overview */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Real User Behavior Analysis
          </h3>
          <div className="text-sm text-gray-500">
            Based on actual blockchain data
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Risk Score */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Overall Risk Score
              </span>
              <Shield className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {privacyMode
                ? "***"
                : (behaviorProfile.overallRiskScore * 100).toFixed(1)}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Risk Level:{" "}
              {behaviorProfile.overallRiskScore > 0.7
                ? "High"
                : behaviorProfile.overallRiskScore > 0.4
                  ? "Medium"
                  : "Low"}
            </div>
          </div>

          {/* Creditworthiness Score */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Creditworthiness
              </span>
              <Star className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {privacyMode ? "***" : behaviorProfile.creditworthiness}
            </div>
            <div className="text-xs text-gray-500 mt-1">Scale: 0-1000</div>
          </div>

          {/* Data Completeness */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Data Completeness
              </span>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {privacyMode
                ? "***"
                : (behaviorProfile.dataCompleteness * 100).toFixed(1)}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Analysis confidence
            </div>
          </div>
        </div>

        {/* Behavior Tags */}
        {behaviorProfile.behaviorTags &&
          behaviorProfile.behaviorTags.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Behavior Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {behaviorProfile.behaviorTags.map(
                  (tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
      </div>

      {/* Staking Behavior Analysis */}
      {stakingBehavior && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Staking Behavior Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Staked
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(parseFloat(stakingBehavior.totalStaked) / 1e18).toFixed(4)} ETH`}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Rewards Claimed
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(parseFloat(stakingBehavior.totalRewardsClaimed) / 1e18).toFixed(4)} ETH`}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Staking Score
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : (stakingBehavior.stakingScore * 100).toFixed(1)}
                %
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Risk Level
              </div>
              <div
                className={`text-lg font-bold ${
                  stakingBehavior.riskLevel === "low"
                    ? "text-green-600"
                    : stakingBehavior.riskLevel === "medium"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {stakingBehavior.riskLevel.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Staking Protocols */}
          {stakingBehavior.stakingProtocols &&
            stakingBehavior.stakingProtocols.size > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Staking Protocols
                </h4>
                <div className="space-y-2">
                  {Array.from(stakingBehavior.stakingProtocols.entries()).map(
                    ([protocol, data]: [string, any]) => (
                      <div
                        key={protocol}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {protocol.replace(/_/g, " ")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {data.activeStakes} active stakes
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {privacyMode
                              ? "***"
                              : `${(parseFloat(data.totalStaked) / 1e18).toFixed(4)} ETH`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {privacyMode
                              ? "***"
                              : `${(parseFloat(data.totalRewards) / 1e18).toFixed(4)} ETH rewards`}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Liquidation Risk Indicators */}
      {liquidationRisk && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Liquidation Risk Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Liquidations
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode ? "***" : liquidationRisk.totalLiquidations}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Risk Score
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : (liquidationRisk.liquidationRiskScore * 100).toFixed(1)}
                %
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Avg Health Factor
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : liquidationRisk.averageHealthFactor?.toFixed(2) || "N/A"}
              </div>
            </div>
          </div>

          {liquidationHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Recent Liquidation Events
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {liquidationHistory
                  .slice(0, 5)
                  .map((event: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {event.protocol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(
                            event.timestamp * 1000
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-600">
                          {privacyMode
                            ? "***"
                            : `${(parseFloat(event.liquidatedAmount) / 1e18).toFixed(4)} ETH`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.type === "liquidated"
                            ? "Liquidated"
                            : "Liquidator"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Pattern Analysis */}
      {transactionPatterns && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Transaction Pattern Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Transactions
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : transactionPatterns.totalTransactions?.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Avg Frequency
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${transactionPatterns.averageFrequency?.toFixed(1)}/day`}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Protocol Diversity
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode ? "***" : transactionPatterns.protocolDiversity}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Behavior Score
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : (transactionPatterns.behaviorScore * 100).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// This component was missing and its code was misplaced. I have reconstructed it here.
const RealTransactionAnalysis: React.FC<{
  userAddress: string | null;
  privacyMode: boolean;
}> = ({ userAddress, privacyMode }) => {
  const [transactionProfile, setTransactionProfile] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Map<string, number>
  >(new Map());
  const [gasMetrics, setGasMetrics] = useState<any>(null);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;

    const loadTransactionAnalysis = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );
        const [profile, categories, gas, risk, confirmedTxs] =
          await Promise.all([
            creditIntelligenceService.getTransactionProfile?.(userAddress),
            creditIntelligenceService.getTransactionCategoryBreakdown?.(
              userAddress
            ),
            creditIntelligenceService.getGasEfficiencyMetrics?.(userAddress),
            creditIntelligenceService.getTransactionRiskMetrics?.(userAddress),
            creditIntelligenceService.getConfirmedTransactions?.(
              userAddress,
              10
            ),
          ]);

        if (profile) setTransactionProfile(profile);
        if (categories)
          setCategoryBreakdown(new Map(Object.entries(categories)));
        if (gas) setGasMetrics(gas);
        if (risk) setRiskMetrics(risk);
        if (confirmedTxs) setRecentTransactions(confirmedTxs);
      } catch (error) {
        console.error("Failed to load transaction analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactionAnalysis();

    // Refresh every 2 minutes
    const interval = setInterval(loadTransactionAnalysis, 120000);
    return () => clearInterval(interval);
  }, [userAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">
          Analyzing transaction patterns...
        </span>
      </div>
    );
  }

  if (!transactionProfile) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No transaction data available</p>
        <p className="text-sm text-gray-500 mt-1">
          Make some transactions to see analysis here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {privacyMode ? "***" : transactionProfile.totalTransactions}
              </div>
              <div className="text-sm text-blue-700">Total Transactions</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">
                {privacyMode
                  ? "***"
                  : `${(transactionProfile.gasEfficiencyScore * 100).toFixed(0)}%`}
              </div>
              <div className="text-sm text-green-700">Gas Efficiency</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {privacyMode
                  ? "***"
                  : `${((1 - transactionProfile.riskScore) * 100).toFixed(0)}%`}
              </div>
              <div className="text-sm text-yellow-700">Safety Score</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {privacyMode
                  ? "***"
                  : `${(transactionProfile.creditScore * 1000).toFixed(0)}`}
              </div>
              <div className="text-sm text-purple-700">Credit Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Transaction Categories
        </h4>

        {categoryBreakdown.size > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from(categoryBreakdown.entries()).map(
              ([category, count]) => (
                <div
                  key={category}
                  className="text-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-lg font-semibold text-gray-900">
                    {privacyMode ? "***" : count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {category.replace("_", " ")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {privacyMode
                      ? "***"
                      : `${((count / transactionProfile.totalTransactions) * 100).toFixed(1)}%`}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            No transaction categories available
          </div>
        )}
      </div>

      {/* Gas Efficiency Metrics */}
      {gasMetrics && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Gas Efficiency Analysis
            <div
              className={`ml-2 px-2 py-1 rounded text-xs ${
                gasMetrics.gasEfficiencyRating === "excellent"
                  ? "bg-green-100 text-green-700"
                  : gasMetrics.gasEfficiencyRating === "good"
                    ? "bg-blue-100 text-blue-700"
                    : gasMetrics.gasEfficiencyRating === "average"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
              }`}
            >
              {gasMetrics.gasEfficiencyRating}
            </div>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="font-medium text-gray-800 mb-3">
                Gas Price Statistics
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Gas Price:</span>
                  <span className="font-medium">
                    {privacyMode
                      ? "***"
                      : `${(gasMetrics.avgGasPrice / 1e9).toFixed(1)} gwei`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Median Gas Price:</span>
                  <span className="font-medium">
                    {privacyMode
                      ? "***"
                      : `${(gasMetrics.medianGasPrice / 1e9).toFixed(1)} gwei`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Percentile:</span>
                  <span
                    className={`font-medium ${
                      gasMetrics.comparedToNetwork.percentile <= 25
                        ? "text-green-600"
                        : gasMetrics.comparedToNetwork.percentile <= 50
                          ? "text-blue-600"
                          : gasMetrics.comparedToNetwork.percentile <= 75
                            ? "text-yellow-600"
                            : "text-red-600"
                    }`}
                  >
                    {privacyMode
                      ? "***"
                      : `${gasMetrics.comparedToNetwork.percentile}th`}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-3">
                Efficiency Metrics
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Optimization Score:</span>
                  <span className="font-medium text-blue-600">
                    {privacyMode
                      ? "***"
                      : `${gasMetrics.gasOptimizationScore}/100`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trend:</span>
                  <span
                    className={`font-medium ${
                      gasMetrics.historicalTrend === "improving"
                        ? "text-green-600"
                        : gasMetrics.historicalTrend === "declining"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {gasMetrics.historicalTrend === "improving"
                      ? "📈 Improving"
                      : gasMetrics.historicalTrend === "declining"
                        ? "📉 Declining"
                        : "➡️ Stable"}
                  </span>
                </div>
                {gasMetrics.comparedToNetwork.savingsOpportunity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Opportunity:</span>
                    <span className="font-medium text-orange-600">
                      {privacyMode
                        ? "***"
                        : `${gasMetrics.comparedToNetwork.savingsOpportunity.toFixed(1)}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-3">
                Recommendations
              </h5>
              <div className="space-y-1">
                {gasMetrics.recommendations
                  .slice(0, 3)
                  .map((rec: string, index: number) => (
                    <div
                      key={index}
                      className="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                    >
                      • {privacyMode ? "Optimization tip available" : rec}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      {riskMetrics && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Transaction Risk Analysis
            <div
              className={`ml-2 px-2 py-1 rounded text-xs ${
                riskMetrics.overallRiskScore < 0.3
                  ? "bg-green-100 text-green-700"
                  : riskMetrics.overallRiskScore < 0.6
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {riskMetrics.overallRiskScore < 0.3
                ? "Low Risk"
                : riskMetrics.overallRiskScore < 0.6
                  ? "Medium Risk"
                  : "High Risk"}
            </div>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-800 mb-3">Risk Factors</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">High Gas Price Txs:</span>
                  <span className="font-medium">
                    {privacyMode
                      ? "***"
                      : riskMetrics.riskFactors.highGasPriceTransactions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed Transactions:</span>
                  <span className="font-medium">
                    {privacyMode
                      ? "***"
                      : riskMetrics.riskFactors.failedTransactions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Liquidation Events:</span>
                  <span
                    className={`font-medium ${
                      riskMetrics.riskFactors.liquidationEvents > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {privacyMode
                      ? "***"
                      : riskMetrics.riskFactors.liquidationEvents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suspicious Patterns:</span>
                  <span
                    className={`font-medium ${
                      riskMetrics.riskFactors.suspiciousPatterns > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {privacyMode
                      ? "***"
                      : riskMetrics.riskFactors.suspiciousPatterns}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-3">
                Risk Recommendations
              </h5>
              <div className="space-y-1">
                {riskMetrics.recommendations
                  .slice(0, 3)
                  .map((rec: string, index: number) => (
                    <div
                      key={index}
                      className="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                    >
                      • {privacyMode ? "Risk mitigation tip available" : rec}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transaction Analysis */}
      {recentTransactions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Transaction Analysis
          </h4>

          <div className="space-y-3">
            {recentTransactions.slice(0, 5).map((tx: any, index: number) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        tx.status === "confirmed"
                          ? "bg-green-500"
                          : tx.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <div className="font-mono text-sm text-gray-600">
                      {privacyMode ? "0x***" : `${tx.hash?.slice(0, 10)}...`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        tx.category?.primary === "defi_lending"
                          ? "bg-purple-100 text-purple-700"
                          : tx.category?.primary === "defi_swap"
                            ? "bg-blue-100 text-blue-700"
                            : tx.category?.primary === "eth_transfer"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tx.category?.primary?.replace("_", " ") || "Unknown"}
                    </div>

                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        tx.riskScore < 0.3
                          ? "bg-green-100 text-green-700"
                          : tx.riskScore < 0.6
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      Risk: {privacyMode ? "***" : tx.riskScore?.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Gas Used:</span>
                    <div>
                      {privacyMode
                        ? "***"
                        : `${Number(tx.gasUsed || 0).toLocaleString()}`}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Gas Price:</span>
                    <div>
                      {privacyMode
                        ? "***"
                        : `${(Number(tx.gasPrice || 0) / 1e9).toFixed(1)} gwei`}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Value:</span>
                    <div>
                      {privacyMode
                        ? "***"
                        : `${(Number(tx.value || 0) / 1e18).toFixed(4)} ETH`}
                    </div>
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

// Real Protocol Positions Component with Liquidation Risk Analysis and Real USD Values
const RealProtocolPositions: React.FC<{
  userAddress: string | null;
  privacyMode: boolean;
}> = ({ userAddress, privacyMode }) => {
  const [protocolData, setProtocolData] = useState<any>(null);
  const [liquidationEvents, setLiquidationEvents] = useState<any[]>([]);
  const [liquidationRisk, setLiquidationRisk] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [realTimePrices, setRealTimePrices] = useState<Map<string, any>>(
    new Map()
  );
  const [usdConversions, setUsdConversions] = useState<Map<string, number>>(
    new Map()
  );

  useEffect(() => {
    if (!userAddress) return;

    const loadProtocolData = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );

        // Get real protocol positions and liquidation data
        const [aavePositions, compoundPositions, protocolStats, liquidations] =
          await Promise.all([
            creditIntelligenceService.getAavePositions?.(userAddress) || [],
            creditIntelligenceService.getCompoundPositions?.(userAddress) || [],
            creditIntelligenceService.getProtocolStatistics?.() || {},
            creditIntelligenceService.getLiquidationEvents?.(
              userAddress,
              "30d"
            ) || [],
          ]);

        // Get real-time prices for all tokens used in positions
        const allTokens = new Set<string>();
        [...aavePositions, ...compoundPositions].forEach((position: any) => {
          if (position.assetSymbol) allTokens.add(position.assetSymbol);
          if (position.underlying) allTokens.add(position.underlying);
        });

        if (allTokens.size > 0) {
          try {
            const batchPrices =
              await creditIntelligenceService.getBatchRealTimePrices(
                Array.from(allTokens)
              );
            if (batchPrices && batchPrices.prices) {
              const priceMap = new Map();
              for (const [symbol, priceData] of Object.entries(
                batchPrices.prices
              )) {
                priceMap.set(symbol, priceData);
              }
              setRealTimePrices(priceMap);

              // Calculate USD conversions for position amounts
              const conversionMap = new Map();
              for (const position of [...aavePositions, ...compoundPositions]) {
                const symbol = position.assetSymbol || position.underlying;
                if (symbol && priceMap.has(symbol)) {
                  const priceData: any = priceMap.get(symbol);
                  if (position.supplied) {
                    const suppliedUSD =
                      Number(position.supplied) * priceData.priceUSD;
                    conversionMap.set(`${symbol}_supplied`, suppliedUSD);
                  }
                  if (position.borrowed) {
                    const borrowedUSD =
                      Number(position.borrowed) * priceData.priceUSD;
                    conversionMap.set(`${symbol}_borrowed`, borrowedUSD);
                  }
                }
              }
              setUsdConversions(conversionMap);
            }
          } catch (priceError) {
            console.error(
              "Failed to fetch real-time prices for positions:",
              priceError
            );
          }
        }

        // Calculate liquidation risk based on positions
        const calculateLiquidationRisk = (positions: any[]) => {
          if (!positions.length) return { risk: "none", score: 0, factors: [] };

          let riskScore = 0;
          const factors = [];

          for (const position of positions) {
            const healthFactor = Number(position.healthFactor || 0);
            const ltv = Number(position.ltv || 0);

            if (healthFactor > 0 && healthFactor < 1.1) {
              riskScore += 80;
              factors.push(
                `Critical health factor: ${healthFactor.toFixed(2)}`
              );
            } else if (healthFactor < 1.5) {
              riskScore += 50;
              factors.push(`Low health factor: ${healthFactor.toFixed(2)}`);
            } else if (healthFactor < 2.0) {
              riskScore += 20;
              factors.push(
                `Moderate health factor: ${healthFactor.toFixed(2)}`
              );
            }

            if (ltv > 0.8) {
              riskScore += 30;
              factors.push(`High LTV: ${(ltv * 100).toFixed(1)}%`);
            } else if (ltv > 0.6) {
              riskScore += 15;
              factors.push(`Moderate LTV: ${(ltv * 100).toFixed(1)}%`);
            }
          }

          const risk =
            riskScore > 70
              ? "high"
              : riskScore > 30
                ? "medium"
                : riskScore > 0
                  ? "low"
                  : "none";
          return { risk, score: Math.min(100, riskScore), factors };
        };

        const aaveRisk = calculateLiquidationRisk(aavePositions);
        const compoundRisk = calculateLiquidationRisk(compoundPositions);

        const overallRisk = {
          risk:
            aaveRisk.score > compoundRisk.score
              ? aaveRisk.risk
              : compoundRisk.risk,
          score: Math.max(aaveRisk.score, compoundRisk.score),
          factors: [...aaveRisk.factors, ...compoundRisk.factors],
          aaveRisk,
          compoundRisk,
        };

        setProtocolData({
          aave: aavePositions,
          compound: compoundPositions,
          statistics: protocolStats,
        });
        setLiquidationEvents(liquidations);
        setLiquidationRisk(overallRisk);
      } catch (error) {
        console.error("Failed to load protocol data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProtocolData();

    // Set up real-time updates every 60 seconds for liquidation monitoring
    const interval = setInterval(loadProtocolData, 60000);
    return () => clearInterval(interval);
  }, [userAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">
          Loading protocol positions...
        </span>
      </div>
    );
  }

  if (
    !protocolData ||
    (!protocolData.aave?.length && !protocolData.compound?.length)
  ) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No active DeFi protocol positions found</p>
        <p className="text-sm text-gray-500 mt-1">
          Start using DeFi protocols to see your positions here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liquidation Risk Alert */}
      {liquidationRisk && liquidationRisk.risk !== "none" && (
        <div
          className={`p-4 rounded-lg border ${
            liquidationRisk.risk === "high"
              ? "bg-red-50 border-red-200"
              : liquidationRisk.risk === "medium"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <AlertCircle
              className={`w-5 h-5 ${
                liquidationRisk.risk === "high"
                  ? "text-red-600"
                  : liquidationRisk.risk === "medium"
                    ? "text-yellow-600"
                    : "text-blue-600"
              }`}
            />
            <h4
              className={`font-medium ${
                liquidationRisk.risk === "high"
                  ? "text-red-900"
                  : liquidationRisk.risk === "medium"
                    ? "text-yellow-900"
                    : "text-blue-900"
              }`}
            >
              {liquidationRisk.risk === "high"
                ? "High Liquidation Risk"
                : liquidationRisk.risk === "medium"
                  ? "Medium Liquidation Risk"
                  : "Low Liquidation Risk"}
            </h4>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                liquidationRisk.risk === "high"
                  ? "bg-red-100 text-red-700"
                  : liquidationRisk.risk === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              Risk Score: {privacyMode ? "***" : liquidationRisk.score}
            </div>
          </div>

          {liquidationRisk.factors.length > 0 && (
            <div className="space-y-1">
              {liquidationRisk.factors
                .slice(0, 3)
                .map((factor: string, index: number) => (
                  <div
                    key={index}
                    className={`text-sm ${
                      liquidationRisk.risk === "high"
                        ? "text-red-800"
                        : liquidationRisk.risk === "medium"
                          ? "text-yellow-800"
                          : "text-blue-800"
                    }`}
                  >
                    • {privacyMode ? "Risk factor detected" : factor}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Liquidation Events */}
      {liquidationEvents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Activity className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">
              Recent Liquidation Activity
            </h4>
          </div>

          <div className="space-y-2">
            {liquidationEvents.slice(0, 3).map((event: any, index: number) => (
              <div key={index} className="text-sm text-red-800">
                • {event.protocol} liquidation on{" "}
                {new Date(event.timestamp).toLocaleDateString()}
                {!privacyMode && ` - ${event.collateralAsset}`}
              </div>
            ))}
          </div>

          {liquidationEvents.length > 3 && (
            <div className="mt-2 text-sm text-red-600">
              +{liquidationEvents.length - 3} more liquidation events
            </div>
          )}
        </div>
      )}

      {/* Aave Positions */}
      {protocolData.aave?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded mr-2"></div>
            Aave V3 Positions
            {liquidationRisk?.aaveRisk.risk !== "none" && (
              <div
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  liquidationRisk.aaveRisk.risk === "high"
                    ? "bg-red-100 text-red-700"
                    : liquidationRisk.aaveRisk.risk === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {liquidationRisk.aaveRisk.risk} risk
              </div>
            )}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocolData.aave.map((position: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">
                    {position.assetSymbol || "Unknown Asset"}
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      Number(position.healthFactor) > 2
                        ? "bg-green-100 text-green-700"
                        : Number(position.healthFactor) > 1.5
                          ? "bg-yellow-100 text-yellow-700"
                          : Number(position.healthFactor) > 1.1
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    Health:{" "}
                    {privacyMode
                      ? "***"
                      : Number(position.healthFactor).toFixed(2)}
                    {Number(position.healthFactor) < 1.5 && (
                      <AlertCircle className="w-3 h-3 inline ml-1" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Supplied</div>
                    <div className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                      {privacyMode
                        ? "***"
                        : Number(position.supplied).toFixed(4)}
                    </div>
                    <div className="text-xs text-green-600">
                      {privacyMode
                        ? "***"
                        : `${position.supplyAPY.toFixed(2)}%`}{" "}
                      APY
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-600">Borrowed</div>
                    <div className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4 text-red-600 mr-1" />
                      {privacyMode
                        ? "***"
                        : Number(position.borrowed).toFixed(4)}
                    </div>
                    <div className="text-xs text-red-600">
                      {privacyMode
                        ? "***"
                        : `${position.borrowAPY.toFixed(2)}%`}{" "}
                      APY
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      LTV:{" "}
                      {privacyMode
                        ? "***"
                        : `${(position.ltv * 100).toFixed(1)}%`}
                    </span>
                    <span>
                      Liq. Threshold:{" "}
                      {privacyMode
                        ? "***"
                        : `${(position.liquidationThreshold * 100).toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compound Positions */}
      {protocolData.compound?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded mr-2"></div>
            Compound Positions
            {liquidationRisk?.compoundRisk.risk !== "none" && (
              <div
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  liquidationRisk.compoundRisk.risk === "high"
                    ? "bg-red-100 text-red-700"
                    : liquidationRisk.compoundRisk.risk === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {liquidationRisk.compoundRisk.risk} risk
              </div>
            )}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocolData.compound.map((position: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">
                    {position.cTokenSymbol || "Unknown cToken"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {position.underlying}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Supplied</div>
                    <div className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                      {privacyMode
                        ? "***"
                        : Number(position.supplied).toFixed(4)}
                    </div>
                    <div className="text-xs text-green-600">
                      {privacyMode
                        ? "***"
                        : `${position.supplyAPY.toFixed(2)}%`}{" "}
                      APY
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-600">Borrowed</div>
                    <div className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4 text-red-600 mr-1" />
                      {privacyMode
                        ? "***"
                        : Number(position.borrowed).toFixed(4)}
                    </div>
                    <div className="text-xs text-red-600">
                      {privacyMode
                        ? "***"
                        : `${position.borrowAPY.toFixed(2)}%`}{" "}
                      APY
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      Collateral Factor:{" "}
                      {privacyMode
                        ? "***"
                        : `${((Number(position.collateralFactor) / 1e18) * 100).toFixed(1)}%`}
                    </span>
                    <span>{position.isComped ? "🏆 COMP Rewards" : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocol Statistics */}
      {protocolData.statistics &&
        Object.keys(protocolData.statistics).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Protocol Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(protocolData.statistics).map(
                ([protocol, stats]: [string, any]) => (
                  <div
                    key={protocol}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="font-medium text-gray-900 mb-2 capitalize">
                      {protocol}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">TVL:</span>
                        <span className="font-medium">
                          {privacyMode
                            ? "***"
                            : `$${(Number(stats.totalSupplied) / 1e18).toFixed(2)}M`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilization:</span>
                        <span className="font-medium flex items-center">
                          <Percent className="w-3 h-3 mr-1" />
                          {privacyMode
                            ? "***"
                            : `${(stats.utilizationRate * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
};

const CreditDashboard: React.FC = () => {
  const {
    profile,
    loading,
    privacyMode,
    setPrivacyMode,
    connectedAddress,
    refreshProfile,
  } = useCreditIntelligence();

  // Real-time blockchain event monitoring state
  const [recentEvents, setRecentEvents] = useState<BlockchainEvent[]>([]);
  const [monitoringStatus, setMonitoringStatus] =
    useState<EventMonitoringStatus>({
      isConnected: false,
      currentBlock: 0,
      eventsPerSecond: 0,
      pendingEvents: 0,
      confirmedEvents: 0,
      provider: "Unknown",
      lastUpdate: 0,
    });
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [realTimeTransactions, setRealTimeTransactions] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  // Set up real-time monitoring when address is connected
  useEffect(() => {
    if (!connectedAddress) return;

    let unsubscribeTransactions: (() => void) | undefined;
    let unsubscribeEvents: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;

    const setupRealTimeMonitoring = async () => {
      try {
        // Import the service dynamically to avoid SSR issues
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );

        // Subscribe to real-time transaction updates
        unsubscribeTransactions =
          await creditIntelligenceService.subscribeToTransactionUpdates?.(
            connectedAddress,
            (transaction) => {
              console.log("🔍 Real-time transaction detected:", transaction);

              // Add to real-time transactions list
              setRealTimeTransactions((prev) => [
                transaction,
                ...prev.slice(0, 49),
              ]); // Keep last 50

              // Update pending/confirmed lists based on status
              if (transaction.status === "pending") {
                setPendingTransactions((prev) => [transaction, ...prev]);
              } else if (transaction.status === "confirmed") {
                setPendingTransactions((prev) =>
                  prev.filter((tx) => tx.hash !== transaction.hash)
                );
              }
            }
          );

        // Subscribe to blockchain events
        unsubscribeEvents =
          await creditIntelligenceService.subscribeToBlockchainEvents?.(
            (event) => {
              console.log("🔍 Real-time blockchain event:", event);

              const blockchainEvent: BlockchainEvent = {
                id: event.eventId,
                eventName: event.eventName,
                protocol: event.protocolName || "Unknown",
                userAddress: connectedAddress,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                timestamp: event.timestamp,
                confirmations: event.confirmations,
                isConfirmed: event.isConfirmed,
                amount: event.decodedData?.amount,
                token: event.decodedData?.token,
                status: event.isConfirmed ? "confirmed" : "pending",
              };

              setRecentEvents((prev) => [
                blockchainEvent,
                ...prev.slice(0, 99),
              ]); // Keep last 100
            }
          );

        // Subscribe to connection status updates
        unsubscribeStatus =
          await creditIntelligenceService.subscribeToConnectionStatus?.(
            (status) => {
              console.log("📡 Blockchain connection status update:", status);
              setMonitoringStatus({
                isConnected: status.isConnected,
                currentBlock: status.lastBlockNumber,
                eventsPerSecond: status.eventsPerSecond || 0,
                pendingEvents: status.pendingEvents || 0,
                confirmedEvents: status.confirmedEvents || 0,
                provider: status.currentProvider?.name || "Unknown",
                lastUpdate: Date.now(),
              });
            }
          );

        // Load initial data
        const [blockchainStatus, recentEventsData, pendingTxs] =
          await Promise.all([
            creditIntelligenceService.getBlockchainStatus?.(),
            creditIntelligenceService.getRecentEvents?.(20),
            creditIntelligenceService.getPendingTransactions?.(),
          ]);

        if (blockchainStatus) {
          setMonitoringStatus({
            isConnected: blockchainStatus.isConnected,
            currentBlock: blockchainStatus.lastBlockNumber,
            eventsPerSecond: blockchainStatus.eventsPerSecond || 0,
            pendingEvents: blockchainStatus.pendingEvents || 0,
            confirmedEvents: blockchainStatus.confirmedEvents || 0,
            provider: blockchainStatus.currentProvider?.name || "Unknown",
            lastUpdate: Date.now(),
          });
        }

        if (recentEventsData) {
          const formattedEvents = recentEventsData.map((event: any) => ({
            id: event.eventId,
            eventName: event.eventName,
            protocol: event.protocolName || "Unknown",
            userAddress: connectedAddress,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: event.timestamp,
            confirmations: event.confirmations,
            isConfirmed: event.isConfirmed,
            amount: event.decodedData?.amount,
            token: event.decodedData?.token,
            status: event.isConfirmed ? "confirmed" : "pending",
          }));
          setRecentEvents(formattedEvents);
        }

        if (pendingTxs) {
          setPendingTransactions(pendingTxs);
        }
      } catch (error) {
        console.error("Failed to set up real-time monitoring:", error);
      }
    };

    setupRealTimeMonitoring();

    // Cleanup subscriptions
    return () => {
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [connectedAddress]);

  // Transform profile data for display
  const displayDimensions: CreditDimension[] = profile
    ? [
        {
          name: "DeFi Reliability",
          score: profile.dimensions.defiReliability.score,
          confidence: profile.dimensions.defiReliability.confidence,
          trend: profile.dimensions.defiReliability.trend,
          dataPoints: profile.dimensions.defiReliability.dataPoints,
          icon: Shield,
          color: "blue",
        },
        {
          name: "Trading Consistency",
          score: profile.dimensions.tradingConsistency.score,
          confidence: profile.dimensions.tradingConsistency.confidence,
          trend: profile.dimensions.tradingConsistency.trend,
          dataPoints: profile.dimensions.tradingConsistency.dataPoints,
          icon: TrendingUp,
          color: "green",
        },
        {
          name: "Staking Commitment",
          score: profile.dimensions.stakingCommitment.score,
          confidence: profile.dimensions.stakingCommitment.confidence,
          trend: profile.dimensions.stakingCommitment.trend,
          dataPoints: profile.dimensions.stakingCommitment.dataPoints,
          icon: Zap,
          color: "yellow",
        },
        {
          name: "Governance Participation",
          score: profile.dimensions.governanceParticipation.score,
          confidence: profile.dimensions.governanceParticipation.confidence,
          trend: profile.dimensions.governanceParticipation.trend,
          dataPoints: profile.dimensions.governanceParticipation.dataPoints,
          icon: Users,
          color: "purple",
        },
        {
          name: "Liquidity Provider",
          score: profile.dimensions.liquidityProvider.score,
          confidence: profile.dimensions.liquidityProvider.confidence,
          trend: profile.dimensions.liquidityProvider.trend,
          dataPoints: profile.dimensions.liquidityProvider.dataPoints,
          icon: Target,
          color: "indigo",
        },
      ]
    : [];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "text-gray-600";
      case "Gold":
        return "text-yellow-600";
      case "Silver":
        return "text-gray-500";
      case "Bronze":
        return "text-orange-600";
      default:
        return "text-gray-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return "text-green-600";
    if (score >= 600) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return "📈";
      case "declining":
        return "📉";
      default:
        return "➡️";
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Wallet Connected
        </h3>
        <p className="text-gray-600 mb-4">
          Connect your wallet to view your credit intelligence profile
        </p>
        <p className="text-sm text-gray-500">
          Use the wallet connection button in the header to get started
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Credit Profile Found
        </h3>
        <p className="text-gray-600 mb-4">
          No credit data found for this address
        </p>
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
            <h2 className="text-3xl font-bold text-gray-900">
              Credit Intelligence Profile
            </h2>
            <p className="text-gray-600 mt-1">
              Wallet: {profile.address.slice(0, 6)}...
              {profile.address.slice(-4)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                privacyMode
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {privacyMode ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{privacyMode ? "Privacy Mode" : "Public Mode"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Transaction Analysis */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          Real Transaction Analysis
        </h3>
        <RealTransactionAnalysis
          userAddress={connectedAddress}
          privacyMode={privacyMode}
        />
      </div>

      {/* Overall Score and Tier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="mb-4">
            <div
              className={`text-6xl font-bold ${getScoreColor(profile.overallScore)}`}
            >
              {privacyMode ? "***" : profile.overallScore}
            </div>
            <div className="text-gray-600 font-medium">
              Overall Credit Score
            </div>
          </div>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(profile.tier)} bg-gray-100`}
          >
            <Star className="w-4 h-4 mr-1" />
            {profile.tier} Tier
          </div>
        </div>

        <div className="card text-center">
          <div className="mb-4">
            <div className="text-4xl font-bold text-blue-600">
              {privacyMode ? "***" : profile.socialCredit.trustScore}
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
            <div className="text-gray-600 font-medium">
              Achievements Unlocked
            </div>
          </div>
          <div className="flex justify-center space-x-1">
            {profile.achievements.slice(0, 3).map((_: any, index: number) => (
              <Award key={index} className="w-5 h-5 text-yellow-500" />
            ))}
            {profile.achievements.length > 3 && (
              <span className="text-sm text-gray-500">
                +{profile.achievements.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Asset Prices */}
      <RealTimePriceDisplay
        symbols={["ETH", "BTC", "USDC", "USDT", "DAI", "LINK", "UNI", "AAVE"]}
        privacyMode={privacyMode}
        showVolatility={true}
        refreshInterval={30000}
      />

      {/* Credit Dimensions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Credit Dimensions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayDimensions.map((dimension, index) => {
            const Icon = dimension.icon;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${dimension.color}-100`}>
                      <Icon className={`w-6 h-6 text-${dimension.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {dimension.name}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {dimension.dataPoints} data points
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}
                    >
                      {privacyMode ? "***" : dimension.score}
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
                    <span>
                      {privacyMode ? "***" : `${dimension.score}/1000`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${dimension.color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{
                        width: privacyMode ? "0%" : `${dimension.score / 10}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Confidence</span>
                  <span
                    className={`font-medium ${dimension.confidence >= 80 ? "text-green-600" : dimension.confidence >= 60 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {privacyMode ? "***" : `${dimension.confidence}%`}
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
          <h3 className="text-xl font-semibold text-gray-900">
            AI Risk Predictions
          </h3>
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-1" />
            ML Confidence:{" "}
            {privacyMode ? "***" : `${profile.predictions.confidence}%`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {privacyMode ? "***" : `${profile.predictions.risk30d}%`}
            </div>
            <div className="text-green-700 font-medium">30-Day Risk</div>
            <div className="text-sm text-green-600 mt-1">Low Risk</div>
          </div>

          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {privacyMode ? "***" : `${profile.predictions.risk90d}%`}
            </div>
            <div className="text-yellow-700 font-medium">90-Day Risk</div>
            <div className="text-sm text-yellow-600 mt-1">Moderate Risk</div>
          </div>

          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {privacyMode ? "***" : `${profile.predictions.risk180d}%`}
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
                Your risk profile shows strong DeFi engagement with consistent
                staking behavior. Consider increasing governance participation
                to improve long-term predictions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Achievements & Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile.achievements.map((achievement: any, index: number) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
            >
              <Award className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">
                  {achievement.name}
                </div>
                <div className="text-sm text-yellow-700">Unlocked</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Next Achievements</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Governance Master (Vote in 10 proposals)
              </span>
              <span className="text-sm font-medium text-gray-900">7/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Blockchain Event Monitor */}
      <RealTimeEventMonitor
        userAddress={connectedAddress}
        privacyMode={privacyMode}
        showNotifications={true}
        maxEvents={50}
      />

      {/* Real-Time Score Tracker */}
      <RealTimeScoreTracker
        userAddress={connectedAddress}
        privacyMode={privacyMode}
        onScoreUpdate={(update) => {
          console.log('Score update received in dashboard:', update);
          // Optionally refresh the profile data when scores are updated
          // This could trigger a re-fetch of the credit profile
        }}
      />

      {/* Real DeFi Protocol Positions */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            DeFi Protocol Positions
          </h3>
        </div>

        <RealProtocolPositions
          userAddress={connectedAddress}
          privacyMode={privacyMode}
        />
      </div>

      {/* Real-Time Blockchain Monitoring */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Real-Time Blockchain Activity
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                monitoringStatus.isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {monitoringStatus.isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>
                {monitoringStatus.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <button
              onClick={() => setShowEventDetails(!showEventDetails)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showEventDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {monitoringStatus.currentBlock.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700">Current Block</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {monitoringStatus.eventsPerSecond.toFixed(1)}
            </div>
            <div className="text-sm text-green-700">Events/Second</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingTransactions.length}
            </div>
            <div className="text-sm text-yellow-700">Pending Transactions</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {monitoringStatus.provider}
            </div>
            <div className="text-sm text-purple-700">RPC Provider</div>
          </div>
        </div>

        {/* Recent Events */}
        {showEventDetails && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Recent Blockchain Events
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {recentEvents.length > 0 ? (
                recentEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          event.status === "confirmed"
                            ? "bg-green-500"
                            : event.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <div className="font-medium text-sm">
                          {event.eventName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {event.protocol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {event.amount && event.token
                          ? `${event.amount} ${event.token}`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {event.confirmations} confirmations
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent blockchain events detected</p>
                  <p className="text-sm">
                    Events will appear here as they occur
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Transaction Feed */}
        {realTimeTransactions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Live Transaction Feed</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {realTimeTransactions.slice(0, 5).map((tx, index) => (
                <div
                  key={tx.hash || index}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">
                        {tx.hash
                          ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`
                          : "Unknown"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tx.from === connectedAddress ? "Outgoing" : "Incoming"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        tx.status === "confirmed"
                          ? "text-green-600"
                          : tx.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {tx.status === "confirmed" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : tx.status === "pending" ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(
                        tx.timestamp || Date.now()
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Improvement Recommendations */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Improvement Recommendations
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900">
                Boost Governance Participation
              </h4>
              <p className="text-blue-800 text-sm mt-1">
                Your governance score is below average. Participate in 3 more
                DAO votes to reach the next tier.
              </p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                Find Active Proposals →
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
            <Shield className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-green-900">
                Maintain DeFi Consistency
              </h4>
              <p className="text-green-800 text-sm mt-1">
                Great job! Your DeFi reliability is excellent. Keep up the
                consistent behavior patterns.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg">
            <Target className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h4 className="font-medium text-yellow-900">
                Diversify Liquidity Provision
              </h4>
              <p className="text-yellow-800 text-sm mt-1">
                Consider providing liquidity to 2-3 additional protocols to
                improve your LP dimension score.
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
