import { UserMetrics, TransactionData } from './blockchainService';
import { CreditScore, ScoreBreakdown } from './scoreCalculator';
import { PeerGroupAnalysisEngine, PeerGroup, UserPeerGroupClassification, PeerGroupMetrics } from './peerGroupAnalysisEngine';
import { CompetitivePositioningEngine, CompetitivePositioningData } from './competitivePositioningEngine';

export interface BenchmarkingData {
  address: string;
  peerGroupClassification: UserPeerGroupClassification;
  percentileRankings: PercentileRankings;
  comparativeAnalysis: ComparativeAnalysis;
  benchmarkCategories: BenchmarkCategory[];
  relativePerformance: RelativePerformance;
  competitivePositioning?: CompetitivePositioningData;
}

export interface PercentileRankings {
  overallScore: PercentileRanking;
  componentScores: {
    transactionVolume: PercentileRanking;
    transactionFrequency: PercentileRanking;
    stakingActivity: PercentileRanking;
    defiInteractions: PercentileRanking;
  };
  behavioralMetrics: {
    consistencyScore: PercentileRanking;
    diversificationScore: PercentileRanking;
    gasEfficiency: PercentileRanking;
    riskScore: PercentileRanking;
  };
}

export interface PercentileRanking {
  percentile: number; // 0-100
  rank: number; // Actual rank within peer group
  totalInGroup: number;
  category: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR';
  explanation: string;
  improvementPotential: number; // Points to next category
}

export interface ComparativeAnalysis {
  vsGroupAverage: {
    scoreDifference: number;
    percentageDifference: number;
    betterThan: number; // Percentage of peer group
    explanation: string;
  };
  vsTopPerformers: {
    scoreDifference: number;
    gapToTop10: number;
    gapToTop25: number;
    explanation: string;
  };
  strengthsVsPeers: ComponentComparison[];
  weaknessesVsPeers: ComponentComparison[];
  opportunityAreas: OpportunityArea[];
}

export interface ComponentComparison {
  component: string;
  userScore: number;
  peerAverage: number;
  percentileDifference: number;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface OpportunityArea {
  area: string;
  currentPercentile: number;
  potentialPercentile: number;
  impactOnOverallScore: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  actionItems: string[];
}

export interface BenchmarkCategory {
  name: string;
  description: string;
  userQualifies: boolean;
  requirements: string[];
  benefits: string[];
  percentageOfUsers: number;
}

export interface RelativePerformance {
  overallRating: 'EXCEPTIONAL' | 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE' | 'NEEDS_IMPROVEMENT';
  keyStrengths: string[];
  keyWeaknesses: string[];
  competitiveAdvantages: string[];
  improvementPriorities: string[];
  marketPosition: string;
}

/**
 * Benchmarking Engine
 * Provides comprehensive benchmarking and comparative analysis
 */
export class BenchmarkingEngine {
  // Percentile thresholds for categorization
  private static readonly PERCENTILE_CATEGORIES = {
    EXCELLENT: { min: 90, max: 100 },
    GOOD: { min: 75, max: 89 },
    AVERAGE: { min: 40, max: 74 },
    BELOW_AVERAGE: { min: 20, max: 39 },
    POOR: { min: 0, max: 19 }
  };

  // Benchmark category definitions
  private static readonly BENCHMARK_CATEGORIES: Omit<BenchmarkCategory, 'userQualifies' | 'percentageOfUsers'>[] = [
    {
      name: 'Elite Performer',
      description: 'Top 5% of users across all metrics with exceptional performance',
      requirements: [
        'Overall score above 90th percentile',
        'All component scores above 75th percentile',
        'Account age > 180 days',
        'Consistent activity pattern'
      ],
      benefits: [
        'Access to premium features',
        'Lower risk assessment',
        'Priority customer support',
        'Advanced analytics dashboard'
      ]
    },
    {
      name: 'High Achiever',
      description: 'Top 15% of users with strong performance across most metrics',
      requirements: [
        'Overall score above 75th percentile',
        'At least 3 component scores above 60th percentile',
        'Account age > 90 days'
      ],
      benefits: [
        'Enhanced credit limits',
        'Reduced fees',
        'Advanced features access',
        'Personalized recommendations'
      ]
    },
    {
      name: 'Solid Performer',
      description: 'Top 40% of users with consistent, reliable performance',
      requirements: [
        'Overall score above 50th percentile',
        'No component scores below 25th percentile',
        'Regular activity pattern'
      ],
      benefits: [
        'Standard credit access',
        'Basic analytics',
        'Community features',
        'Educational resources'
      ]
    },
    {
      name: 'Emerging User',
      description: 'Users showing growth potential with room for improvement',
      requirements: [
        'Account age > 30 days',
        'At least 10 transactions',
        'Improving trend in recent activity'
      ],
      benefits: [
        'Growth tracking',
        'Improvement guidance',
        'Educational content',
        'Community support'
      ]
    },
    {
      name: 'New User',
      description: 'Recently joined users building their credit profile',
      requirements: [
        'Account age < 90 days',
        'At least 1 transaction',
        'Valid wallet connection'
      ],
      benefits: [
        'Onboarding support',
        'Basic features access',
        'Learning resources',
        'Progress tracking'
      ]
    }
  ];

