// Cached Prices API Endpoint
// Implements task 6.1: Display actual price feed staleness and confidence metrics

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Import the real-time price feed manager
    const { getRealTimePriceFeedManager } = await import('../../../services/data-aggregator/real-time-price-feed-manager');
    
    const priceFeedManager = await getRealTimePriceFeedManager();
    
    // Get all cached prices with detailed metrics
    const cachedPrices = priceFeedManager.getAllCachedPrices();
    
    // Enhance with additional metrics
    const enhancedPrices = cachedPrices.map(price => {
      const now = Date.now();
      const ageMinutes = Math.floor((now - price.timestamp) / (1000 * 60));
      const stalenessLevel = price.staleness > 300 ? 'stale' : 
                            price.staleness > 120 ? 'aging' : 'fresh';
      
      const confidenceLevel = price.confidence >= 90 ? 'high' :
                             price.confidence >= 70 ? 'medium' : 'low';

      return {
        symbol: price.symbol,
        priceUSD: price.priceUSD,
        source: price.source,
        staleness: price.staleness,
        stalenessLevel,
        confidence: price.confidence,
        confidenceLevel,
        timestamp: price.timestamp,
        ageMinutes,
        roundId: price.roundId,
        cacheInfo: price.cacheInfo,
        warnings: [
          ...(price.staleness > 300 ? ['Stale data'] : []),
          ...(price.staleness > 120 ? ['Aging data'] : []),
          ...(price.confidence < 70 ? ['Low confidence'] : [])
        ]
      };
    });

    // Sort by freshness (most recent first)
    enhancedPrices.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      cachedPrices: enhancedPrices,
      summary: {
        totalCached: enhancedPrices.length,
        freshPrices: enhancedPrices.filter(p => p.stalenessLevel === 'fresh').length,
        agingPrices: enhancedPrices.filter(p => p.stalenessLevel === 'aging').length,
        stalePrices: enhancedPrices.filter(p => p.stalenessLevel === 'stale').length,
        highConfidence: enhancedPrices.filter(p => p.confidenceLevel === 'high').length,
        mediumConfidence: enhancedPrices.filter(p => p.confidenceLevel === 'medium').length,
        lowConfidence: enhancedPrices.filter(p => p.confidenceLevel === 'low').length
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching cached prices:', error);
    
    res.status(500).json({
      error: 'Failed to fetch cached prices',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}