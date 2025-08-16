import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { initializeDatabase } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { blockchainService } from './services/blockchainService';
import { scoreCalculator } from './services/scoreCalculator';
import { databaseService } from './services/databaseService';
import { BenchmarkingEngine } from './services/benchmarkingEngine';
import { CompetitivePositioningEngine } from './services/competitivePositioningEngine';
import { RealTimeBenchmarkingEngine } from './services/realTimeBenchmarkingEngine';
import { PredictiveAnalyticsEngine } from './services/predictiveAnalyticsEngine';

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
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: 'fixed' });
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
      refresh: '/api/score/:address/refresh',
      benchmarking: '/api/benchmarking/:address',
      'competitive-positioning': '/api/competitive-positioning/:address',
      'market-position': '/api/market-position/:address',
      'competitive-analysis': '/api/competitive-analysis/:address',
      'real-time-benchmark': '/api/real-time-benchmark/:address',
      'benchmark-update': '/api/benchmark-update/:address',
      'benchmark-stats': '/api/benchmark-stats',
      'benchmark-config': '/api/benchmark-config',
      'score-forecast': '/api/score-forecast/:address',
      'behavioral-prediction': '/api/behavioral-prediction/:address',
      'prediction-accuracy': '/api/prediction-accuracy/:predictionId',
      'model-performance': '/api/model-performance'
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
            address: 'Ethereum address (required)',
            includeForecast: 'Include score forecast and trend prediction (optional, true/false)',
            includeBehavioralPrediction: 'Include behavioral trend prediction (optional, true/false)'
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
      // For cached scores, we still need to generate detailed breakdown
      // since the database only stores basic breakdown
      const metrics = await blockchainService.getUserMetrics(address);
      const detailedBreakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
      
      // Calculate realistic confidence based on actual metrics
      const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
      
      // Check if forecasting is requested
      const { includeForecast, includeBehavioralPrediction } = req.query;
      const responseData: any = {
        address: cachedScore.address,
        score: cachedScore.score,
        confidence: creditScore.confidence, // Use calculated confidence instead of hardcoded value
        breakdown: detailedBreakdown,
        riskAssessment: detailedBreakdown.riskAssessment,
        behavioralInsights: detailedBreakdown.behavioralInsights,
        recommendations: detailedBreakdown.recommendations,
        timestamp: cachedScore.lastUpdated,
        cached: true
      };
      
      // Add forecasting data if requested (even for cached scores)
      if (includeForecast === 'true') {
        try {
          // Check for cached forecast first
          const cachedForecast = await databaseService.getLatestScoreForecast(address);
          
          if (cachedForecast && databaseService.isCacheFresh({ lastUpdated: cachedForecast.lastUpdated } as any)) {
            responseData.forecast = cachedForecast;
          } else {
            // Generate new forecast
            const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
            const scoreHistory = await databaseService.getEnhancedScoreHistory(address, 100);
            const forecast = await PredictiveAnalyticsEngine.generateScoreForecast(
              address,
              creditScore,
              metrics,
              scoreHistory
            );
            
            await databaseService.saveScoreForecast(forecast);
            responseData.forecast = forecast;
          }
        } catch (forecastError) {
          console.error('Error generating forecast for cached score:', forecastError);
          responseData.forecastError = 'Failed to generate forecast';
        }
      }
      
      // Add behavioral prediction if requested
      if (includeBehavioralPrediction === 'true') {
        try {
          // Check for cached behavioral prediction first
          const cachedBehavioralPrediction = await databaseService.getLatestBehavioralTrendPrediction(address);
          
          if (cachedBehavioralPrediction && databaseService.isCacheFresh({ lastUpdated: cachedBehavioralPrediction.lastUpdated } as any)) {
            responseData.behavioralPrediction = cachedBehavioralPrediction;
          } else {
            // Generate new behavioral prediction
            const scoreHistory = await databaseService.getEnhancedScoreHistory(address, 100);
            const behavioralPrediction = await PredictiveAnalyticsEngine.generateBehavioralTrendPrediction(
              address,
              metrics,
              scoreHistory
            );
            
            await databaseService.saveBehavioralTrendPrediction(behavioralPrediction);
            responseData.behavioralPrediction = behavioralPrediction;
          }
        } catch (behavioralError) {
          console.error('Error generating behavioral prediction for cached score:', behavioralError);
          responseData.behavioralPredictionError = 'Failed to generate behavioral prediction';
        }
      }
      
      return res.json({
        success: true,
        data: responseData
      });
    }
    
    // Calculate new score
    const metrics = await blockchainService.getUserMetrics(address);
    
    // Debug: Log metrics for troubleshooting
    console.log('Metrics for address', address, ':', {
      totalTransactions: metrics.totalTransactions,
      totalVolume: metrics.totalVolume,
      accountAge: metrics.accountAge,
      stakingBalance: metrics.stakingBalance,
      defiProtocolsUsed: metrics.defiProtocolsUsed.length
    });
    
    // Validate metrics for scoring
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    if (!validation.isValid) {
      console.log('Validation failed for address', address, ':', validation.reasons);
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for credit scoring',
        details: validation.reasons
      });
    }
    
    // Calculate and save score
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    const detailedBreakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
    await databaseService.saveScore(creditScore);
    
    // Check if forecasting is requested
    const { includeForecast, includeBehavioralPrediction } = req.query;
    const responseData: any = {
      address: creditScore.address,
      score: creditScore.score,
      confidence: creditScore.confidence,
      breakdown: detailedBreakdown,
      riskAssessment: detailedBreakdown.riskAssessment,
      behavioralInsights: detailedBreakdown.behavioralInsights,
      recommendations: detailedBreakdown.recommendations,
      timestamp: creditScore.timestamp,
      cached: false
    };
    
    // Add forecasting data if requested
    if (includeForecast === 'true') {
      try {
        const scoreHistory = await databaseService.getEnhancedScoreHistory(address, 100);
        const forecast = await PredictiveAnalyticsEngine.generateScoreForecast(
          address,
          creditScore,
          metrics,
          scoreHistory
        );
        
        // Save forecast to database
        await databaseService.saveScoreForecast(forecast);
        
        responseData.forecast = forecast;
      } catch (forecastError) {
        console.error('Error generating forecast:', forecastError);
        responseData.forecastError = 'Failed to generate forecast';
      }
    }
    
    // Add behavioral prediction if requested
    if (includeBehavioralPrediction === 'true') {
      try {
        const scoreHistory = await databaseService.getEnhancedScoreHistory(address, 100);
        const behavioralPrediction = await PredictiveAnalyticsEngine.generateBehavioralTrendPrediction(
          address,
          metrics,
          scoreHistory
        );
        
        // Save behavioral prediction to database
        await databaseService.saveBehavioralTrendPrediction(behavioralPrediction);
        
        responseData.behavioralPrediction = behavioralPrediction;
      } catch (behavioralError) {
        console.error('Error generating behavioral prediction:', behavioralError);
        responseData.behavioralPredictionError = 'Failed to generate behavioral prediction';
      }
    }
    
    return res.json({
      success: true,
      data: responseData
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
        confidence: creditScore.confidence,
        breakdown: breakdown,
        timestamp: creditScore.timestamp,
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

// GET /api/benchmarking/:address - Get comprehensive benchmarking data
app.get('/api/benchmarking/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { includeCompetitivePositioning } = req.query;
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Invalid Ethereum address format'
      });
    }
    
    // Get user metrics and credit score
    const metrics = await blockchainService.getUserMetrics(address);
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for benchmarking analysis',
        details: validation.reasons
      });
    }
    
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    const scoreBreakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
    
    // Generate benchmarking data
    const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
      address,
      creditScore,
      scoreBreakdown,
      metrics,
      undefined,
      includeCompetitivePositioning === 'true'
    );
    
    return res.json({
      success: true,
      data: benchmarkingData
    });
    
  } catch (error) {
    console.error('Error getting benchmarking data:', error);
    return res.status(500).json({
      success: false,
      error: 'BENCHMARKING_ERROR',
      message: 'Failed to generate benchmarking data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/competitive-positioning/:address - Get competitive positioning analysis
app.get('/api/competitive-positioning/:address', async (req, res) => {
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
    
    // Check for cached competitive positioning data first
    const cachedData = await databaseService.getLatestCompetitivePositioningData(address);
    
    if (cachedData && databaseService.isCacheFresh({ lastUpdated: cachedData.timestamp } as any)) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    // Generate new competitive positioning analysis
    const metrics = await blockchainService.getUserMetrics(address);
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for competitive positioning analysis',
        details: validation.reasons
      });
    }
    
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    const scoreBreakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
    
    // Generate benchmarking data for context
    const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
      address,
      creditScore,
      scoreBreakdown,
      metrics
    );
    
    // Generate competitive positioning
    const competitivePositioning = await CompetitivePositioningEngine.generateCompetitivePositioning(
      address,
      creditScore,
      scoreBreakdown,
      metrics,
      benchmarkingData
    );
    
    // Save to database
    await databaseService.saveCompetitivePositioningData(competitivePositioning);
    
    return res.json({
      success: true,
      data: competitivePositioning,
      cached: false
    });
    
  } catch (error) {
    console.error('Error getting competitive positioning:', error);
    return res.status(500).json({
      success: false,
      error: 'COMPETITIVE_POSITIONING_ERROR',
      message: 'Failed to generate competitive positioning analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/market-position/:address - Get market position analysis
app.get('/api/market-position/:address', async (req, res) => {
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
    
    // Get competitive positioning data
    const cachedData = await databaseService.getLatestCompetitivePositioningData(address);
    
    if (cachedData && databaseService.isCacheFresh({ lastUpdated: cachedData.timestamp } as any)) {
      return res.json({
        success: true,
        data: {
          address: cachedData.address,
          marketPosition: cachedData.marketPosition,
          trendComparison: cachedData.trendComparison,
          timestamp: cachedData.timestamp
        },
        cached: true
      });
    }
    
    // Generate new analysis if no cached data
    const metrics = await blockchainService.getUserMetrics(address);
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for market position analysis',
        details: validation.reasons
      });
    }
    
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    const scoreBreakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
    
    const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
      address,
      creditScore,
      scoreBreakdown,
      metrics
    );
    
    const competitivePositioning = await CompetitivePositioningEngine.generateCompetitivePositioning(
      address,
      creditScore,
      scoreBreakdown,
      metrics,
      benchmarkingData
    );
    
    await databaseService.saveCompetitivePositioningData(competitivePositioning);
    
    return res.json({
      success: true,
      data: {
        address: competitivePositioning.address,
        marketPosition: competitivePositioning.marketPosition,
        trendComparison: competitivePositioning.trendComparison,
        timestamp: Math.floor(Date.now() / 1000)
      },
      cached: false
    });
    
  } catch (error) {
    console.error('Error getting market position:', error);
    return res.status(500).json({
      success: false,
      error: 'MARKET_POSITION_ERROR',
      message: 'Failed to get market position analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/competitive-analysis/:address - Get competitive analysis data
app.get('/api/competitive-analysis/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { type } = req.query; // advantages, opportunities, threats, recommendations
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Invalid Ethereum address format'
      });
    }
    
    let data: any = {};
    
    if (!type || type === 'advantages') {
      data.competitiveAdvantages = await databaseService.getCompetitiveAdvantages(address);
    }
    
    if (!type || type === 'opportunities') {
      data.marketOpportunities = await databaseService.getMarketOpportunities(address);
    }
    
    if (!type || type === 'threats') {
      data.competitiveThreats = await databaseService.getCompetitiveThreats(address);
    }
    
    if (!type || type === 'recommendations') {
      data.strategicRecommendations = await databaseService.getStrategicRecommendations(address);
    }
    
    return res.json({
      success: true,
      data: {
        address,
        ...data,
        timestamp: Math.floor(Date.now() / 1000)
      }
    });
    
  } catch (error) {
    console.error('Error getting competitive analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'COMPETITIVE_ANALYSIS_ERROR',
      message: 'Failed to get competitive analysis data',
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

// Real-time Benchmarking API Endpoints

// GET /api/real-time-benchmark/:address - Get real-time benchmark data
app.get('/api/real-time-benchmark/:address', async (req, res) => {
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
    
    // Get user metrics and credit score
    const metrics = await blockchainService.getUserMetrics(address);
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for real-time benchmarking',
        details: validation.reasons
      });
    }
    
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    const scoreBreakdown = scoreCalculator.generateScoreBreakdown(address, metrics);
    
    // Get real-time benchmark data
    const realTimeBenchmarkData = await RealTimeBenchmarkingEngine.getRealTimeBenchmarkData(
      address,
      creditScore,
      scoreBreakdown,
      metrics
    );
    
    return res.json({
      success: true,
      data: {
        address: realTimeBenchmarkData.address,
        peerGroupId: realTimeBenchmarkData.peerGroupId,
        overallPercentile: realTimeBenchmarkData.overallPercentile,
        componentPercentiles: JSON.parse(realTimeBenchmarkData.componentPercentiles),
        lastUpdated: realTimeBenchmarkData.lastUpdated,
        updateFrequency: realTimeBenchmarkData.updateFrequency,
        isStale: realTimeBenchmarkData.isStale,
        benchmarkTimestamp: realTimeBenchmarkData.benchmarkTimestamp
      }
    });
    
  } catch (error) {
    console.error('Error getting real-time benchmark data:', error);
    return res.status(500).json({
      success: false,
      error: 'REAL_TIME_BENCHMARK_ERROR',
      message: 'Failed to get real-time benchmark data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/score-forecast/:address - Get score forecast and trend prediction
app.get('/api/score-forecast/:address', async (req, res) => {
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
    
    // Check for cached forecast first
    const cachedForecast = await databaseService.getLatestScoreForecast(address);
    
    if (cachedForecast && databaseService.isCacheFresh({ lastUpdated: cachedForecast.lastUpdated } as any)) {
      return res.json({
        success: true,
        data: cachedForecast,
        cached: true
      });
    }
    
    // Generate new forecast
    const metrics = await blockchainService.getUserMetrics(address);
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for score forecasting',
        details: validation.reasons
      });
    }
    
    const creditScore = scoreCalculator.calculateCreditScore(address, metrics);
    const scoreHistory = await databaseService.getEnhancedScoreHistory(address, 100);
    
    // Generate score forecast
    const forecast = await PredictiveAnalyticsEngine.generateScoreForecast(
      address,
      creditScore,
      metrics,
      scoreHistory
    );
    
    // Save forecast to database
    await databaseService.saveScoreForecast(forecast);
    
    return res.json({
      success: true,
      data: forecast,
      cached: false
    });
    
  } catch (error) {
    console.error('Error getting score forecast:', error);
    return res.status(500).json({
      success: false,
      error: 'FORECAST_ERROR',
      message: 'Failed to generate score forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/behavioral-prediction/:address - Get behavioral trend prediction
app.get('/api/behavioral-prediction/:address', async (req, res) => {
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
    
    // Check for cached prediction first
    const cachedPrediction = await databaseService.getLatestBehavioralTrendPrediction(address);
    
    if (cachedPrediction && databaseService.isCacheFresh({ lastUpdated: cachedPrediction.lastUpdated } as any)) {
      return res.json({
        success: true,
        data: cachedPrediction,
        cached: true
      });
    }
    
    // Generate new behavioral prediction
    const metrics = await blockchainService.getUserMetrics(address);
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: 'Insufficient data for behavioral prediction',
        details: validation.reasons
      });
    }
    
    const scoreHistory = await databaseService.getEnhancedScoreHistory(address, 100);
    
    // Generate behavioral trend prediction
    const prediction = await PredictiveAnalyticsEngine.generateBehavioralTrendPrediction(
      address,
      metrics,
      scoreHistory
    );
    
    // Save prediction to database
    await databaseService.saveBehavioralTrendPrediction(prediction);
    
    return res.json({
      success: true,
      data: prediction,
      cached: false
    });
    
  } catch (error) {
    console.error('Error getting behavioral prediction:', error);
    return res.status(500).json({
      success: false,
      error: 'BEHAVIORAL_PREDICTION_ERROR',
      message: 'Failed to generate behavioral prediction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/prediction-accuracy/:predictionId - Track prediction accuracy
app.post('/api/prediction-accuracy/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { actualScore } = req.body;
    
    // Validate input
    if (!predictionId || typeof actualScore !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Prediction ID and actual score are required'
      });
    }
    
    if (actualScore < 0 || actualScore > 1000) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SCORE',
        message: 'Actual score must be between 0 and 1000'
      });
    }
    
    // Track prediction accuracy
    const accuracyResult = await PredictiveAnalyticsEngine.trackPredictionAccuracy(
      predictionId,
      '', // Address will be retrieved from the prediction
      actualScore
    );
    
    return res.json({
      success: true,
      data: accuracyResult
    });
    
  } catch (error) {
    console.error('Error tracking prediction accuracy:', error);
    return res.status(500).json({
      success: false,
      error: 'ACCURACY_TRACKING_ERROR',
      message: 'Failed to track prediction accuracy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/model-performance - Get model performance metrics
app.get('/api/model-performance', async (req, res) => {
  try {
    const { model } = req.query;
    
    // Get model performance metrics
    const performance = await PredictiveAnalyticsEngine.getModelPerformance(
      model as string
    );
    
    return res.json({
      success: true,
      data: {
        models: performance,
        total: performance.length
      }
    });
    
  } catch (error) {
    console.error('Error getting model performance:', error);
    return res.status(500).json({
      success: false,
      error: 'MODEL_PERFORMANCE_ERROR',
      message: 'Failed to get model performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/benchmark-update/:address - Trigger benchmark update
app.post('/api/benchmark-update/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { priority = 'MEDIUM', delay = 0 } = req.body;
    
    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ADDRESS',
        message: 'Invalid Ethereum address format'
      });
    }
    
    // Validate priority
    if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PRIORITY',
        message: 'Priority must be HIGH, MEDIUM, or LOW'
      });
    }
    
    // Schedule benchmark update
    const jobId = await RealTimeBenchmarkingEngine.scheduleBenchmarkUpdate(
      address,
      priority,
      delay
    );
    
    return res.json({
      success: true,
      data: {
        address,
        jobId,
        priority,
        delay,
        message: 'Benchmark update scheduled successfully'
      }
    });
    
  } catch (error) {
    console.error('Error scheduling benchmark update:', error);
    return res.status(500).json({
      success: false,
      error: 'BENCHMARK_UPDATE_ERROR',
      message: 'Failed to schedule benchmark update',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/benchmark-stats - Get real-time benchmarking statistics
app.get('/api/benchmark-stats', async (req, res) => {
  try {
    const stats = await RealTimeBenchmarkingEngine.getRealTimeBenchmarkStats();
    
    return res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting benchmark stats:', error);
    return res.status(500).json({
      success: false,
      error: 'BENCHMARK_STATS_ERROR',
      message: 'Failed to get benchmark statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/benchmark-config - Get benchmarking configuration
app.get('/api/benchmark-config', async (req, res) => {
  try {
    const config = RealTimeBenchmarkingEngine.getConfig();
    
    return res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('Error getting benchmark config:', error);
    return res.status(500).json({
      success: false,
      error: 'BENCHMARK_CONFIG_ERROR',
      message: 'Failed to get benchmark configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/benchmark-config - Update benchmarking configuration
app.put('/api/benchmark-config', async (req, res) => {
  try {
    const { updateFrequency, staleThreshold, batchSize, maxRetries, priorityThresholds } = req.body;
    
    const configUpdate: any = {};
    
    if (updateFrequency !== undefined) {
      if (typeof updateFrequency !== 'number' || updateFrequency < 60) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_UPDATE_FREQUENCY',
          message: 'Update frequency must be a number >= 60 seconds'
        });
      }
      configUpdate.updateFrequency = updateFrequency;
    }
    
    if (staleThreshold !== undefined) {
      if (typeof staleThreshold !== 'number' || staleThreshold < 300) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_STALE_THRESHOLD',
          message: 'Stale threshold must be a number >= 300 seconds'
        });
      }
      configUpdate.staleThreshold = staleThreshold;
    }
    
    if (batchSize !== undefined) {
      if (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 1000) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_BATCH_SIZE',
          message: 'Batch size must be a number between 1 and 1000'
        });
      }
      configUpdate.batchSize = batchSize;
    }
    
    if (maxRetries !== undefined) {
      if (typeof maxRetries !== 'number' || maxRetries < 0 || maxRetries > 10) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_MAX_RETRIES',
          message: 'Max retries must be a number between 0 and 10'
        });
      }
      configUpdate.maxRetries = maxRetries;
    }
    
    if (priorityThresholds !== undefined) {
      if (typeof priorityThresholds !== 'object' || 
          typeof priorityThresholds.high !== 'number' || 
          typeof priorityThresholds.medium !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PRIORITY_THRESHOLDS',
          message: 'Priority thresholds must be an object with high and medium number values'
        });
      }
      configUpdate.priorityThresholds = priorityThresholds;
    }
    
    // Update configuration
    RealTimeBenchmarkingEngine.updateConfig(configUpdate);
    
    const updatedConfig = RealTimeBenchmarkingEngine.getConfig();
    
    return res.json({
      success: true,
      data: {
        message: 'Configuration updated successfully',
        config: updatedConfig
      }
    });
    
  } catch (error) {
    console.error('Error updating benchmark config:', error);
    return res.status(500).json({
      success: false,
      error: 'BENCHMARK_CONFIG_UPDATE_ERROR',
      message: 'Failed to update benchmark configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/benchmark-refresh-stale - Force refresh all stale benchmarks
app.post('/api/benchmark-refresh-stale', async (req, res) => {
  try {
    const refreshedCount = await RealTimeBenchmarkingEngine.forceRefreshStaleBenchmarks();
    
    return res.json({
      success: true,
      data: {
        message: 'Stale benchmark refresh initiated',
        refreshedCount
      }
    });
    
  } catch (error) {
    console.error('Error refreshing stale benchmarks:', error);
    return res.status(500).json({
      success: false,
      error: 'BENCHMARK_REFRESH_ERROR',
      message: 'Failed to refresh stale benchmarks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Initialize real-time benchmarking engine
    RealTimeBenchmarkingEngine.initialize({
      updateFrequency: 300, // 5 minutes
      staleThreshold: 900,  // 15 minutes
      batchSize: 50,
      maxRetries: 3,
      priorityThresholds: {
        high: 5,   // 5 percentile change
        medium: 2  // 2 percentile change
      }
    });
    console.log('Real-time benchmarking engine initialized');
    
    app.listen(PORT, () => {
      console.log(`CryptoScore API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API info: http://localhost:${PORT}/api`);
      console.log(`Real-time benchmarking: ACTIVE`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();