import { EventEmitter } from 'events';
import { RealBlockchainDataManager } from './blockchain-data-manager';
import { RealContractManager } from './contract-manager';
import {
  EthereumTransaction,
  TransactionReceipt,
  DecodedTransaction,
  ProtocolInteraction,
  REAL_CONTRACT_ADDRESSES,
  EVENT_SIGNATURES,
  METHOD_SIGNATURES
} from './types';

export interface TransactionAnalysis {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string | null;
  value: string;
  gasUsed: string;
  gasPrice: string;
  gasAnalysis: GasAnalysis;
  category: TransactionCategory;
  protocolInteractions: ProtocolInteraction[];
  decodedData?: DecodedTransaction;
  riskScore: number;
  creditImpact: CreditImpact;
}

export interface GasAnalysis {
  gasUsed: string;
  gasPrice: string;
  gasCost: string; // gasUsed * gasPrice
  gasEfficiency: 'low' | 'medium' | 'high';
  isHighPriority: boolean;
  gasPricePercentile: number; // Compared to network average
}

export interface TransactionCategory {
  primary: string;
  secondary?: string;
  confidence: number;
  tags: string[];
}

export interface CreditImpact {
  score: number; // -1 to 1 scale
  factors: string[];
  reasoning: string;
}

export interface TransactionPattern {
  userAddress: string;
  totalTransactions: number;
  avgGasPrice: string;
  totalGasUsed: string;
  protocolUsage: Map<string, number>;
  riskIndicators: string[];
  behaviorScore: number;
}

/**
 * Real Transaction Analyzer
 * Replaces mock transaction processing with real blockchain data analysis
 */
export class RealTransactionAnalyzer extends EventEmitter {
  private blockchainManager: RealBlockchainDataManager;
  private contractManager: RealContractManager;
  private gasBaseline: Map<string, number> = new Map();
  private networkGasStats: { average: number; median: number; high: number } = {
    average: 0,
    median: 0,
    high: 0
  };

  constructor(blockchainManager: RealBlockchainDataManager, contractManager: RealContractManager) {
    super();
    this.blockchainManager = blockchainManager;
    this.contractManager = contractManager;
    this.initializeGasBaselines();
  }

