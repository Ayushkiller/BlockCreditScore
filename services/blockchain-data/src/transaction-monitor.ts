import { EventEmitter } from 'events';
import { EthereumConnectionService } from './ethereum-connection';
import {
  RpcProvider,
  EthereumTransaction,
  TransactionReceipt,
  Block,
  SubscriptionCallback,
  TransactionSubscriptionData,
  BlockSubscriptionData
} from './types';

export interface TransactionFilter {
  addresses?: string[];
  minValue?: string;
  maxValue?: string;
  contractAddresses?: string[];
  methodSignatures?: string[];
}

export interface MonitoredTransaction {
  hash: string;
  blockNumber: number;
  confirmations: number;
  timestamp: number;
  from: string;
  to: string | null;
  value: string;
  gasUsed?: string;
  gasPrice: string;
  status: 'pending' | 'confirmed' | 'failed';
  isReorganized: boolean;
}

export interface TransactionEvent {
  type: 'new' | 'confirmed' | 'failed' | 'reorganized';
  transaction: MonitoredTransaction;
  confirmations: number;
}

export interface BackfillOptions {
  fromBlock: number;
  toBlock?: number;
  addresses?: string[];
  batchSize?: number;
  delayMs?: number;
}

/**
 * Real Transaction Monitoring System
 * Replaces simulated transaction detection with real WebSocket event subscriptions
 */
export class RealTransactionMonitor extends EventEmitter {
  private connectionService: EthereumConnectionService;
  private monitoredAddresses = new Set<string>();
  private pendingTransactions = new Map<string, MonitoredTransaction>();
  private confirmedTransactions = new Map<string, MonitoredTransaction>();
  private transactionFilters: TransactionFilter[] = [];
  
  private currentBlockNumber = 0;
  private confirmationThreshold = 12; // Number of confirmations required
  private maxPendingAge = 3600000; // 1 hour in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private isMonitoring = false;
  private reorganizationDepth = 20; // Monitor last 20 blocks for reorgs

  constructor(connectionService: EthereumConnectionService) {
    super();
    this.connectionService = connectionService;
    this.startCleanupTimer();
  }

