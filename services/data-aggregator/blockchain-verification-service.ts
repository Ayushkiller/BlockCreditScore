/**
 * Blockchain Verification Service
 * Handles real wallet ownership verification and blockchain-verified data storage
 */

import { ethers } from 'ethers';
import crypto from 'crypto';

export interface BlockchainVerifiedUserProfile {
  address: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
  verificationMethod: 'signature' | 'transaction' | 'none';
  verificationTimestamp: number;
  verificationTxHash?: string;
  verificationBlockNumber?: number;
  realTransactionHistory: RealTransactionRecord[];
  blockchainProofs: BlockchainProof[];
  dataIntegrityHash: string;
  lastUpdated: number;
}

export interface RealTransactionRecord {
  hash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  methodSignature?: string;
  decodedData?: any;
  protocolInteraction?: string;
  blockExplorerUrl: string;
  verificationStatus: 'verified' | 'pending';
}

export interface BlockchainProof {
  id: string;
  type: 'transaction' | 'signature' | 'block' | 'event';
  data: any;
  hash: string;
  blockNumber?: number;
  timestamp: number;
  verificationUrl: string;
  isValid: boolean;
}

export interface WalletOwnershipVerification {
  address: string;
  message: string;
  signature: string;
  timestamp: number;
  isValid: boolean;
  verificationMethod: 'personal_sign' | 'typed_data' | 'transaction';
}

class BlockchainVerificationService {
  private provider: ethers.JsonRpcProvider;
  private blockExplorerBaseUrl: string = 'https://etherscan.io';

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Verify wallet ownership using signature verification
   */
  async verifyWalletOwnership(
    address: string,
    message: string,
    signature: string
  ): Promise<WalletOwnershipVerification> {
    try {
      // Verify the signature matches the address
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

      return {
        address,
        message,
        signature,
        timestamp: Date.now(),
        isValid,
        verificationMethod: 'personal_sign'
      };
    } catch (error) {
      console.error('Error verifying wallet ownership:', error);
      return {
        address,
        message,
        signature,
        timestamp: Date.now(),
        isValid: false,
        verificationMethod: 'personal_sign'
      };
    }
  }

  /**
   * Generate a verification message for wallet ownership
   */
  generateVerificationMessage(address: string, nonce: string): string {
    const timestamp = Date.now();
    return `Verify wallet ownership for Credit Intelligence System\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis signature proves you own this wallet address.`;
  }

  /**
   * Fetch and verify real transaction history for an address
   */
  async fetchRealTransactionHistory(
    address: string,
    fromBlock: number = 0,
    toBlock: number = -1
  ): Promise<RealTransactionRecord[]> {
    try {
      const transactions: RealTransactionRecord[] = [];
      
      // Get transaction history from blockchain
      const latestBlock = await this.provider.getBlockNumber();
      const endBlock = toBlock === -1 ? latestBlock : Math.min(toBlock, latestBlock);
      
      // Fetch transactions in batches to avoid rate limits
      const batchSize = 1000;
      for (let block = fromBlock; block <= endBlock; block += batchSize) {
        const batchEnd = Math.min(block + batchSize - 1, endBlock);
        
        try {
          // Get block range
          for (let blockNum = block; blockNum <= batchEnd; blockNum++) {
            const blockData = await this.provider.getBlock(blockNum, true);
            if (!blockData || !blockData.transactions) continue;

            // Filter transactions involving the address
            for (const tx of blockData.transactions) {
              if (typeof tx === 'string') continue;
              
              if (tx.from?.toLowerCase() === address.toLowerCase() || 
                  tx.to?.toLowerCase() === address.toLowerCase()) {
                
                // Get transaction receipt for status and gas used
                const receipt = await this.provider.getTransactionReceipt(tx.hash);
                if (!receipt) continue;

                const txRecord: RealTransactionRecord = {
                  hash: tx.hash,
                  blockNumber: tx.blockNumber || 0,
                  blockHash: tx.blockHash || '',
                  timestamp: blockData.timestamp,
                  from: tx.from || '',
                  to: tx.to || '',
                  value: tx.value.toString(),
                  gasUsed: receipt.gasUsed.toString(),
                  gasPrice: tx.gasPrice?.toString() || '0',
                  status: receipt.status === 1 ? 'success' : 'failed',
                  blockExplorerUrl: `${this.blockExplorerBaseUrl}/tx/${tx.hash}`,
                  verificationStatus: 'verified'
                };

                // Decode method signature if available
                if (tx.data && tx.data.length > 10) {
                  txRecord.methodSignature = tx.data.slice(0, 10);
                  txRecord.decodedData = await this.decodeTransactionData(tx.data, tx.to || '');
                }

                // Identify protocol interaction
                txRecord.protocolInteraction = await this.identifyProtocolInteraction(tx.to || '');

                transactions.push(txRecord);
              }
            }
          }
        } catch (blockError) {
          console.error(`Error fetching block ${block}:`, blockError);
          continue;
        }
      }

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching real transaction history:', error);
      return [];
    }
  }

