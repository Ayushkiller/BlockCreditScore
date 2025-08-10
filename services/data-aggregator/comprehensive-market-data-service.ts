// Comprehensive Market Data Service - Combines all real market data sources
// Integrates task 4.1 and 4.2 implementations for complete market data coverage

import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { getRealMarketDataService, RealPriceData } from './real-market-data-service';
import { getDeFiMarketDataService, TVLData, ProtocolYieldData, MarketSentimentData, MarketVolatilityData } from './defi-market-data-service';

export interface ComprehensiveMarketData {
  prices: RealPriceData[];
  tvlData: TVLData[];
  yieldData: ProtocolYieldData[];
  sentiment: MarketSentimentData;
  volatility: MarketVolatilityData[];
  timestamp: number;
  dataFreshness: {
    prices: number;
    tvl: number;
    yields: number;
    sentiment: number;
    volatility: number;
  };
}

export interface MarketDataSummary {
  totalTVL: number;
  averageYield: number;
  marketSentiment: string;
  averageVolatility: number;
  topProtocols: Array<{
    name: string;
    tvl: number;
    change24h: number;
  }>;
  topYields: Array<{
    protocol: string;
    asset: string;
    apy: number;
  }>;
}

export interface MarketDataSubscription {
  callback: (data: ComprehensiveMarketData) => void;
  interval: NodeJS.Timeout;
  lastUpdate: number;
}

export class ComprehensiveMarketDataService {
  private realMarketDataService: any = null;
  private defiMarketDataService: any = null;
  private isInitialized: boolean = false;
  private subscriptions: Map<string, MarketDataSubscription> = new Map();
  private lastComprehensiveData: ComprehensiveMarketData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {}

  /**
   * Initialize the comprehensive market data service
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize both services
      this.realMarketDataService = await getRealMarketDataService();
      this.defiMarketDataService = await getDeFiMarketDataService();

      // Initial data fetch
      await this.updateComprehensiveData();

      // Set up periodic updates (every 5 minutes)
      this.updateInterval = setInterval(async () => {
        try {
          await this.updateComprehensiveData();
        } catch (error) {
          console.error('Error updating comprehensive market data:', formatError(error));
        }
      }, 5 * 60 * 1000); // 5 minutes

      this.isInitialized = true;
      console.log('Comprehensive market data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize comprehensive market data service:', formatError(error));
      throw error;
    }
  }

  /**
   * Get comprehensive market data
   */
  public async getComprehensiveMarketData(): Promise<ComprehensiveMarketData> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    // Return cached data if fresh (less than 5 minutes old)
    if (this.lastComprehensiveData && 
        (getCurrentTimestamp() - this.lastComprehensiveData.timestamp) < 5 * 60 * 1000) {
      return this.lastComprehensiveData;
    }

