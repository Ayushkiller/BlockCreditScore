import React from 'react';
import { 
  AlertTriangle, 
  Database, 
  Wifi, 
  Brain, 
  Shield, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  ExternalLink,
  Info,
  X
} from 'lucide-react';

// Base error state component
interface BaseErrorStateProps {
  title: string;
  message: string;
  icon?: React.ComponentType<any>;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  learnMoreUrl?: string;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
}

export const BaseErrorState: React.FC<BaseErrorStateProps> = ({
  title,
  message,
  icon: Icon = AlertTriangle,
  actionButton,
  learnMoreUrl,
  onDismiss,
  severity = 'error'
}) => {
  const severityStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const styles = severityStyles[severity];

  return (
    <div className={`border rounded-lg p-6 ${styles.container}`}>
      <div className="flex items-start space-x-4">
        <Icon className={`w-6 h-6 ${styles.icon} mt-1 flex-shrink-0`} />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${styles.title} mb-2`}>
                {title}
              </h3>
              <p className={`text-sm ${styles.message} mb-4`}>
                {message}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`px-4 py-2 text-sm font-medium rounded-md ${styles.button}`}
              >
                {actionButton.label}
              </button>
            )}
            
            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center text-sm ${styles.message} hover:underline`}
              >
                Learn more
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Specific error states for different data types
export const RealDataUnavailableError: React.FC<{
  dataType: string;
  reason?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ dataType, reason, onRetry, onDismiss }) => {
  const getDataTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ml model':
      case 'credit score':
        return Brain;
      case 'blockchain data':
      case 'transaction data':
        return Database;
      case 'real-time data':
        return Wifi;
      case 'analytics':
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  const defaultReasons: { [key: string]: string } = {
    'ml model': 'The ML model service is currently unavailable or not returning real data. This could be due to model maintenance, insufficient training data, or service connectivity issues.',
    'blockchain data': 'Unable to fetch real blockchain transaction data. This may be due to network connectivity issues, node synchronization problems, or API rate limits.',
    'real-time data': 'Real-time data feeds are currently unavailable. This could be due to WebSocket connection issues, data provider maintenance, or network connectivity problems.',
    'analytics': 'Analytics data cannot be computed without access to real underlying data sources. Please ensure all data dependencies are available.',
    'credit score': 'Credit score calculation requires real ML models and blockchain data. One or more dependencies are currently unavailable.'
  };

  const message = reason || defaultReasons[dataType.toLowerCase()] || 
    `Real ${dataType.toLowerCase()} is currently unavailable. We cannot display mock or placeholder data as this would compromise data integrity.`;

  return (
    <BaseErrorState
      title={`Real ${dataType} Unavailable`}
      message={message}
      icon={getDataTypeIcon(dataType)}
      severity="error"
      actionButton={onRetry ? {
        label: 'Retry',
        onClick: onRetry
      } : undefined}
      onDismiss={onDismiss}
    />
  );
};

export const MockDataDetectedError: React.FC<{
  dataSource: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ dataSource, onRetry, onDismiss }) => (
  <BaseErrorState
    title="Mock Data Detected"
    message={`The system detected mock or placeholder data from ${dataSource}. To maintain data integrity, we cannot display non-real data. Please ensure all data sources are configured to return real, verified data.`}
    icon={Shield}
    severity="error"
    actionButton={onRetry ? {
      label: 'Retry with Real Data',
      onClick: onRetry
    } : undefined}
    onDismiss={onDismiss}
  />
);

export const DataValidationError: React.FC<{
  validationErrors: string[];
  dataSource: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ validationErrors, dataSource, onRetry, onDismiss }) => (
  <BaseErrorState
    title="Data Validation Failed"
    message={
      <div>
        <p className="mb-2">Data from {dataSource} failed validation checks:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    }
    icon={Shield}
    severity="error"
    actionButton={onRetry ? {
      label: 'Retry Validation',
      onClick: onRetry
    } : undefined}
    onDismiss={onDismiss}
  />
);

