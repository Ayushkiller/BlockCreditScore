// Real-Time Price Feed Manager
// Implements task 6.1: Replace mock price feeds with live Chainlink integration
// Implements task 6.2: Build real price monitoring and caching system

import { EventEmitter } from 'events';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { getRealDataConfigManager } from '../../config/real-data-config';

export interface RealTimePriceData {
  symbol: string;
  address: string;
  priceUSD: number;
  decimals: number;
  timestamp: number;
  roundId: string;
  confidence: number;
  source: 'chainlink' | 'dex_aggregator' | 'coingecko';
  change24h?: number;
  volume24h?: number;
  staleness: number; // seconds since last update
}

export interface ChainlinkPriceFeed {
  symbol: string;
  feedAddress: string;
  decimals: number;
  heartbeat: number; // seconds between updates
  description: string;
}

export interface PriceSubscription {
  symbol: string;
  callback: (price: RealTimePriceData) => void;
  subscriptionId: string;
  isActive: boolean;
}

export interface PriceCacheEntry {
  data: RealTimePriceData;
  ttl: number; // Time to live in milliseconds
  lastAccessed: number;
}

export interface DexAggregatorConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  timeout: number;
}

/**
 * Real-Time Price Feed Manager
 * Manages live Chainlink price feeds with WebSocket subscriptions and caching
 */
export class RealTimePriceFeedManager extends EventEmitter {
  private configManager: any;
  private priceCache: Map<string, PriceCacheEntry> = new Map();
  private subscriptions: Map<string, PriceSubscription> = new Map();
  private chainlinkSubscriptions: Map<string, any> = new Map();
  private isInitialized = false;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private web3Connections: Map<string, any> = new Map();

  // Real Chainlink price feed addresses on Ethereum mainnet
  private readonly CHAINLINK_FEEDS: ChainlinkPriceFeed[] = [
    {
      symbol: 'ETH',
      feedAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      decimals: 8,
      heartbeat: 3600,
      description: 'ETH / USD'
    },
    {
      symbol: 'BTC',
      feedAddress: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      decimals: 8,
      heartbeat: 3600,
      description: 'BTC / USD'
    },
    {
      symbol: 'USDC',
      feedAddress: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      decimals: 8,
      heartbeat: 86400,
      description: 'USDC / USD'
    },
    {
      symbol: 'USDT',
      feedAddress: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      decimals: 8,
      heartbeat: 86400,
      description: 'USDT / USD'
    },
    {
      symbol: 'DAI',
      feedAddress: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
      decimals: 8,
      heartbeat: 3600,
      description: 'DAI / USD'
    },
    {
      symbol: 'LINK',
      feedAddress: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
      decimals: 8,
      heartbeat: 3600,
      description: 'LINK / USD'
    },
    {
      symbol: 'UNI',
      feedAddress: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
      decimals: 8,
      heartbeat: 3600,
      description: 'UNI / USD'
    },
    {
      symbol: 'AAVE',
      feedAddress: '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9',
      decimals: 8,
      heartbeat: 3600,
      description: 'AAVE / USD'
    }
  ];

  // DEX aggregator configurations
  private readonly DEX_AGGREGATORS: DexAggregatorConfig[] = [
    {
      name: '1inch',
      baseUrl: 'https://api.1inch.dev',
      rateLimit: 100,
      timeout: 5000
    },
    {
      name: '0x',
      baseUrl: 'https://api.0x.org',
      rateLimit: 100,
      timeout: 5000
    }
  ];

  // Token contract addresses for DEX price fetching
  private readonly TOKEN_ADDRESSES: Record<string, string> = {
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'USDC': '0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
  };

  constructor() {
    super();
  }

  /**
   * Initialize the real-time price feed manager
   */
  public async initialize(): Promise<void> {
    try {
      this.configManager = await getRealDataConfigManager();
      
      if (!this.configManager.isRealDataEnabled()) {
        throw new Error('Real data integration is not enabled');
      }

      // Initialize Web3 connections for Chainlink feeds
      await this.initializeWeb3Connections();

      // Start cache cleanup interval
      this.startCacheCleanup();

      // Start periodic price updates
      await this.startPeriodicPriceUpdates();

      this.isInitialized = true;
      console.log('🚀 Real-Time Price Feed Manager initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Real-Time Price Feed Manager:', formatError(error));
      throw error;
    }
  }

