import React from 'react';
import { RefreshCw, AlertCircle, Wifi, Database, Brain, TrendingUp, Activity } from 'lucide-react';

// Skeleton components for consistent loading states
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-6 w-6 bg-gray-200 rounded"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      <div className="flex items-end space-x-2 h-32">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t"
            style={{
              height: `${Math.random() * 80 + 20}%`,
              width: '12%'
            }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced loading indicator with progress and context
interface LoadingIndicatorProps {
  message?: string;
  progress?: number;
  subMessage?: string;
  icon?: React.ComponentType<any>;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  progress,
  subMessage,
  icon: Icon = RefreshCw,
  size = 'md',
  showProgress = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Icon className={`${sizeClasses[size]} animate-spin text-blue-500 mb-3`} />
      <div className={`${textSizeClasses[size]} font-medium text-gray-900 mb-1`}>
        {message}
      </div>
      {subMessage && (
        <div className="text-sm text-gray-600 mb-3">{subMessage}</div>
      )}
      {showProgress && progress !== undefined && (
        <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}
      {showProgress && progress !== undefined && (
        <div className="text-xs text-gray-500">{Math.round(progress)}% complete</div>
      )}
    </div>
  );
};

// Data-specific loading states
export const CreditScoreLoading: React.FC = () => (
  <LoadingIndicator
    message="Calculating Credit Score"
    subMessage="Analyzing blockchain data with ML models..."
    icon={Brain}
    size="md"
  />
);

export const BlockchainDataLoading: React.FC = () => (
  <LoadingIndicator
    message="Fetching Blockchain Data"
    subMessage="Retrieving transaction history and protocol interactions..."
    icon={Database}
    size="md"
  />
);

export const MLModelLoading: React.FC = () => (
  <LoadingIndicator
    message="Running ML Analysis"
    subMessage="Processing data through trained models..."
    icon={Brain}
    size="md"
  />
);

export const RealTimeDataLoading: React.FC = () => (
  <LoadingIndicator
    message="Connecting to Real-Time Data"
    subMessage="Establishing connection to live data feeds..."
    icon={Wifi}
    size="md"
  />
);

export const AnalyticsLoading: React.FC = () => (
  <LoadingIndicator
    message="Generating Analytics"
    subMessage="Computing trends and behavioral patterns..."
    icon={TrendingUp}
    size="md"
  />
);

// Retry mechanism component
interface RetryMechanismProps {
  onRetry: () => void;
  error: string;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  nextRetryIn?: number;
}

export const RetryMechanism: React.FC<RetryMechanismProps> = ({
  onRetry,
  error,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  nextRetryIn
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium text-red-800 mb-1">
            Failed to Load Data
          </div>
          <div className="text-sm text-red-700 mb-3">
            {error}
          </div>
          
          {retryCount < maxRetries && (
            <div className="flex items-center space-x-3">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({retryCount + 1}/{maxRetries})
                  </>
                )}
              </button>
              
              {nextRetryIn && nextRetryIn > 0 && (
                <div className="text-xs text-red-600">
                  Auto-retry in {nextRetryIn}s
                </div>
              )}
            </div>
          )}
          
          {retryCount >= maxRetries && (
            <div className="text-sm text-red-700">
              Maximum retry attempts reached. Please check your connection and try again later.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Progressive loading state for multi-step operations
interface ProgressiveLoadingProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    error?: string;
  }>;
  currentStep?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  steps,
  currentStep
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'text-blue-700';
      case 'completed':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            {getStepIcon(step.status)}
            <div className="flex-1">
              <div className={`text-sm font-medium ${getStepColor(step.status)}`}>
                {step.label}
              </div>
              {step.status === 'error' && step.error && (
                <div className="text-xs text-red-600 mt-1">{step.error}</div>
              )}
            </div>
            {step.id === currentStep && step.status === 'loading' && (
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                In Progress
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Connection status indicator
interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  service: string;
  lastUpdate?: number;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  service,
  lastUpdate,
  onReconnect
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'disconnected':
        return <Activity className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="font-medium">{service}</span>
      <span className="capitalize">{status}</span>
      {lastUpdate && status === 'connected' && (
        <span className="text-xs opacity-75">
          • {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      )}
      {(status === 'disconnected' || status === 'error') && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs underline hover:no-underline ml-2"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};