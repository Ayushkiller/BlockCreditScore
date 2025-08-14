import { RiskAssessmentEngine, RiskAssessment, RiskMitigationRecommendation, RiskFactor } from './riskAssessmentEngine';
import { AnomalyDetectionEngine, AnomalyDetectionResult } from './anomalyDetectionEngine';
import { RiskMonitoringService, RiskMonitoringAlert, RiskTrend } from './riskMonitoringService';
import { DatabaseService } from './databaseService';
import { UserMetrics, TransactionData } from './blockchainService';

/**
 * Comprehensive Risk Mitigation Service
 * Integrates risk assessment, anomaly detection, and monitoring for complete risk management
 * Implements requirements 2.3, 2.4, 2.5
 */

export interface EnhancedRiskMitigationRecommendation extends RiskMitigationRecommendation {
  id: string;
  riskFactorTargeted: string[];
  confidenceScore: number; // 0-100
  impactPrediction: {
    expectedRiskReduction: number; // 0-100
    timeToImpact: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  trackingMetrics: string[];
  prerequisites: string[];
  alternativeActions: string[];
}

export interface RiskFactorExplanation {
  factorName: string;
  currentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  detailedReasoning: string;
  contributingFactors: string[];
  historicalContext: string;
  comparisonToPeers: string;
  improvementPotential: number; // 0-100
  keyMetrics: {
    name: string;
    value: string;
    benchmark: string;
    status: 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  }[];
}

export interface ComprehensiveRiskReport {
  address: string;
  timestamp: number;
  
  // Core assessments
  riskAssessment: RiskAssessment;
  anomalyDetection: AnomalyDetectionResult;
  
  // Risk mitigation
  mitigationRecommendations: EnhancedRiskMitigationRecommendation[];
  riskFactorExplanations: RiskFactorExplanation[];  

  // Monitoring and tracking
  riskTrend: RiskTrend;
  monitoringAlerts: RiskMonitoringAlert[];
  
  // Confidence and quality metrics
  overallConfidence: number; // 0-100
  dataQuality: {
    completeness: number; // 0-100
    freshness: number; // 0-100
    accuracy: number; // 0-100
  };
  
  // Recommendations summary
  priorityActions: string[];
  quickWins: string[];
  longTermStrategy: string[];
}

export interface RiskMitigationProgress {
  recommendationId: string;
  address: string;
  startDate: number;
  currentProgress: number; // 0-100
  milestones: {
    name: string;
    completed: boolean;
    completedDate?: number;
    impact: string;
  }[];
  measuredImpact: {
    riskScoreChange: number;
    specificImprovements: string[];
  };
}

/**
 * Comprehensive Risk Mitigation Service
 * Provides intelligent risk mitigation recommendations with detailed explanations and tracking
 */
export class RiskMitigationService {
  
  /**
   * Generate comprehensive risk report with mitigation recommendations
   * Requirement 2.3: Risk mitigation recommendation system
   */
  public static async generateComprehensiveRiskReport(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<ComprehensiveRiskReport> {
    
    // Perform risk assessment
    const riskAssessment = await RiskAssessmentEngine.assessRisk(address, metrics, transactionHistory);
    
    // Perform anomaly detection
    let anomalyDetection: AnomalyDetectionResult;
    if (transactionHistory && transactionHistory.length > 0) {
      anomalyDetection = await AnomalyDetectionEngine.detectAnomalies(address, metrics, transactionHistory);
    } else {
      anomalyDetection = this.createEmptyAnomalyResult(address);
    }
    
    // Generate enhanced mitigation recommendations
    const mitigationRecommendations = await this.generateEnhancedMitigationRecommendations(
      riskAssessment, 
      anomalyDetection, 
      metrics
    );
    
    // Generate detailed risk factor explanations
    const riskFactorExplanations = await this.generateRiskFactorExplanations(
      riskAssessment, 
      metrics, 
      transactionHistory
    );
    
    // Get risk trend analysis
    const riskTrend = await RiskMonitoringService.calculateRiskTrend(address, 'WEEKLY');
    
    // Get recent monitoring alerts
    const monitoringAlerts = await this.getRecentMonitoringAlerts(address);
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(riskAssessment, anomalyDetection, metrics);
    
    // Assess data quality
    const dataQuality = this.assessDataQuality(metrics, transactionHistory);
    
    // Generate action summaries
    const { priorityActions, quickWins, longTermStrategy } = this.categorizeRecommendations(mitigationRecommendations);
    
    return {
      address,
      timestamp: Date.now(),
      riskAssessment,
      anomalyDetection,
      mitigationRecommendations,
      riskFactorExplanations,
      riskTrend,
      monitoringAlerts,
      overallConfidence,
      dataQuality,
      priorityActions,
      quickWins,
      longTermStrategy
    };
  }

  /**
   * Generate enhanced mitigation recommendations with detailed impact analysis
   * Requirement 2.3: Implement RiskMitigationRecommendation generation based on identified risks
   */
  private static async generateEnhancedMitigationRecommendations(
    riskAssessment: RiskAssessment,
    anomalyDetection: AnomalyDetectionResult,
    metrics: UserMetrics
  ): Promise<EnhancedRiskMitigationRecommendation[]> {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    // Process each risk factor
    Object.entries(riskAssessment.riskFactors).forEach(([factorName, factor]) => {
      if (factor.level === 'HIGH' || factor.level === 'CRITICAL') {
        const factorRecommendations = this.generateFactorSpecificRecommendations(
          factorName, 
          factor, 
          metrics
        );
        recommendations.push(...factorRecommendations);
      }
    });
    
    // Add anomaly-specific recommendations
    if (anomalyDetection.flags.hasStatisticalAnomalies || 
        anomalyDetection.flags.hasWashTrading || 
        anomalyDetection.flags.hasBotBehavior) {
      
      const anomalyRecommendations = this.generateAnomalySpecificRecommendations(
        anomalyDetection, 
        metrics
      );
      recommendations.push(...anomalyRecommendations);
    }
    
    // Add general improvement recommendations
    const generalRecommendations = this.generateGeneralImprovementRecommendations(
      riskAssessment, 
      metrics
    );
    recommendations.push(...generalRecommendations);
    
    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.impactPrediction.expectedRiskReduction - a.impactPrediction.expectedRiskReduction;
    });
  }

