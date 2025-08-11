import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Invalid address parameter' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data integrity records from backend service
    const response = await fetch(`http://localhost:3001/api/data-integrity/records/${address}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(200).json({ records: [], statistics: null });
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data integrity records:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data integrity records',
      details: error.message 
    });
  }
}