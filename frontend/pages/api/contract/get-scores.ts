import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// ABI for score retrieval
const SIMPLE_CREDIT_SCORE_ABI = [
  "function getCreditProfile(address user) external view returns (bool exists, address userAddress, uint256 lastUpdated)",
  "function getScoreDimension(address user, uint8 dimension) external view returns (uint256 score, uint256 confidence, uint256 dataPoints, uint8 trend, uint256 lastCalculated, bool hasInsufficientData)",
  "function getCompositeScore(address user) external view returns (uint256 compositeScore, uint256 overallConfidence)"
];

// Credit dimensions enum mapping
const CREDIT_DIMENSIONS = {
  DEFI_RELIABILITY: 0,
  TRADING_CONSISTENCY: 1,
  STAKING_COMMITMENT: 2,
  GOVERNANCE_PARTICIPATION: 3,
  LIQUIDITY_PROVIDER: 4
};

const DIMENSION_NAMES = [
  'DEFI_RELIABILITY',
  'TRADING_CONSISTENCY', 
  'STAKING_COMMITMENT',
  'GOVERNANCE_PARTICIPATION',
  'LIQUIDITY_PROVIDER'
];

const TREND_NAMES = ['IMPROVING', 'STABLE', 'DECLINING'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    
    if (!address || !ethers.isAddress(address as string)) {
      return res.status(400).json({ message: 'Valid address required' });
    }

    // Get contract address from environment
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return res.status(500).json({ message: 'Contract address not configured' });
    }

    // Connect to provider
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, SIMPLE_CREDIT_SCORE_ABI, provider);

    console.log(`📊 Getting scores for ${address}`);

    // Get credit profile
    const profile = await contract.getCreditProfile(address as string);
    
    if (!profile[0]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit profile not found',
        profileExists: false
      });
    }

    // Get all dimension scores
    const dimensions = [];
    for (let i = 0; i < 5; i++) {
      try {
        const dimension = await contract.getScoreDimension(address as string, i);
        dimensions.push({
          name: DIMENSION_NAMES[i],
          score: parseInt(dimension[0].toString()),
          confidence: parseInt(dimension[1].toString()),
          dataPoints: parseInt(dimension[2].toString()),
          trend: TREND_NAMES[dimension[3]] || 'STABLE',
          lastCalculated: parseInt(dimension[4].toString()),
          hasInsufficientData: dimension[5]
        });
      } catch (error) {
        console.error(`Error getting dimension ${i}:`, error);
        dimensions.push({
          name: DIMENSION_NAMES[i],
          score: 0,
          confidence: 0,
          dataPoints: 0,
          trend: 'STABLE',
          lastCalculated: 0,
          hasInsufficientData: true
        });
      }
    }

    // Get composite score
    let compositeScore = null;
    try {
      const composite = await contract.getCompositeScore(address as string);
      compositeScore = {
        score: parseInt(composite[0].toString()),
        confidence: parseInt(composite[1].toString())
      };
    } catch (error) {
      console.error('Error getting composite score:', error);
      compositeScore = { score: 0, confidence: 0 };
    }

    const result = {
      success: true,
      profileExists: true,
      address: address as string,
      profile: {
        exists: profile[0],
        userAddress: profile[1],
        lastUpdated: parseInt(profile[2].toString())
      },
      dimensions,
      compositeScore,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Scores retrieved successfully');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Failed to get scores:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve scores',
      error: error.message 
    });
  }
}