  /**
   * Initialize Web3 connections for Chainlink price feeds
   */
  private async initializeWeb3Connections(): Promise<void> {
    const rpcProviders = this.configManager.getHealthyRpcProviders();
    
    if (rpcProviders.length === 0) {
      throw new Error('No healthy RPC providers available for Chainlink feeds');
    }

    // Use dynamic import for Web3 to avoid bundling issues
    const Web3 = (await import('web3')).default;

    for (const provider of rpcProviders) {
      try {
        const web3 = new Web3(provider.wsUrl || provider.rpcUrl);
        this.web3Connections.set(provider.name, web3);
        console.log(`✅ Web3 connection established for ${provider.name}`);
      } catch (error) {
        console.error(`❌ Failed to establish Web3 connection for ${provider.name}:`, formatError(error));
      }
    }

    if (this.web3Connections.size === 0) {
      throw new Error('Failed to establish any Web3 connections');
    }
  }

  /**
   * Get real-time price from Chainlink with WebSocket subscription
   */
  public async getChainlinkPriceRealTime(symbol: string): Promise<RealTimePriceData> {
    this.ensureInitialized();

    const feed = this.CHAINLINK_FEEDS.find(f => f.symbol === symbol.toUpperCase());
    if (!feed) {
      throw new Error(`No Chainlink feed available for ${symbol}`);
    }

    // Check cache first
    const cachedPrice = this.getCachedPrice(symbol);
    if (cachedPrice && !this.isPriceStale(cachedPrice, feed.heartbeat)) {
      return cachedPrice;
    }

    try {
      const priceData = await this.fetchChainlinkPrice(feed);
      
      // Cache the price
      this.cachePrice(symbol, priceData);
      
      console.log(`💲 Retrieved Chainlink price for ${symbol}: $${priceData.priceUSD.toFixed(2)}`);
      return priceData;
    } catch (error) {
      console.error(`❌ Failed to get Chainlink price for ${symbol}:`, formatError(error));
      
      // Return stale cached price if available
      if (cachedPrice) {
        console.warn(`⚠️ Using stale cached price for ${symbol}`);
        return { ...cachedPrice, staleness: this.calculateStaleness(cachedPrice) };
      }
      
      throw error;
    }
  }

  /**
   * Get token price from DEX aggregators (1inch, 0x)
   */
  public async getTokenPriceFromDEX(symbol: string): Promise<RealTimePriceData> {
    this.ensureInitialized();

    const tokenAddress = this.TOKEN_ADDRESSES[symbol.toUpperCase()];
    if (!tokenAddress) {
      throw new Error(`No token address available for ${symbol}`);
    }

    // Try 1inch first, then 0x as fallback
    for (const aggregator of this.DEX_AGGREGATORS) {
      try {
        const priceData = await this.fetchDEXPrice(aggregator, symbol, tokenAddress);
        
        // Cache the price
        this.cachePrice(symbol, priceData);
        
        console.log(`💱 Retrieved DEX price for ${symbol} from ${aggregator.name}: $${priceData.priceUSD.toFixed(2)}`);
        return priceData;
      } catch (error) {
        console.error(`❌ Failed to get DEX price from ${aggregator.name} for ${symbol}:`, formatError(error));
        
        // Continue to next aggregator
        if (aggregator === this.DEX_AGGREGATORS[this.DEX_AGGREGATORS.length - 1]) {
          throw new Error(`All DEX aggregators failed for ${symbol}`);
        }
      }
    }

    throw new Error(`No DEX price available for ${symbol}`);
  }

