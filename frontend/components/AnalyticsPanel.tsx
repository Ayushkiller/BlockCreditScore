import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Download,
  Filter,
  Eye,
  EyeOff,
  Activity,
  DollarSign,
  Percent,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Zap,
  Database,
  Network,
  Clock,
  Wifi,
} from "lucide-react";
import RealMarketDataChart from "./RealMarketDataChart";
import MarketSentimentDisplay from "./MarketSentimentDisplay";
import ProtocolTVLDisplay from "./ProtocolTVLDisplay";
import RealTimePriceFeedAnalytics from "./RealTimePriceFeedAnalytics";
import RealTimeEventMonitor from "./RealTimeEventMonitor";
import EventMonitoringAnalytics from "./EventMonitoringAnalytics";
import RealTimeVolatilityMonitor from "./RealTimeVolatilityMonitor";
import PriceFeedSourceStatus from "./PriceFeedSourceStatus";
import APIHealthMonitor from "./APIHealthMonitor";

interface AnalyticsData {
  scoreHistory: { date: string; score: number; dimension: string }[];
  peerComparison: {
    percentile: number;
    averageScore: number;
    userScore: number;
  };
  behaviorTrends: { category: string; trend: number; change: string }[];
  timeframeData: { [key: string]: any };
}

interface VolatilityData {
  symbol: string;
  currentPrice: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volatility1h: number;
  volatility24h: number;
  volatility7d: number;
  standardDeviation: number;
  averagePrice: number;
  highPrice: number;
  lowPrice: number;
  priceRange: number;
  timestamp: number;
  dataPoints: number;
}

interface VolatilityAlert {
  symbol: string;
  alertType:
    | "high_volatility"
    | "price_spike"
    | "price_drop"
    | "unusual_volume";
  severity: "low" | "medium" | "high" | "critical";
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: number;
}

interface PriceCacheMetrics {
  hitRate: number;
  missRate: number;
  averageLatency: number;
  stalePrices: number;
  totalKeys: number;
  memoryUsage: number;
  healthStatus: "healthy" | "degraded" | "unhealthy";
}

