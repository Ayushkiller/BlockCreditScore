// Integration Example - Demonstrates how to use the scoring engine components together
// This shows the complete workflow from transaction processing to analytics

import { ScoringEngineService } from './scoring-engine-service';
import { AnalyticsService } from './analytics-service';
import { CategorizedTransaction } from '../data-aggregator/transaction-categorizer';
import { TransactionCategory } from '../../types/transactions';
import { getCurrentTimestamp } from '../../utils/time';

/**
 * Example usage of the complete scoring engine system
 */
export async function demonstrateScoringEngine(): Promise<void> {
  console.log('=== CryptoVault Credit Intelligence Scoring Engine Demo ===\n');

  // Initialize services
  const scoringEngine = new ScoringEngineService();
  const analyticsService = new AnalyticsService();

  try {
    // Start the scoring engine
    await scoringEngine.start();
    console.log('✅ Scoring Engine started successfully\n');

    // Example user address
    const userAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1';

    // Create sample transactions for demonstration
    const sampleTransactions: CategorizedTransaction[] = [
      {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 18500000,
        from: userAddress,
        to: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Aave V2
        value: '0x16345785d8a0000', // 0.1 ETH
        input: '0xe8eda9df', // deposit method
        timestamp: getCurrentTimestamp() - 86400000, // 1 day ago
        protocol: 'Aave V2',
        category: TransactionCategory.LENDING,
        creditDimensions: {
          defiReliability: 1.0,
          tradingConsistency: 0.3,
          stakingCommitment: 0,
          governanceParticipation: 0,
          liquidityProvider: 0
        },
        riskScore: 0.2,
        dataWeight: 1.5
      },
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 18500100,
        from: userAddress,
        to: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
        value: '0x6f05b59d3b20000', // 0.5 ETH
        input: '0x38ed1739', // swap method
        timestamp: getCurrentTimestamp() - 43200000, // 12 hours ago
        protocol: 'Uniswap V3',
        category: TransactionCategory.TRADING,
        creditDimensions: {
          defiReliability: 0.4,
          tradingConsistency: 1.0,
          stakingCommitment: 0,
          governanceParticipation: 0,
          liquidityProvider: 0
        },
        riskScore: 0.4,
        dataWeight: 1.2
      },
      {
        hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        blockNumber: 18500200,
        from: userAddress,
        to: '0x0a3f6849f78076aefaDf113F5BED87720274dDC0', // MakerDAO Governance
        value: '0x0', // 0 ETH (governance vote)
        input: '0xa9059cbb', // vote method
        timestamp: getCurrentTimestamp() - 21600000, // 6 hours ago
        protocol: 'MakerDAO Governance',
        category: TransactionCategory.GOVERNANCE,
        creditDimensions: {
          defiReliability: 0.5,
          tradingConsistency: 0,
          stakingCommitment: 0,
          governanceParticipation: 1.0,
          liquidityProvider: 0
        },
        riskScore: 0.1,
        dataWeight: 2.0
      }
    ];

    console.log('📊 Processing sample transactions...\n');

    // Process each transaction through the scoring engine
    for (const [index, transaction] of sampleTransactions.entries()) {
      console.log(`Processing transaction ${index + 1}:`);
      console.log(`  Protocol: ${transaction.protocol}`);
      console.log(`  Category: ${transaction.category}`);
      console.log(`  Risk Score: ${transaction.riskScore}`);

      const updateResult = await scoringEngine.processTransactionUpdate({
        userAddress,
        transaction,
        timestamp: transaction.timestamp,
        priority: 'normal'
      });

      console.log(`  ✅ Updated dimensions: ${updateResult.updatedDimensions.join(', ')}`);
      console.log(`  ⏱️  Processing latency: ${updateResult.updateLatency}ms`);
      console.log(`  🎯 Confidence: ${updateResult.confidence}%`);
      
      if (updateResult.anomaliesDetected.length > 0) {
        console.log(`  ⚠️  Anomalies detected: ${updateResult.anomaliesDetected.length}`);
      }
      
      console.log('');
    }

    // Get the user's credit profile
    console.log('📈 Generating credit profile and analytics...\n');
    const creditProfile = await scoringEngine.calculateCreditProfile(userAddress);

    console.log('Credit Profile Summary:');
    console.log(`  User: ${creditProfile.userAddress}`);
    console.log(`  Last Updated: ${new Date(creditProfile.lastUpdated).toISOString()}`);
    console.log('');

    console.log('Dimension Scores:');
    for (const [dimension, data] of Object.entries(creditProfile.dimensions)) {
      console.log(`  ${dimension}:`);
      console.log(`    Score: ${data.score}/1000`);
      console.log(`    Confidence: ${data.confidence}%`);
      console.log(`    Data Points: ${data.dataPoints}`);
      console.log(`    Trend: ${data.trend}`);
    }
    console.log('');

    // Generate comprehensive analytics
    const analytics = await analyticsService.generateComprehensiveAnalysis(creditProfile);

    console.log('📊 Comprehensive Analytics:');
    console.log(`  Overall Confidence: ${analytics.overallConfidence}%`);
    console.log(`  Data Quality: ${analytics.dataQuality}`);
    console.log(`  Active Dimensions: ${analytics.evolutionSummary.activeDimensions}/5`);
    console.log(`  Overall Trend: ${analytics.evolutionSummary.overallTrend}`);
    console.log(`  Momentum: ${analytics.evolutionSummary.momentum}`);
    console.log(`  Projected Score: ${analytics.evolutionSummary.projectedScore}`);
    
    if (analytics.evolutionSummary.timeToNextTier) {
      console.log(`  Time to Next Tier: ${analytics.evolutionSummary.timeToNextTier} days`);
    }
    console.log('');

    // Show top recommendations
    console.log('🎯 Top Recommendations:');
    for (const [index, rec] of analytics.recommendations.slice(0, 3).entries()) {
      console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`     ${rec.description}`);
      console.log(`     Expected Impact: ${rec.expectedImpact}`);
      console.log('');
    }

    // Show dimension-specific insights
    console.log('🔍 Dimension Insights:');
    for (const dimAnalysis of analytics.dimensionAnalyses) {
      if (dimAnalysis.currentScore > 0) {
        console.log(`  ${dimAnalysis.dimension}:`);
        console.log(`    Current Score: ${dimAnalysis.currentScore}`);
        console.log(`    Trend: ${dimAnalysis.trend.currentTrend} (strength: ${dimAnalysis.trend.trendStrength}%)`);
        console.log(`    Projected: ${dimAnalysis.trend.projectedScore}`);
        
        if (dimAnalysis.opportunities.length > 0) {
          console.log(`    Opportunities: ${dimAnalysis.opportunities[0]}`);
        }
        
        if (dimAnalysis.riskFactors.length > 0) {
          console.log(`    Risk Factors: ${dimAnalysis.riskFactors[0]}`);
        }
        console.log('');
      }
    }

    // Get service status
    const serviceStatus = scoringEngine.getServiceStatus();
    console.log('⚙️  Service Status:');
    console.log(`  Running: ${serviceStatus.isRunning}`);
    console.log(`  Active Profiles: ${serviceStatus.activeProfiles}`);
    console.log(`  Total Updates: ${serviceStatus.totalScoreUpdates}`);
    console.log(`  Average Latency: ${serviceStatus.averageUpdateLatency}ms`);
    console.log(`  Anomalies Detected: ${serviceStatus.anomaliesDetected}`);
    console.log('');

    // Demonstrate quick summary
    const quickSummary = await analyticsService.getQuickSummary(creditProfile);
    console.log('⚡ Quick Summary:');
    console.log(`  Confidence: ${quickSummary.overallConfidence}%`);
    console.log(`  Quality: ${quickSummary.dataQuality}`);
    console.log(`  Active Dimensions: ${quickSummary.activeDimensions}`);
    console.log(`  Trend: ${quickSummary.overallTrend}`);
    console.log(`  Top Recommendation: ${quickSummary.topRecommendation}`);

  } catch (error) {
    console.error('❌ Error during demonstration:', error);
  } finally {
    // Clean up
    await scoringEngine.stop();
    console.log('\n✅ Scoring Engine stopped successfully');
    console.log('\n=== Demo Complete ===');
  }
}

// Export for use in other modules
export { ScoringEngineService, AnalyticsService };