import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calendar,
  DollarSign,
  Percent,
  Activity,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface HistoricalPriceData {
  timestamp: number;
  price: number;
  volume?: number;
}

interface MarketDataChartProps {
  symbol: string;
  timeframe: string;
  privacyMode: boolean;
  showVolume?: boolean;
}

const RealMarketDataChart: React.FC<MarketDataChartProps> = ({
  symbol,
  timeframe,
  privacyMode,
  showVolume = true
}) => {
  const [historicalData, setHistoricalData] = useState<HistoricalPriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<{ value: number; percentage: number } | null>(null);

  // Convert timeframe to days
  const getTimeframeDays = (tf: string): number => {
    switch (tf) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  // Load historical price data
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
        
        const days = getTimeframeDays(timeframe);
        
        // Get historical prices and current price
        const [historical, current] = await Promise.all([
          creditIntelligenceService.getHistoricalPrices(symbol, days),
          creditIntelligenceService.getRealTimePrice(symbol)
        ]);

        if (historical && historical.length > 0) {
          setHistoricalData(historical);
          
          // Calculate price change
          const firstPrice = historical[0].price;
          const lastPrice = historical[historical.length - 1].price;
          const change = lastPrice - firstPrice;
          const changePercentage = (change / firstPrice) * 100;
          
          setPriceChange({
            value: change,
            percentage: changePercentage
          });
        }

        if (current) {
          setCurrentPrice(current);
        }
        
      } catch (error) {
        console.error('Failed to load historical data:', error);
        setError('Failed to load price data');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      loadHistoricalData();
    }
  }, [symbol, timeframe]);

  const formatPrice = (price: number): string => {
    if (privacyMode) return '***';
    
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatVolume = (volume: number): string => {
    if (privacyMode) return '***';
    
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  const formatChange = (change: number, percentage: number): string => {
    if (privacyMode) return '***';
    
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(Math.abs(change))} (${sign}${percentage.toFixed(2)}%)`;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Simple price chart visualization (in a real app, you'd use a charting library)
  const renderSimpleChart = () => {
    if (historicalData.length === 0) return null;

    const prices = historicalData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    return (
      <div className="h-48 bg-gray-50 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
          {historicalData.map((data, index) => {
            const height = priceRange > 0 ? ((data.price - minPrice) / priceRange) * 160 : 80;
            const isLast = index === historicalData.length - 1;
            
            return (
              <div
                key={index}
                className={`w-1 rounded-t transition-all duration-300 ${
                  isLast ? 'bg-blue-600' : 'bg-blue-400'
                }`}
                style={{ height: `${height}px` }}
                title={`${new Date(data.timestamp).toLocaleDateString()}: ${formatPrice(data.price)}`}
              />
            );
          })}
        </div>
        
        {/* Price labels */}
        <div className="absolute top-2 left-4 text-xs text-gray-600">
          High: {formatPrice(maxPrice)}
        </div>
        <div className="absolute bottom-2 left-4 text-xs text-gray-600">
          Low: {formatPrice(minPrice)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading {symbol} price data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <span className="ml-2 text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            {symbol} Price Chart
          </h3>
          <div className="text-sm text-gray-500">
            {timeframe.toUpperCase()}
          </div>
        </div>
        
        {privacyMode && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <EyeOff className="w-4 h-4" />
            <span>Privacy Mode</span>
          </div>
        )}
      </div>

      {/* Current Price and Change */}
      {currentPrice && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(currentPrice.priceUSD)}
            </div>
            <div className="text-sm text-blue-700">Current Price</div>
            <div className="text-xs text-gray-600 mt-1">
              {currentPrice.source} • {currentPrice.confidence}% confidence
            </div>
          </div>
          
          {priceChange && (
            <div className={`text-center p-4 rounded-lg ${
              priceChange.value >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className={`text-2xl font-bold flex items-center justify-center space-x-2 ${
                getChangeColor(priceChange.value)
              }`}>
                {priceChange.value >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
                <span>{formatChange(priceChange.value, priceChange.percentage)}</span>
              </div>
              <div className={`text-sm ${
                priceChange.value >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {timeframe.toUpperCase()} Change
              </div>
            </div>
          )}
          
          {currentPrice.volume24h && showVolume && (
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatVolume(currentPrice.volume24h)}
              </div>
              <div className="text-sm text-purple-700">24h Volume</div>
            </div>
          )}
        </div>
      )}

      {/* Price Chart */}
      {historicalData.length > 0 ? (
        <div className="mb-6">
          {privacyMode ? (
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chart hidden in privacy mode</p>
              </div>
            </div>
          ) : (
            renderSimpleChart()
          )}
        </div>
      ) : (
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-6">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No historical data available</p>
          </div>
        </div>
      )}

      {/* Data Points Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium text-gray-900">
            {privacyMode ? '***' : historicalData.length}
          </div>
          <div className="text-gray-600">Data Points</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium text-gray-900">
            {privacyMode ? '***' : timeframe.toUpperCase()}
          </div>
          <div className="text-gray-600">Timeframe</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium text-gray-900">
            {currentPrice ? (privacyMode ? '***' : currentPrice.source) : 'N/A'}
          </div>
          <div className="text-gray-600">Data Source</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium text-gray-900">
            {currentPrice ? (privacyMode ? '***' : `${Math.floor(currentPrice.staleness || 0)}s`) : 'N/A'}
          </div>
          <div className="text-gray-600">Data Age</div>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default RealMarketDataChart;