/**
 * Credit Scoring ML Model
 * Full implementation of ML models for credit scoring
 * Removes all privacy toggles and provides direct ML outputs
 */

import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';

export interface CreditFeatures {
  // Transaction Features
  totalTransactions: number;
  avgTransactionAmount: number;
  transactionFrequency: number;
  gasEfficiency: number;
  protocolDiversity: number;
  
  // DeFi Activity Features
  stakingScore: number;
  liquidityProviderScore: number;
  borrowingHistory: number;
  liquidationCount: number;
  
  // Behavior Features
  consistencyScore: number;
  riskTolerance: number;
  governanceParticipation: number;
  
  // Market Context Features
  marketVolatility: number;
  liquidityIndex: number;
  tvlExposure: number;
}

export interface CreditScorePrediction {
  overallScore: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  contributingFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  modelVersion: string;
  timestamp: number;
}

export interface ModelTrainingData {
  features: CreditFeatures[];
  labels: number[];
  validationSplit: number;
}

export interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number;
  mae: number;
  trainingLoss: number[];
  validationLoss: number[];
  lastTrained: number;
  trainingDataSize: number;
}

export class CreditScoringMLModel extends EventEmitter {
  private model: tf.LayersModel | null = null;
  private featureScaler: any = null;
  private labelScaler: any = null;
  private modelVersion: string = '1.0.0';
  private isInitialized: boolean = false;
  private trainingHistory: ModelPerformanceMetrics[] = [];
  
  // Model architecture configuration
  private readonly CONFIG = {
    inputDim: 13, // Number of features
    hiddenLayers: [64, 32, 16],
    outputDim: 1,
    dropout: 0.3,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2
  };

  constructor() {
    super();
    this.initializeModel();
  }

