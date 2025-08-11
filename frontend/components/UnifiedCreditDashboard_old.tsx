import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  Users,
  Zap,
  Award,
  RefreshCw,
  Star,
  Target,
  Brain,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Percent,
  Database,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Network,
  Wifi,
} from "lucide-react";
import {
  SkeletonCard,
  SkeletonChart,
  LoadingIndicator,
  CreditScoreLoading,
  BlockchainDataLoading,
  MLModelLoading,
  AnalyticsLoading,
  RetryMechanism,
  ProgressiveLoading,
  ConnectionStatus
} from "./LoadingStates";
import {
  RealDataUnavailableError,
  MockDataDetectedError,
  DataValidationError,
  ServiceUnavailableError,
  InsufficientDataError,
  MLModelUnavailableError,
  NoRealDataAvailable,
  RealDataErrorBoundary
} from "./ErrorStates";
import { useCreditIntelligence } from "../contexts/CreditIntelligenceContext";
import RealTimePriceDisplay from "./RealTimePriceDisplay";
import USDValueDisplay from "./USDValueDisplay";
import RealTimeEventMonitor from "./RealTimeEventMonitor";
import RealTimeScoreTracker from "./RealTimeScoreTracker";
import BlockchainVerificationStatus from "./BlockchainVerificationStatus";
import DataIntegrityVerificationPanel from "./DataIntegrityVerificationPanel";
import WebSocketConnectionStatus from "./WebSocketConnectionStatus";
import RealMarketDataChart from "./RealMarketDataChart";
import MarketSentimentDisplay from "./MarketSentimentDisplay";
import ProtocolTVLDisplay from "./ProtocolTVLDisplay";
import RealTimePriceFeedAnalytics from "./RealTimePriceFeedAnalytics";
import EventMonitoringAnalytics from "./EventMonitoringAnalytics";
import RealTimeVolatilityMonitor from "./RealTimeVolatilityMonitor";
import PriceFeedSourceStatus from "./PriceFeedSourceStatus";
import APIHealthMonitor from "./APIHealthMonitor";
import MLModelScoreDisplay from "./MLModelScoreDisplay";
import RealTimeMLScoreTracker from "./RealTimeMLScoreTracker";
import BehaviorAnalysisComponent from "./BehaviorAnalysisComponent";
import OverviewTab from "./OverviewTab";
import AnalyticsTab from "./AnalyticsTab";
import ProtocolsTab from "./ProtocolsTab";

interface UnifiedDashboardProps {
  connectedAddress: string | null;
  timeframe: string;
}

