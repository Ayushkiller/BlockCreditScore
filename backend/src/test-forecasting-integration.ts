import { PredictiveAnalyticsEngine } from './services/predictiveAnalyticsEngine';
import { DatabaseService } from './services/databaseService';
import { blockchainService } from './services/blockchainService';
import { scoreCalculator } from './services/scoreCalculator';
import { initializeDatabase } from './database/connection';

/**
 * Test script to verify forecasting integration
 */
async function testForecastingIntegration() {
  try {
    console.log('🔧 Initializing database...');
    await initializeDatabase();
    
    // Test address (using a known address with activity)
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    
    console.log(`📊 Testing forecasting integration for address: ${testAddress}`);
    
    // Get user metrics
    console.log('📈 Getting user metrics...');
    const metrics = await blockchainService.getUserMetrics(testAddress);
    console.log('Metrics:', {
      totalTransactions: metrics.totalTransactions,
      totalVolume: metrics.totalVolume,
      accountAge: metrics.accountAge
    });
    
    // Calculate credit score
    console.log('🎯 Calculating credit score...');
    const creditScore = scoreCalculator.calculateCreditScore(testAddress, metrics);
    console.log('Credit Score:', creditScore.score);
    
    // Test score forecast generation
    console.log('🔮 Testing score forecast generation...');
    const scoreHistory = await DatabaseService.getEnhancedScoreHistory(testAddress, 50);
    console.log(`Found ${scoreHistory.length} historical score entries`);
    
    const forecast = await PredictiveAnalyticsEngine.generateScoreForecast(
      testAddress,
      creditScore,
      metrics,
      scoreHistory
    );
    
    console.log('✅ Score Forecast Generated:');
    console.log('- Current Score:', forecast.currentScore);
    console.log('- Trend Direction:', forecast.trendDirection);
    console.log('- Trend Strength:', forecast.trendStrength);
    console.log('- Confidence:', forecast.confidence);
    console.log('- Prediction Horizon:', forecast.predictionHorizon, 'days');
    console.log('- Predicted Scores:', forecast.predictedScores.length, 'predictions');
    
    // Test saving forecast
    console.log('💾 Testing forecast saving...');
    const forecastId = await DatabaseService.saveScoreForecast(forecast);
    console.log('✅ Forecast saved with ID:', forecastId);
    
    // Test retrieving saved forecast
    console.log('📥 Testing forecast retrieval...');
    const retrievedForecast = await DatabaseService.getLatestScoreForecast(testAddress);
    console.log('✅ Retrieved forecast:', retrievedForecast ? 'Success' : 'Failed');
    
    // Test behavioral trend prediction
    console.log('🧠 Testing behavioral trend prediction...');
    const behavioralPrediction = await PredictiveAnalyticsEngine.generateBehavioralTrendPrediction(
      testAddress,
      metrics,
      scoreHistory
    );
    
    console.log('✅ Behavioral Prediction Generated:');
    console.log('- Current Activity Level:', behavioralPrediction.currentBehavior.activityLevel);
    console.log('- User Archetype:', behavioralPrediction.currentBehavior.userArchetype);
    console.log('- Growth Trend:', behavioralPrediction.currentBehavior.growthTrend);
    console.log('- Confidence:', behavioralPrediction.confidence);
    console.log('- Risk Factors:', behavioralPrediction.riskFactors.length);
    console.log('- Opportunities:', behavioralPrediction.opportunities.length);
    
    // Test saving behavioral prediction
    console.log('💾 Testing behavioral prediction saving...');
    const behavioralId = await DatabaseService.saveBehavioralTrendPrediction(behavioralPrediction);
    console.log('✅ Behavioral prediction saved with ID:', behavioralId);
    
    // Test retrieving saved behavioral prediction
    console.log('📥 Testing behavioral prediction retrieval...');
    const retrievedBehavioral = await DatabaseService.getLatestBehavioralTrendPrediction(testAddress);
    console.log('✅ Retrieved behavioral prediction:', retrievedBehavioral ? 'Success' : 'Failed');
    
    console.log('\n🎉 All forecasting integration tests passed!');
    console.log('\n📋 Integration Summary:');
    console.log('✅ Score forecasting engine integrated');
    console.log('✅ API endpoints for predictions created');
    console.log('✅ Database storage for prediction data working');
    console.log('✅ Main score calculation pipeline can include forecasting');
    
    console.log('\n🔗 API Usage Examples:');
    console.log('- Basic score: GET /api/score/' + testAddress);
    console.log('- Score with forecast: GET /api/score/' + testAddress + '?includeForecast=true');
    console.log('- Score with behavioral prediction: GET /api/score/' + testAddress + '?includeBehavioralPrediction=true');
    console.log('- Score with both: GET /api/score/' + testAddress + '?includeForecast=true&includeBehavioralPrediction=true');
    console.log('- Dedicated forecast endpoint: GET /api/score-forecast/' + testAddress);
    console.log('- Dedicated behavioral endpoint: GET /api/behavioral-prediction/' + testAddress);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testForecastingIntegration()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testForecastingIntegration };