require('dotenv').config({ path: '../../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { blockchainIntegration } = require('./blockchain-integration');
const realProtocolIntegration = require('./real-protocol-integration');
const websocketServer = require('./websocket-server');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Generate realistic credit profile based on address
const generateCreditProfile = (address) => {
  // Use address to generate consistent but varied data
  const addressNum = parseInt(address.slice(-4), 16);
  const baseScore = 600 + (addressNum % 300); // Score between 600-900
  
  return {
    address: address,
    linkedWallets: [address],
    overallScore: baseScore,
    tier: baseScore >= 850 ? 'Platinum' : baseScore >= 750 ? 'Gold' : baseScore >= 650 ? 'Silver' : 'Bronze',
    dimensions: {
      defiReliability: {
        score: Math.max(500, baseScore + (addressNum % 100) - 50),
        confidence: 80 + (addressNum % 20),
        trend: ['improving', 'stable', 'declining'][addressNum % 3],
        dataPoints: 50 + (addressNum % 200),
        lastCalculated: Date.now(),
        recommendations: ['Continue consistent DeFi interactions', 'Explore new protocols to diversify']
      },
      tradingConsistency: {
        score: Math.max(400, baseScore - 100 + (addressNum % 150)),
        confidence: 70 + (addressNum % 25),
        trend: ['improving', 'stable', 'declining'][(addressNum + 1) % 3],
        dataPoints: 30 + (addressNum % 120),
        lastCalculated: Date.now(),
        recommendations: ['Maintain current trading patterns', 'Consider longer-term positions']
      },
      stakingCommitment: {
        score: Math.max(600, baseScore + 50 + (addressNum % 80)),
        confidence: 85 + (addressNum % 15),
        trend: ['improving', 'stable', 'declining'][(addressNum + 2) % 3],
        dataPoints: 80 + (addressNum % 250),
        lastCalculated: Date.now(),
        recommendations: ['Excellent staking behavior', 'Consider staking in additional protocols']
      },
      governanceParticipation: {
        score: Math.max(300, baseScore - 200 + (addressNum % 180)),
        confidence: 60 + (addressNum % 30),
        trend: ['improving', 'stable', 'declining'][(addressNum + 3) % 3],
        dataPoints: 10 + (addressNum % 80),
        lastCalculated: Date.now(),
        recommendations: ['Increase DAO participation', 'Vote in upcoming proposals', 'Join governance discussions']
      },
      liquidityProvider: {
        score: Math.max(500, baseScore - 50 + (addressNum % 120)),
        confidence: 75 + (addressNum % 20),
        trend: ['improving', 'stable', 'declining'][(addressNum + 4) % 3],
        dataPoints: 40 + (addressNum % 160),
        lastCalculated: Date.now(),
        recommendations: ['Strong LP performance', 'Consider impermanent loss protection strategies']
      }
    },
    socialCredit: {
      overallRating: 3.5 + (addressNum % 150) / 100, // Rating between 3.5-5.0
      totalTransactions: 20 + (addressNum % 100),
      successRate: 85 + (addressNum % 15),
      communityRank: 100 + (addressNum % 1000),
      referrals: addressNum % 25,
      trustScore: baseScore - 50 + (addressNum % 100),
      p2pLendingHistory: [],
      communityFeedback: [],
      disputeHistory: []
    },
    predictions: {
      risk30d: 5 + (addressNum % 20),
      risk90d: 10 + (addressNum % 25),
      risk180d: 15 + (addressNum % 30),
      confidence: 70 + (addressNum % 25),
      insights: [
        baseScore > 750 ? 'Strong DeFi engagement reduces short-term risk' : 'Moderate risk profile with room for improvement',
        addressNum % 2 === 0 ? 'Governance participation could improve long-term outlook' : 'Trading patterns show consistency',
        'Market volatility may affect long-term predictions'
      ],
      marketVolatilityAdjustment: 1.0 + (addressNum % 50) / 100
    },
    achievements: generateAchievements(addressNum, baseScore),
    lastUpdated: Date.now()
  };
};

const generateAchievements = (addressNum, baseScore) => {
  const achievements = [
    {
      id: '1',
      name: 'DeFi Pioneer',
      description: 'Complete your first DeFi transaction',
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: '+50 Social Credit',
      unlockedAt: Date.now() - 86400000 * (addressNum % 90 + 1)
    }
  ];

  if (baseScore > 650) {
    achievements.push({
      id: '2',
      name: 'Consistent Trader',
      description: 'Maintain stable trading patterns for 30 days',
      rarity: 'common',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: '+75 Social Credit',
      unlockedAt: Date.now() - 86400000 * (addressNum % 60 + 1)
    });
  }

  if (baseScore > 750) {
    achievements.push({
      id: '3',
      name: 'Trusted Lender',
      description: 'Successfully complete 10 P2P lending transactions',
      rarity: 'rare',
      progress: addressNum % 2 === 0 ? 10 : 7,
      maxProgress: 10,
      unlocked: addressNum % 2 === 0,
      reward: '+200 Social Credit + Lender Badge',
      unlockedAt: addressNum % 2 === 0 ? Date.now() - 86400000 * (addressNum % 30 + 1) : undefined
    });
  }

  if (baseScore > 850) {
    achievements.push({
      id: '4',
      name: 'DeFi Master',
      description: 'Achieve platinum tier credit score',
      rarity: 'epic',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: '+500 Social Credit + Master Badge',
      unlockedAt: Date.now() - 86400000 * (addressNum % 14 + 1)
    });
  }

  return achievements;
};

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'CryptoVault API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Credit Profile Routes
app.get('/api/credit-profile/:address', (req, res) => {
  const { address } = req.params;
  console.log(`Fetching credit profile for address: ${address}`);
  
  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }
  
  // Generate realistic profile based on address
  const profile = generateCreditProfile(address);
  res.json(profile);
});

app.put('/api/credit-profile/:address', (req, res) => {
  const { address } = req.params;
  console.log(`Updating credit profile for address: ${address}`);
  res.json({ success: true, message: 'Profile updated successfully' });
});

// Analytics Routes
app.get('/api/analytics/:address', (req, res) => {
  const { address } = req.params;
  const { timeframe = '30d' } = req.query;
  
  console.log(`Fetching analytics for address: ${address}, timeframe: ${timeframe}`);
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }
  
  const addressNum = parseInt(address.slice(-4), 16);
  const profile = generateCreditProfile(address);
  
  // Generate realistic historical data
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const scoreHistory = [];
  const baseScore = profile.overallScore;
  
  for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 10))) {
    const variation = (Math.sin(i / 10) * 50) + (Math.random() - 0.5) * 30;
    scoreHistory.push({
      timestamp: Date.now() - (i * 86400000),
      overallScore: Math.max(300, Math.min(1000, baseScore + variation)),
      dimensions: {}
    });
  }
  
  const analytics = {
    scoreHistory,
    behaviorTrends: [
      { category: 'DeFi Interactions', trend: -10 + (addressNum % 30), change: addressNum % 3 === 0 ? 'increase' : addressNum % 3 === 1 ? 'decrease' : 'stable', timeframe },
      { category: 'Staking Duration', trend: -5 + (addressNum % 20), change: (addressNum + 1) % 3 === 0 ? 'increase' : (addressNum + 1) % 3 === 1 ? 'decrease' : 'stable', timeframe },
      { category: 'Governance Votes', trend: -15 + (addressNum % 25), change: (addressNum + 2) % 3 === 0 ? 'increase' : (addressNum + 2) % 3 === 1 ? 'decrease' : 'stable', timeframe },
      { category: 'LP Positions', trend: -8 + (addressNum % 22), change: (addressNum + 3) % 3 === 0 ? 'increase' : (addressNum + 3) % 3 === 1 ? 'decrease' : 'stable', timeframe }
    ],
    peerComparison: {
      percentile: Math.max(10, Math.min(99, 50 + (baseScore - 650) / 10)),
      averageScore: 650,
      userScore: baseScore,
      totalUsers: 15000 + (addressNum % 5000)
    },
    transactionMetrics: {
      totalTransactions: timeframe === '7d' ? 5 + (addressNum % 15) : timeframe === '30d' ? 20 + (addressNum % 80) : timeframe === '90d' ? 60 + (addressNum % 200) : 200 + (addressNum % 500),
      totalVolume: timeframe === '7d' ? 1000 + (addressNum % 10000) : timeframe === '30d' ? 10000 + (addressNum % 100000) : timeframe === '90d' ? 50000 + (addressNum % 500000) : 200000 + (addressNum % 1000000),
      uniqueProtocols: timeframe === '7d' ? 2 + (addressNum % 5) : timeframe === '30d' ? 4 + (addressNum % 8) : timeframe === '90d' ? 6 + (addressNum % 12) : 8 + (addressNum % 15),
      timeframe
    }
  };
  
  res.json(analytics);
});

