import { TransactionData, UserMetrics } from './blockchainService';
// Import will be added after fixing circular dependency
// import { TransactionCategorizer, CategoryResult, ProtocolType, SophisticationLevel } from './transactionCategorizer';

/**
 * Advanced Transaction Analysis Interface
 * Provides comprehensive analysis of transaction patterns, risk scoring, and efficiency metrics
 */
export interface TransactionAnalysis {
  hash: string;
  timestamp: number;
  value: string;
  gasPrice: string;
  gasUsed: string;
  
  // Risk scoring
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  
  // Efficiency metrics
  gasEfficiencyScore: number; // 0-100
  gasOptimizationRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  
  // Transaction categorization
  category: TransactionCategory;
  subcategory?: string;
  protocolName?: string;
  
  // Temporal analysis
  timingConsistency: number; // 0-100
  isOutlier: boolean;
  temporalPattern: 'REGULAR' | 'IRREGULAR' | 'BURST' | 'ISOLATED';
  
  // Behavioral indicators
  sophisticationLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  intentClassification: 'TRADING' | 'INVESTMENT' | 'UTILITY' | 'SPECULATION' | 'ARBITRAGE';
}

export interface RiskFactor {
  type: 'CONCENTRATION' | 'VOLATILITY' | 'TIMING' | 'AMOUNT' | 'FREQUENCY' | 'PROTOCOL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  description: string;
  indicators: string[];
}

export interface EfficiencyMetrics {
  gasEfficiencyScore: number; // 0-100
  averageGasPrice: number;
  gasOptimizationLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  timingOptimization: number; // 0-100
  costSavingsPotential: number; // Percentage
  recommendations: string[];
}

export interface TemporalPatternAnalysis {
  consistencyScore: number; // 0-100
  patternType: 'REGULAR' | 'SPORADIC' | 'BURST' | 'DECLINING' | 'GROWING';
  averageInterval: number; // Hours between transactions
  peakActivityHours: number[];
  seasonalPatterns: SeasonalPattern[];
  anomalousTransactions: TransactionData[];
}

export interface SeasonalPattern {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  pattern: number[]; // Activity levels by time period
  confidence: number; // 0-100
  description: string;
}

export enum TransactionCategory {
  TRANSFER = 'TRANSFER',
  DEFI_SWAP = 'DEFI_SWAP',
  DEFI_LIQUIDITY = 'DEFI_LIQUIDITY',
  DEFI_LENDING = 'DEFI_LENDING',
  DEFI_BORROWING = 'DEFI_BORROWING',
  STAKING = 'STAKING',
  UNSTAKING = 'UNSTAKING',
  NFT_TRADE = 'NFT_TRADE',
  CONTRACT_INTERACTION = 'CONTRACT_INTERACTION',
  TOKEN_APPROVAL = 'TOKEN_APPROVAL',
  BRIDGE = 'BRIDGE',
  GOVERNANCE = 'GOVERNANCE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Advanced Transaction Analysis Engine
 * Implements sophisticated analysis of transaction patterns and behaviors
 */
export class TransactionAnalysisEngine {
  
  // Gas price percentiles for efficiency scoring (in Gwei)
  private static readonly GAS_PRICE_PERCENTILES = {
    EXCELLENT: 20,  // Below 20 Gwei
    GOOD: 50,       // 20-50 Gwei
    AVERAGE: 100,   // 50-100 Gwei
    POOR: 200       // Above 100 Gwei
  };

  // Protocol categorization mapping
  private static readonly PROTOCOL_CATEGORIES = {
    // DEX/Swap protocols
    'uniswap': { category: TransactionCategory.DEFI_SWAP, sophistication: 'INTERMEDIATE' },
    'sushiswap': { category: TransactionCategory.DEFI_SWAP, sophistication: 'INTERMEDIATE' },
    '1inch': { category: TransactionCategory.DEFI_SWAP, sophistication: 'ADVANCED' },
    'curve': { category: TransactionCategory.DEFI_SWAP, sophistication: 'ADVANCED' },
    
    // Lending protocols
    'aave': { category: TransactionCategory.DEFI_LENDING, sophistication: 'ADVANCED' },
    'compound': { category: TransactionCategory.DEFI_LENDING, sophistication: 'ADVANCED' },
    'maker': { category: TransactionCategory.DEFI_LENDING, sophistication: 'EXPERT' },
    
    // Staking protocols
    'lido': { category: TransactionCategory.STAKING, sophistication: 'INTERMEDIATE' },
    'rocket pool': { category: TransactionCategory.STAKING, sophistication: 'ADVANCED' },
    'eth 2.0 staking': { category: TransactionCategory.STAKING, sophistication: 'INTERMEDIATE' },
    
    // Yield farming
    'yearn': { category: TransactionCategory.DEFI_LIQUIDITY, sophistication: 'EXPERT' },
  };

