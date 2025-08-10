// Price Cache Metrics API Endpoint
// Implements task 6.2: Display real price cache status and staleness indicators

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get detailed cache metrics from the Redis price cache service
    const response = await fetch('http://localhost:3001/api/data-aggregator/price-cache/metrics');
    
    if (!response.ok) {
      throw new Error(`Cache metrics service responded with status: ${response.status}`);
    }

    const metrics = await response.json();

    // Add additional computed metrics
    const enhancedMetrics = {
      ...metrics,
      efficiency: metrics.hitRate > 0 ? (metrics.hitRate / (metrics.hitRate + metrics.missRate)) * 100 : 0,
      stalenessPercentage: metrics.totalKeys > 0 ? (metrics.stalePrices / metrics.totalKeys) * 100 : 0,
      memoryUsageMB: metrics.memoryUsage ? (metrics.memoryUsage / 1024 / 1024).toFixed(2) : 0,
      lastUpdateFormatted: metrics.lastUpdate ? new Date(metrics.lastUpdate).toISOString() : null,
      healthScore: calculateHealthScore(metrics)
    };

    res.status(200).json(enhancedMetrics);
  } catch (error) {
    console.error('Error fetching price cache metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price cache metrics',
      hitRate: 0,
      missRate: 0,
      averageLatency: 0,
      stalePrices: 0,
      totalKeys: 0,
      memoryUsage: 0,
      healthStatus: 'unhealthy',
      efficiency: 0,
      stalenessPercentage: 0,
      memoryUsageMB: 0,
      lastUpdateFormatted: null,
      healthScore: 0
    });
  }
}

function calculateHealthScore(metrics: any): number {
  let score = 100;

  // Reduce score based on hit rate
  if (metrics.hitRate < 80) score -= 20;
  else if (metrics.hitRate < 90) score -= 10;

  // Reduce score based on staleness
  const stalenessPercentage = metrics.totalKeys > 0 ? (metrics.stalePrices / metrics.totalKeys) * 100 : 0;
  if (stalenessPercentage > 20) score -= 30;
  else if (stalenessPercentage > 10) score -= 15;

  // Reduce score based on latency
  if (metrics.averageLatency > 1000) score -= 20;
  else if (metrics.averageLatency > 500) score -= 10;

  // Reduce score based on memory usage (if over 100MB)
  const memoryUsageMB = metrics.memoryUsage / 1024 / 1024;
  if (memoryUsageMB > 200) score -= 15;
  else if (memoryUsageMB > 100) score -= 5;

  return Math.max(0, score);
}