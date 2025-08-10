import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Network, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Activity,
  TrendingUp,
  Server,
  Wifi,
  WifiOff,
  Shield,
  AlertCircle
} from 'lucide-react';

interface PriceSource {
  name: string;
  priority: number;
  isHealthy: boolean;
  isEnabled: boolean;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  lastError?: string;
  circuitBreakerOpen: boolean;
}

interface PriceCacheMetrics {
  isConnected: boolean;
  totalKeys: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageLatency: number;
  memoryUsage: number;
  stalePrices: number;
  lastUpdate: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

interface FailoverStatus {
  isInitialized: boolean;
  totalSources: number;
  healthySources: number;
  enabledSources: number;
  circuitBreakersOpen: number;
  sources: PriceSource[];
}

interface PriceFeedSourceStatusProps {
  refreshInterval?: number;
  showDetails?: boolean;
}

const PriceFeedSourceStatus: React.FC<PriceFeedSourceStatusProps> = ({
  refreshInterval = 15000,
  showDetails = true
}) => {
  const [failoverStatus, setFailoverStatus] = useState<FailoverStatus>({
    isInitialized: false,
    totalSources: 0,
    healthySources: 0,
    enabledSources: 0,
    circuitBreakersOpen: 0,
    sources: []
  });

  const [cacheMetrics, setCacheMetrics] = useState<PriceCacheMetrics>({
    isConnected: false,
    totalKeys: 0,
    hitRate: 0,
    missRate: 0,
    totalHits: 0,
    totalMisses: 0,
    averageLatency: 0,
    memoryUsage: 0,
    stalePrices: 0,
    lastUpdate: 0,
    healthStatus: 'unhealthy'
  });

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Fetch failover status
  useEffect(() => {
    const fetchFailoverStatus = async () => {
      try {
        const response = await fetch('/api/price-feeds/failover-status');
        if (response.ok) {
          const data = await response.json();
          setFailoverStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch failover status:', error);
      }
    };

    fetchFailoverStatus();
    const interval = setInterval(fetchFailoverStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Fetch cache metrics
  useEffect(() => {
    const fetchCacheMetrics = async () => {
      try {
        const response = await fetch('/api/price-feeds/cache-metrics');
        if (response.ok) {
          const data = await response.json();
          setCacheMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch cache metrics:', error);
      } finally {
        setLoading(false);
        setLastRefresh(Date.now());
      }
    };

    fetchCacheMetrics();
    const interval = setInterval(fetchCacheMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getSourceStatusColor = (source: PriceSource) => {
    if (!source.isEnabled) return 'border-gray-300 bg-gray-50';
    if (source.circuitBreakerOpen) return 'border-red-300 bg-red-50';
    if (!source.isHealthy) return 'border-orange-300 bg-orange-50';
    return 'border-green-300 bg-green-50';
  };

  const getSourceStatusIcon = (source: PriceSource) => {
    if (!source.isEnabled) return <Server className="w-4 h-4 text-gray-500" />;
    if (source.circuitBreakerOpen) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (!source.isHealthy) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getSourceStatusText = (source: PriceSource) => {
    if (!source.isEnabled) return 'Disabled';
    if (source.circuitBreakerOpen) return 'Circuit Breaker Open';
    if (!source.isHealthy) return 'Degraded';
    return 'Healthy';
  };

  const getCacheHealthColor = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCacheHealthIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy': return <Database className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSuccessRate = (source: PriceSource) => {
    const total = source.successCount + source.failureCount;
    if (total === 0) return 0;
    return (source.successCount / total) * 100;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading price feed status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Cache Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getCacheHealthIcon(cacheMetrics.healthStatus)}
            <h3 className="text-xl font-semibold text-gray-900">Price Cache Status</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getCacheHealthColor(cacheMetrics.healthStatus)}`}>
              {cacheMetrics.healthStatus.charAt(0).toUpperCase() + cacheMetrics.healthStatus.slice(1)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Cache Hit Rate</div>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {cacheMetrics.hitRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {cacheMetrics.totalHits.toLocaleString()} hits
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Cached Prices</div>
              <Database className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">
              {cacheMetrics.totalKeys}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {cacheMetrics.stalePrices} stale
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Avg Latency</div>
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {cacheMetrics.averageLatency.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Response time
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600">Memory Usage</div>
              <Activity className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {(cacheMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Redis memory
            </div>
          </div>
        </div>

        {/* Cache Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {cacheMetrics.isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <div>
              <div className="font-medium text-gray-900">
                Redis Connection: {cacheMetrics.isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-sm text-gray-600">
                Last update: {cacheMetrics.lastUpdate ? new Date(cacheMetrics.lastUpdate).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Miss Rate: {cacheMetrics.missRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {cacheMetrics.totalMisses.toLocaleString()} misses
            </div>
          </div>
        </div>
      </div>

      {/* Price Feed Sources */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-900">Price Feed Sources</h3>
            <div className="text-sm text-gray-500">
              {failoverStatus.healthySources}/{failoverStatus.totalSources} healthy
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Circuit Breakers: {failoverStatus.circuitBreakersOpen} open
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              failoverStatus.healthySources === failoverStatus.totalSources 
                ? 'bg-green-100 text-green-800' 
                : failoverStatus.healthySources > 0 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              {failoverStatus.isInitialized ? 'Initialized' : 'Not Initialized'}
            </div>
          </div>
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {failoverStatus.sources
            .sort((a, b) => a.priority - b.priority)
            .map((source, index) => (
              <div key={source.name} className={`p-4 rounded-lg border ${getSourceStatusColor(source)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getSourceStatusIcon(source)}
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {source.name.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Priority {source.priority}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      source.isHealthy && source.isEnabled ? 'text-green-600' :
                      source.isEnabled ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {getSourceStatusText(source)}
                    </div>
                  </div>
                </div>

                {showDetails && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className={`font-medium ${
                        getSuccessRate(source) >= 95 ? 'text-green-600' :
                        getSuccessRate(source) >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getSuccessRate(source).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Latency:</span>
                      <span className="font-medium">
                        {source.averageLatency.toFixed(0)}ms
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requests:</span>
                      <span className="font-medium">
                        {(source.successCount + source.failureCount).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Failures:</span>
                      <span className={`font-medium ${
                        source.failureCount === 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {source.failureCount}
                      </span>
                    </div>

                    {source.lastError && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-xs text-red-600 truncate" title={source.lastError}>
                          Last Error: {source.lastError}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Failover Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {failoverStatus.totalSources}
              </div>
              <div className="text-sm text-gray-600">Total Sources</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">
                {failoverStatus.healthySources}
              </div>
              <div className="text-sm text-gray-600">Healthy Sources</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {failoverStatus.enabledSources}
              </div>
              <div className="text-sm text-gray-600">Enabled Sources</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-red-600">
                {failoverStatus.circuitBreakersOpen}
              </div>
              <div className="text-sm text-gray-600">Circuit Breakers</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">System Health Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${
            cacheMetrics.healthStatus === 'healthy' && failoverStatus.healthySources > 0
              ? 'border-green-200 bg-green-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className={`w-5 h-5 ${
                cacheMetrics.healthStatus === 'healthy' && failoverStatus.healthySources > 0
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }`} />
              <div className="font-medium text-gray-900">Overall Status</div>
            </div>
            <div className="text-sm text-gray-600">
              {cacheMetrics.healthStatus === 'healthy' && failoverStatus.healthySources > 0
                ? 'All systems operational'
                : 'Some systems degraded'}
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div className="font-medium text-gray-900">Redundancy</div>
            </div>
            <div className="text-sm text-gray-600">
              {failoverStatus.healthySources > 1 
                ? `${failoverStatus.healthySources} backup sources available`
                : 'Limited redundancy'}
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <div className="font-medium text-gray-900">Performance</div>
            </div>
            <div className="text-sm text-gray-600">
              {cacheMetrics.averageLatency < 100 
                ? 'Excellent response times'
                : cacheMetrics.averageLatency < 500
                  ? 'Good response times'
                  : 'Slow response times'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceFeedSourceStatus;