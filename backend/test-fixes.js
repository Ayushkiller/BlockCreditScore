// Test script to verify the fixes for account age, DeFi protocols, and staking balance
const axios = require('axios');

async function testFixes() {
  console.log('Testing fixes for crypto credit scoring...\n');
  
  // Test the WETH contract address that was showing issues
  const testAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  
  try {
    console.log(`Testing address: ${testAddress}`);
    console.log('This is the WETH contract - should be very old with lots of DeFi activity\n');
    
    const response = await axios.get(`http://localhost:3001/api/score/${testAddress}`);
    
    if (response.data.success) {
      const metrics = response.data.data.metrics;
      console.log('✅ API call successful!');
      console.log('\n📊 Metrics:');
      console.log(`- Total Transactions: ${metrics.totalTransactions}`);
      console.log(`- Total Volume: ${metrics.totalVolume} ETH`);
      console.log(`- Account Age: ${metrics.accountAge} days`);
      console.log(`- Staking Balance: ${metrics.stakingBalance} ETH`);
      console.log(`- DeFi Protocols Used: ${metrics.defiProtocolsUsed.length}`);
      
      if (metrics.defiProtocolsUsed.length > 0) {
        console.log(`- Protocol Names: ${metrics.defiProtocolsUsed.join(', ')}`);
      }
      
      console.log('\n🔍 Issues Check:');
      
      // Check if account age is fixed
      if (metrics.accountAge > 0) {
        console.log('✅ Account age calculation: FIXED');
      } else {
        console.log('❌ Account age calculation: STILL BROKEN');
      }
      
      // Check if DeFi protocols are detected
      if (metrics.defiProtocolsUsed.length > 0) {
        console.log('✅ DeFi protocol detection: FIXED');
      } else {
        console.log('❌ DeFi protocol detection: STILL BROKEN');
      }
      
      // Check if staking balance is reasonable
      if (parseFloat(metrics.stakingBalance) > 0) {
        console.log('✅ Staking balance detection: FIXED');
      } else {
        console.log('⚠️ Staking balance detection: Still 0 (may be correct for this address)');
      }
      
    } else {
      console.log('❌ API call failed:', response.data.error);
    }
    
  } catch (error) {
    console.log('❌ Error testing fixes:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testFixes();