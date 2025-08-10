import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw,
  Eye,
  EyeOff,
  Target,
  Percent,
  BarChart3
} from 'lucide-react';

interface TVLData {
  protocol: string;
  tvl: number;
  change24h: number;
  change7d: number;
  chains: string[];
  category: string;
  lastUpdated: number;
  source: string;
}

interface ProtocolYieldData {
  protocol: string;
  asset: string;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  pool: string;
  chain: string;
  lastUpdated: number;
  source: string;
}

interface ProtocolTVLDisplayProps {
  protocols: string[];
  privacyMode: boolean;
  showYields?: boolean;
  refreshInterval?: number;
}

const ProtocolTVLDisplay: React.FC<ProtocolTVLDisplayProps> = ({
  protocols,
  privacyMode,
  showYields = true,
  refreshInterval = 600000 // 10 minutes
}) => {
  const [tvlData, setTvlData] = useState<TVLData[]>([]);
  const [yieldData, setYieldData] = useState<ProtocolYieldData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Load TVL and yield data
  useEffect(() => {
    const loadProtocolData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
        
        // Get TVL data for all protocols
        const tvlPromises = protocols.map(async (protocol) => {
          try {
            return await creditIntelligenceService.getProtocolTVL(protocol);
          } catch (error) {
            console.error(`Failed to get TVL for ${protocol}:`, error);
            return null;
          }
        });

        const tvlResults = await Promise.allSettled(tvlPromises);
        const validTvlData = tvlResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => (result as PromiseFulfilledResult<TVLData>).value);

        setTvlData(validTvlData);

        // Get yield data if requested
        if (showYields) {
          const allYields = await creditIntelligenceService.getProtocolYields();
          setYieldData(allYields || []);
        }

        setLastUpdate(Date.now());
        
      } catch (error) {
        console.error('Failed to load protocol data:', error);
        setError('Error loading protocol data');
      } finally {
        setLoading(false);
      }
    };

    if (protocols.length > 0) {
      loadProtocolData();
      
      // Set up periodic updates
      if (refreshInterval > 0) {
        const interval = setInterval(loadProtocolData, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [protocols, showYields, refreshInterval]);

  const formatTVL = (tvl: number): string => {
    if (privacyMode) return '***';
    
    if (tvl >= 1e9) {
      return `$${(tvl / 1e9).toFixed(2)}B`;
    } else if (tvl >= 1e6) {
      return `$${(tvl / 1e6).toFixed(2)}M`;
    } else if (tvl >= 1e3) {
      return `$${(tvl / 1e3).toFixed(2)}K`;
    } else {
      return `$${tvl.toFixed(2)}`;
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

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const formatAPY = (apy: number): string => {
    if (privacyMode) return '***';
    return `${apy.toFixed(2)}%`;
  };

  const getProtocolColor = (protocol: string): string => {
    const colors: { [key: string]: string } = {
      'uniswap': 'bg-pink-100 text-pink-700',
      'aave': 'bg-purple-100 text-purple-700',
      'compound': 'bg-green-100 text-green-700',
      'makerdao': 'bg-orange-100 text-orange-700',
      'curve': 'bg-blue-100 text-blue-700',
      'balancer': 'bg-indigo-100 text-indigo-700',
      'sushiswap': 'bg-red-100 text-red-700',
      'yearn': 'bg-yellow-100 text-yellow-700'
    };
    
    return colors[protocol.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading protocol data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-6 h-6 text-red-500" />
          <span className="ml-2 text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TVL Data */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Protocol TVL Data</h3>
          </div>
          
          {privacyMode && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <EyeOff className="w-4 h-4" />
              <span>Privacy Mode</span>
            </div>
          )}
        </div>

        {tvlData.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No TVL data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tvlData.map((protocol, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getProtocolColor(protocol.protocol)}`}>
                      {protocol.protocol}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {protocol.category}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTVL(protocol.tvl)}
                  </div>
                  <div className="text-sm text-gray-600">Total Value Locked</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">24h Change:</span>
                    <div className={`flex items-center space-x-1 ${getChangeColor(protocol.change24h)}`}>
                      {getChangeIcon(protocol.change24h)}
                      <span>{formatChange(protocol.change24h)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">7d Change:</span>
                    <div className={`flex items-center space-x-1 ${getChangeColor(protocol.change7d)}`}>
                      {getChangeIcon(protocol.change7d)}
                      <span>{formatChange(protocol.change7d)}</span>
                    </div>
                  </div>
                </div>

                {protocol.chains && protocol.chains.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">
                      Chains: {privacyMode ? '***' : protocol.chains.slice(0, 3).join(', ')}
                      {protocol.chains.length > 3 && !privacyMode && ` +${protocol.chains.length - 3}`}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  Updated: {new Date(protocol.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protocol Yields */}
      {showYields && yieldData.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Percent className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Protocol Yield Rates</h3>
          </div>

          <div className="space-y-4">
            {/* Group yields by protocol */}
            {Object.entries(
              yieldData.reduce((acc, yield_) => {
                if (!acc[yield_.protocol]) acc[yield_.protocol] = [];
                acc[yield_.protocol].push(yield_);
                return acc;
              }, {} as { [key: string]: ProtocolYieldData[] })
            ).map(([protocol, yields]) => (
              <div key={protocol}>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <div className={`px-2 py-1 rounded text-xs font-medium mr-2 ${getProtocolColor(protocol)}`}>
                    {protocol}
                  </div>
                  <span className="text-sm text-gray-600">({yields.length} pools)</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {yields.slice(0, 6).map((yield_, index) => (
                    <div key={index} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{yield_.asset}</div>
                        <div className="text-xs text-gray-500">{yield_.chain}</div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">APY:</span>
                          <span className="font-medium text-green-600">
                            {formatAPY(yield_.apy)}
                          </span>
                        </div>
                        
                        {yield_.apyReward > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rewards:</span>
                            <span className="font-medium text-blue-600">
                              {formatAPY(yield_.apyReward)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pool TVL:</span>
                          <span className="font-medium">
                            {formatTVL(yield_.tvlUsd)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {yields.length > 6 && (
                  <div className="mt-2 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View All {yields.length} {protocol} Pools
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="card">
        <h4 className="font-semibold text-gray-900 mb-4">Summary Statistics</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">
              {privacyMode ? '***' : tvlData.length}
            </div>
            <div className="text-gray-600">Protocols</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">
              {privacyMode ? '***' : formatTVL(tvlData.reduce((sum, p) => sum + p.tvl, 0))}
            </div>
            <div className="text-gray-600">Total TVL</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">
              {privacyMode ? '***' : yieldData.length}
            </div>
            <div className="text-gray-600">Yield Pools</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">
              {privacyMode ? '***' : 
                yieldData.length > 0 ? 
                  `${(yieldData.reduce((sum, y) => sum + y.apy, 0) / yieldData.length).toFixed(2)}%` : 
                  'N/A'
              }
            </div>
            <div className="text-gray-600">Avg APY</div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {lastUpdate > 0 ? new Date(lastUpdate).toLocaleString() : 'Never'}
      </div>
    </div>
  );
};

export default ProtocolTVLDisplay;