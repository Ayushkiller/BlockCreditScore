import { PeerGroupAnalysisEngine, UserPeerGroupClassification } from './services/peerGroupAnalysisEngine';
import { BenchmarkingEngine, BenchmarkingData } from './services/benchmarkingEngine';
import { ScoreCalculator, CreditScore, ScoreBreakdown } from './services/scoreCalculator';
import { UserMetrics, TransactionData } from './services/blockchainService';

/**
 * Test script for the peer group analysis and benchmarking system
 */
async function testBenchmarkingSystem() {
  console.log('🧪 Testing Peer Group Analysis and Benchmarking System\n');

  // Test data - different user profiles
  const testUsers = [
    {
      name: 'New Conservative User',
      address: '0x1234567890123456789012345678901234567890',
      metrics: {
        totalVolume: '5.5',
        totalTransactions: 25,
        accountAge: 45,
        stakingBalance: '2.0',
        avgTransactionValue: '0.22',
        defiProtocolsUsed: ['Uniswap', 'Compound'],
        firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 45, // 45 days ago
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 5 // 5 days ago
      } as UserMetrics,
      transactionHistory: [] as TransactionData[]
    },
    {
      name: 'Established Active User',
      address: '0x2345678901234567890123456789012345678901',
      metrics: {
        totalVolume: '125.8',
        totalTransactions: 180,
        accountAge: 220,
        stakingBalance: '15.5',
        avgTransactionValue: '0.70',
        defiProtocolsUsed: ['Uniswap', 'Compound', 'Aave', 'Curve', 'Yearn'],
        firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 220, // 220 days ago
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 2 // 2 days ago
      } as UserMetrics,
      transactionHistory: [] as TransactionData[]
    },
    {
      name: 'Veteran Whale',
      address: '0x3456789012345678901234567890123456789012',
      metrics: {
        totalVolume: '2500.0',
        totalTransactions: 450,
        accountAge: 800,
        stakingBalance: '500.0',
        avgTransactionValue: '5.56',
        defiProtocolsUsed: ['Uniswap', 'Compound', 'Aave', 'Curve', 'Yearn', 'MakerDAO', 'Synthetix'],
        firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 800, // 800 days ago
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 1 // 1 day ago
      } as UserMetrics,
      transactionHistory: [] as TransactionData[]
    }
  ];

  for (const testUser of testUsers) {
    console.log(`\n📊 Testing ${testUser.name}`);
    console.log('=' .repeat(50));

    try {
      // Test peer group classification
      console.log('\n🎯 Peer Group Classification:');
      const peerGroupClassification = PeerGroupAnalysisEngine.classifyUserIntoPeerGroups(
        testUser.address,
        testUser.metrics,
        testUser.transactionHistory
      );

      console.log(`Primary Peer Group: ${peerGroupClassification.primaryPeerGroup.name}`);
      console.log(`Description: ${peerGroupClassification.primaryPeerGroup.description}`);
      console.log(`Classification Confidence: ${peerGroupClassification.classificationConfidence}%`);
      console.log(`Member Count: ${peerGroupClassification.primaryPeerGroup.memberCount}`);
      console.log(`Group Average Score: ${peerGroupClassification.primaryPeerGroup.averageScore}`);
      
      console.log('\nClassification Reasons:');
      peerGroupClassification.classificationReasons.forEach(reason => {
        console.log(`  • ${reason}`);
      });

      if (peerGroupClassification.alternativePeerGroups.length > 0) {
        console.log('\nAlternative Peer Groups:');
        peerGroupClassification.alternativePeerGroups.forEach(group => {
          console.log(`  • ${group.name} (${group.memberCount} members)`);
        });
      }

      // Calculate credit score and breakdown
      console.log('\n💯 Credit Score Calculation:');
      const creditScore = await ScoreCalculator.calculateCreditScore(
        testUser.address,
        testUser.metrics,
        testUser.transactionHistory
      );

      const scoreBreakdown = await ScoreCalculator.generateScoreBreakdown(
        testUser.address,
        testUser.metrics,
        testUser.transactionHistory
      );

      console.log(`Credit Score: ${creditScore.score}/1000 (${creditScore.confidence}% confidence)`);
      console.log(`Breakdown:`);
      console.log(`  • Transaction Volume: ${scoreBreakdown.transactionVolume.score} (weight: ${scoreBreakdown.transactionVolume.weight})`);
      console.log(`  • Transaction Frequency: ${scoreBreakdown.transactionFrequency.score} (weight: ${scoreBreakdown.transactionFrequency.weight})`);
      console.log(`  • Staking Activity: ${scoreBreakdown.stakingActivity.score} (weight: ${scoreBreakdown.stakingActivity.weight})`);
      console.log(`  • DeFi Interactions: ${scoreBreakdown.defiInteractions.score} (weight: ${scoreBreakdown.defiInteractions.weight})`);

      // Test comprehensive benchmarking
      console.log('\n📈 Comprehensive Benchmarking:');
      const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
        testUser.address,
        creditScore,
        scoreBreakdown,
        testUser.metrics,
        testUser.transactionHistory
      );

      // Display percentile rankings
      console.log('\nPercentile Rankings:');
      console.log(`  Overall Score: ${benchmarkingData.percentileRankings.overallScore.percentile}th percentile (${benchmarkingData.percentileRankings.overallScore.category})`);
      console.log(`  Rank: ${benchmarkingData.percentileRankings.overallScore.rank} of ${benchmarkingData.percentileRankings.overallScore.totalInGroup}`);
      
      console.log('\n  Component Rankings:');
      Object.entries(benchmarkingData.percentileRankings.componentScores).forEach(([component, ranking]) => {
        console.log(`    ${component}: ${ranking.percentile}th percentile (${ranking.category})`);
      });

      console.log('\n  Behavioral Rankings:');
      Object.entries(benchmarkingData.percentileRankings.behavioralMetrics).forEach(([metric, ranking]) => {
        console.log(`    ${metric}: ${ranking.percentile}th percentile (${ranking.category})`);
      });

      // Display comparative analysis
      console.log('\nComparative Analysis:');
      const vsAverage = benchmarkingData.comparativeAnalysis.vsGroupAverage;
      console.log(`  vs Group Average: ${vsAverage.scoreDifference > 0 ? '+' : ''}${vsAverage.scoreDifference} points (${vsAverage.percentageDifference.toFixed(1)}%)`);
      console.log(`  Better than ${vsAverage.betterThan}% of peers`);

      const vsTop = benchmarkingData.comparativeAnalysis.vsTopPerformers;
      if (vsTop.gapToTop10 > 0) {
        console.log(`  Gap to top 10%: ${vsTop.gapToTop10} points`);
        console.log(`  Gap to top 25%: ${vsTop.gapToTop25} points`);
      } else {
        console.log(`  Already in top 10% of performers!`);
      }

      // Display strengths and weaknesses
      if (benchmarkingData.comparativeAnalysis.strengthsVsPeers.length > 0) {
        console.log('\nStrengths vs Peers:');
        benchmarkingData.comparativeAnalysis.strengthsVsPeers.forEach(strength => {
          console.log(`  • ${strength.component}: ${strength.percentileDifference > 0 ? '+' : ''}${strength.percentileDifference}% (${strength.significance})`);
        });
      }

      if (benchmarkingData.comparativeAnalysis.weaknessesVsPeers.length > 0) {
        console.log('\nWeaknesses vs Peers:');
        benchmarkingData.comparativeAnalysis.weaknessesVsPeers.forEach(weakness => {
          console.log(`  • ${weakness.component}: ${weakness.percentileDifference}% (${weakness.significance})`);
        });
      }

      // Display opportunity areas
      if (benchmarkingData.comparativeAnalysis.opportunityAreas.length > 0) {
        console.log('\nTop Improvement Opportunities:');
        benchmarkingData.comparativeAnalysis.opportunityAreas.slice(0, 3).forEach((opp, index) => {
          console.log(`  ${index + 1}. ${opp.area}:`);
          console.log(`     Current: ${opp.currentPercentile}th percentile → Potential: ${opp.potentialPercentile}th percentile`);
          console.log(`     Impact: +${opp.impactOnOverallScore} points | Difficulty: ${opp.difficulty} | Timeframe: ${opp.timeframe}`);
          console.log(`     Actions: ${opp.actionItems.slice(0, 2).join(', ')}`);
        });
      }

      // Display benchmark categories
      console.log('\nBenchmark Categories:');
      const qualifiedCategories = benchmarkingData.benchmarkCategories.filter(cat => cat.userQualifies);
      const availableCategories = benchmarkingData.benchmarkCategories.filter(cat => !cat.userQualifies);

      if (qualifiedCategories.length > 0) {
        console.log('  Qualified Categories:');
        qualifiedCategories.forEach(cat => {
          console.log(`    ✅ ${cat.name} (${cat.percentageOfUsers}% of users)`);
          console.log(`       ${cat.description}`);
        });
      }

      if (availableCategories.length > 0) {
        console.log('  Available Categories:');
        availableCategories.slice(0, 2).forEach(cat => {
          console.log(`    🎯 ${cat.name} (${cat.percentageOfUsers}% of users)`);
          console.log(`       ${cat.description}`);
        });
      }

      // Display relative performance
      console.log('\nRelative Performance:');
      const relPerf = benchmarkingData.relativePerformance;
      console.log(`  Overall Rating: ${relPerf.overallRating}`);
      console.log(`  Market Position: ${relPerf.marketPosition}`);

      if (relPerf.keyStrengths.length > 0) {
        console.log(`  Key Strengths: ${relPerf.keyStrengths.join(', ')}`);
      }

      if (relPerf.keyWeaknesses.length > 0) {
        console.log(`  Key Weaknesses: ${relPerf.keyWeaknesses.join(', ')}`);
      }

      if (relPerf.competitiveAdvantages.length > 0) {
        console.log(`  Competitive Advantages:`);
        relPerf.competitiveAdvantages.forEach(advantage => {
          console.log(`    • ${advantage}`);
        });
      }

      if (relPerf.improvementPriorities.length > 0) {
        console.log(`  Improvement Priorities: ${relPerf.improvementPriorities.join(', ')}`);
      }

    } catch (error) {
      console.error(`❌ Error testing ${testUser.name}:`, error);
    }
  }

  // Test peer group metrics
  console.log('\n\n🏆 Peer Group Metrics Test');
  console.log('=' .repeat(50));

  try {
    const allPeerGroups = PeerGroupAnalysisEngine.getAllPeerGroups();
    console.log(`\nTotal Peer Groups Available: ${allPeerGroups.length}`);

    // Test a few specific peer groups
    const testGroupIds = ['established_active', 'veteran_whale', 'new_conservative'];
    
    for (const groupId of testGroupIds) {
      try {
        const groupMetrics = PeerGroupAnalysisEngine.getPeerGroupMetrics(groupId);
        const group = allPeerGroups.find(g => g.id === groupId);
        
        if (group) {
          console.log(`\n📊 ${group.name}:`);
          console.log(`  Description: ${group.description}`);
          console.log(`  Total Users: ${groupMetrics.totalUsers}`);
          console.log(`  Average Score: ${groupMetrics.averageScore}`);
          console.log(`  Score Distribution:`);
          console.log(`    Excellent (800-1000): ${groupMetrics.scoreDistribution.excellent} users`);
          console.log(`    Good (600-799): ${groupMetrics.scoreDistribution.good} users`);
          console.log(`    Fair (400-599): ${groupMetrics.scoreDistribution.fair} users`);
          console.log(`    Poor (0-399): ${groupMetrics.scoreDistribution.poor} users`);
          console.log(`  Behavioral Distribution:`);
          console.log(`    Conservative: ${groupMetrics.behavioralDistribution.conservative}%`);
          console.log(`    Moderate: ${groupMetrics.behavioralDistribution.moderate}%`);
          console.log(`    Aggressive: ${groupMetrics.behavioralDistribution.aggressive}%`);
          console.log(`    Speculative: ${groupMetrics.behavioralDistribution.speculative}%`);
          console.log(`  Activity Metrics:`);
          console.log(`    Avg Transactions: ${groupMetrics.activityMetrics.averageTransactions}`);
          console.log(`    Avg Volume: ${groupMetrics.activityMetrics.averageVolume} ETH`);
          console.log(`    Avg Account Age: ${groupMetrics.activityMetrics.averageAccountAge} days`);
          console.log(`    Avg Staking Balance: ${groupMetrics.activityMetrics.averageStakingBalance} ETH`);
        }
      } catch (error) {
        console.error(`❌ Error getting metrics for group ${groupId}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error testing peer group metrics:', error);
  }

  console.log('\n✅ Benchmarking system test completed!');
}

// Run the test
if (require.main === module) {
  testBenchmarkingSystem().catch(console.error);
}

export { testBenchmarkingSystem };