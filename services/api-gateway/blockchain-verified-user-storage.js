/**
 * Blockchain Verified User Storage Service
 * Handles storage and retrieval of blockchain-verified user profiles
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BlockchainVerifiedUserStorage {
  constructor() {
    this.storageDir = path.join(__dirname, '../../data/blockchain-verified-users');
    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Error creating storage directory:', error);
    }
  }

  /**
   * Store blockchain-verified user profile
   */
  async storeVerifiedProfile(profile) {
    try {
      const filename = `${profile.address.toLowerCase()}.json`;
      const filepath = path.join(this.storageDir, filename);
      
      // Add storage metadata
      const profileWithMetadata = {
        ...profile,
        storageMetadata: {
          storedAt: Date.now(),
          version: '1.0',
          storageHash: this.calculateStorageHash(profile)
        }
      };

      await fs.writeFile(filepath, JSON.stringify(profileWithMetadata, null, 2));
      
      console.log(`✅ Stored blockchain-verified profile for ${profile.address}`);
      return true;
    } catch (error) {
      console.error('Error storing verified profile:', error);
      return false;
    }
  }

  /**
   * Retrieve blockchain-verified user profile
   */
  async getVerifiedProfile(address) {
    try {
      const filename = `${address.toLowerCase()}.json`;
      const filepath = path.join(this.storageDir, filename);
      
      const data = await fs.readFile(filepath, 'utf8');
      const profile = JSON.parse(data);
      
      // Verify storage integrity
      const isValid = await this.verifyStorageIntegrity(profile);
      if (!isValid) {
        console.warn(`⚠️ Storage integrity check failed for ${address}`);
      }
      
      return profile;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error retrieving verified profile:', error);
      }
      return null;
    }
  }

  /**
   * Update blockchain-verified user profile
   */
  async updateVerifiedProfile(address, updates) {
    try {
      const existingProfile = await this.getVerifiedProfile(address);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }

      const updatedProfile = {
        ...existingProfile,
        ...updates,
        lastUpdated: Date.now()
      };

      // Recalculate data integrity hash
      updatedProfile.dataIntegrityHash = this.calculateDataIntegrityHash(updatedProfile);

      return await this.storeVerifiedProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating verified profile:', error);
      return false;
    }
  }

  /**
   * Get all verified profiles
   */
  async getAllVerifiedProfiles() {
    try {
      const files = await fs.readdir(this.storageDir);
      const profiles = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const address = file.replace('.json', '');
          const profile = await this.getVerifiedProfile(address);
          if (profile) {
            profiles.push(profile);
          }
        }
      }

      return profiles;
    } catch (error) {
      console.error('Error getting all verified profiles:', error);
      return [];
    }
  }

  /**
   * Delete verified profile
   */
  async deleteVerifiedProfile(address) {
    try {
      const filename = `${address.toLowerCase()}.json`;
      const filepath = path.join(this.storageDir, filename);
      
      await fs.unlink(filepath);
      console.log(`🗑️ Deleted blockchain-verified profile for ${address}`);
      return true;
    } catch (error) {
      console.error('Error deleting verified profile:', error);
      return false;
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStatistics() {
    try {
      const profiles = await this.getAllVerifiedProfiles();
      
      const stats = {
        totalProfiles: profiles.length,
        verifiedProfiles: profiles.filter(p => p.verificationStatus === 'verified').length,
        pendingProfiles: profiles.filter(p => p.verificationStatus === 'pending').length,
        failedProfiles: profiles.filter(p => p.verificationStatus === 'failed').length,
        verificationMethods: {},
        totalTransactions: 0,
        totalProofs: 0,
        averageTransactionsPerProfile: 0,
        oldestProfile: null,
        newestProfile: null
      };

      // Calculate detailed statistics
      profiles.forEach(profile => {
        // Count verification methods
        const method = profile.verificationMethod || 'none';
        stats.verificationMethods[method] = (stats.verificationMethods[method] || 0) + 1;

        // Count transactions and proofs
        stats.totalTransactions += profile.realTransactionHistory?.length || 0;
        stats.totalProofs += profile.blockchainProofs?.length || 0;

        // Find oldest and newest profiles
        if (!stats.oldestProfile || profile.verificationTimestamp < stats.oldestProfile.verificationTimestamp) {
          stats.oldestProfile = {
            address: profile.address,
            verificationTimestamp: profile.verificationTimestamp
          };
        }
        if (!stats.newestProfile || profile.verificationTimestamp > stats.newestProfile.verificationTimestamp) {
          stats.newestProfile = {
            address: profile.address,
            verificationTimestamp: profile.verificationTimestamp
          };
        }
      });

      stats.averageTransactionsPerProfile = profiles.length > 0 
        ? Math.round(stats.totalTransactions / profiles.length) 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting verification statistics:', error);
      return null;
    }
  }

  /**
   * Search verified profiles by criteria
   */
  async searchVerifiedProfiles(criteria) {
    try {
      const profiles = await this.getAllVerifiedProfiles();
      
      return profiles.filter(profile => {
        // Filter by verification status
        if (criteria.verificationStatus && profile.verificationStatus !== criteria.verificationStatus) {
          return false;
        }

        // Filter by verification method
        if (criteria.verificationMethod && profile.verificationMethod !== criteria.verificationMethod) {
          return false;
        }

        // Filter by minimum transaction count
        if (criteria.minTransactions && (profile.realTransactionHistory?.length || 0) < criteria.minTransactions) {
          return false;
        }

        // Filter by date range
        if (criteria.fromDate && profile.verificationTimestamp < criteria.fromDate) {
          return false;
        }
        if (criteria.toDate && profile.verificationTimestamp > criteria.toDate) {
          return false;
        }

        // Filter by address pattern
        if (criteria.addressPattern) {
          const pattern = new RegExp(criteria.addressPattern, 'i');
          if (!pattern.test(profile.address)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error searching verified profiles:', error);
      return [];
    }
  }

  /**
   * Export verified profile data
   */
  async exportVerifiedProfileData(address, format = 'json') {
    try {
      const profile = await this.getVerifiedProfile(address);
      if (!profile) {
        throw new Error('Profile not found');
      }

      const exportData = {
        profile: {
          address: profile.address,
          verificationStatus: profile.verificationStatus,
          verificationMethod: profile.verificationMethod,
          verificationTimestamp: new Date(profile.verificationTimestamp).toISOString(),
          dataIntegrityHash: profile.dataIntegrityHash,
          lastUpdated: new Date(profile.lastUpdated).toISOString()
        },
        transactions: profile.realTransactionHistory?.map(tx => ({
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
        })) || [],
        blockchainProofs: profile.blockchainProofs?.map(proof => ({
          id: proof.id,
          type: proof.type,
          hash: proof.hash,
          blockNumber: proof.blockNumber,
          timestamp: new Date(proof.timestamp).toISOString(),
          verificationUrl: proof.verificationUrl,
          isValid: proof.isValid
        })) || [],
        exportMetadata: {
          exportTimestamp: new Date().toISOString(),
          totalTransactions: profile.realTransactionHistory?.length || 0,
          totalProofs: profile.blockchainProofs?.length || 0,
          verificationUrls: {
            etherscan: `https://etherscan.io/address/${profile.address}`,
            transactions: profile.realTransactionHistory?.map(tx => tx.blockExplorerUrl) || []
          }
        }
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        // Convert transactions to CSV
        const csvLines = [
          'Hash,Block Number,Timestamp,From,To,Value,Gas Used,Status,Protocol,Explorer URL',
          ...exportData.transactions.map(tx => 
            `${tx.hash},${tx.blockNumber},${tx.timestamp},${tx.from},${tx.to},${tx.value},${tx.gasUsed},${tx.status},${tx.protocolInteraction},${tx.blockExplorerUrl}`
          )
        ];
        return csvLines.join('\n');
      }

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting verified profile data:', error);
      throw error;
    }
  }

  /**
   * Calculate storage hash for integrity verification
   */
  calculateStorageHash(profile) {
    const hashData = {
      address: profile.address,
      verificationStatus: profile.verificationStatus,
      realTransactionHistory: profile.realTransactionHistory,
      blockchainProofs: profile.blockchainProofs,
      dataIntegrityHash: profile.dataIntegrityHash
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex');
  }

  /**
   * Calculate data integrity hash
   */
  calculateDataIntegrityHash(profile) {
    const profileData = {
      address: profile.address,
      verificationStatus: profile.verificationStatus,
      realTransactionHistory: profile.realTransactionHistory,
      blockchainProofs: profile.blockchainProofs,
      timestamp: profile.lastUpdated
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(profileData))
      .digest('hex');
  }

  /**
   * Verify storage integrity
   */
  async verifyStorageIntegrity(profile) {
    try {
      if (!profile.storageMetadata) {
        return false;
      }

      const calculatedHash = this.calculateStorageHash(profile);
      return calculatedHash === profile.storageMetadata.storageHash;
    } catch (error) {
      console.error('Error verifying storage integrity:', error);
      return false;
    }
  }

  /**
   * Cleanup old or invalid profiles
   */
  async cleanupProfiles(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    try {
      const profiles = await this.getAllVerifiedProfiles();
      const now = Date.now();
      let cleanedCount = 0;

      for (const profile of profiles) {
        // Remove profiles older than maxAge with failed verification
        if (profile.verificationStatus === 'failed' && 
            (now - profile.verificationTimestamp) > maxAge) {
          await this.deleteVerifiedProfile(profile.address);
          cleanedCount++;
        }

        // Remove profiles with invalid storage integrity
        const isValid = await this.verifyStorageIntegrity(profile);
        if (!isValid) {
          console.warn(`🧹 Removing profile with invalid storage integrity: ${profile.address}`);
          await this.deleteVerifiedProfile(profile.address);
          cleanedCount++;
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} profiles`);
      return cleanedCount;
    } catch (error) {
      console.error('Error during profile cleanup:', error);
      return 0;
    }
  }
}

module.exports = BlockchainVerifiedUserStorage;