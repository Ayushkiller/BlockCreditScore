/**
 * Data Integrity and Verification Service
 * Handles real blockchain-verifiable computation inputs and data verification
 */

import { ethers } from 'ethers';
import crypto from 'crypto';

export interface DataIntegrityRecord {
  id: string;
  dataType: 'calculation' | 'transaction' | 'score' | 'profile';
  inputData: any;
  computationResult: any;
  blockchainReferences: BlockchainReference[];
  integrityHash: string;
  timestamp: number;
  verificationStatus: 'verified' | 'pending' | 'failed';
  auditTrail: AuditTrailEntry[];
}

export interface BlockchainReference {
  type: 'transaction' | 'block' | 'event' | 'contract_call';
  hash: string;
  blockNumber: number;
  timestamp: number;
  verificationUrl: string;
  isValid: boolean;
  confirmations: number;
}

export interface AuditTrailEntry {
  id: string;
  action: string;
  timestamp: number;
  blockNumber?: number;
  transactionHash?: string;
  inputHash: string;
  outputHash: string;
  verificationProof: string;
  isVerifiable: boolean;
}

export interface HistoricalDataPoint {
  timestamp: number;
  blockNumber: number;
  blockHash: string;
  dataHash: string;
  value: any;
  verificationProof: BlockchainReference;
  isVerified: boolean;
}

export interface ComputationVerification {
  inputHash: string;
  outputHash: string;
  computationMethod: string;
  blockchainInputs: BlockchainReference[];
  verificationProof: string;
  isVerifiable: boolean;
  timestamp: number;
}

