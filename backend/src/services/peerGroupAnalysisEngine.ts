import { UserMetrics, TransactionData } from './blockchainService';

export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  criteria: PeerGroupCriteria;
  memberCount: number;
  averageScore: number;
  scoreRange: {
    min: number;
    max: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
  };
}

export interface PeerGroupCriteria {
  accountAge: {
    min: number; // days
    max: number; // days
  };
  activityLevel: {
    min: number; // transactions
    max: number; // transactions
  };
  portfolioSize: {
    min: number; // ETH
    max: number; // ETH
  };
}

export interface UserPeerGroupClassification {
  address: string;
  primaryPeerGroup: PeerGroup;
  alternativePeerGroups: PeerGroup[];
  classificationConfidence: number; // 0-100
  classificationReasons: string[];
}

export interface PeerGroupMetrics {
  totalUsers: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 800-1000
    good: number; // 600-799
    fair: number; // 400-599
    poor: number; // 0-399
  };
  behavioralDistribution: {
    conservative: number;
    moderate: number;
    aggressive: number;
    speculative: number;
  };
  activityMetrics: {
    averageTransactions: number;
    averageVolume: string;
    averageAccountAge: number;
    averageStakingBalance: string;
  };
}

/**
 * Peer Group Analysis Engine
 * Identifies and classifies users into peer groups for benchmarking
 */
export class PeerGroupAnalysisEngine {
  // Predefined peer group definitions
  private static readonly PEER_GROUP_DEFINITIONS: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>[] = [
    {
      id: 'new_conservative',
      name: 'New Conservative Users',
      description: 'Recently joined users with conservative trading patterns and moderate activity',
      criteria: {
        accountAge: { min: 1, max: 90 },
        activityLevel: { min: 1, max: 50 },
        portfolioSize: { min: 0.1, max: 10 }
      }
    },
    {
      id: 'new_active',
      name: 'New Active Users',
      description: 'Recently joined users with high activity levels and growing portfolios',
      criteria: {
        accountAge: { min: 1, max: 90 },
        activityLevel: { min: 51, max: 200 },
        portfolioSize: { min: 1, max: 50 }
      }
    },
    {
      id: 'established_conservative',
      name: 'Established Conservative Users',
      description: 'Mature accounts with steady, conservative investment patterns',
      criteria: {
        accountAge: { min: 91, max: 365 },
        activityLevel: { min: 10, max: 100 },
        portfolioSize: { min: 1, max: 100 }
      }
    },
    {
      id: 'established_active',
      name: 'Established Active Users',
      description: 'Mature accounts with high activity and substantial portfolios',
      criteria: {
        accountAge: { min: 91, max: 365 },
        activityLevel: { min: 101, max: 500 },
        portfolioSize: { min: 10, max: 500 }
      }
    },
    {
      id: 'veteran_conservative',
      name: 'Veteran Conservative Users',
      description: 'Long-term users with stable, conservative investment strategies',
      criteria: {
        accountAge: { min: 366, max: 1095 },
        activityLevel: { min: 20, max: 200 },
        portfolioSize: { min: 5, max: 1000 }
      }
    },
    {
      id: 'veteran_active',
      name: 'Veteran Active Users',
      description: 'Long-term users with high activity and large portfolios',
      criteria: {
        accountAge: { min: 366, max: 1095 },
        activityLevel: { min: 201, max: 1000 },
        portfolioSize: { min: 50, max: 5000 }
      }
    },
    {
      id: 'whale_conservative',
      name: 'Conservative Whales',
      description: 'High-value users with conservative, long-term investment strategies',
      criteria: {
        accountAge: { min: 180, max: 3650 },
        activityLevel: { min: 50, max: 500 },
        portfolioSize: { min: 1000, max: 100000 }
      }
    },
    {
      id: 'whale_active',
      name: 'Active Whales',
      description: 'High-value users with frequent trading and DeFi participation',
      criteria: {
        accountAge: { min: 90, max: 3650 },
        activityLevel: { min: 500, max: 10000 },
        portfolioSize: { min: 1000, max: 100000 }
      }
    },
    {
      id: 'defi_native',
      name: 'DeFi Natives',
      description: 'Users with extensive DeFi protocol usage regardless of portfolio size',
      criteria: {
        accountAge: { min: 30, max: 3650 },
        activityLevel: { min: 100, max: 10000 },
        portfolioSize: { min: 5, max: 100000 }
      }
    },
    {
      id: 'staking_focused',
      name: 'Staking-Focused Users',
      description: 'Users primarily focused on staking with moderate trading activity',
      criteria: {
        accountAge: { min: 60, max: 3650 },
        activityLevel: { min: 10, max: 300 },
        portfolioSize: { min: 1, max: 10000 }
      }
    }
  ];

