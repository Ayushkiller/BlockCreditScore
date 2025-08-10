import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, days } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const daysNumber = days ? parseInt(days as string) : 30;
  
  if (isNaN(daysNumber) || daysNumber <= 0 || daysNumber > 365) {
    return res.status(400).json({ error: 'Days must be a number between 1 and 365' });
  }

  try {
    // Import the real market data service
    const { getRealMarketDataService } = await import('../../../../services/data-aggregator/real-market-data-service');
    
    const marketDataService = await getRealMarketDataService();
    
    // Get historical price data from CoinGecko
    const historicalData = await marketDataService.getHistoricalPrices(symbol.toUpperCase(), daysNumber);
    
    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({ error: `Historical data not found for ${symbol}` });
    }

    res.status(200).json(historicalData);
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch historical price data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}