import { UserMetrics } from './blockchainService';

export interface CreditScore {
  address: string;
  score: number; // 0-1000
  confidence: number; // 0-100
  timestamp: number;
  breakdown: {
    transactionVolume: number;
    transactionFrequency: number;
    stakingActivity: number;
    defiInteractions: number;
  };
}

export interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number; // 0-100
  riskFactors: string[];
  flags: {
    concentrationRisk: boolean;
    volatilityRisk: boolean;
    inactivityRisk: boolean;
    newAccountRisk: boolean;
    unusualPatterns: boolean;
  };
}

export interface BehavioralInsights {
  consistencyScore: number; // 0-100
  growthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  gasEfficiency: number; // 0-100
  activityPattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE';
  preferredProtocols: string[];
}

export interface PersonalizedRecommendations {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'VOLUME' | 'FREQUENCY' | 'STAKING' | 'DEFI' | 'RISK';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
}

export interface DetailedScoreInsights {
  explanation: string;
  strengths: string[];
  weaknesses: string[];
  improvementPotential: number; // 0-100
  benchmarkComparison: {
    percentile: number;
    category: string;
  };
}

export interface ScoreBreakdown {
  transactionVolume: {
    score: number;
    weight: number;
    weightedScore: number;
    details: {
      totalVolume: string;
      volumeScore: number;
      volumeCategory: string;
      gasEfficiency: number;
    };
    insights: DetailedScoreInsights;
  };
  transactionFrequency: {
    score: number;
    weight: number;
    weightedScore: number;
    details: {
      totalTransactions: number;
      accountAge: number;
      frequencyScore: number;
      avgTransactionsPerMonth: number;
      consistencyScore: number;
    };
    insights: DetailedScoreInsights;
  };
  stakingActivity: {
    score: number;
    weight: number;
    weightedScore: number;
    details: {
      stakingBalance: string;
      stakingScore: number;
      stakingRatio: number;
      stakingProtocols: string[];
      stakingDuration: number;
    };
    insights: DetailedScoreInsights;
  };
  defiInteractions: {
    score: number;
    weight: number;
    weightedScore: number;
    details: {
      protocolsUsed: number;
      defiScore: number;
      diversificationScore: number;
      totalDefiVolume: string;
      favoriteProtocols: string[];
    };
    insights: DetailedScoreInsights;
  };
  riskAssessment: RiskAssessment;
  behavioralInsights: BehavioralInsights;
  recommendations: PersonalizedRecommendations[];
}

/**
 * Credit Score Calculator Service
 * Implements the scoring algorithm based on on-chain metrics
 */
export class ScoreCalculator {
  // Scoring weights (must sum to 1.0)
  private static readonly WEIGHTS = {
    TRANSACTION_VOLUME: 0.30,    // 30%
    TRANSACTION_FREQUENCY: 0.25, // 25%
    STAKING_ACTIVITY: 0.25,      // 25%
    DEFI_INTERACTIONS: 0.20      // 20%
  };

  // Scoring parameters for normalization
  private static readonly SCORING_PARAMS = {
    // Volume scoring (logarithmic scale)
    VOLUME: {
      MIN_ETH: 0.001,    // Minimum ETH for scoring (very inclusive - 0.001 ETH)
      MAX_ETH: 10000,    // ETH amount that gives max score
      LOG_BASE: 10       // Logarithmic base for scaling
    },

    // Frequency scoring
    FREQUENCY: {
      MIN_TRANSACTIONS: 1,     // Minimum transactions
      MAX_TRANSACTIONS: 1000,  // Transactions that give max score
      MIN_ACCOUNT_AGE: 1,      // Minimum account age in days
      OPTIMAL_ACCOUNT_AGE: 365 // Account age that gives max score
    },

    // Staking scoring
    STAKING: {
      MIN_STAKE: 0.01,   // Minimum stake in ETH
      MAX_STAKE: 100,    // Stake amount that gives max score
    },

    // DeFi scoring
    DEFI: {
      MIN_PROTOCOLS: 1,  // Minimum protocols used
      MAX_PROTOCOLS: 20  // Number of protocols that gives max score
    }
  };

