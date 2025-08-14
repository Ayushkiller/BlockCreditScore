import { UserMetrics, TransactionData } from './blockchainService';
import { TransactionAnalysisEngine, TransactionAnalysis } from './transactionAnalysisEngine';
import { AnomalyDetectionEngine, AnomalyDetectionResult } from './anomalyDetectionEngine';

/**
 * Comprehensive Risk Assessment Interface
 * Implements multi-factor risk analysis as per requirements 2.1, 2.2, 2.3
 */
export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  confidence: number; // 0-100
  
  riskFactors: {
    concentrationRisk: RiskFactor;
    volatilityRisk: RiskFactor;
    inactivityRisk: RiskFactor;
    newAccountRisk: RiskFactor;
    anomalyRisk: RiskFactor;
    liquidityRisk: RiskFactor;
  };
  
  flags: {
    suspiciousActivity: boolean;
    washTrading: boolean;
    botBehavior: boolean;
    coordinatedActivity: boolean;
    unusualPatterns: boolean;
  };
  
  recommendations: RiskMitigationRecommendation[];
}

export interface RiskFactor {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  explanation: string;
  indicators: string[];
  mitigationSuggestions: string[];
  confidence: number; // 0-100
}

export interface RiskMitigationRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'DIVERSIFICATION' | 'ACTIVITY' | 'SECURITY' | 'BEHAVIORAL';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
}

export interface ConcentrationAnalysis {
  protocolConcentration: ProtocolConcentration[];
  transactionTypeConcentration: TransactionTypeConcentration[];
  temporalConcentration: TemporalConcentration[];
  overallConcentrationScore: number; // 0-100 (higher = more concentrated/risky)
}

