import {
  ReferralReward,
  ReferralStatus,
  RewardType,
  BonusMultiplier
} from '../../types/gamification';
import { CreditProfile } from '../../types/credit';
import { formatError } from '../../utils/errors';

export class ReferralSystem {
  private referrals: Map<string, ReferralReward[]> = new Map();
  private referralCodes: Map<string, string> = new Map(); // code -> userId
  private userReferralCodes: Map<string, string> = new Map(); // userId -> code

  generateReferralCode(userId: string): string {
    try {
      // Check if user already has a code
      const existingCode = this.userReferralCodes.get(userId);
      if (existingCode) {
        return existingCode;
      }

      // Generate new unique code
      const code = this.createUniqueCode(userId);
      this.referralCodes.set(code, userId);
      this.userReferralCodes.set(userId, code);
      
      return code;
    } catch (error) {
      throw new Error(formatError('Failed to generate referral code', error));
    }
  }

  private createUniqueCode(userId: string): string {
    // Create a readable code based on user address and timestamp
    const timestamp = Date.now().toString(36);
    const userHash = userId.slice(-6);
    return `CV${userHash}${timestamp}`.toUpperCase();
  }

  async processReferral(referralCode: string, newUserId: string): Promise<ReferralReward | null> {
    try {
      const referrerId = this.referralCodes.get(referralCode);
      if (!referrerId) {
        return null; // Invalid referral code
      }

      if (referrerId === newUserId) {
        throw new Error('Cannot refer yourself');
      }

      // Check if user was already referred
      const existingReferrals = this.getAllReferralsForUser(newUserId);
      if (existingReferrals.length > 0) {
        throw new Error('User already referred by someone else');
      }

      // Create pending referral reward
      const referralReward: ReferralReward = {
        referrerId,
        refereeId: newUserId,
        rewardType: RewardType.SCORE_MULTIPLIER,
        rewardValue: 1.1, // 10% bonus multiplier
        earnedAt: new Date(),
        status: ReferralStatus.PENDING
      };

      // Store the referral
      const referrerRewards = this.referrals.get(referrerId) || [];
      referrerRewards.push(referralReward);
      this.referrals.set(referrerId, referrerRewards);

      return referralReward;
    } catch (error) {
      throw new Error(formatError('Failed to process referral', error));
    }
  }

