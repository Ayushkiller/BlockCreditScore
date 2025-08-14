import { UserMetrics, TransactionData } from './blockchainService';
import { TransactionCategorizer, ProtocolType, SophisticationLevel } from './transactionCategorizer';
import { TransactionAnalysisEngine, EfficiencyMetrics } from './transactionAnalysisEngine';

/**
 * Protocol Preference and Efficiency Analysis Engine
 * Implements requirements 3.2, 3.4, 3.5 for protocol preference identification,
 * gas optimization analysis, and transaction timing optimization
 */

export interface ProtocolPreferenceAnalysis {
  // Protocol preferences
  preferredProtocols: ProtocolPreference[];
  protocolDiversification: ProtocolDiversificationAnalysis;
  
  // Gas efficiency analysis
  gasOptimizationAnalysis: GasOptimizationAnalysis;
  
  // Transaction timing analysis
  transactionTimingAnalysis: TransactionTimingAnalysis;
  
  // Protocol sophistication scoring
  protocolSophisticationAnalysis: ProtocolSophisticationAnalysis;
  
  // Overall insights and recommendations
  insights: ProtocolInsights;
  recommendations: ProtocolRecommendation[];
  
  // Metadata
  confidence: number; // 0-100
  analysisTimestamp: number;
  dataQuality: AnalysisDataQuality;
}

export interface ProtocolPreference {
  protocolName: string;
  protocolType: ProtocolType;
  usageFrequency: number; // Number of transactions
  usageFrequencyPercentage: number; // 0-100
  volumeAmount: number; // Total ETH volume
  volumePercentage: number; // 0-100
  sophisticationScore: number; // 0-100
  preferenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'DOMINANT';
  lastUsed: number; // timestamp
  firstUsed: number; // timestamp
  usageTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  averageGasEfficiency: number; // 0-100
  averageTransactionValue: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ProtocolDiversificationAnalysis {
  diversificationScore: number; // 0-100
  diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  protocolCount: number;
  protocolTypeCount: number;
  concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dominantProtocol?: ProtocolPreference;
  dominantProtocolType?: ProtocolType;
  recommendations: string[];
  herfindahlIndex: number; // Market concentration index (0-1)
}

export interface GasOptimizationAnalysis {
  overallEfficiencyScore: number; // 0-100
  optimizationLevel: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  
  // Gas price analysis
  averageGasPrice: number; // in Gwei
  gasPriceConsistency: number; // 0-100
  gasPriceOptimization: number; // 0-100
  
  // Gas usage analysis
  averageGasUsed: number;
  gasUsageEfficiency: number; // 0-100
  gasUsageConsistency: number; // 0-100
  
  // Cost analysis
  totalGasCost: number; // in ETH
  averageTransactionCost: number; // in ETH
  costOptimizationPotential: number; // 0-100
  estimatedSavings: number; // in ETH
  
  // Protocol-specific efficiency
  protocolEfficiencyRankings: ProtocolEfficiencyRanking[];
  
  // Recommendations
  optimizationRecommendations: GasOptimizationRecommendation[];
}

export interface ProtocolEfficiencyRanking {
  protocolName: string;
  protocolType: ProtocolType;
  efficiencyScore: number; // 0-100
  averageGasUsed: number;
  averageGasPrice: number;
  transactionCount: number;
  ranking: number; // 1-based ranking
}

export interface GasOptimizationRecommendation {
  type: 'GAS_PRICE' | 'TIMING' | 'PROTOCOL_CHOICE' | 'BATCH_TRANSACTIONS' | 'ALTERNATIVE_ROUTE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expectedSavings: number; // Percentage
  implementationDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  specificGuidance: string[];
}

export interface TransactionTimingAnalysis {
  // Timing patterns
  optimalTimingWindows: TimingWindow[];
  currentTimingEfficiency: number; // 0-100
  timingConsistency: number; // 0-100
  
  // Gas price correlation with timing
  gasPriceTimingCorrelation: TimingCorrelation[];
  
  // Activity patterns
  preferredHours: number[]; // Hours of day (0-23)
  preferredDaysOfWeek: number[]; // Days of week (0-6, 0=Sunday)
  peakActivityPeriods: ActivityPeriod[];
  
  // Network congestion awareness
  congestionAwareness: number; // 0-100
  congestionAvoidance: number; // 0-100
  
  // Recommendations
  timingRecommendations: TimingRecommendation[];
}

export interface TimingWindow {
  startHour: number;
  endHour: number;
  dayOfWeek?: number; // Optional specific day
  averageGasPrice: number;
  networkCongestion: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendationLevel: 'OPTIMAL' | 'GOOD' | 'AVERAGE' | 'AVOID';
  potentialSavings: number; // Percentage
}

export interface TimingCorrelation {
  hour: number;
  dayOfWeek: number;
  averageGasPrice: number;
  transactionCount: number;
  efficiencyScore: number; // 0-100
}

export interface ActivityPeriod {
  startHour: number;
  endHour: number;
  dayOfWeek?: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
  transactionCount: number;
  averageVolume: number;
  averageGasPrice: number;
  efficiencyScore: number;
}

export interface TimingRecommendation {
  type: 'OPTIMAL_HOURS' | 'AVOID_HOURS' | 'DAY_OF_WEEK' | 'BATCH_TIMING' | 'URGENT_VS_ROUTINE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  specificTimes: string[];
  expectedSavings: number; // Percentage
  confidence: number; // 0-100
}

export interface ProtocolSophisticationAnalysis {
  overallSophisticationScore: number; // 0-100
  sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  sophisticationTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  
  // Protocol complexity breakdown
  protocolComplexityDistribution: {
    [key in SophisticationLevel]: number; // Count of transactions
  };
  
  // Sophistication by protocol type
  protocolTypeSophistication: ProtocolTypeSophistication[];
  
  // Advanced features usage
  advancedFeaturesUsage: AdvancedFeatureUsage[];
  
  // Learning progression
  learningProgression: LearningProgressionAnalysis;
  
