// API endpoint for event-driven score analytics for a specific address
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Mock data for now - in production this would connect to the real score processing service
    const analytics = {
      totalVerifications: 156,
      successRate: 94.2,
      averageConfidence: 89.7,
      failedVerifications: 9,
      eventBreakdown: {
        'Supply': 45,
        'Withdraw': 32,
        'Swap': 28,
        'Stake': 15,
        'Liquidation': 3,
        'Borrow': 22,
        'Repay': 18
      },
      protocolBreakdown: {
        'Aave V3': 67,
        'Uniswap V3': 34,
        'Compound': 28,
        'Ethereum 2.0': 15,
        'MakerDAO': 12
      },
      scoreImpactDistribution: {
        'defiReliability': {
          positive: 42,
          negative: 8,
          averageImpact: 12.5
        },
        'tradingConsistency': {
          positive: 28,
          negative: 4,
          averageImpact: 8.3
        },
        'stakingCommitment': {
          positive: 15,
          negative: 2,
          averageImpact: 18.7
        },
        'governanceParticipation': {
          positive: 5,
          negative: 0,
          averageImpact: 22.1
        },
        'liquidityProvider': {
          positive: 18,
          negative: 3,
          averageImpact: 15.2
        }
      },
      verificationMetrics: {
        transactionExists: 98.7,
        receiptMatches: 97.4,
        blockConfirmed: 100.0,
        eventLogValid: 95.5,
        userAddressVerified: 99.2
      },
      processingTimes: {
        averageEventProcessing: 145, // milliseconds
        averageVerification: 89,
        averageScoreUpdate: 67
      }
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching event-driven score analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}