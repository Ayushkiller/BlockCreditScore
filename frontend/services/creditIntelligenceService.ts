// Credit Intelligence Service
// This service would connect to your deployed smart contracts and backend services

import { url } from "inspector";

export interface CreditProfile {
  address: string;
  linkedWallets: string[];
  overallScore: number;
  tier: string;
  dimensions: {
    defiReliability: ScoreDimension;
    tradingConsistency: ScoreDimension;
    stakingCommitment: ScoreDimension;
    governanceParticipation: ScoreDimension;
    liquidityProvider: ScoreDimension;
  };
  socialCredit: SocialCreditData;
  predictions: RiskPrediction;
  achievements: Achievement[];
  nftTokenId?: number;
  lastUpdated: number;
}

export interface ScoreDimension {
  score: number; // 0-1000 scale
  confidence: number; // 0-100 percentage
  dataPoints: number;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: number;
  recommendations: string[];
}

export interface SocialCreditData {
  overallRating: number;
  totalTransactions: number;
  successRate: number;
  communityRank: number;
  referrals: number;
  trustScore: number;
  p2pLendingHistory: P2PLending[];
  communityFeedback: CommunityFeedback[];
  disputeHistory: Dispute[];
}

export interface RiskPrediction {
  risk30d: number;
  risk90d: number;
  risk180d: number;
  confidence: number;
  insights: string[];
  marketVolatilityAdjustment: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: string;
  unlockedAt?: number;
}

export interface P2PLending {
  id: string;
  counterparty: string;
  amount: number;
  duration: number;
  repaymentStatus: 'completed' | 'partial' | 'defaulted' | 'active';
  timeliness: number;
  timestamp: number;
}

export interface CommunityFeedback {
  id: string;
  from: string;
  rating: number;
  comment: string;
  timestamp: number;
  verified: boolean;
}

export interface Dispute {
  id: string;
  type: 'lending' | 'borrowing' | 'feedback';
  status: 'open' | 'resolved' | 'escalated';
  resolution?: string;
  timestamp: number;
}

export interface AnalyticsData {
  scoreHistory: ScoreHistoryPoint[];
  behaviorTrends: BehaviorTrend[];
  peerComparison: PeerComparison;
  transactionMetrics: TransactionMetrics;
}

export interface ScoreHistoryPoint {
  timestamp: number;
  overallScore: number;
  dimensions: { [key: string]: number };
}

export interface BehaviorTrend {
  category: string;
  trend: number;
  change: 'increase' | 'decrease' | 'stable';
  timeframe: string;
}

export interface PeerComparison {
  percentile: number;
  averageScore: number;
  userScore: number;
  totalUsers: number;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalVolume: number;
  uniqueProtocols: number;
  timeframe: string;
}

export interface ZKProof {
  id: string;
  type: 'threshold' | 'selective' | 'full';
  status: 'generating' | 'ready' | 'verified' | 'expired';
  threshold?: number;
  dimensions?: string[];
  proof: string;
  timestamp: number;
  expiresAt: number;
}

