/**
 * Example usage of Real Blockchain Data Manager
 * This demonstrates how to integrate the service into the credit scoring system
 */

import { createBlockchainDataManager, RealBlockchainDataManager } from './src/index';

class CreditScoringIntegration {
  private blockchainManager: RealBlockchainDataManager | null = null;

  async initialize() {
    console.log('🚀 Initializing Real Blockchain Data Integration...');
    
    try {
      // Create blockchain data manager with real providers
      this.blockchainManager = await createBlockchainDataManager();
      
      // Set up real-time monitoring
      await this.setupRealTimeMonitoring();
      
      console.log('✅ Real blockchain data integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain data integration:', error);
      throw error;
    }
  }

  async setupRealTimeMonitoring() {
    if (!this.blockchainManager) {
      throw new Error('Blockchain manager not initialized');
    }

    // Start the transaction monitoring system
    await this.blockchainManager.startTransactionMonitoring();

    // Set up transaction event handlers
    this.blockchainManager.on('transactionDetected', (event) => {
      console.log(`🔍 New transaction detected: ${event.transaction.hash}`);
      this.handleTransactionEvent(event);
    });

    this.blockchainManager.on('transactionConfirmed', (event) => {
      console.log(`✅ Transaction confirmed: ${event.transaction.hash} (${event.confirmations} confirmations)`);
      this.handleTransactionConfirmation(event);
    });

    this.blockchainManager.on('transactionFailed', (event) => {
      console.log(`❌ Transaction failed: ${event.transaction.hash}`);
      this.handleTransactionFailure(event);
    });

    this.blockchainManager.on('transactionReorganized', (event) => {
      console.log(`🔄 Transaction reorganized: ${event.transaction.hash}`);
      this.handleTransactionReorganization(event);
    });

    // Monitor new blocks for additional processing
    await this.blockchainManager.subscribeToBlocks(async (blockData) => {
      console.log(`📦 Processing new block: ${blockData.blockNumber}`);
      await this.processNewBlock(blockData.blockNumber);
    });

    console.log('📡 Real-time transaction monitoring established');
  }

  async processNewBlock(blockNumber: number) {
    if (!this.blockchainManager) return;

    try {
      // Get full block data with transactions
      const block = await this.blockchainManager.getBlockByNumber(blockNumber);
      
      console.log(`🔍 Block ${blockNumber}: ${block.transactions.length} transactions`);
      
      // Process each transaction for credit scoring
      for (const txHash of block.transactions.slice(0, 5)) { // Limit for example
        await this.analyzeTransactionForCreditScore(txHash);
      }
    } catch (error) {
      console.error(`Error processing block ${blockNumber}:`, error);
    }
  }

  async analyzeTransactionForCreditScore(txHash: string) {
    if (!this.blockchainManager) return;

    try {
      // Get real transaction data
      const transaction = await this.blockchainManager.getTransaction(txHash);
      const receipt = await this.blockchainManager.getTransactionReceipt(txHash);

      // Analyze transaction for credit scoring factors
      const analysis = {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        gasUsed: receipt.gasUsed,
        success: receipt.status === 1,
        timestamp: transaction.timestamp,
        // Real credit scoring logic would go here
        creditImpact: this.calculateCreditImpact(transaction, receipt)
      };

      console.log(`💳 Transaction analysis: ${analysis.hash.slice(0, 10)}... Impact: ${analysis.creditImpact}`);
      
      return analysis;
    } catch (error) {
      console.error(`Error analyzing transaction ${txHash}:`, error);
      return null;
    }
  }