  /**
   * Analyze a single transaction with comprehensive metrics
   */
  public static analyzeTransaction(
    transaction: TransactionData,
    userHistory: TransactionData[],
    marketContext?: { averageGasPrice: number; networkCongestion: number }
  ): TransactionAnalysis {
    
    const riskFactors = this.calculateRiskFactors(transaction, userHistory);
    const riskScore = this.calculateOverallRiskScore(riskFactors);
    
    const gasEfficiency = this.calculateGasEfficiency(transaction, marketContext);
    const category = this.categorizeTransaction(transaction);
    const temporalAnalysis = this.analyzeTemporalPattern(transaction, userHistory);
    const sophistication = this.assessSophisticationLevel(transaction);
    const intent = this.classifyIntent(transaction, userHistory);
    
    return {
      hash: transaction.hash,
      timestamp: transaction.timestamp,
      value: transaction.value,
      gasPrice: transaction.gasPrice,
      gasUsed: transaction.gasUsed,
      
      riskScore,
      riskFactors,
      
      gasEfficiencyScore: gasEfficiency.score,
      gasOptimizationRating: gasEfficiency.rating,
      
      category: category.primary,
      subcategory: category.subcategory,
      protocolName: transaction.protocolName,
      
      timingConsistency: temporalAnalysis.consistency,
      isOutlier: temporalAnalysis.isOutlier,
      temporalPattern: temporalAnalysis.pattern,
      
      sophisticationLevel: sophistication,
      intentClassification: intent
    };
  }

