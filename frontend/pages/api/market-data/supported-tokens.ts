import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the integrated price feed service
    const { getIntegratedPriceFeedService } = await import('../../../services/data-aggregator/integrated-price-feed-service');
    
    const priceFeedService = await getIntegratedPriceFeedService();
    
    // Get service status which includes supported tokens
    const status = priceFeedService.getServiceStatus();
    
    res.status(200).json({
      tokens: status.supportedTokens || [],
      count: status.supportedTokens?.length || 0,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching supported tokens:', error);
    // Task 4.3: Remove fallback mock data, return proper error state
    res.status(503).json({ 
      error: 'Real supported tokens data unavailable',
      details: error instanceof Error ? error.message : 'Unable to fetch from blockchain services',
      tokens: [], // No fallback data - empty array indicates unavailable
      count: 0,
      timestamp: Date.now(),
      dataUnavailable: true
    });
  }
}