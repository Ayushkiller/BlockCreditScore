import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to Sepolia (since that's where our contract is deployed)
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    
    console.log(`✅ Current Sepolia block number: ${blockNumber}`);
    
    return res.status(200).json({
      success: true,
      blockNumber,
      network: 'sepolia',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Failed to get block number:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get block number',
      error: error.message 
    });
  }
}