  /**
   * Calculate transaction volume score (0-1000)
   * Uses logarithmic scaling to handle wide range of transaction volumes
   */
  private static calculateVolumeScore(totalVolume: string): number {
    const volume = parseFloat(totalVolume);

    if (volume < this.SCORING_PARAMS.VOLUME.MIN_ETH) {
      return 0;
    }

    // Use logarithmic scale for volume scoring
    const logMin = Math.log(this.SCORING_PARAMS.VOLUME.MIN_ETH) / Math.log(this.SCORING_PARAMS.VOLUME.LOG_BASE);
    const logMax = Math.log(this.SCORING_PARAMS.VOLUME.MAX_ETH) / Math.log(this.SCORING_PARAMS.VOLUME.LOG_BASE);
    const logVolume = Math.log(volume) / Math.log(this.SCORING_PARAMS.VOLUME.LOG_BASE);

    // Normalize to 0-1000 scale
    const normalizedScore = Math.min(1, (logVolume - logMin) / (logMax - logMin));
    return Math.round(normalizedScore * 1000);
  }

  /**
   * Calculate transaction frequency score (0-1000)
   * Based on transaction count and account age consistency
   */
  private static calculateFrequencyScore(totalTransactions: number, accountAge: number): number {
    if (totalTransactions < this.SCORING_PARAMS.FREQUENCY.MIN_TRANSACTIONS || accountAge < this.SCORING_PARAMS.FREQUENCY.MIN_ACCOUNT_AGE) {
      return 0;
    }

    // Calculate transaction frequency (transactions per day)
    const transactionsPerDay = totalTransactions / Math.max(accountAge, 1);

    // Score based on transaction count (0-500 points)
    const transactionScore = Math.min(500,
      (totalTransactions / this.SCORING_PARAMS.FREQUENCY.MAX_TRANSACTIONS) * 500
    );

    // Score based on account age and consistency (0-500 points)
    const ageScore = Math.min(500,
      (accountAge / this.SCORING_PARAMS.FREQUENCY.OPTIMAL_ACCOUNT_AGE) * 300
    );

    // Bonus for consistent activity (up to 200 points)
    const consistencyBonus = Math.min(200, transactionsPerDay * 50);

    const totalScore = transactionScore + ageScore + consistencyBonus;
    return Math.round(Math.min(1000, totalScore));
  }

  /**
   * Calculate staking activity score (0-1000)
   * Based on amount staked relative to account activity
   */
  private static calculateStakingScore(stakingBalance: string): number {
    const staked = parseFloat(stakingBalance);

    if (staked < this.SCORING_PARAMS.STAKING.MIN_STAKE) {
      return 0;
    }

    // Linear scaling for staking amount
    const stakingRatio = Math.min(1, staked / this.SCORING_PARAMS.STAKING.MAX_STAKE);

    // Base score from staking amount (0-800 points)
    const baseScore = stakingRatio * 800;

    // Bonus for any staking activity (200 points)
    const stakingBonus = 200;

    return Math.round(baseScore + stakingBonus);
  }

  /**
   * Calculate DeFi interactions score (0-1000)
   * Based on number of unique protocols used
   */
  private static calculateDeFiScore(protocolsUsed: string[]): number {
    const protocolCount = protocolsUsed.length;

    if (protocolCount < this.SCORING_PARAMS.DEFI.MIN_PROTOCOLS) {
      return 0;
    }

    // Linear scaling for protocol diversity
    const protocolRatio = Math.min(1, protocolCount / this.SCORING_PARAMS.DEFI.MAX_PROTOCOLS);

    // Base score from protocol count (0-700 points)
    const baseScore = protocolRatio * 700;

    // Bonus for DeFi participation (300 points)
    const defiBonus = 300;

    return Math.round(baseScore + defiBonus);
  }

