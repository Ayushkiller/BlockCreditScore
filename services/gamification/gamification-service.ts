import { AchievementSystem } from './achievement-system';
import { BadgeManager } from './badge-manager';
import { ReferralSystem } from './referral-system';
import { EducationalIncentives } from './educational-incentives';
import { SeasonalChallenges } from './seasonal-challenges';
import {
  Badge,
  BonusMultiplier,
  GamificationStats,
  ReferralReward,
  Achievement,
  EducationalProgress,
  SeasonalChallenge
} from '../../types/gamification';
import { CreditProfile } from '../../types/credit';
import { formatError } from '../../utils/errors';

export class GamificationService {
  private achievementSystem: AchievementSystem;
  private badgeManager: BadgeManager;
  private referralSystem: ReferralSystem;
  private educationalIncentives: EducationalIncentives;
  private seasonalChallenges: SeasonalChallenges;

  constructor() {
    this.achievementSystem = new AchievementSystem();
    this.badgeManager = new BadgeManager();
    this.referralSystem = new ReferralSystem();
    this.educationalIncentives = new EducationalIncentives();
    this.seasonalChallenges = new SeasonalChallenges();
  }

  async processUserUpdate(userId: string, creditProfile: CreditProfile): Promise<GamificationUpdateResult> {
    try {
      const result: GamificationUpdateResult = {
        newBadges: [],
        newMultipliers: [],
        qualifiedReferrals: [],
        updatedStats: null
      };

      // Check for new achievements and award badges
      const newBadges = await this.achievementSystem.checkAchievements(userId, creditProfile);
      result.newBadges = newBadges;

      // Process badge rewards and create bonus multipliers
      for (const badge of newBadges) {
        const achievement = this.achievementSystem.getAchievement(badge.achievementId);
        if (achievement) {
          const multipliers = await this.badgeManager.processBadgeRewards(badge, achievement);
          result.newMultipliers.push(...multipliers);
        }
      }

      // Check for referral qualifications
      const pendingReferrals = this.referralSystem.getPendingReferrals()
        .filter(r => r.refereeId === userId);
      
      for (const referral of pendingReferrals) {
        const isQualified = await this.referralSystem.checkReferralQualification(referral, creditProfile);
        if (isQualified) {
          const referralMultipliers = await this.referralSystem.qualifyReferral(referral);
          result.qualifiedReferrals.push(referral);
          result.newMultipliers.push(...referralMultipliers);
        }
      }

      // Update seasonal challenge progress
      const userChallenges = this.seasonalChallenges.getUserChallenges(userId);
      for (const challengeData of userChallenges) {
        if (challengeData.challenge.isActive) {
          const challengeUpdate = await this.seasonalChallenges.updateUserProgress(
            userId, 
            challengeData.challenge.id, 
            creditProfile
          );
          result.newMultipliers.push(...challengeUpdate.newRewards);
        }
      }

      // Generate updated stats
      result.updatedStats = await this.getUserStats(userId);

      return result;
    } catch (error) {
      throw new Error(formatError('Failed to process user gamification update', error));
    }
  }

