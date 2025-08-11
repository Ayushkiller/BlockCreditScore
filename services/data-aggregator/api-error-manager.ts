// API Error Management Service - Production-ready error handling for real APIs
// Implements task 9.1: Replace mock error handling with real API error management

import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: number;
  endpoint: string;
  provider: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

export interface APIHealthStatus {
  provider: string;
  endpoint: string;
  isHealthy: boolean;
  lastSuccessTime: number;
  lastErrorTime: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
}

export interface APIMetrics {
  provider: string;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export class APIErrorManager {
  private healthStatus: Map<string, APIHealthStatus> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private metrics: Map<string, APIMetrics> = new Map();
  private errorCallbacks: Map<string, (error: APIError) => void> = new Map();
  private recoveryCallbacks: Map<string, (provider: string) => void> = new Map();

  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  private readonly TIMEOUT_CONFIGS: Record<string, number> = {
    'coingecko': 10000,
    'defillama': 15000,
    'chainlink': 5000,
    'alchemy': 8000,
    'infura': 8000,
    'alternative.me': 12000
  };

  /**
   * Execute API request with comprehensive error handling
   */
  public async executeWithErrorHandling<T>(
    provider: string,
    endpoint: string,
    requestFn: () => Promise<Response>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };
    const startTime = getCurrentTimestamp();
    let lastError: APIError | null = null;

    // Check if provider is healthy
    if (!this.isProviderHealthy(provider)) {
      throw this.createAPIError(
        'PROVIDER_UNHEALTHY',
        `Provider ${provider} is currently unhealthy`,
        503,
        endpoint,
        provider,
        false
      );
    }

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Check rate limits before making request
        await this.checkRateLimit(provider);

        // Execute request with timeout
        const response = await this.executeWithTimeout(
          requestFn,
          this.getTimeoutForProvider(provider)
        );

        // Update rate limit info from response headers
        this.updateRateLimitFromHeaders(provider, response.headers);

        // Handle HTTP error status codes
        if (!response.ok) {
          const error = await this.handleHTTPError(response, endpoint, provider);
          
          if (this.isRetryableError(error, config) && attempt < config.maxRetries) {
            lastError = error;
            await this.waitForRetry(attempt, config, error.retryAfter);
            continue;
          }
          
          throw error;
        }

        // Parse response
        const data = await response.json();
        
        // Update success metrics
        this.updateSuccessMetrics(provider, endpoint, getCurrentTimestamp() - startTime);
        
        return data;

      } catch (error) {
        const apiError = error instanceof Error && 'code' in error 
          ? error as APIError
          : this.createAPIError(
              'REQUEST_FAILED',
              error instanceof Error ? error.message : 'Unknown error',
              0,
              endpoint,
              provider,
              true
            );

        lastError = apiError;
        
        // Update error metrics
        this.updateErrorMetrics(provider, endpoint, apiError);

        // Check if error is retryable
        if (this.isRetryableError(apiError, config) && attempt < config.maxRetries) {
          await this.waitForRetry(attempt, config, apiError.retryAfter);
          continue;
        }

        // Mark provider as unhealthy if too many consecutive errors
        this.checkProviderHealth(provider);

        throw apiError;
      }
    }

    throw lastError || this.createAPIError(
      'MAX_RETRIES_EXCEEDED',
      `Maximum retry attempts (${config.maxRetries}) exceeded`,
      500,
      endpoint,
      provider,
      false
    );
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout(
    requestFn: () => Promise<Response>,
    timeoutMs: number
  ): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(this.createAPIError(
          'TIMEOUT',
          `Request timed out after ${timeoutMs}ms`,
          408,
          '',
          '',
          true
        ));
      }, timeoutMs);
    });

    return Promise.race([requestFn(), timeoutPromise]);
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHTTPError(
    response: Response,
    endpoint: string,
    provider: string
  ): Promise<APIError> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let retryAfter: number | undefined;

    // Extract error details from response body if available
    try {
      const errorBody = await response.text();
      if (errorBody) {
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // Use text response if not JSON
          errorMessage = errorBody.substring(0, 200);
        }
      }
    } catch {
      // Ignore errors when reading response body
    }

    // Handle rate limiting
    if (response.status === 429) {
      retryAfter = this.extractRetryAfter(response.headers);
      this.updateRateLimitFromHeaders(provider, response.headers);
    }

    return this.createAPIError(
      this.getErrorCodeFromStatus(response.status),
      errorMessage,
      response.status,
      endpoint,
      provider,
      this.isRetryableStatusCode(response.status),
      retryAfter
    );
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimit(provider: string): Promise<void> {
    const rateLimit = this.rateLimits.get(provider);
    
    if (rateLimit && rateLimit.remaining <= 0) {
      const waitTime = rateLimit.resetTime - getCurrentTimestamp();
      
      if (waitTime > 0) {
        throw this.createAPIError(
          'RATE_LIMITED',
          `Rate limit exceeded for ${provider}. Reset in ${Math.ceil(waitTime / 1000)}s`,
          429,
          '',
          provider,
          true,
          waitTime
        );
      }
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitFromHeaders(provider: string, headers: Headers): void {
    const limit = this.parseHeaderNumber(headers.get('x-ratelimit-limit'));
    const remaining = this.parseHeaderNumber(headers.get('x-ratelimit-remaining'));
    const reset = this.parseHeaderNumber(headers.get('x-ratelimit-reset'));
    const retryAfter = this.parseHeaderNumber(headers.get('retry-after'));

    if (limit !== null || remaining !== null || reset !== null) {
      const resetTime = reset ? reset * 1000 : getCurrentTimestamp() + 60000;
      
      this.rateLimits.set(provider, {
        limit: limit || 100,
        remaining: remaining || 0,
        resetTime,
        retryAfter: retryAfter || 0
      });
    }
  }

  /**
   * Extract retry-after value from headers
   */
  private extractRetryAfter(headers: Headers): number | undefined {
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? undefined : seconds * 1000;
    }
    return undefined;
  }

  /**
   * Wait for retry with exponential backoff
   */
  private async waitForRetry(
    attempt: number,
    config: RetryConfig,
    retryAfter?: number
  ): Promise<void> {
    let delay: number;

    if (retryAfter) {
      delay = retryAfter;
    } else {
      delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
    }

    console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`);
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: APIError, config: RetryConfig): boolean {
    if (!error.retryable) return false;
    
    if (error.statusCode === 0) return true; // Network errors
    
    return config.retryableStatusCodes.includes(error.statusCode);
  }

  /**
   * Check if status code is retryable
   */
  private isRetryableStatusCode(statusCode: number): boolean {
    return this.DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(statusCode);
  }

  /**
   * Update success metrics
   */
  private updateSuccessMetrics(provider: string, endpoint: string, responseTime: number): void {
    const key = `${provider}:${endpoint}`;
    const existing = this.metrics.get(key) || this.createEmptyMetrics(provider, endpoint);
    
    existing.totalRequests++;
    existing.successfulRequests++;
    existing.averageResponseTime = this.updateAverage(
      existing.averageResponseTime,
      responseTime,
      existing.totalRequests
    );
    existing.errorRate = (existing.failedRequests / existing.totalRequests) * 100;
    existing.lastRequestTime = getCurrentTimestamp();
    
    this.metrics.set(key, existing);
    
    // Update health status
    this.updateHealthStatus(provider, endpoint, true, responseTime);
  }

  /**
   * Update error metrics
   */
  private updateErrorMetrics(provider: string, endpoint: string, error: APIError): void {
    const key = `${provider}:${endpoint}`;
    const existing = this.metrics.get(key) || this.createEmptyMetrics(provider, endpoint);
    
    existing.totalRequests++;
    existing.failedRequests++;
    existing.errorRate = (existing.failedRequests / existing.totalRequests) * 100;
    existing.lastRequestTime = getCurrentTimestamp();
    
    this.metrics.set(key, existing);
    
    // Update health status
    this.updateHealthStatus(provider, endpoint, false, 0);
    
    // Trigger error callback
    const errorCallback = this.errorCallbacks.get(provider);
    if (errorCallback) {
      errorCallback(error);
    }
  }

  /**
   * Update health status
   */
  private updateHealthStatus(
    provider: string,
    endpoint: string,
    success: boolean,
    responseTime: number
  ): void {
    const key = `${provider}:${endpoint}`;
    const existing = this.healthStatus.get(key) || this.createEmptyHealthStatus(provider, endpoint);
    
    const now = getCurrentTimestamp();
    
    if (success) {
      existing.lastSuccessTime = now;
      existing.errorCount = Math.max(0, existing.errorCount - 1);
      existing.averageResponseTime = this.updateAverage(
        existing.averageResponseTime,
        responseTime,
        10 // Use last 10 requests for average
      );
    } else {
      existing.lastErrorTime = now;
      existing.errorCount++;
    }
    
    // Determine health based on recent error count and success rate
    existing.isHealthy = existing.errorCount < 5 && 
      (now - existing.lastSuccessTime) < 300000; // 5 minutes
    
    // Calculate uptime
    const totalTime = now - (existing.lastSuccessTime || now);
    const downTime = existing.errorCount * 60000; // Assume 1 minute per error
    existing.uptime = Math.max(0, ((totalTime - downTime) / totalTime) * 100);
    
    this.healthStatus.set(key, existing);
  }

  /**
   * Check provider health and mark as unhealthy if needed
   */
  private checkProviderHealth(provider: string): void {
    const healthEntries = Array.from(this.healthStatus.entries())
      .filter(([key]) => key.startsWith(`${provider}:`));
    
    const unhealthyCount = healthEntries.filter(([, status]) => !status.isHealthy).length;
    const totalCount = healthEntries.length;
    
    if (totalCount > 0 && (unhealthyCount / totalCount) > 0.5) {
      console.warn(`Provider ${provider} marked as unhealthy (${unhealthyCount}/${totalCount} endpoints failing)`);
      
      // Trigger recovery callback
      const recoveryCallback = this.recoveryCallbacks.get(provider);
      if (recoveryCallback) {
        recoveryCallback(provider);
      }
    }
  }

  /**
   * Check if provider is healthy
   */
  private isProviderHealthy(provider: string): boolean {
    const healthEntries = Array.from(this.healthStatus.entries())
      .filter(([key]) => key.startsWith(`${provider}:`));
    
    if (healthEntries.length === 0) return true; // No data yet, assume healthy
    
    const healthyCount = healthEntries.filter(([, status]) => status.isHealthy).length;
    return healthyCount > 0; // At least one endpoint is healthy
  }

  /**
   * Get timeout for specific provider
   */
  private getTimeoutForProvider(provider: string): number {
    return this.TIMEOUT_CONFIGS[provider.toLowerCase()] || 10000;
  }

  /**
   * Create API error object
   */
  private createAPIError(
    code: string,
    message: string,
    statusCode: number,
    endpoint: string,
    provider: string,
    retryable: boolean,
    retryAfter?: number
  ): APIError {
    return {
      code,
      message,
      statusCode,
      timestamp: getCurrentTimestamp(),
      endpoint,
      provider,
      retryable,
      retryAfter
    };
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      408: 'TIMEOUT',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };
    
    return statusCodes[status] || 'HTTP_ERROR';
  }

  /**
   * Parse header number value
   */
  private parseHeaderNumber(value: string | null): number | null {
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Update running average
   */
  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(provider: string, endpoint: string): APIMetrics {
    return {
      provider,
      endpoint,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastRequestTime: 0
    };
  }

  /**
   * Create empty health status object
   */
  private createEmptyHealthStatus(provider: string, endpoint: string): APIHealthStatus {
    return {
      provider,
      endpoint,
      isHealthy: true,
      lastSuccessTime: getCurrentTimestamp(),
      lastErrorTime: 0,
      errorCount: 0,
      averageResponseTime: 0,
      uptime: 100
    };
  }

  /**
   * Register error callback
   */
  public onError(provider: string, callback: (error: APIError) => void): void {
    this.errorCallbacks.set(provider, callback);
  }

  /**
   * Register recovery callback
   */
  public onRecovery(provider: string, callback: (provider: string) => void): void {
    this.recoveryCallbacks.set(provider, callback);
  }

  /**
   * Get health status for all providers
   */
  public getAllHealthStatus(): APIHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get metrics for all providers
   */
  public getAllMetrics(): APIMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get rate limit info for all providers
   */
  public getAllRateLimits(): Map<string, RateLimitInfo> {
    return new Map(this.rateLimits);
  }

  /**
   * Get health status for specific provider
   */
  public getProviderHealth(provider: string): APIHealthStatus[] {
    return Array.from(this.healthStatus.entries())
      .filter(([key]) => key.startsWith(`${provider}:`))
      .map(([, status]) => status);
  }

  /**
   * Reset metrics for provider
   */
  public resetProviderMetrics(provider: string): void {
    const keysToDelete = Array.from(this.metrics.keys())
      .filter(key => key.startsWith(`${provider}:`));
    
    keysToDelete.forEach(key => this.metrics.delete(key));
    
    const healthKeysToDelete = Array.from(this.healthStatus.keys())
      .filter(key => key.startsWith(`${provider}:`));
    
    healthKeysToDelete.forEach(key => this.healthStatus.delete(key));
    
    this.rateLimits.delete(provider);
  }

  /**
   * Get comprehensive status report
   */
  public getStatusReport(): {
    timestamp: number;
    totalProviders: number;
    healthyProviders: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    rateLimitedProviders: string[];
  } {
    const allMetrics = this.getAllMetrics();
    const allHealth = this.getAllHealthStatus();
    
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const successfulRequests = allMetrics.reduce((sum, m) => sum + m.successfulRequests, 0);
    const totalResponseTime = allMetrics.reduce((sum, m) => sum + (m.averageResponseTime * m.totalRequests), 0);
    
    const providers = new Set(allHealth.map(h => h.provider));
    const healthyProviders = new Set(allHealth.filter(h => h.isHealthy).map(h => h.provider));
    
    const rateLimitedProviders = Array.from(this.rateLimits.entries())
      .filter(([, limit]) => limit.remaining <= 0)
      .map(([provider]) => provider);
    
    return {
      timestamp: getCurrentTimestamp(),
      totalProviders: providers.size,
      healthyProviders: healthyProviders.size,
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      rateLimitedProviders
    };
  }
}

// Export singleton instance
let apiErrorManagerInstance: APIErrorManager | null = null;

export function getAPIErrorManager(): APIErrorManager {
  if (!apiErrorManagerInstance) {
    apiErrorManagerInstance = new APIErrorManager();
  }
  return apiErrorManagerInstance;
}