  /**
   * Calculate the overall credit score with weighted components
   */
  public static calculateCreditScore(address: string, metrics: UserMetrics): CreditScore {
    // Calculate individual component scores
    const volumeScore = this.calculateVolumeScore(metrics.totalVolume);
    const frequencyScore = this.calculateFrequencyScore(metrics.totalTransactions, metrics.accountAge);
    const stakingScore = this.calculateStakingScore(metrics.stakingBalance);
    const defiScore = this.calculateDeFiScore(metrics.defiProtocolsUsed);

    // Calculate weighted final score
    const finalScore = Math.round(
      (volumeScore * this.WEIGHTS.TRANSACTION_VOLUME) +
      (frequencyScore * this.WEIGHTS.TRANSACTION_FREQUENCY) +
      (stakingScore * this.WEIGHTS.STAKING_ACTIVITY) +
      (defiScore * this.WEIGHTS.DEFI_INTERACTIONS)
    );

    // Ensure score is within bounds
    const boundedScore = Math.max(0, Math.min(1000, finalScore));

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(metrics);

    return {
      address,
      score: boundedScore,
      confidence,
      timestamp: Math.floor(Date.now() / 1000),
      breakdown: {
        transactionVolume: volumeScore,
        transactionFrequency: frequencyScore,
        stakingActivity: stakingScore,
        defiInteractions: defiScore
      }
    };
  }

