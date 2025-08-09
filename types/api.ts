// API Interfaces and Service Contracts

import { CreditProfile, ScoreDimension, ScoreHistory } from './credit';
import { CrossChainTransaction } from './transactions';
import { SocialCreditData } from './social';

// Credit Scoring Engine API
export interface ICreditScoringEngine {
  calculateCreditProfile(userAddress: string): Promise<CreditProfile>;
  updateScoreDimension(
    userAddress: string, 
    dimension: keyof CreditProfile['dimensions'], 
    newData: any
  ): Promise<void>;
  getCreditHistory(userAddress: string, timeRange: number): Promise<ScoreHistory[]>;
  getScoreConfidence(
    userAddress: string, 
    dimension: keyof CreditProfile['dimensions']
  ): Promise<number>;
}

// Data Aggregator API
export interface IDataAggregator {
  aggregateUserData(userAddress: string): Promise<CrossChainTransaction[]>;
  normalizeTransactionValue(transaction: CrossChainTransaction): Promise<number>;
  linkWallets(primaryWallet: string, walletsToLink: string[]): Promise<boolean>;
  detectAnomalies(userAddress: string): Promise<AnomalyReport[]>;
}

export interface AnomalyReport {
  type: 'suspicious_volume' | 'unusual_pattern' | 'potential_fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedTransactions: string[];
  timestamp: number;
}

// ML Prediction Service API
export interface IMLPredictionService {
  generateRiskPrediction(userAddress: string): Promise<RiskPrediction>;
  updateModels(): Promise<void>;
  getModelConfidence(): Promise<ModelConfidence>;
  validatePrediction(userAddress: string, actualOutcome: boolean): Promise<void>;
}

export interface ModelConfidence {
  thirtyDay: number;
  ninetyDay: number;
  oneEightyDay: number;
  lastTraining: number;
  dataQuality: number;
}

// Privacy Verification API
export interface IPrivacyVerifier {
  generateZKProof(userAddress: string, threshold: number): Promise<ZKProof>;
  verifyProof(proof: ZKProof): Promise<boolean>;
  generateSelectiveDisclosure(
    userAddress: string, 
    dimensions: (keyof CreditProfile['dimensions'])[]
  ): Promise<SelectiveDisclosure>;
}

export interface ZKProof {
  proof: string;
  publicInputs: string[];
  verificationKey: string;
  timestamp: number;
}

export interface SelectiveDisclosure {
  userAddress: string;
  revealedDimensions: Partial<CreditProfile['dimensions']>;
  proof: ZKProof;
  expiresAt: number;
}

// NFT Certificate API
export interface INFTCertificate {
  mintCertificate(userAddress: string): Promise<string>; // returns tokenId
  updateMetadata(tokenId: string, newData: CreditProfile): Promise<void>;
  getCertificateData(tokenId: string): Promise<NFTMetadata>;
  transferCertificate(from: string, to: string, tokenId: string): Promise<void>;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animationUrl?: string;
  attributes: NFTAttribute[];
  externalUrl?: string;
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
}

// Public Integration API
export interface CreditAPI {
  getCreditScore(
    address: string, 
    dimensions?: (keyof CreditProfile['dimensions'])[]
  ): Promise<CreditResponse>;
  verifyScore(address: string, threshold: number): Promise<ZKProof>;
  getCustomScore(address: string, weights: DimensionWeights): Promise<WeightedScore>;
  subscribeToUpdates(address: string, callback: UpdateCallback): Promise<Subscription>;
}

export interface CreditResponse {
  userAddress: string;
  scores: Partial<CreditProfile['dimensions']>;
  overallScore: number;
  confidence: number;
  lastUpdated: number;
  dataQuality: DataQualityMetrics;
}

export interface DimensionWeights {
  defiReliability: number;
  tradingConsistency: number;
  stakingCommitment: number;
  governanceParticipation: number;
  liquidityProvider: number;
}

export interface WeightedScore {
  score: number;
  weights: DimensionWeights;
  breakdown: Record<keyof DimensionWeights, number>;
  confidence: number;
}

export interface DataQualityMetrics {
  totalDataPoints: number;
  dataFreshness: number; // hours since last update
  crossChainCoverage: number; // percentage of supported chains with data
  historicalDepth: number; // days of historical data
}

export type UpdateCallback = (update: ScoreUpdate) => void;

export interface ScoreUpdate {
  userAddress: string;
  dimension: keyof CreditProfile['dimensions'];
  oldScore: number;
  newScore: number;
  trigger: string;
  timestamp: number;
}

export interface Subscription {
  id: string;
  userAddress: string;
  callback: UpdateCallback;
  createdAt: number;
  isActive: boolean;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export interface RateLimitError extends APIError {
  retryAfter: number;
  remainingRequests: number;
}