    return await this.updateComprehensiveData();
  }

  /**
   * Get market data summary with key metrics
   */
  public async getMarketDataSummary(): Promise<MarketDataSummary> {
    const comprehensiveData = await this.getComprehensiveMarketData();

    // Calculate total TVL
    const totalTVL = comprehensiveData.tvlData.reduce((sum, protocol) => sum + protocol.tvl, 0);

    // Calculate average yield
    const validYields = comprehensiveData.yieldData.filter(y => y.apy > 0 && y.apy < 1000);
    const averageYield = validYields.length > 0 
      ? validYields.reduce((sum, y) => sum + y.apy, 0) / validYields.length 
      : 0;

    // Calculate average volatility
    const averageVolatility = comprehensiveData.volatility.length > 0
      ? comprehensiveData.volatility.reduce((sum, v) => sum + v.volatility30d, 0) / comprehensiveData.volatility.length
      : 0;

    // Get top protocols by TVL
    const topProtocols = comprehensiveData.tvlData
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 5)
      .map(protocol => ({
        name: protocol.protocol,
        tvl: protocol.tvl,
        change24h: protocol.change24h
      }));

    // Get top yields
    const topYields = comprehensiveData.yieldData
      .filter(y => y.apy > 0 && y.apy < 100) // Filter out unrealistic yields
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 10)
      .map(yield_ => ({
        protocol: yield_.protocol,
        asset: yield_.asset,
        apy: yield_.apy
      }));

    return {
      totalTVL,
      averageYield,
      marketSentiment: comprehensiveData.sentiment.valueClassification,
      averageVolatility,
      topProtocols,
      topYields
    };
  }

  /**
   * Subscribe to comprehensive market data updates
   */
  public subscribeToMarketData(
    subscriptionId: string,
    callback: (data: ComprehensiveMarketData) => void,
    intervalMs: number = 5 * 60 * 1000 // 5 minutes default
  ): void {
    // Remove existing subscription if it exists
    this.unsubscribeFromMarketData(subscriptionId);

    const interval = setInterval(async () => {
      try {
        const data = await this.getComprehensiveMarketData();
        callback(data);
      } catch (error) {
        console.error(`Market data subscription error for ${subscriptionId}:`, formatError(error));
      }
    }, intervalMs);

    this.subscriptions.set(subscriptionId, {
      callback,
      interval,
      lastUpdate: getCurrentTimestamp()
    });

    console.log(`Subscribed to comprehensive market data updates: ${subscriptionId}`);
  }

  /**
   * Unsubscribe from market data updates
   */
  public unsubscribeFromMarketData(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      clearInterval(subscription.interval);
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from market data updates: ${subscriptionId}`);
    }
  }

  /**
   * Get specific protocol data
   */
  public async getProtocolData(protocolName: string): Promise<{
    tvl?: TVLData;
    yields: ProtocolYieldData[];
    prices: RealPriceData[];
  }> {
    const comprehensiveData = await this.getComprehensiveMarketData();

    const tvl = comprehensiveData.tvlData.find(
      t => t.protocol.toLowerCase().includes(protocolName.toLowerCase())
    );

    const yields = comprehensiveData.yieldData.filter(
      y => y.protocol.toLowerCase().includes(protocolName.toLowerCase())
    );

    // Get relevant token prices for the protocol
    const protocolTokens = this.getProtocolTokens(protocolName);
    const prices = comprehensiveData.prices.filter(
      p => protocolTokens.includes(p.symbol.toLowerCase())
    );

    return { tvl, yields, prices };
  }

  /**
   * Calculate market risk score based on comprehensive data
   */
  public async calculateMarketRiskScore(): Promise<{
    score: number;
    factors: {
      sentiment: number;
      volatility: number;
      tvlStability: number;
      yieldSustainability: number;
    };
    classification: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Extreme Risk';
  }> {
    const data = await this.getComprehensiveMarketData();
    
    // Sentiment factor (0-1, lower is better)
    const sentimentFactor = (100 - data.sentiment.value) / 100;
    
    // Volatility factor (0-1, lower is better)
    const avgVolatility = data.volatility.length > 0
      ? data.volatility.reduce((sum, v) => sum + v.volatility30d, 0) / data.volatility.length
      : 50;
    const volatilityFactor = Math.min(avgVolatility / 100, 1);
    
    // TVL stability factor (0-1, lower is better)
    const avgTVLChange = data.tvlData.length > 0
      ? Math.abs(data.tvlData.reduce((sum, t) => sum + t.change24h, 0) / data.tvlData.length)
      : 10;
    const tvlStabilityFactor = Math.min(avgTVLChange / 20, 1);
    
    // Yield sustainability factor (0-1, lower is better)
    const avgYield = data.yieldData.length > 0
      ? data.yieldData.reduce((sum, y) => sum + y.apy, 0) / data.yieldData.length
      : 5;
    const yieldSustainabilityFactor = avgYield > 20 ? 0.8 : avgYield > 10 ? 0.4 : 0.2;
    
    // Calculate overall risk score (0-100)
    const riskScore = Math.round(
      (sentimentFactor * 0.3 + 
       volatilityFactor * 0.3 + 
       tvlStabilityFactor * 0.2 + 
       yieldSustainabilityFactor * 0.2) * 100
    );
    
    let classification: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Extreme Risk';
    if (riskScore < 25) classification = 'Low Risk';
    else if (riskScore < 50) classification = 'Medium Risk';
    else if (riskScore < 75) classification = 'High Risk';
    else classification = 'Extreme Risk';
    
    return {
      score: riskScore,
      factors: {
        sentiment: sentimentFactor,
        volatility: volatilityFactor,
        tvlStability: tvlStabilityFactor,
        yieldSustainability: yieldSustainabilityFactor
      },
      classification
    };
  }

  /**
   * Update comprehensive market data
   */
  private async updateComprehensiveData(): Promise<ComprehensiveMarketData> {
    try {
      // Get all market data in parallel
      const [pricesResult, defiDataResult] = await Promise.allSettled([
        this.realMarketDataService.getAllCachedPrices(),
        this.defiMarketDataService.getAllMarketData()
      ]);

      const prices = pricesResult.status === 'fulfilled' ? pricesResult.value : [];
      const defiData = defiDataResult.status === 'fulfilled' ? defiDataResult.value : {
        tvlData: [],
        yieldData: [],
        sentiment: {
          value: 50,
          valueClassification: 'Neutral' as const,
          timestamp: getCurrentTimestamp(),
          source: 'fallback'
        },
        volatility: []
      };

      // Calculate data freshness
      const now = getCurrentTimestamp();
      const dataFreshness = {
        prices: prices.length > 0 ? Math.min(...prices.map(p => now - p.lastUpdated)) / 1000 : 0,
        tvl: defiData.tvlData.length > 0 ? Math.min(...defiData.tvlData.map(t => now - t.lastUpdated)) / 1000 : 0,
        yields: defiData.yieldData.length > 0 ? Math.min(...defiData.yieldData.map(y => now - y.lastUpdated)) / 1000 : 0,
        sentiment: now - defiData.sentiment.timestamp,
        volatility: defiData.volatility.length > 0 ? Math.min(...defiData.volatility.map(v => now - v.timestamp)) / 1000 : 0
      };

      const comprehensiveData: ComprehensiveMarketData = {
        prices,
        tvlData: defiData.tvlData,
        yieldData: defiData.yieldData,
        sentiment: defiData.sentiment,
        volatility: defiData.volatility,
        timestamp: now,
        dataFreshness
      };

      this.lastComprehensiveData = comprehensiveData;

      // Notify all subscribers
      for (const subscription of this.subscriptions.values()) {
        try {
          subscription.callback(comprehensiveData);
          subscription.lastUpdate = now;
        } catch (error) {
          console.error('Error notifying market data subscriber:', formatError(error));
        }
      }

      return comprehensiveData;
    } catch (error) {
      console.error('Error updating comprehensive market data:', formatError(error));
      throw error;
    }
  }

  /**
   * Get protocol-specific tokens
   */
  private getProtocolTokens(protocolName: string): string[] {
    const protocolTokenMap: Record<string, string[]> = {
      'uniswap': ['uni', 'eth', 'usdc', 'usdt', 'dai'],
      'aave': ['aave', 'eth', 'usdc', 'usdt', 'dai', 'link'],
      'compound': ['comp', 'eth', 'usdc', 'usdt', 'dai'],
      'makerdao': ['mkr', 'dai', 'eth'],
      'curve': ['crv', 'eth', 'usdc', 'usdt', 'dai'],
      'balancer': ['bal', 'eth', 'usdc', 'usdt'],
      'sushiswap': ['sushi', 'eth', 'usdc', 'usdt'],
      'yearn': ['yfi', 'eth', 'usdc', 'usdt', 'dai'],
      'lido': ['ldo', 'eth', 'steth']
    };

    return protocolTokenMap[protocolName.toLowerCase()] || ['eth', 'usdc', 'usdt'];
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    activeSubscriptions: number;
    lastDataUpdate: number;
    realMarketDataStatus: any;
    defiMarketDataStatus: any;
    dataFreshness?: any;
  } {
    const status = {
      isInitialized: this.isInitialized,
      activeSubscriptions: this.subscriptions.size,
      lastDataUpdate: this.lastComprehensiveData?.timestamp || 0,
      realMarketDataStatus: null as any,
      defiMarketDataStatus: null as any,
      dataFreshness: this.lastComprehensiveData?.dataFreshness
    };

    try {
      if (this.realMarketDataService) {
        status.realMarketDataStatus = this.realMarketDataService.getServiceStatus();
      }
    } catch (error) {
      console.error('Error getting real market data status:', formatError(error));
    }

    try {
      if (this.defiMarketDataService) {
        status.defiMarketDataStatus = this.defiMarketDataService.getServiceStatus();
      }
    } catch (error) {
      console.error('Error getting DeFi market data status:', formatError(error));
    }

    return status;
  }

  /**
   * Stop the service and clean up
   */
  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Clear all subscriptions
    for (const subscription of this.subscriptions.values()) {
      clearInterval(subscription.interval);
    }
    this.subscriptions.clear();

    // Stop underlying services
    if (this.realMarketDataService) {
      await this.realMarketDataService.stop();
    }
    if (this.defiMarketDataService) {
      await this.defiMarketDataService.stop();
    }

    this.isInitialized = false;
    console.log('Comprehensive market data service stopped');
  }
}

// Export singleton instance
let comprehensiveMarketDataServiceInstance: ComprehensiveMarketDataService | null = null;

export async function getComprehensiveMarketDataService(): Promise<ComprehensiveMarketDataService> {
  if (!comprehensiveMarketDataServiceInstance) {
    comprehensiveMarketDataServiceInstance = new ComprehensiveMarketDataService();
    await comprehensiveMarketDataServiceInstance.initialize();
  }
  return comprehensiveMarketDataServiceInstance;
}