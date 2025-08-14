import { UserMetrics, TransactionData } from './blockchainService';
import { TransactionAnalysisEngine, TransactionAnalysis, SeasonalPattern } from './transactionAnalysisEngine';

/**
 * Behavioral Insights Interface
 * Implements comprehensive behavioral pattern recognition as per requirements 3.1, 3.2, 3.3
 */
export interface BehavioralInsights {
  // Activity patterns
  activityPattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE' | 'HYPERACTIVE';
  consistencyScore: number; // 0-100
  
  // Behavioral classification
  userArchetype: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';
  sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  
  // Trends and patterns
  growthTrend: GrowthTrendAnalysis;
  seasonalPatterns: SeasonalPattern[];
  
  // Enhanced consistency analysis
  consistencyAnalysis: ConsistencyAnalysis;
  
  // Enhanced diversification analysis
  diversificationAnalysis: DiversificationAnalysis;
  
  // Preferences and habits
  preferredProtocols: ProtocolPreference[];
  transactionTiming: TimingAnalysis;
  gasOptimization: GasEfficiencyAnalysis;
  
  // Diversification
  diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  concentrationAreas: ConcentrationAnalysis[];
  
  // Confidence and metadata
  confidence: number; // 0-100
  analysisTimestamp: number;
  dataQuality: DataQualityMetrics;
}

export interface ProtocolPreference {
  protocolName: string;
  usageFrequency: number; // 0-100
  volumePercentage: number; // 0-100
  sophisticationScore: number; // 0-100
  preferenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'DOMINANT';
  lastUsed: number; // timestamp
}

export interface TimingAnalysis {
  preferredHours: number[]; // Hours of day (0-23)
  preferredDays: number[]; // Days of week (0-6, 0=Sunday)
  consistencyScore: number; // 0-100
  timezonePattern: 'CONSISTENT' | 'VARIABLE' | 'UNKNOWN';
  peakActivityPeriods: ActivityPeriod[];
}

export interface ActivityPeriod {
  startHour: number;
  endHour: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
  transactionCount: number;
  averageVolume: number;
}

export interface GasEfficiencyAnalysis {
  overallEfficiencyScore: number; // 0-100
  optimizationLevel: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  averageGasPrice: number;
  gasPriceConsistency: number; // 0-100
  timingOptimization: number; // 0-100
  improvementPotential: number; // 0-100
  recommendations: string[];
}

export interface ConcentrationAnalysis {
  area: 'PROTOCOL' | 'TRANSACTION_TYPE' | 'TIME_PERIOD' | 'VALUE_RANGE';
  concentrationLevel: number; // 0-100
  dominantCategory: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendations: string[];
}

export interface DataQualityMetrics {
  completeness: number; // 0-100
  freshness: number; // 0-100
  consistency: number; // 0-100
  reliability: number; // 0-100
  sampleSize: number;
  timeSpanDays: number;
}

export interface GrowthTrendAnalysis {
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  confidence: number; // 0-100
  evidence: string[];
  trendStrength: number; // 0-1, strength of the trend
  periodAnalysis: PeriodMetrics[];
  keyMetrics: {
    activityTrend: number; // Linear regression slope
    volumeTrend: number;
    efficiencyTrend: number;
    diversificationTrend: number;
  };
  recommendations: string[];
}

export interface PeriodMetrics {
  periodIndex: number;
  startTimestamp: number;
  endTimestamp: number;
  transactionCount: number;
  totalVolume: number;
  avgGasEfficiency: number;
  protocolDiversity: number;
  avgTransactionValue: number;
  stakingActivity: number; // Ratio of staking transactions
  defiActivity: number; // Ratio of DeFi transactions
}

export interface ConsistencyAnalysis {
  overallScore: number; // 0-100
  components: {
    timingConsistency: number; // 0-100
    volumeConsistency: number; // 0-100
    frequencyConsistency: number; // 0-100
    behavioralConsistency: number; // 0-100
  };
  stabilityIndicators: {
    activityStability: 'HIGH' | 'MEDIUM' | 'LOW';
    patternReliability: 'HIGH' | 'MEDIUM' | 'LOW';
    behavioralPredictability: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  evidence: string[];
  recommendations: string[];
}

export interface DiversificationAnalysis {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0-100
  concentrationAreas: ConcentrationAnalysis[];
  diversificationMetrics: {
    protocolDiversification: number; // 0-100
    transactionTypeDiversification: number; // 0-100
    temporalDiversification: number; // 0-100
    valueDiversification: number; // 0-100
  };
  riskAssessment: {
    concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    diversificationBenefit: number; // 0-100
  };
  recommendations: string[];
}

export interface ActivityPatternAnalysis {
  pattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE' | 'HYPERACTIVE';
  confidence: number; // 0-100
  evidence: string[];
  metrics: {
    averageTransactionsPerDay: number;
    averageTransactionsPerWeek: number;
    averageTransactionsPerMonth: number;
    longestInactivityPeriod: number; // days
    mostActiveDay: string;
    activityVariability: number; // coefficient of variation
  };
}

export interface ArchetypeAnalysis {
  archetype: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';
  confidence: number; // 0-100
  characteristics: string[];
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  investmentStyle: 'PASSIVE' | 'ACTIVE' | 'TACTICAL' | 'SPECULATIVE';
  evidenceFactors: {
    volumePatterns: number; // 0-100
    frequencyPatterns: number; // 0-100
    protocolChoices: number; // 0-100
    riskBehavior: number; // 0-100
    timingBehavior: number; // 0-100
  };
}

export interface SophisticationAnalysis {
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  score: number; // 0-100
  confidence: number; // 0-100
  indicators: {
    protocolComplexity: number; // 0-100
    transactionComplexity: number; // 0-100
    gasOptimization: number; // 0-100
    diversificationLevel: number; // 0-100
    riskManagement: number; // 0-100
  };
  skillAreas: {
    defiUsage: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    stakingKnowledge: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    gasOptimization: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    riskManagement: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  };
}

/**
 * Behavioral Pattern Recognition Engine
 * Implements sophisticated behavioral analysis and pattern recognition
 */
export class BehavioralPatternEngine {
  
  // Activity pattern thresholds
  private static readonly ACTIVITY_THRESHOLDS = {
    HYPERACTIVE: {
      TRANSACTIONS_PER_DAY: 5,
      TRANSACTIONS_PER_WEEK: 25
    },
    REGULAR: {
      MIN_TRANSACTIONS_PER_WEEK: 1,
      MAX_INACTIVITY_DAYS: 14,
      CONSISTENCY_THRESHOLD: 60
    },
    SPORADIC: {
      MAX_TRANSACTIONS_PER_WEEK: 3,
      MIN_CONSISTENCY: 30
    },
    INACTIVE: {
      MAX_TRANSACTIONS_PER_MONTH: 2,
      MIN_INACTIVITY_DAYS: 30
    }
  };

  // Protocol sophistication mapping
  private static readonly PROTOCOL_SOPHISTICATION = {
    // Basic protocols
    'ethereum': { complexity: 20, category: 'BASIC' },
    'simple_transfer': { complexity: 10, category: 'BASIC' },
    
    // Intermediate protocols
    'uniswap': { complexity: 50, category: 'INTERMEDIATE' },
    'sushiswap': { complexity: 50, category: 'INTERMEDIATE' },
    'lido': { complexity: 45, category: 'INTERMEDIATE' },
    'pancakeswap': { complexity: 45, category: 'INTERMEDIATE' },
    
    // Advanced protocols
    'aave': { complexity: 75, category: 'ADVANCED' },
    'compound': { complexity: 75, category: 'ADVANCED' },
    'curve': { complexity: 80, category: 'ADVANCED' },
    '1inch': { complexity: 70, category: 'ADVANCED' },
    'balancer': { complexity: 75, category: 'ADVANCED' },
    
    // Expert protocols
    'maker': { complexity: 90, category: 'EXPERT' },
    'yearn': { complexity: 95, category: 'EXPERT' },
    'synthetix': { complexity: 85, category: 'EXPERT' },
    'convex': { complexity: 90, category: 'EXPERT' }
  };