// ZK Proof Routes
app.post('/api/zk-proofs/generate', (req, res) => {
  const { address, proofType, ...options } = req.body;
  console.log(`Generating ZK proof for address: ${address}, type: ${proofType}`);
  
  // Simulate proof generation delay
  setTimeout(() => {
    const mockProof = {
      id: Date.now().toString(),
      type: proofType,
      status: 'ready',
      threshold: proofType === 'threshold' ? options.threshold : undefined,
      dimensions: proofType === 'selective' ? options.dimensions : undefined,
      proof: `zk${Math.random().toString(36).substring(2)}${Date.now()}`,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000 // 24 hours
    };
    
    res.json(mockProof);
  }, 1000);
});

app.post('/api/zk-proofs/verify', (req, res) => {
  const { proof } = req.body;
  console.log(`Verifying ZK proof: ${proof.substring(0, 20)}...`);
  
  // Mock verification - always return true for demo
  res.json({ valid: true, timestamp: Date.now() });
});

// Achievement Routes
app.get('/api/achievements/:address', (req, res) => {
  const { address } = req.params;
  console.log(`Fetching achievements for address: ${address}`);
  
  res.json(mockCreditProfile.achievements);
});


// Blockchain Connection Status Routes
app.get('/api/blockchain/status', async (req, res) => {
  console.log('Fetching blockchain connection status');
  
  try {
    const status = await blockchainIntegration.getConnectionStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching blockchain status:', error);
    res.status(500).json({
      error: 'Failed to fetch blockchain status',
      message: error.message
    });
  }
});

