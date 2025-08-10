import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the integrated price feed service
    const { getIntegratedPriceFeedService } = await import('../../../services/data-aggregator/integrated-price-feed-service');
    
    const priceFeedService = await getIntegratedPriceFeedService();
    
    // Get comprehensive service status
    const status = priceFeedService.getServiceStatus();
    
    res.status(200).json({
      ...status,
      timestamp: Date.now(),
      uptime: process.uptime(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Error fetching market data status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}