  /**
   * Subscribe to real-time price updates using Chainlink AnswerUpdated events
   */
  public async subscribeToRealTimePriceUpdates(
    symbol: string,
    callback: (price: RealTimePriceData) => void
  ): Promise<string> {
    this.ensureInitialized();

    const feed = this.CHAINLINK_FEEDS.find(f => f.symbol === symbol.toUpperCase());
    if (!feed) {
      throw new Error(`No Chainlink feed available for ${symbol}`);
    }

    const subscriptionId = `${symbol}_${Date.now()}`;

    try {
      // Set up Chainlink event subscription
      await this.setupChainlinkEventSubscription(feed, callback, subscriptionId);

      // Store subscription info
      this.subscriptions.set(subscriptionId, {
        symbol: symbol.toUpperCase(),
        callback,
        subscriptionId,
        isActive: true
      });

      console.log(`📡 Subscribed to real-time price updates for ${symbol} (ID: ${subscriptionId})`);
      
      this.emit('subscriptionCreated', { symbol, subscriptionId });
      
      return subscriptionId;
    } catch (error) {
      console.error(`❌ Failed to subscribe to price updates for ${symbol}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Set up Chainlink AnswerUpdated event subscription
   */
  private async setupChainlinkEventSubscription(
    feed: ChainlinkPriceFeed,
    callback: (price: RealTimePriceData) => void,
    subscriptionId: string
  ): Promise<void> {
    const web3Connections = Array.from(this.web3Connections.values());
    
    if (web3Connections.length === 0) {
      throw new Error('No Web3 connections available');
    }

    // Use the first available Web3 connection
    const web3 = web3Connections[0];

    // Chainlink AggregatorV3Interface ABI for AnswerUpdated event
    const chainlinkABI = [
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "name": "current", "type": "int256"},
          {"indexed": true, "name": "roundId", "type": "uint256"},
          {"indexed": false, "name": "updatedAt", "type": "uint256"}
        ],
        "name": "AnswerUpdated",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
          {"name": "roundId", "type": "uint80"},
          {"name": "answer", "type": "int256"},
          {"name": "startedAt", "type": "uint256"},
          {"name": "updatedAt", "type": "uint256"},
          {"name": "answeredInRound", "type": "uint80"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    const contract = new web3.eth.Contract(chainlinkABI, feed.feedAddress);

    // Subscribe to AnswerUpdated events
    const subscription = contract.events.AnswerUpdated({})
      .on('data', async (event: any) => {
        try {
          console.log(`📊 Chainlink AnswerUpdated event for ${feed.symbol}:`, event.returnValues);
          
          // Fetch latest round data to get complete price information
          const priceData = await this.fetchChainlinkPrice(feed);
          
          // Cache the updated price
          this.cachePrice(feed.symbol, priceData);
          
          // Call the subscription callback
          callback(priceData);
          
          this.emit('priceUpdated', { symbol: feed.symbol, price: priceData });
        } catch (error) {
          console.error(`❌ Error processing AnswerUpdated event for ${feed.symbol}:`, formatError(error));
          this.emit('subscriptionError', { subscriptionId, error: formatError(error) });
        }
      })
      .on('error', (error: Error) => {
        console.error(`❌ Chainlink subscription error for ${feed.symbol}:`, formatError(error));
        this.emit('subscriptionError', { subscriptionId, error: formatError(error) });
      });

    // Store the subscription for cleanup
    this.chainlinkSubscriptions.set(subscriptionId, subscription);
  }

  /**
   * Unsubscribe from real-time price updates
   */
  public async unsubscribeFromPriceUpdates(subscriptionId: string): Promise<void> {
    this.ensureInitialized();

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    try {
      // Unsubscribe from Chainlink events
      const chainlinkSubscription = this.chainlinkSubscriptions.get(subscriptionId);
      if (chainlinkSubscription) {
        await chainlinkSubscription.unsubscribe();
        this.chainlinkSubscriptions.delete(subscriptionId);
      }

      // Mark subscription as inactive
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);

      console.log(`🚫 Unsubscribed from price updates (ID: ${subscriptionId})`);
      
      this.emit('subscriptionRemoved', { subscriptionId });
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from price updates (ID: ${subscriptionId}):`, formatError(error));
      throw error;
    }
  }

  /**
   * Convert token amount to USD using real exchange rates
   */
  public async convertToUSD(
    tokenSymbol: string,
    amount: string,
    decimals: number = 18
  ): Promise<number> {
    this.ensureInitialized();

    try {
      // Try Chainlink first, fallback to DEX
      let priceData: RealTimePriceData;
      
      try {
        priceData = await this.getChainlinkPriceRealTime(tokenSymbol);
      } catch (chainlinkError) {
        console.warn(`Chainlink failed for ${tokenSymbol}, trying DEX:`, formatError(chainlinkError));
        priceData = await this.getTokenPriceFromDEX(tokenSymbol);
      }

      const tokenAmount = parseFloat(amount) / Math.pow(10, decimals);
      const usdValue = tokenAmount * priceData.priceUSD;

      console.log(`💰 Converted ${tokenAmount} ${tokenSymbol} to $${usdValue.toFixed(2)}`);
      return usdValue;
    } catch (error) {
      console.error(`❌ Failed to convert ${tokenSymbol} to USD:`, formatError(error));
      return 0;
    }
  }

