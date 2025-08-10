// Price Feed Failover System
// Implements task 6.2: Add real price feed failover using backup price sources when primary feeds fail

import { EventEmitter } from 'events';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { RealTimePriceData, RealTimePriceFeedManager } from './real-time-price-feed-manager';
import { RedisPriceCache } from './redis-price-cache';
import { getRealMarketDataService } from './real-market-data-service';

export interface PriceSource {
  name: string;
  priority: number; // Lower number = higher priority
  isHealthy: boolean;
  lastError?: string;
  lastErrorTime?: number;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  lastLatency: number;
  isEnabled: boolean;
}

export interface FailoverConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  circuitBreakerThreshold: number; // failure percentage to trigger circuit breaker
  circuitBreakerTimeout: number; // milliseconds to wait before retrying failed source
  stalenessThreshold: number; // seconds - use stale data if fresher than this
}

export interface PriceRequest {
  symbol: string;
  requestId: string;
  timestamp: number;
  requiredFreshness?: number; // seconds - max age of acceptable cached data
}

export interface PriceResponse {
  data: RealTimePriceData | null;
  source: string;
  fromCache: boolean;
  latency: number;
  error?: string;
}

/**
 * Price Feed Failover System
 * Manages multiple price sources with automatic failover and circuit breaker patterns
 */
export class PriceFeedFailoverManager extends EventEmitter {
  private priceSources: Map<string, PriceSource> = new Map();
  private realTimePriceFeedManager: RealTimePriceFeedManager | null = null;
  private redisPriceCache: RedisPriceCache | null = null;
  private realMarketDataService: any = null;
  private config: FailoverConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private circuitBreakers: Map<string, { isOpen: boolean; lastFailure: number }> = new Map();

