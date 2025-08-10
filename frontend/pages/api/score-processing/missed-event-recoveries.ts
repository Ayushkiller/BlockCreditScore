// API endpoint for missed event recoveries
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now - in production this would connect to the real score processing service
    const recoveries = [
      {
        fromBlock: 18748000,
        toBlock: 18750000,
        recoveredEvents: 45,
        processedScoreUpdates: 32,
        errors: [],
        timestamp: Math.floor(Date.now() / 1000) - 86400, // 24 hours ago
        status: 'completed'
      },
      {
        fromBlock: 18750000,
        toBlock: 18750500,
        recoveredEvents: 12,
        processedScoreUpdates: 8,
        errors: ['Failed to process event evt_123: Invalid signature'],
        timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        status: 'completed'
      },
      {
        fromBlock: 18750500,
        toBlock: 18751000,
        recoveredEvents: 0,
        processedScoreUpdates: 0,
        errors: [],
        timestamp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
        status: 'in_progress'
      }
    ];

    res.status(200).json(recoveries);
  } catch (error) {
    console.error('Error fetching missed event recoveries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}