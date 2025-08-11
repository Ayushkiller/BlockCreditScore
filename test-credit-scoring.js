require('dotenv').config({ path: './frontend/.env' });

const { realBlockchainService } = require('./frontend/services/blockchain/real-blockchain-service.ts');

async function testCreditScoring() {
  console.log('🧪 Testing Credit Scoring with Real Data');
  console.log('==========================================');
  
  // Test with different addresses
  const testAddresses = [
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
    '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    '0x2775b1c75658Be0F640272CCb8c72ac986009e38', // Compound Treasury
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'  // Aave V3 Pool
  ];
  
  for (const address of testAddresses) {
    console.log(`\n🔍 Testing address: ${address}`);
    try {
      const score = await realBlockchainService.calculateRealCreditScore(address);
      console.log(`✅ Score: ${score.compositeScore}, Confidence: ${score.confidence}%, Data Points: ${score.dataPoints}`);
      console.log(`   Dimensions: DeFi=${score.dimensions.defiReliability}, Trading=${score.dimensions.tradingConsistency}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

testCreditScoring().catch(console.error);