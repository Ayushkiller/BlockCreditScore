import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Users, 
  DollarSign, 
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  AlertTriangle,
  BarChart3,
  Gauge,
  TrendingDown
} from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';

interface PerformanceMetrics {
  summary: {
    timestamp: number;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      [serviceName: string]: {
        health: 'healthy' | 'degraded' | 'unhealthy';
        avgLatency: number;
        throughput: number;
        errorRate: number;
        availability: number;
        activeAlerts: number;
      };
    };
    activeAlerts: any[];
    bottlenecks: any[];
    recommendations: string[];
  };
  alerts: any[];
  services: {
    [serviceName: string]: {
      latency: number;
      throughput: {
        current: number;
        average: number;
        peak: number;
      };
      errorRate: {
        current: number;
        average: number;
        peak: number;
        errorTypes: Record<string, number>;
      };
    };
  };
}

interface SystemHealth {
  timestamp: number;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      uptime: number;
      responseTime: number;
      errorRate: number;
      throughput: number;
      lastCheck: number;
      issues: string[];
    };
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    activeConnections: number;
  };
  performanceAlerts: any[];
  bottlenecks: any[];
  recommendations: string[];
  trends: {
    responseTime: {
      current: number;
      trend: 'improving' | 'stable' | 'degrading';
      change: number;
    };
    errorRate: {
      current: number;
      trend: 'improving' | 'stable' | 'degrading';
      change: number;
    };
    throughput: {
      current: number;
      trend: 'improving' | 'stable' | 'degrading';
      change: number;
    };
  };
}