  // Recommendations for sophistication improvement
  sophisticationRecommendations: SophisticationRecommendation[];
}

export interface ProtocolTypeSophistication {
  protocolType: ProtocolType;
  sophisticationScore: number; // 0-100
  transactionCount: number;
  averageComplexity: number; // 0-100
  mostAdvancedProtocol: string;
  expertiseLevel: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface AdvancedFeatureUsage {
  featureName: string;
  protocolType: ProtocolType;
  usageCount: number;
  sophisticationLevel: SophisticationLevel;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LearningProgressionAnalysis {
  progressionTrend: 'RAPID' | 'STEADY' | 'SLOW' | 'STAGNANT' | 'REGRESSING';
  timeToAdvancement: number; // Days to next sophistication level
  learningVelocity: number; // Sophistication points per month
  knowledgeGaps: string[];
  strengths: string[];
  nextMilestones: string[];
}

export interface SophisticationRecommendation {
  type: 'PROTOCOL_EXPLORATION' | 'FEATURE_ADOPTION' | 'RISK_MANAGEMENT' | 'EDUCATION' | 'GRADUAL_ADVANCEMENT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  targetSophisticationLevel: SophisticationLevel;
  prerequisites: string[];
  expectedTimeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ProtocolInsights {
  keyFindings: string[];
  strengthAreas: string[];
  improvementAreas: string[];
  riskFactors: string[];
  opportunities: string[];
  behavioralPatterns: string[];
}

export interface ProtocolRecommendation {
  category: 'DIVERSIFICATION' | 'EFFICIENCY' | 'SOPHISTICATION' | 'RISK_MANAGEMENT' | 'COST_OPTIMIZATION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expectedImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  implementationDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  specificActions: string[];
  successMetrics: string[];
}

export interface AnalysisDataQuality {
  completeness: number; // 0-100
  freshness: number; // 0-100
  consistency: number; // 0-100
  reliability: number; // 0-100
  sampleSize: number;
  timeSpanDays: number;
  protocolCoverage: number; // 0-100
}

/**
 * Protocol Preference and Efficiency Analysis Engine
 * Provides comprehensive analysis of protocol usage patterns and efficiency optimization
 */
export class ProtocolPreferenceEngine {
  
  // Gas price thresholds for optimization scoring (in Gwei)
  private static readonly GAS_PRICE_THRESHOLDS = {
    EXCELLENT: 20,
    GOOD: 50,
    AVERAGE: 100,
    POOR: 200
  };

  // Timing optimization windows (hours in UTC)
  private static readonly OPTIMAL_TIMING_WINDOWS = [
    { start: 2, end: 6, description: 'Early morning (low congestion)' },
    { start: 14, end: 16, description: 'Early afternoon (moderate congestion)' },
    { start: 22, end: 24, description: 'Late evening (low congestion)' }
  ];

  // Protocol sophistication scoring weights
  private static readonly SOPHISTICATION_WEIGHTS = {
    PROTOCOL_COMPLEXITY: 0.4,
    TRANSACTION_COMPLEXITY: 0.3,
    FEATURE_USAGE: 0.2,
    RISK_MANAGEMENT: 0.1
  };

  /**
   * Perform comprehensive protocol preference and efficiency analysis
   * Implements requirements 3.2, 3.4, 3.5
   */
  public static async analyzeProtocolPreferences(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<ProtocolPreferenceAnalysis> {
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Analyze protocol preferences and usage patterns
    const preferredProtocols = this.analyzePreferredProtocols(transactionHistory);
    
    // Analyze protocol diversification
    const protocolDiversification = this.analyzeProtocolDiversification(preferredProtocols, transactionHistory);
    
    // Analyze gas optimization
    const gasOptimizationAnalysis = this.analyzeGasOptimization(transactionHistory);
    
    // Analyze transaction timing patterns
    const transactionTimingAnalysis = this.analyzeTransactionTiming(transactionHistory);
    
    // Analyze protocol sophistication
    const protocolSophisticationAnalysis = this.analyzeProtocolSophistication(transactionHistory);
    
    // Generate insights and recommendations
    const insights = this.generateProtocolInsights(
      preferredProtocols,
      protocolDiversification,
      gasOptimizationAnalysis,
      transactionTimingAnalysis,
      protocolSophisticationAnalysis
    );
    
    const recommendations = this.generateProtocolRecommendations(
      preferredProtocols,
      protocolDiversification,
      gasOptimizationAnalysis,
      transactionTimingAnalysis,
      protocolSophisticationAnalysis
    );
    
    // Calculate data quality and confidence
    const dataQuality = this.calculateDataQuality(transactionHistory);
    const confidence = this.calculateOverallConfidence(dataQuality, transactionHistory.length);

    return {
      preferredProtocols,
      protocolDiversification,
      gasOptimizationAnalysis,
      transactionTimingAnalysis,
      protocolSophisticationAnalysis,
      insights,
      recommendations,
      confidence,
      analysisTimestamp: Date.now(),
      dataQuality
    };
  }

  /**
   * Analyze preferred protocols with usage frequency analysis
   * Requirement 3.4: Evaluate protocol usage diversity
   */
  private static analyzePreferredProtocols(transactionHistory: TransactionData[]): ProtocolPreference[] {
    // Categorize all transactions
    const categorizedTransactions = TransactionCategorizer.categorizeTransactions(transactionHistory);
    
    // Group by protocol
    const protocolGroups = new Map<string, {
      transactions: TransactionData[];
      categories: any[];
      totalVolume: number;
      totalGasCost: number;
    }>();

    for (let i = 0; i < transactionHistory.length; i++) {
      const tx = transactionHistory[i];
      const category = categorizedTransactions[i];
      
      const protocolName = category.protocolName || tx.protocolName || 'Unknown Protocol';
      
      if (!protocolGroups.has(protocolName)) {
        protocolGroups.set(protocolName, {
          transactions: [],
          categories: [],
          totalVolume: 0,
          totalGasCost: 0
        });
      }
      
      const group = protocolGroups.get(protocolName)!;
      group.transactions.push(tx);
      group.categories.push(category);
      group.totalVolume += parseFloat(tx.value);
      group.totalGasCost += parseFloat(tx.gasPrice) * parseInt(tx.gasUsed) / 1e18; // Convert to ETH
    }

    const totalTransactions = transactionHistory.length;
    const totalVolume = transactionHistory.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    
    const preferences: ProtocolPreference[] = [];

    for (const [protocolName, group] of protocolGroups.entries()) {
      const usageFrequency = group.transactions.length;
      const usageFrequencyPercentage = (usageFrequency / totalTransactions) * 100;
      const volumePercentage = totalVolume > 0 ? (group.totalVolume / totalVolume) * 100 : 0;
      
      // Determine protocol type from categories
      const protocolType = group.categories[0]?.protocolType || ProtocolType.DEX;
      
      // Calculate sophistication score
      const sophisticationScores = group.categories.map(cat => {
        const sophisticationValues = { BASIC: 25, INTERMEDIATE: 50, ADVANCED: 75, EXPERT: 100 };
        return sophisticationValues[cat.sophisticationLevel as keyof typeof sophisticationValues];
      });
      const sophisticationScore = sophisticationScores.reduce((sum, score) => sum + score, 0) / sophisticationScores.length;
      
      // Determine preference strength
      let preferenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'DOMINANT';
      if (usageFrequencyPercentage >= 50) preferenceStrength = 'DOMINANT';
      else if (usageFrequencyPercentage >= 25) preferenceStrength = 'STRONG';
      else if (usageFrequencyPercentage >= 10) preferenceStrength = 'MODERATE';
      else preferenceStrength = 'WEAK';
      
      // Calculate timestamps
      const timestamps = group.transactions.map(tx => tx.timestamp).sort((a, b) => a - b);
      const firstUsed = timestamps[0];
      const lastUsed = timestamps[timestamps.length - 1];
      
      // Analyze usage trend
      const recentTransactions = group.transactions.filter(tx => 
        tx.timestamp > (Date.now() / 1000) - (30 * 24 * 60 * 60) // Last 30 days
      ).length;
      const olderTransactions = group.transactions.filter(tx => 
        tx.timestamp <= (Date.now() / 1000) - (30 * 24 * 60 * 60) && 
        tx.timestamp > (Date.now() / 1000) - (60 * 24 * 60 * 60) // 30-60 days ago
      ).length;
      
      let usageTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
      if (recentTransactions > olderTransactions * 1.5) usageTrend = 'INCREASING';
      else if (recentTransactions < olderTransactions * 0.5) usageTrend = 'DECREASING';
      else usageTrend = 'STABLE';
      
      // Calculate average gas efficiency
      const gasEfficiencies = group.transactions.map(tx => {
        const gasPrice = parseFloat(tx.gasPrice);
        if (gasPrice <= this.GAS_PRICE_THRESHOLDS.EXCELLENT) return 90;
        if (gasPrice <= this.GAS_PRICE_THRESHOLDS.GOOD) return 70;
        if (gasPrice <= this.GAS_PRICE_THRESHOLDS.AVERAGE) return 50;
        return 30;
      });
      const averageGasEfficiency = gasEfficiencies.reduce((sum, eff) => sum + eff, 0) / gasEfficiencies.length;
      
      // Calculate average transaction value
      const averageTransactionValue = group.totalVolume / group.transactions.length;
      
      // Assess risk level based on protocol type and sophistication
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (sophisticationScore >= 75 && protocolType === ProtocolType.DERIVATIVES) riskLevel = 'CRITICAL';
      else if (sophisticationScore >= 75) riskLevel = 'HIGH';
      else if (sophisticationScore >= 50) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';

      preferences.push({
        protocolName,
        protocolType,
        usageFrequency,
        usageFrequencyPercentage,
        volumeAmount: group.totalVolume,
        volumePercentage,
        sophisticationScore,
        preferenceStrength,
        lastUsed,
        firstUsed,
        usageTrend,
        averageGasEfficiency,
        averageTransactionValue,
        riskLevel
      });
    }

    // Sort by usage frequency percentage (descending)
    return preferences.sort((a, b) => b.usageFrequencyPercentage - a.usageFrequencyPercentage);
  }  /**

   * Analyze protocol diversification
   * Requirement 3.4: Evaluate protocol usage diversity and provide diversification recommendations
   */
  private static analyzeProtocolDiversification(
    preferredProtocols: ProtocolPreference[],
    transactionHistory: TransactionData[]
  ): ProtocolDiversificationAnalysis {
    
    const protocolCount = preferredProtocols.length;
    const protocolTypes = new Set(preferredProtocols.map(p => p.protocolType));
    const protocolTypeCount = protocolTypes.size;
    
    // Calculate Herfindahl-Hirschman Index for concentration
    const herfindahlIndex = preferredProtocols.reduce((sum, protocol) => {
      const marketShare = protocol.usageFrequencyPercentage / 100;
      return sum + (marketShare * marketShare);
    }, 0);
    
    // Calculate diversification score (inverse of concentration)
    let diversificationScore = 0;
    if (protocolCount === 0) {
      diversificationScore = 0;
    } else if (protocolCount === 1) {
      diversificationScore = 20;
    } else if (protocolCount <= 3) {
      diversificationScore = 40 + (protocolTypeCount * 10);
    } else if (protocolCount <= 6) {
      diversificationScore = 60 + (protocolTypeCount * 5);
    } else {
      diversificationScore = Math.min(100, 80 + (protocolTypeCount * 3));
    }
    
    // Adjust for concentration (Herfindahl index penalty)
    diversificationScore = Math.max(0, diversificationScore - (herfindahlIndex * 50));
    
    // Determine diversification level
    let diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
    if (diversificationScore >= 80) diversificationLevel = 'EXCELLENT';
    else if (diversificationScore >= 60) diversificationLevel = 'HIGH';
    else if (diversificationScore >= 40) diversificationLevel = 'MEDIUM';
    else diversificationLevel = 'LOW';
    
    // Determine concentration risk
    let concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (herfindahlIndex >= 0.8) concentrationRisk = 'CRITICAL';
    else if (herfindahlIndex >= 0.6) concentrationRisk = 'HIGH';
    else if (herfindahlIndex >= 0.4) concentrationRisk = 'MEDIUM';
    else concentrationRisk = 'LOW';
    
    // Identify dominant protocol and type
    const dominantProtocol = preferredProtocols.length > 0 ? preferredProtocols[0] : undefined;
    
    const protocolTypeUsage = new Map<ProtocolType, number>();
    for (const protocol of preferredProtocols) {
      const currentUsage = protocolTypeUsage.get(protocol.protocolType) || 0;
      protocolTypeUsage.set(protocol.protocolType, currentUsage + protocol.usageFrequencyPercentage);
    }
    
    const dominantProtocolType = Array.from(protocolTypeUsage.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (diversificationLevel === 'LOW') {
      recommendations.push('Consider exploring additional DeFi protocols to reduce concentration risk');
      recommendations.push('Diversify across different protocol types (DEX, lending, staking)');
    }
    
    if (concentrationRisk === 'HIGH' || concentrationRisk === 'CRITICAL') {
      recommendations.push(`Reduce dependency on ${dominantProtocol?.protocolName} to mitigate concentration risk`);
    }
    
    if (protocolTypeCount < 3) {
      recommendations.push('Explore different types of DeFi protocols to improve diversification');
    }
    
    if (preferredProtocols.some(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')) {
      recommendations.push('Balance high-risk protocols with more conservative options');
    }

    return {
      diversificationScore: Math.round(diversificationScore),
      diversificationLevel,
      protocolCount,
      protocolTypeCount,
      concentrationRisk,
      dominantProtocol,
      dominantProtocolType,
      recommendations,
      herfindahlIndex
    };
  }

  /**
   * Analyze gas optimization and efficiency scoring
   * Requirement 3.2: Measure behavioral consistency across transaction types
   */
  private static analyzeGasOptimization(transactionHistory: TransactionData[]): GasOptimizationAnalysis {
    
    if (transactionHistory.length === 0) {
      return this.createEmptyGasAnalysis();
    }

    // Calculate basic gas metrics
    const gasPrices = transactionHistory.map(tx => parseFloat(tx.gasPrice));
    const gasUsages = transactionHistory.map(tx => parseInt(tx.gasUsed));
    
    const averageGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    const averageGasUsed = gasUsages.reduce((sum, usage) => sum + usage, 0) / gasUsages.length;
    
    // Calculate gas price consistency (coefficient of variation)
    const gasPriceVariance = gasPrices.reduce((sum, price) => sum + Math.pow(price - averageGasPrice, 2), 0) / gasPrices.length;
    const gasPriceStdDev = Math.sqrt(gasPriceVariance);
    const gasPriceConsistency = averageGasPrice > 0 ? Math.max(0, 100 - (gasPriceStdDev / averageGasPrice * 100)) : 0;
    
    // Calculate gas usage consistency
    const gasUsageVariance = gasUsages.reduce((sum, usage) => sum + Math.pow(usage - averageGasUsed, 2), 0) / gasUsages.length;
    const gasUsageStdDev = Math.sqrt(gasUsageVariance);
    const gasUsageConsistency = averageGasUsed > 0 ? Math.max(0, 100 - (gasUsageStdDev / averageGasUsed * 100)) : 0;
    
    // Calculate gas price optimization score
    let gasPriceOptimization = 0;
    if (averageGasPrice <= this.GAS_PRICE_THRESHOLDS.EXCELLENT) {
      gasPriceOptimization = 90 + (this.GAS_PRICE_THRESHOLDS.EXCELLENT - averageGasPrice) / this.GAS_PRICE_THRESHOLDS.EXCELLENT * 10;
    } else if (averageGasPrice <= this.GAS_PRICE_THRESHOLDS.GOOD) {
      gasPriceOptimization = 70 + (this.GAS_PRICE_THRESHOLDS.GOOD - averageGasPrice) / (this.GAS_PRICE_THRESHOLDS.GOOD - this.GAS_PRICE_THRESHOLDS.EXCELLENT) * 20;
    } else if (averageGasPrice <= this.GAS_PRICE_THRESHOLDS.AVERAGE) {
      gasPriceOptimization = 40 + (this.GAS_PRICE_THRESHOLDS.AVERAGE - averageGasPrice) / (this.GAS_PRICE_THRESHOLDS.AVERAGE - this.GAS_PRICE_THRESHOLDS.GOOD) * 30;
    } else {
      gasPriceOptimization = Math.max(0, 40 - (averageGasPrice - this.GAS_PRICE_THRESHOLDS.AVERAGE) / this.GAS_PRICE_THRESHOLDS.AVERAGE * 40);
    }
    
    // Calculate gas usage efficiency (lower gas usage for similar operations is better)
    const gasUsageEfficiency = Math.max(0, Math.min(100, 100 - (averageGasUsed - 21000) / 500000 * 100));
    
    // Calculate overall efficiency score
    const overallEfficiencyScore = (
      gasPriceOptimization * 0.4 +
      gasUsageEfficiency * 0.3 +
      gasPriceConsistency * 0.2 +
      gasUsageConsistency * 0.1
    );
    
    // Determine optimization level
    let optimizationLevel: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
    if (overallEfficiencyScore >= 80) optimizationLevel = 'EXCELLENT';
    else if (overallEfficiencyScore >= 60) optimizationLevel = 'GOOD';
    else if (overallEfficiencyScore >= 40) optimizationLevel = 'AVERAGE';
    else optimizationLevel = 'POOR';
    
    // Calculate total gas cost and potential savings
    const totalGasCost = transactionHistory.reduce((sum, tx) => {
      return sum + (parseFloat(tx.gasPrice) * parseInt(tx.gasUsed)) / 1e18; // Convert to ETH
    }, 0);
    
    const averageTransactionCost = totalGasCost / transactionHistory.length;
    
    // Estimate potential savings if user optimized to "GOOD" level (50 Gwei average)
    const optimizedGasCost = transactionHistory.reduce((sum, tx) => {
      const currentGasPrice = parseFloat(tx.gasPrice);
      const optimizedGasPrice = Math.min(currentGasPrice, this.GAS_PRICE_THRESHOLDS.GOOD);
      return sum + (optimizedGasPrice * parseInt(tx.gasUsed)) / 1e18;
    }, 0);
    
    const estimatedSavings = totalGasCost - optimizedGasCost;
    const costOptimizationPotential = totalGasCost > 0 ? (estimatedSavings / totalGasCost) * 100 : 0;
    
    // Analyze protocol-specific efficiency
    const protocolEfficiencyRankings = this.analyzeProtocolEfficiency(transactionHistory);
    
    // Generate optimization recommendations
    const optimizationRecommendations = this.generateGasOptimizationRecommendations(
      overallEfficiencyScore,
      averageGasPrice,
      gasPriceConsistency,
      costOptimizationPotential
    );

    return {
      overallEfficiencyScore: Math.round(overallEfficiencyScore),
      optimizationLevel,
      averageGasPrice,
      gasPriceConsistency: Math.round(gasPriceConsistency),
      gasPriceOptimization: Math.round(gasPriceOptimization),
      averageGasUsed,
      gasUsageEfficiency: Math.round(gasUsageEfficiency),
      gasUsageConsistency: Math.round(gasUsageConsistency),
      totalGasCost,
      averageTransactionCost,
      costOptimizationPotential: Math.round(costOptimizationPotential),
      estimatedSavings,
      protocolEfficiencyRankings,
      optimizationRecommendations
    };
  }

  /**
   * Analyze protocol-specific efficiency rankings
   */
  private static analyzeProtocolEfficiency(transactionHistory: TransactionData[]): ProtocolEfficiencyRanking[] {
    const categorizedTransactions = TransactionCategorizer.categorizeTransactions(transactionHistory);
    
    // Group by protocol
    const protocolGroups = new Map<string, {
      transactions: TransactionData[];
      categories: any[];
      totalGasUsed: number;
      totalGasPrice: number;
    }>();

    for (let i = 0; i < transactionHistory.length; i++) {
      const tx = transactionHistory[i];
      const category = categorizedTransactions[i];
      
      const protocolName = category.protocolName || tx.protocolName || 'Unknown Protocol';
      
      if (!protocolGroups.has(protocolName)) {
        protocolGroups.set(protocolName, {
          transactions: [],
          categories: [],
          totalGasUsed: 0,
          totalGasPrice: 0
        });
      }
      
      const group = protocolGroups.get(protocolName)!;
      group.transactions.push(tx);
      group.categories.push(category);
      group.totalGasUsed += parseInt(tx.gasUsed);
      group.totalGasPrice += parseFloat(tx.gasPrice);
    }

    const rankings: ProtocolEfficiencyRanking[] = [];

    for (const [protocolName, group] of protocolGroups.entries()) {
      const averageGasUsed = group.totalGasUsed / group.transactions.length;
      const averageGasPrice = group.totalGasPrice / group.transactions.length;
      const protocolType = group.categories[0]?.protocolType || ProtocolType.DEX;
      
      // Calculate efficiency score (lower gas usage and price = higher efficiency)
      const gasUsageScore = Math.max(0, Math.min(100, 100 - (averageGasUsed - 21000) / 500000 * 100));
      const gasPriceScore = averageGasPrice <= this.GAS_PRICE_THRESHOLDS.GOOD ? 80 : 
                           averageGasPrice <= this.GAS_PRICE_THRESHOLDS.AVERAGE ? 60 : 40;
      
      const efficiencyScore = (gasUsageScore * 0.6) + (gasPriceScore * 0.4);

      rankings.push({
        protocolName,
        protocolType,
        efficiencyScore: Math.round(efficiencyScore),
        averageGasUsed,
        averageGasPrice,
        transactionCount: group.transactions.length,
        ranking: 0 // Will be set after sorting
      });
    }

    // Sort by efficiency score and assign rankings
    rankings.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    rankings.forEach((ranking, index) => {
      ranking.ranking = index + 1;
    });

    return rankings;
  }

  /**
   * Generate gas optimization recommendations
   */
  private static generateGasOptimizationRecommendations(
    overallEfficiencyScore: number,
    averageGasPrice: number,
    gasPriceConsistency: number,
    costOptimizationPotential: number
  ): GasOptimizationRecommendation[] {
    
    const recommendations: GasOptimizationRecommendation[] = [];

    // Gas price optimization
    if (averageGasPrice > this.GAS_PRICE_THRESHOLDS.GOOD) {
      recommendations.push({
        type: 'GAS_PRICE',
        priority: 'HIGH',
        title: 'Optimize Gas Price Settings',
        description: `Your average gas price of ${averageGasPrice.toFixed(1)} Gwei is higher than optimal. Consider using lower gas prices for non-urgent transactions.`,
        expectedSavings: Math.min(50, (averageGasPrice - this.GAS_PRICE_THRESHOLDS.GOOD) / averageGasPrice * 100),
        implementationDifficulty: 'EASY',
        specificGuidance: [
          'Use gas price tracking tools to identify optimal timing',
          'Set custom gas prices instead of using wallet defaults',
          'Consider using "slow" transaction speeds for non-urgent operations'
        ]
      });
    }

    // Timing optimization
    if (gasPriceConsistency < 60) {
      recommendations.push({
        type: 'TIMING',
        priority: 'MEDIUM',
        title: 'Improve Transaction Timing',
        description: 'Your gas price consistency is low, suggesting you may be transacting during high-congestion periods.',
        expectedSavings: 20,
        implementationDifficulty: 'MEDIUM',
        specificGuidance: [
          'Monitor network congestion before making transactions',
          'Avoid peak hours (typically 12-18 UTC)',
          'Use gas price prediction tools',
          'Consider batching transactions during low-congestion periods'
        ]
      });
    }

    // Protocol choice optimization
    if (overallEfficiencyScore < 60) {
      recommendations.push({
        type: 'PROTOCOL_CHOICE',
        priority: 'MEDIUM',
        title: 'Consider More Efficient Protocols',
        description: 'Some protocols you use may be less gas-efficient than alternatives.',
        expectedSavings: 15,
        implementationDifficulty: 'MEDIUM',
        specificGuidance: [
          'Research gas-efficient alternatives to your current protocols',
          'Consider Layer 2 solutions for frequent transactions',
          'Use DEX aggregators that optimize for gas efficiency',
          'Evaluate protocol efficiency before making large transactions'
        ]
      });
    }

    // Batch transactions
    if (costOptimizationPotential > 20) {
      recommendations.push({
        type: 'BATCH_TRANSACTIONS',
        priority: 'HIGH',
        title: 'Batch Similar Transactions',
        description: 'Batching multiple operations can significantly reduce total gas costs.',
        expectedSavings: Math.min(40, costOptimizationPotential),
        implementationDifficulty: 'MEDIUM',
        specificGuidance: [
          'Group similar operations together',
          'Use protocols that support batch operations',
          'Plan transactions in advance to identify batching opportunities',
          'Consider using multicall contracts for complex operations'
        ]
      });
    }

    return recommendations;
  } 
 /**
   * Analyze transaction timing for optimal gas usage patterns
   * Requirement 3.2: Measure behavioral consistency across time periods
   */
  private static analyzeTransactionTiming(transactionHistory: TransactionData[]): TransactionTimingAnalysis {
    
    if (transactionHistory.length === 0) {
      return this.createEmptyTimingAnalysis();
    }

    // Analyze timing patterns
    const timingCorrelations = this.calculateTimingCorrelations(transactionHistory);
    const optimalTimingWindows = this.identifyOptimalTimingWindows(timingCorrelations);
    
    // Calculate current timing efficiency
    const currentTimingEfficiency = this.calculateCurrentTimingEfficiency(transactionHistory, optimalTimingWindows);
    
    // Calculate timing consistency
    const timingConsistency = this.calculateTimingConsistency(transactionHistory);
    
    // Analyze activity patterns
    const { preferredHours, preferredDaysOfWeek, peakActivityPeriods } = this.analyzeActivityPatterns(transactionHistory);
    
    // Assess congestion awareness
    const { congestionAwareness, congestionAvoidance } = this.assessCongestionAwareness(transactionHistory);
    
    // Generate timing recommendations
    const timingRecommendations = this.generateTimingRecommendations(
      currentTimingEfficiency,
      timingConsistency,
      congestionAwareness,
      optimalTimingWindows,
      timingCorrelations
    );

    return {
      optimalTimingWindows,
      currentTimingEfficiency: Math.round(currentTimingEfficiency),
      timingConsistency: Math.round(timingConsistency),
      gasPriceTimingCorrelation: timingCorrelations,
      preferredHours,
      preferredDaysOfWeek,
      peakActivityPeriods,
      congestionAwareness: Math.round(congestionAwareness),
      congestionAvoidance: Math.round(congestionAvoidance),
      timingRecommendations
    };
  }

  /**
   * Calculate timing correlations between gas prices and transaction times
   */
  private static calculateTimingCorrelations(transactionHistory: TransactionData[]): TimingCorrelation[] {
    const correlations = new Map<string, {
      totalGasPrice: number;
      transactionCount: number;
      transactions: TransactionData[];
    }>();

    // Group transactions by hour and day of week
    for (const tx of transactionHistory) {
      const date = new Date(tx.timestamp * 1000);
      const hour = date.getUTCHours();
      const dayOfWeek = date.getUTCDay();
      const key = `${dayOfWeek}-${hour}`;

      if (!correlations.has(key)) {
        correlations.set(key, {
          totalGasPrice: 0,
          transactionCount: 0,
          transactions: []
        });
      }

      const correlation = correlations.get(key)!;
      correlation.totalGasPrice += parseFloat(tx.gasPrice);
      correlation.transactionCount += 1;
      correlation.transactions.push(tx);
    }

    // Convert to TimingCorrelation array
    const timingCorrelations: TimingCorrelation[] = [];
    
    for (const [key, data] of correlations.entries()) {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      const averageGasPrice = data.totalGasPrice / data.transactionCount;
      
      // Calculate efficiency score based on gas price
      let efficiencyScore = 0;
      if (averageGasPrice <= this.GAS_PRICE_THRESHOLDS.EXCELLENT) efficiencyScore = 90;
      else if (averageGasPrice <= this.GAS_PRICE_THRESHOLDS.GOOD) efficiencyScore = 70;
      else if (averageGasPrice <= this.GAS_PRICE_THRESHOLDS.AVERAGE) efficiencyScore = 50;
      else efficiencyScore = 30;

      timingCorrelations.push({
        hour,
        dayOfWeek,
        averageGasPrice,
        transactionCount: data.transactionCount,
        efficiencyScore
      });
    }

    return timingCorrelations.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }

  /**
   * Identify optimal timing windows based on gas price analysis
   */
  private static identifyOptimalTimingWindows(timingCorrelations: TimingCorrelation[]): TimingWindow[] {
    const windows: TimingWindow[] = [];
    
    // Group correlations by efficiency level
    const optimalCorrelations = timingCorrelations.filter(tc => tc.efficiencyScore >= 70);
    const goodCorrelations = timingCorrelations.filter(tc => tc.efficiencyScore >= 50 && tc.efficiencyScore < 70);
    const averageCorrelations = timingCorrelations.filter(tc => tc.efficiencyScore >= 30 && tc.efficiencyScore < 50);
    
    // Create windows for optimal times
    for (const correlation of optimalCorrelations) {
      const potentialSavings = Math.max(0, (50 - correlation.averageGasPrice) / 50 * 100); // Savings compared to 50 Gwei baseline
      
      windows.push({
        startHour: correlation.hour,
        endHour: (correlation.hour + 1) % 24,
        dayOfWeek: correlation.dayOfWeek,
        averageGasPrice: correlation.averageGasPrice,
        networkCongestion: correlation.averageGasPrice <= this.GAS_PRICE_THRESHOLDS.EXCELLENT ? 'LOW' : 'MEDIUM',
        recommendationLevel: 'OPTIMAL',
        potentialSavings
      });
    }
    
    // Add general optimal windows based on known patterns
    for (const window of this.OPTIMAL_TIMING_WINDOWS) {
      const existingWindow = windows.find(w => w.startHour === window.start && !w.dayOfWeek);
      
      if (!existingWindow) {
        windows.push({
          startHour: window.start,
          endHour: window.end,
          averageGasPrice: this.GAS_PRICE_THRESHOLDS.GOOD, // Estimated
          networkCongestion: 'LOW',
          recommendationLevel: 'GOOD',
          potentialSavings: 25
        });
      }
    }

    return windows.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Calculate current timing efficiency based on user's transaction patterns
   */
  private static calculateCurrentTimingEfficiency(
    transactionHistory: TransactionData[],
    optimalWindows: TimingWindow[]
  ): number {
    
    if (transactionHistory.length === 0 || optimalWindows.length === 0) {
      return 50; // Neutral score
    }

    let optimalTransactions = 0;
    
    for (const tx of transactionHistory) {
      const date = new Date(tx.timestamp * 1000);
      const hour = date.getUTCHours();
      const dayOfWeek = date.getUTCDay();
      
      // Check if transaction falls within any optimal window
      const isOptimal = optimalWindows.some(window => {
        const hourMatch = hour >= window.startHour && hour < window.endHour;
        const dayMatch = !window.dayOfWeek || window.dayOfWeek === dayOfWeek;
        return hourMatch && dayMatch && window.recommendationLevel === 'OPTIMAL';
      });
      
      if (isOptimal) {
        optimalTransactions++;
      }
    }

    return (optimalTransactions / transactionHistory.length) * 100;
  }

  /**
   * Calculate timing consistency
   */
  private static calculateTimingConsistency(transactionHistory: TransactionData[]): number {
    if (transactionHistory.length < 2) {
      return 0;
    }

    // Analyze hour-of-day consistency
    const hourCounts = new Array(24).fill(0);
    for (const tx of transactionHistory) {
      const hour = new Date(tx.timestamp * 1000).getUTCHours();
      hourCounts[hour]++;
    }
    
    // Calculate entropy (lower entropy = more consistent)
    const totalTxs = transactionHistory.length;
    let entropy = 0;
    for (const count of hourCounts) {
      if (count > 0) {
        const probability = count / totalTxs;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    // Convert entropy to consistency score (0-100)
    const maxEntropy = Math.log2(24); // Maximum possible entropy for 24 hours
    const consistencyScore = Math.max(0, (1 - entropy / maxEntropy) * 100);
    
    return consistencyScore;
  }

  /**
   * Analyze activity patterns to identify preferred times
   */
  private static analyzeActivityPatterns(transactionHistory: TransactionData[]): {
    preferredHours: number[];
    preferredDaysOfWeek: number[];
    peakActivityPeriods: ActivityPeriod[];
  } {
    
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const hourlyVolume = new Array(24).fill(0);
    const hourlyGasPrice = new Array(24).fill(0);
    
    // Collect activity data
    for (const tx of transactionHistory) {
      const date = new Date(tx.timestamp * 1000);
      const hour = date.getUTCHours();
      const dayOfWeek = date.getUTCDay();
      
      hourCounts[hour]++;
      dayCounts[dayOfWeek]++;
      hourlyVolume[hour] += parseFloat(tx.value);
      hourlyGasPrice[hour] += parseFloat(tx.gasPrice);
    }
    
    // Identify preferred hours (top 25% of activity)
    const maxHourCount = Math.max(...hourCounts);
    const preferredHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= maxHourCount * 0.25)
      .map(({ hour }) => hour);
    
    // Identify preferred days of week (top 25% of activity)
    const maxDayCount = Math.max(...dayCounts);
    const preferredDaysOfWeek = dayCounts
      .map((count, day) => ({ day, count }))
      .filter(({ count }) => count >= maxDayCount * 0.25)
      .map(({ day }) => day);
    
    // Create peak activity periods
    const peakActivityPeriods: ActivityPeriod[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      if (hourCounts[hour] > 0) {
        const count = hourCounts[hour];
        const avgVolume = hourlyVolume[hour] / count;
        const avgGasPrice = hourlyGasPrice[hour] / count;
        
        let activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
        if (count >= maxHourCount * 0.75) activityLevel = 'PEAK';
        else if (count >= maxHourCount * 0.5) activityLevel = 'HIGH';
        else if (count >= maxHourCount * 0.25) activityLevel = 'MEDIUM';
        else activityLevel = 'LOW';
        
        // Calculate efficiency score for this hour
        let efficiencyScore = 0;
        if (avgGasPrice <= this.GAS_PRICE_THRESHOLDS.EXCELLENT) efficiencyScore = 90;
        else if (avgGasPrice <= this.GAS_PRICE_THRESHOLDS.GOOD) efficiencyScore = 70;
        else if (avgGasPrice <= this.GAS_PRICE_THRESHOLDS.AVERAGE) efficiencyScore = 50;
        else efficiencyScore = 30;

        peakActivityPeriods.push({
          startHour: hour,
          endHour: (hour + 1) % 24,
          activityLevel,
          transactionCount: count,
          averageVolume: avgVolume,
          averageGasPrice: avgGasPrice,
          efficiencyScore
        });
      }
    }

    return {
      preferredHours,
      preferredDaysOfWeek,
      peakActivityPeriods: peakActivityPeriods.sort((a, b) => b.transactionCount - a.transactionCount)
    };
  }

  /**
   * Assess congestion awareness and avoidance
   */
  private static assessCongestionAwareness(transactionHistory: TransactionData[]): {
    congestionAwareness: number;
    congestionAvoidance: number;
  } {
    
    if (transactionHistory.length === 0) {
      return { congestionAwareness: 0, congestionAvoidance: 0 };
    }

    // Analyze gas price patterns to infer congestion awareness
    const gasPrices = transactionHistory.map(tx => parseFloat(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    
    // Count transactions during known high-congestion periods (12-18 UTC)
    const highCongestionTxs = transactionHistory.filter(tx => {
      const hour = new Date(tx.timestamp * 1000).getUTCHours();
      return hour >= 12 && hour <= 18;
    });
    
    const highCongestionRatio = highCongestionTxs.length / transactionHistory.length;
    
    // Congestion awareness: ability to adjust gas prices appropriately
    let congestionAwareness = 0;
    if (avgGasPrice <= this.GAS_PRICE_THRESHOLDS.GOOD) {
      congestionAwareness = 80; // Good awareness, keeps prices low
    } else if (avgGasPrice <= this.GAS_PRICE_THRESHOLDS.AVERAGE) {
      congestionAwareness = 60; // Moderate awareness
    } else {
      congestionAwareness = 30; // Poor awareness, pays high prices
    }
    
    // Congestion avoidance: tendency to avoid high-congestion periods
    const congestionAvoidance = Math.max(0, (1 - highCongestionRatio) * 100);

    return {
      congestionAwareness,
      congestionAvoidance
    };
  }

  /**
   * Generate timing recommendations
   */
  private static generateTimingRecommendations(
    currentTimingEfficiency: number,
    timingConsistency: number,
    congestionAwareness: number,
    optimalWindows: TimingWindow[],
    timingCorrelations: TimingCorrelation[]
  ): TimingRecommendation[] {
    
    const recommendations: TimingRecommendation[] = [];

    // Optimal hours recommendation
    if (currentTimingEfficiency < 60) {
      const bestWindows = optimalWindows.filter(w => w.recommendationLevel === 'OPTIMAL').slice(0, 3);
      
      recommendations.push({
        type: 'OPTIMAL_HOURS',
        priority: 'HIGH',
        title: 'Optimize Transaction Timing',
        description: 'Transacting during optimal hours can significantly reduce gas costs.',
        specificTimes: bestWindows.map(w => `${w.startHour}:00-${w.endHour}:00 UTC`),
        expectedSavings: Math.min(40, Math.max(...bestWindows.map(w => w.potentialSavings))),
        confidence: 85
      });
    }

    // Avoid high-congestion hours
    if (congestionAwareness < 50) {
      recommendations.push({
        type: 'AVOID_HOURS',
        priority: 'MEDIUM',
        title: 'Avoid Peak Congestion Hours',
        description: 'Avoid transacting during 12-18 UTC when network congestion is typically highest.',
        specificTimes: ['12:00-18:00 UTC (Peak congestion)'],
        expectedSavings: 25,
        confidence: 75
      });
    }

    // Day of week optimization
    const bestDays = timingCorrelations
      .filter(tc => tc.efficiencyScore >= 70)
      .map(tc => tc.dayOfWeek)
      .filter((day, index, arr) => arr.indexOf(day) === index)
      .slice(0, 3);
    
    if (bestDays.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      recommendations.push({
        type: 'DAY_OF_WEEK',
        priority: 'LOW',
        title: 'Consider Day-of-Week Patterns',
        description: 'Some days of the week tend to have lower gas prices.',
        specificTimes: bestDays.map(day => dayNames[day]),
        expectedSavings: 15,
        confidence: 60
      });
    }

    // Batch timing recommendation
    if (timingConsistency < 40) {
      recommendations.push({
        type: 'BATCH_TIMING',
        priority: 'MEDIUM',
        title: 'Batch Transactions During Optimal Windows',
        description: 'Group multiple transactions together during low-congestion periods.',
        specificTimes: ['During identified optimal windows'],
        expectedSavings: 30,
        confidence: 70
      });
    }

    return recommendations;
  }  
/**
   * Analyze protocol sophistication scoring based on complexity of interactions
   * Requirement 3.5: Highlight significant pattern shifts and their potential impact
   */
  private static analyzeProtocolSophistication(transactionHistory: TransactionData[]): ProtocolSophisticationAnalysis {
    
    if (transactionHistory.length === 0) {
      return this.createEmptySophisticationAnalysis();
    }

    const categorizedTransactions = TransactionCategorizer.categorizeTransactions(transactionHistory);
    
    // Calculate sophistication distribution
    const protocolComplexityDistribution = {
      [SophisticationLevel.BASIC]: 0,
      [SophisticationLevel.INTERMEDIATE]: 0,
      [SophisticationLevel.ADVANCED]: 0,
      [SophisticationLevel.EXPERT]: 0
    };
    
    let totalSophisticationScore = 0;
    const sophisticationValues = {
      [SophisticationLevel.BASIC]: 25,
      [SophisticationLevel.INTERMEDIATE]: 50,
      [SophisticationLevel.ADVANCED]: 75,
      [SophisticationLevel.EXPERT]: 100
    };
    
    // Analyze each transaction's sophistication
    for (const category of categorizedTransactions) {
      protocolComplexityDistribution[category.sophisticationLevel]++;
      totalSophisticationScore += sophisticationValues[category.sophisticationLevel];
    }
    
    const overallSophisticationScore = totalSophisticationScore / categorizedTransactions.length;
    
    // Determine sophistication level
    let sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    if (overallSophisticationScore >= 80) sophisticationLevel = 'EXPERT';
    else if (overallSophisticationScore >= 60) sophisticationLevel = 'ADVANCED';
    else if (overallSophisticationScore >= 40) sophisticationLevel = 'INTERMEDIATE';
    else sophisticationLevel = 'BEGINNER';
    
    // Analyze sophistication trend
    const sophisticationTrend = this.analyzeSophisticationTrend(categorizedTransactions, transactionHistory);
    
    // Analyze sophistication by protocol type
    const protocolTypeSophistication = this.analyzeProtocolTypeSophistication(categorizedTransactions, transactionHistory);
    
    // Identify advanced features usage
    const advancedFeaturesUsage = this.identifyAdvancedFeaturesUsage(categorizedTransactions, transactionHistory);
    
    // Analyze learning progression
    const learningProgression = this.analyzeLearningProgression(categorizedTransactions, transactionHistory);
    
    // Generate sophistication recommendations
    const sophisticationRecommendations = this.generateSophisticationRecommendations(
      sophisticationLevel,
      sophisticationTrend,
      protocolTypeSophistication,
      learningProgression
    );

    return {
      overallSophisticationScore: Math.round(overallSophisticationScore),
      sophisticationLevel,
      sophisticationTrend,
      protocolComplexityDistribution,
      protocolTypeSophistication,
      advancedFeaturesUsage,
      learningProgression,
      sophisticationRecommendations
    };
  }

  /**
   * Analyze sophistication trend over time
   */
  private static analyzeSophisticationTrend(
    categorizedTransactions: any[],
    transactionHistory: TransactionData[]
  ): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    
    if (transactionHistory.length < 6) {
      return 'STABLE'; // Insufficient data
    }

    const sophisticationValues = {
      [SophisticationLevel.BASIC]: 25,
      [SophisticationLevel.INTERMEDIATE]: 50,
      [SophisticationLevel.ADVANCED]: 75,
      [SophisticationLevel.EXPERT]: 100
    };
    
    // Split transactions into periods
    const midpoint = Math.floor(transactionHistory.length / 2);
    const recentTransactions = categorizedTransactions.slice(-midpoint);
    const olderTransactions = categorizedTransactions.slice(0, midpoint);
    
    // Calculate average sophistication for each period
    const recentAvg = recentTransactions.reduce((sum, tx) => 
      sum + sophisticationValues[tx.sophisticationLevel as keyof typeof sophisticationValues], 0) / recentTransactions.length;
    
    const olderAvg = olderTransactions.reduce((sum, tx) => 
      sum + sophisticationValues[tx.sophisticationLevel as keyof typeof sophisticationValues], 0) / olderTransactions.length;
    
    // Determine trend
    if (recentAvg > olderAvg * 1.15) return 'IMPROVING';
    if (recentAvg < olderAvg * 0.85) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Analyze sophistication by protocol type
   */
  private static analyzeProtocolTypeSophistication(
    categorizedTransactions: any[],
    transactionHistory: TransactionData[]
  ): ProtocolTypeSophistication[] {
    
    const protocolTypeGroups = new Map<ProtocolType, {
      transactions: any[];
      sophisticationScores: number[];
    }>();

    const sophisticationValues = {
      [SophisticationLevel.BASIC]: 25,
      [SophisticationLevel.INTERMEDIATE]: 50,
      [SophisticationLevel.ADVANCED]: 75,
      [SophisticationLevel.EXPERT]: 100
    };

    // Group by protocol type
    for (const category of categorizedTransactions) {
      const protocolType = category.protocolType || ProtocolType.DEX;
      
      if (!protocolTypeGroups.has(protocolType)) {
        protocolTypeGroups.set(protocolType, {
          transactions: [],
          sophisticationScores: []
        });
      }
      
      const group = protocolTypeGroups.get(protocolType)!;
      group.transactions.push(category);
      group.sophisticationScores.push(sophisticationValues[category.sophisticationLevel as keyof typeof sophisticationValues]);
    }

    const results: ProtocolTypeSophistication[] = [];

    for (const [protocolType, group] of protocolTypeGroups.entries()) {
      const sophisticationScore = group.sophisticationScores.reduce((sum, score) => sum + score, 0) / group.sophisticationScores.length;
      const averageComplexity = sophisticationScore;
      
      // Find most advanced protocol
      const mostAdvancedTx = group.transactions.reduce((max, tx) => 
        sophisticationValues[tx.sophisticationLevel as keyof typeof sophisticationValues] > sophisticationValues[max.sophisticationLevel as keyof typeof sophisticationValues] ? tx : max
      );
      const mostAdvancedProtocol = mostAdvancedTx.protocolName || 'Unknown';
      
      // Determine expertise level
      let expertiseLevel: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
      if (sophisticationScore >= 80) expertiseLevel = 'EXPERT';
      else if (sophisticationScore >= 60) expertiseLevel = 'ADVANCED';
      else if (sophisticationScore >= 40) expertiseLevel = 'INTERMEDIATE';
      else if (sophisticationScore >= 20) expertiseLevel = 'BASIC';
      else expertiseLevel = 'NONE';

      results.push({
        protocolType,
        sophisticationScore: Math.round(sophisticationScore),
        transactionCount: group.transactions.length,
        averageComplexity: Math.round(averageComplexity),
        mostAdvancedProtocol,
        expertiseLevel
      });
    }

    return results.sort((a, b) => b.sophisticationScore - a.sophisticationScore);
  }

  /**
   * Identify advanced features usage
   */
  private static identifyAdvancedFeaturesUsage(
    categorizedTransactions: any[],
    transactionHistory: TransactionData[]
  ): AdvancedFeatureUsage[] {
    
    const advancedFeatures: AdvancedFeatureUsage[] = [];
    
    // Define advanced features by protocol type and sophistication
    const featureDefinitions = [
      {
        name: 'Flash Loans',
        protocolType: ProtocolType.LENDING,
        sophisticationLevel: SophisticationLevel.EXPERT,
        description: 'Uncollateralized loans that must be repaid in the same transaction',
        riskLevel: 'HIGH' as const
      },
      {
        name: 'Concentrated Liquidity',
        protocolType: ProtocolType.DEX,
        sophisticationLevel: SophisticationLevel.ADVANCED,
        description: 'Providing liquidity within specific price ranges',
        riskLevel: 'MEDIUM' as const
      },
      {
        name: 'Yield Farming Strategies',
        protocolType: ProtocolType.YIELD_FARMING,
        sophisticationLevel: SophisticationLevel.ADVANCED,
        description: 'Complex multi-protocol yield optimization',
        riskLevel: 'HIGH' as const
      },
      {
        name: 'Derivatives Trading',
        protocolType: ProtocolType.DERIVATIVES,
        sophisticationLevel: SophisticationLevel.EXPERT,
        description: 'Trading synthetic assets and complex financial instruments',
        riskLevel: 'CRITICAL' as const
      },
      {
        name: 'Cross-chain Bridging',
        protocolType: ProtocolType.BRIDGE,
        sophisticationLevel: SophisticationLevel.INTERMEDIATE,
        description: 'Moving assets between different blockchain networks',
        riskLevel: 'MEDIUM' as const
      }
    ];

    // Count usage of each advanced feature
    for (const feature of featureDefinitions) {
      const usageCount = categorizedTransactions.filter(tx => 
        tx.protocolType === feature.protocolType && 
        tx.sophisticationLevel === feature.sophisticationLevel
      ).length;

      if (usageCount > 0) {
        advancedFeatures.push({
          featureName: feature.name,
          protocolType: feature.protocolType,
          usageCount,
          sophisticationLevel: feature.sophisticationLevel,
          description: feature.description,
          riskLevel: feature.riskLevel
        });
      }
    }

    return advancedFeatures.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Analyze learning progression
   */
  private static analyzeLearningProgression(
    categorizedTransactions: any[],
    transactionHistory: TransactionData[]
  ): LearningProgressionAnalysis {
    
    if (transactionHistory.length < 10) {
      return {
        progressionTrend: 'STAGNANT',
        timeToAdvancement: 365, // Default to 1 year
        learningVelocity: 0,
        knowledgeGaps: ['Insufficient transaction history for analysis'],
        strengths: [],
        nextMilestones: ['Continue using DeFi protocols to build experience']
      };
    }

    const sophisticationValues = {
      [SophisticationLevel.BASIC]: 25,
      [SophisticationLevel.INTERMEDIATE]: 50,
      [SophisticationLevel.ADVANCED]: 75,
      [SophisticationLevel.EXPERT]: 100
    };

    // Calculate learning velocity (sophistication increase per month)
    const sortedTransactions = transactionHistory
      .map((tx, index) => ({ tx, category: categorizedTransactions[index] }))
      .sort((a, b) => a.tx.timestamp - b.tx.timestamp);

    const firstTx = sortedTransactions[0];
    const lastTx = sortedTransactions[sortedTransactions.length - 1];
    const timeSpanMonths = (lastTx.tx.timestamp - firstTx.tx.timestamp) / (30 * 24 * 60 * 60);

    const firstSophistication = sophisticationValues[firstTx.category.sophisticationLevel as keyof typeof sophisticationValues];
    const lastSophistication = sophisticationValues[lastTx.category.sophisticationLevel as keyof typeof sophisticationValues];
    
    const learningVelocity = timeSpanMonths > 0 ? (lastSophistication - firstSophistication) / timeSpanMonths : 0;

    // Determine progression trend
    let progressionTrend: 'RAPID' | 'STEADY' | 'SLOW' | 'STAGNANT' | 'REGRESSING';
    if (learningVelocity > 10) progressionTrend = 'RAPID';
    else if (learningVelocity > 5) progressionTrend = 'STEADY';
    else if (learningVelocity > 1) progressionTrend = 'SLOW';
    else if (learningVelocity < -1) progressionTrend = 'REGRESSING';
    else progressionTrend = 'STAGNANT';

    // Estimate time to advancement
    const currentSophistication = lastSophistication;
    const nextLevelThreshold = currentSophistication >= 75 ? 100 : 
                              currentSophistication >= 50 ? 75 : 
                              currentSophistication >= 25 ? 50 : 25;
    
    const pointsToNext = nextLevelThreshold - currentSophistication;
    const timeToAdvancement = learningVelocity > 0 ? Math.ceil(pointsToNext / learningVelocity * 30) : 365;

    // Identify knowledge gaps and strengths
    const protocolTypeUsage = new Map<ProtocolType, number>();
    for (const category of categorizedTransactions) {
      const protocolType = category.protocolType || ProtocolType.DEX;
      protocolTypeUsage.set(protocolType, (protocolTypeUsage.get(protocolType) || 0) + 1);
    }

    const knowledgeGaps: string[] = [];
    const strengths: string[] = [];

    // Check for missing protocol types
    const allProtocolTypes = Object.values(ProtocolType);
    for (const protocolType of allProtocolTypes) {
      const usage = protocolTypeUsage.get(protocolType) || 0;
      if (usage === 0) {
        knowledgeGaps.push(`No experience with ${protocolType.toLowerCase()} protocols`);
      } else if (usage >= 5) {
        strengths.push(`Strong experience with ${protocolType.toLowerCase()} protocols`);
      }
    }

    // Generate next milestones
    const nextMilestones: string[] = [];
    if (currentSophistication < 50) {
      nextMilestones.push('Explore intermediate DeFi protocols');
      nextMilestones.push('Learn about liquidity provision');
    } else if (currentSophistication < 75) {
      nextMilestones.push('Try advanced DeFi strategies');
      nextMilestones.push('Explore yield farming opportunities');
    } else {
      nextMilestones.push('Master expert-level protocols');
      nextMilestones.push('Develop custom DeFi strategies');
    }

    return {
      progressionTrend,
      timeToAdvancement,
      learningVelocity,
      knowledgeGaps,
      strengths,
      nextMilestones
    };
  }

  /**
   * Generate sophistication recommendations
   */
  private static generateSophisticationRecommendations(
    sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
    sophisticationTrend: 'IMPROVING' | 'STABLE' | 'DECLINING',
    protocolTypeSophistication: ProtocolTypeSophistication[],
    learningProgression: LearningProgressionAnalysis
  ): SophisticationRecommendation[] {
    
    const recommendations: SophisticationRecommendation[] = [];

    // Protocol exploration recommendations
    if (sophisticationLevel === 'BEGINNER') {
      recommendations.push({
        type: 'PROTOCOL_EXPLORATION',
        priority: 'HIGH',
        title: 'Explore Intermediate DeFi Protocols',
        description: 'Start with user-friendly protocols like Uniswap or Compound to build experience.',
        targetSophisticationLevel: SophisticationLevel.INTERMEDIATE,
        prerequisites: ['Basic understanding of wallets and transactions'],
        expectedTimeframe: '2-3 months',
        riskLevel: 'LOW'
      });
    } else if (sophisticationLevel === 'INTERMEDIATE') {
      recommendations.push({
        type: 'PROTOCOL_EXPLORATION',
        priority: 'MEDIUM',
        title: 'Try Advanced DeFi Strategies',
        description: 'Explore protocols like Aave, Curve, or yield farming platforms.',
        targetSophisticationLevel: SophisticationLevel.ADVANCED,
        prerequisites: ['Solid understanding of DeFi basics', 'Risk management knowledge'],
        expectedTimeframe: '3-6 months',
        riskLevel: 'MEDIUM'
      });
    }

    // Feature adoption recommendations
    if (learningProgression.progressionTrend === 'STAGNANT') {
      recommendations.push({
        type: 'FEATURE_ADOPTION',
        priority: 'HIGH',
        title: 'Adopt New DeFi Features',
        description: 'Try new features within protocols you already use to continue learning.',
        targetSophisticationLevel: sophisticationLevel === 'BEGINNER' ? SophisticationLevel.INTERMEDIATE : SophisticationLevel.ADVANCED,
        prerequisites: ['Current protocol familiarity'],
        expectedTimeframe: '1-2 months',
        riskLevel: 'LOW'
      });
    }

    // Risk management recommendations
    if (protocolTypeSophistication.some(pts => pts.expertiseLevel === 'EXPERT' || pts.expertiseLevel === 'ADVANCED')) {
      recommendations.push({
        type: 'RISK_MANAGEMENT',
        priority: 'HIGH',
        title: 'Enhance Risk Management',
        description: 'Develop better risk management strategies for advanced DeFi usage.',
        targetSophisticationLevel: SophisticationLevel.EXPERT,
        prerequisites: ['Advanced DeFi experience'],
        expectedTimeframe: 'Ongoing',
        riskLevel: 'MEDIUM'
      });
    }

    // Education recommendations
    if (learningProgression.knowledgeGaps.length > 2) {
      recommendations.push({
        type: 'EDUCATION',
        priority: 'MEDIUM',
        title: 'Fill Knowledge Gaps',
        description: 'Focus on learning about unexplored protocol types and features.',
        targetSophisticationLevel: sophisticationLevel === 'BEGINNER' ? SophisticationLevel.INTERMEDIATE : SophisticationLevel.ADVANCED,
        prerequisites: ['Basic DeFi knowledge'],
        expectedTimeframe: '2-4 months',
        riskLevel: 'LOW'
      });
    }

    return recommendations;
  }  /**
   
* Generate comprehensive protocol insights
   */
  private static generateProtocolInsights(
    preferredProtocols: ProtocolPreference[],
    protocolDiversification: ProtocolDiversificationAnalysis,
    gasOptimizationAnalysis: GasOptimizationAnalysis,
    transactionTimingAnalysis: TransactionTimingAnalysis,
    protocolSophisticationAnalysis: ProtocolSophisticationAnalysis
  ): ProtocolInsights {
    
    const keyFindings: string[] = [];
    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];
    const behavioralPatterns: string[] = [];

    // Key findings
    if (preferredProtocols.length > 0) {
      const dominantProtocol = preferredProtocols[0];
      keyFindings.push(`Primary protocol: ${dominantProtocol.protocolName} (${dominantProtocol.usageFrequencyPercentage.toFixed(1)}% of transactions)`);
      
      if (dominantProtocol.usageTrend === 'INCREASING') {
        keyFindings.push(`Increasing usage of ${dominantProtocol.protocolName} indicates growing preference`);
      }
    }

    keyFindings.push(`Protocol diversification level: ${protocolDiversification.diversificationLevel}`);
    keyFindings.push(`Gas optimization level: ${gasOptimizationAnalysis.optimizationLevel}`);
    keyFindings.push(`Sophistication level: ${protocolSophisticationAnalysis.sophisticationLevel}`);

    // Strength areas
    if (gasOptimizationAnalysis.overallEfficiencyScore >= 70) {
      strengthAreas.push('Excellent gas optimization practices');
    }
    
    if (protocolDiversification.diversificationLevel === 'HIGH' || protocolDiversification.diversificationLevel === 'EXCELLENT') {
      strengthAreas.push('Well-diversified protocol usage');
    }
    
    if (transactionTimingAnalysis.currentTimingEfficiency >= 70) {
      strengthAreas.push('Good transaction timing optimization');
    }
    
    if (protocolSophisticationAnalysis.sophisticationTrend === 'IMPROVING') {
      strengthAreas.push('Continuously improving DeFi sophistication');
    }

    // Improvement areas
    if (gasOptimizationAnalysis.overallEfficiencyScore < 60) {
      improvementAreas.push('Gas optimization can be significantly improved');
    }
    
    if (protocolDiversification.diversificationLevel === 'LOW') {
      improvementAreas.push('Protocol diversification needs attention');
    }
    
    if (transactionTimingAnalysis.congestionAwareness < 50) {
      improvementAreas.push('Network congestion awareness could be better');
    }
    
    if (protocolSophisticationAnalysis.sophisticationTrend === 'DECLINING') {
      improvementAreas.push('DeFi sophistication appears to be declining');
    }

    // Risk factors
    if (protocolDiversification.concentrationRisk === 'HIGH' || protocolDiversification.concentrationRisk === 'CRITICAL') {
      riskFactors.push('High concentration risk due to limited protocol diversification');
    }
    
    const highRiskProtocols = preferredProtocols.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL');
    if (highRiskProtocols.length > 0) {
      riskFactors.push(`Usage of high-risk protocols: ${highRiskProtocols.map(p => p.protocolName).join(', ')}`);
    }
    
    if (gasOptimizationAnalysis.costOptimizationPotential > 30) {
      riskFactors.push('Significant gas cost inefficiencies detected');
    }

    // Opportunities
    if (gasOptimizationAnalysis.estimatedSavings > 0.01) {
      opportunities.push(`Potential gas savings: ${gasOptimizationAnalysis.estimatedSavings.toFixed(4)} ETH`);
    }
    
    if (protocolSophisticationAnalysis.learningProgression.progressionTrend === 'RAPID' || protocolSophisticationAnalysis.learningProgression.progressionTrend === 'STEADY') {
      opportunities.push('Strong learning progression suggests readiness for more advanced protocols');
    }
    
    if (transactionTimingAnalysis.optimalTimingWindows.length > 0) {
      const bestWindow = transactionTimingAnalysis.optimalTimingWindows[0];
      opportunities.push(`Optimal timing window: ${bestWindow.startHour}:00-${bestWindow.endHour}:00 UTC (${bestWindow.potentialSavings.toFixed(1)}% potential savings)`);
    }

    // Behavioral patterns
    if (preferredProtocols.length > 0) {
      const dominantType = protocolDiversification.dominantProtocolType;
      if (dominantType) {
        behavioralPatterns.push(`Strong preference for ${dominantType.toLowerCase()} protocols`);
      }
    }
    
    if (transactionTimingAnalysis.timingConsistency >= 70) {
      behavioralPatterns.push('Highly consistent transaction timing patterns');
    } else if (transactionTimingAnalysis.timingConsistency < 40) {
      behavioralPatterns.push('Irregular transaction timing patterns');
    }
    
    if (gasOptimizationAnalysis.gasPriceConsistency >= 70) {
      behavioralPatterns.push('Consistent gas price optimization approach');
    }

    return {
      keyFindings,
      strengthAreas,
      improvementAreas,
      riskFactors,
      opportunities,
      behavioralPatterns
    };
  }

  /**
   * Generate comprehensive protocol recommendations
   */
  private static generateProtocolRecommendations(
    preferredProtocols: ProtocolPreference[],
    protocolDiversification: ProtocolDiversificationAnalysis,
    gasOptimizationAnalysis: GasOptimizationAnalysis,
    transactionTimingAnalysis: TransactionTimingAnalysis,
    protocolSophisticationAnalysis: ProtocolSophisticationAnalysis
  ): ProtocolRecommendation[] {
    
    const recommendations: ProtocolRecommendation[] = [];

    // Diversification recommendations
    if (protocolDiversification.diversificationLevel === 'LOW') {
      recommendations.push({
        category: 'DIVERSIFICATION',
        priority: 'HIGH',
        title: 'Improve Protocol Diversification',
        description: 'Reduce concentration risk by exploring additional DeFi protocols across different categories.',
        expectedImpact: 'HIGH',
        implementationDifficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        specificActions: [
          'Research and try 2-3 new protocols in different categories',
          'Gradually reduce dependency on dominant protocol',
          'Start with small amounts to test new protocols'
        ],
        successMetrics: [
          'Increase protocol count to at least 5',
          'Reduce dominant protocol usage below 40%',
          'Achieve "MEDIUM" or higher diversification level'
        ]
      });
    }

    // Gas efficiency recommendations
    if (gasOptimizationAnalysis.overallEfficiencyScore < 60) {
      recommendations.push({
        category: 'EFFICIENCY',
        priority: 'HIGH',
        title: 'Optimize Gas Usage',
        description: 'Implement gas optimization strategies to reduce transaction costs significantly.',
        expectedImpact: 'HIGH',
        implementationDifficulty: 'EASY',
        timeframe: 'IMMEDIATE',
        specificActions: [
          'Use gas price tracking tools',
          'Time transactions during low-congestion periods',
          'Consider Layer 2 solutions for frequent transactions',
          'Batch similar operations when possible'
        ],
        successMetrics: [
          `Achieve gas efficiency score above 70`,
          `Reduce average gas price below ${this.GAS_PRICE_THRESHOLDS.GOOD} Gwei`,
          `Save at least ${gasOptimizationAnalysis.costOptimizationPotential.toFixed(1)}% on gas costs`
        ]
      });
    }

    // Sophistication advancement recommendations
    if (protocolSophisticationAnalysis.sophisticationLevel === 'BEGINNER' || protocolSophisticationAnalysis.sophisticationLevel === 'INTERMEDIATE') {
      recommendations.push({
        category: 'SOPHISTICATION',
        priority: 'MEDIUM',
        title: 'Advance DeFi Sophistication',
        description: 'Gradually explore more advanced DeFi protocols and features to improve your sophistication level.',
        expectedImpact: 'MEDIUM',
        implementationDifficulty: 'MEDIUM',
        timeframe: 'MEDIUM_TERM',
        specificActions: [
          'Learn about advanced DeFi concepts',
          'Start with intermediate protocols like Aave or Curve',
          'Practice with small amounts first',
          'Join DeFi communities for learning'
        ],
        successMetrics: [
          `Advance to ${protocolSophisticationAnalysis.sophisticationLevel === 'BEGINNER' ? 'INTERMEDIATE' : 'ADVANCED'} level`,
          'Successfully use at least 2 advanced protocols',
          'Improve overall sophistication score by 20 points'
        ]
      });
    }

    // Risk management recommendations
    if (protocolDiversification.concentrationRisk === 'HIGH' || protocolDiversification.concentrationRisk === 'CRITICAL') {
      recommendations.push({
        category: 'RISK_MANAGEMENT',
        priority: 'HIGH',
        title: 'Reduce Concentration Risk',
        description: 'Your current protocol usage shows high concentration risk. Diversify to reduce potential losses.',
        expectedImpact: 'HIGH',
        implementationDifficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM',
        specificActions: [
          'Gradually reduce exposure to dominant protocol',
          'Spread usage across multiple protocol types',
          'Set maximum allocation limits per protocol',
          'Regular portfolio rebalancing'
        ],
        successMetrics: [
          'Reduce Herfindahl index below 0.4',
          'No single protocol above 40% usage',
          'Achieve "MEDIUM" or lower concentration risk'
        ]
      });
    }

    // Cost optimization recommendations
    if (gasOptimizationAnalysis.costOptimizationPotential > 20) {
      recommendations.push({
        category: 'COST_OPTIMIZATION',
        priority: 'HIGH',
        title: 'Implement Cost Optimization Strategies',
        description: 'Significant cost savings are possible through better gas optimization and timing.',
        expectedImpact: 'HIGH',
        implementationDifficulty: 'EASY',
        timeframe: 'IMMEDIATE',
        specificActions: [
          'Use optimal timing windows for transactions',
          'Monitor gas prices before transacting',
          'Consider alternative protocols with lower fees',
          'Batch transactions when possible'
        ],
        successMetrics: [
          `Save at least ${gasOptimizationAnalysis.costOptimizationPotential.toFixed(1)}% on gas costs`,
          'Improve timing efficiency above 60%',
          'Achieve "GOOD" or better optimization level'
        ]
      });
    }

    // Sort recommendations by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      const aImpact = impactOrder[a.expectedImpact];
      const bImpact = impactOrder[b.expectedImpact];
      
      return bImpact - aImpact;
    });
  }

  /**
   * Calculate data quality metrics
   */
  private static calculateDataQuality(transactionHistory: TransactionData[]): AnalysisDataQuality {
    const now = Date.now() / 1000;
    
    // Calculate completeness (based on required fields)
    let completeTransactions = 0;
    for (const tx of transactionHistory) {
      if (tx.hash && tx.timestamp && tx.value && tx.gasPrice && tx.gasUsed) {
        completeTransactions++;
      }
    }
    const completeness = transactionHistory.length > 0 ? (completeTransactions / transactionHistory.length) * 100 : 0;
    
    // Calculate freshness (based on most recent transaction)
    const mostRecentTx = Math.max(...transactionHistory.map(tx => tx.timestamp));
    const daysSinceLastTx = (now - mostRecentTx) / (24 * 60 * 60);
    const freshness = Math.max(0, 100 - (daysSinceLastTx * 2)); // Decrease by 2% per day
    
    // Calculate consistency (based on data format consistency)
    let consistentTransactions = 0;
    for (const tx of transactionHistory) {
      const hasValidValue = !isNaN(parseFloat(tx.value));
      const hasValidGasPrice = !isNaN(parseFloat(tx.gasPrice));
      const hasValidGasUsed = !isNaN(parseInt(tx.gasUsed));
      
      if (hasValidValue && hasValidGasPrice && hasValidGasUsed) {
        consistentTransactions++;
      }
    }
    const consistency = transactionHistory.length > 0 ? (consistentTransactions / transactionHistory.length) * 100 : 0;
    
    // Calculate reliability (based on sample size and time span)
    const sampleSize = transactionHistory.length;
    const timeSpanDays = transactionHistory.length > 1 ? 
      (Math.max(...transactionHistory.map(tx => tx.timestamp)) - Math.min(...transactionHistory.map(tx => tx.timestamp))) / (24 * 60 * 60) : 0;
    
    let reliability = 0;
    if (sampleSize >= 50 && timeSpanDays >= 30) reliability = 90;
    else if (sampleSize >= 20 && timeSpanDays >= 14) reliability = 70;
    else if (sampleSize >= 10 && timeSpanDays >= 7) reliability = 50;
    else if (sampleSize >= 5) reliability = 30;
    else reliability = 10;
    
    // Calculate protocol coverage (diversity of protocols)
    const uniqueProtocols = new Set(transactionHistory.map(tx => tx.protocolName || 'Unknown')).size;
    const protocolCoverage = Math.min(100, uniqueProtocols * 20); // 20% per unique protocol, max 100%

    return {
      completeness: Math.round(completeness),
      freshness: Math.round(freshness),
      consistency: Math.round(consistency),
      reliability: Math.round(reliability),
      sampleSize,
      timeSpanDays: Math.round(timeSpanDays),
      protocolCoverage: Math.round(protocolCoverage)
    };
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateOverallConfidence(dataQuality: AnalysisDataQuality, transactionCount: number): number {
    const weights = {
      completeness: 0.25,
      freshness: 0.15,
      consistency: 0.20,
      reliability: 0.30,
      protocolCoverage: 0.10
    };

    const confidence = (
      dataQuality.completeness * weights.completeness +
      dataQuality.freshness * weights.freshness +
      dataQuality.consistency * weights.consistency +
      dataQuality.reliability * weights.reliability +
      dataQuality.protocolCoverage * weights.protocolCoverage
    );

    // Apply penalties for insufficient data
    let adjustedConfidence = confidence;
    if (transactionCount < 5) adjustedConfidence *= 0.5;
    else if (transactionCount < 10) adjustedConfidence *= 0.7;
    else if (transactionCount < 20) adjustedConfidence *= 0.85;

    return Math.max(0, Math.min(100, Math.round(adjustedConfidence)));
  }

  /**
   * Create empty analysis for cases with no transaction history
   */
  private static createEmptyAnalysis(): ProtocolPreferenceAnalysis {
    return {
      preferredProtocols: [],
      protocolDiversification: {
        diversificationScore: 0,
        diversificationLevel: 'LOW',
        protocolCount: 0,
        protocolTypeCount: 0,
        concentrationRisk: 'LOW',
        recommendations: ['Start using DeFi protocols to build preference analysis'],
        herfindahlIndex: 0
      },
      gasOptimizationAnalysis: this.createEmptyGasAnalysis(),
      transactionTimingAnalysis: this.createEmptyTimingAnalysis(),
      protocolSophisticationAnalysis: this.createEmptySophisticationAnalysis(),
      insights: {
        keyFindings: ['No transaction history available for analysis'],
        strengthAreas: [],
        improvementAreas: ['Begin using DeFi protocols'],
        riskFactors: [],
        opportunities: ['Explore DeFi ecosystem'],
        behavioralPatterns: []
      },
      recommendations: [{
        category: 'DIVERSIFICATION',
        priority: 'HIGH',
        title: 'Start DeFi Journey',
        description: 'Begin exploring DeFi protocols to establish usage patterns.',
        expectedImpact: 'HIGH',
        implementationDifficulty: 'EASY',
        timeframe: 'IMMEDIATE',
        specificActions: ['Research popular DeFi protocols', 'Start with small amounts', 'Learn about wallet security'],
        successMetrics: ['Complete first DeFi transaction', 'Try at least 2 different protocols']
      }],
      confidence: 0,
      analysisTimestamp: Date.now(),
      dataQuality: {
        completeness: 0,
        freshness: 0,
        consistency: 0,
        reliability: 0,
        sampleSize: 0,
        timeSpanDays: 0,
        protocolCoverage: 0
      }
    };
  }

  /**
   * Create empty gas analysis
   */
  private static createEmptyGasAnalysis(): GasOptimizationAnalysis {
    return {
      overallEfficiencyScore: 0,
      optimizationLevel: 'POOR',
      averageGasPrice: 0,
      gasPriceConsistency: 0,
      gasPriceOptimization: 0,
      averageGasUsed: 0,
      gasUsageEfficiency: 0,
      gasUsageConsistency: 0,
      totalGasCost: 0,
      averageTransactionCost: 0,
      costOptimizationPotential: 0,
      estimatedSavings: 0,
      protocolEfficiencyRankings: [],
      optimizationRecommendations: []
    };
  }

  /**
   * Create empty timing analysis
   */
  private static createEmptyTimingAnalysis(): TransactionTimingAnalysis {
    return {
      optimalTimingWindows: [],
      currentTimingEfficiency: 0,
      timingConsistency: 0,
      gasPriceTimingCorrelation: [],
      preferredHours: [],
      preferredDaysOfWeek: [],
      peakActivityPeriods: [],
      congestionAwareness: 0,
      congestionAvoidance: 0,
      timingRecommendations: []
    };
  }

  /**
   * Create empty sophistication analysis
   */
  private static createEmptySophisticationAnalysis(): ProtocolSophisticationAnalysis {
    return {
      overallSophisticationScore: 0,
      sophisticationLevel: 'BEGINNER',
      sophisticationTrend: 'STABLE',
      protocolComplexityDistribution: {
        [SophisticationLevel.BASIC]: 0,
        [SophisticationLevel.INTERMEDIATE]: 0,
        [SophisticationLevel.ADVANCED]: 0,
        [SophisticationLevel.EXPERT]: 0
      },
      protocolTypeSophistication: [],
      advancedFeaturesUsage: [],
      learningProgression: {
        progressionTrend: 'STAGNANT',
        timeToAdvancement: 365,
        learningVelocity: 0,
        knowledgeGaps: ['No transaction history available'],
        strengths: [],
        nextMilestones: ['Start using DeFi protocols']
      },
      sophisticationRecommendations: []
    };
  }
}

export default ProtocolPreferenceEngine;