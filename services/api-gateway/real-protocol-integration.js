/**
 * Real Protocol Integration API
 * Connects the contract manager with frontend services to provide real DeFi protocol data
 */

const express = require('express');
const router = express.Router();

// Import the blockchain data manager, contract manager, and contract data fetcher
let blockchainDataManager;
let contractManager;
let contractDataFetcher;
let connectionService;

// Initialize the managers
async function initializeManagers() {
  try {
    // Dynamic import for ES modules
    const { BlockchainDataManager } = await import('../blockchain-data/src/blockchain-data-manager.js');
    const { RealContractManager } = await import('../blockchain-data/src/contract-manager.js');
    const { RealContractDataFetcher } = await import('../blockchain-data/src/contract-data-fetcher.js');
    const { EthereumConnectionService } = await import('../blockchain-data/src/ethereum-connection.js');
    
    // Initialize connection service
    connectionService = new EthereumConnectionService();
    await connectionService.connect();
    
    // Initialize managers
    blockchainDataManager = new BlockchainDataManager();
    contractManager = new RealContractManager(connectionService);
    contractDataFetcher = new RealContractDataFetcher(connectionService, contractManager);
    
    // Start liquidation monitoring
    await contractDataFetcher.startLiquidationMonitoring();
    
    console.log('✅ Real protocol integration managers initialized');
  } catch (error) {
    console.error('❌ Failed to initialize protocol integration managers:', error);
  }
}

// Initialize on startup
initializeManagers();

/**
 * Get real Aave V3 positions for a user
 */
router.get('/aave/positions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!contractManager) {
      return res.status(503).json({ error: 'Contract manager not initialized' });
    }
    
    const positions = await contractManager.getAaveLendingData(address);
    res.json(positions);
  } catch (error) {
    console.error('Error fetching Aave positions:', error);
    res.status(500).json({ error: 'Failed to fetch Aave positions' });
  }
});

/**
 * Get real Compound positions for a user
 */
router.get('/compound/positions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!contractManager) {
      return res.status(503).json({ error: 'Contract manager not initialized' });
    }
    
    const positions = await contractManager.getCompoundPositions(address);
    res.json(positions);
  } catch (error) {
    console.error('Error fetching Compound positions:', error);
    res.status(500).json({ error: 'Failed to fetch Compound positions' });
  }
});

/**
 * Get real protocol statistics (TVL, utilization rates, etc.)
 */
router.get('/statistics', async (req, res) => {
  try {
    if (!contractDataFetcher) {
      return res.status(503).json({ error: 'Contract data fetcher not initialized' });
    }
    
    // Get TVL data from both Aave and Compound
    const [aaveTVL, compoundTVL] = await Promise.all([
      contractDataFetcher.getAaveTVL().catch(err => {
        console.warn('Failed to get Aave TVL:', err);
        return null;
      }),
      contractDataFetcher.getCompoundTVL().catch(err => {
        console.warn('Failed to get Compound TVL:', err);
        return null;
      })
    ]);
    
    const statistics = {};
    
    if (aaveTVL) {
      statistics.aave = aaveTVL;
    }
    
    if (compoundTVL) {
      statistics.compound = compoundTVL;
    }
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching protocol statistics:', error);
    res.status(500).json({ error: 'Failed to fetch protocol statistics' });
  }
});

/**
 * Get real protocol yield data
 */
router.get('/yields', async (req, res) => {
  try {
    if (!contractDataFetcher) {
      return res.status(503).json({ error: 'Contract data fetcher not initialized' });
    }
    
    // Common assets for yield data
    const assets = [
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0xA0b86a33E6417c8f4c8c8c8c8c8c8c8c8c8c8c8c', // USDC
      '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
    ];
    
    const yieldData = {
      aave: {},
      compound: {}
    };
    
    // Get Aave yield data
    for (const asset of assets) {
      try {
        const aaveYield = await contractDataFetcher.getAaveYieldData(asset);
        yieldData.aave[asset] = aaveYield;
      } catch (error) {
        console.warn(`Failed to get Aave yield for ${asset}:`, error);
      }
    }
    
    // Get Compound yield data for major cTokens
    const cTokens = [
      '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5', // cETH
      '0x39AA39c021dfbaE8faC545936693aC917d5E7563', // cUSDC
      '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'  // cDAI
    ];
    
    for (const cToken of cTokens) {
      try {
        const compoundYield = await contractDataFetcher.getCompoundYieldData(cToken);
        yieldData.compound[cToken] = compoundYield;
      } catch (error) {
        console.warn(`Failed to get Compound yield for ${cToken}:`, error);
      }
    }
    
    res.json(yieldData);
  } catch (error) {
    console.error('Error fetching protocol yield data:', error);
    res.status(500).json({ error: 'Failed to fetch protocol yield data' });
  }
});