  /**
   * Initialize the ML model architecture
   */
  private async initializeModel(): Promise<void> {
    try {
      console.log('🧠 Initializing Credit Scoring ML Model...');
      
      // Create sequential model for credit scoring
      this.model = tf.sequential({
        layers: [
          // Input layer
          tf.layers.dense({
            inputShape: [this.CONFIG.inputDim],
            units: this.CONFIG.hiddenLayers[0],
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          tf.layers.dropout({ rate: this.CONFIG.dropout }),
          
          // Hidden layers
          tf.layers.dense({
            units: this.CONFIG.hiddenLayers[1],
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          tf.layers.dropout({ rate: this.CONFIG.dropout }),
          
          tf.layers.dense({
            units: this.CONFIG.hiddenLayers[2],
            activation: 'relu',
            kernelInitializer: 'heNormal'
          }),
          tf.layers.dropout({ rate: this.CONFIG.dropout / 2 }),
          
          // Output layer (credit score 0-1000)
          tf.layers.dense({
            units: this.CONFIG.outputDim,
            activation: 'sigmoid',
            kernelInitializer: 'glorotNormal'
          })
        ]
      });

      // Compile model
      this.model.compile({
        optimizer: tf.train.adam(this.CONFIG.learningRate),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae']
      });

      console.log('✅ Model architecture initialized');
      console.log(`📊 Model summary: ${this.model.countParams()} parameters`);
      
      this.isInitialized = true;
      this.emit('modelInitialized');

    } catch (error) {
      console.error('❌ Failed to initialize ML model:', error);
      throw error;
    }
  }

  /**
   * Train the model with real data
   */
  public async trainModel(data: ModelTrainingData): Promise<ModelPerformanceMetrics> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    console.log('🏋️ Starting model training...');
    console.log(`📊 Training data size: ${data.features.length} samples`);

    try {
      // Prepare training data
      const { trainX, trainY, valX, valY } = this.prepareTrainingData(data);

      // Train model
      const history = await this.model.fit(trainX, trainY, {
        epochs: this.CONFIG.epochs,
        batchSize: this.CONFIG.batchSize,
        validationData: [valX, valY],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss=${logs?.loss?.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}`);
            }
          }
        }
      });

      // Calculate performance metrics
      const predictions = this.model.predict(valX) as tf.Tensor;
      const metrics = await this.calculateMetrics(valY, predictions);

      // Update model version
      this.modelVersion = `${Date.now()}-trained`;
      
      // Store training history
      const performanceMetrics: ModelPerformanceMetrics = {
        ...metrics,
        trainingLoss: history.history.loss as number[],
        validationLoss: history.history.val_loss as number[],
        lastTrained: Date.now(),
        trainingDataSize: data.features.length
      };

      this.trainingHistory.push(performanceMetrics);

      console.log('✅ Model training completed');
      console.log(`📈 Final accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      console.log(`📉 Final loss: ${metrics.mse.toFixed(4)}`);

      // Cleanup tensors
      trainX.dispose();
      trainY.dispose();
      valX.dispose();
      valY.dispose();
      predictions.dispose();

      this.emit('modelTrained', performanceMetrics);
      return performanceMetrics;

    } catch (error) {
      console.error('❌ Model training failed:', error);
      throw error;
    }
  }

  /**
   * Predict credit score for given features
   */
  public async predictCreditScore(features: CreditFeatures): Promise<CreditScorePrediction> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Prepare features
      const processedFeatures = this.preprocessFeatures(features);
      const featureTensor = tf.tensor2d([processedFeatures]);

      // Make prediction
      const prediction = this.model.predict(featureTensor) as tf.Tensor;
      const scoreArray = await prediction.data();
      const normalizedScore = scoreArray[0];
      
      // Scale to 0-1000 range
      const creditScore = Math.round(normalizedScore * 1000);
      
      // Calculate confidence based on model certainty
      const confidence = this.calculatePredictionConfidence(processedFeatures, normalizedScore);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(creditScore);
      
      // Generate contributing factors
      const contributingFactors = this.generateContributingFactors(features, creditScore);

      // Cleanup tensors
      featureTensor.dispose();
      prediction.dispose();

      const result: CreditScorePrediction = {
        overallScore: creditScore,
        confidence: Math.round(confidence * 100),
        riskLevel,
        contributingFactors,
        modelVersion: this.modelVersion,
        timestamp: Date.now()
      };

      this.emit('predictionMade', result);
      return result;

    } catch (error) {
      console.error('❌ Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Get real-time score updates for continuous monitoring
   */
  public async getRealTimeScoreUpdate(
    features: CreditFeatures,
    previousScore?: number
  ): Promise<{
    score: number;
    confidence: number;
    changeFromPrevious: number;
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: number;
  }> {
    const prediction = await this.predictCreditScore(features);
    const changeFromPrevious = previousScore ? prediction.overallScore - previousScore : 0;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (changeFromPrevious > 10) trend = 'improving';
    else if (changeFromPrevious < -10) trend = 'declining';

    return {
      score: prediction.overallScore,
      confidence: prediction.confidence,
      changeFromPrevious,
      trend,
      lastUpdated: Date.now()
    };
  }

  /**
   * Preprocess features for model input
   */
  private preprocessFeatures(features: CreditFeatures): number[] {
    return [
      // Normalize transaction features
      Math.min(features.totalTransactions / 1000, 1),
      Math.min(features.avgTransactionAmount / 10, 1),
      Math.min(features.transactionFrequency / 100, 1),
      features.gasEfficiency,
      features.protocolDiversity,
      
      // DeFi activity features (already normalized 0-1)
      features.stakingScore,
      features.liquidityProviderScore,
      features.borrowingHistory,
      Math.min(features.liquidationCount / 10, 1),
      
      // Behavior features
      features.consistencyScore,
      features.riskTolerance,
      features.governanceParticipation,
      
      // Market context features
      features.marketVolatility
    ];
  }

  /**
   * Prepare training data tensors
   */
  private prepareTrainingData(data: ModelTrainingData): {
    trainX: tf.Tensor2D;
    trainY: tf.Tensor2D;
    valX: tf.Tensor2D;
    valY: tf.Tensor2D;
  } {
    // Process features
    const processedFeatures = data.features.map(f => this.preprocessFeatures(f));
    
    // Normalize labels to 0-1 range
    const normalizedLabels = data.labels.map(label => label / 1000);
    
    // Split data
    const splitIndex = Math.floor(data.features.length * (1 - data.validationSplit));
    
    const trainFeatures = processedFeatures.slice(0, splitIndex);
    const trainLabels = normalizedLabels.slice(0, splitIndex);
    const valFeatures = processedFeatures.slice(splitIndex);
    const valLabels = normalizedLabels.slice(splitIndex);

    return {
      trainX: tf.tensor2d(trainFeatures),
      trainY: tf.tensor2d(trainLabels, [trainLabels.length, 1]),
      valX: tf.tensor2d(valFeatures),
      valY: tf.tensor2d(valLabels, [valLabels.length, 1])
    };
  }

  /**
   * Calculate model performance metrics
   */
  private async calculateMetrics(
    yTrue: tf.Tensor2D,
    yPred: tf.Tensor2D
  ): Promise<Omit<ModelPerformanceMetrics, 'trainingLoss' | 'validationLoss' | 'lastTrained' | 'trainingDataSize'>> {
    const trueArray = await yTrue.data();
    const predArray = await yPred.data();
    
    const n = trueArray.length;
    let sumSquaredError = 0;
    let sumAbsoluteError = 0;
    let correctPredictions = 0;
    
    for (let i = 0; i < n; i++) {
      const error = trueArray[i] - predArray[i];
      sumSquaredError += error * error;
      sumAbsoluteError += Math.abs(error);
      
      // Consider prediction correct if within 5% of true value
      if (Math.abs(error) < 0.05) {
        correctPredictions++;
      }
    }

    const mse = sumSquaredError / n;
    const mae = sumAbsoluteError / n;
    const accuracy = correctPredictions / n;

    return {
      accuracy,
      precision: accuracy, // Simplified for regression
      recall: accuracy,
      f1Score: accuracy,
      mse,
      mae
    };
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(features: number[], prediction: number): number {
    // Base confidence on feature completeness and model certainty
    const featureCompleteness = features.filter(f => f > 0).length / features.length;
    const predictionCertainty = 1 - Math.abs(prediction - 0.5) * 2; // Higher certainty for extreme values
    
    return Math.min(featureCompleteness * 0.6 + predictionCertainty * 0.4, 1);
  }

  /**
   * Determine risk level from credit score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 700) return 'low';
    if (score >= 500) return 'medium';
    return 'high';
  }

  /**
   * Generate contributing factors for explanation
   */
  private generateContributingFactors(features: CreditFeatures, score: number): Array<{
    factor: string;
    impact: number;
    description: string;
  }> {
    const factors = [
      {
        factor: 'Transaction Activity',
        impact: (features.totalTransactions / 1000) * 0.2,
        description: `${features.totalTransactions} total transactions indicate ${features.totalTransactions > 500 ? 'high' : 'moderate'} activity`
      },
      {
        factor: 'Staking Behavior',
        impact: features.stakingScore * 0.25,
        description: `Staking score of ${(features.stakingScore * 100).toFixed(1)}% shows ${features.stakingScore > 0.7 ? 'strong' : 'moderate'} commitment`
      },
      {
        factor: 'Liquidation History',
        impact: -features.liquidationCount * 0.1,
        description: `${features.liquidationCount} liquidations ${features.liquidationCount > 0 ? 'negatively' : 'do not'} impact score`
      },
      {
        factor: 'Protocol Diversity',
        impact: features.protocolDiversity * 0.15,
        description: `Using ${features.protocolDiversity.toFixed(1)} protocols shows ${features.protocolDiversity > 5 ? 'excellent' : 'good'} DeFi experience`
      },
      {
        factor: 'Gas Efficiency',
        impact: features.gasEfficiency * 0.1,
        description: `${(features.gasEfficiency * 100).toFixed(1)}% gas efficiency indicates ${features.gasEfficiency > 0.8 ? 'sophisticated' : 'average'} usage`
      }
    ];

    return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3);
  }

  /**
   * Get model performance history
   */
  public getModelPerformance(): ModelPerformanceMetrics[] {
    return this.trainingHistory;
  }

  /**
   * Get latest model performance
   */
  public getLatestPerformance(): ModelPerformanceMetrics | null {
    return this.trainingHistory.length > 0 ? this.trainingHistory[this.trainingHistory.length - 1] : null;
  }

  /**
   * Save model to disk
   */
  public async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    await this.model.save(`file://${path}`);
    console.log(`💾 Model saved to ${path}`);
  }

  /**
   * Load model from disk
   */
  public async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    this.isInitialized = true;
    console.log(`📂 Model loaded from ${path}`);
  }

  /**
   * Generate synthetic training data for demonstration
   */
  public generateSyntheticTrainingData(samples: number = 1000): ModelTrainingData {
    const features: CreditFeatures[] = [];
    const labels: number[] = [];

    for (let i = 0; i < samples; i++) {
      const feature: CreditFeatures = {
        totalTransactions: Math.floor(Math.random() * 2000),
        avgTransactionAmount: Math.random() * 20,
        transactionFrequency: Math.random() * 200,
        gasEfficiency: Math.random(),
        protocolDiversity: Math.random() * 10,
        stakingScore: Math.random(),
        liquidityProviderScore: Math.random(),
        borrowingHistory: Math.random(),
        liquidationCount: Math.floor(Math.random() * 5),
        consistencyScore: Math.random(),
        riskTolerance: Math.random(),
        governanceParticipation: Math.random(),
        marketVolatility: Math.random() * 0.5,
        liquidityIndex: Math.random() * 100,
        tvlExposure: Math.random()
      };

      // Generate synthetic label based on features (simplified)
      const baseScore = (
        feature.stakingScore * 300 +
        feature.consistencyScore * 200 +
        (feature.protocolDiversity / 10) * 150 +
        feature.gasEfficiency * 100 +
        (1 - feature.liquidationCount / 5) * 250
      );

      const label = Math.max(300, Math.min(1000, baseScore + Math.random() * 100 - 50));

      features.push(feature);
      labels.push(label);
    }

    return {
      features,
      labels,
      validationSplit: 0.2
    };
  }

  /**
   * Dispose of model and cleanup
   */
  public dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.removeAllListeners();
    console.log('🗑️ ML Model disposed');
  }
}