  /**
   * Generate comprehensive benchmarking data for a user
   */
  public static async generateBenchmarkingData(
    address: string,
    creditScore: CreditScore,
    scoreBreakdown: ScoreBreakdown,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[],
    includeCompetitivePositioning: boolean = false
  ): Promise<BenchmarkingData> {
    // Classify user into peer groups
    const peerGroupClassification = PeerGroupAnalysisEngine.classifyUserIntoPeerGroups(
      address,
      metrics,
      transactionHistory
    );

    // Calculate percentile rankings
    const percentileRankings = this.calculatePercentileRankings(
      creditScore,
      scoreBreakdown,
      peerGroupClassification.primaryPeerGroup
    );

    // Generate comparative analysis
    const comparativeAnalysis = this.generateComparativeAnalysis(
      creditScore,
      scoreBreakdown,
      peerGroupClassification.primaryPeerGroup,
      percentileRankings
    );

    // Determine benchmark categories
    const benchmarkCategories = this.determineBenchmarkCategories(
      creditScore,
      metrics,
      percentileRankings
    );

    // Assess relative performance
    const relativePerformance = this.assessRelativePerformance(
      creditScore,
      scoreBreakdown,
      percentileRankings,
      comparativeAnalysis
    );

    // Generate competitive positioning if requested
    let competitivePositioning: CompetitivePositioningData | undefined;
    if (includeCompetitivePositioning) {
      competitivePositioning = await CompetitivePositioningEngine.generateCompetitivePositioning(
        address,
        creditScore,
        scoreBreakdown,
        metrics,
        {
          address,
          peerGroupClassification,
          percentileRankings,
          comparativeAnalysis,
          benchmarkCategories,
          relativePerformance
        },
        transactionHistory
      );
    }

    return {
      address,
      peerGroupClassification,
      percentileRankings,
      comparativeAnalysis,
      benchmarkCategories,
      relativePerformance,
      competitivePositioning
    };
  }

  /**
   * Calculate percentile rankings across all scoring dimensions
   */
  private static calculatePercentileRankings(
    creditScore: CreditScore,
    scoreBreakdown: ScoreBreakdown,
    peerGroup: PeerGroup
  ): PercentileRankings {
    return {
      overallScore: this.calculateSinglePercentileRanking(
        creditScore.score,
        peerGroup.scoreRange,
        peerGroup.memberCount,
        'Overall Credit Score'
      ),
      componentScores: {
        transactionVolume: this.calculateComponentPercentileRanking(
          scoreBreakdown.transactionVolume.score,
          'Transaction Volume',
          peerGroup
        ),
        transactionFrequency: this.calculateComponentPercentileRanking(
          scoreBreakdown.transactionFrequency.score,
          'Transaction Frequency',
          peerGroup
        ),
        stakingActivity: this.calculateComponentPercentileRanking(
          scoreBreakdown.stakingActivity.score,
          'Staking Activity',
          peerGroup
        ),
        defiInteractions: this.calculateComponentPercentileRanking(
          scoreBreakdown.defiInteractions.score,
          'DeFi Interactions',
          peerGroup
        )
      },
      behavioralMetrics: {
        consistencyScore: this.calculateBehavioralPercentileRanking(
          scoreBreakdown.behavioralInsights.consistencyScore,
          'Consistency Score',
          peerGroup
        ),
        diversificationScore: this.calculateBehavioralPercentileRanking(
          this.convertDiversificationLevelToScore(scoreBreakdown.behavioralInsights.diversificationLevel),
          'Diversification Score',
          peerGroup
        ),
        gasEfficiency: this.calculateBehavioralPercentileRanking(
          scoreBreakdown.behavioralInsights.gasEfficiency,
          'Gas Efficiency',
          peerGroup
        ),
        riskScore: this.calculateBehavioralPercentileRanking(
          100 - scoreBreakdown.riskAssessment.riskScore, // Invert risk score (lower risk = higher percentile)
          'Risk Management',
          peerGroup
        )
      }
    };
  }

