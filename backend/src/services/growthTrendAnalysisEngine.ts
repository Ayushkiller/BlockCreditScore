import { UserMetrics, TransactionData } from './blockchainService';

/**
 * Growth Trend Analysis Interfaces
 * Implements requirements 3.1, 3.3, 3.4 for growth trend and consistency analysis
 */

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

export interface TimingAnalysis {
  preferredHours: number[]; // Hours of day (0-23)
  preferredDays: number[]; // Days of week (0-6, 0=Sunday)
  consistencyScore: number; // 0-100
  timezonePattern: 'CONSISTENT' | 'VARIABLE' | 'UNKNOWN';
  peakActivityPeriods: ActivityPeriod[];
  seasonalPatterns: SeasonalPattern[];
}

export interface ActivityPeriod {
  startHour: number;
  endHour: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
  transactionCount: number;
  averageVolume: number;
}

export interface SeasonalPattern {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  pattern: number[]; // Activity levels by time period
  confidence: number; // 0-100
  description: string;
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

export interface ConcentrationAnalysis {
  area: 'PROTOCOL' | 'TRANSACTION_TYPE' | 'TIME_PERIOD' | 'VALUE_RANGE';
  concentrationLevel: number; // 0-100
  dominantCategory: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendations: string[];
}

/**
 * Growth Trend and Consistency Analysis Engine
 * Implements sophisticated analysis of user behavior trends and consistency patterns
 */
export class GrowthTrendAnalysisEngine {
  
  // Analysis period configuration (in days)
  private static readonly ANALYSIS_PERIODS = {
    SHORT_TERM: 7,    // 1 week
    MEDIUM_TERM: 30,  // 1 month
    LONG_TERM: 90     // 3 months
  };

  // Consistency thresholds
  private static readonly CONSISTENCY_THRESHOLDS = {
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25
  };

  // Diversification thresholds
  private static readonly DIVERSIFICATION_THRESHOLDS = {
    PROTOCOL_HIGH: 5,
    PROTOCOL_MEDIUM: 3,
    TRANSACTION_TYPE_HIGH: 4,
    TRANSACTION_TYPE_MEDIUM: 2
  };

  /**
   * Perform comprehensive growth trend analysis
   * Requirement 3.3: Identify growth trends as improving, stable, or declining
   */
  public static analyzeGrowthTrend(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): GrowthTrendAnalysis {
    
    if (!transactionHistory || transactionHistory.length < 6) {
      return this.generateBasicGrowthTrend(metrics);
    }

    // Sort transactions by timestamp
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Divide into analysis periods
    const periodAnalysis = this.divideToPeriods(sortedTxs);
    
    // Calculate trend metrics
    const keyMetrics = this.calculateTrendMetrics(periodAnalysis);
    
    // Determine overall trend
    const trend = this.determineTrend(keyMetrics, periodAnalysis);
    
    // Calculate trend strength
    const trendStrength = this.calculateTrendStrength(keyMetrics);
    
    // Generate evidence
    const evidence = this.generateTrendEvidence(trend, keyMetrics, periodAnalysis);
    
    // Calculate confidence
    const confidence = this.calculateTrendConfidence(periodAnalysis, transactionHistory.length);
    
    // Generate recommendations
    const recommendations = this.generateTrendRecommendations(trend, keyMetrics);

    return {
      trend,
      confidence,
      evidence,
      trendStrength,
      periodAnalysis,
      keyMetrics,
      recommendations
    };
  }