  /**
   * Generate detailed score breakdown for transparency
   */
  public static generateScoreBreakdown(address: string, metrics: UserMetrics): ScoreBreakdown {
    // Calculate individual component scores
    const volumeScore = this.calculateVolumeScore(metrics.totalVolume);
    const frequencyScore = this.calculateFrequencyScore(metrics.totalTransactions, metrics.accountAge);
    const stakingScore = this.calculateStakingScore(metrics.stakingBalance);
    const defiScore = this.calculateDeFiScore(metrics.defiProtocolsUsed);

    // Calculate additional metrics
    const volume = parseFloat(metrics.totalVolume) || 0;
    const avgTransactionsPerMonth = metrics.accountAge > 0 ? (metrics.totalTransactions / Math.max(metrics.accountAge / 30, 1)) : 0;
    const stakingRatio = volume > 0 ? (parseFloat(metrics.stakingBalance) || 0) / volume : 0;
    const consistencyScore = this.calculateConsistencyScore(metrics);
    const gasEfficiency = this.calculateGasEfficiency(metrics);
    const diversificationScore = this.calculateDiversificationScore(metrics);

    // Generate category labels
    const getVolumeCategory = (score: number) => {
      if (score >= 800) return 'High Volume';
      if (score >= 600) return 'Medium Volume';
      if (score >= 300) return 'Low Volume';
      return 'Minimal Volume';
    };

    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(metrics);

    // Generate behavioral insights
    const behavioralInsights = this.generateBehavioralInsights(metrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, volumeScore, frequencyScore, stakingScore, defiScore);

    return {
      transactionVolume: {
        score: volumeScore,
        weight: this.WEIGHTS.TRANSACTION_VOLUME,
        weightedScore: Math.round(volumeScore * this.WEIGHTS.TRANSACTION_VOLUME),
        details: {
          totalVolume: metrics.totalVolume,
          volumeScore: volumeScore,
          volumeCategory: getVolumeCategory(volumeScore),
          gasEfficiency: gasEfficiency
        },
        insights: {
          explanation: `Transaction volume score based on ${metrics.totalVolume} ETH total volume`,
          strengths: volumeScore >= 600 ? ['Strong transaction volume', 'Active on-chain presence'] : [],
          weaknesses: volumeScore < 600 ? ['Limited transaction volume', 'Consider increasing on-chain activity'] : [],
          improvementPotential: Math.max(0, 1000 - volumeScore),
          benchmarkComparison: {
            percentile: Math.min(95, volumeScore / 10),
            category: getVolumeCategory(volumeScore)
          }
        }
      },
      transactionFrequency: {
        score: frequencyScore,
        weight: this.WEIGHTS.TRANSACTION_FREQUENCY,
        weightedScore: Math.round(frequencyScore * this.WEIGHTS.TRANSACTION_FREQUENCY),
        details: {
          totalTransactions: metrics.totalTransactions,
          accountAge: metrics.accountAge,
          frequencyScore: frequencyScore,
          avgTransactionsPerMonth: Math.round(avgTransactionsPerMonth * 100) / 100,
          consistencyScore: consistencyScore
        },
        insights: {
          explanation: `Frequency score based on ${metrics.totalTransactions} transactions over ${metrics.accountAge} days`,
          strengths: frequencyScore >= 600 ? ['Consistent transaction activity', 'Established account history'] : [],
          weaknesses: frequencyScore < 600 ? ['Infrequent transactions', 'Consider more regular activity'] : [],
          improvementPotential: Math.max(0, 1000 - frequencyScore),
          benchmarkComparison: {
            percentile: Math.min(95, frequencyScore / 10),
            category: avgTransactionsPerMonth >= 10 ? 'Active' : avgTransactionsPerMonth >= 3 ? 'Moderate' : 'Inactive'
          }
        }
      },
      stakingActivity: {
        score: stakingScore,
        weight: this.WEIGHTS.STAKING_ACTIVITY,
        weightedScore: Math.round(stakingScore * this.WEIGHTS.STAKING_ACTIVITY),
        details: {
          stakingBalance: metrics.stakingBalance,
          stakingScore: stakingScore,
          stakingRatio: Math.round(stakingRatio * 10000) / 100, // Convert to percentage
          stakingProtocols: metrics.defiProtocolsUsed.filter(p => p.toLowerCase().includes('stake') || p.toLowerCase().includes('lido')),
          stakingDuration: metrics.accountAge // Simplified - in real implementation would track actual staking duration
        },
        insights: {
          explanation: `Staking score based on ${metrics.stakingBalance} ETH staked`,
          strengths: stakingScore >= 600 ? ['Active staking participation', 'Long-term commitment shown'] : [],
          weaknesses: stakingScore < 600 ? ['Limited staking activity', 'Consider staking for better returns'] : [],
          improvementPotential: Math.max(0, 1000 - stakingScore),
          benchmarkComparison: {
            percentile: Math.min(95, stakingScore / 10),
            category: parseFloat(metrics.stakingBalance) >= 1 ? 'Active Staker' : 'Non-Staker'
          }
        }
      },
      defiInteractions: {
        score: defiScore,
        weight: this.WEIGHTS.DEFI_INTERACTIONS,
        weightedScore: Math.round(defiScore * this.WEIGHTS.DEFI_INTERACTIONS),
        details: {
          protocolsUsed: metrics.defiProtocolsUsed.length,
          defiScore: defiScore,
          diversificationScore: diversificationScore,
          totalDefiVolume: metrics.totalVolume, // Simplified - in real implementation would separate DeFi volume
          favoriteProtocols: metrics.defiProtocolsUsed.slice(0, 3)
        },
        insights: {
          explanation: `DeFi score based on ${metrics.defiProtocolsUsed.length} protocols used`,
          strengths: defiScore >= 600 ? ['Diverse DeFi usage', 'Advanced protocol interaction'] : [],
          weaknesses: defiScore < 600 ? ['Limited DeFi exposure', 'Consider exploring more protocols'] : [],
          improvementPotential: Math.max(0, 1000 - defiScore),
          benchmarkComparison: {
            percentile: Math.min(95, defiScore / 10),
            category: metrics.defiProtocolsUsed.length >= 5 ? 'DeFi Expert' : metrics.defiProtocolsUsed.length >= 2 ? 'DeFi User' : 'DeFi Beginner'
          }
        }
      },
      riskAssessment,
      behavioralInsights,
      recommendations
    };
  }

