import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenSymbol, amount, decimals } = req.body;

  if (!tokenSymbol || !amount) {
    return res.status(400).json({ error: 'tokenSymbol and amount are required' });
  }

  const tokenDecimals = decimals || 18;

  try {
    // Import the integrated price feed service
    const { getIntegratedPriceFeedService } = await import('../../../services/data-aggregator/integrated-price-feed-service');
    
    const priceFeedService = await getIntegratedPriceFeedService();
    
    // Convert to USD using real-time prices
    const usdValue = await priceFeedService.convertToUSD(
      tokenSymbol.toUpperCase(),
      amount,
      tokenDecimals
    );
    
    res.status(200).json({
      tokenSymbol: tokenSymbol.toUpperCase(),
      amount,
      decimals: tokenDecimals,
      usdValue,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`Error converting ${tokenSymbol} to USD:`, error);
    res.status(500).json({ 
      error: 'Failed to convert to USD',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}