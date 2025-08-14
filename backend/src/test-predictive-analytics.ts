import { PredictiveAnalyticsEngine } from './services/predictiveAnalyticsEngine';
import { scoreCalculator } from './services/scoreCalculator';
import { blockchainService } from './services/blockchainService';
import { DatabaseService } from './services/databaseService';
import { initializeDatabase } from './database/connection';

/**
 * Test script for Predictive Analytics Engine
 */
async function testPredictiveAnalytics() {
  console.log('🔮 Testing Predictive Analytics Engine...\n');

  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized\n');

    // Test address (using a known address with transaction history)
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    console.log(`📊 Testing with address: ${testAddress}\n`);

    // Get user metrics
    console.log('📈 Fetching user metrics...');
    const metrics = await blockchainService.getUserMetrics(testAddress);
    console.log(`   Total transactions: ${metrics.totalTransactions}`);
    console.log(`   Total volume: ${parseFloat(metrics.totalVolume).toFixed(4)} ETH`);
    console.log(`   Account age: ${metrics.accountAge} days`);
    console.log(`   DeFi protocols: ${metrics.defiProtocolsUsed.length}\n`);

    // Validate metrics for scoring
    const validation = scoreCalculator.validateMetricsForScoring(metrics);
    if (!validation.isValid) {
      console.log('❌ Insufficient data for testing:', validation.reasons);
      return;
    }

    // Calculate current credit score
    console.log('🎯 Calculating current credit score...');
    const creditScore = scoreCalculator.calculateCreditScore(testAddress, metrics);
    console.log(`   Current score: ${creditScore.score}`);
    console.log(`   Confidence: ${creditScore.confidence}%\n`);

    // Get score history (create some mock data if none exists)
    console.log('📚 Getting score history...');
    let scoreHistory = await DatabaseService.getEnhancedScoreHistory(testAddress, 50);
    
    if (scoreHistory.length === 0) {
      console.log('   No score history found, creating mock data...');
      // Create mock score history for testing
      const now = Math.floor(Date.now() / 1000);
      const mockHistory = [];
      
      for (let i = 30; i >= 0; i--) {
        const timestamp = now - (i * 24 * 60 * 60); // Daily entries for 30 days
        const baseScore = creditScore.score;
        const variation = (Math.random() - 0.5) * 40; // ±20 point variation
        const score = Math.max(0, Math.min(1000, Math.round(baseScore + variation)));
        
        mockHistory.push({
          id: 30 - i,
          address: testAddress,
          score,
          confidence: 80 + Math.random() * 20,
          timestamp,
          version: '1.0',
          volumeScore: Math.round(score * 0.25),
          frequencyScore: Math.round(score * 0.25),
          stakingScore: Math.round(score * 0.25),
          defiScore: Math.round(score * 0.25),
          gasEfficiencyScore: Math.round(score * 0.1),
          consistencyScore: Math.round(score * 0.1),
          diversificationScore: Math.round(score * 0.1),
          riskScore: Math.round(100 - (score / 10)),
          riskLevel: score > 700 ? 'LOW' : score > 400 ? 'MEDIUM' : 'HIGH',
          activityPattern: 'REGULAR',
          userArchetype: 'MODERATE',
          sophisticationLevel: 'INTERMEDIATE',
          growthTrend: 'STABLE',
          calculationTimeMs: 150,
          dataQualityScore: 85
        });
      }
      
      scoreHistory = mockHistory;
      console.log(`   Created ${mockHistory.length} mock history entries\n`);
    } else {
      console.log(`   Found ${scoreHistory.length} historical entries\n`);
    }

    // Test 1: Generate Score Forecast
    console.log('🔮 Test 1: Generating Score Forecast...');
    const forecast = await PredictiveAnalyticsEngine.generateScoreForecast(
      testAddress,
      creditScore,
      metrics,
      scoreHistory
    );

    console.log('   📊 Score Forecast Results:');
    console.log(`   Current Score: ${forecast.currentScore}`);
    console.log(`   Trend Direction: ${forecast.trendDirection}`);
    console.log(`   Trend Strength: ${forecast.trendStrength.toFixed(1)}%`);
    console.log(`   Overall Confidence: ${forecast.confidence}%`);
    console.log(`   Prediction Horizon: ${forecast.predictionHorizon} days`);
    console.log(`   Methodology: ${forecast.methodology}`);
    
    console.log('\n   📈 Predicted Scores:');
    forecast.predictedScores.forEach(pred => {
      console.log(`   ${pred.timeframe}d: ${pred.predictedScore} (${pred.confidenceInterval.lower}-${pred.confidenceInterval.upper}) [${pred.confidence}%]`);
    });

    console.log('\n   🔑 Key Factors:');
    forecast.keyFactors.forEach(factor => console.log(`   • ${factor}`));

    console.log('\n   ⚠️  Uncertainty Factors:');
    forecast.uncertaintyFactors.forEach(factor => console.log(`   • ${factor}`));

    // Save forecast to database
    await DatabaseService.saveScoreForecast(forecast);
    console.log('\n   ✅ Forecast saved to database\n');

    // Test 2: Generate Behavioral Trend Prediction
    console.log('🧠 Test 2: Generating Behavioral Trend Prediction...');
    const behavioralPrediction = await PredictiveAnalyticsEngine.generateBehavioralTrendPrediction(
      testAddress,
      metrics,
      scoreHistory
    );

    console.log('   🎭 Current Behavior Snapshot:');
    console.log(`   Activity Level: ${behavioralPrediction.currentBehavior.activityLevel}%`);
    console.log(`   Consistency Score: ${behavioralPrediction.currentBehavior.consistencyScore}%`);
    console.log(`   Diversification Level: ${behavioralPrediction.currentBehavior.diversificationLevel}%`);
    console.log(`   Risk Profile: ${behavioralPrediction.currentBehavior.riskProfile}`);
    console.log(`   Sophistication Level: ${behavioralPrediction.currentBehavior.sophisticationLevel}`);
    console.log(`   Growth Trend: ${behavioralPrediction.currentBehavior.growthTrend}`);

    console.log('\n   📊 Trend Analysis:');
    console.log(`   Momentum: ${behavioralPrediction.trendAnalysis.momentum.toFixed(1)}`);
    console.log(`   Acceleration: ${behavioralPrediction.trendAnalysis.acceleration.toFixed(1)}`);
    console.log(`   Volatility: ${behavioralPrediction.trendAnalysis.volatility.toFixed(1)}`);

    console.log('\n   🔮 Behavioral Predictions:');
    behavioralPrediction.predictedBehavior.forEach(pred => {
      console.log(`   ${pred.timeframe}d: Activity ${pred.predictedActivityLevel.toFixed(0)}%, Consistency ${pred.predictedConsistency.toFixed(0)}%, Risk ${pred.predictedRiskProfile} [${pred.confidence.toFixed(0)}%]`);
    });

    console.log('\n   ⚠️  Risk Factors:');
    behavioralPrediction.riskFactors.forEach(risk => {
      console.log(`   • ${risk.factor} (${risk.impact} impact, ${risk.probability}% probability, ${risk.timeframe})`);
    });

    console.log('\n   🎯 Opportunities:');
    behavioralPrediction.opportunities.forEach(opp => {
      console.log(`   • ${opp.opportunity} (${opp.potential} potential, ${opp.probability}% probability, ${opp.timeframe})`);
    });

    // Save behavioral prediction to database
    await DatabaseService.saveBehavioralTrendPrediction(behavioralPrediction);
    console.log('\n   ✅ Behavioral prediction saved to database\n');

    // Test 3: Model Performance (simulate some accuracy data)
    console.log('📊 Test 3: Testing Model Performance Tracking...');
    
    // Create a mock prediction for accuracy testing
    const mockPrediction = {
      address: testAddress,
      predictionDate: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // 7 days ago
      targetDate: Math.floor(Date.now() / 1000),
      predictedScore: creditScore.score + 10,
      confidenceInterval: {
        lower: creditScore.score - 20,
        upper: creditScore.score + 40
      },
      confidence: 75,
      methodology: 'Time Series Analysis with Behavioral Factors',
      factors: ['Transaction volume trend', 'Consistency pattern', 'DeFi engagement']
    };

    // Save mock prediction
    const predictionId = await DatabaseService.savePrediction(mockPrediction);
    console.log(`   Created mock prediction: ${predictionId}`);

    // Test accuracy tracking
    const accuracyResult = await PredictiveAnalyticsEngine.trackPredictionAccuracy(
      predictionId,
      testAddress,
      creditScore.score // Use current score as "actual"
    );

    console.log('   📈 Accuracy Results:');
    console.log(`   Predicted: ${accuracyResult.predictedScore}`);
    console.log(`   Actual: ${accuracyResult.actualScore}`);
    console.log(`   Accuracy: ${accuracyResult.accuracy.toFixed(1)}%`);
    console.log(`   Absolute Error: ${accuracyResult.absoluteError.toFixed(1)}`);
    console.log(`   Relative Error: ${accuracyResult.relativeError.toFixed(1)}%`);
    console.log(`   Within Confidence Interval: ${accuracyResult.wasWithinInterval ? 'Yes' : 'No'}`);

    // Get model performance
    const modelPerformance = await PredictiveAnalyticsEngine.getModelPerformance();
    console.log('\n   🎯 Model Performance:');
    modelPerformance.forEach(model => {
      console.log(`   Model: ${model.modelName} v${model.version}`);
      console.log(`   Total Predictions: ${model.totalPredictions}`);
      console.log(`   Average Accuracy: ${model.averageAccuracy.toFixed(1)}%`);
      console.log(`   CI Accuracy: ${model.confidenceIntervalAccuracy.toFixed(1)}%`);
      console.log(`   Recommendations: ${model.recommendations.length}`);
    });

    console.log('\n✅ All Predictive Analytics tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testPredictiveAnalytics()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed with error:', error);
      process.exit(1);
    });
}

export { testPredictiveAnalytics };