export const ServiceUnavailableError: React.FC<{
  serviceName: string;
  statusCode?: number;
  onRetry?: () => void;
  onCheckStatus?: () => void;
  onDismiss?: () => void;
}> = ({ serviceName, statusCode, onRetry, onCheckStatus, onDismiss }) => {
  const getStatusMessage = (code?: number) => {
    switch (code) {
      case 503:
        return 'The service is temporarily unavailable due to maintenance or high load.';
      case 502:
        return 'The service gateway is experiencing issues connecting to the backend.';
      case 504:
        return 'The service request timed out. The service may be overloaded.';
      case 429:
        return 'Too many requests have been made to the service. Please wait before retrying.';
      default:
        return 'The service is currently experiencing technical difficulties.';
    }
  };

  return (
    <BaseErrorState
      title={`${serviceName} Service Unavailable`}
      message={`${getStatusMessage(statusCode)} Real data cannot be displayed until the service is restored.`}
      icon={Wifi}
      severity="error"
      actionButton={onRetry ? {
        label: 'Retry Connection',
        onClick: onRetry
      } : undefined}
      onDismiss={onDismiss}
    />
  );
};

export const InsufficientDataError: React.FC<{
  dataType: string;
  minimumRequired: number;
  currentAmount: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ dataType, minimumRequired, currentAmount, onRetry, onDismiss }) => (
  <BaseErrorState
    title="Insufficient Real Data"
    message={`${dataType} requires at least ${minimumRequired} data points for accurate analysis, but only ${currentAmount} are available. We cannot provide reliable results with insufficient data.`}
    icon={Database}
    severity="warning"
    actionButton={onRetry ? {
      label: 'Check for More Data',
      onClick: onRetry
    } : undefined}
    onDismiss={onDismiss}
  />
);

export const MLModelUnavailableError: React.FC<{
  modelName: string;
  reason?: 'training' | 'maintenance' | 'error' | 'insufficient_data';
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ modelName, reason = 'error', onRetry, onDismiss }) => {
  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'training':
        return 'The model is currently being retrained with new data and is temporarily unavailable.';
      case 'maintenance':
        return 'The model is undergoing scheduled maintenance to improve accuracy and performance.';
      case 'insufficient_data':
        return 'The model requires more training data before it can provide reliable predictions.';
      default:
        return 'The model is experiencing technical issues and cannot provide predictions at this time.';
    }
  };

  return (
    <BaseErrorState
      title={`${modelName} ML Model Unavailable`}
      message={`${getReasonMessage(reason)} Credit scores and predictions cannot be calculated without access to real ML models.`}
      icon={Brain}
      severity="error"
      actionButton={onRetry ? {
        label: 'Check Model Status',
        onClick: onRetry
      } : undefined}
      onDismiss={onDismiss}
    />
  );
};

export const BlockchainSyncError: React.FC<{
  currentBlock: number;
  latestBlock: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ currentBlock, latestBlock, onRetry, onDismiss }) => {
  const blocksBehind = latestBlock - currentBlock;
  
  return (
    <BaseErrorState
      title="Blockchain Data Out of Sync"
      message={`The blockchain data is ${blocksBehind} blocks behind the latest block (${currentBlock}/${latestBlock}). Real-time analysis requires up-to-date blockchain data.`}
      icon={Activity}
      severity="warning"
      actionButton={onRetry ? {
        label: 'Force Sync',
        onClick: onRetry
      } : undefined}
      onDismiss={onDismiss}
    />
  );
};

// Comprehensive error boundary for real data components
interface RealDataErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}

interface RealDataErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RealDataErrorBoundary extends React.Component<
  RealDataErrorBoundaryProps,
  RealDataErrorBoundaryState
> {
  constructor(props: RealDataErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RealDataErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Real data component error:', error, errorInfo);
    this.props.onError?.(error);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <BaseErrorState
          title="Component Error"
          message={`An error occurred while loading real data: ${this.state.error?.message || 'Unknown error'}`}
          icon={AlertTriangle}
          severity="error"
          actionButton={{
            label: 'Retry',
            onClick: this.retry
          }}
        />
      );
    }

    return this.props.children;
  }
}

// No data available state (when no error, but no data exists)
export const NoRealDataAvailable: React.FC<{
  dataType: string;
  reason?: string;
  onRefresh?: () => void;
  onDismiss?: () => void;
}> = ({ dataType, reason, onRefresh, onDismiss }) => (
  <BaseErrorState
    title={`No Real ${dataType} Available`}
    message={reason || `No real ${dataType.toLowerCase()} is currently available for this address. This may be because the address has no on-chain activity or the data hasn't been indexed yet.`}
    icon={Info}
    severity="info"
    actionButton={onRefresh ? {
      label: 'Refresh',
      onClick: onRefresh
    } : undefined}
    onDismiss={onDismiss}
  />
);