  /**
   * Calculate percentile ranking for a single score
   */
  private static calculateSinglePercentileRanking(
    userScore: number,
    scoreRange: PeerGroup['scoreRange'],
    totalInGroup: number,
    metricName: string
  ): PercentileRanking {
    // Calculate percentile based on score distribution
    let percentile: number;
    
    if (userScore >= scoreRange.percentiles.p90) {
      percentile = 90 + ((userScore - scoreRange.percentiles.p90) / (scoreRange.max - scoreRange.percentiles.p90)) * 10;
    } else if (userScore >= scoreRange.percentiles.p75) {
      percentile = 75 + ((userScore - scoreRange.percentiles.p75) / (scoreRange.percentiles.p90 - scoreRange.percentiles.p75)) * 15;
    } else if (userScore >= scoreRange.percentiles.p50) {
      percentile = 50 + ((userScore - scoreRange.percentiles.p50) / (scoreRange.percentiles.p75 - scoreRange.percentiles.p50)) * 25;
    } else if (userScore >= scoreRange.percentiles.p25) {
      percentile = 25 + ((userScore - scoreRange.percentiles.p25) / (scoreRange.percentiles.p50 - scoreRange.percentiles.p25)) * 25;
    } else {
      percentile = (userScore - scoreRange.min) / (scoreRange.percentiles.p25 - scoreRange.min) * 25;
    }

    percentile = Math.max(0, Math.min(100, percentile));
    const rank = Math.ceil((100 - percentile) / 100 * totalInGroup);
    
    // Determine category
    let category: PercentileRanking['category'];
    if (percentile >= this.PERCENTILE_CATEGORIES.EXCELLENT.min) category = 'EXCELLENT';
    else if (percentile >= this.PERCENTILE_CATEGORIES.GOOD.min) category = 'GOOD';
    else if (percentile >= this.PERCENTILE_CATEGORIES.AVERAGE.min) category = 'AVERAGE';
    else if (percentile >= this.PERCENTILE_CATEGORIES.BELOW_AVERAGE.min) category = 'BELOW_AVERAGE';
    else category = 'POOR';

    // Calculate improvement potential
    const nextCategoryThreshold = this.getNextCategoryThreshold(category);
    const improvementPotential = nextCategoryThreshold ? 
      Math.ceil((nextCategoryThreshold - percentile) / 100 * (scoreRange.max - scoreRange.min)) : 0;

    const explanation = this.generatePercentileExplanation(percentile, category, metricName, totalInGroup);

    return {
      percentile: Math.round(percentile),
      rank,
      totalInGroup,
      category,
      explanation,
      improvementPotential
    };
  }

  /**
   * Calculate component-specific percentile ranking
   */
  private static calculateComponentPercentileRanking(
    componentScore: number,
    componentName: string,
    peerGroup: PeerGroup
  ): PercentileRanking {
    // Estimate component score range based on overall score range
    const componentRange = {
      min: Math.round(peerGroup.scoreRange.min * 0.8),
      max: Math.round(peerGroup.scoreRange.max * 1.2),
      percentiles: {
        p25: Math.round(peerGroup.scoreRange.percentiles.p25 * 0.9),
        p50: Math.round(peerGroup.scoreRange.percentiles.p50),
        p75: Math.round(peerGroup.scoreRange.percentiles.p75 * 1.1),
        p90: Math.round(peerGroup.scoreRange.percentiles.p90 * 1.15)
      }
    };

    return this.calculateSinglePercentileRanking(
      componentScore,
      componentRange,
      peerGroup.memberCount,
      componentName
    );
  }

