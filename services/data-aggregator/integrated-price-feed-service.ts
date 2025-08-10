// Integrated Price Feed Service
// Combines all price feed components: real-time feeds, caching, failover, and volatility monitoring
// Implements tasks 6.1 and 6.2 with unified interface

import { EventEmitter } from 'events';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { 
  RealTimePriceFeedManager, 
  RealTimePriceData, 
  getRealTimePriceFeedManager 
} from './real-time-price-feed-manager';
import { 
  RedisPriceCache, 
  createRedisCacheConfig, 
  CacheStats 
} from './redis-price-cache';
import { 
  PriceFeedFailoverManager, 
  createFailoverConfig, 
  PriceRequest, 
  PriceResponse 
} from './price-feed-failover';
import { 
  PriceVolatilityMonitor, 
  createVolatilityConfig, 
  VolatilityData, 
  VolatilityAlert 
} from './price-volatility-monitor';

export interface IntegratedPriceFeedConfig {
  enableRedisCache: boolean;
  enableFailover: boolean;
  enableVolatilityMonitoring: boolean;
  defaultFreshnessTolerance: number; // seconds
  batchUpdateInterval: number; // milliseconds
  supportedTokens: string[];
}

export interface PriceFeedStatus {
  isInitialized: boolean;
  realTimeFeedStatus: any;
  cacheStatus?: CacheStats;
  failoverStatus?: any;
  volatilityStatus?: any;
  lastUpdate: number;
  supportedTokens: string[];
  activeSubscriptions: number;
}

export interface BatchPriceRequest {
  symbols: string[];
  requestId?: string;
  requiredFreshness?: number;
  includeVolatility?: boolean;
}

export interface BatchPriceResponse {
  prices: Map<string, RealTimePriceData>;
  volatility?: Map<string, VolatilityData>;
  errors: Map<string, string>;
  fromCache: Map<string, boolean>;
  totalLatency: number;
  requestId?: string;
}

export interface PriceSubscriptionOptions {
  includeVolatility?: boolean;
  volatilityAlerts?: boolean;
  priceChangeThreshold?: number; // percentage
}

/**
 * Integrated Price Feed Service
 * Unified interface for all price feed functionality with real-time updates, caching, failover, and monitoring
 */
export class IntegratedPriceFeedService extends EventEmitter {
  private realTimePriceFeedManager: RealTimePriceFeedManager | null = null;
  private redisPriceCache: RedisPriceCache | null = null;
  private failoverManager: PriceFeedFailoverManager | null = null;
  private volatilityMonitor: PriceVolatilityMonitor | null = null;
  private config: IntegratedPriceFeedConfig;
  private isInitialized = false;
  private batchUpdateInterval: NodeJS.Timeout | null = null;
  private activeSubscriptions: Map<string, any> = new Map();

  // Default configuration
  private readonly DEFAULT_CONFIG: IntegratedPriceFeedConfig = {
    enableRedisCache: true,
    enableFailover: true,
    enableVolatilityMonitoring: true,
    defaultFreshnessTolerance: 300, // 5 minutes
    batchUpdateInterval: 60000, // 1 minute
    supportedTokens: ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE']
  };

  constructor(config?: Partial<IntegratedPriceFeedConfig>) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the integrated price feed service
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Integrated Price Feed Service...');

      // Initialize real-time price feed manager
      this.realTimePriceFeedManager = await getRealTimePriceFeedManager();
      console.log('✅ Real-time price feed manager initialized');

      // Initialize Redis cache if enabled
      if (this.config.enableRedisCache) {
        try {
          const cacheConfig = createRedisCacheConfig();
          this.redisPriceCache = new RedisPriceCache(cacheConfig);
          await this.redisPriceCache.initialize();
          
          // Set up cache event handlers
          this.setupCacheEventHandlers();
          
          console.log('✅ Redis price cache initialized');
        } catch (error) {
          console.warn('⚠️ Redis cache initialization failed, continuing without cache:', formatError(error));
          this.config.enableRedisCache = false;
        }
      }

      // Initialize failover manager if enabled
      if (this.config.enableFailover) {
        try {
          const failoverConfig = createFailoverConfig();
          this.failoverManager = new PriceFeedFailoverManager(failoverConfig);
          await this.failoverManager.initialize(this.realTimePriceFeedManager, this.redisPriceCache || undefined);
          
          // Set up failover event handlers
          this.setupFailoverEventHandlers();
          
          console.log('✅ Price feed failover manager initialized');
        } catch (error) {
          console.warn('⚠️ Failover manager initialization failed, continuing without failover:', formatError(error));
          this.config.enableFailover = false;
        }
      }

