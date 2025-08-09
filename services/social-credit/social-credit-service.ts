import { P2PLendingTracker, LendingSuccessMetrics } from './p2p-lending-tracker';
import { DisputeResolutionSystem } from './dispute-resolution';
import { 
  P2PLending, 
  CommunityFeedback, 
  SocialCreditData,
  FeedbackCategory,
  Dispute,
  DisputeCategory
} from '../../types/social';
import { validateAddress } from '../../utils/validation';
import { formatTimestamp } from '../../utils/time';

export interface SocialCreditConfig {
  minTransactionsForReliability: number;
  feedbackVerificationThreshold: number;
  reputationDecayRate: number;
  maxFeedbackAge: number; // in milliseconds
}

export class SocialCreditService {
  private p2pTracker: P2PLendingTracker;
  private disputeSystem: DisputeResolutionSystem;
  private config: SocialCreditConfig;

  constructor(config?: Partial<SocialCreditConfig>) {
    this.p2pTracker = new P2PLendingTracker();
    this.disputeSystem = new DisputeResolutionSystem();
    this.config = {
      minTransactionsForReliability: 5,
      feedbackVerificationThreshold: 0.7,
      reputationDecayRate: 0.95, // 5% decay per month
      maxFeedbackAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      ...config
    };
  }

  /**
   * Processes a new P2P lending transaction from blockchain data
   */
  async processLendingTransaction(
    lendingId: string,
    lender: string,
    borrower: string,
    amount: string,
    duration: number,
    interestRate: number,
    collateralRatio?: number
  ): Promise<void> {
    if (!validateAddress(lender) || !validateAddress(borrower)) {
      throw new Error('Invalid lender or borrower address');
    }

    const lending: P2PLending = {
      lendingId,
      counterparty: borrower,
      amount,
      duration,
      repaymentStatus: 'active',
      timeliness: 0, // Will be updated when repayment occurs
      interestRate,
      collateralRatio,
      startTimestamp: Date.now()
    };

    await this.p2pTracker.recordLendingTransaction(lending);
    console.log(`Processed P2P lending transaction: ${lendingId} from ${lender} to ${borrower}`);
  }

  /**
   * Processes loan repayment and calculates timeliness score
   */
  async processLoanRepayment(
    lendingId: string,
    repaymentTimestamp: number,
    amountRepaid: string,
    expectedAmount: string
  ): Promise<void> {
    // Find the original loan to calculate timeliness
    const allLoans = await this.getAllLoans();
    const loan = allLoans.find(l => l.lendingId === lendingId);
    
    if (!loan) {
      throw new Error(`Loan ${lendingId} not found`);
    }

    const expectedEndTime = loan.startTimestamp + (loan.duration * 1000);
    const actualRepaymentTime = repaymentTimestamp;
    
    // Calculate timeliness score (100 = on time, decreases with lateness)
    let timeliness = 100;
    if (actualRepaymentTime > expectedEndTime) {
      const daysLate = (actualRepaymentTime - expectedEndTime) / (24 * 60 * 60 * 1000);
      timeliness = Math.max(0, 100 - (daysLate * 5)); // 5 points per day late
    } else if (actualRepaymentTime < expectedEndTime) {
      const daysEarly = (expectedEndTime - actualRepaymentTime) / (24 * 60 * 60 * 1000);
      timeliness = Math.min(100, 100 + (daysEarly * 2)); // 2 bonus points per day early
    }

    // Determine repayment status
    const repaidAmount = parseFloat(amountRepaid);
    const expectedAmountNum = parseFloat(expectedAmount);
    let status: P2PLending['repaymentStatus'];

    if (repaidAmount >= expectedAmountNum * 0.95) { // 95% threshold for "completed"
      status = 'completed';
    } else if (repaidAmount >= expectedAmountNum * 0.5) { // 50% threshold for "partial"
      status = 'partial';
      timeliness *= 0.7; // Reduce timeliness score for partial repayment
    } else {
      status = 'defaulted';
      timeliness = 0;
    }

    await this.p2pTracker.updateRepaymentStatus(lendingId, status, timeliness);
    console.log(`Processed loan repayment: ${lendingId} with status ${status} and timeliness ${timeliness}`);
  }

