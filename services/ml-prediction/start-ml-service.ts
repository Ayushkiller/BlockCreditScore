/**
 * ML Service Startup Script
 * Starts the ML backend service for credit scoring
 */

const { MLServiceBackend } = require('./ml-service-backend');

const config = {
  port: parseInt(process.env.ML_SERVICE_PORT || '3001'),
  modelPath: process.env.ML_MODEL_PATH || './models/credit-scoring-model',
  autoTrain: process.env.AUTO_TRAIN === 'true',
  updateInterval: parseInt(process.env.UPDATE_INTERVAL || '300000') // 5 minutes
};

async function startMLService() {
  console.log('🚀 Starting ML Service Backend...');
  console.log('Configuration:', config);

  try {
    const mlService = new MLServiceBackend(config);
    await mlService.start();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('📱 Received SIGTERM, shutting down gracefully...');
      await mlService.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📱 Received SIGINT, shutting down gracefully...');
      await mlService.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start ML service:', error);
    process.exit(1);
  }
}

startMLService();
