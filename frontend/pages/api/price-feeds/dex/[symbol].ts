// DEX Aggregator Price Feed API Endpoint
// Implements task 6.1: Add real token price fetching from DEX aggregators

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
    
    // Get real-time DEX price from 1inch or 0x
    const priceData = await priceFeedManager.getTokenPriceFromDEX(symbol.toUpperCase());
    
    if (!priceData) {
      return res.status(404).json({ 
        error: `No DEX price available for ${symbol}`,
        symbol: symbol.toUpperCase(),
        timestamp: Date.now()
      });
    }

    // Return real DEX price data
    res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      priceData: {
        ...priceData,
        fetchedAt: Date.now(),
        source: 'dex_aggregator',
        isRealTime: true
      },
      metadata: {
        endpoint: 'dex',
        staleness: priceData.staleness,
        confidence: priceData.confidence,
        aggregator: priceData.source
      }
    });

  } catch (error) {
    console.error(`Error fetching DEX price for ${symbol}:`, error);
    
    res.status(500).json({
      error: 'Failed to fetch DEX price',
      symbol: symbol.toUpperCase(),
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}