import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Simple ABI for profile creation
const SIMPLE_CREDIT_SCORE_ABI = [
  "function createCreditProfile(address user) external",
  "function getCreditProfile(address user) external view returns (bool exists, address userAddress, uint256 lastUpdated)",
  "function owner() external view returns (address)"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userAddress } = req.body;
    
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({ message: 'Valid user address required' });
    }

    // Get contract address from environment
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return res.status(500).json({ message: 'Contract address not configured' });
    }

    // Connect to provider with a signer (using Sepolia testnet)
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Use the private key from environment for signing transactions
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ message: 'Private key not configured' });
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, SIMPLE_CREDIT_SCORE_ABI, wallet);

    console.log(`🔍 Creating credit profile for ${userAddress}`);
    console.log(`📋 Contract: ${contractAddress}`);
    console.log(`👤 Signer: ${wallet.address}`);

    // Check if profile already exists
    try {
      const existingProfile = await contract.getCreditProfile(userAddress);
      if (existingProfile[0]) {
        return res.status(200).json({
          success: true,
          message: 'Profile already exists',
          profile: {
            exists: existingProfile[0],
            userAddress: existingProfile[1],
            lastUpdated: existingProfile[2].toString()
          }
        });
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
    }

    // Create the profile
    console.log('📝 Creating new credit profile...');
    const tx = await contract.createCreditProfile(userAddress);
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify profile was created
    const newProfile = await contract.getCreditProfile(userAddress);
    
    const result = {
      success: true,
      message: 'Credit profile created successfully',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      profile: {
        exists: newProfile[0],
        userAddress: newProfile[1],
        lastUpdated: newProfile[2].toString()
      }
    };

    console.log('✅ Credit profile created successfully');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Failed to create credit profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create credit profile',
      error: error.message 
    });
  }
}