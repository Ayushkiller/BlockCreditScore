import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Simple ABI for the functions we need to test
const SIMPLE_CREDIT_SCORE_ABI = [
  "function getCreditProfile(address user) external view returns (bool exists, address userAddress, uint256 lastUpdated)",
  "function getCompositeScore(address user) external view returns (uint256 compositeScore, uint256 overallConfidence)",
  "function createCreditProfile(address user) external",
  "function owner() external view returns (address)"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { testAddress } = req.body;
    
    if (!testAddress || !ethers.isAddress(testAddress)) {
      return res.status(400).json({ message: 'Valid test address required' });
    }

    // Get contract address from environment
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return res.status(500).json({ message: 'Contract address not configured' });
    }

    // Connect to provider (using Sepolia testnet)
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, SIMPLE_CREDIT_SCORE_ABI, provider);

    console.log(`🔍 Testing contract connection to ${contractAddress}`);
    console.log(`📋 Testing with address: ${testAddress}`);

    // Test 1: Check if contract exists by calling owner()
    let contractOwner;
    try {
      contractOwner = await contract.owner();
      console.log(`✅ Contract owner: ${contractOwner}`);
    } catch (error) {
      console.error('❌ Failed to get contract owner:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Contract not found or not deployed',
        error: error.message 
      });
    }

    // Test 2: Check if profile exists
    let profileExists = false;
    let profileData = null;
    try {
      const profile = await contract.getCreditProfile(testAddress);
      profileExists = profile[0]; // exists boolean
      profileData = {
        exists: profile[0],
        userAddress: profile[1],
        lastUpdated: profile[2].toString()
      };
      console.log(`📊 Profile exists: ${profileExists}`);
    } catch (error) {
      console.error('❌ Failed to get credit profile:', error);
    }

    // Test 3: Get composite score if profile exists
    let compositeScore = null;
    if (profileExists) {
      try {
        const score = await contract.getCompositeScore(testAddress);
        compositeScore = {
          score: score[0].toString(),
          confidence: score[1].toString()
        };
        console.log(`🎯 Composite score: ${compositeScore.score}, confidence: ${compositeScore.confidence}`);
      } catch (error) {
        console.error('❌ Failed to get composite score:', error);
      }
    }

    const result = {
      success: true,
      contractAddress,
      contractOwner,
      testAddress,
      profile: profileData,
      compositeScore,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Contract connection test completed successfully');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Contract connection test failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Contract connection test failed',
      error: error.message 
    });
  }
}