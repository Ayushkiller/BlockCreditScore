import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the DeFi market data service
    const { getDeFiMarketDataService } = await import('../../../services/data-aggregator/defi-market-data-service');
    
    const defiMarketService = await getDeFiMarketDataService();
    
    // Get comprehensive market data
    const allMarketData = await defiMarketService.getAllMarketData();
    
    res.status(200).json({
      ...allMarketData,
      timestamp: Date.now(),
      dataPoints: {
        tvl: allMarketData.tvlData.length,
        yields: allMarketData.yieldData.length,
        volatility: allMarketData.volatility.length
      }
    });
  } catch (error) {
    console.error('Error fetching all market data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comprehensive market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}