  /**
   * Analyze a real transaction using actual blockchain data
   */
  async analyzeTransaction(txHash: string): Promise<TransactionAnalysis> {
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      // Fetch real transaction and receipt data
      const [transaction, receipt] = await Promise.all([
        this.blockchainManager.getTransaction(txHash),
        this.blockchainManager.getTransactionReceipt(txHash)
      ]);

      // Get block timestamp for accurate timing
      const block = await this.blockchainManager.getBlockByNumber(transaction.blockNumber);
      
      // Perform comprehensive analysis
      const gasAnalysis = await this.analyzeGasUsage(transaction, receipt);
      const category = await this.categorizeTransaction(transaction, receipt);
      const protocolInteractions = await this.extractProtocolInteractions(receipt);
      const decodedData = await this.decodeTransactionData(transaction);
      const riskScore = await this.calculateRiskScore(transaction, receipt, protocolInteractions);
      const creditImpact = this.calculateCreditImpact(transaction, category, protocolInteractions, riskScore);

      const analysis: TransactionAnalysis = {
        hash: transaction.hash,
        blockNumber: transaction.blockNumber,
        timestamp: block.timestamp,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        gasUsed: receipt.gasUsed,
        gasPrice: transaction.gasPrice,
        gasAnalysis,
        category,
        protocolInteractions,
        decodedData,
        riskScore,
        creditImpact
      };

      console.log(`🔍 Analyzed transaction ${txHash}: ${category.primary} (Risk: ${riskScore.toFixed(2)})`);
      this.emit('transactionAnalyzed', analysis);

      return analysis;

    } catch (error) {
      console.error(`❌ Failed to analyze transaction ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Analyze real gas usage patterns using actual gasUsed and gasPrice
   */
  private async analyzeGasUsage(transaction: EthereumTransaction, receipt: TransactionReceipt): Promise<GasAnalysis> {
    const gasUsed = BigInt(receipt.gasUsed);
    const gasPrice = BigInt(transaction.gasPrice);
    const gasCost = gasUsed * gasPrice;

    // Update network gas statistics
    await this.updateNetworkGasStats(Number(gasPrice));

    // Determine gas efficiency based on transaction type
    const gasEfficiency = this.determineGasEfficiency(gasUsed, transaction.to);
    
    // Check if this is a high priority transaction
    const isHighPriority = Number(gasPrice) > this.networkGasStats.high;
    
    // Calculate gas price percentile
    const gasPricePercentile = this.calculateGasPricePercentile(Number(gasPrice));

    return {
      gasUsed: receipt.gasUsed,
      gasPrice: transaction.gasPrice,
      gasCost: gasCost.toString(),
      gasEfficiency,
      isHighPriority,
      gasPricePercentile
    };
  }

  /**
   * Categorize real transactions using actual method signature decoding
   */
  private async categorizeTransaction(transaction: EthereumTransaction, receipt: TransactionReceipt): Promise<TransactionCategory> {
    let primary = 'unknown';
    let secondary: string | undefined;
    let confidence = 0.5;
    const tags: string[] = [];

    // Check if it's a simple ETH transfer
    if (!transaction.to) {
      primary = 'contract_creation';
      confidence = 1.0;
      tags.push('deployment');
    } else if (transaction.input === '0x' || transaction.input === '0x0') {
      primary = 'eth_transfer';
      confidence = 1.0;
      tags.push('simple_transfer');
    } else {
      // Decode method signature for contract interactions
      const methodId = transaction.input.slice(0, 10);
      const contractCategory = await this.categorizeByMethodSignature(methodId, transaction.to);
      
      if (contractCategory) {
        primary = contractCategory.primary;
        secondary = contractCategory.secondary;
        confidence = contractCategory.confidence;
        tags.push(...contractCategory.tags);
      }

      // Additional categorization based on event logs
      const eventCategory = this.categorizeByEventLogs(receipt.logs);
      if (eventCategory) {
        if (confidence < eventCategory.confidence) {
          primary = eventCategory.primary;
          secondary = eventCategory.secondary;
          confidence = eventCategory.confidence;
        }
        tags.push(...eventCategory.tags);
      }
    }

    // Add value-based tags
    const value = BigInt(transaction.value);
    if (value > 0) {
      tags.push('has_value');
      if (value > BigInt('1000000000000000000')) { // > 1 ETH
        tags.push('high_value');
      }
    }

    // Add gas-based tags
    const gasUsed = BigInt(receipt.gasUsed);
    if (gasUsed > BigInt('200000')) {
      tags.push('complex_transaction');
    }

    return {
      primary,
      secondary,
      confidence,
      tags: [...new Set(tags)] // Remove duplicates
    };
  }

  /**
   * Categorize transaction by method signature
   */
  private async categorizeByMethodSignature(methodId: string, contractAddress: string): Promise<TransactionCategory | null> {
    // Check Uniswap V3 methods
    for (const [method, signature] of Object.entries(METHOD_SIGNATURES.UNISWAP_V3)) {
      if (methodId === signature) {
        return {
          primary: 'defi_swap',
          secondary: 'uniswap_v3',
          confidence: 0.9,
          tags: ['uniswap', 'dex', 'swap', method.toLowerCase()]
        };
      }
    }

    // Check Aave V3 methods
    for (const [method, signature] of Object.entries(METHOD_SIGNATURES.AAVE_V3)) {
      if (methodId === signature) {
        return {
          primary: 'defi_lending',
          secondary: 'aave_v3',
          confidence: 0.9,
          tags: ['aave', 'lending', method.toLowerCase()]
        };
      }
    }

    // Check Compound methods
    for (const [method, signature] of Object.entries(METHOD_SIGNATURES.COMPOUND)) {
      if (methodId === signature) {
        return {
          primary: 'defi_lending',
          secondary: 'compound',
          confidence: 0.9,
          tags: ['compound', 'lending', method.toLowerCase()]
        };
      }
    }

    // Check if it's a known contract address
    const contractInfo = this.getContractInfo(contractAddress);
    if (contractInfo) {
      return {
        primary: contractInfo.category,
        secondary: contractInfo.protocol,
        confidence: 0.8,
        tags: [contractInfo.protocol, contractInfo.category]
      };
    }

    return null;
  }

  /**
   * Categorize transaction by event logs
   */
  private categorizeByEventLogs(logs: any[]): TransactionCategory | null {
    for (const log of logs) {
      const eventSignature = log.topics[0];

      // Check Uniswap V3 events
      for (const [event, signature] of Object.entries(EVENT_SIGNATURES.UNISWAP_V3)) {
        if (eventSignature === signature) {
          return {
            primary: 'defi_swap',
            secondary: 'uniswap_v3',
            confidence: 0.95,
            tags: ['uniswap', 'dex', event.toLowerCase()]
          };
        }
      }

      // Check Aave V3 events
      for (const [event, signature] of Object.entries(EVENT_SIGNATURES.AAVE_V3)) {
        if (eventSignature === signature) {
          return {
            primary: 'defi_lending',
            secondary: 'aave_v3',
            confidence: 0.95,
            tags: ['aave', 'lending', event.toLowerCase()]
          };
        }
      }

      // Check Compound events
      for (const [event, signature] of Object.entries(EVENT_SIGNATURES.COMPOUND)) {
        if (eventSignature === signature) {
          return {
            primary: 'defi_lending',
            secondary: 'compound',
            confidence: 0.95,
            tags: ['compound', 'lending', event.toLowerCase()]
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract real protocol interactions using actual contract addresses and events
   */
  private async extractProtocolInteractions(receipt: TransactionReceipt): Promise<ProtocolInteraction[]> {
    const interactions: ProtocolInteraction[] = [];

    for (const log of receipt.logs) {
      const contractAddress = log.address.toLowerCase();
      const eventSignature = log.topics[0];

      // Check if this is a known protocol contract
      const protocolInfo = this.getProtocolFromAddress(contractAddress);
      if (!protocolInfo) continue;

      // Decode the event based on the signature
      const interaction = await this.decodeProtocolEvent(log, protocolInfo);
      if (interaction) {
        interactions.push(interaction);
      }
    }

    return interactions;
  }

  /**
   * Decode transaction data using real contract ABIs
   */
  private async decodeTransactionData(transaction: EthereumTransaction): Promise<DecodedTransaction | undefined> {
    if (!transaction.to || transaction.input === '0x' || transaction.input === '0x0') {
      return undefined;
    }

    try {
      return await this.contractManager.decodeTransactionData(transaction.input, transaction.to);
    } catch (error) {
      console.warn(`⚠️ Could not decode transaction data for ${transaction.hash}:`, error);
      return undefined;
    }
  }

  /**
   * Calculate risk score based on real transaction data
   */
  private async calculateRiskScore(
    transaction: EthereumTransaction,
    receipt: TransactionReceipt,
    protocolInteractions: ProtocolInteraction[]
  ): Promise<number> {
    let riskScore = 0;

    // Gas price risk (high gas prices might indicate MEV or urgency)
    const gasPrice = Number(transaction.gasPrice);
    if (gasPrice > this.networkGasStats.high * 2) {
      riskScore += 0.3;
    }

    // Transaction failure risk
    if (receipt.status === 0) {
      riskScore += 0.5;
    }

    // Complex transaction risk (high gas usage)
    const gasUsed = Number(receipt.gasUsed);
    if (gasUsed > 500000) {
      riskScore += 0.2;
    }

    // Protocol interaction risk
    for (const interaction of protocolInteractions) {
      if (interaction.protocol === 'compound' || interaction.protocol === 'aave') {
        if (interaction.action === 'liquidation') {
          riskScore += 0.4;
        } else if (interaction.action === 'borrow') {
          riskScore += 0.1;
        }
      }
    }

    // Contract creation risk
    if (!transaction.to) {
      riskScore += 0.2;
    }

    // High value transaction risk
    const value = BigInt(transaction.value);
    if (value > BigInt('10000000000000000000')) { // > 10 ETH
      riskScore += 0.1;
    }

    return Math.min(1, riskScore);
  }

  /**
   * Calculate credit impact based on transaction analysis
   */
  private calculateCreditImpact(
    transaction: EthereumTransaction,
    category: TransactionCategory,
    protocolInteractions: ProtocolInteraction[],
    riskScore: number
  ): CreditImpact {
    let score = 0;
    const factors: string[] = [];
    let reasoning = '';

    // Positive impacts
    if (category.primary === 'defi_lending' && protocolInteractions.some(i => i.action === 'supply')) {
      score += 0.3;
      factors.push('DeFi lending supply');
      reasoning += 'Supplied assets to lending protocol. ';
    }

    if (category.primary === 'defi_swap' && category.tags.includes('uniswap')) {
      score += 0.1;
      factors.push('DEX usage');
      reasoning += 'Used decentralized exchange. ';
    }

    // Negative impacts
    if (riskScore > 0.5) {
      score -= 0.2;
      factors.push('High risk transaction');
      reasoning += 'Transaction flagged as high risk. ';
    }

    if (protocolInteractions.some(i => i.action === 'liquidation')) {
      score -= 0.5;
      factors.push('Liquidation event');
      reasoning += 'Involved in liquidation event. ';
    }

    // Gas efficiency impact
    const gasUsed = BigInt(transaction.gasPrice);
    if (gasUsed > BigInt('100000000000')) { // > 100 gwei
      score -= 0.1;
      factors.push('High gas price');
      reasoning += 'Used high gas price. ';
    }

    return {
      score: Math.max(-1, Math.min(1, score)),
      factors,
      reasoning: reasoning.trim()
    };
  }  /**
   
* Analyze user behavior patterns using real transaction history
   */
  async analyzeUserBehavior(userAddress: string, fromBlock?: number, toBlock?: number): Promise<TransactionPattern> {
    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    try {
      // Get user's transaction history
      const transactions = await this.getUserTransactionHistory(userAddress, fromBlock, toBlock);
      
      let totalGasUsed = BigInt(0);
      let totalGasPrice = BigInt(0);
      const protocolUsage = new Map<string, number>();
      const riskIndicators: string[] = [];

      for (const tx of transactions) {
        const analysis = await this.analyzeTransaction(tx.hash);
        
        totalGasUsed += BigInt(analysis.gasUsed);
        totalGasPrice += BigInt(analysis.gasPrice);

        // Track protocol usage
        for (const interaction of analysis.protocolInteractions) {
          const current = protocolUsage.get(interaction.protocol) || 0;
          protocolUsage.set(interaction.protocol, current + 1);
        }

        // Collect risk indicators
        if (analysis.riskScore > 0.5) {
          riskIndicators.push(`High risk transaction: ${tx.hash}`);
        }
        
        if (analysis.category.tags.includes('liquidation')) {
          riskIndicators.push(`Liquidation event: ${tx.hash}`);
        }
      }

      const avgGasPrice = transactions.length > 0 ? 
        (totalGasPrice / BigInt(transactions.length)).toString() : '0';

      const behaviorScore = this.calculateBehaviorScore(transactions.length, protocolUsage, riskIndicators);

      return {
        userAddress,
        totalTransactions: transactions.length,
        avgGasPrice,
        totalGasUsed: totalGasUsed.toString(),
        protocolUsage,
        riskIndicators,
        behaviorScore
      };

    } catch (error) {
      console.error(`❌ Failed to analyze user behavior for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get user transaction history from blockchain
   */
  private async getUserTransactionHistory(
    userAddress: string, 
    fromBlock?: number, 
    toBlock?: number
  ): Promise<EthereumTransaction[]> {
    // This would typically involve scanning blocks or using an indexing service
    // For now, we'll use the transaction monitor's backfill functionality
    
    const currentBlock = await this.blockchainManager.getCurrentBlock();
    const startBlock = fromBlock || Math.max(0, currentBlock - 10000); // Last ~10k blocks
    const endBlock = toBlock || currentBlock;

    // Add address to monitor temporarily
    await this.blockchainManager.addAddressToMonitor(userAddress);

    // Backfill transactions for this address
    await this.blockchainManager.backfillTransactions({
      fromBlock: startBlock,
      toBlock: endBlock,
      addresses: [userAddress],
      batchSize: 100,
      delayMs: 500
    });

    // Get the transactions from the monitor
    const confirmedTxs = this.blockchainManager.getConfirmedTransactions();
    const userTxs = confirmedTxs.filter(tx => 
      tx.from.toLowerCase() === userAddress.toLowerCase() || 
      (tx.to && tx.to.toLowerCase() === userAddress.toLowerCase())
    );

    // Convert to EthereumTransaction format
    const transactions: EthereumTransaction[] = [];
    for (const tx of userTxs) {
      try {
        const fullTx = await this.blockchainManager.getTransaction(tx.hash);
        transactions.push(fullTx);
      } catch (error) {
        console.warn(`⚠️ Could not fetch full transaction data for ${tx.hash}`);
      }
    }

    return transactions;
  }

  /**
   * Calculate behavior score based on transaction patterns
   */
  private calculateBehaviorScore(
    totalTransactions: number,
    protocolUsage: Map<string, number>,
    riskIndicators: string[]
  ): number {
    let score = 0.5; // Base score

    // Transaction volume impact
    if (totalTransactions > 100) {
      score += 0.2;
    } else if (totalTransactions > 50) {
      score += 0.1;
    } else if (totalTransactions < 10) {
      score -= 0.1;
    }

    // Protocol diversity impact
    const protocolCount = protocolUsage.size;
    if (protocolCount > 5) {
      score += 0.2;
    } else if (protocolCount > 2) {
      score += 0.1;
    }

    // DeFi usage impact
    const defiProtocols = ['uniswap', 'aave', 'compound', 'maker'];
    const defiUsage = Array.from(protocolUsage.keys()).filter(p => 
      defiProtocols.includes(p)
    ).length;
    
    if (defiUsage > 0) {
      score += 0.1 * defiUsage;
    }

    // Risk indicators impact
    const riskPenalty = Math.min(0.3, riskIndicators.length * 0.05);
    score -= riskPenalty;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Initialize gas baselines for different transaction types
   */
  private initializeGasBaselines(): void {
    // Typical gas usage for different operations
    this.gasBaseline.set('eth_transfer', 21000);
    this.gasBaseline.set('erc20_transfer', 65000);
    this.gasBaseline.set('uniswap_swap', 150000);
    this.gasBaseline.set('aave_supply', 200000);
    this.gasBaseline.set('aave_borrow', 250000);
    this.gasBaseline.set('compound_mint', 180000);
    this.gasBaseline.set('compound_redeem', 120000);
  }

  /**
   * Update network gas statistics
   */
  private async updateNetworkGasStats(gasPrice: number): Promise<void> {
    // This would typically involve tracking gas prices over time
    // For now, we'll use simple heuristics
    
    if (this.networkGasStats.average === 0) {
      // Initialize with current gas price
      this.networkGasStats.average = gasPrice;
      this.networkGasStats.median = gasPrice;
      this.networkGasStats.high = gasPrice * 2;
    } else {
      // Simple moving average update
      this.networkGasStats.average = (this.networkGasStats.average * 0.9) + (gasPrice * 0.1);
      this.networkGasStats.high = Math.max(this.networkGasStats.high, gasPrice);
    }
  }

  /**
   * Determine gas efficiency based on usage and transaction type
   */
  private determineGasEfficiency(gasUsed: bigint, contractAddress: string | null): 'low' | 'medium' | 'high' {
    const gasUsedNum = Number(gasUsed);

    // Simple ETH transfer
    if (!contractAddress) {
      return gasUsedNum <= 21000 ? 'high' : 'low';
    }

    // Contract interactions
    if (gasUsedNum < 100000) {
      return 'high';
    } else if (gasUsedNum < 300000) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate gas price percentile compared to network
   */
  private calculateGasPricePercentile(gasPrice: number): number {
    if (this.networkGasStats.average === 0) {
      return 50; // Default to median
    }

    const ratio = gasPrice / this.networkGasStats.average;
    
    if (ratio < 0.5) return 10;
    if (ratio < 0.8) return 25;
    if (ratio < 1.2) return 50;
    if (ratio < 2.0) return 75;
    return 90;
  }

  /**
   * Get contract information from address
   */
  private getContractInfo(address: string): { category: string; protocol: string } | null {
    const addr = address.toLowerCase();

    // Check Uniswap V3 contracts
    for (const [key, contractAddr] of Object.entries(REAL_CONTRACT_ADDRESSES.UNISWAP_V3)) {
      if (contractAddr.toLowerCase() === addr) {
        return { category: 'defi_swap', protocol: 'uniswap_v3' };
      }
    }

    // Check Aave V3 contracts
    for (const [key, contractAddr] of Object.entries(REAL_CONTRACT_ADDRESSES.AAVE_V3)) {
      if (contractAddr.toLowerCase() === addr) {
        return { category: 'defi_lending', protocol: 'aave_v3' };
      }
    }

    // Check Compound contracts
    for (const [key, contractAddr] of Object.entries(REAL_CONTRACT_ADDRESSES.COMPOUND)) {
      if (contractAddr.toLowerCase() === addr) {
        return { category: 'defi_lending', protocol: 'compound' };
      }
    }

    // Check Chainlink contracts
    for (const [key, contractAddr] of Object.entries(REAL_CONTRACT_ADDRESSES.CHAINLINK)) {
      if (contractAddr.toLowerCase() === addr) {
        return { category: 'oracle', protocol: 'chainlink' };
      }
    }

    return null;
  }

  /**
   * Get protocol information from contract address
   */
  private getProtocolFromAddress(address: string): string | null {
    const contractInfo = this.getContractInfo(address);
    return contractInfo?.protocol || null;
  }

  /**
   * Decode protocol event from log
   */
  private async decodeProtocolEvent(log: any, protocol: string): Promise<ProtocolInteraction | null> {
    const eventSignature = log.topics[0];
    
    try {
      // This would involve actual ABI decoding
      // For now, we'll create basic interactions based on known signatures
      
      if (protocol === 'uniswap_v3' && eventSignature === EVENT_SIGNATURES.UNISWAP_V3.SWAP) {
        return {
          protocol: 'uniswap_v3',
          action: 'swap',
          tokens: [], // Would be decoded from log data
          amounts: [], // Would be decoded from log data
          user: log.topics[1] || '', // Typically the user address
          timestamp: Date.now(),
          transactionHash: log.transactionHash,
          gasUsed: '0' // Would be filled from transaction receipt
        };
      }

      if (protocol === 'aave_v3' && eventSignature === EVENT_SIGNATURES.AAVE_V3.SUPPLY) {
        return {
          protocol: 'aave_v3',
          action: 'supply',
          tokens: [],
          amounts: [],
          user: log.topics[1] || '',
          timestamp: Date.now(),
          transactionHash: log.transactionHash,
          gasUsed: '0'
        };
      }

      // Add more protocol event decodings as needed

    } catch (error) {
      console.warn(`⚠️ Could not decode protocol event:`, error);
    }

    return null;
  }

  /**
   * Get comprehensive transaction statistics
   */
  getAnalysisStats(): {
    totalAnalyzed: number;
    categoryBreakdown: Map<string, number>;
    avgRiskScore: number;
    avgGasUsage: number;
  } {
    // This would track statistics over time
    // For now, return placeholder data
    return {
      totalAnalyzed: 0,
      categoryBreakdown: new Map(),
      avgRiskScore: 0,
      avgGasUsage: 0
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.gasBaseline.clear();
    this.removeAllListeners();
    console.log('🔌 Transaction analyzer shut down');
  }
}