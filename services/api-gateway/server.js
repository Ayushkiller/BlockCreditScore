const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

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

// Social Credit Routes
app.get('/api/social-credit/:address', (req, res) => {
  const { address } = req.params;
  console.log(`Fetching social credit for address: ${address}`);
  
  res.json(mockCreditProfile.socialCredit);
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

app.listen(PORT, () => {
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
========================================
  `);
});