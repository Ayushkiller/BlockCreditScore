export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  isActive: boolean;
  createdAt: Date;
}

export interface Badge {
  id: string;
  achievementId: string;
  userId: string;
  earnedAt: Date;
  metadata: BadgeMetadata;
}

export interface BadgeMetadata {
  scoreAtEarning: number;
  dimensionScores: Record<string, number>;
  specialAttributes?: string[];
}

export enum AchievementCategory {
  CREDIT_MILESTONE = 'credit_milestone',
  CONSISTENCY = 'consistency',
  EXCEPTIONAL_BEHAVIOR = 'exceptional_behavior',
  COMMUNITY = 'community',
  EDUCATION = 'education',
  SEASONAL = 'seasonal'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export interface AchievementRequirement {
  type: RequirementType;
  dimension?: string;
  threshold?: number;
  duration?: number; // in days
  consistency?: number; // percentage
}

export enum RequirementType {
  SCORE_THRESHOLD = 'score_threshold',
  SCORE_IMPROVEMENT = 'score_improvement',
  CONSISTENCY_STREAK = 'consistency_streak',
  TRANSACTION_VOLUME = 'transaction_volume',
  REFERRAL_COUNT = 'referral_count',
  EDUCATION_COMPLETION = 'education_completion'
}

export interface AchievementReward {
  type: RewardType;
  value: number;
  duration?: number; // for temporary rewards
}

export enum RewardType {
  SCORE_MULTIPLIER = 'score_multiplier',
  TEMPORARY_BOOST = 'temporary_boost',
  NFT_UPGRADE = 'nft_upgrade',
  EXCLUSIVE_ACCESS = 'exclusive_access'
}

export interface BonusMultiplier {
  userId: string;
  dimension: string;
  multiplier: number;
  startDate: Date;
  endDate?: Date;
  source: string; // achievement ID or reason
}

export interface ReferralReward {
  referrerId: string;
  refereeId: string;
  rewardType: RewardType;
  rewardValue: number;
  earnedAt: Date;
  status: ReferralStatus;
}

export enum ReferralStatus {
  PENDING = 'pending',
  QUALIFIED = 'qualified',
  REWARDED = 'rewarded',
  EXPIRED = 'expired'
}

export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: EducationDifficulty;
  estimatedTime: number; // in minutes
  rewards: AchievementReward[];
  prerequisites?: string[];
  isActive: boolean;
}

export enum EducationDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface EducationalProgress {
  userId: string;
  moduleId: string;
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  score?: number;
}

export interface SeasonalChallenge {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  participants: string[];
  leaderboard: ChallengeLeaderboard[];
  isActive: boolean;
}

export interface ChallengeLeaderboard {
  userId: string;
  score: number;
  rank: number;
  progress: number;
}

export interface GamificationStats {
  userId: string;
  totalAchievements: number;
  achievementsByCategory: Record<AchievementCategory, number>;
  activeBonuses: BonusMultiplier[];
  referralCount: number;
  educationProgress: EducationalProgress[];
  seasonalParticipation: string[];
  lastUpdated: Date;
}