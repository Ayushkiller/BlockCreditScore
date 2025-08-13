import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { initializeDatabase } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { blockchainService } from './services/blockchainService';
import { scoreCalculator } from './services/scoreCalculator';
import { databaseService } from './services/databaseService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Core API endpoints
app.get('/api', (req, res) => {
  res.json({ 
    message: 'CryptoScore API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      'blockchain-test': '/api/blockchain/test',
      'blockchain-balance': '/api/blockchain/balance/:address',
      score: '/api/score/:address',
      batch: '/api/score/batch',
      history: '/api/score/:address/history',
      refresh: '/api/score/:address/refresh'
    }
  });
});

// GET /api/docs - API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'CryptoScore API Documentation',
      version: '1.0.0',
      baseUrl: process.env.NODE_ENV === 'production' ? 'https://api.cryptoscore.com' : `http://localhost:${PORT}`,
      description: 'Integrate CryptoScore into your DeFi application with our simple REST API.',
      authentication: {
        required: false,
        note: 'No authentication is required for the current MVP. All credit scores are publicly accessible.'
      },
      rateLimiting: {
        limit: '100 requests per minute per IP',
        errorCode: 'RATE_LIMITED',
        errorResponse: {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          retryAfter: 60
        }
      },
      endpoints: [
        {
          method: 'GET',
          path: '/api/score/:address',
          description: 'Get the credit score for a specific Ethereum address',
          parameters: {
            address: 'Ethereum address (required)'
          },
          example: {
            request: 'GET /api/score/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            response: {
              address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              score: 750,
              timestamp: 1699123456,
              breakdown: {
                transactionVolume: 225,
                transactionFrequency: 188,
                stakingActivity: 200,
                defiInteractions: 137
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/api/score/batch',
          description: 'Get credit scores for multiple Ethereum addresses',
          requestBody: {
            addresses: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '0x8ba1f109551bD432803012645Hac136c22C57B']
          },
          example: {
            response: {
              scores: [
                {
                  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                  score: 750,
                  timestamp: 1699123456
                },
                {
                  address: '0x8ba1f109551bD432803012645Hac136c22C57B',
                  score: null,
                  error: 'Insufficient transaction history'
                }
              ]
            }
          }
        },
        {
          method: 'GET',
          path: '/api/score/:address/history',
          description: 'Get historical credit scores for an address',
          parameters: {
            address: 'Ethereum address (required)',
            limit: 'Number of records to return (optional, max 1000, default 100)'
          }
        },
        {
          method: 'POST',
          path: '/api/score/:address/refresh',
          description: 'Force recalculation of credit score with latest blockchain data',
          parameters: {
            address: 'Ethereum address (required)'
          }
        }
      ],
      errorCodes: {
        INVALID_ADDRESS: 'Malformed Ethereum address',
        INSUFFICIENT_DATA: 'Not enough transaction history',
        RATE_LIMITED: 'Too many requests',
        BLOCKCHAIN_ERROR: 'RPC provider issues',
        CALCULATION_ERROR: 'Failed to calculate credit score'
      },
      integrationExamples: {
        javascript: `async function getCreditScore(address) {
  try {
    const response = await fetch(\`/api/score/\${address}\`);
    if (!response.ok) throw new Error('Failed to fetch credit score');
    return await response.json();
  } catch (error) {
    console.error('Error fetching credit score:', error);
    return null;
  }
}`,
        react: `function useCreditScore(address) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(\`/api/score/\${address}\`)
      .then(res => res.json())
      .then(setScore)
      .finally(() => setLoading(false));
  }, [address]);
  
  return { score, loading };
}`
      },
      webDocumentation: `${process.env.NODE_ENV === 'production' ? 'https://cryptoscore.com' : 'http://localhost:3000'}/docs`
    }
  });
});

