import {
  Dispute,
  DisputeCategory,
  DisputeStatus,
  Evidence,
  DisputeVote,
  DisputeResolution
} from '../../types/social';
import { validateAddress } from '../../utils/validation';
import { formatTimestamp } from '../../utils/time';

export interface JurorSelectionCriteria {
  minReputationScore: number;
  minTransactionCount: number;
  minTotalVolume: string;
  excludeRelatedParties: boolean;
  maxJurors: number;
}

export interface DisputeConfig {
  votingPeriod: number; // in milliseconds
  evidenceSubmissionPeriod: number; // in milliseconds
  minJurorsRequired: number;
  consensusThreshold: number; // percentage (0-100)
  appealPeriod: number; // in milliseconds
}

export class DisputeResolutionSystem {
  private disputes: Map<string, Dispute> = new Map();
  private jurorPool: Map<string, JurorProfile> = new Map();
  private config: DisputeConfig;

  constructor(config?: Partial<DisputeConfig>) {
    this.config = {
      votingPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      evidenceSubmissionPeriod: 3 * 24 * 60 * 60 * 1000, // 3 days
      minJurorsRequired: 5,
      consensusThreshold: 60, // 60% majority
      appealPeriod: 2 * 24 * 60 * 60 * 1000, // 2 days
      ...config
    };
  }

  /**
   * Creates a new dispute
   */
  async createDispute(
    plaintiff: string,
    defendant: string,
    relatedTransaction: string,
    category: DisputeCategory,
    description: string,
    initialEvidence?: Evidence[]
  ): Promise<string> {
    if (!validateAddress(plaintiff) || !validateAddress(defendant)) {
      throw new Error('Invalid plaintiff or defendant address');
    }

    if (plaintiff === defendant) {
      throw new Error('Plaintiff and defendant cannot be the same address');
    }

    const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dispute: Dispute = {
      disputeId,
      plaintiff,
      defendant,
      relatedTransaction,
      category,
      description,
      evidence: initialEvidence || [],
      status: DisputeStatus.PENDING,
      jurors: [],
      votes: [],
      createdAt: Date.now()
    };

    this.disputes.set(disputeId, dispute);
    console.log(`Created dispute: ${disputeId} between ${plaintiff} and ${defendant}`);

    // Start evidence collection period
    setTimeout(() => {
      this.startJurorSelection(disputeId);
    }, this.config.evidenceSubmissionPeriod);

    return disputeId;
  }

  /**
   * Submits evidence for a dispute
   */
  async submitEvidence(
    disputeId: string,
    submittedBy: string,
    type: Evidence['type'],
    data: string
  ): Promise<string> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    if (dispute.status !== DisputeStatus.PENDING) {
      throw new Error(`Cannot submit evidence for dispute in status: ${dispute.status}`);
    }

    if (!validateAddress(submittedBy)) {
      throw new Error('Invalid submitter address');
    }

    // Check if submitter is authorized (plaintiff, defendant, or selected juror)
    const isAuthorized = submittedBy === dispute.plaintiff || 
                        submittedBy === dispute.defendant ||
                        dispute.jurors.includes(submittedBy);

    if (!isAuthorized) {
      throw new Error('Only dispute parties or selected jurors can submit evidence');
    }

    const evidenceId = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const evidence: Evidence = {
      evidenceId,
      submittedBy,
      type,
      data,
      timestamp: Date.now()
    };

    dispute.evidence.push(evidence);
    console.log(`Evidence submitted for dispute ${disputeId}: ${evidenceId}`);

