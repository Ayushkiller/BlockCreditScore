import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the integrated price feed service
    const { getIntegratedPriceFeedService } = await import('../../../services/data-aggregator/integrated-price-feed-service');
    
    const priceFeedService = await getIntegratedPriceFeedService();
    
    // Perform comprehensive health check
    const healthCheck = await priceFeedService.performHealthCheck();
    
    // Set appropriate HTTP status based on health
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 206 : 503;
    
    res.status(httpStatus).json({
      ...healthCheck,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}