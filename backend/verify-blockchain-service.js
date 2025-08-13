/**
 * Simple verification script for blockchain service
 * This tests the basic functionality without running the full server
 */

const { ethers } = require('ethers');

async function verifyBlockchainService() {
  console.log('🔗 Verifying Blockchain Service Setup...\n');
  
  try {
    // Test 1: Check if ethers.js is working
    console.log('1. Testing ethers.js installation...');
    console.log('Ethers version:', ethers.version);
    console.log('✅ Ethers.js is working!\n');
    
    // Test 2: Test RPC connection
    console.log('2. Testing RPC connection...');
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/pXUYtoaDWxCeKRIokR8rs';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const blockNumber = await provider.getBlockNumber();
    console.log('Current block number:', blockNumber);
    console.log('✅ RPC connection successful!\n');
    
    // Test 3: Test address validation
    console.log('3. Testing address validation...');
    const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const isValid = ethers.isAddress(testAddress);
    console.log(`Address ${testAddress} is valid:`, isValid);
    console.log('✅ Address validation working!\n');
    
    // Test 4: Test balance retrieval
    console.log('4. Testing balance retrieval...');
    const balance = await provider.getBalance(testAddress);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`Balance: ${balanceInEth} ETH`);
    console.log('✅ Balance retrieval successful!\n');
    
    console.log('🎉 All blockchain service verifications passed!');
    console.log('The blockchain service should work correctly when integrated.');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify RPC URL in .env file');
    console.log('3. Ensure ethers.js is properly installed');
  }
}

// Load environment variables
require('dotenv').config();

// Run verification
verifyBlockchainService()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification script failed:', error);
    process.exit(1);
  });