    return evidenceId;
  }

  /**
   * Automatically collects evidence from on-chain data
   */
  async collectAutomaticEvidence(disputeId: string): Promise<Evidence[]> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    const automaticEvidence: Evidence[] = [];

    // Collect transaction history evidence
    const transactionEvidence = await this.collectTransactionEvidence(
      dispute.plaintiff,
      dispute.defendant,
      dispute.relatedTransaction
    );
    automaticEvidence.push(...transactionEvidence);

    // Collect reputation history evidence
    const reputationEvidence = await this.collectReputationEvidence(
      dispute.plaintiff,
      dispute.defendant
    );
    automaticEvidence.push(...reputationEvidence);

    // Add automatic evidence to dispute
    dispute.evidence.push(...automaticEvidence);

    console.log(`Collected ${automaticEvidence.length} pieces of automatic evidence for dispute ${disputeId}`);
    return automaticEvidence;
  }

  /**
   * Selects jurors for a dispute based on reputation criteria
   */
  async selectJurors(disputeId: string, criteria?: Partial<JurorSelectionCriteria>): Promise<string[]> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    const selectionCriteria: JurorSelectionCriteria = {
      minReputationScore: 70,
      minTransactionCount: 10,
      minTotalVolume: '1000',
      excludeRelatedParties: true,
      maxJurors: 7,
      ...criteria
    };

    // Get eligible jurors from the pool
    const eligibleJurors = Array.from(this.jurorPool.entries())
      .filter(([address, profile]) => {
        // Check reputation criteria
        if (profile.reputationScore < selectionCriteria.minReputationScore) return false;
        if (profile.transactionCount < selectionCriteria.minTransactionCount) return false;
        if (parseFloat(profile.totalVolume) < parseFloat(selectionCriteria.minTotalVolume)) return false;

        // Exclude related parties
        if (selectionCriteria.excludeRelatedParties) {
          if (address === dispute.plaintiff || address === dispute.defendant) return false;
          // Could also check for transaction history between juror and parties
        }

        return true;
      })
      .map(([address, profile]) => ({ address, profile }));

    if (eligibleJurors.length < this.config.minJurorsRequired) {
      throw new Error(`Insufficient eligible jurors. Found ${eligibleJurors.length}, need ${this.config.minJurorsRequired}`);
    }

    // Randomly select jurors (weighted by reputation)
    const selectedJurors: string[] = [];
    const maxJurors = Math.min(selectionCriteria.maxJurors, eligibleJurors.length);

    // Simple random selection (in production, would use weighted random based on reputation)
    const shuffled = eligibleJurors.sort(() => Math.random() - 0.5);
    for (let i = 0; i < maxJurors; i++) {
      selectedJurors.push(shuffled[i].address);
    }

    dispute.jurors = selectedJurors;
    console.log(`Selected ${selectedJurors.length} jurors for dispute ${disputeId}`);

    return selectedJurors;
  }

  /**
   * Starts the juror selection process
   */
  private async startJurorSelection(disputeId: string): Promise<void> {
    try {
      // Collect automatic evidence first
      await this.collectAutomaticEvidence(disputeId);

      // Select jurors
      await this.selectJurors(disputeId);

      // Update dispute status
      const dispute = this.disputes.get(disputeId);
      if (dispute) {
        dispute.status = DisputeStatus.UNDER_REVIEW;
        
        // Start voting period
        setTimeout(() => {
          this.startVotingPeriod(disputeId);
        }, 1000); // Small delay to allow jurors to review evidence
      }
    } catch (error) {
      console.error(`Error in juror selection for dispute ${disputeId}:`, error);
      // Could mark dispute as failed or retry
    }
  }

  /**
   * Starts the voting period for a dispute
   */
  private async startVotingPeriod(disputeId: string): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return;

    dispute.status = DisputeStatus.VOTING;
    console.log(`Started voting period for dispute ${disputeId}`);

    // Set timeout for voting period end
    setTimeout(() => {
      this.finalizeDispute(disputeId);
    }, this.config.votingPeriod);
  }  /**
 
  * Submits a vote from a juror
   */
  async submitVote(
    disputeId: string,
    juror: string,
    vote: DisputeVote['vote'],
    reasoning?: string
  ): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    if (dispute.status !== DisputeStatus.VOTING) {
      throw new Error(`Dispute is not in voting status: ${dispute.status}`);
    }

    if (!dispute.jurors.includes(juror)) {
      throw new Error(`Address ${juror} is not a selected juror for this dispute`);
    }

    // Check if juror has already voted
    const existingVote = dispute.votes.find(v => v.juror === juror);
    if (existingVote) {
      throw new Error(`Juror ${juror} has already voted on this dispute`);
    }

    const disputeVote: DisputeVote = {
      juror,
      vote,
      reasoning,
      timestamp: Date.now()
    };

    dispute.votes.push(disputeVote);
    console.log(`Vote submitted for dispute ${disputeId} by juror ${juror}: ${vote}`);

    // Check if all jurors have voted
    if (dispute.votes.length === dispute.jurors.length) {
      await this.finalizeDispute(disputeId);
    }
  }

  /**
   * Finalizes a dispute and determines the outcome
   */
  private async finalizeDispute(disputeId: string): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return;

    if (dispute.status !== DisputeStatus.VOTING) {
      console.warn(`Attempting to finalize dispute ${disputeId} with status ${dispute.status}`);
      return;
    }

    // Calculate vote results
    const plaintiffVotes = dispute.votes.filter(v => v.vote === 'plaintiff').length;
    const defendantVotes = dispute.votes.filter(v => v.vote === 'defendant').length;
    const abstainVotes = dispute.votes.filter(v => v.vote === 'abstain').length;
    const totalVotes = dispute.votes.length;

    // Determine outcome based on consensus threshold
    const plaintiffPercentage = totalVotes > 0 ? (plaintiffVotes / totalVotes) * 100 : 0;
    const defendantPercentage = totalVotes > 0 ? (defendantVotes / totalVotes) * 100 : 0;

    let outcome: DisputeResolution['outcome'];
    let scoreAdjustment = { plaintiff: 0, defendant: 0 };
    let reasoning = '';

    if (plaintiffPercentage >= this.config.consensusThreshold) {
      outcome = 'plaintiff_wins';
      scoreAdjustment = { plaintiff: 5, defendant: -10 };
      reasoning = `Plaintiff wins with ${plaintiffPercentage.toFixed(1)}% consensus`;
    } else if (defendantPercentage >= this.config.consensusThreshold) {
      outcome = 'defendant_wins';
      scoreAdjustment = { plaintiff: -5, defendant: 5 };
      reasoning = `Defendant wins with ${defendantPercentage.toFixed(1)}% consensus`;
    } else {
      outcome = 'partial_resolution';
      scoreAdjustment = { plaintiff: -2, defendant: -2 };
      reasoning = `No clear consensus reached. Plaintiff: ${plaintiffPercentage.toFixed(1)}%, Defendant: ${defendantPercentage.toFixed(1)}%`;
    }

    const resolution: DisputeResolution = {
      outcome,
      scoreAdjustment,
      reasoning,
      enforcementActions: await this.determineEnforcementActions(dispute, outcome)
    };

    dispute.resolution = resolution;
    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolvedAt = Date.now();

    console.log(`Dispute ${disputeId} resolved: ${outcome}`);

    // Apply score adjustments (would integrate with credit scoring system)
    await this.applyScoreAdjustments(dispute.plaintiff, dispute.defendant, scoreAdjustment);
  }

  /**
   * Determines enforcement actions based on dispute outcome
   */
  private async determineEnforcementActions(
    dispute: Dispute,
    outcome: DisputeResolution['outcome']
  ): Promise<string[]> {
    const actions: string[] = [];

    switch (dispute.category) {
      case DisputeCategory.PAYMENT_DEFAULT:
        if (outcome === 'plaintiff_wins') {
          actions.push('Mark defendant as high-risk borrower');
          actions.push('Reduce defendant lending eligibility');
        }
        break;
      
      case DisputeCategory.FRAUDULENT_BEHAVIOR:
        if (outcome === 'plaintiff_wins') {
          actions.push('Flag defendant account for fraud');
          actions.push('Temporary suspension from P2P lending');
          actions.push('Enhanced monitoring of defendant activities');
        }
        break;
      
      case DisputeCategory.CONTRACT_VIOLATION:
        if (outcome === 'plaintiff_wins') {
          actions.push('Record contract violation in defendant history');
          actions.push('Reduce defendant reliability score');
        }
        break;
      
      case DisputeCategory.MISREPRESENTATION:
        if (outcome === 'plaintiff_wins') {
          actions.push('Add misrepresentation flag to defendant profile');
          actions.push('Require additional verification for defendant');
        }
        break;
    }

    return actions;
  }

  /**
   * Applies score adjustments to both parties
   */
  private async applyScoreAdjustments(
    plaintiff: string,
    defendant: string,
    adjustments: { plaintiff: number; defendant: number }
  ): Promise<void> {
    // In a real implementation, this would integrate with the credit scoring system
    console.log(`Applying score adjustments - Plaintiff (${plaintiff}): ${adjustments.plaintiff}, Defendant (${defendant}): ${adjustments.defendant}`);
    
    // This would call the credit scoring service to update reputation scores
    // await this.creditScoringService.adjustSocialCreditScore(plaintiff, adjustments.plaintiff);
    // await this.creditScoringService.adjustSocialCreditScore(defendant, adjustments.defendant);
  }

  /**
   * Collects transaction evidence for the dispute
   */
  private async collectTransactionEvidence(
    plaintiff: string,
    defendant: string,
    relatedTransaction: string
  ): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    // In a real implementation, this would query blockchain data
    // For now, we'll create mock evidence
    evidence.push({
      evidenceId: `tx_evidence_${Date.now()}`,
      submittedBy: 'system',
      type: 'transaction',
      data: `Transaction hash: ${relatedTransaction}, Parties: ${plaintiff} <-> ${defendant}`,
      timestamp: Date.now()
    });

    return evidence;
  }

  /**
   * Collects reputation evidence for both parties
   */
  private async collectReputationEvidence(
    plaintiff: string,
    defendant: string
  ): Promise<Evidence[]> {
    const evidence: Evidence[] = [];

    // Collect reputation data for both parties
    const plaintiffProfile = this.jurorPool.get(plaintiff);
    const defendantProfile = this.jurorPool.get(defendant);

    if (plaintiffProfile) {
      evidence.push({
        evidenceId: `rep_evidence_plaintiff_${Date.now()}`,
        submittedBy: 'system',
        type: 'document',
        data: `Plaintiff reputation: Score ${plaintiffProfile.reputationScore}, Transactions: ${plaintiffProfile.transactionCount}`,
        timestamp: Date.now()
      });
    }

    if (defendantProfile) {
      evidence.push({
        evidenceId: `rep_evidence_defendant_${Date.now()}`,
        submittedBy: 'system',
        type: 'document',
        data: `Defendant reputation: Score ${defendantProfile.reputationScore}, Transactions: ${defendantProfile.transactionCount}`,
        timestamp: Date.now()
      });
    }

    return evidence;
  }

  /**
   * Adds a juror to the pool
   */
  async addJurorToPool(
    address: string,
    reputationScore: number,
    transactionCount: number,
    totalVolume: string
  ): Promise<void> {
    if (!validateAddress(address)) {
      throw new Error('Invalid juror address');
    }

    const profile: JurorProfile = {
      address,
      reputationScore,
      transactionCount,
      totalVolume,
      disputesJudged: 0,
      averageVotingTime: 0,
      lastActive: Date.now()
    };

    this.jurorPool.set(address, profile);
    console.log(`Added juror to pool: ${address} with reputation ${reputationScore}`);
  }

  /**
   * Gets dispute details
   */
  getDispute(disputeId: string): Dispute | undefined {
    return this.disputes.get(disputeId);
  }

  /**
   * Gets all disputes for a user (as plaintiff or defendant)
   */
  getUserDisputes(userAddress: string): Dispute[] {
    if (!validateAddress(userAddress)) {
      throw new Error('Invalid user address');
    }

    return Array.from(this.disputes.values()).filter(
      dispute => dispute.plaintiff === userAddress || dispute.defendant === userAddress
    );
  }

  /**
   * Gets disputes where user is a juror
   */
  getJurorDisputes(jurorAddress: string): Dispute[] {
    if (!validateAddress(jurorAddress)) {
      throw new Error('Invalid juror address');
    }

    return Array.from(this.disputes.values()).filter(
      dispute => dispute.jurors.includes(jurorAddress)
    );
  }

  /**
   * Updates system configuration
   */
  updateConfig(newConfig: Partial<DisputeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Updated dispute resolution configuration:', this.config);
  }

  /**
   * Gets system configuration
   */
  getConfig(): DisputeConfig {
    return { ...this.config };
  }
}

interface JurorProfile {
  address: string;
  reputationScore: number;
  transactionCount: number;
  totalVolume: string;
  disputesJudged: number;
  averageVotingTime: number;
  lastActive: number;
}