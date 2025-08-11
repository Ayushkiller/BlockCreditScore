import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Invalid address parameter' });
  }

  try {
    if (req.method === 'GET') {
      // Get blockchain-verified profile
      const response = await fetch(`http://localhost:3001/api/blockchain-verification/profile/${address}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: 'Profile not found' });
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const profile = await response.json();
      res.status(200).json(profile);

    } else if (req.method === 'PUT') {
      // Update blockchain-verified profile
      const updates = req.body;
      
      const response = await fetch(`http://localhost:3001/api/blockchain-verification/profile/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      res.status(200).json(result);

    } else if (req.method === 'DELETE') {
      // Delete blockchain-verified profile
      const response = await fetch(`http://localhost:3001/api/blockchain-verification/profile/${address}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      res.status(200).json({ success: true, message: 'Profile deleted' });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling blockchain verification profile request:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}