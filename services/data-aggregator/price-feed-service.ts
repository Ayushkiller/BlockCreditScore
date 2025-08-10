// Enhanced Price Feed Service for USD Normalization
// Integrates with real market data APIs (CoinGecko) and Chainlink price feeds
// Implements task 4.1: Replace mock price data with live API feeds

import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { getRealMarketDataService, RealPriceData } from './real-market-data-service';

export interface PriceFeedConfig {
  chainlinkRpcUrl: string;
  fallbackRpcUrls: string[];
  updateInterval: number; // milliseconds
  maxPriceAge: number; // milliseconds
  retryAttempts: number;
}

export interface TokenPrice {
  symbol: string;
  address: string;
  priceUSD: number;
  decimals: number;
  lastUpdated: number;
  confidence: number; // 0-100
}

export interface ChainlinkFeed {
  symbol: string;
  feedAddress: string;
  decimals: number;
  heartbeat: number; // seconds
}

export class PriceFeedService {
  private config: PriceFeedConfig;
  private priceCache: Map<string, TokenPrice> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private realMarketDataService: any = null;

  // Chainlink price feed addresses on Ethereum mainnet
  private readonly CHAINLINK_FEEDS: ChainlinkFeed[] = [
    {
      symbol: 'ETH',
      feedAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      decimals: 8,
      heartbeat: 3600 // 1 hour
    },
    {
      symbol: 'BTC',
      feedAddress: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      decimals: 8,
      heartbeat: 3600
    },
    {
      symbol: 'USDC',
      feedAddress: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      decimals: 8,
      heartbeat: 86400 // 24 hours
    },
    {
      symbol: 'USDT',
      feedAddress: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      decimals: 8,
      heartbeat: 86400
    },
    {
      symbol: 'DAI',
      feedAddress: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
      decimals: 8,
      heartbeat: 3600
    },
    {
      symbol: 'LINK',
      feedAddress: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
      decimals: 8,
      heartbeat: 3600
    },
    {
      symbol: 'UNI',
      feedAddress: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
      decimals: 8,
      heartbeat: 3600
    },
    {
      symbol: 'AAVE',
      feedAddress: '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9',
      decimals: 8,
      heartbeat: 3600
    },
    {
      symbol: 'COMP',
      feedAddress: '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
      decimals: 8,
      heartbeat: 3600
    },
    {
      symbol: 'MKR',
      feedAddress: '0xec1D1B3b0443256cc3860e24a46F108e699484Aa',
      decimals: 8,
      heartbeat: 3600
    }
  ];

  // Token contract addresses for mapping
  private readonly TOKEN_ADDRESSES: Record<string, string> = {
    'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'USDC': '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    'MKR': '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'
  };

  constructor(config: PriceFeedConfig) {
    this.config = config;
  }

