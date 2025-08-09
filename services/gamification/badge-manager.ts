import {
  Badge,
  Achievement,
  AchievementTier,
  BadgeMetadata,
  BonusMultiplier,
  RewardType
} from '../../types/gamification';
import { formatError } from '../../utils/errors';

export class BadgeManager {
  private badges: Map<string, Badge> = new Map();
  private bonusMultipliers: Map<string, BonusMultiplier[]> = new Map();

  async processBadgeRewards(badge: Badge, achievement: Achievement): Promise<BonusMultiplier[]> {
    try {
      const multipliers: BonusMultiplier[] = [];
      
      for (const reward of achievement.rewards) {
        if (reward.type === RewardType.SCORE_MULTIPLIER) {
          const multiplier = await this.createBonusMultiplier(
            badge.userId,
            reward.value,
            reward.duration || 7,
            achievement.id
          );
          multipliers.push(multiplier);
        }
      }

      // Store multipliers for the user
      const userMultipliers = this.bonusMultipliers.get(badge.userId) || [];
      userMultipliers.push(...multipliers);
      this.bonusMultipliers.set(badge.userId, userMultipliers);

      return multipliers;
    } catch (error) {
      throw new Error(formatError('Failed to process badge rewards', error));
    }
  }

  private async createBonusMultiplier(
    userId: string,
    multiplier: number,
    durationDays: number,
    source: string
  ): Promise<BonusMultiplier> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    return {
      userId,
      dimension: 'all', // Apply to all dimensions
      multiplier,
      startDate,
      endDate,
      source
    };
  }

  getActiveBonusMultipliers(userId: string): BonusMultiplier[] {
    const userMultipliers = this.bonusMultipliers.get(userId) || [];
    const now = new Date();
    
    return userMultipliers.filter(multiplier => 
      !multiplier.endDate || multiplier.endDate > now
    );
  }

  calculateTotalMultiplier(userId: string, dimension?: string): number {
    const activeMultipliers = this.getActiveBonusMultipliers(userId);
    
    let totalMultiplier = 1.0;
    
    for (const multiplier of activeMultipliers) {
      if (multiplier.dimension === 'all' || multiplier.dimension === dimension) {
        totalMultiplier *= multiplier.multiplier;
      }
    }
    
    return Math.min(totalMultiplier, 2.0); // Cap at 2x multiplier
  }

  getBadgeDisplayData(badge: Badge, achievement: Achievement): BadgeDisplayData {
    return {
      id: badge.id,
      name: achievement.name,
      description: achievement.description,
      tier: achievement.tier,
      category: achievement.category,
      earnedAt: badge.earnedAt,
      scoreAtEarning: badge.metadata.scoreAtEarning,
      specialAttributes: badge.metadata.specialAttributes || [],
      rarity: this.calculateBadgeRarity(achievement.tier),
      visualStyle: this.getBadgeVisualStyle(achievement.tier, achievement.category)
    };
  }

  private calculateBadgeRarity(tier: AchievementTier): BadgeRarity {
    switch (tier) {
      case AchievementTier.BRONZE:
        return { level: 'Common', percentage: 60 };
      case AchievementTier.SILVER:
        return { level: 'Uncommon', percentage: 25 };
      case AchievementTier.GOLD:
        return { level: 'Rare', percentage: 10 };
      case AchievementTier.PLATINUM:
        return { level: 'Epic', percentage: 4 };
      case AchievementTier.DIAMOND:
        return { level: 'Legendary', percentage: 1 };
      default:
        return { level: 'Common', percentage: 60 };
    }
  }

  private getBadgeVisualStyle(tier: AchievementTier, category: string): BadgeVisualStyle {
    const baseStyle: BadgeVisualStyle = {
      backgroundColor: this.getTierColor(tier),
      borderColor: this.getTierBorderColor(tier),
      iconUrl: this.getCategoryIcon(category),
      glowEffect: tier === AchievementTier.DIAMOND || tier === AchievementTier.PLATINUM,
      animation: tier === AchievementTier.DIAMOND ? 'pulse' : 'none'
    };

    return baseStyle;
  }

  private getTierColor(tier: AchievementTier): string {
    switch (tier) {
      case AchievementTier.BRONZE:
        return '#CD7F32';
      case AchievementTier.SILVER:
        return '#C0C0C0';
      case AchievementTier.GOLD:
        return '#FFD700';
      case AchievementTier.PLATINUM:
        return '#E5E4E2';
      case AchievementTier.DIAMOND:
        return '#B9F2FF';
      default:
        return '#CD7F32';
    }
  }

  private getTierBorderColor(tier: AchievementTier): string {
    switch (tier) {
      case AchievementTier.BRONZE:
        return '#8B4513';
      case AchievementTier.SILVER:
        return '#808080';
      case AchievementTier.GOLD:
        return '#B8860B';
      case AchievementTier.PLATINUM:
        return '#71706E';
      case AchievementTier.DIAMOND:
        return '#4169E1';
      default:
        return '#8B4513';
    }
  }

  private getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      credit_milestone: '🏆',
      consistency: '📈',
      exceptional_behavior: '⭐',
      community: '👥',
      education: '📚',
      seasonal: '🎯'
    };
    
    return iconMap[category] || '🏅';
  }

  cleanupExpiredMultipliers(): void {
    const now = new Date();
    
    for (const [userId, multipliers] of this.bonusMultipliers.entries()) {
      const activeMultipliers = multipliers.filter(m => 
        !m.endDate || m.endDate > now
      );
      
      if (activeMultipliers.length !== multipliers.length) {
        this.bonusMultipliers.set(userId, activeMultipliers);
      }
    }
  }

  getUserBadgeStats(userId: string): BadgeStats {
    const userBadges = Array.from(this.badges.values())
      .filter(badge => badge.userId === userId);
    
    const tierCounts = userBadges.reduce((counts, badge) => {
      // This would require achievement lookup, simplified for now
      counts.total++;
      return counts;
    }, {
      total: 0,
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    });

    const activeMultipliers = this.getActiveBonusMultipliers(userId);
    const totalMultiplier = this.calculateTotalMultiplier(userId);

    return {
      totalBadges: tierCounts.total,
      tierDistribution: tierCounts,
      activeMultipliers: activeMultipliers.length,
      currentMultiplier: totalMultiplier,
      rareAchievements: userBadges.filter(badge => 
        badge.metadata.specialAttributes?.includes('legendary') || 
        badge.metadata.specialAttributes?.includes('exceptional')
      ).length
    };
  }
}

interface BadgeDisplayData {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  category: string;
  earnedAt: Date;
  scoreAtEarning: number;
  specialAttributes: string[];
  rarity: BadgeRarity;
  visualStyle: BadgeVisualStyle;
}

interface BadgeRarity {
  level: string;
  percentage: number;
}

interface BadgeVisualStyle {
  backgroundColor: string;
  borderColor: string;
  iconUrl: string;
  glowEffect: boolean;
  animation: string;
}

interface BadgeStats {
  totalBadges: number;
  tierDistribution: {
    total: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
  activeMultipliers: number;
  currentMultiplier: number;
  rareAchievements: number;
}