// DeFi Market Data Service - Integrates with real DeFi market APIs
// Implements task 4.2: Implement real DeFi market data integration
// Enhanced with task 9.1: Production-ready error handling for real APIs

import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { getRealDataConfigManager } from '../../config/real-data-config';
import { getAPIErrorManager, APIError } from './api-error-manager';

export interface TVLData {
  protocol: string;
  tvl: number;
  change24h: number;
  change7d: number;
  chains: string[];
  category: string;
  lastUpdated: number;
  source: string;
}

export interface ProtocolYieldData {
  protocol: string;
  asset: string;
  apy: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number;
  pool: string;
  chain: string;
  lastUpdated: number;
  source: string;
}

export interface MarketSentimentData {
  value: number;
  valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: number;
  source: string;
}

export interface MarketVolatilityData {
  asset: string;
  volatility24h: number;
  volatility7d: number;
  volatility30d: number;
  timestamp: number;
  source: string;
}

export interface DefiLlamaProtocolResponse {
  id: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_note: string;
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  module: string;
  twitter: string;
  forkedFrom: string[];
  oracles: string[];
  listedAt: number;
  methodology: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  tokenBreakdowns: Record<string, number>;
  mcap: number;
}

export interface DefiLlamaYieldsResponse {
  status: string;
  data: Array<{
    chain: string;
    project: string;
    symbol: string;
    tvlUsd: number;
    apy: number;
    apyBase: number;
    apyReward: number;
    pool: string;
    apyPct1D: number;
    apyPct7D: number;
    apyPct30D: number;
    stablecoin: boolean;
    ilRisk: string;
    exposure: string;
    predictions: {
      predictedClass: string;
      predictedProbability: number;
      binnedConfidence: number;
    };
    poolMeta: string;
    mu: number;
    sigma: number;
    count: number;
    outlier: boolean;
    underlyingTokens: string[];
    il7d: number;
    apyBase7d: number;
    apyMean30d: number;
    volumeUsd1d: number;
    volumeUsd7d: number;
  }>;
}

export interface FearGreedResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
  metadata: {
    error: string;
  };
}

export class DeFiMarketDataService {
  private configManager: any;
  private tvlCache: Map<string, TVLData> = new Map();
  private yieldCache: Map<string, ProtocolYieldData[]> = new Map();
  private sentimentCache: MarketSentimentData | null = null;
  private volatilityCache: Map<string, MarketVolatilityData> = new Map();
  private isInitialized: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private errorManager = getAPIErrorManager();

  // Supported DeFi protocols
  private readonly SUPPORTED_PROTOCOLS = [
    'uniswap',
    'aave',
    'compound',
    'makerdao',
    'curve',
    'balancer',
    'sushiswap',
    'yearn-finance',
    'convex-finance',
    'lido'
  ];

  constructor() {}

  /**
   * Initialize the DeFi market data service
   */
  public async initialize(): Promise<void> {
    try {
      this.configManager = await getRealDataConfigManager();
      
      if (!this.configManager.isRealDataEnabled()) {
        throw new Error('Real data integration is not enabled');
      }

      // Setup error handling callbacks
      this.setupErrorHandling();

      // Initial data fetch
      await this.updateAllMarketData();

      // Set up periodic updates (every 10 minutes to respect rate limits)
      this.updateInterval = setInterval(async () => {
        try {
          await this.updateAllMarketData();
        } catch (error) {
          console.error('Error updating DeFi market data:', formatError(error));
        }
      }, 10 * 60 * 1000); // 10 minutes

      this.isInitialized = true;
      console.log('DeFi market data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DeFi market data service:', formatError(error));
      throw error;
    }
  }

  /**
   * Setup error handling callbacks for API monitoring
   */
  private setupErrorHandling(): void {
    // Register error callbacks for different providers
    this.errorManager.onError('defillama', (error: APIError) => {
      console.error(`DefiLlama API error: ${error.message} (${error.code})`);
      if (error.code === 'RATE_LIMITED') {
        console.warn('DefiLlama rate limited, extending update interval');
        this.extendUpdateInterval(error.retryAfter || 300000); // 5 minutes default
      }
    });

    this.errorManager.onError('alternative.me', (error: APIError) => {
      console.error(`Fear & Greed Index API error: ${error.message} (${error.code})`);
    });

    // Register recovery callbacks
    this.errorManager.onRecovery('defillama', (provider: string) => {
      console.log(`${provider} recovered, resuming normal update interval`);
      this.resetUpdateInterval();
    });
  }

