import { ethers } from 'ethers';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import type {
  RpcProvider,
  EthereumTransaction,
  TransactionReceipt,
  Block,
  HealthCheckResult,
  ConnectionStatus,
  SubscriptionCallback,
  BlockSubscriptionData,
  TransactionSubscriptionData
} from './types';

export class EthereumConnectionService extends EventEmitter {
  private providers: RpcProvider[] = [];
  private currentProvider: RpcProvider | null = null;
  private httpProvider: ethers.JsonRpcProvider | null = null;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private wsConnection: WebSocket | null = null;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    currentProvider: null,
    lastBlockNumber: 0,
    connectionTime: 0,
    reconnectAttempts: 0
  };
  
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // Start with 5 seconds
  private maxReconnectDelay = 300000; // Max 5 minutes
  
  private blockSubscriptions = new Set<SubscriptionCallback<BlockSubscriptionData>>();
  private transactionSubscriptions = new Map<string, Set<SubscriptionCallback<TransactionSubscriptionData>>>();

  constructor(providers: RpcProvider[]) {
    super();
    this.providers = providers.sort((a, b) => a.priority - b.priority);
    this.startHealthChecking();
  }

  /**
   * Connect to Ethereum mainnet using the highest priority healthy provider
   */
  async connectToMainnet(): Promise<void> {
    const healthyProviders = this.providers.filter(p => p.isHealthy);
    
    if (healthyProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    for (const provider of healthyProviders) {
      try {
        await this.connectToProvider(provider);
        this.connectionStatus.isConnected = true;
        this.connectionStatus.currentProvider = provider;
        this.connectionStatus.connectionTime = Date.now();
        this.connectionStatus.reconnectAttempts = 0;
        
        this.emit('connected', provider);
        console.log(`Successfully connected to ${provider.name}`);
        return;
      } catch (error) {
        console.error(`Failed to connect to ${provider.name}:`, error);
        provider.isHealthy = false;
        provider.failureCount++;
      }
    }
    
    throw new Error('Failed to connect to any provider');
  }

  /**
   * Connect to a specific provider
   */
  private async connectToProvider(provider: RpcProvider): Promise<void> {
    // Create HTTP provider for regular RPC calls
    this.httpProvider = new ethers.JsonRpcProvider(provider.rpcUrl, 'mainnet', {
      staticNetwork: true
    });

    // Test the connection
    const blockNumber = await this.httpProvider.getBlockNumber();
    console.log(`Connected to ${provider.name}, current block: ${blockNumber}`);

    // Create WebSocket provider for real-time subscriptions
    this.wsProvider = new ethers.WebSocketProvider(provider.wsUrl, 'mainnet', {
      staticNetwork: true
    });

    // Set up WebSocket event handlers
    this.wsProvider.websocket.addEventListener('open', () => {
      console.log(`WebSocket connected to ${provider.name}`);
      this.setupSubscriptions();
    });

    this.wsProvider.websocket.addEventListener('close', () => {
      console.log(`WebSocket disconnected from ${provider.name}`);
      this.handleDisconnection();
    });

    this.wsProvider.websocket.addEventListener('error', (error: Event) => {
      console.error(`WebSocket error from ${provider.name}:`, error);
      this.handleConnectionError(error);
    });

    this.currentProvider = provider;
    this.connectionStatus.lastBlockNumber = blockNumber;
  }

  /**
   * Get transaction by hash using real eth_getTransactionByHash call
   */
  async getTransaction(hash: string): Promise<EthereumTransaction> {
    if (!this.httpProvider) {
      throw new Error('No active HTTP provider');
    }

    try {
      const tx = await this.httpProvider.getTransaction(hash);
      if (!tx) {
        throw new Error(`Transaction ${hash} not found`);
      }

      // Get block timestamp if available
      let timestamp: number | undefined;
      if (tx.blockNumber) {
        try {
          const block = await this.httpProvider.getBlock(tx.blockNumber);
          timestamp = block?.timestamp;
        } catch (error) {
          console.warn(`Failed to get block timestamp for tx ${hash}:`, error);
        }
      }

      return {
        hash: tx.hash || '',
        blockNumber: tx.blockNumber || 0,
        blockHash: tx.blockHash || '',
        transactionIndex: tx.index || 0,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasLimit: tx.gasLimit.toString(),
        input: tx.data,
        nonce: tx.nonce,
        timestamp,
        confirmations: await tx.confirmations()
      };
    } catch (error) {
      console.error(`Error fetching transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction receipt using real eth_getTransactionReceipt call
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    if (!this.httpProvider) {
      throw new Error('No active HTTP provider');
    }

    try {
      const receipt = await this.httpProvider.getTransactionReceipt(hash);
      if (!receipt) {
        throw new Error(`Transaction receipt ${hash} not found`);
      }

      return {
        transactionHash: receipt.hash,
        transactionIndex: receipt.index,
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        contractAddress: receipt.contractAddress,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: [...log.topics],
          data: log.data,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          transactionIndex: log.transactionIndex,
          blockHash: log.blockHash,
          logIndex: log.index,
          removed: log.removed
        })),
        status: receipt.status || 0,
        effectiveGasPrice: receipt.gasPrice?.toString()
      };
    } catch (error) {
      console.error(`Error fetching transaction receipt ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to new blocks using real eth_subscribe for newHeads
   */
  async subscribeToBlocks(callback: SubscriptionCallback<BlockSubscriptionData>): Promise<void> {
    this.blockSubscriptions.add(callback);
    
    if (this.blockSubscriptions.size === 1) {
      // First subscription, set up the actual blockchain subscription
      await this.setupBlockSubscription();
    }
  }

  /**
   * Subscribe to address transactions using real eth_subscribe for pendingTransactions
   */
  async subscribeToAddress(address: string, callback: SubscriptionCallback<TransactionSubscriptionData>): Promise<void> {
    const normalizedAddress = address.toLowerCase();
    
    if (!this.transactionSubscriptions.has(normalizedAddress)) {
      this.transactionSubscriptions.set(normalizedAddress, new Set());
    }
    
    this.transactionSubscriptions.get(normalizedAddress)!.add(callback);
    
    // Set up pending transaction monitoring if not already active
    if (this.transactionSubscriptions.size === 1) {
      await this.setupTransactionSubscription();
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    if (!this.httpProvider) {
      throw new Error('No active HTTP provider');
    }

    try {
      const blockNumber = await this.httpProvider.getBlockNumber();
      this.connectionStatus.lastBlockNumber = blockNumber;
      return blockNumber;
    } catch (error) {
      console.error('Error getting current block:', error);
      throw error;
    }
  }

  /**
   * Get block by number
   */
  async getBlockByNumber(blockNumber: number): Promise<Block> {
    if (!this.httpProvider) {
      throw new Error('No active HTTP provider');
    }

    try {
      const block = await this.httpProvider.getBlock(blockNumber);
      if (!block) {
        throw new Error(`Block ${blockNumber} not found`);
      }

      return {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner,
        difficulty: block.difficulty.toString(),
        totalDifficulty: '0', // Not available in ethers v6
        transactions: [...block.transactions],
        size: 0, // Would need additional call to get size
        baseFeePerGas: block.baseFeePerGas?.toString()
      };
    } catch (error) {
      console.error(`Error fetching block ${blockNumber}:`, error);
      throw error;
    }
  }

  /**
   * Set up real block subscription
   */
  private async setupBlockSubscription(): Promise<void> {
    if (!this.wsProvider) {
      console.warn('No WebSocket provider available for block subscription');
      return;
    }

    try {
      this.wsProvider.on('block', async (blockNumber: number) => {
        try {
          const block = await this.getBlockByNumber(blockNumber);
          const blockData: BlockSubscriptionData = {
            blockNumber: block.number,
            blockHash: block.hash,
            timestamp: block.timestamp
          };

          // Notify all block subscribers
          this.blockSubscriptions.forEach(callback => {
            try {
              callback(blockData);
            } catch (error) {
              console.error('Error in block subscription callback:', error);
            }
          });

          this.connectionStatus.lastBlockNumber = blockNumber;
        } catch (error) {
          console.error('Error processing new block:', error);
        }
      });

      console.log('Block subscription established');
    } catch (error) {
      console.error('Error setting up block subscription:', error);
      throw error;
    }
  }

  /**
   * Set up real transaction subscription for pending transactions
   */
  private async setupTransactionSubscription(): Promise<void> {
    if (!this.wsProvider) {
      console.warn('No WebSocket provider available for transaction subscription');
      return;
    }

    try {
      // Note: Most providers don't support pending transaction subscriptions due to volume
      // We'll use block-based transaction monitoring instead
      this.wsProvider.on('block', async (blockNumber: number) => {
        try {
          const block = await this.httpProvider!.getBlock(blockNumber, true);
          if (!block || !block.transactions) return;

          // Process each transaction in the block
          for (const tx of block.transactions) {
            if (typeof tx === 'string') continue; // Skip if only hash is provided
            
            // Type guard to ensure tx is a transaction object
            if (!tx || typeof tx !== 'object' || !('hash' in tx)) continue;

            const txData: TransactionSubscriptionData = {
              hash: tx.hash,
              from: tx.from.toLowerCase(),
              to: tx.to?.toLowerCase() || null,
              value: tx.value.toString(),
              blockNumber: blockNumber
            };

            // Check if any monitored addresses are involved
            const fromCallbacks = this.transactionSubscriptions.get(txData.from);
            const toCallbacks = txData.to ? this.transactionSubscriptions.get(txData.to) : null;

            // Notify subscribers for 'from' address
            if (fromCallbacks) {
              fromCallbacks.forEach(callback => {
                try {
                  callback(txData);
                } catch (error) {
                  console.error('Error in transaction subscription callback:', error);
                }
              });
            }

            // Notify subscribers for 'to' address
            if (toCallbacks) {
              toCallbacks.forEach(callback => {
                try {
                  callback(txData);
                } catch (error) {
                  console.error('Error in transaction subscription callback:', error);
                }
              });
            }
          }
        } catch (error) {
          console.error('Error processing block transactions:', error);
        }
      });

      console.log('Transaction subscription established');
    } catch (error) {
      console.error('Error setting up transaction subscription:', error);
      throw error;
    }
  }

  /**
   * Set up all subscriptions after connection
   */
  private async setupSubscriptions(): Promise<void> {
    if (this.blockSubscriptions.size > 0) {
      await this.setupBlockSubscription();
    }
    
    if (this.transactionSubscriptions.size > 0) {
      await this.setupTransactionSubscription();
    }
  }

  /**
   * Handle connection disconnection
   */
  private handleDisconnection(): void {
    this.connectionStatus.isConnected = false;
    this.emit('disconnected');
    
    if (this.connectionStatus.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Event | Error): void {
    console.error('Connection error:', error);
    this.emit('error', error);
    
    if (this.currentProvider) {
      this.currentProvider.isHealthy = false;
      this.currentProvider.failureCount++;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`Scheduling reconnection in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.connectionStatus.reconnectAttempts++;
      try {
        await this.connectToMainnet();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleDisconnection();
      }
    }, delay);
  }

  /**
   * Start health checking for all providers
   */
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const provider of this.providers) {
      const result = await this.checkProviderHealth(provider);
      results.push(result);
      
      provider.isHealthy = result.isHealthy;
      provider.lastHealthCheck = result.timestamp;
      
      if (!result.isHealthy) {
        provider.failureCount++;
      } else {
        provider.failureCount = 0; // Reset on successful health check
      }
    }
    
    this.emit('healthCheckCompleted', results);
    return results;
  }

  /**
   * Check health of a specific provider
   */
  private async checkProviderHealth(provider: RpcProvider): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const tempProvider = new ethers.JsonRpcProvider(provider.rpcUrl);
      const blockNumber = await Promise.race([
        tempProvider.getBlockNumber(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), provider.timeout)
        )
      ]);
      
      const latency = Date.now() - startTime;
      
      return {
        provider: provider.name,
        isHealthy: true,
        latency,
        blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        provider: provider.name,
        isHealthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): RpcProvider[] {
    return this.providers.map(p => ({ ...p }));
  }

  /**
   * Get event logs using real blockchain data
   */
  async getLogs(filter: any): Promise<any[]> {
    if (!this.httpProvider) {
      throw new Error('No active HTTP provider');
    }

    try {
      const logs = await this.httpProvider.getLogs(filter);
      return logs.map(log => ({
        address: log.address,
        topics: [...log.topics],
        data: log.data,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
        blockHash: log.blockHash,
        logIndex: log.index,
        removed: log.removed
      }));
    } catch (error) {
      console.error('Error getting logs:', error);
      throw error;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.wsProvider) {
      await this.wsProvider.destroy();
    }
    
    if (this.httpProvider) {
      this.httpProvider.destroy();
    }
    
    this.connectionStatus.isConnected = false;
    this.emit('disconnected');
  }
}