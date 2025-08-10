// Data Aggregator Service - Main Entry Point
// Integrates all data aggregation components with enhanced functionality

import { EthereumTransactionMonitor, createEthereumMonitorConfig, MonitoredTransaction } from './ethereum-monitor';
import { TransactionCategorizer, CategorizedTransaction } from './transaction-categorizer';
import { PriceFeedService, createPriceFeedConfig } from './price-feed-service';
import { WalletLinkingService, createWalletLinkingConfig } from './wallet-linking-service';
import { DataValidationService, createValidationConfig } from './data-validation-service';
import { EnhancedDataAggregationService, createEnhancedAggregationConfig } from './enhanced-aggregation-service';
import { formatError } from '../../utils/errors';

export interface DataAggregatorConfig {
  ethereumConfig?: any;
  enableCategorization?: boolean;
  enableLogging?: boolean;
  useEnhancedService?: boolean;
  enhancedConfig?: any;
}

export class DataAggregatorService {
  private ethereumMonitor: EthereumTransactionMonitor;
  private transactionCategorizer: TransactionCategorizer;
  private enhancedService?: EnhancedDataAggregationService;
  private config: DataAggregatorConfig;
  private isRunning: boolean = false;

  constructor(config: DataAggregatorConfig = {}) {
    this.config = {
      enableCategorization: true,
      enableLogging: true,
      useEnhancedService: false,
      ...config
    };

    if (this.config.useEnhancedService) {
      // Initialize enhanced service
      const enhancedConfig = this.config.enhancedConfig || createEnhancedAggregationConfig();
      this.enhancedService = new EnhancedDataAggregationService(enhancedConfig);
    } else {
      // Initialize basic services
      const ethereumConfig = config.ethereumConfig || createEthereumMonitorConfig();
      this.ethereumMonitor = new EthereumTransactionMonitor(ethereumConfig);
      this.transactionCategorizer = new TransactionCategorizer();
    }
  }