  /**
   * Perform comprehensive behavioral analysis
   * Requirement 3.1: Classify activity patterns and measure consistency
   */
  public static async analyzeBehavioralPatterns(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<BehavioralInsights> {
    
    // Analyze activity patterns
    const activityAnalysis = this.analyzeActivityPattern(metrics, transactionHistory);
    
    // Analyze user archetype
    const archetypeAnalysis = this.analyzeUserArchetype(metrics, transactionHistory);
    
    // Analyze sophistication level
    const sophisticationAnalysis = this.analyzeSophisticationLevel(metrics, transactionHistory);
    
    // Analyze growth trends
    const growthTrend = this.analyzeGrowthTrend(metrics, transactionHistory);
    
    // Analyze seasonal patterns
    const seasonalPatterns = this.analyzeSeasonalPatterns(transactionHistory);
    
    // Analyze protocol preferences
    const protocolPreferences = this.analyzeProtocolPreferences(metrics, transactionHistory);
    
    // Analyze transaction timing
    const timingAnalysis = this.analyzeTransactionTiming(transactionHistory);
    
    // Analyze gas efficiency
    const gasAnalysis = this.analyzeGasEfficiency(transactionHistory);
    
    // Analyze diversification
    const diversificationAnalysis = this.analyzeDiversification(metrics, transactionHistory);
    
    // Calculate data quality metrics
    const dataQuality = this.calculateDataQuality(metrics, transactionHistory);
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence([
      activityAnalysis.confidence,
      archetypeAnalysis.confidence,
      sophisticationAnalysis.confidence,
      dataQuality.reliability
    ]);

    // Enhanced consistency analysis
    const consistencyAnalysis = this.analyzeConsistency(metrics, transactionHistory);
    
    // Enhanced diversification analysis
    const enhancedDiversificationAnalysis = this.analyzeDiversificationDetailed(metrics, transactionHistory);

    return {
      activityPattern: activityAnalysis.pattern,
      consistencyScore: consistencyAnalysis.overallScore,
      
      userArchetype: archetypeAnalysis.archetype,
      sophisticationLevel: sophisticationAnalysis.level,
      
      growthTrend,
      seasonalPatterns,
      
      // Enhanced analysis results
      consistencyAnalysis,
      diversificationAnalysis: enhancedDiversificationAnalysis,
      
      preferredProtocols: protocolPreferences,
      transactionTiming: timingAnalysis,
      gasOptimization: gasAnalysis,
      
      diversificationLevel: enhancedDiversificationAnalysis.level,
      concentrationAreas: enhancedDiversificationAnalysis.concentrationAreas,
      
      confidence,
      analysisTimestamp: Date.now(),
      dataQuality
    };
  }

  /**
   * Analyze activity patterns - Requirement 3.1
   * Classify as regular, sporadic, inactive, or hyperactive
   */
  private static analyzeActivityPattern(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ActivityPatternAnalysis {
    
    const accountAgeDays = metrics.accountAge;
    const totalTransactions = metrics.totalTransactions;
    
    // Calculate activity metrics
    const transactionsPerDay = accountAgeDays > 0 ? totalTransactions / accountAgeDays : 0;
    const transactionsPerWeek = transactionsPerDay * 7;
    const transactionsPerMonth = transactionsPerDay * 30;
    
    // Calculate activity variability if we have transaction history
    let activityVariability = 0;
    let longestInactivityPeriod = 0;
    let mostActiveDay = 'Unknown';
    
    if (transactionHistory && transactionHistory.length > 1) {
      const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate daily activity distribution
      const dailyActivity = new Map<string, number>();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (const tx of sortedTxs) {
        const date = new Date(tx.timestamp * 1000);
        const dayKey = date.toDateString();
        const dayName = dayNames[date.getDay()];
        
        dailyActivity.set(dayKey, (dailyActivity.get(dayKey) || 0) + 1);
      }
      
      // Calculate variability (coefficient of variation)
      const dailyCounts = Array.from(dailyActivity.values());
      if (dailyCounts.length > 1) {
        const mean = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
        const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / dailyCounts.length;
        const stdDev = Math.sqrt(variance);
        activityVariability = mean > 0 ? stdDev / mean : 0;
      }
      
      // Find longest inactivity period
      const intervals = [];
      for (let i = 1; i < sortedTxs.length; i++) {
        intervals.push(sortedTxs[i].timestamp - sortedTxs[i-1].timestamp);
      }
      longestInactivityPeriod = intervals.length > 0 
        ? Math.max(...intervals) / (24 * 60 * 60) // Convert to days
        : 0;
      
      // Find most active day of week
      const weekdayActivity = new Array(7).fill(0);
      for (const tx of sortedTxs) {
        const dayOfWeek = new Date(tx.timestamp * 1000).getDay();
        weekdayActivity[dayOfWeek]++;
      }
      const maxActivityDay = weekdayActivity.indexOf(Math.max(...weekdayActivity));
      mostActiveDay = dayNames[maxActivityDay];
    }
    
    // Determine activity pattern
    let pattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE' | 'HYPERACTIVE';
    let confidence = 70; // Base confidence
    const evidence: string[] = [];
    
    // Check for hyperactive pattern
    if (transactionsPerDay >= this.ACTIVITY_THRESHOLDS.HYPERACTIVE.TRANSACTIONS_PER_DAY ||
        transactionsPerWeek >= this.ACTIVITY_THRESHOLDS.HYPERACTIVE.TRANSACTIONS_PER_WEEK) {
      pattern = 'HYPERACTIVE';
      evidence.push(`High transaction frequency: ${transactionsPerDay.toFixed(2)} transactions per day`);
      confidence = 85;
    }
    // Check for inactive pattern
    else if (transactionsPerMonth <= this.ACTIVITY_THRESHOLDS.INACTIVE.MAX_TRANSACTIONS_PER_MONTH ||
             longestInactivityPeriod >= this.ACTIVITY_THRESHOLDS.INACTIVE.MIN_INACTIVITY_DAYS) {
      pattern = 'INACTIVE';
      evidence.push(`Low activity: ${transactionsPerMonth.toFixed(2)} transactions per month`);
      if (longestInactivityPeriod > 0) {
        evidence.push(`Longest inactivity period: ${longestInactivityPeriod.toFixed(0)} days`);
      }
      confidence = 80;
    }
    // Check for regular pattern
    else if (transactionsPerWeek >= this.ACTIVITY_THRESHOLDS.REGULAR.MIN_TRANSACTIONS_PER_WEEK &&
             longestInactivityPeriod <= this.ACTIVITY_THRESHOLDS.REGULAR.MAX_INACTIVITY_DAYS &&
             activityVariability <= 1.0) {
      pattern = 'REGULAR';
      evidence.push(`Consistent activity: ${transactionsPerWeek.toFixed(2)} transactions per week`);
      evidence.push(`Low variability in transaction timing`);
      confidence = 75;
    }
    // Default to sporadic
    else {
      pattern = 'SPORADIC';
      evidence.push(`Irregular activity pattern: ${transactionsPerWeek.toFixed(2)} transactions per week`);
      if (activityVariability > 1.0) {
        evidence.push(`High variability in transaction timing`);
      }
      confidence = 65;
    }
    
    // Adjust confidence based on data quality
    if (accountAgeDays < 30) {
      confidence -= 20;
      evidence.push('Limited data due to new account');
    }
    if (totalTransactions < 10) {
      confidence -= 15;
      evidence.push('Limited transaction history');
    }

    return {
      pattern,
      confidence: Math.max(0, Math.min(100, confidence)),
      evidence,
      metrics: {
        averageTransactionsPerDay: transactionsPerDay,
        averageTransactionsPerWeek: transactionsPerWeek,
        averageTransactionsPerMonth: transactionsPerMonth,
        longestInactivityPeriod,
        mostActiveDay,
        activityVariability
      }
    };
  } 
 /**
   * Analyze user archetype - Requirement 3.2
   * Identify as conservative, moderate, aggressive, or speculative
   */
  private static analyzeUserArchetype(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ArchetypeAnalysis {
    
    let volumeScore = 0;
    let frequencyScore = 0;
    let protocolScore = 0;
    let riskScore = 0;
    let timingScore = 0;
    
    const totalVolume = parseFloat(metrics.totalVolume);
    const stakingBalance = parseFloat(metrics.stakingBalance);
    const stakingRatio = totalVolume > 0 ? stakingBalance / totalVolume : 0;
    
    // Analyze volume patterns (conservative = lower volumes, speculative = higher volumes)
    const avgTransactionValue = metrics.totalTransactions > 0 ? totalVolume / metrics.totalTransactions : 0;
    
    if (avgTransactionValue < 0.1) {
      volumeScore = 20; // Conservative - small transactions
    } else if (avgTransactionValue < 1) {
      volumeScore = 40; // Moderate - medium transactions
    } else if (avgTransactionValue < 10) {
      volumeScore = 70; // Aggressive - large transactions
    } else {
      volumeScore = 90; // Speculative - very large transactions
    }
    
    // Analyze frequency patterns
    const transactionsPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    
    if (transactionsPerMonth < 2) {
      frequencyScore = 20; // Conservative - infrequent trading
    } else if (transactionsPerMonth < 10) {
      frequencyScore = 40; // Moderate - regular activity
    } else if (transactionsPerMonth < 30) {
      frequencyScore = 70; // Aggressive - frequent trading
    } else {
      frequencyScore = 90; // Speculative - very frequent trading
    }
    
    // Analyze protocol choices
    const defiProtocolCount = metrics.defiProtocolsUsed.length;
    const hasStaking = stakingBalance > 0;
    
    if (defiProtocolCount === 0 && !hasStaking) {
      protocolScore = 10; // Conservative - no DeFi/staking
    } else if (defiProtocolCount <= 2 && hasStaking) {
      protocolScore = 30; // Conservative - limited DeFi, prefers staking
    } else if (defiProtocolCount <= 5) {
      protocolScore = 50; // Moderate - some DeFi diversification
    } else if (defiProtocolCount <= 10) {
      protocolScore = 75; // Aggressive - high DeFi usage
    } else {
      protocolScore = 95; // Speculative - extensive DeFi exploration
    }
    
    // Analyze risk behavior
    if (stakingRatio > 0.7) {
      riskScore = 20; // Conservative - high staking ratio
    } else if (stakingRatio > 0.3) {
      riskScore = 40; // Moderate - balanced staking
    } else if (stakingRatio > 0.1) {
      riskScore = 60; // Aggressive - low staking, more liquid
    } else {
      riskScore = 80; // Speculative - minimal staking, maximum liquidity
    }
    
    // Analyze timing behavior (if transaction history available)
    if (transactionHistory && transactionHistory.length > 5) {
      const temporalAnalysis = TransactionAnalysisEngine.analyzeTemporalPatterns(transactionHistory);
      
      if (temporalAnalysis.consistencyScore > 70) {
        timingScore = 30; // Conservative - consistent timing
      } else if (temporalAnalysis.consistencyScore > 40) {
        timingScore = 50; // Moderate - somewhat consistent
      } else if (temporalAnalysis.patternType === 'BURST') {
        timingScore = 90; // Speculative - burst patterns
      } else {
        timingScore = 70; // Aggressive - irregular but not burst
      }
    } else {
      timingScore = 50; // Default moderate score for insufficient data
    }
    
    // Calculate weighted archetype score
    const archetypeScore = (
      volumeScore * 0.25 +
      frequencyScore * 0.25 +
      protocolScore * 0.20 +
      riskScore * 0.20 +
      timingScore * 0.10
    );
    
    // Determine archetype
    let archetype: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';
    let riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    let investmentStyle: 'PASSIVE' | 'ACTIVE' | 'TACTICAL' | 'SPECULATIVE';
    const characteristics: string[] = [];
    
    if (archetypeScore <= 30) {
      archetype = 'CONSERVATIVE';
      riskTolerance = 'LOW';
      investmentStyle = 'PASSIVE';
      characteristics.push('Prefers stable, low-risk investments');
      characteristics.push('Favors staking over active trading');
      characteristics.push('Makes infrequent, well-considered transactions');
      characteristics.push('Avoids complex DeFi protocols');
    } else if (archetypeScore <= 55) {
      archetype = 'MODERATE';
      riskTolerance = 'MEDIUM';
      investmentStyle = 'ACTIVE';
      characteristics.push('Balances risk and stability');
      characteristics.push('Uses some DeFi protocols selectively');
      characteristics.push('Maintains regular but measured activity');
      characteristics.push('Combines staking with active management');
    } else if (archetypeScore <= 80) {
      archetype = 'AGGRESSIVE';
      riskTolerance = 'HIGH';
      investmentStyle = 'TACTICAL';
      characteristics.push('Actively seeks higher returns');
      characteristics.push('Comfortable with DeFi complexity');
      characteristics.push('Makes frequent strategic moves');
      characteristics.push('Willing to take calculated risks');
    } else {
      archetype = 'SPECULATIVE';
      riskTolerance = 'VERY_HIGH';
      investmentStyle = 'SPECULATIVE';
      characteristics.push('Pursues high-risk, high-reward opportunities');
      characteristics.push('Extensively uses complex DeFi protocols');
      characteristics.push('Makes very frequent transactions');
      characteristics.push('Comfortable with extreme volatility');
    }
    
    // Calculate confidence based on data quality
    let confidence = 70;
    if (metrics.accountAge < 30) confidence -= 15;
    if (metrics.totalTransactions < 20) confidence -= 10;
    if (!transactionHistory || transactionHistory.length < 10) confidence -= 10;
    
    return {
      archetype,
      confidence: Math.max(0, Math.min(100, confidence)),
      characteristics,
      riskTolerance,
      investmentStyle,
      evidenceFactors: {
        volumePatterns: volumeScore,
        frequencyPatterns: frequencyScore,
        protocolChoices: protocolScore,
        riskBehavior: riskScore,
        timingBehavior: timingScore
      }
    };
  }

  /**
   * Analyze sophistication level - Requirement 3.3
   * Assess based on DeFi protocol usage complexity
   */
  private static analyzeSophisticationLevel(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): SophisticationAnalysis {
    
    let protocolComplexityScore = 0;
    let transactionComplexityScore = 0;
    let gasOptimizationScore = 0;
    let diversificationScore = 0;
    let riskManagementScore = 0;
    
    // Analyze protocol complexity
    const protocolComplexities: number[] = [];
    for (const protocol of metrics.defiProtocolsUsed) {
      const protocolKey = protocol.toLowerCase();
      let maxComplexity = 0;
      
      // Find matching protocol or partial match
      for (const [key, config] of Object.entries(this.PROTOCOL_SOPHISTICATION)) {
        if (protocolKey.includes(key) || key.includes(protocolKey)) {
          maxComplexity = Math.max(maxComplexity, config.complexity);
        }
      }
      
      if (maxComplexity === 0) {
        // Unknown protocol - assign moderate complexity
        maxComplexity = 40;
      }
      
      protocolComplexities.push(maxComplexity);
    }
    
    if (protocolComplexities.length > 0) {
      // Use weighted average (higher complexity protocols get more weight)
      const totalWeight = protocolComplexities.reduce((sum, complexity) => sum + complexity, 0);
      const weightedSum = protocolComplexities.reduce((sum, complexity) => sum + (complexity * complexity), 0);
      protocolComplexityScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    // Analyze transaction complexity
    if (transactionHistory && transactionHistory.length > 0) {
      const complexTransactions = transactionHistory.filter(tx => {
        const gasUsed = parseInt(tx.gasUsed);
        return gasUsed > 100000 || tx.isDeFi || tx.isStaking;
      });
      
      const complexityRatio = complexTransactions.length / transactionHistory.length;
      transactionComplexityScore = complexityRatio * 100;
      
      // Analyze gas usage patterns
      const gasUsages = transactionHistory.map(tx => parseInt(tx.gasUsed));
      const avgGasUsage = gasUsages.reduce((sum, gas) => sum + gas, 0) / gasUsages.length;
      
      if (avgGasUsage > 300000) {
        transactionComplexityScore = Math.min(100, transactionComplexityScore + 20);
      } else if (avgGasUsage > 150000) {
        transactionComplexityScore = Math.min(100, transactionComplexityScore + 10);
      }
    }
    
    // Analyze gas optimization
    if (transactionHistory && transactionHistory.length > 0) {
      const efficiencyMetrics = TransactionAnalysisEngine.generateEfficiencyRecommendations(transactionHistory);
      gasOptimizationScore = efficiencyMetrics.gasEfficiencyScore;
    }
    
    // Analyze diversification
    const protocolCount = metrics.defiProtocolsUsed.length;
    if (protocolCount === 0) {
      diversificationScore = 0;
    } else if (protocolCount <= 2) {
      diversificationScore = 30;
    } else if (protocolCount <= 5) {
      diversificationScore = 60;
    } else if (protocolCount <= 10) {
      diversificationScore = 85;
    } else {
      diversificationScore = 100;
    }
    
    // Analyze risk management (based on staking ratio and protocol diversity)
    const totalVolume = parseFloat(metrics.totalVolume);
    const stakingBalance = parseFloat(metrics.stakingBalance);
    const stakingRatio = totalVolume > 0 ? stakingBalance / totalVolume : 0;
    
    // Balanced staking ratio indicates good risk management
    if (stakingRatio >= 0.2 && stakingRatio <= 0.6) {
      riskManagementScore = 80;
    } else if (stakingRatio >= 0.1 && stakingRatio <= 0.8) {
      riskManagementScore = 60;
    } else {
      riskManagementScore = 30;
    }
    
    // Bonus for protocol diversification in risk management
    if (protocolCount >= 3) {
      riskManagementScore = Math.min(100, riskManagementScore + 20);
    }
    
    // Calculate overall sophistication score
    const overallScore = (
      protocolComplexityScore * 0.30 +
      transactionComplexityScore * 0.25 +
      gasOptimizationScore * 0.20 +
      diversificationScore * 0.15 +
      riskManagementScore * 0.10
    );
    
    // Determine sophistication level
    let level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    
    if (overallScore >= 80) {
      level = 'EXPERT';
    } else if (overallScore >= 60) {
      level = 'ADVANCED';
    } else if (overallScore >= 35) {
      level = 'INTERMEDIATE';
    } else {
      level = 'BEGINNER';
    }
    
    // Determine skill areas
    const skillAreas = {
      defiUsage: this.determineSkillLevel(protocolComplexityScore),
      stakingKnowledge: stakingBalance > 0 ? 'INTERMEDIATE' : 'NONE' as 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
      gasOptimization: this.determineSkillLevel(gasOptimizationScore),
      riskManagement: this.determineSkillLevel(riskManagementScore)
    };
    
    // Calculate confidence
    let confidence = 75;
    if (metrics.totalTransactions < 10) confidence -= 20;
    if (metrics.defiProtocolsUsed.length === 0) confidence -= 15;
    if (!transactionHistory || transactionHistory.length < 5) confidence -= 10;
    
    return {
      level,
      score: Math.round(overallScore),
      confidence: Math.max(0, Math.min(100, confidence)),
      indicators: {
        protocolComplexity: Math.round(protocolComplexityScore),
        transactionComplexity: Math.round(transactionComplexityScore),
        gasOptimization: Math.round(gasOptimizationScore),
        diversificationLevel: Math.round(diversificationScore),
        riskManagement: Math.round(riskManagementScore)
      },
      skillAreas
    };
  }

  /**
   * Determine skill level from score
   */
  private static determineSkillLevel(score: number): 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    if (score >= 80) return 'EXPERT';
    if (score >= 60) return 'ADVANCED';
    if (score >= 35) return 'INTERMEDIATE';
    if (score >= 15) return 'BASIC';
    return 'NONE';
  }

  /**
   * Enhanced growth trend analysis with supporting evidence - Requirement 3.3
   * Identify as improving, stable, or declining with detailed evidence
   */
  private static analyzeGrowthTrend(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): GrowthTrendAnalysis {
    
    if (!transactionHistory || transactionHistory.length < 6) {
      // Insufficient data - use account age and transaction count as proxy
      const transactionsPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
      
      const trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 
        transactionsPerMonth > 10 ? 'IMPROVING' : 
        transactionsPerMonth > 2 ? 'STABLE' : 'DECLINING';
      
      return {
        trend,
        confidence: 40, // Low confidence due to insufficient data
        evidence: [`Limited data: ${transactionsPerMonth.toFixed(1)} transactions per month`],
        trendStrength: Math.abs(transactionsPerMonth - 5) / 10, // Normalized strength
        periodAnalysis: [],
        keyMetrics: {
          activityTrend: trend === 'IMPROVING' ? 0.2 : trend === 'DECLINING' ? -0.2 : 0,
          volumeTrend: 0,
          efficiencyTrend: 0,
          diversificationTrend: 0
        },
        recommendations: trend === 'DECLINING' ? 
          ['Increase transaction frequency to improve credit profile'] : 
          ['Continue current activity level']
      };
    }
    
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    const totalPeriod = sortedTxs[sortedTxs.length - 1].timestamp - sortedTxs[0].timestamp;
    
    // Split into periods for trend analysis (minimum 3 periods, maximum 8)
    const periodCount = Math.min(8, Math.max(3, Math.floor(sortedTxs.length / 5)));
    const periodLength = totalPeriod / periodCount;
    
    const periodMetrics: PeriodMetrics[] = [];
    
    for (let i = 0; i < periodCount; i++) {
      const periodStart = sortedTxs[0].timestamp + (i * periodLength);
      const periodEnd = periodStart + periodLength;
      
      const periodTxs = sortedTxs.filter(tx => 
        tx.timestamp >= periodStart && tx.timestamp < periodEnd
      );
      
      if (periodTxs.length === 0) {
        // Add empty period to maintain timeline
        periodMetrics.push({
          periodIndex: i,
          startTimestamp: periodStart,
          endTimestamp: periodEnd,
          transactionCount: 0,
          totalVolume: 0,
          avgGasEfficiency: 0,
          protocolDiversity: 0,
          avgTransactionValue: 0,
          stakingActivity: 0,
          defiActivity: 0
        });
        continue;
      }
      
      const transactionCount = periodTxs.length;
      const totalVolume = periodTxs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
      const avgTransactionValue = totalVolume / transactionCount;
      
      // Calculate average gas efficiency for period
      const gasEfficiencies = periodTxs.map(tx => {
        const analysis = TransactionAnalysisEngine.analyzeTransaction(tx, sortedTxs);
        return analysis.gasEfficiencyScore;
      });
      const avgGasEfficiency = gasEfficiencies.reduce((sum, eff) => sum + eff, 0) / gasEfficiencies.length;
      
      // Calculate protocol diversity for period
      const uniqueProtocols = new Set(periodTxs.map(tx => tx.protocolName).filter(Boolean));
      const protocolDiversity = uniqueProtocols.size;
      
      // Calculate activity type ratios
      const stakingTxs = periodTxs.filter(tx => tx.isStaking).length;
      const defiTxs = periodTxs.filter(tx => tx.isDeFi).length;
      const stakingActivity = stakingTxs / transactionCount;
      const defiActivity = defiTxs / transactionCount;
      
      periodMetrics.push({
        periodIndex: i,
        startTimestamp: periodStart,
        endTimestamp: periodEnd,
        transactionCount,
        totalVolume,
        avgGasEfficiency,
        protocolDiversity,
        avgTransactionValue,
        stakingActivity,
        defiActivity
      });
    }
    
    if (periodMetrics.length < 3) {
      return {
        trend: 'STABLE',
        confidence: 30,
        evidence: ['Insufficient periods for reliable trend analysis'],
        trendStrength: 0,
        periodAnalysis: periodMetrics,
        keyMetrics: {
          activityTrend: 0,
          volumeTrend: 0,
          efficiencyTrend: 0,
          diversificationTrend: 0
        },
        recommendations: ['Maintain consistent activity to establish trend patterns']
      };
    }
    
    // Calculate trends for each metric using linear regression
    const trends = {
      transactionCount: this.calculateTrend(periodMetrics.map(p => p.transactionCount)),
      totalVolume: this.calculateTrend(periodMetrics.map(p => p.totalVolume)),
      avgGasEfficiency: this.calculateTrend(periodMetrics.map(p => p.avgGasEfficiency)),
      protocolDiversity: this.calculateTrend(periodMetrics.map(p => p.protocolDiversity)),
      avgTransactionValue: this.calculateTrend(periodMetrics.map(p => p.avgTransactionValue)),
      stakingActivity: this.calculateTrend(periodMetrics.map(p => p.stakingActivity)),
      defiActivity: this.calculateTrend(periodMetrics.map(p => p.defiActivity))
    };
    
    // Weighted trend score with enhanced weighting
    const trendScore = (
      trends.transactionCount * 0.25 +
      trends.totalVolume * 0.20 +
      trends.avgGasEfficiency * 0.20 +
      trends.protocolDiversity * 0.15 +
      trends.avgTransactionValue * 0.10 +
      trends.stakingActivity * 0.05 +
      trends.defiActivity * 0.05
    );
    
    // Determine trend with more nuanced thresholds
    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    let trendStrength = Math.abs(trendScore);
    
    if (trendScore > 0.05) {
      trend = 'IMPROVING';
    } else if (trendScore < -0.05) {
      trend = 'DECLINING';
    } else {
      trend = 'STABLE';
    }
    
    // Generate evidence based on trend components
    const evidence: string[] = [];
    
    if (trends.transactionCount > 0.1) {
      evidence.push(`Transaction frequency increasing by ${(trends.transactionCount * 100).toFixed(1)}% per period`);
    } else if (trends.transactionCount < -0.1) {
      evidence.push(`Transaction frequency decreasing by ${(Math.abs(trends.transactionCount) * 100).toFixed(1)}% per period`);
    }
    
    if (trends.totalVolume > 0.1) {
      evidence.push(`Transaction volume trending upward`);
    } else if (trends.totalVolume < -0.1) {
      evidence.push(`Transaction volume trending downward`);
    }
    
    if (trends.avgGasEfficiency > 0.05) {
      evidence.push(`Gas efficiency improving over time`);
    } else if (trends.avgGasEfficiency < -0.05) {
      evidence.push(`Gas efficiency declining over time`);
    }
    
    if (trends.protocolDiversity > 0.05) {
      evidence.push(`Increasing diversification across DeFi protocols`);
    } else if (trends.protocolDiversity < -0.05) {
      evidence.push(`Decreasing protocol diversification`);
    }
    
    if (trends.defiActivity > 0.05) {
      evidence.push(`Growing DeFi engagement`);
    } else if (trends.defiActivity < -0.05) {
      evidence.push(`Declining DeFi activity`);
    }
    
    if (evidence.length === 0) {
      evidence.push('Activity patterns remain consistent over time');
    }
    
    // Calculate confidence based on data quality and trend consistency
    let confidence = 70;
    
    // Adjust confidence based on data quality
    if (periodMetrics.length >= 6) confidence += 10;
    if (sortedTxs.length >= 50) confidence += 10;
    if (totalPeriod > 86400 * 90) confidence += 10; // More than 90 days
    
    // Adjust confidence based on trend strength
    confidence += Math.min(10, trendStrength * 20);
    
    // Reduce confidence for inconsistent trends
    const trendConsistency = this.calculateTrendConsistency(periodMetrics);
    confidence = Math.round(confidence * trendConsistency);
    
    // Generate recommendations based on trend
    const recommendations: string[] = [];
    
    if (trend === 'DECLINING') {
      if (trends.transactionCount < -0.1) {
        recommendations.push('Increase transaction frequency to maintain active profile');
      }
      if (trends.avgGasEfficiency < -0.05) {
        recommendations.push('Focus on gas optimization to improve efficiency scores');
      }
      if (trends.protocolDiversity < -0.05) {
        recommendations.push('Explore additional DeFi protocols to increase diversification');
      }
    } else if (trend === 'IMPROVING') {
      recommendations.push('Continue current positive trends to maximize score improvement');
      if (trends.protocolDiversity > 0.05) {
        recommendations.push('Maintain protocol diversification strategy');
      }
    } else {
      recommendations.push('Consider increasing activity levels to establish positive growth trends');
    }
    
    return {
      trend,
      confidence: Math.max(0, Math.min(100, confidence)),
      evidence,
      trendStrength,
      periodAnalysis: periodMetrics,
      keyMetrics: {
        activityTrend: trends.transactionCount,
        volumeTrend: trends.totalVolume,
        efficiencyTrend: trends.avgGasEfficiency,
        diversificationTrend: trends.protocolDiversity
      },
      recommendations
    };
  }

  /**
   * Calculate trend using linear regression slope
   */
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + (val * index), 0);
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
    
    const denominator = (n * xSquaredSum) - (xSum * xSum);
    if (denominator === 0) return 0;
    
    const slope = ((n * xySum) - (xSum * ySum)) / denominator;
    
    // Normalize slope by average value to get relative trend
    const avgValue = ySum / n;
    return avgValue !== 0 ? slope / avgValue : slope;
  }

  /**
   * Calculate trend consistency across periods
   */
  private static calculateTrendConsistency(periodMetrics: PeriodMetrics[]): number {
    if (periodMetrics.length < 3) return 0.5;
    
    const activityValues = periodMetrics.map(p => p.transactionCount);
    const volumeValues = periodMetrics.map(p => p.totalVolume);
    
    // Calculate coefficient of variation for consistency
    const activityCV = this.calculateCoefficientOfVariation(activityValues);
    const volumeCV = this.calculateCoefficientOfVariation(volumeValues);
    
    // Lower CV indicates higher consistency
    const avgCV = (activityCV + volumeCV) / 2;
    return Math.max(0.3, Math.min(1.0, 1 - (avgCV / 2)));
  }

  /**
   * Calculate coefficient of variation
   */
  private static calculateCoefficientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    if (mean === 0) return 0;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }

