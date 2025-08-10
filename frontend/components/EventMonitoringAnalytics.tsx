import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Database,
  Network,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface EventMonitoringStats {
  isMonitoring: boolean;
  activeFilters: number;
  eventsDetected: number;
  eventsConfirmed: number;
  chainReorganizations: number;
  userActionsDetected: number;
  currentBlock: number;
  lastEventTimestamp: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  providerName: string;
  eventsPerSecond: number;
  averageConfirmationTime: number;
}

interface EventPattern {
  protocol: string;
  eventType: string;
  count: number;
  volume: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  averageGasUsed: number;
  successRate: number;
}

interface EventMonitoringAnalyticsProps {
  timeframe: string;
  privacyMode: boolean;
  connectedAddress: string | null;
}

const EventMonitoringAnalytics: React.FC<EventMonitoringAnalyticsProps> = ({
  timeframe,
  privacyMode,
  connectedAddress
}) => {
  const [monitoringStats, setMonitoringStats] = useState<EventMonitoringStats | null>(null);
  const [eventPatterns, setEventPatterns] = useState<EventPattern[]>([]);
  const [protocolStats, setProtocolStats] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEventMonitoringAnalytics = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

        // Get real event monitoring statistics and patterns
        const [stats, patterns, protocolData, performance] = await Promise.all([
          creditIntelligenceService.getTransactionMonitoringStats?.() || null,
          creditIntelligenceService.getEventPatterns?.(timeframe) || [],
          creditIntelligenceService.getProtocolEventStats?.(timeframe) || {},
          creditIntelligenceService.getEventMonitoringPerformance?.() || null
        ]);

        setMonitoringStats(stats);
        setEventPatterns(patterns);
        setProtocolStats(protocolData);
        setPerformanceMetrics(performance);
      } catch (error) {
        console.error('Failed to load event monitoring analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventMonitoringAnalytics();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadEventMonitoringAnalytics, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading event monitoring analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Monitoring Overview */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Event Monitoring Analytics
          </h3>
          <div className="text-sm text-gray-500">
            Real-time blockchain event analysis
          </div>
        </div>

        {monitoringStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {privacyMode ? '***' : monitoringStats.eventsDetected.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Events Detected</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {privacyMode ? '***' : monitoringStats.eventsConfirmed.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Events Confirmed</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {privacyMode ? '***' : monitoringStats.eventsPerSecond.toFixed(1)}
                  </div>
                  <div className="text-sm text-purple-700">Events/Second</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {privacyMode ? '***' : `${monitoringStats.averageConfirmationTime.toFixed(1)}s`}
                  </div>
                  <div className="text-sm text-yellow-700">Avg Confirmation</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {monitoringStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Connection Status</div>
              <div className={`text-lg font-bold ${
                monitoringStats.connectionStatus === 'connected' ? 'text-green-600' :
                monitoringStats.connectionStatus === 'connecting' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {monitoringStats.connectionStatus.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Provider: {monitoringStats.providerName}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Current Block</div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode ? '***' : monitoringStats.currentBlock.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Latest processed block
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Active Filters</div>
              <div className="text-lg font-bold text-gray-900">
                {monitoringStats.activeFilters}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Event monitoring filters
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Patterns Analysis */}
      {eventPatterns.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Event Patterns & Trends
            </h3>
          </div>

          <div className="space-y-4">
            {eventPatterns.map((pattern, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${
                      pattern.protocol === 'Aave V3' ? 'bg-purple-500' :
                      pattern.protocol === 'Uniswap V3' ? 'bg-pink-500' :
                      pattern.protocol === 'Compound' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {pattern.protocol} - {pattern.eventType}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {privacyMode ? '***' : pattern.count} events in {timeframe}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pattern.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                      pattern.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pattern.trend === 'increasing' ? '📈' :
                       pattern.trend === 'decreasing' ? '📉' : '➡️'} {pattern.trend}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Volume:</span>
                    <div className="font-medium">
                      {privacyMode ? '***' : `${(Number(pattern.volume) / 1e18).toFixed(2)} ETH`}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Gas:</span>
                    <div className="font-medium">
                      {privacyMode ? '***' : pattern.averageGasUsed.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Success Rate:</span>
                    <div className={`font-medium ${
                      pattern.successRate > 0.95 ? 'text-green-600' :
                      pattern.successRate > 0.9 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {privacyMode ? '***' : `${(pattern.successRate * 100).toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Frequency:</span>
                    <div className="font-medium">
                      {privacyMode ? '***' : `${(pattern.count / 30).toFixed(1)}/day`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocol Event Statistics */}
      {Object.keys(protocolStats).length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Network className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Protocol Event Statistics
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(protocolStats).map(([protocol, stats]: [string, any]) => (
              <div key={protocol} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">{protocol}</h4>
                  <div className={`w-3 h-3 rounded-full ${
                    protocol === 'aave' ? 'bg-purple-500' :
                    protocol === 'uniswap' ? 'bg-pink-500' :
                    protocol === 'compound' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Events:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : stats.count?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : `${(Number(stats.volume || 0) / 1e18).toFixed(2)} ETH`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unique Users:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : stats.uniqueUsers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Gas:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : (stats.averageGas || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Monitoring Performance
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Response Times</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Detection:</span>
                  <span className="font-medium">
                    {privacyMode ? '***' : `${performanceMetrics.eventDetectionTime?.toFixed(1) || 0}ms`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Block Processing:</span>
                  <span className="font-medium">
                    {privacyMode ? '***' : `${performanceMetrics.blockProcessingTime?.toFixed(1) || 0}ms`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Confirmation:</span>
                  <span className="font-medium">
                    {privacyMode ? '***' : `${performanceMetrics.confirmationTime?.toFixed(1) || 0}s`}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">System Health</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium text-green-600">
                    {privacyMode ? '***' : `${performanceMetrics.uptime?.toFixed(1) || 0}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Error Rate:</span>
                  <span className={`font-medium ${
                    (performanceMetrics.errorRate || 0) < 0.01 ? 'text-green-600' :
                    (performanceMetrics.errorRate || 0) < 0.05 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {privacyMode ? '***' : `${((performanceMetrics.errorRate || 0) * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Memory Usage:</span>
                  <span className="font-medium">
                    {privacyMode ? '***' : `${performanceMetrics.memoryUsage?.toFixed(1) || 0}MB`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chain Reorganization Alerts */}
      {monitoringStats && monitoringStats.chainReorganizations > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Chain Reorganization Alerts
            </h3>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">
                  {monitoringStats.chainReorganizations} chain reorganizations detected
                </div>
                <div className="text-sm text-orange-700 mt-1">
                  Some events may have been affected by blockchain reorganizations. 
                  All affected events are automatically re-processed.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventMonitoringAnalytics;