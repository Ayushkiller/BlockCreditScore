// Wallet Linking Service
// Integrates with CreditScore contract to manage wallet linking for unified credit profiles

import { ethers } from 'ethers';
import { isValidAddress } from '../../utils/crypto';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';
import { WalletLinkRequest } from '../../types/transactions';

export interface WalletLinkingConfig {
  contractAddress: string;
  rpcUrl: string;
  fallbackRpcUrls: string[];
  privateKey?: string; // For authorized operations
  gasLimit: number;
  maxGasPrice: string; // in wei
}

export interface LinkedWalletInfo {
  primaryWallet: string;
  linkedWallets: string[];
  linkTimestamps: number[];
  totalLinked: number;
}

export interface WalletLinkValidation {
  isValid: boolean;
  reason?: string;
  requiredSignature?: string;
}

export class WalletLinkingService {
  private config: WalletLinkingConfig;
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer?: ethers.Wallet;
  private linkingCache: Map<string, LinkedWalletInfo> = new Map();

  // CreditScore contract ABI (relevant functions only)
  private readonly CONTRACT_ABI = [
    'function createCreditProfile(address user) external',
    'function linkWallet(address user, address walletToLink) external',
    'function getLinkedWallets(address user) external view returns (address[])',
    'function getCreditProfile(address user) external view returns (bool exists, address userAddress, uint256 lastUpdated)',
    'function authorizedUpdaters(address) external view returns (bool)',
    'event WalletLinked(address indexed user, address indexed linkedWallet)',
    'event CreditProfileCreated(address indexed user)'
  ];

  constructor(config: WalletLinkingConfig) {
    this.config = config;
    this.initializeProvider();
    this.initializeContract();
  }

  /**
   * Initialize Ethereum provider with fallback support
   */
  private initializeProvider(): void {
    const rpcUrls = [this.config.rpcUrl, ...this.config.fallbackRpcUrls];
    
    // Try each RPC URL until one works
    for (const rpcUrl of rpcUrls) {
      try {
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        console.log(`Connected to Ethereum RPC: ${rpcUrl}`);
        break;
      } catch (error) {
        console.error(`Failed to connect to ${rpcUrl}:`, formatError(error));
      }
    }

    if (!this.provider) {
      throw new Error('Failed to connect to any Ethereum RPC endpoint');
    }
  }

  /**
   * Initialize contract instance and signer
   */
  private initializeContract(): void {
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      this.CONTRACT_ABI,
      this.provider
    );

