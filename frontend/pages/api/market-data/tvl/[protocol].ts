import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { protocol } = req.query;

  if (!protocol || typeof protocol !== 'string') {
    return res.status(400).json({ error: 'Protocol parameter is required' });
  }

  try {
    // Import the DeFi market data service
    const { getDeFiMarketDataService } = await import('../../../../services/data-aggregator/defi-market-data-service');
    
    const defiMarketService = await getDeFiMarketDataService();
    
    // Get TVL data for the specified protocol
    const tvlData = await defiMarketService.getTVLData(protocol.toLowerCase());
    
    if (!tvlData) {
      return res.status(404).json({ error: `TVL data not found for ${protocol}` });
    }

    res.status(200).json(tvlData);
  } catch (error) {
    console.error(`Error fetching TVL data for ${protocol}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch TVL data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}