  // Default failover configuration
  private readonly DEFAULT_CONFIG: FailoverConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    healthCheckInterval: 30000, // 30 seconds
    circuitBreakerThreshold: 80, // 80% failure rate
    circuitBreakerTimeout: 60000, // 1 minute
    stalenessThreshold: 300 // 5 minutes
  };

  constructor(config?: Partial<FailoverConfig>) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializePriceSources();
  }

  /**
   * Initialize price sources with priority order
   */
  private initializePriceSources(): void {
    const sources: Array<Omit<PriceSource, 'successCount' | 'failureCount' | 'averageLatency' | 'lastLatency'>> = [
      {
        name: 'chainlink',
        priority: 1,
        isHealthy: true,
        isEnabled: true
      },
      {
        name: 'redis_cache',
        priority: 2,
        isHealthy: true,
        isEnabled: true
      },
      {
        name: 'dex_aggregator',
        priority: 3,
        isHealthy: true,
        isEnabled: true
      },
      {
        name: 'coingecko',
        priority: 4,
        isHealthy: true,
        isEnabled: true
      },
      {
        name: 'stale_cache',
        priority: 5,
        isHealthy: true,
        isEnabled: true
      }
    ];

    sources.forEach(source => {
      this.priceSources.set(source.name, {
        ...source,
        successCount: 0,
        failureCount: 0,
        averageLatency: 0,
        lastLatency: 0
      });
    });
  }

  /**
   * Initialize the failover manager with price sources
   */
  public async initialize(
    realTimePriceFeedManager: RealTimePriceFeedManager,
    redisPriceCache?: RedisPriceCache
  ): Promise<void> {
    try {
      this.realTimePriceFeedManager = realTimePriceFeedManager;
      this.redisPriceCache = redisPriceCache || null;

      // Initialize real market data service
      try {
        this.realMarketDataService = await getRealMarketDataService();
        console.log('✅ Real market data service integrated for failover');
      } catch (error) {
        console.warn('⚠️ Real market data service not available for failover:', formatError(error));
        this.updateSourceHealth('coingecko', false, formatError(error));
      }

      // Start health check monitoring
      this.startHealthCheckMonitoring();

      this.isInitialized = true;
      console.log('🚀 Price Feed Failover Manager initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Price Feed Failover Manager:', formatError(error));
      throw error;
    }
  }

  /**
   * Get price with automatic failover through multiple sources
   */
  public async getPriceWithFailover(request: PriceRequest): Promise<PriceResponse> {
    this.ensureInitialized();

    const startTime = Date.now();
    const sortedSources = this.getSortedHealthySources();

    console.log(`🔄 Getting price for ${request.symbol} with failover (${sortedSources.length} sources available)`);

    for (const source of sortedSources) {
      // Skip if circuit breaker is open
      if (this.isCircuitBreakerOpen(source.name)) {
        console.log(`⚡ Circuit breaker open for ${source.name}, skipping`);
        continue;
      }

      const sourceStartTime = Date.now();

      try {
        const response = await this.fetchPriceFromSource(source.name, request);
        
        if (response.data) {
          const latency = Date.now() - sourceStartTime;
          
          // Update source statistics
          this.updateSourceStats(source.name, true, latency);
          this.closeCircuitBreaker(source.name);

          const totalLatency = Date.now() - startTime;
          
          console.log(`✅ Price retrieved for ${request.symbol} from ${source.name}: $${response.data.priceUSD.toFixed(2)} (${latency}ms)`);
          
          this.emit('priceRetrieved', {
            symbol: request.symbol,
            source: source.name,
            price: response.data.priceUSD,
            latency: totalLatency,
            fromCache: response.fromCache
          });

          return {
            ...response,
            latency: totalLatency
          };
        }
      } catch (error) {
        const latency = Date.now() - sourceStartTime;
        const errorMessage = formatError(error);
        
        console.error(`❌ Failed to get price from ${source.name} for ${request.symbol}:`, errorMessage);
        
        // Update source statistics
        this.updateSourceStats(source.name, false, latency, errorMessage);
        this.checkCircuitBreaker(source.name);

        this.emit('sourceFailed', {
          symbol: request.symbol,
          source: source.name,
          error: errorMessage,
          latency
        });

        // Continue to next source
        continue;
      }
    }

    // All sources failed, return error response
    const totalLatency = Date.now() - startTime;
    
    console.error(`❌ All price sources failed for ${request.symbol}`);
    
    this.emit('allSourcesFailed', {
      symbol: request.symbol,
      totalLatency,
      attemptedSources: sortedSources.map(s => s.name)
    });

    return {
      data: null,
      source: 'none',
      fromCache: false,
      latency: totalLatency,
      error: 'All price sources failed'
    };
  }

  /**
   * Fetch price from a specific source
   */
  private async fetchPriceFromSource(sourceName: string, request: PriceRequest): Promise<PriceResponse> {
    const startTime = Date.now();

    switch (sourceName) {
      case 'chainlink':
        if (!this.realTimePriceFeedManager) {
          throw new Error('Real-time price feed manager not available');
        }
        
        const chainlinkPrice = await this.realTimePriceFeedManager.getChainlinkPriceRealTime(request.symbol);
        
        return {
          data: chainlinkPrice,
          source: 'chainlink',
          fromCache: false,
          latency: Date.now() - startTime
        };

      case 'redis_cache':
        if (!this.redisPriceCache) {
          throw new Error('Redis cache not available');
        }

        const cachedPrice = await this.redisPriceCache.getCachedPrice(request.symbol);
        
        if (!cachedPrice) {
          throw new Error('No cached price available');
        }

        // Check if cached price meets freshness requirements
        if (request.requiredFreshness && cachedPrice.staleness > request.requiredFreshness) {
          throw new Error(`Cached price too stale: ${cachedPrice.staleness}s > ${request.requiredFreshness}s`);
        }

        return {
          data: cachedPrice,
          source: 'redis_cache',
          fromCache: true,
          latency: Date.now() - startTime
        };

      case 'dex_aggregator':
        if (!this.realTimePriceFeedManager) {
          throw new Error('Real-time price feed manager not available');
        }

        const dexPrice = await this.realTimePriceFeedManager.getTokenPriceFromDEX(request.symbol);
        
        return {
          data: dexPrice,
          source: 'dex_aggregator',
          fromCache: false,
          latency: Date.now() - startTime
        };

      case 'coingecko':
        if (!this.realMarketDataService) {
          throw new Error('Real market data service not available');
        }

        const coinGeckoPrice = await this.realMarketDataService.getRealTimePriceFromCoinGecko(request.symbol);
        
        return {
          data: coinGeckoPrice,
          source: 'coingecko',
          fromCache: false,
          latency: Date.now() - startTime
        };

      case 'stale_cache':
        if (!this.redisPriceCache) {
          throw new Error('Redis cache not available');
        }

        const stalePrice = await this.redisPriceCache.getCachedPrice(request.symbol);
        
        if (!stalePrice) {
          throw new Error('No stale cached price available');
        }

        // Only use stale cache if within staleness threshold
        if (stalePrice.staleness > this.config.stalenessThreshold) {
          throw new Error(`Price too stale: ${stalePrice.staleness}s > ${this.config.stalenessThreshold}s`);
        }

        return {
          data: stalePrice,
          source: 'stale_cache',
          fromCache: true,
          latency: Date.now() - startTime
        };

      default:
        throw new Error(`Unknown price source: ${sourceName}`);
    }
  }

  /**
   * Get sorted list of healthy sources by priority
   */
  private getSortedHealthySources(): PriceSource[] {
    return Array.from(this.priceSources.values())
      .filter(source => source.isEnabled && source.isHealthy)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Update source statistics
   */
  private updateSourceStats(
    sourceName: string,
    success: boolean,
    latency: number,
    error?: string
  ): void {
    const source = this.priceSources.get(sourceName);
    if (!source) return;

    if (success) {
      source.successCount++;
      source.lastLatency = latency;
      
      // Update average latency (exponential moving average)
      if (source.averageLatency === 0) {
        source.averageLatency = latency;
      } else {
        source.averageLatency = (source.averageLatency * 0.8) + (latency * 0.2);
      }
      
      // Clear error information
      delete source.lastError;
      delete source.lastErrorTime;
    } else {
      source.failureCount++;
      source.lastError = error;
      source.lastErrorTime = getCurrentTimestamp();
    }

    // Update health status based on recent performance
    const totalRequests = source.successCount + source.failureCount;
    if (totalRequests >= 10) {
      const recentFailureRate = (source.failureCount / totalRequests) * 100;
      source.isHealthy = recentFailureRate < this.config.circuitBreakerThreshold;
    }

    this.priceSources.set(sourceName, source);
  }

  /**
   * Update source health status
   */
  private updateSourceHealth(sourceName: string, isHealthy: boolean, error?: string): void {
    const source = this.priceSources.get(sourceName);
    if (!source) return;

    source.isHealthy = isHealthy;
    
    if (!isHealthy && error) {
      source.lastError = error;
      source.lastErrorTime = getCurrentTimestamp();
    }

    this.priceSources.set(sourceName, source);
    
    this.emit('sourceHealthChanged', { sourceName, isHealthy, error });
  }

  /**
   * Check if circuit breaker should be opened
   */
  private checkCircuitBreaker(sourceName: string): void {
    const source = this.priceSources.get(sourceName);
    if (!source) return;

    const totalRequests = source.successCount + source.failureCount;
    if (totalRequests < 5) return; // Need minimum requests to evaluate

    const failureRate = (source.failureCount / totalRequests) * 100;
    
    if (failureRate >= this.config.circuitBreakerThreshold) {
      this.openCircuitBreaker(sourceName);
    }
  }

  /**
   * Open circuit breaker for a source
   */
  private openCircuitBreaker(sourceName: string): void {
    this.circuitBreakers.set(sourceName, {
      isOpen: true,
      lastFailure: getCurrentTimestamp()
    });

    console.warn(`⚡ Circuit breaker opened for ${sourceName}`);
    this.emit('circuitBreakerOpened', { sourceName });
  }

  /**
   * Close circuit breaker for a source
   */
  private closeCircuitBreaker(sourceName: string): void {
    const breaker = this.circuitBreakers.get(sourceName);
    if (breaker && breaker.isOpen) {
      this.circuitBreakers.set(sourceName, {
        isOpen: false,
        lastFailure: breaker.lastFailure
      });

      console.log(`✅ Circuit breaker closed for ${sourceName}`);
      this.emit('circuitBreakerClosed', { sourceName });
    }
  }

  /**
   * Check if circuit breaker is open for a source
   */
  private isCircuitBreakerOpen(sourceName: string): boolean {
    const breaker = this.circuitBreakers.get(sourceName);
    if (!breaker || !breaker.isOpen) {
      return false;
    }

    // Check if timeout has passed
    const timeSinceFailure = getCurrentTimestamp() - breaker.lastFailure;
    if (timeSinceFailure > this.config.circuitBreakerTimeout) {
      // Try to close the circuit breaker
      this.circuitBreakers.set(sourceName, {
        isOpen: false,
        lastFailure: breaker.lastFailure
      });
      return false;
    }

    return true;
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheckMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    console.log(`📊 Health check monitoring started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  /**
   * Perform health checks on all sources
   */
  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing health checks on price sources...');

    const healthCheckPromises = Array.from(this.priceSources.keys()).map(async (sourceName) => {
      try {
        await this.performSourceHealthCheck(sourceName);
      } catch (error) {
        console.error(`❌ Health check failed for ${sourceName}:`, formatError(error));
      }
    });

    await Promise.allSettled(healthCheckPromises);

    const healthySources = Array.from(this.priceSources.values()).filter(s => s.isHealthy).length;
    const totalSources = this.priceSources.size;

    console.log(`🏥 Health check completed: ${healthySources}/${totalSources} sources healthy`);
    
    this.emit('healthCheckCompleted', {
      healthySources,
      totalSources,
      sources: Array.from(this.priceSources.entries()).map(([name, source]) => ({
        name,
        isHealthy: source.isHealthy,
        lastError: source.lastError
      }))
    });
  }

  /**
   * Perform health check on a specific source
   */
  private async performSourceHealthCheck(sourceName: string): Promise<void> {
    const testSymbol = 'ETH'; // Use ETH as test symbol
    const testRequest: PriceRequest = {
      symbol: testSymbol,
      requestId: `health_check_${sourceName}_${Date.now()}`,
      timestamp: getCurrentTimestamp(),
      requiredFreshness: sourceName === 'stale_cache' ? undefined : 300 // 5 minutes for non-stale sources
    };

    try {
      const response = await this.fetchPriceFromSource(sourceName, testRequest);
      
      if (response.data && response.data.priceUSD > 0) {
        this.updateSourceHealth(sourceName, true);
        console.log(`✅ Health check passed for ${sourceName}: $${response.data.priceUSD.toFixed(2)}`);
      } else {
        this.updateSourceHealth(sourceName, false, 'Invalid price data returned');
      }
    } catch (error) {
      this.updateSourceHealth(sourceName, false, formatError(error));
    }
  }

  /**
   * Get failover manager status
   */
  public getFailoverStatus(): {
    isInitialized: boolean;
    totalSources: number;
    healthySources: number;
    enabledSources: number;
    circuitBreakersOpen: number;
    sources: Array<{
      name: string;
      priority: number;
      isHealthy: boolean;
      isEnabled: boolean;
      successCount: number;
      failureCount: number;
      averageLatency: number;
      lastError?: string;
      circuitBreakerOpen: boolean;
    }>;
  } {
    const sources = Array.from(this.priceSources.entries()).map(([name, source]) => ({
      name,
      priority: source.priority,
      isHealthy: source.isHealthy,
      isEnabled: source.isEnabled,
      successCount: source.successCount,
      failureCount: source.failureCount,
      averageLatency: Math.round(source.averageLatency),
      lastError: source.lastError,
      circuitBreakerOpen: this.isCircuitBreakerOpen(name)
    }));

    return {
      isInitialized: this.isInitialized,
      totalSources: this.priceSources.size,
      healthySources: sources.filter(s => s.isHealthy).length,
      enabledSources: sources.filter(s => s.isEnabled).length,
      circuitBreakersOpen: sources.filter(s => s.circuitBreakerOpen).length,
      sources
    };
  }

  /**
   * Enable or disable a price source
   */
  public setSourceEnabled(sourceName: string, enabled: boolean): void {
    const source = this.priceSources.get(sourceName);
    if (!source) {
      throw new Error(`Unknown price source: ${sourceName}`);
    }

    source.isEnabled = enabled;
    this.priceSources.set(sourceName, source);

    console.log(`${enabled ? '✅' : '🚫'} Price source ${sourceName} ${enabled ? 'enabled' : 'disabled'}`);
    
    this.emit('sourceEnabledChanged', { sourceName, enabled });
  }

  /**
   * Reset statistics for a source
   */
  public resetSourceStats(sourceName: string): void {
    const source = this.priceSources.get(sourceName);
    if (!source) {
      throw new Error(`Unknown price source: ${sourceName}`);
    }

    source.successCount = 0;
    source.failureCount = 0;
    source.averageLatency = 0;
    source.lastLatency = 0;
    delete source.lastError;
    delete source.lastErrorTime;

    this.priceSources.set(sourceName, source);
    this.closeCircuitBreaker(sourceName);

    console.log(`📊 Statistics reset for price source ${sourceName}`);
    
    this.emit('sourceStatsReset', { sourceName });
  }

  /**
   * Stop the failover manager
   */
  public async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.isInitialized = false;
    console.log('🛑 Price Feed Failover Manager stopped');
    
    this.emit('stopped');
  }

  /**
   * Ensure the manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Price Feed Failover Manager not initialized. Call initialize() first.');
    }
  }
}

// Export configuration factory
export function createFailoverConfig(): FailoverConfig {
  return {
    maxRetries: parseInt(process.env.PRICE_FAILOVER_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.PRICE_FAILOVER_RETRY_DELAY || '1000'),
    healthCheckInterval: parseInt(process.env.PRICE_FAILOVER_HEALTH_CHECK_INTERVAL || '30000'),
    circuitBreakerThreshold: parseInt(process.env.PRICE_FAILOVER_CIRCUIT_BREAKER_THRESHOLD || '80'),
    circuitBreakerTimeout: parseInt(process.env.PRICE_FAILOVER_CIRCUIT_BREAKER_TIMEOUT || '60000'),
    stalenessThreshold: parseInt(process.env.PRICE_FAILOVER_STALENESS_THRESHOLD || '300')
  };
}