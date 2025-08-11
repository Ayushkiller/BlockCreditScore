/**
 * Blockchain Verification API Endpoints
 * Handles blockchain verification requests and user profile management
 */

const express = require('express');
const BlockchainVerificationService = require('../../services/data-aggregator/blockchain-verification-service.ts');
const BlockchainVerifiedUserStorage = require('./blockchain-verified-user-storage');

const router = express.Router();

// Initialize services
const verificationService = new BlockchainVerificationService(
  process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY
);
const userStorage = new BlockchainVerifiedUserStorage();

/**
 * Store wallet verification result
 */
router.post('/store-verification', async (req, res) => {
  try {
    const { address, message, signature, timestamp, isValid, verificationMethod } = req.body;

    if (!address || !message || !signature) {
      return res.status(400).json({ error: 'Missing required verification data' });
    }

    if (isValid) {
      // Create blockchain-verified profile
      const verificationData = {
        address,
        message,
        signature,
        timestamp,
        isValid,
        verificationMethod
      };

      const profile = await verificationService.createBlockchainVerifiedProfile(
        address,
        verificationData
      );

      // Store the profile
      const stored = await userStorage.storeVerifiedProfile(profile);
      
      if (stored) {
        res.json({ 
          success: true, 
          message: 'Verification stored successfully',
          profile: {
            address: profile.address,
            verificationStatus: profile.verificationStatus,
            transactionCount: profile.realTransactionHistory.length,
            proofCount: profile.blockchainProofs.length
          }
        });
      } else {
        res.status(500).json({ error: 'Failed to store verification' });
      }
    } else {
      res.status(400).json({ error: 'Invalid verification signature' });
    }
  } catch (error) {
    console.error('Error storing verification:', error);
    res.status(500).json({ 
      error: 'Failed to store verification',
      details: error.message 
    });
  }
});

/**
 * Get blockchain-verified profile
 */
router.get('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const profile = await userStorage.getVerifiedProfile(address);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching verified profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch verified profile',
      details: error.message 
    });
  }
});

/**
 * Update blockchain-verified profile
 */
router.put('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const updates = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    // Get existing profile
    const existingProfile = await userStorage.getVerifiedProfile(address);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update profile with new blockchain data
    const updatedProfile = await verificationService.updateBlockchainVerifiedProfile(
      existingProfile,
      updates.fromBlock
    );

    // Store updated profile
    const stored = await userStorage.storeVerifiedProfile(updatedProfile);
    
    if (stored) {
      res.json({ 
        success: true, 
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } catch (error) {
    console.error('Error updating verified profile:', error);
    res.status(500).json({ 
      error: 'Failed to update verified profile',
      details: error.message 
    });
  }
});

/**
 * Delete blockchain-verified profile
 */
router.delete('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const deleted = await userStorage.deleteVerifiedProfile(address);
    
    if (deleted) {
      res.json({ 
        success: true, 
        message: 'Profile deleted successfully' 
      });
    } else {
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  } catch (error) {
    console.error('Error deleting verified profile:', error);
    res.status(500).json({ 
      error: 'Failed to delete verified profile',
      details: error.message 
    });
  }
});

/**
 * Export blockchain-verified data
 */
router.get('/export/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { format = 'json' } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const exportData = await userStorage.exportVerifiedProfileData(address, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${address}-blockchain-data.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${address}-blockchain-data.json"`);
    }

    res.send(exportData);
  } catch (error) {
    console.error('Error exporting verified profile data:', error);
    res.status(500).json({ 
      error: 'Failed to export verified profile data',
      details: error.message 
    });
  }
});

/**
 * Get verification statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await userStorage.getVerificationStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching verification statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch verification statistics',
      details: error.message 
    });
  }
});

/**
 * Search verified profiles
 */
router.post('/search', async (req, res) => {
  try {
    const criteria = req.body;
    const profiles = await userStorage.searchVerifiedProfiles(criteria);
    res.json(profiles);
  } catch (error) {
    console.error('Error searching verified profiles:', error);
    res.status(500).json({ 
      error: 'Failed to search verified profiles',
      details: error.message 
    });
  }
});

/**
 * Verify profile data integrity
 */
router.get('/verify-integrity/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const profile = await userStorage.getVerifiedProfile(address);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const isValid = await verificationService.verifyProfileDataIntegrity(profile);
    
    res.json({
      address,
      isValid,
      dataIntegrityHash: profile.dataIntegrityHash,
      lastUpdated: profile.lastUpdated,
      verificationTimestamp: Date.now()
    });
  } catch (error) {
    console.error('Error verifying profile data integrity:', error);
    res.status(500).json({ 
      error: 'Failed to verify profile data integrity',
      details: error.message 
    });
  }
});

/**
 * Cleanup old or invalid profiles
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge } = req.body;
    const cleanedCount = await userStorage.cleanupProfiles(maxAge);
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} profiles`,
      cleanedCount
    });
  } catch (error) {
    console.error('Error during profile cleanup:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup profiles',
      details: error.message 
    });
  }
});

/**
 * Get blockchain proofs for a specific transaction
 */
router.get('/proof/:transactionHash', async (req, res) => {
  try {
    const { transactionHash } = req.params;
    
    if (!transactionHash) {
      return res.status(400).json({ error: 'Transaction hash parameter required' });
    }

    const proof = await verificationService.createBlockchainProof(transactionHash);
    
    res.json({
      success: true,
      proof
    });
  } catch (error) {
    console.error('Error creating blockchain proof:', error);
    res.status(500).json({ 
      error: 'Failed to create blockchain proof',
      details: error.message 
    });
  }
});

/**
 * Verify a blockchain proof
 */
router.post('/verify-proof', async (req, res) => {
  try {
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({ error: 'Proof data required' });
    }

    const isValid = await verificationService.verifyBlockchainProof(proof);
    
    res.json({
      success: true,
      isValid,
      verificationTimestamp: Date.now()
    });
  } catch (error) {
    console.error('Error verifying blockchain proof:', error);
    res.status(500).json({ 
      error: 'Failed to verify blockchain proof',
      details: error.message 
    });
  }
});

module.exports = router;