interface CreditDimension {
  name: string;
  score: number;
  confidence: number;
  trend: "improving" | "stable" | "declining";
  dataPoints: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface AnalyticsData {
  scoreHistory: { date: string; score: number; dimension: string }[];
  peerComparison: {
    percentile: number;
    averageScore: number;
    userScore: number;
  };
  behaviorTrends: { category: string; trend: number; change: string }[];
  timeframeData: { [key: string]: any };
}

const UnifiedCreditDashboard: React.FC<UnifiedDashboardProps> = ({
  connectedAddress,
  timeframe,
}) => {
  // Remove refreshData from destructuring
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "behavior" | "protocols"
  >("overview");
  const [refreshing, setRefreshing] = useState(false);

  // State for wallet address input
  const [walletAddress, setWalletAddress] = useState(connectedAddress || "");
  const [addressToAnalyze, setAddressToAnalyze] = useState<string | null>(
    connectedAddress
  );

  // Enhanced loading and error state management
  const [loadingStates, setLoadingStates] = useState<{
    creditScore: boolean;
    behaviorProfile: boolean;
    transactionAnalytics: boolean;
    protocolStats: boolean;
    stakingBehavior: boolean;
    liquidationRisk: boolean;
    analyticsData: boolean;
    mlModelPerformance: boolean;
  }>({
    creditScore: false,
    behaviorProfile: false,
    transactionAnalytics: false,
    protocolStats: false,
    stakingBehavior: false,
    liquidationRisk: false,
    analyticsData: false,
    mlModelPerformance: false,
  });

  const [errorStates, setErrorStates] = useState<{
    [key: string]: { error: string; retryCount: number; canRetry: boolean };
  }>({});

  const [retryTimers, setRetryTimers] = useState<{ [key: string]: number }>({});

  // Unified state for all dashboard data
  const [dashboardData, setDashboardData] = useState<{
    creditScore: any;
    behaviorProfile: any;
    transactionAnalytics: any;
    protocolStats: any;
    stakingBehavior: any;
    liquidationRisk: any;
    analyticsData: AnalyticsData | null;
    mlModelPerformance: any;
    usingRealMLModels: boolean;
  }>({
    creditScore: null,
    behaviorProfile: null,
    transactionAnalytics: null,
    protocolStats: null,
    stakingBehavior: null,
    liquidationRisk: null,
    analyticsData: null,
    mlModelPerformance: null,
    usingRealMLModels: false,
  });

  // Enhanced data loading function with granular loading states and retry logic
  const loadDashboardData = async (retryDataType?: string) => {
    if (!addressToAnalyze) return;

    setRefreshing(true);
    
    // Reset error states if this is a full reload
    if (!retryDataType) {
      setErrorStates({});
    }

    try {
      const { creditIntelligenceService } = await import(
        "../services/creditIntelligenceService"
      );

      // Define data loading steps for progressive loading
      const loadingSteps = [
        { id: 'creditProfile', label: 'Loading ML-enhanced credit profile', loader: () => creditIntelligenceService.getCreditProfileWithRealML(addressToAnalyze) },
        { id: 'behaviorProfile', label: 'Analyzing user behavior patterns', loader: () => creditIntelligenceService.getUserBehaviorProfile?.(addressToAnalyze) },
        { id: 'transactionAnalytics', label: 'Fetching blockchain transaction data', loader: () => creditIntelligenceService.getBlockchainMetrics?.(addressToAnalyze, timeframe) },
        { id: 'protocolStats', label: 'Loading protocol statistics', loader: () => creditIntelligenceService.getProtocolStatistics?.() },
        { id: 'stakingBehavior', label: 'Analyzing staking behavior', loader: () => creditIntelligenceService.getStakingBehaviorAnalysis?.(addressToAnalyze) },
        { id: 'liquidationRisk', label: 'Calculating liquidation risk', loader: () => creditIntelligenceService.getLiquidationRiskIndicators?.(addressToAnalyze) },
        { id: 'mlModelPerformance', label: 'Validating ML model performance', loader: () => creditIntelligenceService.getMLModelPerformance().catch(() => null) },
      ];

      // Filter steps if retrying specific data type
      const stepsToLoad = retryDataType 
        ? loadingSteps.filter(step => step.id === retryDataType)
        : loadingSteps;

      const results: any = {};
      
      // Load data with individual loading states
      for (const step of stepsToLoad) {
        try {
          // Set loading state for this specific data type
          setLoadingStates(prev => ({ ...prev, [step.id]: true }));
          
          // Clear any previous error for this data type
          setErrorStates(prev => {
            const newState = { ...prev };
            delete newState[step.id];
            return newState;
          });

          const result = await step.loader();
          results[step.id] = result;

          // Clear loading state
          setLoadingStates(prev => ({ ...prev, [step.id]: false }));
          
        } catch (error: any) {
          console.error(`Failed to load ${step.id}:`, error);
          
          // Set error state with detailed error information
          const errorInfo = {
            error: error.message || `Failed to load ${step.label.toLowerCase()}`,
            retryCount: (errorStates[step.id]?.retryCount || 0) + 1,
            canRetry: (errorStates[step.id]?.retryCount || 0) < 3,
            errorType: error.name || 'UnknownError',
            isRealDataError: error.name === 'RealDataUnavailableError' || 
                           error.name === 'MockDataDetectedError' ||
                           error.name === 'RealDataValidationError'
          };

          setErrorStates(prev => ({
            ...prev,
            [step.id]: errorInfo
          }));
          
          // Clear loading state
          setLoadingStates(prev => ({ ...prev, [step.id]: false }));
        }
      }

      // Update dashboard data with successfully loaded results
      if (!retryDataType) {
        // Full reload - set all data
        const creditScore = results.creditProfile
          ? {
              score: results.creditProfile.overallScore,
              confidence: results.creditProfile.predictions?.confidence || 0,
              tier: results.creditProfile.tier,
              predictions: results.creditProfile.predictions,
            }
          : null;

        setDashboardData({
          creditScore,
          behaviorProfile: results.behaviorProfile,
          transactionAnalytics: results.transactionAnalytics,
          protocolStats: results.protocolStats,
          stakingBehavior: results.stakingBehavior,
          liquidationRisk: results.liquidationRisk,
          analyticsData: {
            scoreHistory: results.scoreHistory || [],
            peerComparison: results.peerComparison || {
              percentile: 0,
              averageScore: 0,
              userScore: 0,
            },
            behaviorTrends: results.behaviorTrends || [],
            timeframeData: {},
          },
          mlModelPerformance: results.mlModelPerformance,
          usingRealMLModels: !!results.creditProfile && !!results.mlModelPerformance,
        });
      } else {
        // Partial reload - update specific data
        setDashboardData(prev => {
          const updated = { ...prev };
          
          if (retryDataType === 'creditProfile' && results.creditProfile) {
            updated.creditScore = {
              score: results.creditProfile.overallScore,
              confidence: results.creditProfile.predictions?.confidence || 0,
              tier: results.creditProfile.tier,
              predictions: results.creditProfile.predictions,
            };
          } else if (results[retryDataType]) {
            (updated as any)[retryDataType] = results[retryDataType];
          }
          
          return updated;
        });
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Retry mechanism for specific data types
  const retryDataLoad = async (dataType: string) => {
    const currentError = errorStates[dataType];
    if (!currentError?.canRetry) return;

    // Start auto-retry timer
    const retryDelay = Math.min(5000 * Math.pow(2, currentError.retryCount), 30000); // Exponential backoff, max 30s
    setRetryTimers(prev => ({ ...prev, [dataType]: retryDelay / 1000 }));
    
    const timer = setInterval(() => {
      setRetryTimers(prev => {
        const newTime = (prev[dataType] || 0) - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          loadDashboardData(dataType);
          const newTimers = { ...prev };
          delete newTimers[dataType];
          return newTimers;
        }
        return { ...prev, [dataType]: newTime };
      });
    }, 1000);

    // Also allow immediate retry
    setTimeout(() => {
      if (retryTimers[dataType] > 0) {
        clearInterval(timer);
        setRetryTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[dataType];
          return newTimers;
        });
        loadDashboardData(dataType);
      }
    }, 100);
  };

  useEffect(() => {
    loadDashboardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [addressToAnalyze, timeframe]);

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      setAddressToAnalyze(walletAddress.trim());
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Unified Credit Dashboard
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Real-time blockchain credit analytics</span>
                {dashboardData.usingRealMLModels && (
                  <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                    <Brain className="w-3 h-3" />
                    <span>Real ML Models</span>
                  </div>
                )}
                {!dashboardData.usingRealMLModels && addressToAnalyze && (
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>ML Models Unavailable</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Address Input */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form
            onSubmit={handleAddressSubmit}
            className="flex items-center space-x-4"
          >
            <label
              htmlFor="wallet-address"
              className="text-sm font-medium text-gray-700"
            >
              Analyze Wallet:
            </label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={handleAddressChange}
              placeholder="Enter wallet address (0x...)"
              className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Analyze
            </button>
            {addressToAnalyze && (
              <div className="text-sm text-gray-500">
                Analyzing: {addressToAnalyze.slice(0, 6)}...
                {addressToAnalyze.slice(-4)}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
              { id: "behavior", label: "Behavior", icon: Brain },
              { id: "protocols", label: "Protocols", icon: Network },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!addressToAnalyze ? (
          <div className="text-center py-12">
            <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Enter Wallet Address
            </h2>
            <p className="text-gray-600">
              Enter any wallet address above to analyze its credit profile and
              behavior
            </p>
          </div>
        ) : (
          <RealDataErrorBoundary
            onError={(error) => {
              console.error('Dashboard component error:', error);
              // Could send to error tracking service here
            }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                dashboardData={dashboardData}
                connectedAddress={addressToAnalyze}
                addressToAnalyze={addressToAnalyze}
                loading={refreshing}
                loadingStates={loadingStates}
                errorStates={errorStates}
                retryTimers={retryTimers}
                onRetry={retryDataLoad}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab
                dashboardData={dashboardData}
                connectedAddress={addressToAnalyze}
                timeframe={timeframe}
                loading={refreshing}
                loadingStates={loadingStates}
                errorStates={errorStates}
                retryTimers={retryTimers}
                onRetry={retryDataLoad}
              />
            )}

            {activeTab === "behavior" && (
              <BehaviorAnalysisComponent
                address={addressToAnalyze}
                timeframe={timeframe}
              />
            )}

            {activeTab === "protocols" && (
              <ProtocolsTab
                dashboardData={dashboardData}
                connectedAddress={addressToAnalyze}
                timeframe={timeframe}
                loading={refreshing}
              />
            )}
          </RealDataErrorBoundary>
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  dashboardData: any;
  privacyMode: boolean;
  connectedAddress: string | null;
  addressToAnalyze: string | null; // <-- add prop
  isLoading: boolean;
  loadingStates: any;
  errorStates: any;
  retryTimers: any;
  onRetry: (dataType: string) => void;
}> = ({ dashboardData, privacyMode, connectedAddress, addressToAnalyze, isLoading, loadingStates, errorStates, retryTimers, onRetry }) => {
  if (isLoading && !dashboardData.creditScore) {
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
                {privacyMode ? "***" : dashboardData.creditScore?.score || "N/A"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ML Confidence:{" "}
                {privacyMode
                  ? "***"
                  : `${(dashboardData.creditScore?.confidence * 100 || 0).toFixed(1)}%`}
              </div>
              {dashboardData.creditScore?.predictions && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs text-gray-400">
                    Risk 30d:{" "}
                    {privacyMode
                      ? "***"
                      : `${dashboardData.creditScore.predictions.risk30d}%`}
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
                {privacyMode
                  ? "***"
                  : dashboardData.behaviorProfile?.overallRiskScore
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
                {privacyMode
                  ? "***"
                  : dashboardData.transactionAnalytics?.realTransactionMetrics
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
                {privacyMode
                  ? "***"
                  : dashboardData.transactionAnalytics?.realProtocolInteractions
                      ?.uniqueProtocols || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">DeFi protocols used</div>
            </>
          )}
        </div>
      </div>

      {/* ML Model Score Display - Task 6.2: Show real ML model outputs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ML Model Credit Analysis
        </h3>
        <MLModelScoreDisplay 
          address={connectedAddress} 
          privacyMode={privacyMode}
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
            address={addressToAnalyze} // <-- use addressToAnalyze
            privacyMode={privacyMode}
            refreshInterval={15000}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Live Event Monitor
          </h3>
          <RealTimeEventMonitor address={addressToAnalyze} /> {/* <-- use addressToAnalyze */}
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
}; // Analytics Tab Component
const AnalyticsTab: React.FC<{
  dashboardData: any;
  privacyMode: boolean;
  connectedAddress: string | null;
  timeframe: string;
  isLoading: boolean;
  loadingStates: any;
  errorStates: any;
  retryTimers: any;
  onRetry: (dataType: string) => void;
}> = ({
  dashboardData,
  privacyMode,
  connectedAddress,
  timeframe,
  isLoading,
  loadingStates,
  errorStates,
  retryTimers,
  onRetry,
}) => {
  if (isLoading && !dashboardData.analyticsData) {
    return (
      <div className="space-y-6">
        <AnalyticsLoading />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Score Trend</h3>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {privacyMode
              ? "***"
              : dashboardData.analyticsData?.peerComparison?.percentile
                ? `${dashboardData.analyticsData.peerComparison.percentile}th`
                : "N/A"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Percentile ranking</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Gas Efficiency
            </h3>
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {privacyMode
              ? "***"
              : dashboardData.transactionAnalytics?.gasAnalysis?.avgEfficiency
                ? `${(dashboardData.transactionAnalytics.gasAnalysis.avgEfficiency * 100).toFixed(0)}%`
                : "N/A"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Optimization score</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Data Quality
            </h3>
            <Database className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {privacyMode
              ? "***"
              : dashboardData.behaviorProfile?.dataCompleteness
                ? `${(dashboardData.behaviorProfile.dataCompleteness * 100).toFixed(0)}%`
                : "N/A"}
          </div>
          <div className="text-sm text-gray-500 mt-1">Analysis confidence</div>
        </div>
      </div>

      {/* Market Data and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Data Chart
          </h3>
          <RealMarketDataChart
            symbols={["ETH", "BTC", "USDC"]}
            timeframe={timeframe}
            showVolume={true}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Sentiment
          </h3>
          <MarketSentimentDisplay
            symbols={["ETH", "BTC", "USDC", "USDT"]}
            refreshInterval={60000}
          />
        </div>
      </div>

      {/* Price Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Price Feed Analytics
          </h3>
          <RealTimePriceFeedAnalytics
            symbols={["ETH", "BTC", "USDC", "USDT", "DAI"]}
            showDetails={true}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Volatility Monitor
          </h3>
          <RealTimeVolatilityMonitor
            symbols={["ETH", "BTC", "USDC"]}
            showAlerts={true}
            showCharts={false}
            refreshInterval={30000}
          />
        </div>
      </div>

      {/* ML Model Performance - Task 4.2: Show real ML model validation */}
      {dashboardData.mlModelPerformance && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              ML Model Performance
            </h3>
            <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              Real Models Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(
              dashboardData.mlModelPerformance.riskPredictionModels || {}
            ).map(([modelId, performance]: [string, any]) => (
              <div key={modelId} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {modelId.replace(/_/g, " ").toUpperCase()}
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    Accuracy:{" "}
                    {privacyMode
                      ? "***"
                      : `${(performance.accuracy * 100).toFixed(1)}%`}
                  </div>
                  <div>
                    Confidence:{" "}
                    {privacyMode
                      ? "***"
                      : `${(performance.precision * 100).toFixed(1)}%`}
                  </div>
                  <div>
                    Last Trained:{" "}
                    {privacyMode
                      ? "***"
                      : new Date(
                          performance.lastTrained || Date.now()
                        ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Price Feed Status
          </h3>
          <PriceFeedSourceStatus refreshInterval={15000} showDetails={true} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            API Health Monitor
          </h3>
          <APIHealthMonitor />
        </div>
      </div>
    </div>
  );
};

// Behavior Tab Component
const BehaviorTab: React.FC<{
  dashboardData: any;
  privacyMode: boolean;
  connectedAddress: string | null;
  isLoading: boolean;
}> = ({ dashboardData, privacyMode, connectedAddress, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">
          Loading behavior analysis...
        </span>
      </div>
    );
  }

  const { behaviorProfile, stakingBehavior, liquidationRisk } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Behavior Overview */}
      {behaviorProfile && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              User Behavior Analysis
            </h3>
            <div className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Based on real blockchain data
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Overall Risk Score
                </span>
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(behaviorProfile.overallRiskScore * 100).toFixed(1)}%`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Risk Level:{" "}
                {behaviorProfile.overallRiskScore > 0.7
                  ? "High"
                  : behaviorProfile.overallRiskScore > 0.4
                    ? "Medium"
                    : "Low"}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Creditworthiness
                </span>
                <Star className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {privacyMode ? "***" : behaviorProfile.creditworthiness}
              </div>
              <div className="text-xs text-gray-500 mt-1">Scale: 0-1000</div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Data Completeness
                </span>
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(behaviorProfile.dataCompleteness * 100).toFixed(1)}%`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Analysis confidence
              </div>
            </div>
          </div>

          {/* Behavior Tags */}
          {behaviorProfile.behaviorTags &&
            behaviorProfile.behaviorTags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Behavior Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {behaviorProfile.behaviorTags.map(
                    (tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Staking Behavior */}
      {stakingBehavior && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Staking Behavior Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Staked
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(parseFloat(stakingBehavior.totalStaked) / 1e18).toFixed(4)} ETH`}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Rewards Claimed
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(parseFloat(stakingBehavior.totalRewardsClaimed) / 1e18).toFixed(4)} ETH`}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Staking Score
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(stakingBehavior.stakingScore * 100).toFixed(1)}%`}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Risk Level
              </div>
              <div
                className={`text-lg font-bold ${
                  stakingBehavior.riskLevel === "low"
                    ? "text-green-600"
                    : stakingBehavior.riskLevel === "medium"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {stakingBehavior.riskLevel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liquidation Risk */}
      {liquidationRisk && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Liquidation Risk Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Liquidations
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode ? "***" : liquidationRisk.totalLiquidations}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Risk Score
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : `${(liquidationRisk.liquidationRiskScore * 100).toFixed(1)}%`}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Avg Health Factor
              </div>
              <div className="text-lg font-bold text-gray-900">
                {privacyMode
                  ? "***"
                  : liquidationRisk.averageHealthFactor?.toFixed(2) || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Protocols Tab Component
const ProtocolsTab: React.FC<{
  dashboardData: any;
  privacyMode: boolean;
  connectedAddress: string | null;
  timeframe: string;
  isLoading: boolean;
}> = ({
  dashboardData,
  privacyMode,
  connectedAddress,
  timeframe,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">
          Loading protocol data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Protocol TVL Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Protocol TVL Overview
        </h3>
        <ProtocolTVLDisplay
          protocols={["aave", "compound", "uniswap"]}
          refreshInterval={60000}
        />
      </div>

      {/* Event Monitoring */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Protocol Event Analytics
        </h3>
        <EventMonitoringAnalytics
          timeframe={timeframe}
          connectedAddress={connectedAddress}
        />
      </div>

      {/* Real-time Price Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Real-time Prices
          </h3>
          <div className="space-y-4">
            <RealTimePriceDisplay symbol="ETH" />
            <RealTimePriceDisplay symbol="BTC" />
            <RealTimePriceDisplay symbol="USDC" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            USD Values
          </h3>
          <div className="space-y-4">
            <USDValueDisplay amount="1" symbol="ETH" />
            <USDValueDisplay amount="1" symbol="BTC" />
            <USDValueDisplay amount="1000" symbol="USDC" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCreditDashboard;
