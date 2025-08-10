// Price Volatility Monitoring System
// Implements task 6.2: Create real price volatility monitoring using actual price change calculations

import { EventEmitter } from 'events';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { RealTimePriceData } from './real-time-price-feed-manager';

export interface VolatilityData {
  symbol: string;
  currentPrice: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volatility1h: number;
  volatility24h: number;
  volatility7d: number;
  standardDeviation: number;
  averagePrice: number;
  highPrice: number;
  lowPrice: number;
  priceRange: number;
  timestamp: number;
  dataPoints: number;
}

export interface PricePoint {
  price: number;
  timestamp: number;
  volume?: number;
}

export interface VolatilityAlert {
  symbol: string;
  alertType: 'high_volatility' | 'price_spike' | 'price_drop' | 'unusual_volume';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export interface VolatilityConfig {
  maxHistorySize: number; // Maximum number of price points to store
  updateInterval: number; // milliseconds between volatility calculations
  alertThresholds: {
    volatility: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    priceChange: {
      spike: number; // percentage
      drop: number; // percentage (negative)
    };
  };
  timeWindows: {
    short: number; // milliseconds (1 hour)
    medium: number; // milliseconds (24 hours)
    long: number; // milliseconds (7 days)
  };
}

/**
 * Price Volatility Monitoring System
 * Monitors real price changes and calculates volatility metrics
 */
export class PriceVolatilityMonitor extends EventEmitter {
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private volatilityData: Map<string, VolatilityData> = new Map();
  private config: VolatilityConfig;
  private updateInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // Default configuration
  private readonly DEFAULT_CONFIG: VolatilityConfig = {
    maxHistorySize: 10080, // 7 days of minute data
    updateInterval: 60000, // 1 minute
    alertThresholds: {
      volatility: {
        low: 5, // 5%
        medium: 15, // 15%
        high: 30, // 30%
        critical: 50 // 50%
      },
      priceChange: {
        spike: 20, // 20% increase
        drop: -20 // 20% decrease
      }
    },
    timeWindows: {
      short: 60 * 60 * 1000, // 1 hour
      medium: 24 * 60 * 60 * 1000, // 24 hours
      long: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  };

  constructor(config?: Partial<VolatilityConfig>) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
  }

  /**
   * Start volatility monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Volatility monitoring is already running');
      return;
    }

    this.updateInterval = setInterval(() => {
      this.calculateVolatilityForAllTokens();
    }, this.config.updateInterval);

    this.isMonitoring = true;
    console.log('📊 Price volatility monitoring started');
    
    this.emit('monitoringStarted');
  }

  /**
   * Stop volatility monitoring
   */
  public stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isMonitoring = false;
    console.log('🛑 Price volatility monitoring stopped');
    
    this.emit('monitoringStopped');
  }

  /**
   * Add price data point for volatility calculation
   */
  public addPriceData(symbol: string, priceData: RealTimePriceData): void {
    const pricePoint: PricePoint = {
      price: priceData.priceUSD,
      timestamp: priceData.timestamp,
      volume: priceData.volume24h
    };

    // Get existing history or create new array
    let history = this.priceHistory.get(symbol) || [];

    // Add new price point
    history.push(pricePoint);

    // Sort by timestamp to ensure chronological order
    history.sort((a, b) => a.timestamp - b.timestamp);

    // Trim history to max size
    if (history.length > this.config.maxHistorySize) {
      history = history.slice(-this.config.maxHistorySize);
    }

    // Store updated history
    this.priceHistory.set(symbol, history);

    // Calculate volatility immediately for this token
    this.calculateVolatility(symbol);

    console.log(`📈 Added price data for ${symbol}: $${pricePoint.price.toFixed(2)} (${history.length} points)`);
  }

