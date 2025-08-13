import { ethers } from 'ethers';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Rate limiting and caching
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

class RequestCache {
  private cache = new Map<string, CacheEntry>();
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any, ttlMs: number = 300000): void { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  blockNumber: number;
  isStaking?: boolean;
  isDeFi?: boolean;
  protocolName?: string;
}

export interface UserMetrics {
  totalTransactions: number;
  totalVolume: string; // in ETH
  avgTransactionValue: string;
  stakingBalance: string;
  defiProtocolsUsed: string[];
  accountAge: number; // days
  firstTransactionDate: number;
  lastTransactionDate: number;
}

// Known DeFi protocol addresses (mainnet)
const DEFI_PROTOCOLS = {
  // Uniswap
  'uniswap_v2_router': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  'uniswap_v3_router': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  'uniswap_v3_router2': '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  
  // Aave
  'aave_v2_lending_pool': '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
  'aave_v3_pool': '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  
  // Compound
  'compound_comptroller': '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
  'compound_ceth': '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
  
  // MakerDAO
  'maker_cdp_manager': '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
  'maker_dai': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  
  // Curve
  'curve_registry': '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
  'curve_3pool': '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
  
  // Yearn
  'yearn_registry': '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804',
  
  // Sushiswap
  'sushiswap_router': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
  
  // 1inch
  'oneinch_v4_router': '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  'oneinch_v5_router': '0x1111111254EEB25477B68fb85Ed929f73A960582',
};

