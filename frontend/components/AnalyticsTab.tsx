import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Zap,
  Database,
  Brain,
  BarChart3,
  PieChart,
  Activity,
  Network
} from 'lucide-react';
import {
  AnalyticsLoading,
  SkeletonCard,
  SkeletonChart
} from './LoadingStates';
import RealMarketDataChart from './RealMarketDataChart';
import MarketSentimentDisplay from './MarketSentimentDisplay';
import RealTimePriceFeedAnalytics from './RealTimePriceFeedAnalytics';
import RealTimeVolatilityMonitor from './RealTimeVolatilityMonitor';
import PriceFeedSourceStatus from './PriceFeedSourceStatus';
import APIHealthMonitor from './APIHealthMonitor';

interface AnalyticsTabProps {
  dashboardData: any;
  connectedAddress: string | null;
  timeframe: string;
  loading: boolean;
  loadingStates: any;
  errorStates: any;
  retryTimers: any;
  onRetry: (dataType: string) => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  dashboardData,
  connectedAddress,
  timeframe,
  loading,
  loadingStates,
  errorStates,
  retryTimers,
  onRetry,
}) => {
  if (loading && !dashboardData.analyticsData) {
    return (
      <div className="space-y-6">
        <AnalyticsLoading />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Score Trend</h3>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardData.analyticsData?.peerComparison?.percentile
              ? `${dashboardData.analyticsData.peerComparison.percentile}th`
              : "N/A"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Percentile ranking</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Gas Efficiency
            </h3>
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardData.transactionAnalytics?.gasAnalysis?.avgEfficiency
              ? `${(dashboardData.transactionAnalytics.gasAnalysis.avgEfficiency * 100).toFixed(0)}%`
              : "N/A"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Optimization score</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Data Quality
            </h3>
            <Database className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardData.behaviorProfile?.dataCompleteness
              ? `${(dashboardData.behaviorProfile.dataCompleteness * 100).toFixed(0)}%`
              : "N/A"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Analysis confidence</div>
        </div>
      </div>

      {/* Market Data and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Data Chart
          </h3>
          <RealMarketDataChart
            symbol="ETH"
            timeframe={timeframe}
            showVolume={true}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Sentiment
          </h3>
          <MarketSentimentDisplay
            refreshInterval={60000}
          />
        </div>
      </div>

      {/* Price Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Price Feed Analytics
          </h3>
          <RealTimePriceFeedAnalytics
            showDetails={true}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Volatility Monitor
          </h3>
          <RealTimeVolatilityMonitor
            showAlerts={true}
            showCharts={false}
            refreshInterval={30000}
          />
        </div>
      </div>

      {/* ML Model Performance */}
      {dashboardData.mlModelPerformance && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              ML Model Performance
            </h3>
            <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              Real Models Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(
              dashboardData.mlModelPerformance.riskPredictionModels || {}
            ).map(([modelId, performance]: [string, any]) => (
              <div key={modelId} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {modelId.replace(/_/g, " ").toUpperCase()}
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    Accuracy: {`${(performance.accuracy * 100).toFixed(1)}%`}
                  </div>
                  <div>
                    Confidence: {`${(performance.precision * 100).toFixed(1)}%`}
                  </div>
                  <div>
                    Last Trained: {new Date(
                        performance.lastTrained || Date.now()
                      ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Price Feed Status
          </h3>
          <PriceFeedSourceStatus refreshInterval={15000} showDetails={true} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            API Health Monitor
          </h3>
          <APIHealthMonitor />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
