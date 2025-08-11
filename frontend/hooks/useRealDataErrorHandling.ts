import { useState, useCallback } from 'react';

export interface RealDataError {
  type: 'RealDataUnavailableError' | 'MockDataDetectedError' | 'RealDataValidationError' | 'ServiceUnavailableError' | 'UnknownError';
  message: string;
  dataType: string;
  retryCount: number;
  canRetry: boolean;
  timestamp: number;
  originalError?: any;
}

export interface UseRealDataErrorHandlingReturn {
  error: RealDataError | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: any, dataType: string) => void;
  retry: (retryFn: () => Promise<void>) => Promise<void>;
  clearError: () => void;
  canRetry: boolean;
}

export const useRealDataErrorHandling = (maxRetries: number = 3): UseRealDataErrorHandlingReturn => {
  const [error, setError] = useState<RealDataError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback((err: any, dataType: string) => {
    const errorType = err.name || 'UnknownError';
    const isRealDataError = [
      'RealDataUnavailableError',
      'MockDataDetectedError', 
      'RealDataValidationError',
      'ServiceUnavailableError'
    ].includes(errorType);

    const newError: RealDataError = {
      type: isRealDataError ? errorType : 'UnknownError',
      message: err.message || `Failed to load real ${dataType}`,
      dataType,
      retryCount: retryCount + 1,
      canRetry: retryCount < maxRetries,
      timestamp: Date.now(),
      originalError: err
    };

    setError(newError);
    setRetryCount(prev => prev + 1);
  }, [retryCount, maxRetries]);

  const retry = useCallback(async (retryFn: () => Promise<void>) => {
    if (!error?.canRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await retryFn();
      // If successful, clear error
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      // Update error with new retry count
      handleError(err, error.dataType);
    } finally {
      setIsRetrying(false);
    }
  }, [error, isRetrying, handleError]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    retry,
    clearError,
    canRetry: error?.canRetry || false
  };
};

// Utility function to determine appropriate error component
export const getErrorComponent = (error: RealDataError) => {
  switch (error.type) {
    case 'RealDataUnavailableError':
      return 'RealDataUnavailableError';
    case 'MockDataDetectedError':
      return 'MockDataDetectedError';
    case 'RealDataValidationError':
      return 'DataValidationError';
    case 'ServiceUnavailableError':
      return 'ServiceUnavailableError';
    default:
      return 'RetryMechanism';
  }
};

// Hook for handling real-time data errors with auto-retry
export const useRealTimeDataErrorHandling = (
  refreshInterval: number = 30000,
  maxRetries: number = 3
) => {
  const baseErrorHandling = useRealDataErrorHandling(maxRetries);
  const [nextRetryIn, setNextRetryIn] = useState<number | undefined>();

  const handleErrorWithAutoRetry = useCallback((err: any, dataType: string, retryFn: () => Promise<void>) => {
    baseErrorHandling.handleError(err, dataType);

    // Set up auto-retry with exponential backoff
    if (baseErrorHandling.retryCount < maxRetries) {
      const retryDelay = Math.min(5000 * Math.pow(2, baseErrorHandling.retryCount), 30000);
      setNextRetryIn(retryDelay / 1000);

      const timer = setInterval(() => {
        setNextRetryIn(prev => {
          if (!prev || prev <= 1) {
            clearInterval(timer);
            baseErrorHandling.retry(retryFn);
            return undefined;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [baseErrorHandling, maxRetries]);

  return {
    ...baseErrorHandling,
    nextRetryIn,
    handleErrorWithAutoRetry
  };
};

// Hook for validating real data before setting state
export const useRealDataValidation = () => {
  const validateRealData = useCallback((data: any, dataType: string): boolean => {
    // Basic validation to ensure data is not obviously mock
    if (!data) {
      throw new Error(`No real ${dataType} data received`);
    }

    // Check for common mock data patterns
    const dataString = JSON.stringify(data).toLowerCase();
    const mockIndicators = ['mock', 'fake', 'test', 'dummy', 'placeholder', 'example'];
    
    if (mockIndicators.some(indicator => dataString.includes(indicator))) {
      throw new Error(`Mock data detected in ${dataType}`);
    }

    // Check for obviously fake values
    if (typeof data === 'object') {
      // Check for placeholder IDs
      if (data.id && (data.id === '123' || data.id === 'test-id')) {
        throw new Error(`Placeholder ID detected in ${dataType}`);
      }

      // Check for fake timestamps
      if (data.timestamp === 0 || data.timestamp === 1000000000) {
        throw new Error(`Fake timestamp detected in ${dataType}`);
      }
    }

    return true;
  }, []);

  const setValidatedData = useCallback(<T>(
    data: T,
    dataType: string,
    setter: (data: T) => void
  ): void => {
    try {
      validateRealData(data, dataType);
      setter(data);
    } catch (error) {
      throw error; // Re-throw for error handling
    }
  }, [validateRealData]);

  return {
    validateRealData,
    setValidatedData
  };
};