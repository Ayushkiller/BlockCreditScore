#!/usr/bin/env ts-node

/**
 * Test script for competitive positioning integration
 * Tests the integration of competitive positioning into the benchmarking pipeline
 */

import { blockchainService } from './services/blockchainService';
import { scoreCalculator } from './services/scoreCalculator';
import { BenchmarkingEngine } from './services/benchmarkingEngine';
import { CompetitivePositioningEngine } from './services/competitivePositioningEngine';
import { databaseService } from './services/databaseService';
import { initializeDatabase } from './database/connection';

async function testCompetitivePositioningIntegration() {
  console.log('🚀 Testing Competitive Positioning Integration...\n');

  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Test address (Vitalik's address)
    const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    console.log(`📊 Testing with address: ${testAddress}\n`);

    // Step 1: Get user metrics
    console.log('1️⃣ Getting user metrics...');
    const metrics = await blockchainService.getUserMetrics(testAddress);
    console.log(`   Total transactions: ${metrics.totalTransactions}`);
    console.log(`   Total volume: ${parseFloat(metrics.totalVolume).toFixed(4)} ETH`);
    console.log(`   Account age: ${metrics.accountAge} days`);
    console.log(`   DeFi protocols used: ${metrics.defiProtocolsUsed.length}`);

    // Step 2: Calculate credit score
    console.log('\n2️⃣ Calculating credit score...');
    const creditScore = scoreCalculator.calculateCreditScore(testAddress, metrics);
    const scoreBreakdown = scoreCalculator.generateScoreBreakdown(testAddress, metrics);
    console.log(`   Credit score: ${creditScore.score}`);
    console.log(`   Confidence: ${creditScore.confidence}%`);

    // Step 3: Generate benchmarking data with competitive positioning
    console.log('\n3️⃣ Generating benchmarking data with competitive positioning...');
    const benchmarkingData = await BenchmarkingEngine.generateBenchmarkingData(
      testAddress,
      creditScore,
      scoreBreakdown,
      metrics,
      undefined,
      true // Include competitive positioning
    );

    console.log(`   Peer group: ${benchmarkingData.peerGroupClassification.primaryPeerGroup.name}`);
    console.log(`   Overall percentile: ${benchmarkingData.percentileRankings.overallScore.percentile}%`);
    console.log(`   Market position: ${benchmarkingData.relativePerformance.marketPosition}`);

    // Step 4: Test competitive positioning data
    if (benchmarkingData.competitivePositioning) {
      console.log('\n4️⃣ Competitive positioning analysis:');
      const cp = benchmarkingData.competitivePositioning;
      
      console.log(`   Market rank: ${cp.marketPosition.overallMarketRank} out of ${cp.marketPosition.totalMarketSize}`);
      console.log(`   Market percentile: ${cp.marketPosition.marketPercentile}%`);
      console.log(`   Market segment: ${cp.marketPosition.marketSegment.name}`);
      console.log(`   Competitive quadrant: ${cp.marketPosition.competitiveLandscape.quadrant}`);
      
      console.log(`   Competitive advantages: ${cp.competitiveAdvantages.length}`);
      cp.competitiveAdvantages.slice(0, 2).forEach((advantage, i) => {
        console.log(`     ${i + 1}. ${advantage.area} (${advantage.strength})`);
      });
      
      console.log(`   Market opportunities: ${cp.marketOpportunities.length}`);
      cp.marketOpportunities.slice(0, 2).forEach((opportunity, i) => {
        console.log(`     ${i + 1}. ${opportunity.area} (${opportunity.opportunitySize} opportunity)`);
      });
      
      console.log(`   Competitive threats: ${cp.competitiveThreats.length}`);
      cp.competitiveThreats.slice(0, 2).forEach((threat, i) => {
        console.log(`     ${i + 1}. ${threat.threat} (${threat.severity} severity)`);
      });
      
      console.log(`   Strategic recommendations: ${cp.strategicRecommendations.length}`);
      cp.strategicRecommendations.slice(0, 2).forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec.title} (${rec.priority} priority)`);
      });

      // Step 5: Test database storage
      console.log('\n5️⃣ Testing database storage...');
      const positioningId = await databaseService.saveCompetitivePositioningData(cp);
      console.log(`   Saved competitive positioning data with ID: ${positioningId}`);

      // Step 6: Test data retrieval
      console.log('\n6️⃣ Testing data retrieval...');
      const retrievedData = await databaseService.getLatestCompetitivePositioningData(testAddress);
      console.log(`   Retrieved data for address: ${retrievedData?.address}`);
      console.log(`   Market percentile: ${retrievedData?.marketPosition.marketPercentile}%`);

      const advantages = await databaseService.getCompetitiveAdvantages(testAddress);
      console.log(`   Retrieved ${advantages.length} competitive advantages`);

      const opportunities = await databaseService.getMarketOpportunities(testAddress);
      console.log(`   Retrieved ${opportunities.length} market opportunities`);

      const threats = await databaseService.getCompetitiveThreats(testAddress);
      console.log(`   Retrieved ${threats.length} competitive threats`);

      const recommendations = await databaseService.getStrategicRecommendations(testAddress);
      console.log(`   Retrieved ${recommendations.length} strategic recommendations`);
    }

    console.log('\n✅ Competitive positioning integration test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testCompetitivePositioningIntegration();