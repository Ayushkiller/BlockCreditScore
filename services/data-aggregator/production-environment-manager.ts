// Production Environment Manager
// Manages real API credentials, timeout values, retry policies, and logging for production deployment

import { getProductionConfig, validateProductionConfig, ProductionConfig, RpcProvider, PriceProvider, DefiProvider } from '../../config/environments/production';

export interface EnvironmentHealth {
  isHealthy: boolean;
  lastHealthCheck: number;
  healthCheckDuration: number;
  errors: EnvironmentError[];
  warnings: string[];
  degradedServices: string[];
  totalServices: number;
  healthyServices: number;
}

export interface EnvironmentError {
  service: string;
  error: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  retryCount: number;
  lastRetryTime?: number;
}

export interface APICredentialStatus {
  service: string;
  hasCredentials: boolean;
  isValid: boolean;
  lastValidated: number;
  expiresAt?: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  errorMessage?: string;
}

export interface RetryPolicyInfo {
  service: string;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
  jitterMs: number;
  currentRetryCount: number;
  nextRetryTime?: number;
}

export interface TimeoutConfiguration {
  service: string;
  timeoutMs: number;
  averageResponseTime: number;
  maxResponseTime: number;
  timeoutCount: number;
  successCount: number;
  lastMeasurement: number;
}

export interface LoggingConfiguration {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableDetailedErrors: boolean;
  enablePerformanceMetrics: boolean;
  enableApiCallLogging: boolean;
  logRetentionDays: number;
  logFilePath: string;
  maxLogFileSize: number;
}