  async getUserStats(userId: string): Promise<GamificationStats> {
    try {
      const userBadges = this.achievementSystem.getUserBadges(userId);
      const activeBonuses = this.badgeManager.getActiveBonusMultipliers(userId);
      const referralStats = this.referralSystem.getReferralStats(userId);
      const badgeStats = this.badgeManager.getUserBadgeStats(userId);

      // Count achievements by category
      const achievementsByCategory = userBadges.reduce((counts, badge) => {
        const achievement = this.achievementSystem.getAchievement(badge.achievementId);
        if (achievement) {
          counts[achievement.category] = (counts[achievement.category] || 0) + 1;
        }
        return counts;
      }, {} as Record<string, number>);

      // Get educational progress
      const educationProgress = this.educationalIncentives.getUserProgress(userId);
      
      // Get seasonal challenge participation
      const seasonalParticipation = this.seasonalChallenges.getUserChallenges(userId)
        .map(challengeData => challengeData.challenge.id);

      return {
        userId,
        totalAchievements: userBadges.length,
        achievementsByCategory: achievementsByCategory as any,
        activeBonuses,
        referralCount: referralStats.qualifiedReferrals,
        educationProgress,
        seasonalParticipation,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new Error(formatError('Failed to get user stats', error));
    }
  }

  getActiveMultiplier(userId: string, dimension?: string): number {
    const badgeMultiplier = this.badgeManager.calculateTotalMultiplier(userId, dimension);
    const educationMultiplier = this.educationalIncentives.getUserEducationStats(userId).currentMultiplier;
    
    // Combine multipliers (multiplicative)
    return badgeMultiplier * educationMultiplier;
  }

  generateReferralCode(userId: string): string {
    return this.referralSystem.generateReferralCode(userId);
  }

  async processReferral(referralCode: string, newUserId: string): Promise<ReferralReward | null> {
    return this.referralSystem.processReferral(referralCode, newUserId);
  }

  getUserBadges(userId: string): Badge[] {
    return this.achievementSystem.getUserBadges(userId);
  }

  getBadgeDisplayData(badgeId: string): any {
    const userBadges = this.achievementSystem.getUserBadges(''); // This needs improvement
    const badge = userBadges.find(b => b.id === badgeId);
    if (!badge) return null;

    const achievement = this.achievementSystem.getAchievement(badge.achievementId);
    if (!achievement) return null;

    return this.badgeManager.getBadgeDisplayData(badge, achievement);
  }

  getAllAchievements(): Achievement[] {
    return this.achievementSystem.getAllAchievements();
  }

  getReferralLeaderboard(limit: number = 10): any[] {
    return this.referralSystem.getLeaderboard(limit);
  }

  // Administrative functions
  cleanupExpiredBonuses(): void {
    this.badgeManager.cleanupExpiredMultipliers();
  }

  expireOldReferrals(maxDays: number = 30): number {
    return this.referralSystem.expireOldPendingReferrals(maxDays);
  }

  cleanupExpiredChallenges(): number {
    return this.seasonalChallenges.cleanupExpiredChallenges();
  }

  addCustomAchievement(achievement: Achievement): void {
    this.achievementSystem.addCustomAchievement(achievement);
  }

  // Analytics functions
  getSystemStats(): GamificationSystemStats {
    const allAchievements = this.achievementSystem.getAllAchievements();
    const referralLeaderboard = this.referralSystem.getLeaderboard(100);
    const educationStats = this.educationalIncentives.getSystemEducationStats();
    const challengeStats = this.seasonalChallenges.getSystemChallengeStats();
    
    return {
      totalAchievements: allAchievements.length,
      achievementsByTier: allAchievements.reduce((counts, achievement) => {
        counts[achievement.tier] = (counts[achievement.tier] || 0) + 1;
        return counts;
      }, {} as Record<string, number>),
      totalActiveReferrals: referralLeaderboard.reduce((sum, entry) => sum + entry.totalReferrals, 0),
      topReferrers: referralLeaderboard.slice(0, 5),
      educationStats: {
        totalModules: educationStats.totalModules,
        totalCompletions: educationStats.totalCompletions,
        averageScore: educationStats.moduleStats.reduce((sum, m) => sum + m.averageScore, 0) / educationStats.moduleStats.length || 0
      },
      challengeStats: {
        totalChallenges: challengeStats.totalChallenges,
        activeChallenges: challengeStats.activeChallenges,
        totalParticipants: challengeStats.totalParticipants
      },
      lastUpdated: new Date()
    };
  }
}

interface GamificationUpdateResult {
  newBadges: Badge[];
  newMultipliers: BonusMultiplier[];
  qualifiedReferrals: ReferralReward[];
  updatedStats: GamificationStats | null;
}

interface GamificationSystemStats {
  totalAchievements: number;
  achievementsByTier: Record<string, number>;
  totalActiveReferrals: number;
  topReferrers: any[];
  educationStats: {
    totalModules: number;
    totalCompletions: number;
    averageScore: number;
  };
  challengeStats: {
    totalChallenges: number;
    activeChallenges: number;
    totalParticipants: number;
  };
  lastUpdated: Date;
}  /
/ Educational Incentives Methods
  async startEducationalModule(userId: string, moduleId: string): Promise<EducationalProgress> {
    return this.educationalIncentives.startModule(userId, moduleId);
  }

  async updateEducationalProgress(userId: string, moduleId: string, progressPercentage: number): Promise<EducationalProgress> {
    return this.educationalIncentives.updateProgress(userId, moduleId, progressPercentage);
  }

  async completeEducationalModule(userId: string, moduleId: string, finalScore?: number): Promise<any> {
    return this.educationalIncentives.completeModule(userId, moduleId, finalScore);
  }

  getUnlockedEducationalModules(userId: string): any[] {
    return this.educationalIncentives.getUnlockedModules(userId);
  }

  getUserEducationStats(userId: string): any {
    return this.educationalIncentives.getUserEducationStats(userId);
  }

  // Seasonal Challenges Methods
  getActiveChallenges(): SeasonalChallenge[] {
    return this.seasonalChallenges.getActiveChallenges();
  }

  async joinSeasonalChallenge(userId: string, challengeId: string): Promise<any> {
    return this.seasonalChallenges.joinChallenge(userId, challengeId);
  }

  getUserChallenges(userId: string): any[] {
    return this.seasonalChallenges.getUserChallenges(userId);
  }

  getChallengeLeaderboard(challengeId: string, limit?: number): any[] {
    return this.seasonalChallenges.getChallengeLeaderboard(challengeId, limit);
  }

  getChallengeStats(challengeId: string): any {
    return this.seasonalChallenges.getChallengeStats(challengeId);
  }