// Real Protocol Analytics Component with Enhanced Transaction Analysis
const RealProtocolAnalytics: React.FC<{
  timeframe: string;
  connectedAddress: string | null;
}> = ({ timeframe, connectedAddress }) => {
  const [protocolStats, setProtocolStats] = useState<any>(null);
  const [protocolInteractions, setProtocolInteractions] = useState<any[]>([]);
  const [tvlData, setTvlData] = useState<any>(null);
  const [yieldData, setYieldData] = useState<any>(null);
  const [liquidationEvents, setLiquidationEvents] = useState<any[]>([]);
  const [transactionAnalytics, setTransactionAnalytics] = useState<any>(null);
  const [gasAnalytics, setGasAnalytics] = useState<any>(null);
  const [protocolUsagePatterns, setProtocolUsagePatterns] = useState<any>(null);
  const [stakingBehaviorData, setStakingBehaviorData] = useState<any>(null);
  const [stakingRewardsData, setStakingRewardsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProtocolAnalytics = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );

        // Get real protocol data from enhanced API endpoints including staking behavior
        const [
          stats,
          interactions,
          tvl,
          yields,
          liquidations,
          txAnalytics,
          gasData,
          usagePatterns,
          stakingBehavior,
          stakingRewards,
        ] = await Promise.all([
          creditIntelligenceService.getProtocolStatistics?.() || {},
          connectedAddress
            ? creditIntelligenceService.getProtocolInteractionHistory?.(
                connectedAddress,
                timeframe
              ) || []
            : [],
          creditIntelligenceService.getProtocolTVLData?.() || {},
          creditIntelligenceService.getProtocolYieldData?.() || {},
          connectedAddress
            ? creditIntelligenceService.getLiquidationEvents?.(
                connectedAddress,
                timeframe
              ) || []
            : [],
          connectedAddress
            ? creditIntelligenceService.getBlockchainMetrics?.(
                connectedAddress,
                timeframe
              ) || null
            : null,
          connectedAddress
            ? creditIntelligenceService.getGasEfficiencyMetrics?.(
                connectedAddress
              ) || null
            : null,
          connectedAddress
            ? creditIntelligenceService.getProtocolUsagePatterns?.(
                connectedAddress,
                timeframe
              ) || null
            : null,
          connectedAddress
            ? creditIntelligenceService.getStakingBehaviorAnalysis?.(
                connectedAddress,
                timeframe
              ) || null
            : null,
          connectedAddress
            ? creditIntelligenceService.getStakingRewardsHistory?.(
                connectedAddress,
                timeframe
              ) || []
            : [],
        ]);

        setProtocolStats(stats);
        setProtocolInteractions(interactions);
        setTvlData(tvl);
        setYieldData(yields);
        setLiquidationEvents(liquidations);
        setTransactionAnalytics(txAnalytics);
        setGasAnalytics(gasData);
        setProtocolUsagePatterns(usagePatterns);
        setStakingBehaviorData(stakingBehavior);
        setStakingRewardsData(stakingRewards);
      } catch (error) {
        console.error("Failed to load protocol analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProtocolAnalytics();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadProtocolAnalytics, 30000);
    return () => clearInterval(interval);
  }, [connectedAddress, timeframe]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">
            Loading protocol analytics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real Transaction Analytics */}
      {transactionAnalytics && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Real Transaction Analytics
            </h3>
            <div className="text-sm text-gray-500">
              Based on actual blockchain data
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">
                {transactionAnalytics.realTransactionMetrics
                  ?.totalTransactions || 0}
              </div>
              <div className="text-sm text-blue-700">Total Transactions</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">
                {transactionAnalytics.realProtocolInteractions
                  ?.uniqueProtocols || 0}
              </div>
              <div className="text-sm text-green-700">Protocols Used</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900">
                {`${(transactionAnalytics.gasAnalysis?.avgEfficiency * 100 || 0).toFixed(0)}%`}
              </div>
              <div className="text-sm text-purple-700">Gas Efficiency</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-900">
                {transactionAnalytics.realEventHistory?.length || 0}
              </div>
              <div className="text-sm text-yellow-700">DeFi Events</div>
            </div>
          </div>

          {/* Protocol Interaction Patterns */}
          {transactionAnalytics.realProtocolInteractions && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Protocol Interaction Patterns
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  transactionAnalytics.realProtocolInteractions
                    .protocolBreakdown || {}
                ).map(([protocol, data]: [string, any]) => (
                  <div
                    key={protocol}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 capitalize">
                        {protocol}
                      </h5>
                      <div className="text-sm text-gray-500">
                        {`${data.interactions} txs`}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Most Used Action:</span>
                        <span className="font-medium">
                          {data.topAction || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Gas Used:</span>
                        <span className="font-medium">
                          {`${(data.avgGasUsed || 0).toLocaleString()}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span
                          className={`font-medium ${
                            data.successRate > 0.95
                              ? "text-green-600"
                              : data.successRate > 0.9
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {`${((data.successRate || 0) * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gas Usage Analysis */}
          {gasAnalytics && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Gas Usage Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {`${(gasAnalytics.avgGasPrice / 1e9).toFixed(1)} gwei`}
                  </div>
                  <div className="text-sm text-gray-600">Average Gas Price</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {gasAnalytics.comparedToNetwork?.percentile}th percentile
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {`${gasAnalytics.gasOptimizationScore}/100`}
                  </div>
                  <div className="text-sm text-gray-600">
                    Optimization Score
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      gasAnalytics.gasEfficiencyRating === "excellent"
                        ? "text-green-600"
                        : gasAnalytics.gasEfficiencyRating === "good"
                          ? "text-blue-600"
                          : gasAnalytics.gasEfficiencyRating === "average"
                            ? "text-yellow-600"
                            : "text-red-600"
                    }`}
                  >
                    {gasAnalytics.gasEfficiencyRating}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {gasAnalytics.historicalTrend === "improving"
                      ? "📈"
                      : gasAnalytics.historicalTrend === "declining"
                        ? "📉"
                        : "➡️"}
                  </div>
                  <div className="text-sm text-gray-600">Trend</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">
                    {gasAnalytics.historicalTrend}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Protocol Usage Patterns */}
      {protocolUsagePatterns && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Protocol Usage Patterns
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Usage Frequency
              </h4>
              <div className="space-y-3">
                {Object.entries(
                  protocolUsagePatterns.frequencyByProtocol || {}
                ).map(([protocol, frequency]: [string, any]) => (
                  <div
                    key={protocol}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-700 capitalize">{protocol}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (frequency / protocolUsagePatterns.maxFrequency) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {frequency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Time-based Patterns
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Most Active Day:</span>
                  <span className="font-medium">
                    {protocolUsagePatterns.mostActiveDay || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Most Active Hour:</span>
                  <span className="font-medium">
                    {`${protocolUsagePatterns.mostActiveHour || "N/A"}:00`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Txs per Day:</span>
                  <span className="font-medium">
                    {(protocolUsagePatterns.avgTransactionsPerDay || 0).toFixed(
                      1
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activity Streak:</span>
                  <span className="font-medium">
                    {`${protocolUsagePatterns.longestActiveStreak || 0} days`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Protocol TVL and Statistics */}
      {tvlData && Object.keys(tvlData).length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Real Protocol TVL & Statistics
            </h3>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(tvlData).map(([protocol, data]: [string, any]) => (
              <div
                key={protocol}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {protocol}
                  </h4>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      protocol === "aave"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : protocol === "compound"
                          ? "bg-gradient-to-r from-green-500 to-blue-500"
                          : "bg-gray-400"
                    }`}
                  ></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Value Locked
                    </span>
                    <div className="text-right">
                      <div className="font-medium flex items-center">
                        <DollarSign className="w-4 h-4 text-purple-600 mr-1" />
                        {`${(Number(data.totalValueLocked) / 1e18).toFixed(2)}M`}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Supplied
                    </span>
                    <div className="text-right">
                      <div className="font-medium flex items-center">
                        <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                        {`${(Number(data.totalSupply) / 1e18).toFixed(2)}M`}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total Borrowed
                    </span>
                    <div className="text-right">
                      <div className="font-medium flex items-center">
                        <DollarSign className="w-4 h-4 text-red-600 mr-1" />
                        {`${(Number(data.totalBorrow) / 1e18).toFixed(2)}M`}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Utilization Rate
                    </span>
                    <div className="text-right">
                      <div className="font-medium flex items-center">
                        <Percent className="w-4 h-4 text-blue-600 mr-1" />
                        {`${(data.utilizationRate || 0).toFixed(1)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(data.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Protocol Yield Data */}
      {yieldData && Object.keys(yieldData).length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Percent className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Real Protocol Yield Rates
            </h3>
          </div>

          <div className="space-y-6">
            {Object.entries(yieldData).map(
              ([protocol, assets]: [string, any]) => (
                <div key={protocol}>
                  <h4 className="font-medium text-gray-900 mb-3 capitalize flex items-center">
                    <div
                      className={`w-4 h-4 rounded mr-2 ${
                        protocol === "aave"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : protocol === "compound"
                            ? "bg-gradient-to-r from-green-500 to-blue-500"
                            : "bg-gray-400"
                      }`}
                    ></div>
                    {protocol} Yield Rates
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(assets).map(
                      ([assetKey, yieldInfo]: [string, any]) => (
                        <div
                          key={assetKey}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="font-medium text-gray-900 mb-2">
                            {yieldInfo.asset || assetKey}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Supply APY:</span>
                              <span className="font-medium text-green-600">
                                {`${yieldInfo.supplyAPY.toFixed(2)}%`}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Borrow APY:</span>
                              <span className="font-medium text-red-600">
                                {`${yieldInfo.borrowAPY.toFixed(2)}%`}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Utilization:
                              </span>
                              <span className="font-medium text-blue-600">
                                {`${(yieldInfo.utilizationRate || 0).toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Real Liquidation Events */}
      {liquidationEvents.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Recent Liquidation Events
            </h3>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {liquidationEvents.slice(0, 10).map((liquidation, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div>
                    <div className="font-medium text-sm text-red-900">
                      {liquidation.protocol}
                    </div>
                    <div className="text-xs text-red-700">
                      Liquidation:{" "}
                      {`${liquidation.borrower.slice(0, 6)}...${liquidation.borrower.slice(-4)}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-red-900">
                    {`${Number(liquidation.collateralAmount) / 1e18}`.slice(
                      0,
                      8
                    )}
                  </div>
                  <div className="text-xs text-red-700">
                    {new Date(liquidation.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {liquidationEvents.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-red-600 hover:text-red-800">
                View All {liquidationEvents.length} Liquidations
              </button>
            </div>
          )}
        </div>
      )}

      {/* Protocol Interaction History */}
      {protocolInteractions.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Recent Protocol Interactions
            </h3>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {protocolInteractions.slice(0, 10).map((interaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      interaction.protocol === "Aave V3"
                        ? "bg-purple-500"
                        : interaction.protocol === "Compound"
                          ? "bg-green-500"
                          : "bg-gray-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-sm">
                      {interaction.protocol}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {interaction.action}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium">
                    {`${Number(interaction.amounts[0]) / 1e18}`.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(interaction.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {protocolInteractions.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View All {protocolInteractions.length} Interactions
              </button>
            </div>
          )}
        </div>
      )}

      {/* Event Monitoring Analytics */}
      <EventMonitoringAnalytics
        timeframe={timeframe}
        connectedAddress={connectedAddress}
      />

      {/* Real-Time Volatility Monitor */}
      <RealTimeVolatilityMonitor
        symbols={["ETH", "BTC", "USDC", "USDT", "DAI", "LINK", "UNI", "AAVE"]}
        showAlerts={true}
        showCharts={true}
        refreshInterval={30000}
      />

      {/* Price Feed Source Status */}
      <PriceFeedSourceStatus refreshInterval={15000} showDetails={true} />

      {/* Real Staking Behavior Analytics */}
      {stakingBehaviorData && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Staking Behavior & Rewards History
            </h3>
            <div className="text-sm text-gray-500">
              Real staking contract analysis
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Staked
              </div>
              <div className="text-lg font-bold text-gray-900">
                {`${(parseFloat(stakingBehaviorData.totalStaked) / 1e18).toFixed(4)} ETH`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Across {stakingBehaviorData.stakingProtocols?.size || 0}{" "}
                protocols
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Rewards
              </div>
              <div className="text-lg font-bold text-gray-900">
                {`${(parseFloat(stakingBehaviorData.totalRewardsClaimed) / 1e18).toFixed(4)} ETH`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Lifetime rewards claimed
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Avg Duration
              </div>
              <div className="text-lg font-bold text-gray-900">
                {`${stakingBehaviorData.averageStakingDuration?.toFixed(0)} days`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Average staking period
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Staking Score
              </div>
              <div className="text-lg font-bold text-gray-900">
                {`${(stakingBehaviorData.stakingScore * 100).toFixed(1)}%`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Risk: {stakingBehaviorData.riskLevel}
              </div>
            </div>
          </div>

          {/* Staking History Chart */}
          {stakingRewardsData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Staking Rewards Timeline
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stakingRewardsData
                    .slice(0, 10)
                    .map((reward: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded"
                      >
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {reward.protocol?.replace(/_/g, " ")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              reward.timestamp * 1000
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            {`+${(parseFloat(reward.amount) / 1e18).toFixed(6)} ETH`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {reward.type === "claim_rewards"
                              ? "Claimed"
                              : "Earned"}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Protocol Breakdown */}
          {stakingBehaviorData.stakingProtocols &&
            stakingBehaviorData.stakingProtocols.size > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Staking Protocol Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(
                    stakingBehaviorData.stakingProtocols.entries()
                  ).map(([protocol, data]: [string, any]) => (
                    <div key={protocol} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 capitalize">
                          {protocol.replace(/_/g, " ")}
                        </h5>
                        <span className="text-sm text-gray-500">
                          {data.activeStakes} stakes
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Staked:</span>
                          <span className="font-medium">
                            {`${(parseFloat(data.totalStaked) / 1e18).toFixed(4)} ETH`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rewards:</span>
                          <span className="font-medium text-green-600">
                            {`${(parseFloat(data.totalRewards) / 1e18).toFixed(4)} ETH`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Activity:</span>
                          <span className="text-gray-500">
                            {new Date(
                              data.lastActivityTimestamp * 1000
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

const AnalyticsPanel: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const [selectedDimension, setSelectedDimension] = useState("all");

  const [showPeerComparison, setShowPeerComparison] = useState(true);
  const [realAnalyticsData, setRealAnalyticsData] =
    useState<AnalyticsData | null>(null);
  const [blockchainMetrics, setBlockchainMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>([]);
  const [volatilityAlerts, setVolatilityAlerts] = useState<VolatilityAlert[]>(
    []
  );
  const [priceCacheMetrics, setPriceCacheMetrics] =
    useState<PriceCacheMetrics | null>(null);
  const [priceFailoverStatus, setPriceFailoverStatus] = useState<any>(null);

  // Score tracking state
  const [showScoreHistory, setShowScoreHistory] = useState(true);
  const [scoreChangeHistory, setScoreChangeHistory] = useState<any[]>([]);
  const [scoreUpdateTriggers, setScoreUpdateTriggers] = useState<any[]>([]);
  const [eventVerificationStats, setEventVerificationStats] = useState({
    totalVerifications: 0,
    successRate: 0,
    averageConfidence: 0,
    failedVerifications: 0,
  });
  const [missedEventRecoveryStatus, setMissedEventRecoveryStatus] =
    useState<any>(null);

  // Load real analytics data
  useEffect(() => {
    const loadRealAnalytics = async () => {
      // Get connected address from context or localStorage
      const address = localStorage.getItem("connectedWallet");
      if (!address) return;

      setConnectedAddress(address);
      setLoading(true);

      try {
        // Import the service dynamically
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );

        // Load real analytics data
        const [analyticsData, blockchainData] = await Promise.all([
          creditIntelligenceService.getAnalytics(address, selectedTimeframe),
          creditIntelligenceService.getBlockchainMetrics(
            address,
            selectedTimeframe
          ),
        ]);

        if (analyticsData) {
          setRealAnalyticsData(analyticsData);
        }

        if (blockchainData) {
          setBlockchainMetrics(blockchainData);
        }
      } catch (error) {
        console.error("Failed to load real analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRealAnalytics();
  }, [selectedTimeframe]);

  // Load volatility data and price cache metrics
  useEffect(() => {
    const loadVolatilityData = async () => {
      try {
        // Fetch volatility data for all monitored tokens
        const volatilityResponse = await fetch(
          "http://localhost:3001/api/price-feeds/volatility-data"
        );
        if (volatilityResponse.ok) {
          const volatilityResult = await volatilityResponse.json();
          setVolatilityData(volatilityResult.tokens || []);
        }

        // Fetch recent volatility alerts
        const alertsResponse = await fetch(
          "http://localhost:3001/api/price-feeds/volatility-alerts"
        );
        if (alertsResponse.ok) {
          const alertsResult = await alertsResponse.json();
          setVolatilityAlerts(alertsResult.alerts || []);
        }

        // Fetch price cache metrics
        const cacheResponse = await fetch(
          "http://localhost:3001/api/price-feeds/cache-metrics"
        );
        if (cacheResponse.ok) {
          const cacheResult = await cacheResponse.json();
          setPriceCacheMetrics(cacheResult);
        }

        // Fetch price failover status
        const failoverResponse = await fetch(
          "http://localhost:3001/api/price-feeds/failover-status"
        );
        if (failoverResponse.ok) {
          const failoverResult = await failoverResponse.json();
          setPriceFailoverStatus(failoverResult);
        }
      } catch (error) {
        console.error("Failed to load volatility data:", error);
      }
    };

    loadVolatilityData();

    // Update volatility data every 30 seconds
    const interval = setInterval(loadVolatilityData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load score tracking data
  useEffect(() => {
    const loadScoreTrackingData = async () => {
      if (!connectedAddress) return;

      try {
        const { creditIntelligenceService } = await import(
          "../services/creditIntelligenceService"
        );

        // Load score change history
        const scoreHistory =
          await creditIntelligenceService.getScoreChangeHistory?.(
            connectedAddress,
            selectedTimeframe
          );
        if (scoreHistory) {
          const formattedHistory = scoreHistory.map((change: any) => ({
            dimension: change.dimension,
            eventType: change.eventType,
            protocol: change.protocol,
            change: change.newScore - change.oldScore,
            isPositive: change.newScore >= change.oldScore,
            timestamp: change.timestamp,
            confidence: change.confidence,
          }));
          setScoreChangeHistory(formattedHistory);
        }

        // Load score update triggers
        const triggers =
          await creditIntelligenceService.getScoreUpdateTriggers?.(
            connectedAddress
          );
        if (triggers) {
          setScoreUpdateTriggers(triggers);
        }

        // Load event verification statistics
        const analytics =
          await creditIntelligenceService.getEventDrivenScoreAnalytics?.(
            connectedAddress
          );
        if (analytics) {
          setEventVerificationStats({
            totalVerifications: analytics.totalVerifications || 0,
            successRate: analytics.successRate || 0,
            averageConfidence: analytics.averageConfidence || 0,
            failedVerifications: analytics.failedVerifications || 0,
          });
        }

        // Load missed event recovery status
        const recoveries =
          await creditIntelligenceService.getMissedEventRecoveries?.();
        if (recoveries && recoveries.length > 0) {
          setMissedEventRecoveryStatus(recoveries[recoveries.length - 1]); // Get latest recovery
        }
      } catch (error) {
        console.error("Failed to load score tracking data:", error);
      }
    };

    loadScoreTrackingData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadScoreTrackingData, 30000);
    return () => clearInterval(interval);
  }, [connectedAddress, selectedTimeframe]);

  // Use real data if available, otherwise fall back to mock data
  const analyticsData: AnalyticsData = realAnalyticsData || {
    scoreHistory: [
      { date: "2024-01-01", score: 720, dimension: "overall" },
      { date: "2024-01-15", score: 745, dimension: "overall" },
      { date: "2024-02-01", score: 780, dimension: "overall" },
      { date: "2024-02-15", score: 810, dimension: "overall" },
      { date: "2024-03-01", score: 847, dimension: "overall" },
    ],
    peerComparison: {
      percentile: 87,
      averageScore: 642,
      userScore: 847,
    },
    behaviorTrends: [
      { category: "DeFi Interactions", trend: 15, change: "increase" },
      { category: "Staking Duration", trend: 8, change: "increase" },
      { category: "Governance Votes", trend: -5, change: "decrease" },
      { category: "LP Positions", trend: 12, change: "increase" },
    ],
    timeframeData: {
      "7d": { transactions: 12, volume: 15420, protocols: 4 },
      "30d": { transactions: 89, volume: 234560, protocols: 8 },
      "90d": { transactions: 267, volume: 892340, protocols: 12 },
    },
  };

  // Enhanced analytics data with real blockchain metrics
  const enhancedAnalytics = {
    ...analyticsData,
    realTransactionMetrics: blockchainMetrics?.transactions || null,
    realProtocolInteractions: blockchainMetrics?.protocols || null,
    realEventHistory: blockchainMetrics?.events || null,
    gasAnalysis: blockchainMetrics?.gasUsage || null,
  };

  const timeframes = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" },
  ];

  const dimensions = [
    { value: "all", label: "All Dimensions" },
    { value: "defi", label: "DeFi Reliability" },
    { value: "trading", label: "Trading Consistency" },
    { value: "staking", label: "Staking Commitment" },
    { value: "governance", label: "Governance Participation" },
    { value: "liquidity", label: "Liquidity Provider" },
  ];

  const exportData = () => {
    // In real implementation, this would export actual data
    const dataToExport = {
      timestamp: new Date().toISOString(),
      scoreHistory: analyticsData.scoreHistory,
      peerComparison: showPeerComparison ? analyticsData.peerComparison : null,
      behaviorTrends: analyticsData.behaviorTrends,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Credit Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Detailed insights into your financial behavior patterns and credit
              evolution
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Export Button */}
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Time Period</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="input"
            >
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Credit Dimension</label>
            <select
              value={selectedDimension}
              onChange={(e) => setSelectedDimension(e.target.value)}
              className="input"
            >
              {dimensions.map((dim) => (
                <option key={dim.value} value={dim.value}>
                  {dim.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Real Market Data Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealMarketDataChart
          symbol="ETH"
          timeframe={selectedTimeframe}
          showVolume={true}
        />
        <RealMarketDataChart
          symbol="BTC"
          timeframe={selectedTimeframe}
          showVolume={true}
        />
      </div>

      {/* Score Evolution Chart */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Score Evolution
          </h3>
        </div>

        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              Interactive score chart would be displayed here
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Score progression: 720 → 847 (+127 points over 3 months)
            </div>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Overall Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Trend Line</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Peer Average</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {analyticsData.timeframeData[selectedTimeframe].transactions}
          </div>
          <div className="text-gray-600 font-medium">Total Transactions</div>
          <div className="text-sm text-gray-500 mt-1">
            Last{" "}
            {timeframes.find((tf) => tf.value === selectedTimeframe)?.label}
          </div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {`$${analyticsData.timeframeData[selectedTimeframe].volume.toLocaleString()}`}
          </div>
          <div className="text-gray-600 font-medium">Total Volume</div>
          <div className="text-sm text-gray-500 mt-1">USD equivalent</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {analyticsData.timeframeData[selectedTimeframe].protocols}
          </div>
          <div className="text-gray-600 font-medium">Protocols Used</div>
          <div className="text-sm text-gray-500 mt-1">Unique interactions</div>
        </div>
      </div>

      {/* Peer Comparison */}
      {showPeerComparison && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Peer Comparison
              </h3>
            </div>
            <button
              onClick={() => setShowPeerComparison(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {`${analyticsData.peerComparison.percentile}th`}
              </div>
              <div className="text-green-700 font-medium">Percentile Rank</div>
              <div className="text-sm text-green-600 mt-1">
                Better than {analyticsData.peerComparison.percentile}% of users
              </div>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {analyticsData.peerComparison.userScore}
              </div>
              <div className="text-blue-700 font-medium">Your Score</div>
              <div className="text-sm text-blue-600 mt-1">
                Current overall rating
              </div>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-600 mb-2">
                {analyticsData.peerComparison.averageScore}
              </div>
              <div className="text-gray-700 font-medium">Network Average</div>
              <div className="text-sm text-gray-600 mt-1">
                All users average
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">
                  Performance Insight
                </h4>
                <p className="text-green-800 text-sm mt-1">
                  You're performing{" "}
                  {analyticsData.peerComparison.userScore -
                    analyticsData.peerComparison.averageScore}{" "}
                  points above the network average. Keep up the excellent work!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Sentiment and Fear & Greed Index */}
      <MarketSentimentDisplay refreshInterval={300000} />

      {/* Protocol TVL and Yield Data */}
      <ProtocolTVLDisplay
        protocols={[
          "uniswap",
          "aave",
          "compound",
          "makerdao",
          "curve",
          "balancer",
        ]}
        showYields={true}
        refreshInterval={600000}
      />

      {/* Real-Time Chainlink Price Feed Analytics */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Real-Time Chainlink Price Feed Analytics
          </h3>
          <div className="text-sm text-gray-500 bg-green-100 px-2 py-1 rounded">
            Live Data & Update Timestamps
          </div>
        </div>

        <RealTimePriceFeedAnalytics />
      </div>

      {/* Real Protocol Analytics Component */}
      <RealProtocolAnalytics
        timeframe={selectedTimeframe}
        connectedAddress={connectedAddress}
      />

      {/* Behavior Trends */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Behavior Trends
          </h3>
        </div>

        <div className="space-y-4">
          {analyticsData.behaviorTrends.map((trend, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    trend.change === "increase"
                      ? "bg-green-500"
                      : trend.change === "decrease"
                        ? "bg-red-500"
                        : "bg-gray-500"
                  }`}
                ></div>
                <span className="font-medium text-gray-900">
                  {trend.category}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm font-medium ${
                    trend.change === "increase"
                      ? "text-green-600"
                      : trend.change === "decrease"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {`${trend.trend > 0 ? "+" : ""}${trend.trend}%`}
                </span>
                <span className="text-sm text-gray-500">vs last period</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Price Volatility Analytics */}
      {volatilityData.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Real-Time Price Volatility Analytics
            </h3>
            <div className="text-sm text-gray-500">
              Live volatility monitoring using actual price data
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {volatilityData.slice(0, 6).map((token, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  token.volatility24h > 50
                    ? "border-red-200 bg-red-50"
                    : token.volatility24h > 30
                      ? "border-orange-200 bg-orange-50"
                      : token.volatility24h > 15
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {token.symbol}
                  </h4>
                  <div
                    className={`text-sm font-medium ${
                      token.priceChange24h > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {`${token.priceChange24h > 0 ? "+" : ""}${token.priceChange24h.toFixed(2)}%`}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Price:</span>
                    <span className="font-medium">
                      {`$${token.currentPrice.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">24h Volatility:</span>
                    <span
                      className={`font-medium ${
                        token.volatility24h > 50
                          ? "text-red-600"
                          : token.volatility24h > 30
                            ? "text-orange-600"
                            : token.volatility24h > 15
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                    >
                      {`${token.volatility24h.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">7d Change:</span>
                    <span
                      className={`font-medium ${
                        token.priceChange7d > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {`${token.priceChange7d > 0 ? "+" : ""}${token.priceChange7d.toFixed(2)}%`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-medium text-gray-700">
                      {token.dataPoints.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Volatility Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              Volatility Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {volatilityData.filter((t) => t.volatility24h > 50).length}
                </div>
                <div className="text-gray-600">High Volatility</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {
                    volatilityData.filter(
                      (t) => t.volatility24h > 30 && t.volatility24h <= 50
                    ).length
                  }
                </div>
                <div className="text-gray-600">Medium Volatility</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {volatilityData.filter((t) => t.volatility24h <= 15).length}
                </div>
                <div className="text-gray-600">Low Volatility</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {volatilityData
                    .reduce((sum, t) => sum + t.dataPoints, 0)
                    .toLocaleString()}
                </div>
                <div className="text-gray-600">Total Data Points</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Volatility Alerts */}
      {volatilityAlerts.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Real-Time Volatility Alerts
            </h3>
            <div className="text-sm text-gray-500">
              Active alerts based on real price movements
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {volatilityAlerts.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.severity === "critical"
                    ? "border-red-200 bg-red-50"
                    : alert.severity === "high"
                      ? "border-orange-200 bg-orange-50"
                      : alert.severity === "medium"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === "critical"
                        ? "bg-red-500"
                        : alert.severity === "high"
                          ? "bg-orange-500"
                          : alert.severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {alert.symbol} - {alert.alertType.replace("_", " ")}
                    </div>
                    <div className="text-xs text-gray-600">{alert.message}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
                      alert.severity === "critical"
                        ? "text-red-600"
                        : alert.severity === "high"
                          ? "text-orange-600"
                          : alert.severity === "medium"
                            ? "text-yellow-600"
                            : "text-blue-600"
                    }`}
                  >
                    {`${alert.currentValue.toFixed(2)}%`}
                  </div>
                  <div className="text-xs text-gray-500">
                    Threshold: {alert.threshold}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Cache & Failover Status */}
      {(priceCacheMetrics || priceFailoverStatus) && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Price Feed Infrastructure Status
            </h3>
            <div className="text-sm text-gray-500">
              Real-time monitoring of price cache and failover systems
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Cache Metrics */}
            {priceCacheMetrics && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">
                    Price Cache Performance
                  </h4>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      priceCacheMetrics.healthStatus === "healthy"
                        ? "bg-green-500"
                        : priceCacheMetrics.healthStatus === "degraded"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  ></div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hit Rate:</span>
                    <span className="font-medium text-green-600">
                      {`${priceCacheMetrics.hitRate.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Latency:</span>
                    <span className="font-medium">
                      {`${priceCacheMetrics.averageLatency.toFixed(1)}ms`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Cached Prices:</span>
                    <span className="font-medium">
                      {priceCacheMetrics.totalKeys.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Stale Prices:</span>
                    <span
                      className={`font-medium ${
                        priceCacheMetrics.stalePrices > 0
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {priceCacheMetrics.stalePrices}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-medium">
                      {`${(priceCacheMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Price Failover Status */}
            {priceFailoverStatus && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Network className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">
                    Failover System Status
                  </h4>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      priceFailoverStatus.healthySources ===
                      priceFailoverStatus.totalSources
                        ? "bg-green-500"
                        : priceFailoverStatus.healthySources > 0
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  ></div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Healthy Sources:</span>
                    <span className="font-medium text-green-600">
                      {`${priceFailoverStatus.healthySources}/${priceFailoverStatus.totalSources}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Enabled Sources:</span>
                    <span className="font-medium">
                      {priceFailoverStatus.enabledSources}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Circuit Breakers:</span>
                    <span
                      className={`font-medium ${
                        priceFailoverStatus.circuitBreakersOpen > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {`${priceFailoverStatus.circuitBreakersOpen} Open`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Source:</span>
                    <span className="font-medium">
                      {priceFailoverStatus.sources?.find(
                        (s: any) => s.priority === 1
                      )?.name || "None"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Failover Ready:</span>
                    <span
                      className={`font-medium ${
                        priceFailoverStatus.healthySources > 1
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {priceFailoverStatus.healthySources > 1
                        ? "✓ Yes"
                        : "✗ No"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-Time Score Change History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Score Change History & Triggers
            </h3>
          </div>
          <button
            onClick={() => setShowScoreHistory(!showScoreHistory)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {showScoreHistory ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span>{showScoreHistory ? "Hide" : "Show"} Details</span>
          </button>
        </div>

        {showScoreHistory && (
          <div className="space-y-6">
            {/* Score Change Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Recent Score Changes
              </h4>
              {scoreChangeHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No score changes recorded yet</p>
                  <p className="text-sm mt-1">
                    Score changes will appear here as blockchain events are
                    processed
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {scoreChangeHistory.slice(0, 10).map((change, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            change.isPositive ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {change.dimension.replace(/([A-Z])/g, " $1").trim()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {change.eventType} on {change.protocol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            change.isPositive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {`${change.isPositive ? "+" : ""}${change.change.toFixed(1)}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            change.timestamp * 1000
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score Update Triggers */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Active Score Update Triggers
              </h4>
              {scoreUpdateTriggers.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Zap className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No active triggers configured</p>
                  <p className="text-sm mt-1">
                    Set up triggers to get notified of score changes
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoreUpdateTriggers.map((trigger, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 capitalize">
                          {trigger.eventType.replace(/_/g, " ")}
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            trigger.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {trigger.isActive ? "Active" : "Inactive"}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          Confirmations: {trigger.confirmationThreshold}
                        </div>
                        <div>Total Triggers: {trigger.totalTriggers}</div>
                        {trigger.lastTriggered && (
                          <div>
                            Last:{" "}
                            {new Date(
                              trigger.lastTriggered
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event Verification Statistics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Event Verification Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {eventVerificationStats.totalVerifications.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">
                    Total Verifications
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {`${eventVerificationStats.successRate.toFixed(1)}%`}
                  </div>
                  <div className="text-sm text-green-700">Success Rate</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">
                    {`${eventVerificationStats.averageConfidence.toFixed(1)}%`}
                  </div>
                  <div className="text-sm text-yellow-700">Avg Confidence</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {eventVerificationStats.failedVerifications.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700">
                    Failed Verifications
                  </div>
                </div>
              </div>
            </div>

            {/* Block Scanning Progress */}
            {missedEventRecoveryStatus && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  Missed Event Recovery Status
                </h4>
                <div
                  className={`p-4 rounded-lg border ${
                    missedEventRecoveryStatus.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : missedEventRecoveryStatus.status === "failed"
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <RefreshCw
                        className={`w-5 h-5 ${
                          missedEventRecoveryStatus.status === "in_progress"
                            ? "animate-spin"
                            : ""
                        } ${
                          missedEventRecoveryStatus.status === "completed"
                            ? "text-green-600"
                            : missedEventRecoveryStatus.status === "failed"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      />
                      <span className="font-medium">
                        {missedEventRecoveryStatus.status === "in_progress"
                          ? "Scanning in Progress"
                          : missedEventRecoveryStatus.status === "completed"
                            ? "Scan Completed"
                            : "Scan Failed"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Blocks {missedEventRecoveryStatus.fromBlock} -{" "}
                      {missedEventRecoveryStatus.toBlock}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Events Recovered:</span>
                      <span className="ml-2 font-medium">
                        {missedEventRecoveryStatus.recoveredEvents}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Score Updates:</span>
                      <span className="ml-2 font-medium">
                        {missedEventRecoveryStatus.processedScoreUpdates}
                      </span>
                    </div>
                  </div>

                  {missedEventRecoveryStatus.errors.length > 0 && (
                    <div className="mt-3 text-sm text-red-600">
                      {missedEventRecoveryStatus.errors.length} errors occurred
                      during recovery
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API Health and Performance Monitoring */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Wifi className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            API Performance & Health
          </h3>
          <div className="text-sm text-gray-500">
            Real-time monitoring of external API integrations
          </div>
        </div>

        <APIHealthMonitor />
      </div>

      {/* Data Export Options */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Data Export & Privacy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Complete Analytics Report</div>
                <div className="text-sm text-gray-600">
                  Full data export with all metrics
                </div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Score History Only</div>
                <div className="text-sm text-gray-600">
                  Historical score data for external analysis
                </div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Anonymized Summary</div>
                <div className="text-sm text-gray-600">
                  Privacy-safe overview without personal data
                </div>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Privacy Controls</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={!showPeerComparison}
                  onChange={(e) => setShowPeerComparison(!e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Hide peer comparison data</span>
              </label>

              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Anonymize exported data</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
