const { ethers } = require('ethers');

// Contract details from deployment
const CONTRACT_ADDRESS = '0x62A6cDE7c05d01c3b49F6061Aa0A2EB729c7c2e6';
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/pXUYtoaDWxCeKRIokR8rs';

// Simple ABI for testing
const SIMPLE_ABI = [
  "function owner() external view returns (address)",
  "function getCreditProfile(address user) external view returns (bool exists, address userAddress, uint256 lastUpdated)",
  "function getCompositeScore(address user) external view returns (uint256 compositeScore, uint256 overallConfidence)"
];

async function testContract() {
  console.log('🔍 Testing Sepolia contract deployment...');
  console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Etherscan URL: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);
  
  try {
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, SIMPLE_ABI, provider);
    
    // Test 1: Check if contract exists by getting owner
    console.log('\n📋 Test 1: Getting contract owner...');
    const owner = await contract.owner();
    console.log(`✅ Contract owner: ${owner}`);
    
    // Test 2: Test with a real wallet address that has DeFi activity
    const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
    console.log(`\n📋 Test 2: Testing with address: ${testAddress}`);
    
    const profile = await contract.getCreditProfile(testAddress);
    console.log(`📊 Profile exists: ${profile[0]}`);
    console.log(`👤 User address: ${profile[1]}`);
    console.log(`⏰ Last updated: ${profile[2].toString()}`);
    
    if (profile[0]) {
      console.log('\n📋 Test 3: Getting composite score...');
      const score = await contract.getCompositeScore(testAddress);
      console.log(`🎯 Composite score: ${score[0].toString()}`);
      console.log(`🎯 Confidence: ${score[1].toString()}`);
    }
    
    console.log('\n✅ CONTRACT VERIFICATION SUCCESSFUL!');
    console.log('🎉 Contract is deployed and working on Sepolia testnet');
    
  } catch (error) {
    console.error('❌ Contract verification failed:', error.message);
    process.exit(1);
  }
}

testContract();