// ETH 2.0 Staking Contract
const ETH2_DEPOSIT_CONTRACT = '0x00000000219ab540356cBB839Cbe05303d7705Fa';

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private fallbackProvider: ethers.JsonRpcProvider | null = null;
  private rateLimiter = new RateLimiter(3, 1000); // 3 requests per second
  private cache = new RequestCache();
  private etherscanRateLimiter = new RateLimiter(5, 1000); // 5 requests per second for Etherscan
  
  // Circuit breaker state
  private providerFailures = 0;
  private maxFailures = 3;
  private circuitBreakerTimeout = 60000; // 1 minute
  private lastFailureTime = 0;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.MAINNET_RPC_URL;
    if (!rpcUrl) {
      throw new Error('No Ethereum RPC URL configured');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Set up fallback provider if available
    const fallbackUrl = process.env.INFURA_API_KEY 
      ? `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
      : null;
    
    if (fallbackUrl && fallbackUrl !== rpcUrl) {
      this.fallbackProvider = new ethers.JsonRpcProvider(fallbackUrl);
    }
  }

  /**
   * Get the current provider, with fallback logic and circuit breaker
   */
  private async getProvider(): Promise<ethers.JsonRpcProvider> {
    // Check circuit breaker
    if (this.providerFailures >= this.maxFailures) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.circuitBreakerTimeout) {
        throw new Error(`Circuit breaker open. Retrying in ${Math.ceil((this.circuitBreakerTimeout - timeSinceLastFailure) / 1000)} seconds`);
      } else {
        // Reset circuit breaker
        this.providerFailures = 0;
      }
    }

    await this.rateLimiter.waitIfNeeded();

    try {
      // Test the primary provider
      await this.provider.getBlockNumber();
      this.providerFailures = 0; // Reset on success
      return this.provider;
    } catch (error) {
      console.warn('Primary provider failed, trying fallback:', error);
      this.providerFailures++;
      this.lastFailureTime = Date.now();
      
      if (this.fallbackProvider) {
        try {
          await this.fallbackProvider.getBlockNumber();
          return this.fallbackProvider;
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
          this.providerFailures++;
        }
      }
      
      throw new Error('All RPC providers are unavailable');
    }
  }

  /**
   * Fetch transaction history using Etherscan API (more efficient than block scanning)
   */
  private async fetchTransactionsFromEtherscan(address: string, page: number = 1, offset: number = 100): Promise<any[]> {
    const cacheKey = `etherscan_txs_${address}_${page}_${offset}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      throw new Error('Etherscan API key not configured');
    }

    await this.etherscanRateLimiter.waitIfNeeded();

    try {
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: page,
          offset: offset,
          sort: 'desc',
          apikey: etherscanApiKey
        },
        timeout: 10000
      });

      if (response.data.status !== '1') {
        throw new Error(`Etherscan API error: ${response.data.message}`);
      }

      const transactions = response.data.result || [];
      this.cache.set(cacheKey, transactions, 300000); // Cache for 5 minutes
      return transactions;
    } catch (error) {
      console.error('Etherscan API error:', error);
      throw error;
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Fetch transaction history for a given address (optimized with Etherscan API)
   */
  async fetchTransactionHistory(address: string, maxTransactions: number = 1000): Promise<TransactionData[]> {
    const cacheKey = `tx_history_${address}_${maxTransactions}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Using cached transaction history for ${address}`);
      return cached;
    }

    try {
      console.log(`Fetching transaction history for address: ${address}`);
      
      // Try Etherscan API first (much more efficient)
      try {
        const etherscanTxs = await this.retryWithBackoff(async () => {
          return await this.fetchTransactionsFromEtherscan(address, 1, Math.min(maxTransactions, 1000));
        });

        const transactions: TransactionData[] = [];
        
        for (const tx of etherscanTxs.slice(0, maxTransactions)) {
          const txData: TransactionData = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.formatEther(tx.value),
            gasPrice: ethers.formatUnits(tx.gasPrice || '0', 'gwei'),
            gasUsed: tx.gasUsed || '0',
            timestamp: parseInt(tx.timeStamp),
            blockNumber: parseInt(tx.blockNumber),
            isStaking: this.isStakingTransactionByAddress(tx.to),
            isDeFi: this.isDeFiTransactionByAddress(tx.to),
            protocolName: this.getProtocolName(tx.to)
          };
          
          transactions.push(txData);
        }
        
        console.log(`Found ${transactions.length} transactions via Etherscan for address ${address}`);
        this.cache.set(cacheKey, transactions, 300000); // Cache for 5 minutes
        return transactions;
        
      } catch (etherscanError) {
        console.warn('Etherscan API failed, falling back to RPC scanning:', etherscanError);
        
        // Fallback to limited RPC scanning (much smaller range)
        return await this.fetchTransactionHistoryRPC(address, Math.min(maxTransactions, 100));
      }
      
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw new Error(`Failed to fetch transaction history: ${error}`);
    }
  }

  /**
   * Fallback RPC-based transaction fetching (limited scope)
   */
  private async fetchTransactionHistoryRPC(address: string, maxTransactions: number): Promise<TransactionData[]> {
    const provider = await this.getProvider();
    const transactions: TransactionData[] = [];
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    const blocksToScan = Math.min(1000, currentBlock); // Only scan last 1000 blocks
    const startBlock = Math.max(0, currentBlock - blocksToScan);
    
    console.log(`RPC fallback: Scanning blocks ${startBlock} to ${currentBlock} for address ${address}`);
    
    let transactionCount = 0;
    
    // Scan in smaller batches with delays
    for (let i = currentBlock; i >= startBlock && transactionCount < maxTransactions; i -= 100) {
      const endBlock = Math.max(startBlock, i - 99);
      
      try {
        await this.rateLimiter.waitIfNeeded();
        
        // Get blocks one by one to avoid overwhelming the API
        for (let blockNum = i; blockNum >= endBlock && transactionCount < maxTransactions; blockNum--) {
          try {
            const block = await provider.getBlock(blockNum, true);
            if (!block || !block.transactions) continue;
            
            for (const tx of block.transactions) {
              if (typeof tx === 'string') continue;
              
              const transaction = tx as ethers.TransactionResponse;
              
              if (transaction.from?.toLowerCase() === address.toLowerCase() || 
                  transaction.to?.toLowerCase() === address.toLowerCase()) {
                
                const txData: TransactionData = {
                  hash: transaction.hash,
                  from: transaction.from,
                  to: transaction.to,
                  value: ethers.formatEther(transaction.value),
                  gasPrice: ethers.formatUnits(transaction.gasPrice || 0, 'gwei'),
                  gasUsed: '0', // Skip receipt fetching to reduce API calls
                  timestamp: block.timestamp,
                  blockNumber: transaction.blockNumber || 0,
                  isStaking: this.isStakingTransactionByAddress(transaction.to),
                  isDeFi: this.isDeFiTransactionByAddress(transaction.to),
                  protocolName: this.getProtocolName(transaction.to)
                };
                
                transactions.push(txData);
                transactionCount++;
                
                if (transactionCount >= maxTransactions) break;
              }
            }
          } catch (blockError) {
            console.warn(`Error fetching block ${blockNum}:`, blockError);
            continue;
          }
        }
      } catch (error) {
        console.warn(`Error scanning blocks ${endBlock}-${i}:`, error);
        continue;
      }
    }
    
    console.log(`RPC fallback: Found ${transactions.length} transactions for address ${address}`);
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Check if a transaction is related to staking (by address)
   */
  private isStakingTransactionByAddress(toAddress: string | null): boolean {
    if (!toAddress) return false;
    
    const address = toAddress.toLowerCase();
    
    // ETH 2.0 staking deposit
    if (address === ETH2_DEPOSIT_CONTRACT.toLowerCase()) {
      return true;
    }
    
    // Check for other staking protocols (Lido, Rocket Pool, etc.)
    const stakingContracts = [
      '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // Lido stETH
      '0xae78736Cd615f374D3085123A210448E74Fc6393', // Rocket Pool rETH
      '0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593', // StaFi rETH
      '0xA4C637e0F704745D182e4D38cAb7E7485321d059', // Ankr aETH
    ];
    
    return stakingContracts.some(contract => contract.toLowerCase() === address);
  }

  /**
   * Check if a transaction is a DeFi interaction (by address)
   */
  private isDeFiTransactionByAddress(toAddress: string | null): boolean {
    if (!toAddress) return false;
    
    const address = toAddress.toLowerCase();
    
    // Check against known DeFi protocol addresses
    return Object.values(DEFI_PROTOCOLS).some(
      protocolAddress => protocolAddress.toLowerCase() === address
    );
  }

  /**
   * Check if a transaction is related to staking (legacy method for compatibility)
   */
  private isStakingTransaction(transaction: ethers.TransactionResponse): boolean {
    if (!transaction.to) return false;
    
    const toAddress = transaction.to.toLowerCase();
    
    // ETH 2.0 staking deposit
    if (toAddress === ETH2_DEPOSIT_CONTRACT.toLowerCase()) {
      return true;
    }
    
    // Check for other staking protocols (Lido, Rocket Pool, etc.)
    const stakingContracts = [
      '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // Lido stETH
      '0xae78736Cd615f374D3085123A210448E74Fc6393', // Rocket Pool rETH
      '0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593', // StaFi rETH
      '0xA4C637e0F704745D182e4D38cAb7E7485321d059', // Ankr aETH
    ];
    
    return stakingContracts.some(contract => contract.toLowerCase() === toAddress);
  }

  /**
   * Check if a transaction is a DeFi interaction
   */
  private isDeFiTransaction(transaction: ethers.TransactionResponse): boolean {
    if (!transaction.to) return false;
    
    const toAddress = transaction.to.toLowerCase();
    
    // Check against known DeFi protocol addresses
    return Object.values(DEFI_PROTOCOLS).some(
      protocolAddress => protocolAddress.toLowerCase() === toAddress
    );
  }

  /**
   * Get the protocol name for a given address
   */
  private getProtocolName(address: string | null): string | undefined {
    if (!address) return undefined;
    
    const lowerAddress = address.toLowerCase();
    
    // Find protocol name by address
    for (const [protocolKey, protocolAddress] of Object.entries(DEFI_PROTOCOLS)) {
      if (protocolAddress.toLowerCase() === lowerAddress) {
        // Convert key to readable name
        return protocolKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    // Check staking protocols
    const stakingProtocols: { [key: string]: string } = {
      '0x00000000219ab540356cBB839Cbe05303d7705Fa': 'ETH 2.0 Staking',
      '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84': 'Lido',
      '0xae78736Cd615f374D3085123A210448E74Fc6393': 'Rocket Pool',
      '0x9559Aaa82d9649C7A7b220E7c461d2E74c9a3593': 'StaFi',
      '0xA4C637e0F704745D182e4D38cAb7E7485321d059': 'Ankr',
    };
    
    return stakingProtocols[lowerAddress];
  }

  /**
   * Detect staking activities for an address
   */
  async detectStakingActivities(address: string): Promise<{
    totalStaked: string;
    stakingTransactions: TransactionData[];
    activeStakingProtocols: string[];
  }> {
    try {
      const provider = await this.getProvider();
      const transactions = await this.fetchTransactionHistory(address, 500);
      
      const stakingTransactions = transactions.filter(tx => tx.isStaking);
      const activeProtocols = [...new Set(
        stakingTransactions
          .map(tx => tx.protocolName)
          .filter(name => name !== undefined)
      )] as string[];
      
      // Calculate total staked amount (simplified - just sum of staking transaction values)
      const totalStaked = stakingTransactions
        .filter(tx => tx.from.toLowerCase() === address.toLowerCase())
        .reduce((sum, tx) => {
          return sum + parseFloat(tx.value);
        }, 0);
      
      return {
        totalStaked: totalStaked.toString(),
        stakingTransactions,
        activeStakingProtocols: activeProtocols
      };
      
    } catch (error) {
      console.error('Error detecting staking activities:', error);
      throw new Error(`Failed to detect staking activities: ${error}`);
    }
  }

  /**
   * Detect DeFi interactions for an address
   */
  async detectDeFiInteractions(address: string): Promise<{
    totalDeFiTransactions: number;
    defiTransactions: TransactionData[];
    protocolsUsed: string[];
    totalDeFiVolume: string;
  }> {
    try {
      const transactions = await this.fetchTransactionHistory(address, 1000);
      
      const defiTransactions = transactions.filter(tx => tx.isDeFi);
      const protocolsUsed = [...new Set(
        defiTransactions
          .map(tx => tx.protocolName)
          .filter(name => name !== undefined)
      )] as string[];
      
      // Calculate total DeFi volume
      const totalVolume = defiTransactions.reduce((sum, tx) => {
        return sum + parseFloat(tx.value);
      }, 0);
      
      return {
        totalDeFiTransactions: defiTransactions.length,
        defiTransactions,
        protocolsUsed,
        totalDeFiVolume: totalVolume.toString()
      };
      
    } catch (error) {
      console.error('Error detecting DeFi interactions:', error);
      throw new Error(`Failed to detect DeFi interactions: ${error}`);
    }
  }

  /**
   * Get comprehensive user metrics for credit scoring
   */
  async getUserMetrics(address: string): Promise<UserMetrics> {
    try {
      const provider = await this.getProvider();
      
      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address format');
      }
      
      console.log(`Fetching user metrics for address: ${address}`);
      
      // Fetch transaction history
      const transactions = await this.fetchTransactionHistory(address, 1000);
      
      if (transactions.length === 0) {
        return {
          totalTransactions: 0,
          totalVolume: '0',
          avgTransactionValue: '0',
          stakingBalance: '0',
          defiProtocolsUsed: [],
          accountAge: 0,
          firstTransactionDate: 0,
          lastTransactionDate: 0
        };
      }
      
      // Calculate metrics
      const totalVolume = transactions.reduce((sum, tx) => {
        return sum + parseFloat(tx.value);
      }, 0);
      
      const avgTransactionValue = totalVolume / transactions.length;
      
      // Get staking and DeFi data
      const [stakingData, defiData] = await Promise.all([
        this.detectStakingActivities(address),
        this.detectDeFiInteractions(address)
      ]);
      
      // Calculate account age
      const sortedTransactions = transactions.sort((a, b) => a.timestamp - b.timestamp);
      const firstTx = sortedTransactions[0];
      const lastTx = sortedTransactions[sortedTransactions.length - 1];
      const accountAge = Math.floor((Date.now() / 1000 - firstTx.timestamp) / (24 * 60 * 60));
      
      return {
        totalTransactions: transactions.length,
        totalVolume: totalVolume.toString(),
        avgTransactionValue: avgTransactionValue.toString(),
        stakingBalance: stakingData.totalStaked,
        defiProtocolsUsed: defiData.protocolsUsed,
        accountAge,
        firstTransactionDate: firstTx.timestamp,
        lastTransactionDate: lastTx.timestamp
      };
      
    } catch (error) {
      console.error('Error getting user metrics:', error);
      throw new Error(`Failed to get user metrics: ${error}`);
    }
  }

  /**
   * Get current ETH balance for an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const provider = await this.getProvider();
      
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address format');
      }
      
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
      
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Test the blockchain connection
   */
  async testConnection(): Promise<{
    connected: boolean;
    blockNumber: number;
    networkName: string;
  }> {
    try {
      const provider = await this.getProvider();
      const blockNumber = await provider.getBlockNumber();
      const network = await provider.getNetwork();
      
      return {
        connected: true,
        blockNumber,
        networkName: network.name
      };
      
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        connected: false,
        blockNumber: 0,
        networkName: 'unknown'
      };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;