// Price Feed Status API Endpoint
// Implements task 6.2: Display real price cache status and staleness indicators

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get price cache status from the data aggregator service
    const cacheResponse = await fetch('http://localhost:3001/api/data-aggregator/price-cache/status');
    const cacheStatus = cacheResponse.ok ? await cacheResponse.json() : null;

    // Get price failover status
    const failoverResponse = await fetch('http://localhost:3001/api/data-aggregator/price-failover/status');
    const failoverStatus = failoverResponse.ok ? await failoverResponse.json() : null;

    // Get volatility monitoring status
    const volatilityResponse = await fetch('http://localhost:3001/api/data-aggregator/volatility-monitor/status');
    const volatilityStatus = volatilityResponse.ok ? await volatilityResponse.json() : null;

    res.status(200).json({
      cache: cacheStatus,
      failover: failoverStatus,
      volatility: volatilityStatus,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching price feed status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price feed status',
      cache: null,
      failover: null,
      volatility: null,
      timestamp: Date.now()
    });
  }
}