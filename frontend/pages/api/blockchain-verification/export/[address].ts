import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  const { format = 'json' } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Invalid address parameter' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get blockchain-verified profile export data
    const response = await fetch(`http://localhost:3001/api/blockchain-verification/export/${address}?format=${format}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const exportData = await response.text();

    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${address}-blockchain-data.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${address}-blockchain-data.json"`);
    }

    res.status(200).send(exportData);
  } catch (error) {
    console.error('Error exporting blockchain verification data:', error);
    res.status(500).json({ 
      error: 'Failed to export blockchain verification data',
      details: error.message 
    });
  }
}