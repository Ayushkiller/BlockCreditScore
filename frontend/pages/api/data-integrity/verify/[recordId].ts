import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { recordId } = req.query;

  if (!recordId || typeof recordId !== 'string') {
    return res.status(400).json({ error: 'Invalid record ID parameter' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify data integrity record via backend service
    const response = await fetch(`http://localhost:3001/api/data-integrity/verify/${recordId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Record not found' });
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error verifying data integrity record:', error);
    res.status(500).json({ 
      error: 'Failed to verify data integrity record',
      details: error.message 
    });
  }
}