import {
  SeasonalChallenge,
  ChallengeLeaderboard,
  AchievementRequirement,
  AchievementReward,
  RequirementType,
  RewardType,
  BonusMultiplier,
  AchievementCategory,
  AchievementTier
} from '../../types/gamification';
import { CreditProfile } from '../../types/credit';
import { formatError } from '../../utils/errors';

export class SeasonalChallenges {
  private challenges: Map<string, SeasonalChallenge> = new Map();
  private userParticipation: Map<string, string[]> = new Map(); // userId -> challengeIds
  private challengeRewards: Map<string, BonusMultiplier[]> = new Map();
  private userProgress: Map<string, Map<string, ChallengeProgress>> = new Map(); // userId -> challengeId -> progress

  constructor() {
    this.initializeSeasonalChallenges();
  }

  private initializeSeasonalChallenges(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Create seasonal challenges based on current time
    const seasonalChallenges: SeasonalChallenge[] = [
      // Q1 Challenge - New Year Credit Resolution
      {
        id: 'q1_credit_resolution',
        name: 'New Year Credit Resolution',
        description: 'Start the year strong by improving your credit score across all dimensions',
        startDate: new Date(currentYear, 0, 1), // January 1st
        endDate: new Date(currentYear, 2, 31), // March 31st
        requirements: [
          {
            type: RequirementType.SCORE_IMPROVEMENT,
            threshold: 50,
            duration: 90
          },
          {
            type: RequirementType.CONSISTENCY_STREAK,
            threshold: 30,
            duration: 30
          }
        ],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.15,
            duration: 30
          },
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.1,
            duration: 14
          }
        ],
        participants: [],
        leaderboard: [],
        isActive: this.isDateInRange(currentDate, new Date(currentYear, 0, 1), new Date(currentYear, 2, 31))
      },

      // Q2 Challenge - Spring DeFi Mastery
      {
        id: 'q2_defi_mastery',
        name: 'Spring DeFi Mastery',
        description: 'Master DeFi protocols and boost your reliability score this spring',
        startDate: new Date(currentYear, 3, 1), // April 1st
        endDate: new Date(currentYear, 5, 30), // June 30th
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'defiReliability',
            threshold: 750
          },
          {
            type: RequirementType.TRANSACTION_VOLUME,
            threshold: 10000, // $10k USD
            duration: 90
          }
        ],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.2,
            duration: 45
          },
          {
            type: RewardType.NFT_UPGRADE,
            value: 1
          }
        ],
        participants: [],
        leaderboard: [],
        isActive: this.isDateInRange(currentDate, new Date(currentYear, 3, 1), new Date(currentYear, 5, 30))
      },

      // Q3 Challenge - Summer Staking Spree
      {
        id: 'q3_staking_spree',
        name: 'Summer Staking Spree',
        description: 'Show your commitment through consistent staking behavior',
        startDate: new Date(currentYear, 6, 1), // July 1st
        endDate: new Date(currentYear, 8, 30), // September 30th
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            dimension: 'stakingCommitment',
            threshold: 800
          },
          {
            type: RequirementType.CONSISTENCY_STREAK,
            threshold: 60,
            duration: 60
          }
        ],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.25,
            duration: 60
          },
          {
            type: RewardType.EXCLUSIVE_ACCESS,
            value: 1
          }
        ],
        participants: [],
        leaderboard: [],
        isActive: this.isDateInRange(currentDate, new Date(currentYear, 6, 1), new Date(currentYear, 8, 30))
      },

      // Q4 Challenge - Year-End Excellence
      {
        id: 'q4_year_end_excellence',
        name: 'Year-End Excellence',
        description: 'Finish the year as a top performer across all credit dimensions',
        startDate: new Date(currentYear, 9, 1), // October 1st
        endDate: new Date(currentYear, 11, 31), // December 31st
        requirements: [
          {
            type: RequirementType.SCORE_THRESHOLD,
            threshold: 850
          },
          {
            type: RequirementType.SCORE_IMPROVEMENT,
            threshold: 100,
            duration: 90
          }
        ],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.3,
            duration: 90
          },
          {
            type: RewardType.SCORE_MULTIPLIER,
            value: 1.2,
            duration: 30
          }
        ],
        participants: [],
        leaderboard: [],
        isActive: this.isDateInRange(currentDate, new Date(currentYear, 9, 1), new Date(currentYear, 11, 31))
      },

      // Monthly Mini-Challenges
      {
        id: `monthly_consistency_${currentMonth}`,
        name: `${this.getMonthName(currentMonth)} Consistency Challenge`,
        description: 'Maintain consistent positive behavior throughout the month',
        startDate: new Date(currentYear, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0), // Last day of current month
        requirements: [
          {
            type: RequirementType.CONSISTENCY_STREAK,
            threshold: 20,
            duration: 30
          }
        ],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.1,
            duration: 14
          }
        ],
        participants: [],
        leaderboard: [],
        isActive: true
      },

      // Special Event Challenges
      {
        id: 'governance_participation_drive',
        name: 'Governance Participation Drive',
        description: 'Boost your governance participation score through active voting',
        startDate: new Date(currentYear, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 2, 0),
        requirements: [
          {
            type: RequirementType.SCORE_IMPROVEMENT,
            dimension: 'governanceParticipation',
            threshold: 75,
            duration: 60
          }
        ],
        rewards: [
          {
            type: RewardType.TEMPORARY_BOOST,
            value: 1.15,
            duration: 21
          }
        ],
        participants: [],
        leaderboard: [],
        isActive: true
      }
    ];

    seasonalChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeJoinResult> {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (!challenge.isActive) {
        throw new Error('Challenge is not currently active');
      }

      const now = new Date();
      if (now < challenge.startDate || now > challenge.endDate) {
        throw new Error('Challenge is not within active date range');
      }

      // Check if user is already participating
      const userChallenges = this.userParticipation.get(userId) || [];
      if (userChallenges.includes(challengeId)) {
        throw new Error('User is already participating in this challenge');
      }

      // Add user to challenge
      challenge.participants.push(userId);
      userChallenges.push(challengeId);
      this.userParticipation.set(userId, userChallenges);

      // Initialize user progress
      const userProgressMap = this.userProgress.get(userId) || new Map();
      userProgressMap.set(challengeId, {
        challengeId,
        userId,
        joinedAt: now,
        progress: 0,
        currentScore: 0,
        requirementProgress: challenge.requirements.map(req => ({
          type: req.type,
          completed: false,
          progress: 0,
          target: req.threshold || 0
        }))
      });
      this.userProgress.set(userId, userProgressMap);

      return {
        success: true,
        challenge,
        userProgress: userProgressMap.get(challengeId)!
      };
    } catch (error) {
      throw new Error(formatError('Failed to join seasonal challenge', error));
    }
  }

  async updateUserProgress(
    userId: string, 
    challengeId: string, 
    creditProfile: CreditProfile
  ): Promise<ChallengeProgressUpdate> {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const userProgressMap = this.userProgress.get(userId);
      if (!userProgressMap || !userProgressMap.has(challengeId)) {
        throw new Error('User is not participating in this challenge');
      }

      const progress = userProgressMap.get(challengeId)!;
      const previousScore = progress.currentScore;
      let totalProgress = 0;
      let completedRequirements = 0;

      // Update requirement progress
      for (let i = 0; i < challenge.requirements.length; i++) {
        const requirement = challenge.requirements[i];
        const reqProgress = progress.requirementProgress[i];

        const newProgress = this.calculateRequirementProgress(requirement, creditProfile, progress);
        reqProgress.progress = newProgress;
        reqProgress.completed = newProgress >= 100;

        if (reqProgress.completed) {
          completedRequirements++;
        }

        totalProgress += newProgress;
      }

      // Calculate overall progress
      progress.progress = totalProgress / challenge.requirements.length;
      progress.currentScore = this.calculateChallengeScore(challenge, creditProfile, progress);

      // Update leaderboard
      this.updateLeaderboard(challengeId, userId, progress.currentScore, progress.progress);

      // Check for completion and rewards
      const isCompleted = completedRequirements === challenge.requirements.length;
      let rewards: BonusMultiplier[] = [];

      if (isCompleted && !progress.completedAt) {
        progress.completedAt = new Date();
        rewards = await this.awardChallengeRewards(userId, challenge);
      }

      return {
        progress,
        scoreImprovement: progress.currentScore - previousScore,
        newRewards: rewards,
        isCompleted,
        leaderboardPosition: this.getUserLeaderboardPosition(challengeId, userId)
      };
    } catch (error) {
      throw new Error(formatError('Failed to update challenge progress', error));
    }
  }

  private calculateRequirementProgress(
    requirement: AchievementRequirement,
    creditProfile: CreditProfile,
    progress: ChallengeProgress
  ): number {
    switch (requirement.type) {
      case RequirementType.SCORE_THRESHOLD:
        if (requirement.dimension) {
          const dimensionScore = this.getDimensionScore(creditProfile, requirement.dimension);
          return Math.min(100, (dimensionScore / (requirement.threshold || 1)) * 100);
        } else {
          const overallScore = this.calculateOverallScore(creditProfile);
          return Math.min(100, (overallScore / (requirement.threshold || 1)) * 100);
        }

      case RequirementType.SCORE_IMPROVEMENT:
        // This would require historical data - simplified for now
        const currentScore = requirement.dimension 
          ? this.getDimensionScore(creditProfile, requirement.dimension)
          : this.calculateOverallScore(creditProfile);
        const baselineScore = progress.baselineScore || currentScore * 0.9; // Estimate
        const improvement = currentScore - baselineScore;
        return Math.min(100, (improvement / (requirement.threshold || 1)) * 100);

      case RequirementType.CONSISTENCY_STREAK:
        // This would require daily tracking - simplified for now
        const daysSinceJoin = Math.floor((Date.now() - progress.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(100, (daysSinceJoin / (requirement.threshold || 1)) * 100);

      case RequirementType.TRANSACTION_VOLUME:
        // This would require transaction tracking - simplified for now
        return Math.min(100, Math.random() * 100); // Placeholder

      default:
        return 0;
    }
  }

  private calculateChallengeScore(
    challenge: SeasonalChallenge,
    creditProfile: CreditProfile,
    progress: ChallengeProgress
  ): number {
    let score = 0;
    
    // Base score from overall credit profile
    score += this.calculateOverallScore(creditProfile) * 0.6;
    
    // Bonus for requirement completion
    const completedReqs = progress.requirementProgress.filter(r => r.completed).length;
    score += (completedReqs / challenge.requirements.length) * 200;
    
    // Time bonus (earlier completion gets higher score)
    const challengeDuration = challenge.endDate.getTime() - challenge.startDate.getTime();
    const timeElapsed = Date.now() - progress.joinedAt.getTime();
    const timeBonus = Math.max(0, (1 - timeElapsed / challengeDuration) * 100);
    score += timeBonus;

    return Math.round(score);
  }

  private updateLeaderboard(challengeId: string, userId: string, score: number, progress: number): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return;

    // Remove existing entry
    challenge.leaderboard = challenge.leaderboard.filter(entry => entry.userId !== userId);

    // Add new entry
    challenge.leaderboard.push({
      userId,
      score,
      progress,
      rank: 0 // Will be calculated below
    });

    // Sort by score descending
    challenge.leaderboard.sort((a, b) => b.score - a.score);

    // Update ranks
    challenge.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  private async awardChallengeRewards(userId: string, challenge: SeasonalChallenge): Promise<BonusMultiplier[]> {
    const rewards: BonusMultiplier[] = [];
    const userRewards = this.challengeRewards.get(userId) || [];

    for (const reward of challenge.rewards) {
      if (reward.type === RewardType.TEMPORARY_BOOST || reward.type === RewardType.SCORE_MULTIPLIER) {
        const multiplier: BonusMultiplier = {
          userId,
          dimension: 'all',
          multiplier: reward.value,
          startDate: new Date(),
          endDate: this.addDays(new Date(), reward.duration || 14),
          source: `seasonal_${challenge.id}`
        };

        rewards.push(multiplier);
        userRewards.push(multiplier);
      }
    }

    this.challengeRewards.set(userId, userRewards);
    return rewards;
  }

  getActiveChallenges(): SeasonalChallenge[] {
    const now = new Date();
    return Array.from(this.challenges.values()).filter(challenge => 
      challenge.isActive && now >= challenge.startDate && now <= challenge.endDate
    );
  }

  getUserChallenges(userId: string): UserChallengeData[] {
    const userChallengeIds = this.userParticipation.get(userId) || [];
    const userProgressMap = this.userProgress.get(userId) || new Map();

    return userChallengeIds.map(challengeId => {
      const challenge = this.challenges.get(challengeId);
      const progress = userProgressMap.get(challengeId);

      return {
        challenge: challenge!,
        progress: progress!,
        leaderboardPosition: this.getUserLeaderboardPosition(challengeId, userId)
      };
    });
  }

  getChallengeLeaderboard(challengeId: string, limit: number = 10): ChallengeLeaderboard[] {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return [];

    return challenge.leaderboard.slice(0, limit);
  }

  private getUserLeaderboardPosition(challengeId: string, userId: string): number {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return -1;

    const entry = challenge.leaderboard.find(e => e.userId === userId);
    return entry ? entry.rank : -1;
  }

  // Utility methods
  private getDimensionScore(creditProfile: CreditProfile, dimension: string): number {
    switch (dimension) {
      case 'defiReliability':
        return creditProfile.dimensions.defiReliability.score;
      case 'tradingConsistency':
        return creditProfile.dimensions.tradingConsistency.score;
      case 'stakingCommitment':
        return creditProfile.dimensions.stakingCommitment.score;
      case 'governanceParticipation':
        return creditProfile.dimensions.governanceParticipation.score;
      case 'liquidityProvider':
        return creditProfile.dimensions.liquidityProvider.score;
      default:
        return 0;
    }
  }

  private calculateOverallScore(creditProfile: CreditProfile): number {
    const dimensions = creditProfile.dimensions;
    return Math.round((
      dimensions.defiReliability.score +
      dimensions.tradingConsistency.score +
      dimensions.stakingCommitment.score +
      dimensions.governanceParticipation.score +
      dimensions.liquidityProvider.score
    ) / 5);
  }

  private isDateInRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Administrative methods
  createCustomChallenge(challenge: Omit<SeasonalChallenge, 'participants' | 'leaderboard'>): void {
    const fullChallenge: SeasonalChallenge = {
      ...challenge,
      participants: [],
      leaderboard: []
    };
    this.challenges.set(challenge.id, fullChallenge);
  }

  deactivateChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId);
    if (challenge) {
      challenge.isActive = false;
    }
  }

  getChallengeStats(challengeId: string): ChallengeStats | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return null;

    const completedParticipants = challenge.participants.filter(userId => {
      const userProgressMap = this.userProgress.get(userId);
      const progress = userProgressMap?.get(challengeId);
      return progress?.completedAt;
    }).length;

    return {
      challengeId,
      totalParticipants: challenge.participants.length,
      completedParticipants,
      completionRate: challenge.participants.length > 0 
        ? (completedParticipants / challenge.participants.length) * 100 
        : 0,
      averageScore: this.calculateAverageScore(challenge),
      topScore: challenge.leaderboard[0]?.score || 0,
      daysRemaining: Math.max(0, Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    };
  }

  private calculateAverageScore(challenge: SeasonalChallenge): number {
    if (challenge.leaderboard.length === 0) return 0;
    
    const totalScore = challenge.leaderboard.reduce((sum, entry) => sum + entry.score, 0);
    return Math.round(totalScore / challenge.leaderboard.length);
  }

  // Cleanup methods
  cleanupExpiredChallenges(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (now > challenge.endDate && !challenge.isActive) {
        this.challenges.delete(challengeId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  getSystemChallengeStats(): SystemChallengeStats {
    const allChallenges = Array.from(this.challenges.values());
    const activeChallenges = allChallenges.filter(c => c.isActive);
    const totalParticipants = allChallenges.reduce((sum, c) => sum + c.participants.length, 0);

    return {
      totalChallenges: allChallenges.length,
      activeChallenges: activeChallenges.length,
      totalParticipants,
      averageParticipantsPerChallenge: allChallenges.length > 0 
        ? Math.round(totalParticipants / allChallenges.length) 
        : 0,
      lastUpdated: new Date()
    };
  }
}

// Supporting interfaces
interface ChallengeProgress {
  challengeId: string;
  userId: string;
  joinedAt: Date;
  completedAt?: Date;
  progress: number;
  currentScore: number;
  baselineScore?: number;
  requirementProgress: RequirementProgress[];
}

interface RequirementProgress {
  type: RequirementType;
  completed: boolean;
  progress: number;
  target: number;
}

interface ChallengeJoinResult {
  success: boolean;
  challenge: SeasonalChallenge;
  userProgress: ChallengeProgress;
}

interface ChallengeProgressUpdate {
  progress: ChallengeProgress;
  scoreImprovement: number;
  newRewards: BonusMultiplier[];
  isCompleted: boolean;
  leaderboardPosition: number;
}

interface UserChallengeData {
  challenge: SeasonalChallenge;
  progress: ChallengeProgress;
  leaderboardPosition: number;
}

interface ChallengeStats {
  challengeId: string;
  totalParticipants: number;
  completedParticipants: number;
  completionRate: number;
  averageScore: number;
  topScore: number;
  daysRemaining: number;
}

interface SystemChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  averageParticipantsPerChallenge: number;
  lastUpdated: Date;
}