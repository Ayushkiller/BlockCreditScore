// Clear cache and test the fixed account age calculation
const { blockchainService } = require('./dist/services/blockchainService');

async function clearCacheAndTest() {
  console.log('Clearing cache and testing fixed account age calculation...\n');
  
  const testAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  
  try {
    // Clear the cache first
    console.log('Clearing blockchain service cache...');
    if (blockchainService.cache && blockchainService.cache.clear) {
      blockchainService.cache.clear();
      console.log('✅ Cache cleared');
    } else {
      console.log('⚠️ Could not access cache directly');
    }
    
    console.log(`\nTesting address: ${testAddress}`);
    console.log('This should now fetch fresh data with both oldest and newest transactions...\n');
    
    // Get user metrics with fresh data
    const metrics = await blockchainService.getUserMetrics(testAddress);
    
    console.log('📊 Fresh Metrics:');
    console.log('- Total Transactions:', metrics.totalTransactions);
    console.log('- Total Volume:', metrics.totalVolume, 'ETH');
    console.log('- Account Age:', metrics.accountAge, 'days');
    console.log('- Account Age (years):', Math.floor(metrics.accountAge / 365));
    console.log('- First Transaction Date:', metrics.firstTransactionDate, '(', new Date(metrics.firstTransactionDate * 1000).toISOString(), ')');
    console.log('- Last Transaction Date:', metrics.lastTransactionDate, '(', new Date(metrics.lastTransactionDate * 1000).toISOString(), ')');
    console.log('- Staking Balance:', metrics.stakingBalance, 'ETH');
    console.log('- DeFi Protocols Used:', metrics.defiProtocolsUsed.length);
    
    if (metrics.defiProtocolsUsed.length > 0) {
      console.log('- Protocol Names:', metrics.defiProtocolsUsed.join(', '));
    }
    
    console.log('\n🔍 Issues Check:');
    
    // Check if account age is fixed
    if (metrics.accountAge > 365) {
      console.log('✅ Account age calculation: FIXED (over 1 year old)');
    } else if (metrics.accountAge > 30) {
      console.log('✅ Account age calculation: FIXED (over 1 month old)');
    } else {
      console.log('❌ Account age calculation: STILL BROKEN (showing as too new)');
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
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

clearCacheAndTest();