  /**
   * Start real transaction monitoring with WebSocket subscriptions
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Transaction monitoring already active');
      return;
    }

    try {
      // Subscribe to new blocks for confirmation tracking and reorg detection
      await this.connectionService.subscribeToBlocks(async (blockData) => {
        await this.handleNewBlock(blockData);
      });

      // Set up address-specific monitoring
      for (const address of this.monitoredAddresses) {
        await this.connectionService.subscribeToAddress(address, (txData) => {
          this.handleNewTransaction(txData);
        });
      }

      this.isMonitoring = true;
      console.log('📡 Real transaction monitoring started');
      this.emit('monitoringStarted');

    } catch (error) {
      console.error('❌ Failed to start transaction monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop transaction monitoring
   */
  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('🛑 Transaction monitoring stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Add address to monitor for transactions
   */
  async addAddressToMonitor(address: string): Promise<void> {
    const normalizedAddress = address.toLowerCase();
    
    if (this.monitoredAddresses.has(normalizedAddress)) {
      console.log(`⚠️ Address ${address} already being monitored`);
      return;
    }

    this.monitoredAddresses.add(normalizedAddress);

    // If monitoring is active, set up subscription immediately
    if (this.isMonitoring) {
      await this.connectionService.subscribeToAddress(normalizedAddress, (txData) => {
        this.handleNewTransaction(txData);
      });
    }

    console.log(`👀 Now monitoring address: ${address}`);
    this.emit('addressAdded', address);
  }

  /**
   * Remove address from monitoring
   */
  removeAddressFromMonitor(address: string): void {
    const normalizedAddress = address.toLowerCase();
    
    if (this.monitoredAddresses.delete(normalizedAddress)) {
      console.log(`🚫 Stopped monitoring address: ${address}`);
      this.emit('addressRemoved', address);
    }
  }

  /**
   * Add transaction filter for selective monitoring
   */
  addTransactionFilter(filter: TransactionFilter): void {
    this.transactionFilters.push(filter);
    console.log('🔍 Added transaction filter:', filter);
  }

  /**
   * Clear all transaction filters
   */
  clearTransactionFilters(): void {
    this.transactionFilters = [];
    console.log('🧹 Cleared all transaction filters');
  }

  /**
   * Handle new block for confirmation tracking and reorganization detection
   */
  private async handleNewBlock(blockData: BlockSubscriptionData): Promise<void> {
    const previousBlockNumber = this.currentBlockNumber;
    this.currentBlockNumber = blockData.blockNumber;

    // Detect potential chain reorganization
    if (previousBlockNumber > 0 && blockData.blockNumber <= previousBlockNumber) {
      console.log(`⚠️ Potential chain reorganization detected: ${blockData.blockNumber} <= ${previousBlockNumber}`);
      await this.handlePotentialReorganization(blockData.blockNumber);
    }

    // Update confirmations for pending transactions
    await this.updateTransactionConfirmations();

    // Check for missed transactions in the new block
    await this.scanBlockForMissedTransactions(blockData.blockNumber);

    this.emit('blockProcessed', {
      blockNumber: blockData.blockNumber,
      pendingCount: this.pendingTransactions.size,
      confirmedCount: this.confirmedTransactions.size
    });
  }

  /**
   * Handle new transaction detection
   */
  private async handleNewTransaction(txData: TransactionSubscriptionData): Promise<void> {
    try {
      // Check if transaction matches our filters
      if (!this.matchesFilters(txData)) {
        return;
      }

      // Check if we're already tracking this transaction
      if (this.pendingTransactions.has(txData.hash) || this.confirmedTransactions.has(txData.hash)) {
        return;
      }

      // Get full transaction details
      const transaction = await this.connectionService.getTransaction(txData.hash);
      
      const monitoredTx: MonitoredTransaction = {
        hash: transaction.hash,
        blockNumber: transaction.blockNumber || 0,
        confirmations: 0,
        timestamp: Date.now(),
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        gasPrice: transaction.gasPrice,
        status: transaction.blockNumber ? 'confirmed' : 'pending',
        isReorganized: false
      };

      // Add to appropriate tracking map
      if (transaction.blockNumber) {
        // Transaction is already mined
        monitoredTx.confirmations = Math.max(0, this.currentBlockNumber - transaction.blockNumber);
        
        if (monitoredTx.confirmations >= this.confirmationThreshold) {
          this.confirmedTransactions.set(txData.hash, monitoredTx);
          this.emit('transactionConfirmed', {
            type: 'confirmed',
            transaction: monitoredTx,
            confirmations: monitoredTx.confirmations
          });
        } else {
          this.pendingTransactions.set(txData.hash, monitoredTx);
          this.emit('transactionDetected', {
            type: 'new',
            transaction: monitoredTx,
            confirmations: monitoredTx.confirmations
          });
        }
      } else {
        // Transaction is pending
        this.pendingTransactions.set(txData.hash, monitoredTx);
        this.emit('transactionDetected', {
          type: 'new',
          transaction: monitoredTx,
          confirmations: 0
        });
      }

      console.log(`🔍 New transaction detected: ${txData.hash} (${monitoredTx.status})`);

    } catch (error) {
      console.error(`❌ Error processing transaction ${txData.hash}:`, error);
    }
  }

  /**
   * Update confirmations for all pending transactions
   */
  private async updateTransactionConfirmations(): Promise<void> {
    const txsToConfirm: string[] = [];
    const txsToFail: string[] = [];

    for (const [hash, tx] of this.pendingTransactions) {
      if (tx.blockNumber > 0) {
        const confirmations = Math.max(0, this.currentBlockNumber - tx.blockNumber);
        tx.confirmations = confirmations;

        if (confirmations >= this.confirmationThreshold) {
          // Transaction is now confirmed
          tx.status = 'confirmed';
          this.confirmedTransactions.set(hash, tx);
          txsToConfirm.push(hash);

          this.emit('transactionConfirmed', {
            type: 'confirmed',
            transaction: tx,
            confirmations
          });
        }
      } else {
        // Check if pending transaction is too old
        const age = Date.now() - tx.timestamp;
        if (age > this.maxPendingAge) {
          tx.status = 'failed';
          txsToFail.push(hash);

          this.emit('transactionFailed', {
            type: 'failed',
            transaction: tx,
            confirmations: 0
          });
        }
      }
    }

    // Remove confirmed and failed transactions from pending
    txsToConfirm.forEach(hash => this.pendingTransactions.delete(hash));
    txsToFail.forEach(hash => this.pendingTransactions.delete(hash));
  }

  /**
   * Handle potential chain reorganization
   */
  private async handlePotentialReorganization(newBlockNumber: number): Promise<void> {
    console.log(`🔄 Handling potential reorganization at block ${newBlockNumber}`);

    // Check transactions in the reorganization depth
    const reorgStartBlock = Math.max(0, newBlockNumber - this.reorganizationDepth);
    
    for (const [hash, tx] of this.confirmedTransactions) {
      if (tx.blockNumber >= reorgStartBlock) {
        try {
          // Re-fetch transaction to check if it's still valid
          const currentTx = await this.connectionService.getTransaction(hash);
          
          if (currentTx.blockNumber !== tx.blockNumber) {
            // Transaction was reorganized
            tx.isReorganized = true;
            tx.blockNumber = currentTx.blockNumber || 0;
            tx.confirmations = currentTx.blockNumber ? 
              Math.max(0, this.currentBlockNumber - currentTx.blockNumber) : 0;

            console.log(`⚠️ Transaction reorganized: ${hash}`);
            this.emit('transactionReorganized', {
              type: 'reorganized',
              transaction: tx,
              confirmations: tx.confirmations
            });

            // Move back to pending if not enough confirmations
            if (tx.confirmations < this.confirmationThreshold) {
              tx.status = 'pending';
              this.pendingTransactions.set(hash, tx);
              this.confirmedTransactions.delete(hash);
            }
          }
        } catch (error) {
          // Transaction might have been dropped
          console.log(`⚠️ Transaction possibly dropped in reorg: ${hash}`);
          tx.isReorganized = true;
          tx.status = 'failed';
          
          this.emit('transactionFailed', {
            type: 'failed',
            transaction: tx,
            confirmations: 0
          });
        }
      }
    }
  }

  /**
   * Scan block for missed transactions
   */
  private async scanBlockForMissedTransactions(blockNumber: number): Promise<void> {
    try {
      const block = await this.connectionService.getBlockByNumber(blockNumber);
      
      for (const txHash of block.transactions) {
        if (typeof txHash === 'string' && 
            !this.pendingTransactions.has(txHash) && 
            !this.confirmedTransactions.has(txHash)) {
          
          // Check if this transaction involves monitored addresses
          try {
            const tx = await this.connectionService.getTransaction(txHash);
            
            const fromMonitored = this.monitoredAddresses.has(tx.from.toLowerCase());
            const toMonitored = tx.to && this.monitoredAddresses.has(tx.to.toLowerCase());
            
            if (fromMonitored || toMonitored) {
              // Process this missed transaction
              await this.handleNewTransaction({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                blockNumber: tx.blockNumber
              });
            }
          } catch (error) {
            // Skip transactions we can't fetch
            continue;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning block ${blockNumber} for missed transactions:`, error);
    }
  }

  /**
   * Backfill missed transactions using block range queries
   */
  async backfillTransactions(options: BackfillOptions): Promise<void> {
    const { fromBlock, toBlock, addresses, batchSize = 100, delayMs = 1000 } = options;
    const endBlock = toBlock || this.currentBlockNumber;

    console.log(`🔄 Starting transaction backfill from block ${fromBlock} to ${endBlock}`);

    for (let blockNum = fromBlock; blockNum <= endBlock; blockNum += batchSize) {
      const batchEnd = Math.min(blockNum + batchSize - 1, endBlock);
      
      try {
        await this.backfillBlockRange(blockNum, batchEnd, addresses);
        
        // Add delay to avoid overwhelming the RPC provider
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        console.log(`📊 Backfilled blocks ${blockNum} to ${batchEnd}`);
        
      } catch (error) {
        console.error(`❌ Error backfilling blocks ${blockNum}-${batchEnd}:`, error);
      }
    }

    console.log(`✅ Transaction backfill completed`);
    this.emit('backfillCompleted', { fromBlock, toBlock: endBlock });
  }

  /**
   * Backfill transactions for a specific block range
   */
  private async backfillBlockRange(fromBlock: number, toBlock: number, addresses?: string[]): Promise<void> {
    for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
      try {
        const block = await this.connectionService.getBlockByNumber(blockNum);
        
        for (const txHash of block.transactions) {
          if (typeof txHash === 'string') {
            try {
              const tx = await this.connectionService.getTransaction(txHash);
              
              // Check if transaction involves specified addresses or monitored addresses
              const targetAddresses = addresses || Array.from(this.monitoredAddresses);
              const fromMatch = targetAddresses.some(addr => 
                addr.toLowerCase() === tx.from.toLowerCase()
              );
              const toMatch = tx.to && targetAddresses.some(addr => 
                addr.toLowerCase() === tx.to.toLowerCase()
              );
              
              if (fromMatch || toMatch) {
                await this.handleNewTransaction({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: tx.value,
                  blockNumber: tx.blockNumber
                });
              }
            } catch (error) {
              // Skip individual transaction errors
              continue;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing block ${blockNum} in backfill:`, error);
      }
    }
  }

  /**
   * Check if transaction matches configured filters
   */
  private matchesFilters(txData: TransactionSubscriptionData): boolean {
    if (this.transactionFilters.length === 0) {
      return true; // No filters means accept all
    }

    return this.transactionFilters.some(filter => {
      // Check address filter
      if (filter.addresses && filter.addresses.length > 0) {
        const fromMatch = filter.addresses.some(addr => 
          addr.toLowerCase() === txData.from.toLowerCase()
        );
        const toMatch = txData.to && filter.addresses.some(addr => 
          addr.toLowerCase() === txData.to.toLowerCase()
        );
        
        if (!fromMatch && !toMatch) {
          return false;
        }
      }

      // Check value range filter
      if (filter.minValue || filter.maxValue) {
        const txValue = BigInt(txData.value);
        
        if (filter.minValue && txValue < BigInt(filter.minValue)) {
          return false;
        }
        
        if (filter.maxValue && txValue > BigInt(filter.maxValue)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Start cleanup timer for old transactions
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTransactions();
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Clean up old confirmed transactions to prevent memory leaks
   */
  private cleanupOldTransactions(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;

    for (const [hash, tx] of this.confirmedTransactions) {
      if (tx.timestamp < cutoffTime) {
        this.confirmedTransactions.delete(hash);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old confirmed transactions`);
    }
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    monitoredAddresses: number;
    pendingTransactions: number;
    confirmedTransactions: number;
    currentBlock: number;
    filters: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      monitoredAddresses: this.monitoredAddresses.size,
      pendingTransactions: this.pendingTransactions.size,
      confirmedTransactions: this.confirmedTransactions.size,
      currentBlock: this.currentBlockNumber,
      filters: this.transactionFilters.length
    };
  }

  /**
   * Get all monitored addresses
   */
  getMonitoredAddresses(): string[] {
    return Array.from(this.monitoredAddresses);
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): MonitoredTransaction[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Get confirmed transactions
   */
  getConfirmedTransactions(): MonitoredTransaction[] {
    return Array.from(this.confirmedTransactions.values());
  }

  /**
   * Set confirmation threshold
   */
  setConfirmationThreshold(threshold: number): void {
    this.confirmationThreshold = Math.max(1, threshold);
    console.log(`⚙️ Confirmation threshold set to ${this.confirmationThreshold}`);
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    await this.stopMonitoring();
    this.pendingTransactions.clear();
    this.confirmedTransactions.clear();
    this.monitoredAddresses.clear();
    this.transactionFilters = [];
    
    console.log('🔌 Transaction monitor shut down');
  }
}