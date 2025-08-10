// Price Feed Failover Status API Endpoint
// Implements task 6.2: Display actual price feed source information and failover status

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get failover status from the price feed failover service
    const response = await fetch('http://localhost:3001/api/data-aggregator/price-failover/status');
    
    if (!response.ok) {
      throw new Error(`Failover service responded with status: ${response.status}`);
    }

    const failoverStatus = await response.json();

    // Enhance the status with additional computed metrics
    const enhancedStatus = {
      ...failoverStatus,
      overallHealth: calculateOverallHealth(failoverStatus),
      redundancyLevel: calculateRedundancyLevel(failoverStatus),
      criticalSourcesDown: failoverStatus.sources?.filter((s: any) => 
        s.priority <= 2 && (!s.isHealthy || !s.isEnabled)
      ).length || 0,
      averageSuccessRate: calculateAverageSuccessRate(failoverStatus.sources || []),
      averageLatency: calculateAverageLatency(failoverStatus.sources || []),
      lastHealthCheck: new Date().toISOString()
    };

    res.status(200).json(enhancedStatus);
  } catch (error) {
    console.error('Error fetching price failover status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price failover status',
      isInitialized: false,
      totalSources: 0,
      healthySources: 0,
      enabledSources: 0,
      circuitBreakersOpen: 0,
      sources: [],
      overallHealth: 'unhealthy',
      redundancyLevel: 'none',
      criticalSourcesDown: 0,
      averageSuccessRate: 0,
      averageLatency: 0,
      lastHealthCheck: new Date().toISOString()
    });
  }
}

function calculateOverallHealth(status: any): 'healthy' | 'degraded' | 'unhealthy' {
  if (!status.isInitialized) return 'unhealthy';
  
  const healthyRatio = status.totalSources > 0 ? status.healthySources / status.totalSources : 0;
  
  if (healthyRatio >= 0.8 && status.circuitBreakersOpen === 0) return 'healthy';
  if (healthyRatio >= 0.5) return 'degraded';
  return 'unhealthy';
}

function calculateRedundancyLevel(status: any): 'high' | 'medium' | 'low' | 'none' {
  const healthySources = status.healthySources || 0;
  
  if (healthySources >= 4) return 'high';
  if (healthySources >= 3) return 'medium';
  if (healthySources >= 2) return 'low';
  return 'none';
}

function calculateAverageSuccessRate(sources: any[]): number {
  if (sources.length === 0) return 0;
  
  const totalRate = sources.reduce((sum, source) => {
    const total = source.successCount + source.failureCount;
    const rate = total > 0 ? (source.successCount / total) * 100 : 0;
    return sum + rate;
  }, 0);
  
  return totalRate / sources.length;
}

function calculateAverageLatency(sources: any[]): number {
  if (sources.length === 0) return 0;
  
  const healthySources = sources.filter(s => s.isHealthy && s.averageLatency > 0);
  if (healthySources.length === 0) return 0;
  
  const totalLatency = healthySources.reduce((sum, source) => sum + source.averageLatency, 0);
  return totalLatency / healthySources.length;
}