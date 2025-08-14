import { PeerGroupAnalysisEngine, UserPeerGroupClassification } from './services/peerGroupAnalysisEngine';
import { BenchmarkingEngine, BenchmarkingData } from './services/benchmarkingEngine';
import { UserMetrics, TransactionData } from './services/blockchainService';

/**
 * Simple test script for the peer group analysis and benchmarking system
 */
async function testBenchmarkingSystemSimple() {
  console.log('🧪 Testing Peer Group Analysis and Benchmarking System (Simple)\n');

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

      // Create mock credit score and breakdown for benchmarking test
      const mockCreditScore = {
        address: testUser.address,
        score: Math.round(400 + Math.random() * 400), // Random score between 400-800
        confidence: Math.round(60 + Math.random() * 30), // Random confidence 60-90%
        timestamp: Math.floor(Date.now() / 1000),
        version: '2.0.0',
        breakdown: {
          transactionVolume: Math.round(200 + Math.random() * 600),
          transactionFrequency: Math.round(200 + Math.random() * 600),
          stakingActivity: Math.round(200 + Math.random() * 600),
          defiInteractions: Math.round(200 + Math.random() * 600)
        },
        dataQuality: {
          overallQuality: 'HIGH' as const,
          completeness: 85,
          freshness: 90,
          accuracy: 88,
          issues: [],
          recommendations: []
        }
      };

      const mockScoreBreakdown = {
        transactionVolume: {
          score: mockCreditScore.breakdown.transactionVolume,
          weight: 0.30,
          weightedScore: Math.round(mockCreditScore.breakdown.transactionVolume * 0.30),
          details: {
            totalVolume: testUser.metrics.totalVolume,
            volumeScore: mockCreditScore.breakdown.transactionVolume,
            volumeCategory: 'Medium',
            gasEfficiency: 75
          },
          insights: {
            explanation: 'Mock volume insights',
            strengths: ['Good transaction volume'],
            weaknesses: [],
            improvementPotential: 20,
            confidence: 80,
            benchmarkComparison: { percentile: 65, category: 'Medium' }
          }
        },
        transactionFrequency: {
          score: mockCreditScore.breakdown.transactionFrequency,
          weight: 0.25,
          weightedScore: Math.round(mockCreditScore.breakdown.transactionFrequency * 0.25),
          details: {
            totalTransactions: testUser.metrics.totalTransactions,
            accountAge: testUser.metrics.accountAge,
            frequencyScore: mockCreditScore.breakdown.transactionFrequency,
            avgTransactionsPerMonth: Math.round((testUser.metrics.totalTransactions / Math.max(testUser.metrics.accountAge, 1)) * 30),
            consistencyScore: 70
          },
          insights: {
            explanation: 'Mock frequency insights',
            strengths: ['Regular activity'],
            weaknesses: [],
            improvementPotential: 15,
            confidence: 75,
            benchmarkComparison: { percentile: 60, category: 'Medium' }
          }
        },
        stakingActivity: {
          score: mockCreditScore.breakdown.stakingActivity,
          weight: 0.25,
          weightedScore: Math.round(mockCreditScore.breakdown.stakingActivity * 0.25),
          details: {
            stakingBalance: testUser.metrics.stakingBalance,
            stakingScore: mockCreditScore.breakdown.stakingActivity,
            stakingRatio: 0.3,
            stakingProtocols: ['Ethereum 2.0'],
            stakingDuration: 180
          },
          insights: {
            explanation: 'Mock staking insights',
            strengths: ['Good staking participation'],
            weaknesses: [],
            improvementPotential: 25,
            confidence: 70,
            benchmarkComparison: { percentile: 55, category: 'Medium' }
          }
        },
        defiInteractions: {
          score: mockCreditScore.breakdown.defiInteractions,
          weight: 0.20,
          weightedScore: Math.round(mockCreditScore.breakdown.defiInteractions * 0.20),
          details: {
            protocolsUsed: testUser.metrics.defiProtocolsUsed.length,
            defiScore: mockCreditScore.breakdown.defiInteractions,
            diversificationScore: 65,
            totalDefiVolume: (parseFloat(testUser.metrics.totalVolume) * 0.3).toFixed(2),
            favoriteProtocols: testUser.metrics.defiProtocolsUsed.slice(0, 3)
          },
          insights: {
            explanation: 'Mock DeFi insights',
            strengths: ['Good protocol diversity'],
            weaknesses: [],
            improvementPotential: 30,
            confidence: 65,
            benchmarkComparison: { percentile: 70, category: 'Good' }
          }
        },
        riskAssessment: {
          riskLevel: 'MEDIUM' as const,
          riskScore: 35,
          riskFactors: ['Some concentration risk'],
          flags: {
            concentrationRisk: false,
            volatilityRisk: false,
            inactivityRisk: false,
            newAccountRisk: testUser.metrics.accountAge < 90,
            unusualPatterns: false
          }
        },
        behavioralInsights: {
          consistencyScore: 70,
          consistencyAnalysis: {
            score: 70,
            stability: 'STABLE' as const,
            factors: {
              timingConsistency: 65,
              volumeConsistency: 70,
              frequencyConsistency: 75,
              patternConsistency: 70
            },
            insights: ['Regular transaction patterns']
          },
          growthTrend: 'STABLE' as const,
          diversificationLevel: 'MEDIUM' as const,
          diversificationAnalysis: {
            score: 65,
            protocolDiversification: 70,
            transactionTypeDiversification: 60,
            temporalDiversification: 65,
            concentrationRisks: [],
            recommendations: ['Consider exploring more protocols']
          },
          gasEfficiency: 75,
          activityPattern: 'REGULAR' as const,
          behavioralPattern: {
            type: 'MODERATE' as const,
            confidence: 75,
            indicators: ['Regular activity', 'Balanced approach'],
            weightAdjustments: {
              transactionVolume: 0.30,
              transactionFrequency: 0.25,
              stakingActivity: 0.25,
              defiInteractions: 0.20
            }
          },
          preferredProtocols: testUser.metrics.defiProtocolsUsed.slice(0, 3),
          temporalPatterns: {
            peakHours: [14, 15, 16],
            peakDays: [1, 2, 3],
            seasonalTrends: [],
            anomalousTransactions: [],
            consistencyScore: 70
          }
        },
        recommendations: []
      };

      console.log('\n💯 Mock Credit Score:');
      console.log(`Credit Score: ${mockCreditScore.score}/1000 (${mockCreditScore.confidence}% confidence)`);
      console.log(`Breakdown:`);
      console.log(`  • Transaction Volume: ${mockScoreBreakdown.transactionVolume.score} (weight: ${mockScoreBreakdown.transactionVolume.weight})`);
      console.log(`  • Transaction Frequency: ${mockScoreBreakdown.transactionFrequency.score} (weight: ${mockScoreBreakdown.transactionFrequency.weight})`);
      console.log(`  • Staking Activity: ${mockScoreBreakdown.stakingActivity.score} (weight: ${mockScoreBreakdown.stakingActivity.weight})`);
      console.log(`  • DeFi Interactions: ${mockScoreBreakdown.defiInteractions.score} (weight: ${mockScoreBreakdown.defiInteractions.weight})`);

      // Test comprehensive benchmarking
      console.log('\n📈 Comprehensive Benchmarking:');
      const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
        testUser.address,
        mockCreditScore,
        mockScoreBreakdown,
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
  testBenchmarkingSystemSimple().catch(console.error);
}

export { testBenchmarkingSystemSimple };