import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  AlertCircle,
  Clock
} from 'lucide-react';

interface RealTimePriceData {
  symbol: string;
  address: string;
  priceUSD: number;
  decimals: number;
  timestamp: number;
  roundId: string;
  confidence: number;
  source: 'chainlink' | 'dex_aggregator' | 'coingecko';
  change24h?: number;
  volume24h?: number;
  staleness: number;
}

interface RealTimePriceDisplayProps {
  symbols: string[];
  privacyMode: boolean;
  showVolatility?: boolean;
  refreshInterval?: number;
}

const RealTimePriceDisplay: React.FC<RealTimePriceDisplayProps> = ({
  symbols,
  privacyMode,
  showVolatility = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [prices, setPrices] = useState<Map<string, RealTimePriceData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [subscriptions, setSubscriptions] = useState<Map<string, () => void>>(new Map());

  // Initialize real-time price monitoring
  useEffect(() => {
    const initializePriceMonitoring = async () => {
      setLoading(true);
      
      try {
        // Import the service dynamically
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

        // Get initial batch prices
        const batchPrices = await creditIntelligenceService.getBatchRealTimePrices(symbols);
        
        if (batchPrices && batchPrices.prices) {
          const priceMap = new Map();
          for (const [symbol, priceData] of Object.entries(batchPrices.prices)) {
            priceMap.set(symbol, priceData);
          }
          setPrices(priceMap);
          setLastUpdate(Date.now());
        }

        // Set up real-time subscriptions for each symbol
        const newSubscriptions = new Map();
        
        for (const symbol of symbols) {
          try {
            const unsubscribe = await creditIntelligenceService.subscribeToRealTimePriceUpdates(
              symbol,
              (priceData: RealTimePriceData) => {
                console.log(`💲 Real-time price update for ${symbol}:`, priceData);
                
                setPrices(prev => {
                  const updated = new Map(prev);
                  updated.set(symbol, priceData);
                  return updated;
                });
                
                setLastUpdate(Date.now());
                setConnectionStatus('connected');
              }
            );
            
            newSubscriptions.set(symbol, unsubscribe);
          } catch (error) {
            console.error(`Failed to subscribe to price updates for ${symbol}:`, error);
            setConnectionStatus('error');
          }
        }
        
        setSubscriptions(newSubscriptions);
        setConnectionStatus('connected');
        
      } catch (error) {
        console.error('Failed to initialize price monitoring:', error);
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    if (symbols.length > 0) {
      initializePriceMonitoring();
    }

    // Cleanup subscriptions on unmount or symbol change
    return () => {
      subscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from price updates:', error);
        }
      });
    };
  }, [symbols]);

  // Periodic refresh fallback
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(async () => {
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
        const batchPrices = await creditIntelligenceService.getBatchRealTimePrices(symbols);
        
        if (batchPrices && batchPrices.prices) {
          const priceMap = new Map();
          for (const [symbol, priceData] of Object.entries(batchPrices.prices)) {
            priceMap.set(symbol, priceData);
          }
          setPrices(priceMap);
          setLastUpdate(Date.now());
        }
      } catch (error) {
        console.error('Error refreshing prices:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [symbols, refreshInterval]);

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

  const formatChange = (change: number): string => {
    if (privacyMode) return '***';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'chainlink':
        return '🔗';
      case 'coingecko':
        return '🦎';
      case 'dex_aggregator':
        return '🔄';
      default:
        return '📊';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStalenessWarning = (staleness: number): string | null => {
    if (staleness > 300) return 'Price data is stale (>5 min)';
    if (staleness > 120) return 'Price data is aging (>2 min)';
    return null;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading real-time prices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">Real-Time Asset Prices</h3>
          <div className={`flex items-center space-x-1 text-sm ${
            connectionStatus === 'connected' ? 'text-green-600' :
            connectionStatus === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>
            {lastUpdate > 0 
              ? `Updated ${Math.floor((Date.now() - lastUpdate) / 1000)}s ago`
              : 'No updates yet'
            }
          </span>
        </div>
      </div>

      {prices.size === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No price data available</p>
          <p className="text-sm text-gray-500 mt-1">
            {connectionStatus === 'error' 
              ? 'Connection error - check network and try again'
              : 'Waiting for price feed data...'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(prices.entries()).map(([symbol, priceData]) => {
            const stalenessWarning = getStalenessWarning(priceData.staleness);
            
            return (
              <div key={symbol} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold text-gray-900">{symbol}</div>
                    <div className="text-xs text-gray-500">
                      {getSourceIcon(priceData.source)} {priceData.source}
                    </div>
                  </div>
                  
                  <div className={`text-xs px-2 py-1 rounded ${getConfidenceColor(priceData.confidence)} bg-gray-100`}>
                    {privacyMode ? '***' : `${priceData.confidence}%`}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(priceData.priceUSD)}
                  </div>
                  
                  {showVolatility && priceData.change24h !== undefined && (
                    <div className={`flex items-center space-x-1 text-sm ${getChangeColor(priceData.change24h)}`}>
                      {priceData.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{formatChange(priceData.change24h)}</span>
                      <span className="text-gray-500">24h</span>
                    </div>
                  )}
                </div>

                {priceData.volume24h && (
                  <div className="text-xs text-gray-600 mb-2">
                    Volume: {privacyMode ? '***' : `$${(priceData.volume24h / 1e6).toFixed(2)}M`}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Updated: {new Date(priceData.timestamp).toLocaleTimeString()}
                  </span>
                  
                  {stalenessWarning && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <AlertCircle className="w-3 h-3" />
                      <span title={stalenessWarning}>Stale</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Price Feed Status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Active Feeds: {prices.size}</span>
            <span>Subscriptions: {subscriptions.size}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Auto-refresh: {refreshInterval / 1000}s</span>
            {connectionStatus === 'connected' && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimePriceDisplay;