// Real-Time Price Feed Analytics Component
// Implements task 6.1: Display actual price feed data and update timestamps

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface PriceFeedMetrics {
  symbol: string;
  priceUSD: number;
  staleness: number;
  stalenessLevel: 'fresh' | 'aging' | 'stale';
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  source: 'chainlink' | 'dex_aggregator' | 'coingecko';
  timestamp: number;
  ageMinutes: number;
  roundId?: string;
  warnings: string[];
}

interface PriceFeedStatus {
  isInitialized: boolean;
  cachedPrices: number;
  activeSubscriptions: number;
  web3Connections: number;
  supportedTokens: string[];
  lastUpdate: number;
  healthCheck: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  };
}

interface RealTimePriceFeedAnalyticsProps {
  privacyMode: boolean;
}

const RealTimePriceFeedAnalytics: React.FC<RealTimePriceFeedAnalyticsProps> = ({ privacyMode }) => {
  const [priceFeedStatus, setPriceFeedStatus] = useState<PriceFeedStatus | null>(null);
  const [cachedPrices, setCachedPrices] = useState<PriceFeedMetrics[]>([]);
  const [healthCheck, setHealthCheck] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Load price feed analytics data
  useEffect(() => {
    const loadPriceFeedAnalytics = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

        // Get comprehensive price feed status and metrics
        const [status, prices, health] = await Promise.all([
          creditIntelligenceService.getPriceFeedStatus(),
          creditIntelligenceService.getAllCachedPrices(),
          creditIntelligenceService.performPriceFeedHealthCheck()
        ]);

        if (status) {
          setPriceFeedStatus(status.status);
        }

        if (prices && Array.isArray(prices)) {
          setCachedPrices(prices);
        }

        if (health) {
          setHealthCheck(health.healthCheck);
        }

        setLastUpdate(Date.now());
      } catch (error) {
        console.error('Failed to load price feed analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPriceFeedAnalytics();

    // Refresh every 30 seconds
    const interval = setInterval(loadPriceFeedAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStalenessColor = (level: string) => {
    switch (level) {
      case 'fresh': return 'text-green-600';
      case 'aging': return 'text-yellow-600';
      case 'stale': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'chainlink': return '🔗';
      case 'dex_aggregator': return '🔄';
      case 'coingecko': return '🦎';
      default: return '📊';
    }
  };

  if (loading && !priceFeedStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading price feed analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Feed Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {privacyMode ? '***' : priceFeedStatus?.cachedPrices || 0}
              </div>
              <div className="text-sm text-blue-700">Cached Prices</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Wifi className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">
                {privacyMode ? '***' : priceFeedStatus?.activeSubscriptions || 0}
              </div>
              <div className="text-sm text-green-700">Active Subscriptions</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {privacyMode ? '***' : priceFeedStatus?.web3Connections || 0}
              </div>
              <div className="text-sm text-purple-700">Web3 Connections</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {privacyMode ? '***' : priceFeedStatus?.supportedTokens?.length || 0}
              </div>
              <div className="text-sm text-yellow-700">Supported Tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Status */}
      {healthCheck && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              System Health Status
            </h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthCheck.status)}`}>
              {healthCheck.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {privacyMode ? '***' : `${healthCheck.details?.healthCheck?.chainlinkLatency || 0}ms`}
              </div>
              <div className="text-sm text-gray-600">Chainlink Latency</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {privacyMode ? '***' : `${healthCheck.details?.healthCheck?.dexLatency || 0}ms`}
              </div>
              <div className="text-sm text-gray-600">DEX Latency</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {privacyMode ? '***' : new Date(healthCheck.details?.healthCheck?.timestamp || Date.now()).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">Last Check</div>
            </div>
          </div>
        </div>
      )}

      {/* Cached Price Details */}
      {cachedPrices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Real-Time Price Feed Details
          </h4>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cachedPrices.slice(0, 10).map((price, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getSourceIcon(price.source)}</span>
                    <div>
                      <div className="font-medium text-gray-900">{price.symbol}</div>
                      <div className="text-sm text-gray-500 capitalize">{price.source}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {privacyMode ? '***' : `$${price.priceUSD.toFixed(4)}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {privacyMode ? '***' : `${price.ageMinutes}m ago`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-sm font-medium ${getConfidenceColor(price.confidenceLevel)}`}>
                      {privacyMode ? '***' : `${price.confidence}%`}
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>

                  <div className="text-center">
                    <div className={`text-sm font-medium ${getStalenessColor(price.stalenessLevel)}`}>
                      {price.stalenessLevel.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">Freshness</div>
                  </div>

                  {price.warnings.length > 0 && (
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600" title={price.warnings.join(', ')} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {cachedPrices.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View All {cachedPrices.length} Price Feeds
              </button>
            </div>
          )}
        </div>
      )}

      {/* Update Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Last Updated: {lastUpdate > 0 ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</span>
            <span>Auto-refresh: 30s</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            {priceFeedStatus?.isInitialized ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span>Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimePriceFeedAnalytics;