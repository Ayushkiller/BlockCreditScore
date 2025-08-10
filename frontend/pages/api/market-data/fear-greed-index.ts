import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the DeFi market data service
    const { getDeFiMarketDataService } = await import('../../../services/data-aggregator/defi-market-data-service');
    
    const defiMarketService = await getDeFiMarketDataService();
    
    // Get Fear & Greed Index
    const sentimentData = await defiMarketService.getFearGreedIndex();
    
    if (!sentimentData) {
      return res.status(404).json({ error: 'Fear & Greed Index data not available' });
    }

    res.status(200).json(sentimentData);
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Fear & Greed Index',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}