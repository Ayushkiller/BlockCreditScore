import { UserMetrics, TransactionData } from './blockchainService';
import { RiskAssessmentEngine, RiskAssessment } from './riskAssessmentEngine';
import { BehavioralPatternEngine, BehavioralInsights } from './behavioralPatternEngine';
import { GrowthTrendAnalysisEngine, GrowthTrendAnalysis } from './growthTrendAnalysisEngine';

/**
 * Personalized Recommendations Interface
 * Implements comprehensive recommendation generation as per requirements 4.1, 4.2, 4.3
 */
export interface PersonalizedRecommendations {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'VOLUME' | 'FREQUENCY' | 'STAKING' | 'DEFI' | 'RISK' | 'EFFICIENCY';
  
  title: string;
  description: string;
  
  // Impact analysis
  expectedScoreImpact: number; // Expected score increase
  implementationDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeToImpact: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
  
  // Actionable guidance
  actionItems: ActionItem[];
  successMetrics: string[];
  
  // Progress tracking
  trackingEnabled: boolean;
  currentProgress?: number; // 0-100
  
  // Additional metadata
  confidence: number; // 0-100
  estimatedCost?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ActionItem {
  description: string;
  type: 'TRANSACTION' | 'STAKING' | 'DEFI' | 'OPTIMIZATION';
  specificGuidance: string;
  estimatedCost?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: number; // 1-10, higher = more important
}

export interface RecommendationContext {
  userMetrics: UserMetrics;
  riskAssessment: RiskAssessment;
  behavioralInsights: BehavioralInsights;
  growthTrend: GrowthTrendAnalysis;
  transactionHistory?: TransactionData[];
}

export interface ImpactPrediction {
  scoreImpact: number; // Expected score change
  confidence: number; // 0-100
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
  factors: ImpactFactor[];
}

export interface ImpactFactor {
  component: 'VOLUME' | 'FREQUENCY' | 'STAKING' | 'DEFI' | 'RISK' | 'EFFICIENCY';
  expectedChange: number; // Expected change in component score
  weight: number; // Weight of this component in overall score
  confidence: number; // 0-100
}

/**
 * Personalized Recommendation Engine
 * Generates intelligent, actionable recommendations for credit score improvement
 */
export class RecommendationEngine {
  
  // Recommendation scoring weights
  private static readonly RECOMMENDATION_WEIGHTS = {
    IMPACT: 0.40,        // 40% - Expected score impact
    FEASIBILITY: 0.25,   // 25% - Implementation difficulty (inverted)
    URGENCY: 0.20,       // 20% - Time sensitivity
    CONFIDENCE: 0.15     // 15% - Confidence in recommendation
  };

  // Impact thresholds for priority classification
  private static readonly PRIORITY_THRESHOLDS = {
    HIGH: 30,    // 30+ point expected impact
    MEDIUM: 15,  // 15+ point expected impact
    LOW: 5       // 5+ point expected impact
  };

  // Category-specific recommendation templates
  private static readonly RECOMMENDATION_TEMPLATES = {
    VOLUME: {
      INCREASE_ACTIVITY: {
        title: 'Increase Transaction Volume',
        baseImpact: 25,
        difficulty: 'EASY',
        timeframe: 'SHORT_TERM'
      },
      OPTIMIZE_SIZE: {
        title: 'Optimize Transaction Sizes',
        baseImpact: 15,
        difficulty: 'MEDIUM',
        timeframe: 'IMMEDIATE'
      }
    },
    FREQUENCY: {
      REGULAR_ACTIVITY: {
        title: 'Establish Regular Transaction Pattern',
        baseImpact: 20,
        difficulty: 'EASY',
        timeframe: 'LONG_TERM'
      },
      INCREASE_FREQUENCY: {
        title: 'Increase Transaction Frequency',
        baseImpact: 18,
        difficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM'
      }
    },
    STAKING: {
      START_STAKING: {
        title: 'Begin Staking Activity',
        baseImpact: 35,
        difficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM'
      },
      OPTIMIZE_STAKING: {
        title: 'Optimize Staking Strategy',
        baseImpact: 20,
        difficulty: 'MEDIUM',
        timeframe: 'LONG_TERM'
      }
    },
    DEFI: {
      EXPLORE_DEFI: {
        title: 'Explore DeFi Protocols',
        baseImpact: 30,
        difficulty: 'HARD',
        timeframe: 'LONG_TERM'
      },
      DIVERSIFY_PROTOCOLS: {
        title: 'Diversify DeFi Protocol Usage',
        baseImpact: 25,
        difficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM'
      }
    },
    RISK: {
      REDUCE_CONCENTRATION: {
        title: 'Reduce Concentration Risk',
        baseImpact: 22,
        difficulty: 'MEDIUM',
        timeframe: 'SHORT_TERM'
      },
      IMPROVE_CONSISTENCY: {
        title: 'Improve Behavioral Consistency',
        baseImpact: 18,
        difficulty: 'EASY',
        timeframe: 'LONG_TERM'
      }
    },
    EFFICIENCY: {
      OPTIMIZE_GAS: {
        title: 'Optimize Gas Usage',
        baseImpact: 12,
        difficulty: 'EASY',
        timeframe: 'IMMEDIATE'
      },
      IMPROVE_TIMING: {
        title: 'Improve Transaction Timing',
        baseImpact: 10,
        difficulty: 'EASY',
        timeframe: 'SHORT_TERM'
      }
    }
  };