/**
 * Get real protocol TVL data
 */
router.get('/tvl', async (req, res) => {
  try {
    if (!contractDataFetcher) {
      return res.status(503).json({ error: 'Contract data fetcher not initialized' });
    }
    
    // Get TVL data from both protocols
    const [aaveTVL, compoundTVL] = await Promise.all([
      contractDataFetcher.getAaveTVL().catch(err => {
        console.warn('Failed to get Aave TVL:', err);
        return null;
      }),
      contractDataFetcher.getCompoundTVL().catch(err => {
        console.warn('Failed to get Compound TVL:', err);
        return null;
      })
    ]);
    
    const tvlData = {};
    
    if (aaveTVL) {
      tvlData.aave = {
        protocol: aaveTVL.protocol,
        totalValueLocked: aaveTVL.totalValueLocked,
        totalSupply: aaveTVL.totalSupply,
        totalBorrow: aaveTVL.totalBorrow,
        utilizationRate: aaveTVL.utilizationRate,
        timestamp: aaveTVL.timestamp
      };
    }
    
    if (compoundTVL) {
      tvlData.compound = {
        protocol: compoundTVL.protocol,
        totalValueLocked: compoundTVL.totalValueLocked,
        totalSupply: compoundTVL.totalSupply,
        totalBorrow: compoundTVL.totalBorrow,
        utilizationRate: compoundTVL.utilizationRate,
        timestamp: compoundTVL.timestamp
      };
    }
    
    res.json(tvlData);
  } catch (error) {
    console.error('Error fetching protocol TVL data:', error);
    res.status(500).json({ error: 'Failed to fetch protocol TVL data' });
  }
});

/**
 * Get real protocol interaction history for a user
 */
router.get('/interactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = '30d' } = req.query;
    
    if (!contractManager) {
      return res.status(503).json({ error: 'Contract manager not initialized' });
    }
    
    // Convert timeframe to block numbers
    let fromBlock = 0;
    const currentBlock = await blockchainDataManager?.getCurrentBlockNumber() || 0;
    
    switch (timeframe) {
      case '7d':
        fromBlock = Math.max(0, currentBlock - (7 * 24 * 60 * 60 / 12)); // ~7 days of blocks
        break;
      case '30d':
        fromBlock = Math.max(0, currentBlock - (30 * 24 * 60 * 60 / 12)); // ~30 days of blocks
        break;
      case '90d':
        fromBlock = Math.max(0, currentBlock - (90 * 24 * 60 * 60 / 12)); // ~90 days of blocks
        break;
      default:
        fromBlock = Math.max(0, currentBlock - (30 * 24 * 60 * 60 / 12));
    }
    
    const interactions = await contractManager.getProtocolInteractionHistory(address, fromBlock);
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching protocol interaction history:', error);
    res.status(500).json({ error: 'Failed to fetch protocol interaction history' });
  }
});

/**
 * Get real Uniswap V3 pool information
 */
router.get('/uniswap/pool/:poolAddress', async (req, res) => {
  try {
    const { poolAddress } = req.params;
    
    if (!contractManager) {
      return res.status(503).json({ error: 'Contract manager not initialized' });
    }
    
    const poolInfo = await contractManager.getUniswapPoolInfo(poolAddress);
    res.json(poolInfo);
  } catch (error) {
    console.error('Error fetching Uniswap pool info:', error);
    res.status(500).json({ error: 'Failed to fetch Uniswap pool info' });
  }
});

/**
 * Get real Chainlink price data
 */
router.get('/chainlink/price/:feedAddress', async (req, res) => {
  try {
    const { feedAddress } = req.params;
    
    if (!contractManager) {
      return res.status(503).json({ error: 'Contract manager not initialized' });
    }
    
    const priceData = await contractManager.getChainlinkPrice(feedAddress);
    res.json(priceData);
  } catch (error) {
    console.error('Error fetching Chainlink price:', error);
    res.status(500).json({ error: 'Failed to fetch Chainlink price' });
  }
});

/**
 * Decode real transaction data using contract ABIs
 */
