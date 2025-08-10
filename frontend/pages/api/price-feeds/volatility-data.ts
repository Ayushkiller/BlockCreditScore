// Volatility Data API Endpoint
// Implements task 6.2: Show actual price volatility metrics and trends

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '20', sortBy = 'volatility24h', order = 'desc' } = req.query;

    // Get volatility data from the volatility monitor service
    const response = await fetch(`http://localhost:3001/api/data-aggregator/volatility-monitor/data?limit=${limit}&sortBy=${sortBy}&order=${order}`);
    
    if (!response.ok) {
      throw new Error(`Volatility service responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Enhance the data with additional computed metrics
    const enhancedTokens = (data.tokens || []).map((token: any) => ({
      ...token,
      volatilityRating: getVolatilityRating(token.volatility24h),
      priceChangeRating: getPriceChangeRating(token.priceChange24h),
      riskLevel: calculateRiskLevel(token),
      trendDirection: getTrendDirection(token),
      dataQuality: calculateDataQuality(token),
      lastUpdateFormatted: new Date(token.timestamp).toISOString(),
      priceRangePercentage: token.averagePrice > 0 ? 
        ((token.highPrice - token.lowPrice) / token.averagePrice) * 100 : 0
    }));

    // Calculate summary statistics
    const summary = calculateSummaryStats(enhancedTokens);

    res.status(200).json({
      tokens: enhancedTokens,
      summary,
      metadata: {
        totalTokens: enhancedTokens.length,
        lastUpdate: new Date().toISOString(),
        sortBy,
        order,
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching volatility data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch volatility data',
      tokens: [],
      summary: {
        averageVolatility: 0,
        highVolatilityCount: 0,
        mediumVolatilityCount: 0,
        lowVolatilityCount: 0,
        totalDataPoints: 0,
        averageDataQuality: 0
      },
      metadata: {
        totalTokens: 0,
        lastUpdate: new Date().toISOString(),
        sortBy: 'volatility24h',
        order: 'desc',
        limit: 20
      }
    });
  }
}

function getVolatilityRating(volatility: number): string {
  if (volatility > 50) return 'extreme';
  if (volatility > 30) return 'high';
  if (volatility > 15) return 'medium';
  if (volatility > 5) return 'low';
  return 'minimal';
}

function getPriceChangeRating(priceChange: number): string {
  const absChange = Math.abs(priceChange);
  if (absChange > 20) return 'extreme';
  if (absChange > 10) return 'high';
  if (absChange > 5) return 'moderate';
  if (absChange > 1) return 'low';
  return 'minimal';
}

function calculateRiskLevel(token: any): string {
  let riskScore = 0;

  // Volatility contribution
  if (token.volatility24h > 50) riskScore += 40;
  else if (token.volatility24h > 30) riskScore += 30;
  else if (token.volatility24h > 15) riskScore += 20;
  else if (token.volatility24h > 5) riskScore += 10;

  // Price change contribution
  const absChange = Math.abs(token.priceChange24h);
  if (absChange > 20) riskScore += 30;
  else if (absChange > 10) riskScore += 20;
  else if (absChange > 5) riskScore += 10;

  // Standard deviation contribution
  if (token.standardDeviation > 20) riskScore += 20;
  else if (token.standardDeviation > 10) riskScore += 10;

  // Data quality penalty
  if (token.dataPoints < 100) riskScore += 10;

  if (riskScore > 70) return 'very-high';
  if (riskScore > 50) return 'high';
  if (riskScore > 30) return 'medium';
  if (riskScore > 10) return 'low';
  return 'very-low';
}

function getTrendDirection(token: any): string {
  const shortTerm = token.priceChange1h || 0;
  const mediumTerm = token.priceChange24h || 0;
  const longTerm = token.priceChange7d || 0;

  if (shortTerm > 0 && mediumTerm > 0 && longTerm > 0) return 'strong-upward';
  if (shortTerm > 0 && mediumTerm > 0) return 'upward';
  if (shortTerm < 0 && mediumTerm < 0 && longTerm < 0) return 'strong-downward';
  if (shortTerm < 0 && mediumTerm < 0) return 'downward';
  if (Math.abs(shortTerm) < 1 && Math.abs(mediumTerm) < 2) return 'sideways';
  return 'mixed';
}

function calculateDataQuality(token: any): number {
  let quality = 100;

  // Reduce quality based on data points
  if (token.dataPoints < 50) quality -= 30;
  else if (token.dataPoints < 100) quality -= 15;
  else if (token.dataPoints < 500) quality -= 5;

  // Reduce quality based on data age
  const dataAge = Date.now() - token.timestamp;
  const ageMinutes = dataAge / (1000 * 60);
  if (ageMinutes > 60) quality -= 20;
  else if (ageMinutes > 30) quality -= 10;
  else if (ageMinutes > 10) quality -= 5;

  // Reduce quality if standard deviation is too high (unreliable data)
  if (token.standardDeviation > 50) quality -= 15;
  else if (token.standardDeviation > 30) quality -= 10;

  return Math.max(0, quality);
}

function calculateSummaryStats(tokens: any[]) {
  if (tokens.length === 0) {
    return {
      averageVolatility: 0,
      highVolatilityCount: 0,
      mediumVolatilityCount: 0,
      lowVolatilityCount: 0,
      totalDataPoints: 0,
      averageDataQuality: 0
    };
  }

  const totalVolatility = tokens.reduce((sum, token) => sum + (token.volatility24h || 0), 0);
  const totalDataPoints = tokens.reduce((sum, token) => sum + (token.dataPoints || 0), 0);
  const totalDataQuality = tokens.reduce((sum, token) => sum + (token.dataQuality || 0), 0);

  const highVolatilityCount = tokens.filter(t => (t.volatility24h || 0) > 30).length;
  const mediumVolatilityCount = tokens.filter(t => {
    const vol = t.volatility24h || 0;
    return vol > 15 && vol <= 30;
  }).length;
  const lowVolatilityCount = tokens.filter(t => (t.volatility24h || 0) <= 15).length;

  return {
    averageVolatility: totalVolatility / tokens.length,
    highVolatilityCount,
    mediumVolatilityCount,
    lowVolatilityCount,
    totalDataPoints,
    averageDataQuality: totalDataQuality / tokens.length
  };
}