// Blockchain Health Check Route
app.post('/api/blockchain/health-check', async (req, res) => {
  console.log('Performing blockchain health check');
  
  try {
    const results = await blockchainIntegration.performHealthCheck();
    res.json({ results, timestamp: Date.now() });
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({
      error: 'Failed to perform health check',
      message: error.message
    });
  }
});

// Blockchain Transaction Routes
app.get('/api/blockchain/transaction/:hash', async (req, res) => {
  const { hash } = req.params;
  console.log(`Fetching transaction: ${hash}`);
  
  try {
    const transaction = await blockchainIntegration.getTransaction(hash);
    res.json(transaction);
  } catch (error) {
    console.error(`Error fetching transaction ${hash}:`, error);
    res.status(500).json({
      error: 'Failed to fetch transaction',
      message: error.message
    });
  }
});

app.get('/api/blockchain/transaction/:hash/receipt', async (req, res) => {
  const { hash } = req.params;
  console.log(`Fetching transaction receipt: ${hash}`);
  
  try {
    const receipt = await blockchainIntegration.getTransactionReceipt(hash);
    res.json(receipt);
  } catch (error) {
    console.error(`Error fetching transaction receipt ${hash}:`, error);
    res.status(500).json({
      error: 'Failed to fetch transaction receipt',
      message: error.message
    });
  }
});

