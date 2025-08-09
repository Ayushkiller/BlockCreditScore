// Social Credit Integration System
// Implements P2P lending tracking, community feedback aggregation, and decentralized dispute resolution

export { P2PLendingTracker, LendingSuccessMetrics, ReputationWeights } from './p2p-lending-tracker';
export { SocialCreditService, SocialCreditConfig } from './social-credit-service';
export { SocialCreditBlockchainMonitor, P2PLendingEvent } from './blockchain-monitor';
export { DisputeResolutionSystem, JurorSelectionCriteria, DisputeConfig } from './dispute-resolution';

// Re-export relevant types for convenience
export {
  SocialCreditData,
  P2PLending,
  CommunityFeedback,
  FeedbackCategory,
  TrustConnection,
  Dispute,
  DisputeCategory,
  DisputeStatus,
  Evidence,
  DisputeVote,
  DisputeResolution
} from '../../types/social';