  /**
   * Enhanced consistency analysis - Requirement 3.1, 3.3
   * Measures behavioral stability across multiple dimensions
   */
  private static analyzeConsistency(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ConsistencyAnalysis {
    
    if (!transactionHistory || transactionHistory.length < 5) {
      return {
        overallScore: 30,
        components: {
          timingConsistency: 30,
          volumeConsistency: 30,
          frequencyConsistency: 30,
          behavioralConsistency: 30
        },
        stabilityIndicators: {
          activityStability: 'LOW',
          patternReliability: 'LOW',
          behavioralPredictability: 'LOW'
        },
        evidence: ['Insufficient transaction history for consistency analysis'],
        recommendations: ['Maintain regular transaction activity to establish consistency patterns']
      };
    }
    
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // 1. Timing Consistency Analysis
    const timingConsistency = this.analyzeTimingConsistency(sortedTxs);
    
    // 2. Volume Consistency Analysis
    const volumeConsistency = this.analyzeVolumeConsistency(sortedTxs);
    
    // 3. Frequency Consistency Analysis
    const frequencyConsistency = this.analyzeFrequencyConsistency(sortedTxs);
    
    // 4. Behavioral Consistency Analysis
    const behavioralConsistency = this.analyzeBehavioralConsistency(sortedTxs);
    
    // Calculate overall consistency score
    const overallScore = Math.round(
      (timingConsistency.score * 0.25) +
      (volumeConsistency.score * 0.25) +
      (frequencyConsistency.score * 0.25) +
      (behavioralConsistency.score * 0.25)
    );
    
    // Determine stability indicators
    const stabilityIndicators = {
      activityStability: this.determineStabilityLevel(frequencyConsistency.score),
      patternReliability: this.determineStabilityLevel((timingConsistency.score + behavioralConsistency.score) / 2),
      behavioralPredictability: this.determineStabilityLevel(overallScore)
    };
    
    // Compile evidence
    const evidence: string[] = [
      ...timingConsistency.evidence,
      ...volumeConsistency.evidence,
      ...frequencyConsistency.evidence,
      ...behavioralConsistency.evidence
    ];
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (timingConsistency.score < 60) {
      recommendations.push('Establish more regular transaction timing patterns');
    }
    if (volumeConsistency.score < 60) {
      recommendations.push('Maintain more consistent transaction volumes');
    }
    if (frequencyConsistency.score < 60) {
      recommendations.push('Develop more regular transaction frequency patterns');
    }
    if (behavioralConsistency.score < 60) {
      recommendations.push('Focus on consistent protocol and transaction type usage');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintain current consistency levels to preserve stable behavioral profile');
    }
    
    return {
      overallScore,
      components: {
        timingConsistency: timingConsistency.score,
        volumeConsistency: volumeConsistency.score,
        frequencyConsistency: frequencyConsistency.score,
        behavioralConsistency: behavioralConsistency.score
      },
      stabilityIndicators,
      evidence,
      recommendations
    };
  }

  /**
   * Analyze timing consistency patterns
   */
  private static analyzeTimingConsistency(transactions: TransactionData[]): { score: number; evidence: string[] } {
    if (transactions.length < 3) {
      return { score: 0, evidence: ['Insufficient data for timing analysis'] };
    }
    
    // Calculate intervals between transactions
    const intervals = [];
    for (let i = 1; i < transactions.length; i++) {
      intervals.push(transactions[i].timestamp - transactions[i-1].timestamp);
    }
    
    // Calculate coefficient of variation for intervals
    const cv = this.calculateCoefficientOfVariation(intervals);
    
    // Convert CV to consistency score (lower CV = higher consistency)
    const score = Math.max(0, Math.min(100, 100 - (cv * 50)));
    
    // Analyze time-of-day patterns
    const hourCounts = new Array(24).fill(0);
    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp * 1000).getHours();
      hourCounts[hour]++;
    });
    