// GET /api/score/:address - Get credit score for address
app.get('/api/score/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Invalid Ethereum address format'
      });
    }
    
    // Check for cached score first
    const cachedScore = await databaseService.getCachedScore(address);
    
    if (cachedScore && databaseService.isCacheFresh(cachedScore)) {
      return res.json({
        success: true,
        data: {
          address: cachedScore.address,
          score: cachedScore.score,
          breakdown: cachedScore.breakdown,
          timestamp: cachedScore.lastUpdated,
          cached: true
        }
      });
    }
    
    // Calculate new score
    const metrics = await blockchainService.getUserMetrics(address);
    
    // Validate metrics for scoring
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for credit scoring',
        details: validation.reasons
      });
    }
    
    // Calculate and save score
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    await databaseService.saveScore(creditScore);
    
    return res.json({
      success: true,
      data: {
        address: creditScore.address,
        score: creditScore.score,
        breakdown: creditScore.breakdown,
        timestamp: creditScore.timestamp,
        cached: false
      }
    });
    
  } catch (error) {
    console.error('Error getting credit score:', error);
    return res.status(500).json({
      success: false,
      error: 'CALCULATION_ERROR',
      message: 'Failed to calculate credit score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/score/batch - Get scores for multiple addresses
app.post('/api/score/batch', async (req, res) => {
  try {
    const { addresses } = req.body;
    
    // Validate input
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Request body must contain an array of addresses'
      });
    }
    
    // Limit batch size to prevent abuse
    if (addresses.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'BATCH_TOO_LARGE',
        message: 'Maximum 50 addresses allowed per batch request'
      });
    }
    
    // Validate all addresses
    const invalidAddresses = addresses.filter(addr => !ethers.isAddress(addr));
    if (invalidAddresses.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'One or more addresses have invalid format',
        details: invalidAddresses
      });
    }
    
    const results = [];
    
    // Get cached scores first
    const cachedScores = await databaseService.getMultipleCachedScores(addresses);
    const cachedAddresses = new Set();
    
    for (const cached of cachedScores) {
      if (databaseService.isCacheFresh(cached)) {
        results.push({
          address: cached.address,
          score: cached.score,
          breakdown: cached.breakdown,
          timestamp: cached.lastUpdated,
          cached: true,
          success: true
        });
        cachedAddresses.add(cached.address.toLowerCase());
      }
    }
    
    // Calculate scores for non-cached addresses
    const addressesToCalculate = addresses.filter(
      addr => !cachedAddresses.has(addr.toLowerCase())
    );
    
    for (const address of addressesToCalculate) {
      try {
        const metrics = await blockchainService.getUserMetrics(address);
        
        // Validate metrics
        const validation = scoreCalculator.validateMetricsForScoring(metrics);
        if (!validation.isValid) {
          results.push({
            address,
            success: false,
            error: 'INSUFFICIENT_DATA',
            message: 'Insufficient data for credit scoring',
            details: validation.reasons
          });
          continue;
        }
        
        // Calculate and save score
        const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
        await databaseService.saveScore(creditScore);
        
        results.push({
          address: creditScore.address,
          score: creditScore.score,
          breakdown: creditScore.breakdown,
          timestamp: creditScore.timestamp,
          cached: false,
          success: true
        });
        
      } catch (error) {
        results.push({
          address,
          success: false,
          error: 'CALCULATION_ERROR',
          message: 'Failed to calculate credit score',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return res.json({
      success: true,
      data: {
        total: addresses.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
    
  } catch (error) {
    console.error('Error processing batch request:', error);
    return res.status(500).json({
      success: false,
      error: 'BATCH_ERROR',
      message: 'Failed to process batch request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/score/:address/history - Get score history
app.get('/api/score/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit } = req.query;
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Invalid Ethereum address format'
      });
    }
    
    // Parse and validate limit
    const historyLimit = limit ? Math.min(parseInt(limit as string, 10), 1000) : 100;
    if (isNaN(historyLimit) || historyLimit < 1) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_LIMIT',
        message: 'Limit must be a positive number (max 1000)'
      });
    }
    
    // Get score history
    const history = await databaseService.getScoreHistory(address, historyLimit);
    
    return res.json({
      success: true,
      data: {
        address,
        total: history.length,
        history: history.map(entry => ({
          score: entry.score,
          timestamp: entry.timestamp,
          date: new Date(entry.timestamp * 1000).toISOString()
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting score history:', error);
    return res.status(500).json({
      success: false,
      error: 'HISTORY_ERROR',
      message: 'Failed to get score history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/score/:address/refresh - Force score recalculation
app.post('/api/score/:address/refresh', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Invalid Ethereum address format'
      });
    }
    
    // Force recalculation (ignore cache)
    const metrics = await blockchainService.getUserMetrics(address);
    
    // Validate metrics for scoring
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for credit scoring',
        details: validation.reasons
      });
    }
    
    // Calculate and save new score
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    await databaseService.saveScore(creditScore);
    
    // Get detailed breakdown for transparency
    const breakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
    
    return res.json({
      success: true,
      data: {
        address: creditScore.address,
        score: creditScore.score,
        breakdown: creditScore.breakdown,
        timestamp: creditScore.timestamp,
        detailedBreakdown: breakdown,
        refreshed: true
      }
    });
    
  } catch (error) {
    console.error('Error refreshing credit score:', error);
    return res.status(500).json({
      success: false,
      error: 'REFRESH_ERROR',
      message: 'Failed to refresh credit score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Blockchain service test endpoints
app.get('/api/blockchain/test', async (req, res) => {
  try {
    const connectionTest = await blockchainService.testConnection();
    res.json({
      success: true,
      data: connectionTest,
      message: connectionTest.connected ? 'Blockchain connection successful' : 'Blockchain connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test blockchain connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/blockchain/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await blockchainService.getBalance(address);
    res.json({
      success: true,
      data: {
        address,
        balance: `${balance} ETH`
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to get balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/blockchain/metrics/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const metrics = await blockchainService.getUserMetrics(address);
    res.json({
      success: true,
      data: {
        address,
        metrics: {
          totalTransactions: metrics.totalTransactions,
          totalVolume: `${parseFloat(metrics.totalVolume).toFixed(4)} ETH`,
          avgTransactionValue: `${parseFloat(metrics.avgTransactionValue).toFixed(6)} ETH`,
          stakingBalance: `${parseFloat(metrics.stakingBalance).toFixed(4)} ETH`,
          defiProtocolsUsed: metrics.defiProtocolsUsed,
          accountAge: `${metrics.accountAge} days`,
          firstTransactionDate: new Date(metrics.firstTransactionDate * 1000).toISOString(),
          lastTransactionDate: new Date(metrics.lastTransactionDate * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to get user metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`CryptoScore API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API info: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();