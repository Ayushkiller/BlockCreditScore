import { EventEmitter } from 'events';
import { RealTransactionAnalyzer, TransactionAnalysis, GasAnalysis, TransactionCategory, CreditImpact, TransactionPattern } from './real-transaction-analyzer';
import { RealBlockchainDataManager } from './blockchain-data-manager';
import { RealContractManager } from './contract-manager';

export interface UserTransactionProfile {
  userAddress: string;
  totalTransactions: number;
  transactionCategories: Map<string, number>;
  gasEfficiencyScore: number;
  avgGasPrice: string;
  totalGasUsed: string;
  riskScore: number;
  creditScore: number;
  protocolInteractions: Map<string, number>;
  recentTransactions: TransactionAnalysis[];
  behaviorPattern: TransactionPattern;
  lastUpdated: number;
}

export interface GasEfficiencyMetrics {
  userAddress: string;
  avgGasPrice: number;
  medianGasPrice: number;
  gasEfficiencyRating: 'excellent' | 'good' | 'average' | 'poor';
  gasOptimizationScore: number; // 0-100
  comparedToNetwork: {
    percentile: number;
    isAboveAverage: boolean;
    savingsOpportunity: number;
  };
  recommendations: string[];
  historicalTrend: 'improving' | 'stable' | 'declining';
}

export interface TransactionRiskMetrics {
  userAddress: string;
  overallRiskScore: number; // 0-1 scale
  riskFactors: {
    highGasPriceTransactions: number;
    failedTransactions: number;
    liquidationEvents: number;
    suspiciousPatterns: number;
    contractInteractions: number;
  };
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  recommendations: string[];
}

/**
 * Real Transaction Credit Analyzer
 * Integrates real transaction analysis with credit scoring for frontend display
 */
export class RealTransactionCreditAnalyzer extends EventEmitter {
  private transactionAnalyzer: RealTransactionAnalyzer;
  private blockchainManager: RealBlockchainDataManager;
  private contractManager: RealContractManager;
  private userProfiles: Map<string, UserTransactionProfile> = new Map();
  private gasMetrics: Map<string, GasEfficiencyMetrics> = new Map();
  private riskMetrics: Map<string, TransactionRiskMetrics> = new Map();
  private networkGasStats = {
    average: 0,
    median: 0,
    high: 0,
    low: 0
  };

  constructor(
    blockchainManager: RealBlockchainDataManager,
    contractManager: RealContractManager
  ) {
    super();
    this.blockchainManager = blockchainManager;
    this.contractManager = contractManager;
    this.transactionAnalyzer = new RealTransactionAnalyzer(blockchainManager, contractManager);
    
    this.setupEventHandlers();
    this.initializeNetworkGasStats();
  }