    const maxHourCount = Math.max(...hourCounts);
    const activeHours = hourCounts.filter(count => count > 0).length;
    
    const evidence: string[] = [];
    
    if (cv < 0.5) {
      evidence.push('Highly consistent transaction timing patterns');
    } else if (cv < 1.0) {
      evidence.push('Moderately consistent transaction timing');
    } else {
      evidence.push('Irregular transaction timing patterns');
    }
    
    if (activeHours <= 8) {
      evidence.push(`Concentrated activity in ${activeHours} hours of the day`);
    } else if (activeHours <= 16) {
      evidence.push(`Moderate time distribution across ${activeHours} hours`);
    } else {
      evidence.push(`Distributed activity across ${activeHours} hours of the day`);
    }
    
    return { score: Math.round(score), evidence };
  }

  /**
   * Analyze volume consistency patterns
   */
  private static analyzeVolumeConsistency(transactions: TransactionData[]): { score: number; evidence: string[] } {
    const volumes = transactions.map(tx => parseFloat(tx.value));
    const nonZeroVolumes = volumes.filter(v => v > 0);
    
    if (nonZeroVolumes.length < 3) {
      return { score: 50, evidence: ['Limited volume data for consistency analysis'] };
    }
    
    // Calculate coefficient of variation for volumes
    const cv = this.calculateCoefficientOfVariation(nonZeroVolumes);
    
    // Convert CV to consistency score
    const score = Math.max(0, Math.min(100, 100 - (cv * 30)));
    
    const evidence: string[] = [];
    const avgVolume = nonZeroVolumes.reduce((sum, v) => sum + v, 0) / nonZeroVolumes.length;
    const maxVolume = Math.max(...nonZeroVolumes);
    const minVolume = Math.min(...nonZeroVolumes);
    
    if (cv < 0.5) {
      evidence.push('Highly consistent transaction volumes');
    } else if (cv < 1.0) {
      evidence.push('Moderately consistent transaction volumes');
    } else if (cv < 2.0) {
      evidence.push('Variable transaction volumes');
    } else {
      evidence.push('Highly variable transaction volumes');
    }
    
    const volumeRange = maxVolume / minVolume;
    if (volumeRange > 100) {
      evidence.push(`Wide volume range: ${volumeRange.toFixed(0)}x difference between largest and smallest`);
    } else if (volumeRange > 10) {
      evidence.push(`Moderate volume range: ${volumeRange.toFixed(1)}x difference`);
    } else {
      evidence.push(`Narrow volume range: ${volumeRange.toFixed(1)}x difference`);
    }
    
    return { score: Math.round(score), evidence };
  }

  /**
   * Analyze frequency consistency patterns
   */
  private static analyzeFrequencyConsistency(transactions: TransactionData[]): { score: number; evidence: string[] } {
    if (transactions.length < 10) {
      return { score: 40, evidence: ['Limited transaction history for frequency analysis'] };
    }
    
    // Analyze weekly activity patterns
    const weeklyActivity = new Map<string, number>();
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp * 1000);
      const weekKey = `${date.getFullYear()}-W${Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
      weeklyActivity.set(weekKey, (weeklyActivity.get(weekKey) || 0) + 1);
    });
    
    const weeklyTxCounts = Array.from(weeklyActivity.values());
    
    if (weeklyTxCounts.length < 3) {
      return { score: 50, evidence: ['Insufficient time span for frequency consistency analysis'] };
    }
    
    // Calculate coefficient of variation for weekly activity
    const cv = this.calculateCoefficientOfVariation(weeklyTxCounts);
    
    // Convert CV to consistency score
    const score = Math.max(0, Math.min(100, 100 - (cv * 40)));
    
    const evidence: string[] = [];
    const avgWeeklyTxs = weeklyTxCounts.reduce((sum, count) => sum + count, 0) / weeklyTxCounts.length;
    
    if (cv < 0.3) {
      evidence.push(`Highly consistent weekly activity: ~${avgWeeklyTxs.toFixed(1)} transactions per week`);
    } else if (cv < 0.6) {
      evidence.push(`Moderately consistent weekly activity: ~${avgWeeklyTxs.toFixed(1)} transactions per week`);
    } else if (cv < 1.0) {
      evidence.push(`Variable weekly activity: ${avgWeeklyTxs.toFixed(1)} transactions per week on average`);
    } else {
      evidence.push(`Highly variable weekly activity patterns`);
    }
    
    // Check for periods of inactivity
    const maxGap = Math.max(...weeklyTxCounts.map((_, i, arr) => {
      if (i === 0) return 0;
      return arr[i-1] === 0 ? 1 : 0;
    }));
    
    if (maxGap > 0) {
      evidence.push('Includes periods of complete inactivity');
    }
    
    return { score: Math.round(score), evidence };
  }

  /**
   * Analyze behavioral consistency (protocol usage, transaction types)
   */
  private static analyzeBehavioralConsistency(transactions: TransactionData[]): { score: number; evidence: string[] } {
    // Analyze protocol usage consistency
    const protocolCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    
    transactions.forEach(tx => {
      if (tx.protocolName) {
        protocolCounts.set(tx.protocolName, (protocolCounts.get(tx.protocolName) || 0) + 1);
      }
      
      const type = tx.isDeFi ? 'DeFi' : tx.isStaking ? 'Staking' : 'Transfer';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });
    
    // Calculate protocol usage distribution
    const protocolUsage = Array.from(protocolCounts.values());
    const typeUsage = Array.from(typeCounts.values());
    
    // Calculate consistency based on usage distribution
    let protocolConsistency = 50; // Default
    if (protocolUsage.length > 0) {
      const protocolCV = this.calculateCoefficientOfVariation(protocolUsage);
      protocolConsistency = Math.max(0, Math.min(100, 100 - (protocolCV * 30)));
    }
    
    let typeConsistency = 50; // Default
    if (typeUsage.length > 0) {
      const typeCV = this.calculateCoefficientOfVariation(typeUsage);
      typeConsistency = Math.max(0, Math.min(100, 100 - (typeCV * 40)));
    }
    
    const score = Math.round((protocolConsistency + typeConsistency) / 2);
    
    const evidence: string[] = [];
    
    // Analyze protocol preferences
    const totalProtocolTxs = protocolUsage.reduce((sum, count) => sum + count, 0);
    const dominantProtocol = Math.max(...protocolUsage) / totalProtocolTxs;
    
    if (dominantProtocol > 0.7) {
      evidence.push('Strong preference for specific protocols');
    } else if (dominantProtocol > 0.4) {
      evidence.push('Moderate protocol preferences');
    } else {
      evidence.push('Diverse protocol usage patterns');
    }
    
    // Analyze transaction type distribution
    const totalTypeTxs = typeUsage.reduce((sum, count) => sum + count, 0);
    const dominantType = Math.max(...typeUsage) / totalTypeTxs;
    
    if (dominantType > 0.8) {
      evidence.push('Highly focused transaction behavior');
    } else if (dominantType > 0.5) {
      evidence.push('Moderately focused transaction behavior');
    } else {
      evidence.push('Diverse transaction type usage');
    }
    
    return { score, evidence };
  }

  /**
   * Determine stability level from score
   */
  private static determineStabilityLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Enhanced diversification analysis with concentration areas - Requirement 3.4
   */
  private static analyzeDiversificationDetailed(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): DiversificationAnalysis {
    
    // Calculate protocol diversification
    const protocolDiversification = this.calculateProtocolDiversification(metrics, transactionHistory);
    
    // Calculate transaction type diversification
    const transactionTypeDiversification = this.calculateTransactionTypeDiversification(transactionHistory);
    
    // Calculate temporal diversification
    const temporalDiversification = this.calculateTemporalDiversification(transactionHistory);
    
    // Calculate value diversification
    const valueDiversification = this.calculateValueDiversification(transactionHistory);
    
    // Calculate overall diversification score
    const overallScore = Math.round(
      (protocolDiversification.score * 0.35) +
      (transactionTypeDiversification.score * 0.25) +
      (temporalDiversification.score * 0.20) +
      (valueDiversification.score * 0.20)
    );
    
    // Determine diversification level
    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    if (overallScore >= 70) level = 'HIGH';
    else if (overallScore >= 40) level = 'MEDIUM';
    else level = 'LOW';
    
    // Identify concentration areas
    const concentrationAreas: ConcentrationAnalysis[] = [
      ...protocolDiversification.concentrationAreas,
      ...transactionTypeDiversification.concentrationAreas,
      ...temporalDiversification.concentrationAreas,
      ...valueDiversification.concentrationAreas
    ];
    
    // Assess concentration risk
    const highRiskAreas = concentrationAreas.filter(area => 
      area.riskLevel === 'HIGH' || area.riskLevel === 'CRITICAL'
    );
    
    let concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (highRiskAreas.length >= 3) concentrationRisk = 'CRITICAL';
    else if (highRiskAreas.length >= 2) concentrationRisk = 'HIGH';
    else if (highRiskAreas.length >= 1) concentrationRisk = 'MEDIUM';
    else concentrationRisk = 'LOW';
    
    // Calculate diversification benefit
    const diversificationBenefit = Math.min(100, overallScore + (concentrationRisk === 'LOW' ? 20 : 0));
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (protocolDiversification.score < 60) {
      recommendations.push('Explore additional DeFi protocols to reduce concentration risk');
    }
    if (transactionTypeDiversification.score < 60) {
      recommendations.push('Diversify transaction types (staking, DeFi, transfers)');
    }
    if (temporalDiversification.score < 60) {
      recommendations.push('Spread transaction activity across different time periods');
    }
    if (valueDiversification.score < 60) {
      recommendations.push('Vary transaction sizes to improve value diversification');
    }
    
    if (concentrationRisk === 'HIGH' || concentrationRisk === 'CRITICAL') {
      recommendations.push('Address high concentration risks to improve overall profile stability');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintain current diversification levels to preserve balanced profile');
    }
    
    return {
      level,
      score: overallScore,
      concentrationAreas,
      diversificationMetrics: {
        protocolDiversification: protocolDiversification.score,
        transactionTypeDiversification: transactionTypeDiversification.score,
        temporalDiversification: temporalDiversification.score,
        valueDiversification: valueDiversification.score
      },
      riskAssessment: {
        concentrationRisk,
        diversificationBenefit
      },
      recommendations
    };
  }

  /**
   * Calculate protocol diversification metrics
   */
  private static calculateProtocolDiversification(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): { score: number; concentrationAreas: ConcentrationAnalysis[] } {
    
    const protocolCount = metrics.defiProtocolsUsed.length;
    const concentrationAreas: ConcentrationAnalysis[] = [];
    
    // Base score from protocol count
    let score = 0;
    if (protocolCount === 0) {
      score = 0;
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 100,
        dominantCategory: 'No DeFi Usage',
        riskLevel: 'HIGH',
        description: 'No DeFi protocol diversification',
        recommendations: ['Start using DeFi protocols to improve diversification']
      });
    } else if (protocolCount === 1) {
      score = 20;
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 100,
        dominantCategory: metrics.defiProtocolsUsed[0],
        riskLevel: 'HIGH',
        description: 'Single protocol dependency',
        recommendations: ['Diversify across multiple DeFi protocols']
      });
    } else if (protocolCount <= 3) {
      score = 50;
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 70,
        dominantCategory: 'Limited Protocol Set',
        riskLevel: 'MEDIUM',
        description: 'Limited protocol diversification',
        recommendations: ['Explore additional protocols for better diversification']
      });
    } else if (protocolCount <= 6) {
      score = 75;
    } else {
      score = 90;
    }
    
    // Analyze protocol usage distribution if transaction history available
    if (transactionHistory && transactionHistory.length > 0) {
      const protocolUsage = new Map<string, number>();
      
      transactionHistory.forEach(tx => {
        if (tx.protocolName) {
          protocolUsage.set(tx.protocolName, (protocolUsage.get(tx.protocolName) || 0) + 1);
        }
      });
      
      if (protocolUsage.size > 0) {
        const usageCounts = Array.from(protocolUsage.values());
        const totalUsage = usageCounts.reduce((sum, count) => sum + count, 0);
        const maxUsage = Math.max(...usageCounts);
        const dominanceRatio = maxUsage / totalUsage;
        
        if (dominanceRatio > 0.8) {
          const dominantProtocol = Array.from(protocolUsage.entries())
            .find(([_, count]) => count === maxUsage)?.[0] || 'Unknown';
          
          concentrationAreas.push({
            area: 'PROTOCOL',
            concentrationLevel: Math.round(dominanceRatio * 100),
            dominantCategory: dominantProtocol,
            riskLevel: 'HIGH',
            description: `${Math.round(dominanceRatio * 100)}% of activity concentrated in ${dominantProtocol}`,
            recommendations: ['Reduce dependency on single protocol']
          });
          
          score = Math.min(score, 40); // Cap score due to high concentration
        }
      }
    }
    
    return { score, concentrationAreas };
  }

  /**
   * Calculate transaction type diversification
   */
  private static calculateTransactionTypeDiversification(
    transactionHistory?: TransactionData[]
  ): { score: number; concentrationAreas: ConcentrationAnalysis[] } {
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return {
        score: 0,
        concentrationAreas: [{
          area: 'TRANSACTION_TYPE',
          concentrationLevel: 100,
          dominantCategory: 'No Data',
          riskLevel: 'MEDIUM',
          description: 'No transaction history available',
          recommendations: ['Establish transaction history for analysis']
        }]
      };
    }
    
    const typeCounts = new Map<string, number>();
    
    transactionHistory.forEach(tx => {
      let type = 'Transfer';
      if (tx.isDeFi) type = 'DeFi';
      else if (tx.isStaking) type = 'Staking';
      
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });
    
    const typeCount = typeCounts.size;
    const concentrationAreas: ConcentrationAnalysis[] = [];
    
    // Calculate base score from type diversity
    let score = 0;
    if (typeCount === 1) {
      score = 20;
    } else if (typeCount === 2) {
      score = 60;
    } else {
      score = 85;
    }
    
    // Check for concentration in specific types
    const totalTxs = transactionHistory.length;
    const usageCounts = Array.from(typeCounts.values());
    const maxUsage = Math.max(...usageCounts);
    const dominanceRatio = maxUsage / totalTxs;
    
    if (dominanceRatio > 0.8) {
      const dominantType = Array.from(typeCounts.entries())
        .find(([_, count]) => count === maxUsage)?.[0] || 'Unknown';
      
      concentrationAreas.push({
        area: 'TRANSACTION_TYPE',
        concentrationLevel: Math.round(dominanceRatio * 100),
        dominantCategory: dominantType,
        riskLevel: dominanceRatio > 0.9 ? 'HIGH' : 'MEDIUM',
        description: `${Math.round(dominanceRatio * 100)}% of transactions are ${dominantType}`,
        recommendations: ['Diversify transaction types for better risk distribution']
      });
      
      score = Math.min(score, 50);
    }
    
    return { score, concentrationAreas };
  }

  /**
   * Calculate temporal diversification
   */
  private static calculateTemporalDiversification(
    transactionHistory?: TransactionData[]
  ): { score: number; concentrationAreas: ConcentrationAnalysis[] } {
    
    if (!transactionHistory || transactionHistory.length < 5) {
      return {
        score: 30,
        concentrationAreas: [{
          area: 'TIME_PERIOD',
          concentrationLevel: 100,
          dominantCategory: 'Insufficient Data',
          riskLevel: 'MEDIUM',
          description: 'Limited transaction history for temporal analysis',
          recommendations: ['Maintain consistent activity over time']
        }]
      };
    }
    
    const concentrationAreas: ConcentrationAnalysis[] = [];
    
    // Analyze hour-of-day distribution
    const hourCounts = new Array(24).fill(0);
    transactionHistory.forEach(tx => {
      const hour = new Date(tx.timestamp * 1000).getHours();
      hourCounts[hour]++;
    });
    
    const activeHours = hourCounts.filter(count => count > 0).length;
    const maxHourCount = Math.max(...hourCounts);
    const hourConcentration = maxHourCount / transactionHistory.length;
    
    let score = Math.min(100, (activeHours / 24) * 100 + 20);
    
    if (hourConcentration > 0.5) {
      const dominantHour = hourCounts.indexOf(maxHourCount);
      concentrationAreas.push({
        area: 'TIME_PERIOD',
        concentrationLevel: Math.round(hourConcentration * 100),
        dominantCategory: `Hour ${dominantHour}:00`,
        riskLevel: hourConcentration > 0.7 ? 'HIGH' : 'MEDIUM',
        description: `${Math.round(hourConcentration * 100)}% of activity concentrated in single hour`,
        recommendations: ['Spread activity across different times of day']
      });
      
      score = Math.min(score, 60);
    }
    
    // Analyze day-of-week distribution
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Array(7).fill(0);
    
    transactionHistory.forEach(tx => {
      const day = new Date(tx.timestamp * 1000).getDay();
      dayCounts[day]++;
    });
    
    const activeDays = dayCounts.filter(count => count > 0).length;
    const maxDayCount = Math.max(...dayCounts);
    const dayConcentration = maxDayCount / transactionHistory.length;
    
    if (dayConcentration > 0.6) {
      const dominantDay = dayCounts.indexOf(maxDayCount);
      concentrationAreas.push({
        area: 'TIME_PERIOD',
        concentrationLevel: Math.round(dayConcentration * 100),
        dominantCategory: dayNames[dominantDay],
        riskLevel: dayConcentration > 0.8 ? 'HIGH' : 'MEDIUM',
        description: `${Math.round(dayConcentration * 100)}% of activity on ${dayNames[dominantDay]}`,
        recommendations: ['Distribute activity across different days of the week']
      });
      
      score = Math.min(score, 50);
    }
    
    return { score, concentrationAreas };
  }

  /**
   * Calculate value diversification
   */
  private static calculateValueDiversification(
    transactionHistory?: TransactionData[]
  ): { score: number; concentrationAreas: ConcentrationAnalysis[] } {
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return {
        score: 0,
        concentrationAreas: [{
          area: 'VALUE_RANGE',
          concentrationLevel: 100,
          dominantCategory: 'No Data',
          riskLevel: 'MEDIUM',
          description: 'No transaction data for value analysis',
          recommendations: ['Establish transaction history']
        }]
      };
    }
    
    const values = transactionHistory
      .map(tx => parseFloat(tx.value))
      .filter(value => value > 0);
    
    if (values.length === 0) {
      return {
        score: 30,
        concentrationAreas: [{
          area: 'VALUE_RANGE',
          concentrationLevel: 100,
          dominantCategory: 'Zero Values',
          riskLevel: 'MEDIUM',
          description: 'All transactions have zero value',
          recommendations: ['Include value-bearing transactions']
        }]
      };
    }
    
    const concentrationAreas: ConcentrationAnalysis[] = [];
    
    // Calculate value distribution metrics
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const valueRange = maxValue / minValue;
    
    // Calculate coefficient of variation for value diversity
    const cv = this.calculateCoefficientOfVariation(values);
    
    // Score based on coefficient of variation and range
    let score = Math.min(100, (cv * 50) + (Math.log10(valueRange) * 20));
    
    // Check for concentration in specific value ranges
    const valueRanges = {
      'Micro (< 0.01)': values.filter(v => v < 0.01).length,
      'Small (0.01-0.1)': values.filter(v => v >= 0.01 && v < 0.1).length,
      'Medium (0.1-1)': values.filter(v => v >= 0.1 && v < 1).length,
      'Large (1-10)': values.filter(v => v >= 1 && v < 10).length,
      'Very Large (>10)': values.filter(v => v >= 10).length
    };
    
    const totalValues = values.length;
    for (const [range, count] of Object.entries(valueRanges)) {
      const concentration = count / totalValues;
      
      if (concentration > 0.7) {
        concentrationAreas.push({
          area: 'VALUE_RANGE',
          concentrationLevel: Math.round(concentration * 100),
          dominantCategory: range,
          riskLevel: concentration > 0.9 ? 'HIGH' : 'MEDIUM',
          description: `${Math.round(concentration * 100)}% of transactions in ${range} range`,
          recommendations: ['Diversify transaction values across different ranges']
        });
        
        score = Math.min(score, 60);
      }
    }
    
    return { score, concentrationAreas };
  }

  /**
   * Analyze seasonal patterns - Requirement 3.3
   * Detect time-based behavioral patterns
   */
  private static analyzeSeasonalPatterns(
    transactionHistory?: TransactionData[]
  ): SeasonalPattern[] {
    
    if (!transactionHistory || transactionHistory.length < 20) {
      return []; // Insufficient data for seasonal analysis
    }
    
    const patterns: SeasonalPattern[] = [];
    
    // Daily pattern analysis
    const hourlyActivity = new Array(24).fill(0);
    for (const tx of transactionHistory) {
      const hour = new Date(tx.timestamp * 1000).getHours();
      hourlyActivity[hour]++;
    }
    
    const maxHourlyActivity = Math.max(...hourlyActivity);
    if (maxHourlyActivity > 0) {
      const normalizedHourly = hourlyActivity.map(count => count / maxHourlyActivity * 100);
      const dailyVariance = this.calculateVariance(normalizedHourly);
      
      if (dailyVariance > 500) { // Significant daily pattern
        patterns.push({
          type: 'DAILY',
          pattern: normalizedHourly,
          confidence: Math.min(100, dailyVariance / 10),
          description: `Peak activity hours: ${this.findPeakHours(hourlyActivity).join(', ')}`
        });
      }
    }
    
    // Weekly pattern analysis
    const weeklyActivity = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (const tx of transactionHistory) {
      const dayOfWeek = new Date(tx.timestamp * 1000).getDay();
      weeklyActivity[dayOfWeek]++;
    }
    
    const maxWeeklyActivity = Math.max(...weeklyActivity);
    if (maxWeeklyActivity > 0) {
      const normalizedWeekly = weeklyActivity.map(count => count / maxWeeklyActivity * 100);
      const weeklyVariance = this.calculateVariance(normalizedWeekly);
      
      if (weeklyVariance > 200) { // Significant weekly pattern
        const peakDays = this.findPeakDays(weeklyActivity, dayNames);
        patterns.push({
          type: 'WEEKLY',
          pattern: normalizedWeekly,
          confidence: Math.min(100, weeklyVariance / 5),
          description: `Most active days: ${peakDays.join(', ')}`
        });
      }
    }
    
    // Monthly pattern analysis (if enough data)
    if (transactionHistory.length > 60) {
      const monthlyActivity = new Array(12).fill(0);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (const tx of transactionHistory) {
        const month = new Date(tx.timestamp * 1000).getMonth();
        monthlyActivity[month]++;
      }
      
      const maxMonthlyActivity = Math.max(...monthlyActivity);
      if (maxMonthlyActivity > 0) {
        const normalizedMonthly = monthlyActivity.map(count => count / maxMonthlyActivity * 100);
        const monthlyVariance = this.calculateVariance(normalizedMonthly);
        
        if (monthlyVariance > 300) { // Significant monthly pattern
          const peakMonths = this.findPeakMonths(monthlyActivity, monthNames);
          patterns.push({
            type: 'MONTHLY',
            pattern: normalizedMonthly,
            confidence: Math.min(100, monthlyVariance / 7),
            description: `Most active months: ${peakMonths.join(', ')}`
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Calculate variance of an array
   */
  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Find peak hours from hourly activity data
   */
  private static findPeakHours(hourlyActivity: number[]): string[] {
    const maxActivity = Math.max(...hourlyActivity);
    const threshold = maxActivity * 0.8; // 80% of max activity
    
    const peakHours: string[] = [];
    for (let i = 0; i < hourlyActivity.length; i++) {
      if (hourlyActivity[i] >= threshold) {
        peakHours.push(`${i}:00`);
      }
    }
    
    return peakHours.length > 0 ? peakHours : ['No clear pattern'];
  }

  /**
   * Find peak days from weekly activity data
   */
  private static findPeakDays(weeklyActivity: number[], dayNames: string[]): string[] {
    const maxActivity = Math.max(...weeklyActivity);
    const threshold = maxActivity * 0.8;
    
    const peakDays: string[] = [];
    for (let i = 0; i < weeklyActivity.length; i++) {
      if (weeklyActivity[i] >= threshold) {
        peakDays.push(dayNames[i]);
      }
    }
    
    return peakDays.length > 0 ? peakDays : ['No clear pattern'];
  }

  /**
   * Find peak months from monthly activity data
   */
  private static findPeakMonths(monthlyActivity: number[], monthNames: string[]): string[] {
    const maxActivity = Math.max(...monthlyActivity);
    const threshold = maxActivity * 0.8;
    
    const peakMonths: string[] = [];
    for (let i = 0; i < monthlyActivity.length; i++) {
      if (monthlyActivity[i] >= threshold) {
        peakMonths.push(monthNames[i]);
      }
    }
    
    return peakMonths.length > 0 ? peakMonths : ['No clear pattern'];
  }

  /**
   * Analyze protocol preferences
   */
  private static analyzeProtocolPreferences(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ProtocolPreference[] {
    
    const preferences: ProtocolPreference[] = [];
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return preferences;
    }
    
    // Count protocol usage
    const protocolUsage = new Map<string, {
      count: number;
      volume: number;
      lastUsed: number;
      gasUsed: number;
    }>();
    
    let totalVolume = 0;
    let totalTransactions = 0;
    
    for (const tx of transactionHistory) {
      const protocolName = tx.protocolName || 'Unknown';
      const volume = parseFloat(tx.value);
      const gasUsed = parseInt(tx.gasUsed);
      
      totalVolume += volume;
      totalTransactions++;
      
      if (!protocolUsage.has(protocolName)) {
        protocolUsage.set(protocolName, {
          count: 0,
          volume: 0,
          lastUsed: 0,
          gasUsed: 0
        });
      }
      
      const usage = protocolUsage.get(protocolName)!;
      usage.count++;
      usage.volume += volume;
      usage.lastUsed = Math.max(usage.lastUsed, tx.timestamp);
      usage.gasUsed += gasUsed;
    }
    
    // Convert to preferences
    for (const [protocolName, usage] of protocolUsage.entries()) {
      const usageFrequency = (usage.count / totalTransactions) * 100;
      const volumePercentage = totalVolume > 0 ? (usage.volume / totalVolume) * 100 : 0;
      
      // Calculate sophistication score
      let sophisticationScore = 40; // Default
      const protocolKey = protocolName.toLowerCase();
      
      for (const [key, config] of Object.entries(this.PROTOCOL_SOPHISTICATION)) {
        if (protocolKey.includes(key) || key.includes(protocolKey)) {
          sophisticationScore = config.complexity;
          break;
        }
      }
      
      // Determine preference strength
      let preferenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'DOMINANT';
      
      if (usageFrequency >= 60) {
        preferenceStrength = 'DOMINANT';
      } else if (usageFrequency >= 30) {
        preferenceStrength = 'STRONG';
      } else if (usageFrequency >= 10) {
        preferenceStrength = 'MODERATE';
      } else {
        preferenceStrength = 'WEAK';
      }
      
      preferences.push({
        protocolName,
        usageFrequency: Math.round(usageFrequency),
        volumePercentage: Math.round(volumePercentage),
        sophisticationScore,
        preferenceStrength,
        lastUsed: usage.lastUsed
      });
    }
    
    // Sort by usage frequency
    preferences.sort((a, b) => b.usageFrequency - a.usageFrequency);
    
    return preferences;
  }

  /**
   * Analyze transaction timing patterns
   */
  private static analyzeTransactionTiming(
    transactionHistory?: TransactionData[]
  ): TimingAnalysis {
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return {
        preferredHours: [],
        preferredDays: [],
        consistencyScore: 0,
        timezonePattern: 'UNKNOWN',
        peakActivityPeriods: []
      };
    }
    
    // Analyze hourly patterns
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);
    
    for (const tx of transactionHistory) {
      const date = new Date(tx.timestamp * 1000);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourlyActivity[hour]++;
      dailyActivity[day]++;
    }
    
    // Find preferred hours (top 25% of activity)
    const maxHourlyActivity = Math.max(...hourlyActivity);
    const hourThreshold = maxHourlyActivity * 0.75;
    const preferredHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= hourThreshold)
      .map(({ hour }) => hour);
    
    // Find preferred days (top 25% of activity)
    const maxDailyActivity = Math.max(...dailyActivity);
    const dayThreshold = maxDailyActivity * 0.75;
    const preferredDays = dailyActivity
      .map((count, day) => ({ day, count }))
      .filter(({ count }) => count >= dayThreshold)
      .map(({ day }) => day);
    
    // Calculate consistency score
    const hourlyVariance = this.calculateVariance(hourlyActivity);
    const dailyVariance = this.calculateVariance(dailyActivity);
    const consistencyScore = Math.max(0, 100 - (hourlyVariance + dailyVariance) / 20);
    
    // Determine timezone pattern
    let timezonePattern: 'CONSISTENT' | 'VARIABLE' | 'UNKNOWN';
    
    if (preferredHours.length <= 8 && consistencyScore > 60) {
      timezonePattern = 'CONSISTENT';
    } else if (preferredHours.length > 12 || consistencyScore < 30) {
      timezonePattern = 'VARIABLE';
    } else {
      timezonePattern = 'UNKNOWN';
    }
    
    // Identify peak activity periods
    const peakActivityPeriods: ActivityPeriod[] = [];
    let currentPeriod: { start: number; end: number; transactions: TransactionData[] } | null = null;
    
    for (let hour = 0; hour < 24; hour++) {
      const isActive = hourlyActivity[hour] >= hourThreshold;
      
      if (isActive && !currentPeriod) {
        // Start new period
        currentPeriod = { start: hour, end: hour, transactions: [] };
      } else if (isActive && currentPeriod) {
        // Extend current period
        currentPeriod.end = hour;
      } else if (!isActive && currentPeriod) {
        // End current period
        const periodTransactions = transactionHistory.filter(tx => {
          const txHour = new Date(tx.timestamp * 1000).getHours();
          return txHour >= currentPeriod!.start && txHour <= currentPeriod!.end;
        });
        
        const totalVolume = periodTransactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
        const averageVolume = periodTransactions.length > 0 ? totalVolume / periodTransactions.length : 0;
        
        let activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
        const periodActivity = currentPeriod.end - currentPeriod.start + 1;
        
        if (periodActivity >= 8) {
          activityLevel = 'PEAK';
        } else if (periodActivity >= 4) {
          activityLevel = 'HIGH';
        } else if (periodActivity >= 2) {
          activityLevel = 'MEDIUM';
        } else {
          activityLevel = 'LOW';
        }
        
        peakActivityPeriods.push({
          startHour: currentPeriod.start,
          endHour: currentPeriod.end,
          activityLevel,
          transactionCount: periodTransactions.length,
          averageVolume
        });
        
        currentPeriod = null;
      }
    }
    
    // Handle period that extends to end of day
    if (currentPeriod) {
      const periodTransactions = transactionHistory.filter(tx => {
        const txHour = new Date(tx.timestamp * 1000).getHours();
        return txHour >= currentPeriod!.start;
      });
      
      const totalVolume = periodTransactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
      const averageVolume = periodTransactions.length > 0 ? totalVolume / periodTransactions.length : 0;
      
      peakActivityPeriods.push({
        startHour: currentPeriod.start,
        endHour: 23,
        activityLevel: 'MEDIUM',
        transactionCount: periodTransactions.length,
        averageVolume
      });
    }
    
    return {
      preferredHours,
      preferredDays,
      consistencyScore: Math.round(consistencyScore),
      timezonePattern,
      peakActivityPeriods
    };
  }

  /**
   * Analyze gas efficiency patterns
   */
  private static analyzeGasEfficiency(
    transactionHistory?: TransactionData[]
  ): GasEfficiencyAnalysis {
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return {
        overallEfficiencyScore: 0,
        optimizationLevel: 'POOR',
        averageGasPrice: 0,
        gasPriceConsistency: 0,
        timingOptimization: 0,
        improvementPotential: 100,
        recommendations: ['No transaction history available for analysis']
      };
    }
    
    // Use existing efficiency analysis
    const efficiencyMetrics = TransactionAnalysisEngine.generateEfficiencyRecommendations(transactionHistory);
    
    // Calculate gas price consistency
    const gasPrices = transactionHistory.map(tx => parseFloat(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    const gasVariance = this.calculateVariance(gasPrices);
    const gasPriceConsistency = Math.max(0, 100 - (gasVariance / (avgGasPrice * avgGasPrice)) * 100);
    
    // Determine optimization level
    let optimizationLevel: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
    
    if (efficiencyMetrics.gasEfficiencyScore >= 80) {
      optimizationLevel = 'EXCELLENT';
    } else if (efficiencyMetrics.gasEfficiencyScore >= 60) {
      optimizationLevel = 'GOOD';
    } else if (efficiencyMetrics.gasEfficiencyScore >= 40) {
      optimizationLevel = 'AVERAGE';
    } else {
      optimizationLevel = 'POOR';
    }
    
    // Calculate improvement potential
    const improvementPotential = Math.max(0, 100 - efficiencyMetrics.gasEfficiencyScore);
    
    // Generate additional recommendations
    const recommendations = [...efficiencyMetrics.recommendations];
    
    if (gasPriceConsistency < 50) {
      recommendations.push('Improve gas price consistency by using gas price optimization tools');
    }
    
    if (efficiencyMetrics.timingOptimization < 60) {
      recommendations.push('Optimize transaction timing to avoid network congestion');
    }
    
    return {
      overallEfficiencyScore: efficiencyMetrics.gasEfficiencyScore,
      optimizationLevel,
      averageGasPrice: avgGasPrice,
      gasPriceConsistency: Math.round(gasPriceConsistency),
      timingOptimization: efficiencyMetrics.timingOptimization,
      improvementPotential: Math.round(improvementPotential),
      recommendations
    };
  }

  /**
   * Analyze diversification patterns
   */
  private static analyzeDiversification(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): { level: 'LOW' | 'MEDIUM' | 'HIGH'; concentrationAreas: ConcentrationAnalysis[] } {
    
    const concentrationAreas: ConcentrationAnalysis[] = [];
    
    // Analyze protocol concentration
    const protocolCount = metrics.defiProtocolsUsed.length;
    let protocolConcentration = 0;
    
    if (protocolCount === 0) {
      protocolConcentration = 100;
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 100,
        dominantCategory: 'No DeFi protocols used',
        riskLevel: 'HIGH',
        description: 'No diversification across DeFi protocols',
        recommendations: ['Explore DeFi protocols to improve diversification']
      });
    } else if (protocolCount === 1) {
      protocolConcentration = 80;
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 80,
        dominantCategory: metrics.defiProtocolsUsed[0],
        riskLevel: 'MEDIUM',
        description: 'High concentration in single DeFi protocol',
        recommendations: ['Diversify across multiple DeFi protocols']
      });
    } else if (protocolCount <= 3) {
      protocolConcentration = 40;
    } else {
      protocolConcentration = 20;
    }
    
    // Analyze transaction type concentration
    if (transactionHistory && transactionHistory.length > 0) {
      const typeCount = new Map<string, number>();
      
      for (const tx of transactionHistory) {
        const type = tx.isDeFi ? 'DeFi' : tx.isStaking ? 'Staking' : 'Transfer';
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
      }
      
      const maxTypeCount = Math.max(...typeCount.values());
      const typeConcentration = (maxTypeCount / transactionHistory.length) * 100;
      
      if (typeConcentration > 80) {
        const dominantType = Array.from(typeCount.entries())
          .find(([_, count]) => count === maxTypeCount)?.[0] || 'Unknown';
        
        concentrationAreas.push({
          area: 'TRANSACTION_TYPE',
          concentrationLevel: Math.round(typeConcentration),
          dominantCategory: dominantType,
          riskLevel: typeConcentration > 90 ? 'HIGH' : 'MEDIUM',
          description: `High concentration in ${dominantType} transactions`,
          recommendations: ['Diversify transaction types for better risk profile']
        });
      }
    }
    
    // Analyze value range concentration
    if (transactionHistory && transactionHistory.length > 0) {
      const volumes = transactionHistory.map(tx => parseFloat(tx.value));
      const maxVolume = Math.max(...volumes);
      const minVolume = Math.min(...volumes.filter(v => v > 0));
      
      if (maxVolume > 0 && minVolume > 0) {
        const volumeRatio = maxVolume / minVolume;
        
        if (volumeRatio < 2) {
          concentrationAreas.push({
            area: 'VALUE_RANGE',
            concentrationLevel: 70,
            dominantCategory: 'Similar transaction sizes',
            riskLevel: 'MEDIUM',
            description: 'Limited variation in transaction sizes',
            recommendations: ['Consider varying transaction sizes based on strategy']
          });
        }
      }
    }
    
    // Determine overall diversification level
    let diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    
    const avgConcentration = concentrationAreas.length > 0
      ? concentrationAreas.reduce((sum, area) => sum + area.concentrationLevel, 0) / concentrationAreas.length
      : protocolConcentration;
    
    if (avgConcentration > 70) {
      diversificationLevel = 'LOW';
    } else if (avgConcentration > 40) {
      diversificationLevel = 'MEDIUM';
    } else {
      diversificationLevel = 'HIGH';
    }
    
    return {
      level: diversificationLevel,
      concentrationAreas
    };
  }

  /**
   * Calculate data quality metrics
   */
  private static calculateDataQuality(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): DataQualityMetrics {
    
    let completeness = 0;
    let freshness = 0;
    let consistency = 0;
    let reliability = 0;
    
    const sampleSize = transactionHistory?.length || 0;
    const timeSpanDays = metrics.accountAge;
    
    // Calculate completeness (based on expected vs actual data points)
    const expectedTransactions = Math.max(1, timeSpanDays / 7); // At least 1 tx per week expected
    completeness = Math.min(100, (sampleSize / expectedTransactions) * 100);
    
    // Calculate freshness (based on time since last transaction)
    const now = Math.floor(Date.now() / 1000);
    const daysSinceLastTx = metrics.lastTransactionDate > 0 
      ? (now - metrics.lastTransactionDate) / (24 * 60 * 60)
      : timeSpanDays;
    
    freshness = Math.max(0, 100 - (daysSinceLastTx / 30) * 100); // 30 days = 0% freshness
    
    // Calculate consistency (based on data availability and patterns)
    if (transactionHistory && transactionHistory.length > 1) {
      const hasProtocolData = transactionHistory.some(tx => tx.protocolName);
      const hasGasData = transactionHistory.every(tx => tx.gasUsed && tx.gasPrice);
      const hasValueData = transactionHistory.every(tx => tx.value !== undefined);
      
      consistency = (
        (hasProtocolData ? 30 : 0) +
        (hasGasData ? 40 : 0) +
        (hasValueData ? 30 : 0)
      );
    }
    
    // Calculate reliability (based on sample size and time span)
    if (sampleSize >= 50 && timeSpanDays >= 90) {
      reliability = 90;
    } else if (sampleSize >= 20 && timeSpanDays >= 30) {
      reliability = 70;
    } else if (sampleSize >= 10 && timeSpanDays >= 14) {
      reliability = 50;
    } else if (sampleSize >= 5) {
      reliability = 30;
    } else {
      reliability = 10;
    }
    
    return {
      completeness: Math.round(completeness),
      freshness: Math.round(freshness),
      consistency: Math.round(consistency),
      reliability: Math.round(reliability),
      sampleSize,
      timeSpanDays
    };
  }

  /**
   * Calculate overall confidence from multiple confidence scores
   */
  private static calculateOverallConfidence(confidenceScores: number[]): number {
    if (confidenceScores.length === 0) return 0;
    
    // Use weighted average with higher weight for higher scores
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const score of confidenceScores) {
      const weight = Math.max(0.1, score / 100); // Minimum weight of 0.1
      totalWeight += weight;
      weightedSum += score * weight;
    }
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }
}

export default BehavioralPatternEngine;