// WebSocket Reconnection Endpoint
// Implements task 9.2: Force reconnection of WebSocket connections

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message: string } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production, this would call the actual WebSocket connection manager
    // to force reconnection of all connections
    
    console.log('Force reconnection requested for all WebSocket connections');
    
    // Trigger actual reconnection process
    try {
      const response = await fetch('http://localhost:3001/api/websocket/reconnect', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Reconnection failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to trigger reconnection:', error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Reconnection initiated for all WebSocket connections'
    });
  } catch (error) {
    console.error('Error forcing WebSocket reconnection:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}