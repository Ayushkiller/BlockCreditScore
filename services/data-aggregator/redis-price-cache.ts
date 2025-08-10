// Redis-based Price Caching System
// Implements task 6.2: Build real price monitoring and caching system

import { EventEmitter } from 'events';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { RealTimePriceData } from './real-time-price-feed-manager';

export interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  defaultTTL: number; // seconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface CacheEntry {
  data: RealTimePriceData;
  cachedAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageLatency: number;
  memoryUsage: number;
  stalePrices: number;
}

export interface PriceStalenessConfig {
  maxAge: Record<string, number>; // seconds for different sources
  warningThreshold: number; // seconds
  errorThreshold: number; // seconds
}

/**
 * Redis-based Price Caching System
 * Provides high-performance caching with TTL, staleness detection, and failover
 */
export class RedisPriceCache extends EventEmitter {
  private redisClient: any = null;
  private isConnected = false;
  private config: RedisCacheConfig;
  private stalenessConfig: PriceStalenessConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    latencySum: 0,
    lastReset: getCurrentTimestamp()
  };

  // Default staleness configuration
  private readonly DEFAULT_STALENESS_CONFIG: PriceStalenessConfig = {
    maxAge: {
      'chainlink': 3600, // 1 hour for Chainlink
      'dex_aggregator': 300, // 5 minutes for DEX
      'coingecko': 600 // 10 minutes for CoinGecko
    },
    warningThreshold: 1800, // 30 minutes
    errorThreshold: 7200 // 2 hours
  };

  constructor(config: RedisCacheConfig, stalenessConfig?: PriceStalenessConfig) {
    super();
    this.config = config;
    this.stalenessConfig = stalenessConfig || this.DEFAULT_STALENESS_CONFIG;
  }

  /**
   * Initialize Redis connection
   */
  public async initialize(): Promise<void> {
    try {
      // Use dynamic import for Redis to avoid bundling issues
      const Redis = (await import('ioredis')).default;

      this.redisClient = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryDelayOnFailover: this.config.retryDelay,
        maxRetriesPerRequest: this.config.maxRetries,
        lazyConnect: true,
        keyPrefix: this.config.keyPrefix
      });

      // Set up event handlers
      this.redisClient.on('connect', () => {
        console.log('✅ Redis price cache connected');
        this.isConnected = true;
        this.emit('connected');
      });

      this.redisClient.on('error', (error: Error) => {
        console.error('❌ Redis price cache error:', formatError(error));
        this.isConnected = false;
        this.emit('error', error);
      });

      this.redisClient.on('close', () => {
        console.log('🔌 Redis price cache disconnected');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.redisClient.on('reconnecting', () => {
        console.log('🔄 Redis price cache reconnecting...');
        this.emit('reconnecting');
      });

      // Connect to Redis
      await this.redisClient.connect();

      console.log('🚀 Redis Price Cache initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Redis Price Cache:', formatError(error));
      throw error;
    }
  }

  /**
   * Cache price data with TTL and staleness detection
   */
  public async cachePrice(symbol: string, priceData: RealTimePriceData, customTTL?: number): Promise<void> {
    this.ensureConnected();

    const startTime = Date.now();

    try {
      const cacheEntry: CacheEntry = {
        data: priceData,
        cachedAt: getCurrentTimestamp(),
        ttl: customTTL || this.calculateTTL(priceData.source),
        accessCount: 0,
        lastAccessed: getCurrentTimestamp()
      };

      const key = this.buildCacheKey(symbol);
      const value = JSON.stringify(cacheEntry);
      const ttlSeconds = Math.floor(cacheEntry.ttl / 1000);

      // Use Redis SETEX for atomic set with TTL
      await this.redisClient.setex(key, ttlSeconds, value);

      // Update staleness monitoring
      await this.updateStalenessMonitoring(symbol, priceData);

      const latency = Date.now() - startTime;
      this.updateLatencyStats(latency);

      console.log(`💾 Cached price for ${symbol}: $${priceData.priceUSD.toFixed(2)} (TTL: ${ttlSeconds}s)`);
      
      this.emit('priceCached', { symbol, priceData, ttl: ttlSeconds });
    } catch (error) {
      console.error(`❌ Failed to cache price for ${symbol}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get cached price with staleness detection
   */
  public async getCachedPrice(symbol: string): Promise<RealTimePriceData | null> {
    this.ensureConnected();

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const key = this.buildCacheKey(symbol);
      const cachedValue = await this.redisClient.get(key);

      if (!cachedValue) {
        this.stats.misses++;
        const latency = Date.now() - startTime;
        this.updateLatencyStats(latency);
        
        console.log(`❌ Cache miss for ${symbol}`);
        this.emit('cacheMiss', { symbol });
        return null;
      }

      const cacheEntry: CacheEntry = JSON.parse(cachedValue);
      
      // Update access statistics
      cacheEntry.accessCount++;
      cacheEntry.lastAccessed = getCurrentTimestamp();
      
      // Update the cache entry with new access stats (fire and forget)
      this.redisClient.set(key, JSON.stringify(cacheEntry)).catch(error => {
        console.error(`Warning: Failed to update access stats for ${symbol}:`, formatError(error));
      });

      // Check for staleness
      const staleness = this.calculateStaleness(cacheEntry.data);
      const stalenessStatus = this.evaluateStaleness(cacheEntry.data.source, staleness);

      if (stalenessStatus === 'error') {
        console.warn(`⚠️ Price data for ${symbol} is critically stale (${staleness}s old)`);
        this.emit('priceStale', { symbol, staleness, level: 'error' });
      } else if (stalenessStatus === 'warning') {
        console.warn(`⚠️ Price data for ${symbol} is getting stale (${staleness}s old)`);
        this.emit('priceStale', { symbol, staleness, level: 'warning' });
      }

      // Update staleness in the returned data
      const priceData = {
        ...cacheEntry.data,
        staleness
      };

      this.stats.hits++;
      const latency = Date.now() - startTime;
      this.updateLatencyStats(latency);

      console.log(`✅ Cache hit for ${symbol}: $${priceData.priceUSD.toFixed(2)} (${staleness}s old)`);
      
      this.emit('cacheHit', { symbol, priceData, staleness });
      return priceData;
    } catch (error) {
      console.error(`❌ Failed to get cached price for ${symbol}:`, formatError(error));
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Get multiple cached prices in batch
   */
  public async getBatchCachedPrices(symbols: string[]): Promise<Map<string, RealTimePriceData | null>> {
    this.ensureConnected();

    const results = new Map<string, RealTimePriceData | null>();

    if (symbols.length === 0) {
      return results;
    }

    try {
      const keys = symbols.map(symbol => this.buildCacheKey(symbol));
      const cachedValues = await this.redisClient.mget(...keys);

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const cachedValue = cachedValues[i];

        if (cachedValue) {
          try {
            const cacheEntry: CacheEntry = JSON.parse(cachedValue);
            const staleness = this.calculateStaleness(cacheEntry.data);
            
            const priceData = {
              ...cacheEntry.data,
              staleness
            };

            results.set(symbol, priceData);
            this.stats.hits++;
          } catch (parseError) {
            console.error(`❌ Failed to parse cached data for ${symbol}:`, formatError(parseError));
            results.set(symbol, null);
            this.stats.misses++;
          }
        } else {
          results.set(symbol, null);
          this.stats.misses++;
        }

        this.stats.totalRequests++;
      }

      console.log(`📦 Batch cache lookup: ${this.stats.hits}/${symbols.length} hits`);
      
      this.emit('batchCacheResult', { 
        symbols, 
        hits: Array.from(results.values()).filter(v => v !== null).length,
        total: symbols.length 
      });

      return results;
    } catch (error) {
      console.error('❌ Failed to get batch cached prices:', formatError(error));
      
      // Return empty results for all symbols
      symbols.forEach(symbol => {
        results.set(symbol, null);
        this.stats.misses++;
        this.stats.totalRequests++;
      });

      return results;
    }
  }

  /**
   * Check if cached price exists and is fresh
   */
  public async isPriceFresh(symbol: string): Promise<boolean> {
    this.ensureConnected();

    try {
      const cachedPrice = await this.getCachedPrice(symbol);
      
      if (!cachedPrice) {
        return false;
      }

      const staleness = cachedPrice.staleness || 0;
      const maxAge = this.stalenessConfig.maxAge[cachedPrice.source] || 3600;
      
      return staleness < maxAge;
    } catch (error) {
      console.error(`❌ Failed to check price freshness for ${symbol}:`, formatError(error));
      return false;
    }
  }

  /**
   * Get all stale prices that need updating
   */
  public async getStalePrices(): Promise<Array<{ symbol: string; staleness: number; level: 'warning' | 'error' }>> {
    this.ensureConnected();

    try {
      const pattern = this.buildCacheKey('*');
      const keys = await this.redisClient.keys(pattern);
      const stalePrices: Array<{ symbol: string; staleness: number; level: 'warning' | 'error' }> = [];

      if (keys.length === 0) {
        return stalePrices;
      }

      const cachedValues = await this.redisClient.mget(...keys);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const cachedValue = cachedValues[i];

        if (cachedValue) {
          try {
            const cacheEntry: CacheEntry = JSON.parse(cachedValue);
            const staleness = this.calculateStaleness(cacheEntry.data);
            const stalenessStatus = this.evaluateStaleness(cacheEntry.data.source, staleness);

            if (stalenessStatus === 'warning' || stalenessStatus === 'error') {
              const symbol = this.extractSymbolFromKey(key);
              stalePrices.push({
                symbol,
                staleness,
                level: stalenessStatus
              });
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse cached data for key ${key}:`, formatError(parseError));
          }
        }
      }

      if (stalePrices.length > 0) {
        console.log(`⚠️ Found ${stalePrices.length} stale prices`);
        this.emit('stalePricesDetected', stalePrices);
      }

      return stalePrices;
    } catch (error) {
      console.error('❌ Failed to get stale prices:', formatError(error));
      return [];
    }
  }

  /**
   * Clear stale prices from cache
   */
  public async clearStalePrices(): Promise<number> {
    this.ensureConnected();

    try {
      const stalePrices = await this.getStalePrices();
      const errorLevelPrices = stalePrices.filter(p => p.level === 'error');

      if (errorLevelPrices.length === 0) {
        return 0;
      }

      const keysToDelete = errorLevelPrices.map(p => this.buildCacheKey(p.symbol));
      const deletedCount = await this.redisClient.del(...keysToDelete);

      console.log(`🧹 Cleared ${deletedCount} critically stale prices from cache`);
      
      this.emit('stalePricesCleared', { count: deletedCount, symbols: errorLevelPrices.map(p => p.symbol) });

      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to clear stale prices:', formatError(error));
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<CacheStats> {
    this.ensureConnected();

    try {
      const info = await this.redisClient.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      const pattern = this.buildCacheKey('*');
      const keys = await this.redisClient.keys(pattern);
      const totalKeys = keys.length;

      const stalePrices = await this.getStalePrices();
      const staleCount = stalePrices.length;

      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
      const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
      const averageLatency = totalRequests > 0 ? this.stats.latencySum / totalRequests : 0;

      return {
        totalKeys,
        hitRate: Math.round(hitRate * 100) / 100,
        missRate: Math.round(missRate * 100) / 100,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        averageLatency: Math.round(averageLatency * 100) / 100,
        memoryUsage,
        stalePrices: staleCount
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', formatError(error));
      return {
        totalKeys: 0,
        hitRate: 0,
        missRate: 0,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        averageLatency: 0,
        memoryUsage: 0,
        stalePrices: 0
      };
    }
  }

  /**
   * Reset cache statistics
   */
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      latencySum: 0,
      lastReset: getCurrentTimestamp()
    };

    console.log('📊 Cache statistics reset');
    this.emit('statsReset');
  }

  /**
   * Perform cache health check
   */
  public async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          details: { error: 'Redis not connected' }
        };
      }

      const startTime = Date.now();
      
      // Test basic operations
      const testKey = this.buildCacheKey('health_check');
      const testValue = JSON.stringify({ timestamp: getCurrentTimestamp() });
      
      await this.redisClient.setex(testKey, 60, testValue);
      const retrievedValue = await this.redisClient.get(testKey);
      await this.redisClient.del(testKey);

      const latency = Date.now() - startTime;
      
      if (!retrievedValue || retrievedValue !== testValue) {
        return {
          status: 'unhealthy',
          details: { error: 'Redis read/write test failed' }
        };
      }

      const stats = await this.getCacheStats();
      
      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (latency > 1000 || stats.stalePrices > stats.totalKeys * 0.5) {
        status = 'degraded';
      }
      
      if (latency > 5000 || stats.stalePrices > stats.totalKeys * 0.8) {
        status = 'unhealthy';
      }

      return {
        status,
        details: {
          ...stats,
          latency,
          isConnected: this.isConnected,
          lastHealthCheck: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: formatError(error),
          isConnected: this.isConnected,
          lastHealthCheck: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.redisClient && this.isConnected) {
      try {
        await this.redisClient.quit();
        console.log('🔌 Redis Price Cache disconnected');
        this.emit('disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting from Redis:', formatError(error));
      }
    }
    
    this.isConnected = false;
    this.redisClient = null;
  }

  /**
   * Build cache key with prefix
   */
  private buildCacheKey(symbol: string): string {
    return `price:${symbol.toUpperCase()}`;
  }

  /**
   * Extract symbol from cache key
   */
  private extractSymbolFromKey(key: string): string {
    const parts = key.split(':');
    return parts[parts.length - 1];
  }

  /**
   * Calculate TTL based on data source
   */
  private calculateTTL(source: string): number {
    const ttlMap: Record<string, number> = {
      'chainlink': 5 * 60 * 1000, // 5 minutes
      'dex_aggregator': 2 * 60 * 1000, // 2 minutes
      'coingecko': 10 * 60 * 1000 // 10 minutes
    };

    return ttlMap[source] || this.config.defaultTTL * 1000;
  }

  /**
   * Calculate staleness in seconds
   */
  private calculateStaleness(priceData: RealTimePriceData): number {
    return Math.floor((getCurrentTimestamp() - priceData.timestamp) / 1000);
  }

  /**
   * Evaluate staleness level
   */
  private evaluateStaleness(source: string, stalenessSeconds: number): 'fresh' | 'warning' | 'error' {
    const maxAge = this.stalenessConfig.maxAge[source] || 3600;
    
    if (stalenessSeconds > this.stalenessConfig.errorThreshold || stalenessSeconds > maxAge * 2) {
      return 'error';
    } else if (stalenessSeconds > this.stalenessConfig.warningThreshold || stalenessSeconds > maxAge) {
      return 'warning';
    } else {
      return 'fresh';
    }
  }

  /**
   * Update staleness monitoring data
   */
  private async updateStalenessMonitoring(symbol: string, priceData: RealTimePriceData): Promise<void> {
    try {
      const monitoringKey = `staleness:${symbol.toUpperCase()}`;
      const monitoringData = {
        symbol,
        source: priceData.source,
        lastUpdate: priceData.timestamp,
        priceUSD: priceData.priceUSD
      };

      // Store monitoring data with longer TTL
      await this.redisClient.setex(monitoringKey, 24 * 60 * 60, JSON.stringify(monitoringData)); // 24 hours
    } catch (error) {
      console.error(`Warning: Failed to update staleness monitoring for ${symbol}:`, formatError(error));
    }
  }

  /**
   * Update latency statistics
   */
  private updateLatencyStats(latency: number): void {
    this.stats.latencySum += latency;
  }

  /**
   * Ensure Redis connection is active
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.redisClient) {
      throw new Error('Redis Price Cache not connected. Call initialize() first.');
    }
  }
}

// Export configuration factory
export function createRedisCacheConfig(): RedisCacheConfig {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'cryptovault:',
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '300'), // 5 minutes
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000')
  };
}