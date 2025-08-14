import { GrowthTrendAnalysisEngine } from './services/growthTrendAnalysisEngine';
import { UserMetrics, TransactionData } from './services/blockchainService';

/**
 * Test script for GrowthTrendAnalysisEngine
 * Tests all four main components of task 9
 */

// Mock user metrics
const mockMetrics: UserMetrics = {
  totalTransactions: 25,
  totalVolume: '5.5',
  avgTransactionValue: '0.22',
  stakingBalance: '2.0',
  defiProtocolsUsed: ['uniswap', 'aave', 'compound'],
  accountAge: 120, // 4 months
  firstTransactionDate: Math.floor(Date.now() / 1000) - (120 * 24 * 60 * 60), // 120 days ago
  lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 // 1 day ago
};

// Mock transaction history with varied patterns
const mockTransactionHistory: TransactionData[] = [
  {
    hash: '0xabc1',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x9876543210987654321098765432109876543210',
    timestamp: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 days ago
    value: '0.5',
    gasPrice: '20000000000',
    gasUsed: '21000',
    blockNumber: 18000000,
    isDeFi: false,
    isStaking: false
  },
  {
    hash: '0xabc2',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap router
    timestamp: Math.floor(Date.now() / 1000) - (25 * 24 * 60 * 60), // 25 days ago
    value: '1.0',
    gasPrice: '25000000000',
    gasUsed: '150000',
    blockNumber: 18001000,
    isDeFi: true,
    isStaking: false,
    protocolName: 'uniswap'
  },
  {
    hash: '0xabc3',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Aave lending pool
    timestamp: Math.floor(Date.now() / 1000) - (20 * 24 * 60 * 60), // 20 days ago
    value: '0.3',
    gasPrice: '30000000000',
    gasUsed: '200000',
    blockNumber: 18002000,
    isDeFi: true,
    isStaking: false,
    protocolName: 'aave'
  },
  {
    hash: '0xabc4',
    from: '0x1234567890123456789012345678901234567890',
    to: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // Lido staking
    timestamp: Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60), // 15 days ago
    value: '2.0',
    gasPrice: '15000000000',
    gasUsed: '100000',
    blockNumber: 18003000,
    isDeFi: false,
    isStaking: true,
    protocolName: 'lido'
  },
  {
    hash: '0xabc5',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // Compound
    timestamp: Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60), // 10 days ago
    value: '0.8',
    gasPrice: '40000000000',
    gasUsed: '180000',
    blockNumber: 18004000,
    isDeFi: true,
    isStaking: false,
    protocolName: 'compound'
  },
  {
    hash: '0xabc6',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap router
    timestamp: Math.floor(Date.now() / 1000) - (5 * 24 * 60 * 60), // 5 days ago
    value: '1.2',
    gasPrice: '35000000000',
    gasUsed: '120000',
    blockNumber: 18005000,
    isDeFi: true,
    isStaking: false,
    protocolName: 'uniswap'
  },
  {
    hash: '0xabc7',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x9876543210987654321098765432109876543210',
    timestamp: Math.floor(Date.now() / 1000) - (1 * 24 * 60 * 60), // 1 day ago
    value: '0.7',
    gasPrice: '20000000000',
    gasUsed: '90000',
    blockNumber: 18006000,
    isDeFi: false,
    isStaking: false
  }
];

