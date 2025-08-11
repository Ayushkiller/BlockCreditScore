import React, { useState, useEffect } from 'react';
import {
  Brain,
  Shield,
  Activity,
  Network,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  CreditScoreLoading,
  SkeletonCard,
  SkeletonChart,
  RetryMechanism
} from './LoadingStates';
import {
  RealDataUnavailableError,
  MockDataDetectedError,
  MLModelUnavailableError
} from './ErrorStates';
import MLModelScoreDisplay from './MLModelScoreDisplay';
import RealTimeMLScoreTracker from './RealTimeMLScoreTracker';
import RealTimeEventMonitor from './RealTimeEventMonitor';
import WebSocketConnectionStatus from './WebSocketConnectionStatus';
import BlockchainVerificationStatus from './BlockchainVerificationStatus';
import DataIntegrityVerificationPanel from './DataIntegrityVerificationPanel';

interface OverviewTabProps {
  dashboardData: any;
  connectedAddress: string | null;
  addressToAnalyze: string | null;
  loading: boolean;
  loadingStates: any;
  errorStates: any;
  retryTimers: any;
  onRetry: (dataType: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  dashboardData,
  connectedAddress,
  addressToAnalyze,
  loading,
  loadingStates,
  errorStates,
  retryTimers,
  onRetry
}) => {
  if (loading && !dashboardData.creditScore) {
    return (
      <div className="space-y-6">
        <CreditScoreLoading />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonChart />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Credit Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          {loadingStates.creditProfile ? (
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : errorStates.creditProfile ? (
            errorStates.creditProfile.errorType === 'RealDataUnavailableError' ? (
              <RealDataUnavailableError
                dataType="Credit Score"
                reason={errorStates.creditProfile.error}
                onRetry={errorStates.creditProfile.canRetry ? () => onRetry('creditProfile') : undefined}
              />
            ) : errorStates.creditProfile.errorType === 'MockDataDetectedError' ? (
              <MockDataDetectedError
                dataSource="ML Model Service"
                onRetry={errorStates.creditProfile.canRetry ? () => onRetry('creditProfile') : undefined}
              />
            ) : errorStates.creditProfile.errorType === 'MLModelUnavailableError' ? (
              <MLModelUnavailableError
                modelName="Credit Scoring Model"
                onRetry={errorStates.creditProfile.canRetry ? () => onRetry('creditProfile') : undefined}
              />
            ) : (
              <RetryMechanism
                error={errorStates.creditProfile.error}
                onRetry={() => onRetry('creditProfile')}
                isRetrying={loadingStates.creditProfile}
                retryCount={errorStates.creditProfile.retryCount}
                nextRetryIn={retryTimers.creditProfile}
              />
            )
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Credit Score
                  </h3>
                  {dashboardData.usingRealMLModels && (
                    <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      <Brain className="w-3 h-3" />
                      <span>Real ML Model</span>
                    </div>
                  )}
                  {!dashboardData.usingRealMLModels && (
                    <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      Fallback Data
                    </div>
                  )}
                </div>
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData.creditScore?.score || "N/A"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ML Confidence: {`${(dashboardData.creditScore?.confidence * 100 || 0).toFixed(1)}%`}
              </div>
              {dashboardData.creditScore?.predictions && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs text-gray-400">
                    Risk 30d: {`${dashboardData.creditScore.predictions.risk30d}%`}
                  </div>
                  {dashboardData.usingRealMLModels && (
                    <div className="text-xs text-blue-600">
                      Real-time ML predictions active
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loadingStates.behaviorProfile ? (
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : errorStates.behaviorProfile ? (
            errorStates.behaviorProfile.isRealDataError ? (
              <RealDataUnavailableError
                dataType="Behavior Profile"
                reason={errorStates.behaviorProfile.error}
                onRetry={errorStates.behaviorProfile.canRetry ? () => onRetry('behaviorProfile') : undefined}
              />
            ) : (
              <RetryMechanism
                error={errorStates.behaviorProfile.error}
                onRetry={() => onRetry('behaviorProfile')}
                isRetrying={loadingStates.behaviorProfile}
                retryCount={errorStates.behaviorProfile.retryCount}
                nextRetryIn={retryTimers.behaviorProfile}
              />
            )
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Risk Level</h3>
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData.behaviorProfile?.overallRiskScore
                  ? dashboardData.behaviorProfile.overallRiskScore > 0.7
                    ? "High"
                    : dashboardData.behaviorProfile.overallRiskScore > 0.4
                      ? "Medium"
                      : "Low"
                  : "N/A"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Based on behavior analysis
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loadingStates.transactionAnalytics ? (
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : errorStates.transactionAnalytics ? (
            errorStates.transactionAnalytics.isRealDataError ? (
              <RealDataUnavailableError
                dataType="Transaction Data"
                reason={errorStates.transactionAnalytics.error}
                onRetry={errorStates.transactionAnalytics.canRetry ? () => onRetry('transactionAnalytics') : undefined}
              />
            ) : (
              <RetryMechanism
                error={errorStates.transactionAnalytics.error}
                onRetry={() => onRetry('transactionAnalytics')}
                isRetrying={loadingStates.transactionAnalytics}
                retryCount={errorStates.transactionAnalytics.retryCount}
                nextRetryIn={retryTimers.transactionAnalytics}
              />
            )
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transactions
                </h3>
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData.transactionAnalytics?.realTransactionMetrics
                    ?.totalTransactions || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Total on-chain activity
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loadingStates.transactionAnalytics ? (
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : errorStates.transactionAnalytics ? (
            <RetryMechanism
              error={errorStates.transactionAnalytics.error}
              onRetry={() => onRetry('transactionAnalytics')}
              isRetrying={loadingStates.transactionAnalytics}
              retryCount={errorStates.transactionAnalytics.retryCount}
              nextRetryIn={retryTimers.transactionAnalytics}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Protocols</h3>
                <Network className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {dashboardData.transactionAnalytics?.realProtocolInteractions
                    ?.uniqueProtocols || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">DeFi protocols used</div>
            </>
          )}
        </div>
      </div>

      {/* ML Model Score Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ML Model Credit Analysis
        </h3>
        <MLModelScoreDisplay 
          address={connectedAddress} 
          refreshInterval={30000}
        />
      </div>

      {/* Real-time Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Real-time ML Score Tracking
          </h3>
          <RealTimeMLScoreTracker 
            address={addressToAnalyze}
            refreshInterval={15000}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Live Event Monitor
          </h3>
          <RealTimeEventMonitor />
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <WebSocketConnectionStatus />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <BlockchainVerificationStatus
            address={connectedAddress}
            onVerificationChange={(status) =>
              console.log("Verification status:", status)
            }
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <DataIntegrityVerificationPanel address={connectedAddress} />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
