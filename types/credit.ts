// Credit Profile and Scoring Data Models

export interface CreditProfile {
  userAddress: string;
  linkedWallets: string[];
  dimensions: {
    defiReliability: ScoreDimension;
    tradingConsistency: ScoreDimension;
    stakingCommitment: ScoreDimension;
    governanceParticipation: ScoreDimension;
    liquidityProvider: ScoreDimension;
  };
  socialCredit: SocialCreditData;
  predictiveRisk: RiskPrediction;
  achievements: Achievement[];
  nftTokenId: number;
  lastUpdated: number; // timestamp
}

export interface ScoreDimension {
  score: number; // 0-1000 scale
  confidence: number; // 0-100 percentage
  dataPoints: number;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: number; // timestamp
}

export interface RiskPrediction {
  thirtyDay: PredictionData;
  ninetyDay: PredictionData;
  oneEightyDay: PredictionData;
  lastUpdated: number;
}

export interface PredictionData {
  riskScore: number; // 0-1000 scale
  confidence: number; // 0-100 percentage
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  impact: number; // -100 to 100
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  unlockedAt: number; // timestamp
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export enum AchievementCategory {
  DEFI_RELIABILITY = 'defi_reliability',
  TRADING_CONSISTENCY = 'trading_consistency',
  STAKING_COMMITMENT = 'staking_commitment',
  GOVERNANCE_PARTICIPATION = 'governance_participation',
  LIQUIDITY_PROVIDER = 'liquidity_provider',
  SOCIAL_CREDIT = 'social_credit',
  MILESTONE = 'milestone'
}

export interface ScoreHistory {
  timestamp: number;
  dimension: keyof CreditProfile['dimensions'];
  score: number;
  confidence: number;
  trigger: string; // what caused the score change
}