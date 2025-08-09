// Cross-Chain Transaction and Blockchain Data Models

export interface CrossChainTransaction {
  txHash: string;
  chainId: number;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string; // BigNumber as string
  usdValue: number;
  protocol: string;
  category: TransactionCategory;
  riskScore: number;
  gasUsed?: number;
  gasPrice?: string;
}

export enum TransactionCategory {
  LENDING = 'lending',
  BORROWING = 'borrowing',
  STAKING = 'staking',
  GOVERNANCE = 'governance',
  LIQUIDITY_PROVISION = 'liquidity_provision',
  TRADING = 'trading',
  BRIDGE_TRANSFER = 'bridge_transfer',
  NFT_TRADE = 'nft_trade',
  YIELD_FARMING = 'yield_farming'
}

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    creditScore?: string;
    nftCertificate?: string;
    zkVerifier?: string;
  };
}

export interface ProtocolData {
  name: string;
  category: TransactionCategory;
  contractAddresses: string[];
  riskMultiplier: number;
  dataWeight: number;
}

export interface WalletLinkRequest {
  primaryWallet: string;
  walletToLink: string;
  signature: string;
  timestamp: number;
}

export interface NormalizationData {
  chainId: number;
  tokenAddress: string;
  symbol: string;
  decimals: number;
  priceUSD: number;
  lastUpdated: number;
}