  /**
   * Calculate behavioral metric percentile ranking
   */
  private static calculateBehavioralPercentileRanking(
    behavioralScore: number,
    metricName: string,
    peerGroup: PeerGroup
  ): PercentileRanking {
    // Behavioral metrics are typically 0-100 scale
    const behavioralRange = {
      min: 0,
      max: 100,
      percentiles: {
        p25: 40,
        p50: 60,
        p75: 80,
        p90: 90
      }
    };

    return this.calculateSinglePercentileRanking(
      behavioralScore,
      behavioralRange,
      peerGroup.memberCount,
      metricName
    );
  }

  /**
   * Generate comparative analysis against peer group
   */
  private static generateComparativeAnalysis(
    creditScore: CreditScore,
    scoreBreakdown: ScoreBreakdown,
    peerGroup: PeerGroup,
    percentileRankings: PercentileRankings
  ): ComparativeAnalysis {
    const scoreDifference = creditScore.score - peerGroup.averageScore;
    const percentageDifference = (scoreDifference / peerGroup.averageScore) * 100;
    const betterThan = percentileRankings.overallScore.percentile;

    // Identify strengths and weaknesses
    const componentComparisons = this.analyzeComponentComparisons(scoreBreakdown, peerGroup);
    const strengthsVsPeers = componentComparisons.filter(comp => comp.percentileDifference > 10);
    const weaknessesVsPeers = componentComparisons.filter(comp => comp.percentileDifference < -10);

    // Calculate gaps to top performers
    const gapToTop10 = peerGroup.scoreRange.percentiles.p90 - creditScore.score;
    const gapToTop25 = peerGroup.scoreRange.percentiles.p75 - creditScore.score;

    // Identify opportunity areas
    const opportunityAreas = this.identifyOpportunityAreas(scoreBreakdown, percentileRankings);

    return {
      vsGroupAverage: {
        scoreDifference,
        percentageDifference: Math.round(percentageDifference * 100) / 100,
        betterThan,
        explanation: this.generateGroupAverageExplanation(scoreDifference, betterThan, peerGroup.name)
      },
      vsTopPerformers: {
        scoreDifference: gapToTop10,
        gapToTop10: Math.max(0, gapToTop10),
        gapToTop25: Math.max(0, gapToTop25),
        explanation: this.generateTopPerformersExplanation(gapToTop10, gapToTop25)
      },
      strengthsVsPeers,
      weaknessesVsPeers,
      opportunityAreas
    };
  }

  /**
   * Analyze component comparisons against peer group
   */
  private static analyzeComponentComparisons(
    scoreBreakdown: ScoreBreakdown,
    peerGroup: PeerGroup
  ): ComponentComparison[] {
    const components = [
      {
        name: 'Transaction Volume',
        userScore: scoreBreakdown.transactionVolume.score,
        estimatedPeerAverage: peerGroup.averageScore * 0.3 // Assuming 30% weight
      },
      {
        name: 'Transaction Frequency',
        userScore: scoreBreakdown.transactionFrequency.score,
        estimatedPeerAverage: peerGroup.averageScore * 0.25 // Assuming 25% weight
      },
      {
        name: 'Staking Activity',
        userScore: scoreBreakdown.stakingActivity.score,
        estimatedPeerAverage: peerGroup.averageScore * 0.25 // Assuming 25% weight
      },
      {
        name: 'DeFi Interactions',
        userScore: scoreBreakdown.defiInteractions.score,
        estimatedPeerAverage: peerGroup.averageScore * 0.2 // Assuming 20% weight
      }
    ];

    return components.map(comp => {
      const percentileDifference = ((comp.userScore - comp.estimatedPeerAverage) / comp.estimatedPeerAverage) * 100;
      
      let significance: ComponentComparison['significance'];
      if (Math.abs(percentileDifference) > 25) significance = 'HIGH';
      else if (Math.abs(percentileDifference) > 10) significance = 'MEDIUM';
      else significance = 'LOW';

      return {
        component: comp.name,
        userScore: comp.userScore,
        peerAverage: Math.round(comp.estimatedPeerAverage),
        percentileDifference: Math.round(percentileDifference),
        significance,
        explanation: this.generateComponentComparisonExplanation(
          comp.name,
          comp.userScore,
          comp.estimatedPeerAverage,
          percentileDifference
        )
      };
    });
  }

