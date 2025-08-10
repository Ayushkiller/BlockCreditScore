// Real Blockchain Data Integration Service
// Provides authentic blockchain data from Ethereum mainnet

import { RealDataConfigLoader } from './config-loader';
import { RealBlockchainDataManager } from './blockchain-data-manager';
import { RealContractManager } from './contract-manager';

export { RealBlockchainDataManager, IBlockchainDataManager } from './blockchain-data-manager';
export { EthereumConnectionService } from './ethereum-connection';
export { RealTransactionMonitor, TransactionFilter, MonitoredTransaction, TransactionEvent, BackfillOptions } from './transaction-monitor';
export { RealContractManager, IRealContractManager } from './contract-manager';
export { RealContractDataFetcher } from './contract-data-fetcher';
export { RealTransactionAnalyzer } from './real-transaction-analyzer';
export { RealUserBehaviorAnalyzer } from './user-behavior-analyzer';
export { RealDataConfigLoader } from './config-loader';
export { RealEventMonitor, EventFilter, MonitoredEvent, ChainReorganization, UserAction, EventMonitoringStats } from './real-event-monitor';

export {
  RpcProvider,
  EthereumTransaction,
  TransactionReceipt,
  Block,
  EventLog,
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
  ProtocolInteraction,
  REAL_CONTRACT_ADDRESSES,
  EVENT_SIGNATURES,
  METHOD_SIGNATURES,
  TVLData,
  YieldData,
  LiquidationEvent,
  ContractStateData,
  TransactionAnalysis,
  GasAnalysis,
  TransactionCategory,
  CreditImpact,
  TransactionPattern
} from './types';

// Factory function to create a configured blockchain data manager
export async function createBlockchainDataManager(): Promise<RealBlockchainDataManager> {
  // Load environment variables
  require('dotenv').config();
  
  // Validate environment configuration
  RealDataConfigLoader.validateEnvironment();
  
  // Load RPC providers from configuration
  const providers = RealDataConfigLoader.loadRpcProviders();
  
  // Create and initialize the manager
  const manager = new RealBlockchainDataManager();
  await manager.connectToMainnet(providers);
  
  // Log configuration summary
  const configSummary = RealDataConfigLoader.getConfigSummary();
  console.log('🔧 Blockchain Data Manager Configuration:');
  console.log(`   Environment: ${configSummary.environment}`);
  console.log(`   Providers: ${configSummary.providersConfigured.join(', ')}`);
  console.log(`   Total Providers: ${configSummary.totalProviders}`);
  console.log(`   Has API Keys: ${configSummary.hasApiKeys ? '✅' : '❌'}`);
  console.log('🏗️ Features enabled:');
  console.log('   ✅ Real blockchain data connections');
  console.log('   ✅ Transaction monitoring');
  console.log('   ✅ Real-time event monitoring');
  console.log('   ✅ DeFi protocol contract interfaces');
  console.log('   ✅ Advanced contract data fetching');
  console.log('   ✅ TVL and yield data');
  console.log('   ✅ Liquidation event monitoring');
  console.log('   ✅ Transaction decoding with context');
  console.log('   ✅ Chain reorganization detection');
  console.log('   ✅ User action detection');
  
  return manager;
}

// Export default instance creator
export default createBlockchainDataManager;