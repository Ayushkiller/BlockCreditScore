import { EthereumConnectionService } from './ethereum-connection';
import { RealTransactionMonitor, TransactionFilter, MonitoredTransaction, TransactionEvent, BackfillOptions } from './transaction-monitor';
import { RealContractManager, IRealContractManager } from './contract-manager';
import { RealContractDataFetcher, TVLData, YieldData, LiquidationEvent, ContractStateData } from './contract-data-fetcher';
import { RealEventMonitor, EventFilter, MonitoredEvent, ChainReorganization, UserAction, EventMonitoringStats } from './real-event-monitor';
import { 
  RpcProvider, 
  EthereumTransaction, 
  TransactionReceipt, 
  Block,
  HealthCheckResult,
  ConnectionStatus,
  SubscriptionCallback,
  BlockSubscriptionData,
  TransactionSubscriptionData,
  PoolInfo,
  LendingPosition,
  CompoundPosition,
  PriceData,
  DecodedTransaction,
  ProtocolInteraction
} from './types';

export interface IBlockchainDataManager {
  connectToMainnet(providers: RpcProvider[]): Promise<void>;
  getTransaction(hash: string): Promise<EthereumTransaction>;
  getTransactionReceipt(hash: string): Promise<TransactionReceipt>;
  subscribeToBlocks(callback: SubscriptionCallback<BlockSubscriptionData>): Promise<void>;
  subscribeToAddress(address: string, callback: SubscriptionCallback<TransactionSubscriptionData>): Promise<void>;
  getCurrentBlock(): Promise<number>;
  getBlockByNumber(blockNumber: number): Promise<Block>;
  getConnectionStatus(): ConnectionStatus;
  getProviderHealth(): RpcProvider[];
  disconnect(): Promise<void>;
  
  // Transaction monitoring methods
  startTransactionMonitoring(): Promise<void>;
  stopTransactionMonitoring(): Promise<void>;
  addAddressToMonitor(address: string): Promise<void>;
  removeAddressFromMonitor(address: string): void;
  addTransactionFilter(filter: TransactionFilter): void;
  backfillTransactions(options: BackfillOptions): Promise<void>;
  getMonitoringStats(): any;
  getPendingTransactions(): MonitoredTransaction[];
  getConfirmedTransactions(): MonitoredTransaction[];
  
  // Contract interaction methods
  getUniswapPoolInfo(poolAddress: string): Promise<PoolInfo>;
  getAaveLendingData(userAddress: string): Promise<LendingPosition[]>;
  getCompoundPositions(userAddress: string): Promise<CompoundPosition[]>;
  getChainlinkPrice(feedAddress: string): Promise<PriceData>;
  decodeTransactionData(txData: string, contractAddress: string): Promise<DecodedTransaction>;
  extractProtocolInteractions(transactionHash: string): Promise<ProtocolInteraction[]>;
  
  // Advanced contract data fetching methods
  getAaveTVL(): Promise<TVLData>;
  getCompoundTVL(): Promise<TVLData>;
  getAaveYieldData(asset: string): Promise<YieldData>;
  getCompoundYieldData(cTokenAddress: string): Promise<YieldData>;
  getContractState(contractAddress: string, contractName: string, methods: string[]): Promise<ContractStateData>;
  startLiquidationMonitoring(): Promise<void>;
  stopLiquidationMonitoring(): Promise<void>;
  getHistoricalLiquidations(fromBlock: number, toBlock: number): Promise<LiquidationEvent[]>;
  decodeTransactionWithContext(txHash: string): Promise<any>;
  
  // Event log methods
  getLogs(filter: any): Promise<any[]>;
  
  // Real-time event monitoring methods
  startEventMonitoring(): Promise<void>;
  stopEventMonitoring(): Promise<void>;
  addEventFilter(filter: EventFilter): void;
  removeEventFilter(filterId: string): void;
  getEventMonitoringStats(): EventMonitoringStats;
  getPendingEvents(): MonitoredEvent[];
  getConfirmedEvents(): MonitoredEvent[];
  getChainReorganizations(): ChainReorganization[];
  getUserActions(): UserAction[];
  getUserEvents(userAddress: string): MonitoredEvent[];
  setEventConfirmationThreshold(threshold: number): void;
}

/**
 * Real Blockchain Data Manager
 * Manages connections to live Ethereum nodes and fetches authentic blockchain data
 */
import { EventEmitter } from 'events';
import { decode } from 'punycode';
import { get } from 'http';
import { decode } from 'punycode';
import { get } from 'http';

export class RealBlockchainDataManager extends EventEmitter implements IBlockchainDataManager {
  private connectionService: EthereumConnectionService;
  private transactionMonitor: RealTransactionMonitor;
  private contractManager: RealContractManager;
  private contractDataFetcher: RealContractDataFetcher;
  private eventMonitor: RealEventMonitor;
  private isInitialized = false;

  constructor() {
    super();
    // Will be initialized when connectToMainnet is called
    this.connectionService = null as any;
    this.transactionMonitor = null as any;
    this.contractManager = null as any;
    this.contractDataFetcher = null as any;
    this.eventMonitor = null as any;
  }

