// In-Memory Price Caching System
// Implements task 6.2: Build real price monitoring and caching system

import { EventEmitter } from 'events';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { RealTimePriceData } from './real-time-price-feed-manager';

export interface MemoryCacheConfig {
  keyPrefix: string;
  defaultTTL: number; // seconds
  maxEntries: number;
  cleanupInterval: number; // milliseconds
}

export interface CacheEntry {
  data: RealTimePriceData;
  cachedAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  expiresAt: number;
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
 * In-Memory Price Caching System
 * Provides high-performance caching with TTL, staleness detection, and failover
 */
export class MemoryPriceCache extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private isConnected = false;
  private config: MemoryCacheConfig;
  private stalenessConfig: PriceStalenessConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
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

  constructor(config: MemoryCacheConfig, stalenessConfig?: PriceStalenessConfig) {
    super();
    this.config = config;
    this.stalenessConfig = stalenessConfig || this.DEFAULT_STALENESS_CONFIG;
  }

  /**
   * Initialize in-memory cache
   */
  public async initialize(): Promise<void> {
    try {
      this.isConnected = true;
      
      // Start cleanup timer
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredEntries();
      }, this.config.cleanupInterval);

      console.log('✅ In-memory price cache connected');
      this.emit('connected');
      console.log('🚀 Memory Price Cache initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Memory Price Cache:', formatError(error));
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
      const ttlMs = customTTL || this.calculateTTL(priceData.source);
      const now = getCurrentTimestamp();
      const cacheEntry: CacheEntry = {
        data: priceData,
        cachedAt: now,
        ttl: ttlMs,
        accessCount: 0,
        lastAccessed: now,
        expiresAt: now + ttlMs
      };

      const key = this.buildCacheKey(symbol);
      
      // Check if we need to evict entries due to max size
      if (this.cache.size >= this.config.maxEntries) {
        this.evictOldestEntry();
      }

      this.cache.set(key, cacheEntry);

      const latency = Date.now() - startTime;
      this.updateLatencyStats(latency);

      const ttlSeconds = Math.floor(ttlMs / 1000);
      console.log(`💾 Cached price for ${symbol}: ${priceData.priceUSD.toFixed(2)} (TTL: ${ttlSeconds}s)`);
      
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
      const cacheEntry = this.cache.get(key);

      if (!cacheEntry) {
        this.stats.misses++;
        const latency = Date.now() - startTime;
        this.updateLatencyStats(latency);
        
        console.log(`❌ Cache miss for ${symbol}`);
        this.emit('cacheMiss', { symbol });
        return null;
      }

      // Check if entry has expired
      const now = getCurrentTimestamp();
      if (now > cacheEntry.expiresAt) {
        this.cache.delete(key);
        this.stats.misses++;
        const latency = Date.now() - startTime;
        this.updateLatencyStats(latency);
        
        console.log(`❌ Cache expired for ${symbol}`);
        this.emit('cacheMiss', { symbol });
        return null;
      }
      
      // Update access statistics
      cacheEntry.accessCount++;
      cacheEntry.lastAccessed = now;

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

      console.log(`✅ Cache hit for ${symbol}: ${priceData.priceUSD.toFixed(2)} (${staleness}s old)`);
      
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
      let hits = 0;

      for (const symbol of symbols) {
        const priceData = await this.getCachedPrice(symbol);
        results.set(symbol, priceData);
        if (priceData) hits++;
      }

      console.log(`📦 Batch cache lookup: ${hits}/${symbols.length} hits`);
      
      this.emit('batchCacheResult', { 
        symbols, 
        hits,
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
      const stalePrices: Array<{ symbol: string; staleness: number; level: 'warning' | 'error' }> = [];

      for (const [key, cacheEntry] of this.cache.entries()) {
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

      let deletedCount = 0;
      for (const stalePrice of errorLevelPrices) {
        const key = this.buildCacheKey(stalePrice.symbol);
        if (this.cache.delete(key)) {
          deletedCount++;
        }
      }

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
      const totalKeys = this.cache.size;
      const stalePrices = await this.getStalePrices();
      const staleCount = stalePrices.length;

      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
      const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
      const averageLatency = totalRequests > 0 ? this.stats.latencySum / totalRequests : 0;

      // Estimate memory usage (rough calculation)
      const memoryUsage = totalKeys * 1024; // Rough estimate: 1KB per entry

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
          details: { error: 'Memory cache not connected' }
        };
      }

      const stats = await this.getCacheStats();
      
      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (stats.stalePrices > stats.totalKeys * 0.5) {
        status = 'degraded';
      }
      
      if (stats.stalePrices > stats.totalKeys * 0.8) {
        status = 'unhealthy';
      }

      return {
        status,
        details: {
          ...stats,
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
   * Disconnect from cache
   */
  public async disconnect(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.cache.clear();
    this.isConnected = false;
    
    console.log('🔌 Memory Price Cache disconnected');
    this.emit('disconnected');
  }

  /**
   * Build cache key with prefix
   */
  private buildCacheKey(symbol: string): string {
    return `${this.config.keyPrefix}price:${symbol.toUpperCase()}`;
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
   * Update latency statistics
   */
  private updateLatencyStats(latency: number): void {
    this.stats.latencySum += latency;
  }

  /**
   * Ensure cache connection is active
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Memory Price Cache not connected. Call initialize() first.');
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = getCurrentTimestamp();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Evicted oldest cache entry: ${oldestKey}`);
    }
  }
}

// Export configuration factory
export function createMemoryCacheConfig(): MemoryCacheConfig {
  return {
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'cryptovault:',
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5 minutes
    maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '10000'),
    cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000') // 1 minute
  };
}

// Backward compatibility exports
export const RedisPriceCache = MemoryPriceCache;
export const createRedisCacheConfig = createMemoryCacheConfig;
export type RedisCacheConfig = MemoryCacheConfig;