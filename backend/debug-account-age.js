// Debug script to test account age calculation directly
const { blockchainService } = require('./dist/services/blockchainService');

async function debugAccountAge() {
  console.log('Debugging account age calculation...\n');
  
  const testAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  
  try {
    console.log(`Testing address: ${testAddress}`);
    
    // Get user metrics directly
    const metrics = await blockchainService.getUserMetrics(testAddress);
    
    console.log('\n📊 Raw Metrics:');
    console.log('- Total Transactions:', metrics.totalTransactions);
    console.log('- Total Volume:', metrics.totalVolume, 'ETH');
    console.log('- Account Age:', metrics.accountAge, 'days');
    console.log('- First Transaction Date:', metrics.firstTransactionDate, '(', new Date(metrics.firstTransactionDate * 1000).toISOString(), ')');
    console.log('- Last Transaction Date:', metrics.lastTransactionDate, '(', new Date(metrics.lastTransactionDate * 1000).toISOString(), ')');
    console.log('- Staking Balance:', metrics.stakingBalance, 'ETH');
    console.log('- DeFi Protocols Used:', metrics.defiProtocolsUsed.length);
    
    if (metrics.defiProtocolsUsed.length > 0) {
      console.log('- Protocol Names:', metrics.defiProtocolsUsed.join(', '));
    }
    
    // Calculate expected account age manually
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expectedAge = Math.floor((currentTimestamp - metrics.firstTransactionDate) / (24 * 60 * 60));
    
    console.log('\n🔍 Manual Calculation:');
    console.log('- Current Timestamp:', currentTimestamp, '(', new Date().toISOString(), ')');
    console.log('- Expected Account Age:', expectedAge, 'days');
    
    if (metrics.accountAge !== expectedAge) {
      console.log('❌ Account age mismatch! Expected:', expectedAge, 'Got:', metrics.accountAge);
    } else {
      console.log('✅ Account age calculation is correct');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

debugAccountAge();