  /**
   * Fetch Chainlink price using latestRoundData
   */
  private async fetchChainlinkPrice(feed: ChainlinkPriceFeed): Promise<RealTimePriceData> {
    const rpcProviders = this.configManager.getHealthyRpcProviders();
    
    for (const provider of rpcProviders) {
      try {
        const response = await fetch(provider.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                to: feed.feedAddress,
                data: '0xfeaf968c' // latestRoundData() function selector
              },
              'latest'
            ]
          }),
          signal: AbortSignal.timeout(provider.timeout || 5000)
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(`RPC call failed: ${data.error.message}`);
        }

        return this.parseChainlinkResponse(data.result, feed);
      } catch (error) {
        console.error(`❌ RPC provider ${provider.name} failed for ${feed.symbol}:`, formatError(error));
        
        if (provider === rpcProviders[rpcProviders.length - 1]) {
          throw error;
        }
      }
    }

    throw new Error(`All RPC providers failed for ${feed.symbol}`);
  }

  /**
   * Parse Chainlink latestRoundData response
   */
  private parseChainlinkResponse(result: string, feed: ChainlinkPriceFeed): RealTimePriceData {
    if (!result || result === '0x') {
      throw new Error('Empty response from Chainlink feed');
    }

    // Parse the response (roundId, answer, startedAt, updatedAt, answeredInRound)
    const roundIdHex = '0x' + result.slice(2, 66);
    const answerHex = '0x' + result.slice(66, 130);
    const updatedAtHex = '0x' + result.slice(194, 258);

    const roundId = parseInt(roundIdHex, 16).toString();
    const answer = parseInt(answerHex, 16);
    const updatedAt = parseInt(updatedAtHex, 16) * 1000; // Convert to milliseconds

    const priceUSD = answer / Math.pow(10, feed.decimals);
    const staleness = this.calculateStalenessFromTimestamp(updatedAt);
    const confidence = this.calculateConfidenceFromStaleness(staleness, feed.heartbeat);

    return {
      symbol: feed.symbol,
      address: this.TOKEN_ADDRESSES[feed.symbol] || '',
      priceUSD,
      decimals: feed.decimals,
      timestamp: getCurrentTimestamp(),
      roundId,
      confidence,
      source: 'chainlink',
      staleness
    };
  }

  /**
   * Fetch price from DEX aggregator
   */
  private async fetchDEXPrice(
    aggregator: DexAggregatorConfig,
    symbol: string,
    tokenAddress: string
  ): Promise<RealTimePriceData> {
    let url: string;
    let headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'CryptoVault-Credit-Intelligence/1.0'
    };

    if (aggregator.name === '1inch') {
      // 1inch API v5.0 price endpoint
      url = `${aggregator.baseUrl}/v5.0/1/quote?fromTokenAddress=${tokenAddress}&toTokenAddress=0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505&amount=1000000000000000000`;
      
      if (aggregator.apiKey) {
        headers['Authorization'] = `Bearer ${aggregator.apiKey}`;
      }
    } else if (aggregator.name === '0x') {
      // 0x API price endpoint
      url = `${aggregator.baseUrl}/swap/v1/price?sellToken=${tokenAddress}&buyToken=USDC&sellAmount=1000000000000000000`;
      
      if (aggregator.apiKey) {
        headers['0x-api-key'] = aggregator.apiKey;
      }
    } else {
      throw new Error(`Unsupported DEX aggregator: ${aggregator.name}`);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(aggregator.timeout)
    });

    if (!response.ok) {
      throw new Error(`${aggregator.name} API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse response based on aggregator
    let priceUSD: number;
    
    if (aggregator.name === '1inch') {
      priceUSD = parseFloat(data.toTokenAmount) / Math.pow(10, 6); // USDC has 6 decimals
    } else if (aggregator.name === '0x') {
      priceUSD = parseFloat(data.price);
    } else {
      throw new Error(`Unknown aggregator response format: ${aggregator.name}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      address: tokenAddress,
      priceUSD,
      decimals: 18,
      timestamp: getCurrentTimestamp(),
      roundId: `dex_${Date.now()}`,
      confidence: 85, // DEX prices are generally reliable but less than Chainlink
      source: 'dex_aggregator',
      staleness: 0 // Fresh from DEX
    };
  }

  /**
   * Cache price data with TTL
   */
  private cachePrice(symbol: string, priceData: RealTimePriceData): void {
    const ttl = this.calculateTTL(priceData.source);
    
    this.priceCache.set(symbol.toUpperCase(), {
      data: priceData,
      ttl: getCurrentTimestamp() + ttl,
      lastAccessed: getCurrentTimestamp()
    });
  }

  /**
   * Get cached price if available and fresh
   */
  private getCachedPrice(symbol: string): RealTimePriceData | null {
    const cached = this.priceCache.get(symbol.toUpperCase());
    
    if (!cached) {
      return null;
    }

    // Update last accessed time
    cached.lastAccessed = getCurrentTimestamp();

    // Check if cache is still valid
    if (getCurrentTimestamp() > cached.ttl) {
      this.priceCache.delete(symbol.toUpperCase());
      return null;
    }

    return cached.data;
  }

  /**
   * Check if price is stale based on heartbeat
   */
  private isPriceStale(priceData: RealTimePriceData, heartbeatSeconds: number): boolean {
    const maxAge = heartbeatSeconds * 1000; // Convert to milliseconds
    const age = getCurrentTimestamp() - priceData.timestamp;
    return age > maxAge;
  }

  /**
   * Calculate price staleness in seconds
   */
  private calculateStaleness(priceData: RealTimePriceData): number {
    return Math.floor((getCurrentTimestamp() - priceData.timestamp) / 1000);
  }

  /**
   * Calculate staleness from timestamp
   */
  private calculateStalenessFromTimestamp(timestamp: number): number {
    return Math.floor((getCurrentTimestamp() - timestamp) / 1000);
  }

  /**
   * Calculate confidence based on staleness
   */
  private calculateConfidenceFromStaleness(stalenessSeconds: number, heartbeatSeconds: number): number {
    const maxAge = heartbeatSeconds * 2; // Allow 2x heartbeat before confidence drops significantly
    const confidence = Math.max(0, Math.min(100, 100 - (stalenessSeconds / maxAge) * 100));
    return Math.round(confidence);
  }

  /**
   * Calculate TTL for cache based on data source
   */
  private calculateTTL(source: string): number {
    switch (source) {
      case 'chainlink':
        return 5 * 60 * 1000; // 5 minutes for Chainlink
      case 'dex_aggregator':
        return 2 * 60 * 1000; // 2 minutes for DEX
      case 'coingecko':
        return 10 * 60 * 1000; // 10 minutes for CoinGecko
      default:
        return 5 * 60 * 1000; // Default 5 minutes
    }
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = getCurrentTimestamp();
      let cleanedCount = 0;

      for (const [symbol, cached] of this.priceCache.entries()) {
        // Remove expired entries
        if (now > cached.ttl) {
          this.priceCache.delete(symbol);
          cleanedCount++;
        }
        // Remove entries not accessed in the last hour
        else if (now - cached.lastAccessed > 60 * 60 * 1000) {
          this.priceCache.delete(symbol);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Start periodic price updates for cached tokens
   */
  private async startPeriodicPriceUpdates(): Promise<void> {
    this.priceUpdateInterval = setInterval(async () => {
      const cachedSymbols = Array.from(this.priceCache.keys());
      
      if (cachedSymbols.length === 0) {
        return;
      }

      console.log(`🔄 Updating prices for ${cachedSymbols.length} cached tokens`);

      for (const symbol of cachedSymbols) {
        try {
          // Update price in background (don't await to avoid blocking)
          this.getChainlinkPriceRealTime(symbol).catch(error => {
            console.error(`❌ Background price update failed for ${symbol}:`, formatError(error));
          });
        } catch (error) {
          // Ignore errors in background updates
        }
      }
    }, 2 * 60 * 1000); // Update every 2 minutes
  }

  /**
   * Get all active subscriptions
   */
  public getActiveSubscriptions(): PriceSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive);
  }

  /**
   * Get cached prices with staleness information
   */
  public getAllCachedPrices(): Array<RealTimePriceData & { cacheInfo: { ttl: number; lastAccessed: number } }> {
    return Array.from(this.priceCache.entries()).map(([symbol, cached]) => ({
      ...cached.data,
      staleness: this.calculateStaleness(cached.data),
      cacheInfo: {
        ttl: cached.ttl,
        lastAccessed: cached.lastAccessed
      }
    }));
  }

  /**
   * Get service status and statistics
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    cachedPrices: number;
    activeSubscriptions: number;
    web3Connections: number;
    supportedTokens: string[];
    cacheHitRate?: number;
    lastUpdate: number;
  } {
    const cachedPrices = Array.from(this.priceCache.values());
    const lastUpdate = cachedPrices.length > 0 
      ? Math.max(...cachedPrices.map(p => p.data.timestamp))
      : 0;

    return {
      isInitialized: this.isInitialized,
      cachedPrices: this.priceCache.size,
      activeSubscriptions: this.getActiveSubscriptions().length,
      web3Connections: this.web3Connections.size,
      supportedTokens: this.CHAINLINK_FEEDS.map(feed => feed.symbol),
      lastUpdate
    };
  }

  /**
   * Perform health check on price feeds
   */
  public async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      const testSymbol = 'ETH';
      const startTime = Date.now();
      
      // Test Chainlink price fetch
      const chainlinkPrice = await this.getChainlinkPriceRealTime(testSymbol);
      const chainlinkLatency = Date.now() - startTime;

      // Test DEX price fetch
      const dexStartTime = Date.now();
      let dexPrice: RealTimePriceData | null = null;
      let dexLatency = 0;
      
      try {
        dexPrice = await this.getTokenPriceFromDEX(testSymbol);
        dexLatency = Date.now() - dexStartTime;
      } catch (dexError) {
        console.warn('DEX price fetch failed during health check:', formatError(dexError));
      }

      const serviceStatus = this.getServiceStatus();
      
      // Determine overall health
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!chainlinkPrice || chainlinkLatency > 10000) {
        status = 'unhealthy';
      } else if (!dexPrice || dexLatency > 15000 || serviceStatus.web3Connections === 0) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          ...serviceStatus,
          healthCheck: {
            chainlinkLatency,
            dexLatency,
            chainlinkPrice: chainlinkPrice?.priceUSD,
            dexPrice: dexPrice?.priceUSD,
            timestamp: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: formatError(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Stop the service and cleanup resources
   */
  public async stop(): Promise<void> {
    try {
      // Stop intervals
      if (this.cacheCleanupInterval) {
        clearInterval(this.cacheCleanupInterval);
        this.cacheCleanupInterval = null;
      }

      if (this.priceUpdateInterval) {
        clearInterval(this.priceUpdateInterval);
        this.priceUpdateInterval = null;
      }

      // Unsubscribe from all Chainlink events
      for (const [subscriptionId, subscription] of this.chainlinkSubscriptions.entries()) {
        try {
          await subscription.unsubscribe();
        } catch (error) {
          console.error(`❌ Error unsubscribing from ${subscriptionId}:`, formatError(error));
        }
      }

      // Clear all data structures
      this.priceCache.clear();
      this.subscriptions.clear();
      this.chainlinkSubscriptions.clear();
      this.web3Connections.clear();

      this.isInitialized = false;
      console.log('🛑 Real-Time Price Feed Manager stopped');
      
      this.emit('stopped');
    } catch (error) {
      console.error('❌ Error stopping Real-Time Price Feed Manager:', formatError(error));
      throw error;
    }
  }

  /**
   * Ensure the manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Real-Time Price Feed Manager not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance
let realTimePriceFeedManagerInstance: RealTimePriceFeedManager | null = null;

export async function getRealTimePriceFeedManager(): Promise<RealTimePriceFeedManager> {
  if (!realTimePriceFeedManagerInstance) {
    realTimePriceFeedManagerInstance = new RealTimePriceFeedManager();
    await realTimePriceFeedManagerInstance.initialize();
  }
  return realTimePriceFeedManagerInstance;
}