      // Initialize volatility monitor if enabled
      if (this.config.enableVolatilityMonitoring) {
        try {
          const volatilityConfig = createVolatilityConfig();
          this.volatilityMonitor = new PriceVolatilityMonitor(volatilityConfig);
          this.volatilityMonitor.startMonitoring();
          
          // Set up volatility event handlers
          this.setupVolatilityEventHandlers();
          
          console.log('✅ Price volatility monitor initialized');
        } catch (error) {
          console.warn('⚠️ Volatility monitor initialization failed, continuing without monitoring:', formatError(error));
          this.config.enableVolatilityMonitoring = false;
        }
      }

      // Set up real-time price feed event handlers
      this.setupRealTimeFeedEventHandlers();

      // Start batch price updates
      this.startBatchUpdates();

      this.isInitialized = true;
      console.log('🎉 Integrated Price Feed Service initialized successfully');
      
      this.emit('initialized', this.getServiceStatus());
    } catch (error) {
      console.error('❌ Failed to initialize Integrated Price Feed Service:', formatError(error));
      throw error;
    }
  }

  /**
   * Get real-time price with full integration (failover, caching, volatility)
   */
  public async getPrice(symbol: string, requiredFreshness?: number): Promise<RealTimePriceData> {
    this.ensureInitialized();

    const request: PriceRequest = {
      symbol: symbol.toUpperCase(),
      requestId: `price_${symbol}_${Date.now()}`,
      timestamp: getCurrentTimestamp(),
      requiredFreshness: requiredFreshness || this.config.defaultFreshnessTolerance
    };

    try {
      let priceData: RealTimePriceData;

      if (this.config.enableFailover && this.failoverManager) {
        // Use failover manager for robust price fetching
        const response = await this.failoverManager.getPriceWithFailover(request);
        
        if (!response.data) {
          throw new Error(response.error || 'Failed to get price from all sources');
        }
        
        priceData = response.data;
        
        console.log(`💲 Retrieved price for ${symbol} via failover: $${priceData.priceUSD.toFixed(2)} (source: ${response.source})`);
      } else {
        // Direct fetch from real-time manager
        priceData = await this.realTimePriceFeedManager!.getChainlinkPriceRealTime(symbol);
        
        console.log(`💲 Retrieved price for ${symbol} directly: $${priceData.priceUSD.toFixed(2)}`);
      }

      // Cache the price if caching is enabled
      if (this.config.enableRedisCache && this.redisPriceCache) {
        try {
          await this.redisPriceCache.cachePrice(symbol, priceData);
        } catch (cacheError) {
          console.warn(`⚠️ Failed to cache price for ${symbol}:`, formatError(cacheError));
        }
      }

      // Add to volatility monitoring if enabled
      if (this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
        this.volatilityMonitor.addPriceData(symbol, priceData);
      }

      this.emit('priceRetrieved', { symbol, priceData });
      
      return priceData;
    } catch (error) {
      console.error(`❌ Failed to get price for ${symbol}:`, formatError(error));
      this.emit('priceError', { symbol, error: formatError(error) });
      throw error;
    }
  }

  /**
   * Get multiple prices in batch with optimization
   */
  public async getBatchPrices(request: BatchPriceRequest): Promise<BatchPriceResponse> {
    this.ensureInitialized();

    const startTime = Date.now();
    const response: BatchPriceResponse = {
      prices: new Map(),
      volatility: request.includeVolatility ? new Map() : undefined,
      errors: new Map(),
      fromCache: new Map(),
      totalLatency: 0,
      requestId: request.requestId
    };

    console.log(`📦 Batch price request for ${request.symbols.length} tokens`);

    // Try to get cached prices first if caching is enabled
    if (this.config.enableRedisCache && this.redisPriceCache) {
      try {
        const cachedPrices = await this.redisPriceCache.getBatchCachedPrices(request.symbols);
        
        for (const [symbol, cachedPrice] of cachedPrices.entries()) {
          if (cachedPrice && (!request.requiredFreshness || cachedPrice.staleness <= request.requiredFreshness)) {
            response.prices.set(symbol, cachedPrice);
            response.fromCache.set(symbol, true);
            
            // Add to volatility monitoring
            if (this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
              this.volatilityMonitor.addPriceData(symbol, cachedPrice);
            }
          }
        }
        
        console.log(`📦 Retrieved ${response.prices.size}/${request.symbols.length} prices from cache`);
      } catch (cacheError) {
        console.warn('⚠️ Batch cache lookup failed:', formatError(cacheError));
      }
    }

    // Fetch remaining prices that weren't cached or were stale
    const remainingSymbols = request.symbols.filter(symbol => !response.prices.has(symbol));
    
    if (remainingSymbols.length > 0) {
      console.log(`🔄 Fetching ${remainingSymbols.length} prices from live sources`);

      const fetchPromises = remainingSymbols.map(async (symbol) => {
        try {
          const priceData = await this.getPrice(symbol, request.requiredFreshness);
          response.prices.set(symbol, priceData);
          response.fromCache.set(symbol, false);
        } catch (error) {
          response.errors.set(symbol, formatError(error));
        }
      });

      await Promise.allSettled(fetchPromises);
    }

    // Get volatility data if requested
    if (request.includeVolatility && this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
      for (const symbol of request.symbols) {
        const volatilityData = this.volatilityMonitor.getVolatilityData(symbol);
        if (volatilityData) {
          response.volatility!.set(symbol, volatilityData);
        }
      }
    }

    response.totalLatency = Date.now() - startTime;
    
    console.log(`✅ Batch price request completed: ${response.prices.size} prices, ${response.errors.size} errors (${response.totalLatency}ms)`);
    
    this.emit('batchPricesRetrieved', {
      requestId: request.requestId,
      totalSymbols: request.symbols.length,
      successCount: response.prices.size,
      errorCount: response.errors.size,
      latency: response.totalLatency
    });

    return response;
  }

  /**
   * Subscribe to real-time price updates with integrated features
   */
  public async subscribeToPrice(
    symbol: string,
    callback: (data: { price: RealTimePriceData; volatility?: VolatilityData }) => void,
    options?: PriceSubscriptionOptions
  ): Promise<string> {
    this.ensureInitialized();

    const subscriptionId = `integrated_${symbol}_${Date.now()}`;

    try {
      // Subscribe to real-time price updates
      const realTimeSubscriptionId = await this.realTimePriceFeedManager!.subscribeToRealTimePriceUpdates(
        symbol,
        (priceData: RealTimePriceData) => {
          // Cache the price
          if (this.config.enableRedisCache && this.redisPriceCache) {
            this.redisPriceCache.cachePrice(symbol, priceData).catch(error => {
              console.warn(`⚠️ Failed to cache price update for ${symbol}:`, formatError(error));
            });
          }

          // Add to volatility monitoring
          if (this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
            this.volatilityMonitor.addPriceData(symbol, priceData);
          }

          // Prepare callback data
          const callbackData: { price: RealTimePriceData; volatility?: VolatilityData } = {
            price: priceData
          };

          // Include volatility data if requested
          if (options?.includeVolatility && this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
            const volatilityData = this.volatilityMonitor.getVolatilityData(symbol);
            if (volatilityData) {
              callbackData.volatility = volatilityData;
            }
          }

          // Check price change threshold if specified
          if (options?.priceChangeThreshold) {
            const volatilityData = callbackData.volatility || 
              (this.volatilityMonitor ? this.volatilityMonitor.getVolatilityData(symbol) : null);
            
            if (volatilityData && Math.abs(volatilityData.priceChange24h) >= options.priceChangeThreshold) {
              this.emit('significantPriceChange', {
                symbol,
                priceChange: volatilityData.priceChange24h,
                threshold: options.priceChangeThreshold,
                priceData
              });
            }
          }

          callback(callbackData);
        }
      );

      // Store subscription info
      this.activeSubscriptions.set(subscriptionId, {
        symbol,
        realTimeSubscriptionId,
        callback,
        options,
        createdAt: getCurrentTimestamp()
      });

      console.log(`📡 Subscribed to integrated price updates for ${symbol} (ID: ${subscriptionId})`);
      
      this.emit('subscriptionCreated', { symbol, subscriptionId, options });

      return subscriptionId;
    } catch (error) {
      console.error(`❌ Failed to subscribe to price updates for ${symbol}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Unsubscribe from price updates
   */
  public async unsubscribeFromPrice(subscriptionId: string): Promise<void> {
    this.ensureInitialized();

    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    try {
      // Unsubscribe from real-time updates
      await this.realTimePriceFeedManager!.unsubscribeFromPriceUpdates(subscription.realTimeSubscriptionId);

      // Remove from active subscriptions
      this.activeSubscriptions.delete(subscriptionId);

      console.log(`🚫 Unsubscribed from integrated price updates (ID: ${subscriptionId})`);
      
      this.emit('subscriptionRemoved', { subscriptionId });
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from price updates (ID: ${subscriptionId}):`, formatError(error));
      throw error;
    }
  }

  /**
   * Convert token amount to USD using integrated price feeds
   */
  public async convertToUSD(
    tokenSymbol: string,
    amount: string,
    decimals: number = 18
  ): Promise<number> {
    this.ensureInitialized();

    try {
      const priceData = await this.getPrice(tokenSymbol);
      const tokenAmount = parseFloat(amount) / Math.pow(10, decimals);
      const usdValue = tokenAmount * priceData.priceUSD;

      console.log(`💰 Converted ${tokenAmount} ${tokenSymbol} to $${usdValue.toFixed(2)}`);
      
      this.emit('conversionCompleted', {
        tokenSymbol,
        tokenAmount,
        usdValue,
        priceUSD: priceData.priceUSD
      });

      return usdValue;
    } catch (error) {
      console.error(`❌ Failed to convert ${tokenSymbol} to USD:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get comprehensive service status
   */
  public getServiceStatus(): PriceFeedStatus {
    const status: PriceFeedStatus = {
      isInitialized: this.isInitialized,
      realTimeFeedStatus: this.realTimePriceFeedManager?.getServiceStatus() || null,
      lastUpdate: 0,
      supportedTokens: this.config.supportedTokens,
      activeSubscriptions: this.activeSubscriptions.size
    };

    // Add cache status if enabled
    if (this.config.enableRedisCache && this.redisPriceCache) {
      this.redisPriceCache.getCacheStats().then(stats => {
        status.cacheStatus = stats;
      }).catch(() => {
        // Ignore cache stats errors
      });
    }

    // Add failover status if enabled
    if (this.config.enableFailover && this.failoverManager) {
      status.failoverStatus = this.failoverManager.getFailoverStatus();
    }

    // Add volatility status if enabled
    if (this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
      status.volatilityStatus = this.volatilityMonitor.getMonitoringStats();
    }

    // Calculate last update time
    if (status.realTimeFeedStatus?.lastUpdate) {
      status.lastUpdate = status.realTimeFeedStatus.lastUpdate;
    }

    return status;
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      const healthChecks: any = {
        realTimeFeed: null,
        cache: null,
        failover: null,
        volatility: null
      };

      // Check real-time feed
      if (this.realTimePriceFeedManager) {
        healthChecks.realTimeFeed = await this.realTimePriceFeedManager.performHealthCheck();
      }

      // Check cache
      if (this.config.enableRedisCache && this.redisPriceCache) {
        healthChecks.cache = await this.redisPriceCache.performHealthCheck();
      }

      // Check failover (basic status check)
      if (this.config.enableFailover && this.failoverManager) {
        const failoverStatus = this.failoverManager.getFailoverStatus();
        healthChecks.failover = {
          status: failoverStatus.healthySources > 0 ? 'healthy' : 'unhealthy',
          details: failoverStatus
        };
      }

      // Check volatility monitoring
      if (this.config.enableVolatilityMonitoring && this.volatilityMonitor) {
        const volatilityStats = this.volatilityMonitor.getMonitoringStats();
        healthChecks.volatility = {
          status: volatilityStats.isMonitoring ? 'healthy' : 'unhealthy',
          details: volatilityStats
        };
      }

      // Determine overall health
      const componentStatuses = Object.values(healthChecks)
        .filter(check => check !== null)
        .map(check => check.status);

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (componentStatuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (componentStatuses.includes('degraded')) {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        details: {
          ...healthChecks,
          serviceStatus: this.getServiceStatus(),
          lastHealthCheck: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: formatError(error),
          lastHealthCheck: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Start batch price updates for supported tokens
   */
  private startBatchUpdates(): void {
    this.batchUpdateInterval = setInterval(async () => {
      try {
        const batchRequest: BatchPriceRequest = {
          symbols: this.config.supportedTokens,
          requestId: `batch_update_${Date.now()}`,
          includeVolatility: this.config.enableVolatilityMonitoring
        };

        const response = await this.getBatchPrices(batchRequest);
        
        console.log(`🔄 Batch update completed: ${response.prices.size}/${this.config.supportedTokens.length} prices updated`);
        
        this.emit('batchUpdateCompleted', {
          successCount: response.prices.size,
          errorCount: response.errors.size,
          totalTokens: this.config.supportedTokens.length
        });
      } catch (error) {
        console.error('❌ Batch update failed:', formatError(error));
        this.emit('batchUpdateError', { error: formatError(error) });
      }
    }, this.config.batchUpdateInterval);

    console.log(`⏰ Batch price updates started (interval: ${this.config.batchUpdateInterval}ms)`);
  }

  /**
   * Set up event handlers for real-time price feed
   */
  private setupRealTimeFeedEventHandlers(): void {
    if (!this.realTimePriceFeedManager) return;

    this.realTimePriceFeedManager.on('priceUpdated', (data) => {
      this.emit('realTimePriceUpdate', data);
    });

    this.realTimePriceFeedManager.on('subscriptionError', (data) => {
      this.emit('subscriptionError', data);
    });
  }

  /**
   * Set up event handlers for cache
   */
  private setupCacheEventHandlers(): void {
    if (!this.redisPriceCache) return;

    this.redisPriceCache.on('priceStale', (data) => {
      this.emit('priceStale', data);
    });

    this.redisPriceCache.on('stalePricesDetected', (data) => {
      this.emit('stalePricesDetected', data);
    });
  }

  /**
   * Set up event handlers for failover manager
   */
  private setupFailoverEventHandlers(): void {
    if (!this.failoverManager) return;

    this.failoverManager.on('sourceFailed', (data) => {
      this.emit('priceFeedSourceFailed', data);
    });

    this.failoverManager.on('circuitBreakerOpened', (data) => {
      this.emit('circuitBreakerOpened', data);
    });

    this.failoverManager.on('allSourcesFailed', (data) => {
      this.emit('allPriceFeedSourcesFailed', data);
    });
  }

  /**
   * Set up event handlers for volatility monitor
   */
  private setupVolatilityEventHandlers(): void {
    if (!this.volatilityMonitor) return;

    this.volatilityMonitor.on('volatilityAlert', (alert: VolatilityAlert) => {
      this.emit('volatilityAlert', alert);
    });

    this.volatilityMonitor.on('volatilityCalculated', (data) => {
      this.emit('volatilityCalculated', data);
    });
  }

  /**
   * Stop the integrated service
   */
  public async stop(): Promise<void> {
    try {
      // Stop batch updates
      if (this.batchUpdateInterval) {
        clearInterval(this.batchUpdateInterval);
        this.batchUpdateInterval = null;
      }

      // Unsubscribe from all active subscriptions
      const subscriptionIds = Array.from(this.activeSubscriptions.keys());
      for (const subscriptionId of subscriptionIds) {
        try {
          await this.unsubscribeFromPrice(subscriptionId);
        } catch (error) {
          console.error(`❌ Error unsubscribing ${subscriptionId}:`, formatError(error));
        }
      }

      // Stop components
      if (this.volatilityMonitor) {
        this.volatilityMonitor.stopMonitoring();
      }

      if (this.failoverManager) {
        await this.failoverManager.stop();
      }

      if (this.redisPriceCache) {
        await this.redisPriceCache.disconnect();
      }

      if (this.realTimePriceFeedManager) {
        await this.realTimePriceFeedManager.stop();
      }

      this.isInitialized = false;
      console.log('🛑 Integrated Price Feed Service stopped');
      
      this.emit('stopped');
    } catch (error) {
      console.error('❌ Error stopping Integrated Price Feed Service:', formatError(error));
      throw error;
    }
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Integrated Price Feed Service not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance
let integratedPriceFeedServiceInstance: IntegratedPriceFeedService | null = null;

export async function getIntegratedPriceFeedService(
  config?: Partial<IntegratedPriceFeedConfig>
): Promise<IntegratedPriceFeedService> {
  if (!integratedPriceFeedServiceInstance) {
    integratedPriceFeedServiceInstance = new IntegratedPriceFeedService(config);
    await integratedPriceFeedServiceInstance.initialize();
  }
  return integratedPriceFeedServiceInstance;
}

// Export configuration factory
export function createIntegratedPriceFeedConfig(): IntegratedPriceFeedConfig {
  return {
    enableRedisCache: process.env.ENABLE_REDIS_CACHE !== 'false',
    enableFailover: process.env.ENABLE_PRICE_FAILOVER !== 'false',
    enableVolatilityMonitoring: process.env.ENABLE_VOLATILITY_MONITORING !== 'false',
    defaultFreshnessTolerance: parseInt(process.env.DEFAULT_FRESHNESS_TOLERANCE || '300'),
    batchUpdateInterval: parseInt(process.env.BATCH_UPDATE_INTERVAL || '60000'),
    supportedTokens: (process.env.SUPPORTED_TOKENS || 'ETH,BTC,USDC,USDT,DAI,LINK,UNI,AAVE').split(',')
  };
}