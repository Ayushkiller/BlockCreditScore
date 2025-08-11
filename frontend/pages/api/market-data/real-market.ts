import { NextApiRequest, NextApiResponse } from 'next';
import { realPriceService } from '../../../services/price-feeds/real-price-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 API: Fetching real market data');
    
    const marketData = await realPriceService.getMarketData();
    
    res.status(200).json({
      success: true,
      data: marketData,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ API: Failed to fetch real market data:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market data'
    });
  }
}