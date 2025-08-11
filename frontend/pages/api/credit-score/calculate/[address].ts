import { NextApiRequest, NextApiResponse } from 'next';
import { realBlockchainService } from '../../../../services/blockchain/real-blockchain-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Valid Ethereum address is required' });
  }

  // Basic address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }

  try {
    console.log(`🔍 API: Calculating REAL credit score for ${address}`);
    console.log(`🔧 Environment check:`);
    console.log(`   - ETHERSCAN_API_KEY: ${process.env.ETHERSCAN_API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`   - MAINNET_RPC_URL: ${process.env.MAINNET_RPC_URL ? 'SET' : 'MISSING'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    
    const creditScore = await realBlockchainService.calculateRealCreditScore(address);
    
    console.log(`✅ API: Credit score calculated for ${address}:`);
    console.log(`   - Composite Score: ${creditScore.compositeScore}`);
    console.log(`   - Data Points: ${creditScore.dataPoints}`);
    console.log(`   - Confidence: ${creditScore.confidence}%`);
    
    res.status(200).json({
      success: true,
      data: creditScore,
      timestamp: Date.now(),
      debug: {
        hasEtherscanKey: !!process.env.ETHERSCAN_API_KEY,
        hasMainnetRpc: !!process.env.MAINNET_RPC_URL,
        dataPoints: creditScore.dataPoints
      }
    });

  } catch (error) {
    console.error(`❌ API: Failed to calculate credit score for ${address}:`, error);
    console.error(`❌ Error stack:`, error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate credit score',
      debug: {
        hasEtherscanKey: !!process.env.ETHERSCAN_API_KEY,
        hasMainnetRpc: !!process.env.MAINNET_RPC_URL,
        errorType: error.constructor.name
      }
    });
  }
}