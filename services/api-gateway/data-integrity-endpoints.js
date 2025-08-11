/**
 * Data Integrity Verification API Endpoints
 * Handles data integrity records, verification, and audit trails
 */

const express = require('express');
const DataIntegrityVerificationService = require('../../services/data-aggregator/data-integrity-verification-service.ts');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Initialize service
const integrityService = new DataIntegrityVerificationService(
  process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/' + process.env.ALCHEMY_API_KEY
);

// Storage for data integrity records
const storageDir = path.join(__dirname, '../../data/data-integrity-records');

/**
 * Ensure storage directory exists
 */
async function ensureStorageDirectory() {
  try {
    await fs.mkdir(storageDir, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
}

/**
 * Store data integrity record
 */
async function storeIntegrityRecord(address, record) {
  try {
    await ensureStorageDirectory();
    const filename = `${address.toLowerCase()}-integrity-records.json`;
    const filepath = path.join(storageDir, filename);
    
    let records = [];
    try {
      const data = await fs.readFile(filepath, 'utf8');
      records = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    records.push(record);
    await fs.writeFile(filepath, JSON.stringify(records, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error storing integrity record:', error);
    return false;
  }
}

/**
 * Get data integrity records for an address
 */
async function getIntegrityRecords(address) {
  try {
    const filename = `${address.toLowerCase()}-integrity-records.json`;
    const filepath = path.join(storageDir, filename);
    
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Get data integrity records with statistics
 */
router.get('/records/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const records = await getIntegrityRecords(address);
    const statistics = await integrityService.getVerificationStatistics(records);
    
    res.json({
      records,
      statistics,
      totalRecords: records.length,
      address
    });
  } catch (error) {
    console.error('Error fetching data integrity records:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data integrity records',
      details: error.message 
    });
  }
});

/**
 * Create data integrity record
 */
router.post('/create-record', async (req, res) => {
  try {
    const { address, dataType, inputData, computationResult, blockchainReferences } = req.body;

    if (!address || !dataType || !inputData || !computationResult) {
      return res.status(400).json({ 
        error: 'Missing required fields: address, dataType, inputData, computationResult' 
      });
    }

    const record = await integrityService.createDataIntegrityRecord(
      dataType,
      inputData,
      computationResult,
      blockchainReferences || []
    );

    const stored = await storeIntegrityRecord(address, record);
    
    if (stored) {
      res.json({ 
        success: true, 
        message: 'Data integrity record created successfully',
        record: {
          id: record.id,
          dataType: record.dataType,
          verificationStatus: record.verificationStatus,
          integrityHash: record.integrityHash
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to store data integrity record' });
    }
  } catch (error) {
    console.error('Error creating data integrity record:', error);
    res.status(500).json({ 
      error: 'Failed to create data integrity record',
      details: error.message 
    });
  }
});

/**
 * Verify data integrity record
 */
router.post('/verify/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    if (!recordId) {
      return res.status(400).json({ error: 'Record ID parameter required' });
    }

    // Find the record across all addresses
    const files = await fs.readdir(storageDir);
    let foundRecord = null;
    
    for (const file of files) {
      if (file.endsWith('-integrity-records.json')) {
        const filepath = path.join(storageDir, file);
        const data = await fs.readFile(filepath, 'utf8');
        const records = JSON.parse(data);
        
        foundRecord = records.find(record => record.id === recordId);
        if (foundRecord) break;
      }
    }
    
    if (!foundRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const isValid = await integrityService.verifyDataIntegrityRecord(foundRecord);
    
    res.json({
      success: true,
      recordId,
      isValid,
      verificationTimestamp: Date.now(),
      record: {
        id: foundRecord.id,
        dataType: foundRecord.dataType,
        verificationStatus: foundRecord.verificationStatus,
        integrityHash: foundRecord.integrityHash
      }
    });
  } catch (error) {
    console.error('Error verifying data integrity record:', error);
    res.status(500).json({ 
      error: 'Failed to verify data integrity record',
      details: error.message 
    });
  }
});

/**
 * Export data integrity records
 */
router.get('/export/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const records = await getIntegrityRecords(address);
    const statistics = await integrityService.getVerificationStatistics(records);
    
    const exportData = {
      address,
      exportTimestamp: new Date().toISOString(),
      totalRecords: records.length,
      statistics,
      records: records.map(record => ({
        id: record.id,
        dataType: record.dataType,
        timestamp: new Date(record.timestamp).toISOString(),
        verificationStatus: record.verificationStatus,
        integrityHash: record.integrityHash,
        blockchainReferences: record.blockchainReferences.map(ref => ({
          type: ref.type,
          hash: ref.hash,
          blockNumber: ref.blockNumber,
          timestamp: new Date(ref.timestamp * 1000).toISOString(),
          verificationUrl: ref.verificationUrl,
          isValid: ref.isValid,
          confirmations: ref.confirmations
        })),
        auditTrail: record.auditTrail.map(entry => ({
          id: entry.id,
          action: entry.action,
          timestamp: new Date(entry.timestamp).toISOString(),
          blockNumber: entry.blockNumber,
          transactionHash: entry.transactionHash,
          inputHash: entry.inputHash,
          outputHash: entry.outputHash,
          verificationProof: entry.verificationProof,
          isVerifiable: entry.isVerifiable
        }))
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${address}-data-integrity.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Error exporting data integrity records:', error);
    res.status(500).json({ 
      error: 'Failed to export data integrity records',
      details: error.message 
    });
  }
});

/**
 * Create computation verification
 */
router.post('/create-computation-verification', async (req, res) => {
  try {
    const { inputData, outputData, computationMethod, blockchainInputs } = req.body;

    if (!inputData || !outputData || !computationMethod) {
      return res.status(400).json({ 
        error: 'Missing required fields: inputData, outputData, computationMethod' 
      });
    }

    const verification = await integrityService.createComputationVerification(
      inputData,
      outputData,
      computationMethod,
      blockchainInputs || []
    );

    res.json({
      success: true,
      message: 'Computation verification created successfully',
      verification
    });
  } catch (error) {
    console.error('Error creating computation verification:', error);
    res.status(500).json({ 
      error: 'Failed to create computation verification',
      details: error.message 
    });
  }
});

/**
 * Track historical data
 */
router.post('/track-historical-data', async (req, res) => {
  try {
    const { value, blockNumber, transactionHash } = req.body;

    if (!value || !blockNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: value, blockNumber' 
      });
    }

    const dataPoint = await integrityService.trackHistoricalData(
      value,
      blockNumber,
      transactionHash
    );

    res.json({
      success: true,
      message: 'Historical data tracked successfully',
      dataPoint
    });
  } catch (error) {
    console.error('Error tracking historical data:', error);
    res.status(500).json({ 
      error: 'Failed to track historical data',
      details: error.message 
    });
  }
});

/**
 * Create audit trail entry
 */
router.post('/create-audit-entry', async (req, res) => {
  try {
    const { action, inputData, outputData, blockNumber, transactionHash } = req.body;

    if (!action || !inputData || !outputData) {
      return res.status(400).json({ 
        error: 'Missing required fields: action, inputData, outputData' 
      });
    }

    const auditEntry = await integrityService.createAuditTrailEntry(
      action,
      inputData,
      outputData,
      blockNumber,
      transactionHash
    );

    res.json({
      success: true,
      message: 'Audit trail entry created successfully',
      auditEntry
    });
  } catch (error) {
    console.error('Error creating audit trail entry:', error);
    res.status(500).json({ 
      error: 'Failed to create audit trail entry',
      details: error.message 
    });
  }
});

/**
 * Get verification statistics for all addresses
 */
router.get('/statistics', async (req, res) => {
  try {
    const files = await fs.readdir(storageDir);
    let allRecords = [];
    
    for (const file of files) {
      if (file.endsWith('-integrity-records.json')) {
        const filepath = path.join(storageDir, file);
        const data = await fs.readFile(filepath, 'utf8');
        const records = JSON.parse(data);
        allRecords = allRecords.concat(records);
      }
    }
    
    const statistics = await integrityService.getVerificationStatistics(allRecords);
    
    res.json({
      success: true,
      statistics,
      totalAddresses: files.filter(f => f.endsWith('-integrity-records.json')).length
    });
  } catch (error) {
    console.error('Error fetching verification statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch verification statistics',
      details: error.message 
    });
  }
});

/**
 * Cleanup old records
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 30 * 24 * 60 * 60 * 1000 } = req.body; // 30 days default
    const now = Date.now();
    let cleanedCount = 0;
    
    const files = await fs.readdir(storageDir);
    
    for (const file of files) {
      if (file.endsWith('-integrity-records.json')) {
        const filepath = path.join(storageDir, file);
        const data = await fs.readFile(filepath, 'utf8');
        const records = JSON.parse(data);
        
        const filteredRecords = records.filter(record => {
          const age = now - record.timestamp;
          const shouldKeep = record.verificationStatus === 'verified' || age < maxAge;
          if (!shouldKeep) cleanedCount++;
          return shouldKeep;
        });
        
        if (filteredRecords.length !== records.length) {
          await fs.writeFile(filepath, JSON.stringify(filteredRecords, null, 2));
        }
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} records`,
      cleanedCount
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup records',
      details: error.message 
    });
  }
});

module.exports = router;