import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Activity,
  Zap,
  RefreshCw,
  Bell,
  BellOff,
  Filter,
  BarChart3,
  LineChart,
  Target,
  Clock,
  DollarSign
} from 'lucide-react';

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
  id: string;
  symbol: string;
  alertType: 'high_volatility' | 'price_spike' | 'price_drop' | 'unusual_volume';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: number;
  timeAgo: string;
  actionRequired: string;
  impactLevel: 'minimal' | 'moderate' | 'significant' | 'severe';
}

interface VolatilityMonitorProps {
  symbols?: string[];
  showAlerts?: boolean;
  showCharts?: boolean;
  refreshInterval?: number;
  privacyMode?: boolean;
}

const RealTimeVolatilityMonitor: React.FC<VolatilityMonitorProps> = ({
  symbols = ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE'],
  showAlerts = true,
  showCharts = true,
  refreshInterval = 30000,
  privacyMode = false
}) => {
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>([]);
  const [alerts, setAlerts] = useState<VolatilityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'volatility' | 'price_change' | 'symbol'>('volatility');

  // Fetch volatility data
  useEffect(() => {
    const fetchVolatilityData = async () => {
      try {
        const response = await fetch('/api/price-feeds/volatility-data');
        if (response.ok) {
          const data = await response.json();
          setVolatilityData(data.volatilityData || []);
        }
      } catch (error) {
        console.error('Failed to fetch volatility data:', error);
      }
    };

    fetchVolatilityData();
    const interval = setInterval(fetchVolatilityData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Fetch volatility alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const params = new URLSearchParams({
          limit: '20'
        });
        
        if (filterSeverity !== 'all') {
          params.append('severity', filterSeverity);
        }

        const response = await fetch(`/api/price-feeds/volatility-alerts?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch volatility alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (showAlerts) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [showAlerts, refreshInterval, filterSeverity]);

  const getSortedVolatilityData = () => {
    const filtered = volatilityData.filter(data => 
      symbols.length === 0 || symbols.includes(data.symbol)
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volatility':
          const volatilityA = selectedTimeframe === '1h' ? a.volatility1h : 
                             selectedTimeframe === '24h' ? a.volatility24h : a.volatility7d;
          const volatilityB = selectedTimeframe === '1h' ? b.volatility1h : 
                             selectedTimeframe === '24h' ? b.volatility24h : b.volatility7d;
          return volatilityB - volatilityA;
        case 'price_change':
          const changeA = selectedTimeframe === '1h' ? a.priceChange1h : 
                         selectedTimeframe === '24h' ? a.priceChange24h : a.priceChange7d;
          const changeB = selectedTimeframe === '1h' ? b.priceChange1h : 
                         selectedTimeframe === '24h' ? b.priceChange24h : b.priceChange7d;
          return Math.abs(changeB) - Math.abs(changeA);
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });
  };

  const getVolatilityColor = (volatility: number) => {
    if (volatility >= 50) return 'text-red-600 bg-red-50 border-red-200';
    if (volatility >= 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (volatility >= 15) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (volatility >= 5) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-900';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-900';
      default: return 'border-gray-500 bg-gray-50 text-gray-900';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'high_volatility': return <Activity className="w-4 h-4" />;
      case 'price_spike': return <TrendingUp className="w-4 h-4" />;
      case 'price_drop': return <TrendingDown className="w-4 h-4" />;
      case 'unusual_volume': return <BarChart3 className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading volatility data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900">Real-Time Volatility Monitor</h3>
            <div className="text-sm text-gray-500">
              Live price volatility analysis
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {showAlerts && (
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  alertsEnabled 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span>Alerts {alertsEnabled ? 'On' : 'Off'}</span>
              </button>
            )}
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as '1h' | '24h' | '7d')}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'volatility' | 'price_change' | 'symbol')}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="volatility">Volatility</option>
                <option value="price_change">Price Change</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>
          </div>
        </div>

        {/* Volatility Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getSortedVolatilityData().map((data) => {
            const volatility = selectedTimeframe === '1h' ? data.volatility1h : 
                              selectedTimeframe === '24h' ? data.volatility24h : data.volatility7d;
            const priceChange = selectedTimeframe === '1h' ? data.priceChange1h : 
                               selectedTimeframe === '24h' ? data.priceChange24h : data.priceChange7d;
            
            return (
              <div key={data.symbol} className={`p-4 rounded-lg border ${getVolatilityColor(volatility)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="font-bold text-lg">{data.symbol}</div>
                    <div className="text-xs text-gray-500">
                      {data.dataPoints} pts
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {privacyMode ? '***' : `$${data.currentPrice.toFixed(2)}`}
                    </div>
                    <div className={`text-xs ${getPriceChangeColor(priceChange)}`}>
                      {privacyMode ? '***' : `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volatility:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : `${volatility.toFixed(1)}%`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Range:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : `${data.priceRange.toFixed(1)}%`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Std Dev:</span>
                    <span className="font-medium">
                      {privacyMode ? '***' : `${data.standardDeviation.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(data.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volatility Alerts */}
      {showAlerts && alertsEnabled && alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-semibold text-gray-900">Volatility Alerts</h3>
              <div className="text-sm text-gray-500">
                {alerts.length} active alerts
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getAlertIcon(alert.alertType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{alert.symbol}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize">
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-600">
                          {alert.timeAgo}
                        </span>
                      </div>
                      
                      <div className="text-sm mb-2">
                        {alert.message}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {alert.actionRequired}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {privacyMode ? '***' : `${alert.currentValue.toFixed(2)}%`}
                    </div>
                    <div className="text-xs text-gray-600">
                      Threshold: {privacyMode ? '***' : `${alert.threshold}%`}
                    </div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded capitalize ${
                      alert.impactLevel === 'severe' ? 'bg-red-100 text-red-700' :
                      alert.impactLevel === 'significant' ? 'bg-orange-100 text-orange-700' :
                      alert.impactLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.impactLevel} impact
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {alerts.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View All {alerts.length} Alerts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Volatility Summary Statistics */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">Volatility Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Average Volatility</div>
            <div className="text-2xl font-bold text-blue-900">
              {privacyMode ? '***' : `${(volatilityData.reduce((sum, data) => {
                const vol = selectedTimeframe === '1h' ? data.volatility1h : 
                           selectedTimeframe === '24h' ? data.volatility24h : data.volatility7d;
                return sum + vol;
              }, 0) / Math.max(volatilityData.length, 1)).toFixed(1)}%`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedTimeframe} timeframe
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Highest Volatility</div>
            <div className="text-2xl font-bold text-red-900">
              {privacyMode ? '***' : `${Math.max(...volatilityData.map(data => {
                return selectedTimeframe === '1h' ? data.volatility1h : 
                       selectedTimeframe === '24h' ? data.volatility24h : data.volatility7d;
              }), 0).toFixed(1)}%`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {volatilityData.find(data => {
                const vol = selectedTimeframe === '1h' ? data.volatility1h : 
                           selectedTimeframe === '24h' ? data.volatility24h : data.volatility7d;
                return vol === Math.max(...volatilityData.map(d => {
                  return selectedTimeframe === '1h' ? d.volatility1h : 
                         selectedTimeframe === '24h' ? d.volatility24h : d.volatility7d;
                }));
              })?.symbol || 'N/A'}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Stable Assets</div>
            <div className="text-2xl font-bold text-green-900">
              {volatilityData.filter(data => {
                const vol = selectedTimeframe === '1h' ? data.volatility1h : 
                           selectedTimeframe === '24h' ? data.volatility24h : data.volatility7d;
                return vol < 5;
              }).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              &lt; 5% volatility
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">High Risk Assets</div>
            <div className="text-2xl font-bold text-yellow-900">
              {volatilityData.filter(data => {
                const vol = selectedTimeframe === '1h' ? data.volatility1h : 
                           selectedTimeframe === '24h' ? data.volatility24h : data.volatility7d;
                return vol >= 30;
              }).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ≥ 30% volatility
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeVolatilityMonitor;