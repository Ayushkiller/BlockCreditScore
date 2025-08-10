// API endpoint for score update triggers for a specific address
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (req.method === 'GET') {
    try {
      // Mock data for now - in production this would connect to the real score processing service
      const triggers = [
        {
          triggerId: 'trigger_001',
          userAddress: address,
          eventType: 'Supply',
          confirmationThreshold: 12,
          isActive: true,
          lastTriggered: Math.floor(Date.now() / 1000) - 3600,
          totalTriggers: 15
        },
        {
          triggerId: 'trigger_002',
          userAddress: address,
          eventType: 'Liquidation',
          confirmationThreshold: 6,
          isActive: true,
          lastTriggered: Math.floor(Date.now() / 1000) - 86400,
          totalTriggers: 2
        },
        {
          triggerId: 'trigger_003',
          userAddress: address,
          eventType: 'Stake',
          confirmationThreshold: 32,
          isActive: true,
          lastTriggered: Math.floor(Date.now() / 1000) - 172800,
          totalTriggers: 8
        },
        {
          triggerId: 'trigger_004',
          userAddress: address,
          eventType: 'Swap',
          confirmationThreshold: 12,
          isActive: false,
          lastTriggered: Math.floor(Date.now() / 1000) - 259200,
          totalTriggers: 23
        }
      ];

      res.status(200).json(triggers);
    } catch (error) {
      console.error('Error fetching score update triggers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}