// Real Event-Driven Score Processing Service
// Connects blockchain events to real-time credit score updates

import { EventEmitter } from 'events';
import { ScoringEngineService, ScoreUpdateRequest, ScoreUpdateResult } from './scoring-engine-service';
import { RealBlockchainDataManager } from '../blockchain-data/src/blockchain-data-manager';
import { MonitoredEvent, UserAction, ChainReorganization } from '../blockchain-data/src/real-event-monitor';
import { MonitoredTransaction, TransactionEvent } from '../blockchain-data/src/transaction-monitor';
import { CategorizedTransaction } from '../data-aggregator/transaction-categorizer';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface EventScoreUpdate {
  eventId: string;
  userAddress: string;
  eventType: string;
  protocol: string;
  transactionHash: string;
  blockNumber: number;
  confirmations: number;
  scoreImpact: {
    dimension: string;
    oldScore: number;
    newScore: number;
    confidence: number;
  }[];
  timestamp: number;
  isVerified: boolean;
  verificationData?: {
    transactionReceipt: any;
    eventLog: any;
    blockData: any;
  };
}

export interface MissedEventRecovery {
  fromBlock: number;
  toBlock: number;
  recoveredEvents: number;
  processedScoreUpdates: number;
  errors: string[];
  timestamp: number;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface ScoreUpdateTrigger {
  triggerId: string;
  userAddress: string;
  eventType: string;
  confirmationThreshold: number;
  isActive: boolean;
  lastTriggered?: number;
  totalTriggers: number;
}

export interface EventVerificationResult {
  eventId: string;
  isValid: boolean;
  verificationChecks: {
    transactionExists: boolean;
    receiptMatches: boolean;
    blockConfirmed: boolean;
    eventLogValid: boolean;
    userAddressVerified: boolean;
  };
  confidence: number;
  errors: string[];
}

/**
 * Real Event-Driven Score Processing Service
 * Implements Requirements 6.5, 6.6: Real blockchain event-triggered score updates
 */
export class RealEventScoreProcessor extends EventEmitter {
  private scoringEngine: ScoringEngineService;
  private blockchainManager: RealBlockchainDataManager;
  private isProcessing = false;
  
  // Event tracking
  private processedEvents = new Map<string, EventScoreUpdate>();
  private pendingScoreUpdates = new Map<string, EventScoreUpdate>();
  private scoreUpdateTriggers = new Map<string, ScoreUpdateTrigger>();
  private missedEventRecoveries: MissedEventRecovery[] = [];
  
  // Configuration
  private confirmationThreshold = 12; // Blocks required for score update
  private maxRecoveryBlocks = 1000; // Maximum blocks to scan for missed events
  private recoveryBatchSize = 100; // Blocks to process per batch
  private verificationEnabled = true;
  
  // Statistics
  private stats = {
    totalEventsProcessed: 0,
    totalScoreUpdates: 0,
    totalVerifications: 0,
    totalRecoveries: 0,
    averageProcessingTime: 0,
    lastProcessedBlock: 0,
    errors: 0
  };

  constructor(
    scoringEngine: ScoringEngineService,
    blockchainManager: RealBlockchainDataManager
  ) {
    super();
    this.scoringEngine = scoringEngine;
    this.blockchainManager = blockchainManager;
    
    this.setupEventListeners();
  }

  /**
   * Start real-time event processing for score updates
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.log('⚠️ Event score processing already active');
      return;
    }

    try {
      // Start blockchain event monitoring
      await this.blockchainManager.startEventMonitoring();
      await this.blockchainManager.startTransactionMonitoring();
      
      this.isProcessing = true;
      console.log('🚀 Real-time event score processing started');
      
      // Start missed event recovery
      await this.startMissedEventRecovery();
      
      this.emit('processingStarted');
    } catch (error) {
      console.error('❌ Failed to start event score processing:', formatError(error));
      throw error;
    }
  }

  /**
   * Stop event processing
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;
    
    await this.blockchainManager.stopEventMonitoring();
    await this.blockchainManager.stopTransactionMonitoring();
    
    console.log('🛑 Event score processing stopped');
    this.emit('processingStopped');
  }

  /**
   * Setup event listeners for blockchain events
   */
  private setupEventListeners(): void {
    // Listen for confirmed blockchain events
    this.blockchainManager.on('eventConfirmed', async (event: MonitoredEvent) => {
      await this.processConfirmedEvent(event);
    });

    // Listen for user actions
    this.blockchainManager.on('userActionDetected', async (action: UserAction) => {
      await this.processUserAction(action);
    });

    // Listen for transaction confirmations
    this.blockchainManager.on('transactionConfirmed', async (txEvent: TransactionEvent) => {
      await this.processConfirmedTransaction(txEvent);
    });

    // Handle chain reorganizations
    this.blockchainManager.on('chainReorganization', async (reorg: ChainReorganization) => {
      await this.handleChainReorganization(reorg);
    });
  }