  /**
   * Classify a user into appropriate peer groups
   */
  public static classifyUserIntoPeerGroups(
    address: string,
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): UserPeerGroupClassification {
    const portfolioSize = parseFloat(metrics.totalVolume);
    const activityLevel = metrics.totalTransactions;
    const accountAge = metrics.accountAge;
    
    const matchingGroups: { group: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>, score: number }[] = [];
    const reasons: string[] = [];
    
    // Check each peer group definition
    for (const groupDef of this.PEER_GROUP_DEFINITIONS) {
      const matchScore = this.calculateGroupMatchScore(
        { portfolioSize, activityLevel, accountAge },
        groupDef.criteria,
        metrics,
        transactionHistory
      );
      
      if (matchScore > 0) {
        matchingGroups.push({ group: groupDef, score: matchScore });
      }
    }
    
    // Sort by match score
    matchingGroups.sort((a, b) => b.score - a.score);
    
    if (matchingGroups.length === 0) {
      // Fallback to a general group
      const fallbackGroup = this.createFallbackPeerGroup(metrics);
      reasons.push('No exact peer group match found, using general classification');
      
      return {
        address,
        primaryPeerGroup: fallbackGroup,
        alternativePeerGroups: [],
        classificationConfidence: 30,
        classificationReasons: reasons
      };
    }
    
    // Primary group is the best match
    const primaryGroup = this.enrichPeerGroupWithMetrics(matchingGroups[0].group);
    const confidence = Math.min(100, matchingGroups[0].score);
    
    // Alternative groups are other good matches
    const alternativeGroups = matchingGroups
      .slice(1, 4) // Top 3 alternatives
      .filter(match => match.score >= 60)
      .map(match => this.enrichPeerGroupWithMetrics(match.group));
    
    // Generate classification reasons
    reasons.push(`Primary classification: ${primaryGroup.name}`);
    reasons.push(`Account age: ${accountAge} days`);
    reasons.push(`Activity level: ${activityLevel} transactions`);
    reasons.push(`Portfolio size: ${portfolioSize.toFixed(2)} ETH`);
    
    if (alternativeGroups.length > 0) {
      reasons.push(`Also matches ${alternativeGroups.length} alternative group(s)`);
    }
    
    return {
      address,
      primaryPeerGroup: primaryGroup,
      alternativePeerGroups: alternativeGroups,
      classificationConfidence: confidence,
      classificationReasons: reasons
    };
  }