  /**
   * Calculate risk factors for a transaction
   */
  private static calculateRiskFactors(
    transaction: TransactionData,
    userHistory: TransactionData[]
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    // Amount concentration risk
    const totalVolume = userHistory.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    const transactionVolume = parseFloat(transaction.value);
    const concentrationRatio = totalVolume > 0 ? transactionVolume / totalVolume : 0;
    
    if (concentrationRatio > 0.5) {
      factors.push({
        type: 'CONCENTRATION',
        severity: 'HIGH',
        score: Math.min(100, concentrationRatio * 100),
        description: 'High concentration of funds in single transaction',
        indicators: [`Transaction represents ${(concentrationRatio * 100).toFixed(1)}% of total volume`]
      });
    }
    
    // Gas price volatility risk
    const gasPrice = parseFloat(transaction.gasPrice);
    const avgGasPrice = userHistory.length > 0 
      ? userHistory.reduce((sum, tx) => sum + parseFloat(tx.gasPrice), 0) / userHistory.length
      : gasPrice;
    
    const gasPriceDeviation = Math.abs(gasPrice - avgGasPrice) / avgGasPrice;
    
    if (gasPriceDeviation > 2) {
      factors.push({
        type: 'VOLATILITY',
        severity: gasPriceDeviation > 5 ? 'HIGH' : 'MEDIUM',
        score: Math.min(100, gasPriceDeviation * 20),
        description: 'Unusual gas price compared to user history',
        indicators: [`Gas price ${gasPriceDeviation > avgGasPrice ? 'significantly higher' : 'significantly lower'} than average`]
      });
    }
    
    // Timing anomaly risk
    if (userHistory.length > 1) {
      const sortedHistory = [...userHistory].sort((a, b) => a.timestamp - b.timestamp);
      const intervals = [];
      
      for (let i = 1; i < sortedHistory.length; i++) {
        intervals.push(sortedHistory[i].timestamp - sortedHistory[i-1].timestamp);
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const lastInterval = transaction.timestamp - sortedHistory[sortedHistory.length - 1].timestamp;
      
      const timingDeviation = Math.abs(lastInterval - avgInterval) / avgInterval;
      
      if (timingDeviation > 3) {
        factors.push({
          type: 'TIMING',
          severity: timingDeviation > 10 ? 'HIGH' : 'MEDIUM',
          score: Math.min(100, timingDeviation * 10),
          description: 'Unusual timing pattern compared to historical behavior',
          indicators: [`Transaction timing deviates significantly from normal pattern`]
        });
      }
    }
    
    return factors;
  }

  /**
   * Calculate overall risk score from individual factors
   */
  private static calculateOverallRiskScore(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 0;
    
    // Weight risk factors by severity
    const severityWeights = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const factor of riskFactors) {
      const weight = severityWeights[factor.severity];
      totalWeightedScore += factor.score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  /**
   * Calculate gas efficiency metrics
   */
  private static calculateGasEfficiency(
    transaction: TransactionData,
    marketContext?: { averageGasPrice: number; networkCongestion: number }
  ): { score: number; rating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' } {
    const gasPrice = parseFloat(transaction.gasPrice);
    
    // Determine efficiency rating based on gas price
    let rating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    let score: number;
    
    if (gasPrice <= this.GAS_PRICE_PERCENTILES.EXCELLENT) {
      rating = 'EXCELLENT';
      score = 90 + (this.GAS_PRICE_PERCENTILES.EXCELLENT - gasPrice) / this.GAS_PRICE_PERCENTILES.EXCELLENT * 10;
    } else if (gasPrice <= this.GAS_PRICE_PERCENTILES.GOOD) {
      rating = 'GOOD';
      score = 70 + (this.GAS_PRICE_PERCENTILES.GOOD - gasPrice) / (this.GAS_PRICE_PERCENTILES.GOOD - this.GAS_PRICE_PERCENTILES.EXCELLENT) * 20;
    } else if (gasPrice <= this.GAS_PRICE_PERCENTILES.AVERAGE) {
      rating = 'AVERAGE';
      score = 40 + (this.GAS_PRICE_PERCENTILES.AVERAGE - gasPrice) / (this.GAS_PRICE_PERCENTILES.AVERAGE - this.GAS_PRICE_PERCENTILES.GOOD) * 30;
    } else {
      rating = 'POOR';
      score = Math.max(0, 40 - (gasPrice - this.GAS_PRICE_PERCENTILES.AVERAGE) / this.GAS_PRICE_PERCENTILES.AVERAGE * 40);
    }
    
    // Adjust score based on market context if available
    if (marketContext) {
      const marketAdjustment = (marketContext.averageGasPrice - gasPrice) / marketContext.averageGasPrice * 20;
      score = Math.max(0, Math.min(100, score + marketAdjustment));
    }
    
    return { score: Math.round(score), rating };
  }

  /**
   * Categorize transaction based on recipient and data
   */
  private static categorizeTransaction(transaction: TransactionData): {
    primary: TransactionCategory;
    subcategory?: string;
  } {
    // Check if it's a known protocol interaction
    if (transaction.protocolName) {
      const protocolKey = transaction.protocolName.toLowerCase();
      
      for (const [protocol, config] of Object.entries(this.PROTOCOL_CATEGORIES)) {
        if (protocolKey.includes(protocol)) {
          return {
            primary: config.category,
            subcategory: transaction.protocolName
          };
        }
      }
    }
    
    // Check for staking
    if (transaction.isStaking) {
      return {
        primary: TransactionCategory.STAKING,
        subcategory: transaction.protocolName || 'Unknown Staking Protocol'
      };
    }
    
    // Check for DeFi
    if (transaction.isDeFi) {
      return {
        primary: TransactionCategory.DEFI_SWAP, // Default DeFi category
        subcategory: transaction.protocolName || 'Unknown DeFi Protocol'
      };
    }
    
    // Check transaction value for categorization
    const value = parseFloat(transaction.value);
    
    if (value === 0) {
      return {
        primary: TransactionCategory.CONTRACT_INTERACTION,
        subcategory: 'Zero Value Contract Call'
      };
    }
    
    // Default to transfer
    return {
      primary: TransactionCategory.TRANSFER,
      subcategory: value > 1 ? 'Large Transfer' : 'Standard Transfer'
    };
  }

  /**
   * Analyze temporal patterns in transaction timing
   */
  private static analyzeTemporalPattern(
    transaction: TransactionData,
    userHistory: TransactionData[]
  ): { consistency: number; isOutlier: boolean; pattern: 'REGULAR' | 'IRREGULAR' | 'BURST' | 'ISOLATED' } {
    
    if (userHistory.length < 2) {
      return { consistency: 0, isOutlier: false, pattern: 'ISOLATED' };
    }
    
    const sortedHistory = [...userHistory, transaction].sort((a, b) => a.timestamp - b.timestamp);
    const intervals = [];
    
    // Calculate intervals between transactions
    for (let i = 1; i < sortedHistory.length; i++) {
      intervals.push(sortedHistory[i].timestamp - sortedHistory[i-1].timestamp);
    }
    
    // Calculate consistency metrics
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 0;
    
    // Consistency score (lower coefficient of variation = higher consistency)
    const consistency = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));
    
    // Determine if current transaction is an outlier
    const lastInterval = intervals[intervals.length - 1];
    const isOutlier = Math.abs(lastInterval - avgInterval) > (2 * stdDev);
    
    // Determine pattern type
    let pattern: 'REGULAR' | 'IRREGULAR' | 'BURST' | 'ISOLATED';
    
    if (coefficientOfVariation < 0.5) {
      pattern = 'REGULAR';
    } else if (coefficientOfVariation > 2) {
      // Check for burst patterns (multiple transactions in short time)
      const recentTransactions = sortedHistory.filter(tx => 
        transaction.timestamp - tx.timestamp < 3600 // Within 1 hour
      );
      
      pattern = recentTransactions.length > 3 ? 'BURST' : 'IRREGULAR';
    } else {
      pattern = 'IRREGULAR';
    }
    
    return { consistency: Math.round(consistency), isOutlier, pattern };
  }