  /**
   * Generate personalized recommendations based on user analysis
   * Requirement 4.1: Generate prioritized, actionable suggestions
   */
  public static async generateRecommendations(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<PersonalizedRecommendations[]> {
    
    // Gather comprehensive analysis context
    const context = await this.buildRecommendationContext(address, metrics, transactionHistory);
    
    // Generate category-specific recommendations
    const recommendations: PersonalizedRecommendations[] = [];
    
    // Volume recommendations
    recommendations.push(...this.generateVolumeRecommendations(context));
    
    // Frequency recommendations
    recommendations.push(...this.generateFrequencyRecommendations(context));
    
    // Staking recommendations
    recommendations.push(...this.generateStakingRecommendations(context));
    
    // DeFi recommendations
    recommendations.push(...this.generateDefiRecommendations(context));
    
    // Risk recommendations
    recommendations.push(...this.generateRiskRecommendations(context));
    
    // Efficiency recommendations
    recommendations.push(...this.generateEfficiencyRecommendations(context));
    
    // Sort by priority and impact
    const sortedRecommendations = this.prioritizeRecommendations(recommendations);
    
    // Return top recommendations (limit to prevent overwhelming user)
    return sortedRecommendations.slice(0, 8);
  }

  /**
   * Build comprehensive context for recommendation generation
   */
  private static async buildRecommendationContext(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): Promise<RecommendationContext> {
    
    // Get risk assessment
    const riskAssessment = await RiskAssessmentEngine.assessRisk(address, metrics, transactionHistory);
    
    // Get behavioral insights
    const behavioralInsights = await BehavioralPatternEngine.analyzeBehavioralPatterns(address, metrics, transactionHistory);
    
    // Get growth trend analysis
    const growthTrend = GrowthTrendAnalysisEngine.analyzeGrowthTrend(address, metrics, transactionHistory);
    
    return {
      userMetrics: metrics,
      riskAssessment,
      behavioralInsights,
      growthTrend,
      transactionHistory
    };
  }

  /**
   * Generate volume-specific recommendations
   * Requirement 4.2: Category-specific recommendations with impact assessment
   */
  private static generateVolumeRecommendations(context: RecommendationContext): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];
    const { userMetrics } = context;
    
    const totalVolume = parseFloat(userMetrics.totalVolume);
    const avgTransactionValue = userMetrics.totalTransactions > 0 ? totalVolume / userMetrics.totalTransactions : 0;
    
