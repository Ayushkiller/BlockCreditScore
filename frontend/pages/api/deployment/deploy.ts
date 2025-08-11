import { NextApiRequest, NextApiResponse } from 'next';
import { realDeploymentService } from '../../../../services/deployment/real-deployment-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { network } = req.body;

  if (!network || !['goerli', 'sepolia'].includes(network)) {
    return res.status(400).json({ error: 'Invalid network. Must be goerli or sepolia' });
  }

  try {
    console.log(`🚀 API: Starting real deployment to ${network}`);
    
    const result = await realDeploymentService.deployContract(network);
    
    console.log(`✅ API: Deployment successful`, result);
    
    res.status(200).json({
      success: true,
      deployment: result
    });

  } catch (error) {
    console.error('❌ API: Deployment failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed'
    });
  }
}