  /**
   * Calculate how well a user matches a peer group criteria
   */
  private static calculateGroupMatchScore(
    userMetrics: { portfolioSize: number; activityLevel: number; accountAge: number },
    criteria: PeerGroupCriteria,
    fullMetrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): number {
    let score = 0;
    let maxScore = 0;
    
    // Account age match (30% weight)
    maxScore += 30;
    if (userMetrics.accountAge >= criteria.accountAge.min && userMetrics.accountAge <= criteria.accountAge.max) {
      score += 30;
    } else {
      // Partial score for near misses
      const ageDistance = Math.min(
        Math.abs(userMetrics.accountAge - criteria.accountAge.min),
        Math.abs(userMetrics.accountAge - criteria.accountAge.max)
      );
      const ageRange = criteria.accountAge.max - criteria.accountAge.min;
      const ageScore = Math.max(0, 30 - (ageDistance / ageRange) * 30);
      score += ageScore;
    }
    
    // Activity level match (30% weight)
    maxScore += 30;
    if (userMetrics.activityLevel >= criteria.activityLevel.min && userMetrics.activityLevel <= criteria.activityLevel.max) {
      score += 30;
    } else {
      // Partial score for near misses
      const activityDistance = Math.min(
        Math.abs(userMetrics.activityLevel - criteria.activityLevel.min),
        Math.abs(userMetrics.activityLevel - criteria.activityLevel.max)
      );
      const activityRange = criteria.activityLevel.max - criteria.activityLevel.min;
      const activityScore = Math.max(0, 30 - (activityDistance / activityRange) * 30);
      score += activityScore;
    }
    
    // Portfolio size match (25% weight)
    maxScore += 25;
    if (userMetrics.portfolioSize >= criteria.portfolioSize.min && userMetrics.portfolioSize <= criteria.portfolioSize.max) {
      score += 25;
    } else {
      // Partial score for near misses (logarithmic scale for portfolio size)
      const logUserSize = Math.log10(Math.max(0.01, userMetrics.portfolioSize));
      const logMinSize = Math.log10(criteria.portfolioSize.min);
      const logMaxSize = Math.log10(criteria.portfolioSize.max);
      
      const sizeDistance = Math.min(
        Math.abs(logUserSize - logMinSize),
        Math.abs(logUserSize - logMaxSize)
      );
      const sizeRange = logMaxSize - logMinSize;
      const sizeScore = Math.max(0, 25 - (sizeDistance / sizeRange) * 25);
      score += sizeScore;
    }
    
    // Behavioral alignment bonus (15% weight)
    maxScore += 15;
    const behavioralBonus = this.calculateBehavioralAlignment(fullMetrics, transactionHistory);
    score += behavioralBonus * 15;
    
    // Return percentage score
    return (score / maxScore) * 100;
  }

  /**
   * Calculate behavioral alignment bonus
   */
  private static calculateBehavioralAlignment(
    metrics: UserMetrics,
    transactionHistory?: TransactionData[]
  ): number {
    let alignment = 0.5; // Base alignment
    
    // DeFi usage alignment
    const defiProtocolCount = metrics.defiProtocolsUsed.length;
    if (defiProtocolCount > 5) {
      alignment += 0.2; // DeFi native bonus
    } else if (defiProtocolCount > 2) {
      alignment += 0.1; // Moderate DeFi usage
    }
    
    // Staking alignment
    const stakingBalance = parseFloat(metrics.stakingBalance);
    const totalVolume = parseFloat(metrics.totalVolume);
    const stakingRatio = totalVolume > 0 ? stakingBalance / totalVolume : 0;
    
    if (stakingRatio > 0.5) {
      alignment += 0.2; // High staking ratio
    } else if (stakingRatio > 0.1) {
      alignment += 0.1; // Moderate staking
    }
    
    // Activity consistency (if transaction history available)
    if (transactionHistory && transactionHistory.length > 10) {
      const recentActivity = transactionHistory.filter(tx => 
        (Date.now() / 1000 - tx.timestamp) < 30 * 24 * 60 * 60 // Last 30 days
      ).length;
      
      if (recentActivity > 0) {
        alignment += 0.1; // Recent activity bonus
      }
    }
    
    return Math.min(1, alignment);
  }

  /**
   * Create a fallback peer group for users who don't match predefined groups
   */
  private static createFallbackPeerGroup(metrics: UserMetrics): PeerGroup {
    const portfolioSize = parseFloat(metrics.totalVolume);
    const activityLevel = metrics.totalTransactions;
    const accountAge = metrics.accountAge;
    
    let groupName = 'General Users';
    let description = 'Users with mixed characteristics not fitting standard peer groups';
    
    // Create dynamic criteria based on user's actual metrics
    const criteria: PeerGroupCriteria = {
      accountAge: {
        min: Math.max(1, accountAge - 30),
        max: accountAge + 30
      },
      activityLevel: {
        min: Math.max(1, Math.floor(activityLevel * 0.5)),
        max: Math.ceil(activityLevel * 2)
      },
      portfolioSize: {
        min: Math.max(0.01, portfolioSize * 0.1),
        max: portfolioSize * 10
      }
    };
    
    return {
      id: 'fallback_general',
      name: groupName,
      description,
      criteria,
      memberCount: 1, // At least this user
      averageScore: 500, // Default average
      scoreRange: {
        min: 0,
        max: 1000,
        percentiles: {
          p25: 300,
          p50: 500,
          p75: 700,
          p90: 850
        }
      }
    };
  }

