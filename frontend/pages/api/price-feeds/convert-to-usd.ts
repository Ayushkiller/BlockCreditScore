// Real USD Conversion API Endpoint
// Implements task 6.1: Create real USD conversion using actual exchange rates

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenSymbol, amount, decimals = 18 } = req.body;

  if (!tokenSymbol || !amount) {
    return res.status(400).json({ 
      error: 'tokenSymbol and amount are required',
      received: { tokenSymbol, amount, decimals }
    });
  }

  try {
    // Import the real-time price feed manager
    const { getRealTimePriceFeedManager } = await import('../../../services/data-aggregator/real-time-price-feed-manager');
    
    const priceFeedManager = await getRealTimePriceFeedManager();
    
    // Convert token amount to USD using real exchange rates
    const usdValue = await priceFeedManager.convertToUSD(
      tokenSymbol.toUpperCase(),
      amount.toString(),
      parseInt(decimals.toString())
    );
    
    // Get the price data used for conversion
    let priceData;
    try {
      priceData = await priceFeedManager.getChainlinkPriceRealTime(tokenSymbol.toUpperCase());
    } catch (chainlinkError) {
      // Fallback to DEX if Chainlink fails
      priceData = await priceFeedManager.getTokenPriceFromDEX(tokenSymbol.toUpperCase());
    }

    res.status(200).json({
      success: true,
      conversion: {
        tokenSymbol: tokenSymbol.toUpperCase(),
        tokenAmount: amount.toString(),
        decimals: parseInt(decimals.toString()),
        usdValue,
        pricePerToken: priceData?.priceUSD || 0,
        timestamp: Date.now()
      },
      priceSource: {
        source: priceData?.source || 'unknown',
        confidence: priceData?.confidence || 0,
        staleness: priceData?.staleness || 0,
        roundId: priceData?.roundId || null
      }
    });

  } catch (error) {
    console.error(`Error converting ${tokenSymbol} to USD:`, error);
    
    res.status(500).json({
      error: 'Failed to convert to USD',
      tokenSymbol: tokenSymbol?.toUpperCase(),
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
}