router.post('/decode-transaction', async (req, res) => {
  try {
    const { txData, contractAddress } = req.body;
    
    if (!contractManager) {
      return res.status(503).json({ error: 'Contract manager not initialized' });
    }
    
    if (!txData || !contractAddress) {
      return res.status(400).json({ error: 'Missing txData or contractAddress' });
    }
    
    const decodedData = await contractManager.decodeTransactionData(txData, contractAddress);
    res.json(decodedData);
  } catch (error) {
    console.error('Error decoding transaction data:', error);
    res.status(500).json({ error: 'Failed to decode transaction data' });
  }
});

/**
 * Get real liquidation events
 */
router.get('/liquidations/:address?', async (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = '7d' } = req.query;
    
    if (!contractDataFetcher || !connectionService) {
      return res.status(503).json({ error: 'Services not initialized' });
    }
    
    // Convert timeframe to block range
    const currentBlock = await connectionService.getCurrentBlock();
    let fromBlock = 0;
    
    switch (timeframe) {
      case '7d':
        fromBlock = Math.max(0, currentBlock - (7 * 24 * 60 * 60 / 12));
        break;
      case '30d':
        fromBlock = Math.max(0, currentBlock - (30 * 24 * 60 * 60 / 12));
        break;
      case '90d':
        fromBlock = Math.max(0, currentBlock - (90 * 24 * 60 * 60 / 12));
        break;
    }
    
    // Get historical liquidation events
    const liquidations = await contractDataFetcher.getHistoricalLiquidations(fromBlock, currentBlock);
    
    // Filter by address if specified
    const filteredLiquidations = address 
      ? liquidations.filter(liquidation => 
          liquidation.borrower.toLowerCase() === address.toLowerCase() ||
          liquidation.liquidator.toLowerCase() === address.toLowerCase()
        )
      : liquidations;
    
    res.json(filteredLiquidations);
  } catch (error) {
    console.error('Error fetching liquidation events:', error);
    res.status(500).json({ error: 'Failed to fetch liquidation events' });
  }
});

/**
 * Get real contract state data
 */
router.get('/contract-state/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const { methods } = req.query;
    
    if (!contractDataFetcher) {
      return res.status(503).json({ error: 'Contract data fetcher not initialized' });
    }
    
    if (!methods) {
      return res.status(400).json({ error: 'Methods parameter required' });
    }
    
    const methodList = methods.split(',');
    const contractName = req.query.name || 'Unknown Contract';
    
    const contractState = await contractDataFetcher.getContractState(
      contractAddress, 
      contractName, 
      methodList
    );
    
    res.json(contractState);
  } catch (error) {
    console.error('Error fetching contract state:', error);
    res.status(500).json({ error: 'Failed to fetch contract state' });
  }
});

/**
 * Decode transaction with enhanced context
 */
router.get('/decode-transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    if (!contractDataFetcher) {
      return res.status(503).json({ error: 'Contract data fetcher not initialized' });
    }
    
    const decodedTransaction = await contractDataFetcher.decodeTransactionWithContext(txHash);
    res.json(decodedTransaction);
  } catch (error) {
    console.error('Error decoding transaction with context:', error);
    res.status(500).json({ error: 'Failed to decode transaction with context' });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      managers: {
        contractManager: !!contractManager,
        blockchainDataManager: !!blockchainDataManager,
        contractDataFetcher: !!contractDataFetcher,
        connectionService: !!connectionService
      }
    };
    
    if (contractManager) {
      // Test contract manager connectivity
      try {
        const availableContracts = contractManager.getAvailableContracts();
        health.availableContracts = availableContracts.length;
      } catch (error) {
        health.contractManagerError = error.message;
      }
    }
    
    if (connectionService) {
      try {
        const connectionStatus = connectionService.getConnectionStatus();
        health.blockchainConnection = {
          isConnected: connectionStatus.isConnected,
          currentProvider: connectionStatus.currentProvider?.name,
          lastBlockNumber: connectionStatus.lastBlockNumber
        };
      } catch (error) {
        health.connectionError = error.message;
      }
    }
    
    res.json(health);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

/**
 * Get real protocol event logs
 */
router.get('/events/:protocol?', async (req, res) => {
  try {
    const { protocol } = req.params;
    const { limit = 50 } = req.query;
    
    if (!blockchainDataManager) {
      return res.status(503).json({ error: 'Blockchain data manager not initialized' });
    }
    
    // Get recent events from blockchain data manager
    const events = await blockchainDataManager.getRecentEvents(parseInt(limit));
    
    // Filter by protocol if specified
    const filteredEvents = protocol 
      ? events.filter(event => event.protocolName?.toLowerCase() === protocol.toLowerCase())
      : events;
    
    res.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching protocol events:', error);
    res.status(500).json({ error: 'Failed to fetch protocol events' });
  }
});

module.exports = router;