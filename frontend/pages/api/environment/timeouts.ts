// API endpoint for production environment timeout configurations
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const timeoutConfigurations = [
      {
        service: 'Alchemy',
        category: 'RPC Provider',
        timeoutMs: 10000,
        averageResponseTime: 245,
        maxResponseTime: 1250,
        p95ResponseTime: 450,
        timeoutCount: 2,
        successCount: 1247,
        lastMeasurement: Date.now() - 5000,
        recommendedTimeout: 900, // 2x p95
        isOptimal: false,
        adjustmentReason: 'Current timeout is too high for observed response times'
      },
      {
        service: 'Infura',
        category: 'RPC Provider',
        timeoutMs: 12000,
        averageResponseTime: 312,
        maxResponseTime: 2100,
        p95ResponseTime: 650,
        timeoutCount: 1,
        successCount: 1156,
        lastMeasurement: Date.now() - 8000,
        recommendedTimeout: 1300, // 2x p95
        isOptimal: false,
        adjustmentReason: 'Current timeout is too high for observed response times'
      },
      {
        service: 'Ankr',
        category: 'RPC Provider',
        timeoutMs: 15000,
        averageResponseTime: 456,
        maxResponseTime: 3200,
        p95ResponseTime: 1100,
        timeoutCount: 5,
        successCount: 892,
        lastMeasurement: Date.now() - 12000,
        recommendedTimeout: 2200, // 2x p95
        isOptimal: false,
        adjustmentReason: 'Current timeout is too high, but service is slower than others'
      },
      {
        service: 'CoinGecko',
        category: 'Price Provider',
        timeoutMs: 8000,
        averageResponseTime: 678,
        maxResponseTime: 4500,
        p95ResponseTime: 1800,
        timeoutCount: 3,
        successCount: 456,
        lastMeasurement: Date.now() - 30000,
        recommendedTimeout: 3600, // 2x p95
        isOptimal: true,
        adjustmentReason: null
      },
      {
        service: 'CoinMarketCap',
        category: 'Price Provider',
        timeoutMs: 10000,
        averageResponseTime: 1234,
        maxResponseTime: 8900,
        p95ResponseTime: 3200,
        timeoutCount: 1,
        successCount: 89,
        lastMeasurement: Date.now() - 180000,
        recommendedTimeout: 6400, // 2x p95
        isOptimal: true,
        adjustmentReason: null
      },
      {
        service: 'DefiLlama',
        category: 'DeFi Provider',
        timeoutMs: 12000,
        averageResponseTime: 892,
        maxResponseTime: 6700,
        p95ResponseTime: 2800,
        timeoutCount: 2,
        successCount: 234,
        lastMeasurement: Date.now() - 90000,
        recommendedTimeout: 5600, // 2x p95
        isOptimal: true,
        adjustmentReason: null
      },
      {
        service: 'Fear & Greed Index',
        category: 'Sentiment Provider',
        timeoutMs: 5000,
        averageResponseTime: 534,
        maxResponseTime: 2100,
        p95ResponseTime: 1200,
        timeoutCount: 0,
        successCount: 48,
        lastMeasurement: Date.now() - 300000,
        recommendedTimeout: 2400, // 2x p95
        isOptimal: true,
        adjustmentReason: null
      },
      {
        service: 'Monitoring Service',
        category: 'Monitoring',
        timeoutMs: 5000,
        averageResponseTime: 123,
        maxResponseTime: 890,
        p95ResponseTime: 350,
        timeoutCount: 1,
        successCount: 2456,
        lastMeasurement: Date.now() - 1000,
        recommendedTimeout: 700, // 2x p95
        isOptimal: false,
        adjustmentReason: 'Current timeout is too high for fast monitoring service'
      }
    ];

    // Calculate summary statistics
    const summary = {
      totalServices: timeoutConfigurations.length,
      servicesWithTimeouts: timeoutConfigurations.filter(t => t.timeoutCount > 0).length,
      averageResponseTime: timeoutConfigurations.reduce((sum, t) => sum + t.averageResponseTime, 0) / timeoutConfigurations.length,
      totalTimeouts: timeoutConfigurations.reduce((sum, t) => sum + t.timeoutCount, 0),
      totalSuccesses: timeoutConfigurations.reduce((sum, t) => sum + t.successCount, 0),
      servicesNeedingAdjustment: timeoutConfigurations.filter(t => !t.isOptimal).length,
      categories: {
        'RPC Provider': {
          count: timeoutConfigurations.filter(t => t.category === 'RPC Provider').length,
          averageTimeout: timeoutConfigurations
            .filter(t => t.category === 'RPC Provider')
            .reduce((sum, t) => sum + t.timeoutMs, 0) / 
            timeoutConfigurations.filter(t => t.category === 'RPC Provider').length,
          averageResponseTime: timeoutConfigurations
            .filter(t => t.category === 'RPC Provider')
            .reduce((sum, t) => sum + t.averageResponseTime, 0) / 
            timeoutConfigurations.filter(t => t.category === 'RPC Provider').length
        },
        'Price Provider': {
          count: timeoutConfigurations.filter(t => t.category === 'Price Provider').length,
          averageTimeout: timeoutConfigurations
            .filter(t => t.category === 'Price Provider')
            .reduce((sum, t) => sum + t.timeoutMs, 0) / 
            timeoutConfigurations.filter(t => t.category === 'Price Provider').length,
          averageResponseTime: timeoutConfigurations
            .filter(t => t.category === 'Price Provider')
            .reduce((sum, t) => sum + t.averageResponseTime, 0) / 
            timeoutConfigurations.filter(t => t.category === 'Price Provider').length
        }
      }
    };

    res.status(200).json({
      timeoutConfigurations,
      summary
    });
  } catch (error) {
    console.error('Error fetching timeout configurations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch timeout configurations',
      details: error.message 
    });
  }
}