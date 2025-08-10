import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'Symbols array is required' });
  }

  try {
    // Import the integrated price feed service
    const { getIntegratedPriceFeedService } = await import('../../../../services/data-aggregator/integrated-price-feed-service');
    
    const priceFeedService = await getIntegratedPriceFeedService();
    
    // Get batch prices
    const batchResponse = await priceFeedService.getBatchPrices({
      symbols: symbols.map((s: string) => s.toUpperCase()),
      requestId: `batch_${Date.now()}`,
      includeVolatility: true
    });
    
    // Convert Map to object for JSON serialization
    const prices: { [key: string]: any } = {};
    const volatility: { [key: string]: any } = {};
    const errors: { [key: string]: string } = {};
    const fromCache: { [key: string]: boolean } = {};

    for (const [symbol, priceData] of batchResponse.prices.entries()) {
      prices[symbol] = priceData;
    }

    if (batchResponse.volatility) {
      for (const [symbol, volatilityData] of batchResponse.volatility.entries()) {
        volatility[symbol] = volatilityData;
      }
    }

    for (const [symbol, error] of batchResponse.errors.entries()) {
      errors[symbol] = error;
    }

    for (const [symbol, cached] of batchResponse.fromCache.entries()) {
      fromCache[symbol] = cached;
    }

    res.status(200).json({
      prices,
      volatility: Object.keys(volatility).length > 0 ? volatility : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      fromCache,
      totalLatency: batchResponse.totalLatency,
      requestId: batchResponse.requestId
    });
  } catch (error) {
    console.error('Error fetching batch prices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batch price data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}