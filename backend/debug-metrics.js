const { blockchainService } = require('./dist/services/blockchainService');
const { ScoreCalculator } = require('./dist/services/scoreCalculator');

async function debugMetrics() {
  const address = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'; // The problematic address from terminal
  
  try {
    console.log('=== DEBUGGING METRICS CALCULATION ===');
    console.log(`Address: ${address}`);
    console.log('');
    
    // Fetch metrics
    console.log('1. Fetching user metrics...');
    const metrics = await blockchainService.getUserMetrics(address);
    
    console.log('Raw metrics:', JSON.stringify(metrics, null, 2));
    console.log('');
    
    // Check validation
    console.log('2. Validating metrics for scoring...');
    const validation = ScoreCalculator.validateMetricsForScoring(metrics);
    
    console.log('Validation result:', validation);
    console.log('');
    
    // Show validation details
    console.log('3. Validation details:');
    console.log(`- Total transactions: ${metrics.totalTransactions} (required: >= 1)`);
    console.log(`- Account age: ${metrics.accountAge} days (required: >= 1)`);
    console.log(`- Total volume: ${metrics.totalVolume} ETH (required: >= 0.1)`);
    console.log(`- Total volume as number: ${parseFloat(metrics.totalVolume)}`);
    console.log('');
    
    if (validation.isValid) {
      console.log('✅ Metrics are valid for scoring');
      
      // Try calculating score
      console.log('4. Calculating credit score...');
      const score = await ScoreCalculator.calculateCreditScore(address, metrics);
      console.log('Credit score:', score);
    } else {
      console.log('❌ Metrics are NOT valid for scoring');
      console.log('Reasons:', validation.reasons);
    }
    
  } catch (error) {
    console.error('Error during debug:', error);
  }
}

debugMetrics();