// Real-time Chainlink Price Feed API Endpoint
// Implements task 6.1: Replace mock price feeds with live Chainlink integration

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
    
    // Get real-time Chainlink price
    const priceData = await priceFeedManager.getChainlinkPriceRealTime(symbol.toUpperCase());
    
    if (!priceData) {
      return res.status(404).json({ 
        error: `No Chainlink price feed available for ${symbol}`,
        symbol: symbol.toUpperCase(),
        timestamp: Date.now()
      });
    }

    // Return real Chainlink price data with staleness and confidence metrics
    res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      priceData: {
        ...priceData,
        fetchedAt: Date.now(),
        source: 'chainlink',
        isRealTime: true
      },
      metadata: {
        endpoint: 'chainlink',
        staleness: priceData.staleness,
        confidence: priceData.confidence,
        roundId: priceData.roundId
      }
    });

  } catch (error) {
    console.error(`Error fetching Chainlink price for ${symbol}:`, error);
    
    res.status(500).json({
      error: 'Failed to fetch Chainlink price',
      symbol: symbol.toUpperCase(),
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}