/**
 * Simple test script to verify blockchain service functionality
 * Run with: npx ts-node src/test-blockchain.ts
 */

import { blockchainService } from './services/blockchainService';

async function testBlockchainService() {
  console.log('🔗 Testing Blockchain Service...\n');
  
  try {
    // Test 1: Connection test
    console.log('1. Testing connection...');
    const connectionTest = await blockchainService.testConnection();
    console.log('Connection result:', connectionTest);
    
    if (!connectionTest.connected) {
      console.error('❌ Connection failed. Check your RPC configuration.');
      return;
    }
    
    console.log('✅ Connection successful!\n');
    
    // Test 2: Get balance for a known address (Ethereum Foundation)
    console.log('2. Testing balance retrieval...');
    const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
    const balance = await blockchainService.getBalance(testAddress);
    console.log(`Balance for ${testAddress}: ${balance} ETH`);
    console.log('✅ Balance retrieval successful!\n');
    
    // Test 3: Get user metrics (limited to avoid long execution)
    console.log('3. Testing user metrics (this may take a moment)...');
    const metrics = await blockchainService.getUserMetrics(testAddress);
    console.log('User metrics:', {
      totalTransactions: metrics.totalTransactions,
      totalVolume: `${parseFloat(metrics.totalVolume).toFixed(4)} ETH`,
      avgTransactionValue: `${parseFloat(metrics.avgTransactionValue).toFixed(6)} ETH`,
      stakingBalance: `${parseFloat(metrics.stakingBalance).toFixed(4)} ETH`,
      defiProtocolsUsed: metrics.defiProtocolsUsed,
      accountAge: `${metrics.accountAge} days`
    });
    console.log('✅ User metrics retrieval successful!\n');
    
    console.log('🎉 All blockchain service tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testBlockchainService()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testBlockchainService };