  /**
   * Assess sophistication level based on transaction complexity
   */
  private static assessSophisticationLevel(transaction: TransactionData): 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    
    // Check protocol sophistication
    if (transaction.protocolName) {
      const protocolKey = transaction.protocolName.toLowerCase();
      
      for (const [protocol, config] of Object.entries(this.PROTOCOL_CATEGORIES)) {
        if (protocolKey.includes(protocol)) {
          return config.sophistication as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
        }
      }
    }
    
    // Assess based on gas usage and value
    const gasUsed = parseInt(transaction.gasUsed);
    const value = parseFloat(transaction.value);
    
    if (gasUsed > 500000) {
      return 'EXPERT'; // Complex contract interactions
    } else if (gasUsed > 200000) {
      return 'ADVANCED'; // Multi-step operations
    } else if (transaction.isDeFi || transaction.isStaking) {
      return 'INTERMEDIATE'; // DeFi/Staking interactions
    } else {
      return 'BASIC'; // Simple transfers
    }
  }

  /**
   * Classify transaction intent based on patterns
   */
  private static classifyIntent(
    transaction: TransactionData,
    userHistory: TransactionData[]
  ): 'TRADING' | 'INVESTMENT' | 'UTILITY' | 'SPECULATION' | 'ARBITRAGE' {
    
    const value = parseFloat(transaction.value);
    
    // Check for arbitrage patterns (quick buy/sell sequences)
    const recentTransactions = userHistory.filter(tx => 
      Math.abs(transaction.timestamp - tx.timestamp) < 3600 // Within 1 hour
    );
    
    if (recentTransactions.length > 2 && transaction.isDeFi) {
      return 'ARBITRAGE';
    }
    
    // Check for trading patterns
    if (transaction.isDeFi && value > 0.1) {
      const recentDeFiTxs = userHistory.filter(tx => 
        tx.isDeFi && Math.abs(transaction.timestamp - tx.timestamp) < 86400 // Within 24 hours
      );
      
      if (recentDeFiTxs.length > 1) {
        return 'TRADING';
      }
    }
    
    // Check for investment patterns (staking, lending)
    if (transaction.isStaking || (transaction.protocolName && 
        (transaction.protocolName.toLowerCase().includes('aave') || 
         transaction.protocolName.toLowerCase().includes('compound')))) {
      return 'INVESTMENT';
    }
    
    // Check for speculation (high-value, infrequent DeFi)
    if (transaction.isDeFi && value > 1 && userHistory.filter(tx => tx.isDeFi).length < 5) {
      return 'SPECULATION';
    }
    
    // Default to utility
    return 'UTILITY';
  }

