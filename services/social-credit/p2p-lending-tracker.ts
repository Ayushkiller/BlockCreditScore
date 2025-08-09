import { 
  P2PLending, 
  CommunityFeedback, 
  SocialCreditData, 
  TrustConnection,
  FeedbackCategory 
} from '../../types/social';
import { validateAddress } from '../../utils/validation';
import { formatTimestamp } from '../../utils/time';

export interface LendingSuccessMetrics {
  totalLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  partialRepayments: number;
  successRate: number; // percentage
  averageTimeliness: number; // 0-100 score
  totalVolume: string; // BigNumber as string
  averageLoanSize: string;
}

export interface ReputationWeights {
  volumeWeight: number;
  frequencyWeight: number;
  timelinessWeight: number;
  feedbackWeight: number;
}

export class P2PLendingTracker {
  private lendingHistory: Map<string, P2PLending[]> = new Map();
  private feedbackHistory: Map<string, CommunityFeedback[]> = new Map();
  private reputationWeights: ReputationWeights = {
    volumeWeight: 0.3,
    frequencyWeight: 0.2,
    timelinessWeight: 0.3,
    feedbackWeight: 0.2
  };

  /**
   * Records a new P2P lending transaction
   */
  async recordLendingTransaction(lending: P2PLending): Promise<void> {
    if (!validateAddress(lending.counterparty)) {
      throw new Error('Invalid counterparty address');
    }

    // Store lending record for both lender and borrower perspectives
    const lenderHistory = this.lendingHistory.get(lending.counterparty) || [];
    lenderHistory.push(lending);
    this.lendingHistory.set(lending.counterparty, lenderHistory);

    console.log(`Recorded P2P lending transaction: ${lending.lendingId}`);
  }

  /**
   * Updates the repayment status of an existing loan
   */
  async updateRepaymentStatus(
    lendingId: string, 
    status: P2PLending['repaymentStatus'],
    timeliness: number
  ): Promise<void> {
    for (const [address, loans] of this.lendingHistory.entries()) {
      const loan = loans.find(l => l.lendingId === lendingId);
      if (loan) {
        loan.repaymentStatus = status;
        loan.timeliness = Math.max(0, Math.min(100, timeliness));
        
        if (status === 'completed' || status === 'defaulted') {
          loan.endTimestamp = Date.now();
        }
        
        console.log(`Updated loan ${lendingId} status to ${status} with timeliness ${timeliness}`);
        return;
      }
    }
    
    throw new Error(`Lending transaction ${lendingId} not found`);
  }

  /**
   * Calculates lending success metrics for a user
   */
  calculateSuccessMetrics(userAddress: string): LendingSuccessMetrics {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    const loans = this.lendingHistory.get(userAddress) || [];
    
    if (loans.length === 0) {
      return {
        totalLoans: 0,
        completedLoans: 0,
        defaultedLoans: 0,
        partialRepayments: 0,
        successRate: 0,
        averageTimeliness: 0,
        totalVolume: '0',
        averageLoanSize: '0'
      };
    }

    const completedLoans = loans.filter(l => l.repaymentStatus === 'completed').length;
    const defaultedLoans = loans.filter(l => l.repaymentStatus === 'defaulted').length;
    const partialRepayments = loans.filter(l => l.repaymentStatus === 'partial').length;
    
    const successRate = loans.length > 0 ? (completedLoans / loans.length) * 100 : 0;
    
    const completedAndPartial = loans.filter(l => 
      l.repaymentStatus === 'completed' || l.repaymentStatus === 'partial'
    );
    const averageTimeliness = completedAndPartial.length > 0 
      ? completedAndPartial.reduce((sum, loan) => sum + loan.timeliness, 0) / completedAndPartial.length
      : 0;

    // Calculate total volume (simplified - in real implementation would handle BigNumber properly)
    const totalVolume = loans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0).toString();
    const averageLoanSize = loans.length > 0 
      ? (parseFloat(totalVolume) / loans.length).toString()
      : '0';