  /**
   * Identify opportunity areas for improvement
   */
  private static identifyOpportunityAreas(
    scoreBreakdown: ScoreBreakdown,
    percentileRankings: PercentileRankings
  ): OpportunityArea[] {
    const opportunities: OpportunityArea[] = [];

    // Check each component for improvement potential
    const components = [
      {
        name: 'Transaction Volume',
        currentPercentile: percentileRankings.componentScores.transactionVolume.percentile,
        currentScore: scoreBreakdown.transactionVolume.score
      },
      {
        name: 'Transaction Frequency',
        currentPercentile: percentileRankings.componentScores.transactionFrequency.percentile,
        currentScore: scoreBreakdown.transactionFrequency.score
      },
      {
        name: 'Staking Activity',
        currentPercentile: percentileRankings.componentScores.stakingActivity.percentile,
        currentScore: scoreBreakdown.stakingActivity.score
      },
      {
        name: 'DeFi Interactions',
        currentPercentile: percentileRankings.componentScores.defiInteractions.percentile,
        currentScore: scoreBreakdown.defiInteractions.score
      }
    ];

    components.forEach(comp => {
      if (comp.currentPercentile < 75) { // Room for improvement
        const potentialPercentile = Math.min(90, comp.currentPercentile + 25);
        const impactOnOverallScore = (potentialPercentile - comp.currentPercentile) * 2; // Rough estimate

        let difficulty: OpportunityArea['difficulty'];
        let timeframe: OpportunityArea['timeframe'];
        let actionItems: string[];

        if (comp.name === 'Transaction Volume') {
          difficulty = 'MEDIUM';
          timeframe = 'MEDIUM_TERM';
          actionItems = [
            'Increase transaction volume gradually',
            'Focus on larger, meaningful transactions',
            'Optimize gas usage for better efficiency'
          ];
        } else if (comp.name === 'Transaction Frequency') {
          difficulty = 'EASY';
          timeframe = 'SHORT_TERM';
          actionItems = [
            'Maintain regular transaction activity',
            'Set up recurring transactions if possible',
            'Engage with DeFi protocols regularly'
          ];
        } else if (comp.name === 'Staking Activity') {
          difficulty = 'EASY';
          timeframe = 'SHORT_TERM';
          actionItems = [
            'Stake a portion of holdings',
            'Explore different staking protocols',
            'Consider liquid staking options'
          ];
        } else { // DeFi Interactions
          difficulty = 'MEDIUM';
          timeframe = 'MEDIUM_TERM';
          actionItems = [
            'Explore new DeFi protocols',
            'Diversify across different DeFi categories',
            'Start with established, low-risk protocols'
          ];
        }

        opportunities.push({
          area: comp.name,
          currentPercentile: comp.currentPercentile,
          potentialPercentile,
          impactOnOverallScore: Math.round(impactOnOverallScore),
          difficulty,
          timeframe,
          actionItems
        });
      }
    });

    // Sort by impact potential
    return opportunities.sort((a, b) => b.impactOnOverallScore - a.impactOnOverallScore);
  }

  /**
   * Determine which benchmark categories a user qualifies for
   */
  private static determineBenchmarkCategories(
    creditScore: CreditScore,
    metrics: UserMetrics,
    percentileRankings: PercentileRankings
  ): BenchmarkCategory[] {
    return this.BENCHMARK_CATEGORIES.map(category => {
      const userQualifies = this.checkCategoryQualification(
        category,
        creditScore,
        metrics,
        percentileRankings
      );

      // Estimate percentage of users in this category
      const percentageOfUsers = this.estimateCategoryPercentage(category.name);

      return {
        ...category,
        userQualifies,
        percentageOfUsers
      };
    });
  }

