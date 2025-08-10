// Types for real blockchain data integration

export interface RpcProvider {
  name: string;
  rpcUrl: string;
  wsUrl: string;
  apiKey: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  isHealthy: boolean;
  lastHealthCheck: number;
  failureCount: number;
}

export interface EthereumTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasUsed?: string;
  gasLimit: string;
  input: string;
  nonce: number;
  timestamp?: number;
  confirmations?: number;
  status?: 'success' | 'failed';
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  gasUsed: string;
  cumulativeGasUsed: string;
  contractAddress: string | null;
  logs: EventLog[];
  status: number;
  effectiveGasPrice?: string;
}

export interface EventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  transactions: string[];
  size: number;
  baseFeePerGas?: string;
}

export interface HealthCheckResult {
  provider: string;
  isHealthy: boolean;
  latency: number;
  blockNumber?: number;
  error?: string;
  timestamp: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  currentProvider: RpcProvider | null;
  lastBlockNumber: number;
  connectionTime: number;
  reconnectAttempts: number;
}

export interface SubscriptionCallback<T> {
  (data: T): void;
}

export interface BlockSubscriptionData {
  blockNumber: number;
  blockHash: string;
  timestamp: number;
}

export interface TransactionSubscriptionData {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber?: number;
}

// Re-export contract types for convenience
export {
  PoolInfo,
  LendingPosition,
  CompoundPosition,
  PriceData,
  DecodedTransaction,
  ProtocolInteraction,
  REAL_CONTRACT_ADDRESSES,
  EVENT_SIGNATURES,
  METHOD_SIGNATURES
} from './contract-types';

// Contract data fetcher types (defined here to avoid circular imports)
export interface TVLData {
  protocol: string;
  totalValueLocked: string;
  timestamp: number;
  assets: Array<{
    symbol: string;
    address: string;
    balance: string;
    valueUSD: string;
  }>;
}

export interface YieldData {
  asset: string;
  protocol: string;
  supplyAPY: number;
  borrowAPY: number;
  utilization: number;
  totalSupply: string;
  totalBorrow: string;
  timestamp: number;
}

export interface LiquidationEvent {
  protocol: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  liquidator: string;
  borrower: string;
  collateralAsset: string;
  debtAsset: string;
  collateralAmount: string;
  debtAmount: string;
  bonus: string;
}

export interface ContractStateData {
  contractAddress: string;
  contractName: string;
  blockNumber: number;
  timestamp: number;
  state: Record<string, any>;
}

// Transaction Analysis Types
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