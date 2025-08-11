import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// ABI for score updating
const SIMPLE_CREDIT_SCORE_ABI = [
  "function updateScoreDimension(address user, uint8 dimension, uint256[] calldata rawData, uint256[] calldata weights) external",
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userAddress, dimension, transactionData } = req.body;
    
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({ message: 'Valid user address required' });
    }

    if (!dimension || !(dimension in CREDIT_DIMENSIONS)) {
      return res.status(400).json({ message: 'Valid dimension required' });
    }

    // Get contract address from environment
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return res.status(500).json({ message: 'Contract address not configured' });
    }

    // Connect to provider with a signer
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ message: 'Private key not configured' });
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, SIMPLE_CREDIT_SCORE_ABI, wallet);

    console.log(`🎯 Updating score dimension ${dimension} for ${userAddress}`);

    // Generate realistic score data based on transaction analysis
    const rawData = generateScoreData(transactionData, dimension);
    const weights = rawData.map(() => 100); // Equal weights for simplicity

    console.log(`📊 Generated score data:`, rawData);

    // Update the score dimension
    const dimensionIndex = CREDIT_DIMENSIONS[dimension];
    const tx = await contract.updateScoreDimension(userAddress, dimensionIndex, rawData, weights);
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Get updated score
    const updatedDimension = await contract.getScoreDimension(userAddress, dimensionIndex);
    const compositeScore = await contract.getCompositeScore(userAddress);

    const result = {
      success: true,
      message: 'Score updated successfully',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      dimension: {
        name: dimension,
        score: updatedDimension[0].toString(),
        confidence: updatedDimension[1].toString(),
        dataPoints: updatedDimension[2].toString(),
        trend: updatedDimension[3],
        lastCalculated: updatedDimension[4].toString(),
        hasInsufficientData: updatedDimension[5]
      },
      compositeScore: {
        score: compositeScore[0].toString(),
        confidence: compositeScore[1].toString()
      }
    };

    console.log('✅ Score updated successfully');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Failed to update score:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update score',
      error: error.message 
    });
  }
}

/**
 * Generate realistic score data based on transaction analysis
 */
function generateScoreData(transactionData: any, dimension: string): number[] {
  // This would normally analyze real transaction data
  // For demo purposes, generate realistic scores based on dimension
  
  const baseScores = {
    DEFI_RELIABILITY: [750, 780, 760, 790, 800],
    TRADING_CONSISTENCY: [650, 670, 680, 690, 700],
    STAKING_COMMITMENT: [850, 860, 870, 880, 890],
    GOVERNANCE_PARTICIPATION: [400, 420, 450, 480, 500],
    LIQUIDITY_PROVIDER: [600, 620, 640, 660, 680]
  };

  // Add some randomness to make it more realistic
  const base = baseScores[dimension] || [500, 520, 540, 560, 580];
  return base.map(score => score + Math.floor(Math.random() * 50) - 25);
}