  /**
   * Start the price feed service with automatic updates
   */
  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        throw new Error('Price feed service is already running');
      }

      // Initialize real market data service
      try {
        this.realMarketDataService = await getRealMarketDataService();
        console.log('Real market data service integrated successfully');
      } catch (error) {
        console.warn('Real market data service not available, falling back to Chainlink only:', formatError(error));
      }

      // Initial price fetch
      await this.updateAllPrices();

      // Set up automatic updates
      this.updateInterval = setInterval(async () => {
        try {
          await this.updateAllPrices();
        } catch (error) {
          console.error('Error updating prices:', formatError(error));
        }
      }, this.config.updateInterval);

      this.isRunning = true;
      console.log('Enhanced price feed service started successfully');
    } catch (error) {
      console.error('Failed to start price feed service:', formatError(error));
      throw error;
    }
  }

  /**
   * Stop the price feed service
   */
  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop real market data service if available
    if (this.realMarketDataService) {
      try {
        await this.realMarketDataService.stop();
      } catch (error) {
        console.error('Error stopping real market data service:', formatError(error));
      }
    }

    this.isRunning = false;
    console.log('Enhanced price feed service stopped');
  }

  /**
   * Get USD price for a token by symbol or address
   */
  public async getTokenPriceUSD(tokenIdentifier: string): Promise<number> {
    const symbol = this.resolveTokenSymbol(tokenIdentifier);
    const cachedPrice = this.priceCache.get(symbol);

    // Return cached price if fresh
    if (cachedPrice && this.isPriceFresh(cachedPrice)) {
      return cachedPrice.priceUSD;
    }

    // Try real market data service first (CoinGecko with Chainlink fallback)
    if (this.realMarketDataService) {
      try {
        const realPrice = await this.realMarketDataService.getPriceWithChainlinkFallback(symbol);
        
        // Convert to TokenPrice format and cache
        const tokenPrice: TokenPrice = {
          symbol: realPrice.symbol,
          address: realPrice.address,
          priceUSD: realPrice.priceUSD,
          decimals: realPrice.decimals,
          lastUpdated: realPrice.lastUpdated,
          confidence: realPrice.confidence
        };
        
        this.priceCache.set(symbol, tokenPrice);
        return realPrice.priceUSD;
      } catch (error) {
        console.warn(`Real market data service failed for ${symbol}, falling back to legacy Chainlink:`, formatError(error));
      }
    }

    // Fallback to legacy Chainlink implementation
    try {
      const price = await this.fetchPriceFromChainlink(symbol);
      return price.priceUSD;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, formatError(error));
      
      // Return cached price if available, even if stale
      if (cachedPrice) {
        console.warn(`Using stale price for ${symbol}`);
        return cachedPrice.priceUSD;
      }
      
      throw new Error(`No price available for ${symbol}`);
    }
  }

  /**
   * Convert token amount to USD value
   */
  public async convertToUSD(
    tokenIdentifier: string,
    amount: string,
    decimals: number = 18
  ): Promise<number> {
    try {
      const priceUSD = await this.getTokenPriceUSD(tokenIdentifier);
      const tokenAmount = parseFloat(amount) / Math.pow(10, decimals);
      return tokenAmount * priceUSD;
    } catch (error) {
      console.error(`Failed to convert ${tokenIdentifier} to USD:`, formatError(error));
      return 0;
    }
  }

  /**
   * Batch convert multiple token amounts to USD
   */
  public async batchConvertToUSD(
    conversions: Array<{
      tokenIdentifier: string;
      amount: string;
      decimals?: number;
    }>
  ): Promise<Array<{ tokenIdentifier: string; usdValue: number }>> {
    const results = await Promise.allSettled(
      conversions.map(async (conversion) => ({
        tokenIdentifier: conversion.tokenIdentifier,
        usdValue: await this.convertToUSD(
          conversion.tokenIdentifier,
          conversion.amount,
          conversion.decimals
        )
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to convert ${conversions[index].tokenIdentifier}:`, result.reason);
        return {
          tokenIdentifier: conversions[index].tokenIdentifier,
          usdValue: 0
        };
      }
    });
  }

  /**
   * Get historical price data for a token
   */
  public async getHistoricalPrices(
    tokenIdentifier: string,
    days: number = 30
  ): Promise<Array<{ timestamp: number; price: number; volume?: number }>> {
    const symbol = this.resolveTokenSymbol(tokenIdentifier);
    
    if (this.realMarketDataService) {
      try {
        return await this.realMarketDataService.getHistoricalPrices(symbol, days);
      } catch (error) {
        console.error(`Failed to fetch historical prices for ${symbol}:`, formatError(error));
        throw error;
      }
    } else {
      throw new Error('Historical price data requires real market data service');
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  public subscribeToRealTimePriceUpdates(
    tokenIdentifier: string,
    callback: (price: { symbol: string; priceUSD: number; change24h?: number }) => void,
    intervalMs: number = 60000
  ): void {
    const symbol = this.resolveTokenSymbol(tokenIdentifier);
    
    if (this.realMarketDataService) {
      this.realMarketDataService.subscribeToRealTimePriceUpdates(
        symbol,
        (realPrice: RealPriceData) => {
          callback({
            symbol: realPrice.symbol,
            priceUSD: realPrice.priceUSD,
            change24h: realPrice.change24h
          });
        },
        intervalMs
      );
    } else {
      console.warn('Real-time price subscriptions require real market data service');
    }
  }

  /**
   * Unsubscribe from real-time price updates
   */
  public unsubscribeFromPriceUpdates(tokenIdentifier: string): void {
    const symbol = this.resolveTokenSymbol(tokenIdentifier);
    
    if (this.realMarketDataService) {
      this.realMarketDataService.unsubscribeFromPriceUpdates(symbol);
    }
  }

  /**
   * Get all cached token prices
   */
  public getAllCachedPrices(): TokenPrice[] {
    return Array.from(this.priceCache.values());
  }

  /**
   * Get price feed service status
   */
  public getServiceStatus(): {
    isRunning: boolean;
    cachedPrices: number;
    lastUpdate: number;
    supportedTokens: string[];
    realDataEnabled: boolean;
    realDataStatus?: any;
  } {
    const prices = Array.from(this.priceCache.values());
    const lastUpdate = prices.length > 0 
      ? Math.max(...prices.map(p => p.lastUpdated))
      : 0;

    const status = {
      isRunning: this.isRunning,
      cachedPrices: this.priceCache.size,
      lastUpdate,
      supportedTokens: this.CHAINLINK_FEEDS.map(feed => feed.symbol),
      realDataEnabled: !!this.realMarketDataService
    };

    // Add real market data service status if available
    if (this.realMarketDataService) {
      try {
        (status as any).realDataStatus = this.realMarketDataService.getServiceStatus();
      } catch (error) {
        console.error('Error getting real market data status:', formatError(error));
      }
    }

    return status;
  }

  /**
   * Update all supported token prices
   */
  private async updateAllPrices(): Promise<void> {
    const updatePromises = this.CHAINLINK_FEEDS.map(async (feed) => {
      try {
        await this.fetchPriceFromChainlink(feed.symbol);
      } catch (error) {
        console.error(`Failed to update price for ${feed.symbol}:`, formatError(error));
      }
    });

    await Promise.allSettled(updatePromises);
    console.log(`Updated prices for ${this.priceCache.size} tokens`);
  }

  /**
   * Fetch price from Chainlink price feed
   */
  private async fetchPriceFromChainlink(symbol: string): Promise<TokenPrice> {
    const feed = this.CHAINLINK_FEEDS.find(f => f.symbol === symbol);
    if (!feed) {
      throw new Error(`No Chainlink feed found for ${symbol}`);
    }

    const rpcUrls = [this.config.chainlinkRpcUrl, ...this.config.fallbackRpcUrls];
    
    for (let i = 0; i < rpcUrls.length; i++) {
      try {
        const price = await this.callChainlinkFeed(rpcUrls[i], feed);
        
        // Cache the price
        this.priceCache.set(symbol, price);
        
        return price;
      } catch (error) {
        console.error(`RPC ${rpcUrls[i]} failed for ${symbol}:`, formatError(error));
        
        if (i === rpcUrls.length - 1) {
          throw error;
        }
      }
    }

    throw new Error(`All RPC endpoints failed for ${symbol}`);
  }

  /**
   * Call Chainlink price feed contract
   */
  private async callChainlinkFeed(rpcUrl: string, feed: ChainlinkFeed): Promise<TokenPrice> {
    // Chainlink AggregatorV3Interface latestRoundData() function selector
    const functionSelector = '0xfeaf968c';
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: feed.feedAddress,
            data: functionSelector
          },
          'latest'
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Chainlink call failed: ${data.error.message}`);
    }

    // Parse the response (roundId, answer, startedAt, updatedAt, answeredInRound)
    const result = data.result;
    if (!result || result === '0x') {
      throw new Error('Empty response from Chainlink feed');
    }

    // Extract price from the response (second return value)
    const priceHex = '0x' + result.slice(66, 130); // Skip first 32 bytes (roundId), take next 32 bytes (answer)
    const priceRaw = parseInt(priceHex, 16);
    const priceUSD = priceRaw / Math.pow(10, feed.decimals);

    // Calculate confidence based on data freshness
    const updatedAtHex = '0x' + result.slice(194, 258); // Fourth return value (updatedAt)
    const updatedAt = parseInt(updatedAtHex, 16) * 1000; // Convert to milliseconds
    const age = getCurrentTimestamp() - updatedAt;
    const confidence = Math.max(0, Math.min(100, 100 - (age / feed.heartbeat / 1000) * 10));

    const tokenPrice: TokenPrice = {
      symbol: feed.symbol,
      address: this.TOKEN_ADDRESSES[feed.symbol] || '',
      priceUSD,
      decimals: feed.decimals,
      lastUpdated: getCurrentTimestamp(),
      confidence: Math.round(confidence)
    };

    return tokenPrice;
  }

  /**
   * Resolve token symbol from address or symbol
   */
  private resolveTokenSymbol(tokenIdentifier: string): string {
    // If it's already a symbol we support
    if (this.CHAINLINK_FEEDS.some(feed => feed.symbol === tokenIdentifier.toUpperCase())) {
      return tokenIdentifier.toUpperCase();
    }

    // Try to find by address
    const addressLower = tokenIdentifier.toLowerCase();
    for (const [symbol, address] of Object.entries(this.TOKEN_ADDRESSES)) {
      if (address.toLowerCase() === addressLower) {
        return symbol;
      }
    }

    // Special case for ETH/WETH
    if (addressLower === '0x0000000000000000000000000000000000000000' || 
        addressLower === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
      return 'ETH';
    }

    throw new Error(`Unsupported token: ${tokenIdentifier}`);
  }

  /**
   * Check if cached price is still fresh
   */
  private isPriceFresh(price: TokenPrice): boolean {
    const age = getCurrentTimestamp() - price.lastUpdated;
    return age < this.config.maxPriceAge;
  }

  /**
   * Health check for price feed service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const serviceStatus = this.getServiceStatus();
      const recentPrices = Array.from(this.priceCache.values())
        .filter(price => this.isPriceFresh(price));

      const isHealthy = this.isRunning && 
                       recentPrices.length > 0 &&
                       serviceStatus.lastUpdate > getCurrentTimestamp() - this.config.maxPriceAge;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          ...serviceStatus,
          freshPrices: recentPrices.length,
          stalePrices: this.priceCache.size - recentPrices.length,
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
}

// Export configuration factory
export function createPriceFeedConfig(): PriceFeedConfig {
  return {
    chainlinkRpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    fallbackRpcUrls: [
      process.env.ETHEREUM_FALLBACK_RPC_1 || 'https://mainnet.infura.io/v3/your-api-key',
      process.env.ETHEREUM_FALLBACK_RPC_2 || 'https://rpc.ankr.com/eth'
    ],
    updateInterval: 5 * 60 * 1000, // 5 minutes
    maxPriceAge: 15 * 60 * 1000, // 15 minutes
    retryAttempts: 3
  };
}