  /**
   * Calculate volatility for a specific token
   */
  public calculateVolatility(symbol: string): VolatilityData | null {
    const history = this.priceHistory.get(symbol);
    
    if (!history || history.length < 2) {
      console.warn(`⚠️ Insufficient price history for ${symbol} (${history?.length || 0} points)`);
      return null;
    }

    const now = getCurrentTimestamp();
    const currentPrice = history[history.length - 1].price;

    // Filter data by time windows
    const shortTermData = this.filterByTimeWindow(history, now, this.config.timeWindows.short);
    const mediumTermData = this.filterByTimeWindow(history, now, this.config.timeWindows.medium);
    const longTermData = this.filterByTimeWindow(history, now, this.config.timeWindows.long);

    // Calculate price changes
    const priceChange1h = this.calculatePriceChange(shortTermData);
    const priceChange24h = this.calculatePriceChange(mediumTermData);
    const priceChange7d = this.calculatePriceChange(longTermData);

    // Calculate volatilities
    const volatility1h = this.calculateVolatilityMetric(shortTermData);
    const volatility24h = this.calculateVolatilityMetric(mediumTermData);
    const volatility7d = this.calculateVolatilityMetric(longTermData);

    // Calculate statistical metrics
    const prices = mediumTermData.map(p => p.price);
    const standardDeviation = this.calculateStandardDeviation(prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const priceRange = ((highPrice - lowPrice) / averagePrice) * 100;

    const volatilityData: VolatilityData = {
      symbol,
      currentPrice,
      priceChange1h,
      priceChange24h,
      priceChange7d,
      volatility1h,
      volatility24h,
      volatility7d,
      standardDeviation,
      averagePrice,
      highPrice,
      lowPrice,
      priceRange,
      timestamp: now,
      dataPoints: history.length
    };

    // Store volatility data
    this.volatilityData.set(symbol, volatilityData);

    // Check for alerts
    this.checkVolatilityAlerts(volatilityData);

    console.log(`📊 Calculated volatility for ${symbol}: 1h=${volatility1h.toFixed(2)}%, 24h=${volatility24h.toFixed(2)}%`);
    
    this.emit('volatilityCalculated', volatilityData);

    return volatilityData;
  }

  /**
   * Get volatility data for a token
   */
  public getVolatilityData(symbol: string): VolatilityData | null {
    return this.volatilityData.get(symbol) || null;
  }

  /**
   * Get volatility data for all monitored tokens
   */
  public getAllVolatilityData(): VolatilityData[] {
    return Array.from(this.volatilityData.values());
  }

  /**
   * Get price history for a token
   */
  public getPriceHistory(symbol: string, timeWindow?: number): PricePoint[] {
    const history = this.priceHistory.get(symbol) || [];
    
    if (!timeWindow) {
      return [...history];
    }

    const now = getCurrentTimestamp();
    return this.filterByTimeWindow(history, now, timeWindow);
  }

  /**
   * Get tokens sorted by volatility
   */
  public getTokensByVolatility(timeWindow: '1h' | '24h' | '7d' = '24h'): VolatilityData[] {
    const allData = this.getAllVolatilityData();
    
    return allData.sort((a, b) => {
      const volatilityA = timeWindow === '1h' ? a.volatility1h : 
                         timeWindow === '24h' ? a.volatility24h : a.volatility7d;
      const volatilityB = timeWindow === '1h' ? b.volatility1h : 
                         timeWindow === '24h' ? b.volatility24h : b.volatility7d;
      
      return volatilityB - volatilityA; // Descending order
    });
  }

  /**
   * Get monitoring statistics
   */
  public getMonitoringStats(): {
    isMonitoring: boolean;
    monitoredTokens: number;
    totalDataPoints: number;
    averageHistorySize: number;
    oldestDataPoint: number;
    newestDataPoint: number;
    updateInterval: number;
  } {
    const histories = Array.from(this.priceHistory.values());
    const totalDataPoints = histories.reduce((sum, history) => sum + history.length, 0);
    const averageHistorySize = histories.length > 0 ? totalDataPoints / histories.length : 0;

    let oldestDataPoint = 0;
    let newestDataPoint = 0;

    if (histories.length > 0) {
      const allPoints = histories.flat();
      const timestamps = allPoints.map(p => p.timestamp);
      oldestDataPoint = Math.min(...timestamps);
      newestDataPoint = Math.max(...timestamps);
    }

    return {
      isMonitoring: this.isMonitoring,
      monitoredTokens: this.priceHistory.size,
      totalDataPoints,
      averageHistorySize: Math.round(averageHistorySize),
      oldestDataPoint,
      newestDataPoint,
      updateInterval: this.config.updateInterval
    };
  }

  /**
   * Clear price history for a token
   */
  public clearPriceHistory(symbol: string): void {
    this.priceHistory.delete(symbol);
    this.volatilityData.delete(symbol);
    
    console.log(`🧹 Cleared price history for ${symbol}`);
    this.emit('historyCleared', { symbol });
  }

  /**
   * Clear all price history
   */
  public clearAllHistory(): void {
    const tokenCount = this.priceHistory.size;
    
    this.priceHistory.clear();
    this.volatilityData.clear();
    
    console.log(`🧹 Cleared price history for ${tokenCount} tokens`);
    this.emit('allHistoryCleared', { tokenCount });
  }

  /**
   * Filter price data by time window
   */
  private filterByTimeWindow(history: PricePoint[], currentTime: number, timeWindow: number): PricePoint[] {
    const cutoffTime = currentTime - timeWindow;
    return history.filter(point => point.timestamp >= cutoffTime);
  }

  /**
   * Calculate price change percentage
   */
  private calculatePriceChange(data: PricePoint[]): number {
    if (data.length < 2) {
      return 0;
    }

    const oldestPrice = data[0].price;
    const newestPrice = data[data.length - 1].price;
    
    return ((newestPrice - oldestPrice) / oldestPrice) * 100;
  }

  /**
   * Calculate volatility metric (standard deviation of returns)
   */
  private calculateVolatilityMetric(data: PricePoint[]): number {
    if (data.length < 2) {
      return 0;
    }

    // Calculate returns (percentage changes between consecutive prices)
    const returns: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const previousPrice = data[i - 1].price;
      const currentPrice = data[i].price;
      const returnValue = ((currentPrice - previousPrice) / previousPrice) * 100;
      returns.push(returnValue);
    }

    // Calculate standard deviation of returns
    return this.calculateStandardDeviation(returns);
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate volatility for all monitored tokens
   */
  private calculateVolatilityForAllTokens(): void {
    const symbols = Array.from(this.priceHistory.keys());
    
    if (symbols.length === 0) {
      return;
    }

    console.log(`🔄 Calculating volatility for ${symbols.length} tokens...`);

    let calculatedCount = 0;
    
    for (const symbol of symbols) {
      try {
        const volatilityData = this.calculateVolatility(symbol);
        if (volatilityData) {
          calculatedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to calculate volatility for ${symbol}:`, formatError(error));
      }
    }

    console.log(`✅ Volatility calculated for ${calculatedCount}/${symbols.length} tokens`);
    
    this.emit('batchVolatilityCalculated', { calculatedCount, totalTokens: symbols.length });
  }

  /**
   * Check for volatility alerts
   */
  private checkVolatilityAlerts(volatilityData: VolatilityData): void {
    const alerts: VolatilityAlert[] = [];

    // Check volatility thresholds
    const volatility24h = volatilityData.volatility24h;
    
    if (volatility24h >= this.config.alertThresholds.volatility.critical) {
      alerts.push({
        symbol: volatilityData.symbol,
        alertType: 'high_volatility',
        severity: 'critical',
        currentValue: volatility24h,
        threshold: this.config.alertThresholds.volatility.critical,
        message: `Critical volatility: ${volatility24h.toFixed(2)}%`,
        timestamp: getCurrentTimestamp()
      });
    } else if (volatility24h >= this.config.alertThresholds.volatility.high) {
      alerts.push({
        symbol: volatilityData.symbol,
        alertType: 'high_volatility',
        severity: 'high',
        currentValue: volatility24h,
        threshold: this.config.alertThresholds.volatility.high,
        message: `High volatility: ${volatility24h.toFixed(2)}%`,
        timestamp: getCurrentTimestamp()
      });
    } else if (volatility24h >= this.config.alertThresholds.volatility.medium) {
      alerts.push({
        symbol: volatilityData.symbol,
        alertType: 'high_volatility',
        severity: 'medium',
        currentValue: volatility24h,
        threshold: this.config.alertThresholds.volatility.medium,
        message: `Medium volatility: ${volatility24h.toFixed(2)}%`,
        timestamp: getCurrentTimestamp()
      });
    }

    // Check price change thresholds
    const priceChange24h = volatilityData.priceChange24h;
    
    if (priceChange24h >= this.config.alertThresholds.priceChange.spike) {
      alerts.push({
        symbol: volatilityData.symbol,
        alertType: 'price_spike',
        severity: priceChange24h >= 50 ? 'critical' : priceChange24h >= 30 ? 'high' : 'medium',
        currentValue: priceChange24h,
        threshold: this.config.alertThresholds.priceChange.spike,
        message: `Price spike: +${priceChange24h.toFixed(2)}%`,
        timestamp: getCurrentTimestamp()
      });
    } else if (priceChange24h <= this.config.alertThresholds.priceChange.drop) {
      alerts.push({
        symbol: volatilityData.symbol,
        alertType: 'price_drop',
        severity: priceChange24h <= -50 ? 'critical' : priceChange24h <= -30 ? 'high' : 'medium',
        currentValue: priceChange24h,
        threshold: this.config.alertThresholds.priceChange.drop,
        message: `Price drop: ${priceChange24h.toFixed(2)}%`,
        timestamp: getCurrentTimestamp()
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      console.warn(`🚨 Volatility alert for ${alert.symbol}: ${alert.message}`);
      this.emit('volatilityAlert', alert);
    }
  }

  /**
   * Export price history data
   */
  public exportPriceHistory(symbol?: string): any {
    if (symbol) {
      const history = this.priceHistory.get(symbol);
      const volatility = this.volatilityData.get(symbol);
      
      return {
        symbol,
        history: history || [],
        volatility: volatility || null,
        exportedAt: new Date().toISOString()
      };
    }

    // Export all data
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      tokens: {}
    };

    for (const [tokenSymbol, history] of this.priceHistory.entries()) {
      const volatility = this.volatilityData.get(tokenSymbol);
      
      exportData.tokens[tokenSymbol] = {
        history,
        volatility: volatility || null
      };
    }

    return exportData;
  }

  /**
   * Import price history data
   */
  public importPriceHistory(data: any): void {
    try {
      if (data.symbol && data.history) {
        // Import single token data
        this.priceHistory.set(data.symbol, data.history);
        
        if (data.volatility) {
          this.volatilityData.set(data.symbol, data.volatility);
        }
        
        console.log(`📥 Imported price history for ${data.symbol}: ${data.history.length} points`);
      } else if (data.tokens) {
        // Import multiple tokens data
        let importedCount = 0;
        
        for (const [symbol, tokenData] of Object.entries(data.tokens as any)) {
          if (tokenData.history) {
            this.priceHistory.set(symbol, tokenData.history);
            
            if (tokenData.volatility) {
              this.volatilityData.set(symbol, tokenData.volatility);
            }
            
            importedCount++;
          }
        }
        
        console.log(`📥 Imported price history for ${importedCount} tokens`);
      }
      
      this.emit('historyImported', { data });
    } catch (error) {
      console.error('❌ Failed to import price history:', formatError(error));
      throw error;
    }
  }
}

// Export configuration factory
export function createVolatilityConfig(): VolatilityConfig {
  return {
    maxHistorySize: parseInt(process.env.VOLATILITY_MAX_HISTORY_SIZE || '10080'),
    updateInterval: parseInt(process.env.VOLATILITY_UPDATE_INTERVAL || '60000'),
    alertThresholds: {
      volatility: {
        low: parseFloat(process.env.VOLATILITY_ALERT_LOW || '5'),
        medium: parseFloat(process.env.VOLATILITY_ALERT_MEDIUM || '15'),
        high: parseFloat(process.env.VOLATILITY_ALERT_HIGH || '30'),
        critical: parseFloat(process.env.VOLATILITY_ALERT_CRITICAL || '50')
      },
      priceChange: {
        spike: parseFloat(process.env.PRICE_CHANGE_SPIKE_THRESHOLD || '20'),
        drop: parseFloat(process.env.PRICE_CHANGE_DROP_THRESHOLD || '-20')
      }
    },
    timeWindows: {
      short: parseInt(process.env.VOLATILITY_SHORT_WINDOW || '3600000'), // 1 hour
      medium: parseInt(process.env.VOLATILITY_MEDIUM_WINDOW || '86400000'), // 24 hours
      long: parseInt(process.env.VOLATILITY_LONG_WINDOW || '604800000') // 7 days
    }
  };
}