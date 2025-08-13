import { UserMetrics } from './blockchainService';

export interface CreditScore {
  address: string;
  score: number; // 0-1000
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
      MIN_ETH: 0.1,      // Minimum ETH for scoring
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
    
    return {
      address,
      score: boundedScore,
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
    
    return {
      transactionVolume: {
        score: volumeScore,
        weight: this.WEIGHTS.TRANSACTION_VOLUME,
        weightedScore: Math.round(volumeScore * this.WEIGHTS.TRANSACTION_VOLUME),
        details: {
          totalVolume: metrics.totalVolume,
          volumeScore: volumeScore
        }
      },
      transactionFrequency: {
        score: frequencyScore,
        weight: this.WEIGHTS.TRANSACTION_FREQUENCY,
        weightedScore: Math.round(frequencyScore * this.WEIGHTS.TRANSACTION_FREQUENCY),
        details: {
          totalTransactions: metrics.totalTransactions,
          accountAge: metrics.accountAge,
          frequencyScore: frequencyScore
        }
      },
      stakingActivity: {
        score: stakingScore,
        weight: this.WEIGHTS.STAKING_ACTIVITY,
        weightedScore: Math.round(stakingScore * this.WEIGHTS.STAKING_ACTIVITY),
        details: {
          stakingBalance: metrics.stakingBalance,
          stakingScore: stakingScore
        }
      },
      defiInteractions: {
        score: defiScore,
        weight: this.WEIGHTS.DEFI_INTERACTIONS,
        weightedScore: Math.round(defiScore * this.WEIGHTS.DEFI_INTERACTIONS),
        details: {
          protocolsUsed: metrics.defiProtocolsUsed.length,
          defiScore: defiScore
        }
      }
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
      reasons.push(`Insufficient transaction volume (minimum ${this.SCORING_PARAMS.VOLUME.MIN_ETH} ETH required)`);
    }
    
    return {
      isValid: reasons.length === 0,
      reasons
    };
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