    // Low volume recommendation
    if (totalVolume < 1.0) {
      const impactPrediction = this.predictImpact(context, 'VOLUME', 'INCREASE_ACTIVITY');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'VOLUME',
        title: 'Increase Transaction Volume',
        description: `Your total transaction volume of ${totalVolume.toFixed(4)} ETH is below optimal levels. Increasing your transaction volume will significantly improve your credit score.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'EASY',
        timeToImpact: 'SHORT_TERM',
        actionItems: [
          {
            description: 'Gradually increase transaction sizes',
            type: 'TRANSACTION',
            specificGuidance: `Consider increasing average transaction size from ${avgTransactionValue.toFixed(4)} ETH to 0.1-0.5 ETH`,
            estimatedCost: '0.1-0.5 ETH per transaction',
            riskLevel: 'LOW',
            priority: 8
          },
          {
            description: 'Maintain consistent transaction activity',
            type: 'TRANSACTION',
            specificGuidance: 'Aim for 2-4 transactions per month with meaningful volume',
            riskLevel: 'LOW',
            priority: 7
          }
        ],
        successMetrics: [
          'Total volume increases by 50% within 3 months',
          'Average transaction value reaches 0.1+ ETH',
          'Volume score component improves by 15+ points'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        estimatedCost: '0.5-2.0 ETH over 3 months',
        riskLevel: 'LOW'
      });
    }
    
    // Optimize transaction sizing for users with many small transactions
    if (userMetrics.totalTransactions > 20 && avgTransactionValue < 0.05) {
      const impactPrediction = this.predictImpact(context, 'VOLUME', 'OPTIMIZE_SIZE');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'VOLUME',
        title: 'Optimize Transaction Sizes',
        description: `You have many small transactions (avg: ${avgTransactionValue.toFixed(4)} ETH). Consolidating into larger, more meaningful transactions will improve your score.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'MEDIUM',
        timeToImpact: 'IMMEDIATE',
        actionItems: [
          {
            description: 'Consolidate small transactions',
            type: 'OPTIMIZATION',
            specificGuidance: 'Instead of multiple small transactions, combine them into fewer, larger ones',
            riskLevel: 'LOW',
            priority: 6
          },
          {
            description: 'Plan transaction batching',
            type: 'OPTIMIZATION',
            specificGuidance: 'Group related activities into single transactions when possible',
            riskLevel: 'LOW',
            priority: 5
          }
        ],
        successMetrics: [
          'Average transaction value increases by 100%',
          'Maintain or increase total volume with fewer transactions',
          'Improved gas efficiency through batching'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'LOW'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate frequency-specific recommendations
   */
  private static generateFrequencyRecommendations(context: RecommendationContext): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];
    const { userMetrics, behavioralInsights } = context;
    
    const transactionsPerMonth = (userMetrics.totalTransactions / Math.max(userMetrics.accountAge, 1)) * 30;
    
    // Low frequency recommendation
    if (transactionsPerMonth < 2) {
      const impactPrediction = this.predictImpact(context, 'FREQUENCY', 'INCREASE_FREQUENCY');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'FREQUENCY',
        title: 'Increase Transaction Frequency',
        description: `Your current activity of ${transactionsPerMonth.toFixed(1)} transactions per month is below optimal. Regular activity demonstrates consistent engagement.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'MEDIUM',
        timeToImpact: 'SHORT_TERM',
        actionItems: [
          {
            description: 'Establish regular transaction schedule',
            type: 'TRANSACTION',
            specificGuidance: 'Aim for 4-8 transactions per month with consistent timing',
            riskLevel: 'LOW',
            priority: 7
          },
          {
            description: 'Set up recurring activities',
            type: 'TRANSACTION',
            specificGuidance: 'Consider regular DeFi interactions, staking rewards claims, or portfolio rebalancing',
            riskLevel: 'MEDIUM',
            priority: 6
          }
        ],
        successMetrics: [
          'Achieve 4+ transactions per month consistently',
          'Maintain regular activity pattern for 3+ months',
          'Frequency score component improves by 20+ points'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'LOW'
      });
    }
    
    // Consistency improvement for sporadic users
    if (behavioralInsights.activityPattern === 'SPORADIC') {
      const impactPrediction = this.predictImpact(context, 'FREQUENCY', 'REGULAR_ACTIVITY');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'FREQUENCY',
        title: 'Establish Regular Transaction Pattern',
        description: 'Your sporadic activity pattern reduces score reliability. Establishing consistent timing will improve your creditworthiness assessment.',
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'EASY',
        timeToImpact: 'LONG_TERM',
        actionItems: [
          {
            description: 'Create transaction schedule',
            type: 'OPTIMIZATION',
            specificGuidance: 'Plan transactions for specific days/times each week or month',
            riskLevel: 'LOW',
            priority: 5
          },
          {
            description: 'Use calendar reminders',
            type: 'OPTIMIZATION',
            specificGuidance: 'Set up reminders for regular portfolio management activities',
            riskLevel: 'LOW',
            priority: 4
          }
        ],
        successMetrics: [
          'Achieve consistent weekly or bi-weekly transaction pattern',
          'Reduce activity variability by 50%',
          'Consistency score improves to 70+ points'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'LOW'
      });
    }
    
    return recommendations;
  }  /**

   * Generate staking-specific recommendations
   */
  private static generateStakingRecommendations(context: RecommendationContext): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];
    const { userMetrics } = context;
    
    const stakingBalance = parseFloat(userMetrics.stakingBalance);
    const totalVolume = parseFloat(userMetrics.totalVolume);
    const stakingRatio = totalVolume > 0 ? stakingBalance / totalVolume : 0;
    
    // No staking activity recommendation
    if (stakingBalance === 0) {
      const impactPrediction = this.predictImpact(context, 'STAKING', 'START_STAKING');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'STAKING',
        title: 'Begin Staking Activity',
        description: 'You have no staking activity. Staking demonstrates long-term commitment and can significantly boost your credit score.',
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'MEDIUM',
        timeToImpact: 'SHORT_TERM',
        actionItems: [
          {
            description: 'Research staking options',
            type: 'STAKING',
            specificGuidance: 'Explore Ethereum 2.0 staking, Lido, or other liquid staking protocols',
            riskLevel: 'MEDIUM',
            priority: 9
          },
          {
            description: 'Start with small stake',
            type: 'STAKING',
            specificGuidance: 'Begin with 0.1-0.5 ETH to test the process and understand rewards',
            estimatedCost: '0.1-0.5 ETH',
            riskLevel: 'MEDIUM',
            priority: 8
          },
          {
            description: 'Gradually increase stake',
            type: 'STAKING',
            specificGuidance: 'Aim for 20-40% of portfolio in staking over 6 months',
            riskLevel: 'MEDIUM',
            priority: 7
          }
        ],
        successMetrics: [
          'Successfully stake at least 0.1 ETH',
          'Maintain staking position for 3+ months',
          'Staking score component reaches 200+ points'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        estimatedCost: '0.1+ ETH plus gas fees',
        riskLevel: 'MEDIUM'
      });
    }
    
    // Optimize staking ratio
    else if (stakingRatio < 0.1 || stakingRatio > 0.8) {
      const impactPrediction = this.predictImpact(context, 'STAKING', 'OPTIMIZE_STAKING');
      const isLowStaking = stakingRatio < 0.1;
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'STAKING',
        title: 'Optimize Staking Strategy',
        description: isLowStaking 
          ? `Your staking ratio of ${(stakingRatio * 100).toFixed(1)}% is quite low. Increasing staking shows long-term commitment.`
          : `Your staking ratio of ${(stakingRatio * 100).toFixed(1)}% is very high. Consider maintaining some liquidity for flexibility.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'MEDIUM',
        timeToImpact: 'LONG_TERM',
        actionItems: [
          {
            description: isLowStaking ? 'Increase staking allocation' : 'Rebalance staking allocation',
            type: 'STAKING',
            specificGuidance: isLowStaking 
              ? 'Gradually increase staking to 20-40% of portfolio'
              : 'Consider reducing staking to 40-60% for better balance',
            riskLevel: 'MEDIUM',
            priority: 6
          },
          {
            description: 'Monitor staking rewards',
            type: 'STAKING',
            specificGuidance: 'Track staking rewards and compound when beneficial',
            riskLevel: 'LOW',
            priority: 5
          }
        ],
        successMetrics: [
          `Achieve optimal staking ratio of 20-60%`,
          'Maintain balanced portfolio allocation',
          'Consistent staking rewards over time'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'MEDIUM'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate DeFi-specific recommendations
   */
  private static generateDefiRecommendations(context: RecommendationContext): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];
    const { userMetrics, behavioralInsights } = context;
    
    const defiProtocolCount = userMetrics.defiProtocolsUsed.length;
    
    // No DeFi activity recommendation
    if (defiProtocolCount === 0) {
      const impactPrediction = this.predictImpact(context, 'DEFI', 'EXPLORE_DEFI');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'DEFI',
        title: 'Explore DeFi Protocols',
        description: 'You have no DeFi protocol interactions. DeFi usage demonstrates sophistication and can significantly improve your credit score.',
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'HARD',
        timeToImpact: 'LONG_TERM',
        actionItems: [
          {
            description: 'Start with beginner-friendly protocols',
            type: 'DEFI',
            specificGuidance: 'Begin with Uniswap for swaps or Lido for liquid staking',
            riskLevel: 'MEDIUM',
            priority: 8
          },
          {
            description: 'Learn DeFi basics',
            type: 'DEFI',
            specificGuidance: 'Understand concepts like AMMs, yield farming, and impermanent loss',
            riskLevel: 'LOW',
            priority: 9
          },
          {
            description: 'Start with small amounts',
            type: 'DEFI',
            specificGuidance: 'Use small amounts (0.01-0.1 ETH) to learn and test protocols',
            estimatedCost: '0.01-0.1 ETH',
            riskLevel: 'MEDIUM',
            priority: 7
          }
        ],
        successMetrics: [
          'Successfully interact with 2+ DeFi protocols',
          'Complete at least 5 DeFi transactions',
          'DeFi score component reaches 300+ points'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        estimatedCost: '0.05-0.5 ETH plus gas fees',
        riskLevel: 'HIGH'
      });
    }
    
    // Limited DeFi diversification
    else if (defiProtocolCount < 3 && behavioralInsights.sophisticationLevel !== 'BEGINNER') {
      const impactPrediction = this.predictImpact(context, 'DEFI', 'DIVERSIFY_PROTOCOLS');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'DEFI',
        title: 'Diversify DeFi Protocol Usage',
        description: `You're using ${defiProtocolCount} DeFi protocol${defiProtocolCount === 1 ? '' : 's'}. Diversifying across more protocols shows sophistication and reduces concentration risk.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'MEDIUM',
        timeToImpact: 'SHORT_TERM',
        actionItems: [
          {
            description: 'Explore complementary protocols',
            type: 'DEFI',
            specificGuidance: 'Add lending (Aave/Compound), DEX (Uniswap/Sushiswap), or yield farming protocols',
            riskLevel: 'MEDIUM',
            priority: 7
          },
          {
            description: 'Gradually test new protocols',
            type: 'DEFI',
            specificGuidance: 'Add one new protocol per month with small test amounts',
            estimatedCost: '0.05-0.2 ETH per protocol',
            riskLevel: 'MEDIUM',
            priority: 6
          }
        ],
        successMetrics: [
          'Use 3-5 different DeFi protocols',
          'Maintain activity across multiple protocol categories',
          'Diversification score improves by 25+ points'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        estimatedCost: '0.1-0.5 ETH plus gas fees',
        riskLevel: 'MEDIUM'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate risk-specific recommendations
   */
  private static generateRiskRecommendations(context: RecommendationContext): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];
    const { riskAssessment, behavioralInsights } = context;
    
    // High concentration risk
    if (riskAssessment.riskFactors.concentrationRisk.level === 'HIGH' || 
        riskAssessment.riskFactors.concentrationRisk.level === 'CRITICAL') {
      const impactPrediction = this.predictImpact(context, 'RISK', 'REDUCE_CONCENTRATION');
      
      recommendations.push({
        priority: 'HIGH',
        category: 'RISK',
        title: 'Reduce Concentration Risk',
        description: `Your ${riskAssessment.riskFactors.concentrationRisk.level.toLowerCase()} concentration risk needs attention. ${riskAssessment.riskFactors.concentrationRisk.explanation}`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'MEDIUM',
        timeToImpact: 'SHORT_TERM',
        actionItems: [
          {
            description: 'Diversify protocol usage',
            type: 'DEFI',
            specificGuidance: 'Spread activity across 3-5 different protocols instead of concentrating in one',
            riskLevel: 'MEDIUM',
            priority: 8
          },
          {
            description: 'Vary transaction types',
            type: 'TRANSACTION',
            specificGuidance: 'Mix different transaction types: transfers, DeFi, staking, swaps',
            riskLevel: 'LOW',
            priority: 7
          }
        ],
        successMetrics: [
          'Reduce single protocol concentration below 60%',
          'Use at least 3 different protocol categories',
          'Concentration risk level improves to MEDIUM or LOW'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'MEDIUM'
      });
    }
    
    // Poor consistency
    if (behavioralInsights.consistencyScore < 50) {
      const impactPrediction = this.predictImpact(context, 'RISK', 'IMPROVE_CONSISTENCY');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'RISK',
        title: 'Improve Behavioral Consistency',
        description: `Your consistency score of ${behavioralInsights.consistencyScore} indicates irregular patterns. More consistent behavior improves creditworthiness.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'EASY',
        timeToImpact: 'LONG_TERM',
        actionItems: [
          {
            description: 'Establish regular schedule',
            type: 'OPTIMIZATION',
            specificGuidance: 'Create consistent timing for transactions and portfolio management',
            riskLevel: 'LOW',
            priority: 6
          },
          {
            description: 'Maintain steady activity',
            type: 'TRANSACTION',
            specificGuidance: 'Avoid long periods of inactivity followed by burst activity',
            riskLevel: 'LOW',
            priority: 5
          }
        ],
        successMetrics: [
          'Consistency score improves to 70+ points',
          'Reduce activity variability by 40%',
          'Maintain regular pattern for 3+ months'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'LOW'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate efficiency-specific recommendations
   */
  private static generateEfficiencyRecommendations(context: RecommendationContext): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];
    const { behavioralInsights, transactionHistory } = context;
    
    // Poor gas efficiency
    if (behavioralInsights.gasOptimization && behavioralInsights.gasOptimization.overallEfficiencyScore < 60) {
      const impactPrediction = this.predictImpact(context, 'EFFICIENCY', 'OPTIMIZE_GAS');
      
      recommendations.push({
        priority: this.determinePriority(impactPrediction.scoreImpact),
        category: 'EFFICIENCY',
        title: 'Optimize Gas Usage',
        description: `Your gas efficiency score of ${behavioralInsights.gasOptimization.overallEfficiencyScore} indicates room for improvement. Better gas optimization shows sophistication.`,
        expectedScoreImpact: impactPrediction.scoreImpact,
        implementationDifficulty: 'EASY',
        timeToImpact: 'IMMEDIATE',
        actionItems: [
          {
            description: 'Monitor gas prices',
            type: 'OPTIMIZATION',
            specificGuidance: 'Use gas tracking tools to time transactions during low-fee periods',
            riskLevel: 'LOW',
            priority: 7
          },
          {
            description: 'Batch transactions',
            type: 'OPTIMIZATION',
            specificGuidance: 'Combine multiple operations into single transactions when possible',
            riskLevel: 'LOW',
            priority: 6
          },
          {
            description: 'Use appropriate gas limits',
            type: 'OPTIMIZATION',
            specificGuidance: 'Set gas limits appropriately - not too high or too low',
            riskLevel: 'LOW',
            priority: 5
          }
        ],
        successMetrics: [
          'Gas efficiency score improves to 75+ points',
          'Reduce average gas costs by 20%',
          'Consistent use of optimal gas prices'
        ],
        trackingEnabled: true,
        confidence: impactPrediction.confidence,
        riskLevel: 'LOW'
      });
    }
    
    // Poor transaction timing
    if (transactionHistory && transactionHistory.length > 10) {
      // Check if user frequently transacts during high-fee periods
      const highFeeTransactions = transactionHistory.filter(tx => {
        const gasPrice = parseFloat(tx.gasPrice);
        return gasPrice > 50; // 50+ Gwei considered high
      });
      
      const highFeeRatio = highFeeTransactions.length / transactionHistory.length;
      
      if (highFeeRatio > 0.5) {
        const impactPrediction = this.predictImpact(context, 'EFFICIENCY', 'IMPROVE_TIMING');
        
        recommendations.push({
          priority: this.determinePriority(impactPrediction.scoreImpact),
          category: 'EFFICIENCY',
          title: 'Improve Transaction Timing',
          description: `${(highFeeRatio * 100).toFixed(1)}% of your transactions occur during high-fee periods. Better timing can reduce costs and show sophistication.`,
          expectedScoreImpact: impactPrediction.scoreImpact,
          implementationDifficulty: 'EASY',
          timeToImpact: 'SHORT_TERM',
          actionItems: [
            {
              description: 'Time transactions strategically',
              type: 'OPTIMIZATION',
              specificGuidance: 'Transact during weekends or off-peak hours when gas is typically lower',
              riskLevel: 'LOW',
              priority: 6
            },
            {
              description: 'Use gas price alerts',
              type: 'OPTIMIZATION',
              specificGuidance: 'Set up alerts for when gas prices drop below 30 Gwei',
              riskLevel: 'LOW',
              priority: 5
            }
          ],
          successMetrics: [
            'Reduce high-fee transactions to <30% of total',
            'Average gas price decreases by 25%',
            'Improved timing consistency score'
          ],
          trackingEnabled: true,
          confidence: impactPrediction.confidence,
          riskLevel: 'LOW'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Predict impact of implementing a recommendation
   * Requirement 4.2: Impact prediction algorithms
   */
  private static predictImpact(
    context: RecommendationContext,
    category: 'VOLUME' | 'FREQUENCY' | 'STAKING' | 'DEFI' | 'RISK' | 'EFFICIENCY',
    recommendationType: string
  ): ImpactPrediction {
    
    const { userMetrics, behavioralInsights, riskAssessment } = context;
    const template = (this.RECOMMENDATION_TEMPLATES[category] as any)?.[recommendationType];
    
    if (!template) {
      return {
        scoreImpact: 10,
        confidence: 50,
        timeframe: 'SHORT_TERM',
        factors: []
      };
    }
    
    let baseImpact = template.baseImpact;
    let confidence = 70;
    const factors: ImpactFactor[] = [];
    
    // Adjust impact based on current state and user characteristics
    switch (category) {
      case 'VOLUME':
        const currentVolume = parseFloat(userMetrics.totalVolume);
        if (currentVolume < 0.1) {
          baseImpact *= 1.5; // Higher impact for very low volume users
          confidence += 10;
        } else if (currentVolume > 10) {
          baseImpact *= 0.7; // Lower impact for high volume users
          confidence -= 5;
        }
        
        factors.push({
          component: 'VOLUME',
          expectedChange: baseImpact * 0.8,
          weight: 0.30,
          confidence: confidence
        });
        break;
        
      case 'FREQUENCY':
        const transactionsPerMonth = (userMetrics.totalTransactions / Math.max(userMetrics.accountAge, 1)) * 30;
        if (transactionsPerMonth < 1) {
          baseImpact *= 1.4;
          confidence += 15;
        } else if (transactionsPerMonth > 20) {
          baseImpact *= 0.6;
          confidence -= 10;
        }
        
        factors.push({
          component: 'FREQUENCY',
          expectedChange: baseImpact * 0.9,
          weight: 0.25,
          confidence: confidence
        });
        break;
        
      case 'STAKING':
        const stakingBalance = parseFloat(userMetrics.stakingBalance);
        if (stakingBalance === 0) {
          baseImpact *= 1.6; // High impact for starting staking
          confidence += 20;
        } else {
          baseImpact *= 0.8; // Lower impact for optimization
          confidence += 5;
        }
        
        factors.push({
          component: 'STAKING',
          expectedChange: baseImpact * 0.85,
          weight: 0.25,
          confidence: confidence
        });
        break;
        
      case 'DEFI':
        const defiCount = userMetrics.defiProtocolsUsed.length;
        if (defiCount === 0) {
          baseImpact *= 1.8; // Very high impact for first DeFi usage
          confidence += 15;
        } else if (defiCount < 3) {
          baseImpact *= 1.2;
          confidence += 10;
        }
        
        // Adjust based on sophistication level
        if (behavioralInsights.sophisticationLevel === 'BEGINNER') {
          baseImpact *= 0.7; // Lower impact due to implementation difficulty
          confidence -= 15;
        }
        
        factors.push({
          component: 'DEFI',
          expectedChange: baseImpact * 0.75,
          weight: 0.20,
          confidence: confidence
        });
        break;
        
      case 'RISK':
        // Risk improvements have indirect but significant impact
        if (riskAssessment.overallRisk === 'HIGH' || riskAssessment.overallRisk === 'CRITICAL') {
          baseImpact *= 1.5;
          confidence += 20;
        }
        
        factors.push({
          component: 'RISK',
          expectedChange: baseImpact * 0.6, // Risk improvements affect overall score
          weight: 0.15,
          confidence: confidence
        });
        break;
        
      case 'EFFICIENCY':
        // Efficiency improvements have moderate direct impact
        if (behavioralInsights.gasOptimization && behavioralInsights.gasOptimization.overallEfficiencyScore < 50) {
          baseImpact *= 1.3;
          confidence += 10;
        }
        
        factors.push({
          component: 'EFFICIENCY',
          expectedChange: baseImpact * 0.7,
          weight: 0.10,
          confidence: confidence
        });
        break;
    }
    
    // Adjust confidence based on data quality
    if (userMetrics.totalTransactions < 10) {
      confidence -= 15;
    }
    if (userMetrics.accountAge < 30) {
      confidence -= 10;
    }
    
    return {
      scoreImpact: Math.round(baseImpact),
      confidence: Math.max(30, Math.min(95, confidence)),
      timeframe: template.timeframe as 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM',
      factors
    };
  }

  /**
   * Determine recommendation priority based on expected impact
   * Requirement 4.1: Priority ranking
   */
  private static determinePriority(expectedImpact: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (expectedImpact >= this.PRIORITY_THRESHOLDS.HIGH) {
      return 'HIGH';
    } else if (expectedImpact >= this.PRIORITY_THRESHOLDS.MEDIUM) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Prioritize and sort recommendations
   * Requirement 4.1: Prioritized suggestions
   */
  private static prioritizeRecommendations(recommendations: PersonalizedRecommendations[]): PersonalizedRecommendations[] {
    return recommendations.sort((a, b) => {
      // Calculate priority score for each recommendation
      const scoreA = this.calculateRecommendationScore(a);
      const scoreB = this.calculateRecommendationScore(b);
      
      return scoreB - scoreA; // Sort descending (highest score first)
    });
  }

  /**
   * Calculate overall recommendation score for prioritization
   */
  private static calculateRecommendationScore(recommendation: PersonalizedRecommendations): number {
    // Impact score (0-100)
    const impactScore = Math.min(100, recommendation.expectedScoreImpact * 2);
    
    // Feasibility score (0-100, inverted difficulty)
    const feasibilityScore = recommendation.implementationDifficulty === 'EASY' ? 100 :
                            recommendation.implementationDifficulty === 'MEDIUM' ? 60 : 30;
    
    // Urgency score (0-100)
    const urgencyScore = recommendation.timeToImpact === 'IMMEDIATE' ? 100 :
                        recommendation.timeToImpact === 'SHORT_TERM' ? 70 : 40;
    
    // Confidence score (0-100)
    const confidenceScore = recommendation.confidence;
    
    // Calculate weighted score
    const totalScore = (
      impactScore * this.RECOMMENDATION_WEIGHTS.IMPACT +
      feasibilityScore * this.RECOMMENDATION_WEIGHTS.FEASIBILITY +
      urgencyScore * this.RECOMMENDATION_WEIGHTS.URGENCY +
      confidenceScore * this.RECOMMENDATION_WEIGHTS.CONFIDENCE
    );
    
    return totalScore;
  }

  /**
   * Assess implementation difficulty
   * Requirement 4.2: Implementation difficulty assessment
   */
  public static assessImplementationDifficulty(
    recommendation: PersonalizedRecommendations,
    context: RecommendationContext
  ): {
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    factors: string[];
    timeEstimate: string;
    skillRequirements: string[];
  } {
    
    const factors: string[] = [];
    const skillRequirements: string[] = [];
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
    let timeEstimate = '1-2 weeks';
    
    const { behavioralInsights, userMetrics } = context;
    
    switch (recommendation.category) {
      case 'VOLUME':
      case 'FREQUENCY':
        difficulty = 'EASY';
        timeEstimate = '1-4 weeks';
        factors.push('Requires only basic transaction activity');
        factors.push('No technical knowledge needed');
        skillRequirements.push('Basic wallet usage');
        break;
        
      case 'STAKING':
        difficulty = 'MEDIUM';
        timeEstimate = '1-2 weeks setup, 3-6 months commitment';
        factors.push('Requires understanding of staking mechanics');
        factors.push('Involves locking up funds');
        factors.push('Need to choose appropriate staking provider');
        skillRequirements.push('Understanding of staking risks and rewards');
        skillRequirements.push('Ability to evaluate staking providers');
        break;
        
      case 'DEFI':
        if (behavioralInsights.sophisticationLevel === 'BEGINNER') {
          difficulty = 'HARD';
          timeEstimate = '2-4 weeks learning, 1-2 weeks implementation';
          factors.push('Requires significant DeFi knowledge');
          factors.push('High learning curve for beginners');
          factors.push('Multiple protocol interactions needed');
          skillRequirements.push('Understanding of DeFi protocols');
          skillRequirements.push('Risk assessment capabilities');
          skillRequirements.push('Smart contract interaction knowledge');
        } else {
          difficulty = 'MEDIUM';
          timeEstimate = '1-2 weeks';
          factors.push('Requires moderate DeFi knowledge');
          factors.push('Some protocol research needed');
          skillRequirements.push('Basic DeFi experience');
          skillRequirements.push('Protocol evaluation skills');
        }
        break;
        
      case 'RISK':
        difficulty = 'EASY';
        timeEstimate = '2-8 weeks';
        factors.push('Mainly requires behavioral changes');
        factors.push('No technical complexity');
        factors.push('Gradual implementation possible');
        skillRequirements.push('Self-discipline and planning');
        break;
        
      case 'EFFICIENCY':
        difficulty = 'EASY';
        timeEstimate = 'Immediate to 1 week';
        factors.push('Requires timing and planning adjustments');
        factors.push('No additional capital needed');
        factors.push('Can be implemented immediately');
        skillRequirements.push('Gas price monitoring');
        skillRequirements.push('Transaction timing optimization');
        break;
    }
    
    // Adjust based on user's current activity level
    if (userMetrics.totalTransactions < 5) {
      if (difficulty === 'EASY') difficulty = 'MEDIUM';
      else if (difficulty === 'MEDIUM') difficulty = 'HARD';
      factors.push('Limited transaction experience increases difficulty');
    }
    
    return {
      difficulty,
      factors,
      timeEstimate,
      skillRequirements
    };
  }

  /**
   * Generate timeline estimation for recommendation implementation
   * Requirement 4.2: Timeline estimation
   */
  public static generateTimelineEstimation(
    recommendation: PersonalizedRecommendations,
    context: RecommendationContext
  ): {
    phases: TimelinePhase[];
    totalDuration: string;
    milestones: Milestone[];
  } {
    
    const phases: TimelinePhase[] = [];
    const milestones: Milestone[] = [];
    
    switch (recommendation.category) {
      case 'VOLUME':
        phases.push(
          { phase: 'Planning', duration: '1-2 days', description: 'Plan transaction increases and timing' },
          { phase: 'Implementation', duration: '2-4 weeks', description: 'Gradually increase transaction volume' },
          { phase: 'Monitoring', duration: 'Ongoing', description: 'Track volume metrics and score impact' }
        );
        
        milestones.push(
          { milestone: 'First increased transaction', timeframe: '1 week', impact: 'Initial score improvement' },
          { milestone: 'Consistent volume pattern', timeframe: '4 weeks', impact: 'Stable score increase' },
          { milestone: 'Target volume achieved', timeframe: '8-12 weeks', impact: 'Maximum score benefit' }
        );
        break;
        
      case 'STAKING':
        phases.push(
          { phase: 'Research', duration: '3-7 days', description: 'Research staking options and providers' },
          { phase: 'Setup', duration: '1-2 days', description: 'Set up staking with chosen provider' },
          { phase: 'Monitoring', duration: '3-6 months', description: 'Monitor staking rewards and performance' }
        );
        
        milestones.push(
          { milestone: 'Staking provider selected', timeframe: '1 week', impact: 'Preparation complete' },
          { milestone: 'First stake deposited', timeframe: '1-2 weeks', impact: 'Immediate score boost' },
          { milestone: 'Optimal staking ratio', timeframe: '2-3 months', impact: 'Maximum staking benefit' }
        );
        break;
        
      case 'DEFI':
        if (context.behavioralInsights.sophisticationLevel === 'BEGINNER') {
          phases.push(
            { phase: 'Learning', duration: '1-2 weeks', description: 'Learn DeFi basics and protocol mechanics' },
            { phase: 'Testing', duration: '1 week', description: 'Test protocols with small amounts' },
            { phase: 'Implementation', duration: '2-4 weeks', description: 'Gradually increase DeFi usage' },
            { phase: 'Optimization', duration: 'Ongoing', description: 'Optimize protocol selection and usage' }
          );
        } else {
          phases.push(
            { phase: 'Research', duration: '2-3 days', description: 'Research new protocols to add' },
            { phase: 'Implementation', duration: '1-2 weeks', description: 'Begin using new protocols' },
            { phase: 'Optimization', duration: 'Ongoing', description: 'Optimize protocol portfolio' }
          );
        }
        
        milestones.push(
          { milestone: 'First DeFi interaction', timeframe: '1-2 weeks', impact: 'Initial sophistication boost' },
          { milestone: '3+ protocols used', timeframe: '4-6 weeks', impact: 'Significant diversification benefit' },
          { milestone: 'Consistent DeFi activity', timeframe: '8-12 weeks', impact: 'Maximum sophistication score' }
        );
        break;
        
      default:
        phases.push(
          { phase: 'Planning', duration: '1-2 days', description: 'Plan implementation approach' },
          { phase: 'Implementation', duration: '1-4 weeks', description: 'Execute recommendation' },
          { phase: 'Monitoring', duration: 'Ongoing', description: 'Monitor results and adjust' }
        );
        
        milestones.push(
          { milestone: 'Implementation started', timeframe: '1 week', impact: 'Initial progress' },
          { milestone: 'Target achieved', timeframe: '4-8 weeks', impact: 'Full benefit realized' }
        );
    }
    
    const totalDuration = phases.length > 2 ? '4-12 weeks' : '2-6 weeks';
    
    return {
      phases,
      totalDuration,
      milestones
    };
  }
}

interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
}

interface Milestone {
  milestone: string;
  timeframe: string;
  impact: string;
}