    // Initialize signer if private key is provided
    if (this.config.privateKey) {
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      this.contract = this.contract.connect(this.signer);
    }
  }

  /**
   * Create a new credit profile for a user
   */
  public async createCreditProfile(userAddress: string): Promise<string> {
    try {
      if (!isValidAddress(userAddress)) {
        throw new Error(`Invalid user address: ${userAddress}`);
      }

      if (!this.signer) {
        throw new Error('No signer configured for contract operations');
      }

      // Check if profile already exists
      const profileExists = await this.checkProfileExists(userAddress);
      if (profileExists) {
        throw new Error(`Credit profile already exists for ${userAddress}`);
      }

      // Create the profile
      const tx = await this.contract.createCreditProfile(userAddress, {
        gasLimit: this.config.gasLimit,
        maxFeePerGas: this.config.maxGasPrice
      });

      console.log(`Creating credit profile for ${userAddress}, tx: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      // Update cache
      this.linkingCache.set(userAddress, {
        primaryWallet: userAddress,
        linkedWallets: [],
        linkTimestamps: [],
        totalLinked: 0
      });

      return receipt.transactionHash;
    } catch (error) {
      console.error(`Failed to create credit profile for ${userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Link a wallet to an existing credit profile
   */
  public async linkWallet(
    primaryWallet: string,
    walletToLink: string,
    linkRequest?: WalletLinkRequest
  ): Promise<string> {
    try {
      // Validate addresses
      if (!isValidAddress(primaryWallet)) {
        throw new Error(`Invalid primary wallet address: ${primaryWallet}`);
      }
      if (!isValidAddress(walletToLink)) {
        throw new Error(`Invalid wallet to link address: ${walletToLink}`);
      }

      if (!this.signer) {
        throw new Error('No signer configured for contract operations');
      }

      // Validate the linking request
      const validation = await this.validateWalletLink(primaryWallet, walletToLink, linkRequest);
      if (!validation.isValid) {
        throw new Error(`Wallet linking validation failed: ${validation.reason}`);
      }

      // Check if primary wallet has a profile
      const profileExists = await this.checkProfileExists(primaryWallet);
      if (!profileExists) {
        // Create profile first
        await this.createCreditProfile(primaryWallet);
      }

      // Link the wallet
      const tx = await this.contract.linkWallet(primaryWallet, walletToLink, {
        gasLimit: this.config.gasLimit,
        maxFeePerGas: this.config.maxGasPrice
      });

      console.log(`Linking wallet ${walletToLink} to ${primaryWallet}, tx: ${tx.hash}`);
      
      const receipt = await tx.wait();

      // Update cache
      await this.updateLinkingCache(primaryWallet);

      return receipt.transactionHash;
    } catch (error) {
      console.error(`Failed to link wallet ${walletToLink} to ${primaryWallet}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get all linked wallets for a primary wallet
   */
  public async getLinkedWallets(primaryWallet: string): Promise<LinkedWalletInfo> {
    try {
      if (!isValidAddress(primaryWallet)) {
        throw new Error(`Invalid primary wallet address: ${primaryWallet}`);
      }

      // Check cache first
      const cached = this.linkingCache.get(primaryWallet);
      if (cached) {
        return cached;
      }

      // Fetch from contract
      const linkedWallets = await this.contract.getLinkedWallets(primaryWallet);
      
      const linkInfo: LinkedWalletInfo = {
        primaryWallet,
        linkedWallets: linkedWallets,
        linkTimestamps: [], // Would need to fetch from events for exact timestamps
        totalLinked: linkedWallets.length
      };

      // Cache the result
      this.linkingCache.set(primaryWallet, linkInfo);

      return linkInfo;
    } catch (error) {
      console.error(`Failed to get linked wallets for ${primaryWallet}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Check if a wallet is linked to any primary wallet
   */
  public async findPrimaryWallet(walletAddress: string): Promise<string | null> {
    try {
      if (!isValidAddress(walletAddress)) {
        throw new Error(`Invalid wallet address: ${walletAddress}`);
      }

      // Check if this wallet itself is a primary wallet
      const profileExists = await this.checkProfileExists(walletAddress);
      if (profileExists) {
        return walletAddress;
      }

      // Search through cached linking info
      for (const [primaryWallet, linkInfo] of this.linkingCache.entries()) {
        if (linkInfo.linkedWallets.includes(walletAddress)) {
          return primaryWallet;
        }
      }

      // If not found in cache, we'd need to search through events
      // For now, return null (could be enhanced with event filtering)
      return null;
    } catch (error) {
      console.error(`Failed to find primary wallet for ${walletAddress}:`, formatError(error));
      return null;
    }
  }

  /**
   * Validate a wallet linking request
   */
  public async validateWalletLink(
    primaryWallet: string,
    walletToLink: string,
    linkRequest?: WalletLinkRequest
  ): Promise<WalletLinkValidation> {
    try {
      // Basic address validation
      if (!isValidAddress(primaryWallet) || !isValidAddress(walletToLink)) {
        return {
          isValid: false,
          reason: 'Invalid wallet addresses'
        };
      }

      // Check if trying to link to self
      if (primaryWallet.toLowerCase() === walletToLink.toLowerCase()) {
        return {
          isValid: false,
          reason: 'Cannot link wallet to itself'
        };
      }

      // Check if wallet is already linked elsewhere
      const existingPrimary = await this.findPrimaryWallet(walletToLink);
      if (existingPrimary && existingPrimary.toLowerCase() !== primaryWallet.toLowerCase()) {
        return {
          isValid: false,
          reason: `Wallet ${walletToLink} is already linked to ${existingPrimary}`
        };
      }

      // Check if wallet to link already has its own profile
      const hasOwnProfile = await this.checkProfileExists(walletToLink);
      if (hasOwnProfile) {
        return {
          isValid: false,
          reason: `Wallet ${walletToLink} already has its own credit profile`
        };
      }

      // Validate signature if provided
      if (linkRequest) {
        const signatureValid = await this.validateLinkSignature(linkRequest);
        if (!signatureValid) {
          return {
            isValid: false,
            reason: 'Invalid signature for wallet linking request'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validating wallet link:', formatError(error));
      return {
        isValid: false,
        reason: `Validation error: ${formatError(error)}`
      };
    }
  }

  /**
   * Generate signature message for wallet linking
   */
  public generateLinkSignatureMessage(
    primaryWallet: string,
    walletToLink: string,
    timestamp: number
  ): string {
    return `Link wallet ${walletToLink} to primary wallet ${primaryWallet} at timestamp ${timestamp}`;
  }

  /**
   * Validate signature for wallet linking request
   */
  private async validateLinkSignature(linkRequest: WalletLinkRequest): Promise<boolean> {
    try {
      const message = this.generateLinkSignatureMessage(
        linkRequest.primaryWallet,
        linkRequest.walletToLink,
        linkRequest.timestamp
      );

      // Check timestamp is recent (within 1 hour)
      const now = getCurrentTimestamp();
      if (Math.abs(now - linkRequest.timestamp) > 3600000) {
        return false;
      }

      // Verify signature
      const messageHash = ethers.utils.hashMessage(message);
      const recoveredAddress = ethers.utils.recoverAddress(messageHash, linkRequest.signature);

      // Signature should be from the wallet being linked
      return recoveredAddress.toLowerCase() === linkRequest.walletToLink.toLowerCase();
    } catch (error) {
      console.error('Error validating link signature:', formatError(error));
      return false;
    }
  }

  /**
   * Check if a credit profile exists for a wallet
   */
  private async checkProfileExists(walletAddress: string): Promise<boolean> {
    try {
      const profile = await this.contract.getCreditProfile(walletAddress);
      return profile.exists;
    } catch (error) {
      console.error(`Error checking profile existence for ${walletAddress}:`, formatError(error));
      return false;
    }
  }

  /**
   * Update linking cache for a primary wallet
   */
  private async updateLinkingCache(primaryWallet: string): Promise<void> {
    try {
      const linkedWallets = await this.contract.getLinkedWallets(primaryWallet);
      
      this.linkingCache.set(primaryWallet, {
        primaryWallet,
        linkedWallets: linkedWallets,
        linkTimestamps: [], // Could be populated from events
        totalLinked: linkedWallets.length
      });
    } catch (error) {
      console.error(`Failed to update linking cache for ${primaryWallet}:`, formatError(error));
    }
  }

  /**
   * Get all wallets associated with a primary wallet (including the primary itself)
   */
  public async getAllAssociatedWallets(primaryWallet: string): Promise<string[]> {
    try {
      const linkInfo = await this.getLinkedWallets(primaryWallet);
      return [primaryWallet, ...linkInfo.linkedWallets];
    } catch (error) {
      console.error(`Failed to get associated wallets for ${primaryWallet}:`, formatError(error));
      return [primaryWallet]; // Return at least the primary wallet
    }
  }

  /**
   * Batch link multiple wallets to a primary wallet
   */
  public async batchLinkWallets(
    primaryWallet: string,
    walletsToLink: string[],
    linkRequests?: WalletLinkRequest[]
  ): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < walletsToLink.length; i++) {
      try {
        const walletToLink = walletsToLink[i];
        const linkRequest = linkRequests?.[i];
        
        const txHash = await this.linkWallet(primaryWallet, walletToLink, linkRequest);
        results.push(txHash);
        
        console.log(`Successfully linked wallet ${i + 1}/${walletsToLink.length}: ${walletToLink}`);
      } catch (error) {
        console.error(`Failed to link wallet ${walletsToLink[i]}:`, formatError(error));
        results.push(''); // Empty string indicates failure
      }
    }

    return results;
  }

  /**
   * Get service status and metrics
   */
  public getServiceStatus(): {
    contractAddress: string;
    isConnected: boolean;
    cachedProfiles: number;
    hasAuthorization: boolean;
  } {
    return {
      contractAddress: this.config.contractAddress,
      isConnected: !!this.provider,
      cachedProfiles: this.linkingCache.size,
      hasAuthorization: !!this.signer
    };
  }

  /**
   * Health check for wallet linking service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const serviceStatus = this.getServiceStatus();
      
      // Test contract connectivity
      const blockNumber = await this.provider.getBlockNumber();
      
      // Test contract call
      const testAddress = '0x0000000000000000000000000000000000000001';
      await this.contract.getCreditProfile(testAddress);

      const isHealthy = serviceStatus.isConnected && blockNumber > 0;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          ...serviceStatus,
          currentBlock: blockNumber,
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

  /**
   * Clear linking cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.linkingCache.clear();
    console.log('Wallet linking cache cleared');
  }
}

// Export configuration factory
export function createWalletLinkingConfig(): WalletLinkingConfig {
  return {
    contractAddress: process.env.CREDIT_SCORE_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    fallbackRpcUrls: [
      process.env.ETHEREUM_FALLBACK_RPC_1 || 'https://mainnet.infura.io/v3/your-api-key',
      process.env.ETHEREUM_FALLBACK_RPC_2 || 'https://rpc.ankr.com/eth'
    ],
    privateKey: process.env.WALLET_LINKING_PRIVATE_KEY,
    gasLimit: 200000,
    maxGasPrice: ethers.utils.parseUnits('50', 'gwei').toString()
  };
}