  async checkReferralQualification(
    referralReward: ReferralReward,
    refereeCreditProfile: CreditProfile
  ): Promise<boolean> {
    try {
      // Check if referee has built sufficient credit
      const overallScore = this.calculateOverallScore(refereeCreditProfile);
      const hasMinimumScore = overallScore >= 600; // Minimum score for qualification
      
      // Check if referee has been active for minimum period
      const daysSinceReferral = Math.floor(
        (Date.now() - referralReward.earnedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const hasMinimumActivity = daysSinceReferral >= 7; // 7 days minimum activity
      
      // Check if referee has sufficient data points
      const hasSufficientData = Object.values(refereeCreditProfile.dimensions)
        .every(dimension => dimension.dataPoints >= 5);

      return hasMinimumScore && hasMinimumActivity && hasSufficientData;
    } catch (error) {
      throw new Error(formatError('Failed to check referral qualification', error));
    }
  }

  async qualifyReferral(referralReward: ReferralReward): Promise<BonusMultiplier[]> {
    try {
      if (referralReward.status !== ReferralStatus.PENDING) {
        throw new Error('Referral is not in pending status');
      }

      // Update referral status
      referralReward.status = ReferralStatus.QUALIFIED;

      // Create bonus multipliers for both referrer and referee
      const multipliers: BonusMultiplier[] = [];

      // Referrer reward: 15% multiplier for 30 days
      const referrerMultiplier: BonusMultiplier = {
        userId: referralReward.referrerId,
        dimension: 'all',
        multiplier: 1.15,
        startDate: new Date(),
        endDate: this.addDays(new Date(), 30),
        source: `referral_${referralReward.refereeId}`
      };
      multipliers.push(referrerMultiplier);

      // Referee reward: 10% multiplier for 14 days
      const refereeMultiplier: BonusMultiplier = {
        userId: referralReward.refereeId,
        dimension: 'all',
        multiplier: 1.1,
        startDate: new Date(),
        endDate: this.addDays(new Date(), 14),
        source: `referred_by_${referralReward.referrerId}`
      };
      multipliers.push(refereeMultiplier);

      return multipliers;
    } catch (error) {
      throw new Error(formatError('Failed to qualify referral', error));
    }
  }

  getReferralStats(userId: string): ReferralStats {
    const userReferrals = this.referrals.get(userId) || [];
    
    const stats: ReferralStats = {
      totalReferrals: userReferrals.length,
      pendingReferrals: userReferrals.filter(r => r.status === ReferralStatus.PENDING).length,
      qualifiedReferrals: userReferrals.filter(r => r.status === ReferralStatus.QUALIFIED).length,
      rewardedReferrals: userReferrals.filter(r => r.status === ReferralStatus.REWARDED).length,
      totalRewardValue: userReferrals
        .filter(r => r.status === ReferralStatus.REWARDED)
        .reduce((sum, r) => sum + r.rewardValue, 0),
      referralCode: this.userReferralCodes.get(userId) || '',
      recentReferrals: userReferrals
        .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
        .slice(0, 5)
    };

    return stats;
  }

  getLeaderboard(limit: number = 10): ReferralLeaderboard[] {
    const leaderboard: ReferralLeaderboard[] = [];
    
    for (const [userId, referrals] of this.referrals.entries()) {
      const qualifiedCount = referrals.filter(r => 
        r.status === ReferralStatus.QUALIFIED || r.status === ReferralStatus.REWARDED
      ).length;
      
      if (qualifiedCount > 0) {
        leaderboard.push({
          userId,
          qualifiedReferrals: qualifiedCount,
          totalReferrals: referrals.length,
          rank: 0 // Will be set after sorting
        });
      }
    }

    // Sort by qualified referrals and assign ranks
    leaderboard.sort((a, b) => b.qualifiedReferrals - a.qualifiedReferrals);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard.slice(0, limit);
  }

  private calculateOverallScore(creditProfile: CreditProfile): number {
    const scores = Object.values(creditProfile.dimensions).map(d => d.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private getAllReferralsForUser(userId: string): ReferralReward[] {
    const allReferrals: ReferralReward[] = [];
    
    for (const referrals of this.referrals.values()) {
      const userReferrals = referrals.filter(r => r.refereeId === userId);
      allReferrals.push(...userReferrals);
    }
    
    return allReferrals;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Admin functions for monitoring
  getPendingReferrals(): ReferralReward[] {
    const pending: ReferralReward[] = [];
    
    for (const referrals of this.referrals.values()) {
      const pendingReferrals = referrals.filter(r => r.status === ReferralStatus.PENDING);
      pending.push(...pendingReferrals);
    }
    
    return pending;
  }

  expireOldPendingReferrals(maxDays: number = 30): number {
    let expiredCount = 0;
    const cutoffDate = this.addDays(new Date(), -maxDays);
    
    for (const referrals of this.referrals.values()) {
      for (const referral of referrals) {
        if (referral.status === ReferralStatus.PENDING && referral.earnedAt < cutoffDate) {
          referral.status = ReferralStatus.EXPIRED;
          expiredCount++;
        }
      }
    }
    
    return expiredCount;
  }
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  qualifiedReferrals: number;
  rewardedReferrals: number;
  totalRewardValue: number;
  referralCode: string;
  recentReferrals: ReferralReward[];
}

interface ReferralLeaderboard {
  userId: string;
  qualifiedReferrals: number;
  totalReferrals: number;
  rank: number;
}