  /**
   * Enrich peer group definition with calculated metrics
   * In a real implementation, this would query the database for actual metrics
   */
  private static enrichPeerGroupWithMetrics(
    groupDef: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>
  ): PeerGroup {
    // For now, return estimated metrics based on group characteristics
    // In production, this would query actual user data
    
    const estimatedMemberCount = this.estimateMemberCount(groupDef);
    const estimatedAverageScore = this.estimateAverageScore(groupDef);
    const estimatedScoreRange = this.estimateScoreRange(groupDef);
    
    return {
      ...groupDef,
      memberCount: estimatedMemberCount,
      averageScore: estimatedAverageScore,
      scoreRange: estimatedScoreRange
    };
  }

  /**
   * Estimate member count for a peer group
   */
  private static estimateMemberCount(
    groupDef: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>
  ): number {
    // Estimate based on group characteristics
    // More restrictive groups have fewer members
    
    const ageRange = groupDef.criteria.accountAge.max - groupDef.criteria.accountAge.min;
    const activityRange = groupDef.criteria.activityLevel.max - groupDef.criteria.activityLevel.min;
    const portfolioRange = Math.log10(groupDef.criteria.portfolioSize.max) - Math.log10(groupDef.criteria.portfolioSize.min);
    
    // Base estimate
    let estimate = 1000;
    
    // Adjust for restrictiveness
    if (ageRange < 100) estimate *= 0.7; // Narrow age range
    if (activityRange < 100) estimate *= 0.8; // Narrow activity range
    if (portfolioRange < 2) estimate *= 0.6; // Narrow portfolio range
    
    // Adjust for whale groups (fewer members)
    if (groupDef.criteria.portfolioSize.min > 100) {
      estimate *= 0.1;
    } else if (groupDef.criteria.portfolioSize.min > 10) {
      estimate *= 0.3;
    }
    
    return Math.max(10, Math.round(estimate));
  }

  /**
   * Estimate average score for a peer group
   */
  private static estimateAverageScore(
    groupDef: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>
  ): number {
    let score = 500; // Base score
    
    // Adjust for account maturity
    if (groupDef.criteria.accountAge.min > 365) {
      score += 100; // Veteran bonus
    } else if (groupDef.criteria.accountAge.min > 90) {
      score += 50; // Established bonus
    }
    
    // Adjust for activity level
    if (groupDef.criteria.activityLevel.min > 500) {
      score += 150; // High activity bonus
    } else if (groupDef.criteria.activityLevel.min > 100) {
      score += 75; // Moderate activity bonus
    }
    
    // Adjust for portfolio size
    if (groupDef.criteria.portfolioSize.min > 1000) {
      score += 200; // Whale bonus
    } else if (groupDef.criteria.portfolioSize.min > 100) {
      score += 100; // Large portfolio bonus
    } else if (groupDef.criteria.portfolioSize.min > 10) {
      score += 50; // Medium portfolio bonus
    }
    
    // Special adjustments for specific groups
    if (groupDef.id.includes('defi')) {
      score += 75; // DeFi sophistication bonus
    }
    if (groupDef.id.includes('staking')) {
      score += 50; // Staking stability bonus
    }
    
    return Math.max(100, Math.min(900, score));
  }

  /**
   * Estimate score range and percentiles for a peer group
   */
  private static estimateScoreRange(
    groupDef: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>
  ): PeerGroup['scoreRange'] {
    const averageScore = this.estimateAverageScore(groupDef);
    
    // Calculate range based on group characteristics
    let spread = 200; // Base spread
    
    // New users have more spread
    if (groupDef.criteria.accountAge.max < 90) {
      spread += 100;
    }
    
    // High activity groups have more spread
    if (groupDef.criteria.activityLevel.max > 500) {
      spread += 50;
    }
    
    const min = Math.max(0, averageScore - spread);
    const max = Math.min(1000, averageScore + spread);
    
    // Calculate percentiles
    const range = max - min;
    const p25 = Math.round(min + range * 0.25);
    const p50 = Math.round(averageScore);
    const p75 = Math.round(min + range * 0.75);
    const p90 = Math.round(min + range * 0.9);
    
    return {
      min,
      max,
      percentiles: { p25, p50, p75, p90 }
    };
  }