  /**
   * Decode transaction data to understand the method call
   */
  private async decodeTransactionData(data: string, contractAddress: string): Promise<any> {
    try {
      // This would typically use contract ABIs to decode the data
      // For now, we'll return basic information
      return {
        methodId: data.slice(0, 10),
        inputData: data.slice(10),
        contractAddress,
        decodingStatus: 'partial'
      };
    } catch (error) {
      return {
        methodId: data.slice(0, 10),
        decodingStatus: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Identify which DeFi protocol a transaction interacted with
   */
  private async identifyProtocolInteraction(contractAddress: string): Promise<string> {
    const knownProtocols: { [key: string]: string } = {
      '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3 Router',
      '0x1F98431c8aD98523631AE4a59f267346ea31F984': 'Uniswap V3 Factory',
      '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2': 'Aave V3 Pool',
      '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B': 'Compound Comptroller',
      '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419': 'Chainlink ETH/USD Price Feed'
    };

    return knownProtocols[contractAddress] || 'Unknown Protocol';
  }

  /**
   * Create blockchain proof for a transaction
   */
  async createBlockchainProof(
    transactionHash: string,
    type: 'transaction' | 'signature' | 'block' | 'event' = 'transaction'
  ): Promise<BlockchainProof> {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!tx || !receipt) {
        throw new Error('Transaction not found');
      }

      const proofData = {
        transaction: tx,
        receipt: receipt,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        confirmations: await tx.confirmations()
      };

      const proofHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(proofData))
        .digest('hex');

      return {
        id: `proof_${transactionHash}_${Date.now()}`,
        type,
        data: proofData,
        hash: proofHash,
        blockNumber: tx.blockNumber,
        timestamp: Date.now(),
        verificationUrl: `${this.blockExplorerBaseUrl}/tx/${transactionHash}`,
        isValid: receipt.status === 1
      };
    } catch (error) {
      console.error('Error creating blockchain proof:', error);
      throw error;
    }
  }

