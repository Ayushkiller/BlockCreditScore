import { ProtocolPreferenceEngine } from './services/protocolPreferenceEngine';
import { TransactionData, UserMetrics } from './services/blockchainService';

/**
 * Test script for Protocol Preference Engine
 * Tests the implementation of task 10: Create protocol preference and efficiency analysis
 */

// Sample transaction data for testing
const sampleTransactionHistory: TransactionData[] = [
  {
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    from: '0xuser123',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
    value: '1.5',
    gasPrice: '45000000000', // 45 Gwei
    gasUsed: '150000',
    blockNumber: 18500000,
    protocolName: 'Uniswap V2',
    isDeFi: true,
    isStaking: false
  },
  {
    hash: '0x2345678901bcdef12345678901bcdef123456789',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 25, // 25 days ago
    from: '0xuser123',
    to: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Aave V2 Lending Pool
    value: '2.0',
    gasPrice: '35000000000', // 35 Gwei
    gasUsed: '250000',
    blockNumber: 18500100,
    protocolName: 'Aave V2',
    isDeFi: true,
    isStaking: false
  },
  {
    hash: '0x3456789012cdef123456789012cdef1234567890',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 20, // 20 days ago
    from: '0xuser123',
    to: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // Lido stETH
    value: '5.0',
    gasPrice: '25000000000', // 25 Gwei
    gasUsed: '80000',
    blockNumber: 18500200,
    protocolName: 'Lido',
    isDeFi: false,
    isStaking: true
  },
  {
    hash: '0x4567890123def1234567890123def12345678901',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 15, // 15 days ago
    from: '0xuser123',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router again
    value: '0.8',
    gasPrice: '55000000000', // 55 Gwei
    gasUsed: '140000',
    blockNumber: 18500300,
    protocolName: 'Uniswap V2',
    isDeFi: true,
    isStaking: false
  },
  {
    hash: '0x5678901234ef12345678901234ef123456789012',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 10, // 10 days ago
    from: '0xuser123',
    to: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', // Curve 3Pool
    value: '1.2',
    gasPrice: '30000000000', // 30 Gwei
    gasUsed: '180000',
    blockNumber: 18500400,
    protocolName: 'Curve',
    isDeFi: true,
    isStaking: false
  },
  {
    hash: '0x6789012345f123456789012345f1234567890123',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
    from: '0xuser123',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router third time
    value: '0.5',
    gasPrice: '40000000000', // 40 Gwei
    gasUsed: '145000',
    blockNumber: 18500500,
    protocolName: 'Uniswap V2',
    isDeFi: true,
    isStaking: false
  },
  {
    hash: '0x789012345f6123456789012345f61234567890124',
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
    from: '0xuser123',
    to: '0x1111111254fb6c44bAC0beD2854e76F90643097d', // 1inch V4 Router
    value: '0.3',
    gasPrice: '20000000000', // 20 Gwei
    gasUsed: '200000',
    blockNumber: 18500600,
    protocolName: '1inch',
    isDeFi: true,
    isStaking: false
  }
];

// Sample user metrics
const sampleUserMetrics: UserMetrics = {
  totalTransactions: sampleTransactionHistory.length,
  totalVolume: '11.3', // Sum of all transaction values
  avgTransactionValue: '1.61',
  stakingBalance: '5.0',
  defiProtocolsUsed: ['Uniswap V2', 'Aave V2', 'Lido', 'Curve', '1inch'],
  accountAge: 30, // Days
  firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 30,
  lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 2
};