export interface ProtocolConcentration {
  protocolName: string;
  transactionCount: number;
  volumePercentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface TransactionTypeConcentration {
  type: string;
  percentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface TemporalConcentration {
  period: string;
  transactionCount: number;
  percentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface VolatilityAnalysis {
  transactionVolumeVolatility: number; // 0-100
  transactionFrequencyVolatility: number; // 0-100
  gasPriceVolatility: number; // 0-100
  behavioralVolatility: number; // 0-100
  overallVolatilityScore: number; // 0-100
  volatilityTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  anomalousTransactions: TransactionData[];
}

export interface InactivityAnalysis {
  daysSinceLastTransaction: number;
  activityTrend: 'INCREASING' | 'STABLE' | 'DECLINING' | 'INACTIVE';
  activityScore: number; // 0-100 (higher = more active)
  inactivityRiskScore: number; // 0-100 (higher = more risky)
  projectedInactivityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reactivationRecommendations: string[];
}

/**
 * Comprehensive Risk Assessment Engine
 * Implements sophisticated risk analysis with multi-factor assessment
 */
export class RiskAssessmentEngine {
  
  // Risk scoring thresholds
  private static readonly RISK_THRESHOLDS = {
    CONCENTRATION: {
      PROTOCOL_HIGH_THRESHOLD: 0.7, // 70% in single protocol
      PROTOCOL_CRITICAL_THRESHOLD: 0.9, // 90% in single protocol
      TYPE_HIGH_THRESHOLD: 0.8, // 80% in single transaction type
      TEMPORAL_HIGH_THRESHOLD: 0.6 // 60% in single time period
    },
    VOLATILITY: {
      HIGH_VOLATILITY_THRESHOLD: 2.0, // Coefficient of variation
      CRITICAL_VOLATILITY_THRESHOLD: 3.0
    },
    INACTIVITY: {
      WARNING_DAYS: 30, // Days without activity to trigger warning
      HIGH_RISK_DAYS: 90, // Days without activity for high risk
      CRITICAL_DAYS: 180 // Days without activity for critical risk
    },
    NEW_ACCOUNT: {
      NEW_ACCOUNT_DAYS: 30, // Account age threshold for new account risk
      LIMITED_HISTORY_TRANSACTIONS: 10 // Transaction count threshold
    }
  };

  /**
   * Perform comprehensive risk assessment
   * Requirement 2.1: Calculate risk scores across multiple dimensions
   */
  public static async assessRisk(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<RiskAssessment> {
    
    // Perform advanced anomaly detection
    let anomalyDetectionResult: AnomalyDetectionResult | null = null;
    if (transactionHistory && transactionHistory.length > 0) {
      anomalyDetectionResult = await AnomalyDetectionEngine.detectAnomalies(address, metrics, transactionHistory);
    }

    // Calculate individual risk factors
    const concentrationRisk = this.assessConcentrationRisk(metrics, transactionHistory);
    const volatilityRisk = this.assessVolatilityRisk(metrics, transactionHistory);
    const inactivityRisk = this.assessInactivityRisk(metrics);
    const newAccountRisk = this.assessNewAccountRisk(metrics);
    const anomalyRisk = this.assessAnomalyRiskEnhanced(metrics, transactionHistory, anomalyDetectionResult);
    const liquidityRisk = this.assessLiquidityRisk(metrics, transactionHistory);
    
    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore({
      concentrationRisk,
      volatilityRisk,
      inactivityRisk,
      newAccountRisk,
      anomalyRisk,
      liquidityRisk
    });
    
    // Determine overall risk level
    const overallRisk = this.determineRiskLevel(overallRiskScore);
    
    // Detect suspicious activity flags using enhanced anomaly detection
    const flags = this.detectSuspiciousActivityEnhanced(metrics, transactionHistory, anomalyDetectionResult);
    
    // Generate risk mitigation recommendations
    const recommendations = this.generateRiskMitigationRecommendations({
      concentrationRisk,
      volatilityRisk,
      inactivityRisk,
      newAccountRisk,
      anomalyRisk,
      liquidityRisk
    });
    
    // Calculate confidence score
    const confidence = this.calculateRiskConfidence(metrics, transactionHistory);
    
    return {
      overallRisk,
      riskScore: overallRiskScore,
      confidence,
      riskFactors: {
        concentrationRisk,
        volatilityRisk,
        inactivityRisk,
        newAccountRisk,
        anomalyRisk,
        liquidityRisk
      },
      flags,
      recommendations
    };
  }

  /**
   * Assess concentration risk - identifies over-exposure to single protocols
   * Requirement 2.1: Concentration risk calculation
   */
  private static assessConcentrationRisk(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactor {
    
    const analysis = this.analyzeConcentration(metrics, transactionHistory);
    let riskScore = analysis.overallConcentrationScore;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    // Analyze protocol concentration
    const highConcentrationProtocols = analysis.protocolConcentration.filter(
      p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
    );
    
    if (highConcentrationProtocols.length > 0) {
      const maxConcentration = Math.max(...highConcentrationProtocols.map(p => p.volumePercentage));
      
      if (maxConcentration >= this.RISK_THRESHOLDS.CONCENTRATION.PROTOCOL_CRITICAL_THRESHOLD * 100) {
        riskLevel = 'CRITICAL';
        indicators.push(`Extreme concentration: ${maxConcentration.toFixed(1)}% of activity in single protocol`);
        mitigationSuggestions.push('Immediately diversify across multiple protocols to reduce concentration risk');
      } else if (maxConcentration >= this.RISK_THRESHOLDS.CONCENTRATION.PROTOCOL_HIGH_THRESHOLD * 100) {
        riskLevel = 'HIGH';
        indicators.push(`High concentration: ${maxConcentration.toFixed(1)}% of activity in single protocol`);
        mitigationSuggestions.push('Diversify protocol usage to reduce concentration risk');
      }
    }
    
    // Analyze transaction type concentration
    const highTypeConcentration = analysis.transactionTypeConcentration.filter(
      t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL'
    );
    
    if (highTypeConcentration.length > 0) {
      const maxTypeConcentration = Math.max(...highTypeConcentration.map(t => t.percentage));
      
      if (maxTypeConcentration >= this.RISK_THRESHOLDS.CONCENTRATION.TYPE_HIGH_THRESHOLD * 100) {
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        indicators.push(`High transaction type concentration: ${maxTypeConcentration.toFixed(1)}% in single type`);
        mitigationSuggestions.push('Diversify transaction types to improve risk profile');
      }
    }
    
    // Set minimum risk level based on diversification
    if (metrics.defiProtocolsUsed.length === 0) {
      riskLevel = 'MEDIUM';
      indicators.push('No DeFi protocol diversification detected');
      mitigationSuggestions.push('Consider exploring DeFi protocols for diversification');
    } else if (metrics.defiProtocolsUsed.length === 1) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      indicators.push('Limited protocol diversification (single DeFi protocol)');
      mitigationSuggestions.push('Expand to additional DeFi protocols for better diversification');
    }
    
    const explanation = this.generateConcentrationExplanation(analysis, riskLevel);
    
    return {
      level: riskLevel,
      score: riskScore,
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: this.calculateFactorConfidence('concentration', metrics, transactionHistory)
    };
  }

  /**
   * Assess volatility risk based on transaction pattern changes
   * Requirement 2.2: Volatility risk assessment
   */
  private static assessVolatilityRisk(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactor {
    
    const analysis = this.analyzeVolatility(metrics, transactionHistory);
    let riskScore = analysis.overallVolatilityScore;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    // Assess overall volatility
    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
      indicators.push('Extremely volatile transaction patterns detected');
      mitigationSuggestions.push('Establish more consistent transaction patterns to reduce volatility risk');
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
      indicators.push('High volatility in transaction patterns');
      mitigationSuggestions.push('Consider more regular transaction patterns to improve stability');
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
      indicators.push('Moderate volatility in transaction behavior');
      mitigationSuggestions.push('Monitor transaction patterns for consistency improvements');
    }
    
    // Specific volatility indicators
    if (analysis.transactionVolumeVolatility > 70) {
      indicators.push(`High transaction volume volatility (${analysis.transactionVolumeVolatility.toFixed(1)}%)`);
    }
    
    if (analysis.transactionFrequencyVolatility > 70) {
      indicators.push(`Irregular transaction frequency patterns (${analysis.transactionFrequencyVolatility.toFixed(1)}%)`);
    }
    
    if (analysis.gasPriceVolatility > 70) {
      indicators.push(`Inconsistent gas price optimization (${analysis.gasPriceVolatility.toFixed(1)}%)`);
    }
    
    // Trend analysis
    if (analysis.volatilityTrend === 'INCREASING') {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      indicators.push('Volatility trend is increasing over time');
      mitigationSuggestions.push('Focus on establishing more consistent behavioral patterns');
    }
    
    const explanation = this.generateVolatilityExplanation(analysis, riskLevel);
    
    return {
      level: riskLevel,
      score: riskScore,
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: this.calculateFactorConfidence('volatility', metrics, transactionHistory)
    };
  }

  /**
   * Assess inactivity risk for accounts with declining activity
   * Requirement 2.3: Inactivity risk scoring
   */
  private static assessInactivityRisk(metrics: UserMetrics): RiskFactor {
    
    const analysis = this.analyzeInactivity(metrics);
    let riskScore = analysis.inactivityRiskScore;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    // Assess based on days since last transaction
    if (analysis.daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.CRITICAL_DAYS) {
      riskLevel = 'CRITICAL';
      indicators.push(`No activity for ${analysis.daysSinceLastTransaction} days (critical inactivity)`);
      mitigationSuggestions.push('Immediate reactivation recommended to maintain account health');
    } else if (analysis.daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.HIGH_RISK_DAYS) {
      riskLevel = 'HIGH';
      indicators.push(`No activity for ${analysis.daysSinceLastTransaction} days (high inactivity risk)`);
      mitigationSuggestions.push('Consider resuming regular transaction activity');
    } else if (analysis.daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.WARNING_DAYS) {
      riskLevel = 'MEDIUM';
      indicators.push(`Reduced activity: ${analysis.daysSinceLastTransaction} days since last transaction`);
      mitigationSuggestions.push('Monitor activity levels to prevent further decline');
    }
    
    // Assess activity trend
    if (analysis.activityTrend === 'DECLINING') {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      indicators.push('Declining activity trend detected');
      mitigationSuggestions.push('Consider strategies to maintain or increase activity levels');
    } else if (analysis.activityTrend === 'INACTIVE') {
      riskLevel = 'HIGH';
      indicators.push('Account shows inactive status');
      mitigationSuggestions.push('Reactivation strongly recommended');
    }
    
    // Add reactivation recommendations
    mitigationSuggestions.push(...analysis.reactivationRecommendations);
    
    const explanation = this.generateInactivityExplanation(analysis, riskLevel);
    
    return {
      level: riskLevel,
      score: riskScore,
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: this.calculateFactorConfidence('inactivity', metrics)
    };
  }  /**

   * Assess new account risk factors
   * Requirement 2.3: New account risk assessment
   */
  private static assessNewAccountRisk(metrics: UserMetrics): RiskFactor {
    
    let riskScore = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    // Account age assessment
    if (metrics.accountAge <= this.RISK_THRESHOLDS.NEW_ACCOUNT.NEW_ACCOUNT_DAYS) {
      const ageRiskScore = Math.max(0, 100 - (metrics.accountAge / this.RISK_THRESHOLDS.NEW_ACCOUNT.NEW_ACCOUNT_DAYS) * 100);
      riskScore += ageRiskScore * 0.6; // 60% weight for age
      
      if (metrics.accountAge <= 7) {
        riskLevel = 'HIGH';
        indicators.push(`Very new account (${metrics.accountAge} days old)`);
        mitigationSuggestions.push('Build transaction history over time to establish credibility');
      } else if (metrics.accountAge <= 14) {
        riskLevel = 'MEDIUM';
        indicators.push(`New account (${metrics.accountAge} days old)`);
        mitigationSuggestions.push('Continue building consistent transaction patterns');
      } else {
        riskLevel = 'MEDIUM';
        indicators.push(`Relatively new account (${metrics.accountAge} days old)`);
        mitigationSuggestions.push('Maintain regular activity to establish track record');
      }
    }
    
    // Transaction history assessment
    if (metrics.totalTransactions <= this.RISK_THRESHOLDS.NEW_ACCOUNT.LIMITED_HISTORY_TRANSACTIONS) {
      const historyRiskScore = Math.max(0, 100 - (metrics.totalTransactions / this.RISK_THRESHOLDS.NEW_ACCOUNT.LIMITED_HISTORY_TRANSACTIONS) * 100);
      riskScore += historyRiskScore * 0.4; // 40% weight for transaction count
      
      if (metrics.totalTransactions <= 3) {
        if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
        indicators.push(`Very limited transaction history (${metrics.totalTransactions} transactions)`);
        mitigationSuggestions.push('Increase transaction frequency to build credibility');
      } else {
        indicators.push(`Limited transaction history (${metrics.totalTransactions} transactions)`);
        mitigationSuggestions.push('Continue building transaction history');
      }
    }
    
    // Volume assessment for new accounts
    const totalVolume = parseFloat(metrics.totalVolume);
    if (totalVolume < 0.1 && metrics.accountAge <= this.RISK_THRESHOLDS.NEW_ACCOUNT.NEW_ACCOUNT_DAYS) {
      riskScore += 20; // Additional risk for low volume new accounts
      indicators.push(`Low transaction volume for new account (${totalVolume.toFixed(4)} ETH)`);
      mitigationSuggestions.push('Gradually increase transaction volume to demonstrate activity');
    }
    
    const explanation = this.generateNewAccountExplanation(metrics, riskLevel);
    
    return {
      level: riskLevel,
      score: Math.round(riskScore),
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: this.calculateFactorConfidence('newAccount', metrics)
    };
  }

  /**
   * Enhanced anomaly risk assessment using AnomalyDetectionEngine
   * Requirement 2.1, 2.2: Advanced anomaly detection with statistical analysis
   */
  private static assessAnomalyRiskEnhanced(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[],
    anomalyDetectionResult?: AnomalyDetectionResult | null
  ): RiskFactor {
    
    if (!anomalyDetectionResult) {
      // Fallback to basic anomaly assessment
      return this.assessAnomalyRisk(metrics, transactionHistory);
    }

    const riskScore = anomalyDetectionResult.overallAnomalyScore;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];

    // Determine risk level based on overall anomaly score
    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
    }

    // Add indicators from anomaly detection
    if (anomalyDetectionResult.flags.hasStatisticalAnomalies) {
      indicators.push(`${anomalyDetectionResult.statisticalAnomalies.length} statistical anomalies detected`);
    }

    if (anomalyDetectionResult.flags.hasWashTrading) {
      indicators.push('Wash trading patterns identified');
      mitigationSuggestions.push('Review transaction legitimacy and avoid circular trading patterns');
    }

    if (anomalyDetectionResult.flags.hasBotBehavior) {
      indicators.push(`Bot behavior detected (${anomalyDetectionResult.botBehaviorDetection.botProbability.toFixed(1)}% probability)`);
      mitigationSuggestions.push('Ensure trading behavior appears natural and human-like');
    }

    if (anomalyDetectionResult.flags.hasCoordinatedActivity) {
      indicators.push('Coordinated activity patterns detected');
      mitigationSuggestions.push('Avoid synchronized trading patterns that suggest coordination');
    }

    // Add specific anomaly details
    anomalyDetectionResult.statisticalAnomalies.forEach(anomaly => {
      if (anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL') {
        indicators.push(anomaly.description);
      }
    });

    // Add recommendations from anomaly detection
    mitigationSuggestions.push(...anomalyDetectionResult.recommendations);

    const explanation = anomalyDetectionResult.riskExplanation;

    return {
      level: riskLevel,
      score: Math.round(riskScore),
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: anomalyDetectionResult.confidence
    };
  }

  /**
   * Legacy anomaly risk assessment (fallback)
   * Requirement 2.2: Anomaly detection
   */
  private static assessAnomalyRisk(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactor {
    
    let riskScore = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return {
        level: 'LOW',
        score: 0,
        explanation: 'No transaction history available for anomaly analysis',
        indicators: ['Insufficient data for anomaly detection'],
        mitigationSuggestions: ['Build transaction history for comprehensive risk assessment'],
        confidence: 0
      };
    }
    
    // Analyze transaction patterns for anomalies
    const temporalAnalysis = TransactionAnalysisEngine.analyzeTemporalPatterns(transactionHistory);
    
    // Check for anomalous transactions
    if (temporalAnalysis.anomalousTransactions.length > 0) {
      const anomalyRatio = temporalAnalysis.anomalousTransactions.length / transactionHistory.length;
      riskScore += anomalyRatio * 60; // Up to 60 points for anomalies
      
      if (anomalyRatio > 0.3) {
        riskLevel = 'HIGH';
        indicators.push(`High number of anomalous transactions (${(anomalyRatio * 100).toFixed(1)}%)`);
        mitigationSuggestions.push('Review transaction patterns for consistency');
      } else if (anomalyRatio > 0.1) {
        riskLevel = 'MEDIUM';
        indicators.push(`Some anomalous transactions detected (${(anomalyRatio * 100).toFixed(1)}%)`);
        mitigationSuggestions.push('Monitor transaction patterns for regularity');
      }
    }
    
    // Check for unusual gas price patterns
    const gasPrices = transactionHistory.map(tx => parseFloat(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    const gasVariance = gasPrices.reduce((sum, price) => sum + Math.pow(price - avgGasPrice, 2), 0) / gasPrices.length;
    const gasStdDev = Math.sqrt(gasVariance);
    const gasCoefficientOfVariation = avgGasPrice > 0 ? gasStdDev / avgGasPrice : 0;
    
    if (gasCoefficientOfVariation > 2) {
      riskScore += 25;
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      indicators.push('Highly variable gas price patterns detected');
      mitigationSuggestions.push('Consider more consistent gas price optimization strategies');
    }
    
    // Check for unusual volume patterns
    const volumes = transactionHistory.map(tx => parseFloat(tx.value));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volumeVariance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const volumeStdDev = Math.sqrt(volumeVariance);
    const volumeCoefficientOfVariation = avgVolume > 0 ? volumeStdDev / avgVolume : 0;
    
    if (volumeCoefficientOfVariation > 3) {
      riskScore += 20;
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      indicators.push('Highly variable transaction volume patterns');
      mitigationSuggestions.push('Consider more consistent transaction sizing');
    }
    
    // Check for burst patterns (potential bot behavior)
    if (temporalAnalysis.patternType === 'BURST') {
      riskScore += 30;
      if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
      indicators.push('Burst transaction patterns detected (potential automated behavior)');
      mitigationSuggestions.push('Ensure transaction patterns reflect natural user behavior');
    }
    
    const explanation = this.generateAnomalyExplanation(temporalAnalysis, riskLevel);
    
    return {
      level: riskLevel,
      score: Math.round(Math.min(100, riskScore)),
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: this.calculateFactorConfidence('anomaly', metrics, transactionHistory)
    };
  }

  /**
   * Assess liquidity risk based on transaction patterns
   */
  private static assessLiquidityRisk(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactor {
    
    let riskScore = 0;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const indicators: string[] = [];
    const mitigationSuggestions: string[] = [];
    
    // Assess staking ratio (high staking = lower liquidity)
    const totalVolume = parseFloat(metrics.totalVolume);
    const stakingBalance = parseFloat(metrics.stakingBalance);
    const stakingRatio = totalVolume > 0 ? stakingBalance / totalVolume : 0;
    
    if (stakingRatio > 0.8) {
      riskScore += 40;
      riskLevel = 'HIGH';
      indicators.push(`Very high staking ratio (${(stakingRatio * 100).toFixed(1)}%) may limit liquidity`);
      mitigationSuggestions.push('Consider maintaining some liquid assets for flexibility');
    } else if (stakingRatio > 0.6) {
      riskScore += 25;
      riskLevel = 'MEDIUM';
      indicators.push(`High staking ratio (${(stakingRatio * 100).toFixed(1)}%) may affect liquidity`);
      mitigationSuggestions.push('Monitor liquidity needs and staking commitments');
    }
    
    // Assess transaction frequency (low frequency = potential liquidity issues)
    const avgTransactionsPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    
    if (avgTransactionsPerMonth < 1 && metrics.accountAge > 30) {
      riskScore += 20;
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      indicators.push('Low transaction frequency may indicate liquidity constraints');
      mitigationSuggestions.push('Consider increasing transaction activity if liquidity allows');
    }
    
    // Assess DeFi protocol diversity (low diversity = potential liquidity concentration)
    if (metrics.defiProtocolsUsed.length === 0) {
      riskScore += 15;
      indicators.push('No DeFi protocol usage may limit liquidity options');
      mitigationSuggestions.push('Explore DeFi protocols for improved liquidity management');
    } else if (metrics.defiProtocolsUsed.length === 1) {
      riskScore += 10;
      indicators.push('Single DeFi protocol usage may limit liquidity flexibility');
      mitigationSuggestions.push('Diversify across multiple DeFi protocols for better liquidity');
    }
    
    const explanation = this.generateLiquidityExplanation(stakingRatio, avgTransactionsPerMonth, riskLevel);
    
    return {
      level: riskLevel,
      score: Math.round(Math.min(100, riskScore)),
      explanation,
      indicators,
      mitigationSuggestions,
      confidence: this.calculateFactorConfidence('liquidity', metrics, transactionHistory)
    };
  }

  /**
   * Calculate overall risk score from individual factors
   */
  private static calculateOverallRiskScore(riskFactors: {
    concentrationRisk: RiskFactor;
    volatilityRisk: RiskFactor;
    inactivityRisk: RiskFactor;
    newAccountRisk: RiskFactor;
    anomalyRisk: RiskFactor;
    liquidityRisk: RiskFactor;
  }): number {
    
    // Weight factors based on importance
    const weights = {
      concentrationRisk: 0.25,  // 25%
      volatilityRisk: 0.20,     // 20%
      inactivityRisk: 0.20,     // 20%
      newAccountRisk: 0.15,     // 15%
      anomalyRisk: 0.15,        // 15%
      liquidityRisk: 0.05       // 5%
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    // Calculate weighted average, adjusting for confidence
    Object.entries(riskFactors).forEach(([key, factor]) => {
      const weight = weights[key as keyof typeof weights];
      const confidenceAdjustedWeight = weight * (factor.confidence / 100);
      
      weightedScore += factor.score * confidenceAdjustedWeight;
      totalWeight += confidenceAdjustedWeight;
    });
    
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  /**
   * Determine overall risk level from score
   */
  private static determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Enhanced suspicious activity detection using AnomalyDetectionEngine
   * Requirement 2.2: Flag suspicious activities with advanced detection
   */
  private static detectSuspiciousActivityEnhanced(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[],
    anomalyDetectionResult?: AnomalyDetectionResult | null
  ): {
    suspiciousActivity: boolean;
    washTrading: boolean;
    botBehavior: boolean;
    coordinatedActivity: boolean;
    unusualPatterns: boolean;
  } {
    
    if (!anomalyDetectionResult) {
      // Fallback to basic detection
      return this.detectSuspiciousActivity(metrics, transactionHistory);
    }

    const flags = anomalyDetectionResult.flags;
    
    return {
      suspiciousActivity: flags.hasStatisticalAnomalies || flags.hasWashTrading || 
                         flags.hasBotBehavior || flags.hasCoordinatedActivity,
      washTrading: flags.hasWashTrading,
      botBehavior: flags.hasBotBehavior,
      coordinatedActivity: flags.hasCoordinatedActivity,
      unusualPatterns: flags.hasStatisticalAnomalies
    };
  }

  /**
   * Legacy suspicious activity detection (fallback)
   * Requirement 2.2: Flag suspicious activities
   */
  private static detectSuspiciousActivity(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): {
    suspiciousActivity: boolean;
    washTrading: boolean;
    botBehavior: boolean;
    coordinatedActivity: boolean;
    unusualPatterns: boolean;
  } {
    
    let suspiciousActivity = false;
    let washTrading = false;
    let botBehavior = false;
    let coordinatedActivity = false;
    let unusualPatterns = false;
    
    if (!transactionHistory || transactionHistory.length === 0) {
      return {
        suspiciousActivity,
        washTrading,
        botBehavior,
        coordinatedActivity,
        unusualPatterns
      };
    }
    
    // Detect wash trading patterns
    washTrading = this.detectWashTrading(transactionHistory);
    
    // Detect bot behavior
    botBehavior = this.detectBotBehavior(transactionHistory);
    
    // Detect coordinated activity
    coordinatedActivity = this.detectCoordinatedActivity(transactionHistory);
    
    // Detect unusual patterns
    unusualPatterns = this.detectUnusualPatterns(metrics, transactionHistory);
    
    // Overall suspicious activity flag
    suspiciousActivity = washTrading || botBehavior || coordinatedActivity || unusualPatterns;
    
    return {
      suspiciousActivity,
      washTrading,
      botBehavior,
      coordinatedActivity,
      unusualPatterns
    };
  }

  /**
   * Detect wash trading patterns
   */
  private static detectWashTrading(transactionHistory: TransactionData[]): boolean {
    // Look for rapid back-and-forth transactions with similar values
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedTxs.length - 1; i++) {
      const tx1 = sortedTxs[i];
      const tx2 = sortedTxs[i + 1];
      
      // Check if transactions are within 1 hour and have similar values
      const timeDiff = tx2.timestamp - tx1.timestamp;
      const value1 = parseFloat(tx1.value);
      const value2 = parseFloat(tx2.value);
      const valueDiff = Math.abs(value1 - value2) / Math.max(value1, value2);
      
      if (timeDiff < 3600 && valueDiff < 0.1 && value1 > 0.01) {
        return true; // Potential wash trading detected
      }
    }
    
    return false;
  }

  /**
   * Detect bot behavior patterns
   */
  private static detectBotBehavior(transactionHistory: TransactionData[]): boolean {
    if (transactionHistory.length < 5) return false;
    
    // Check for highly regular timing patterns (potential bot)
    const intervals = [];
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 1; i < sortedTxs.length; i++) {
      intervals.push(sortedTxs[i].timestamp - sortedTxs[i-1].timestamp);
    }
    
    // Calculate coefficient of variation for intervals
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 0;
    
    // Very low variation suggests bot behavior
    return coefficientOfVariation < 0.1 && intervals.length > 10;
  }

  /**
   * Detect coordinated activity
   */
  private static detectCoordinatedActivity(transactionHistory: TransactionData[]): boolean {
    // Look for patterns that suggest coordination with other accounts
    // This is a simplified implementation - in practice, would need cross-account analysis
    
    // Check for burst patterns with identical gas prices (potential coordination)
    const gasPriceGroups = new Map<string, number>();
    
    transactionHistory.forEach(tx => {
      const gasPrice = tx.gasPrice;
      gasPriceGroups.set(gasPrice, (gasPriceGroups.get(gasPrice) || 0) + 1);
    });
    
    // If more than 70% of transactions use the same gas price, it might indicate coordination
    const maxGasPriceCount = Math.max(...Array.from(gasPriceGroups.values()));
    const coordinationRatio = maxGasPriceCount / transactionHistory.length;
    
    return coordinationRatio > 0.7 && transactionHistory.length > 5;
  }

  /**
   * Detect unusual patterns
   */
  private static detectUnusualPatterns(
    metrics: UserMetrics,
    transactionHistory: TransactionData[]
  ): boolean {
    
    // Check for unusual volume-to-frequency ratios
    const avgTxValue = parseFloat(metrics.avgTransactionValue);
    const totalVolume = parseFloat(metrics.totalVolume);
    
    // Unusual pattern: very high volume with very few transactions
    if (metrics.totalTransactions < 5 && totalVolume > 10) {
      return true;
    }
    
    // Unusual pattern: many small transactions followed by one large transaction
    if (transactionHistory.length > 10) {
      const volumes = transactionHistory.map(tx => parseFloat(tx.value));
      const maxVolume = Math.max(...volumes);
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      
      if (maxVolume > avgVolume * 10) {
        return true;
      }
    }
    
    return false;
  }  
/**
   * Analyze concentration across protocols, transaction types, and time periods
   */
  private static analyzeConcentration(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): ConcentrationAnalysis {
    
    const protocolConcentration: ProtocolConcentration[] = [];
    const transactionTypeConcentration: TransactionTypeConcentration[] = [];
    const temporalConcentration: TemporalConcentration[] = [];
    
    // Analyze protocol concentration
    if (metrics.defiProtocolsUsed.length > 0) {
      const totalProtocolTxs = transactionHistory?.filter(tx => tx.isDeFi).length || 0;
      
      // For simplicity, assume equal distribution among protocols
      // In a real implementation, you'd track actual usage per protocol
      const avgProtocolUsage = totalProtocolTxs / metrics.defiProtocolsUsed.length;
      
      metrics.defiProtocolsUsed.forEach(protocol => {
        const usage = avgProtocolUsage; // Simplified - would need actual data
        const percentage = totalProtocolTxs > 0 ? (usage / totalProtocolTxs) * 100 : 0;
        
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (percentage >= 90) riskLevel = 'CRITICAL';
        else if (percentage >= 70) riskLevel = 'HIGH';
        else if (percentage >= 50) riskLevel = 'MEDIUM';
        
        protocolConcentration.push({
          protocolName: protocol,
          transactionCount: Math.round(usage),
          volumePercentage: percentage,
          riskLevel,
          description: `${percentage.toFixed(1)}% of DeFi activity in ${protocol}`
        });
      });
    }
    
    // Analyze transaction type concentration
    if (transactionHistory && transactionHistory.length > 0) {
      const typeCount = new Map<string, number>();
      
      transactionHistory.forEach(tx => {
        let type = 'TRANSFER';
        if (tx.isStaking) type = 'STAKING';
        else if (tx.isDeFi) type = 'DEFI';
        
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
      });
      
      typeCount.forEach((count, type) => {
        const percentage = (count / transactionHistory.length) * 100;
        
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (percentage >= 90) riskLevel = 'CRITICAL';
        else if (percentage >= 80) riskLevel = 'HIGH';
        else if (percentage >= 60) riskLevel = 'MEDIUM';
        
        transactionTypeConcentration.push({
          type,
          percentage,
          riskLevel,
          description: `${percentage.toFixed(1)}% of transactions are ${type.toLowerCase()}`
        });
      });
    }
    
    // Analyze temporal concentration (simplified - by month)
    if (transactionHistory && transactionHistory.length > 0) {
      const monthCount = new Map<string, number>();
      
      transactionHistory.forEach(tx => {
        const date = new Date(tx.timestamp * 1000);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthCount.set(monthKey, (monthCount.get(monthKey) || 0) + 1);
      });
      
      monthCount.forEach((count, month) => {
        const percentage = (count / transactionHistory.length) * 100;
        
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (percentage >= 70) riskLevel = 'HIGH';
        else if (percentage >= 50) riskLevel = 'MEDIUM';
        
        temporalConcentration.push({
          period: month,
          transactionCount: count,
          percentage,
          riskLevel,
          description: `${percentage.toFixed(1)}% of transactions in ${month}`
        });
      });
    }
    
    // Calculate overall concentration score
    const protocolRisk = protocolConcentration.length > 0 ? 
      Math.max(...protocolConcentration.map(p => p.volumePercentage)) : 0;
    const typeRisk = transactionTypeConcentration.length > 0 ? 
      Math.max(...transactionTypeConcentration.map(t => t.percentage)) : 0;
    const temporalRisk = temporalConcentration.length > 0 ? 
      Math.max(...temporalConcentration.map(t => t.percentage)) : 0;
    
    const overallConcentrationScore = Math.round((protocolRisk + typeRisk + temporalRisk) / 3);
    
    return {
      protocolConcentration,
      transactionTypeConcentration,
      temporalConcentration,
      overallConcentrationScore
    };
  }

  /**
   * Analyze volatility patterns
   */
  private static analyzeVolatility(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): VolatilityAnalysis {
    
    if (!transactionHistory || transactionHistory.length < 2) {
      return {
        transactionVolumeVolatility: 0,
        transactionFrequencyVolatility: 0,
        gasPriceVolatility: 0,
        behavioralVolatility: 0,
        overallVolatilityScore: 0,
        volatilityTrend: 'STABLE',
        anomalousTransactions: []
      };
    }
    
    // Calculate transaction volume volatility
    const volumes = transactionHistory.map(tx => parseFloat(tx.value));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volumeVariance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const volumeStdDev = Math.sqrt(volumeVariance);
    const volumeCV = avgVolume > 0 ? volumeStdDev / avgVolume : 0;
    const transactionVolumeVolatility = Math.min(100, volumeCV * 50);
    
    // Calculate transaction frequency volatility
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    const intervals = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      intervals.push(sortedTxs[i].timestamp - sortedTxs[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const intervalStdDev = Math.sqrt(intervalVariance);
    const intervalCV = avgInterval > 0 ? intervalStdDev / avgInterval : 0;
    const transactionFrequencyVolatility = Math.min(100, intervalCV * 50);
    
    // Calculate gas price volatility
    const gasPrices = transactionHistory.map(tx => parseFloat(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    const gasPriceVariance = gasPrices.reduce((sum, price) => sum + Math.pow(price - avgGasPrice, 2), 0) / gasPrices.length;
    const gasPriceStdDev = Math.sqrt(gasPriceVariance);
    const gasPriceCV = avgGasPrice > 0 ? gasPriceStdDev / avgGasPrice : 0;
    const gasPriceVolatility = Math.min(100, gasPriceCV * 50);
    
    // Calculate behavioral volatility (protocol switching)
    const protocolSwitches = this.calculateProtocolSwitches(transactionHistory);
    const behavioralVolatility = Math.min(100, protocolSwitches * 10);
    
    // Overall volatility score
    const overallVolatilityScore = Math.round(
      (transactionVolumeVolatility + transactionFrequencyVolatility + gasPriceVolatility + behavioralVolatility) / 4
    );
    
    // Determine volatility trend
    const recentTxs = sortedTxs.slice(-Math.min(10, Math.floor(sortedTxs.length / 2)));
    const olderTxs = sortedTxs.slice(0, Math.min(10, Math.floor(sortedTxs.length / 2)));
    
    const recentVolatility = this.calculatePeriodVolatility(recentTxs);
    const olderVolatility = this.calculatePeriodVolatility(olderTxs);
    
    let volatilityTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
    if (recentVolatility > olderVolatility * 1.2) {
      volatilityTrend = 'INCREASING';
    } else if (recentVolatility < olderVolatility * 0.8) {
      volatilityTrend = 'DECREASING';
    }
    
    // Identify anomalous transactions
    const temporalAnalysis = TransactionAnalysisEngine.analyzeTemporalPatterns(transactionHistory);
    const anomalousTransactions = temporalAnalysis.anomalousTransactions;
    
    return {
      transactionVolumeVolatility: Math.round(transactionVolumeVolatility),
      transactionFrequencyVolatility: Math.round(transactionFrequencyVolatility),
      gasPriceVolatility: Math.round(gasPriceVolatility),
      behavioralVolatility: Math.round(behavioralVolatility),
      overallVolatilityScore,
      volatilityTrend,
      anomalousTransactions
    };
  }

  /**
   * Analyze inactivity patterns
   */
  private static analyzeInactivity(metrics: UserMetrics): InactivityAnalysis {
    
    const currentTime = Math.floor(Date.now() / 1000);
    const daysSinceLastTransaction = Math.floor((currentTime - metrics.lastTransactionDate) / 86400);
    
    // Calculate activity score based on recent activity
    let activityScore = 100;
    if (daysSinceLastTransaction > 0) {
      activityScore = Math.max(0, 100 - (daysSinceLastTransaction * 2)); // Decrease by 2 points per day
    }
    
    // Determine activity trend
    let activityTrend: 'INCREASING' | 'STABLE' | 'DECLINING' | 'INACTIVE' = 'STABLE';
    
    if (daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.CRITICAL_DAYS) {
      activityTrend = 'INACTIVE';
    } else if (daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.HIGH_RISK_DAYS) {
      activityTrend = 'DECLINING';
    } else {
      // Simplified trend analysis based on transaction frequency
      const avgTransactionsPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
      
      if (avgTransactionsPerMonth < 1) {
        activityTrend = 'DECLINING';
      } else if (avgTransactionsPerMonth > 5) {
        activityTrend = 'INCREASING';
      }
    }
    
    // Calculate inactivity risk score
    let inactivityRiskScore = 0;
    
    if (daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.CRITICAL_DAYS) {
      inactivityRiskScore = 90;
    } else if (daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.HIGH_RISK_DAYS) {
      inactivityRiskScore = 70;
    } else if (daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.WARNING_DAYS) {
      inactivityRiskScore = 40;
    } else {
      inactivityRiskScore = Math.min(30, daysSinceLastTransaction * 2);
    }
    
    // Determine projected inactivity risk
    let projectedInactivityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (inactivityRiskScore >= 80) projectedInactivityRisk = 'CRITICAL';
    else if (inactivityRiskScore >= 60) projectedInactivityRisk = 'HIGH';
    else if (inactivityRiskScore >= 40) projectedInactivityRisk = 'MEDIUM';
    
    // Generate reactivation recommendations
    const reactivationRecommendations: string[] = [];
    
    if (daysSinceLastTransaction > 30) {
      reactivationRecommendations.push('Consider making a small transaction to reactivate the account');
    }
    
    if (metrics.defiProtocolsUsed.length === 0) {
      reactivationRecommendations.push('Explore DeFi protocols to increase activity and engagement');
    }
    
    if (parseFloat(metrics.stakingBalance) === 0) {
      reactivationRecommendations.push('Consider staking some ETH to maintain passive activity');
    }
    
    return {
      daysSinceLastTransaction,
      activityTrend,
      activityScore: Math.round(activityScore),
      inactivityRiskScore: Math.round(inactivityRiskScore),
      projectedInactivityRisk,
      reactivationRecommendations
    };
  }

  /**
   * Generate risk mitigation recommendations
   */
  private static generateRiskMitigationRecommendations(riskFactors: {
    concentrationRisk: RiskFactor;
    volatilityRisk: RiskFactor;
    inactivityRisk: RiskFactor;
    newAccountRisk: RiskFactor;
    anomalyRisk: RiskFactor;
    liquidityRisk: RiskFactor;
  }): RiskMitigationRecommendation[] {
    
    const recommendations: RiskMitigationRecommendation[] = [];
    
    // Concentration risk recommendations
    if (riskFactors.concentrationRisk.level === 'HIGH' || riskFactors.concentrationRisk.level === 'CRITICAL') {
      recommendations.push({
        priority: riskFactors.concentrationRisk.level === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        category: 'DIVERSIFICATION',
        title: 'Reduce Protocol Concentration Risk',
        description: 'Your activity is highly concentrated in a few protocols, which increases risk exposure.',
        actionItems: [
          'Explore additional DeFi protocols to diversify your activity',
          'Gradually redistribute activity across multiple protocols',
          'Research new protocols with good security track records'
        ],
        expectedImpact: 'Significantly reduce concentration risk and improve overall risk profile',
        timeframe: 'SHORT_TERM'
      });
    }
    
    // Volatility risk recommendations
    if (riskFactors.volatilityRisk.level === 'HIGH' || riskFactors.volatilityRisk.level === 'CRITICAL') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'BEHAVIORAL',
        title: 'Stabilize Transaction Patterns',
        description: 'Your transaction patterns show high volatility, which may indicate unpredictable behavior.',
        actionItems: [
          'Establish more regular transaction timing patterns',
          'Use consistent transaction sizes when possible',
          'Implement gas price optimization strategies'
        ],
        expectedImpact: 'Improve behavioral consistency and reduce volatility risk',
        timeframe: 'LONG_TERM'
      });
    }
    
    // Inactivity risk recommendations
    if (riskFactors.inactivityRisk.level === 'HIGH' || riskFactors.inactivityRisk.level === 'CRITICAL') {
      recommendations.push({
        priority: 'HIGH',
        category: 'ACTIVITY',
        title: 'Increase Account Activity',
        description: 'Your account shows signs of declining activity, which increases inactivity risk.',
        actionItems: [
          'Make regular transactions to maintain account activity',
          'Consider staking ETH for passive activity',
          'Explore DeFi protocols for ongoing engagement'
        ],
        expectedImpact: 'Reduce inactivity risk and improve credit score',
        timeframe: 'IMMEDIATE'
      });
    }
    
    // New account risk recommendations
    if (riskFactors.newAccountRisk.level === 'HIGH' || riskFactors.newAccountRisk.level === 'MEDIUM') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'ACTIVITY',
        title: 'Build Transaction History',
        description: 'As a new account, building consistent transaction history will improve your risk profile.',
        actionItems: [
          'Maintain regular transaction activity',
          'Gradually increase transaction volume over time',
          'Engage with reputable DeFi protocols'
        ],
        expectedImpact: 'Establish credibility and reduce new account risk over time',
        timeframe: 'LONG_TERM'
      });
    }
    
    // Anomaly risk recommendations
    if (riskFactors.anomalyRisk.level === 'HIGH' || riskFactors.anomalyRisk.level === 'CRITICAL') {
      recommendations.push({
        priority: 'HIGH',
        category: 'BEHAVIORAL',
        title: 'Address Unusual Patterns',
        description: 'Unusual transaction patterns have been detected that may indicate risky behavior.',
        actionItems: [
          'Review recent transaction patterns for consistency',
          'Avoid burst transaction patterns that may appear automated',
          'Maintain natural, human-like transaction timing'
        ],
        expectedImpact: 'Reduce anomaly flags and improve behavioral assessment',
        timeframe: 'IMMEDIATE'
      });
    }
    
    // Liquidity risk recommendations
    if (riskFactors.liquidityRisk.level === 'HIGH' || riskFactors.liquidityRisk.level === 'CRITICAL') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'DIVERSIFICATION',
        title: 'Improve Liquidity Management',
        description: 'Your asset allocation may limit liquidity and flexibility.',
        actionItems: [
          'Maintain some liquid assets for flexibility',
          'Consider unstaking some assets if over-concentrated in staking',
          'Diversify across liquid DeFi protocols'
        ],
        expectedImpact: 'Improve liquidity position and reduce liquidity risk',
        timeframe: 'SHORT_TERM'
      });
    }
    
    return recommendations;
  }  /*
*
   * Calculate confidence score for risk factor assessment
   */
  private static calculateFactorConfidence(
    factorType: 'concentration' | 'volatility' | 'inactivity' | 'newAccount' | 'anomaly' | 'liquidity',
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): number {
    
    let confidence = 50; // Base confidence
    
    switch (factorType) {
      case 'concentration':
        // Higher confidence with more DeFi activity
        if (metrics.defiProtocolsUsed.length > 0) confidence += 20;
        if (metrics.defiProtocolsUsed.length > 3) confidence += 15;
        if (transactionHistory && transactionHistory.length > 20) confidence += 15;
        break;
        
      case 'volatility':
        // Higher confidence with more transaction history
        if (transactionHistory && transactionHistory.length > 10) confidence += 25;
        if (transactionHistory && transactionHistory.length > 50) confidence += 15;
        if (metrics.accountAge > 30) confidence += 10;
        break;
        
      case 'inactivity':
        // Always high confidence for inactivity assessment
        confidence = 90;
        break;
        
      case 'newAccount':
        // Always high confidence for new account assessment
        confidence = 95;
        break;
        
      case 'anomaly':
        // Higher confidence with more data
        if (transactionHistory && transactionHistory.length > 20) confidence += 30;
        if (transactionHistory && transactionHistory.length > 50) confidence += 15;
        if (!transactionHistory || transactionHistory.length < 5) confidence = 20;
        break;
        
      case 'liquidity':
        // Higher confidence with staking and DeFi data
        if (parseFloat(metrics.stakingBalance) > 0) confidence += 25;
        if (metrics.defiProtocolsUsed.length > 0) confidence += 15;
        if (metrics.totalTransactions > 20) confidence += 10;
        break;
    }
    
    return Math.min(100, confidence);
  }

