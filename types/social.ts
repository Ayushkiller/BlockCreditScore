// Social Credit and Community Data Models

export interface SocialCreditData {
  p2pLendingHistory: P2PLending[];
  communityFeedback: CommunityFeedback[];
  disputeHistory: Dispute[];
  reputationScore: number;
  trustNetwork: TrustConnection[];
}

export interface P2PLending {
  lendingId: string;
  counterparty: string;
  amount: string; // BigNumber as string
  duration: number; // in seconds
  repaymentStatus: 'completed' | 'partial' | 'defaulted' | 'active';
  timeliness: number; // 0-100 score
  interestRate: number;
  collateralRatio?: number;
  startTimestamp: number;
  endTimestamp?: number;
}

export interface CommunityFeedback {
  feedbackId: string;
  fromUser: string;
  toUser: string;
  transactionHash: string;
  rating: number; // 1-5 scale
  comment?: string;
  category: FeedbackCategory;
  timestamp: number;
  verified: boolean;
}

export enum FeedbackCategory {
  LENDING_EXPERIENCE = 'lending_experience',
  BORROWING_EXPERIENCE = 'borrowing_experience',
  TRADING_PARTNER = 'trading_partner',
  GOVERNANCE_PARTICIPATION = 'governance_participation',
  GENERAL_TRUSTWORTHINESS = 'general_trustworthiness'
}

export interface Dispute {
  disputeId: string;
  plaintiff: string;
  defendant: string;
  relatedTransaction: string;
  category: DisputeCategory;
  description: string;
  evidence: Evidence[];
  status: DisputeStatus;
  jurors: string[];
  votes: DisputeVote[];
  resolution?: DisputeResolution;
  createdAt: number;
  resolvedAt?: number;
}

export enum DisputeCategory {
  PAYMENT_DEFAULT = 'payment_default',
  FRAUDULENT_BEHAVIOR = 'fraudulent_behavior',
  CONTRACT_VIOLATION = 'contract_violation',
  MISREPRESENTATION = 'misrepresentation'
}

export enum DisputeStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VOTING = 'voting',
  RESOLVED = 'resolved',
  APPEALED = 'appealed'
}

export interface Evidence {
  evidenceId: string;
  submittedBy: string;
  type: 'transaction' | 'document' | 'testimony' | 'screenshot';
  data: string; // IPFS hash or on-chain data
  timestamp: number;
}

export interface DisputeVote {
  juror: string;
  vote: 'plaintiff' | 'defendant' | 'abstain';
  reasoning?: string;
  timestamp: number;
}

export interface DisputeResolution {
  outcome: 'plaintiff_wins' | 'defendant_wins' | 'partial_resolution';
  scoreAdjustment: {
    plaintiff: number;
    defendant: number;
  };
  reasoning: string;
  enforcementActions?: string[];
}

export interface TrustConnection {
  connectedUser: string;
  trustScore: number; // 0-100
  mutualTransactions: number;
  totalVolume: string; // BigNumber as string
  lastInteraction: number;
  connectionType: 'direct' | 'indirect';
}