  /**
   * Submits community feedback for a transaction
   */
  async submitCommunityFeedback(
    fromUser: string,
    toUser: string,
    transactionHash: string,
    rating: number,
    category: FeedbackCategory,
    comment?: string
  ): Promise<string> {
    if (!validateAddress(fromUser) || !validateAddress(toUser)) {
      throw new Error('Invalid user addresses');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const feedback: CommunityFeedback = {
      feedbackId,
      fromUser,
      toUser,
      transactionHash,
      rating,
      comment,
      category,
      timestamp: Date.now(),
      verified: await this.verifyTransactionFeedback(fromUser, toUser, transactionHash)
    };

    await this.p2pTracker.recordCommunityFeedback(feedback);
    console.log(`Submitted community feedback: ${feedbackId}`);
    
    return feedbackId;
  }

  /**
   * Verifies that feedback is from a legitimate transaction participant
   */
  private async verifyTransactionFeedback(
    fromUser: string,
    toUser: string,
    transactionHash: string
  ): Promise<boolean> {
    // In a real implementation, this would verify on-chain that the transaction
    // exists and that fromUser was a participant
    // For now, we'll use a simplified verification
    
    const allLoans = await this.getAllLoans();
    const relatedLoan = allLoans.find(loan => 
      (loan.counterparty === fromUser || loan.counterparty === toUser)
    );
    
    return relatedLoan !== undefined;
  }

  /**
   * Creates a dispute between two parties
   */
  async createDispute(
    plaintiff: string,
    defendant: string,
    relatedTransaction: string,
    category: DisputeCategory,
    description: string
  ): Promise<string> {
    const disputeId = await this.disputeSystem.createDispute(
      plaintiff,
      defendant,
      relatedTransaction,
      category,
      description
    );

    console.log(`Created dispute ${disputeId} in social credit system`);
    return disputeId;
  }

  /**
   * Gets dispute information
   */
  getDispute(disputeId: string): Dispute | undefined {
    return this.disputeSystem.getDispute(disputeId);
  }

  /**
   * Gets all disputes for a user
   */
  getUserDisputes(userAddress: string): Dispute[] {
    return this.disputeSystem.getUserDisputes(userAddress);
  }

  /**
   * Submits a vote for a dispute (if user is a selected juror)
   */
  async submitDisputeVote(
    disputeId: string,
    juror: string,
    vote: 'plaintiff' | 'defendant' | 'abstain',
    reasoning?: string
  ): Promise<void> {
    await this.disputeSystem.submitVote(disputeId, juror, vote, reasoning);
    console.log(`Vote submitted for dispute ${disputeId} by juror ${juror}`);
  }

  /**
   * Gets comprehensive social credit assessment for a user
   */
  async getSocialCreditAssessment(userAddress: string): Promise<{
    socialCreditData: SocialCreditData;
    successMetrics: LendingSuccessMetrics;
    reliabilityScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    const socialCreditData = this.p2pTracker.getSocialCreditData(userAddress);
    const successMetrics = this.p2pTracker.calculateSuccessMetrics(userAddress);
    const feedbackData = this.p2pTracker.aggregateCommunityFeedback(userAddress);

    // Include dispute history in social credit data
    const disputeHistory = this.disputeSystem.getUserDisputes(userAddress);
    socialCreditData.disputeHistory = disputeHistory;

    // Calculate reliability score based on multiple factors
    let reliabilityScore = 0;

    // Success rate component (40% weight)
    reliabilityScore += successMetrics.successRate * 0.4;

    // Timeliness component (30% weight)
    reliabilityScore += successMetrics.averageTimeliness * 0.3;

    // Community feedback component (20% weight)
    if (feedbackData.totalFeedback > 0) {
      const feedbackScore = ((feedbackData.averageRating - 1) / 4) * 100;
      reliabilityScore += feedbackScore * 0.2;
    }

    // Volume/experience component (10% weight)
    const experienceScore = Math.min(100, successMetrics.totalLoans * 10);
    reliabilityScore += experienceScore * 0.1;

    // Apply decay for insufficient data
    if (successMetrics.totalLoans < this.config.minTransactionsForReliability) {
      const dataConfidence = successMetrics.totalLoans / this.config.minTransactionsForReliability;
      reliabilityScore *= dataConfidence;
    }

    // Apply dispute penalties
    const disputePenalty = this.calculateDisputePenalty(disputeHistory);
    reliabilityScore = Math.max(0, reliabilityScore - disputePenalty);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (reliabilityScore >= 80 && successMetrics.successRate >= 90 && disputePenalty < 5) {
      riskLevel = 'low';
    } else if (reliabilityScore >= 60 && successMetrics.successRate >= 70 && disputePenalty < 15) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    return {
      socialCreditData,
      successMetrics,
      reliabilityScore: Math.max(0, Math.min(100, reliabilityScore)),
      riskLevel
    };
  }

  /**
   * Gets all loans across all users (for internal processing)
   */
  private async getAllLoans(): Promise<P2PLending[]> {
    const allLoans: P2PLending[] = [];
    // In a real implementation, this would query a database
    // For now, we'll return an empty array as this is mainly for verification
    return allLoans;
  }

  /**
   * Updates service configuration
   */
  updateConfig(newConfig: Partial<SocialCreditConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Updated social credit service configuration:', this.config);
  }

  /**
   * Calculates penalty based on dispute history
   */
  private calculateDisputePenalty(disputes: Dispute[]): number {
    let penalty = 0;

    disputes.forEach(dispute => {
      if (dispute.resolution) {
        // Apply penalty based on dispute outcome and category
        if (dispute.resolution.outcome === 'plaintiff_wins' && dispute.defendant) {
          // User lost as defendant
          switch (dispute.category) {
            case DisputeCategory.FRAUDULENT_BEHAVIOR:
              penalty += 20;
              break;
            case DisputeCategory.PAYMENT_DEFAULT:
              penalty += 15;
              break;
            case DisputeCategory.CONTRACT_VIOLATION:
              penalty += 10;
              break;
            case DisputeCategory.MISREPRESENTATION:
              penalty += 8;
              break;
          }
        } else if (dispute.resolution.outcome === 'defendant_wins' && dispute.plaintiff) {
          // User lost as plaintiff (false accusation)
          penalty += 5;
        }
      }
    });

    return penalty;
  }

  /**
   * Registers a user as a potential juror
   */
  async registerJuror(userAddress: string): Promise<void> {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    const assessment = await this.getSocialCreditAssessment(userAddress);
    
    await this.disputeSystem.addJurorToPool(
      userAddress,
      assessment.reliabilityScore,
      assessment.successMetrics.totalLoans,
      assessment.successMetrics.totalVolume
    );

    console.log(`Registered ${userAddress} as potential juror`);
  }

  /**
   * Gets service configuration
   */
  getConfig(): SocialCreditConfig {
    return { ...this.config };
  }

  /**
   * Gets dispute system configuration
   */
  getDisputeConfig() {
    return this.disputeSystem.getConfig();
  }
}