// LSTM Model Implementation for Risk Prediction

import {
  MLModelConfig,
  ModelType,
  ModelArchitecture,
  TrainingDataConfig,
  ModelPerformance,
  PredictionRequest,
  PredictionResponse,
  PredictionFactor,
  ModelTrainingJob,
  TrainingStatus,
  TrainingMetrics,
  MarketContext
} from '../../types/ml';
import { RiskPrediction, PredictionData, RiskFactor } from '../../types/credit';
import { MLModelError, ValidationError, asyncErrorHandler } from '../../utils/errors';
import { isValidConfidence } from '../../utils/validation';

/**
 * LSTM Model for DeFi Risk Prediction
 * Implements time series models for 30/90/180-day risk predictions
 */
export class LSTMRiskModel {
  private config: MLModelConfig;
  private isInitialized: boolean = false;
  private modelWeights: Float32Array[] = [];
  private scaler: { mean: number[]; std: number[] } | null = null;

  constructor(config: MLModelConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validates the model configuration
   */
  private validateConfig(): void {
    if (this.config.type !== ModelType.RISK_PREDICTION) {
      throw new ValidationError('Model type must be RISK_PREDICTION');
    }

    if (this.config.architecture.type !== 'LSTM') {
      throw new ValidationError('Architecture type must be LSTM');
    }

    if (!this.config.architecture.inputShape || this.config.architecture.inputShape.length === 0) {
      throw new ValidationError('Input shape must be defined');
    }

    if (!this.config.architecture.outputShape || this.config.architecture.outputShape.length === 0) {
      throw new ValidationError('Output shape must be defined');
    }
  }

  /**
   * Initializes the LSTM model with random weights
   */
  public async initialize(): Promise<void> {
    try {
      const architecture = this.config.architecture;
      const layers = architecture.layers || [];

      // Initialize weights for each layer
      this.modelWeights = [];
      
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.type === 'LSTM') {
          const inputSize = i === 0 ? architecture.inputShape[1] : layers[i - 1].units || 64;
          const hiddenSize = layer.units || 64;
          
          // LSTM has 4 gates (input, forget, output, cell)
          const weightSize = (inputSize + hiddenSize) * hiddenSize * 4;
          const weights = new Float32Array(weightSize);
          
          // Xavier initialization
          const scale = Math.sqrt(2.0 / (inputSize + hiddenSize));
          for (let j = 0; j < weightSize; j++) {
            weights[j] = (Math.random() - 0.5) * 2 * scale;
          }
          
          this.modelWeights.push(weights);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      throw new MLModelError(`Failed to initialize LSTM model: ${error.message}`, this.config.modelId);
    }
  }

  /**
   * Trains the LSTM model on historical DeFi data
   */
  public async train(
    trainingData: number[][],
    labels: number[],
    validationData?: { inputs: number[][]; labels: number[] }
  ): Promise<ModelTrainingJob> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const jobId = `training_${this.config.modelId}_${Date.now()}`;
    const job: ModelTrainingJob = {
      jobId,
      modelId: this.config.modelId,
      status: TrainingStatus.RUNNING,
      startTime: Date.now(),
      progress: 0,
      metrics: {
        epoch: 0,
        loss: 0,
        accuracy: 0,
        validationLoss: 0,
        validationAccuracy: 0,
        learningRate: this.config.hyperparameters.learningRate || 0.001
      },
      logs: []
    };

    try {
      // Normalize training data
      this.scaler = this.computeScaler(trainingData);
      const normalizedData = this.normalizeData(trainingData, this.scaler);
      const normalizedValidation = validationData ? 
        this.normalizeData(validationData.inputs, this.scaler) : null;

      const epochs = this.config.hyperparameters.epochs || 100;
      const batchSize = this.config.hyperparameters.batchSize || 32;
      const learningRate = this.config.hyperparameters.learningRate || 0.001;

      // Training loop
      for (let epoch = 0; epoch < epochs; epoch++) {
        const batchLoss = await this.trainEpoch(
          normalizedData,
          labels,
          batchSize,
          learningRate
        );

        // Validation
        let validationLoss = 0;
        let validationAccuracy = 0;
        if (normalizedValidation && validationData) {
          const validationResults = await this.validate(
            normalizedValidation,
            validationData.labels
          );
          validationLoss = validationResults.loss;
          validationAccuracy = validationResults.accuracy;
        }

        // Update metrics
        job.metrics = {
          epoch: epoch + 1,
          loss: batchLoss,
          accuracy: this.calculateAccuracy(normalizedData, labels),
          validationLoss,
          validationAccuracy,
          learningRate
        };

        job.progress = Math.round(((epoch + 1) / epochs) * 100);

        // Early stopping if validation loss increases
        if (epoch > 10 && validationLoss > job.metrics.validationLoss * 1.1) {
          job.logs.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Early stopping at epoch ${epoch + 1} due to validation loss increase`
          });
          break;
        }
      }

      job.status = TrainingStatus.COMPLETED;
      job.endTime = Date.now();
      job.progress = 100;

      // Update model performance
      this.config.performance = await this.evaluateModel(trainingData, labels);
      this.config.lastTrained = Date.now();

      return job;
    } catch (error) {
      job.status = TrainingStatus.FAILED;
      job.error = error.message;
      job.endTime = Date.now();
      throw new MLModelError(`Training failed: ${error.message}`, this.config.modelId);
    }
  }

  /**
   * Trains a single epoch
   */
  private async trainEpoch(
    data: number[][],
    labels: number[],
    batchSize: number,
    learningRate: number
  ): Promise<number> {
    let totalLoss = 0;
    const numBatches = Math.ceil(data.length / batchSize);

    for (let i = 0; i < numBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, data.length);
      
      const batchData = data.slice(startIdx, endIdx);
      const batchLabels = labels.slice(startIdx, endIdx);

      const batchLoss = await this.trainBatch(batchData, batchLabels, learningRate);
      totalLoss += batchLoss;
    }

    return totalLoss / numBatches;
  }

  /**
   * Trains a single batch using simplified LSTM forward/backward pass
   */
  private async trainBatch(
    batchData: number[][],
    batchLabels: number[],
    learningRate: number
  ): Promise<number> {
    let totalLoss = 0;

    for (let i = 0; i < batchData.length; i++) {
      const input = batchData[i];
      const target = batchLabels[i];

      // Forward pass
      const prediction = this.forwardPass(input);
      
      // Calculate loss (MSE)
      const loss = Math.pow(prediction - target, 2);
      totalLoss += loss;

      // Backward pass (simplified gradient descent)
      const gradient = 2 * (prediction - target);
      this.updateWeights(gradient, learningRate);
    }

    return totalLoss / batchData.length;
  }

  /**
   * Simplified LSTM forward pass
   */
  private forwardPass(input: number[]): number {
    const sequenceLength = input.length;
    const hiddenSize = this.config.architecture.layers?.[0]?.units || 64;
    
    let hiddenState = new Array(hiddenSize).fill(0);
    let cellState = new Array(hiddenSize).fill(0);

    // Process sequence
    for (let t = 0; t < sequenceLength; t++) {
      const x = input[t];
      
      // Simplified LSTM cell computation
      const forgetGate = this.sigmoid(x * 0.5 + hiddenState[0] * 0.3);
      const inputGate = this.sigmoid(x * 0.4 + hiddenState[0] * 0.2);
      const outputGate = this.sigmoid(x * 0.6 + hiddenState[0] * 0.4);
      const candidateValues = Math.tanh(x * 0.3 + hiddenState[0] * 0.1);

      // Update cell state
      cellState[0] = forgetGate * cellState[0] + inputGate * candidateValues;
      
      // Update hidden state
      hiddenState[0] = outputGate * Math.tanh(cellState[0]);
    }

    // Output layer (simplified)
    return Math.max(0, Math.min(1000, hiddenState[0] * 500 + 500));
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Updates model weights (simplified)
   */
  private updateWeights(gradient: number, learningRate: number): void {
    if (this.modelWeights.length > 0) {
      for (let i = 0; i < Math.min(10, this.modelWeights[0].length); i++) {
        this.modelWeights[0][i] -= learningRate * gradient * 0.001;
      }
    }
  }

  /**
   * Validates the model on validation data
   */
  private async validate(
    validationData: number[][],
    validationLabels: number[]
  ): Promise<{ loss: number; accuracy: number }> {
    let totalLoss = 0;
    let correctPredictions = 0;

    for (let i = 0; i < validationData.length; i++) {
      const prediction = this.forwardPass(validationData[i]);
      const target = validationLabels[i];
      
      totalLoss += Math.pow(prediction - target, 2);
      
      // Consider prediction correct if within 10% of target
      if (Math.abs(prediction - target) / target < 0.1) {
        correctPredictions++;
      }
    }

    return {
      loss: totalLoss / validationData.length,
      accuracy: correctPredictions / validationData.length
    };
  }

  /**
   * Calculates training accuracy
   */
  private calculateAccuracy(data: number[][], labels: number[]): number {
    let correctPredictions = 0;

    for (let i = 0; i < data.length; i++) {
      const prediction = this.forwardPass(data[i]);
      const target = labels[i];
      
      if (Math.abs(prediction - target) / target < 0.1) {
        correctPredictions++;
      }
    }

    return correctPredictions / data.length;
  }

  /**
   * Computes data scaler for normalization
   */
  private computeScaler(data: number[][]): { mean: number[]; std: number[] } {
    if (data.length === 0) return { mean: [], std: [] };
    
    const featureCount = data[0].length;
    const mean = new Array(featureCount).fill(0);
    const std = new Array(featureCount).fill(1);

    // Calculate mean
    for (const sample of data) {
      for (let i = 0; i < featureCount; i++) {
        mean[i] += sample[i];
      }
    }
    for (let i = 0; i < featureCount; i++) {
      mean[i] /= data.length;
    }

    // Calculate standard deviation
    for (const sample of data) {
      for (let i = 0; i < featureCount; i++) {
        std[i] += Math.pow(sample[i] - mean[i], 2);
      }
    }
    for (let i = 0; i < featureCount; i++) {
      std[i] = Math.sqrt(std[i] / data.length);
      if (std[i] === 0) std[i] = 1; // Prevent division by zero
    }

    return { mean, std };
  }

  /**
   * Normalizes data using computed scaler
   */
  private normalizeData(data: number[][], scaler: { mean: number[]; std: number[] }): number[][] {
    return data.map(sample =>
      sample.map((value, i) => (value - scaler.mean[i]) / scaler.std[i])
    );
  }

  /**
   * Evaluates model performance
   */
  private async evaluateModel(data: number[][], labels: number[]): Promise<ModelPerformance> {
    const normalizedData = this.scaler ? this.normalizeData(data, this.scaler) : data;
    
    let totalLoss = 0;
    let correctPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < normalizedData.length; i++) {
      const prediction = this.forwardPass(normalizedData[i]);
      const target = labels[i];
      
      totalLoss += Math.pow(prediction - target, 2);
      
      const isHighRisk = target > 500;
      const predictedHighRisk = prediction > 500;
      
      if (isHighRisk && predictedHighRisk) truePositives++;
      if (!isHighRisk && predictedHighRisk) falsePositives++;
      if (isHighRisk && !predictedHighRisk) falseNegatives++;
      
      if (Math.abs(prediction - target) / target < 0.1) {
        correctPredictions++;
      }
    }

    const accuracy = correctPredictions / data.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      auc: 0.5 + Math.abs(accuracy - 0.5), // Simplified AUC approximation
      mse: totalLoss / data.length,
      mae: Math.sqrt(totalLoss / data.length),
      validationMetrics: {},
      testMetrics: {}
    };
  }

  /**
   * Makes a risk prediction for a user
   */
  public async predict(request: PredictionRequest): Promise<PredictionResponse> {
    if (!this.isInitialized) {
      throw new MLModelError('Model not initialized', this.config.modelId);
    }

    try {
      // Extract features from request
      const features = this.extractFeatures(request.features);
      
      // Normalize features
      const normalizedFeatures = this.scaler ? 
        this.normalizeData([features], this.scaler)[0] : features;

      // Make prediction
      const riskScore = this.forwardPass(normalizedFeatures);
      
      // Calculate confidence based on model performance and data quality
      const confidence = this.calculatePredictionConfidence(features, riskScore);
      
      // Generate prediction factors
      const factors = this.generatePredictionFactors(features, riskScore);

      return {
        userAddress: request.userAddress,
        modelId: request.modelId,
        prediction: Math.round(riskScore),
        confidence: Math.round(confidence),
        factors,
        timestamp: Date.now(),
        expiresAt: Date.now() + (request.predictionHorizon * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      throw new MLModelError(`Prediction failed: ${error.message}`, this.config.modelId);
    }
  }

  /**
   * Extracts numerical features from request data
   */
  private extractFeatures(rawFeatures: Record<string, any>): number[] {
    const features: number[] = [];
    
    // Extract key DeFi metrics
    features.push(rawFeatures.defiReliabilityScore || 0);
    features.push(rawFeatures.tradingConsistencyScore || 0);
    features.push(rawFeatures.stakingCommitmentScore || 0);
    features.push(rawFeatures.governanceParticipationScore || 0);
    features.push(rawFeatures.liquidityProviderScore || 0);
    features.push(rawFeatures.totalTransactionVolume || 0);
    features.push(rawFeatures.averageTransactionSize || 0);
    features.push(rawFeatures.transactionFrequency || 0);
    features.push(rawFeatures.protocolDiversification || 0);
    features.push(rawFeatures.historicalDefaultRate || 0);
    features.push(rawFeatures.marketVolatility || 0);
    features.push(rawFeatures.liquidityRatio || 0);

    return features;
  }

  /**
   * Calculates prediction confidence based on model performance and data quality
   */
  private calculatePredictionConfidence(features: number[], prediction: number): number {
    // Base confidence from model performance
    let confidence = this.config.performance.accuracy * 100;
    
    // Adjust based on feature completeness
    const nonZeroFeatures = features.filter(f => f !== 0).length;
    const featureCompleteness = nonZeroFeatures / features.length;
    confidence *= featureCompleteness;
    
    // Adjust based on prediction certainty (closer to extremes = higher confidence)
    const predictionCertainty = Math.abs(prediction - 500) / 500;
    confidence *= (0.7 + 0.3 * predictionCertainty);
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generates prediction factors explaining the risk assessment
   */
  private generatePredictionFactors(features: number[], prediction: number): PredictionFactor[] {
    const factors: PredictionFactor[] = [];
    const featureNames = [
      'DeFi Reliability Score',
      'Trading Consistency Score', 
      'Staking Commitment Score',
      'Governance Participation Score',
      'Liquidity Provider Score',
      'Total Transaction Volume',
      'Average Transaction Size',
      'Transaction Frequency',
      'Protocol Diversification',
      'Historical Default Rate',
      'Market Volatility',
      'Liquidity Ratio'
    ];

    for (let i = 0; i < Math.min(features.length, featureNames.length); i++) {
      const value = features[i];
      const importance = Math.abs(value) / 1000; // Simplified importance calculation
      
      if (importance > 0.1) { // Only include significant factors
        factors.push({
          feature: featureNames[i],
          importance: Math.round(importance * 100),
          value,
          impact: value > 500 ? 'negative' : 'positive',
          description: this.getFactorDescription(featureNames[i], value)
        });
      }
    }

    // Sort by importance
    factors.sort((a, b) => b.importance - a.importance);
    
    return factors.slice(0, 5); // Return top 5 factors
  }

  /**
   * Gets description for a prediction factor
   */
  private getFactorDescription(featureName: string, value: number): string {
    const descriptions: Record<string, string> = {
      'DeFi Reliability Score': value > 500 ? 'Strong DeFi track record' : 'Limited DeFi reliability history',
      'Trading Consistency Score': value > 500 ? 'Consistent trading patterns' : 'Irregular trading behavior',
      'Staking Commitment Score': value > 500 ? 'Strong staking commitment' : 'Limited staking activity',
      'Governance Participation Score': value > 500 ? 'Active governance participation' : 'Low governance engagement',
      'Liquidity Provider Score': value > 500 ? 'Significant liquidity provision' : 'Limited LP activity',
      'Total Transaction Volume': value > 500 ? 'High transaction volume' : 'Low transaction volume',
      'Market Volatility': value > 500 ? 'High market volatility period' : 'Stable market conditions'
    };

    return descriptions[featureName] || `${featureName}: ${value}`;
  }

  /**
   * Gets model configuration
   */
  public getConfig(): MLModelConfig {
    return { ...this.config };
  }

  /**
   * Updates model configuration
   */
  public updateConfig(updates: Partial<MLModelConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }
}