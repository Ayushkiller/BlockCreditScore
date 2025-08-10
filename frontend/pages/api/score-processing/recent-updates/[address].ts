// API endpoint for recent score updates for a specific address
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Mock data for now - in production this would connect to the real score processing service
    const mockUpdates = [
      {
        eventId: 'evt_001',
        userAddress: address,
        eventType: 'Supply',
        protocol: 'Aave V3',
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 18749950,
        confirmations: 15,
        scoreImpact: [
          {
            dimension: 'defiReliability',
            oldScore: 750,
            newScore: 765,
            confidence: 92
          }
        ],
        timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        isVerified: true,
        verificationData: {
          transactionReceipt: {},
          eventLog: {},
          blockData: {}
        }
      },
      {
        eventId: 'evt_002',
        userAddress: address,
        eventType: 'Swap',
        protocol: 'Uniswap V3',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        blockNumber: 18749800,
        confirmations: 165,
        scoreImpact: [
          {
            dimension: 'tradingConsistency',
            oldScore: 680,
            newScore: 685,
            confidence: 88
          }
        ],
        timestamp: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        isVerified: true
      },
      {
        eventId: 'evt_003',
        userAddress: address,
        eventType: 'Stake',
        protocol: 'Ethereum 2.0',
        transactionHash: '0x567890abcdef1234567890abcdef1234567890ab',
        blockNumber: 18749600,
        confirmations: 365,
        scoreImpact: [
          {
            dimension: 'stakingCommitment',
            oldScore: 820,
            newScore: 845,
            confidence: 95
          }
        ],
        timestamp: Math.floor(Date.now() / 1000) - 14400, // 4 hours ago
        isVerified: true
      }
    ];

    const limitedUpdates = mockUpdates.slice(0, limit);
    res.status(200).json(limitedUpdates);
  } catch (error) {
    console.error('Error fetching recent score updates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}