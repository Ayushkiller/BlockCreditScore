// API endpoint for production environment retry policies
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const retryPolicies = [
      {
        service: 'Alchemy',
        category: 'RPC Provider',
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        exponentialBackoff: true,
        jitterMs: 500,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: null,
        totalRetries: 12,
        successRate: 0.94
      },
      {
        service: 'Infura',
        category: 'RPC Provider',
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        exponentialBackoff: true,
        jitterMs: 500,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: Date.now() - 120000,
        totalRetries: 8,
        successRate: 0.96
      },
      {
        service: 'Ankr',
        category: 'RPC Provider',
        maxRetries: 2,
        baseDelayMs: 1500,
        maxDelayMs: 30000,
        exponentialBackoff: true,
        jitterMs: 500,
        currentRetryCount: 1,
        nextRetryTime: Date.now() + 3000,
        lastRetryTime: Date.now() - 1500,
        totalRetries: 15,
        successRate: 0.89
      },
      {
        service: 'CoinGecko',
        category: 'Price Provider',
        maxRetries: 3,
        baseDelayMs: 2000,
        maxDelayMs: 60000,
        exponentialBackoff: true,
        jitterMs: 1000,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: Date.now() - 300000,
        totalRetries: 5,
        successRate: 0.98
      },
      {
        service: 'CoinMarketCap',
        category: 'Price Provider',
        maxRetries: 2,
        baseDelayMs: 5000,
        maxDelayMs: 300000, // 5 minutes for daily rate limits
        exponentialBackoff: true,
        jitterMs: 2000,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: null,
        totalRetries: 2,
        successRate: 0.99
      },
      {
        service: 'DefiLlama',
        category: 'DeFi Provider',
        maxRetries: 3,
        baseDelayMs: 3000,
        maxDelayMs: 180000, // 3 minutes for 5-minute rate limits
        exponentialBackoff: true,
        jitterMs: 1500,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: Date.now() - 600000,
        totalRetries: 3,
        successRate: 0.97
      },
      {
        service: 'Fear & Greed Index',
        category: 'Sentiment Provider',
        maxRetries: 2,
        baseDelayMs: 10000,
        maxDelayMs: 3600000, // 1 hour for daily rate limits
        exponentialBackoff: false,
        jitterMs: 5000,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: null,
        totalRetries: 1,
        successRate: 0.95
      },
      {
        service: 'Monitoring Service',
        category: 'Monitoring',
        maxRetries: 5,
        baseDelayMs: 500,
        maxDelayMs: 10000,
        exponentialBackoff: true,
        jitterMs: 250,
        currentRetryCount: 0,
        nextRetryTime: null,
        lastRetryTime: Date.now() - 30000,
        totalRetries: 7,
        successRate: 0.92
      }
    ];

    // Calculate summary statistics
    const summary = {
      totalServices: retryPolicies.length,
      servicesWithActiveRetries: retryPolicies.filter(p => p.currentRetryCount > 0).length,
      averageSuccessRate: retryPolicies.reduce((sum, p) => sum + p.successRate, 0) / retryPolicies.length,
      totalRetriesAcrossServices: retryPolicies.reduce((sum, p) => sum + p.totalRetries, 0),
      servicesWithPendingRetries: retryPolicies.filter(p => p.nextRetryTime && p.nextRetryTime > Date.now()).length,
      retryStrategies: {
        exponentialBackoff: retryPolicies.filter(p => p.exponentialBackoff).length,
        fixedDelay: retryPolicies.filter(p => !p.exponentialBackoff).length
      }
    };

    res.status(200).json({
      retryPolicies,
      summary
    });
  } catch (error) {
    console.error('Error fetching retry policies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch retry policies',
      details: error.message 
    });
  }
}