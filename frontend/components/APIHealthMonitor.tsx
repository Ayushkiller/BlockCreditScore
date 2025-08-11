// API Health Monitor Component - Displays real API error status and health monitoring
// Implements task 9.1: Update frontend to display real API error status and health monitoring

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

interface APIHealthStatus {
  provider: string;
  endpoint: string;
  isHealthy: boolean;
  lastSuccessTime: number;
  lastErrorTime: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
}

interface APIMetrics {
  provider: string;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: number;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

interface StatusReport {
  timestamp: number;
  totalProviders: number;
  healthyProviders: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  rateLimitedProviders: string[];
}

interface APIHealthData {
  healthStatus: APIHealthStatus[];
  metrics: APIMetrics[];
  rateLimits: Record<string, RateLimitInfo>;
  statusReport: StatusReport;
}

export const APIHealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<APIHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/monitoring/api-health');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API health data');
      console.error('Error fetching API health data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getHealthColor = (isHealthy: boolean): string => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getUptimeColor = (uptime: number): string => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProviders = (): string[] => {
    if (!healthData) return [];
    const providers = new Set(healthData.healthStatus.map(h => h.provider));
    return Array.from(providers).sort();
  };

  const getFilteredHealthStatus = (): APIHealthStatus[] => {
    if (!healthData) return [];
    if (selectedProvider === 'all') return healthData.healthStatus;
    return healthData.healthStatus.filter(h => h.provider === selectedProvider);
  };

  const getFilteredMetrics = (): APIMetrics[] => {
    if (!healthData) return [];
    if (selectedProvider === 'all') return healthData.metrics;
    return healthData.metrics.filter(m => m.provider === selectedProvider);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Wifi className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Health Monitor</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <WifiOff className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Health Monitor</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Wifi className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Health Monitor</h3>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Providers</option>
            {getProviders().map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
          <button
            onClick={fetchHealthData}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Healthy Providers</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {healthData.statusReport.healthyProviders}
            </span>
            <span className="text-sm text-gray-600">
              /{healthData.statusReport.totalProviders}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Success Rate</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {healthData.statusReport.successRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Avg Response</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(healthData.statusReport.averageResponseTime)}ms
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Rate Limited</span>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {healthData.statusReport.rateLimitedProviders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Rate Limited Providers Alert */}
      {healthData.statusReport.rateLimitedProviders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">Rate Limited Providers:</span>
            <span className="text-yellow-700 ml-2">
              {healthData.statusReport.rateLimitedProviders.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Health Status Table */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Provider Health Status</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Success
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredHealthStatus().map((status, index) => (
                <tr key={`${status.provider}-${status.endpoint}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{status.provider}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {status.endpoint}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${getHealthColor(status.isHealthy)}`}>
                      {status.isHealthy ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {status.isHealthy ? 'Healthy' : 'Unhealthy'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getUptimeColor(status.uptime)}`}>
                      {status.uptime.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(status.averageResponseTime)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${status.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {status.errorCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(status.lastSuccessTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Limits */}
      {Object.keys(healthData.rateLimits).length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Rate Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(healthData.rateLimits).map(([provider, rateLimit]) => (
              <div key={provider} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{provider}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rateLimit.remaining > rateLimit.limit * 0.2 
                      ? 'bg-green-100 text-green-800' 
                      : rateLimit.remaining > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {rateLimit.remaining}/{rateLimit.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      rateLimit.remaining > rateLimit.limit * 0.2 
                        ? 'bg-green-600' 
                        : rateLimit.remaining > 0 
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
                  ></div>
                </div>
                {rateLimit.remaining === 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    Resets: {formatTimestamp(rateLimit.resetTime)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {formatTimestamp(healthData.statusReport.timestamp)}
      </div>
    </div>
  );
};

export default APIHealthMonitor;