  private calculateCreditImpact(transaction: any, receipt: any): string {
    // Simplified credit impact calculation
    const value = BigInt(transaction.value);
    const gasUsed = BigInt(receipt.gasUsed);
    
    if (value > BigInt('1000000000000000000')) { // > 1 ETH
      return 'HIGH';
    } else if (value > BigInt('100000000000000000')) { // > 0.1 ETH
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  async monitorUserAddress(address: string) {
    if (!this.blockchainManager) {
      throw new Error('Blockchain manager not initialized');
    }

    console.log(`👀 Starting to monitor address: ${address}`);
    
    // Add address to the transaction monitoring system
    await this.blockchainManager.addAddressToMonitor(address);
    
    // Add transaction filters for this user
    this.blockchainManager.addTransactionFilter({
      addresses: [address],
      minValue: '1000000000000000' // Only monitor transactions > 0.001 ETH
    });

    console.log(`✅ Address ${address} added to monitoring system`);
  }

  private async updateUserCreditScore(address: string, txHash: string) {
    // Placeholder for real credit score update logic
    console.log(`📊 Updating credit score for ${address} based on transaction ${txHash}`);
    
    // Real implementation would:
    // 1. Analyze the transaction details
    // 2. Update the user's credit history
    // 3. Recalculate credit score
    // 4. Store updated score in database
  }

  private async handleTransactionEvent(event: any) {
    const tx = event.transaction;
    console.log(`🔍 Processing transaction event: ${tx.hash}`);
    
    // Analyze transaction for credit scoring
    const analysis = await this.analyzeTransactionForCreditScore(tx.hash);
    
    if (analysis) {
      // Update credit scores for involved addresses
      await this.updateUserCreditScore(tx.from, tx.hash);
      if (tx.to) {
        await this.updateUserCreditScore(tx.to, tx.hash);
      }
    }
  }

  private async handleTransactionConfirmation(event: any) {
    const tx = event.transaction;
    console.log(`✅ Transaction confirmed: ${tx.hash} with ${event.confirmations} confirmations`);
    
    // Mark transaction as confirmed in credit scoring system
    // This is when we can be confident the transaction is final
    await this.finalizeTransactionCreditImpact(tx.hash, event.confirmations);
  }

  private async handleTransactionFailure(event: any) {
    const tx = event.transaction;
    console.log(`❌ Transaction failed: ${tx.hash}`);
    
    // Remove any pending credit score impacts for this transaction
    await this.revertTransactionCreditImpact(tx.hash);
  }

  private async handleTransactionReorganization(event: any) {
    const tx = event.transaction;
    console.log(`🔄 Transaction reorganized: ${tx.hash}`);
    
    // Handle chain reorganization - may need to recalculate credit scores
    await this.handleChainReorganization(tx.hash, tx.blockNumber);
  }

  private async finalizeTransactionCreditImpact(txHash: string, confirmations: number) {
    console.log(`🔒 Finalizing credit impact for transaction ${txHash} (${confirmations} confirmations)`);
    // Implementation would mark the transaction as finalized in the credit system
  }

  private async revertTransactionCreditImpact(txHash: string) {
    console.log(`↩️ Reverting credit impact for failed transaction ${txHash}`);
    // Implementation would remove any pending credit score changes
  }

  private async handleChainReorganization(txHash: string, newBlockNumber: number) {
    console.log(`🔄 Handling chain reorg for transaction ${txHash} (new block: ${newBlockNumber})`);
    // Implementation would recalculate credit scores affected by the reorganization
  }

  async getConnectionHealth() {
    if (!this.blockchainManager) {
      return { connected: false, providers: [], monitoring: null };
    }

    const status = this.blockchainManager.getConnectionStatus();
    const providers = this.blockchainManager.getProviderHealth();
    const stats = this.blockchainManager.getProviderStatistics();
    const monitoringStats = this.blockchainManager.getMonitoringStats();

    return {
      connected: status.isConnected,
      currentProvider: status.currentProvider?.name,
      lastBlock: status.lastBlockNumber,
      providers: providers.map(p => ({
        name: p.name,
        healthy: p.isHealthy,
        priority: p.priority,
        failures: p.failureCount
      })),
      stats,
      monitoring: {
        active: monitoringStats.isMonitoring,
        monitoredAddresses: monitoringStats.monitoredAddresses,
        pendingTransactions: monitoringStats.pendingTransactions,
        confirmedTransactions: monitoringStats.confirmedTransactions,
        currentBlock: monitoringStats.currentBlock,
        filters: monitoringStats.filters
      }
    };
  }

  async shutdown() {
    if (this.blockchainManager) {
      // Stop transaction monitoring first
      try {
        await this.blockchainManager.stopTransactionMonitoring();
      } catch (error) {
        console.warn('Warning: Error stopping transaction monitoring:', error);
      }
      
      // Then disconnect from providers
      await this.blockchainManager.disconnect();
      console.log('🔌 Blockchain data integration shut down');
    }
  }
}

// Example usage
async function runExample() {
  const integration = new CreditScoringIntegration();
  
  try {
    await integration.initialize();
    
    // Monitor a sample address (Ethereum Foundation)
    await integration.monitorUserAddress('0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe');
    
    // Check health
    const health = await integration.getConnectionHealth();
    console.log('🏥 Connection Health:', JSON.stringify(health, null, 2));
    
    // Run for 30 seconds then shutdown
    setTimeout(async () => {
      await integration.shutdown();
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  runExample();
}

export { CreditScoringIntegration };