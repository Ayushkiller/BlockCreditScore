// API endpoint for score change history for a specific address
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;
  const timeframe = req.query.timeframe as string || '30d';

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Calculate timeframe in seconds
    const timeframeMap: { [key: string]: number } = {
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60,
      '90d': 90 * 24 * 60 * 60,
      '1y': 365 * 24 * 60 * 60
    };

    const timeframeSeconds = timeframeMap[timeframe] || timeframeMap['30d'];
    const cutoffTime = Math.floor(Date.now() / 1000) - timeframeSeconds;

    // Mock data for now - in production this would connect to the real score processing service
    const mockHistory = [
      {
        dimension: 'defiReliability',
        eventType: 'Supply',
        protocol: 'Aave V3',
        oldScore: 750,
        newScore: 765,
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        confidence: 92,
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678'
      },
      {
        dimension: 'tradingConsistency',
        eventType: 'Swap',
        protocol: 'Uniswap V3',
        oldScore: 680,
        newScore: 685,
        timestamp: Math.floor(Date.now() / 1000) - 7200,
        confidence: 88,
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12'
      },
      {
        dimension: 'stakingCommitment',
        eventType: 'Stake',
        protocol: 'Ethereum 2.0',
        oldScore: 820,
        newScore: 845,
        timestamp: Math.floor(Date.now() / 1000) - 14400,
        confidence: 95,
        transactionHash: '0x567890abcdef1234567890abcdef1234567890ab'
      },
      {
        dimension: 'defiReliability',
        eventType: 'Liquidation',
        protocol: 'Compound',
        oldScore: 765,
        newScore: 720,
        timestamp: Math.floor(Date.now() / 1000) - 86400,
        confidence: 98,
        transactionHash: '0x9876543210fedcba9876543210fedcba98765432'
      },
      {
        dimension: 'liquidityProvider',
        eventType: 'AddLiquidity',
        protocol: 'Uniswap V3',
        oldScore: 600,
        newScore: 625,
        timestamp: Math.floor(Date.now() / 1000) - 172800,
        confidence: 90,
        transactionHash: '0xfedcba9876543210fedcba9876543210fedcba98'
      }
    ];

    // Filter by timeframe
    const filteredHistory = mockHistory.filter(item => item.timestamp >= cutoffTime);

    res.status(200).json(filteredHistory);
  } catch (error) {
    console.error('Error fetching score change history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}