// Volatility Alerts API Endpoint
// Implements task 6.2: Add real-time price volatility alerts to frontend

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      limit = '50', 
      severity, 
      symbol, 
      alertType,
      since 
    } = req.query;

    // Build query parameters
    const params = new URLSearchParams({
      limit: limit as string
    });

    if (severity) params.append('severity', severity as string);
    if (symbol) params.append('symbol', symbol as string);
    if (alertType) params.append('alertType', alertType as string);
    if (since) params.append('since', since as string);

    // Get volatility alerts from the volatility monitor service
    const response = await fetch(`http://localhost:3001/api/data-aggregator/volatility-monitor/alerts?${params}`);
    
    if (!response.ok) {
      throw new Error(`Volatility alerts service responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Enhance alerts with additional information
    const enhancedAlerts = (data.alerts || []).map((alert: any) => ({
      ...alert,
      id: `${alert.symbol}_${alert.timestamp}_${alert.alertType}`,
      timeAgo: getTimeAgo(alert.timestamp),
      formattedTimestamp: new Date(alert.timestamp).toISOString(),
      severityLevel: getSeverityLevel(alert.severity),
      impactLevel: calculateImpactLevel(alert),
      actionRequired: getActionRequired(alert),
      relatedAlerts: 0 // Will be populated by counting related alerts
    }));

    // Group alerts by symbol for better analysis
    const alertsBySymbol = groupAlertsBySymbol(enhancedAlerts);

    // Calculate alert statistics
    const statistics = calculateAlertStatistics(enhancedAlerts);

    // Add related alerts count
    enhancedAlerts.forEach(alert => {
      alert.relatedAlerts = alertsBySymbol[alert.symbol]?.length - 1 || 0;
    });

    res.status(200).json({
      alerts: enhancedAlerts,
      statistics,
      alertsBySymbol,
      metadata: {
        totalAlerts: enhancedAlerts.length,
        lastUpdate: new Date().toISOString(),
        filters: {
          limit: parseInt(limit as string),
          severity,
          symbol,
          alertType,
          since
        }
      }
    });
  } catch (error) {
    console.error('Error fetching volatility alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch volatility alerts',
      alerts: [],
      statistics: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        last24h: 0,
        last1h: 0,
        byType: {},
        bySymbol: {}
      },
      alertsBySymbol: {},
      metadata: {
        totalAlerts: 0,
        lastUpdate: new Date().toISOString(),
        filters: {
          limit: parseInt(limit as string),
          severity,
          symbol,
          alertType,
          since
        }
      }
    });
  }
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getSeverityLevel(severity: string): number {
  switch (severity) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

function calculateImpactLevel(alert: any): 'minimal' | 'moderate' | 'significant' | 'severe' {
  const severityLevel = getSeverityLevel(alert.severity);
  const valueImpact = Math.abs(alert.currentValue) / alert.threshold;
  
  if (severityLevel >= 4 || valueImpact > 2) return 'severe';
  if (severityLevel >= 3 || valueImpact > 1.5) return 'significant';
  if (severityLevel >= 2 || valueImpact > 1.2) return 'moderate';
  return 'minimal';
}

function getActionRequired(alert: any): string {
  switch (alert.severity) {
    case 'critical':
      return 'Immediate attention required - Consider risk management actions';
    case 'high':
      return 'Monitor closely - Review position sizes and stop losses';
    case 'medium':
      return 'Stay informed - Watch for trend continuation';
    case 'low':
      return 'Informational - Normal market movement';
    default:
      return 'No specific action required';
  }
}

function groupAlertsBySymbol(alerts: any[]): { [symbol: string]: any[] } {
  return alerts.reduce((groups, alert) => {
    const symbol = alert.symbol;
    if (!groups[symbol]) {
      groups[symbol] = [];
    }
    groups[symbol].push(alert);
    return groups;
  }, {});
}

function calculateAlertStatistics(alerts: any[]) {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  const statistics = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: alerts.length,
    last24h: 0,
    last1h: 0,
    byType: {} as { [type: string]: number },
    bySymbol: {} as { [symbol: string]: number }
  };

  alerts.forEach(alert => {
    // Count by severity
    switch (alert.severity) {
      case 'critical':
        statistics.critical++;
        break;
      case 'high':
        statistics.high++;
        break;
      case 'medium':
        statistics.medium++;
        break;
      case 'low':
        statistics.low++;
        break;
    }

    // Count by time
    if (alert.timestamp > oneDayAgo) {
      statistics.last24h++;
    }
    if (alert.timestamp > oneHourAgo) {
      statistics.last1h++;
    }

    // Count by type
    const type = alert.alertType;
    statistics.byType[type] = (statistics.byType[type] || 0) + 1;

    // Count by symbol
    const symbol = alert.symbol;
    statistics.bySymbol[symbol] = (statistics.bySymbol[symbol] || 0) + 1;
  });

  return statistics;
}