  /**
   * Validate if metrics are sufficient for scoring
   */
  public static validateMetricsForScoring(metrics: UserMetrics): {
    isValid: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Check minimum requirements
    if (metrics.totalTransactions < 1) {
      reasons.push('Insufficient transaction history (minimum 1 transaction required)');
    }

    if (metrics.accountAge < 1) {
      reasons.push('Account too new (minimum 1 day required)');
    }

    const totalVolume = parseFloat(metrics.totalVolume);
    if (totalVolume < this.SCORING_PARAMS.VOLUME.MIN_ETH) {
      reasons.push(`Insufficient transaction volume (minimum ${this.SCORING_PARAMS.VOLUME.MIN_ETH} ETH required, found ${totalVolume} ETH)`);
    }

    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  /**
   * Calculate confidence score based on data quality and completeness
   */
  private static calculateConfidence(metrics: UserMetrics): number {
    let confidence = 0;

    // Base confidence from transaction count
    if (metrics.totalTransactions >= 100) confidence += 30;
    else if (metrics.totalTransactions >= 50) confidence += 25;
    else if (metrics.totalTransactions >= 20) confidence += 20;
    else if (metrics.totalTransactions >= 10) confidence += 15;
    else if (metrics.totalTransactions >= 5) confidence += 10;
    else confidence += 5;

    // Account age contribution
    if (metrics.accountAge >= 365) confidence += 25;
    else if (metrics.accountAge >= 180) confidence += 20;
    else if (metrics.accountAge >= 90) confidence += 15;
    else if (metrics.accountAge >= 30) confidence += 10;
    else confidence += 5;

    // Volume contribution
    const volume = parseFloat(metrics.totalVolume) || 0;
    if (volume >= 10) confidence += 20;
    else if (volume >= 5) confidence += 15;
    else if (volume >= 1) confidence += 10;
    else if (volume >= 0.1) confidence += 5;

    // DeFi diversity contribution
    if (metrics.defiProtocolsUsed.length >= 5) confidence += 15;
    else if (metrics.defiProtocolsUsed.length >= 3) confidence += 10;
    else if (metrics.defiProtocolsUsed.length >= 1) confidence += 5;

    // Staking contribution
    const stakingBalance = parseFloat(metrics.stakingBalance) || 0;
    if (stakingBalance > 0) confidence += 10;

    return Math.min(100, confidence);
  }

  /**
   * Calculate consistency score based on transaction patterns
   */
  private static calculateConsistencyScore(metrics: UserMetrics): number {
    // Simplified consistency calculation
    const transactionsPerDay = metrics.accountAge > 0 ? metrics.totalTransactions / metrics.accountAge : 0;
    const consistencyFactor = Math.min(1, transactionsPerDay * 10); // Normalize to 0-1
    return Math.round(consistencyFactor * 100);
  }

  /**
   * Calculate gas efficiency score
   */
  private static calculateGasEfficiency(metrics: UserMetrics): number {
    // Simplified gas efficiency - in real implementation would analyze actual gas usage
    const baseEfficiency = 75; // Default efficiency score
    const volumeBonus = Math.min(25, parseFloat(metrics.totalVolume) * 5); // Higher volume users tend to be more efficient
    return Math.round(baseEfficiency + volumeBonus);
  }

  /**
   * Calculate diversification score
   */
  private static calculateDiversificationScore(metrics: UserMetrics): number {
    const protocolCount = metrics.defiProtocolsUsed.length;
    const maxDiversification = 10; // Maximum protocols for full diversification
    const diversificationRatio = Math.min(1, protocolCount / maxDiversification);
    return Math.round(diversificationRatio * 100);
  }

  /**
   * Generate risk assessment
   */
  private static generateRiskAssessment(metrics: UserMetrics): RiskAssessment {
    const volume = parseFloat(metrics.totalVolume) || 0;
    const stakingBalance = parseFloat(metrics.stakingBalance) || 0;

    // Calculate risk factors
    const concentrationRisk = volume > 0 && stakingBalance / volume > 0.8;
    const volatilityRisk = metrics.defiProtocolsUsed.length > 5; // More protocols = potentially higher risk
    const inactivityRisk = metrics.accountAge > 30 && metrics.totalTransactions < 10;
    const newAccountRisk = metrics.accountAge < 30;
    const unusualPatterns = false; // Simplified - would need more complex analysis

    // Calculate overall risk level
    const riskFactors = [concentrationRisk, volatilityRisk, inactivityRisk, newAccountRisk, unusualPatterns];
    const riskCount = riskFactors.filter(Boolean).length;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskCount >= 3) riskLevel = 'HIGH';
    else if (riskCount >= 2) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
      riskLevel,
      riskScore: riskCount * 20, // 0-100 scale
      riskFactors: riskFactors.map((risk, index) => {
        const factors = ['High concentration risk', 'High volatility exposure', 'Inactivity risk', 'New account risk', 'Unusual patterns'];
        return factors[index];
      }).filter((_, index) => riskFactors[index]),
      flags: {
        concentrationRisk,
        volatilityRisk,
        inactivityRisk,
        newAccountRisk,
        unusualPatterns
      }
    };
  }

  /**
   * Generate behavioral insights
   */
  private static generateBehavioralInsights(metrics: UserMetrics): BehavioralInsights {
    const transactionsPerDay = metrics.accountAge > 0 ? metrics.totalTransactions / metrics.accountAge : 0;
    const volume = parseFloat(metrics.totalVolume) || 0;

    // Determine activity pattern
    let activityPattern: 'REGULAR' | 'SPORADIC' | 'INACTIVE';
    if (transactionsPerDay >= 0.5) activityPattern = 'REGULAR';
    else if (transactionsPerDay >= 0.1) activityPattern = 'SPORADIC';
    else activityPattern = 'INACTIVE';

    // Determine growth trend (simplified)
    const growthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE'; // Would need historical data

    // Determine diversification level
    let diversificationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (metrics.defiProtocolsUsed.length >= 5) diversificationLevel = 'HIGH';
    else if (metrics.defiProtocolsUsed.length >= 2) diversificationLevel = 'MEDIUM';
    else diversificationLevel = 'LOW';

    return {
      consistencyScore: this.calculateConsistencyScore(metrics),
      growthTrend,
      diversificationLevel,
      gasEfficiency: this.calculateGasEfficiency(metrics),
      activityPattern,
      preferredProtocols: metrics.defiProtocolsUsed.slice(0, 3)
    };
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    metrics: UserMetrics,
    volumeScore: number,
    frequencyScore: number,
    stakingScore: number,
    defiScore: number
  ): PersonalizedRecommendations[] {
    const recommendations: PersonalizedRecommendations[] = [];

    // Volume recommendations
    if (volumeScore < 600) {
      recommendations.push({
        priority: 'HIGH',
        category: 'VOLUME',
        title: 'Increase Transaction Volume',
        description: 'Boost your credit score by increasing your on-chain transaction volume through regular DeFi activities.',
        impact: `+${Math.round((600 - volumeScore) * 0.3)} points potential`,
        actionItems: [
          'Make regular swaps on DEXs like Uniswap or SushiSwap',
          'Participate in liquidity provision',
          'Use DeFi lending protocols like Aave or Compound'
        ]
      });
    }

    // Frequency recommendations
    if (frequencyScore < 600) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'FREQUENCY',
        title: 'Maintain Consistent Activity',
        description: 'Regular on-chain activity demonstrates reliability and improves your credit profile.',
        impact: `+${Math.round((600 - frequencyScore) * 0.25)} points potential`,
        actionItems: [
          'Make at least 2-3 transactions per week',
          'Set up recurring DeFi activities',
          'Use dollar-cost averaging strategies'
        ]
      });
    }

    // Staking recommendations
    if (stakingScore < 600) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'STAKING',
        title: 'Start Staking Activities',
        description: 'Staking demonstrates long-term commitment and generates passive income.',
        impact: `+${Math.round((600 - stakingScore) * 0.25)} points potential`,
        actionItems: [
          'Stake ETH through Lido or Rocket Pool',
          'Participate in protocol governance staking',
          'Consider liquid staking derivatives'
        ]
      });
    }

    // DeFi recommendations
    if (defiScore < 600) {
      recommendations.push({
        priority: 'LOW',
        category: 'DEFI',
        title: 'Explore DeFi Protocols',
        description: 'Diversify your DeFi usage to show sophistication and reduce concentration risk.',
        impact: `+${Math.round((600 - defiScore) * 0.2)} points potential`,
        actionItems: [
          'Try different categories: lending, DEXs, yield farming',
          'Use established protocols like Uniswap, Aave, Compound',
          'Gradually increase protocol diversity'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get scoring parameters for transparency
   */
  public static getScoringParameters() {
    return {
      weights: this.WEIGHTS,
      parameters: this.SCORING_PARAMS
    };
  }
}

// Export singleton instance
export const scoreCalculator = ScoreCalculator;
export default scoreCalculator;