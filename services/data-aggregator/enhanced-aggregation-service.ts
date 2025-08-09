// Enhanced Data Aggregation Service
// Orchestrates all data aggregation components and feeds processed data into CreditScore contract

import { ethers } from 'ethers';
import { EthereumTransactionMonitor, createEthereumMonitorConfig, MonitoredTransaction } from './ethereum-monitor';
import { TransactionCategorizer, CategorizedTransaction } from './transaction-categorizer';
import { PriceFeedService, createPriceFeedConfig } from './price-feed-service';
import { WalletLinkingService, createWalletLinkingConfig } from './wallet-linking-service';
import { DataValidationService, createValidationConfig, ValidationResult } from './data-validation-service';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface EnhancedAggregationConfig {
  ethereumMonitorConfig?: any;
  priceFeedConfig?: any;
  walletLinkingConfig?: any;
  validationConfig?: any;
  creditScoreContractAddress: string;
  scoringEngineRpcUrl: string;
  updateBatchSize: number;
  updateIntervalMs: number;
  enableRealTimeUpdates: boolean;
  enableBatchProcessing: boolean;
}

export interface ProcessedTransactionData {
  transaction: CategorizedTransaction;
  validation: ValidationResult;
  usdValue: number;
  primaryWallet: string;
  linkedWallets: string[];
  creditDimensionUpdates: CreditDimensionUpdate[];
}

export interface CreditDimensionUpdate {
  dimension: 'DEFI_RELIABILITY' | 'TRADING_CONSISTENCY' | 'STAKING_COMMITMENT' | 'GOVERNANCE_PARTICIPATION' | 'LIQUIDITY_PROVIDER';
  rawDataPoints: number[];
  weights: number[];
  userAddress: string;
}

export interface AggregationMetrics {
  transactionsProcessed: number;
  validTransactions: number;
  invalidTransactions: number;
  anomaliesDetected: number;
  contractUpdatesSuccessful: number;
  contractUpdatesFailed: number;
  lastProcessedBlock: number;
  lastUpdateTime: number;
  averageProcessingTime: number;
}

export class EnhancedDataAggregationService {
  private config: EnhancedAggregationConfig;
  private ethereumMonitor: EthereumTransactionMonitor;
  private transactionCategorizer: TransactionCategorizer;
  private priceFeedService: PriceFeedService;
  private walletLinkingService: WalletLinkingService;
  private validationService: DataValidationService;
  private creditScoreContract: ethers.Contract;
  private provider: ethers.providers.JsonRpcProvider;
  private signer?: ethers.Wallet;

  private isRunning: boolean = false;
  private processingQueue: MonitoredTransaction[] = [];
  private batchProcessingInterval: NodeJS.Timeout | null = null;
  private metrics: AggregationMetrics = {
    transactionsProcessed: 0,
    validTransactions: 0,
    invalidTransactions: 0,
    anomaliesDetected: 0,
    contractUpdatesSuccessful: 0,
    contractUpdatesFailed: 0,
    lastProcessedBlock: 0,
    lastUpdateTime: 0,
    averageProcessingTime: 0
  };

  // CreditScore contract ABI for scoring updates
  private readonly CREDIT_SCORE_ABI = [
    'function updateScoreDimension(address user, uint8 dimension, uint256[] calldata rawData, uint256[] calldata weights) external',
    'function createCreditProfile(address user) external',
    'function getCreditProfile(address user) external view returns (bool exists, address userAddress, uint256 lastUpdated)',
    'function getScoreDimension(address user, uint8 dimension) external view returns (uint256 score, uint256 confidence, uint256 dataPoints, uint8 trend, uint256 lastCalculated, bool hasInsufficientData)'
  ];

  constructor(config: EnhancedAggregationConfig) {
    this.config = config;
    this.initializeServices();
    this.initializeContract();
  }

  /**
   * Initialize all sub-services
   */
  private initializeServices(): void {
    // Initialize Ethereum monitor
    const ethereumConfig = this.config.ethereumMonitorConfig || createEthereumMonitorConfig();
    this.ethereumMonitor = new EthereumTransactionMonitor(ethereumConfig);

    // Initialize transaction categorizer
    this.transactionCategorizer = new TransactionCategorizer();

    // Initialize price feed service
    const priceFeedConfig = this.config.priceFeedConfig || createPriceFeedConfig();
    this.priceFeedService = new PriceFeedService(priceFeedConfig);

    // Initialize wallet linking service
    const walletLinkingConfig = this.config.walletLinkingConfig || createWalletLinkingConfig();
    walletLinkingConfig.contractAddress = this.config.creditScoreContractAddress;
    this.walletLinkingService = new WalletLinkingService(walletLinkingConfig);

    // Initialize validation service
    const validationConfig = this.config.validationConfig || createValidationConfig();
    this.validationService = new DataValidationService(validationConfig);
  }

