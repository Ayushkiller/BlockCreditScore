// Error handling utilities

/**
 * Base error class for CryptoVault Credit Intelligence
 */
export class CryptoVaultError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'CryptoVaultError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = Date.now();
    this.details = details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends CryptoVaultError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends CryptoVaultError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends CryptoVaultError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends CryptoVaultError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends CryptoVaultError {
  public readonly retryAfter: number;
  public readonly remainingRequests: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number = 60,
    remainingRequests: number = 0,
    details?: any
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.remainingRequests = remainingRequests;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      remainingRequests: this.remainingRequests
    };
  }
}

/**
 * Blockchain error
 */
export class BlockchainError extends CryptoVaultError {
  constructor(message: string, chainId?: number, details?: any) {
    super(message, 'BLOCKCHAIN_ERROR', 502, { chainId, ...details });
    this.name = 'BlockchainError';
  }
}

/**
 * Smart contract error
 */
export class ContractError extends CryptoVaultError {
  constructor(message: string, contractAddress?: string, details?: any) {
    super(message, 'CONTRACT_ERROR', 502, { contractAddress, ...details });
    this.name = 'ContractError';
  }
}

/**
 * Data aggregation error
 */
export class DataAggregationError extends CryptoVaultError {
  constructor(message: string, source?: string, details?: any) {
    super(message, 'DATA_AGGREGATION_ERROR', 502, { source, ...details });
    this.name = 'DataAggregationError';
  }
}

/**
 * ML model error
 */
export class MLModelError extends CryptoVaultError {
  constructor(message: string, modelId?: string, details?: any) {
    super(message, 'ML_MODEL_ERROR', 500, { modelId, ...details });
    this.name = 'MLModelError';
  }
}

/**
 * ZK proof error
 */
export class ZKProofError extends CryptoVaultError {
  constructor(message: string, details?: any) {
    super(message, 'ZK_PROOF_ERROR', 500, details);
    this.name = 'ZKProofError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends CryptoVaultError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends CryptoVaultError {
  constructor(message: string, service?: string, details?: any) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, { service, ...details });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Handles and formats errors for API responses
   */
  static handleError(error: any): CryptoVaultError {
    if (error instanceof CryptoVaultError) {
      return error;
    }

    // Handle common error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, error.details);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ExternalServiceError('External service unavailable', error.hostname);
    }

    if (error.code === 'CALL_EXCEPTION') {
      return new ContractError('Smart contract call failed', error.address, error);
    }

    // Default to generic error
    return new CryptoVaultError(
      error.message || 'An unexpected error occurred',
      'INTERNAL_ERROR',
      500,
      error
    );
  }

  /**
   * Logs error with appropriate level
   */
  static logError(error: CryptoVaultError, context?: any): void {
    const logData = {
      error: error.toJSON(),
      context,
      stack: error.stack
    };

    if (error.statusCode >= 500) {
      console.error('Server Error:', logData);
    } else if (error.statusCode >= 400) {
      console.warn('Client Error:', logData);
    } else {
      console.info('Error:', logData);
    }
  }

  /**
   * Creates a safe error response for clients
   */
  static createSafeErrorResponse(error: CryptoVaultError): any {
    const response = {
      error: {
        message: error.message,
        code: error.code,
        timestamp: error.timestamp
      }
    };

    // Only include details in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      response.error = { ...response.error, ...error.details };
    }

    return response;
  }
}

/**
 * Async error wrapper for handling promises
 */
export function asyncErrorHandler<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.handleError(error);
    }
  };
}

/**
 * Formats an error for logging and display purposes
 */
export function formatError(error: any): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  
  return String(error);
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw ErrorHandler.handleError(lastError);
}