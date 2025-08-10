import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Target
} from 'lucide-react';

interface MarketSentimentData {
  value: number;
  valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: number;
  source: string;
}

interface VolatilityData {
  asset: string;
  volatility24h: number;
  volatility7d: number;
  volatility30d: number;
  timestamp: number;
  source: string;
}

interface MarketSentimentDisplayProps {
  privacyMode: boolean;
  refreshInterval?: number;
}

const MarketSentimentDisplay: React.FC<MarketSentimentDisplayProps> = ({
  privacyMode,
  refreshInterval = 300000 // 5 minutes
}) => {
  const [sentimentData, setSentimentData] = useState<MarketSentimentData | null>(null);
  const [volatilityData, setVolatilityData] = useState<{ ETH: VolatilityData; BTC: VolatilityData } | null>(null);
  const [overallSentiment, setOverallSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Load market sentiment data
  useEffect(() => {
    const loadMarketSentiment = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
        
        // Get comprehensive market sentiment analysis
        const sentimentAnalysis = await creditIntelligenceService.getMarketSentimentAnalysis();
        
        if (sentimentAnalysis) {
          setSentimentData(sentimentAnalysis.fearGreedIndex);
          setVolatilityData(sentimentAnalysis.volatility);
          setOverallSentiment(sentimentAnalysis.overallSentiment);
          setLastUpdate(Date.now());
        } else {
          setError('Failed to load market sentiment data');
        }
        
      } catch (error) {
        console.error('Failed to load market sentiment:', error);
        setError('Error loading market sentiment data');
      } finally {
        setLoading(false);
      }
    };

    loadMarketSentiment();
    
    // Set up periodic updates
    if (refreshInterval > 0) {
      const interval = setInterval(loadMarketSentiment, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const getSentimentColor = (classification: string): string => {
    switch (classification) {
      case 'Extreme Fear':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'Fear':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Neutral':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'Greed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Extreme Greed':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSentimentIcon = (classification: string) => {
    switch (classification) {
      case 'Extreme Fear':
      case 'Fear':
        return <TrendingDown className="w-5 h-5" />;
      case 'Greed':
      case 'Extreme Greed':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getVolatilityColor = (volatility: number): string => {
    if (volatility > 80) return 'text-red-600';
    if (volatility > 60) return 'text-yellow-600';
    if (volatility > 40) return 'text-blue-600';
    return 'text-green-600';
  };

  const getVolatilityLevel = (volatility: number): string => {
    if (volatility > 80) return 'Very High';
    if (volatility > 60) return 'High';
    if (volatility > 40) return 'Moderate';
    if (volatility > 20) return 'Low';
    return 'Very Low';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading market sentiment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span className="ml-2 text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Market Sentiment & Fear & Greed Index</h3>
        </div>
        
        {privacyMode && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <EyeOff className="w-4 h-4" />
            <span>Privacy Mode</span>
          </div>
        )}
      </div>

      {/* Fear & Greed Index */}
      {sentimentData && (
        <div className="mb-6">
          <div className={`p-6 rounded-lg border ${getSentimentColor(sentimentData.valueClassification)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getSentimentIcon(sentimentData.valueClassification)}
                <h4 className="text-lg font-semibold">Fear & Greed Index</h4>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {privacyMode ? '***' : sentimentData.value}
                </div>
                <div className="text-sm opacity-75">
                  {privacyMode ? '***' : sentimentData.valueClassification}
                </div>
              </div>
            </div>
            
            {!privacyMode && (
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    sentimentData.value <= 20 ? 'bg-red-600' :
                    sentimentData.value <= 40 ? 'bg-red-400' :
                    sentimentData.value <= 60 ? 'bg-gray-400' :
                    sentimentData.value <= 80 ? 'bg-green-400' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${sentimentData.value}%` }}
                />
              </div>
            )}
            
            <div className="text-sm opacity-75">
              Source: {sentimentData.source} • Updated: {new Date(sentimentData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Overall Sentiment Analysis */}
      {overallSentiment && (
        <div className="mb-6">
          <div className={`p-4 rounded-lg border ${getSentimentColor(overallSentiment.classification)}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Overall Market Sentiment</h4>
              <div className="text-2xl font-bold">
                {privacyMode ? '***' : overallSentiment.score}
              </div>
            </div>
            
            <div className="text-sm opacity-75">
              {privacyMode ? 'Analysis hidden in privacy mode' : overallSentiment.classification}
            </div>
            
            {!privacyMode && overallSentiment.factors && (
              <div className="mt-3 text-xs space-y-1">
                <div>Fear & Greed: {overallSentiment.factors.fearGreedIndex}</div>
                <div>Volatility Adjustment: {overallSentiment.factors.volatilityAdjustment.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market Volatility */}
      {volatilityData && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Market Volatility Indicators
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(volatilityData).map(([asset, data]) => (
              <div key={asset} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">{asset}</div>
                  <div className={`text-sm px-2 py-1 rounded ${getVolatilityColor(data.volatility30d)} bg-gray-100`}>
                    {privacyMode ? '***' : getVolatilityLevel(data.volatility30d)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">24h Volatility:</span>
                    <span className={`font-medium ${getVolatilityColor(data.volatility24h)}`}>
                      {privacyMode ? '***' : `${data.volatility24h.toFixed(1)}%`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">7d Volatility:</span>
                    <span className={`font-medium ${getVolatilityColor(data.volatility7d)}`}>
                      {privacyMode ? '***' : `${data.volatility7d.toFixed(1)}%`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">30d Volatility:</span>
                    <span className={`font-medium ${getVolatilityColor(data.volatility30d)}`}>
                      {privacyMode ? '***' : `${data.volatility30d.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Updated: {new Date(data.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        Last updated: {lastUpdate > 0 ? new Date(lastUpdate).toLocaleString() : 'Never'}
      </div>
    </div>
  );
};

export default MarketSentimentDisplay;