  /**
   * Verify blockchain proof integrity
   */
  async verifyBlockchainProof(proof: BlockchainProof): Promise<boolean> {
    try {
      // Re-fetch the transaction data
      const tx = await this.provider.getTransaction(proof.data.transaction.hash);
      const receipt = await this.provider.getTransactionReceipt(proof.data.transaction.hash);
      
      if (!tx || !receipt) {
        return false;
      }

      // Verify the proof data matches current blockchain state
      const currentProofData = {
        transaction: tx,
        receipt: receipt,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        confirmations: await tx.confirmations()
      };

      const currentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(currentProofData))
        .digest('hex');

      return currentHash === proof.hash && receipt.status === 1;
    } catch (error) {
      console.error('Error verifying blockchain proof:', error);
      return false;
    }
  }

  /**
   * Create blockchain-verified user profile
   */
  async createBlockchainVerifiedProfile(
    address: string,
    verificationData: WalletOwnershipVerification
  ): Promise<BlockchainVerifiedUserProfile> {
    try {
      // Fetch real transaction history
      const transactionHistory = await this.fetchRealTransactionHistory(address);
      
      // Create blockchain proofs for recent transactions
      const blockchainProofs: BlockchainProof[] = [];
      for (const tx of transactionHistory.slice(0, 10)) { // Proof for last 10 transactions
        try {
          const proof = await this.createBlockchainProof(tx.hash);
          blockchainProofs.push(proof);
        } catch (error) {
          console.error(`Error creating proof for transaction ${tx.hash}:`, error);
        }
      }

      // Calculate data integrity hash
      const profileData = {
        address,
        verificationData,
        transactionHistory,
        blockchainProofs,
        timestamp: Date.now()
      };

      const dataIntegrityHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(profileData))
        .digest('hex');

      return {
        address,
        verificationStatus: verificationData.isValid ? 'verified' : 'failed',
        verificationMethod: 'signature',
        verificationTimestamp: verificationData.timestamp,
        realTransactionHistory: transactionHistory,
        blockchainProofs,
        dataIntegrityHash,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error creating blockchain-verified profile:', error);
      throw error;
    }
  }

  /**
   * Update blockchain-verified profile with new transaction data
   */
  async updateBlockchainVerifiedProfile(
    profile: BlockchainVerifiedUserProfile,
    fromBlock?: number
  ): Promise<BlockchainVerifiedUserProfile> {
    try {
      // Get the latest block number from existing transactions
      const lastBlock = profile.realTransactionHistory.length > 0 
        ? Math.max(...profile.realTransactionHistory.map(tx => tx.blockNumber))
        : 0;

      // Fetch new transactions since last update
      const newTransactions = await this.fetchRealTransactionHistory(
        profile.address,
        fromBlock || lastBlock + 1
      );

      // Merge with existing transactions and remove duplicates
      const allTransactions = [...profile.realTransactionHistory, ...newTransactions];
      const uniqueTransactions = allTransactions.filter((tx, index, arr) => 
        arr.findIndex(t => t.hash === tx.hash) === index
      );

      // Sort by timestamp (newest first)
      uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Create proofs for new transactions
      const newProofs: BlockchainProof[] = [];
      for (const tx of newTransactions.slice(0, 5)) { // Proof for last 5 new transactions
        try {
          const proof = await this.createBlockchainProof(tx.hash);
          newProofs.push(proof);
        } catch (error) {
          console.error(`Error creating proof for new transaction ${tx.hash}:`, error);
        }
      }

      // Update blockchain proofs (keep recent ones)
      const allProofs = [...profile.blockchainProofs, ...newProofs];
      const recentProofs = allProofs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20); // Keep only 20 most recent proofs

      // Recalculate data integrity hash
      const updatedProfileData = {
        address: profile.address,
        verificationStatus: profile.verificationStatus,
        realTransactionHistory: uniqueTransactions,
        blockchainProofs: recentProofs,
        timestamp: Date.now()
      };

      const newDataIntegrityHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(updatedProfileData))
        .digest('hex');

      return {
        ...profile,
        realTransactionHistory: uniqueTransactions,
        blockchainProofs: recentProofs,
        dataIntegrityHash: newDataIntegrityHash,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error updating blockchain-verified profile:', error);
      throw error;
    }
  }

  /**
   * Export blockchain-verified data with transaction hashes and block explorer links
   */
  async exportBlockchainVerifiedData(
    profile: BlockchainVerifiedUserProfile,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const exportData = {
        profile: {
          address: profile.address,
          verificationStatus: profile.verificationStatus,
          verificationMethod: profile.verificationMethod,
          verificationTimestamp: new Date(profile.verificationTimestamp).toISOString(),
          dataIntegrityHash: profile.dataIntegrityHash,
          lastUpdated: new Date(profile.lastUpdated).toISOString()
        },
        transactions: profile.realTransactionHistory.map(tx => ({
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          blockHash: tx.blockHash,
          timestamp: new Date(tx.timestamp * 1000).toISOString(),
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          status: tx.status,
          protocolInteraction: tx.protocolInteraction,
          blockExplorerUrl: tx.blockExplorerUrl,
          verificationStatus: tx.verificationStatus
        })),
        blockchainProofs: profile.blockchainProofs.map(proof => ({
          id: proof.id,
          type: proof.type,
          hash: proof.hash,
          blockNumber: proof.blockNumber,
          timestamp: new Date(proof.timestamp).toISOString(),
          verificationUrl: proof.verificationUrl,
          isValid: proof.isValid
        })),
        exportMetadata: {
          exportTimestamp: new Date().toISOString(),
          totalTransactions: profile.realTransactionHistory.length,
          totalProofs: profile.blockchainProofs.length,
          verificationUrls: {
            etherscan: `${this.blockExplorerBaseUrl}/address/${profile.address}`,
            transactions: profile.realTransactionHistory.map(tx => tx.blockExplorerUrl)
          }
        }
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else {
        // Convert to CSV format
        const csvLines = [
          'Hash,Block Number,Timestamp,From,To,Value,Gas Used,Status,Protocol,Explorer URL',
          ...exportData.transactions.map(tx => 
            `${tx.hash},${tx.blockNumber},${tx.timestamp},${tx.from},${tx.to},${tx.value},${tx.gasUsed},${tx.status},${tx.protocolInteraction},${tx.blockExplorerUrl}`
          )
        ];
        return csvLines.join('\n');
      }
    } catch (error) {
      console.error('Error exporting blockchain-verified data:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity of a blockchain-verified profile
   */
  async verifyProfileDataIntegrity(profile: BlockchainVerifiedUserProfile): Promise<boolean> {
    try {
      // Recalculate the data integrity hash
      const profileData = {
        address: profile.address,
        verificationStatus: profile.verificationStatus,
        realTransactionHistory: profile.realTransactionHistory,
        blockchainProofs: profile.blockchainProofs,
        timestamp: profile.lastUpdated
      };

      const calculatedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(profileData))
        .digest('hex');

      return calculatedHash === profile.dataIntegrityHash;
    } catch (error) {
      console.error('Error verifying profile data integrity:', error);
      return false;
    }
  }
}

export default BlockchainVerificationService;