  /**
   * Get peer group metrics for a specific group
   */
  public static getPeerGroupMetrics(groupId: string): PeerGroupMetrics {
    const groupDef = this.PEER_GROUP_DEFINITIONS.find(g => g.id === groupId);
    if (!groupDef) {
      throw new Error(`Peer group ${groupId} not found`);
    }
    
    const enrichedGroup = this.enrichPeerGroupWithMetrics(groupDef);
    
    // Estimate behavioral and activity distributions
    return {
      totalUsers: enrichedGroup.memberCount,
      averageScore: enrichedGroup.averageScore,
      scoreDistribution: {
        excellent: Math.round(enrichedGroup.memberCount * 0.15),
        good: Math.round(enrichedGroup.memberCount * 0.35),
        fair: Math.round(enrichedGroup.memberCount * 0.35),
        poor: Math.round(enrichedGroup.memberCount * 0.15)
      },
      behavioralDistribution: this.estimateBehavioralDistribution(groupDef),
      activityMetrics: this.estimateActivityMetrics(groupDef)
    };
  }

  /**
   * Estimate behavioral distribution for a peer group
   */
  private static estimateBehavioralDistribution(
    groupDef: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>
  ): PeerGroupMetrics['behavioralDistribution'] {
    let conservative = 25;
    let moderate = 40;
    let aggressive = 25;
    let speculative = 10;
    
    // Adjust based on group characteristics
    if (groupDef.id.includes('conservative') || groupDef.id.includes('staking')) {
      conservative += 20;
      moderate += 10;
      aggressive -= 15;
      speculative -= 15;
    }
    
    if (groupDef.id.includes('active') || groupDef.id.includes('defi')) {
      conservative -= 10;
      moderate -= 5;
      aggressive += 10;
      speculative += 5;
    }
    
    if (groupDef.id.includes('whale')) {
      conservative += 10;
      moderate += 5;
      aggressive -= 10;
      speculative -= 5;
    }
    
    // Ensure percentages sum to 100
    const total = conservative + moderate + aggressive + speculative;
    return {
      conservative: Math.round((conservative / total) * 100),
      moderate: Math.round((moderate / total) * 100),
      aggressive: Math.round((aggressive / total) * 100),
      speculative: Math.round((speculative / total) * 100)
    };
  }

  /**
   * Estimate activity metrics for a peer group
   */
  private static estimateActivityMetrics(
    groupDef: Omit<PeerGroup, 'memberCount' | 'averageScore' | 'scoreRange'>
  ): PeerGroupMetrics['activityMetrics'] {
    const avgTransactions = Math.round(
      (groupDef.criteria.activityLevel.min + groupDef.criteria.activityLevel.max) / 2
    );
    
    const avgVolume = (
      (groupDef.criteria.portfolioSize.min + groupDef.criteria.portfolioSize.max) / 2
    ).toFixed(2);
    
    const avgAccountAge = Math.round(
      (groupDef.criteria.accountAge.min + groupDef.criteria.accountAge.max) / 2
    );
    
    // Estimate staking balance based on group type
    let stakingRatio = 0.2; // Default 20%
    if (groupDef.id.includes('staking')) stakingRatio = 0.6;
    if (groupDef.id.includes('conservative')) stakingRatio = 0.4;
    if (groupDef.id.includes('defi')) stakingRatio = 0.1;
    
    const avgStakingBalance = (parseFloat(avgVolume) * stakingRatio).toFixed(2);
    
    return {
      averageTransactions: avgTransactions,
      averageVolume: avgVolume,
      averageAccountAge: avgAccountAge,
      averageStakingBalance: avgStakingBalance
    };
  }

  /**
   * Get all available peer groups
   */
  public static getAllPeerGroups(): PeerGroup[] {
    return this.PEER_GROUP_DEFINITIONS.map(groupDef => 
      this.enrichPeerGroupWithMetrics(groupDef)
    );
  }
}