  /**
   * Calculate risk confidence based on data availability
   */
  private static calculateRiskConfidence(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): number {
    
    let confidence = 0;
    
    // Base confidence from account maturity (30% weight)
    const maturityScore = Math.min(100, (metrics.accountAge / 365) * 100);
    confidence += maturityScore * 0.3;
    
    // Transaction history depth (40% weight)
    const historyScore = transactionHistory ? 
      Math.min(100, (transactionHistory.length / 50) * 100) : 0;
    confidence += historyScore * 0.4;
    
    // Activity recency (20% weight)
    const daysSinceLastTx = (Date.now() / 1000 - metrics.lastTransactionDate) / 86400;
    const recencyScore = Math.max(0, 100 - (daysSinceLastTx * 2));
    confidence += recencyScore * 0.2;
    
    // Data completeness (10% weight)
    let completenessScore = 80; // Base completeness
    if (parseFloat(metrics.stakingBalance) > 0) completenessScore += 10;
    if (metrics.defiProtocolsUsed.length > 0) completenessScore += 10;
    confidence += completenessScore * 0.1;
    
    return Math.round(Math.max(0, Math.min(100, confidence)));
  }

  /**
   * Helper method to calculate protocol switches
   */
  private static calculateProtocolSwitches(transactionHistory: TransactionData[]): number {
    if (transactionHistory.length < 2) return 0;
    
    const sortedTxs = [...transactionHistory].sort((a, b) => a.timestamp - b.timestamp);
    let switches = 0;
    let lastProtocol = '';
    
    for (const tx of sortedTxs) {
      const currentProtocol = tx.protocolName || 'unknown';
      if (lastProtocol && lastProtocol !== currentProtocol) {
        switches++;
      }
      lastProtocol = currentProtocol;
    }
    
    return switches;
  }