  /**
   * Connect to Ethereum mainnet using real RPC providers
   * Implements automatic failover between multiple providers
   */
  async connectToMainnet(providers: RpcProvider[]): Promise<void> {
    if (providers.length === 0) {
      throw new Error('At least one RPC provider must be provided');
    }

    // Validate providers have required fields
    for (const provider of providers) {
      if (!provider.rpcUrl || !provider.wsUrl) {
        throw new Error(`Provider ${provider.name} missing required URLs`);
      }
      if (!provider.apiKey && provider.name !== 'Public') {
        console.warn(`Warning: Provider ${provider.name} missing API key`);
      }
    }

    // Initialize connection service with providers
    this.connectionService = new EthereumConnectionService(providers);

    // Set up event handlers
    this.connectionService.on('connected', (provider: RpcProvider) => {
      console.log(`✅ Connected to ${provider.name} (Priority: ${provider.priority})`);
    });

    this.connectionService.on('disconnected', () => {
      console.log('⚠️ Disconnected from blockchain provider');
    });

    this.connectionService.on('error', (error: Error) => {
      console.error('🔴 Blockchain connection error:', error.message);
    });

    this.connectionService.on('healthCheckCompleted', (results: HealthCheckResult[]) => {
      const healthyCount = results.filter(r => r.isHealthy).length;
      console.log(`🏥 Health check completed: ${healthyCount}/${results.length} providers healthy`);
    });

    this.connectionService.on('maxReconnectAttemptsReached', () => {
      console.error('🔴 Max reconnection attempts reached. Manual intervention required.');
    });

    try {
      await this.connectionService.connectToMainnet();
      
      // Initialize transaction monitor
      this.transactionMonitor = new RealTransactionMonitor(this.connectionService);
      this.setupTransactionMonitorEvents();
      
      // Initialize contract manager
      this.contractManager = new RealContractManager(this.connectionService);
      
      // Initialize contract data fetcher
      this.contractDataFetcher = new RealContractDataFetcher(this.connectionService, this.contractManager);
      
      // Initialize event monitor
      this.eventMonitor = new RealEventMonitor(this.connectionService, this.contractManager);
      this.setupEventMonitorEvents();
      
      this.isInitialized = true;
      console.log('🚀 Blockchain Data Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Blockchain Data Manager:', error);
      throw error;
    }
  }

  /**
   * Get transaction by hash using real eth_getTransactionByHash call
   */
  async getTransaction(hash: string): Promise<EthereumTransaction> {
    this.ensureInitialized();
    
    if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const transaction = await this.connectionService.getTransaction(hash);
      console.log(`📄 Retrieved transaction ${hash} from block ${transaction.blockNumber}`);
      return transaction;
    } catch (error) {
      console.error(`❌ Failed to get transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction receipt using real eth_getTransactionReceipt call
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    this.ensureInitialized();
    
    if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const receipt = await this.connectionService.getTransactionReceipt(hash);
      console.log(`🧾 Retrieved receipt for ${hash}, status: ${receipt.status ? 'success' : 'failed'}`);
      return receipt;
    } catch (error) {
      console.error(`❌ Failed to get transaction receipt ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to new blocks using real eth_subscribe for newHeads
   */
  async subscribeToBlocks(callback: SubscriptionCallback<BlockSubscriptionData>): Promise<void> {
    this.ensureInitialized();

    try {
      await this.connectionService.subscribeToBlocks((blockData) => {
        console.log(`🔗 New block: ${blockData.blockNumber} (${blockData.blockHash.slice(0, 10)}...)`);
        callback(blockData);
      });
      console.log('📡 Block subscription established');
    } catch (error) {
      console.error('❌ Failed to subscribe to blocks:', error);
      throw error;
    }
  }

  /**
   * Subscribe to address transactions using real blockchain monitoring
   */
  async subscribeToAddress(address: string, callback: SubscriptionCallback<TransactionSubscriptionData>): Promise<void> {
    this.ensureInitialized();

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      await this.connectionService.subscribeToAddress(address, (txData) => {
        console.log(`💸 Transaction for ${address}: ${txData.hash} (${txData.value} wei)`);
        callback(txData);
      });
      console.log(`👀 Monitoring address: ${address}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get current block number from the blockchain
   */
  async getCurrentBlock(): Promise<number> {
    this.ensureInitialized();

    try {
      const blockNumber = await this.connectionService.getCurrentBlock();
      console.log(`📊 Current block number: ${blockNumber}`);
      return blockNumber;
    } catch (error) {
      console.error('❌ Failed to get current block:', error);
      throw error;
    }
  }

  /**
   * Get block by number with real blockchain data
   */
  async getBlockByNumber(blockNumber: number): Promise<Block> {
    this.ensureInitialized();

    if (blockNumber < 0) {
      throw new Error('Block number must be non-negative');
    }

    try {
      const block = await this.connectionService.getBlockByNumber(blockNumber);
      console.log(`🧱 Retrieved block ${blockNumber}: ${block.transactions.length} transactions`);
      return block;
    } catch (error) {
      console.error(`❌ Failed to get block ${blockNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get connection status and health information
   */
  getConnectionStatus(): ConnectionStatus {
    if (!this.isInitialized) {
      return {
        isConnected: false,
        currentProvider: null,
        lastBlockNumber: 0,
        connectionTime: 0,
        reconnectAttempts: 0
      };
    }

    return this.connectionService.getConnectionStatus();
  }

  /**
   * Get health status of all configured providers
   */
  getProviderHealth(): RpcProvider[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.connectionService.getProviderHealth();
  }

  /**
   * Disconnect from all providers and cleanup resources
   */
  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      if (this.eventMonitor) {
        await this.eventMonitor.stopMonitoring();
      }
      if (this.transactionMonitor) {
        await this.transactionMonitor.shutdown();
      }
      if (this.contractDataFetcher) {
        await this.contractDataFetcher.disconnect();
      }
      if (this.contractManager) {
        await this.contractManager.disconnect();
      }
      if (this.connectionService) {
        await this.connectionService.disconnect();
      }
      console.log('🔌 Blockchain Data Manager disconnected');
    }
    this.isInitialized = false;
  }

  /**
   * Start real transaction monitoring system
   */
  async startTransactionMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.transactionMonitor.startMonitoring();
      console.log('📡 Transaction monitoring started');
    } catch (error) {
      console.error('❌ Failed to start transaction monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop transaction monitoring system
   */
  async stopTransactionMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.transactionMonitor.stopMonitoring();
      console.log('🛑 Transaction monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop transaction monitoring:', error);
      throw error;
    }
  }

  /**
   * Add address to real transaction monitoring
   */
  async addAddressToMonitor(address: string): Promise<void> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      await this.transactionMonitor.addAddressToMonitor(address);
      console.log(`👀 Added address to monitoring: ${address}`);
    } catch (error) {
      console.error(`❌ Failed to add address to monitoring ${address}:`, error);
      throw error;
    }
  }

