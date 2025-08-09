import {
  Achievement,
  Badge,
  AchievementCategory,
  AchievementTier,
  RequirementType,
  RewardType,
  AchievementRequirement,
  AchievementReward,
  BadgeMetadata
} from '../../types/gamification';
import { CreditProfile } from '../../types/credit';
import { formatError } from '../../utils/errors';

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private userBadges: Map<string, Badge[]> = new Map();

  constructor() {
    this.initializeDefaultAchievements();
  }

  private initializeDefaultAchievements(): void {
    const defaultAchievements: Achievement[] = [
      // Credit Milestone Achievements
      {
        id: 'credit_rookie',
        name: 'Credit Rookie',
        description: 'Achieve your first credit score above 500',
        category: AchievementCategory.CREDIT_MILESTONE,
        tier: AchievementTier.BRONZE,
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            threshold: 500
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.05,
            duration: 7
          }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'credit_champion',
        name: 'Credit Champion',
        description: 'Reach a credit score of 800 or higher',
        category: AchievementCategory.CREDIT_MILESTONE,
        tier: AchievementTier.GOLD,
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            threshold: 800
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.1,
            duration: 30
          },
          {
            type: RewardType.NFT_UPGRADE,
            value: 1
          }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'credit_legend',
        name: 'Credit Legend',
        description: 'Achieve the legendary 950+ credit score',
        category: AchievementCategory.CREDIT_MILESTONE,
        tier: AchievementTier.DIAMOND,
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            threshold: 950
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.15,
            duration: 90
          },
          {
            type: RewardType.NFT_UPGRADE,
            value: 2
          },
          {
            type: RewardType.EXCLUSIVE_ACCESS,
            value: 1
          }
        ],
        isActive: true,
        createdAt: new Date()
      },
      // Consistency Achievements
      {
        id: 'steady_climber',
        name: 'Steady Climber',
        description: 'Maintain consistent score improvement for 30 days',
        category: AchievementCategory.CONSISTENCY,
        tier: AchievementTier.SILVER,
        requirements: [
          {
            type: RequirementType.CONSISTENCY_STREAK,
            duration: 30,
            consistency: 80
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.08,
            duration: 14
          }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'marathon_runner',
        name: 'Marathon Runner',
        description: 'Maintain excellent behavior for 90 consecutive days',
        category: AchievementCategory.CONSISTENCY,
        tier: AchievementTier.PLATINUM,
        requirements: [
          {
            type: RequirementType.CONSISTENCY_STREAK,
            duration: 90,
            consistency: 90
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.12,
            duration: 60
          },
          {
            type: RewardType.NFT_UPGRADE,
            value: 1
          }
        ],
        isActive: true,
        createdAt: new Date()
      },
      // Exceptional Behavior Achievements
      {
        id: 'defi_pioneer',
        name: 'DeFi Pioneer',
        description: 'Excel in all five credit dimensions simultaneously',
        category: AchievementCategory.EXCEPTIONAL_BEHAVIOR,
        tier: AchievementTier.GOLD,
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'defiReliability',
            threshold: 750
          },
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'tradingConsistency',
            threshold: 750
          },
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'stakingCommitment',
            threshold: 750
          },
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'governanceParticipation',
            threshold: 750
          },
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'liquidityProvider',
            threshold: 750
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.2,
            duration: 45
          },
          {
            type: RewardType.NFT_UPGRADE,
            value: 2
          }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'whale_watcher',
        name: 'Whale Watcher',
        description: 'Process transactions worth over $1M USD equivalent',
        category: AchievementCategory.EXCEPTIONAL_BEHAVIOR,
        tier: AchievementTier.PLATINUM,
        requirements: [
          {
            type: RequirementType.TRANSACTION_VOLUME,
            threshold: 1000000
          }
        ],
        rewards: [
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.15,
            duration: 30
          },
          {
            type: RewardType.EXCLUSIVE_ACCESS,
            value: 1
          }
        ],
        isActive: true,
        createdAt: new Date()
      }
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  async checkAchievements(userId: string, creditProfile: CreditProfile): Promise<Badge[]> {
    try {
      const newBadges: Badge[] = [];
      const userBadges = this.userBadges.get(userId) || [];
      const earnedAchievementIds = new Set(userBadges.map(badge => badge.achievementId));

      for (const achievement of this.achievements.values()) {
        if (!achievement.isActive || earnedAchievementIds.has(achievement.id)) {
          continue;
        }

        if (await this.meetsRequirements(achievement, creditProfile, userId)) {
          const badge = await this.awardBadge(userId, achievement, creditProfile);
          newBadges.push(badge);
        }
      }

      return newBadges;
    } catch (error) {
      throw new Error(formatError('Failed to check achievements', error));
    }
  }

  private async meetsRequirements(
    achievement: Achievement,
    creditProfile: CreditProfile,
    userId: string
  ): Promise<boolean> {
    try {
      for (const requirement of achievement.requirements) {
        if (!(await this.meetsRequirement(requirement, creditProfile, userId))) {
          return false;
        }
      }
      return true;
    } catch (error) {
      throw new Error(formatError('Failed to check requirements', error));
    }
  }

  private async meetsRequirement(
    requirement: AchievementRequirement,
    creditProfile: CreditProfile,
    userId: string
  ): Promise<boolean> {
    switch (requirement.type) {
      case RequirementType.SCORE_THRESHOLD:
        if (requirement.dimension) {
          const dimensionScore = creditProfile.dimensions[requirement.dimension as keyof typeof creditProfile.dimensions]?.score || 0;
          return dimensionScore >= (requirement.threshold || 0);
        } else {
          // Overall score calculation (average of all dimensions)
          const scores = Object.values(creditProfile.dimensions).map(d => d.score);
          const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          return averageScore >= (requirement.threshold || 0);
        }

      case RequirementType.SCORE_IMPROVEMENT:
        // This would require historical data comparison
        // For now, return true if current score is above threshold
        return true;

      case RequirementType.CONSISTENCY_STREAK:
        // This would require historical consistency tracking
        // For now, check if all dimensions have good confidence
        const allDimensionsConfident = Object.values(creditProfile.dimensions)
          .every(d => d.confidence >= (requirement.consistency || 80));
        return allDimensionsConfident;

      case RequirementType.TRANSACTION_VOLUME:
        // This would require transaction history analysis
        // For now, return true for high-score users
        const scores = Object.values(creditProfile.dimensions).map(d => d.score);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return averageScore >= 800; // Proxy for high transaction volume

      default:
        return false;
    }
  }

  private async awardBadge(
    userId: string,
    achievement: Achievement,
    creditProfile: CreditProfile
  ): Promise<Badge> {
    const badge: Badge = {
      id: `${userId}_${achievement.id}_${Date.now()}`,
      achievementId: achievement.id,
      userId,
      earnedAt: new Date(),
      metadata: {
        scoreAtEarning: this.calculateOverallScore(creditProfile),
        dimensionScores: this.extractDimensionScores(creditProfile),
        specialAttributes: this.generateSpecialAttributes(achievement, creditProfile)
      }
    };

    // Store the badge
    const userBadges = this.userBadges.get(userId) || [];
    userBadges.push(badge);
    this.userBadges.set(userId, userBadges);

    return badge;
  }

  private calculateOverallScore(creditProfile: CreditProfile): number {
    const scores = Object.values(creditProfile.dimensions).map(d => d.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private extractDimensionScores(creditProfile: CreditProfile): Record<string, number> {
    return {
      defiReliability: creditProfile.dimensions.defiReliability.score,
      tradingConsistency: creditProfile.dimensions.tradingConsistency.score,
      stakingCommitment: creditProfile.dimensions.stakingCommitment.score,
      governanceParticipation: creditProfile.dimensions.governanceParticipation.score,
      liquidityProvider: creditProfile.dimensions.liquidityProvider.score
    };
  }

  private generateSpecialAttributes(achievement: Achievement, creditProfile: CreditProfile): string[] {
    const attributes: string[] = [];
    
    if (achievement.tier === AchievementTier.DIAMOND) {
      attributes.push('legendary');
    }
    
    if (achievement.category === AchievementCategory.EXCEPTIONAL_BEHAVIOR) {
      attributes.push('exceptional');
    }
    
    // Add dimension-specific attributes
    const topDimension = this.getTopDimension(creditProfile);
    if (topDimension) {
      attributes.push(`${topDimension}_specialist`);
    }
    
    return attributes;
  }

  private getTopDimension(creditProfile: CreditProfile): string | null {
    let topDimension = '';
    let topScore = 0;
    
    Object.entries(creditProfile.dimensions).forEach(([dimension, data]) => {
      if (data.score > topScore) {
        topScore = data.score;
        topDimension = dimension;
      }
    });
    
    return topScore > 0 ? topDimension : null;
  }

  getUserBadges(userId: string): Badge[] {
    return this.userBadges.get(userId) || [];
  }

  getAchievement(achievementId: string): Achievement | undefined {
    return this.achievements.get(achievementId);
  }

  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  addCustomAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }
}