  /**
   * Analyze behavioral consistency and stability
   * Requirement 3.1: Measure behavioral stability over time
   */
  public static analyzeConsistency(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ConsistencyAnalysis {
    
    if (!transactionHistory || transactionHistory.length < 5) {
      return this.generateBasicConsistencyAnalysis(metrics);
    }

    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Analyze timing consistency
    const timingConsistency = this.analyzeTimingConsistency(sortedTxs);
    
    // Analyze volume consistency
    const volumeConsistency = this.analyzeVolumeConsistency(sortedTxs);
    
    // Analyze frequency consistency
    const frequencyConsistency = this.analyzeFrequencyConsistency(sortedTxs);
    
    // Analyze behavioral consistency
    const behavioralConsistency = this.analyzeBehavioralConsistency(sortedTxs);
    
    // Calculate overall score
    const overallScore = Math.round(
      (timingConsistency * 0.25) +
      (volumeConsistency * 0.25) +
      (frequencyConsistency * 0.25) +
      (behavioralConsistency * 0.25)
    );
    
    // Determine stability indicators
    const stabilityIndicators = this.determineStabilityIndicators(
      timingConsistency,
      volumeConsistency,
      frequencyConsistency,
      behavioralConsistency
    );
    
    // Generate evidence
    const evidence = this.generateConsistencyEvidence(
      timingConsistency,
      volumeConsistency,
      frequencyConsistency,
      behavioralConsistency
    );
    
    // Generate recommendations
    const recommendations = this.generateConsistencyRecommendations(overallScore, stabilityIndicators);

    return {
      overallScore,
      components: {
        timingConsistency: Math.round(timingConsistency),
        volumeConsistency: Math.round(volumeConsistency),
        frequencyConsistency: Math.round(frequencyConsistency),
        behavioralConsistency: Math.round(behavioralConsistency)
      },
      stabilityIndicators,
      evidence,
      recommendations
    };
  }

  /**
   * Analyze transaction timing patterns and preferences
   * Requirement 3.1: Analyze transaction patterns with supporting evidence
   */
  public static analyzeTimingPatterns(
    address: string,
    transactionHistory: TransactionData[]
  ): TimingAnalysis {
    
    if (!transactionHistory || transactionHistory.length < 3) {
      return this.generateBasicTimingAnalysis();
    }

    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Analyze preferred hours
    const preferredHours = this.analyzePreferredHours(sortedTxs);
    
    // Analyze preferred days
    const preferredDays = this.analyzePreferredDays(sortedTxs);
    
    // Calculate timing consistency
    const consistencyScore = this.calculateTimingConsistency(sortedTxs);
    
    // Determine timezone pattern
    const timezonePattern = this.determineTimezonePattern(sortedTxs);
    
    // Identify peak activity periods
    const peakActivityPeriods = this.identifyPeakActivityPeriods(sortedTxs);
    
    // Analyze seasonal patterns
    const seasonalPatterns = this.analyzeSeasonalPatterns(sortedTxs);

    return {
      preferredHours,
      preferredDays,
      consistencyScore: Math.round(consistencyScore),
      timezonePattern,
      peakActivityPeriods,
      seasonalPatterns
    };
  }

  /**
   * Analyze diversification levels and concentration areas
   * Requirement 3.4: Evaluate protocol usage diversity and provide recommendations
   */
  public static analyzeDiversification(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): DiversificationAnalysis {
    
    // Analyze protocol diversification
    const protocolDiversification = this.analyzeProtocolDiversification(metrics, transactionHistory);
    
    // Analyze transaction type diversification
    const transactionTypeDiversification = this.analyzeTransactionTypeDiversification(transactionHistory);
    
    // Analyze temporal diversification
    const temporalDiversification = this.analyzeTemporalDiversification(transactionHistory);
    
    // Analyze value diversification
    const valueDiversification = this.analyzeValueDiversification(transactionHistory);
    
    // Calculate overall diversification score
    const score = Math.round(
      (protocolDiversification * 0.35) +
      (transactionTypeDiversification * 0.25) +
      (temporalDiversification * 0.20) +
      (valueDiversification * 0.20)
    );
    
    // Determine diversification level
    const level = this.determineDiversificationLevel(score);
    
    // Identify concentration areas
    const concentrationAreas = this.identifyConcentrationAreas(metrics, transactionHistory);
    
    // Assess risk
    const riskAssessment = this.assessDiversificationRisk(score, concentrationAreas);
    
    // Generate recommendations
    const recommendations = this.generateDiversificationRecommendations(level, concentrationAreas, riskAssessment);

    return {
      level,
      score,
      concentrationAreas,
      diversificationMetrics: {
        protocolDiversification: Math.round(protocolDiversification),
        transactionTypeDiversification: Math.round(transactionTypeDiversification),
        temporalDiversification: Math.round(temporalDiversification),
        valueDiversification: Math.round(valueDiversification)
      },
      riskAssessment,
      recommendations
    };
  }

  // Private helper methods for growth trend analysis

  private static generateBasicGrowthTrend(metrics: UserMetrics): GrowthTrendAnalysis {
    const transactionsPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    
    const trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 
      transactionsPerMonth > 10 ? 'IMPROVING' : 
      transactionsPerMonth > 2 ? 'STABLE' : 'DECLINING';
    
    return {
      trend,
      confidence: 40,
      evidence: [`Limited data: ${transactionsPerMonth.toFixed(1)} transactions per month`],
      trendStrength: Math.abs(transactionsPerMonth - 5) / 10,
      periodAnalysis: [],
      keyMetrics: {
        activityTrend: trend === 'IMPROVING' ? 0.2 : trend === 'DECLINING' ? -0.2 : 0,
        volumeTrend: 0,
        efficiencyTrend: 0,
        diversificationTrend: 0
      },
      recommendations: trend === 'DECLINING' ? 
        ['Increase transaction frequency to improve credit score'] : 
        ['Maintain current activity level']
    };
  }

  private static divideToPeriods(transactions: TransactionData[]): PeriodMetrics[] {
    if (transactions.length < 6) return [];
    
    const periods: PeriodMetrics[] = [];
    const totalTimespan = transactions[transactions.length - 1].timestamp - transactions[0].timestamp;
    const periodDuration = Math.max(totalTimespan / 4, 7 * 24 * 60 * 60); // At least 1 week per period
    
    let periodIndex = 0;
    let currentPeriodStart = transactions[0].timestamp;
    
    while (currentPeriodStart < transactions[transactions.length - 1].timestamp) {
      const currentPeriodEnd = Math.min(
        currentPeriodStart + periodDuration,
        transactions[transactions.length - 1].timestamp
      );
      
      const periodTxs = transactions.filter(tx => 
        tx.timestamp >= currentPeriodStart && tx.timestamp < currentPeriodEnd
      );
      
      if (periodTxs.length > 0) {
        const totalVolume = periodTxs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
        const avgTransactionValue = totalVolume / periodTxs.length;
        
        // Calculate gas efficiency
        const gasEfficiencies = periodTxs.map(tx => {
          const gasPrice = parseFloat(tx.gasPrice);
          return gasPrice <= 50 ? 80 : gasPrice <= 100 ? 60 : gasPrice <= 200 ? 40 : 20;
        });
        const avgGasEfficiency = gasEfficiencies.reduce((sum, eff) => sum + eff, 0) / gasEfficiencies.length;
        
        // Calculate protocol diversity
        const uniqueProtocols = new Set(periodTxs.map(tx => tx.protocolName || 'unknown'));
        const protocolDiversity = Math.min(uniqueProtocols.size * 20, 100);
        
        // Calculate activity ratios
        const stakingTxs = periodTxs.filter(tx => tx.isStaking);
        const defiTxs = periodTxs.filter(tx => tx.isDeFi);
        const stakingActivity = stakingTxs.length / periodTxs.length;
        const defiActivity = defiTxs.length / periodTxs.length;
        
        periods.push({
          periodIndex,
          startTimestamp: currentPeriodStart,
          endTimestamp: currentPeriodEnd,
          transactionCount: periodTxs.length,
          totalVolume,
          avgGasEfficiency,
          protocolDiversity,
          avgTransactionValue,
          stakingActivity,
          defiActivity
        });
      }
      
      currentPeriodStart = currentPeriodEnd;
      periodIndex++;
    }
    
    return periods;
  }

  private static calculateTrendMetrics(periods: PeriodMetrics[]): {
    activityTrend: number;
    volumeTrend: number;
    efficiencyTrend: number;
    diversificationTrend: number;
  } {
    if (periods.length < 2) {
      return { activityTrend: 0, volumeTrend: 0, efficiencyTrend: 0, diversificationTrend: 0 };
    }
    
    // Calculate linear regression slopes for each metric
    const activityTrend = this.calculateLinearTrend(periods.map(p => p.transactionCount));
    const volumeTrend = this.calculateLinearTrend(periods.map(p => p.totalVolume));
    const efficiencyTrend = this.calculateLinearTrend(periods.map(p => p.avgGasEfficiency));
    const diversificationTrend = this.calculateLinearTrend(periods.map(p => p.protocolDiversity));
    
    return {
      activityTrend,
      volumeTrend,
      efficiencyTrend,
      diversificationTrend
    };
  }

  private static calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ..., n-1
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + (val * index), 0);
    const x2Sum = values.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    
    // Normalize slope relative to the average value
    const avgValue = ySum / n;
    return avgValue > 0 ? slope / avgValue : 0;
  }

