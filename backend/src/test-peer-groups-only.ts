import { PeerGroupAnalysisEngine } from './services/peerGroupAnalysisEngine';
import { UserMetrics, TransactionData } from './services/blockchainService';

/**
 * Simple test script for just the peer group analysis
 */
async function testPeerGroupsOnly() {
  console.log('🧪 Testing Peer Group Analysis System\n');

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
        firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 45,
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 5
      } as UserMetrics
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
        firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 220,
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 2
      } as UserMetrics
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
        firstTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 800,
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400 * 1
      } as UserMetrics
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
        []
      );

      console.log(`Primary Peer Group: ${peerGroupClassification.primaryPeerGroup.name}`);
      console.log(`Description: ${peerGroupClassification.primaryPeerGroup.description}`);
      console.log(`Classification Confidence: ${peerGroupClassification.classificationConfidence}%`);
      console.log(`Member Count: ${peerGroupClassification.primaryPeerGroup.memberCount}`);
      console.log(`Group Average Score: ${peerGroupClassification.primaryPeerGroup.averageScore}`);
      
      console.log('\nGroup Criteria:');
      const criteria = peerGroupClassification.primaryPeerGroup.criteria;
      console.log(`  Account Age: ${criteria.accountAge.min}-${criteria.accountAge.max} days`);
      console.log(`  Activity Level: ${criteria.activityLevel.min}-${criteria.activityLevel.max} transactions`);
      console.log(`  Portfolio Size: ${criteria.portfolioSize.min}-${criteria.portfolioSize.max} ETH`);
      
      console.log('\nScore Range:');
      const scoreRange = peerGroupClassification.primaryPeerGroup.scoreRange;
      console.log(`  Min-Max: ${scoreRange.min}-${scoreRange.max}`);
      console.log(`  Percentiles: 25th=${scoreRange.percentiles.p25}, 50th=${scoreRange.percentiles.p50}, 75th=${scoreRange.percentiles.p75}, 90th=${scoreRange.percentiles.p90}`);
      
      console.log('\nClassification Reasons:');
      peerGroupClassification.classificationReasons.forEach(reason => {
        console.log(`  • ${reason}`);
      });

      if (peerGroupClassification.alternativePeerGroups.length > 0) {
        console.log('\nAlternative Peer Groups:');
        peerGroupClassification.alternativePeerGroups.forEach(group => {
          console.log(`  • ${group.name} (${group.memberCount} members, avg score: ${group.averageScore})`);
        });
      }

      // Test user metrics analysis
      console.log('\nUser Metrics Analysis:');
      const portfolioSize = parseFloat(testUser.metrics.totalVolume);
      const activityLevel = testUser.metrics.totalTransactions;
      const accountAge = testUser.metrics.accountAge;
      
      console.log(`  Portfolio Size: ${portfolioSize.toFixed(2)} ETH`);
      console.log(`  Activity Level: ${activityLevel} transactions`);
      console.log(`  Account Age: ${accountAge} days`);
      console.log(`  Staking Balance: ${testUser.metrics.stakingBalance} ETH`);
      console.log(`  DeFi Protocols: ${testUser.metrics.defiProtocolsUsed.length} (${testUser.metrics.defiProtocolsUsed.join(', ')})`);
      console.log(`  Avg Transaction Value: ${testUser.metrics.avgTransactionValue} ETH`);

    } catch (error) {
      console.error(`❌ Error testing ${testUser.name}:`, error);
    }
  }

  // Test peer group metrics
  console.log('\n\n🏆 All Peer Groups Overview');
  console.log('=' .repeat(50));

  try {
    const allPeerGroups = PeerGroupAnalysisEngine.getAllPeerGroups();
    console.log(`\nTotal Peer Groups Available: ${allPeerGroups.length}\n`);

    allPeerGroups.forEach(group => {
      console.log(`📊 ${group.name}:`);
      console.log(`   ${group.description}`);
      console.log(`   Members: ${group.memberCount} | Avg Score: ${group.averageScore}`);
      console.log(`   Account Age: ${group.criteria.accountAge.min}-${group.criteria.accountAge.max} days`);
      console.log(`   Activity: ${group.criteria.activityLevel.min}-${group.criteria.activityLevel.max} txs`);
      console.log(`   Portfolio: ${group.criteria.portfolioSize.min}-${group.criteria.portfolioSize.max} ETH`);
      console.log('');
    });

    // Test specific peer group metrics
    console.log('\n🔍 Detailed Peer Group Metrics');
    console.log('=' .repeat(50));
    
    const testGroupIds = ['established_active', 'veteran_whale', 'new_conservative'];
    
    for (const groupId of testGroupIds) {
      try {
        const groupMetrics = PeerGroupAnalysisEngine.getPeerGroupMetrics(groupId);
        const group = allPeerGroups.find(g => g.id === groupId);
        
        if (group) {
          console.log(`\n📈 ${group.name} Detailed Metrics:`);
          console.log(`  Total Users: ${groupMetrics.totalUsers}`);
          console.log(`  Average Score: ${groupMetrics.averageScore}`);
          
          console.log(`  Score Distribution:`);
          console.log(`    Excellent (800-1000): ${groupMetrics.scoreDistribution.excellent} users (${Math.round(groupMetrics.scoreDistribution.excellent/groupMetrics.totalUsers*100)}%)`);
          console.log(`    Good (600-799): ${groupMetrics.scoreDistribution.good} users (${Math.round(groupMetrics.scoreDistribution.good/groupMetrics.totalUsers*100)}%)`);
          console.log(`    Fair (400-599): ${groupMetrics.scoreDistribution.fair} users (${Math.round(groupMetrics.scoreDistribution.fair/groupMetrics.totalUsers*100)}%)`);
          console.log(`    Poor (0-399): ${groupMetrics.scoreDistribution.poor} users (${Math.round(groupMetrics.scoreDistribution.poor/groupMetrics.totalUsers*100)}%)`);
          
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

  console.log('\n✅ Peer group analysis test completed!');
}

// Run the test
if (require.main === module) {
  testPeerGroupsOnly().catch(console.error);
}

export { testPeerGroupsOnly };