  /**
   * Process confirmed blockchain event for score updates
   * Implements requirement 6.5: Real-time score update triggers based on actual blockchain confirmations
   */
  private async processConfirmedEvent(event: MonitoredEvent): Promise<void> {
    const startTime = getCurrentTimestamp();
    
    try {
      console.log(`🔍 Processing confirmed event: ${event.eventName} (${event.confirmations} confirmations)`);
      
      // Verify event if verification is enabled
      let verificationResult: EventVerificationResult | null = null;
      if (this.verificationEnabled) {
        verificationResult = await this.verifyEvent(event);
        if (!verificationResult.isValid) {
          console.warn(`⚠️ Event verification failed for ${event.eventId}:`, verificationResult.errors);
          this.stats.errors++;
          return;
        }
      }

      // Extract user address from event
      const userAddress = await this.extractUserAddressFromEvent(event);
      if (!userAddress) {
        console.warn(`⚠️ Could not extract user address from event ${event.eventId}`);
        return;
      }

      // Convert event to categorized transaction for scoring
      const categorizedTransaction = await this.convertEventToTransaction(event);
      
      // Create score update request
      const scoreUpdateRequest: ScoreUpdateRequest = {
        userAddress,
        transaction: categorizedTransaction,
        timestamp: event.timestamp,
        priority: this.determinePriority(event)
      };

      // Process score update
      const scoreResult = await this.scoringEngine.processTransactionUpdate(scoreUpdateRequest);
      
      // Create event score update record
      const eventScoreUpdate: EventScoreUpdate = {
        eventId: event.eventId,
        userAddress,
        eventType: event.eventName,
        protocol: event.protocolName || 'Unknown',
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        confirmations: event.confirmations,
        scoreImpact: scoreResult.updatedDimensions.map(dimension => ({
          dimension,
          oldScore: scoreResult.oldScores[dimension]?.score || 0,
          newScore: scoreResult.newScores[dimension]?.score || 0,
          confidence: scoreResult.newScores[dimension]?.confidence || 0
        })),
        timestamp: getCurrentTimestamp(),
        isVerified: verificationResult?.isValid || false,
        verificationData: verificationResult ? {
          transactionReceipt: verificationResult.verificationChecks,
          eventLog: event,
          blockData: { blockNumber: event.blockNumber, blockHash: event.blockHash }
        } : undefined
      };

      // Store processed event
      this.processedEvents.set(event.eventId, eventScoreUpdate);
      
      // Update statistics
      this.stats.totalEventsProcessed++;
      this.stats.totalScoreUpdates += scoreResult.updatedDimensions.length;
      this.stats.averageProcessingTime = (this.stats.averageProcessingTime + (getCurrentTimestamp() - startTime)) / 2;
      this.stats.lastProcessedBlock = Math.max(this.stats.lastProcessedBlock, event.blockNumber);

      console.log(`✅ Processed event ${event.eventId}: ${scoreResult.updatedDimensions.length} score updates for ${userAddress}`);
      
      // Emit score update event for frontend
      this.emit('scoreUpdated', {
        userAddress,
        eventScoreUpdate,
        scoreResult
      });

      // Check and trigger any configured score update triggers
      await this.checkScoreUpdateTriggers(userAddress, event);

    } catch (error) {
      console.error(`❌ Error processing confirmed event ${event.eventId}:`, formatError(error));
      this.stats.errors++;
    }
  }