  /**
   * Extend update interval due to rate limiting
   */
  private extendUpdateInterval(additionalDelay: number): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Extend to 20 minutes during rate limiting
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllMarketData();
      } catch (error) {
        console.error('Error updating DeFi market data:', formatError(error));
      }
    }, 20 * 60 * 1000);
  }

  /**
   * Reset to normal update interval
   */
  private resetUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllMarketData();
      } catch (error) {
        console.error('Error updating DeFi market data:', formatError(error));
      }
    }, 10 * 60 * 1000);
  }

  /**
   * Get TVL data from DefiLlama API
   */
  public async getTVLData(protocol: string): Promise<TVLData> {
    const cachedData = this.tvlCache.get(protocol);
    
    // Return cached data if fresh (less than 15 minutes old)
    if (cachedData && (getCurrentTimestamp() - cachedData.lastUpdated) < 15 * 60 * 1000) {
      return cachedData;
    }

    const marketProviders = this.configManager.getHealthyMarketDataProviders();
    const defiLlamaProvider = marketProviders.defi.find(p => p.name === 'DefiLlama');
    
    if (!defiLlamaProvider) {
      throw new Error('DefiLlama provider not available');
    }

    try {
      const url = `${defiLlamaProvider.baseUrl}/protocol/${protocol}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API error: ${response.status} ${response.statusText}`);
      }

      const data: DefiLlamaProtocolResponse = await response.json();

      const tvlData: TVLData = {
        protocol: data.name,
        tvl: data.tvl,
        change24h: data.change_1d || 0,
        change7d: data.change_7d || 0,
        chains: data.chains || [],
        category: data.category || 'Unknown',
        lastUpdated: getCurrentTimestamp(),
        source: 'defillama'
      };

      // Cache the data
      this.tvlCache.set(protocol, tvlData);

      return tvlData;
    } catch (error) {
      console.error(`Failed to fetch TVL data for ${protocol}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get protocol yield data from DefiLlama yields API
   */
  public async getProtocolYields(protocol?: string): Promise<ProtocolYieldData[]> {
    const cacheKey = protocol || 'all';
    const cachedData = this.yieldCache.get(cacheKey);
    
    // Return cached data if fresh (less than 30 minutes old)
    if (cachedData && cachedData.length > 0) {
      const isDataFresh = cachedData.every(item => 
        (getCurrentTimestamp() - item.lastUpdated) < 30 * 60 * 1000
      );
      if (isDataFresh) {
        return cachedData;
      }
    }

    const marketProviders = this.configManager.getHealthyMarketDataProviders();
    const defiLlamaProvider = marketProviders.defi.find(p => p.name === 'DefiLlama');
    
    if (!defiLlamaProvider) {
      throw new Error('DefiLlama provider not available');
    }

    try {
      let url = `${defiLlamaProvider.baseUrl}/yields`;
      
      // Add protocol filter if specified
      if (protocol) {
        url += `?project=${protocol}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`DefiLlama yields API error: ${response.status} ${response.statusText}`);
      }

      const responseData: DefiLlamaYieldsResponse = await response.json();

      const yieldData: ProtocolYieldData[] = responseData.data
        .filter(item => !protocol || item.project.toLowerCase() === protocol.toLowerCase())
        .slice(0, 50) // Limit to top 50 pools to avoid excessive data
        .map(item => ({
          protocol: item.project,
          asset: item.symbol,
          apy: item.apy || 0,
          apyBase: item.apyBase || 0,
          apyReward: item.apyReward || 0,
          tvlUsd: item.tvlUsd || 0,
          pool: item.pool,
          chain: item.chain,
          lastUpdated: getCurrentTimestamp(),
          source: 'defillama'
        }));

      // Cache the data
      this.yieldCache.set(cacheKey, yieldData);

      return yieldData;
    } catch (error) {
      console.error(`Failed to fetch yield data for ${protocol || 'all protocols'}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get Fear & Greed Index from Alternative.me API
   */
  public async getFearGreedIndex(): Promise<MarketSentimentData> {
    // Return cached data if fresh (less than 1 hour old)
    if (this.sentimentCache && (getCurrentTimestamp() - this.sentimentCache.timestamp) < 60 * 60 * 1000) {
      return this.sentimentCache;
    }

    const marketProviders = this.configManager.getHealthyMarketDataProviders();
    const fearGreedProvider = marketProviders.sentiment.find(p => p.name === 'FearGreedIndex');
    
    if (!fearGreedProvider) {
      throw new Error('Fear & Greed Index provider not available');
    }

    try {
      const url = `${fearGreedProvider.baseUrl}/fng/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Fear & Greed API error: ${response.status} ${response.statusText}`);
      }

      const data: FearGreedResponse = await response.json();

      if (data.data && data.data.length > 0) {
        const latestData = data.data[0];
        
        const sentimentData: MarketSentimentData = {
          value: parseInt(latestData.value),
          valueClassification: latestData.value_classification as MarketSentimentData['valueClassification'],
          timestamp: getCurrentTimestamp(),
          source: 'alternative.me'
        };

        // Cache the data
        this.sentimentCache = sentimentData;

        return sentimentData;
      } else {
        throw new Error('No Fear & Greed Index data available');
      }
    } catch (error) {
      console.error('Failed to fetch Fear & Greed Index:', formatError(error));
      throw error;
    }
  }

  /**
   * Calculate market volatility using historical price data
   */
  public async calculateMarketVolatility(
    asset: string,
    historicalPrices: Array<{ timestamp: number; price: number }>
  ): Promise<MarketVolatilityData> {
    const cacheKey = asset;
    const cachedData = this.volatilityCache.get(cacheKey);
    
    // Return cached data if fresh (less than 1 hour old)
    if (cachedData && (getCurrentTimestamp() - cachedData.timestamp) < 60 * 60 * 1000) {
      return cachedData;
    }

    if (historicalPrices.length < 2) {
      throw new Error('Insufficient price data for volatility calculation');
    }

    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 1; i < historicalPrices.length; i++) {
      const currentPrice = historicalPrices[i].price;
      const previousPrice = historicalPrices[i - 1].price;
      const dailyReturn = (currentPrice - previousPrice) / previousPrice;
      returns.push(dailyReturn);
    }

    // Calculate volatility for different periods
    const volatility24h = this.calculateStandardDeviation(returns.slice(-1)) * Math.sqrt(365) * 100;
    const volatility7d = this.calculateStandardDeviation(returns.slice(-7)) * Math.sqrt(365) * 100;
    const volatility30d = this.calculateStandardDeviation(returns.slice(-30)) * Math.sqrt(365) * 100;

    const volatilityData: MarketVolatilityData = {
      asset,
      volatility24h: isNaN(volatility24h) ? 0 : volatility24h,
      volatility7d: isNaN(volatility7d) ? 0 : volatility7d,
      volatility30d: isNaN(volatility30d) ? 0 : volatility30d,
      timestamp: getCurrentTimestamp(),
      source: 'calculated'
    };

    // Cache the data
    this.volatilityCache.set(cacheKey, volatilityData);

    return volatilityData;
  }

  /**
   * Get Aave rates from Aave API
   */
  public async getAaveRates(): Promise<ProtocolYieldData[]> {
    try {
      // Aave V3 subgraph endpoint
      const url = 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3';
      
      const query = `
        query {
          reserves(first: 20, orderBy: totalLiquidity, orderDirection: desc) {
            id
            name
            symbol
            liquidityRate
            variableBorrowRate
            stableBorrowRate
            totalLiquidity
            availableLiquidity
            utilizationRate
          }
        }
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Aave API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`Aave GraphQL error: ${data.errors[0].message}`);
      }

      const aaveRates: ProtocolYieldData[] = data.data.reserves.map((reserve: any) => ({
        protocol: 'Aave V3',
        asset: reserve.symbol,
        apy: parseFloat(reserve.liquidityRate) / 1e25 * 100, // Convert from ray to percentage
        apyBase: parseFloat(reserve.liquidityRate) / 1e25 * 100,
        apyReward: 0,
        tvlUsd: parseFloat(reserve.totalLiquidity) / 1e18, // Approximate USD value
        pool: `${reserve.symbol} Lending Pool`,
        chain: 'ethereum',
        lastUpdated: getCurrentTimestamp(),
        source: 'aave-subgraph'
      }));

      return aaveRates;
    } catch (error) {
      console.error('Failed to fetch Aave rates:', formatError(error));
      throw error;
    }
  }

  /**
   * Get Compound rates from Compound API
   */
  public async getCompoundRates(): Promise<ProtocolYieldData[]> {
    try {
      const url = 'https://api.compound.finance/api/v2/ctoken';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Compound API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const compoundRates: ProtocolYieldData[] = data.cToken
        .filter((token: any) => token.supply_rate && token.underlying_symbol)
        .map((token: any) => ({
          protocol: 'Compound',
          asset: token.underlying_symbol,
          apy: parseFloat(token.supply_rate.value) * 100,
          apyBase: parseFloat(token.supply_rate.value) * 100,
          apyReward: parseFloat(token.comp_supply_apy?.value || '0') * 100,
          tvlUsd: parseFloat(token.total_supply.value) * parseFloat(token.underlying_price.value),
          pool: `${token.underlying_symbol} Market`,
          chain: 'ethereum',
          lastUpdated: getCurrentTimestamp(),
          source: 'compound-api'
        }));

      return compoundRates;
    } catch (error) {
      console.error('Failed to fetch Compound rates:', formatError(error));
      throw error;
    }
  }

  /**
   * Get comprehensive market data for all supported protocols
   */
  public async getAllMarketData(): Promise<{
    tvlData: TVLData[];
    yieldData: ProtocolYieldData[];
    sentiment: MarketSentimentData;
    volatility: MarketVolatilityData[];
  }> {
    const [tvlData, yieldData, sentiment] = await Promise.allSettled([
      this.getAllTVLData(),
      this.getProtocolYields(),
      this.getFearGreedIndex()
    ]);

    return {
      tvlData: tvlData.status === 'fulfilled' ? tvlData.value : [],
      yieldData: yieldData.status === 'fulfilled' ? yieldData.value : [],
      sentiment: sentiment.status === 'fulfilled' ? sentiment.value : {
        value: 50,
        valueClassification: 'Neutral',
        timestamp: getCurrentTimestamp(),
        source: 'fallback'
      },
      volatility: Array.from(this.volatilityCache.values())
    };
  }

  /**
   * Get TVL data for all supported protocols
   */
  private async getAllTVLData(): Promise<TVLData[]> {
    const tvlPromises = this.SUPPORTED_PROTOCOLS.map(async (protocol) => {
      try {
        return await this.getTVLData(protocol);
      } catch (error) {
        console.error(`Failed to get TVL for ${protocol}:`, formatError(error));
        return null;
      }
    });

    const results = await Promise.allSettled(tvlPromises);
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<TVLData>).value);
  }

  /**
   * Update all market data
   */
  private async updateAllMarketData(): Promise<void> {
    try {
      await Promise.allSettled([
        this.getAllTVLData(),
        this.getProtocolYields(),
        this.getFearGreedIndex()
      ]);

      console.log('DeFi market data updated successfully');
    } catch (error) {
      console.error('Error updating DeFi market data:', formatError(error));
    }
  }

  /**
   * Calculate standard deviation for volatility
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    cachedTVL: number;
    cachedYields: number;
    lastSentimentUpdate: number;
    cachedVolatility: number;
    supportedProtocols: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      cachedTVL: this.tvlCache.size,
      cachedYields: Array.from(this.yieldCache.values()).reduce((sum, arr) => sum + arr.length, 0),
      lastSentimentUpdate: this.sentimentCache?.timestamp || 0,
      cachedVolatility: this.volatilityCache.size,
      supportedProtocols: this.SUPPORTED_PROTOCOLS
    };
  }

  /**
   * Stop the service and clean up
   */
  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isInitialized = false;
    console.log('DeFi market data service stopped');
  }
}

// Export singleton instance
let defiMarketDataServiceInstance: DeFiMarketDataService | null = null;

export async function getDeFiMarketDataService(): Promise<DeFiMarketDataService> {
  if (!defiMarketDataServiceInstance) {
    defiMarketDataServiceInstance = new DeFiMarketDataService();
    await defiMarketDataServiceInstance.initialize();
  }
  return defiMarketDataServiceInstance;
}