  /**
   * Helper method to calculate volatility for a period
   */
  private static calculatePeriodVolatility(transactions: TransactionData[]): number {
    if (transactions.length < 2) return 0;
    
    const volumes = transactions.map(tx => parseFloat(tx.value));
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    
    return avgVolume > 0 ? stdDev / avgVolume : 0;
  }

  /**
   * Generate explanation for concentration risk
   */
  private static generateConcentrationExplanation(
    analysis: ConcentrationAnalysis,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string {
    
    const highRiskProtocols = analysis.protocolConcentration.filter(p => 
      p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
    );
    
    if (highRiskProtocols.length > 0) {
      const maxConcentration = Math.max(...highRiskProtocols.map(p => p.volumePercentage));
      return `High concentration risk detected with ${maxConcentration.toFixed(1)}% of activity concentrated in a single protocol. This creates significant exposure to protocol-specific risks and reduces diversification benefits.`;
    }
    
    if (analysis.protocolConcentration.length === 0) {
      return 'No DeFi protocol activity detected, which limits diversification opportunities and may indicate concentration in basic transfers only.';
    }
    
    return 'Concentration risk is within acceptable levels with reasonable diversification across protocols and transaction types.';
  }

  /**
   * Generate explanation for volatility risk
   */
  private static generateVolatilityExplanation(
    analysis: VolatilityAnalysis,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string {
    
    const highVolatilityFactors = [];
    
    if (analysis.transactionVolumeVolatility > 60) {
      highVolatilityFactors.push('transaction volumes');
    }
    
    if (analysis.transactionFrequencyVolatility > 60) {
      highVolatilityFactors.push('transaction timing');
    }
    
    if (analysis.gasPriceVolatility > 60) {
      highVolatilityFactors.push('gas price patterns');
    }
    
    if (analysis.behavioralVolatility > 60) {
      highVolatilityFactors.push('protocol usage patterns');
    }
    
    if (highVolatilityFactors.length > 0) {
      return `High volatility detected in ${highVolatilityFactors.join(', ')}. This indicates unpredictable behavior patterns that may suggest higher risk or automated activity.`;
    }
    
    if (analysis.volatilityTrend === 'INCREASING') {
      return 'Volatility is increasing over time, which may indicate changing behavior patterns or increased risk-taking activity.';
    }
    
    return 'Transaction patterns show acceptable volatility levels with consistent behavioral patterns.';
  }

  /**
   * Generate explanation for inactivity risk
   */
  private static generateInactivityExplanation(
    analysis: InactivityAnalysis,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string {
    
    if (analysis.daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.CRITICAL_DAYS) {
      return `Critical inactivity risk: No transactions for ${analysis.daysSinceLastTransaction} days. Extended inactivity may indicate account abandonment or security issues.`;
    }
    
    if (analysis.daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.HIGH_RISK_DAYS) {
      return `High inactivity risk: ${analysis.daysSinceLastTransaction} days without activity. This level of inactivity may negatively impact creditworthiness assessment.`;
    }
    
    if (analysis.daysSinceLastTransaction >= this.RISK_THRESHOLDS.INACTIVITY.WARNING_DAYS) {
      return `Moderate inactivity detected: ${analysis.daysSinceLastTransaction} days since last transaction. Consider resuming regular activity to maintain account health.`;
    }
    
    if (analysis.activityTrend === 'DECLINING') {
      return 'Activity trend is declining, which may indicate reduced engagement or changing usage patterns.';
    }
    
    return 'Account shows healthy activity levels with acceptable transaction frequency.';
  }

  /**
   * Generate explanation for new account risk
   */
  private static generateNewAccountExplanation(
    metrics: UserMetrics,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string {
    
    if (metrics.accountAge <= 7) {
      return `Very new account (${metrics.accountAge} days old) with limited transaction history (${metrics.totalTransactions} transactions). New accounts inherently carry higher risk due to lack of established behavioral patterns.`;
    }
    
    if (metrics.accountAge <= 30) {
      return `New account (${metrics.accountAge} days old) still building transaction history. Risk will decrease as the account establishes consistent behavioral patterns over time.`;
    }
    
    if (metrics.totalTransactions <= this.RISK_THRESHOLDS.NEW_ACCOUNT.LIMITED_HISTORY_TRANSACTIONS) {
      return `Limited transaction history (${metrics.totalTransactions} transactions) despite account age. More activity is needed to establish reliable behavioral patterns.`;
    }
    
    return 'Account has sufficient age and transaction history to establish reliable risk assessment.';
  }

  /**
   * Generate explanation for anomaly risk
   */
  private static generateAnomalyExplanation(
    temporalAnalysis: any,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string {
    
    if (temporalAnalysis.anomalousTransactions && temporalAnalysis.anomalousTransactions.length > 0) {
      const anomalyCount = temporalAnalysis.anomalousTransactions.length;
      return `${anomalyCount} anomalous transaction${anomalyCount > 1 ? 's' : ''} detected that deviate significantly from normal patterns. This may indicate unusual behavior or potential automated activity.`;
    }
    
    if (temporalAnalysis.patternType === 'BURST') {
      return 'Burst transaction patterns detected, which may indicate automated or coordinated activity rather than natural user behavior.';
    }
    
    return 'Transaction patterns appear normal with no significant anomalies detected.';
  }

  /**
   * Generate explanation for liquidity risk
   */
  private static generateLiquidityExplanation(
    stakingRatio: number,
    avgTransactionsPerMonth: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string {
    
    if (stakingRatio > 0.8) {
      return `Very high staking ratio (${(stakingRatio * 100).toFixed(1)}%) may significantly limit liquidity and flexibility for immediate transactions or market opportunities.`;
    }
    
    if (stakingRatio > 0.6) {
      return `High staking ratio (${(stakingRatio * 100).toFixed(1)}%) may affect liquidity. Consider maintaining some liquid assets for flexibility.`;
    }
    
    if (avgTransactionsPerMonth < 1) {
      return 'Low transaction frequency may indicate liquidity constraints or limited active asset management.';
    }
    
    return 'Liquidity position appears adequate with reasonable balance between staked and liquid assets.';
  }
}

export default RiskAssessmentEngine;