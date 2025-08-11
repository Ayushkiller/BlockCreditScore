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
    // Export data integrity records via backend service
    const response = await fetch(`http://localhost:3001/api/data-integrity/export/${address}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'No records found for address' });
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const exportData = await response.text();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${address}-data-integrity.json"`);
    res.status(200).send(exportData);
  } catch (error) {
    console.error('Error exporting data integrity records:', error);
    res.status(500).json({ 
      error: 'Failed to export data integrity records',
      details: error.message 
    });
  }
}