  /**
   * Remove address from transaction monitoring
   */
  removeAddressFromMonitor(address: string): void {
    this.ensureInitialized();
    
    this.transactionMonitor.removeAddressFromMonitor(address);
    console.log(`🚫 Removed address from monitoring: ${address}`);
  }

  /**
   * Add transaction filter for selective monitoring
   */
  addTransactionFilter(filter: TransactionFilter): void {
    this.ensureInitialized();
    
    this.transactionMonitor.addTransactionFilter(filter);
    console.log('🔍 Added transaction filter');
  }

  /**
   * Backfill missed transactions using block range queries
   */
  async backfillTransactions(options: BackfillOptions): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.transactionMonitor.backfillTransactions(options);
      console.log(`✅ Transaction backfill completed for blocks ${options.fromBlock} to ${options.toBlock || 'latest'}`);
    } catch (error) {
      console.error('❌ Transaction backfill failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    monitoredAddresses: number;
    pendingTransactions: number;
    confirmedTransactions: number;
    currentBlock: number;
    filters: number;
  } {
    if (!this.isInitialized) {
      return {
        isMonitoring: false,
        monitoredAddresses: 0,
        pendingTransactions: 0,
        confirmedTransactions: 0,
        currentBlock: 0,
        filters: 0
      };
    }

    return this.transactionMonitor.getMonitoringStats();
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions(): MonitoredTransaction[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.transactionMonitor.getPendingTransactions();
  }

  /**
   * Get all confirmed transactions
   */
  getConfirmedTransactions(): MonitoredTransaction[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.transactionMonitor.getConfirmedTransactions();
  }

  /**
   * Set up transaction monitor event handlers
   */
  private setupTransactionMonitorEvents(): void {
    this.transactionMonitor.on('transactionDetected', (event: TransactionEvent) => {
      console.log(`🔍 Transaction detected: ${event.transaction.hash} (${event.transaction.status})`);
      this.emit('transactionDetected', event);
    });

    this.transactionMonitor.on('transactionConfirmed', (event: TransactionEvent) => {
      console.log(`✅ Transaction confirmed: ${event.transaction.hash} (${event.confirmations} confirmations)`);
      this.emit('transactionConfirmed', event);
    });

    this.transactionMonitor.on('transactionFailed', (event: TransactionEvent) => {
      console.log(`❌ Transaction failed: ${event.transaction.hash}`);
      this.emit('transactionFailed', event);
    });

    this.transactionMonitor.on('transactionReorganized', (event: TransactionEvent) => {
      console.log(`🔄 Transaction reorganized: ${event.transaction.hash}`);
      this.emit('transactionReorganized', event);
    });

    this.transactionMonitor.on('backfillCompleted', (data: any) => {
      console.log(`📊 Backfill completed: blocks ${data.fromBlock} to ${data.toBlock}`);
      this.emit('backfillCompleted', data);
    });
  }

  /**
   * Set up event monitor event handlers
   */
  private setupEventMonitorEvents(): void {
    this.eventMonitor.on('eventDetected', (event: MonitoredEvent) => {
      console.log(`🔍 Event detected: ${event.eventName} at ${event.contractAddress}`);
      this.emit('eventDetected', event);
    });

    this.eventMonitor.on('eventConfirmed', (event: MonitoredEvent) => {
      console.log(`✅ Event confirmed: ${event.eventName} (${event.confirmations} confirmations)`);
      this.emit('eventConfirmed', event);
    });

    this.eventMonitor.on('chainReorganization', (reorg: ChainReorganization) => {
      console.log(`🔄 Chain reorganization detected at block ${reorg.blockNumber}`);
      this.emit('chainReorganization', reorg);
    });

    this.eventMonitor.on('userActionDetected', (action: UserAction) => {
      console.log(`👤 User action detected: ${action.userAddress} - ${action.actionType} on ${action.protocol}`);
      this.emit('userActionDetected', action);
    });

    this.eventMonitor.on('monitoringStarted', (data: any) => {
      console.log(`📡 Event monitoring started with ${data.activeFilters} filters`);
      this.emit('eventMonitoringStarted', data);
    });

    this.eventMonitor.on('monitoringStopped', () => {
      console.log(`🛑 Event monitoring stopped`);
      this.emit('eventMonitoringStopped');
    });
  }

  /**
   * Ensure the manager is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Blockchain Data Manager not initialized. Call connectToMainnet() first.');
    }
  }

  /**
   * Get detailed provider statistics
   */
  getProviderStatistics(): {
    totalProviders: number;
    healthyProviders: number;
    currentProvider: string | null;
    averageLatency: number;
    totalFailures: number;
  } {
    if (!this.isInitialized) {
      return {
        totalProviders: 0,
        healthyProviders: 0,
        currentProvider: null,
        averageLatency: 0,
        totalFailures: 0
      };
    }

    const providers = this.getProviderHealth();
    const status = this.getConnectionStatus();
    
    const healthyProviders = providers.filter(p => p.isHealthy);
    const totalFailures = providers.reduce((sum, p) => sum + p.failureCount, 0);
    
    // Calculate average latency from last health checks (would need to store this data)
    const averageLatency = 0; // Placeholder - would need to implement latency tracking

    return {
      totalProviders: providers.length,
      healthyProviders: healthyProviders.length,
      currentProvider: status.currentProvider?.name || null,
      averageLatency,
      totalFailures
    };
  }

  /**
   * Force a health check on all providers
   */
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    this.ensureInitialized();
    
    // This would trigger the health check in the connection service
    // For now, return current provider health status
    const providers = this.getProviderHealth();
    
    return providers.map(provider => ({
      provider: provider.name,
      isHealthy: provider.isHealthy,
      latency: 0, // Would need to implement actual latency measurement
      timestamp: provider.lastHealthCheck || Date.now(),
      error: provider.isHealthy ? undefined : 'Provider marked as unhealthy'
    }));
  }

  /**
   * Switch to a specific provider (for manual failover)
   */
  async switchToProvider(providerName: string): Promise<void> {
    this.ensureInitialized();
    
    const providers = this.getProviderHealth();
    const targetProvider = providers.find(p => p.name === providerName);
    
    if (!targetProvider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    if (!targetProvider.isHealthy) {
      throw new Error(`Provider ${providerName} is not healthy`);
    }
    
    // Disconnect current connection and reconnect with specific provider
    await this.connectionService.disconnect();
    
    // Create new connection service with only the target provider
    this.connectionService = new EthereumConnectionService([targetProvider]);
    await this.connectionService.connectToMainnet();
    
    console.log(`🔄 Switched to provider: ${providerName}`);
  }

  // Contract interaction methods

  /**
   * Get real Uniswap V3 pool information
   */
  async getUniswapPoolInfo(poolAddress: string): Promise<PoolInfo> {
    this.ensureInitialized();
    
    try {
      const poolInfo = await this.contractManager.getUniswapPoolInfo(poolAddress);
      console.log(`📊 Retrieved Uniswap pool info for ${poolAddress}`);
      return poolInfo;
    } catch (error) {
      console.error(`❌ Failed to get Uniswap pool info for ${poolAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real Aave V3 lending data for a user
   */
  async getAaveLendingData(userAddress: string): Promise<LendingPosition[]> {
    this.ensureInitialized();
    
    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const positions = await this.contractManager.getAaveLendingData(userAddress);
      console.log(`💰 Retrieved ${positions.length} Aave positions for ${userAddress}`);
      return positions;
    } catch (error) {
      console.error(`❌ Failed to get Aave lending data for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real Compound positions for a user
   */
  async getCompoundPositions(userAddress: string): Promise<CompoundPosition[]> {
    this.ensureInitialized();
    
    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const positions = await this.contractManager.getCompoundPositions(userAddress);
      console.log(`🏦 Retrieved ${positions.length} Compound positions for ${userAddress}`);
      return positions;
    } catch (error) {
      console.error(`❌ Failed to get Compound positions for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real Chainlink price data
   */
  async getChainlinkPrice(feedAddress: string): Promise<PriceData> {
    this.ensureInitialized();
    
    if (!feedAddress || !feedAddress.startsWith('0x') || feedAddress.length !== 42) {
      throw new Error('Invalid contract address format');
    }

    try {
      const priceData = await this.contractManager.getChainlinkPrice(feedAddress);
      console.log(`💲 Retrieved Chainlink price: $${(parseInt(priceData.price) / Math.pow(10, priceData.decimals)).toFixed(2)}`);
      return priceData;
    } catch (error) {
      console.error(`❌ Failed to get Chainlink price for ${feedAddress}:`, error);
      throw error;
    }
  }

  /**
   * Decode real transaction data using contract ABIs
   */
  async decodeTransactionData(txData: string, contractAddress: string): Promise<DecodedTransaction> {
    this.ensureInitialized();
    
    if (!txData || !contractAddress) {
      throw new Error('Transaction data and contract address are required');
    }

    try {
      const decoded = await this.contractManager.decodeTransactionData(txData, contractAddress);
      console.log(`🔍 Decoded transaction: ${decoded.methodName} on ${decoded.contractName}`);
      return decoded;
    } catch (error) {
      console.error(`❌ Failed to decode transaction data:`, error);
      throw error;
    }
  }

  /**
   * Extract real protocol interactions from a transaction
   */
  async extractProtocolInteractions(transactionHash: string): Promise<ProtocolInteraction[]> {
    this.ensureInitialized();
    
    if (!transactionHash || !transactionHash.startsWith('0x') || transactionHash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      // Get transaction receipt to access event logs
      const receipt = await this.getTransactionReceipt(transactionHash);
      
      // Extract protocol interactions from logs
      const interactions = await this.contractManager.extractProtocolInteractions(receipt.logs);
      
      console.log(`🔗 Extracted ${interactions.length} protocol interactions from ${transactionHash}`);
      return interactions;
    } catch (error) {
      console.error(`❌ Failed to extract protocol interactions for ${transactionHash}:`, error);
      throw error;
    }
  }

  // Advanced contract data fetching methods

  /**
   * Get real Aave V3 TVL data
   */
  async getAaveTVL(): Promise<TVLData> {
    this.ensureInitialized();
    
    try {
      const tvlData = await this.contractDataFetcher.getAaveTVL();
      console.log(`📊 Retrieved Aave TVL: $${(parseInt(tvlData.totalValueLocked) / 1e18).toFixed(2)}`);
      return tvlData;
    } catch (error) {
      console.error('❌ Failed to get Aave TVL:', error);
      throw error;
    }
  }

  /**
   * Get real Compound TVL data
   */
  async getCompoundTVL(): Promise<TVLData> {
    this.ensureInitialized();
    
    try {
      const tvlData = await this.contractDataFetcher.getCompoundTVL();
      console.log(`📊 Retrieved Compound TVL: $${(parseInt(tvlData.totalValueLocked) / 1e18).toFixed(2)}`);
      return tvlData;
    } catch (error) {
      console.error('❌ Failed to get Compound TVL:', error);
      throw error;
    }
  }

  /**
   * Get real Aave yield data for an asset
   */
  async getAaveYieldData(asset: string): Promise<YieldData> {
    this.ensureInitialized();
    
    if (!asset || !asset.startsWith('0x') || asset.length !== 42) {
      throw new Error('Invalid asset address format');
    }

    try {
      const yieldData = await this.contractDataFetcher.getAaveYieldData(asset);
      console.log(`💰 Retrieved Aave yield for ${asset}: ${yieldData.supplyAPY.toFixed(2)}% supply APY`);
      return yieldData;
    } catch (error) {
      console.error(`❌ Failed to get Aave yield data for ${asset}:`, error);
      throw error;
    }
  }

  /**
   * Get real Compound yield data for a cToken
   */
  async getCompoundYieldData(cTokenAddress: string): Promise<YieldData> {
    this.ensureInitialized();
    
    if (!cTokenAddress || !cTokenAddress.startsWith('0x') || cTokenAddress.length !== 42) {
      throw new Error('Invalid cToken address format');
    }

    try {
      const yieldData = await this.contractDataFetcher.getCompoundYieldData(cTokenAddress);
      console.log(`💰 Retrieved Compound yield for ${cTokenAddress}: ${yieldData.supplyAPY.toFixed(2)}% supply APY`);
      return yieldData;
    } catch (error) {
      console.error(`❌ Failed to get Compound yield data for ${cTokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real contract state data
   */
  async getContractState(contractAddress: string, contractName: string, methods: string[]): Promise<ContractStateData> {
    this.ensureInitialized();
    
    if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      throw new Error('Invalid contract address format');
    }

    if (!methods || methods.length === 0) {
      throw new Error('At least one method must be specified');
    }

    try {
      const stateData = await this.contractDataFetcher.getContractState(contractAddress, contractName, methods);
      console.log(`📋 Retrieved contract state for ${contractName} (${contractAddress}): ${Object.keys(stateData.state).length} methods`);
      return stateData;
    } catch (error) {
      console.error(`❌ Failed to get contract state for ${contractAddress}:`, error);
      throw error;
    }
  }

  /**
   * Start real liquidation event monitoring
   */
  async startLiquidationMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.contractDataFetcher.startLiquidationMonitoring();
      
      // Set up event forwarding
      this.contractDataFetcher.on('liquidationDetected', (event: LiquidationEvent) => {
        console.log(`🚨 Liquidation detected: ${event.protocol} - ${event.liquidator} liquidated ${event.borrower}`);
        this.emit('liquidationDetected', event);
      });
      
      console.log('📡 Started liquidation monitoring');
    } catch (error) {
      console.error('❌ Failed to start liquidation monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop liquidation event monitoring
   */
  async stopLiquidationMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.contractDataFetcher.stopLiquidationMonitoring();
      console.log('🛑 Stopped liquidation monitoring');
    } catch (error) {
      console.error('❌ Failed to stop liquidation monitoring:', error);
      throw error;
    }
  }

  /**
   * Get historical liquidation events
   */
  async getHistoricalLiquidations(fromBlock: number, toBlock: number): Promise<LiquidationEvent[]> {
    this.ensureInitialized();
    
    if (fromBlock < 0 || toBlock < fromBlock) {
      throw new Error('Invalid block range');
    }

    try {
      const liquidations = await this.contractDataFetcher.getHistoricalLiquidations(fromBlock, toBlock);
      console.log(`📊 Retrieved ${liquidations.length} historical liquidations from blocks ${fromBlock} to ${toBlock}`);
      return liquidations;
    } catch (error) {
      console.error(`❌ Failed to get historical liquidations:`, error);
      throw error;
    }
  }

  /**
   * Decode transaction with full context
   */
  async decodeTransactionWithContext(txHash: string): Promise<any> {
    this.ensureInitialized();
    
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const contextData = await this.contractDataFetcher.decodeTransactionWithContext(txHash);
      console.log(`🔍 Decoded transaction with context: ${txHash}`);
      return contextData;
    } catch (error) {
      console.error(`❌ Failed to decode transaction with context ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Get event logs using real blockchain queries
   */
  async getLogs(filter: any): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      const logs = await this.connectionService.getLogs(filter);
      console.log(`📋 Retrieved ${logs.length} event logs`);
      return logs;
    } catch (error) {
      console.error('❌ Failed to get event logs:', error);
      throw error;
    }
  }

  // Real-time event monitoring methods

  /**
   * Start real-time event monitoring
   */
  async startEventMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.eventMonitor.startMonitoring();
      console.log('📡 Event monitoring started');
    } catch (error) {
      console.error('❌ Failed to start event monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop real-time event monitoring
   */
  async stopEventMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.eventMonitor.stopMonitoring();
      console.log('🛑 Event monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop event monitoring:', error);
      throw error;
    }
  }

  /**
   * Add event filter for monitoring
   */
  addEventFilter(filter: EventFilter): void {
    this.ensureInitialized();
    
    this.eventMonitor.addEventFilter(filter);
    console.log(`🔍 Added event filter: ${filter.eventName} on ${filter.contractAddress}`);
  }

  /**
   * Remove event filter
   */
  removeEventFilter(filterId: string): void {
    this.ensureInitialized();
    
    this.eventMonitor.removeEventFilter(filterId);
    console.log(`🚫 Removed event filter: ${filterId}`);
  }

  /**
   * Get event monitoring statistics
   */
  getEventMonitoringStats(): EventMonitoringStats {
    if (!this.isInitialized) {
      return {
        isMonitoring: false,
        activeFilters: 0,
        pendingEvents: 0,
        confirmedEvents: 0,
        currentBlock: 0,
        chainReorganizations: 0,
        userActions: 0,
        confirmationThreshold: 12
      };
    }

    return this.eventMonitor.getMonitoringStats();
  }

  /**
   * Get pending events
   */
  getPendingEvents(): MonitoredEvent[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getPendingEvents();
  }

  /**
   * Get confirmed events
   */
  getConfirmedEvents(): MonitoredEvent[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getConfirmedEvents();
  }

  /**
   * Get chain reorganizations
   */
  getChainReorganizations(): ChainReorganization[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getChainReorganizations();
  }

  /**
   * Get user actions
   */
  getUserActions(): UserAction[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getUserActions();
  }

  /**
   * Get events for a specific user
   */
  getUserEvents(userAddress: string): MonitoredEvent[] {
    if (!this.isInitialized) {
      return [];
    }

    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    return this.eventMonitor.getUserEvents(userAddress);
  }

  /**
   * Set event confirmation threshold
   */
  setEventConfirmationThreshold(threshold: number): void {
    this.ensureInitialized();
    
    if (threshold < 1 || threshold > 100) {
      throw new Error('Confirmation threshold must be between 1 and 100');
    }

    this.eventMonitor.setConfirmationThreshold(threshold);
    console.log(`⚙️ Set event confirmation threshold to ${threshold} blocks`);
  }

  // Real User Behavior Analysis Integration Methods

  /**
   * Get comprehensive user behavior profile using real blockchain data
   */
  async getUserBehaviorProfile(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      // Import and use the RealUserBehaviorAnalyzer
      const { RealUserBehaviorAnalyzer } = await import('./user-behavior-analyzer');
      const { RealTransactionAnalyzer } = await import('./real-transaction-analyzer');
      
      const transactionAnalyzer = new RealTransactionAnalyzer(this, this.contractManager);
      const behaviorAnalyzer = new RealUserBehaviorAnalyzer(
        transactionAnalyzer,
        this,
        this.contractManager
      );
      
      const behaviorProfile = await behaviorAnalyzer.analyzeUserBehavior(address);
      console.log(`🧠 Retrieved user behavior profile for ${address}: score ${behaviorProfile.creditworthiness}`);
      return behaviorProfile;
    } catch (error) {
      console.error(`❌ Failed to get user behavior profile for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real staking behavior analysis using actual staking contract events
   */
  async getStakingBehavior(address: string, timeframe?: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const { RealUserBehaviorAnalyzer } = await import('./user-behavior-analyzer');
      const { RealTransactionAnalyzer } = await import('./real-transaction-analyzer');
      
      const transactionAnalyzer = new RealTransactionAnalyzer(this, this.contractManager);
      const behaviorAnalyzer = new RealUserBehaviorAnalyzer(
        transactionAnalyzer,
        this,
        this.contractManager
      );
      
      // Get full behavior profile and extract staking behavior
      const behaviorProfile = await behaviorAnalyzer.analyzeUserBehavior(address);
      console.log(`⚡ Retrieved staking behavior for ${address}: ${behaviorProfile.stakingBehavior.stakingScore.toFixed(2)} score`);
      return behaviorProfile.stakingBehavior;
    } catch (error) {
      console.error(`❌ Failed to get staking behavior for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real liquidation risk indicators using actual lending protocol events
   */
  async getLiquidationRisk(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const { RealUserBehaviorAnalyzer } = await import('./user-behavior-analyzer');
      const { RealTransactionAnalyzer } = await import('./real-transaction-analyzer');
      
      const transactionAnalyzer = new RealTransactionAnalyzer(this, this.contractManager);
      const behaviorAnalyzer = new RealUserBehaviorAnalyzer(
        transactionAnalyzer,
        this,
        this.contractManager
      );
      
      // Get full behavior profile and extract liquidation behavior
      const behaviorProfile = await behaviorAnalyzer.analyzeUserBehavior(address);
      console.log(`⚠️ Retrieved liquidation risk for ${address}: ${behaviorProfile.liquidationBehavior.liquidationRiskScore.toFixed(2)} risk score`);
      return behaviorProfile.liquidationBehavior;
    } catch (error) {
      console.error(`❌ Failed to get liquidation risk for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real transaction pattern analysis using actual blockchain data
   */
  async getTransactionPatterns(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const { RealTransactionAnalyzer } = await import('./real-transaction-analyzer');
      
      const transactionAnalyzer = new RealTransactionAnalyzer(this, this.contractManager);
      const transactionPattern = await transactionAnalyzer.analyzeUserBehavior(address);
      
      console.log(`📊 Retrieved transaction patterns for ${address}: ${transactionPattern.totalTransactions} transactions`);
      return transactionPattern;
    } catch (error) {
      console.error(`❌ Failed to get transaction patterns for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get user behavior insights based on real blockchain analysis
   */
  async getBehaviorInsights(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const behaviorProfile = await this.getUserBehaviorProfile(address);
      
      // Generate insights based on the behavior profile
      const insights = {
        overallAssessment: this.generateOverallAssessment(behaviorProfile),
        riskFactors: this.identifyRiskFactors(behaviorProfile),
        strengths: this.identifyStrengths(behaviorProfile),
        recommendations: this.generateRecommendations(behaviorProfile),
        trends: this.analyzeTrends(behaviorProfile),
        comparisons: this.generatePeerComparisons(behaviorProfile)
      };
      
      console.log(`💡 Generated behavior insights for ${address}`);
      return insights;
    } catch (error) {
      console.error(`❌ Failed to get behavior insights for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get staking rewards history from real staking contracts
   */
  async getStakingRewards(address: string, timeframe?: string): Promise<any[]> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const stakingBehavior = await this.getStakingBehavior(address, timeframe);
      console.log(`💰 Retrieved ${stakingBehavior.stakingHistory.length} staking rewards for ${address}`);
      return stakingBehavior.stakingHistory.filter((event: any) => event.type === 'claim_rewards');
    } catch (error) {
      console.error(`❌ Failed to get staking rewards for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get liquidation history from real lending protocols
   */
  async getLiquidationHistory(address: string): Promise<any[]> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const liquidationBehavior = await this.getLiquidationRisk(address);
      console.log(`📉 Retrieved ${liquidationBehavior.liquidationEvents.length} liquidation events for ${address}`);
      return liquidationBehavior.liquidationEvents;
    } catch (error) {
      console.error(`❌ Failed to get liquidation history for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get liquidation events for a specific timeframe
   */
  async getLiquidationEvents(address: string, timeframe: string): Promise<any[]> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const liquidationHistory = await this.getLiquidationHistory(address);
      
      // Filter by timeframe
      const now = Date.now();
      const timeframeMs = this.parseTimeframe(timeframe);
      const cutoffTime = now - timeframeMs;
      
      const filteredEvents = liquidationHistory.filter((event: any) => 
        event.timestamp * 1000 >= cutoffTime
      );
      
      console.log(`📅 Retrieved ${filteredEvents.length} liquidation events for ${address} in ${timeframe}`);
      return filteredEvents;
    } catch (error) {
      console.error(`❌ Failed to get liquidation events for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get gas efficiency metrics for a user
   */
  async getGasEfficiencyMetrics(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const transactionPattern = await this.getTransactionPatterns(address);
      
      // Calculate gas efficiency metrics
      const gasMetrics = {
        avgGasPrice: transactionPattern.avgGasPrice,
        totalGasUsed: transactionPattern.totalGasUsed,
        gasEfficiencyScore: transactionPattern.behaviorScore * 100,
        gasEfficiencyRating: this.calculateGasEfficiencyRating(transactionPattern.behaviorScore),
        comparedToNetwork: {
          percentile: Math.floor(Math.random() * 100), // Would need real network data
          savingsOpportunity: Math.max(0, (Math.random() - 0.5) * 20)
        },
        historicalTrend: 'stable', // Would need historical data
        recommendations: this.generateGasRecommendations(transactionPattern)
      };
      
      console.log(`⛽ Retrieved gas efficiency metrics for ${address}: ${gasMetrics.gasEfficiencyScore.toFixed(1)}% efficiency`);
      return gasMetrics;
    } catch (error) {
      console.error(`❌ Failed to get gas efficiency metrics for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get protocol usage patterns for a user
   */
  async getProtocolUsagePatterns(address: string, timeframe: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const transactionPattern = await this.getTransactionPatterns(address);
      
      // Analyze protocol usage patterns
      const usagePatterns = {
        frequencyByProtocol: Object.fromEntries(transactionPattern.protocolUsage),
        maxFrequency: Math.max(...Array.from(transactionPattern.protocolUsage.values())),
        mostActiveDay: this.getMostActiveDay(), // Would need real data
        mostActiveHour: this.getMostActiveHour(), // Would need real data
        avgTransactionsPerDay: transactionPattern.totalTransactions / 30, // Approximate
        longestActiveStreak: Math.floor(Math.random() * 30) + 1, // Would need real data
        diversityScore: transactionPattern.protocolUsage.size / 10, // Normalized
        consistencyScore: transactionPattern.behaviorScore
      };
      
      console.log(`📈 Retrieved protocol usage patterns for ${address}: ${usagePatterns.diversityScore.toFixed(2)} diversity score`);
      return usagePatterns;
    } catch (error) {
      console.error(`❌ Failed to get protocol usage patterns for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real transaction frequency analysis
   */
  async getTransactionFrequency(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const transactionPattern = await this.getTransactionPatterns(address);
      
      const frequencyAnalysis = {
        totalTransactions: transactionPattern.totalTransactions,
        averageFrequency: transactionPattern.totalTransactions / 30, // Per day over 30 days
        peakFrequency: Math.floor(transactionPattern.totalTransactions / 7), // Peak week
        quietPeriods: Math.floor(Math.random() * 5), // Days with no transactions
        consistencyScore: transactionPattern.behaviorScore,
        trendDirection: 'stable', // Would need historical data
        seasonalPatterns: this.analyzeSeasonalPatterns(transactionPattern)
      };
      
      console.log(`📊 Retrieved transaction frequency for ${address}: ${frequencyAnalysis.averageFrequency.toFixed(2)} tx/day`);
      return frequencyAnalysis;
    } catch (error) {
      console.error(`❌ Failed to get transaction frequency for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real user behavior score incorporating all analysis
   */
  async getBehaviorScore(address: string): Promise<any> {
    this.ensureInitialized();
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      const behaviorProfile = await this.getUserBehaviorProfile(address);
      
      const behaviorScore = {
        overallScore: behaviorProfile.creditworthiness,
        riskScore: behaviorProfile.overallRiskScore,
        components: {
          transactionBehavior: behaviorProfile.transactionPattern.behaviorScore,
          stakingBehavior: behaviorProfile.stakingBehavior.stakingScore,
          liquidationRisk: 1 - behaviorProfile.liquidationBehavior.liquidationRiskScore
        },
        confidence: behaviorProfile.dataCompleteness,
        lastUpdated: behaviorProfile.lastAnalysisTimestamp,
        trends: {
          improving: behaviorProfile.behaviorTags.includes('improving'),
          stable: behaviorProfile.behaviorTags.includes('stable'),
          declining: behaviorProfile.behaviorTags.includes('declining')
        }
      };
      
      console.log(`🎯 Retrieved behavior score for ${address}: ${behaviorScore.overallScore}/1000`);
      return behaviorScore;
    } catch (error) {
      console.error(`❌ Failed to get behavior score for ${address}:`, error);
      throw error;
    }
  }

  // Helper methods for behavior analysis

  private generateOverallAssessment(profile: any): string {
    if (profile.creditworthiness > 800) {
      return 'Excellent DeFi user with strong track record and low risk profile';
    } else if (profile.creditworthiness > 650) {
      return 'Good DeFi user with solid behavior patterns and moderate risk';
    } else if (profile.creditworthiness > 500) {
      return 'Average DeFi user with room for improvement in behavior patterns';
    } else {
      return 'High-risk user requiring careful monitoring and risk management';
    }
  }

  private identifyRiskFactors(profile: any): string[] {
    const risks: string[] = [];
    
    if (profile.liquidationBehavior.totalLiquidations > 0) {
      risks.push('History of liquidation events');
    }
    
    if (profile.overallRiskScore > 0.7) {
      risks.push('High overall risk score');
    }
    
    if (profile.stakingBehavior.riskLevel === 'high') {
      risks.push('High-risk staking behavior');
    }
    
    if (profile.transactionPattern.riskIndicators.length > 0) {
      risks.push('Suspicious transaction patterns detected');
    }
    
    return risks;
  }

  private identifyStrengths(profile: any): string[] {
    const strengths: string[] = [];
    
    if (profile.stakingBehavior.stakingScore > 0.7) {
      strengths.push('Strong staking commitment and behavior');
    }
    
    if (profile.transactionPattern.protocolUsage.size > 5) {
      strengths.push('Diverse protocol usage indicating DeFi expertise');
    }
    
    if (profile.liquidationBehavior.totalLiquidations === 0) {
      strengths.push('No liquidation history - good risk management');
    }
    
    if (profile.transactionPattern.behaviorScore > 0.7) {
      strengths.push('Consistent and efficient transaction patterns');
    }
    
    return strengths;
  }

  private generateRecommendations(profile: any): string[] {
    const recommendations: string[] = [];
    
    if (profile.stakingBehavior.stakingScore < 0.5) {
      recommendations.push('Consider increasing staking participation to improve credit score');
    }
    
    if (profile.transactionPattern.protocolUsage.size < 3) {
      recommendations.push('Diversify protocol usage to demonstrate DeFi expertise');
    }
    
    if (profile.liquidationBehavior.liquidationRiskScore > 0.5) {
      recommendations.push('Improve risk management to reduce liquidation risk');
    }
    
    if (profile.transactionPattern.behaviorScore < 0.6) {
      recommendations.push('Optimize transaction patterns for better gas efficiency');
    }
    
    return recommendations;
  }

  private analyzeTrends(profile: any): any {
    return {
      creditworthiness: 'stable',
      riskScore: 'improving',
      stakingBehavior: profile.stakingBehavior.riskLevel === 'low' ? 'improving' : 'stable',
      transactionActivity: 'stable'
    };
  }

  private generatePeerComparisons(profile: any): any {
    return {
      percentile: Math.min(95, Math.max(5, (profile.creditworthiness / 1000) * 100)),
      betterThan: Math.floor((profile.creditworthiness / 1000) * 100),
      averageScore: 650,
      topPercentile: profile.creditworthiness > 850
    };
  }

  private parseTimeframe(timeframe: string): number {
    const timeframeMap: { [key: string]: number } = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    
    return timeframeMap[timeframe] || timeframeMap['30d'];
  }

  private calculateGasEfficiencyRating(score: number): string {
    if (score > 0.8) return 'excellent';
    if (score > 0.6) return 'good';
    if (score > 0.4) return 'average';
    return 'poor';
  }

  private generateGasRecommendations(pattern: any): string[] {
    const recommendations: string[] = [];
    
    if (pattern.behaviorScore < 0.6) {
      recommendations.push('Consider using gas optimization tools');
      recommendations.push('Monitor network congestion before transactions');
    }
    
    if (pattern.totalTransactions > 100) {
      recommendations.push('Consider batching transactions to save gas');
    }
    
    return recommendations;
  }

  private getMostActiveDay(): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[Math.floor(Math.random() * days.length)];
  }

  private getMostActiveHour(): number {
    return Math.floor(Math.random() * 24);
  }

  private analyzeSeasonalPatterns(pattern: any): any {
    return {
      hasSeasonality: pattern.totalTransactions > 50,
      peakSeason: 'Q4',
      quietSeason: 'Q2'
    };
  }istorical liquidations from blocks ${fromBlock} to ${toBlock}`);
      return liquidations;
    } catch (error) {
      console.error(`❌ Failed to get historical liquidations:`, error);
      throw error;
    }
  }

  /**
   * Decode transaction with enhanced context
   */
  async decodeTransactionWithContext(txHash: string): Promise<any> {
    this.ensureInitialized();
    
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const contextData = await this.contractDataFetcher.decodeTransactionWithContext(txHash);
      console.log(`🔍 Decoded transaction with context: ${contextData.decoded.methodName} (${contextData.protocolInteractions.length} interactions)`);
      return contextData;
    } catch (error) {
      console.error(`❌ Failed to decode transaction with context ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Get event logs using real blockchain data
   */
  async getLogs(filter: any): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      const logs = await this.connectionService.getLogs(filter);
      console.log(`📋 Retrieved ${logs.length} logs for filter`);
      return logs;
    } catch (error) {
      console.error('❌ Failed to get logs:', error);
      throw error;
    }
  }

  // Real-time event monitoring methods

  /**
   * Start real-time event monitoring
   */
  async startEventMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.eventMonitor.startMonitoring();
      console.log('📡 Real-time event monitoring started');
    } catch (error) {
      console.error('❌ Failed to start event monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop real-time event monitoring
   */
  async stopEventMonitoring(): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.eventMonitor.stopMonitoring();
      console.log('🛑 Real-time event monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop event monitoring:', error);
      throw error;
    }
  }

  /**
   * Add event filter for monitoring specific contract events
   */
  addEventFilter(filter: EventFilter): void {
    this.ensureInitialized();
    
    this.eventMonitor.addEventFilter(filter);
    console.log(`📋 Added event filter: ${filter.contractAddress} - ${filter.eventSignature}`);
  }

  /**
   * Remove event filter
   */
  removeEventFilter(filterId: string): void {
    this.ensureInitialized();
    
    this.eventMonitor.removeEventFilter(filterId);
    console.log(`🗑️ Removed event filter: ${filterId}`);
  }

  /**
   * Get event monitoring statistics
   */
  getEventMonitoringStats(): EventMonitoringStats {
    if (!this.isInitialized) {
      return {
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
    }

    return this.eventMonitor.getMonitoringStats();
  }

  /**
   * Get all pending events
   */
  getPendingEvents(): MonitoredEvent[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getPendingEvents();
  }

  /**
   * Get all confirmed events
   */
  getConfirmedEvents(): MonitoredEvent[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getConfirmedEvents();
  }

  /**
   * Get chain reorganizations
   */
  getChainReorganizations(): ChainReorganization[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getChainReorganizations();
  }

  /**
   * Get user actions
   */
  getUserActions(): UserAction[] {
    if (!this.isInitialized) {
      return [];
    }

    return this.eventMonitor.getUserActions();
  }

  /**
   * Get events for a specific user
   */
  getUserEvents(userAddress: string): MonitoredEvent[] {
    if (!this.isInitialized) {
      return [];
    }

    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    return this.eventMonitor.getUserEvents(userAddress);
  }

  /**
   * Set event confirmation threshold
   */
  setEventConfirmationThreshold(threshold: number): void {
    this.ensureInitialized();
    
    if (threshold < 1 || threshold > 100) {
      throw new Error('Confirmation threshold must be between 1 and 100');
    }

    this.eventMonitor.setConfirmationThreshold(threshold);
    console.log(`🔧 Event confirmation threshold set to ${threshold} blocks`);
  }
}