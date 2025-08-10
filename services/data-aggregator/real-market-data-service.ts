// Real Market Data Service - Integrates with live APIs for authentic market data
// Implements task 4.1: Replace mock price data with live API feeds

import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { getRealDataConfigManager } from '../../config/real-data-config';

export interface RealPriceData {
  symbol: string;
  address: string;
  priceUSD: number;
  decimals: number;
  lastUpdated: number;
  confidence: number;
  source: 'chainlink' | 'coingecko' | 'coinmarketcap';
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
}

export interface HistoricalPriceData {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface PriceSubscription {
  symbol: string;
  callback: (price: RealPriceData) => void;
  interval: NodeJS.Timeout;
}

export interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
    last_updated_at: number;
  };
}

export interface CoinGeckoHistoricalResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export class RealMarketDataService {
  private configManager: any;
  private priceCache: Map<string, RealPriceData> = new Map();
  private subscriptions: Map<string, PriceSubscription> = new Map();
  private isInitialized: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;

  // CoinGecko coin ID mappings
  private readonly COINGECKO_COIN_IDS: Record<string, string> = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'dai',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'COMP': 'compound-governance-token',
    'MKR': 'maker',
    'WETH': 'weth',
    'WBTC': 'wrapped-bitcoin'
  };

  // Chainlink price feed addresses
  private readonly CHAINLINK_FEEDS: Record<string, string> = {
    'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    'USDC': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    'DAI': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
    'LINK': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
    'UNI': '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
    'AAVE': '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9',
    'COMP': '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
    'MKR': '0xec1D1B3b0443256cc3860e24a46F108e699484Aa'
  };

  constructor() {}

  /**
   * Initialize the real market data service
   */
  public async initialize(): Promise<void> {
    try {
      this.configManager = await getRealDataConfigManager();
      
      if (!this.configManager.isRealDataEnabled()) {
        throw new Error('Real data integration is not enabled');
      }

      // Start automatic price updates
      await this.startPriceUpdates();
      
      this.isInitialized = true;
      console.log('Real market data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize real market data service:', formatError(error));
      throw error;
    }
  }

  /**
   * Start automatic price updates from CoinGecko
   */
  private async startPriceUpdates(): Promise<void> {
    // Initial price fetch
    await this.updateAllPricesFromCoinGecko();

    // Set up periodic updates (every 5 minutes to respect rate limits)
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllPricesFromCoinGecko();
      } catch (error) {
        console.error('Error updating prices from CoinGecko:', formatError(error));
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get real-time price from CoinGecko API
   */
  public async getRealTimePriceFromCoinGecko(symbol: string): Promise<RealPriceData> {
    const coinId = this.COINGECKO_COIN_IDS[symbol.toUpperCase()];
    if (!coinId) {
      throw new Error(`Unsupported token symbol: ${symbol}`);
    }

    const marketProviders = this.configManager.getHealthyMarketDataProviders();
    const coinGeckoProvider = marketProviders.price.find(p => p.name === 'CoinGecko');
    
    if (!coinGeckoProvider) {
      throw new Error('CoinGecko provider not available');
    }

    try {
      const url = `${coinGeckoProvider.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
      };

      // Add API key if available
      if (coinGeckoProvider.apiKey) {
        headers['X-CG-Demo-API-Key'] = coinGeckoProvider.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data: CoinGeckoResponse = await response.json();
      const coinData = data[coinId];

      if (!coinData) {
        throw new Error(`No data returned for ${symbol}`);
      }

      const priceData: RealPriceData = {
        symbol: symbol.toUpperCase(),
        address: this.getTokenAddress(symbol),
        priceUSD: coinData.usd,
        decimals: 18, // Default for most tokens
        lastUpdated: getCurrentTimestamp(),
        confidence: this.calculateConfidence(coinData.last_updated_at),
        source: 'coingecko',
        change24h: coinData.usd_24h_change,
        volume24h: coinData.usd_24h_vol,
        marketCap: coinData.usd_market_cap
      };

      // Cache the price
      this.priceCache.set(symbol.toUpperCase(), priceData);

      return priceData;
    } catch (error) {
      console.error(`Failed to fetch CoinGecko price for ${symbol}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get historical price data from CoinGecko
   */
  public async getHistoricalPrices(
    symbol: string, 
    days: number = 30
  ): Promise<HistoricalPriceData[]> {
    const coinId = this.COINGECKO_COIN_IDS[symbol.toUpperCase()];
    if (!coinId) {
      throw new Error(`Unsupported token symbol: ${symbol}`);
    }

    const marketProviders = this.configManager.getHealthyMarketDataProviders();
    const coinGeckoProvider = marketProviders.price.find(p => p.name === 'CoinGecko');
    
    if (!coinGeckoProvider) {
      throw new Error('CoinGecko provider not available');
    }

    try {
      const url = `${coinGeckoProvider.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
      };

      if (coinGeckoProvider.apiKey) {
        headers['X-CG-Demo-API-Key'] = coinGeckoProvider.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: coinGeckoProvider.timeout
      });

      if (!response.ok) {
        throw new Error(`CoinGecko historical API error: ${response.status} ${response.statusText}`);
      }

      const data: CoinGeckoHistoricalResponse = await response.json();

      return data.prices.map(([timestamp, price], index) => ({
        timestamp,
        price,
        volume: data.total_volumes[index] ? data.total_volumes[index][1] : undefined
      }));
    } catch (error) {
      console.error(`Failed to fetch historical prices for ${symbol}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get price with Chainlink fallback
   */
  public async getPriceWithChainlinkFallback(symbol: string): Promise<RealPriceData> {
    try {
      // Try CoinGecko first
      return await this.getRealTimePriceFromCoinGecko(symbol);
    } catch (coinGeckoError) {
      console.warn(`CoinGecko failed for ${symbol}, trying Chainlink:`, formatError(coinGeckoError));
      
      try {
        // Fallback to Chainlink
        return await this.getChainlinkPrice(symbol);
      } catch (chainlinkError) {
        console.error(`Both CoinGecko and Chainlink failed for ${symbol}:`, formatError(chainlinkError));
        
        // Return cached price if available
        const cachedPrice = this.priceCache.get(symbol.toUpperCase());
        if (cachedPrice) {
          console.warn(`Using cached price for ${symbol}`);
          return cachedPrice;
        }
        
        throw new Error(`No price available for ${symbol}: CoinGecko and Chainlink both failed`);
      }
    }
  }

  /**
   * Get price from Chainlink price feed
   */
  public async getChainlinkPrice(symbol: string): Promise<RealPriceData> {
    const feedAddress = this.CHAINLINK_FEEDS[symbol.toUpperCase()];
    if (!feedAddress) {
      throw new Error(`No Chainlink feed available for ${symbol}`);
    }

    const rpcProviders = this.configManager.getHealthyRpcProviders();
    if (rpcProviders.length === 0) {
      throw new Error('No healthy RPC providers available');
    }

    for (const provider of rpcProviders) {
      try {
        const priceData = await this.callChainlinkFeed(provider.rpcUrl, feedAddress, symbol);
        
        // Cache the price
        this.priceCache.set(symbol.toUpperCase(), priceData);
        
        return priceData;
      } catch (error) {
        console.error(`Chainlink call failed for provider ${provider.name}:`, formatError(error));
        
        if (provider === rpcProviders[rpcProviders.length - 1]) {
          throw error;
        }
      }
    }

    throw new Error(`All RPC providers failed for Chainlink price feed ${symbol}`);
  }

  /**
   * Subscribe to real-time price updates
   */
  public subscribeToRealTimePriceUpdates(
    symbol: string,
    callback: (price: RealPriceData) => void,
    intervalMs: number = 60000 // 1 minute default
  ): void {
    const existingSubscription = this.subscriptions.get(symbol);
    if (existingSubscription) {
      clearInterval(existingSubscription.interval);
    }

    const interval = setInterval(async () => {
      try {
        const price = await this.getPriceWithChainlinkFallback(symbol);
        callback(price);
      } catch (error) {
        console.error(`Price subscription error for ${symbol}:`, formatError(error));
      }
    }, intervalMs);

    this.subscriptions.set(symbol, {
      symbol,
      callback,
      interval
    });

    console.log(`Subscribed to real-time price updates for ${symbol}`);
  }

  /**
   * Unsubscribe from price updates
   */
  public unsubscribeFromPriceUpdates(symbol: string): void {
    const subscription = this.subscriptions.get(symbol);
    if (subscription) {
      clearInterval(subscription.interval);
      this.subscriptions.delete(symbol);
      console.log(`Unsubscribed from price updates for ${symbol}`);
    }
  }

  /**
   * Update all supported token prices from CoinGecko
   */
  private async updateAllPricesFromCoinGecko(): Promise<void> {
    const supportedSymbols = Object.keys(this.COINGECKO_COIN_IDS);
    const batchSize = 5; // Process in batches to respect rate limits

    for (let i = 0; i < supportedSymbols.length; i += batchSize) {
      const batch = supportedSymbols.slice(i, i + batchSize);
      
      const updatePromises = batch.map(async (symbol) => {
        try {
          await this.getRealTimePriceFromCoinGecko(symbol);
        } catch (error) {
          console.error(`Failed to update price for ${symbol}:`, formatError(error));
        }
      });

      await Promise.allSettled(updatePromises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < supportedSymbols.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    console.log(`Updated prices for ${this.priceCache.size} tokens from CoinGecko`);
  }

  /**
   * Call Chainlink price feed contract
   */
  private async callChainlinkFeed(rpcUrl: string, feedAddress: string, symbol: string): Promise<RealPriceData> {
    const functionSelector = '0xfeaf968c'; // latestRoundData()
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: feedAddress,
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

    const result = data.result;
    if (!result || result === '0x') {
      throw new Error('Empty response from Chainlink feed');
    }

    // Parse the response
    const priceHex = '0x' + result.slice(66, 130);
    const priceRaw = parseInt(priceHex, 16);
    const priceUSD = priceRaw / Math.pow(10, 8); // Chainlink uses 8 decimals

    const updatedAtHex = '0x' + result.slice(194, 258);
    const updatedAt = parseInt(updatedAtHex, 16) * 1000;
    const confidence = this.calculateConfidence(updatedAt / 1000);

    return {
      symbol: symbol.toUpperCase(),
      address: this.getTokenAddress(symbol),
      priceUSD,
      decimals: 8,
      lastUpdated: getCurrentTimestamp(),
      confidence,
      source: 'chainlink'
    };
  }

  /**
   * Calculate confidence score based on data age
   */
  private calculateConfidence(lastUpdatedTimestamp: number): number {
    const age = getCurrentTimestamp() - (lastUpdatedTimestamp * 1000);
    const maxAge = 3600000; // 1 hour
    return Math.max(0, Math.min(100, 100 - (age / maxAge) * 100));
  }

  /**
   * Get token contract address
   */
  private getTokenAddress(symbol: string): string {
    const addresses: Record<string, string> = {
      'ETH': '0x0000000000000000000000000000000000000000',
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
    
    return addresses[symbol.toUpperCase()] || '';
  }

  /**
   * Get all cached prices
   */
  public getAllCachedPrices(): RealPriceData[] {
    return Array.from(this.priceCache.values());
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    cachedPrices: number;
    activeSubscriptions: number;
    lastUpdate: number;
    supportedTokens: string[];
  } {
    const prices = Array.from(this.priceCache.values());
    const lastUpdate = prices.length > 0 
      ? Math.max(...prices.map(p => p.lastUpdated))
      : 0;

    return {
      isInitialized: this.isInitialized,
      cachedPrices: this.priceCache.size,
      activeSubscriptions: this.subscriptions.size,
      lastUpdate,
      supportedTokens: Object.keys(this.COINGECKO_COIN_IDS)
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

    // Clear all subscriptions
    for (const subscription of this.subscriptions.values()) {
      clearInterval(subscription.interval);
    }
    this.subscriptions.clear();

    this.isInitialized = false;
    console.log('Real market data service stopped');
  }
}

// Export singleton instance
let realMarketDataServiceInstance: RealMarketDataService | null = null;

export async function getRealMarketDataService(): Promise<RealMarketDataService> {
  if (!realMarketDataServiceInstance) {
    realMarketDataServiceInstance = new RealMarketDataService();
    await realMarketDataServiceInstance.initialize();
  }
  return realMarketDataServiceInstance;
}