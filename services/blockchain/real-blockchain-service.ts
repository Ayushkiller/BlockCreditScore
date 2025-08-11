import { ethers } from 'ethers';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  methodId?: string;
  decodedInput?: any;
}

export interface CreditScore {
  address: string;
  compositeScore: number;
  confidence: number;
  dimensions: {
    defiReliability: number;
    tradingConsistency: number;
    stakingCommitment: number;
    governanceParticipation: number;
    liquidityProvider: number;
  };
  lastUpdated: number;
  dataPoints: number;
}

export class RealBlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private etherscanApiKey: string;

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    
    // Initialize providers
    if (process.env.GOERLI_RPC_URL) {
      this.providers.set('goerli', new ethers.JsonRpcProvider(process.env.GOERLI_RPC_URL));
    }
    if (process.env.SEPOLIA_RPC_URL) {
      this.providers.set('sepolia', new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL));
    }
    if (process.env.MAINNET_RPC_URL) {
      this.providers.set('mainnet', new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL));
    }
  }

  async getWalletTransactions(address: string, network: string = 'mainnet'): Promise<Transaction[]> {
    try {
      console.log(`🔍 Fetching REAL transactions for ${address} on ${network}`);
      
      // Use Etherscan API for transaction history
      const baseUrl = this.getEtherscanUrl(network);
      const url = `${baseUrl}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }

      const transactions: Transaction[] = data.result.slice(0, 100).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: parseInt(tx.timeStamp) * 1000,
        methodId: tx.input.slice(0, 10)
      }));

      console.log(`✅ Found ${transactions.length} real transactions for ${address}`);
      return transactions;

    } catch (error) {
      console.error(`❌ Failed to fetch transactions for ${address}:`, error);
      throw error;
    }
  }

  async calculateRealCreditScore(address: string): Promise<CreditScore> {
    try {
      console.log(`🧮 Calculating REAL credit score for ${address}`);
      
      const transactions = await this.getWalletTransactions(address);
      
      // Analyze real transaction patterns
      const defiReliability = this.analyzeDeFiReliability(transactions);
      const tradingConsistency = this.analyzeTradingConsistency(transactions);
      const stakingCommitment = this.analyzeStakingCommitment(transactions);
      const governanceParticipation = this.analyzeGovernanceParticipation(transactions);
      const liquidityProvider = this.analyzeLiquidityProvider(transactions);
      
      const compositeScore = Math.round(
        (defiReliability + tradingConsistency + stakingCommitment + governanceParticipation + liquidityProvider) / 5
      );
      
      const confidence = Math.min(100, Math.max(20, transactions.length * 2));
      
      const creditScore: CreditScore = {
        address,
        compositeScore,
        confidence,
        dimensions: {
          defiReliability,
          tradingConsistency,
          stakingCommitment,
          governanceParticipation,
          liquidityProvider
        },
        lastUpdated: Date.now(),
        dataPoints: transactions.length
      };

      console.log(`✅ Calculated real credit score for ${address}: ${compositeScore}`);
      return creditScore;

    } catch (error) {
      console.error(`❌ Failed to calculate credit score for ${address}:`, error);
      throw error;
    }
  }

  private analyzeDeFiReliability(transactions: Transaction[]): number {
    // Analyze DeFi protocol interactions
    const defiTxs = transactions.filter(tx => 
      this.isDeFiTransaction(tx.to) || this.isDeFiMethodId(tx.methodId)
    );
    
    if (defiTxs.length === 0) return 500; // Neutral score
    
    // Score based on successful DeFi interactions
    const score = Math.min(1000, 400 + (defiTxs.length * 10));
    return Math.round(score);
  }

  private analyzeTradingConsistency(transactions: Transaction[]): number {
    // Analyze trading patterns and frequency
    const tradingTxs = transactions.filter(tx => 
      this.isTradingTransaction(tx.to) || this.isTradingMethodId(tx.methodId)
    );
    
    if (tradingTxs.length === 0) return 500;
    
    // Score based on trading activity and consistency
    const score = Math.min(1000, 300 + (tradingTxs.length * 8));
    return Math.round(score);
  }

  private analyzeStakingCommitment(transactions: Transaction[]): number {
    // Analyze staking behavior
    const stakingTxs = transactions.filter(tx => 
      this.isStakingTransaction(tx.to) || this.isStakingMethodId(tx.methodId)
    );
    
    if (stakingTxs.length === 0) return 500;
    
    const score = Math.min(1000, 600 + (stakingTxs.length * 15));
    return Math.round(score);
  }

  private analyzeGovernanceParticipation(transactions: Transaction[]): number {
    // Analyze governance participation
    const govTxs = transactions.filter(tx => 
      this.isGovernanceTransaction(tx.to) || this.isGovernanceMethodId(tx.methodId)
    );
    
    if (govTxs.length === 0) return 400;
    
    const score = Math.min(1000, 700 + (govTxs.length * 20));
    return Math.round(score);
  }

  private analyzeLiquidityProvider(transactions: Transaction[]): number {
    // Analyze liquidity provision
    const lpTxs = transactions.filter(tx => 
      this.isLiquidityTransaction(tx.to) || this.isLiquidityMethodId(tx.methodId)
    );
    
    if (lpTxs.length === 0) return 500;
    
    const score = Math.min(1000, 500 + (lpTxs.length * 12));
    return Math.round(score);
  }

  private isDeFiTransaction(address: string): boolean {
    const defiProtocols = [
      '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', // Aave
      '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', // Compound
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    ];
    return defiProtocols.includes(address.toLowerCase());
  }

  private isDeFiMethodId(methodId?: string): boolean {
    const defiMethods = ['0xa9059cbb', '0x23b872dd', '0x095ea7b3']; // transfer, transferFrom, approve
    return methodId ? defiMethods.includes(methodId) : false;
  }

  private isTradingTransaction(address: string): boolean {
    const dexes = [
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
    ];
    return dexes.includes(address.toLowerCase());
  }

  private isTradingMethodId(methodId?: string): boolean {
    const tradingMethods = ['0x38ed1739', '0x8803dbee']; // swapExactTokensForTokens, etc
    return methodId ? tradingMethods.includes(methodId) : false;
  }

  private isStakingTransaction(address: string): boolean {
    const stakingContracts = [
      '0x00000000219ab540356cbb839cbe05303d7705fa', // ETH2 Deposit Contract
    ];
    return stakingContracts.includes(address.toLowerCase());
  }

  private isStakingMethodId(methodId?: string): boolean {
    const stakingMethods = ['0x22895118']; // deposit
    return methodId ? stakingMethods.includes(methodId) : false;
  }

  private isGovernanceTransaction(address: string): boolean {
    const govContracts = [
      '0x5e4be8bc9637f0eaf1c755019200f81932c7b1a6', // Compound Governor
    ];
    return govContracts.includes(address.toLowerCase());
  }

  private isGovernanceMethodId(methodId?: string): boolean {
    const govMethods = ['0x15373e3d']; // castVote
    return methodId ? govMethods.includes(methodId) : false;
  }

  private isLiquidityTransaction(address: string): boolean {
    const lpContracts = [
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
    ];
    return lpContracts.includes(address.toLowerCase());
  }

  private isLiquidityMethodId(methodId?: string): boolean {
    const lpMethods = ['0xe8e33700', '0xf305d719']; // addLiquidity, removeLiquidity
    return methodId ? lpMethods.includes(methodId) : false;
  }

  private getEtherscanUrl(network: string): string {
    switch (network) {
      case 'goerli':
        return 'https://api-goerli.etherscan.io';
      case 'sepolia':
        return 'https://api-sepolia.etherscan.io';
      default:
        return 'https://api.etherscan.io';
    }
  }
}

export const realBlockchainService = new RealBlockchainService();