  /**
   * Check if user qualifies for a benchmark category
   */
  private static checkCategoryQualification(
    category: Omit<BenchmarkCategory, 'userQualifies' | 'percentageOfUsers'>,
    creditScore: CreditScore,
    metrics: UserMetrics,
    percentileRankings: PercentileRankings
  ): boolean {
    const overallPercentile = percentileRankings.overallScore.percentile;
    const accountAge = metrics.accountAge;
    const totalTransactions = metrics.totalTransactions;

    switch (category.name) {
      case 'Elite Performer':
        return overallPercentile >= 95 && 
               accountAge > 180 && 
               this.hasConsistentActivity(percentileRankings);
      
      case 'High Achiever':
        return overallPercentile >= 75 && 
               accountAge > 90 && 
               this.hasGoodComponentScores(percentileRankings);
      
      case 'Solid Performer':
        return overallPercentile >= 50 && 
               this.hasNoWeakComponents(percentileRankings);
      
      case 'Emerging User':
        return accountAge > 30 && 
               totalTransactions >= 10 && 
               this.hasImprovingTrend(creditScore);
      
      case 'New User':
        return accountAge < 90 && 
               totalTransactions >= 1;
      
      default:
        return false;
    }
  }

  /**
   * Helper methods for category qualification
   */
  private static hasConsistentActivity(percentileRankings: PercentileRankings): boolean {
    return percentileRankings.behavioralMetrics.consistencyScore.percentile >= 75;
  }

  private static hasGoodComponentScores(percentileRankings: PercentileRankings): boolean {
    const componentScores = Object.values(percentileRankings.componentScores);
    const goodScores = componentScores.filter(score => score.percentile >= 60);
    return goodScores.length >= 3;
  }

  private static hasNoWeakComponents(percentileRankings: PercentileRankings): boolean {
    const componentScores = Object.values(percentileRankings.componentScores);
    const weakScores = componentScores.filter(score => score.percentile < 25);
    return weakScores.length === 0;
  }

  private static hasImprovingTrend(creditScore: CreditScore): boolean {
    // In a real implementation, this would check historical data
    // For now, assume users with decent confidence have improving trends
    return creditScore.confidence >= 60;
  }

  /**
   * Estimate percentage of users in each category
   */
  private static estimateCategoryPercentage(categoryName: string): number {
    switch (categoryName) {
      case 'Elite Performer': return 5;
      case 'High Achiever': return 15;
      case 'Solid Performer': return 40;
      case 'Emerging User': return 25;
      case 'New User': return 15;
      default: return 0;
    }
  }

  /**
   * Assess overall relative performance
   */
  private static assessRelativePerformance(
    creditScore: CreditScore,
    scoreBreakdown: ScoreBreakdown,
    percentileRankings: PercentileRankings,
    comparativeAnalysis: ComparativeAnalysis
  ): RelativePerformance {
    const overallPercentile = percentileRankings.overallScore.percentile;
    
    // Determine overall rating
    let overallRating: RelativePerformance['overallRating'];
    if (overallPercentile >= 90) overallRating = 'EXCEPTIONAL';
    else if (overallPercentile >= 70) overallRating = 'ABOVE_AVERAGE';
    else if (overallPercentile >= 40) overallRating = 'AVERAGE';
    else if (overallPercentile >= 20) overallRating = 'BELOW_AVERAGE';
    else overallRating = 'NEEDS_IMPROVEMENT';

    // Identify key strengths and weaknesses
    const keyStrengths = comparativeAnalysis.strengthsVsPeers
      .filter(strength => strength.significance === 'HIGH')
      .map(strength => strength.component);

    const keyWeaknesses = comparativeAnalysis.weaknessesVsPeers
      .filter(weakness => weakness.significance === 'HIGH')
      .map(weakness => weakness.component);

    // Identify competitive advantages
    const competitiveAdvantages = this.identifyCompetitiveAdvantages(
      percentileRankings,
      scoreBreakdown
    );

    // Prioritize improvements
    const improvementPriorities = comparativeAnalysis.opportunityAreas
      .slice(0, 3) // Top 3 priorities
      .map(opp => opp.area);

    // Generate market position description
    const marketPosition = this.generateMarketPositionDescription(
      overallPercentile,
      comparativeAnalysis.vsGroupAverage.betterThan
    );

    return {
      overallRating,
      keyStrengths,
      keyWeaknesses,
      competitiveAdvantages,
      improvementPriorities,
      marketPosition
    };
  }

  /**
   * Helper methods for generating explanations
   */
  private static generatePercentileExplanation(
    percentile: number,
    category: PercentileRanking['category'],
    metricName: string,
    totalInGroup: number
  ): string {
    const rank = Math.ceil((100 - percentile) / 100 * totalInGroup);
    return `Your ${metricName} ranks ${rank} out of ${totalInGroup} users in your peer group (${percentile}th percentile). This is considered ${category.toLowerCase()} performance.`;
  }