export class ProductionEnvironmentManager {
  private config: ProductionConfig;
  private environmentHealth: EnvironmentHealth;
  private credentialStatuses: Map<string, APICredentialStatus> = new Map();
  private retryPolicies: Map<string, RetryPolicyInfo> = new Map();
  private timeoutConfigurations: Map<string, TimeoutConfiguration> = new Map();
  private loggingConfig: LoggingConfiguration;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.config = getProductionConfig();
    this.validateConfiguration();
    this.initializeEnvironmentHealth();
    this.initializeCredentialStatuses();
    this.initializeRetryPolicies();
    this.initializeTimeoutConfigurations();
    this.initializeLogging();
    this.startHealthChecking();
  }

  /**
   * Validate production configuration on startup
   */
  private validateConfiguration(): void {
    try {
      validateProductionConfig(this.config);
      this.log('info', 'Production configuration validated successfully');
    } catch (error) {
      this.log('error', `Production configuration validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize environment health tracking
   */
  private initializeEnvironmentHealth(): void {
    this.environmentHealth = {
      isHealthy: true,
      lastHealthCheck: 0,
      healthCheckDuration: 0,
      errors: [],
      warnings: [],
      degradedServices: [],
      totalServices: this.getTotalServiceCount(),
      healthyServices: 0
    };
  }

  /**
   * Get total count of configured services
   */
  private getTotalServiceCount(): number {
    return (
      this.config.realData.ethereum.rpcProviders.length +
      this.config.realData.ethereum.fallbackProviders.length +
      this.config.realData.marketData.priceProviders.length +
      this.config.realData.marketData.defiProviders.length +
      this.config.realData.marketData.sentimentProviders.length
    );
  }

  /**
   * Initialize API credential status tracking
   */
  private initializeCredentialStatuses(): void {
    // RPC Providers
    [...this.config.realData.ethereum.rpcProviders, ...this.config.realData.ethereum.fallbackProviders]
      .forEach(provider => {
        this.credentialStatuses.set(provider.name, {
          service: provider.name,
          hasCredentials: !!provider.apiKey,
          isValid: false,
          lastValidated: 0
        });
      });

    // Price Providers
    this.config.realData.marketData.priceProviders.forEach(provider => {
      this.credentialStatuses.set(provider.name, {
        service: provider.name,
        hasCredentials: !!provider.apiKey,
        isValid: false,
        lastValidated: 0
      });
    });

    // DeFi Providers
    this.config.realData.marketData.defiProviders.forEach(provider => {
      this.credentialStatuses.set(provider.name, {
        service: provider.name,
        hasCredentials: !!provider.apiKey,
        isValid: false,
        lastValidated: 0
      });
    });

    // Sentiment Providers
    this.config.realData.marketData.sentimentProviders.forEach(provider => {
      this.credentialStatuses.set(provider.name, {
        service: provider.name,
        hasCredentials: !!provider.apiKey,
        isValid: false,
        lastValidated: 0
      });
    });
  }

  /**
   * Initialize retry policies for all services
   */
  private initializeRetryPolicies(): void {
    const baseRetryConfig = this.config.realData.retry;

    // RPC Providers
    [...this.config.realData.ethereum.rpcProviders, ...this.config.realData.ethereum.fallbackProviders]
      .forEach(provider => {
        this.retryPolicies.set(provider.name, {
          service: provider.name,
          maxRetries: provider.retries || baseRetryConfig.maxRetries,
          baseDelayMs: baseRetryConfig.baseDelayMs,
          maxDelayMs: baseRetryConfig.maxDelayMs,
          exponentialBackoff: baseRetryConfig.exponentialBackoff,
          jitterMs: baseRetryConfig.jitterMs,
          currentRetryCount: 0
        });
      });

    // Market Data Providers
    [...this.config.realData.marketData.priceProviders, 
     ...this.config.realData.marketData.defiProviders,
     ...this.config.realData.marketData.sentimentProviders]
      .forEach(provider => {
        this.retryPolicies.set(provider.name, {
          service: provider.name,
          maxRetries: provider.retries || baseRetryConfig.maxRetries,
          baseDelayMs: baseRetryConfig.baseDelayMs,
          maxDelayMs: baseRetryConfig.maxDelayMs,
          exponentialBackoff: baseRetryConfig.exponentialBackoff,
          jitterMs: baseRetryConfig.jitterMs,
          currentRetryCount: 0
        });
      });
  }

  /**
   * Initialize timeout configurations based on actual API response times
   */
  private initializeTimeoutConfigurations(): void {
    const baseTimeoutConfig = this.config.realData.timeout;

    // RPC Providers
    [...this.config.realData.ethereum.rpcProviders, ...this.config.realData.ethereum.fallbackProviders]
      .forEach(provider => {
        this.timeoutConfigurations.set(provider.name, {
          service: provider.name,
          timeoutMs: provider.timeout || baseTimeoutConfig.rpcCallTimeoutMs,
          averageResponseTime: 0,
          maxResponseTime: 0,
          timeoutCount: 0,
          successCount: 0,
          lastMeasurement: 0
        });
      });

    // Market Data Providers
    [...this.config.realData.marketData.priceProviders, 
     ...this.config.realData.marketData.defiProviders,
     ...this.config.realData.marketData.sentimentProviders]
      .forEach(provider => {
        this.timeoutConfigurations.set(provider.name, {
          service: provider.name,
          timeoutMs: provider.timeout || baseTimeoutConfig.apiCallTimeoutMs,
          averageResponseTime: 0,
          maxResponseTime: 0,
          timeoutCount: 0,
          successCount: 0,
          lastMeasurement: 0
        });
      });
  }

  /**
   * Initialize logging configuration
   */
  private initializeLogging(): void {
    this.loggingConfig = {
      level: this.config.realData.logging.level,
      enableDetailedErrors: this.config.realData.logging.enableDetailedErrors,
      enablePerformanceMetrics: this.config.realData.logging.enablePerformanceMetrics,
      enableApiCallLogging: this.config.realData.logging.enableApiCallLogging,
      logRetentionDays: this.config.realData.logging.logRetentionDays,
      logFilePath: process.env.LOG_FILE_PATH || './logs/production.log',
      maxLogFileSize: 100 * 1024 * 1024 // 100MB
    };
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    const interval = this.config.realData.healthCheck.interval;
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Perform comprehensive health check of all services
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    this.log('debug', 'Starting environment health check');

    try {
      // Reset health status
      this.environmentHealth.errors = [];
      this.environmentHealth.warnings = [];
      this.environmentHealth.degradedServices = [];
      this.environmentHealth.healthyServices = 0;

      // Check RPC providers
      await this.checkRpcProviders();
      
      // Check market data providers
      await this.checkMarketDataProviders();
      
      // Check monitoring service
      await this.checkMonitoringService();

      // Update overall health status
      this.environmentHealth.isHealthy = this.environmentHealth.errors.length === 0;
      this.environmentHealth.lastHealthCheck = Date.now();
      this.environmentHealth.healthCheckDuration = Date.now() - startTime;

      this.log('info', `Health check completed in ${this.environmentHealth.healthCheckDuration}ms. ` +
        `${this.environmentHealth.healthyServices}/${this.environmentHealth.totalServices} services healthy`);

    } catch (error) {
      this.addError('HealthCheck', error.message, 'high', false);
      this.log('error', `Health check failed: ${error.message}`);
    }
  }

  /**
   * Check RPC provider health and credentials
   */
  private async checkRpcProviders(): Promise<void> {
    const providers = [...this.config.realData.ethereum.rpcProviders, ...this.config.realData.ethereum.fallbackProviders];
    
    for (const provider of providers) {
      try {
        const startTime = Date.now();
        
        // Test basic connectivity
        const response = await fetch(provider.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          }),
          signal: AbortSignal.timeout(provider.timeout)
        });

        const responseTime = Date.now() - startTime;
        this.recordResponseTime(provider.name, responseTime);

        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            this.updateCredentialStatus(provider.name, true, 'RPC connection successful');
            this.environmentHealth.healthyServices++;
            provider.isHealthy = true;
            provider.lastHealthCheck = Date.now();
          } else {
            throw new Error(`Invalid RPC response: ${JSON.stringify(data)}`);
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        this.updateCredentialStatus(provider.name, false, error.message);
        this.addError(provider.name, error.message, 'medium', true);
        this.environmentHealth.degradedServices.push(provider.name);
        provider.isHealthy = false;
        provider.failureCount++;
      }
    }
  }

  /**
   * Check market data provider health and credentials
   */
  private async checkMarketDataProviders(): Promise<void> {
    // Check price providers
    for (const provider of this.config.realData.marketData.priceProviders) {
      await this.checkPriceProvider(provider);
    }

    // Check DeFi providers
    for (const provider of this.config.realData.marketData.defiProviders) {
      await this.checkDefiProvider(provider);
    }

    // Check sentiment providers
    for (const provider of this.config.realData.marketData.sentimentProviders) {
      await this.checkSentimentProvider(provider);
    }
  }

  /**
   * Check individual price provider
   */
  private async checkPriceProvider(provider: PriceProvider): Promise<void> {
    try {
      const startTime = Date.now();
      const testUrl = `${provider.baseUrl}${provider.endpoints.currentPrice}?ids=ethereum&vs_currencies=usd`;
      
      const response = await fetch(testUrl, {
        headers: provider.apiKey ? { 'X-CG-Demo-API-Key': provider.apiKey } : {},
        signal: AbortSignal.timeout(provider.timeout)
      });

      const responseTime = Date.now() - startTime;
      this.recordResponseTime(provider.name, responseTime);

      if (response.ok) {
        const data = await response.json();
        if (data.ethereum?.usd) {
          this.updateCredentialStatus(provider.name, true, 'Price data fetched successfully');
          this.environmentHealth.healthyServices++;
          provider.isHealthy = true;
          provider.lastHealthCheck = Date.now();
          
          // Update rate limit info if available
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
          const rateLimitReset = response.headers.get('x-ratelimit-reset');
          
          if (rateLimitRemaining) {
            const credentialStatus = this.credentialStatuses.get(provider.name);
            if (credentialStatus) {
              credentialStatus.rateLimitRemaining = parseInt(rateLimitRemaining);
              credentialStatus.rateLimitReset = rateLimitReset ? parseInt(rateLimitReset) : undefined;
            }
          }
        } else {
          throw new Error('Invalid price data response');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      this.updateCredentialStatus(provider.name, false, error.message);
      this.addError(provider.name, error.message, 'medium', true);
      this.environmentHealth.degradedServices.push(provider.name);
      provider.isHealthy = false;
      provider.failureCount++;
    }
  }

  /**
   * Check individual DeFi provider
   */
  private async checkDefiProvider(provider: DefiProvider): Promise<void> {
    try {
      const startTime = Date.now();
      const testUrl = `${provider.baseUrl}${provider.endpoints.tvl}`;
      
      const response = await fetch(testUrl, {
        headers: provider.apiKey ? { 'Authorization': `Bearer ${provider.apiKey}` } : {},
        signal: AbortSignal.timeout(provider.timeout)
      });

      const responseTime = Date.now() - startTime;
      this.recordResponseTime(provider.name, responseTime);

      if (response.ok) {
        const data = await response.json();
        if (typeof data === 'number' || (Array.isArray(data) && data.length > 0)) {
          this.updateCredentialStatus(provider.name, true, 'DeFi data fetched successfully');
          this.environmentHealth.healthyServices++;
          provider.isHealthy = true;
          provider.lastHealthCheck = Date.now();
        } else {
          throw new Error('Invalid DeFi data response');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      this.updateCredentialStatus(provider.name, false, error.message);
      this.addError(provider.name, error.message, 'medium', true);
      this.environmentHealth.degradedServices.push(provider.name);
      provider.isHealthy = false;
      provider.failureCount++;
    }
  }

  /**
   * Check individual sentiment provider
   */
  private async checkSentimentProvider(provider: any): Promise<void> {
    try {
      const startTime = Date.now();
      const testUrl = `${provider.baseUrl}${provider.endpoints.fearGreed}`;
      
      const response = await fetch(testUrl, {
        signal: AbortSignal.timeout(provider.timeout)
      });

      const responseTime = Date.now() - startTime;
      this.recordResponseTime(provider.name, responseTime);

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          this.updateCredentialStatus(provider.name, true, 'Sentiment data fetched successfully');
          this.environmentHealth.healthyServices++;
          provider.isHealthy = true;
          provider.lastHealthCheck = Date.now();
        } else {
          throw new Error('Invalid sentiment data response');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      this.updateCredentialStatus(provider.name, false, error.message);
      this.addError(provider.name, error.message, 'low', true);
      this.environmentHealth.degradedServices.push(provider.name);
      provider.isHealthy = false;
      provider.failureCount++;
    }
  }

  /**
   * Check monitoring service health
   */
  private async checkMonitoringService(): Promise<void> {
    if (!this.config.monitoring.enabled) {
      return;
    }

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.monitoring.endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.monitoring.apiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;
      this.recordResponseTime('Monitoring', responseTime);

      if (response.ok) {
        this.updateCredentialStatus('Monitoring', true, 'Monitoring service healthy');
        this.environmentHealth.healthyServices++;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      this.updateCredentialStatus('Monitoring', false, error.message);
      this.addError('Monitoring', error.message, 'high', true);
      this.environmentHealth.degradedServices.push('Monitoring');
    }
  }

  /**
   * Record response time for performance tracking
   */
  private recordResponseTime(serviceName: string, responseTime: number): void {
    const timeoutConfig = this.timeoutConfigurations.get(serviceName);
    if (timeoutConfig) {
      timeoutConfig.successCount++;
      timeoutConfig.lastMeasurement = Date.now();
      
      // Update average response time
      if (timeoutConfig.averageResponseTime === 0) {
        timeoutConfig.averageResponseTime = responseTime;
      } else {
        timeoutConfig.averageResponseTime = (timeoutConfig.averageResponseTime + responseTime) / 2;
      }
      
      // Update max response time
      if (responseTime > timeoutConfig.maxResponseTime) {
        timeoutConfig.maxResponseTime = responseTime;
      }
    }

    // Store performance metrics
    if (!this.performanceMetrics.has(serviceName)) {
      this.performanceMetrics.set(serviceName, []);
    }
    
    const metrics = this.performanceMetrics.get(serviceName)!;
    metrics.push(responseTime);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    if (this.loggingConfig.enablePerformanceMetrics) {
      this.log('debug', `${serviceName} response time: ${responseTime}ms`);
    }
  }

  /**
   * Update credential status for a service
   */
  private updateCredentialStatus(serviceName: string, isValid: boolean, message?: string): void {
    const status = this.credentialStatuses.get(serviceName);
    if (status) {
      status.isValid = isValid;
      status.lastValidated = Date.now();
      if (message) {
        if (isValid) {
          delete status.errorMessage;
        } else {
          status.errorMessage = message;
        }
      }
    }
  }

  /**
   * Add error to environment health tracking
   */
  private addError(service: string, error: string, severity: 'low' | 'medium' | 'high' | 'critical', retryable: boolean): void {
    const environmentError: EnvironmentError = {
      service,
      error,
      timestamp: Date.now(),
      severity,
      retryable,
      retryCount: 0
    };

    this.environmentHealth.errors.push(environmentError);
    
    // Update retry policy if retryable
    if (retryable) {
      const retryPolicy = this.retryPolicies.get(service);
      if (retryPolicy) {
        retryPolicy.currentRetryCount++;
        if (retryPolicy.currentRetryCount <= retryPolicy.maxRetries) {
          const delay = this.calculateRetryDelay(retryPolicy);
          retryPolicy.nextRetryTime = Date.now() + delay;
        }
      }
    }
  }

  /**
   * Calculate retry delay based on retry policy
   */
  private calculateRetryDelay(retryPolicy: RetryPolicyInfo): number {
    let delay = retryPolicy.baseDelayMs;
    
    if (retryPolicy.exponentialBackoff) {
      delay = Math.min(
        retryPolicy.baseDelayMs * Math.pow(2, retryPolicy.currentRetryCount - 1),
        retryPolicy.maxDelayMs
      );
    }
    
    // Add jitter
    if (retryPolicy.jitterMs > 0) {
      delay += Math.random() * retryPolicy.jitterMs;
    }
    
    return delay;
  }

  /**
   * Log message with appropriate level and formatting
   */
  private log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [ProductionEnvironmentManager] ${message}`;
    
    // Console logging
    switch (level) {
      case 'error':
        console.error(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'info':
        console.info(logMessage, data || '');
        break;
      case 'debug':
        if (this.loggingConfig.level === 'debug') {
          console.debug(logMessage, data || '');
        }
        break;
    }

    // File logging would be implemented here in a real production environment
    // For now, we'll just use console logging
  }

  // Public API methods

  /**
   * Get current environment health status
   */
  public getEnvironmentHealth(): EnvironmentHealth {
    return { ...this.environmentHealth };
  }

  /**
   * Get API credential statuses
   */
  public getCredentialStatuses(): APICredentialStatus[] {
    return Array.from(this.credentialStatuses.values());
  }

  /**
   * Get retry policy information
   */
  public getRetryPolicies(): RetryPolicyInfo[] {
    return Array.from(this.retryPolicies.values());
  }

  /**
   * Get timeout configurations
   */
  public getTimeoutConfigurations(): TimeoutConfiguration[] {
    return Array.from(this.timeoutConfigurations.values());
  }

  /**
   * Get logging configuration
   */
  public getLoggingConfiguration(): LoggingConfiguration {
    return { ...this.loggingConfig };
  }

  /**
   * Get production configuration
   */
  public getProductionConfig(): ProductionConfig {
    return this.config;
  }

  /**
   * Get performance metrics for a service
   */
  public getPerformanceMetrics(serviceName: string): number[] {
    return this.performanceMetrics.get(serviceName) || [];
  }

  /**
   * Get all performance metrics
   */
  public getAllPerformanceMetrics(): Map<string, number[]> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Force health check
   */
  public async forceHealthCheck(): Promise<void> {
    await this.performHealthCheck();
  }

  /**
   * Reset retry count for a service
   */
  public resetRetryCount(serviceName: string): void {
    const retryPolicy = this.retryPolicies.get(serviceName);
    if (retryPolicy) {
      retryPolicy.currentRetryCount = 0;
      delete retryPolicy.nextRetryTime;
    }
  }

  /**
   * Update timeout for a service based on measured response times
   */
  public updateTimeoutBasedOnPerformance(serviceName: string): void {
    const timeoutConfig = this.timeoutConfigurations.get(serviceName);
    const metrics = this.performanceMetrics.get(serviceName);
    
    if (timeoutConfig && metrics && metrics.length > 10) {
      // Calculate 95th percentile response time
      const sortedMetrics = [...metrics].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedMetrics.length * 0.95);
      const p95ResponseTime = sortedMetrics[p95Index];
      
      // Set timeout to 2x the 95th percentile response time, with minimum and maximum bounds
      const newTimeout = Math.max(
        Math.min(p95ResponseTime * 2, 30000), // Max 30 seconds
        3000 // Min 3 seconds
      );
      
      if (newTimeout !== timeoutConfig.timeoutMs) {
        this.log('info', `Updated timeout for ${serviceName} from ${timeoutConfig.timeoutMs}ms to ${newTimeout}ms based on performance metrics`);
        timeoutConfig.timeoutMs = newTimeout;
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Singleton instance
let productionEnvironmentManager: ProductionEnvironmentManager | null = null;

export function getProductionEnvironmentManager(): ProductionEnvironmentManager {
  if (!productionEnvironmentManager) {
    productionEnvironmentManager = new ProductionEnvironmentManager();
  }
  return productionEnvironmentManager;
}