app.get('/api/blockchain/current-block', async (req, res) => {
  console.log('Fetching current block number');
  
  try {
    const blockNumber = await blockchainIntegration.getCurrentBlock();
    res.json({ blockNumber, timestamp: Date.now() });
  } catch (error) {
    console.error('Error fetching current block:', error);
    res.status(500).json({
      error: 'Failed to fetch current block',
      message: error.message
    });
  }
});

// Real Protocol Integration Routes
app.use('/api/protocols', realProtocolIntegration);

// Real-Time Price Feed Integration Routes
const priceFeedIntegration = require('./price-feed-integration');
app.use('/api/price-feeds', priceFeedIntegration);

// ML Model Integration Routes
const mlModelIntegration = require('./ml-model-integration');
app.use('/api/ml-models', mlModelIntegration);

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  const stats = websocketServer.getStats();
  res.json({
    success: true,
    websocket: stats,
    timestamp: Date.now()
  });
});

// Real User Behavior Analysis Routes
app.get('/api/blockchain/user-behavior-profile/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching user behavior profile for address: ${address}`);
  
  try {
    const behaviorProfile = await blockchainIntegration.getUserBehaviorProfile(address);
    res.json(behaviorProfile);
  } catch (error) {
    console.error(`Error fetching user behavior profile for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch user behavior profile',
      message: error.message
    });
  }
});

app.get('/api/blockchain/staking-behavior/:address', async (req, res) => {
  const { address } = req.params;
  const { timeframe } = req.query;
  console.log(`Fetching staking behavior for address: ${address}, timeframe: ${timeframe}`);
  
  try {
    const stakingBehavior = await blockchainIntegration.getStakingBehavior(address, timeframe);
    res.json(stakingBehavior);
  } catch (error) {
    console.error(`Error fetching staking behavior for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch staking behavior',
      message: error.message
    });
  }
});

app.get('/api/blockchain/liquidation-risk/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching liquidation risk for address: ${address}`);
  
  try {
    const liquidationRisk = await blockchainIntegration.getLiquidationRisk(address);
    res.json(liquidationRisk);
  } catch (error) {
    console.error(`Error fetching liquidation risk for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch liquidation risk',
      message: error.message
    });
  }
});

app.get('/api/blockchain/transaction-patterns/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching transaction patterns for address: ${address}`);
  
  try {
    const transactionPatterns = await blockchainIntegration.getTransactionPatterns(address);
    res.json(transactionPatterns);
  } catch (error) {
    console.error(`Error fetching transaction patterns for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch transaction patterns',
      message: error.message
    });
  }
});

app.get('/api/blockchain/behavior-insights/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching behavior insights for address: ${address}`);
  
  try {
    const behaviorInsights = await blockchainIntegration.getBehaviorInsights(address);
    res.json(behaviorInsights);
  } catch (error) {
    console.error(`Error fetching behavior insights for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch behavior insights',
      message: error.message
    });
  }
});

app.get('/api/blockchain/staking-rewards/:address', async (req, res) => {
  const { address } = req.params;
  const { timeframe } = req.query;
  console.log(`Fetching staking rewards for address: ${address}, timeframe: ${timeframe}`);
  
  try {
    const stakingRewards = await blockchainIntegration.getStakingRewards(address, timeframe);
    res.json(stakingRewards);
  } catch (error) {
    console.error(`Error fetching staking rewards for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch staking rewards',
      message: error.message
    });
  }
});

app.get('/api/blockchain/liquidation-history/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching liquidation history for address: ${address}`);
  
  try {
    const liquidationHistory = await blockchainIntegration.getLiquidationHistory(address);
    res.json(liquidationHistory);
  } catch (error) {
    console.error(`Error fetching liquidation history for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch liquidation history',
      message: error.message
    });
  }
});

app.get('/api/blockchain/liquidation-events/:address', async (req, res) => {
  const { address } = req.params;
  const { timeframe } = req.query;
  console.log(`Fetching liquidation events for address: ${address}, timeframe: ${timeframe}`);
  
  try {
    const liquidationEvents = await blockchainIntegration.getLiquidationEvents(address, timeframe);
    res.json(liquidationEvents);
  } catch (error) {
    console.error(`Error fetching liquidation events for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch liquidation events',
      message: error.message
    });
  }
});