  /**
   * Generate factor-specific recommendations
   */
  private static generateFactorSpecificRecommendations(
    factorName: string,
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    switch (factorName) {
      case 'concentrationRisk':
        recommendations.push(...this.generateConcentrationRecommendations(factor, metrics));
        break;
      case 'volatilityRisk':
        recommendations.push(...this.generateVolatilityRecommendations(factor, metrics));
        break;
      case 'inactivityRisk':
        recommendations.push(...this.generateInactivityRecommendations(factor, metrics));
        break;
      case 'newAccountRisk':
        recommendations.push(...this.generateNewAccountRecommendations(factor, metrics));
        break;
      case 'anomalyRisk':
        recommendations.push(...this.generateAnomalyRiskRecommendations(factor, metrics));
        break;
      case 'liquidityRisk':
        recommendations.push(...this.generateLiquidityRecommendations(factor, metrics));
        break;
    }
    
    return recommendations;
  }

  /**
   * Generate concentration risk recommendations
   */
  private static generateConcentrationRecommendations(
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    if (metrics.defiProtocolsUsed.length <= 1) {
      recommendations.push({
        id: `concentration-diversify-${Date.now()}`,
        priority: 'HIGH',
        category: 'DIVERSIFICATION',
        title: 'Diversify DeFi Protocol Usage',
        description: 'Spread your activity across multiple DeFi protocols to reduce concentration risk and improve your risk profile.',
        actionItems: [
          'Research and identify 2-3 additional reputable DeFi protocols',
          'Start with small transactions to test new protocols',
          'Gradually increase activity on new protocols',
          'Maintain regular activity across all protocols'
        ],
        expectedImpact: 'Significant reduction in concentration risk (20-40 point improvement)',
        timeframe: 'SHORT_TERM',
        riskFactorTargeted: ['concentrationRisk'],
        confidenceScore: 85,
        impactPrediction: {
          expectedRiskReduction: 35,
          timeToImpact: 'SHORT_TERM',
          implementationComplexity: 'MEDIUM'
        },
        trackingMetrics: [
          'Number of DeFi protocols used',
          'Distribution of transaction volume across protocols',
          'Concentration risk score'
        ],
        prerequisites: [
          'Research protocol security and reputation',
          'Understand protocol mechanics and risks'
        ],
        alternativeActions: [
          'Focus on different transaction types within current protocol',
          'Increase staking diversification'
        ]
      });
    }
    
    const stakingRatio = parseFloat(metrics.stakingBalance) / parseFloat(metrics.totalVolume);
    if (stakingRatio > 0.8) {
      recommendations.push({
        id: `concentration-staking-${Date.now()}`,
        priority: 'MEDIUM',
        category: 'DIVERSIFICATION',
        title: 'Balance Staking and Liquid Assets',
        description: 'Reduce over-concentration in staking by maintaining more liquid assets for flexibility.',
        actionItems: [
          'Gradually reduce staking percentage to 60-70% of portfolio',
          'Maintain liquid assets for transaction flexibility',
          'Consider unstaking some positions if possible',
          'Diversify staking across multiple validators or protocols'
        ],
        expectedImpact: 'Moderate reduction in concentration and liquidity risk',
        timeframe: 'MEDIUM_TERM',
        riskFactorTargeted: ['concentrationRisk', 'liquidityRisk'],
        confidenceScore: 75,
        impactPrediction: {
          expectedRiskReduction: 25,
          timeToImpact: 'MEDIUM_TERM',
          implementationComplexity: 'MEDIUM'
        },
        trackingMetrics: [
          'Staking ratio',
          'Liquid asset percentage',
          'Staking diversification'
        ],
        prerequisites: [
          'Understand unstaking periods and penalties',
          'Plan for liquidity needs'
        ],
        alternativeActions: [
          'Use liquid staking derivatives',
          'Implement gradual rebalancing strategy'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate volatility risk recommendations
   */
  private static generateVolatilityRecommendations(
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    recommendations.push({
      id: `volatility-consistency-${Date.now()}`,
      priority: 'HIGH',
      category: 'BEHAVIORAL',
      title: 'Establish Consistent Transaction Patterns',
      description: 'Reduce volatility risk by developing more regular and predictable transaction patterns.',
      actionItems: [
        'Set a regular schedule for DeFi activities',
        'Maintain consistent transaction sizes when possible',
        'Use dollar-cost averaging for larger investments',
        'Avoid large, irregular transactions that spike volatility'
      ],
      expectedImpact: 'Significant improvement in behavioral consistency scoring',
      timeframe: 'SHORT_TERM',
      riskFactorTargeted: ['volatilityRisk'],
      confidenceScore: 80,
      impactPrediction: {
        expectedRiskReduction: 30,
        timeToImpact: 'SHORT_TERM',
        implementationComplexity: 'LOW'
      },
      trackingMetrics: [
        'Transaction frequency consistency',
        'Volume volatility coefficient',
        'Behavioral pattern regularity'
      ],
      prerequisites: [
        'Plan regular DeFi activity schedule',
        'Set transaction size guidelines'
      ],
      alternativeActions: [
        'Use automated DeFi strategies',
        'Implement gradual position building'
      ]
    });
    
    return recommendations;
  }

  /**
   * Generate inactivity risk recommendations
   */
  private static generateInactivityRecommendations(
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    const daysSinceLastTx = Math.floor((Date.now() - metrics.lastTransactionTime) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastTx > 30) {
      recommendations.push({
        id: `inactivity-reactivate-${Date.now()}`,
        priority: 'HIGH',
        category: 'ACTIVITY',
        title: 'Reactivate Account with Regular Transactions',
        description: 'Resume regular on-chain activity to improve your activity score and reduce inactivity risk.',
        actionItems: [
          'Perform at least one transaction per week',
          'Start with small, low-risk transactions',
          'Gradually increase activity frequency',
          'Consider setting up automated DeFi strategies'
        ],
        expectedImpact: 'Major improvement in activity and consistency scores',
        timeframe: 'IMMEDIATE',
        riskFactorTargeted: ['inactivityRisk'],
        confidenceScore: 90,
        impactPrediction: {
          expectedRiskReduction: 50,
          timeToImpact: 'IMMEDIATE',
          implementationComplexity: 'LOW'
        },
        trackingMetrics: [
          'Days since last transaction',
          'Transaction frequency',
          'Activity trend'
        ],
        prerequisites: [
          'Ensure wallet security',
          'Plan sustainable activity level'
        ],
        alternativeActions: [
          'Set up recurring DeFi positions',
          'Use automated yield farming strategies'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate new account recommendations
   */
  private static generateNewAccountRecommendations(
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    if (metrics.accountAge < 30) {
      recommendations.push({
        id: `newaccount-history-${Date.now()}`,
        priority: 'MEDIUM',
        category: 'ACTIVITY',
        title: 'Build Consistent Transaction History',
        description: 'Establish a strong track record through regular, diverse on-chain activities.',
        actionItems: [
          'Maintain regular transaction activity (2-3 times per week)',
          'Gradually increase transaction volume over time',
          'Explore different DeFi protocols and services',
          'Build a diverse transaction history across multiple categories'
        ],
        expectedImpact: 'Gradual improvement as account matures and history builds',
        timeframe: 'LONG_TERM',
        riskFactorTargeted: ['newAccountRisk'],
        confidenceScore: 70,
        impactPrediction: {
          expectedRiskReduction: 40,
          timeToImpact: 'LONG_TERM',
          implementationComplexity: 'LOW'
        },
        trackingMetrics: [
          'Account age',
          'Total transaction count',
          'Transaction diversity'
        ],
        prerequisites: [
          'Understand DeFi risks and best practices',
          'Start with small amounts'
        ],
        alternativeActions: [
          'Focus on quality over quantity of transactions',
          'Participate in governance activities'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate anomaly risk recommendations
   */
  private static generateAnomalyRiskRecommendations(
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    recommendations.push({
      id: `anomaly-patterns-${Date.now()}`,
      priority: 'HIGH',
      category: 'BEHAVIORAL',
      title: 'Normalize Transaction Patterns',
      description: 'Address unusual transaction patterns that may be flagged as anomalous behavior.',
      actionItems: [
        'Review recent transactions for unusual patterns',
        'Avoid burst transactions or coordinated activities',
        'Maintain human-like transaction timing',
        'Ensure transaction purposes are clear and legitimate'
      ],
      expectedImpact: 'Reduction in anomaly flags and improved behavioral scoring',
      timeframe: 'SHORT_TERM',
      riskFactorTargeted: ['anomalyRisk'],
      confidenceScore: 75,
      impactPrediction: {
        expectedRiskReduction: 35,
        timeToImpact: 'SHORT_TERM',
        implementationComplexity: 'MEDIUM'
      },
      trackingMetrics: [
        'Anomaly detection score',
        'Pattern regularity',
        'Behavioral consistency'
      ],
      prerequisites: [
        'Review transaction history',
        'Understand normal user patterns'
      ],
      alternativeActions: [
        'Space out transactions more naturally',
        'Vary transaction amounts and timing'
      ]
    });
    
    return recommendations;
  }

  /**
   * Generate liquidity risk recommendations
   */
  private static generateLiquidityRecommendations(
    factor: RiskFactor,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    const stakingRatio = parseFloat(metrics.stakingBalance) / parseFloat(metrics.totalVolume);
    
    if (stakingRatio > 0.7) {
      recommendations.push({
        id: `liquidity-balance-${Date.now()}`,
        priority: 'MEDIUM',
        category: 'DIVERSIFICATION',
        title: 'Improve Liquidity Management',
        description: 'Maintain better balance between staked and liquid assets for improved flexibility.',
        actionItems: [
          'Keep 20-30% of assets in liquid form',
          'Use liquid staking derivatives when possible',
          'Plan for unstaking periods and penalties',
          'Maintain emergency liquidity reserves'
        ],
        expectedImpact: 'Improved liquidity flexibility and reduced concentration risk',
        timeframe: 'MEDIUM_TERM',
        riskFactorTargeted: ['liquidityRisk', 'concentrationRisk'],
        confidenceScore: 80,
        impactPrediction: {
          expectedRiskReduction: 25,
          timeToImpact: 'MEDIUM_TERM',
          implementationComplexity: 'MEDIUM'
        },
        trackingMetrics: [
          'Liquid asset ratio',
          'Staking flexibility',
          'Liquidity risk score'
        ],
        prerequisites: [
          'Understand staking mechanics',
          'Plan liquidity needs'
        ],
        alternativeActions: [
          'Use DeFi lending for liquidity',
          'Implement gradual rebalancing'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate anomaly-specific recommendations
   */
  private static generateAnomalySpecificRecommendations(
    anomalyDetection: AnomalyDetectionResult,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    if (anomalyDetection.flags.hasWashTrading) {
      recommendations.push({
        id: `washtrading-avoid-${Date.now()}`,
        priority: 'HIGH',
        category: 'SECURITY',
        title: 'Eliminate Wash Trading Patterns',
        description: 'Address detected wash trading patterns that significantly increase risk profile.',
        actionItems: [
          'Avoid circular trading between related addresses',
          'Ensure all transactions have legitimate economic purpose',
          'Review and eliminate any coordinated trading activities',
          'Focus on genuine DeFi participation'
        ],
        expectedImpact: 'Major reduction in anomaly flags and risk score',
        timeframe: 'IMMEDIATE',
        riskFactorTargeted: ['anomalyRisk'],
        confidenceScore: 95,
        impactPrediction: {
          expectedRiskReduction: 60,
          timeToImpact: 'IMMEDIATE',
          implementationComplexity: 'HIGH'
        },
        trackingMetrics: [
          'Wash trading detection score',
          'Transaction legitimacy',
          'Pattern analysis results'
        ],
        prerequisites: [
          'Review all related addresses',
          'Understand wash trading implications'
        ],
        alternativeActions: [
          'Separate legitimate trading activities',
          'Use different addresses for different purposes'
        ]
      });
    }
    
    if (anomalyDetection.flags.hasBotBehavior) {
      recommendations.push({
        id: `botbehavior-humanize-${Date.now()}`,
        priority: 'HIGH',
        category: 'BEHAVIORAL',
        title: 'Humanize Transaction Patterns',
        description: 'Modify transaction patterns to appear more human-like and less automated.',
        actionItems: [
          'Vary transaction timing to avoid regular intervals',
          'Use different transaction amounts',
          'Add natural delays between transactions',
          'Avoid perfectly regular or systematic patterns'
        ],
        expectedImpact: 'Significant reduction in bot behavior detection',
        timeframe: 'SHORT_TERM',
        riskFactorTargeted: ['anomalyRisk'],
        confidenceScore: 85,
        impactPrediction: {
          expectedRiskReduction: 45,
          timeToImpact: 'SHORT_TERM',
          implementationComplexity: 'MEDIUM'
        },
        trackingMetrics: [
          'Bot behavior probability',
          'Transaction timing variance',
          'Pattern randomness'
        ],
        prerequisites: [
          'Understand human transaction patterns',
          'Plan natural transaction flow'
        ],
        alternativeActions: [
          'Use manual transaction execution',
          'Implement random delays in automated systems'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate general improvement recommendations
   */
  private static generateGeneralImprovementRecommendations(
    riskAssessment: RiskAssessment,
    metrics: UserMetrics
  ): EnhancedRiskMitigationRecommendation[] {
    
    const recommendations: EnhancedRiskMitigationRecommendation[] = [];
    
    // Gas optimization recommendation
    recommendations.push({
      id: `general-gasopt-${Date.now()}`,
      priority: 'LOW',
      category: 'BEHAVIORAL',
      title: 'Optimize Gas Usage Patterns',
      description: 'Improve gas efficiency to demonstrate sophisticated DeFi usage and reduce costs.',
      actionItems: [
        'Monitor gas prices and transact during low-cost periods',
        'Use gas optimization tools and strategies',
        'Batch transactions when possible',
        'Learn about EIP-1559 and gas optimization techniques'
      ],
      expectedImpact: 'Improved efficiency scoring and reduced transaction costs',
      timeframe: 'SHORT_TERM',
      riskFactorTargeted: [],
      confidenceScore: 70,
      impactPrediction: {
        expectedRiskReduction: 10,
        timeToImpact: 'SHORT_TERM',
        implementationComplexity: 'LOW'
      },
      trackingMetrics: [
        'Average gas price used',
        'Gas efficiency score',
        'Transaction cost optimization'
      ],
      prerequisites: [
        'Understand gas mechanics',
        'Learn gas optimization tools'
      ],
      alternativeActions: [
        'Use Layer 2 solutions',
        'Time transactions strategically'
      ]
    });
    
    return recommendations;
  }

  /**
   * Generate detailed risk factor explanations
   * Requirement 2.4: Build risk factor explanation system with detailed reasoning
   */
  private static async generateRiskFactorExplanations(
    riskAssessment: RiskAssessment,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<RiskFactorExplanation[]> {
    
    const explanations: RiskFactorExplanation[] = [];
    
    // Generate explanation for each risk factor
    Object.entries(riskAssessment.riskFactors).forEach(([factorName, factor]) => {
      const explanation = this.generateFactorExplanation(
        factorName,
        factor,
        metrics,
        transactionHistory
      );
      explanations.push(explanation);
    });
    
    return explanations;
  }

  /**
   * Generate detailed explanation for a specific risk factor
   */
  private static generateFactorExplanation(
    factorName: string,
    factor: RiskFactor,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactorExplanation {
    
    switch (factorName) {
      case 'concentrationRisk':
        return this.explainConcentrationRisk(factor, metrics);
      case 'volatilityRisk':
        return this.explainVolatilityRisk(factor, metrics, transactionHistory);
      case 'inactivityRisk':
        return this.explainInactivityRisk(factor, metrics);
      case 'newAccountRisk':
        return this.explainNewAccountRisk(factor, metrics);
      case 'anomalyRisk':
        return this.explainAnomalyRisk(factor, metrics, transactionHistory);
      case 'liquidityRisk':
        return this.explainLiquidityRisk(factor, metrics);
      default:
        return this.explainGenericRisk(factorName, factor, metrics);
    }
  }

  /**
   * Explain concentration risk in detail
   */
  private static explainConcentrationRisk(
    factor: RiskFactor,
    metrics: UserMetrics
  ): RiskFactorExplanation {
    
    const protocolCount = metrics.defiProtocolsUsed.length;
    const stakingRatio = parseFloat(metrics.stakingBalance) / parseFloat(metrics.totalVolume);
    
    const contributingFactors: string[] = [];
    const keyMetrics: RiskFactorExplanation['keyMetrics'] = [];
    
    if (protocolCount <= 1) {
      contributingFactors.push('Limited DeFi protocol diversification');
    }
    
    if (stakingRatio > 0.7) {
      contributingFactors.push('High concentration in staking activities');
    }
    
    keyMetrics.push({
      name: 'DeFi Protocols Used',
      value: protocolCount.toString(),
      benchmark: '3-5 protocols',
      status: protocolCount >= 3 ? 'GOOD' : protocolCount >= 2 ? 'FAIR' : 'POOR'
    });
    
    keyMetrics.push({
      name: 'Staking Concentration',
      value: `${(stakingRatio * 100).toFixed(1)}%`,
      benchmark: '< 70%',
      status: stakingRatio < 0.5 ? 'GOOD' : stakingRatio < 0.7 ? 'FAIR' : 'POOR'
    });
    
    return {
      factorName: 'Concentration Risk',
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: `Your concentration risk is ${factor.level.toLowerCase()} due to ${contributingFactors.join(' and ')}. ` +
        `Diversification across multiple protocols and asset types reduces single points of failure and improves overall risk profile.`,
      contributingFactors,
      historicalContext: `Based on your ${metrics.accountAge} day account history with ${metrics.totalTransactions} transactions.`,
      comparisonToPeers: `Users with similar account age typically use ${protocolCount < 2 ? 'more' : 'similar numbers of'} DeFi protocols.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics
    };
  }

  /**
   * Explain volatility risk in detail
   */
  private static explainVolatilityRisk(
    factor: RiskFactor,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactorExplanation {
    
    const contributingFactors: string[] = [];
    const keyMetrics: RiskFactorExplanation['keyMetrics'] = [];
    
    if (transactionHistory && transactionHistory.length > 1) {
      const volumes = transactionHistory.map(tx => parseFloat(tx.value));
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgVolume > 0 ? stdDev / avgVolume : 0;
      
      if (coefficientOfVariation > 2) {
        contributingFactors.push('Highly variable transaction volumes');
      }
      
      keyMetrics.push({
        name: 'Volume Volatility',
        value: `${(coefficientOfVariation * 100).toFixed(1)}%`,
        benchmark: '< 100%',
        status: coefficientOfVariation < 1 ? 'GOOD' : coefficientOfVariation < 2 ? 'FAIR' : 'POOR'
      });
    }
    
    const avgTxPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    keyMetrics.push({
      name: 'Transaction Frequency',
      value: `${avgTxPerMonth.toFixed(1)}/month`,
      benchmark: '4-12/month',
      status: avgTxPerMonth >= 4 && avgTxPerMonth <= 12 ? 'GOOD' : 'FAIR'
    });
    
    return {
      factorName: 'Volatility Risk',
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: `Your volatility risk reflects ${contributingFactors.length > 0 ? contributingFactors.join(' and ') : 'your transaction pattern consistency'}. ` +
        `Consistent patterns indicate stable, predictable behavior which reduces risk.`,
      contributingFactors,
      historicalContext: `Analysis based on ${transactionHistory?.length || 0} transactions over ${metrics.accountAge} days.`,
      comparisonToPeers: `Your transaction patterns show ${factor.level.toLowerCase()} volatility compared to similar users.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics
    };
  }

  /**
   * Explain inactivity risk in detail
   */
  private static explainInactivityRisk(
    factor: RiskFactor,
    metrics: UserMetrics
  ): RiskFactorExplanation {
    
    const daysSinceLastTx = Math.floor((Date.now() - metrics.lastTransactionTime) / (1000 * 60 * 60 * 24));
    const avgTxPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    
    const contributingFactors: string[] = [];
    const keyMetrics: RiskFactorExplanation['keyMetrics'] = [];
    
    if (daysSinceLastTx > 30) {
      contributingFactors.push(`${daysSinceLastTx} days since last transaction`);
    }
    
    if (avgTxPerMonth < 2) {
      contributingFactors.push('Low overall transaction frequency');
    }
    
    keyMetrics.push({
      name: 'Days Since Last Transaction',
      value: daysSinceLastTx.toString(),
      benchmark: '< 7 days',
      status: daysSinceLastTx <= 7 ? 'GOOD' : daysSinceLastTx <= 30 ? 'FAIR' : 'POOR'
    });
    
    keyMetrics.push({
      name: 'Average Monthly Transactions',
      value: avgTxPerMonth.toFixed(1),
      benchmark: '> 4 per month',
      status: avgTxPerMonth >= 4 ? 'GOOD' : avgTxPerMonth >= 2 ? 'FAIR' : 'POOR'
    });
    
    return {
      factorName: 'Inactivity Risk',
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: `Your inactivity risk is based on ${contributingFactors.join(' and ')}. ` +
        `Regular activity demonstrates ongoing engagement and reduces abandonment risk.`,
      contributingFactors,
      historicalContext: `Account created ${metrics.accountAge} days ago with ${metrics.totalTransactions} total transactions.`,
      comparisonToPeers: `Active users typically transact at least weekly and maintain consistent engagement.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics
    };
  }

  /**
   * Explain new account risk in detail
   */
  private static explainNewAccountRisk(
    factor: RiskFactor,
    metrics: UserMetrics
  ): RiskFactorExplanation {
    
    const contributingFactors: string[] = [];
    const keyMetrics: RiskFactorExplanation['keyMetrics'] = [];
    
    if (metrics.accountAge < 30) {
      contributingFactors.push(`Account age of ${metrics.accountAge} days`);
    }
    
    if (metrics.totalTransactions < 10) {
      contributingFactors.push(`Limited transaction history (${metrics.totalTransactions} transactions)`);
    }
    
    keyMetrics.push({
      name: 'Account Age',
      value: `${metrics.accountAge} days`,
      benchmark: '> 90 days',
      status: metrics.accountAge >= 90 ? 'GOOD' : metrics.accountAge >= 30 ? 'FAIR' : 'POOR'
    });
    
    keyMetrics.push({
      name: 'Transaction Count',
      value: metrics.totalTransactions.toString(),
      benchmark: '> 20 transactions',
      status: metrics.totalTransactions >= 20 ? 'GOOD' : metrics.totalTransactions >= 10 ? 'FAIR' : 'POOR'
    });
    
    return {
      factorName: 'New Account Risk',
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: `New account risk reflects ${contributingFactors.join(' and ')}. ` +
        `Newer accounts have less established patterns and history for assessment.`,
      contributingFactors,
      historicalContext: `Account established ${metrics.accountAge} days ago, building transaction history.`,
      comparisonToPeers: `Established accounts typically have 90+ days of history and 20+ transactions.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics
    };
  }

  /**
   * Explain anomaly risk in detail
   */
  private static explainAnomalyRisk(
    factor: RiskFactor,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): RiskFactorExplanation {
    
    const contributingFactors: string[] = [];
    const keyMetrics: RiskFactorExplanation['keyMetrics'] = [];
    
    // Add specific anomaly indicators from factor
    contributingFactors.push(...factor.indicators);
    
    keyMetrics.push({
      name: 'Anomaly Score',
      value: factor.score.toString(),
      benchmark: '< 40',
      status: factor.score < 40 ? 'GOOD' : factor.score < 60 ? 'FAIR' : 'POOR'
    });
    
    if (transactionHistory) {
      keyMetrics.push({
        name: 'Pattern Regularity',
        value: transactionHistory.length > 5 ? 'Analyzed' : 'Limited Data',
        benchmark: 'Regular patterns',
        status: transactionHistory.length > 5 ? 'GOOD' : 'POOR'
      });
    }
    
    return {
      factorName: 'Anomaly Risk',
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: `Anomaly risk assessment identified ${contributingFactors.length > 0 ? contributingFactors.join(', ') : 'potential irregular patterns'}. ` +
        `Consistent, predictable behavior patterns reduce anomaly flags.`,
      contributingFactors,
      historicalContext: `Based on analysis of ${transactionHistory?.length || 0} transactions and behavioral patterns.`,
      comparisonToPeers: `Normal users typically show consistent patterns without anomalous behavior flags.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics
    };
  }

  /**
   * Explain liquidity risk in detail
   */
  private static explainLiquidityRisk(
    factor: RiskFactor,
    metrics: UserMetrics
  ): RiskFactorExplanation {
    
    const stakingRatio = parseFloat(metrics.stakingBalance) / parseFloat(metrics.totalVolume);
    const avgTxPerMonth = (metrics.totalTransactions / Math.max(metrics.accountAge, 1)) * 30;
    
    const contributingFactors: string[] = [];
    const keyMetrics: RiskFactorExplanation['keyMetrics'] = [];
    
    if (stakingRatio > 0.7) {
      contributingFactors.push(`High staking ratio (${(stakingRatio * 100).toFixed(1)}%)`);
    }
    
    if (avgTxPerMonth < 2) {
      contributingFactors.push('Low transaction frequency may indicate liquidity constraints');
    }
    
    keyMetrics.push({
      name: 'Staking Ratio',
      value: `${(stakingRatio * 100).toFixed(1)}%`,
      benchmark: '< 70%',
      status: stakingRatio < 0.5 ? 'GOOD' : stakingRatio < 0.7 ? 'FAIR' : 'POOR'
    });
    
    keyMetrics.push({
      name: 'Liquid Assets',
      value: `${((1 - stakingRatio) * 100).toFixed(1)}%`,
      benchmark: '> 30%',
      status: (1 - stakingRatio) > 0.3 ? 'GOOD' : (1 - stakingRatio) > 0.2 ? 'FAIR' : 'POOR'
    });
    
    return {
      factorName: 'Liquidity Risk',
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: `Liquidity risk assessment considers ${contributingFactors.length > 0 ? contributingFactors.join(' and ') : 'your asset allocation and activity patterns'}. ` +
        `Maintaining liquid assets provides flexibility for opportunities and emergencies.`,
      contributingFactors,
      historicalContext: `Based on current asset allocation and ${metrics.accountAge} days of activity history.`,
      comparisonToPeers: `Balanced users typically maintain 20-40% liquid assets for flexibility.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics
    };
  }

  /**
   * Generic risk factor explanation
   */
  private static explainGenericRisk(
    factorName: string,
    factor: RiskFactor,
    metrics: UserMetrics
  ): RiskFactorExplanation {
    
    return {
      factorName: factorName.replace('Risk', ' Risk'),
      currentLevel: factor.level,
      score: factor.score,
      detailedReasoning: factor.explanation,
      contributingFactors: factor.indicators,
      historicalContext: `Based on ${metrics.accountAge} days of account history.`,
      comparisonToPeers: `Risk level is ${factor.level.toLowerCase()} compared to similar users.`,
      improvementPotential: Math.max(0, 100 - factor.score),
      keyMetrics: [{
        name: 'Risk Score',
        value: factor.score.toString(),
        benchmark: '< 40',
        status: factor.score < 40 ? 'GOOD' : factor.score < 60 ? 'FAIR' : 'POOR'
      }]
    };
  }

  /**
   * Calculate overall confidence score
   * Requirement 2.4: Add confidence scoring for risk assessments and anomaly detection
   */
  private static calculateOverallConfidence(
    riskAssessment: RiskAssessment,
    anomalyDetection: AnomalyDetectionResult,
    metrics: UserMetrics
  ): number {
    
    // Base confidence on data availability and quality
    let confidence = 0;
    let factors = 0;
    
    // Account age factor (older accounts = higher confidence)
    const ageConfidence = Math.min(100, (metrics.accountAge / 90) * 100);
    confidence += ageConfidence;
    factors++;
    
    // Transaction count factor
    const txConfidence = Math.min(100, (metrics.totalTransactions / 20) * 100);
    confidence += txConfidence;
    factors++;
    
    // Risk assessment confidence
    confidence += riskAssessment.confidence;
    factors++;
    
    // Anomaly detection confidence
    confidence += anomalyDetection.confidence;
    factors++;
    
    // DeFi activity factor
    const defiConfidence = metrics.defiProtocolsUsed.length > 0 ? 
      Math.min(100, metrics.defiProtocolsUsed.length * 25) : 50;
    confidence += defiConfidence;
    factors++;
    
    return Math.round(confidence / factors);
  }

  /**
   * Assess data quality for confidence calculation
   */
  private static assessDataQuality(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): { completeness: number; freshness: number; accuracy: number } {
    
    // Completeness: How much data we have
    let completeness = 0;
    if (metrics.totalTransactions > 0) completeness += 30;
    if (metrics.defiProtocolsUsed.length > 0) completeness += 25;
    if (parseFloat(metrics.stakingBalance) > 0) completeness += 20;
    if (transactionHistory && transactionHistory.length > 5) completeness += 25;
    
    // Freshness: How recent the data is
    const daysSinceLastTx = Math.floor((Date.now() - metrics.lastTransactionTime) / (1000 * 60 * 60 * 24));
    const freshness = Math.max(0, 100 - (daysSinceLastTx * 2)); // Decrease 2 points per day
    
    // Accuracy: Consistency of data (simplified)
    const accuracy = metrics.totalTransactions > 0 && metrics.accountAge > 0 ? 90 : 70;
    
    return {
      completeness: Math.min(100, completeness),
      freshness: Math.min(100, freshness),
      accuracy
    };
  }

  /**
   * Categorize recommendations by type
   */
  private static categorizeRecommendations(
    recommendations: EnhancedRiskMitigationRecommendation[]
  ): {
    priorityActions: string[];
    quickWins: string[];
    longTermStrategy: string[];
  } {
    
    const priorityActions = recommendations
      .filter(r => r.priority === 'HIGH')
      .map(r => r.title);
    
    const quickWins = recommendations
      .filter(r => r.impactPrediction.implementationComplexity === 'LOW' && 
                   r.impactPrediction.timeToImpact === 'IMMEDIATE')
      .map(r => r.title);
    
    const longTermStrategy = recommendations
      .filter(r => r.impactPrediction.timeToImpact === 'LONG_TERM')
      .map(r => r.title);
    
    return { priorityActions, quickWins, longTermStrategy };
  }

  /**
   * Get recent monitoring alerts for an address
   */
  private static async getRecentMonitoringAlerts(address: string): Promise<RiskMonitoringAlert[]> {
    try {
      // This would typically query the database for recent alerts
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching monitoring alerts:', error);
      return [];
    }
  }

  /**
   * Create empty anomaly result for cases with no transaction history
   */
  private static createEmptyAnomalyResult(address: string): AnomalyDetectionResult {
    return {
      address,
      timestamp: Date.now(),
      overallAnomalyScore: 0,
      confidence: 0,
      flags: {
        hasStatisticalAnomalies: false,
        hasWashTrading: false,
        hasBotBehavior: false,
        hasCoordinatedActivity: false
      },
      statisticalAnomalies: [],
      washTradingDetection: {
        detected: false,
        confidence: 0,
        patterns: [],
        riskLevel: 'LOW'
      },
      botBehaviorDetection: {
        detected: false,
        botProbability: 0,
        indicators: [],
        confidence: 0
      },
      coordinatedActivityDetection: {
        detected: false,
        confidence: 0,
        relatedAddresses: [],
        patterns: []
      },
      recommendations: ['Build transaction history for comprehensive anomaly analysis'],
      riskExplanation: 'Insufficient transaction history for anomaly detection analysis'
    };
  }

  /**
   * Track recommendation progress
   * Requirement 2.5: Create risk monitoring system for ongoing risk level tracking
   */
  public static async trackRecommendationProgress(
    address: string,
    recommendationId: string,
    progress: number,
    milestoneCompleted?: string
  ): Promise<void> {
    
    try {
      // Get existing recommendations to find the one to update
      const recommendations = await DatabaseService.getRecommendations(address);
      const targetRecommendation = recommendations.find(r => r.recommendationId === recommendationId);
      
      if (targetRecommendation) {
        // Update progress using the database service
        await DatabaseService.updateRecommendationProgress(targetRecommendation.id, progress);
        
        console.log(`Updated recommendation ${recommendationId} progress to ${progress}%`);
        
        if (milestoneCompleted) {
          console.log(`Milestone completed: ${milestoneCompleted}`);
          // In a full implementation, you'd store milestone data separately
        }
      } else {
        console.warn(`Recommendation ${recommendationId} not found for address ${address}`);
      }
      
    } catch (error) {
      console.error('Error tracking recommendation progress:', error);
    }
  }

  /**
   * Get recommendation progress for an address
   */
  public static async getRecommendationProgress(
    address: string
  ): Promise<RiskMitigationProgress[]> {
    
    try {
      const recommendations = await DatabaseService.getRecommendations(address);
      
      const progressList: RiskMitigationProgress[] = [];
      
      for (const recommendation of recommendations) {
        progressList.push({
          recommendationId: recommendation.recommendationId,
          address: recommendation.address,
          startDate: recommendation.createdAt,
          currentProgress: recommendation.progress || 0,
          milestones: [
            {
              name: 'Started',
              completed: true,
              completedDate: recommendation.createdAt,
              impact: 'Recommendation created and tracking initiated'
            }
          ],
          measuredImpact: {
            riskScoreChange: 0, // Would be calculated from historical data
            specificImprovements: []
          }
        });
      }
      
      return progressList;
      
    } catch (error) {
      console.error('Error getting recommendation progress:', error);
      return [];
    }
  }
}