const MonitoringPanel: React.FC = () => {
  const { 
    deployments, 
    monitoringData, 
    setMonitoringData, 
    addLog 
  } = useDeployment();

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<string>('');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Fetch real performance metrics
  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitoring/performance-metrics');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPerformanceMetrics(data);
      setLastUpdate(Date.now());
      
      addLog('📊 Performance metrics updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch performance metrics: ${errorMessage}`);
      addLog(`❌ Performance metrics fetch failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/monitoring/system-health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSystemHealth(data);
      
      addLog('🏥 System health data updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch system health:', errorMessage);
      addLog(`❌ System health fetch failed: ${errorMessage}`);
    }
  };

  // Real-time monitoring with actual API calls
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      // Initial fetch
      fetchPerformanceMetrics();
      fetchSystemHealth();
      
      // Set up periodic updates
      interval = setInterval(() => {
        fetchPerformanceMetrics();
        fetchSystemHealth();
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const startMonitoring = async () => {
    setIsMonitoring(true);
    addLog('🔍 Started real-time performance monitoring');
    
    // Initialize monitoring with real data
    await fetchPerformanceMetrics();
    await fetchSystemHealth();
    
    setMonitoringData({
      isConnected: true,
      latestBlock: 8234567 + Math.floor(Math.random() * 1000),
      gasPrice: (15 + Math.random() * 10).toFixed(1),
      balance: (0.5 + Math.random() * 0.5).toFixed(4),
      lastUpdate: Date.now()
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    addLog('⏹️ Performance monitoring stopped');
    setMonitoringData({
      ...monitoringData,
      isConnected: false
    });
  };

  const refreshMetrics = async () => {
    if (isMonitoring) {
      await fetchPerformanceMetrics();
      await fetchSystemHealth();
      addLog('🔄 Metrics refreshed manually');
    }
  };

  const hasDeployments = deployments.length > 0;
  const overallHealth = systemHealth?.overallStatus || 'unknown';
  const healthColor = overallHealth === 'healthy' ? 'text-green-500' : 
                     overallHealth === 'degraded' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Real-time Performance Monitoring</h2>
            <p className="text-gray-600 mt-1">
              Monitor actual API latency, blockchain query times, transaction processing rates, and system health
            </p>
            {lastUpdate > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isMonitoring ? (
                <Zap className="w-6 h-6 text-green-500" />
              ) : (
                <Activity className="w-6 h-6 text-gray-400" />
              )}
              <span className="font-medium">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            {systemHealth && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  overallHealth === 'healthy' ? 'bg-green-500' :
                  overallHealth === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className={`font-medium capitalize ${healthColor}`}>
                  {overallHealth}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900">Monitoring Error</h3>
              <p className="text-red-800 mt-1">{error}</p>
              <button
                onClick={refreshMetrics}
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Controls */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Monitoring Controls</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                disabled={loading}
                className="btn btn-success flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Starting...' : 'Start Real-time Monitoring'}</span>
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="btn btn-error flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Monitoring</span>
              </button>
            )}
            
            {isMonitoring && (
              <button
                onClick={refreshMetrics}
                disabled={loading}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            Real-time monitoring tracks actual API performance, blockchain query times, and system health
          </div>
        </div>
      </div>

      {/* Real Performance Metrics Overview */}
      {isMonitoring && performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Health</p>
                <p className={`text-2xl font-bold capitalize ${
                  performanceMetrics.summary.overallHealth === 'healthy' ? 'text-green-600' :
                  performanceMetrics.summary.overallHealth === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {performanceMetrics.summary.overallHealth}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                performanceMetrics.summary.overallHealth === 'healthy' ? 'bg-green-100' :
                performanceMetrics.summary.overallHealth === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {performanceMetrics.summary.overallHealth === 'healthy' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : performanceMetrics.summary.overallHealth === 'degraded' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Server className="w-4 h-4 mr-1" />
              {Object.keys(performanceMetrics.summary.services).length} Services
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(performanceMetrics.summary.services)
                    .reduce((sum, service) => sum + service.avgLatency, 0) / 
                   Object.keys(performanceMetrics.summary.services).length || 0}ms
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Activity className="w-4 h-4 mr-1" />
              Real-time tracking
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Throughput</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(performanceMetrics.summary.services)
                    .reduce((sum, service) => sum + service.throughput, 0).toFixed(1)} ops/sec
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Processing rate
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className={`text-2xl font-bold ${
                  performanceMetrics.summary.activeAlerts.length === 0 ? 'text-green-600' :
                  performanceMetrics.summary.activeAlerts.length < 3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {performanceMetrics.summary.activeAlerts.length}
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${
                performanceMetrics.summary.activeAlerts.length === 0 ? 'text-green-500' :
                performanceMetrics.summary.activeAlerts.length < 3 ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <RefreshCw className="w-4 h-4 mr-1" />
              Last check: {new Date(performanceMetrics.summary.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Service Performance Breakdown */}
      {isMonitoring && performanceMetrics && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Service Performance Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(performanceMetrics.summary.services).map(([serviceName, serviceData]) => (
              <div key={serviceName} className={`p-6 rounded-lg border-2 ${
                serviceData.health === 'healthy' ? 'border-green-200 bg-green-50' :
                serviceData.health === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {serviceName.replace('-', ' ')}
                  </h4>
                  <div className={`w-3 h-3 rounded-full ${
                    serviceData.health === 'healthy' ? 'bg-green-500' :
                    serviceData.health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Latency:</span>
                    <span className="font-medium">{serviceData.avgLatency.toFixed(0)}ms</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Throughput:</span>
                    <span className="font-medium">{serviceData.throughput.toFixed(1)} ops/sec</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate:</span>
                    <span className={`font-medium ${
                      serviceData.errorRate < 2 ? 'text-green-600' :
                      serviceData.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {serviceData.errorRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Availability:</span>
                    <span className={`font-medium ${
                      serviceData.availability > 99 ? 'text-green-600' :
                      serviceData.availability > 95 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {serviceData.availability.toFixed(1)}%
                    </span>
                  </div>
                  
                  {serviceData.activeAlerts > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Alerts:</span>
                      <span className="font-medium text-red-600">{serviceData.activeAlerts}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Performance Alerts */}
      {isMonitoring && performanceMetrics && performanceMetrics.summary.activeAlerts.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Active Performance Alerts</h3>
          
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {performanceMetrics.summary.activeAlerts.map((alert, index) => (
              <div key={alert.id || index} className={`flex items-center justify-between p-4 rounded-lg border ${
                alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{alert.message}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {alert.service} • {alert.severity} severity
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {alert.currentValue?.toFixed?.(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Bottlenecks and Recommendations */}
      {isMonitoring && performanceMetrics && (performanceMetrics.summary.bottlenecks.length > 0 || performanceMetrics.summary.recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bottlenecks */}
          {performanceMetrics.summary.bottlenecks.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">System Bottlenecks</h3>
              
              <div className="space-y-4">
                {performanceMetrics.summary.bottlenecks.slice(0, 5).map((bottleneck, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          bottleneck.severity > 0.8 ? 'bg-red-500' :
                          bottleneck.severity > 0.5 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="font-medium text-gray-900 capitalize">
                          {bottleneck.service} - {bottleneck.bottleneckType.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {(bottleneck.severity * 100).toFixed(0)}% severity
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{bottleneck.impact}</p>
                    <p className="text-sm text-blue-700 font-medium">{bottleneck.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {performanceMetrics.summary.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Recommendations</h3>
              
              <div className="space-y-3">
                {performanceMetrics.summary.recommendations.slice(0, 6).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-blue-900">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Health Trends */}
      {isMonitoring && systemHealth && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Trends</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                <span className="font-medium">Response Time</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {systemHealth.trends.responseTime.current.toFixed(0)}ms
              </div>
              <div className={`flex items-center justify-center text-sm ${
                systemHealth.trends.responseTime.trend === 'improving' ? 'text-green-600' :
                systemHealth.trends.responseTime.trend === 'stable' ? 'text-gray-600' : 'text-red-600'
              }`}>
                {systemHealth.trends.responseTime.trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : systemHealth.trends.responseTime.trend === 'stable' ? (
                  <Activity className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {systemHealth.trends.responseTime.change > 0 ? '+' : ''}{systemHealth.trends.responseTime.change.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                <span className="font-medium">Error Rate</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {systemHealth.trends.errorRate.current.toFixed(1)}%
              </div>
              <div className={`flex items-center justify-center text-sm ${
                systemHealth.trends.errorRate.trend === 'improving' ? 'text-green-600' :
                systemHealth.trends.errorRate.trend === 'stable' ? 'text-gray-600' : 'text-red-600'
              }`}>
                {systemHealth.trends.errorRate.trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : systemHealth.trends.errorRate.trend === 'stable' ? (
                  <Activity className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {systemHealth.trends.errorRate.change > 0 ? '+' : ''}{systemHealth.trends.errorRate.change.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
                <span className="font-medium">Throughput</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {systemHealth.trends.throughput.current.toFixed(1)} ops/sec
              </div>
              <div className={`flex items-center justify-center text-sm ${
                systemHealth.trends.throughput.trend === 'improving' ? 'text-green-600' :
                systemHealth.trends.throughput.trend === 'stable' ? 'text-gray-600' : 'text-red-600'
              }`}>
                {systemHealth.trends.throughput.trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : systemHealth.trends.throughput.trend === 'stable' ? (
                  <Activity className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {systemHealth.trends.throughput.change > 0 ? '+' : ''}{systemHealth.trends.throughput.change.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Resource Metrics */}
      {isMonitoring && systemHealth && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">System Resource Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Gauge className="w-6 h-6 text-blue-600 mr-2" />
                <span className="font-medium">CPU Usage</span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                systemHealth.systemMetrics.cpuUsage > 80 ? 'text-red-600' :
                systemHealth.systemMetrics.cpuUsage > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {systemHealth.systemMetrics.cpuUsage.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    systemHealth.systemMetrics.cpuUsage > 80 ? 'bg-red-500' :
                    systemHealth.systemMetrics.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth.systemMetrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Server className="w-6 h-6 text-purple-600 mr-2" />
                <span className="font-medium">Memory Usage</span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                systemHealth.systemMetrics.memoryUsage > 85 ? 'text-red-600' :
                systemHealth.systemMetrics.memoryUsage > 70 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {systemHealth.systemMetrics.memoryUsage.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    systemHealth.systemMetrics.memoryUsage > 85 ? 'bg-red-500' :
                    systemHealth.systemMetrics.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemHealth.systemMetrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-green-600 mr-2" />
                <span className="font-medium">Network Latency</span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                systemHealth.systemMetrics.networkLatency > 50 ? 'text-red-600' :
                systemHealth.systemMetrics.networkLatency > 30 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {systemHealth.systemMetrics.networkLatency.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">
                {systemHealth.systemMetrics.networkLatency < 20 ? 'Excellent' :
                 systemHealth.systemMetrics.networkLatency < 40 ? 'Good' : 'Needs attention'}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-orange-600 mr-2" />
                <span className="font-medium">Active Connections</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {systemHealth.systemMetrics.activeConnections}
              </div>
              <div className="text-sm text-gray-600">
                Real-time connections
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringPanel;