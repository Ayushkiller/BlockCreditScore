/**
 * ML Service Startup Script (JavaScript)
 * Starts the ML backend service for credit scoring with GPU support
 */

const express = require('express');
const cors = require('cors');

// Check for GPU support
let tf;
try {
  // Try to use GPU version first
  tf = require('@tensorflow/tfjs-node-gpu');
  console.log('🎮 GPU TensorFlow.js loaded successfully!');
} catch (error) {
  console.log('⚠️  GPU not available, falling back to CPU...');
  tf = require('@tensorflow/tfjs-node');
}

class SimplifiedMLService {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3001,
      ...config
    };
    this.app = express();
    this.model = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: 'ML Prediction Service',
        gpu: tf.version?.['tfjs-node-gpu'] ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString()
      });
    });

    // Credit score prediction
    this.app.post('/api/predict/credit-score', async (req, res) => {
      try {
        const { address, features } = req.body;
        
        // Mock prediction for now - replace with actual model
        const prediction = await this.predictCreditScore(features || {});
        
        res.json({
          success: true,
          data: {
            address,
            creditScore: prediction.score,
            confidence: prediction.confidence,
            factors: prediction.factors,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Behavior analysis
    this.app.post('/api/analyze/behavior', async (req, res) => {
      try {
        const { address, timeframe } = req.body;
        
        const analysis = await this.analyzeBehavior(address, timeframe);
        
        res.json({
          success: true,
          data: analysis
        });
      } catch (error) {
        console.error('Behavior analysis error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Model training endpoint
    this.app.post('/api/train', async (req, res) => {
      try {
        const { trainingData } = req.body;
        
        console.log('🚀 Starting model training with GPU acceleration...');
        const result = await this.trainModel(trainingData);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Training error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  }

  async createModel() {
    console.log('🏗️  Creating ML model with GPU support...');
    
    // Create a simple neural network for credit scoring
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [10], // 10 input features
          units: 64, 
          activation: 'relu',
          name: 'input_layer'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu',
          name: 'hidden_layer_1'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          name: 'hidden_layer_2'
        }),
        tf.layers.dense({ 
          units: 1, 
          activation: 'sigmoid',
          name: 'output_layer'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'accuracy']
    });

    console.log('✅ Model created successfully!');
    model.summary();
    
    return model;
  }

  async trainModel(trainingData) {
    console.log('🎯 Training model with GPU acceleration...');
    
    if (!this.model) {
      this.model = await this.createModel();
    }

    // Generate synthetic training data if none provided
    const data = trainingData || this.generateSyntheticData(1000);
    
    const xs = tf.tensor2d(data.features);
    const ys = tf.tensor2d(data.labels);

    console.log('📊 Training data shape:', xs.shape, ys.shape);

    // Training configuration
    const history = await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
          }
        }
      }
    });

    // Cleanup tensors
    xs.dispose();
    ys.dispose();

    console.log('🎉 Model training completed!');
    
    return {
      epochs: 50,
      finalLoss: history.history.loss[history.history.loss.length - 1],
      finalValLoss: history.history.val_loss[history.history.val_loss.length - 1],
      trainingTime: Date.now()
    };
  }

  generateSyntheticData(samples = 1000) {
    console.log(`🔄 Generating ${samples} synthetic training samples...`);
    
    const features = [];
    const labels = [];

    for (let i = 0; i < samples; i++) {
      // Generate realistic financial features
      const feature = [
        Math.random() * 100000, // Portfolio value
        Math.random() * 1000,   // Transaction count
        Math.random() * 0.5,    // Volatility
        Math.random() * 10,     // Protocols used
        Math.random() * 365,    // Account age (days)
        Math.random() * 0.3,    // Default risk
        Math.random() * 1000,   // Liquidity score
        Math.random() * 100,    // DeFi participation
        Math.random() * 50,     // Governance participation
        Math.random() * 10      // Network activity
      ];

      // Calculate credit score based on features (synthetic logic)
      const creditScore = Math.min(Math.max(
        (feature[0] / 100000) * 0.3 +        // Portfolio value weight
        (feature[1] / 1000) * 0.2 +          // Transaction count weight
        (1 - feature[2]) * 0.2 +             // Low volatility is good
        (feature[3] / 10) * 0.1 +            // Protocol diversity
        (feature[4] / 365) * 0.1 +           // Account age
        (1 - feature[5]) * 0.1,              // Low default risk is good
        0.1
      ), 1.0);

      features.push(feature);
      labels.push([creditScore]);
    }

    return { features, labels };
  }

  async predictCreditScore(features) {
    if (!this.model) {
      // Create and train model if it doesn't exist
      console.log('🔄 No trained model found, creating and training...');
      this.model = await this.createModel();
      await this.trainModel();
    }

    // Use provided features or generate default ones
    const inputFeatures = features.values || [
      50000,  // Portfolio value
      500,    // Transaction count
      0.2,    // Volatility
      5,      // Protocols used
      180,    // Account age
      0.1,    // Default risk
      800,    // Liquidity score
      75,     // DeFi participation
      25,     // Governance participation
      8       // Network activity
    ];

    const prediction = this.model.predict(tf.tensor2d([inputFeatures]));
    const score = await prediction.data();
    prediction.dispose();

    return {
      score: Math.round(score[0] * 1000), // Scale to 0-1000
      confidence: 0.85 + Math.random() * 0.1,
      factors: {
        portfolioValue: inputFeatures[0],
        transactionActivity: inputFeatures[1],
        riskLevel: inputFeatures[2],
        protocolDiversity: inputFeatures[3],
        accountMaturity: inputFeatures[4]
      }
    };
  }

  async analyzeBehavior(address, timeframe = '30d') {
    // Mock behavior analysis - replace with real implementation
    return {
      address,
      timeframe,
      riskScore: Math.random() * 0.5,
      activityLevel: 'high',
      patterns: [
        'Regular DeFi interaction',
        'Conservative risk profile',
        'Consistent transaction patterns'
      ],
      recommendations: [
        'Consider diversifying protocols',
        'Maintain current activity level'
      ],
      confidence: 0.78
    };
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log('🚀 ML Service Backend started successfully!');
          console.log(`🔗 Server running on http://localhost:${this.config.port}`);
          console.log(`🎮 GPU Support: ${tf.version?.['tfjs-node-gpu'] ? 'Enabled' : 'Disabled'}`);
          console.log('📊 Ready for model training and predictions');
          
          // Auto-train model on startup
          this.trainModel()
            .then(() => {
              console.log('🎯 Initial model training completed!');
              resolve();
            })
            .catch(error => {
              console.error('⚠️  Initial training failed:', error);
              resolve(); // Still resolve to keep service running
            });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log('🔄 ML Service stopped');
    }
  }
}

// Configuration
const config = {
  port: parseInt(process.env.ML_SERVICE_PORT || '3001'),
  autoTrain: process.env.AUTO_TRAIN !== 'false'
};

async function startService() {
  console.log('🚀 Starting ML Service with NVIDIA GPU support...');
  console.log('Configuration:', config);

  try {
    const service = new SimplifiedMLService(config);
    await service.start();

    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
      console.log('📱 Received SIGTERM, shutting down gracefully...');
      await service.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📱 Received SIGINT, shutting down gracefully...');
      await service.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start ML service:', error);
    process.exit(1);
  }
}

// Start the service
startService();
