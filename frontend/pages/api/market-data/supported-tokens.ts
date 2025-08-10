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
    res.status(500).json({ 
      error: 'Failed to fetch supported tokens',
      details: error instanceof Error ? error.message : 'Unknown error',
      tokens: ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE'], // Fallback list
      count: 8,
      timestamp: Date.now()
    });
  }
}