// API endpoint for score processing statistics
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data for now - in production this would connect to the real score processing service
    const stats = {
      totalEventsProcessed: 1247,
      totalScoreUpdates: 892,
      totalVerifications: 1189,
      totalRecoveries: 3,
      averageProcessingTime: 145, // milliseconds
      lastProcessedBlock: 18750000,
      errors: 12
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching score processing stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}