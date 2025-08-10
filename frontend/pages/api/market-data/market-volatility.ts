import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { asset, historicalPrices } = req.body;

  if (!asset || !historicalPrices || !Array.isArray(historicalPrices)) {
    return res.status(400).json({ error: 'Asset and historicalPrices array are required' });
  }

  try {
    // Import the DeFi market data service
    const { getDeFiMarketDataService } = await import('../../../services/data-aggregator/defi-market-data-service');
    
    const defiMarketService = await getDeFiMarketDataService();
    
    // Calculate market volatility
    const volatilityData = await defiMarketService.calculateMarketVolatility(asset, historicalPrices);
    
    if (!volatilityData) {
      return res.status(404).json({ error: 'Unable to calculate volatility data' });
    }

    res.status(200).json(volatilityData);
  } catch (error) {
    console.error('Error calculating market volatility:', error);
    res.status(500).json({ 
      error: 'Failed to calculate market volatility',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}