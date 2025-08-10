// Test script for Chainlink integration
// Run this to verify task 6.1 implementation

const fetch = require('node-fetch');

async function testChainlinkIntegration() {
  console.log('🧪 Testing Chainlink Price Feed Integration...\n');

  const baseUrl = 'http://localhost:3000'; // Next.js dev server
  const symbols = ['ETH', 'BTC', 'USDC'];

  try {
    // Test 1: Get Chainlink price for ETH
    console.log('1. Testing Chainlink price fetch for ETH...');
    const ethResponse = await fetch(`${baseUrl}/api/price-feeds/chainlink/ETH`);
    const ethData = await ethResponse.json();
    
    if (ethData.success) {
      console.log('✅ ETH Chainlink price:', ethData.priceData.priceUSD);
      console.log('   Confidence:', ethData.priceData.confidence + '%');
      console.log('   Staleness:', ethData.priceData.staleness + 's');
      console.log('   Source:', ethData.priceData.source);
    } else {
      console.log('❌ Failed to get ETH price:', ethData.error);
    }

    // Test 2: Get DEX price for ETH
    console.log('\n2. Testing DEX price fetch for ETH...');
    const dexResponse = await fetch(`${baseUrl}/api/price-feeds/dex/ETH`);
    const dexData = await dexResponse.json();
    
    if (dexData.success) {
      console.log('✅ ETH DEX price:', dexData.priceData.priceUSD);
      console.log('   Source:', dexData.priceData.source);
    } else {
      console.log('❌ Failed to get DEX price:', dexData.error);
    }

    // Test 3: Convert token to USD
    console.log('\n3. Testing USD conversion...');
    const conversionResponse = await fetch(`${baseUrl}/api/price-feeds/convert-to-usd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenSymbol: 'ETH',
        amount: '1000000000000000000', // 1 ETH in wei
        decimals: 18
      })
    });
    const conversionData = await conversionResponse.json();
    
    if (conversionData.success) {
      console.log('✅ 1 ETH =', '$' + conversionData.conversion.usdValue.toFixed(2));
      console.log('   Price source:', conversionData.priceSource.source);
      console.log('   Confidence:', conversionData.priceSource.confidence + '%');
    } else {
      console.log('❌ Failed to convert to USD:', conversionData.error);
    }

    // Test 4: Get price feed status
    console.log('\n4. Testing price feed status...');
    const statusResponse = await fetch(`${baseUrl}/api/price-feeds/status`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('✅ Price feed status:');
      console.log('   Initialized:', statusData.status.isInitialized);
      console.log('   Cached prices:', statusData.status.cachedPrices);
      console.log('   Active subscriptions:', statusData.status.activeSubscriptions);
      console.log('   Web3 connections:', statusData.status.web3Connections);
      console.log('   Health status:', statusData.status.healthCheck);
    } else {
      console.log('❌ Failed to get status:', statusData.error);
    }

    // Test 5: Get cached prices
    console.log('\n5. Testing cached prices...');
    const cachedResponse = await fetch(`${baseUrl}/api/price-feeds/cached-prices`);
    const cachedData = await cachedResponse.json();
    
    if (cachedData.success) {
      console.log('✅ Cached prices summary:');
      console.log('   Total cached:', cachedData.summary.totalCached);
      console.log('   Fresh prices:', cachedData.summary.freshPrices);
      console.log('   Aging prices:', cachedData.summary.agingPrices);
      console.log('   Stale prices:', cachedData.summary.stalePrices);
      
      if (cachedData.cachedPrices.length > 0) {
        console.log('\n   Sample cached price:');
        const sample = cachedData.cachedPrices[0];
        console.log('   -', sample.symbol + ':', '$' + sample.priceUSD.toFixed(4));
        console.log('   - Staleness level:', sample.stalenessLevel);
        console.log('   - Confidence level:', sample.confidenceLevel);
      }
    } else {
      console.log('❌ Failed to get cached prices:', cachedData.error);
    }

    // Test 6: Health check
    console.log('\n6. Testing health check...');
    const healthResponse = await fetch(`${baseUrl}/api/price-feeds/health-check`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ Health check status:', healthData.healthCheck.status);
      if (healthData.healthCheck.details?.healthCheck) {
        console.log('   Chainlink latency:', healthData.healthCheck.details.healthCheck.chainlinkLatency + 'ms');
        console.log('   DEX latency:', healthData.healthCheck.details.healthCheck.dexLatency + 'ms');
      }
      console.log('   Recommendations:', healthData.healthCheck.recommendations.length);
    } else {
      console.log('❌ Health check failed:', healthData.error);
    }

    console.log('\n🎉 Chainlink integration test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the Next.js dev server is running on port 3000');
    console.log('   Run: npm run dev');
  }
}

// Run the test
testChainlinkIntegration();