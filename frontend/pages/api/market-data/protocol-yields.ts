import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol } = req.query;

  try {
    // Import the DeFi market data service
    const { getDeFiMarketDataService } = await import('../../../services/data-aggregator/defi-market-data-service');
    
    const defiMarketService = await getDeFiMarketDataService();
    
    // Get protocol yield data
    const yieldData = await defiMarketService.getProtocolYields(
      protocol && typeof protocol === 'string' ? protocol : undefined
    );
    
    if (!yieldData || yieldData.length === 0) {
      return res.status(404).json({ error: 'Protocol yield data not available' });
    }

    res.status(200).json(yieldData);
  } catch (error) {
    console.error('Error fetching protocol yields:', error);
    res.status(500).json({ 
      error: 'Failed to fetch protocol yield data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}