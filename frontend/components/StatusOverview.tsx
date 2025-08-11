import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap, 
  DollarSign, 
  Activity,
  Network,
  Shield,
  Wifi,
  WifiOff,
  Server,
  Database,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';
import APIHealthMonitor from './APIHealthMonitor';

interface BlockchainConnectionStatus {
  isConnected: boolean;
  currentProvider: string | null;
  lastBlockNumber: number;
  connectionTime: number;
  reconnectAttempts: number;
  providerHealth: Array<{
    name: string;
    isHealthy: boolean;
    priority: number;
    latency?: number;
    rateLimit: number;
    failureCount: number;
  }>;
  statistics: {
    totalProviders: number;
    healthyProviders: number;
    averageLatency: number;
    totalFailures: number;
  };
}

interface PriceCacheStatus {
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

interface PriceFailoverStatus {
  isInitialized: boolean;
  totalSources: number;
  healthySources: number;
  enabledSources: number;
  circuitBreakersOpen: number;
  sources: Array<{
    name: string;
    priority: number;
    isHealthy: boolean;
    isEnabled: boolean;
    successCount: number;
    failureCount: number;
    averageLatency: number;
    lastError?: string;
    circuitBreakerOpen: boolean;
  }>;
}

interface VolatilityMonitorStatus {
  isMonitoring: boolean;
  monitoredTokens: number;
  totalDataPoints: number;
  averageHistorySize: number;
  oldestDataPoint: number;
  newestDataPoint: number;
  updateInterval: number;
  recentAlerts: Array<{
    symbol: string;
    alertType: string;
    severity: string;
    currentValue: number;
    threshold: number;
    timestamp: number;
  }>;
}

const StatusOverview: React.FC = () => {
  const { envConfig, deployments, monitoringData } = useDeployment();
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainConnectionStatus>({
    isConnected: false,
    currentProvider: null,
    lastBlockNumber: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
    providerHealth: [],
    statistics: {
      totalProviders: 0,
      healthyProviders: 0,
      averageLatency: 0,
      totalFailures: 0
    }
  });

  const [priceCacheStatus, setPriceCacheStatus] = useState<PriceCacheStatus>({
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

  const [priceFailoverStatus, setPriceFailoverStatus] = useState<PriceFailoverStatus>({
    isInitialized: false,
    totalSources: 0,
    healthySources: 0,
    enabledSources: 0,
    circuitBreakersOpen: 0,
    sources: []
  });

  const [volatilityStatus, setVolatilityStatus] = useState<VolatilityMonitorStatus>({
    isMonitoring: false,
    monitoredTokens: 0,
    totalDataPoints: 0,
    averageHistorySize: 0,
    oldestDataPoint: 0,
    newestDataPoint: 0,
    updateInterval: 0,
    recentAlerts: []
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Fetch blockchain connection status
  useEffect(() => {
    const fetchBlockchainStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/blockchain/status');
        if (response.ok) {
          const status = await response.json();
          setBlockchainStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch blockchain status:', error);
      }
    };

    fetchBlockchainStatus();
    const interval = setInterval(fetchBlockchainStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch price cache status
  useEffect(() => {
    const fetchPriceCacheStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/price-feeds/status');
        if (response.ok) {
          const status = await response.json();
          setPriceCacheStatus(status.cache || {});
        }
      } catch (error) {
        console.error('Failed to fetch price cache status:', error);
      }
    };

    fetchPriceCacheStatus();
    const interval = setInterval(fetchPriceCacheStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch price failover status
  useEffect(() => {
    const fetchPriceFailoverStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/price-feeds/failover-status');
        if (response.ok) {
          const status = await response.json();
          setPriceFailoverStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch price failover status:', error);
      }
    };

    fetchPriceFailoverStatus();
    const interval = setInterval(fetchPriceFailoverStatus, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch volatility monitor status
  useEffect(() => {
    const fetchVolatilityStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/price-feeds/volatility-status');
        if (response.ok) {
          const status = await response.json();
          setVolatilityStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch volatility status:', error);
      }
    };

    fetchVolatilityStatus();
    const interval = setInterval(fetchVolatilityStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch performance metrics
  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/performance-metrics?type=summary');
        if (response.ok) {
          const data = await response.json();
          setPerformanceMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
      }
    };

    fetchPerformanceMetrics();
    const interval = setInterval(fetchPerformanceMetrics, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch system health
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch('/api/monitoring/system-health?detailed=false');
        if (response.ok) {
          const data = await response.json();
          setSystemHealth(data);
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error);
      }
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 20000); // Update every 20 seconds

    return () => clearInterval(interval);
  }, []);

  const isConfigured = envConfig.GOERLI_RPC_URL && envConfig.PRIVATE_KEY && envConfig.ETHERSCAN_API_KEY;
  const hasDeployments = deployments.length > 0;
  const isMonitoring = monitoringData.isConnected;

  const getDeploymentStats = () => {
    const goerliDeployments = deployments.filter(d => d.network === 'goerli');
    const sepoliaDeployments = deployments.filter(d => d.network === 'sepolia');
    const totalGasUsed = deployments.reduce((sum, d) => sum + d.gasUsed, 0);
    
    return {
      goerli: goerliDeployments.length,
      sepolia: sepoliaDeployments.length,
      totalGasUsed,
      lastDeployment: deployments.length > 0 ? Math.max(...deployments.map(d => d.timestamp)) : 0
    };
  };

  const stats = getDeploymentStats();

  const statusCards = [
    {
      title: 'Environment Configuration',
      status: isConfigured ? 'Ready' : 'Setup Required',
      icon: isConfigured ? CheckCircle : AlertCircle,
      color: isConfigured ? 'success' : 'warning',
      details: [
        `RPC URLs: ${envConfig.GOERLI_RPC_URL ? '✓' : '✗'} Goerli, ${envConfig.SEPOLIA_RPC_URL ? '✓' : '✗'} Sepolia`,
        `Private Key: ${envConfig.PRIVATE_KEY ? '✓ Configured' : '✗ Missing'}`,
        `Etherscan API: ${envConfig.ETHERSCAN_API_KEY ? '✓ Configured' : '✗ Missing'}`,
        `Gas Settings: ${envConfig.GAS_PRICE_GWEI} gwei, ${envConfig.GAS_LIMIT} limit`
      ]
    },
    {
      title: 'Price Cache System',
      status: priceCacheStatus.isConnected ? 
        (priceCacheStatus.healthStatus === 'healthy' ? 'Healthy' : 
         priceCacheStatus.healthStatus === 'degraded' ? 'Degraded' : 'Unhealthy') : 'Disconnected',
      icon: priceCacheStatus.isConnected ? 
        (priceCacheStatus.healthStatus === 'healthy' ? Database : 
         priceCacheStatus.healthStatus === 'degraded' ? AlertTriangle : AlertCircle) : WifiOff,
      color: priceCacheStatus.isConnected ? 
        (priceCacheStatus.healthStatus === 'healthy' ? 'success' : 
         priceCacheStatus.healthStatus === 'degraded' ? 'warning' : 'error') : 'error',
      details: [
        `Cached Prices: ${priceCacheStatus.totalKeys} keys`,
        `Hit Rate: ${priceCacheStatus.hitRate.toFixed(1)}%`,
        `Avg Latency: ${priceCacheStatus.averageLatency.toFixed(1)}ms`,
        `Stale Prices: ${priceCacheStatus.stalePrices}`,
        `Memory Usage: ${(priceCacheStatus.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        `Last Update: ${priceCacheStatus.lastUpdate ? new Date(priceCacheStatus.lastUpdate).toLocaleTimeString() : 'Never'}`
      ]
    },
    {
      title: 'Blockchain Connection',
      status: blockchainStatus.isConnected ? 'Connected' : 'Disconnected',
      icon: blockchainStatus.isConnected ? Wifi : WifiOff,
      color: blockchainStatus.isConnected ? 'success' : 'error',
      details: [
        `Provider: ${blockchainStatus.currentProvider || 'None'}`,
        `Current Block: #${blockchainStatus.lastBlockNumber?.toLocaleString() || '0'}`,
        `Healthy Providers: ${blockchainStatus.statistics?.healthyProviders || 0}/${blockchainStatus.statistics?.totalProviders || 0}`,
        `Reconnect Attempts: ${blockchainStatus.reconnectAttempts || 0}`,
        `Avg Latency: ${blockchainStatus.statistics?.averageLatency || 0}ms`,
        `Total Failures: ${blockchainStatus.statistics?.totalFailures || 0}`,
        `Connection Time: ${blockchainStatus.connectionTime ? new Date(blockchainStatus.connectionTime).toLocaleTimeString() : 'N/A'}`,
        `Real Data: ${process.env.REAL_DATA_ENABLED === 'true' ? 'Enabled' : 'Mock Mode'}`
      ]
    },
    {
      title: 'Smart Contract Deployments',
      status: hasDeployments ? `${deployments.length} Deployed` : 'Not Deployed',
      icon: hasDeployments ? CheckCircle : Clock,
      color: hasDeployments ? 'success' : 'info',
      details: [
        `Goerli: ${stats.goerli} deployments`,
        `Sepolia: ${stats.sepolia} deployments`,
        `Total Gas Used: ${stats.totalGasUsed.toLocaleString()}`,
        `Last Deployment: ${stats.lastDeployment ? new Date(stats.lastDeployment).toLocaleDateString() : 'Never'}`
      ]
    },
    {
      title: 'Price Feed Failover',
      status: priceFailoverStatus.isInitialized ? 
        `${priceFailoverStatus.healthySources}/${priceFailoverStatus.totalSources} Sources Healthy` : 'Not Initialized',
      icon: priceFailoverStatus.isInitialized ? 
        (priceFailoverStatus.circuitBreakersOpen > 0 ? AlertTriangle : Network) : AlertCircle,
      color: priceFailoverStatus.isInitialized ? 
        (priceFailoverStatus.healthySources === priceFailoverStatus.totalSources ? 'success' :
         priceFailoverStatus.healthySources > 0 ? 'warning' : 'error') : 'error',
      details: [
        `Total Sources: ${priceFailoverStatus.totalSources}`,
        `Healthy Sources: ${priceFailoverStatus.healthySources}`,
        `Enabled Sources: ${priceFailoverStatus.enabledSources}`,
        `Circuit Breakers Open: ${priceFailoverStatus.circuitBreakersOpen}`,
        `Primary Source: ${
          Array.isArray(priceFailoverStatus.sources)
            ? priceFailoverStatus.sources.find(s => s.priority === 1)?.name || 'None'
            : 'None'
        }`,
        `Failover Ready: ${priceFailoverStatus.healthySources > 1 ? '✓' : '✗'}`
      ]
    },
    {
      title: 'Volatility Monitoring',
      status: volatilityStatus.isMonitoring ? 
        `Monitoring ${volatilityStatus.monitoredTokens} Tokens` : 'Offline',
      icon: volatilityStatus.isMonitoring ? TrendingUp : Activity,
      color: volatilityStatus.isMonitoring ? 
        (volatilityStatus.recentAlerts.length > 0 ? 'warning' : 'success') : 'info',
      details: [
        `Monitored Tokens: ${volatilityStatus.monitoredTokens}`,
        `Total Data Points: ${
          typeof volatilityStatus.totalDataPoints === 'number'
            ? volatilityStatus.totalDataPoints.toLocaleString()
            : '0'
        }`,
        `Avg History Size: ${volatilityStatus.averageHistorySize}`,
        `Update Interval: ${volatilityStatus.updateInterval / 1000}s`,
        `Recent Alerts: ${(volatilityStatus.recentAlerts?.length ?? 0)}`,
        `Data Age: ${volatilityStatus.newestDataPoint ? 
          Math.floor((Date.now() - volatilityStatus.newestDataPoint) / 1000) + 's' : 'N/A'}`
      ]
    },
    {
      title: 'Network Monitoring',
      status: isMonitoring ? 'Active' : 'Offline',
      icon: isMonitoring ? Zap : Activity,
      color: isMonitoring ? 'success' : 'info',
      details: [
        `Connection: ${isMonitoring ? 'Connected' : 'Disconnected'}`,
        `Latest Block: ${monitoringData.latestBlock || 'Unknown'}`,
        `Gas Price: ${monitoringData.gasPrice || '0'} gwei`,
        `Balance: ${monitoringData.balance || '0'} ETH`
      ]
    },
    {
      title: 'Performance Monitoring',
      status: performanceMetrics ? 
        `${performanceMetrics.overallHealth?.charAt(0).toUpperCase() + performanceMetrics.overallHealth?.slice(1) || 'Unknown'}` : 'Loading',
      icon: performanceMetrics?.overallHealth === 'healthy' ? CheckCircle :
            performanceMetrics?.overallHealth === 'degraded' ? AlertTriangle : AlertCircle,
      color: performanceMetrics?.overallHealth === 'healthy' ? 'success' :
             performanceMetrics?.overallHealth === 'degraded' ? 'warning' : 'error',
      details: [
        `Services: ${Object.keys(performanceMetrics?.services || {}).length}`,
        `Avg Latency: ${performanceMetrics ? 
          (Object.values(performanceMetrics.services).reduce((sum: number, service: any) => sum + service.avgLatency, 0) / 
           Object.keys(performanceMetrics.services).length).toFixed(0) : '0'}ms`,
        `Total Throughput: ${performanceMetrics ? 
          Object.values(performanceMetrics.services).reduce((sum: number, service: any) => sum + service.throughput, 0).toFixed(1) : '0'} ops/sec`,
        `Active Alerts: ${performanceMetrics?.activeAlerts?.length || 0}`,
        `System Health: ${systemHealth?.overallStatus || 'Unknown'}`,
        `Uptime: ${systemHealth?.uptime ? Math.floor(systemHealth.uptime / 1000 / 60) + 'm' : 'N/A'}`
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Configure Environment',
      description: 'Set up RPC URLs, private keys, and API keys',
      action: 'Go to Config',
      disabled: false,
      color: 'primary'
    },
    {
      title: 'Deploy to Testnet',
      description: 'Deploy SimpleCreditScore contract to Goerli or Sepolia',
      action: 'Deploy Now',
      disabled: !isConfigured,
      color: 'success'
    },
    {
      title: 'Start Monitoring',
      description: 'Monitor real-time network activity and contract functionality',
      action: 'Start Monitor',
      disabled: !hasDeployments,
      color: 'warning'
    },
    {
      title: 'View Documentation',
      description: 'Access deployment guides and troubleshooting',
      action: 'Open Docs',
      disabled: false,
      color: 'info'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to CryptoVault Credit Intelligence
            </h2>
            <p className="text-gray-600 mt-1">
              The world's first Autonomous Credit Intelligence Ecosystem. Manage your credit profile, analyze behavior patterns, and prove creditworthiness with zero-knowledge privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <Icon className={`w-6 h-6 ${
                  card.color === 'success' ? 'text-green-500' :
                  card.color === 'warning' ? 'text-yellow-500' :
                  card.color === 'info' ? 'text-blue-500' : 'text-gray-500'
                }`} />
              </div>
              
              <div className={`status-badge mb-4 ${
                card.color === 'success' ? 'status-success' :
                card.color === 'warning' ? 'status-warning' :
                card.color === 'info' ? 'status-info' : 'status-error'
              }`}>
                {card.status}
              </div>
              
              <div className="space-y-2">
                {card.details.map((detail, idx) => (
                  <div key={idx} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-medium text-gray-900 mb-2">{action.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{action.description}</p>
              <button
                disabled={action.disabled}
                className={`btn w-full text-sm ${
                  action.color === 'primary' ? 'btn-primary' :
                  action.color === 'success' ? 'btn-success' :
                  action.color === 'warning' ? 'btn-warning' :
                  action.color === 'info' ? 'btn-secondary' : 'btn-secondary'
                }`}
              >
                {action.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Blockchain Provider Health */}
      {blockchainStatus.providerHealth.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Blockchain Provider Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blockchainStatus.providerHealth.map((provider, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                provider.isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      provider.isHealthy ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">{provider.name}</span>
                  </div>
                  <Server className={`w-4 h-4 ${
                    provider.isHealthy ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className="font-medium">{provider.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latency:</span>
                    <span className="font-medium">{provider.latency || 'N/A'}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate Limit:</span>
                    <span className="font-medium">{provider.rateLimit}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failures:</span>
                    <span className={`font-medium ${
                      provider.failureCount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>{provider.failureCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Feed Sources Status */}
      {Array.isArray(priceFailoverStatus.sources) && priceFailoverStatus.sources.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Price Feed Sources Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priceFailoverStatus.sources.map((source, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                source.isHealthy && source.isEnabled ? 'border-green-200 bg-green-50' : 
                source.isEnabled ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      source.isHealthy && source.isEnabled ? 'bg-green-500' : 
                      source.isEnabled ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900 capitalize">{source.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Priority {source.priority}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      source.isHealthy && source.isEnabled ? 'text-green-600' : 
                      source.isEnabled ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {source.isHealthy && source.isEnabled ? 'Healthy' : 
                       source.isEnabled ? 'Degraded' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">
                      {source.successCount + source.failureCount > 0 ? 
                        `${((source.successCount / (source.successCount + source.failureCount)) * 100).toFixed(1)}%` : 
                        'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Latency:</span>
                    <span className="font-medium">{source.averageLatency.toFixed(0)}ms</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Circuit Breaker:</span>
                    <span className={`font-medium ${
                      source.circuitBreakerOpen ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {source.circuitBreakerOpen ? 'Open' : 'Closed'}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Volatility Alerts */}
      {Array.isArray(volatilityStatus.recentAlerts) && volatilityStatus.recentAlerts.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Volatility Alerts</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {volatilityStatus.recentAlerts.slice(0, 10).map((alert, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {alert.symbol} - {alert.alertType.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {alert.severity} severity
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {alert.currentValue.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-600">
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

      {/* Real-time Performance Metrics */}
      {performanceMetrics && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Real-time Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(performanceMetrics.services).map(([serviceName, serviceData]: [string, any]) => (
              <div key={serviceName} className={`p-4 rounded-lg border ${
                serviceData.health === 'healthy' ? 'border-green-200 bg-green-50' :
                serviceData.health === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm capitalize">
                    {serviceName.replace('-', ' ')}
                  </h4>
                  <div className={`w-2 h-2 rounded-full ${
                    serviceData.health === 'healthy' ? 'bg-green-500' :
                    serviceData.health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latency:</span>
                    <span className="font-medium">{serviceData.avgLatency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Throughput:</span>
                    <span className="font-medium">{serviceData.throughput.toFixed(1)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Rate:</span>
                    <span className={`font-medium ${
                      serviceData.errorRate < 2 ? 'text-green-600' :
                      serviceData.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {serviceData.errorRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Availability:</span>
                    <span className="font-medium">{serviceData.availability.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Resource Usage */}
      {systemHealth && systemHealth.systemMetrics && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">System Resource Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  systemHealth.systemMetrics.cpuUsage > 80 ? 'bg-red-100' :
                  systemHealth.systemMetrics.cpuUsage > 60 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    systemHealth.systemMetrics.cpuUsage > 80 ? 'text-red-600' :
                    systemHealth.systemMetrics.cpuUsage > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth.systemMetrics.cpuUsage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="font-medium text-gray-900">CPU Usage</div>
              <div className="text-sm text-gray-600">
                {systemHealth.systemMetrics.cpuUsage > 80 ? 'High' :
                 systemHealth.systemMetrics.cpuUsage > 60 ? 'Medium' : 'Normal'}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  systemHealth.systemMetrics.memoryUsage > 85 ? 'bg-red-100' :
                  systemHealth.systemMetrics.memoryUsage > 70 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    systemHealth.systemMetrics.memoryUsage > 85 ? 'text-red-600' :
                    systemHealth.systemMetrics.memoryUsage > 70 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth.systemMetrics.memoryUsage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="font-medium text-gray-900">Memory Usage</div>
              <div className="text-sm text-gray-600">
                {systemHealth.systemMetrics.memoryUsage > 85 ? 'High' :
                 systemHealth.systemMetrics.memoryUsage > 70 ? 'Medium' : 'Normal'}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  systemHealth.systemMetrics.networkLatency > 50 ? 'bg-red-100' :
                  systemHealth.systemMetrics.networkLatency > 30 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <span className={`text-lg font-bold ${
                    systemHealth.systemMetrics.networkLatency > 50 ? 'text-red-600' :
                    systemHealth.systemMetrics.networkLatency > 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemHealth.systemMetrics.networkLatency.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="font-medium text-gray-900">Network Latency</div>
              <div className="text-sm text-gray-600">milliseconds</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
                  <span className="text-lg font-bold text-blue-600">
                    {systemHealth.systemMetrics.activeConnections}
                  </span>
                </div>
              </div>
              <div className="font-medium text-gray-900">Active Connections</div>
              <div className="text-sm text-gray-600">real-time</div>
            </div>
          </div>
        </div>
      )}

      {/* API Health Monitor */}
      <APIHealthMonitor />

      {/* Recent Activity */}
      {deployments.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Deployments</h3>
          <div className="space-y-4">
            {deployments.slice(-3).reverse().map((deployment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    deployment.status === 'deployed' ? 'bg-green-500' :
                    deployment.status === 'verified' ? 'bg-blue-500' :
                    deployment.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      SimpleCreditScore on {deployment.network}
                    </div>
                    <div className="text-sm text-gray-600">
                      {deployment.contractAddress}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Block #{deployment.blockNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(deployment.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Requirements */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">System Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Required for Deployment</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Node.js and npm installed
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Hardhat development environment
              </li>
              <li className="flex items-center">
                {isConfigured ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                )}
                Environment variables configured
              </li>
              <li className="flex items-center">
                <Network className="w-4 h-4 text-blue-500 mr-2" />
                Testnet ETH (0.1+ ETH recommended)
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommended Services</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Network className="w-4 h-4 text-blue-500 mr-2" />
                Infura or Alchemy RPC provider
              </li>
              <li className="flex items-center">
                <Shield className="w-4 h-4 text-blue-500 mr-2" />
                Etherscan API for verification
              </li>
              <li className="flex items-center">
                <DollarSign className="w-4 h-4 text-blue-500 mr-2" />
                Testnet faucets for ETH
              </li>
              <li className="flex items-center">
                <Activity className="w-4 h-4 text-blue-500 mr-2" />
                Block explorer for monitoring
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusOverview;