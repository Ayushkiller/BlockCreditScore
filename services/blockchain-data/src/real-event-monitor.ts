import { EventEmitter } from 'events';
import { EthereumConnectionService } from './ethereum-connection';
import { RealContractManager } from './contract-manager';
import { 
  EventLog, 
  REAL_CONTRACT_ADDRESSES, 
  EVENT_SIGNATURES,
  RpcProvider,
  Block
} from './types';

export interface EventFilter {
  contractAddress: string;
  eventSignature: string;
  topics?: string[];
  fromBlock?: number;
  toBlock?: number | 'latest';
}

export interface MonitoredEvent {
  eventId: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  topics: string[];
  data: string;
  timestamp: number;
  confirmations: number;
  isConfirmed: boolean;
  decodedData?: any;
  protocolName?: string;
}

export interface ChainReorganization {
  oldBlockHash: string;
  newBlockHash: string;
  blockNumber: number;
  affectedEvents: MonitoredEvent[];
  timestamp: number;
}

export interface UserAction {
  userAddress: string;
  actionType: string;
  protocol: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  details: any;
  events: MonitoredEvent[];
}

export interface EventMonitoringStats {
  isMonitoring: boolean;
  activeFilters: number;
  eventsDetected: number;
  eventsConfirmed: number;
  chainReorganizations: number;
  userActionsDetected: number;
  currentBlock: number;
  lastEventTimestamp: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  providerName: string;
  eventsPerSecond: number;
  averageConfirmationTime: number;
}

/**
 * Real-time blockchain event monitoring service
 * Implements comprehensive event detection, confirmation tracking, and chain reorganization handling
 */
export class RealEventMonitor extends EventEmitter {
  private connectionService: EthereumConnectionService;
  private contractManager: RealContractManager;
  private isMonitoring = false;
  
  // Event tracking
  private eventFilters: Map<string, EventFilter> = new Map();
  private pendingEvents: Map<string, MonitoredEvent> = new Map();
  private confirmedEvents: Map<string, MonitoredEvent> = new Map();
  private chainReorganizations: ChainReorganization[] = [];
  private userActions: UserAction[] = [];
  
  // Block tracking for reorganization detection
  private blockHistory: Map<number, string> = new Map(); // blockNumber -> blockHash
  private confirmationThreshold = 12; // Number of confirmations required
  
  // Statistics
  private stats: EventMonitoringStats = {
    isMonitoring: false,
    activeFilters: 0,
    eventsDetected: 0,
    eventsConfirmed: 0,
    chainReorganizations: 0,
    userActionsDetected: 0,
    currentBlock: 0,
    lastEventTimestamp: 0,
    connectionStatus: 'disconnected',
    providerName: '',
    eventsPerSecond: 0,
    averageConfirmationTime: 0
  };

  // Performance tracking
  private eventTimestamps: number[] = [];
  private confirmationTimes: number[] = [];

  constructor(connectionService: EthereumConnectionService, contractManager: RealContractManager) {
    super();
    this.connectionService = connectionService;
    this.contractManager = contractManager;
    
    this.setupDefaultFilters();
  }

  /**
   * Start real-time blockchain event monitoring
   * Implements requirement 6.1: Subscribe to real WebSocket event streams from Ethereum nodes
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Event monitoring already active');
      return;
    }

    try {
      this.stats.connectionStatus = 'connecting';
      this.emit('statusUpdate', this.stats);

      // Subscribe to new blocks for confirmation tracking and reorganization detection
      await this.connectionService.subscribeToBlocks(async (blockData) => {
        await this.handleNewBlock(blockData.blockNumber, blockData.blockHash, blockData.timestamp);
      });

      // Set up event log monitoring
      await this.setupEventLogMonitoring();
      
      this.isMonitoring = true;
      this.stats.isMonitoring = true;
      this.stats.activeFilters = this.eventFilters.size;
      this.stats.connectionStatus = 'connected';
      this.stats.providerName = this.connectionService.getCurrentProvider()?.name || 'Unknown';
      
      console.log('🔍 Real-time event monitoring started');
      console.log(`   Active filters: ${this.eventFilters.size}`);
      console.log(`   Confirmation threshold: ${this.confirmationThreshold} blocks`);
      console.log(`   Provider: ${this.stats.providerName}`);
      
      this.emit('monitoringStarted', {
        activeFilters: this.eventFilters.size,
        confirmationThreshold: this.confirmationThreshold,
        provider: this.stats.providerName
      });

      this.emit('statusUpdate', this.stats);

      // Start performance tracking
      this.startPerformanceTracking();
    } catch (error) {
      console.error('❌ Failed to start event monitoring:', error);
      this.stats.connectionStatus = 'error';
      this.emit('statusUpdate', this.stats);
      throw error;
    }
  }

  /**
   * Stop event monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.stats.isMonitoring = false;
    this.stats.connectionStatus = 'disconnected';
    
    console.log('🛑 Event monitoring stopped');
    this.emit('monitoringStopped');
    this.emit('statusUpdate', this.stats);
  }

  /**
   * Add event filter for specific contract events
   * Implements requirement 6.2: Use actual contract addresses and event signatures for precise event detection
   */
  addEventFilter(filter: EventFilter): void {
    const filterId = this.generateFilterId(filter);
    this.eventFilters.set(filterId, filter);
    this.stats.activeFilters = this.eventFilters.size;
    
    console.log(`📋 Added event filter: ${filter.contractAddress} - ${filter.eventSignature}`);
    this.emit('filterAdded', { filterId, filter });
  }

  /**
   * Remove event filter
   */
  removeEventFilter(filterId: string): void {
    if (this.eventFilters.delete(filterId)) {
      this.stats.activeFilters = this.eventFilters.size;
      console.log(`🗑️ Removed event filter: ${filterId}`);
      this.emit('filterRemoved', { filterId });
    }
  }

  /**
   * Handle new block and check for confirmations and reorganizations
   * Implements requirement 6.3: Handle real block confirmations and potential chain reorganizations
   */
  private async handleNewBlock(blockNumber: number, blockHash: string, timestamp: number): Promise<void> {
    this.stats.currentBlock = blockNumber;
    
    // Check for chain reorganization
    const previousHash = this.blockHistory.get(blockNumber);
    if (previousHash && previousHash !== blockHash) {
      await this.handleChainReorganization(blockNumber, previousHash, blockHash, timestamp);
    }
    
    // Store block hash for reorganization detection
    this.blockHistory.set(blockNumber, blockHash);
    
    // Clean up old block history (keep last 100 blocks)
    if (this.blockHistory.size > 100) {
      const oldestBlock = Math.min(...this.blockHistory.keys());
      this.blockHistory.delete(oldestBlock);
    }
    
    // Check for event confirmations
    await this.checkEventConfirmations(blockNumber);
    
    // Fetch and process events from this block
    await this.processBlockEvents(blockNumber);
  }

  /**
   * Handle chain reorganization
   */
  private async handleChainReorganization(
    blockNumber: number, 
    oldBlockHash: string, 
    newBlockHash: string, 
    timestamp: number
  ): Promise<void> {
    console.log(`🔄 Chain reorganization detected at block ${blockNumber}`);
    console.log(`   Old hash: ${oldBlockHash}`);
    console.log(`   New hash: ${newBlockHash}`);
    
    // Find affected events
    const affectedEvents: MonitoredEvent[] = [];
    
    // Check pending events
    for (const [eventId, event] of this.pendingEvents) {
      if (event.blockNumber === blockNumber && event.blockHash === oldBlockHash) {
        affectedEvents.push(event);
        this.pendingEvents.delete(eventId);
      }
    }
    
    // Check confirmed events (they may need to be moved back to pending)
    for (const [eventId, event] of this.confirmedEvents) {
      if (event.blockNumber === blockNumber && event.blockHash === oldBlockHash) {
        affectedEvents.push(event);
        this.confirmedEvents.delete(eventId);
        // Move back to pending with updated block hash
        event.blockHash = newBlockHash;
        event.isConfirmed = false;
        event.confirmations = 0;
        this.pendingEvents.set(eventId, event);
      }
    }
    
    const reorganization: ChainReorganization = {
      oldBlockHash,
      newBlockHash,
      blockNumber,
      affectedEvents,
      timestamp
    };
    
    this.chainReorganizations.push(reorganization);
    this.stats.chainReorganizations++;
    
    console.log(`   Affected events: ${affectedEvents.length}`);
    this.emit('chainReorganization', reorganization);
  }

  /**
   * Check event confirmations
   */
  private async checkEventConfirmations(currentBlock: number): Promise<void> {
    const eventsToConfirm: MonitoredEvent[] = [];
    
    for (const [eventId, event] of this.pendingEvents) {
      const confirmations = currentBlock - event.blockNumber;
      event.confirmations = confirmations;
      
      if (confirmations >= this.confirmationThreshold) {
        event.isConfirmed = true;
        this.confirmedEvents.set(eventId, event);
        eventsToConfirm.push(event);
        this.pendingEvents.delete(eventId);
      }
    }
    
    // Emit confirmation events
    for (const event of eventsToConfirm) {
      this.stats.eventsConfirmed++;
      
      // Track confirmation time for performance metrics
      const confirmationTime = (Date.now() - (event.timestamp * 1000)) / 1000; // seconds
      this.confirmationTimes.push(confirmationTime);
      
      console.log(`✅ Event confirmed: ${event.eventName} (${event.confirmations} confirmations)`);
      this.emit('eventConfirmed', event);
    }
  }

  /**
   * Process events from a specific block
   */
  private async processBlockEvents(blockNumber: number): Promise<void> {
    try {
      // Get all logs for this block that match our filters
      for (const [filterId, filter] of this.eventFilters) {
        const logs = await this.connectionService.getLogs({
          address: filter.contractAddress,
          topics: filter.topics ? [filter.eventSignature, ...filter.topics] : [filter.eventSignature],
          fromBlock: blockNumber,
          toBlock: blockNumber
        });
        
        for (const log of logs) {
          await this.processEventLog(log, filter);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber} events:`, error);
    }
  }

  /**
   * Process individual event log
   * Implements requirement 6.4: Parse actual transaction receipts and event logs for relevant DeFi activities
   */
  private async processEventLog(log: EventLog, filter: EventFilter): Promise<void> {
    try {
      const eventId = `${log.transactionHash}-${log.logIndex}`;
      
      // Skip if we already processed this event
      if (this.pendingEvents.has(eventId) || this.confirmedEvents.has(eventId)) {
        return;
      }
      
      // Get block timestamp
      const block = await this.connectionService.getBlockByNumber(log.blockNumber);
      
      // Create monitored event
      const monitoredEvent: MonitoredEvent = {
        eventId,
        contractAddress: log.address,
        eventName: this.getEventNameFromSignature(filter.eventSignature),
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
        topics: log.topics,
        data: log.data,
        timestamp: block.timestamp,
        confirmations: this.stats.currentBlock - log.blockNumber,
        isConfirmed: false,
        protocolName: this.getProtocolName(log.address)
      };
      
      // Decode event data if possible
      try {
        monitoredEvent.decodedData = await this.contractManager.decodeEventLog(log);
      } catch (error) {
        console.warn(`Failed to decode event log for ${eventId}:`, error);
      }
      
      // Add to pending events
      this.pendingEvents.set(eventId, monitoredEvent);
      this.stats.eventsDetected++;
      this.stats.lastEventTimestamp = monitoredEvent.timestamp;
      
      // Track event timestamp for performance metrics
      this.eventTimestamps.push(Date.now());
      
      console.log(`🔍 Event detected: ${monitoredEvent.eventName} at ${monitoredEvent.contractAddress}`);
      this.emit('eventDetected', monitoredEvent);
      
      // Check if this represents a user action
      await this.analyzeUserAction(monitoredEvent);
      
    } catch (error) {
      console.error('❌ Error processing event log:', error);
    }
  }

  /**
   * Analyze if an event represents a user action
   */
  private async analyzeUserAction(event: MonitoredEvent): Promise<void> {
    try {
      // Get transaction receipt to analyze the full transaction context
      const receipt = await this.connectionService.getTransactionReceipt(event.transactionHash);
      
      // Determine user address (usually the transaction sender)
      const userAddress = receipt.from;
      
      // Analyze the action type based on event and protocol
      const actionType = this.determineActionType(event);
      
      if (actionType) {
        const userAction: UserAction = {
          userAddress,
          actionType,
          protocol: event.protocolName || 'Unknown',
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: event.timestamp,
          details: event.decodedData || {},
          events: [event]
        };
        
        // Check if we can group this with other events from the same transaction
        const existingAction = this.userActions.find(
          action => action.transactionHash === event.transactionHash
        );
        
        if (existingAction) {
          existingAction.events.push(event);
        } else {
          this.userActions.push(userAction);
          this.stats.userActionsDetected++;
          
          console.log(`👤 User action detected: ${userAddress} - ${actionType} on ${userAction.protocol}`);
          this.emit('userActionDetected', userAction);
        }
      }
    } catch (error) {
      console.error('❌ Error analyzing user action:', error);
    }
  }

  /**
   * Determine action type from event
   */
  private determineActionType(event: MonitoredEvent): string | null {
    const eventName = event.eventName.toLowerCase();
    
    // DeFi action mapping
    if (eventName.includes('deposit') || eventName.includes('supply')) {
      return 'deposit';
    } else if (eventName.includes('withdraw') || eventName.includes('redeem')) {
      return 'withdraw';
    } else if (eventName.includes('borrow')) {
      return 'borrow';
    } else if (eventName.includes('repay')) {
      return 'repay';
    } else if (eventName.includes('swap') || eventName.includes('trade')) {
      return 'swap';
    } else if (eventName.includes('liquidation')) {
      return 'liquidation';
    } else if (eventName.includes('stake')) {
      return 'stake';
    } else if (eventName.includes('unstake')) {
      return 'unstake';
    }
    
    return null;
  }

  /**
   * Setup default event filters for major DeFi protocols
   */
  private setupDefaultFilters(): void {
    // Aave V3 events
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      eventSignature: EVENT_SIGNATURES.AAVE.SUPPLY
    });
    
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      eventSignature: EVENT_SIGNATURES.AAVE.WITHDRAW
    });
    
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      eventSignature: EVENT_SIGNATURES.AAVE.BORROW
    });
    
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      eventSignature: EVENT_SIGNATURES.AAVE.REPAY
    });
    
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      eventSignature: EVENT_SIGNATURES.AAVE.LIQUIDATION_CALL
    });
    
    // Uniswap V3 events
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.UNISWAP_V3.ROUTER,
      eventSignature: EVENT_SIGNATURES.UNISWAP.SWAP
    });
    
    // Compound events
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.COMPOUND.COMPTROLLER,
      eventSignature: EVENT_SIGNATURES.COMPOUND.MARKET_ENTERED
    });
    
    this.addEventFilter({
      contractAddress: REAL_CONTRACT_ADDRESSES.COMPOUND.COMPTROLLER,
      eventSignature: EVENT_SIGNATURES.COMPOUND.MARKET_EXITED
    });
  }

  /**
   * Setup event log monitoring using WebSocket subscriptions
   */
  private async setupEventLogMonitoring(): Promise<void> {
    // Note: Most providers don't support direct event log subscriptions
    // We'll use block-based monitoring which is more reliable
    console.log('📡 Event log monitoring set up via block processing');
  }

  /**
   * Generate unique filter ID
   */
  private generateFilterId(filter: EventFilter): string {
    return `${filter.contractAddress}-${filter.eventSignature}-${Date.now()}`;
  }

  /**
   * Get event name from signature
   */
  private getEventNameFromSignature(signature: string): string {
    // Extract event name from signature (e.g., "Transfer(address,address,uint256)" -> "Transfer")
    const match = signature.match(/^([^(]+)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Get protocol name from contract address
   */
  private getProtocolName(contractAddress: string): string {
    const address = contractAddress.toLowerCase();
    
    if (address === REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL.toLowerCase()) {
      return 'Aave V3';
    } else if (address === REAL_CONTRACT_ADDRESSES.UNISWAP_V3.ROUTER.toLowerCase()) {
      return 'Uniswap V3';
    } else if (address === REAL_CONTRACT_ADDRESSES.COMPOUND.COMPTROLLER.toLowerCase()) {
      return 'Compound';
    }
    
    return 'Unknown';
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): EventMonitoringStats {
    return { ...this.stats };
  }

  /**
   * Get pending events
   */
  getPendingEvents(): MonitoredEvent[] {
    return Array.from(this.pendingEvents.values());
  }

  /**
   * Get confirmed events
   */
  getConfirmedEvents(): MonitoredEvent[] {
    return Array.from(this.confirmedEvents.values());
  }

  /**
   * Get chain reorganizations
   */
  getChainReorganizations(): ChainReorganization[] {
    return [...this.chainReorganizations];
  }

  /**
   * Get user actions
   */
  getUserActions(): UserAction[] {
    return [...this.userActions];
  }

  /**
   * Get events for a specific user
   */
  getUserEvents(userAddress: string): MonitoredEvent[] {
    const userEvents: MonitoredEvent[] = [];
    
    // Check both pending and confirmed events
    const allEvents = [
      ...this.pendingEvents.values(),
      ...this.confirmedEvents.values()
    ];
    
    for (const event of allEvents) {
      // Check if user is involved in the event (would need transaction analysis)
      // For now, we'll use a simple approach
      if (event.decodedData && 
          (event.decodedData.user === userAddress || 
           event.decodedData.from === userAddress ||
           event.decodedData.to === userAddress)) {
        userEvents.push(event);
      }
    }
    
    return userEvents;
  }

  /**
   * Set confirmation threshold
   */
  setConfirmationThreshold(threshold: number): void {
    if (threshold < 1 || threshold > 100) {
      throw new Error('Confirmation threshold must be between 1 and 100');
    }
    
    this.confirmationThreshold = threshold;
    console.log(`🔧 Confirmation threshold set to ${threshold} blocks`);
  }

  /**
   * Start performance tracking
   */
  private startPerformanceTracking(): void {
    // Track events per second
    setInterval(() => {
      const now = Date.now();
      const oneSecondAgo = now - 1000;
      
      // Count events in the last second
      const recentEvents = this.eventTimestamps.filter(timestamp => timestamp > oneSecondAgo);
      this.stats.eventsPerSecond = recentEvents.length;
      
      // Clean up old timestamps (keep last 60 seconds)
      const sixtySecondsAgo = now - 60000;
      this.eventTimestamps = this.eventTimestamps.filter(timestamp => timestamp > sixtySecondsAgo);
      
      // Calculate average confirmation time
      if (this.confirmationTimes.length > 0) {
        const sum = this.confirmationTimes.reduce((a, b) => a + b, 0);
        this.stats.averageConfirmationTime = sum / this.confirmationTimes.length;
        
        // Keep only recent confirmation times (last 100)
        if (this.confirmationTimes.length > 100) {
          this.confirmationTimes = this.confirmationTimes.slice(-100);
        }
      }
      
      this.emit('performanceUpdate', {
        eventsPerSecond: this.stats.eventsPerSecond,
        averageConfirmationTime: this.stats.averageConfirmationTime
      });
    }, 1000);
  }

  /**
   * Get events for a specific protocol
   */
  getProtocolEvents(protocol: string): MonitoredEvent[] {
    const allEvents = [
      ...this.pendingEvents.values(),
      ...this.confirmedEvents.values()
    ];
    
    return allEvents.filter(event => 
      event.protocolName?.toLowerCase() === protocol.toLowerCase()
    );
  }

  /**
   * Get recent events (last N events)
   */
  getRecentEvents(limit: number = 50): MonitoredEvent[] {
    const allEvents = [
      ...this.pendingEvents.values(),
      ...this.confirmedEvents.values()
    ];
    
    return allEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get event statistics by protocol
   */
  getProtocolStats(): { [protocol: string]: { count: number; volume: string } } {
    const stats: { [protocol: string]: { count: number; volume: string } } = {};
    
    const allEvents = [
      ...this.pendingEvents.values(),
      ...this.confirmedEvents.values()
    ];
    
    for (const event of allEvents) {
      const protocol = event.protocolName || 'Unknown';
      if (!stats[protocol]) {
        stats[protocol] = { count: 0, volume: '0' };
      }
      stats[protocol].count++;
      
      // Add volume if available in decoded data
      if (event.decodedData?.amount) {
        const currentVolume = BigInt(stats[protocol].volume);
        const eventVolume = BigInt(event.decodedData.amount);
        stats[protocol].volume = (currentVolume + eventVolume).toString();
      }
    }
    
    return stats;
  }

  /**
   * Get block confirmation status
   */
  getBlockConfirmationStatus(): { 
    currentBlock: number; 
    pendingConfirmations: number; 
    averageBlockTime: number 
  } {
    const pendingCount = this.pendingEvents.size;
    
    // Estimate average block time (approximately 12 seconds for Ethereum)
    const averageBlockTime = 12;
    
    return {
      currentBlock: this.stats.currentBlock,
      pendingConfirmations: pendingCount,
      averageBlockTime
    };
  }

  /**
   * Subscribe to specific event types
   */
  subscribeToEventType(eventType: string, callback: (event: MonitoredEvent) => void): () => void {
    const handler = (event: MonitoredEvent) => {
      if (event.eventName.toLowerCase().includes(eventType.toLowerCase())) {
        callback(event);
      }
    };
    
    this.on('eventDetected', handler);
    this.on('eventConfirmed', handler);
    
    return () => {
      this.off('eventDetected', handler);
      this.off('eventConfirmed', handler);
    };
  }

  /**
   * Subscribe to user-specific events
   */
  subscribeToUserEvents(userAddress: string, callback: (event: MonitoredEvent) => void): () => void {
    const handler = (event: MonitoredEvent) => {
      if (event.decodedData && 
          (event.decodedData.user === userAddress || 
           event.decodedData.from === userAddress ||
           event.decodedData.to === userAddress)) {
        callback(event);
      }
    };
    
    this.on('eventDetected', handler);
    this.on('eventConfirmed', handler);
    
    return () => {
      this.off('eventDetected', handler);
      this.off('eventConfirmed', handler);
    };
  }

  /**
   * Clear old events and reorganizations (cleanup)
   */
  cleanup(maxAge: number = 86400000): void { // Default 24 hours
    const cutoffTime = Date.now() - maxAge;
    
    // Clean up old confirmed events
    for (const [eventId, event] of this.confirmedEvents) {
      if (event.timestamp * 1000 < cutoffTime) {
        this.confirmedEvents.delete(eventId);
      }
    }
    
    // Clean up old reorganizations
    this.chainReorganizations = this.chainReorganizations.filter(
      reorg => reorg.timestamp > cutoffTime
    );
    
    // Clean up old user actions
    this.userActions = this.userActions.filter(
      action => action.timestamp * 1000 > cutoffTime
    );
    
    console.log('🧹 Event monitor cleanup completed');
  }
}