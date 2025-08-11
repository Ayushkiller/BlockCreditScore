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
    cohortSize: number;
  };
  recommendations: {
    priority: "high" | "medium" | "low";
    category: string;
    action: string;
    impact: number;
  }[];
}

// Error Display Component
const ErrorDisplay: React.FC<{
  title: string;
  message: string;
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => (
  <div className="text-center py-8">
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4 inline mr-2" />
        Retry
      </button>
    )}
  </div>
);

// Alert Component
const Alert: React.FC<{
  type: "warning" | "error" | "info" | "success";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ type, title, description, action }) => {
  const colors = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  const icons = {
    warning: AlertCircle,
    error: AlertCircle,
    info: CheckCircle,
    success: CheckCircle,
  };

  const Icon = icons[type];

  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <div className="flex items-start">
        <Icon className="w-5 h-5 mt-0.5 mr-3" />
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-1">{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Real-time Credit Score Chart Component
const RealTimeCreditScoreChart: React.FC<{ address: string | null }> = ({ address }) => {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <p className="text-gray-500">Real-time credit score chart for {address || "No address"}</p>
    </div>
  );
};

// Real-time Lending Protocols Analysis Component
const RealTimeLendingProtocolsAnalysis: React.FC<{
  address: string | null;
  protocols: string[];
}> = ({ address, protocols }) => {
  return (
    <div className="space-y-3">
      {protocols.map((protocol) => (
        <div key={protocol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium capitalize">{protocol}</span>
          <span className="text-sm text-gray-500">Analyzing...</span>
        </div>
      ))}
    </div>
  );
};

// Main Component
const UnifiedCreditDashboard: React.FC<UnifiedDashboardProps> = ({
  connectedAddress,
  timeframe,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<any>({});
  const [errorStates, setErrorStates] = useState<any>({});
  const [retryTimers, setRetryTimers] = useState<any>({});

  // Use address to analyze (fallback to connected address)
  const addressToAnalyze = connectedAddress;

  // Mock data loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setDashboardData({
        creditScore: 750,
        creditRating: "Good",
        riskScore: 0.25,
        riskLevel: "Low",
        totalValue: 50000,
        activityScore: 85,
        txCount: 150,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [connectedAddress]);

  const handleRetry = (dataType: string) => {
    console.log(`Retrying data type: ${dataType}`);
  };

  // Tab Navigation
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "behavior", label: "Behavior", icon: Brain },
    { id: "protocols", label: "Protocols", icon: Network },
  ];

  const renderActiveTab = () => {
    const tabProps = {
      dashboardData,
      connectedAddress,
      addressToAnalyze,
      timeframe,
      loading: isLoading,
      loadingStates,
      errorStates,
      retryTimers,
      onRetry: handleRetry,
    };

    switch (activeTab) {
      case "overview":
        return <OverviewTab {...tabProps} />;
      case "analytics":
        return <AnalyticsTab {...tabProps} />;
      case "behavior":
        return <BehaviorAnalysisComponent address={addressToAnalyze} timeframe={timeframe} />;
      case "protocols":
        return <ProtocolsTab {...tabProps} />;
      default:
        return <OverviewTab {...tabProps} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Credit Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time blockchain credit scoring powered by ML
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {connectedAddress ? (
              <span>
                Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
            ) : (
              <span>Not connected</span>
            )}
          </div>
          <ConnectionStatus 
            status={connectedAddress ? 'connected' : 'disconnected'} 
            service="Wallet" 
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        <RealDataErrorBoundary>
          {renderActiveTab()}
        </RealDataErrorBoundary>
      </div>
    </div>
  );
};

export default UnifiedCreditDashboard;