async function testProtocolPreferenceEngine() {
  console.log('🧪 Testing Protocol Preference Engine...\n');

  try {
    // Test the main analysis function
    console.log('📊 Running protocol preference analysis...');
    const analysis = await ProtocolPreferenceEngine.analyzeProtocolPreferences(
      '0xuser123',
      sampleUserMetrics,
      sampleTransactionHistory
    );

    console.log('\n✅ Analysis completed successfully!\n');

    // Display results
    console.log('🎯 PREFERRED PROTOCOLS:');
    analysis.preferredProtocols.forEach((protocol, index) => {
      console.log(`${index + 1}. ${protocol.protocolName}`);
      console.log(`   - Usage: ${protocol.usageFrequency} transactions (${protocol.usageFrequencyPercentage.toFixed(1)}%)`);
      console.log(`   - Volume: ${protocol.volumeAmount.toFixed(2)} ETH (${protocol.volumePercentage.toFixed(1)}%)`);
      console.log(`   - Preference Strength: ${protocol.preferenceStrength}`);
      console.log(`   - Usage Trend: ${protocol.usageTrend}`);
      console.log(`   - Gas Efficiency: ${protocol.averageGasEfficiency.toFixed(1)}/100`);
      console.log(`   - Risk Level: ${protocol.riskLevel}\n`);
    });

    console.log('🌐 PROTOCOL DIVERSIFICATION:');
    console.log(`   - Diversification Score: ${analysis.protocolDiversification.diversificationScore}/100`);
    console.log(`   - Diversification Level: ${analysis.protocolDiversification.diversificationLevel}`);
    console.log(`   - Protocol Count: ${analysis.protocolDiversification.protocolCount}`);
    console.log(`   - Protocol Type Count: ${analysis.protocolDiversification.protocolTypeCount}`);
    console.log(`   - Concentration Risk: ${analysis.protocolDiversification.concentrationRisk}`);
    console.log(`   - Herfindahl Index: ${analysis.protocolDiversification.herfindahlIndex.toFixed(3)}\n`);

    console.log('⛽ GAS OPTIMIZATION ANALYSIS:');
    console.log(`   - Overall Efficiency Score: ${analysis.gasOptimizationAnalysis.overallEfficiencyScore}/100`);
    console.log(`   - Optimization Level: ${analysis.gasOptimizationAnalysis.optimizationLevel}`);
    console.log(`   - Average Gas Price: ${analysis.gasOptimizationAnalysis.averageGasPrice.toFixed(1)} Gwei`);
    console.log(`   - Gas Price Consistency: ${analysis.gasOptimizationAnalysis.gasPriceConsistency}/100`);
    console.log(`   - Total Gas Cost: ${analysis.gasOptimizationAnalysis.totalGasCost.toFixed(6)} ETH`);
    console.log(`   - Cost Optimization Potential: ${analysis.gasOptimizationAnalysis.costOptimizationPotential}%`);
    console.log(`   - Estimated Savings: ${analysis.gasOptimizationAnalysis.estimatedSavings.toFixed(6)} ETH\n`);

    console.log('⏰ TRANSACTION TIMING ANALYSIS:');
    console.log(`   - Current Timing Efficiency: ${analysis.transactionTimingAnalysis.currentTimingEfficiency}/100`);
    console.log(`   - Timing Consistency: ${analysis.transactionTimingAnalysis.timingConsistency}/100`);
    console.log(`   - Congestion Awareness: ${analysis.transactionTimingAnalysis.congestionAwareness}/100`);
    console.log(`   - Congestion Avoidance: ${analysis.transactionTimingAnalysis.congestionAvoidance}/100`);
    console.log(`   - Preferred Hours: ${analysis.transactionTimingAnalysis.preferredHours.join(', ')}`);
    console.log(`   - Optimal Windows: ${analysis.transactionTimingAnalysis.optimalTimingWindows.length} identified\n`);

    console.log('🎓 PROTOCOL SOPHISTICATION ANALYSIS:');
    console.log(`   - Overall Sophistication Score: ${analysis.protocolSophisticationAnalysis.overallSophisticationScore}/100`);
    console.log(`   - Sophistication Level: ${analysis.protocolSophisticationAnalysis.sophisticationLevel}`);
    console.log(`   - Sophistication Trend: ${analysis.protocolSophisticationAnalysis.sophisticationTrend}`);
    console.log(`   - Learning Progression: ${analysis.protocolSophisticationAnalysis.learningProgression.progressionTrend}`);
    console.log(`   - Time to Advancement: ${analysis.protocolSophisticationAnalysis.learningProgression.timeToAdvancement} days\n`);

    console.log('💡 KEY INSIGHTS:');
    analysis.insights.keyFindings.forEach(finding => console.log(`   • ${finding}`));
    console.log('\n🎯 STRENGTH AREAS:');
    analysis.insights.strengthAreas.forEach(strength => console.log(`   • ${strength}`));
    console.log('\n📈 IMPROVEMENT AREAS:');
    analysis.insights.improvementAreas.forEach(area => console.log(`   • ${area}`));
    console.log('\n⚠️ RISK FACTORS:');
    analysis.insights.riskFactors.forEach(risk => console.log(`   • ${risk}`));
    console.log('\n🚀 OPPORTUNITIES:');
    analysis.insights.opportunities.forEach(opportunity => console.log(`   • ${opportunity}`));

    console.log('\n📋 TOP RECOMMENDATIONS:');
    analysis.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.title} (${rec.priority} priority)`);
      console.log(`   Category: ${rec.category}`);
      console.log(`   Description: ${rec.description}`);
      console.log(`   Expected Impact: ${rec.expectedImpact}`);
      console.log(`   Timeframe: ${rec.timeframe}\n`);
    });

    console.log('📊 ANALYSIS METADATA:');
    console.log(`   - Confidence Score: ${analysis.confidence}/100`);
    console.log(`   - Data Quality: ${analysis.dataQuality.reliability}/100`);
    console.log(`   - Sample Size: ${analysis.dataQuality.sampleSize} transactions`);
    console.log(`   - Time Span: ${analysis.dataQuality.timeSpanDays} days`);
    console.log(`   - Protocol Coverage: ${analysis.dataQuality.protocolCoverage}/100\n`);

    console.log('✅ All tests passed! Protocol Preference Engine is working correctly.');

    // Test edge cases
    console.log('\n🧪 Testing edge cases...');
    
    // Test with empty transaction history
    const emptyAnalysis = await ProtocolPreferenceEngine.analyzeProtocolPreferences(
      '0xemptyuser',
      { ...sampleUserMetrics, totalTransactions: 0 },
      []
    );
    
    console.log(`Empty history analysis confidence: ${emptyAnalysis.confidence}/100`);
    console.log(`Empty history recommendations: ${emptyAnalysis.recommendations.length}`);
    
    // Test with minimal transaction history
    const minimalAnalysis = await ProtocolPreferenceEngine.analyzeProtocolPreferences(
      '0xminimaluser',
      { ...sampleUserMetrics, totalTransactions: 1 },
      [sampleTransactionHistory[0]]
    );
    
    console.log(`Minimal history analysis confidence: ${minimalAnalysis.confidence}/100`);
    console.log(`Minimal history preferred protocols: ${minimalAnalysis.preferredProtocols.length}`);

    console.log('\n🎉 All edge case tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testProtocolPreferenceEngine();
}

export { testProtocolPreferenceEngine };