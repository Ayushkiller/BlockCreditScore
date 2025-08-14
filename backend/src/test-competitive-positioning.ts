import { CompetitivePositioningEngine } from './services/competitivePositioningEngine';
import { BenchmarkingEngine } from './services/benchmarkingEngine';
import { ScoreCalculator } from './services/scoreCalculator';
import { UserMetrics, TransactionData } from './services/blockchainService';

/**
 * Test the Competitive Positioning Engine
 */
async function testCompetitivePositioning() {
  console.log('🎯 Testing Competitive Positioning Engine...\n');

  // Test data - DeFi Native user
  const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C';
  const testMetrics: UserMetrics = {
    totalVolume: '125.5',
    totalTransactions: 450,
    stakingBalance: '25.0',
    defiProtocolsUsed: [
      'Uniswap V3', 'Aave', 'Compound', 'MakerDAO', 'Curve', 
      'Balancer', 'SushiSwap', 'Yearn', 'Convex', 'Lido',
      '1inch', 'Paraswap'
    ],
    accountAge: 520,
    avgTransactionValue: '0.279',
    firstTransactionDate: Math.floor(Date.now() / 1000) - (520 * 24 * 60 * 60),
    lastTransactionDate: Math.floor(Date.now() / 1000) - 86400
  };

  const testTransactionHistory: TransactionData[] = [
    {
      hash: '0x123',
      timestamp: Math.floor(Date.now() / 1000) - 86400,
      value: '2.5',
      gasUsed: '150000',
      gasPrice: '20000000000',
      to: '0xA0b86a33E6441e8e5c3F27d9C5C8e6c5d8e9f0a1',
      from: testAddress,
      blockNumber: 18500000
    }
  ];

  try {
    // Calculate credit score and breakdown
    console.log('📊 Calculating credit score and breakdown...');
    const creditScore = await ScoreCalculator.calculateCreditScore(testAddress, testMetrics);
    const scoreBreakdown = ScoreCalculator.generateScoreBreakdown(testAddress, testMetrics);
    
    console.log(`Credit Score: ${creditScore.score}/1000 (${creditScore.confidence}% confidence)`);
    console.log(`Risk Level: ${scoreBreakdown.riskAssessment.riskLevel}\n`);

    // Generate benchmarking data
    console.log('📈 Generating benchmarking data...');
    const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
      testAddress,
      creditScore,
      scoreBreakdown,
      testMetrics,
      testTransactionHistory
    );
    
    console.log(`Peer Group: ${benchmarkingData.peerGroupClassification.primaryPeerGroup.name}`);
    console.log(`Overall Percentile: ${benchmarkingData.percentileRankings.overallScore.percentile}th`);
    console.log(`Market Position: ${benchmarkingData.relativePerformance.marketPosition}\n`);

    // Generate competitive positioning analysis
    console.log('🎯 Generating competitive positioning analysis...');
    const competitivePositioning = await CompetitivePositioningEngine.generateCompetitivePositioning(
      testAddress,
      creditScore,
      scoreBreakdown,
      testMetrics,
      benchmarkingData,
      testTransactionHistory
    );

    // Display results
    console.log('='.repeat(80));
    console.log('🏆 COMPETITIVE POSITIONING ANALYSIS');
    console.log('='.repeat(80));

    // Market Position Analysis
    console.log('\n📍 MARKET POSITION ANALYSIS');
    console.log('-'.repeat(40));
    const mp = competitivePositioning.marketPosition;
    console.log(`Overall Market Rank: #${mp.overallMarketRank.toLocaleString()} out of ${mp.totalMarketSize.toLocaleString()}`);
    console.log(`Market Percentile: ${mp.marketPercentile}th percentile`);
    console.log(`Market Segment: ${mp.marketSegment.name}`);
    console.log(`  - Description: ${mp.marketSegment.description}`);
    console.log(`  - Segment Size: ${mp.marketSegment.marketSize.toLocaleString()} users`);
    console.log(`  - Average Score: ${mp.marketSegment.averageScore}`);
    console.log(`  - Growth Rate: ${mp.marketSegment.growthRate}%`);
    console.log(`  - Competition Level: ${mp.marketSegment.competitionLevel}`);
    
    console.log(`\nCompetitive Landscape Position: ${mp.competitiveLandscape.quadrant}`);
    console.log(`  - Execution Capability: ${mp.competitiveLandscape.position.x}/100`);
    console.log(`  - Vision/Innovation: ${mp.competitiveLandscape.position.y}/100`);
    console.log(`  - Differentiation Factors:`);
    mp.competitiveLandscape.differentiationFactors.forEach(factor => {
      console.log(`    • ${factor}`);
    });

    console.log(`\nMarket Share Analysis:`);
    console.log(`  - Volume Share: ${mp.marketShare.volumeShare.toFixed(4)}%`);
    console.log(`  - Activity Share: ${mp.marketShare.activityShare.toFixed(4)}%`);
    console.log(`  - Staking Share: ${mp.marketShare.stakingShare.toFixed(4)}%`);
    console.log(`  - DeFi Share: ${mp.marketShare.defiShare.toFixed(4)}%`);
    console.log(`  - Growth Potential: ${mp.marketShare.growthPotential}%`);

    // Trend Comparison Analysis
    console.log('\n📈 TREND COMPARISON ANALYSIS');
    console.log('-'.repeat(40));
    const tc = competitivePositioning.trendComparison;
    console.log(`User Trends:`);
    console.log(`  - Score Growth Rate: ${tc.userTrends.scoreGrowthRate.toFixed(1)}%`);
    console.log(`  - Volume Growth Rate: ${tc.userTrends.volumeGrowthRate.toFixed(1)}%`);
    console.log(`  - Activity Growth Rate: ${tc.userTrends.activityGrowthRate.toFixed(1)}%`);
    console.log(`  - Consistency Trend: ${tc.userTrends.consistencyTrend}`);
    console.log(`  - Innovation Index: ${tc.userTrends.innovationIndex}/100`);

    console.log(`\nMarket Comparison:`);
    console.log(`  - Relative Velocity: ${tc.trendVelocity.relativeVelocity.toFixed(1)}% vs market`);
    console.log(`  - Acceleration Index: ${tc.trendVelocity.accelerationIndex}/100`);
    console.log(`  - Momentum Score: ${tc.trendVelocity.momentumScore}/100`);
    console.log(`  - Velocity Ranking: ${tc.trendVelocity.velocityRanking}th percentile`);

    console.log(`\nTrend Positioning: ${tc.trendPositioning.category}`);
    console.log(`  - Description: ${tc.trendPositioning.description}`);
    console.log(`  - Key Implications:`);
    tc.trendPositioning.implications.forEach(implication => {
      console.log(`    • ${implication}`);
    });

    // Competitive Advantages
    console.log('\n🏅 COMPETITIVE ADVANTAGES');
    console.log('-'.repeat(40));
    if (competitivePositioning.competitiveAdvantages.length > 0) {
      competitivePositioning.competitiveAdvantages.forEach((advantage, index) => {
        console.log(`${index + 1}. ${advantage.area} (${advantage.strength})`);
        console.log(`   Type: ${advantage.advantageType}`);
        console.log(`   Market Gap: ${advantage.marketGap.toFixed(1)} percentile points`);
        console.log(`   Defensibility: ${advantage.defensibility}/100`);
        console.log(`   Monetization Potential: ${advantage.monetizationPotential}`);
        console.log(`   Description: ${advantage.description}`);
        console.log(`   Supporting Metrics:`);
        advantage.supportingMetrics.forEach(metric => {
          console.log(`     • ${metric}`);
        });
        console.log('');
      });
    } else {
      console.log('No significant competitive advantages identified.');
    }

    // Market Opportunities
    console.log('\n🎯 MARKET OPPORTUNITIES');
    console.log('-'.repeat(40));
    if (competitivePositioning.marketOpportunities.length > 0) {
      competitivePositioning.marketOpportunities.slice(0, 3).forEach((opportunity, index) => {
        console.log(`${index + 1}. ${opportunity.area} (${opportunity.opportunitySize})`);
        console.log(`   Difficulty: ${opportunity.difficulty}`);
        console.log(`   Time to Capture: ${opportunity.timeToCapture}`);
        console.log(`   Market Demand: ${opportunity.marketDemand}/100`);
        console.log(`   Competition Level: ${opportunity.competitionLevel}`);
        console.log(`   Potential Impact:`);
        console.log(`     • Score Improvement: +${opportunity.potentialImpact.scoreImprovement} points`);
        console.log(`     • Market Position Gain: +${opportunity.potentialImpact.marketPositionGain}%`);
        console.log(`     • Competitive Advantage Gain: +${opportunity.potentialImpact.competitiveAdvantageGain}%`);
        console.log(`   Description: ${opportunity.description}`);
        console.log(`   Action Plan:`);
        opportunity.actionPlan.forEach(action => {
          console.log(`     • ${action}`);
        });
        console.log('');
      });
    } else {
      console.log('No significant market opportunities identified.');
    }

    // Competitive Threats
    console.log('\n⚠️  COMPETITIVE THREATS');
    console.log('-'.repeat(40));
    if (competitivePositioning.competitiveThreats.length > 0) {
      competitivePositioning.competitiveThreats.slice(0, 3).forEach((threat, index) => {
        console.log(`${index + 1}. ${threat.threat} (${threat.severity})`);
        console.log(`   Probability: ${threat.probability}%`);
        console.log(`   Timeframe: ${threat.timeframe}`);
        console.log(`   Impact Areas: ${threat.impactAreas.join(', ')}`);
        console.log(`   Potential Loss:`);
        console.log(`     • Score Impact: -${threat.potentialLoss.scoreImpact} points`);
        console.log(`     • Market Position Loss: -${threat.potentialLoss.marketPositionLoss}%`);
        console.log(`     • Competitive Disadvantage: -${threat.potentialLoss.competitiveDisadvantage}%`);
        console.log(`   Description: ${threat.description}`);
        console.log(`   Mitigation Strategies:`);
        threat.mitigationStrategies.forEach(strategy => {
          console.log(`     • ${strategy}`);
        });
        console.log('');
      });
    } else {
      console.log('No significant competitive threats identified.');
    }

    // Strategic Recommendations
    console.log('\n🎯 STRATEGIC RECOMMENDATIONS');
    console.log('-'.repeat(40));
    if (competitivePositioning.strategicRecommendations.length > 0) {
      competitivePositioning.strategicRecommendations.slice(0, 3).forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation.title} (${recommendation.priority})`);
        console.log(`   Category: ${recommendation.category}`);
        console.log(`   Description: ${recommendation.description}`);
        console.log(`   Rationale: ${recommendation.rationale}`);
        console.log(`   Expected Outcome: ${recommendation.expectedOutcome}`);
        console.log(`   Implementation:`);
        console.log(`     • Timeline: ${recommendation.implementation.timeline}`);
        console.log(`     • Key Steps:`);
        recommendation.implementation.steps.slice(0, 3).forEach(step => {
          console.log(`       - ${step}`);
        });
        console.log(`   Success Metrics:`);
        recommendation.successMetrics.slice(0, 2).forEach(metric => {
          console.log(`     • ${metric}`);
        });
        console.log('');
      });
    } else {
      console.log('No strategic recommendations generated.');
    }

    console.log('='.repeat(80));
    console.log('✅ Competitive positioning analysis completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error testing competitive positioning:', error);
    throw error;
  }
}

// Test different user profiles
async function testMultipleProfiles() {
  console.log('\n🔄 Testing Multiple User Profiles...\n');

  const profiles = [
    {
      name: 'Institutional Whale',
      metrics: {
        totalVolume: '5000.0',
        totalTransactions: 150,
        stakingBalance: '2000.0',
        defiProtocolsUsed: ['Lido', 'Aave', 'Compound', 'MakerDAO'],
        accountAge: 800,
        avgTransactionValue: '33.33',
        firstTransactionDate: Math.floor(Date.now() / 1000) - (800 * 24 * 60 * 60),
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400
      }
    },
    {
      name: 'Emerging User',
      metrics: {
        totalVolume: '15.5',
        totalTransactions: 45,
        stakingBalance: '5.0',
        defiProtocolsUsed: ['Uniswap V3', 'Lido'],
        accountAge: 120,
        avgTransactionValue: '0.344',
        firstTransactionDate: Math.floor(Date.now() / 1000) - (120 * 24 * 60 * 60),
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400
      }
    },
    {
      name: 'Active Trader',
      metrics: {
        totalVolume: '200.0',
        totalTransactions: 800,
        stakingBalance: '10.0',
        defiProtocolsUsed: ['Uniswap V3', '1inch', 'SushiSwap', 'Balancer', 'Curve'],
        accountAge: 400,
        avgTransactionValue: '0.25',
        firstTransactionDate: Math.floor(Date.now() / 1000) - (400 * 24 * 60 * 60),
        lastTransactionDate: Math.floor(Date.now() / 1000) - 86400
      }
    }
  ];

  for (const profile of profiles) {
    console.log(`\n📊 Testing ${profile.name} Profile:`);
    console.log('-'.repeat(50));
    
    try {
      const testAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      const creditScore = await ScoreCalculator.calculateCreditScore(testAddress, profile.metrics);
      const scoreBreakdown = ScoreCalculator.generateScoreBreakdown(testAddress, profile.metrics);
      const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
        testAddress, creditScore, scoreBreakdown, profile.metrics
      );
      const competitivePositioning = await CompetitivePositioningEngine.generateCompetitivePositioning(
        testAddress, creditScore, scoreBreakdown, profile.metrics, benchmarkingData
      );

      console.log(`Credit Score: ${creditScore.score}/1000`);
      console.log(`Market Segment: ${competitivePositioning.marketPosition.marketSegment.name}`);
      console.log(`Market Percentile: ${competitivePositioning.marketPosition.marketPercentile}th`);
      console.log(`Competitive Quadrant: ${competitivePositioning.marketPosition.competitiveLandscape.quadrant}`);
      console.log(`Trend Category: ${competitivePositioning.trendComparison.trendPositioning.category}`);
      console.log(`Competitive Advantages: ${competitivePositioning.competitiveAdvantages.length}`);
      console.log(`Market Opportunities: ${competitivePositioning.marketOpportunities.length}`);
      console.log(`Strategic Recommendations: ${competitivePositioning.strategicRecommendations.length}`);
      
    } catch (error) {
      console.error(`❌ Error testing ${profile.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
}

// Run tests
async function runTests() {
  try {
    await testCompetitivePositioning();
    await testMultipleProfiles();
    console.log('\n🎉 All competitive positioning tests completed successfully!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runTests();
}

export { testCompetitivePositioning, testMultipleProfiles };