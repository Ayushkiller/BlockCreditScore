import { SocialCreditService } from './social-credit-service';
import { FeedbackCategory } from '../../types/social';
import { validateAddress } from '../../utils/validation';

export interface P2PLendingEvent {
  type: 'lending_initiated' | 'loan_repaid' | 'loan_defaulted';
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  lender: string;
  borrower: string;
  amount: string;
  lendingId: string;
  additionalData?: any;
}

export class SocialCreditBlockchainMonitor {
  private socialCreditService: SocialCreditService;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(socialCreditService: SocialCreditService) {
    this.socialCreditService = socialCreditService;
  }

  /**
   * Starts monitoring blockchain for P2P lending events
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Social credit blockchain monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting social credit blockchain monitoring...');

    // In a real implementation, this would connect to Ethereum nodes
    // For now, we'll simulate with periodic checks
    this.monitoringInterval = setInterval(async () => {
      await this.checkForNewEvents();
    }, 30000); // Check every 30 seconds

    console.log('Social credit blockchain monitoring started');
  }

  /**
   * Stops monitoring blockchain events
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Social credit blockchain monitoring stopped');
  }

  /**
   * Processes a detected P2P lending event
   */
  async processLendingEvent(event: P2PLendingEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'lending_initiated':
          await this.handleLendingInitiated(event);
          break;
        case 'loan_repaid':
          await this.handleLoanRepaid(event);
          break;
        case 'loan_defaulted':
          await this.handleLoanDefaulted(event);
          break;
        default:
          console.warn(`Unknown P2P lending event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing P2P lending event ${event.transactionHash}:`, error);
    }
  }

  /**
   * Handles lending initiation events
   */
  private async handleLendingInitiated(event: P2PLendingEvent): Promise<void> {
    const { lender, borrower, amount, lendingId, additionalData } = event;

    if (!validateAddress(lender) || !validateAddress(borrower)) {
      throw new Error('Invalid lender or borrower address in event');
    }

    const duration = additionalData?.duration || 30 * 24 * 60 * 60; // Default 30 days
    const interestRate = additionalData?.interestRate || 0.05; // Default 5%
    const collateralRatio = additionalData?.collateralRatio;

    await this.socialCreditService.processLendingTransaction(
      lendingId,
      lender,
      borrower,
      amount,
      duration,
      interestRate,
      collateralRatio
    );

    console.log(`Processed lending initiation: ${lendingId} from ${lender} to ${borrower}`);
  }

  /**
   * Handles loan repayment events
   */
  private async handleLoanRepaid(event: P2PLendingEvent): Promise<void> {
    const { lendingId, timestamp, additionalData } = event;

    const amountRepaid = additionalData?.amountRepaid || event.amount;
    const expectedAmount = additionalData?.expectedAmount || event.amount;

    await this.socialCreditService.processLoanRepayment(
      lendingId,
      timestamp,
      amountRepaid,
      expectedAmount
    );

    console.log(`Processed loan repayment: ${lendingId}`);
  }

  /**
   * Handles loan default events
   */
  private async handleLoanDefaulted(event: P2PLendingEvent): Promise<void> {
    const { lendingId, timestamp } = event;

    // For defaults, we set repaid amount to 0
    await this.socialCreditService.processLoanRepayment(
      lendingId,
      timestamp,
      '0',
      event.amount
    );

    console.log(`Processed loan default: ${lendingId}`);
  }

  /**
   * Simulates checking for new blockchain events
   * In a real implementation, this would query Ethereum nodes
   */
  private async checkForNewEvents(): Promise<void> {
    try {
      // Simulate event detection
      // In reality, this would:
      // 1. Query Ethereum nodes for new blocks
      // 2. Filter for P2P lending contract events
      // 3. Parse event data and create P2PLendingEvent objects
      // 4. Process each event

      console.log('Checking for new P2P lending events...');
      
      // For demonstration, we could process mock events here
      // await this.processMockEvents();
      
    } catch (error) {
      console.error('Error checking for new P2P lending events:', error);
    }
  }

  /**
   * Processes mock events for testing purposes
   */
  private async processMockEvents(): Promise<void> {
    // This method can be used for testing the event processing pipeline
    const mockEvent: P2PLendingEvent = {
      type: 'lending_initiated',
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
      lender: '0x' + Math.random().toString(16).substr(2, 40),
      borrower: '0x' + Math.random().toString(16).substr(2, 40),
      amount: (Math.random() * 1000).toString(),
      lendingId: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      additionalData: {
        duration: 30 * 24 * 60 * 60, // 30 days
        interestRate: 0.05,
        collateralRatio: 1.5
      }
    };

    await this.processLendingEvent(mockEvent);
  }

  /**
   * Manually submits community feedback (called from external systems)
   */
  async submitFeedback(
    fromUser: string,
    toUser: string,
    transactionHash: string,
    rating: number,
    category: FeedbackCategory,
    comment?: string
  ): Promise<string> {
    return await this.socialCreditService.submitCommunityFeedback(
      fromUser,
      toUser,
      transactionHash,
      rating,
      category,
      comment
    );
  }

  /**
   * Gets social credit assessment for a user
   */
  async getUserSocialCredit(userAddress: string) {
    return await this.socialCreditService.getSocialCreditAssessment(userAddress);
  }

  /**
   * Gets monitoring status
   */
  getMonitoringStatus(): { isMonitoring: boolean; uptime: number } {
    return {
      isMonitoring: this.isMonitoring,
      uptime: this.isMonitoring ? Date.now() : 0
    };
  }
}