    return {
      totalLoans: loans.length,
      completedLoans,
      defaultedLoans,
      partialRepayments,
      successRate,
      averageTimeliness,
      totalVolume,
      averageLoanSize
    };
  }  /**

   * Records community feedback for a transaction
   */
  async recordCommunityFeedback(feedback: CommunityFeedback): Promise<void> {
    if (!validateAddress(feedback.fromUser) || !validateAddress(feedback.toUser)) {
      throw new Error('Invalid user addresses in feedback');
    }

    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const userFeedback = this.feedbackHistory.get(feedback.toUser) || [];
    userFeedback.push(feedback);
    this.feedbackHistory.set(feedback.toUser, userFeedback);

    console.log(`Recorded community feedback: ${feedback.feedbackId} for user ${feedback.toUser}`);
  }

  /**
   * Aggregates community feedback for a user
   */
  aggregateCommunityFeedback(userAddress: string): {
    averageRating: number;
    totalFeedback: number;
    categoryBreakdown: Record<FeedbackCategory, { count: number; averageRating: number }>;
    verifiedFeedbackRatio: number;
  } {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    const feedback = this.feedbackHistory.get(userAddress) || [];
    
    if (feedback.length === 0) {
      return {
        averageRating: 0,
        totalFeedback: 0,
        categoryBreakdown: {} as any,
        verifiedFeedbackRatio: 0
      };
    }

    const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    const verifiedCount = feedback.filter(f => f.verified).length;
    const verifiedFeedbackRatio = verifiedCount / feedback.length;

    // Category breakdown
    const categoryBreakdown: Record<FeedbackCategory, { count: number; averageRating: number }> = 
      {} as Record<FeedbackCategory, { count: number; averageRating: number }>;

    Object.values(FeedbackCategory).forEach(category => {
      const categoryFeedback = feedback.filter(f => f.category === category);
      categoryBreakdown[category] = {
        count: categoryFeedback.length,
        averageRating: categoryFeedback.length > 0 
          ? categoryFeedback.reduce((sum, f) => sum + f.rating, 0) / categoryFeedback.length
          : 0
      };
    });

    return {
      averageRating,
      totalFeedback: feedback.length,
      categoryBreakdown,
      verifiedFeedbackRatio
    };
  }

  /**
   * Calculates reputation weight based on transaction volume and history
   */
  calculateReputationWeight(userAddress: string): number {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    const successMetrics = this.calculateSuccessMetrics(userAddress);
    const feedbackData = this.aggregateCommunityFeedback(userAddress);

    // Volume component (0-100 scale based on total volume)
    const volumeScore = Math.min(100, Math.log10(parseFloat(successMetrics.totalVolume) + 1) * 20);

    // Frequency component (0-100 scale based on number of transactions)
    const frequencyScore = Math.min(100, successMetrics.totalLoans * 5);

    // Timeliness component (already 0-100 scale)
    const timelinessScore = successMetrics.averageTimeliness;

    // Feedback component (convert 1-5 scale to 0-100 scale)
    const feedbackScore = feedbackData.averageRating > 0 
      ? ((feedbackData.averageRating - 1) / 4) * 100 
      : 0;

    // Apply weights and calculate final reputation weight
    const reputationWeight = 
      (volumeScore * this.reputationWeights.volumeWeight) +
      (frequencyScore * this.reputationWeights.frequencyWeight) +
      (timelinessScore * this.reputationWeights.timelinessWeight) +
      (feedbackScore * this.reputationWeights.feedbackWeight);

    return Math.max(0, Math.min(100, reputationWeight));
  }

  /**
   * Gets comprehensive social credit data for a user
   */
  getSocialCreditData(userAddress: string): SocialCreditData {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    const p2pLendingHistory = this.lendingHistory.get(userAddress) || [];
    const communityFeedback = this.feedbackHistory.get(userAddress) || [];
    const reputationScore = this.calculateReputationWeight(userAddress);

    // Build trust network based on lending relationships
    const trustNetwork: TrustConnection[] = [];
    const counterparties = new Map<string, { transactions: number; volume: number; lastInteraction: number }>();

    p2pLendingHistory.forEach(loan => {
      const existing = counterparties.get(loan.counterparty) || { transactions: 0, volume: 0, lastInteraction: 0 };
      existing.transactions += 1;
      existing.volume += parseFloat(loan.amount);
      existing.lastInteraction = Math.max(existing.lastInteraction, loan.startTimestamp);
      counterparties.set(loan.counterparty, existing);
    });

    counterparties.forEach((data, address) => {
      const trustScore = Math.min(100, (data.transactions * 10) + (Math.log10(data.volume + 1) * 5));
      trustNetwork.push({
        connectedUser: address,
        trustScore,
        mutualTransactions: data.transactions,
        totalVolume: data.volume.toString(),
        lastInteraction: data.lastInteraction,
        connectionType: 'direct'
      });
    });

    return {
      p2pLendingHistory,
      communityFeedback,
      disputeHistory: [], // Will be implemented in task 5.2
      reputationScore,
      trustNetwork
    };
  }

  /**
   * Updates reputation weights configuration
   */
  updateReputationWeights(weights: Partial<ReputationWeights>): void {
    this.reputationWeights = { ...this.reputationWeights, ...weights };
    console.log('Updated reputation weights:', this.reputationWeights);
  }

  /**
   * Gets lending history for a specific user
   */
  getLendingHistory(userAddress: string): P2PLending[] {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }
    return this.lendingHistory.get(userAddress) || [];
  }

  /**
   * Gets community feedback for a specific user
   */
  getCommunityFeedback(userAddress: string): CommunityFeedback[] {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }
    return this.feedbackHistory.get(userAddress) || [];
  }
}