  /**
   * Analyze temporal patterns across all user transactions
   */
  public static analyzeTemporalPatterns(transactions: TransactionData[]): TemporalPatternAnalysis {
    if (transactions.length < 2) {
      return {
        consistencyScore: 0,
        patternType: 'DECLINING',
        averageInterval: 0,
        peakActivityHours: [],
        seasonalPatterns: [],
        anomalousTransactions: []
      };
    }
    
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      intervals.push(sortedTxs[i].timestamp - sortedTxs[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 0;
    
    // Consistency score
    const consistencyScore = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));
    
    // Determine pattern type
    let patternType: 'REGULAR' | 'SPORADIC' | 'BURST' | 'DECLINING' | 'GROWING';
    
    // Check for growth/decline trends
    const recentTxs = sortedTxs.slice(-Math.min(10, Math.floor(sortedTxs.length / 2)));
    const olderTxs = sortedTxs.slice(0, Math.min(10, Math.floor(sortedTxs.length / 2)));
    
    const recentAvgInterval = this.calculateAverageInterval(recentTxs);
    const olderAvgInterval = this.calculateAverageInterval(olderTxs);
    
    if (recentAvgInterval < olderAvgInterval * 0.7) {
      patternType = 'GROWING';
    } else if (recentAvgInterval > olderAvgInterval * 1.5) {
      patternType = 'DECLINING';
    } else if (coefficientOfVariation < 0.5) {
      patternType = 'REGULAR';
    } else if (coefficientOfVariation > 2) {
      patternType = 'BURST';
    } else {
      patternType = 'SPORADIC';
    }
    
    // Analyze peak activity hours
    const hourCounts = new Array(24).fill(0);
    for (const tx of sortedTxs) {
      const hour = new Date(tx.timestamp * 1000).getHours();
      hourCounts[hour]++;
    }
    
    const maxCount = Math.max(...hourCounts);
    const peakActivityHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= maxCount * 0.8)
      .map(({ hour }) => hour);
    
    // Identify anomalous transactions
    const anomalousTransactions = sortedTxs.filter((tx, index) => {
      if (index === 0) return false;
      
      const interval = tx.timestamp - sortedTxs[index - 1].timestamp;
      return Math.abs(interval - avgInterval) > (2 * stdDev);
    });
    
    return {
      consistencyScore: Math.round(consistencyScore),
      patternType,
      averageInterval: Math.round(avgInterval / 3600), // Convert to hours
      peakActivityHours,
      seasonalPatterns: [], // TODO: Implement seasonal pattern detection
      anomalousTransactions
    };
  }

  /**
   * Calculate average interval for a set of transactions
   */
  private static calculateAverageInterval(transactions: TransactionData[]): number {
    if (transactions.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < transactions.length; i++) {
      intervals.push(transactions[i].timestamp - transactions[i-1].timestamp);
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  /**
   * Generate efficiency recommendations based on transaction analysis
   */
  public static generateEfficiencyRecommendations(
    transactions: TransactionData[]
  ): EfficiencyMetrics {
    
    const gasPrices = transactions.map(tx => parseFloat(tx.gasPrice));
    const averageGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    
    // Calculate efficiency score
    const efficiencyScores = transactions.map(tx => {
      const gasPrice = parseFloat(tx.gasPrice);
      return this.calculateGasEfficiency(tx).score;
    });
    
    const gasEfficiencyScore = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;
    
    // Determine optimization level
    let gasOptimizationLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    if (gasEfficiencyScore >= 80) gasOptimizationLevel = 'EXCELLENT';
    else if (gasEfficiencyScore >= 60) gasOptimizationLevel = 'GOOD';
    else if (gasEfficiencyScore >= 40) gasOptimizationLevel = 'AVERAGE';
    else gasOptimizationLevel = 'POOR';
    
    // Analyze timing optimization
    const temporalAnalysis = this.analyzeTemporalPatterns(transactions);
    const timingOptimization = temporalAnalysis.consistencyScore;
    
    // Calculate cost savings potential
    const highGasTxs = transactions.filter(tx => parseFloat(tx.gasPrice) > this.GAS_PRICE_PERCENTILES.GOOD);
    const costSavingsPotential = (highGasTxs.length / transactions.length) * 100;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (gasEfficiencyScore < 60) {
      recommendations.push('Consider using gas price optimization tools to reduce transaction costs');
    }
    
    if (timingOptimization < 50) {
      recommendations.push('Optimize transaction timing to avoid network congestion periods');
    }
    
    if (costSavingsPotential > 30) {
      recommendations.push('Monitor gas prices and delay non-urgent transactions during high congestion');
    }
    
    return {
      gasEfficiencyScore: Math.round(gasEfficiencyScore),
      averageGasPrice,
      gasOptimizationLevel,
      timingOptimization: Math.round(timingOptimization),
      costSavingsPotential: Math.round(costSavingsPotential),
      recommendations
    };
  }
}

export default TransactionAnalysisEngine;