  private static determineTrend(
    keyMetrics: { activityTrend: number; volumeTrend: number; efficiencyTrend: number; diversificationTrend: number },
    periods: PeriodMetrics[]
  ): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    
    // Weight the different trend components
    const weightedTrend = 
      (keyMetrics.activityTrend * 0.4) +
      (keyMetrics.volumeTrend * 0.3) +
      (keyMetrics.efficiencyTrend * 0.2) +
      (keyMetrics.diversificationTrend * 0.1);
    
    if (weightedTrend > 0.1) return 'IMPROVING';
    if (weightedTrend < -0.1) return 'DECLINING';
    return 'STABLE';
  }

  private static calculateTrendStrength(keyMetrics: {
    activityTrend: number;
    volumeTrend: number;
    efficiencyTrend: number;
    diversificationTrend: number;
  }): number {
    const trends = [
      Math.abs(keyMetrics.activityTrend),
      Math.abs(keyMetrics.volumeTrend),
      Math.abs(keyMetrics.efficiencyTrend),
      Math.abs(keyMetrics.diversificationTrend)
    ];
    
    const avgTrendStrength = trends.reduce((sum, trend) => sum + trend, 0) / trends.length;
    return Math.min(1, avgTrendStrength);
  }

  private static generateTrendEvidence(
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING',
    keyMetrics: { activityTrend: number; volumeTrend: number; efficiencyTrend: number; diversificationTrend: number },
    periods: PeriodMetrics[]
  ): string[] {
    const evidence: string[] = [];
    
    if (Math.abs(keyMetrics.activityTrend) > 0.1) {
      const direction = keyMetrics.activityTrend > 0 ? 'increasing' : 'decreasing';
      evidence.push(`Transaction activity is ${direction} over time`);
    }
    
    if (Math.abs(keyMetrics.volumeTrend) > 0.1) {
      const direction = keyMetrics.volumeTrend > 0 ? 'growing' : 'declining';
      evidence.push(`Transaction volume is ${direction} over time`);
    }
    
    if (Math.abs(keyMetrics.efficiencyTrend) > 0.1) {
      const direction = keyMetrics.efficiencyTrend > 0 ? 'improving' : 'declining';
      evidence.push(`Gas efficiency is ${direction} over time`);
    }
    
    if (Math.abs(keyMetrics.diversificationTrend) > 0.1) {
      const direction = keyMetrics.diversificationTrend > 0 ? 'increasing' : 'decreasing';
      evidence.push(`Protocol diversification is ${direction} over time`);
    }
    
    if (periods.length > 0) {
      const recentPeriod = periods[periods.length - 1];
      const earliestPeriod = periods[0];
      
      const activityChange = ((recentPeriod.transactionCount - earliestPeriod.transactionCount) / earliestPeriod.transactionCount) * 100;
      if (Math.abs(activityChange) > 20) {
        evidence.push(`Recent activity ${activityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(activityChange).toFixed(1)}%`);
      }
    }
    
    return evidence.length > 0 ? evidence : [`Overall trend appears ${trend.toLowerCase()}`];
  }

  private static calculateTrendConfidence(periods: PeriodMetrics[], totalTransactions: number): number {
    let confidence = 70; // Base confidence
    
    // Adjust based on data quantity
    if (periods.length >= 4) confidence += 15;
    else if (periods.length >= 2) confidence += 5;
    else confidence -= 20;
    
    if (totalTransactions >= 20) confidence += 10;
    else if (totalTransactions >= 10) confidence += 5;
    else confidence -= 15;
    
    // Adjust based on period consistency
    if (periods.length > 1) {
      const periodLengths = periods.map(p => p.endTimestamp - p.startTimestamp);
      const avgLength = periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length;
      const lengthVariance = periodLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / periodLengths.length;
      const coefficientOfVariation = Math.sqrt(lengthVariance) / avgLength;
      
      if (coefficientOfVariation < 0.2) confidence += 10;
      else if (coefficientOfVariation > 0.5) confidence -= 10;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  private static generateTrendRecommendations(
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING',
    keyMetrics: { activityTrend: number; volumeTrend: number; efficiencyTrend: number; diversificationTrend: number }
  ): string[] {
    const recommendations: string[] = [];
    
    switch (trend) {
      case 'IMPROVING':
        recommendations.push('Continue current positive trajectory to maximize credit score growth');
        if (keyMetrics.efficiencyTrend < 0) {
          recommendations.push('Focus on gas optimization to enhance the improvement trend');
        }
        break;
        
      case 'STABLE':
        recommendations.push('Consider increasing activity frequency to move toward an improving trend');
        if (keyMetrics.diversificationTrend <= 0) {
          recommendations.push('Explore additional DeFi protocols to improve diversification');
        }
        break;
        
      case 'DECLINING':
        recommendations.push('Increase transaction frequency and volume to reverse the declining trend');
        recommendations.push('Review and optimize gas usage to improve efficiency metrics');
        if (keyMetrics.diversificationTrend < 0) {
          recommendations.push('Maintain or increase protocol diversification to prevent further decline');
        }
        break;
    }
    
    return recommendations;
  }

  // Private helper methods for consistency analysis

  private static generateBasicConsistencyAnalysis(metrics: UserMetrics): ConsistencyAnalysis {
    const transactionsPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    const baseScore = transactionsPerMonth > 5 ? 60 : transactionsPerMonth > 2 ? 40 : 20;
    
    return {
      overallScore: baseScore,
      components: {
        timingConsistency: baseScore,
        volumeConsistency: baseScore,
        frequencyConsistency: baseScore,
        behavioralConsistency: baseScore
      },
      stabilityIndicators: {
        activityStability: baseScore > 60 ? 'HIGH' : baseScore > 40 ? 'MEDIUM' : 'LOW',
        patternReliability: 'LOW',
        behavioralPredictability: 'LOW'
      },
      evidence: ['Limited transaction history for comprehensive consistency analysis'],
      recommendations: ['Increase transaction frequency to establish consistent patterns']
    };
  }

  private static analyzeTimingConsistency(transactions: TransactionData[]): number {
    if (transactions.length < 3) return 0;
    
    // Calculate intervals between transactions
    const intervals = [];
    for (let i = 1; i < transactions.length; i++) {
      intervals.push(transactions[i].timestamp - transactions[i-1].timestamp);
    }
    
    // Calculate coefficient of variation for intervals
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 0;
    
    // Convert to consistency score (lower variation = higher consistency)
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));
  }

  private static analyzeVolumeConsistency(transactions: TransactionData[]): number {
    if (transactions.length < 3) return 0;
    
    const volumes = transactions.map(tx => parseFloat(tx.value));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    
    if (avgVolume === 0) return 50; // Neutral score for zero volumes
    
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgVolume;
    
    // Convert to consistency score
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 30)));
  }

  private static analyzeFrequencyConsistency(transactions: TransactionData[]): number {
    if (transactions.length < 4) return 0;
    
    // Group transactions by week
    const weeklyGroups = new Map<number, number>();
    
    for (const tx of transactions) {
      const weekNumber = Math.floor(tx.timestamp / (7 * 24 * 60 * 60));
      weeklyGroups.set(weekNumber, (weeklyGroups.get(weekNumber) || 0) + 1);
    }
    
    const weeklyCounts = Array.from(weeklyGroups.values());
    
    if (weeklyCounts.length < 2) return 50;
    
    const avgWeeklyCount = weeklyCounts.reduce((sum, count) => sum + count, 0) / weeklyCounts.length;
    const variance = weeklyCounts.reduce((sum, count) => sum + Math.pow(count - avgWeeklyCount, 2), 0) / weeklyCounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgWeeklyCount > 0 ? stdDev / avgWeeklyCount : 0;
    
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 40)));
  }

  private static analyzeBehavioralConsistency(transactions: TransactionData[]): number {
    if (transactions.length < 5) return 0;
    
    // Analyze consistency in transaction types
    const typeGroups = new Map<string, number>();
    
    for (const tx of transactions) {
      const type = tx.isDeFi ? 'defi' : tx.isStaking ? 'staking' : 'transfer';
      typeGroups.set(type, (typeGroups.get(type) || 0) + 1);
    }
    
    const typeCounts = Array.from(typeGroups.values());
    const totalTxs = transactions.length;
    
    // Calculate entropy (higher entropy = less consistent behavior)
    let entropy = 0;
    for (const count of typeCounts) {
      const probability = count / totalTxs;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }
    
    // Convert entropy to consistency score (lower entropy = higher consistency)
    const maxEntropy = Math.log2(3); // Maximum entropy for 3 categories
    const normalizedEntropy = entropy / maxEntropy;
    
    return Math.max(0, Math.min(100, (1 - normalizedEntropy) * 100));
  }

  private static determineStabilityIndicators(
    timingConsistency: number,
    volumeConsistency: number,
    frequencyConsistency: number,
    behavioralConsistency: number
  ): {
    activityStability: 'HIGH' | 'MEDIUM' | 'LOW';
    patternReliability: 'HIGH' | 'MEDIUM' | 'LOW';
    behavioralPredictability: 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    
    const avgConsistency = (timingConsistency + frequencyConsistency) / 2;
    const activityStability = 
      avgConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH ? 'HIGH' :
      avgConsistency >= this.CONSISTENCY_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';
    
    const patternReliability = 
      timingConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH ? 'HIGH' :
      timingConsistency >= this.CONSISTENCY_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';
    
    const behavioralPredictability = 
      behavioralConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH ? 'HIGH' :
      behavioralConsistency >= this.CONSISTENCY_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';
    
    return {
      activityStability,
      patternReliability,
      behavioralPredictability
    };
  }

  private static generateConsistencyEvidence(
    timingConsistency: number,
    volumeConsistency: number,
    frequencyConsistency: number,
    behavioralConsistency: number
  ): string[] {
    const evidence: string[] = [];
    
    if (timingConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH) {
      evidence.push('Highly consistent transaction timing patterns');
    } else if (timingConsistency <= this.CONSISTENCY_THRESHOLDS.LOW) {
      evidence.push('Irregular transaction timing patterns');
    }
    
    if (volumeConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH) {
      evidence.push('Consistent transaction volume patterns');
    } else if (volumeConsistency <= this.CONSISTENCY_THRESHOLDS.LOW) {
      evidence.push('Highly variable transaction volumes');
    }
    
    if (frequencyConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH) {
      evidence.push('Stable transaction frequency over time');
    } else if (frequencyConsistency <= this.CONSISTENCY_THRESHOLDS.LOW) {
      evidence.push('Inconsistent transaction frequency patterns');
    }
    
    if (behavioralConsistency >= this.CONSISTENCY_THRESHOLDS.HIGH) {
      evidence.push('Consistent behavioral patterns across transaction types');
    } else if (behavioralConsistency <= this.CONSISTENCY_THRESHOLDS.LOW) {
      evidence.push('Variable behavioral patterns across different activities');
    }
    
    return evidence.length > 0 ? evidence : ['Mixed consistency patterns across different behavioral dimensions'];
  }

  private static generateConsistencyRecommendations(
    overallScore: number,
    stabilityIndicators: {
      activityStability: 'HIGH' | 'MEDIUM' | 'LOW';
      patternReliability: 'HIGH' | 'MEDIUM' | 'LOW';
      behavioralPredictability: 'HIGH' | 'MEDIUM' | 'LOW';
    }
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < this.CONSISTENCY_THRESHOLDS.MEDIUM) {
      recommendations.push('Establish more regular transaction patterns to improve consistency score');
    }
    
    if (stabilityIndicators.activityStability === 'LOW') {
      recommendations.push('Maintain more consistent transaction frequency to improve activity stability');
    }
    
    if (stabilityIndicators.patternReliability === 'LOW') {
      recommendations.push('Develop more predictable timing patterns for transactions');
    }
    
    if (stabilityIndicators.behavioralPredictability === 'LOW') {
      recommendations.push('Focus on consistent transaction types and volumes to improve behavioral predictability');
    }
    
    if (overallScore >= this.CONSISTENCY_THRESHOLDS.HIGH) {
      recommendations.push('Excellent consistency - maintain current behavioral patterns');
    }
    
    return recommendations.length > 0 ? recommendations : ['Continue current patterns to maintain consistency'];
  }

  // Private helper methods for timing analysis

  private static generateBasicTimingAnalysis(): TimingAnalysis {
    return {
      preferredHours: [],
      preferredDays: [],
      consistencyScore: 0,
      timezonePattern: 'UNKNOWN',
      peakActivityPeriods: [],
      seasonalPatterns: []
    };
  }

  private static analyzePreferredHours(transactions: TransactionData[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    for (const tx of transactions) {
      const hour = new Date(tx.timestamp * 1000).getHours();
      hourCounts[hour]++;
    }
    
    const maxCount = Math.max(...hourCounts);
    const threshold = maxCount * 0.7; // Hours with at least 70% of peak activity
    
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= threshold)
      .map(({ hour }) => hour);
  }

  private static analyzePreferredDays(transactions: TransactionData[]): number[] {
    const dayCounts = new Array(7).fill(0);
    
    for (const tx of transactions) {
      const day = new Date(tx.timestamp * 1000).getDay();
      dayCounts[day]++;
    }
    
    const maxCount = Math.max(...dayCounts);
    const threshold = maxCount * 0.7;
    
    return dayCounts
      .map((count, day) => ({ day, count }))
      .filter(({ count }) => count >= threshold)
      .map(({ day }) => day);
  }

  private static calculateTimingConsistency(transactions: TransactionData[]): number {
    if (transactions.length < 3) return 0;
    
    // Analyze hour-of-day consistency
    const hours = transactions.map(tx => new Date(tx.timestamp * 1000).getHours());
    const hourVariance = this.calculateCircularVariance(hours, 24);
    
    // Analyze day-of-week consistency
    const days = transactions.map(tx => new Date(tx.timestamp * 1000).getDay());
    const dayVariance = this.calculateCircularVariance(days, 7);
    
    // Combine variances into consistency score
    const hourConsistency = Math.max(0, 100 - (hourVariance * 100));
    const dayConsistency = Math.max(0, 100 - (dayVariance * 100));
    
    return (hourConsistency + dayConsistency) / 2;
  }

  private static calculateCircularVariance(values: number[], period: number): number {
    if (values.length === 0) return 1;
    
    // Convert to radians
    const radians = values.map(val => (val * 2 * Math.PI) / period);
    
    // Calculate mean direction
    const sumSin = radians.reduce((sum, rad) => sum + Math.sin(rad), 0);
    const sumCos = radians.reduce((sum, rad) => sum + Math.cos(rad), 0);
    
    const meanLength = Math.sqrt(sumSin * sumSin + sumCos * sumCos) / values.length;
    
    // Circular variance (0 = perfectly consistent, 1 = completely random)
    return 1 - meanLength;
  }

  private static determineTimezonePattern(transactions: TransactionData[]): 'CONSISTENT' | 'VARIABLE' | 'UNKNOWN' {
    if (transactions.length < 5) return 'UNKNOWN';
    
    const hours = transactions.map(tx => new Date(tx.timestamp * 1000).getHours());
    const hourVariance = this.calculateCircularVariance(hours, 24);
    
    if (hourVariance < 0.3) return 'CONSISTENT';
    if (hourVariance > 0.7) return 'VARIABLE';
    return 'CONSISTENT';
  }

  private static identifyPeakActivityPeriods(transactions: TransactionData[]): ActivityPeriod[] {
    if (transactions.length < 5) return [];
    
    const hourCounts = new Array(24).fill(0);
    const hourVolumes = new Array(24).fill(0);
    
    for (const tx of transactions) {
      const hour = new Date(tx.timestamp * 1000).getHours();
      hourCounts[hour]++;
      hourVolumes[hour] += parseFloat(tx.value);
    }
    
    const maxCount = Math.max(...hourCounts);
    const periods: ActivityPeriod[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const count = hourCounts[hour];
      const volume = hourVolumes[hour];
      
      if (count > 0) {
        let activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
        
        if (count >= maxCount * 0.8) activityLevel = 'PEAK';
        else if (count >= maxCount * 0.5) activityLevel = 'HIGH';
        else if (count >= maxCount * 0.2) activityLevel = 'MEDIUM';
        else activityLevel = 'LOW';
        
        if (activityLevel !== 'LOW') {
          periods.push({
            startHour: hour,
            endHour: (hour + 1) % 24,
            activityLevel,
            transactionCount: count,
            averageVolume: volume / count
          });
        }
      }
    }
    
    return periods;
  }

  private static analyzeSeasonalPatterns(transactions: TransactionData[]): SeasonalPattern[] {
    if (transactions.length < 14) return []; // Need at least 2 weeks of data
    
    const patterns: SeasonalPattern[] = [];
    
    // Daily pattern (24 hours)
    const dailyPattern = new Array(24).fill(0);
    for (const tx of transactions) {
      const hour = new Date(tx.timestamp * 1000).getHours();
      dailyPattern[hour]++;
    }
    
    const dailyMax = Math.max(...dailyPattern);
    if (dailyMax > 0) {
      const normalizedDaily = dailyPattern.map(count => (count / dailyMax) * 100);
      patterns.push({
        type: 'DAILY',
        pattern: normalizedDaily,
        confidence: Math.min(100, (transactions.length / 24) * 10),
        description: 'Hourly activity distribution throughout the day'
      });
    }
    
    // Weekly pattern (7 days)
    const weeklyPattern = new Array(7).fill(0);
    for (const tx of transactions) {
      const day = new Date(tx.timestamp * 1000).getDay();
      weeklyPattern[day]++;
    }
    
    const weeklyMax = Math.max(...weeklyPattern);
    if (weeklyMax > 0) {
      const normalizedWeekly = weeklyPattern.map(count => (count / weeklyMax) * 100);
      patterns.push({
        type: 'WEEKLY',
        pattern: normalizedWeekly,
        confidence: Math.min(100, (transactions.length / 7) * 5),
        description: 'Daily activity distribution throughout the week'
      });
    }
    
    return patterns;
  }

  // Private helper methods for diversification analysis

  private static analyzeProtocolDiversification(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): number {
    const protocolCount = metrics.defiProtocolsUsed.length;
    
    if (protocolCount === 0) return 0;
    if (protocolCount >= this.DIVERSIFICATION_THRESHOLDS.PROTOCOL_HIGH) return 100;
    if (protocolCount >= this.DIVERSIFICATION_THRESHOLDS.PROTOCOL_MEDIUM) return 60;
    return 30;
  }

  private static analyzeTransactionTypeDiversification(transactionHistory?: TransactionData[]): number {
    if (!transactionHistory || transactionHistory.length === 0) return 0;
    
    const typeSet = new Set<string>();
    
    for (const tx of transactionHistory) {
      if (tx.isDeFi) typeSet.add('defi');
      if (tx.isStaking) typeSet.add('staking');
      if (!tx.isDeFi && !tx.isStaking) typeSet.add('transfer');
    }
    
    const typeCount = typeSet.size;
    
    if (typeCount >= this.DIVERSIFICATION_THRESHOLDS.TRANSACTION_TYPE_HIGH) return 100;
    if (typeCount >= this.DIVERSIFICATION_THRESHOLDS.TRANSACTION_TYPE_MEDIUM) return 60;
    return typeCount > 0 ? 30 : 0;
  }

  private static analyzeTemporalDiversification(transactionHistory?: TransactionData[]): number {
    if (!transactionHistory || transactionHistory.length < 7) return 0;
    
    // Analyze distribution across different time periods
    const hourSet = new Set<number>();
    const daySet = new Set<number>();
    
    for (const tx of transactionHistory) {
      const date = new Date(tx.timestamp * 1000);
      hourSet.add(date.getHours());
      daySet.add(date.getDay());
    }
    
    const hourDiversity = (hourSet.size / 24) * 100;
    const dayDiversity = (daySet.size / 7) * 100;
    
    return (hourDiversity + dayDiversity) / 2;
  }

  private static analyzeValueDiversification(transactionHistory?: TransactionData[]): number {
    if (!transactionHistory || transactionHistory.length < 3) return 0;
    
    const values = transactionHistory.map(tx => parseFloat(tx.value)).filter(val => val > 0);
    
    if (values.length === 0) return 0;
    
    // Calculate coefficient of variation for transaction values
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgValue > 0 ? stdDev / avgValue : 0;
    
    // Higher variation = higher diversification (up to a point)
    return Math.min(100, coefficientOfVariation * 50);
  }

  private static determineDiversificationLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private static identifyConcentrationAreas(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ConcentrationAnalysis[] {
    const concentrationAreas: ConcentrationAnalysis[] = [];
    
    // Protocol concentration
    if (metrics.defiProtocolsUsed.length === 1) {
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 100,
        dominantCategory: metrics.defiProtocolsUsed[0],
        riskLevel: 'HIGH',
        description: 'All DeFi activity concentrated in a single protocol',
        recommendations: ['Diversify across multiple DeFi protocols to reduce concentration risk']
      });
    } else if (metrics.defiProtocolsUsed.length === 2) {
      concentrationAreas.push({
        area: 'PROTOCOL',
        concentrationLevel: 70,
        dominantCategory: `${metrics.defiProtocolsUsed.length} protocols`,
        riskLevel: 'MEDIUM',
        description: 'Limited protocol diversification',
        recommendations: ['Consider exploring additional DeFi protocols']
      });
    }
    
    // Transaction type concentration
    if (transactionHistory && transactionHistory.length > 0) {
      const defiCount = transactionHistory.filter(tx => tx.isDeFi).length;
      const stakingCount = transactionHistory.filter(tx => tx.isStaking).length;
      const transferCount = transactionHistory.length - defiCount - stakingCount;
      
      const total = transactionHistory.length;
      const defiRatio = defiCount / total;
      const stakingRatio = stakingCount / total;
      const transferRatio = transferCount / total;
      
      if (defiRatio > 0.8) {
        concentrationAreas.push({
          area: 'TRANSACTION_TYPE',
          concentrationLevel: Math.round(defiRatio * 100),
          dominantCategory: 'DeFi transactions',
          riskLevel: 'MEDIUM',
          description: 'High concentration in DeFi transactions',
          recommendations: ['Consider balancing with staking or other activities']
        });
      } else if (stakingRatio > 0.8) {
        concentrationAreas.push({
          area: 'TRANSACTION_TYPE',
          concentrationLevel: Math.round(stakingRatio * 100),
          dominantCategory: 'Staking transactions',
          riskLevel: 'LOW',
          description: 'High concentration in staking activities',
          recommendations: ['Staking concentration is generally low risk']
        });
      } else if (transferRatio > 0.8) {
        concentrationAreas.push({
          area: 'TRANSACTION_TYPE',
          concentrationLevel: Math.round(transferRatio * 100),
          dominantCategory: 'Simple transfers',
          riskLevel: 'MEDIUM',
          description: 'High concentration in basic transfers',
          recommendations: ['Explore DeFi and staking opportunities to improve score']
        });
      }
    }
    
    return concentrationAreas;
  }

  private static assessDiversificationRisk(
    score: number,
    concentrationAreas: ConcentrationAnalysis[]
  ): {
    concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    diversificationBenefit: number;
  } {
    
    let concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    
    const highRiskAreas = concentrationAreas.filter(area => area.riskLevel === 'HIGH').length;
    const mediumRiskAreas = concentrationAreas.filter(area => area.riskLevel === 'MEDIUM').length;
    
    if (highRiskAreas > 0) {
      concentrationRisk = 'HIGH';
    } else if (mediumRiskAreas > 1) {
      concentrationRisk = 'MEDIUM';
    } else if (mediumRiskAreas > 0) {
      concentrationRisk = 'MEDIUM';
    } else {
      concentrationRisk = 'LOW';
    }
    
    // Calculate diversification benefit (potential score improvement)
    const diversificationBenefit = Math.max(0, 100 - score);
    
    return {
      concentrationRisk,
      diversificationBenefit
    };
  }

  private static generateDiversificationRecommendations(
    level: 'LOW' | 'MEDIUM' | 'HIGH',
    concentrationAreas: ConcentrationAnalysis[],
    riskAssessment: { concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; diversificationBenefit: number }
  ): string[] {
    const recommendations: string[] = [];
    
    switch (level) {
      case 'LOW':
        recommendations.push('Significantly increase diversification across protocols and transaction types');
        recommendations.push('Explore multiple DeFi protocols to reduce concentration risk');
        break;
        
      case 'MEDIUM':
        recommendations.push('Continue improving diversification to reach high-level status');
        recommendations.push('Consider adding new protocol interactions to your portfolio');
        break;
        
      case 'HIGH':
        recommendations.push('Excellent diversification - maintain current variety');
        break;
    }
    
    // Add specific recommendations from concentration areas
    for (const area of concentrationAreas) {
      recommendations.push(...area.recommendations);
    }
    
    if (riskAssessment.diversificationBenefit > 20) {
      recommendations.push(`Improving diversification could increase your score by up to ${riskAssessment.diversificationBenefit.toFixed(0)} points`);
    }
    
    return recommendations;
  }
}

export default GrowthTrendAnalysisEngine;