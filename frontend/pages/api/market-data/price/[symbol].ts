import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    // Import the real market data service
    const { getRealMarketDataService } = await import('../../../../services/data-aggregator/real-market-data-service');
    
    const marketDataService = await getRealMarketDataService();
    
    // Get real-time price with Chainlink fallback
    const priceData = await marketDataService.getPriceWithChainlinkFallback(symbol.toUpperCase());
    
    if (!priceData) {
      return res.status(404).json({ error: `Price data not found for ${symbol}` });
    }

    res.status(200).json(priceData);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch price data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}