  /**
   * Initialize contract connection
   */
  private initializeContract(): void {
    this.provider = new ethers.providers.JsonRpcProvider(this.config.scoringEngineRpcUrl);
    
    this.creditScoreContract = new ethers.Contract(
      this.config.creditScoreContractAddress,
      this.CREDIT_SCORE_ABI,
      this.provider
    );

    // Initialize signer if private key is available
    const privateKey = process.env.SCORING_ENGINE_PRIVATE_KEY;
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.creditScoreContract = this.creditScoreContract.connect(this.signer);
    }
  }

  /**
   * Start the enhanced data aggregation service
   */
  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        throw new Error('Enhanced data aggregation service is already running');
      }

      console.log('Starting enhanced data aggregation service...');

      // Start all sub-services
      await this.priceFeedService.start();
      await this.ethereumMonitor.startMonitoring();

      // Set up transaction processing
      this.setupTransactionProcessing();

      // Start batch processing if enabled
      if (this.config.enableBatchProcessing) {
        this.startBatchProcessing();
      }

      this.isRunning = true;
      console.log('Enhanced data aggregation service started successfully');
    } catch (error) {
      console.error('Failed to start enhanced data aggregation service:', formatError(error));
      throw error;
    }
  }

  /**
   * Stop the enhanced data aggregation service
   */
  public async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        return;
      }

      console.log('Stopping enhanced data aggregation service...');

      // Stop batch processing
      if (this.batchProcessingInterval) {
        clearInterval(this.batchProcessingInterval);
        this.batchProcessingInterval = null;
      }

      // Stop all sub-services
      await this.ethereumMonitor.stopMonitoring();
      await this.priceFeedService.stop();

      // Process remaining queue
      if (this.processingQueue.length > 0) {
        console.log(`Processing remaining ${this.processingQueue.length} transactions...`);
        await this.processBatch(this.processingQueue);
        this.processingQueue = [];
      }

      this.isRunning = false;
      console.log('Enhanced data aggregation service stopped');
    } catch (error) {
      console.error('Error stopping enhanced data aggregation service:', formatError(error));
      throw error;
    }
  }

  /**
   * Subscribe to wallet monitoring with enhanced processing
   */
  public subscribeToWallet(address: string): void {
    this.ethereumMonitor.subscribeToWallet(address, async (transaction) => {
      try {
        await this.processTransaction(transaction);
      } catch (error) {
        console.error(`Error processing transaction for ${address}:`, formatError(error));
      }
    });

    console.log(`Subscribed to enhanced monitoring for wallet: ${address}`);
  }

  /**
   * Unsubscribe from wallet monitoring
   */
  public unsubscribeFromWallet(address: string): void {
    this.ethereumMonitor.unsubscribeFromWallet(address);
    console.log(`Unsubscribed from monitoring for wallet: ${address}`);
  }

  /**
   * Setup transaction processing pipeline
   */
  private setupTransactionProcessing(): void {
    // Real-time processing is handled by individual wallet subscriptions
    // Batch processing is handled by the batch interval
    console.log('Transaction processing pipeline configured');
  }

  /**
   * Start batch processing interval
   */
  private startBatchProcessing(): void {
    this.batchProcessingInterval = setInterval(async () => {
      if (this.processingQueue.length >= this.config.updateBatchSize) {
        const batch = this.processingQueue.splice(0, this.config.updateBatchSize);
        try {
          await this.processBatch(batch);
        } catch (error) {
          console.error('Batch processing error:', formatError(error));
          // Re-queue failed transactions
          this.processingQueue.unshift(...batch);
        }
      }
    }, this.config.updateIntervalMs);

    console.log(`Batch processing started with ${this.config.updateBatchSize} transaction batches every ${this.config.updateIntervalMs}ms`);
  }

  /**
   * Process a single transaction through the complete pipeline
   */
  private async processTransaction(transaction: MonitoredTransaction): Promise<void> {
    const startTime = getCurrentTimestamp();

    try {
      // Step 1: Validate transaction
      const validation = await this.validationService.validateTransaction(transaction);
      
      if (!validation.isValid) {
        console.warn(`Invalid transaction ${transaction.hash}:`, validation.errors);
        this.metrics.invalidTransactions++;
        return;
      }

      if (validation.anomalyScore > 0.5) {
        this.metrics.anomaliesDetected++;
        console.warn(`Anomaly detected in transaction ${transaction.hash}:`, validation.warnings);
      }

      // Step 2: Categorize transaction
      const categorizedTx = this.transactionCategorizer.categorizeForCreditScoring(transaction);

      // Step 3: Get USD value
      const usdValue = await this.getTransactionUSDValue(categorizedTx);

      // Step 4: Resolve wallet linking
      const { primaryWallet, linkedWallets } = await this.resolveWalletLinking(categorizedTx.from);

      // Step 5: Update user transaction history for validation service
      this.validationService.updateUserHistory(categorizedTx);

      // Step 6: Generate credit dimension updates
      const creditUpdates = await this.generateCreditDimensionUpdates(categorizedTx, usdValue);

      // Step 7: Process updates
      const processedData: ProcessedTransactionData = {
        transaction: categorizedTx,
        validation,
        usdValue,
        primaryWallet,
        linkedWallets,
        creditDimensionUpdates: creditUpdates
      };

      if (this.config.enableRealTimeUpdates) {
        await this.updateCreditScores(processedData);
      } else {
        this.processingQueue.push(transaction);
      }

      // Update metrics
      this.metrics.transactionsProcessed++;
      this.metrics.validTransactions++;
      this.metrics.lastProcessedBlock = Math.max(this.metrics.lastProcessedBlock, transaction.blockNumber);
      this.metrics.lastUpdateTime = getCurrentTimestamp();
      
      const processingTime = getCurrentTimestamp() - startTime;
      this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime + processingTime) / 2;

    } catch (error) {
      console.error(`Error processing transaction ${transaction.hash}:`, formatError(error));
      this.metrics.invalidTransactions++;
    }
  }

  /**
   * Process a batch of transactions
   */
  private async processBatch(transactions: MonitoredTransaction[]): Promise<void> {
    console.log(`Processing batch of ${transactions.length} transactions`);

    const processedData: ProcessedTransactionData[] = [];

    // Process all transactions in the batch
    for (const transaction of transactions) {
      try {
        const validation = await this.validationService.validateTransaction(transaction);
        if (!validation.isValid) continue;

        const categorizedTx = this.transactionCategorizer.categorizeForCreditScoring(transaction);
        const usdValue = await this.getTransactionUSDValue(categorizedTx);
        const { primaryWallet, linkedWallets } = await this.resolveWalletLinking(categorizedTx.from);
        const creditUpdates = await this.generateCreditDimensionUpdates(categorizedTx, usdValue);

        processedData.push({
          transaction: categorizedTx,
          validation,
          usdValue,
          primaryWallet,
          linkedWallets,
          creditDimensionUpdates: creditUpdates
        });

        this.validationService.updateUserHistory(categorizedTx);
      } catch (error) {
        console.error(`Error processing transaction in batch ${transaction.hash}:`, formatError(error));
      }
    }

    // Batch update credit scores
    await this.batchUpdateCreditScores(processedData);
  }

  /**
   * Get USD value for a transaction
   */
  private async getTransactionUSDValue(transaction: CategorizedTransaction): Promise<number> {
    try {
      // Try to get USD value using price feed service
      const tokenSymbol = this.inferTokenSymbol(transaction);
      return await this.priceFeedService.convertToUSD(tokenSymbol, transaction.value);
    } catch (error) {
      console.warn(`Failed to get USD value for transaction ${transaction.hash}:`, formatError(error));
      return 0;
    }
  }

  /**
   * Resolve wallet linking for a transaction
   */
  private async resolveWalletLinking(walletAddress: string): Promise<{
    primaryWallet: string;
    linkedWallets: string[];
  }> {
    try {
      // Check if this wallet is linked to a primary wallet
      const primaryWallet = await this.walletLinkingService.findPrimaryWallet(walletAddress) || walletAddress;
      
      // Get all linked wallets for the primary wallet
      const linkInfo = await this.walletLinkingService.getLinkedWallets(primaryWallet);
      
      return {
        primaryWallet,
        linkedWallets: linkInfo.linkedWallets
      };
    } catch (error) {
      console.warn(`Failed to resolve wallet linking for ${walletAddress}:`, formatError(error));
      return {
        primaryWallet: walletAddress,
        linkedWallets: []
      };
    }
  }

  /**
   * Generate credit dimension updates from transaction data
   */
  private async generateCreditDimensionUpdates(
    transaction: CategorizedTransaction,
    usdValue: number
  ): Promise<CreditDimensionUpdate[]> {
    const updates: CreditDimensionUpdate[] = [];
    const dimensions = transaction.creditDimensions;

    // Convert credit dimension mappings to contract updates
    const dimensionMappings: Array<{
      key: keyof typeof dimensions;
      contractDimension: CreditDimensionUpdate['dimension'];
    }> = [
      { key: 'defiReliability', contractDimension: 'DEFI_RELIABILITY' },
      { key: 'tradingConsistency', contractDimension: 'TRADING_CONSISTENCY' },
      { key: 'stakingCommitment', contractDimension: 'STAKING_COMMITMENT' },
      { key: 'governanceParticipation', contractDimension: 'GOVERNANCE_PARTICIPATION' },
      { key: 'liquidityProvider', contractDimension: 'LIQUIDITY_PROVIDER' }
    ];

    for (const mapping of dimensionMappings) {
      const dimensionValue = dimensions[mapping.key];
      
      if (dimensionValue > 0) {
        // Create raw data points based on transaction characteristics
        const rawDataPoints = [
          Math.round(dimensionValue * 1000), // Base score (0-1000)
          Math.round(usdValue), // USD value
          Math.round(transaction.dataWeight * 100), // Data weight
          Math.round(transaction.riskScore * 100) // Risk score
        ];

        // Create weights based on transaction category and protocol
        const weights = [
          100, // Base weight
          Math.min(100, Math.round(usdValue / 1000)), // Value-based weight
          Math.round(transaction.dataWeight * 50), // Data weight factor
          Math.max(10, 100 - Math.round(transaction.riskScore * 50)) // Risk-adjusted weight
        ];

        updates.push({
          dimension: mapping.contractDimension,
          rawDataPoints,
          weights,
          userAddress: transaction.from
        });
      }
    }

    return updates;
  }

  /**
   * Update credit scores in the contract
   */
  private async updateCreditScores(processedData: ProcessedTransactionData): Promise<void> {
    if (!this.signer) {
      console.warn('No signer available for contract updates');
      return;
    }

    try {
      // Ensure user has a credit profile
      await this.ensureCreditProfile(processedData.primaryWallet);

      // Update each credit dimension
      for (const update of processedData.creditDimensionUpdates) {
        try {
          const dimensionIndex = this.getDimensionIndex(update.dimension);
          
          const tx = await this.creditScoreContract.updateScoreDimension(
            processedData.primaryWallet,
            dimensionIndex,
            update.rawDataPoints,
            update.weights,
            {
              gasLimit: 300000,
              maxFeePerGas: ethers.utils.parseUnits('50', 'gwei')
            }
          );

          console.log(`Updated ${update.dimension} for ${processedData.primaryWallet}, tx: ${tx.hash}`);
          await tx.wait();
          
          this.metrics.contractUpdatesSuccessful++;
        } catch (error) {
          console.error(`Failed to update ${update.dimension} for ${processedData.primaryWallet}:`, formatError(error));
          this.metrics.contractUpdatesFailed++;
        }
      }
    } catch (error) {
      console.error(`Error updating credit scores for ${processedData.primaryWallet}:`, formatError(error));
      this.metrics.contractUpdatesFailed++;
    }
  }

  /**
   * Batch update credit scores for multiple processed transactions
   */
  private async batchUpdateCreditScores(processedDataArray: ProcessedTransactionData[]): Promise<void> {
    if (!this.signer) {
      console.warn('No signer available for batch contract updates');
      return;
    }

    // Group updates by user and dimension
    const updatesByUser = new Map<string, Map<string, CreditDimensionUpdate>>();

    for (const processedData of processedDataArray) {
      const userAddress = processedData.primaryWallet;
      
      if (!updatesByUser.has(userAddress)) {
        updatesByUser.set(userAddress, new Map());
      }

      const userUpdates = updatesByUser.get(userAddress)!;

      for (const update of processedData.creditDimensionUpdates) {
        const existing = userUpdates.get(update.dimension);
        
        if (existing) {
          // Merge updates for the same dimension
          existing.rawDataPoints.push(...update.rawDataPoints);
          existing.weights.push(...update.weights);
        } else {
          userUpdates.set(update.dimension, { ...update });
        }
      }
    }

    // Process updates for each user
    for (const [userAddress, userUpdates] of updatesByUser.entries()) {
      try {
        await this.ensureCreditProfile(userAddress);

        for (const [dimension, update] of userUpdates.entries()) {
          try {
            const dimensionIndex = this.getDimensionIndex(update.dimension);
            
            const tx = await this.creditScoreContract.updateScoreDimension(
              userAddress,
              dimensionIndex,
              update.rawDataPoints,
              update.weights,
              {
                gasLimit: 400000,
                maxFeePerGas: ethers.utils.parseUnits('50', 'gwei')
              }
            );

            console.log(`Batch updated ${dimension} for ${userAddress}, tx: ${tx.hash}`);
            await tx.wait();
            
            this.metrics.contractUpdatesSuccessful++;
          } catch (error) {
            console.error(`Failed to batch update ${dimension} for ${userAddress}:`, formatError(error));
            this.metrics.contractUpdatesFailed++;
          }
        }
      } catch (error) {
        console.error(`Error in batch update for ${userAddress}:`, formatError(error));
      }
    }

    console.log(`Completed batch update for ${updatesByUser.size} users`);
  }

  /**
   * Ensure user has a credit profile
   */
  private async ensureCreditProfile(userAddress: string): Promise<void> {
    try {
      const profile = await this.creditScoreContract.getCreditProfile(userAddress);
      
      if (!profile.exists) {
        console.log(`Creating credit profile for ${userAddress}`);
        const tx = await this.creditScoreContract.createCreditProfile(userAddress, {
          gasLimit: 200000,
          maxFeePerGas: ethers.utils.parseUnits('50', 'gwei')
        });
        await tx.wait();
        console.log(`Created credit profile for ${userAddress}, tx: ${tx.hash}`);
      }
    } catch (error) {
      console.error(`Error ensuring credit profile for ${userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get dimension index for contract calls
   */
  private getDimensionIndex(dimension: CreditDimensionUpdate['dimension']): number {
    const dimensionMap = {
      'DEFI_RELIABILITY': 0,
      'TRADING_CONSISTENCY': 1,
      'STAKING_COMMITMENT': 2,
      'GOVERNANCE_PARTICIPATION': 3,
      'LIQUIDITY_PROVIDER': 4
    };
    return dimensionMap[dimension];
  }

  /**
   * Infer token symbol from transaction (simplified)
   */
  private inferTokenSymbol(transaction: CategorizedTransaction): string {
    // Simplified logic - in practice, would analyze transaction data
    if (transaction.to === '0x0000000000000000000000000000000000000000') {
      return 'ETH';
    }
    return 'ETH'; // Default to ETH for now
  }

  /**
   * Get service metrics
   */
  public getMetrics(): AggregationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    isRunning: boolean;
    queueSize: number;
    subServices: {
      ethereumMonitor: any;
      priceFeed: any;
      walletLinking: any;
      validation: any;
    };
    metrics: AggregationMetrics;
  } {
    return {
      isRunning: this.isRunning,
      queueSize: this.processingQueue.length,
      subServices: {
        ethereumMonitor: this.ethereumMonitor.getMonitoringStatus(),
        priceFeed: this.priceFeedService.getServiceStatus(),
        walletLinking: this.walletLinkingService.getServiceStatus(),
        validation: this.validationService.getServiceStatus()
      },
      metrics: this.getMetrics()
    };
  }

  /**
   * Health check for the entire service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const subServiceChecks = await Promise.allSettled([
        this.priceFeedService.healthCheck(),
        this.walletLinkingService.healthCheck()
      ]);

      const ethereumStatus = this.ethereumMonitor.getMonitoringStatus();
      const validationStatus = this.validationService.getServiceStatus();

      const allHealthy = this.isRunning &&
                        ethereumStatus.isConnected &&
                        subServiceChecks.every(check => 
                          check.status === 'fulfilled' && check.value.status === 'healthy'
                        );

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: {
          isRunning: this.isRunning,
          queueSize: this.processingQueue.length,
          ethereumMonitor: ethereumStatus,
          priceFeed: subServiceChecks[0].status === 'fulfilled' ? subServiceChecks[0].value : { status: 'error' },
          walletLinking: subServiceChecks[1].status === 'fulfilled' ? subServiceChecks[1].value : { status: 'error' },
          validation: validationStatus,
          metrics: this.getMetrics(),
          lastHealthCheck: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: formatError(error),
          lastHealthCheck: new Date().toISOString()
        }
      };
    }
  }
}

// Export configuration factory
export function createEnhancedAggregationConfig(): EnhancedAggregationConfig {
  return {
    creditScoreContractAddress: process.env.CREDIT_SCORE_CONTRACT_ADDRESS || '',
    scoringEngineRpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    updateBatchSize: 10,
    updateIntervalMs: 60000, // 1 minute
    enableRealTimeUpdates: true,
    enableBatchProcessing: true
  };
}