  /**
   * Start the data aggregation service
   */
  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        throw new Error('Data aggregator service is already running');
      }

      if (this.enhancedService) {
        await this.enhancedService.start();
      } else {
        await this.ethereumMonitor.startMonitoring();
      }

      this.isRunning = true;

      if (this.config.enableLogging) {
        console.log('Data Aggregator Service started successfully');
        this.logServiceStatus();
      }
    } catch (error) {
      console.error('Failed to start data aggregator service:', formatError(error));
      throw error;
    }
  }

  /**
   * Stop the data aggregation service
   */
  public async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        return;
      }

      if (this.enhancedService) {
        await this.enhancedService.stop();
      } else {
        await this.ethereumMonitor.stopMonitoring();
      }

      this.isRunning = false;

      if (this.config.enableLogging) {
        console.log('Data Aggregator Service stopped');
      }
    } catch (error) {
      console.error('Error stopping data aggregator service:', formatError(error));
      throw error;
    }
  }

  /**
   * Subscribe to wallet transactions with automatic categorization
   */
  public subscribeToWallet(
    address: string, 
    callback?: (tx: CategorizedTransaction) => void
  ): void {
    if (this.enhancedService) {
      // Enhanced service handles processing internally
      this.enhancedService.subscribeToWallet(address);
    } else if (callback) {
      const wrappedCallback = (tx: MonitoredTransaction) => {
        try {
          // Categorize transaction if enabled
          const categorizedTx = this.config.enableCategorization 
            ? this.transactionCategorizer.categorizeForCreditScoring(tx)
            : { ...tx, creditDimensions: {
                defiReliability: 0,
                tradingConsistency: 0,
                stakingCommitment: 0,
                governanceParticipation: 0,
                liquidityProvider: 0
              }, riskScore: 0, dataWeight: 1 };

          // Log transaction if enabled
          if (this.config.enableLogging) {
            console.log(`Transaction detected for ${address}:`, {
              hash: tx.hash,
              protocol: tx.protocol,
              category: tx.category,
              value: tx.value
            });
          }

          callback(categorizedTx);
        } catch (error) {
          console.error(`Error processing transaction for ${address}:`, formatError(error));
        }
      };

      this.ethereumMonitor.subscribeToWallet(address, wrappedCallback);
    }
  }

  /**
   * Unsubscribe from wallet monitoring
   */
  public unsubscribeFromWallet(address: string): void {
    if (this.enhancedService) {
      this.enhancedService.unsubscribeFromWallet(address);
    } else {
      this.ethereumMonitor.unsubscribeFromWallet(address);
    }
  }

  /**
   * Get service status and metrics
   */
  public getServiceStatus(): {
    isRunning: boolean;
    isEnhanced: boolean;
    ethereumMonitor?: any;
    supportedProtocols?: any[];
    subscribedWallets?: number;
    enhancedStatus?: any;
  } {
    if (this.enhancedService) {
      return {
        isRunning: this.isRunning,
        isEnhanced: true,
        enhancedStatus: this.enhancedService.getServiceStatus()
      };
    } else {
      const monitorStatus = this.ethereumMonitor.getMonitoringStatus();
      
      return {
        isRunning: this.isRunning,
        isEnhanced: false,
        ethereumMonitor: monitorStatus,
        supportedProtocols: this.ethereumMonitor.getSupportedProtocols(),
        subscribedWallets: monitorStatus.subscribedWallets
      };
    }
  }

  /**
   * Check if an address is a monitored DeFi protocol
   */
  public isMonitoredProtocol(address: string): boolean {
    if (this.enhancedService) {
      // Enhanced service would need this method - for now return false
      return false;
    }
    return this.ethereumMonitor.isMonitoredProtocol(address);
  }

  /**
   * Get credit impact summary for a transaction
   */
  public getCreditImpactSummary(tx: CategorizedTransaction) {
    return this.transactionCategorizer.getCreditImpactSummary(tx);
  }

  /**
   * Batch categorize multiple transactions
   */
  public batchCategorizeTransactions(transactions: MonitoredTransaction[]): CategorizedTransaction[] {
    return this.transactionCategorizer.batchCategorize(transactions);
  }

  /**
   * Get enhanced service metrics (if using enhanced service)
   */
  public getEnhancedMetrics() {
    return this.enhancedService?.getMetrics();
  }

  /**
   * Log service status for monitoring
   */
  private logServiceStatus(): void {
    const status = this.getServiceStatus();
    
    if (status.isEnhanced) {
      console.log('Enhanced Data Aggregator Service Status:', status.enhancedStatus);
    } else {
      console.log('Basic Data Aggregator Service Status:', {
        isRunning: status.isRunning,
        ethereumConnected: status.ethereumMonitor?.isConnected,
        subscribedWallets: status.subscribedWallets,
        supportedProtocols: status.supportedProtocols?.length,
        currentRpcUrl: status.ethereumMonitor?.currentRpcUrl
      });
    }
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      if (this.enhancedService) {
        return await this.enhancedService.healthCheck();
      }

      const serviceStatus = this.getServiceStatus();
      
      const isHealthy = this.isRunning && 
                       serviceStatus.ethereumMonitor?.isConnected &&
                       (serviceStatus.ethereumMonitor?.reconnectAttempts || 0) < 3;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          ...serviceStatus,
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

// Export singleton instances for easy use
export const dataAggregatorService = new DataAggregatorService();
export const enhancedDataAggregatorService = new DataAggregatorService({ 
  useEnhancedService: true 
});

// Export all types and classes
export * from './ethereum-monitor';
export * from './transaction-categorizer';
export * from './price-feed-service';
export * from './wallet-linking-service';
export * from './data-validation-service';
export * from './enhanced-aggregation-service';
export * from './real-market-data-service';
export * from './defi-market-data-service';
export * from './comprehensive-market-data-service';

// Real-time price feed management (Task 6.1 & 6.2)
export * from './real-time-price-feed-manager';
export * from './redis-price-cache';
export * from './price-feed-failover';
export * from './price-volatility-monitor';
export * from './integrated-price-feed-service';