class DataIntegrityVerificationService {
  private provider: ethers.JsonRpcProvider;
  private blockExplorerBaseUrl: string = 'https://etherscan.io';

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Create data integrity record with blockchain-verifiable inputs
   */
  async createDataIntegrityRecord(
    dataType: 'calculation' | 'transaction' | 'score' | 'profile',
    inputData: any,
    computationResult: any,
    blockchainReferences: BlockchainReference[]
  ): Promise<DataIntegrityRecord> {
    try {
      const id = `integrity_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Create integrity hash from all inputs and outputs
      const integrityData = {
        dataType,
        inputData,
        computationResult,
        blockchainReferences: blockchainReferences.map(ref => ({
          type: ref.type,
          hash: ref.hash,
          blockNumber: ref.blockNumber,
          timestamp: ref.timestamp
        })),
        timestamp: Date.now()
      };

      const integrityHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(integrityData))
        .digest('hex');

      // Verify all blockchain references
      const verifiedReferences = await Promise.all(
        blockchainReferences.map(ref => this.verifyBlockchainReference(ref))
      );

      const allReferencesValid = verifiedReferences.every(ref => ref.isValid);

      // Create initial audit trail entry
      const initialAuditEntry: AuditTrailEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        action: 'data_integrity_record_created',
        timestamp: Date.now(),
        inputHash: crypto.createHash('sha256').update(JSON.stringify(inputData)).digest('hex'),
        outputHash: crypto.createHash('sha256').update(JSON.stringify(computationResult)).digest('hex'),
        verificationProof: integrityHash,
        isVerifiable: allReferencesValid
      };

      return {
        id,
        dataType,
        inputData,
        computationResult,
        blockchainReferences: verifiedReferences,
        integrityHash,
        timestamp: Date.now(),
        verificationStatus: allReferencesValid ? 'verified' : 'failed',
        auditTrail: [initialAuditEntry]
      };
    } catch (error) {
      console.error('Error creating data integrity record:', error);
      throw error;
    }
  }

  /**
   * Verify blockchain reference integrity
   */
  async verifyBlockchainReference(reference: BlockchainReference): Promise<BlockchainReference> {
    try {
      let isValid = false;
      let confirmations = 0;

      switch (reference.type) {
        case 'transaction':
          const tx = await this.provider.getTransaction(reference.hash);
          const receipt = await this.provider.getTransactionReceipt(reference.hash);
          if (tx && receipt) {
            isValid = receipt.status === 1 && tx.blockNumber === reference.blockNumber;
            confirmations = await tx.confirmations();
          }
          break;

        case 'block':
          const block = await this.provider.getBlock(reference.blockNumber);
          if (block) {
            isValid = block.hash === reference.hash && block.timestamp === reference.timestamp;
            const latestBlock = await this.provider.getBlockNumber();
            confirmations = latestBlock - reference.blockNumber;
          }
          break;

        case 'event':
          // Verify event log exists in the specified transaction
          const eventTx = await this.provider.getTransactionReceipt(reference.hash);
          if (eventTx && eventTx.logs.length > 0) {
            isValid = eventTx.blockNumber === reference.blockNumber;
            const eventTxDetails = await this.provider.getTransaction(reference.hash);
            if (eventTxDetails) {
              confirmations = await eventTxDetails.confirmations();
            }
          }
          break;

        case 'contract_call':
          // Verify contract call result at specific block
          const callTx = await this.provider.getTransaction(reference.hash);
          const callReceipt = await this.provider.getTransactionReceipt(reference.hash);
          if (callTx && callReceipt) {
            isValid = callReceipt.status === 1 && callTx.blockNumber === reference.blockNumber;
            confirmations = await callTx.confirmations();
          }
          break;
      }

      return {
        ...reference,
        isValid,
        confirmations,
        verificationUrl: `${this.blockExplorerBaseUrl}/tx/${reference.hash}`
      };
    } catch (error) {
      console.error('Error verifying blockchain reference:', error);
      return {
        ...reference,
        isValid: false,
        confirmations: 0,
        verificationUrl: `${this.blockExplorerBaseUrl}/tx/${reference.hash}`
      };
    }
  }

  /**
   * Create computation verification with blockchain inputs
   */
  async createComputationVerification(
    inputData: any,
    outputData: any,
    computationMethod: string,
    blockchainInputs: BlockchainReference[]
  ): Promise<ComputationVerification> {
    try {
      const inputHash = crypto.createHash('sha256').update(JSON.stringify(inputData)).digest('hex');
      const outputHash = crypto.createHash('sha256').update(JSON.stringify(outputData)).digest('hex');

      // Verify all blockchain inputs
      const verifiedInputs = await Promise.all(
        blockchainInputs.map(input => this.verifyBlockchainReference(input))
      );

      const allInputsValid = verifiedInputs.every(input => input.isValid);

      // Create verification proof
      const verificationData = {
        inputHash,
        outputHash,
        computationMethod,
        blockchainInputs: verifiedInputs.map(input => ({
          type: input.type,
          hash: input.hash,
          blockNumber: input.blockNumber,
          isValid: input.isValid
        })),
        timestamp: Date.now()
      };

      const verificationProof = crypto
        .createHash('sha256')
        .update(JSON.stringify(verificationData))
        .digest('hex');

      return {
        inputHash,
        outputHash,
        computationMethod,
        blockchainInputs: verifiedInputs,
        verificationProof,
        isVerifiable: allInputsValid,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error creating computation verification:', error);
      throw error;
    }
  }

  /**
   * Track historical data with blockchain references
   */
  async trackHistoricalData(
    value: any,
    blockNumber: number,
    transactionHash?: string
  ): Promise<HistoricalDataPoint> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      if (!block) {
        throw new Error('Block not found');
      }

      const dataHash = crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

      // Create blockchain reference for verification
      const verificationProof: BlockchainReference = {
        type: transactionHash ? 'transaction' : 'block',
        hash: transactionHash || block.hash,
        blockNumber: block.number,
        timestamp: block.timestamp,
        verificationUrl: transactionHash 
          ? `${this.blockExplorerBaseUrl}/tx/${transactionHash}`
          : `${this.blockExplorerBaseUrl}/block/${blockNumber}`,
        isValid: true,
        confirmations: 0
      };

      // Verify the reference
      const verifiedProof = await this.verifyBlockchainReference(verificationProof);

      return {
        timestamp: block.timestamp,
        blockNumber: block.number,
        blockHash: block.hash,
        dataHash,
        value,
        verificationProof: verifiedProof,
        isVerified: verifiedProof.isValid
      };
    } catch (error) {
      console.error('Error tracking historical data:', error);
      throw error;
    }
  }

  /**
   * Create audit trail entry with blockchain verification
   */
  async createAuditTrailEntry(
    action: string,
    inputData: any,
    outputData: any,
    blockNumber?: number,
    transactionHash?: string
  ): Promise<AuditTrailEntry> {
    try {
      const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const inputHash = crypto.createHash('sha256').update(JSON.stringify(inputData)).digest('hex');
      const outputHash = crypto.createHash('sha256').update(JSON.stringify(outputData)).digest('hex');

      let verificationProof = '';
      let isVerifiable = false;

      if (blockNumber && transactionHash) {
        // Verify the transaction exists and is valid
        const tx = await this.provider.getTransaction(transactionHash);
        const receipt = await this.provider.getTransactionReceipt(transactionHash);
        
        if (tx && receipt && receipt.status === 1 && tx.blockNumber === blockNumber) {
          isVerifiable = true;
          verificationProof = crypto
            .createHash('sha256')
            .update(JSON.stringify({
              action,
              inputHash,
              outputHash,
              blockNumber,
              transactionHash,
              timestamp: Date.now()
            }))
            .digest('hex');
        }
      } else {
        // Create verification proof without blockchain reference
        verificationProof = crypto
          .createHash('sha256')
          .update(JSON.stringify({
            action,
            inputHash,
            outputHash,
            timestamp: Date.now()
          }))
          .digest('hex');
      }

      return {
        id,
        action,
        timestamp: Date.now(),
        blockNumber,
        transactionHash,
        inputHash,
        outputHash,
        verificationProof,
        isVerifiable
      };
    } catch (error) {
      console.error('Error creating audit trail entry:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity record
   */
  async verifyDataIntegrityRecord(record: DataIntegrityRecord): Promise<boolean> {
    try {
      // Recalculate integrity hash
      const integrityData = {
        dataType: record.dataType,
        inputData: record.inputData,
        computationResult: record.computationResult,
        blockchainReferences: record.blockchainReferences.map(ref => ({
          type: ref.type,
          hash: ref.hash,
          blockNumber: ref.blockNumber,
          timestamp: ref.timestamp
        })),
        timestamp: record.timestamp
      };

      const calculatedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(integrityData))
        .digest('hex');

      if (calculatedHash !== record.integrityHash) {
        return false;
      }

      // Verify all blockchain references are still valid
      const verificationResults = await Promise.all(
        record.blockchainReferences.map(ref => this.verifyBlockchainReference(ref))
      );

      return verificationResults.every(ref => ref.isValid);
    } catch (error) {
      console.error('Error verifying data integrity record:', error);
      return false;
    }
  }

  /**
   * Verify computation with blockchain inputs
   */
  async verifyComputation(verification: ComputationVerification): Promise<boolean> {
    try {
      // Re-verify all blockchain inputs
      const currentVerifications = await Promise.all(
        verification.blockchainInputs.map(input => this.verifyBlockchainReference(input))
      );

      // Check if all inputs are still valid
      const allInputsValid = currentVerifications.every(input => input.isValid);

      if (!allInputsValid) {
        return false;
      }

      // Verify the verification proof
      const verificationData = {
        inputHash: verification.inputHash,
        outputHash: verification.outputHash,
        computationMethod: verification.computationMethod,
        blockchainInputs: currentVerifications.map(input => ({
          type: input.type,
          hash: input.hash,
          blockNumber: input.blockNumber,
          isValid: input.isValid
        })),
        timestamp: verification.timestamp
      };

      const calculatedProof = crypto
        .createHash('sha256')
        .update(JSON.stringify(verificationData))
        .digest('hex');

      return calculatedProof === verification.verificationProof;
    } catch (error) {
      console.error('Error verifying computation:', error);
      return false;
    }
  }

  /**
   * Verify historical data point
   */
  async verifyHistoricalDataPoint(dataPoint: HistoricalDataPoint): Promise<boolean> {
    try {
      // Verify the data hash
      const calculatedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(dataPoint.value))
        .digest('hex');

      if (calculatedHash !== dataPoint.dataHash) {
        return false;
      }

      // Verify the blockchain reference
      const verifiedProof = await this.verifyBlockchainReference(dataPoint.verificationProof);
      
      return verifiedProof.isValid && 
             verifiedProof.blockNumber === dataPoint.blockNumber &&
             verifiedProof.timestamp === dataPoint.timestamp;
    } catch (error) {
      console.error('Error verifying historical data point:', error);
      return false;
    }
  }

  /**
   * Verify audit trail entry
   */
  async verifyAuditTrailEntry(entry: AuditTrailEntry): Promise<boolean> {
    try {
      let verificationData: any = {
        action: entry.action,
        inputHash: entry.inputHash,
        outputHash: entry.outputHash,
        timestamp: entry.timestamp
      };

      if (entry.blockNumber && entry.transactionHash) {
        // Verify blockchain reference
        const tx = await this.provider.getTransaction(entry.transactionHash);
        const receipt = await this.provider.getTransactionReceipt(entry.transactionHash);
        
        if (!tx || !receipt || receipt.status !== 1 || tx.blockNumber !== entry.blockNumber) {
          return false;
        }

        verificationData.blockNumber = entry.blockNumber;
        verificationData.transactionHash = entry.transactionHash;
      }

      const calculatedProof = crypto
        .createHash('sha256')
        .update(JSON.stringify(verificationData))
        .digest('hex');

      return calculatedProof === entry.verificationProof;
    } catch (error) {
      console.error('Error verifying audit trail entry:', error);
      return false;
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStatistics(records: DataIntegrityRecord[]): Promise<any> {
    try {
      const stats = {
        totalRecords: records.length,
        verifiedRecords: 0,
        pendingRecords: 0,
        failedRecords: 0,
        totalBlockchainReferences: 0,
        validBlockchainReferences: 0,
        totalAuditEntries: 0,
        verifiableAuditEntries: 0,
        dataTypes: {} as { [key: string]: number },
        averageConfirmations: 0,
        oldestRecord: null as DataIntegrityRecord | null,
        newestRecord: null as DataIntegrityRecord | null
      };

      let totalConfirmations = 0;
      let confirmationCount = 0;

      for (const record of records) {
        // Count by verification status
        switch (record.verificationStatus) {
          case 'verified':
            stats.verifiedRecords++;
            break;
          case 'pending':
            stats.pendingRecords++;
            break;
          case 'failed':
            stats.failedRecords++;
            break;
        }

        // Count by data type
        stats.dataTypes[record.dataType] = (stats.dataTypes[record.dataType] || 0) + 1;

        // Count blockchain references
        stats.totalBlockchainReferences += record.blockchainReferences.length;
        stats.validBlockchainReferences += record.blockchainReferences.filter(ref => ref.isValid).length;

        // Count audit entries
        stats.totalAuditEntries += record.auditTrail.length;
        stats.verifiableAuditEntries += record.auditTrail.filter(entry => entry.isVerifiable).length;

        // Calculate average confirmations
        for (const ref of record.blockchainReferences) {
          if (ref.confirmations > 0) {
            totalConfirmations += ref.confirmations;
            confirmationCount++;
          }
        }

        // Find oldest and newest records
        if (!stats.oldestRecord || record.timestamp < stats.oldestRecord.timestamp) {
          stats.oldestRecord = record;
        }
        if (!stats.newestRecord || record.timestamp > stats.newestRecord.timestamp) {
          stats.newestRecord = record;
        }
      }

      stats.averageConfirmations = confirmationCount > 0 ? Math.round(totalConfirmations / confirmationCount) : 0;

      return stats;
    } catch (error) {
      console.error('Error calculating verification statistics:', error);
      return null;
    }
  }
}

export default DataIntegrityVerificationService;