class CreditIntelligenceService {
  private baseUrl: string;
  private contractAddress: string;
  private web3Provider: any;
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
    this.initializeWebSocketConnection();
  }

  /**
   * Initialize WebSocket connection for real-time transaction updates
   */
  private initializeWebSocketConnection(): void {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/transactions';
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('🔗 WebSocket connection established for real-time transaction updates');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 WebSocket connection closed, attempting to reconnect...');
        setTimeout(() => this.initializeWebSocketConnection(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  /**
   * Handle real-time updates from blockchain data manager and market data services
   */
  private handleRealtimeUpdate(data: any): void {
    const { type, payload } = data;

    switch (type) {
      case 'transactionDetected':
        this.notifyListeners('transactionDetected', payload);
        break;
      case 'transactionConfirmed':
        this.notifyListeners('transactionConfirmed', payload);
        break;
      case 'eventDetected':
        this.notifyListeners('eventDetected', payload);
        break;
      case 'scoreUpdate':
        this.notifyListeners('scoreUpdate', payload);
        break;
      case 'blockchainStatus':
        this.notifyListeners('blockchainStatus', payload);
        break;
      case 'priceUpdate':
        this.notifyListeners('priceUpdate', payload);
        break;
      case 'marketDataStatus':
        this.notifyListeners('marketDataStatus', payload);
        break;
      case 'volatilityAlert':
        this.notifyListeners('volatilityAlert', payload);
        break;
      case 'priceFeedError':
        this.notifyListeners('priceFeedError', payload);
        break;
      default:
        console.log('Unknown real-time update type:', type);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);

    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Credit Profile Methods
  async getCreditProfile(address: string): Promise<CreditProfile | null> {
    try {
      // Fetch real credit profile from blockchain data manager
      const response = await fetch(`${this.baseUrl}/api/credit-profile/${address}`);
      if (!response.ok) return null;

      const profile = await response.json();

      // Enhance with real-time transaction data
      const realtimeData = await this.getRealTimeTransactionData(address);
      if (realtimeData) {
        profile.realtimeTransactions = realtimeData.transactions;
        profile.realtimeEvents = realtimeData.events;
        profile.lastBlockUpdate = realtimeData.currentBlock;
      }

      return profile;
    } catch (error) {
      console.error('Error fetching credit profile:', error);
      return null;
    }
  }

  /**
   * Get real-time transaction data for an address
   */
  async getRealTimeTransactionData(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/transactions/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching real-time transaction data:', error);
      return null;
    }
  }

  async updateCreditProfile(address: string, data: Partial<CreditProfile>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/credit-profile/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating credit profile:', error);
      return false;
    }
  }

  // Analytics Methods
  async getAnalytics(address: string, timeframe: string = '30d'): Promise<AnalyticsData | null> {
    try {
      // Fetch analytics with real transaction data
      const response = await fetch(`${this.baseUrl}/api/analytics/${address}?timeframe=${timeframe}`);
      if (!response.ok) return null;

      const analytics = await response.json();

      // Enhance with real blockchain metrics
      const blockchainMetrics = await this.getBlockchainMetrics(address, timeframe);
      if (blockchainMetrics) {
        analytics.realTransactionMetrics = blockchainMetrics.transactions;
        analytics.realProtocolInteractions = blockchainMetrics.protocols;
        analytics.realEventHistory = blockchainMetrics.events;
        analytics.gasAnalysis = blockchainMetrics.gasUsage;
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }

  /**
   * Get real blockchain metrics for analytics
   */
  async getBlockchainMetrics(address: string, timeframe: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/metrics/${address}?timeframe=${timeframe}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching blockchain metrics:', error);
      return null;
    }
  }

  async exportAnalytics(address: string, options: any): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/${address}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (!response.ok) return null;
      return await response.blob();
    } catch (error) {
      console.error('Error exporting analytics:', error);
      return null;
    }
  }

  // Social Credit Methods
  async getSocialCreditData(address: string): Promise<SocialCreditData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social-credit/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching social credit data:', error);
      return null;
    }
  }

  async submitFeedback(fromAddress: string, toAddress: string, feedback: Omit<CommunityFeedback, 'id' | 'timestamp' | 'verified'>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/social-credit/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress, toAddress, ...feedback })
      });
      return response.ok;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  // Achievement Methods
  async getAchievements(address: string): Promise<Achievement[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/achievements/${address}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  async claimAchievement(address: string, achievementId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/achievements/${address}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error claiming achievement:', error);
      return false;
    }
  }

  // ZK Proof Methods
  async generateZKProof(address: string, proofType: 'threshold' | 'selective' | 'full', options: any): Promise<ZKProof | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/zk-proofs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, proofType, ...options })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      return null;
    }
  }

  async verifyZKProof(proof: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/zk-proofs/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof })
      });
      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Error verifying ZK proof:', error);
      return false;
    }
  }

  async getActiveProofs(address: string): Promise<ZKProof[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/zk-proofs/${address}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching active proofs:', error);
      return [];
    }
  }

  // Real-time Monitoring Methods
  async subscribeToScoreUpdates(address: string, callback: (update: any) => void): Promise<() => void> {
    // Subscribe to real-time score updates via WebSocket
    return this.subscribe('scoreUpdate', (data: any) => {
      if (data.address === address) {
        callback(data);
      }
    });
  }

  /**
   * Subscribe to real-time transaction updates for an address
   */
  async subscribeToTransactionUpdates(address: string, callback: (transaction: any) => void): Promise<() => void> {
    // Request monitoring for this address
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'monitorAddress',
        address: address
      }));
    }

    return this.subscribe('transactionDetected', (data: any) => {
      if (data.transaction.from === address || data.transaction.to === address) {
        callback(data.transaction);
      }
    });
  }

  /**
   * Subscribe to real-time blockchain events
   */
  async subscribeToBlockchainEvents(callback: (event: any) => void): Promise<() => void> {
    return this.subscribe('eventDetected', callback);
  }

  /**
   * Subscribe to blockchain connection status updates
   */
  async subscribeToConnectionStatus(callback: (status: any) => void): Promise<() => void> {
    return this.subscribe('blockchainStatus', callback);
  }

  /**
   * Get current blockchain connection status
   */
  async getBlockchainStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/status`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching blockchain status:', error);
      return null;
    }
  }

  /**
   * Get transaction monitoring statistics
   */
  async getTransactionMonitoringStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/monitoring/stats`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching monitoring stats:', error);
      return null;
    }
  }

  /**
   * Get recent blockchain events
   */
  async getRecentEvents(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/events/recent?limit=${limit}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/transactions/pending`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      return [];
    }
  }

  /**
   * Get confirmed transactions for an address
   */
  async getConfirmedTransactions(address: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/transactions/confirmed/${address}?limit=${limit}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching confirmed transactions:', error);
      return [];
    }
  }

  // Real Market Data Integration Methods

  /**
   * Get real-time price data using integrated price feed service
   */
  async getRealTimePrice(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/price/${symbol}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching real-time price:', error);
      return null;
    }
  }

  /**
   * Get multiple real-time prices in batch
   */
  async getBatchRealTimePrices(symbols: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/prices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      console.error('Error fetching batch real-time prices:', error);
      return {};
    }
  }

  /**
   * Get historical price data from CoinGecko
   */
  async getHistoricalPrices(symbol: string, days: number = 30): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/historical/${symbol}?days=${days}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return [];
    }
  }

  /**
   * Convert token amount to USD using real-time prices
   */
  async convertToUSD(tokenSymbol: string, amount: string, decimals: number = 18): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/convert-to-usd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSymbol, amount, decimals })
      });
      if (!response.ok) return 0;
      const result = await response.json();
      return result.usdValue || 0;
    } catch (error) {
      console.error('Error converting to USD:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  async subscribeToRealTimePriceUpdates(
    symbol: string,
    callback: (priceData: any) => void
  ): Promise<() => void> {
    // Request price monitoring for this symbol
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'subscribePriceUpdates',
        symbol: symbol
      }));
    }

    return this.subscribe('priceUpdate', (data: any) => {
      if (data.symbol === symbol) {
        callback(data);
      }
    });
  }

  /**
   * Get market data service status
   */
  async getMarketDataStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/status`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching market data status:', error);
      return null;
    }
  }

  /**
   * Get supported tokens for price feeds
   */
  async getSupportedTokens(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/supported-tokens`);
      if (!response.ok) return [];
      const result = await response.json();
      return result.tokens || [];
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      return [];
    }
  }

  /**
   * Get price feed health check
   */
  async getPriceFeedHealthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/health-check`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching price feed health check:', error);
      return null;
    }
  }

  // Real DeFi Market Data Integration Methods

  /**
   * Get TVL data for a specific protocol from DefiLlama
   */
  async getProtocolTVL(protocol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/tvl/${protocol}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`Error fetching TVL for ${protocol}:`, error);
      return null;
    }
  }

  /**
   * Get Fear & Greed Index for market sentiment
   */
  async getFearGreedIndex(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/fear-greed-index`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
      return null;
    }
  }

  /**
   * Get protocol yield data from Aave, Compound, and other DeFi protocols
   */
  async getProtocolYields(protocol?: string): Promise<any[]> {
    try {
      const url = protocol
        ? `${this.baseUrl}/api/market-data/protocol-yields?protocol=${protocol}`
        : `${this.baseUrl}/api/market-data/protocol-yields`;

      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol yields:', error);
      return [];
    }
  }

  /**
   * Calculate market volatility for an asset
   */
  async calculateMarketVolatility(asset: string, historicalPrices: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/market-volatility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, historicalPrices })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error calculating market volatility:', error);
      return null;
    }
  }

  /**
   * Get comprehensive market data (TVL, yields, sentiment, volatility)
   */
  async getAllMarketData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-data/all-market-data`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching all market data:', error);
      return null;
    }
  }

  /**
   * Subscribe to market data updates
   */
  async subscribeToMarketDataUpdates(callback: (data: any) => void): Promise<() => void> {
    // Request market data monitoring
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'subscribeMarketData'
      }));
    }

    return this.subscribe('marketDataUpdate', callback);
  }

  /**
   * Get market sentiment analysis incorporating Fear & Greed Index
   */
  async getMarketSentimentAnalysis(): Promise<any> {
    try {
      const [fearGreed, volatilityETH, volatilityBTC] = await Promise.all([
        this.getFearGreedIndex(),
        this.getHistoricalPrices('ETH', 30).then(prices =>
          this.calculateMarketVolatility('ETH', prices)
        ),
        this.getHistoricalPrices('BTC', 30).then(prices =>
          this.calculateMarketVolatility('BTC', prices)
        )
      ]);

      return {
        fearGreedIndex: fearGreed,
        volatility: {
          ETH: volatilityETH,
          BTC: volatilityBTC
        },
        overallSentiment: this.calculateOverallSentiment(fearGreed, volatilityETH, volatilityBTC),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting market sentiment analysis:', error);
      return null;
    }
  }

  /**
   * Calculate overall market sentiment score
   */
  private calculateOverallSentiment(fearGreed: any, ethVolatility: any, btcVolatility: any): any {
    if (!fearGreed) return null;

    let sentimentScore = fearGreed.value; // Base score from Fear & Greed (0-100)

    // Adjust based on volatility
    if (ethVolatility && btcVolatility) {
      const avgVolatility = (ethVolatility.volatility30d + btcVolatility.volatility30d) / 2;

      // High volatility reduces sentiment score
      if (avgVolatility > 80) {
        sentimentScore = Math.max(0, sentimentScore - 20);
      } else if (avgVolatility > 60) {
        sentimentScore = Math.max(0, sentimentScore - 10);
      }
    }

    // Determine sentiment classification
    let classification = 'Neutral';
    if (sentimentScore <= 20) classification = 'Extreme Fear';
    else if (sentimentScore <= 40) classification = 'Fear';
    else if (sentimentScore >= 80) classification = 'Extreme Greed';
    else if (sentimentScore >= 60) classification = 'Greed';

    return {
      score: sentimentScore,
      classification,
      factors: {
        fearGreedIndex: fearGreed.value,
        volatilityAdjustment: ethVolatility && btcVolatility ?
          (ethVolatility.volatility30d + btcVolatility.volatility30d) / 2 : 0
      }
    };
  }

  // Real DeFi Protocol Integration Methods

  /**
   * Get real Aave V3 positions for a user
   */
  async getAavePositions(address: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/aave/positions/${address}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching Aave positions:', error);
      return [];
    }
  }

  /**
   * Get real Compound positions for a user
   */
  async getCompoundPositions(address: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/compound/positions/${address}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching Compound positions:', error);
      return [];
    }
  }

  /**
   * Get real protocol statistics (TVL, utilization rates, etc.)
   */
  async getProtocolStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/statistics`);
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol statistics:', error);
      return {};
    }
  }

  /**
   * Get real protocol yield data
   */
  async getProtocolYieldData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/yields`);
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol yield data:', error);
      return {};
    }
  }

  /**
   * Get real protocol interaction history for a user
   */
  async getProtocolInteractionHistory(address: string, timeframe: string = '30d'): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/interactions/${address}?timeframe=${timeframe}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol interaction history:', error);
      return [];
    }
  }

  /**
   * Get real Uniswap V3 pool information
   */
  async getUniswapPoolInfo(poolAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/uniswap/pool/${poolAddress}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Uniswap pool info:', error);
      return null;
    }
  }

  /**
   * Get real Chainlink price data
   */
  async getChainlinkPrice(feedAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/chainlink/price/${feedAddress}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching Chainlink price:', error);
      return null;
    }
  }

  /**
   * Decode real transaction data using contract ABIs
   */
  async decodeTransactionData(txData: string, contractAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/decode-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txData, contractAddress })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error decoding transaction data:', error);
      return null;
    }
  }

  /**
   * Get real protocol TVL data
   */
  async getProtocolTVLData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/protocols/tvl`);
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol TVL data:', error);
      return {};
    }
  }

  // Real User Behavior Analysis Methods

  /**
   * Get user transaction profile from real transaction credit analyzer
   */
  async getUserTransactionProfile(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/user-transaction-profile/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user transaction profile:', error);
      return null;
    }
  }

  /**
   * Get comprehensive user behavior profile using real blockchain data
   */
  async getUserBehaviorProfile(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/user-behavior-profile/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user behavior profile:', error);
      return null;
    }
  }

  /**
   * Get real staking behavior analysis using actual staking contract events
   */
  async getStakingBehaviorAnalysis(address: string, timeframe?: string): Promise<any> {
    try {
      const url = timeframe
        ? `${this.baseUrl}/api/blockchain/staking-behavior/${address}?timeframe=${timeframe}`
        : `${this.baseUrl}/api/blockchain/staking-behavior/${address}`;

      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching staking behavior analysis:', error);
      return null;
    }
  }

  /**
   * Get real liquidation risk indicators using actual lending protocol events
   */
  async getLiquidationRiskIndicators(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/liquidation-risk/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching liquidation risk indicators:', error);
      return null;
    }
  }

  /**
   * Get real transaction pattern analysis using actual blockchain data
   */
  async getTransactionPatternAnalysis(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/transaction-patterns/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction pattern analysis:', error);
      return null;
    }
  }

  /**
   * Get user behavior insights based on real blockchain analysis
   */
  async getUserBehaviorInsights(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/behavior-insights/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user behavior insights:', error);
      return null;
    }
  }

  /**
   * Get staking rewards history from real staking contracts
   */
  async getStakingRewardsHistory(address: string, timeframe?: string): Promise<any[]> {
    try {
      const url = timeframe
        ? `${this.baseUrl}/api/blockchain/staking-rewards/${address}?timeframe=${timeframe}`
        : `${this.baseUrl}/api/blockchain/staking-rewards/${address}`;

      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching staking rewards history:', error);
      return [];
    }
  }

  /**
   * Get liquidation history from real lending protocols
   */
  async getLiquidationHistory(address: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/liquidation-history/${address}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching liquidation history:', error);
      return [];
    }
  }

  /**
   * Get liquidation events for a specific timeframe
   */
  async getLiquidationEvents(address: string, timeframe: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/liquidation-events/${address}?timeframe=${timeframe}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching liquidation events:', error);
      return [];
    }
  }

  /**
   * Get gas efficiency metrics for a user
   */
  async getGasEfficiencyMetrics(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/gas-efficiency/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching gas efficiency metrics:', error);
      return null;
    }
  }

  /**
   * Get protocol usage patterns for a user
   */
  async getProtocolUsagePatterns(address: string, timeframe: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/protocol-usage-patterns/${address}?timeframe=${timeframe}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol usage patterns:', error);
      return null;
    }
  }

  /**
   * Get real transaction frequency analysis
   */
  async getTransactionFrequencyAnalysis(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/transaction-frequency/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction frequency analysis:', error);
      return null;
    }
  }

  /**
   * Get real user behavior score incorporating all analysis
   */
  async getUserBehaviorScore(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/behavior-score/${address}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user behavior score:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time user behavior updates
   */
  async subscribeToUserBehaviorUpdates(
    address: string,
    callback: (behaviorUpdate: any) => void
  ): Promise<() => void> {
    // Request behavior monitoring for this address
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'monitorUserBehavior',
        address: address
      }));
    }

    return this.subscribe('userBehaviorUpdate', (data: any) => {
      if (data.address === address) {
        callback(data);
      }
    });
  }

  /**
   * Subscribe to real-time staking behavior updates
   */
  async subscribeToStakingBehaviorUpdates(
    address: string,
    callback: (stakingUpdate: any) => void
  ): Promise<() => void> {
    return this.subscribe('stakingBehaviorUpdate', (data: any) => {
      if (data.address === address) {
        callback(data);
      }
    });
  }

  /**
   * Subscribe to real-time liquidation risk updates
   */
  async subscribeToLiquidationRiskUpdates(
    address: string,
    callback: (riskUpdate: any) => void
  ): Promise<() => void> {
    return this.subscribe('liquidationRiskUpdate', (data: any) => {
      if (data.address === address) {
        callback(data);
      }
    });
  }

  // Protocol Integration Methods
  async getProtocolIntegrationAPI(): Promise<any> {
    // Returns API endpoints and documentation for DeFi protocol integration
    return {
      endpoints: {
        getCreditScore: `${this.baseUrl}/api/protocol/credit-score`,
        verifyScore: `${this.baseUrl}/api/protocol/verify-score`,
        getCustomScore: `${this.baseUrl}/api/protocol/custom-score`,
        subscribeUpdates: `${this.baseUrl}/api/protocol/subscribe`
      },
      documentation: `${this.baseUrl}/docs/protocol-integration`,
      rateLimit: '1000 requests per hour',
      uptime: '99.9%'
    };
  }

  // Utility Methods
  formatScore(score: number): string {
    return score.toFixed(0);
  }

  getScoreTier(score: number): string {
    if (score >= 900) return 'Platinum';
    if (score >= 800) return 'Gold';
    if (score >= 700) return 'Silver';
    if (score >= 600) return 'Bronze';
    return 'Starter';
  }

  getScoreColor(score: number): string {
    if (score >= 800) return 'green';
    if (score >= 600) return 'yellow';
    return 'red';
  }

  calculateConfidenceLevel(dataPoints: number): number {
    // Simple confidence calculation based on data sufficiency
    if (dataPoints >= 100) return 95;
    if (dataPoints >= 50) return 85;
    if (dataPoints >= 20) return 70;
    if (dataPoints >= 10) return 55;
    return 40;
  }
}

export const creditIntelligenceService = new CreditIntelligenceService();
export default creditIntelligenceService;