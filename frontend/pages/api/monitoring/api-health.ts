// API Health Monitoring Endpoint
// Task 4.3: Replace all mock data with real blockchain data sources
// Provides real API error status and health monitoring data from actual blockchain services

import { NextApiRequest, NextApiResponse } from 'next';

// Real API health data structure from actual blockchain services
interface APIHealthResponse {
  healthStatus: Array<{
    provider: string;
    endpoint: string;
    isHealthy: boolean;
    lastSuccessTime: number;
    lastErrorTime: number;
    errorCount: number;
    averageResponseTime: number;
    uptime: number;
  }>;
  metrics: Array<{
    provider: string;
    endpoint: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    errorRate: number;
    lastRequestTime: number;
  }>;
  rateLimits: Record<string, {
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter: number;
  }>;
  statusReport: {
    timestamp: number;
    totalProviders: number;
    healthyProviders: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    rateLimitedProviders: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIHealthResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Fetch real API health data from blockchain services
    const [healthResponse, metricsResponse, rateLimitsResponse] = await Promise.allSettled([
      fetch(`${baseUrl}/api/monitoring/api-health-status`),
      fetch(`${baseUrl}/api/monitoring/api-metrics`),
      fetch(`${baseUrl}/api/monitoring/rate-limits`)
    ]);

    let healthStatus = [];
    let metrics = [];
    let rateLimits = {};

    // Extract real health status data
    if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
      const healthData = await healthResponse.value.json();
      healthStatus = healthData.healthStatus || [];
    } else {
      console.error('Failed to fetch real API health status');
      // Return error state instead of mock data
      return res.status(503).json({ 
        error: 'Real API health data unavailable',
        message: 'Unable to fetch health status from blockchain services',
        timestamp: Date.now()
      });
    }

    // Extract real metrics data
    if (metricsResponse.status === 'fulfilled' && metricsResponse.value.ok) {
      const metricsData = await metricsResponse.value.json();
      metrics = metricsData.metrics || [];
    } else {
      console.error('Failed to fetch real API metrics');
      // Continue with empty metrics instead of mock data
      metrics = [];
    }

    // Extract real rate limits data
    if (rateLimitsResponse.status === 'fulfilled' && rateLimitsResponse.value.ok) {
      const rateLimitsData = await rateLimitsResponse.value.json();
      rateLimits = rateLimitsData.rateLimits || {};
    } else {
      console.error('Failed to fetch real rate limits');
      // Continue with empty rate limits instead of mock data
      rateLimits = {};
    }

    // Calculate status report from real data
    const now = Date.now();
    const totalRequests = metrics.reduce((sum: number, m: any) => sum + (m.totalRequests || 0), 0);
    const successfulRequests = metrics.reduce((sum: number, m: any) => sum + (m.successfulRequests || 0), 0);
    const totalResponseTime = metrics.reduce((sum: number, m: any) => 
      sum + ((m.averageResponseTime || 0) * (m.totalRequests || 0)), 0);
    
    const providers = new Set(healthStatus.map((h: any) => h.provider));
    const healthyProviders = new Set(healthStatus.filter((h: any) => h.isHealthy).map((h: any) => h.provider));
    
    const rateLimitedProviders = Object.entries(rateLimits)
      .filter(([, limit]: [string, any]) => limit.remaining <= 0)
      .map(([provider]) => provider);

    const statusReport = {
      timestamp: now,
      totalProviders: providers.size,
      healthyProviders: healthyProviders.size,
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      rateLimitedProviders
    };

    const response: APIHealthResponse = {
      healthStatus,
      metrics,
      rateLimits,
      statusReport
    };

    // Add cache headers to prevent excessive polling
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching real API health data:', error);
    res.status(503).json({ 
      error: 'Real API health data unavailable',
      message: error instanceof Error ? error.message : 'Unable to connect to blockchain services',
      timestamp: Date.now()
    });
  }
}