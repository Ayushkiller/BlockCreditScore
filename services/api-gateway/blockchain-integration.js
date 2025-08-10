const { ethers } = require('ethers');
const WebSocket = require('ws');

/**
 * Real Blockchain Integration Service for API Gateway
 * Provides live blockchain data integration with automatic failover
 */
class BlockchainIntegrationService {
  constructor() {
    this.providers = [];
    this.currentProvider = null;
    this.httpProvider = null;
    this.wsProvider = null;
    this.isInitialized = false;
    // The dataManager is used in several methods but not initialized here.
    // It's assumed to be an external dependency that will be injected after instantiation.
    this.dataManager = null;
    this.connectionStatus = {
      isConnected: false,
      currentProvider: null,
      lastBlockNumber: 0,
      connectionTime: 0,
      reconnectAttempts: 0
    };
    this.healthCheckInterval = null;
    this.reconnectTimeout = null;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.maxReconnectDelay = 300000;
    this.blockSubscriptions = new Set();
    this.transactionSubscriptions = new Map();
  }

  /**
   * Initialize the real blockchain integration service
   */
  async initialize() {
    try {
      console.log('🔗 Initializing real blockchain integration service...');
      
      // Check if real data is enabled
      if (process.env.REAL_DATA_ENABLED !== 'true') {
        console.log('⚠️ Real data integration is disabled. Using mock data.');
        this.isInitialized = true;
        return;
      }

      // Configure real RPC providers
      this.setupProviders();
      
      // Validate that we have at least one provider
      if (this.providers.length === 0) {
        console.warn('⚠️ No RPC providers configured. Using mock data.');
        this.isInitialized = true;
        return;
      }

      // Connect to mainnet with real providers
      await this.connectToMainnet();
      
      // Start health checking
      this.startHealthChecking();
      
      this.isInitialized = true;
      console.log('✅ Real blockchain integration service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize real blockchain integration:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Set up real RPC providers from environment variables
   */
  setupProviders() {
    this.providers = [];

    // Alchemy provider
    if (process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'demo_key_replace_with_real') {
      this.providers.push({
        name: 'Alchemy',
        rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        apiKey: process.env.ALCHEMY_API_KEY,
        priority: 1,
        rateLimit: 300,
        timeout: 10000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Infura provider
    if (process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'demo_key_replace_with_real') {
      this.providers.push({
        name: 'Infura',
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        wsUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
        apiKey: process.env.INFURA_API_KEY,
        priority: 2,
        rateLimit: 100,
        timeout: 10000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Ankr provider
    if (process.env.ANKR_API_KEY) {
      this.providers.push({
        name: 'Ankr',
        rpcUrl: `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
        wsUrl: `wss://rpc.ankr.com/eth/ws/${process.env.ANKR_API_KEY}`,
        apiKey: process.env.ANKR_API_KEY,
        priority: 3,
        rateLimit: 50,
        timeout: 15000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Add public RPC endpoints for demonstration (limited rate but no API key required)
    if (this.providers.length === 0) {
      console.log('⚠️ No API keys configured, adding public RPC endpoints for demonstration');
      
      this.providers.push({
        name: 'Cloudflare',
        rpcUrl: 'https://cloudflare-eth.com',
        wsUrl: 'wss://cloudflare-eth.com/ws', // May not support WebSocket
        apiKey: '',
        priority: 4,
        rateLimit: 10, // Very limited
        timeout: 15000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });

      this.providers.push({
        name: 'Ankr Public',
        rpcUrl: 'https://rpc.ankr.com/eth',
        wsUrl: 'wss://rpc.ankr.com/eth/ws',
        apiKey: '',
        priority: 5,
        rateLimit: 5, // Very limited
        timeout: 20000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Sort providers by priority
    this.providers.sort((a, b) => a.priority - b.priority);
    
    console.log(`📡 Configured ${this.providers.length} RPC providers: ${this.providers.map(p => p.name).join(', ')}`);
  }

  /**
   * Connect to Ethereum mainnet using real providers with failover
   */
  async connectToMainnet() {
    const healthyProviders = this.providers.filter(p => p.isHealthy);
    
    if (healthyProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    for (const provider of healthyProviders) {
      try {
        await this.connectToProvider(provider);
        this.connectionStatus.isConnected = true;
        this.connectionStatus.currentProvider = provider;
        this.connectionStatus.connectionTime = Date.now();
        this.connectionStatus.reconnectAttempts = 0;
        
        console.log(`✅ Successfully connected to ${provider.name}`);
        return;
      } catch (error) {
        console.error(`❌ Failed to connect to ${provider.name}:`, error.message);
        provider.isHealthy = false;
        provider.failureCount++;
      }
    }
    
    throw new Error('Failed to connect to any provider');
  }

  /**
   * Connect to a specific real provider
   */
  async connectToProvider(provider) {
    console.log(`🔌 Connecting to ${provider.name}...`);

    // Create HTTP provider for regular RPC calls
    this.httpProvider = new ethers.JsonRpcProvider(provider.rpcUrl, 'mainnet', {
      staticNetwork: true
    });

    // Test the connection with a real call
    const blockNumber = await this.httpProvider.getBlockNumber();
    console.log(`📊 Connected to ${provider.name}, current block: ${blockNumber}`);

    // Create WebSocket provider for real-time subscriptions
    this.wsProvider = new ethers.WebSocketProvider(provider.wsUrl, 'mainnet', {
      staticNetwork: true
    });

    // Set up WebSocket event handlers
    this.wsProvider.websocket.on('open', () => {
      console.log(`🔗 WebSocket connected to ${provider.name}`);
      this.setupSubscriptions();
    });

    this.wsProvider.websocket.on('close', () => {
      console.log(`⚠️ WebSocket disconnected from ${provider.name}`);
      this.handleDisconnection();
    });

    this.wsProvider.websocket.on('error', (error) => {
      console.error(`🔴 WebSocket error from ${provider.name}:`, error.message);
      this.handleConnectionError(error);
    });

    this.currentProvider = provider;
    this.connectionStatus.lastBlockNumber = blockNumber;
  }

  /**
   * Set up event handlers for blockchain data manager
   */
  setupEventHandlers() {
    if (!this.dataManager) return;

    this.dataManager.on('connected', (provider) => {
      console.log(`🔗 Blockchain connected to ${provider.name}`);
    });

    this.dataManager.on('disconnected', () => {
      console.log('⚠️ Blockchain disconnected');
    });

    this.dataManager.on('error', (error) => {
      console.error('🔴 Blockchain error:', error.message);
    });

    this.dataManager.on('healthCheckCompleted', (results) => {
      const healthyCount = results.filter(r => r.isHealthy).length;
      console.log(`🏥 Health check: ${healthyCount}/${results.length} providers healthy`);
    });

    this.dataManager.on('transactionDetected', (event) => {
      console.log(`📄 Transaction detected: ${event.transaction.hash}`);
    });

    this.dataManager.on('transactionConfirmed', (event) => {
      console.log(`✅ Transaction confirmed: ${event.transaction.hash}`);
    });
  }

  /**
   * Get real blockchain connection status
   */
  async getConnectionStatus() {
    if (!this.isInitialized) {
      return {
        isConnected: false,
        currentProvider: null,
        lastBlockNumber: 0,
        connectionTime: 0,
        reconnectAttempts: 0,
        providerHealth: [],
        statistics: {
          totalProviders: 0,
          healthyProviders: 0,
          averageLatency: 0,
          totalFailures: 0
        }
      };
    }

    // If real data is disabled, return mock data
    if (process.env.REAL_DATA_ENABLED !== 'true' || this.providers.length === 0) {
      return this.getMockConnectionStatus();
    }

    // Return real connection status
    const healthyProviders = this.providers.filter(p => p.isHealthy);
    const totalFailures = this.providers.reduce((sum, p) => sum + p.failureCount, 0);
    const averageLatency = healthyProviders.length > 0 
      ? Math.floor(healthyProviders.reduce((sum, p) => sum + (p.latency || 0), 0) / healthyProviders.length)
      : 0;

    return {
      isConnected: this.connectionStatus.isConnected,
      currentProvider: this.connectionStatus.currentProvider?.name || null,
      lastBlockNumber: this.connectionStatus.lastBlockNumber,
      connectionTime: this.connectionStatus.connectionTime,
      reconnectAttempts: this.connectionStatus.reconnectAttempts,
      providerHealth: this.providers.map(provider => ({
        name: provider.name,
        isHealthy: provider.isHealthy,
        priority: provider.priority,
        latency: provider.latency,
        rateLimit: provider.rateLimit,
        failureCount: provider.failureCount
      })),
      statistics: {
        totalProviders: this.providers.length,
        healthyProviders: healthyProviders.length,
        averageLatency,
        totalFailures
      }
    };
  }

  /**
   * Get mock connection status for demo purposes
   */
  getMockConnectionStatus() {
    const mockProviders = [
      {
        name: 'Alchemy',
        isHealthy: process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'demo_key_replace_with_real',
        priority: 1,
        latency: 120 + Math.floor(Math.random() * 50),
        rateLimit: 300,
        failureCount: 0
      },
      {
        name: 'Infura',
        isHealthy: process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'demo_key_replace_with_real',
        priority: 2,
        latency: 150 + Math.floor(Math.random() * 60),
        rateLimit: 100,
        failureCount: 0
      },
      {
        name: 'Ankr',
        isHealthy: !!process.env.ANKR_API_KEY,
        priority: 3,
        latency: 200 + Math.floor(Math.random() * 80),
        rateLimit: 50,
        failureCount: 0
      }
    ];

    const healthyProviders = mockProviders.filter(p => p.isHealthy);
    const currentProvider = healthyProviders.length > 0 ? healthyProviders[0].name : null;
    const isConnected = healthyProviders.length > 0;

    return {
      isConnected,
      currentProvider,
      lastBlockNumber: 18500000 + Math.floor(Math.random() * 1000),
      connectionTime: Date.now() - 300000,
      reconnectAttempts: 0,
      providerHealth: mockProviders,
      statistics: {
        totalProviders: mockProviders.length,
        healthyProviders: healthyProviders.length,
        averageLatency: healthyProviders.length > 0 
          ? Math.floor(healthyProviders.reduce((sum, p) => sum + p.latency, 0) / healthyProviders.length)
          : 0,
        totalFailures: mockProviders.reduce((sum, p) => sum + p.failureCount, 0)
      }
    };
  }

  /**
   * Perform health check on all providers
   */
  async performHealthCheck() {
    if (!this.isInitialized) {
      throw new Error('Blockchain integration not initialized');
    }

    // If real data is enabled and we have providers, use real health checks
    if (process.env.REAL_DATA_ENABLED === 'true' && this.providers.length > 0) {
      try {
        return await this.performHealthChecks();
      } catch (error) {
        console.error('Error performing real health check:', error);
        throw error;
      }
    }

    // Return mock health check results
    const mockResults = [
      {
        provider: 'Alchemy',
        isHealthy: process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'demo_key_replace_with_real',
        latency: 120 + Math.floor(Math.random() * 50),
        blockNumber: 18500000 + Math.floor(Math.random() * 1000),
        timestamp: Date.now()
      },
      {
        provider: 'Infura',
        isHealthy: process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'demo_key_replace_with_real',
        latency: 150 + Math.floor(Math.random() * 60),
        blockNumber: 18500000 + Math.floor(Math.random() * 1000),
        timestamp: Date.now()
      },
      {
        provider: 'Ankr',
        isHealthy: !!process.env.ANKR_API_KEY,
        latency: 200 + Math.floor(Math.random() * 80),
        blockNumber: 18500000 + Math.floor(Math.random() * 1000),
        timestamp: Date.now()
      }
    ];

    return mockResults;
  }

  /**
   * Get real transaction by hash using eth_getTransactionByHash
   */
  async getTransaction(hash) {
    if (!this.isInitialized) {
      throw new Error('Blockchain integration not initialized');
    }

    if (!this.httpProvider || process.env.REAL_DATA_ENABLED !== 'true') {
      throw new Error('Real blockchain connection not available');
    }

    if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const tx = await this.httpProvider.getTransaction(hash);
      if (!tx) {
        throw new Error(`Transaction ${hash} not found`);
      }

      // Get block timestamp if available
      let timestamp;
      if (tx.blockNumber) {
        try {
          const block = await this.httpProvider.getBlock(tx.blockNumber);
          timestamp = block?.timestamp;
        } catch (error) {
          console.warn(`Failed to get block timestamp for tx ${hash}:`, error.message);
        }
      }

      return {
        hash: tx.hash,
        blockNumber: tx.blockNumber || 0,
        blockHash: tx.blockHash || '',
        transactionIndex: tx.index || 0,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasLimit: tx.gasLimit.toString(),
        input: tx.data,
        nonce: tx.nonce,
        timestamp,
        confirmations: await tx.confirmations()
      };
    } catch (error) {
      console.error(`Error fetching real transaction ${hash}:`, error.message);
      throw error;
    }
  }

  /**
   * Get real transaction receipt using eth_getTransactionReceipt
   */
  async getTransactionReceipt(hash) {
    if (!this.isInitialized) {
      throw new Error('Blockchain integration not initialized');
    }

    if (!this.httpProvider || process.env.REAL_DATA_ENABLED !== 'true') {
      throw new Error('Real blockchain connection not available');
    }

    if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const receipt = await this.httpProvider.getTransactionReceipt(hash);
      if (!receipt) {
        throw new Error(`Transaction receipt ${hash} not found`);
      }

      return {
        transactionHash: receipt.hash,
        transactionIndex: receipt.index,
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        contractAddress: receipt.contractAddress,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          transactionIndex: log.transactionIndex,
          blockHash: log.blockHash,
          logIndex: log.index,
          removed: log.removed
        })),
        status: receipt.status || 0,
        effectiveGasPrice: receipt.gasPrice?.toString()
      };
    } catch (error) {
      console.error(`Error fetching real transaction receipt ${hash}:`, error.message);
      throw error;
    }
  }

  /**
   * Get real current block number
   */
  async getCurrentBlock() {
    if (!this.isInitialized) {
      throw new Error('Blockchain integration not initialized');
    }

    if (!this.httpProvider || process.env.REAL_DATA_ENABLED !== 'true') {
      // Return mock current block number
      return 18500000 + Math.floor(Math.random() * 1000);
    }

    try {
      const blockNumber = await this.httpProvider.getBlockNumber();
      this.connectionStatus.lastBlockNumber = blockNumber;
      return blockNumber;
    } catch (error) {
      console.error('Error getting real current block:', error.message);
      throw error;
    }
  }

  /**
   * Get real block by number
   */
  async getBlockByNumber(blockNumber) {
    if (!this.isInitialized) {
      throw new Error('Blockchain integration not initialized');
    }

    if (!this.httpProvider || process.env.REAL_DATA_ENABLED !== 'true') {
      throw new Error('Real blockchain connection not available');
    }

    if (blockNumber < 0) {
      throw new Error('Block number must be non-negative');
    }

    try {
      const block = await this.httpProvider.getBlock(blockNumber);
      if (!block) {
        throw new Error(`Block ${blockNumber} not found`);
      }

      return {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner,
        difficulty: block.difficulty.toString(),
        totalDifficulty: '0', // Not available in ethers v6
        transactions: block.transactions,
        size: 0, // Would need additional call to get size
        baseFeePerGas: block.baseFeePerGas?.toString()
      };
    } catch (error) {
      console.error(`Error fetching real block ${blockNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * Start transaction monitoring for an address
   */
  async startAddressMonitoring(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      await this.dataManager.addAddressToMonitor(address);
      console.log(`👀 Started monitoring address: ${address}`);
    } catch (error) {
      console.error(`Error starting address monitoring for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Stop transaction monitoring for an address
   */
  stopAddressMonitoring(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      this.dataManager.removeAddressFromMonitor(address);
      console.log(`🚫 Stopped monitoring address: ${address}`);
    } catch (error) {
      console.error(`Error stopping address monitoring for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    if (!this.isInitialized || !this.dataManager) {
      return {
        isMonitoring: false,
        monitoredAddresses: 0,
        pendingTransactions: 0,
        confirmedTransactions: 0,
        currentBlock: 0,
        filters: 0
      };
    }

    try {
      return this.dataManager.getMonitoringStats();
    } catch (error) {
      console.error('Error getting monitoring stats:', error);
      throw error;
    }
  }

  /**
   * Get Uniswap pool information
   */
  async getUniswapPoolInfo(poolAddress) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getUniswapPoolInfo(poolAddress);
    } catch (error) {
      console.error(`Error getting Uniswap pool info for ${poolAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get Aave lending data for a user
   */
  async getAaveLendingData(userAddress) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getAaveLendingData(userAddress);
    } catch (error) {
      console.error(`Error getting Aave lending data for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get Chainlink price data
   */
  async getChainlinkPrice(feedAddress) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getChainlinkPrice(feedAddress);
    } catch (error) {
      console.error(`Error getting Chainlink price for ${feedAddress}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    console.log('🔌 Disconnecting blockchain integration...');
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.wsProvider) {
      try {
        await this.wsProvider.destroy();
      } catch(e) {
        console.error("Error destroying WebSocket provider:", e.message);
      }
    }
    
    if (this.httpProvider) {
       try {
        // Ethers v6 providers don't have a destroy method. Set to null to allow for garbage collection.
        this.httpProvider = null;
      } catch(e) {
        console.error("Error destroying HTTP provider:", e.message);
      }
    }
    
    if (this.dataManager) {
      try {
        await this.dataManager.disconnect();
      } catch (error) {
        console.error('Error disconnecting data manager:', error);
      }
    }

    this.isInitialized = false;
    this.connectionStatus.isConnected = false;
    console.log('🔌 Real blockchain integration disconnected');
  }

  /**
   * Check if the service is ready for real data operations
   */
  isReady() {
    return this.isInitialized && this.dataManager !== null;
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      isReady: this.isReady(),
      realDataEnabled: process.env.REAL_DATA_ENABLED === 'true',
      hasDataManager: this.dataManager !== null
    };
  }
  
  /**
   * Subscribe to real blocks using eth_subscribe for newHeads
   */
  async subscribeToBlocks(callback) {
    if (!this.wsProvider || process.env.REAL_DATA_ENABLED !== 'true') {
      console.warn('WebSocket provider not available for block subscription');
      return;
    }

    try {
      this.wsProvider.on('block', async (blockNumber) => {
        try {
          const block = await this.getBlockByNumber(blockNumber);
          const blockData = {
            blockNumber: block.number,
            blockHash: block.hash,
            timestamp: block.timestamp
          };

          // Notify all block subscribers
          this.blockSubscriptions.forEach(cb => {
            try {
              cb(blockData);
            } catch (error) {
              console.error('Error in block subscription callback:', error);
            }
          });

          this.connectionStatus.lastBlockNumber = blockNumber;
        } catch (error) {
          console.error('Error processing new block:', error);
        }
      });

      this.blockSubscriptions.add(callback);
      console.log('📡 Real block subscription established');
    } catch (error) {
      console.error('Error setting up real block subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real address transactions
   */
  async subscribeToAddress(address, callback) {
    if (!this.wsProvider || process.env.REAL_DATA_ENABLED !== 'true') {
      console.warn('WebSocket provider not available for transaction subscription');
      return;
    }

    const normalizedAddress = address.toLowerCase();
    
    if (!this.transactionSubscriptions.has(normalizedAddress)) {
      this.transactionSubscriptions.set(normalizedAddress, new Set());
    }
    
    this.transactionSubscriptions.get(normalizedAddress).add(callback);
    
    // Set up block-based transaction monitoring (most providers don't support pending tx subscriptions)
    if (this.transactionSubscriptions.size === 1) {
      await this.setupTransactionSubscription();
    }

    console.log(`👀 Started monitoring real transactions for address: ${address}`);
  }

  /**
   * Set up real transaction subscription using block monitoring
   */
  async setupTransactionSubscription() {
    if (!this.wsProvider) return;

    try {
      this.wsProvider.on('block', async (blockNumber) => {
        try {
          const block = await this.httpProvider.getBlock(blockNumber, true);
          if (!block || !block.transactions) return;

          // Process each transaction in the block
          for (const tx of block.transactions) {
            if (typeof tx === 'string') continue; // Skip if only hash is provided

            const txData = {
              hash: tx.hash,
              from: tx.from.toLowerCase(),
              to: tx.to?.toLowerCase() || null,
              value: tx.value.toString(),
              blockNumber: blockNumber
            };

            // Check if any monitored addresses are involved
            const fromCallbacks = this.transactionSubscriptions.get(txData.from);
            const toCallbacks = txData.to ? this.transactionSubscriptions.get(txData.to) : null;

            // Notify subscribers for 'from' address
            if (fromCallbacks) {
              fromCallbacks.forEach(callback => {
                try {
                  callback(txData);
                } catch (error) {
                  console.error('Error in transaction subscription callback:', error);
                }
              });
            }

            // Notify subscribers for 'to' address
            if (toCallbacks) {
              toCallbacks.forEach(callback => {
                try {
                  callback(txData);
                } catch (error) {
                  console.error('Error in transaction subscription callback:', error);
                }
              });
            }
          }
        } catch (error) {
          console.error('Error processing block transactions:', error);
        }
      });

      console.log('📡 Real transaction subscription established');
    } catch (error) {
      console.error('Error setting up real transaction subscription:', error);
      throw error;
    }
  }

  /**
   * Set up all subscriptions after connection
   */
  async setupSubscriptions() {
    if (this.blockSubscriptions.size > 0) {
      // Re-establish block subscriptions
      console.log('🔄 Re-establishing block subscriptions');
    }
    
    if (this.transactionSubscriptions.size > 0) {
      await this.setupTransactionSubscription();
    }
  }

  /**
   * Handle connection disconnection
   */
  handleDisconnection() {
    this.connectionStatus.isConnected = false;
    
    if (this.connectionStatus.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('🔴 Max reconnection attempts reached');
    }
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    console.error('🔴 Real connection error:', error.message);
    
    if (this.currentProvider) {
      this.currentProvider.isHealthy = false;
      this.currentProvider.failureCount++;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.connectionStatus.reconnectAttempts++;
      try {
        await this.connectToMainnet();
      } catch (error) {
        console.error('❌ Reconnection failed:', error.message);
        this.handleDisconnection();
      }
    }, delay);
  }

  /**
   * Start health checking for all real providers
   */
  startHealthChecking() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute
  }

  /**
   * Perform real health checks on all providers
   */
  async performHealthChecks() {
    const results = [];
    
    for (const provider of this.providers) {
      const result = await this.checkProviderHealth(provider);
      results.push(result);
      
      provider.isHealthy = result.isHealthy;
      provider.lastHealthCheck = result.timestamp;
      provider.latency = result.latency;
      
      if (!result.isHealthy) {
        provider.failureCount++;
      } else {
        provider.failureCount = 0; // Reset on successful health check
      }
    }
    
    const healthyCount = results.filter(r => r.isHealthy).length;
    console.log(`🏥 Real health check: ${healthyCount}/${results.length} providers healthy`);
    
    return results;
  }

  /**
   * Check real health of a specific provider
   */
  async checkProviderHealth(provider) {
    const startTime = Date.now();
    
    try {
      const tempProvider = new ethers.JsonRpcProvider(provider.rpcUrl);
      const blockNumber = await Promise.race([
        tempProvider.getBlockNumber(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), provider.timeout)
        )
      ]);
      
      const latency = Date.now() - startTime;
      
      return {
        provider: provider.name,
        isHealthy: true,
        latency,
        blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        provider: provider.name,
        isHealthy: false,
        latency: Date.now() - startTime,
        blockNumber: 0,
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  // Real User Behavior Analysis Methods (depend on external dataManager)

  /**
   * Get comprehensive user behavior profile using real blockchain data
   */
  async getUserBehaviorProfile(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getUserBehaviorProfile(address);
    } catch (error) {
      console.error(`Error getting user behavior profile for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real staking behavior analysis using actual staking contract events
   */
  async getStakingBehavior(address, timeframe) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getStakingBehavior(address, timeframe);
    } catch (error) {
      console.error(`Error getting staking behavior for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real liquidation risk indicators using actual lending protocol events
   */
  async getLiquidationRisk(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getLiquidationRisk(address);
    } catch (error) {
      console.error(`Error getting liquidation risk for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real transaction pattern analysis using actual blockchain data
   */
  async getTransactionPatterns(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getTransactionPatterns(address);
    } catch (error) {
      console.error(`Error getting transaction patterns for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get user behavior insights based on real blockchain analysis
   */
  async getBehaviorInsights(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getBehaviorInsights(address);
    } catch (error) {
      console.error(`Error getting behavior insights for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get staking rewards history from real staking contracts
   */
  async getStakingRewards(address, timeframe) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getStakingRewards(address, timeframe);
    } catch (error) {
      console.error(`Error getting staking rewards for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get liquidation history from real lending protocols
   */
  async getLiquidationHistory(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getLiquidationHistory(address);
    } catch (error) {
      console.error(`Error getting liquidation history for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get liquidation events for a specific timeframe
   */
  async getLiquidationEvents(address, timeframe) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getLiquidationEvents(address, timeframe);
    } catch (error) {
      console.error(`Error getting liquidation events for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get gas efficiency metrics for a user
   */
  async getGasEfficiencyMetrics(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getGasEfficiencyMetrics(address);
    } catch (error) {
      console.error(`Error getting gas efficiency metrics for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get protocol usage patterns for a user
   */
  async getProtocolUsagePatterns(address, timeframe) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getProtocolUsagePatterns(address, timeframe);
    } catch (error) {
      console.error(`Error getting protocol usage patterns for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real transaction frequency analysis
   */
  async getTransactionFrequency(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getTransactionFrequency(address);
    } catch (error) {
      console.error(`Error getting transaction frequency for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get real user behavior score incorporating all analysis
   */
  async getBehaviorScore(address) {
    if (!this.isInitialized || !this.dataManager) {
      throw new Error('Blockchain integration not initialized or dataManager not available');
    }

    try {
      return await this.dataManager.getBehaviorScore(address);
    } catch (error) {
      console.error(`Error getting behavior score for ${address}:`, error);
      throw error;
    }
  }
}


// Create singleton instance
const blockchainIntegration = new BlockchainIntegrationService();

module.exports = {
  blockchainIntegration,
  BlockchainIntegrationService
};
