// WebSocket Connection Status Component - Displays real WebSocket connection status and recovery attempts
// Implements task 9.2: Update frontend to display real WebSocket connection status and recovery attempts

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Server,
  Database
} from 'lucide-react';

interface ConnectionStatus {
  name: string;
  url: string;
  isConnected: boolean;
  connectionTime: number;
  lastHeartbeat: number;
  reconnectAttempts: number;
  totalReconnects: number;
  lastError?: string;
  latency: number;
  dataReceived: number;
  messagesReceived: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface ConnectionRecoveryEvent {
  type: 'connected' | 'disconnected' | 'reconnecting' | 'failed' | 'recovered';
  connection: string;
  timestamp: number;
  details?: string;
}

interface DataAvailabilityStatus {
  isAvailable: boolean;
  source: 'live' | 'cached' | 'fallback';
  staleness: number;
  confidence: number;
  lastUpdate: number;
}

interface SystemHealth {
  totalConnections: number;
  connectedCount: number;
  disconnectedCount: number;
  reconnectingCount: number;
  averageLatency: number;
  dataAvailability: number;
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

interface WebSocketStatusData {
  connections: ConnectionStatus[];
  systemHealth: SystemHealth;
  recentEvents: ConnectionRecoveryEvent[];
  dataAvailability: Record<string, DataAvailabilityStatus>;
}

export const WebSocketConnectionStatus: React.FC = () => {
  const [statusData, setStatusData] = useState<WebSocketStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchConnectionStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchConnectionStatus, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/websocket-status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setStatusData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch WebSocket status');
      console.error('Error fetching WebSocket status:', err);
    } finally {
      setLoading(false);
    }
  };

  const forceReconnectAll = async () => {
    try {
      const response = await fetch('/api/monitoring/websocket-reconnect', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      // Refresh status after reconnection attempt
      setTimeout(fetchConnectionStatus, 2000);
    } catch (err) {
      console.error('Error forcing reconnection:', err);
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
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
  };

  const getConnectionIcon = (status: ConnectionStatus) => {
    if (status.isConnected) {
      switch (status.connectionQuality) {
        case 'excellent': return <Wifi className="h-5 w-5 text-green-600" />;
        case 'good': return <Wifi className="h-5 w-5 text-blue-600" />;
        case 'poor': return <Wifi className="h-5 w-5 text-yellow-600" />;
        default: return <Wifi className="h-5 w-5 text-gray-600" />;
      }
    } else if (status.reconnectAttempts > 0) {
      return <RefreshCw className="h-5 w-5 text-orange-600 animate-spin" />;
    } else {
      return <WifiOff className="h-5 w-5 text-red-600" />;
    }
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'reconnecting': return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'recovered': return <TrendingUp className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Server className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">WebSocket Connections</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">WebSocket Connections</h3>
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

  if (!statusData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">WebSocket Connections</h3>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={fetchConnectionStatus}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
          <button
            onClick={forceReconnectAll}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Reconnect All
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Overall Health</span>
            {getHealthIcon(statusData.systemHealth.overallHealth)}
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold ${getHealthColor(statusData.systemHealth.overallHealth)}`}>
              {statusData.systemHealth.overallHealth.charAt(0).toUpperCase() + statusData.systemHealth.overallHealth.slice(1)}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Connected</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {statusData.systemHealth.connectedCount}
            </span>
            <span className="text-sm text-gray-600">
              /{statusData.systemHealth.totalConnections}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Avg Latency</span>
            <Zap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(statusData.systemHealth.averageLatency)}ms
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Data Availability</span>
            <Database className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              {statusData.systemHealth.dataAvailability.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Connection Status</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reconnects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusData.connections.map((connection, index) => (
                <tr key={connection.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getConnectionIcon(connection)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {connection.url}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      connection.isConnected 
                        ? 'bg-green-100 text-green-800' 
                        : connection.reconnectAttempts > 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {connection.isConnected 
                        ? 'Connected' 
                        : connection.reconnectAttempts > 0
                          ? 'Reconnecting'
                          : 'Disconnected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      connection.connectionQuality === 'excellent' ? 'text-green-600' :
                      connection.connectionQuality === 'good' ? 'text-blue-600' :
                      connection.connectionQuality === 'poor' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {connection.connectionQuality.charAt(0).toUpperCase() + connection.connectionQuality.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {connection.latency > 0 ? `${connection.latency}ms` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {connection.messagesReceived.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{connection.totalReconnects}</div>
                    {connection.reconnectAttempts > 0 && (
                      <div className="text-xs text-orange-600">
                        Attempt {connection.reconnectAttempts}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(connection.lastHeartbeat || connection.connectionTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Availability Status */}
      {Object.keys(statusData.dataAvailability).length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Data Availability</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(statusData.dataAvailability).map(([key, availability]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{key}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    availability.source === 'live' ? 'bg-green-100 text-green-800' :
                    availability.source === 'cached' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {availability.source}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{availability.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Staleness:</span>
                    <span className="font-medium">
                      {availability.staleness < 60000 
                        ? `${Math.round(availability.staleness / 1000)}s`
                        : `${Math.round(availability.staleness / 60000)}m`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-medium text-xs">
                      {formatDuration(availability.lastUpdate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {statusData.recentEvents.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Connection Events</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {statusData.recentEvents.slice(0, 10).map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getEventIcon(event.type)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {event.connection} - {event.type.replace('_', ' ')}
                  </div>
                  {event.details && (
                    <div className="text-xs text-gray-600">{event.details}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {formatTimestamp(Date.now())}
      </div>
    </div>
  );
};

export default WebSocketConnectionStatus;