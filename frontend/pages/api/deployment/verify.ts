import { NextApiRequest, NextApiResponse } from 'next';
import { realDeploymentService } from '../../../../services/deployment/real-deployment-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, network } = req.body;

  if (!address || !network) {
    return res.status(400).json({ error: 'Address and network are required' });
  }

  try {
    console.log(`🔍 API: Starting contract verification for ${address} on ${network}`);
    
    const result = await realDeploymentService.verifyContract(address, network);
    
    console.log(`✅ API: Verification result:`, result);
    
    res.status(200).json({
      success: true,
      verified: result.verified,
      message: result.message
    });

  } catch (error) {
    console.error('❌ API: Verification failed:', error);
    
    res.status(500).json({
      success: false,
      verified: false,
      message: error.message || 'Verification failed'
    });
  }
}