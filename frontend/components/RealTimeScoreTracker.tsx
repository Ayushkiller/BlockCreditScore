import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Shield,
  Eye,
  EyeOff,
  BarChart3,
  Timer,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ScoreUpdate {
  eventId: string;
  userAddress: string;
  eventType: string;
  protocol: string;
  transactionHash: string;
  blockNumber: number;
  confirmations: number;
  scoreImpact: {
    dimension: string;
    oldScore: number;
    newScore: number;
    confidence: number;
  }[];
  timestamp: number;
  isVerified: boolean;
  verificationData?: any;
}

interface EventVerificationStatus {
  eventId: string;
  isValid: boolean;
  confidence: number;
  verificationChecks: {
    transactionExists: boolean;
    receiptMatches: boolean;
    blockConfirmed: boolean;
    eventLogValid: boolean;
    userAddressVerified: boolean;
  };
  errors: string[];
}

interface MissedEventRecovery {
  fromBlock: number;
  toBlock: number;
  recoveredEvents: number;
  processedScoreUpdates: number;
  errors: string[];
  timestamp: number;
  status: 'in_progress' | 'completed' | 'failed';
}

interface RealTimeScoreTrackerProps {
  userAddress: string | null;
  privacyMode: boolean;
  onScoreUpdate?: (update: ScoreUpdate) => void;
}