  /**
   * Analyze user's complete transaction history for credit scoring
   */
  async analyzeUserForCreditScoring(userAddress: string, timeframeDays: number = 90): Promise<UserTransactionProfile> {
    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      console.log(`🔍 Starting comprehensive transaction analysis for ${userAddress}`);

      // Get user's transaction behavior pattern
      const behaviorPattern = await this.transactionAnalyzer.analyzeUserBehavior(userAddress);
      
      // Get recent transactions for detailed analysis
      const currentBlock = await this.blockchainManager.getCurrentBlock();
      const fromBlock = currentBlock - (timeframeDays * 6500); // Approximate blocks per day
      
      // Add user to monitoring to get transaction history
      await this.blockchainManager.addAddressToMonitor(userAddress);
      
      // Backfill recent transactions
      await this.blockchainManager.backfillTransactions({
        fromBlock,
        toBlock: currentBlock,
        addresses: [userAddress],
        batchSize: 100,
        delayMs: 500
      });

      // Get confirmed transactions
      const confirmedTxs = this.blockchainManager.getConfirmedTransactions()
        .filter(tx => 
          tx.from.toLowerCase() === userAddress.toLowerCase() || 
          (tx.to && tx.to.toLowerCase() === userAddress.toLowerCase())
        );

      // Analyze each transaction in detail
      const recentTransactions: TransactionAnalysis[] = [];
      const transactionCategories = new Map<string, number>();
      let totalGasUsed = BigInt(0);
      let totalGasPrice = BigInt(0);
      let totalRiskScore = 0;

      for (const tx of confirmedTxs.slice(0, 50)) { // Analyze last 50 transactions
        try {
          const analysis = await this.transactionAnalyzer.analyzeTransaction(tx.hash);
          recentTransactions.push(analysis);

          // Update category counts
          const category = analysis.category.primary;
          transactionCategories.set(category, (transactionCategories.get(category) || 0) + 1);

          // Accumulate gas metrics
          totalGasUsed += BigInt(analysis.gasUsed);
          totalGasPrice += BigInt(analysis.gasPrice);
          totalRiskScore += analysis.riskScore;

        } catch (error) {
          console.warn(`⚠️ Could not analyze transaction ${tx.hash}:`, error);
        }
      }

      // Calculate gas efficiency score
      const avgGasPrice = confirmedTxs.length > 0 ? 
        (totalGasPrice / BigInt(confirmedTxs.length)).toString() : '0';
      
      const gasEfficiencyScore = this.calculateGasEfficiencyScore(
        Number(avgGasPrice), 
        Number(totalGasUsed)
      );

      // Calculate overall credit score
      const avgRiskScore = confirmedTxs.length > 0 ? totalRiskScore / confirmedTxs.length : 0;
      const creditScore = this.calculateOverallCreditScore(
        behaviorPattern,
        transactionCategories,
        gasEfficiencyScore,
        avgRiskScore
      );

      const profile: UserTransactionProfile = {
        userAddress,
        totalTransactions: confirmedTxs.length,
        transactionCategories,
        gasEfficiencyScore,
        avgGasPrice,
        totalGasUsed: totalGasUsed.toString(),
        riskScore: avgRiskScore,
        creditScore,
        protocolInteractions: behaviorPattern.protocolUsage,
        recentTransactions,
        behaviorPattern,
        lastUpdated: Date.now()
      };

      // Cache the profile
      this.userProfiles.set(userAddress, profile);

      // Calculate and cache gas efficiency metrics
      const gasMetrics = await this.calculateGasEfficiencyMetrics(userAddress, recentTransactions);
      this.gasMetrics.set(userAddress, gasMetrics);

      // Calculate and cache risk metrics
      const riskMetrics = this.calculateTransactionRiskMetrics(userAddress, recentTransactions);
      this.riskMetrics.set(userAddress, riskMetrics);

      console.log(`✅ Completed credit analysis for ${userAddress}: Score ${creditScore.toFixed(2)}`);
      this.emit('userAnalysisComplete', profile);

      return profile;

    } catch (error) {
      console.error(`❌ Failed to analyze user ${userAddress} for credit scoring:`, error);
      throw error;
    }
  }

  /**
   * Calculate gas efficiency metrics for a user
   */
  async calculateGasEfficiencyMetrics(
    userAddress: string, 
    transactions: TransactionAnalysis[]
  ): Promise<GasEfficiencyMetrics> {
    if (transactions.length === 0) {
      return {
        userAddress,
        avgGasPrice: 0,
        medianGasPrice: 0,
        gasEfficiencyRating: 'average',
        gasOptimizationScore: 50,
        comparedToNetwork: {
          percentile: 50,
          isAboveAverage: false,
          savingsOpportunity: 0
        },
        recommendations: ['Insufficient transaction data for analysis'],
        historicalTrend: 'stable'
      };
    }

    // Calculate gas price statistics
    const gasPrices = transactions.map(tx => Number(tx.gasPrice)).sort((a, b) => a - b);
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    const medianGasPrice = gasPrices[Math.floor(gasPrices.length / 2)];

    // Compare to network statistics
    const networkComparison = this.compareToNetworkGasStats(avgGasPrice);
    
    // Calculate efficiency rating
    const gasEfficiencyRating = this.determineGasEfficiencyRating(avgGasPrice, networkComparison.percentile);
    
    // Calculate optimization score (0-100)
    const gasOptimizationScore = Math.max(0, Math.min(100, 
      100 - (networkComparison.percentile - 50) * 2
    ));

    // Generate recommendations
    const recommendations = this.generateGasOptimizationRecommendations(
      avgGasPrice, 
      networkComparison,
      transactions
    );

    // Determine historical trend (simplified)
    const historicalTrend = this.determineGasTrend(transactions);

    return {
      userAddress,
      avgGasPrice,
      medianGasPrice,
      gasEfficiencyRating,
      gasOptimizationScore,
      comparedToNetwork: networkComparison,
      recommendations,
      historicalTrend
    };
  }

  /**
   * Calculate transaction risk metrics for a user
   */
  calculateTransactionRiskMetrics(
    userAddress: string,
    transactions: TransactionAnalysis[]
  ): TransactionRiskMetrics {
    const riskFactors = {
      highGasPriceTransactions: 0,
      failedTransactions: 0,
      liquidationEvents: 0,
      suspiciousPatterns: 0,
      contractInteractions: 0
    };

    let totalRiskScore = 0;

    for (const tx of transactions) {
      totalRiskScore += tx.riskScore;

      // Count high gas price transactions
      if (tx.gasAnalysis.isHighPriority) {
        riskFactors.highGasPriceTransactions++;
      }

      // Count contract interactions
      if (tx.to && tx.to !== '0x0000000000000000000000000000000000000000') {
        riskFactors.contractInteractions++;
      }

      // Count liquidation events
      if (tx.protocolInteractions.some(interaction => interaction.action === 'liquidation')) {
        riskFactors.liquidationEvents++;
      }

      // Count suspicious patterns (high risk score)
      if (tx.riskScore > 0.7) {
        riskFactors.suspiciousPatterns++;
      }
    }

    const overallRiskScore = transactions.length > 0 ? totalRiskScore / transactions.length : 0;
    
    // Determine risk trend (simplified)
    const riskTrend = this.determineRiskTrend(transactions);

    // Generate risk recommendations
    const recommendations = this.generateRiskRecommendations(riskFactors, overallRiskScore);

    return {
      userAddress,
      overallRiskScore,
      riskFactors,
      riskTrend,
      recommendations
    };
  }

  /**
   * Get gas efficiency metrics for a user
   */
  async getGasEfficiencyMetrics(userAddress: string): Promise<GasEfficiencyMetrics | null> {
    // Check cache first
    const cached = this.gasMetrics.get(userAddress);
    if (cached) {
      return cached;
    }

    // If not cached, analyze the user first
    try {
      await this.analyzeUserForCreditScoring(userAddress);
      return this.gasMetrics.get(userAddress) || null;
    } catch (error) {
      console.error(`Error getting gas efficiency metrics for ${userAddress}:`, error);
      return null;
    }
  }

  /**
   * Get transaction risk metrics for a user
   */
  async getTransactionRiskMetrics(userAddress: string): Promise<TransactionRiskMetrics | null> {
    // Check cache first
    const cached = this.riskMetrics.get(userAddress);
    if (cached) {
      return cached;
    }

    // If not cached, analyze the user first
    try {
      await this.analyzeUserForCreditScoring(userAddress);
      return this.riskMetrics.get(userAddress) || null;
    } catch (error) {
      console.error(`Error getting transaction risk metrics for ${userAddress}:`, error);
      return null;
    }
  }

  /**
   * Get user transaction profile
   */
  async getUserTransactionProfile(userAddress: string): Promise<UserTransactionProfile | null> {
    // Check cache first
    const cached = this.userProfiles.get(userAddress);
    if (cached && Date.now() - cached.lastUpdated < 300000) { // 5 minutes cache
      return cached;
    }

    // Analyze user if not cached or stale
    try {
      return await this.analyzeUserForCreditScoring(userAddress);
    } catch (error) {
      console.error(`Error getting user transaction profile for ${userAddress}:`, error);
      return null;
    }
  }

  /**
   * Setup event handlers for real-time updates
   */
  private setupEventHandlers(): void {
    // Listen for new transactions from the blockchain manager
    this.blockchainManager.on('transactionConfirmed', async (transaction: any) => {
      // Update profiles for involved addresses
      const addresses = [transaction.from];
      if (transaction.to) addresses.push(transaction.to);

      for (const address of addresses) {
        if (this.userProfiles.has(address)) {
          try {
            // Re-analyze the user to update their profile
            await this.analyzeUserForCreditScoring(address);
          } catch (error) {
            console.warn(`Failed to update profile for ${address}:`, error);
          }
        }
      }
    });

    // Listen for transaction analysis completion
    this.transactionAnalyzer.on('transactionAnalyzed', (analysis: TransactionAnalysis) => {
      this.emit('transactionAnalyzed', analysis);
    });
  }

  /**
   * Initialize network gas statistics
   */
  private async initializeNetworkGasStats(): Promise<void> {
    try {
      // Get current network gas statistics
      const currentBlock = await this.blockchainManager.getCurrentBlock();
      const recentBlocks = await Promise.all([
        this.blockchainManager.getBlockByNumber(currentBlock),
        this.blockchainManager.getBlockByNumber(currentBlock - 1),
        this.blockchainManager.getBlockByNumber(currentBlock - 2)
      ]);

      // Calculate average gas prices from recent blocks
      let totalGasPrice = 0;
      let transactionCount = 0;

      for (const block of recentBlocks) {
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && tx.gasPrice) {
              totalGasPrice += Number(tx.gasPrice);
              transactionCount++;
            }
          }
        }
      }

      if (transactionCount > 0) {
        this.networkGasStats.average = totalGasPrice / transactionCount;
        this.networkGasStats.median = this.networkGasStats.average; // Simplified
        this.networkGasStats.high = this.networkGasStats.average * 2;
        this.networkGasStats.low = this.networkGasStats.average * 0.5;
      }

      console.log('📊 Initialized network gas statistics:', this.networkGasStats);
    } catch (error) {
      console.warn('⚠️ Could not initialize network gas statistics:', error);
      // Use default values
      this.networkGasStats = {
        average: 20000000000, // 20 gwei
        median: 20000000000,
        high: 40000000000,
        low: 10000000000
      };
    }
  }

  /**
   * Calculate gas efficiency score
   */
  private calculateGasEfficiencyScore(avgGasPrice: number, totalGasUsed: number): number {
    let score = 0.5; // Base score

    // Gas price efficiency (compared to network average)
    if (this.networkGasStats.average > 0) {
      const gasPriceRatio = avgGasPrice / this.networkGasStats.average;
      if (gasPriceRatio < 0.8) {
        score += 0.3; // Efficient gas price usage
      } else if (gasPriceRatio > 1.5) {
        score -= 0.2; // Inefficient gas price usage
      }
    }

    // Gas usage efficiency (lower is generally better for simple operations)
    if (totalGasUsed < 1000000) {
      score += 0.2; // Efficient gas usage
    } else if (totalGasUsed > 5000000) {
      score -= 0.1; // High gas usage
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate overall credit score
   */
  private calculateOverallCreditScore(
    behaviorPattern: TransactionPattern,
    transactionCategories: Map<string, number>,
    gasEfficiencyScore: number,
    avgRiskScore: number
  ): number {
    let score = 0.5; // Base score

    // Behavior pattern impact
    score += behaviorPattern.behaviorScore * 0.3;

    // Gas efficiency impact
    score += gasEfficiencyScore * 0.2;

    // Risk score impact (lower risk = higher credit score)
    score += (1 - avgRiskScore) * 0.3;

    // Transaction diversity impact
    const categoryCount = transactionCategories.size;
    if (categoryCount > 3) {
      score += 0.1;
    }

    // DeFi usage bonus
    const defiCategories = ['defi_lending', 'defi_swap', 'defi_staking'];
    const defiUsage = Array.from(transactionCategories.keys()).filter(cat => 
      defiCategories.includes(cat)
    ).length;
    
    if (defiUsage > 0) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Compare user's gas usage to network statistics
   */
  private compareToNetworkGasStats(userAvgGasPrice: number): {
    percentile: number;
    isAboveAverage: boolean;
    savingsOpportunity: number;
  } {
    if (this.networkGasStats.average === 0) {
      return {
        percentile: 50,
        isAboveAverage: false,
        savingsOpportunity: 0
      };
    }

    const ratio = userAvgGasPrice / this.networkGasStats.average;
    let percentile = 50;

    if (ratio < 0.5) percentile = 10;
    else if (ratio < 0.8) percentile = 25;
    else if (ratio < 1.2) percentile = 50;
    else if (ratio < 2.0) percentile = 75;
    else percentile = 90;

    const isAboveAverage = userAvgGasPrice > this.networkGasStats.average;
    const savingsOpportunity = isAboveAverage ? 
      ((userAvgGasPrice - this.networkGasStats.average) / userAvgGasPrice) * 100 : 0;

    return {
      percentile,
      isAboveAverage,
      savingsOpportunity
    };
  }

  /**
   * Determine gas efficiency rating
   */
  private determineGasEfficiencyRating(
    avgGasPrice: number, 
    percentile: number
  ): 'excellent' | 'good' | 'average' | 'poor' {
    if (percentile <= 25) return 'excellent';
    if (percentile <= 50) return 'good';
    if (percentile <= 75) return 'average';
    return 'poor';
  }

  /**
   * Generate gas optimization recommendations
   */
  private generateGasOptimizationRecommendations(
    avgGasPrice: number,
    networkComparison: any,
    transactions: TransactionAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    if (networkComparison.isAboveAverage) {
      recommendations.push('Consider using lower gas prices during off-peak hours');
      recommendations.push('Use gas price prediction tools to optimize transaction timing');
    }

    if (networkComparison.savingsOpportunity > 20) {
      recommendations.push(`You could save ~${networkComparison.savingsOpportunity.toFixed(1)}% on gas costs`);
    }

    // Check for high gas usage patterns
    const highGasTransactions = transactions.filter(tx => Number(tx.gasUsed) > 300000);
    if (highGasTransactions.length > transactions.length * 0.3) {
      recommendations.push('Consider batching transactions to reduce overall gas costs');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your gas usage is efficient - keep up the good work!');
    }

    return recommendations;
  }

  /**
   * Determine gas usage trend
   */
  private determineGasTrend(transactions: TransactionAnalysis[]): 'improving' | 'stable' | 'declining' {
    if (transactions.length < 10) return 'stable';

    const recent = transactions.slice(0, Math.floor(transactions.length / 2));
    const older = transactions.slice(Math.floor(transactions.length / 2));

    const recentAvgGas = recent.reduce((sum, tx) => sum + Number(tx.gasPrice), 0) / recent.length;
    const olderAvgGas = older.reduce((sum, tx) => sum + Number(tx.gasPrice), 0) / older.length;

    const change = (recentAvgGas - olderAvgGas) / olderAvgGas;

    if (change < -0.1) return 'improving'; // Gas prices decreasing
    if (change > 0.1) return 'declining';  // Gas prices increasing
    return 'stable';
  }

  /**
   * Determine risk trend
   */
  private determineRiskTrend(transactions: TransactionAnalysis[]): 'increasing' | 'stable' | 'decreasing' {
    if (transactions.length < 10) return 'stable';

    const recent = transactions.slice(0, Math.floor(transactions.length / 2));
    const older = transactions.slice(Math.floor(transactions.length / 2));

    const recentAvgRisk = recent.reduce((sum, tx) => sum + tx.riskScore, 0) / recent.length;
    const olderAvgRisk = older.reduce((sum, tx) => sum + tx.riskScore, 0) / older.length;

    const change = (recentAvgRisk - olderAvgRisk) / Math.max(olderAvgRisk, 0.1);

    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate risk recommendations
   */
  private generateRiskRecommendations(
    riskFactors: any,
    overallRiskScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallRiskScore > 0.7) {
      recommendations.push('High risk detected - review recent transactions carefully');
    }

    if (riskFactors.highGasPriceTransactions > 5) {
      recommendations.push('Consider using lower gas prices to reduce transaction costs');
    }

    if (riskFactors.liquidationEvents > 0) {
      recommendations.push('Monitor lending positions closely to avoid liquidations');
    }

    if (riskFactors.suspiciousPatterns > 2) {
      recommendations.push('Review transaction patterns for potential security issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your transaction patterns show low risk - good job!');
    }

    return recommendations;
  }

  /**
   * Get comprehensive analytics for frontend display
   */
  async getComprehensiveAnalytics(userAddress: string): Promise<{
    profile: UserTransactionProfile | null;
    gasMetrics: GasEfficiencyMetrics | null;
    riskMetrics: TransactionRiskMetrics | null;
  }> {
    try {
      const [profile, gasMetrics, riskMetrics] = await Promise.all([
        this.getUserTransactionProfile(userAddress),
        this.getGasEfficiencyMetrics(userAddress),
        this.getTransactionRiskMetrics(userAddress)
      ]);

      return {
        profile,
        gasMetrics,
        riskMetrics
      };
    } catch (error) {
      console.error(`Error getting comprehensive analytics for ${userAddress}:`, error);
      return {
        profile: null,
        gasMetrics: null,
        riskMetrics: null
      };
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.userProfiles.clear();
    this.gasMetrics.clear();
    this.riskMetrics.clear();
    this.removeAllListeners();
    
    if (this.transactionAnalyzer) {
      await this.transactionAnalyzer.shutdown();
    }
    
    console.log('🔌 Transaction credit analyzer shut down');
  }
}