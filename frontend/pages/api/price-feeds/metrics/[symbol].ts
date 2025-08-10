// Price Feed Metrics API Endpoint
// Implements task 6.1: Display actual price feed staleness and confidence metrics

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
    // Import the real-time price feed manager
    const { getRealTimePriceFeedManager } = await import('../../../../services/data-aggregator/real-time-price-feed-manager');
    
    const priceFeedManager = await getRealTimePriceFeedManager();
    
    // Get cached price data with metrics
    const cachedPrices = priceFeedManager.getAllCachedPrices();
    const symbolPrice = cachedPrices.find(price => price.symbol === symbol.toUpperCase());
    
    if (!symbolPrice) {
      // Try to fetch fresh data
      try {
        const freshPrice = await priceFeedManager.getChainlinkPriceRealTime(symbol.toUpperCase());
        if (freshPrice) {
          return res.status(200).json({
            success: true,
            symbol: symbol.toUpperCase(),
            metrics: {
              priceUSD: freshPrice.priceUSD,
              staleness: freshPrice.staleness,
              confidence: freshPrice.confidence,
              source: freshPrice.source,
              timestamp: freshPrice.timestamp,
              roundId: freshPrice.roundId,
              isFresh: true,
              cacheStatus: 'not_cached'
            }
          });
        }
      } catch (fetchError) {
        console.error(`Error fetching fresh price for ${symbol}:`, fetchError);
      }
      
      return res.status(404).json({ 
        error: `No price data available for ${symbol}`,
        symbol: symbol.toUpperCase(),
        timestamp: Date.now()
      });
    }

    // Calculate additional metrics
    const now = Date.now();
    const ageMinutes = Math.floor((now - symbolPrice.timestamp) / (1000 * 60));
    const stalenessLevel = symbolPrice.staleness > 300 ? 'stale' : 
                          symbolPrice.staleness > 120 ? 'aging' : 'fresh';
    
    const confidenceLevel = symbolPrice.confidence >= 90 ? 'high' :
                           symbolPrice.confidence >= 70 ? 'medium' : 'low';

    res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      metrics: {
        priceUSD: symbolPrice.priceUSD,
        staleness: symbolPrice.staleness,
        stalenessLevel,
        confidence: symbolPrice.confidence,
        confidenceLevel,
        source: symbolPrice.source,
        timestamp: symbolPrice.timestamp,
        ageMinutes,
        roundId: symbolPrice.roundId,
        isFresh: false,
        cacheStatus: 'cached',
        cacheInfo: symbolPrice.cacheInfo
      },
      warnings: [
        ...(symbolPrice.staleness > 300 ? ['Price data is stale (>5 minutes)'] : []),
        ...(symbolPrice.staleness > 120 ? ['Price data is aging (>2 minutes)'] : []),
        ...(symbolPrice.confidence < 70 ? ['Low confidence in price data'] : [])
      ]
    });

  } catch (error) {
    console.error(`Error fetching price metrics for ${symbol}:`, error);
    
    res.status(500).json({
      error: 'Failed to fetch price metrics',
      symbol: symbol.toUpperCase(),
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}