async function testGrowthTrendAnalysisEngine() {
  console.log('🧪 Testing GrowthTrendAnalysisEngine...\n');

  try {
    // Test 1: Growth Trend Analysis
    console.log('📈 Testing Growth Trend Analysis...');
    const growthTrend = GrowthTrendAnalysisEngine.analyzeGrowthTrend(
      '0x1234567890123456789012345678901234567890',
      mockMetrics,
      mockTransactionHistory
    );
    
    console.log('Growth Trend Result:');
    console.log(`- Trend: ${growthTrend.trend}`);
    console.log(`- Confidence: ${growthTrend.confidence}%`);
    console.log(`- Trend Strength: ${growthTrend.trendStrength.toFixed(2)}`);
    console.log(`- Evidence: ${growthTrend.evidence.join(', ')}`);
    console.log(`- Recommendations: ${growthTrend.recommendations.join(', ')}`);
    console.log('✅ Growth trend analysis completed\n');

    // Test 2: Consistency Analysis
    console.log('🔄 Testing Consistency Analysis...');
    const consistencyAnalysis = GrowthTrendAnalysisEngine.analyzeConsistency(
      '0x1234567890123456789012345678901234567890',
      mockMetrics,
      mockTransactionHistory
    );
    
    console.log('Consistency Analysis Result:');
    console.log(`- Overall Score: ${consistencyAnalysis.overallScore}/100`);
    console.log(`- Timing Consistency: ${consistencyAnalysis.components.timingConsistency}/100`);
    console.log(`- Volume Consistency: ${consistencyAnalysis.components.volumeConsistency}/100`);
    console.log(`- Frequency Consistency: ${consistencyAnalysis.components.frequencyConsistency}/100`);
    console.log(`- Behavioral Consistency: ${consistencyAnalysis.components.behavioralConsistency}/100`);
    console.log(`- Activity Stability: ${consistencyAnalysis.stabilityIndicators.activityStability}`);
    console.log(`- Evidence: ${consistencyAnalysis.evidence.join(', ')}`);
    console.log('✅ Consistency analysis completed\n');

    // Test 3: Timing Analysis
    console.log('⏰ Testing Timing Analysis...');
    const timingAnalysis = GrowthTrendAnalysisEngine.analyzeTimingPatterns(
      '0x1234567890123456789012345678901234567890',
      mockTransactionHistory
    );
    
    console.log('Timing Analysis Result:');
    console.log(`- Consistency Score: ${timingAnalysis.consistencyScore}/100`);
    console.log(`- Preferred Hours: [${timingAnalysis.preferredHours.join(', ')}]`);
    console.log(`- Preferred Days: [${timingAnalysis.preferredDays.join(', ')}]`);
    console.log(`- Timezone Pattern: ${timingAnalysis.timezonePattern}`);
    console.log(`- Peak Activity Periods: ${timingAnalysis.peakActivityPeriods.length} periods`);
    console.log(`- Seasonal Patterns: ${timingAnalysis.seasonalPatterns.length} patterns`);
    console.log('✅ Timing analysis completed\n');

    // Test 4: Diversification Analysis
    console.log('🌐 Testing Diversification Analysis...');
    const diversificationAnalysis = GrowthTrendAnalysisEngine.analyzeDiversification(
      '0x1234567890123456789012345678901234567890',
      mockMetrics,
      mockTransactionHistory
    );
    
    console.log('Diversification Analysis Result:');
    console.log(`- Level: ${diversificationAnalysis.level}`);
    console.log(`- Overall Score: ${diversificationAnalysis.score}/100`);
    console.log(`- Protocol Diversification: ${diversificationAnalysis.diversificationMetrics.protocolDiversification}/100`);
    console.log(`- Transaction Type Diversification: ${diversificationAnalysis.diversificationMetrics.transactionTypeDiversification}/100`);
    console.log(`- Temporal Diversification: ${diversificationAnalysis.diversificationMetrics.temporalDiversification}/100`);
    console.log(`- Value Diversification: ${diversificationAnalysis.diversificationMetrics.valueDiversification}/100`);
    console.log(`- Concentration Risk: ${diversificationAnalysis.riskAssessment.concentrationRisk}`);
    console.log(`- Concentration Areas: ${diversificationAnalysis.concentrationAreas.length} areas identified`);
    console.log(`- Recommendations: ${diversificationAnalysis.recommendations.join(', ')}`);
    console.log('✅ Diversification analysis completed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Growth Trend: ${growthTrend.trend} (${growthTrend.confidence}% confidence)`);
    console.log(`- Consistency Score: ${consistencyAnalysis.overallScore}/100`);
    console.log(`- Timing Consistency: ${timingAnalysis.consistencyScore}/100`);
    console.log(`- Diversification: ${diversificationAnalysis.level} (${diversificationAnalysis.score}/100)`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testGrowthTrendAnalysisEngine();