  /**
   * Process user action for score updates
   */
  private async processUserAction(action: UserAction): Promise<void> {
    try {
      console.log(`👤 Processing user action: ${action.actionType} on ${action.protocol} for ${action.userAddress}`);
      
      // Process each event in the user action
      for (const event of action.events) {
        if (event.isConfirmed) {
          await this.processConfirmedEvent(event);
        } else {
          // Add to pending updates for when it gets confirmed
          const pendingUpdate: EventScoreUpdate = {
            eventId: event.eventId,
            userAddress: action.userAddress,
            eventType: action.actionType,
            protocol: action.protocol,
            transactionHash: action.transactionHash,
            blockNumber: action.blockNumber,
            confirmations: event.confirmations,
            scoreImpact: [], // Will be calculated when confirmed
            timestamp: action.timestamp,
            isVerified: false
          };
          
          this.pendingScoreUpdates.set(event.eventId, pendingUpdate);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing user action:`, formatError(error));
      this.stats.errors++;
    }
  }

  /**
   * Process confirmed transaction
   */
  private async processConfirmedTransaction(txEvent: TransactionEvent): Promise<void> {
    try {
      // Check if we have pending score updates for this transaction
      const pendingUpdates = Array.from(this.pendingScoreUpdates.values())
        .filter(update => update.transactionHash === txEvent.transaction.hash);

      for (const pendingUpdate of pendingUpdates) {
        // Update confirmation count
        pendingUpdate.confirmations = txEvent.confirmations;
        
        // If enough confirmations, process the score update
        if (txEvent.confirmations >= this.confirmationThreshold) {
          // Remove from pending and process
          this.pendingScoreUpdates.delete(pendingUpdate.eventId);
          
          // Find the corresponding event and process it
          const events = this.blockchainManager.getConfirmedEvents();
          const event = events.find(e => e.eventId === pendingUpdate.eventId);
          
          if (event) {
            await this.processConfirmedEvent(event);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing confirmed transaction:`, formatError(error));
      this.stats.errors++;
    }
  }

  /**
   * Handle chain reorganization by reprocessing affected events
   */
  private async handleChainReorganization(reorg: ChainReorganization): Promise<void> {
    try {
      console.log(`🔄 Handling chain reorganization at block ${reorg.blockNumber}`);
      
      // Find affected processed events
      const affectedEvents = Array.from(this.processedEvents.values())
        .filter(update => update.blockNumber === reorg.blockNumber);

      console.log(`⚠️ Found ${affectedEvents.length} affected score updates`);
      
      // Revert affected score updates
      for (const eventUpdate of affectedEvents) {
        await this.revertScoreUpdate(eventUpdate);
        this.processedEvents.delete(eventUpdate.eventId);
      }

      // Reprocess events from the reorganization
      for (const event of reorg.affectedEvents) {
        if (event.isConfirmed) {
          await this.processConfirmedEvent(event);
        }
      }

      this.emit('reorganizationHandled', {
        blockNumber: reorg.blockNumber,
        affectedEvents: affectedEvents.length,
        reprocessedEvents: reorg.affectedEvents.length
      });

    } catch (error) {
      console.error(`❌ Error handling chain reorganization:`, formatError(error));
      this.stats.errors++;
    }
  }

  /**
   * Verify blockchain event using actual transaction and receipt data
   * Implements requirement 6.6: Real event verification using actual transaction and receipt data
   */
  private async verifyEvent(event: MonitoredEvent): Promise<EventVerificationResult> {
    const verificationChecks = {
      transactionExists: false,
      receiptMatches: false,
      blockConfirmed: false,
      eventLogValid: false,
      userAddressVerified: false
    };
    const errors: string[] = [];

    try {
      // Check if transaction exists
      const transaction = await this.blockchainManager.getTransaction(event.transactionHash);
      verificationChecks.transactionExists = !!transaction;
      
      if (!transaction) {
        errors.push('Transaction not found');
      } else {
        // Check if receipt matches
        const receipt = await this.blockchainManager.getTransactionReceipt(event.transactionHash);
        verificationChecks.receiptMatches = receipt.blockNumber === event.blockNumber;
        
        if (!verificationChecks.receiptMatches) {
          errors.push(`Receipt block mismatch: expected ${event.blockNumber}, got ${receipt.blockNumber}`);
        }

        // Check if block is confirmed
        const currentBlock = await this.blockchainManager.getCurrentBlock();
        const confirmations = currentBlock - event.blockNumber;
        verificationChecks.blockConfirmed = confirmations >= this.confirmationThreshold;
        
        if (!verificationChecks.blockConfirmed) {
          errors.push(`Insufficient confirmations: ${confirmations} < ${this.confirmationThreshold}`);
        }

        // Verify event log exists in receipt
        const eventLogExists = receipt.logs.some(log => 
          log.transactionHash === event.transactionHash &&
          log.logIndex === event.logIndex &&
          log.address.toLowerCase() === event.contractAddress.toLowerCase()
        );
        verificationChecks.eventLogValid = eventLogExists;
        
        if (!eventLogExists) {
          errors.push('Event log not found in transaction receipt');
        }

        // Verify user address (from transaction sender or event data)
        const userAddress = await this.extractUserAddressFromEvent(event);
        verificationChecks.userAddressVerified = !!userAddress && userAddress.length === 42;
        
        if (!verificationChecks.userAddressVerified) {
          errors.push('Could not verify user address from event');
        }
      }

      // Calculate confidence based on verification checks
      const passedChecks = Object.values(verificationChecks).filter(Boolean).length;
      const totalChecks = Object.keys(verificationChecks).length;
      const confidence = (passedChecks / totalChecks) * 100;

      const isValid = errors.length === 0 && confidence >= 80;

      this.stats.totalVerifications++;

      return {
        eventId: event.eventId,
        isValid,
        verificationChecks,
        confidence,
        errors
      };

    } catch (error) {
      errors.push(`Verification error: ${formatError(error)}`);
      return {
        eventId: event.eventId,
        isValid: false,
        verificationChecks,
        confidence: 0,
        errors
      };
    }
  }

  /**
   * Start missed event recovery using block range scanning
   * Implements requirement 6.6: Real missed event recovery using block range scanning
   */
  private async startMissedEventRecovery(): Promise<void> {
    try {
      const currentBlock = await this.blockchainManager.getCurrentBlock();
      const fromBlock = Math.max(0, currentBlock - this.maxRecoveryBlocks);
      
      console.log(`🔄 Starting missed event recovery from block ${fromBlock} to ${currentBlock}`);
      
      const recovery: MissedEventRecovery = {
        fromBlock,
        toBlock: currentBlock,
        recoveredEvents: 0,
        processedScoreUpdates: 0,
        errors: [],
        timestamp: getCurrentTimestamp(),
        status: 'in_progress'
      };

      this.missedEventRecoveries.push(recovery);
      
      // Process in batches to avoid overwhelming the system
      for (let blockNum = fromBlock; blockNum <= currentBlock; blockNum += this.recoveryBatchSize) {
        const batchEnd = Math.min(blockNum + this.recoveryBatchSize - 1, currentBlock);
        
        try {
          await this.recoverEventsFromBlockRange(blockNum, batchEnd, recovery);
          
          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          const errorMsg = `Error recovering blocks ${blockNum}-${batchEnd}: ${formatError(error)}`;
          recovery.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      recovery.status = recovery.errors.length > 0 ? 'failed' : 'completed';
      this.stats.totalRecoveries++;
      
      console.log(`✅ Missed event recovery completed: ${recovery.recoveredEvents} events, ${recovery.processedScoreUpdates} score updates`);
      
      this.emit('missedEventRecoveryCompleted', recovery);

    } catch (error) {
      console.error('❌ Failed to start missed event recovery:', formatError(error));
    }
  }

  /**
   * Recover events from a specific block range
   */
  private async recoverEventsFromBlockRange(
    fromBlock: number, 
    toBlock: number, 
    recovery: MissedEventRecovery
  ): Promise<void> {
    // Get all events from the block range
    const events = this.blockchainManager.getConfirmedEvents()
      .filter(event => event.blockNumber >= fromBlock && event.blockNumber <= toBlock);

    for (const event of events) {
      // Check if we already processed this event
      if (!this.processedEvents.has(event.eventId)) {
        try {
          await this.processConfirmedEvent(event);
          recovery.recoveredEvents++;
          recovery.processedScoreUpdates++;
        } catch (error) {
          recovery.errors.push(`Failed to process event ${event.eventId}: ${formatError(error)}`);
        }
      }
    }
  }

  /**
   * Extract user address from blockchain event
   */
  private async extractUserAddressFromEvent(event: MonitoredEvent): Promise<string | null> {
    try {
      // Try to get user address from decoded event data
      if (event.decodedData) {
        if (event.decodedData.user) return event.decodedData.user;
        if (event.decodedData.from) return event.decodedData.from;
        if (event.decodedData.to) return event.decodedData.to;
        if (event.decodedData.account) return event.decodedData.account;
        if (event.decodedData.borrower) return event.decodedData.borrower;
        if (event.decodedData.supplier) return event.decodedData.supplier;
      }

      // Fallback: get from transaction sender
      const transaction = await this.blockchainManager.getTransaction(event.transactionHash);
      return transaction.from;

    } catch (error) {
      console.error(`❌ Error extracting user address from event ${event.eventId}:`, formatError(error));
      return null;
    }
  }

  /**
   * Convert blockchain event to categorized transaction for scoring
   */
  private async convertEventToTransaction(event: MonitoredEvent): Promise<CategorizedTransaction> {
    try {
      const transaction = await this.blockchainManager.getTransaction(event.transactionHash);
      
      // Determine credit dimensions impact based on event type
      const creditDimensions = this.calculateCreditDimensionsFromEvent(event);
      
      return {
        hash: event.transactionHash,
        blockNumber: event.blockNumber,
        from: transaction.from,
        to: transaction.to || '',
        value: transaction.value,
        input: transaction.input,
        timestamp: event.timestamp,
        creditDimensions,
        riskScore: this.calculateRiskScoreFromEvent(event),
        dataWeight: 1.0 // Full weight for verified blockchain events
      };

    } catch (error) {
      console.error(`❌ Error converting event to transaction:`, formatError(error));
      throw error;
    }
  }

  /**
   * Calculate credit dimensions impact from event
   */
  private calculateCreditDimensionsFromEvent(event: MonitoredEvent): any {
    const dimensions = {
      defiReliability: 0,
      tradingConsistency: 0,
      stakingCommitment: 0,
      governanceParticipation: 0,
      liquidityProvider: 0
    };

    const eventName = event.eventName.toLowerCase();
    const protocol = event.protocolName?.toLowerCase() || '';

    // DeFi reliability impact
    if (eventName.includes('supply') || eventName.includes('deposit')) {
      dimensions.defiReliability = 0.1;
    } else if (eventName.includes('withdraw') || eventName.includes('redeem')) {
      dimensions.defiReliability = 0.05;
    } else if (eventName.includes('liquidation')) {
      dimensions.defiReliability = -0.3;
    }

    // Trading consistency impact
    if (eventName.includes('swap') || eventName.includes('trade')) {
      dimensions.tradingConsistency = 0.05;
    }

    // Staking commitment impact
    if (eventName.includes('stake')) {
      dimensions.stakingCommitment = 0.2;
    } else if (eventName.includes('unstake')) {
      dimensions.stakingCommitment = -0.1;
    }

    // Governance participation impact
    if (eventName.includes('vote') || eventName.includes('proposal')) {
      dimensions.governanceParticipation = 0.15;
    }

    // Liquidity provider impact
    if (protocol.includes('uniswap') && (eventName.includes('mint') || eventName.includes('burn'))) {
      dimensions.liquidityProvider = 0.1;
    }

    return dimensions;
  }

  /**
   * Calculate risk score from event
   */
  private calculateRiskScoreFromEvent(event: MonitoredEvent): number {
    const eventName = event.eventName.toLowerCase();
    
    // High risk events
    if (eventName.includes('liquidation')) return 0.8;
    if (eventName.includes('emergency')) return 0.9;
    
    // Medium risk events
    if (eventName.includes('borrow')) return 0.4;
    if (eventName.includes('withdraw')) return 0.3;
    
    // Low risk events
    if (eventName.includes('supply') || eventName.includes('deposit')) return 0.1;
    if (eventName.includes('stake')) return 0.1;
    
    return 0.2; // Default medium-low risk
  }

  /**
   * Determine priority for score update
   */
  private determinePriority(event: MonitoredEvent): 'normal' | 'high' | 'immediate' {
    const eventName = event.eventName.toLowerCase();
    
    if (eventName.includes('liquidation') || eventName.includes('emergency')) {
      return 'immediate';
    }
    
    if (eventName.includes('borrow') || eventName.includes('withdraw')) {
      return 'high';
    }
    
    return 'normal';
  }

  /**
   * Check and trigger configured score update triggers
   */
  private async checkScoreUpdateTriggers(userAddress: string, event: MonitoredEvent): Promise<void> {
    const triggers = Array.from(this.scoreUpdateTriggers.values())
      .filter(trigger => 
        trigger.userAddress === userAddress && 
        trigger.isActive &&
        trigger.eventType === event.eventName
      );

    for (const trigger of triggers) {
      if (event.confirmations >= trigger.confirmationThreshold) {
        trigger.lastTriggered = getCurrentTimestamp();
        trigger.totalTriggers++;
        
        this.emit('scoreUpdateTriggered', {
          triggerId: trigger.triggerId,
          userAddress,
          event,
          trigger
        });
      }
    }
  }

  /**
   * Revert score update (for chain reorganizations)
   */
  private async revertScoreUpdate(eventUpdate: EventScoreUpdate): Promise<void> {
    try {
      console.log(`🔄 Reverting score update for event ${eventUpdate.eventId}`);
      
      // This would require implementing score reversion in the scoring engine
      // For now, we'll emit an event for manual handling
      this.emit('scoreUpdateReverted', eventUpdate);
      
    } catch (error) {
      console.error(`❌ Error reverting score update:`, formatError(error));
    }
  }

  /**
   * Add score update trigger
   */
  addScoreUpdateTrigger(trigger: Omit<ScoreUpdateTrigger, 'totalTriggers'>): void {
    const fullTrigger: ScoreUpdateTrigger = {
      ...trigger,
      totalTriggers: 0
    };
    
    this.scoreUpdateTriggers.set(trigger.triggerId, fullTrigger);
    console.log(`📋 Added score update trigger: ${trigger.triggerId} for ${trigger.userAddress}`);
  }

  /**
   * Remove score update trigger
   */
  removeScoreUpdateTrigger(triggerId: string): void {
    if (this.scoreUpdateTriggers.delete(triggerId)) {
      console.log(`🗑️ Removed score update trigger: ${triggerId}`);
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Get processed events
   */
  getProcessedEvents(): EventScoreUpdate[] {
    return Array.from(this.processedEvents.values());
  }

  /**
   * Get pending score updates
   */
  getPendingScoreUpdates(): EventScoreUpdate[] {
    return Array.from(this.pendingScoreUpdates.values());
  }

  /**
   * Get missed event recoveries
   */
  getMissedEventRecoveries(): MissedEventRecovery[] {
    return [...this.missedEventRecoveries];
  }

  /**
   * Get score update triggers
   */
  getScoreUpdateTriggers(): ScoreUpdateTrigger[] {
    return Array.from(this.scoreUpdateTriggers.values());
  }

  /**
   * Set confirmation threshold
   */
  setConfirmationThreshold(threshold: number): void {
    this.confirmationThreshold = Math.max(1, threshold);
    console.log(`⚙️ Confirmation threshold set to ${this.confirmationThreshold}`);
  }

  /**
   * Enable/disable event verification
   */
  setVerificationEnabled(enabled: boolean): void {
    this.verificationEnabled = enabled;
    console.log(`🔍 Event verification ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get events for a specific user
   */
  getUserEventScoreUpdates(userAddress: string): EventScoreUpdate[] {
    return Array.from(this.processedEvents.values())
      .filter(update => update.userAddress.toLowerCase() === userAddress.toLowerCase());
  }

  /**
   * Get recent score updates
   */
  getRecentScoreUpdates(limit: number = 50): EventScoreUpdate[] {
    return Array.from(this.processedEvents.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Cleanup old processed events
   */
  cleanup(maxAge: number = 86400000): void { // Default 24 hours
    const cutoffTime = getCurrentTimestamp() - maxAge;
    let cleanedCount = 0;

    for (const [eventId, update] of this.processedEvents) {
      if (update.timestamp < cutoffTime) {
        this.processedEvents.delete(eventId);
        cleanedCount++;
      }
    }

    // Clean up old recoveries
    this.missedEventRecoveries = this.missedEventRecoveries.filter(
      recovery => recovery.timestamp > cutoffTime
    );

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old processed events`);
    }
  }
}