  private static generateGroupAverageExplanation(
    scoreDifference: number,
    betterThan: number,
    groupName: string
  ): string {
    if (scoreDifference > 0) {
      return `You score ${scoreDifference} points above the average for ${groupName}, performing better than ${betterThan}% of your peers.`;
    } else {
      return `You score ${Math.abs(scoreDifference)} points below the average for ${groupName}, with room for improvement to match peer performance.`;
    }
  }

  private static generateTopPerformersExplanation(gapToTop10: number, gapToTop25: number): string {
    if (gapToTop10 <= 0) {
      return 'You are already among the top 10% of performers in your peer group!';
    } else if (gapToTop25 <= 0) {
      return `You are in the top 25% of performers. You need ${gapToTop10} more points to reach the top 10%.`;
    } else {
      return `You need ${gapToTop25} points to reach the top 25% and ${gapToTop10} points to reach the top 10% of performers.`;
    }
  }

  private static generateComponentComparisonExplanation(
    componentName: string,
    userScore: number,
    peerAverage: number,
    percentileDifference: number
  ): string {
    if (percentileDifference > 0) {
      return `Your ${componentName} score of ${userScore} is ${percentileDifference.toFixed(1)}% above the peer average of ${peerAverage}.`;
    } else {
      return `Your ${componentName} score of ${userScore} is ${Math.abs(percentileDifference).toFixed(1)}% below the peer average of ${peerAverage}.`;
    }
  }

  private static identifyCompetitiveAdvantages(
    percentileRankings: PercentileRankings,
    scoreBreakdown: ScoreBreakdown
  ): string[] {
    const advantages: string[] = [];

    // Check for exceptional performance in specific areas
    if (percentileRankings.componentScores.transactionVolume.percentile >= 90) {
      advantages.push('High transaction volume demonstrates significant market activity');
    }
    
    if (percentileRankings.componentScores.stakingActivity.percentile >= 90) {
      advantages.push('Strong staking activity shows long-term commitment and stability');
    }
    
    if (percentileRankings.componentScores.defiInteractions.percentile >= 90) {
      advantages.push('Extensive DeFi usage indicates advanced protocol knowledge');
    }
    
    if (percentileRankings.behavioralMetrics.consistencyScore.percentile >= 90) {
      advantages.push('Exceptional consistency in behavior patterns');
    }
    
    if (percentileRankings.behavioralMetrics.gasEfficiency.percentile >= 90) {
      advantages.push('Superior gas optimization skills');
    }

    return advantages;
  }

  private static generateMarketPositionDescription(
    overallPercentile: number,
    betterThan: number
  ): string {
    if (overallPercentile >= 95) {
      return 'Elite market position - among the top 5% of all users';
    } else if (overallPercentile >= 90) {
      return 'Exceptional market position - top 10% performer';
    } else if (overallPercentile >= 75) {
      return 'Strong market position - well above average performance';
    } else if (overallPercentile >= 50) {
      return 'Solid market position - above average with room for growth';
    } else if (overallPercentile >= 25) {
      return 'Developing market position - below average but with clear improvement path';
    } else {
      return 'Early-stage market position - significant opportunity for improvement';
    }
  }

  private static getNextCategoryThreshold(
    currentCategory: PercentileRanking['category']
  ): number | null {
    switch (currentCategory) {
      case 'POOR': return this.PERCENTILE_CATEGORIES.BELOW_AVERAGE.min;
      case 'BELOW_AVERAGE': return this.PERCENTILE_CATEGORIES.AVERAGE.min;
      case 'AVERAGE': return this.PERCENTILE_CATEGORIES.GOOD.min;
      case 'GOOD': return this.PERCENTILE_CATEGORIES.EXCELLENT.min;
      case 'EXCELLENT': return null; // Already at the top
      default: return null;
    }
  }

  /**
   * Convert diversification level to numeric score for percentile calculation
   */
  private static convertDiversificationLevelToScore(level: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (level) {
      case 'LOW': return 25;
      case 'MEDIUM': return 60;
      case 'HIGH': return 85;
      default: return 50;
    }
  }
}