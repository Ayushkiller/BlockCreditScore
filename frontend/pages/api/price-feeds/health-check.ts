// Price Feed Health Check API Endpoint
// Implements task 6.1: Add real-time price feed status indicators

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the real-time price feed manager
    const { getRealTimePriceFeedManager } = await import('../../../services/data-aggregator/real-time-price-feed-manager');
    
    const priceFeedManager = await getRealTimePriceFeedManager();
    
    // Perform comprehensive health check
    const healthCheck = await priceFeedManager.performHealthCheck();
    
    // Get service status for additional context
    const serviceStatus = priceFeedManager.getServiceStatus();
    
    // Determine overall system health
    const systemHealth = {
      status: healthCheck.status,
      details: healthCheck.details,
      serviceInfo: {
        isInitialized: serviceStatus.isInitialized,
        cachedPrices: serviceStatus.cachedPrices,
        activeSubscriptions: serviceStatus.activeSubscriptions,
        web3Connections: serviceStatus.web3Connections,
        supportedTokens: serviceStatus.supportedTokens,
        lastUpdate: serviceStatus.lastUpdate
      },
      recommendations: []
    };

    // Add recommendations based on health status
    if (healthCheck.status === 'unhealthy') {
      systemHealth.recommendations.push(
        'Check network connectivity and RPC provider status',
        'Verify API keys for external services',
        'Review system logs for detailed error information'
      );
    } else if (healthCheck.status === 'degraded') {
      systemHealth.recommendations.push(
        'Monitor price feed latency',
        'Consider switching to backup data sources',
        'Check for rate limiting issues'
      );
    } else {
      systemHealth.recommendations.push(
        'System is operating normally',
        'Continue monitoring for any changes'
      );
    }

    res.status(200).json({
      success: true,
      healthCheck: systemHealth,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error performing price feed health check:', error);
    
    res.status(500).json({
      error: 'Failed to perform health check',
      message: error instanceof Error ? error.message : 'Unknown error',
      healthCheck: {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      timestamp: Date.now()
    });
  }
}