const RealTimeScoreTracker: React.FC<RealTimeScoreTrackerProps> = ({
  userAddress,
  privacyMode,
  onScoreUpdate
}) => {
  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdate[]>([]);
  const [verificationStatuses, setVerificationStatuses] = useState<Map<string, EventVerificationStatus>>(new Map());
  const [missedEventRecovery, setMissedEventRecovery] = useState<MissedEventRecovery | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    totalEventsProcessed: 0,
    totalScoreUpdates: 0,
    totalVerifications: 0,
    averageProcessingTime: 0,
    lastProcessedBlock: 0,
    errors: 0
  });
  const [loading, setLoading] = useState(false);

  // Real-time connection to score processing service
  useEffect(() => {
    if (!userAddress) return;

    const connectToScoreProcessor = async () => {
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');
        
        // Subscribe to real-time score updates
        const unsubscribeScoreUpdates = await creditIntelligenceService.subscribeToScoreUpdates?.(
          userAddress,
          (update: ScoreUpdate) => {
            console.log('📊 Real-time score update received:', update);
            
            setScoreUpdates(prev => {
              const newUpdates = [update, ...prev].slice(0, 50); // Keep last 50 updates
              return newUpdates;
            });
            
            if (onScoreUpdate) {
              onScoreUpdate(update);
            }
          }
        );

        // Subscribe to event verification status updates
        const unsubscribeVerification = await creditIntelligenceService.subscribeToEventVerification?.(
          (verification: EventVerificationStatus) => {
            console.log('🔍 Event verification update:', verification);
            
            setVerificationStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(verification.eventId, verification);
              return newMap;
            });
          }
        );

        // Subscribe to missed event recovery updates
        const unsubscribeRecovery = await creditIntelligenceService.subscribeToMissedEventRecovery?.(
          (recovery: MissedEventRecovery) => {
            console.log('🔄 Missed event recovery update:', recovery);
            setMissedEventRecovery(recovery);
          }
        );

        // Subscribe to processing statistics
        const unsubscribeStats = await creditIntelligenceService.subscribeToProcessingStats?.(
          (stats: typeof processingStats) => {
            setProcessingStats(stats);
          }
        );

        setIsConnected(true);

        return () => {
          unsubscribeScoreUpdates?.();
          unsubscribeVerification?.();
          unsubscribeRecovery?.();
          unsubscribeStats?.();
        };

      } catch (error) {
        console.error('❌ Failed to connect to score processor:', error);
        setIsConnected(false);
      }
    };

    connectToScoreProcessor();
  }, [userAddress, onScoreUpdate]);

  // Load initial data
  useEffect(() => {
    if (!userAddress) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const { creditIntelligenceService } = await import('../services/creditIntelligenceService');

        // Load recent score updates
        const recentUpdates = await creditIntelligenceService.getRecentScoreUpdates?.(userAddress, 20);
        if (recentUpdates) {
          setScoreUpdates(recentUpdates);
        }

        // Load processing statistics
        const stats = await creditIntelligenceService.getScoreProcessingStats?.();
        if (stats) {
          setProcessingStats(stats);
        }

        // Load missed event recovery status
        const recoveries = await creditIntelligenceService.getMissedEventRecoveries?.();
        if (recoveries && recoveries.length > 0) {
          setMissedEventRecovery(recoveries[recoveries.length - 1]); // Get latest recovery
        }

      } catch (error) {
        console.error('❌ Failed to load initial score tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [userAddress]);

  const formatScoreChange = (oldScore: number, newScore: number): { change: number; isPositive: boolean } => {
    const change = newScore - oldScore;
    return {
      change: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const getEventTypeIcon = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('supply') || type.includes('deposit')) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (type.includes('withdraw') || type.includes('redeem')) return <TrendingDown className="w-4 h-4 text-orange-500" />;
    if (type.includes('swap') || type.includes('trade')) return <RefreshCw className="w-4 h-4 text-blue-500" />;
    if (type.includes('liquidation')) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (type.includes('stake')) return <Shield className="w-4 h-4 text-purple-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getVerificationStatusIcon = (eventId: string) => {
    const verification = verificationStatuses.get(eventId);
    if (!verification) return <Clock className="w-4 h-4 text-gray-400" />;
    
    if (verification.isValid && verification.confidence >= 90) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (verification.confidence >= 70) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading real-time score tracking...</span>
        </div>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter an address above to track real-time score updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status and Statistics */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Real-Time Score Tracking</h3>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last update: {processingStats.lastProcessedBlock > 0 ? `Block ${processingStats.lastProcessedBlock}` : 'Never'}
          </div>
        </div>

        {/* Processing Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Events Processed</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {privacyMode ? '***' : processingStats.totalEventsProcessed.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Score Updates</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {privacyMode ? '***' : processingStats.totalScoreUpdates.toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Verifications</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {privacyMode ? '***' : processingStats.totalVerifications.toLocaleString()}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Timer className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Avg Processing</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {privacyMode ? '***' : `${processingStats.averageProcessingTime.toFixed(0)}ms`}
            </div>
          </div>
        </div>

        {/* Missed Event Recovery Status */}
        {missedEventRecovery && (
          <div className={`p-4 rounded-lg border ${
            missedEventRecovery.status === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : missedEventRecovery.status === 'failed'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RefreshCw className={`w-5 h-5 ${
                  missedEventRecovery.status === 'in_progress' ? 'animate-spin' : ''
                } ${
                  missedEventRecovery.status === 'completed' 
                    ? 'text-green-600' 
                    : missedEventRecovery.status === 'failed'
                      ? 'text-red-600'
                      : 'text-blue-600'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">
                    Missed Event Recovery {missedEventRecovery.status === 'in_progress' ? 'In Progress' : 
                      missedEventRecovery.status === 'completed' ? 'Completed' : 'Failed'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Blocks {missedEventRecovery.fromBlock} - {missedEventRecovery.toBlock}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {privacyMode ? '***' : missedEventRecovery.recoveredEvents} events recovered
                </div>
                <div className="text-sm text-gray-600">
                  {privacyMode ? '***' : missedEventRecovery.processedScoreUpdates} score updates
                </div>
              </div>
            </div>
            {missedEventRecovery.errors.length > 0 && (
              <div className="mt-3 text-sm text-red-600">
                {missedEventRecovery.errors.length} errors occurred during recovery
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Score Updates */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Recent Score Updates</h4>
          <div className="text-sm text-gray-500">
            {scoreUpdates.length} updates
          </div>
        </div>

        {scoreUpdates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No score updates yet</p>
            <p className="text-sm mt-1">Score updates will appear here as blockchain events are processed</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {scoreUpdates.map((update) => (
              <div key={update.eventId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getEventTypeIcon(update.eventType)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {update.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">on {update.protocol}</span>
                        {getVerificationStatusIcon(update.eventId)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Block {update.blockNumber} • {update.confirmations} confirmations
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {privacyMode ? '***' : update.transactionHash.slice(0, 10)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(update.timestamp * 1000).toLocaleTimeString()}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                      update.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {update.isVerified ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Score Impact Details */}
                {update.scoreImpact.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-2">Score Impact:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {update.scoreImpact.map((impact, index) => {
                        const { change, isPositive } = formatScoreChange(impact.oldScore, impact.newScore);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600 capitalize">
                              {impact.dimension.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                isPositive ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {privacyMode ? '***' : `${isPositive ? '+' : '-'}${change.toFixed(1)}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({privacyMode ? '***' : `${impact.confidence.toFixed(0)}%`})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Verification Details */}
                {verificationStatuses.has(update.eventId) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-2">Verification Status:</div>
                    {(() => {
                      const verification = verificationStatuses.get(update.eventId)!;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Confidence Score</span>
                            <span className={`text-sm font-medium ${
                              verification.confidence >= 90 ? 'text-green-600' :
                              verification.confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {privacyMode ? '***' : `${verification.confidence.toFixed(1)}%`}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(verification.verificationChecks).map(([check, passed]) => (
                              <div key={check} className={`flex items-center space-x-1 ${
                                passed ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {passed ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                <span className="capitalize">{check.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                            ))}
                          </div>
                          {verification.errors.length > 0 && (
                            <div className="text-xs text-red-600 mt-2">
                              {verification.errors.length} verification error(s)
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeScoreTracker;