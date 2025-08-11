import { NextApiRequest, NextApiResponse } from 'next';
import { realPriceService } from '../../../services/price-feeds/real-price-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols } = req.query;

  try {
    if (symbols && typeof symbols === 'string') {
      // Get specific symbols
      const symbolList = symbols.split(',').map(s => s.trim());
      console.log(`🔍 API: Fetching real prices for: ${symbolList.join(', ')}`);
      
      const prices = await realPriceService.getMultiplePrices(symbolList);
      
      res.status(200).json({
        success: true,
        data: prices,
        timestamp: Date.now()
      });
    } else {
      // Get default crypto prices
      const defaultSymbols = ['BTC', 'ETH', 'USDC', 'LINK', 'UNI', 'AAVE'];
      console.log(`🔍 API: Fetching default real prices`);
      
      const prices = await realPriceService.getMultiplePrices(defaultSymbols);
      
      res.status(200).json({
        success: true,
        data: prices,
        timestamp: Date.now()
      });
    }

  } catch (error) {
    console.error('❌ API: Failed to fetch real prices:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch price data'
    });
  }
}