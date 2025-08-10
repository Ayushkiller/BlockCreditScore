// Volatility Monitoring Status API Endpoint
// Implements task 6.2: Add real-time price volatility alerts to frontend

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get volatility monitoring status
    const statusResponse = await fetch('http://localhost:3001/api/data-aggregator/volatility-monitor/status');
    const status = statusResponse.ok ? await statusResponse.json() : null;

    // Get recent volatility alerts
    const alertsResponse = await fetch('http://localhost:3001/api/data-aggregator/volatility-monitor/recent-alerts?limit=10');
    const alertsData = alertsResponse.ok ? await alertsResponse.json() : { alerts: [] };

    // Get volatility data for top tokens
    const dataResponse = await fetch('http://localhost:3001/api/data-aggregator/volatility-monitor/data?limit=20');
    const volatilityData = dataResponse.ok ? await dataResponse.json() : { tokens: [] };

    // Enhance status with additional metrics
    const enhancedStatus = {
      ...status,
      recentAlerts: alertsData.alerts || [],
      topVolatileTokens: volatilityData.tokens?.slice(0, 5) || [],
      alertSummary: calculateAlertSummary(alertsData.alerts || []),
      volatilitySummary: calculateVolatilitySummary(volatilityData.tokens || []),
      systemHealth: calculateSystemHealth(status, alertsData.alerts || []),
      lastUpdate: new Date().toISOString()
    };

    res.status(200).json(enhancedStatus);
  } catch (error) {
    console.error('Error fetching volatility status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch volatility status',
      isMonitoring: false,
      monitoredTokens: 0,
      totalDataPoints: 0,
      averageHistorySize: 0,
      oldestDataPoint: 0,
      newestDataPoint: 0,
      updateInterval: 0,
      recentAlerts: [],
      topVolatileTokens: [],
      alertSummary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      },
      volatilitySummary: {
        highVolatility: 0,
        mediumVolatility: 0,
        lowVolatility: 0,
        averageVolatility: 0
      },
      systemHealth: 'unhealthy',
      lastUpdate: new Date().toISOString()
    });
  }
}

function calculateAlertSummary(alerts: any[]) {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: alerts.length
  };

  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'critical':
        summary.critical++;
        break;
      case 'high':
        summary.high++;
        break;
      case 'medium':
        summary.medium++;
        break;
      case 'low':
        summary.low++;
        break;
    }
  });

  return summary;
}

function calculateVolatilitySummary(tokens: any[]) {
  if (tokens.length === 0) {
    return {
      highVolatility: 0,
      mediumVolatility: 0,
      lowVolatility: 0,
      averageVolatility: 0
    };
  }

  let highVolatility = 0;
  let mediumVolatility = 0;
  let lowVolatility = 0;
  let totalVolatility = 0;

  tokens.forEach(token => {
    const volatility = token.volatility24h || 0;
    totalVolatility += volatility;

    if (volatility > 50) {
      highVolatility++;
    } else if (volatility > 15) {
      mediumVolatility++;
    } else {
      lowVolatility++;
    }
  });

  return {
    highVolatility,
    mediumVolatility,
    lowVolatility,
    averageVolatility: totalVolatility / tokens.length
  };
}

function calculateSystemHealth(status: any, alerts: any[]): 'healthy' | 'degraded' | 'unhealthy' {
  if (!status?.isMonitoring) return 'unhealthy';
  
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  
  if (criticalAlerts > 0) return 'unhealthy';
  if (highAlerts > 3) return 'degraded';
  
  const dataAge = status.newestDataPoint ? Date.now() - status.newestDataPoint : Infinity;
  if (dataAge > 5 * 60 * 1000) return 'degraded'; // 5 minutes
  
  return 'healthy';
}