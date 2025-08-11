import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingIndicator, RetryMechanism } from './LoadingStates';

interface RealTimeMLScoreTrackerProps {
  address: string | null;
  privacyMode: boolean;
  refreshInterval?: number;
}

interface ScoreUpdate {
  timestamp: number;
  score: number;
  confidence: number;
  change: number;
  modelVersion: string;
}

const RealTimeMLScoreTracker: React.FC<RealTimeMLScoreTrackerProps> = ({
  address,
  privacyMode,
  refreshInterval = 15000 // 15 seconds
}) => {
  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdate[]>([]);
  const [currentScore, setCurrentScore] = useState<ScoreUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextRetryIn, setNextRetryIn] = useState<number | undefined>();

  const fetchScoreUpdate = async (isRetry = false) => {
    if (!address) return;

    if (isRetry) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
    } else {
      setIsLoading(true);
      setRetryCount(0);
    }
    
    setError(null);
    setNextRetryIn(undefined);

    try {
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
      
      const scoreData = await creditIntelligenceService.getRealTimeMLScoreUpdates(address);
      
      if (scoreData) {
        const newUpdate: ScoreUpdate = {
          timestamp: scoreData.lastUpdated,
          score: scoreData.score,
          confidence: scoreData.confidence,
          change: scoreData.changeFromPrevious,
          modelVersion: scoreData.mlModelVersion
        };

        setCurrentScore(newUpdate);
        setScoreUpdates(prev => {
          const updated = [newUpdate, ...prev].slice(0, 10); // Keep last 10 updates
          return updated;
        });
        setLastUpdate(Date.now());
        setRetryCount(0); // Reset on success
      } else {
        throw new Error('ML model data unavailable - no real data returned');
      }
    } catch (err: any) {
      console.error('Error fetching real-time ML score:', err);
      const errorMessage = err.message || 'Failed to fetch ML score updates';
      setError(errorMessage);
      
      // Set up auto-retry with exponential backoff
      if (retryCount < 3) {
        const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Max 30s
        setNextRetryIn(retryDelay / 1000);
        
        const timer = setInterval(() => {
          setNextRetryIn(prev => {
            if (!prev || prev <= 1) {
              clearInterval(timer);
              fetchScoreUpdate(true);
              return undefined;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleManualRetry = () => {
    setNextRetryIn(undefined);
    fetchScoreUpdate(true);
  };

  useEffect(() => {
    if (address) {
      fetchScoreUpdate();
      
      // Set up real-time updates
      const interval = setInterval(fetchScoreUpdate, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, refreshInterval]);

  if (!address) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Enter wallet address to track ML scores</p>
      </div>
    );
  }

  const formatScore = (score: number) => privacyMode ? '***' : score.toFixed(0);
  const formatConfidence = (confidence: number) => privacyMode ? '***' : `${confidence.toFixed(1)}%`;
  const formatChange = (change: number) => {
    if (privacyMode) return '***';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Real-time ML Score Tracking</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
          {error && <AlertCircle className="w-4 h-4 text-red-500" />}
          {!error && !isLoading && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
      </div>

      {/* Current Score Display */}
      {currentScore && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatScore(currentScore.score)}
              </div>
              <div className="text-sm text-gray-600">Current Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatConfidence(currentScore.confidence)}
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
            <div>
              <div className={`text-2xl font-bold flex items-center justify-center space-x-1 ${getTrendColor(currentScore.change)}`}>
                {getTrendIcon(currentScore.change)}
                <span>{formatChange(currentScore.change)}</span>
              </div>
              <div className="text-sm text-gray-600">Change</div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <div className="text-xs text-gray-500">
              Model: {privacyMode ? '***' : currentScore.modelVersion} • 
              Updated: {new Date(currentScore.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <RetryMechanism
          error={error}
          onRetry={handleManualRetry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={3}
          nextRetryIn={nextRetryIn}
        />
      )}

      {/* Score History */}
      {scoreUpdates.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recent Updates</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {scoreUpdates.map((update, index) => (
              <div
                key={`${update.timestamp}-${index}`}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-900 font-medium">
                    {formatScore(update.score)}
                  </div>
                  <div className="text-gray-600">
                    {formatConfidence(update.confidence)}
                  </div>
                  <div className={`flex items-center space-x-1 ${getTrendColor(update.change)}`}>
                    {getTrendIcon(update.change)}
                    <span className="text-xs">{formatChange(update.change)}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time ML tracking active</span>
        </div>
        <div>
          Next update: {Math.ceil((refreshInterval - (Date.now() - lastUpdate)) / 1000)}s
        </div>
      </div>
    </div>
  );
};

export default RealTimeMLScoreTracker;