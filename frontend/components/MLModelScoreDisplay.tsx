import React, { useState, useEffect } from 'react';
import { Brain, Shield, TrendingUp, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { LoadingIndicator, MLModelLoading, RetryMechanism } from './LoadingStates';
import { RealDataUnavailableError, MLModelUnavailableError, MockDataDetectedError } from './ErrorStates';

interface MLModelScoreDisplayProps {
  address: string | null;
  privacyMode: boolean;
  refreshInterval?: number;
}

interface MLScoreData {
  score: number;
  confidence: number;
  lastUpdated: number;
  changeFromPrevious: number;
  mlModelVersion: string;
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidence: number;
  };
  modelMetadata?: {
    modelId: string;
    version: string;
    accuracy: number;
    lastTrained: number;
    trainingDataSize: number;
  };
}

const MLModelScoreDisplay: React.FC<MLModelScoreDisplayProps> = ({
  address,
  privacyMode,
  refreshInterval = 30000
}) => {
  const [mlScoreData, setMLScoreData] = useState<MLScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);

  const loadMLScoreData = async (isRetry = false) => {
    if (!address) return;

    if (isRetry) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
    } else {
      setIsLoading(true);
      setRetryCount(0);
    }
    
    setError(null);

    try {
      const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
      
      // Get real-time ML score updates
      const scoreUpdate = await creditIntelligenceService.getRealTimeMLScoreUpdates(address);
      
      // Get confidence intervals and model metadata
      const confidenceData = await creditIntelligenceService.getMLScoreConfidenceIntervals(address);

      if (scoreUpdate) {
        setMLScoreData({
          ...scoreUpdate,
          confidenceInterval: confidenceData?.confidenceInterval,
          modelMetadata: confidenceData?.modelMetadata
        });
        setLastRefresh(Date.now());
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error('ML model data unavailable - no real data returned');
      }
    } catch (err: any) {
      console.error('Error loading ML score data:', err);
      setError(err.message || 'Failed to load ML model data');
      setErrorType(err.name || 'UnknownError');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    loadMLScoreData(true);
  };

  useEffect(() => {
    loadMLScoreData();

    // Set up refresh interval
    const interval = setInterval(loadMLScoreData, refreshInterval);
    return () => clearInterval(interval);
  }, [address, refreshInterval]);

  if (!address) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Enter wallet address to view ML model scores</p>
      </div>
    );
  }

  if (isLoading && !mlScoreData) {
    return <MLModelLoading />;
  }

  if (error && !mlScoreData) {
    if (errorType === 'RealDataUnavailableError') {
      return (
        <RealDataUnavailableError
          dataType="ML Model"
          reason={error}
          onRetry={retryCount < 3 ? handleRetry : undefined}
        />
      );
    } else if (errorType === 'MockDataDetectedError') {
      return (
        <MockDataDetectedError
          dataSource="ML Model Service"
          onRetry={retryCount < 3 ? handleRetry : undefined}
        />
      );
    } else if (errorType === 'MLModelUnavailableError') {
      return (
        <MLModelUnavailableError
          modelName="Credit Scoring Model"
          onRetry={retryCount < 3 ? handleRetry : undefined}
        />
      );
    } else {
      return (
        <RetryMechanism
          error={error}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={3}
        />
      );
    }
  }

  if (!mlScoreData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No ML model data available</p>
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

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">ML Credit Score</h3>
              <p className="text-sm text-gray-600">Real-time ML model prediction</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Real Model
            </div>
            {isLoading && (
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Updating...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {formatScore(mlScoreData.score)}
            </div>
            <div className="text-sm text-gray-600">Credit Score</div>
            {mlScoreData.changeFromPrevious !== 0 && (
              <div className={`text-xs mt-1 ${
                mlScoreData.changeFromPrevious > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(mlScoreData.changeFromPrevious)} from last update
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {formatConfidence(mlScoreData.confidence)}
            </div>
            <div className="text-sm text-gray-600">Model Confidence</div>
            {mlScoreData.confidence >= 80 && (
              <div className="text-xs text-green-600 mt-1">High Confidence</div>
            )}
            {mlScoreData.confidence < 70 && (
              <div className="text-xs text-yellow-600 mt-1">Low Confidence</div>
            )}
          </div>

          {/* Model Version */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700 mb-1">
              {privacyMode ? '***' : mlScoreData.mlModelVersion}
            </div>
            <div className="text-sm text-gray-600">Model Version</div>
            <div className="text-xs text-gray-500 mt-1">
              Updated {new Date(mlScoreData.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Interval */}
      {mlScoreData.confidenceInterval && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Confidence Interval</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-700">
                {formatScore(mlScoreData.confidenceInterval.lower)}
              </div>
              <div className="text-xs text-gray-500">Lower Bound</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {formatConfidence(mlScoreData.confidenceInterval.confidence)}
              </div>
              <div className="text-xs text-gray-500">Confidence Level</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-700">
                {formatScore(mlScoreData.confidenceInterval.upper)}
              </div>
              <div className="text-xs text-gray-500">Upper Bound</div>
            </div>
          </div>

          {/* Confidence Interval Visualization */}
          <div className="mt-4">
            <div className="relative h-2 bg-gray-200 rounded-full">
              <div 
                className="absolute h-2 bg-blue-500 rounded-full"
                style={{
                  left: `${(mlScoreData.confidenceInterval.lower / 1000) * 100}%`,
                  width: `${((mlScoreData.confidenceInterval.upper - mlScoreData.confidenceInterval.lower) / 1000) * 100}%`
                }}
              />
              <div 
                className="absolute w-1 h-4 bg-gray-900 rounded-full -top-1"
                style={{
                  left: `${(mlScoreData.score / 1000) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>500</span>
              <span>1000</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Metadata */}
      {mlScoreData.modelMetadata && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Model Information</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Model ID</div>
              <div className="text-xs text-gray-600 mt-1">
                {privacyMode ? '***' : mlScoreData.modelMetadata.modelId}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Accuracy</div>
              <div className="text-xs text-gray-600 mt-1">
                {privacyMode ? '***' : `${(mlScoreData.modelMetadata.accuracy * 100).toFixed(1)}%`}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Training Data</div>
              <div className="text-xs text-gray-600 mt-1">
                {privacyMode ? '***' : `${mlScoreData.modelMetadata.trainingDataSize.toLocaleString()} samples`}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Last Trained</div>
              <div className="text-xs text-gray-600 mt-1">
                {privacyMode ? '***' : new Date(mlScoreData.modelMetadata.lastTrained).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Real ML model active</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default MLModelScoreDisplay;