app.get('/api/blockchain/gas-efficiency/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching gas efficiency metrics for address: ${address}`);
  
  try {
    const gasEfficiency = await blockchainIntegration.getGasEfficiencyMetrics(address);
    res.json(gasEfficiency);
  } catch (error) {
    console.error(`Error fetching gas efficiency for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch gas efficiency metrics',
      message: error.message
    });
  }
});

app.get('/api/blockchain/protocol-usage-patterns/:address', async (req, res) => {
  const { address } = req.params;
  const { timeframe } = req.query;
  console.log(`Fetching protocol usage patterns for address: ${address}, timeframe: ${timeframe}`);
  
  try {
    const usagePatterns = await blockchainIntegration.getProtocolUsagePatterns(address, timeframe);
    res.json(usagePatterns);
  } catch (error) {
    console.error(`Error fetching protocol usage patterns for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch protocol usage patterns',
      message: error.message
    });
  }
});

app.get('/api/blockchain/transaction-frequency/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching transaction frequency for address: ${address}`);
  
  try {
    const transactionFrequency = await blockchainIntegration.getTransactionFrequency(address);
    res.json(transactionFrequency);
  } catch (error) {
    console.error(`Error fetching transaction frequency for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch transaction frequency',
      message: error.message
    });
  }
});

app.get('/api/blockchain/behavior-score/:address', async (req, res) => {
  const { address } = req.params;
  console.log(`Fetching behavior score for address: ${address}`);
  
  try {
    const behaviorScore = await blockchainIntegration.getBehaviorScore(address);
    res.json(behaviorScore);
  } catch (error) {
    console.error(`Error fetching behavior score for ${address}:`, error);
    res.status(500).json({
      error: 'Failed to fetch behavior score',
      message: error.message
    });
  }
});

// Protocol Integration Routes
app.get('/api/protocol/credit-score', (req, res) => {
  const { address } = req.query;
  console.log(`Protocol requesting credit score for address: ${address}`);
  
  res.json({
    address,
    overallScore: mockCreditProfile.overallScore,
    tier: mockCreditProfile.tier,
    confidence: 94,
    timestamp: Date.now()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Create HTTP server for WebSocket support
const server = http.createServer(app);

server.listen(PORT, async () => {
  console.log(`
========================================
🚀 CryptoVault API Gateway Started
========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Time: ${new Date().toISOString()}

Available Endpoints:
- GET  /health
- GET  /api/credit-profile/:address
- GET  /api/analytics/:address
- POST /api/zk-proofs/generate
- GET  /api/achievements/:address
- GET  /api/social-credit/:address
- GET  /api/blockchain/status
- POST /api/blockchain/health-check
- GET  /api/blockchain/transaction/:hash
- GET  /api/blockchain/transaction/:hash/receipt
- GET  /api/blockchain/current-block
- WS   /ws/transactions (WebSocket)
========================================
  `);

  // Initialize WebSocket server
  console.log('📡 Initializing WebSocket server...');
  try {
    websocketServer.initialize(server);
    console.log('✅ WebSocket server ready');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket server:', error.message);
  }

  // Initialize blockchain integration service
  console.log('🔗 Initializing blockchain integration...');
  try {
    await blockchainIntegration.initialize();
    console.log('✅ Blockchain integration ready');
  } catch (error) {
    console.error('❌ Failed to initialize blockchain integration:', error.message);
    console.log('⚠️ API will continue without real blockchain data');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  websocketServer.stop();
  await blockchainIntegration.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  websocketServer.stop();
  await blockchainIntegration.disconnect();
  server.close(() => {
    process.exit(0);
  });
});