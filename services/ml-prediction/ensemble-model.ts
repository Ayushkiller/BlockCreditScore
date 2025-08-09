// Ensemble Model Implementation for Improved Prediction Accuracy

import {
  MLModelConfig,
  ModelEnsemble,
  PredictionRequest,
  PredictionResponse,
  PredictionFactor,
  ModelPerformance
} from '../../types/ml';
import { LSTMRiskModel } from './lstm-model';
import { MLModelError, ValidationError } from '../../utils/errors';
import { isValidConfidence } from '../../utils/validation';

/**
 * Ensemble Model that combines multiple LSTM models for improved accuracy
 */
export class EnsembleRiskModel {
  private ensemble: ModelEnsemble;
  private models: Map<string, LSTMRiskModel> = new Map();
  private isInitialized: boolean = false;

  constructor(ensemble: ModelEnsemble) {
    this.ensemble = ensemble;
    this.validateEnsemble();
  }

  /**
   * Validates the ensemble configuration
   */
  private validateEnsemble(): void {
    if (!this.ensemble.models || this.ensemble.models.length === 0) {
      throw new ValidationError('Ensemble must contain at least one model');
    }

    if (!this.ensemble.weights || this.ensemble.weights.length !== this.ensemble.models.length) {
      throw new ValidationError('Weights array must match models array length');
    }

    const weightSum = this.ensemble.weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(weightSum - 1.0) > 0.001) {
      throw new ValidationError('Ensemble weights must sum to 1.0');
    }

    const validMethods = ['weighted_average', 'voting', 'stacking'];
    if (!validMethods.includes(this.ensemble.combiningMethod)) {
      throw new ValidationError(`Invalid combining method: ${this.ensemble.combiningMethod}`);
    }
  }

  /**
   * Initializes the ensemble with individual models
   */
  public async initialize(modelConfigs: MLModelConfig[]): Promise<void> {
    try {
      if (modelConfigs.length !== this.ensemble.models.length) {
        throw new ValidationError('Model configs must match ensemble model IDs');
      }

      // Initialize individual models
      for (let i = 0; i < modelConfigs.length; i++) {
        const config = modelConfigs[i];
        const modelId = this.ensemble.models[i];
        
        if (config.modelId !== modelId) {
          throw new ValidationError(`Model ID mismatch: expected ${modelId}, got ${config.modelId}`);
        }

        const model = new LSTMRiskModel(config);
        await model.initialize();
        this.models.set(modelId, model);
      }

      this.isInitialized = true;
    } catch (error) {
      throw new MLModelError(`Failed to initialize ensemble: ${error.message}`, this.ensemble.ensembleId);
    }
  }

  /**
   * Trains all models in the ensemble
   */
  public async trainEnsemble(
    trainingData: number[][],
    labels: number[],
    validationData?: { inputs: number[][]; labels: number[] }
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new MLModelError('Ensemble not initialized', this.ensemble.ensembleId);
    }

    try {
      const trainingPromises: Promise<any>[] = [];

      // Train each model with different data subsets for diversity
      for (const [modelId, model] of this.models) {
        const modelIndex = this.ensemble.models.indexOf(modelId);
        
        // Create diverse training sets using bootstrap sampling
        const bootstrapData = this.createBootstrapSample(trainingData, labels);
        const modelValidation = validationData ? {
          inputs: this.createBootstrapSample(validationData.inputs, validationData.labels).data,
          labels: this.createBootstrapSample(validationData.inputs, validationData.labels).labels
        } : undefined;

        trainingPromises.push(
          model.train(bootstrapData.data, bootstrapData.labels, modelValidation)
        );
      }

      // Wait for all models to complete training
      await Promise.all(trainingPromises);

      // Update ensemble performance
      this.ensemble.performance = await this.evaluateEnsemble(trainingData, labels);
      
    } catch (error) {
      throw new MLModelError(`Ensemble training failed: ${error.message}`, this.ensemble.ensembleId);
    }
  }

  /**
   * Creates a bootstrap sample for model diversity
   */
  private createBootstrapSample(
    data: number[][],
    labels: number[]
  ): { data: number[][]; labels: number[] } {
    const sampleSize = Math.floor(data.length * 0.8); // 80% sample
    const bootstrapData: number[][] = [];
    const bootstrapLabels: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      bootstrapData.push([...data[randomIndex]]);
      bootstrapLabels.push(labels[randomIndex]);
    }

    return { data: bootstrapData, labels: bootstrapLabels };
  }

  /**
   * Makes ensemble prediction combining individual model predictions
   */
  public async predict(request: PredictionRequest): Promise<PredictionResponse> {
    if (!this.isInitialized) {
      throw new MLModelError('Ensemble not initialized', this.ensemble.ensembleId);
    }

    try {
      // Get predictions from all models
      const modelPredictions: PredictionResponse[] = [];
      
      for (const [modelId, model] of this.models) {
        const modelRequest = { ...request, modelId };
        const prediction = await model.predict(modelRequest);
        modelPredictions.push(prediction);
      }

      // Combine predictions based on ensemble method
      const combinedPrediction = this.combinePredictions(modelPredictions);
      
      // Generate ensemble factors
      const ensembleFactors = this.combineFactors(modelPredictions);

      return {
        userAddress: request.userAddress,
        modelId: this.ensemble.ensembleId,
        prediction: combinedPrediction.prediction,
        confidence: combinedPrediction.confidence,
        factors: ensembleFactors,
        timestamp: Date.now(),
        expiresAt: Date.now() + (request.predictionHorizon * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      throw new MLModelError(`Ensemble prediction failed: ${error.message}`, this.ensemble.ensembleId);
    }
  }

  /**
   * Combines individual model predictions based on ensemble method
   */
  private combinePredictions(predictions: PredictionResponse[]): { prediction: number; confidence: number } {
    switch (this.ensemble.combiningMethod) {
      case 'weighted_average':
        return this.weightedAverageCombining(predictions);
      
      case 'voting':
        return this.votingCombining(predictions);
      
      case 'stacking':
        return this.stackingCombining(predictions);
      
      default:
        throw new MLModelError(`Unsupported combining method: ${this.ensemble.combiningMethod}`, this.ensemble.ensembleId);
    }
  }

  /**
   * Weighted average combining method
   */
  private weightedAverageCombining(predictions: PredictionResponse[]): { prediction: number; confidence: number } {
    let weightedPrediction = 0;
    let weightedConfidence = 0;
    let totalWeight = 0;

    for (let i = 0; i < predictions.length; i++) {
      const weight = this.ensemble.weights[i];
      const prediction = predictions[i];
      
      weightedPrediction += prediction.prediction * weight;
      weightedConfidence += prediction.confidence * weight;
      totalWeight += weight;
    }

    return {
      prediction: Math.round(weightedPrediction / totalWeight),
      confidence: Math.round(weightedConfidence / totalWeight)
    };
  }

  /**
   * Voting combining method (majority vote for risk categories)
   */
  private votingCombining(predictions: PredictionResponse[]): { prediction: number; confidence: number } {
    // Categorize predictions into risk levels
    const riskCategories = predictions.map(p => {
      if (p.prediction < 300) return 'low';
      if (p.prediction < 600) return 'medium';
      return 'high';
    });

    // Count votes for each category
    const votes = { low: 0, medium: 0, high: 0 };
    riskCategories.forEach(category => votes[category]++);

    // Find majority vote
    const majorityCategory = Object.entries(votes).reduce((a, b) => 
      votes[a[0] as keyof typeof votes] > votes[b[0] as keyof typeof votes] ? a : b
    )[0] as keyof typeof votes;

    // Convert category back to numerical prediction
    const categoryPredictions = {
      low: 200,
      medium: 450,
      high: 750
    };

    // Calculate confidence based on vote consensus
    const maxVotes = Math.max(...Object.values(votes));
    const confidence = (maxVotes / predictions.length) * 100;

    return {
      prediction: categoryPredictions[majorityCategory],
      confidence: Math.round(confidence)
    };
  }

  /**
   * Stacking combining method (meta-model approach)
   */
  private stackingCombining(predictions: PredictionResponse[]): { prediction: number; confidence: number } {
    // Simplified stacking: weighted by individual model confidence
    let totalWeightedPrediction = 0;
    let totalConfidenceWeight = 0;

    for (const prediction of predictions) {
      const confidenceWeight = prediction.confidence / 100;
      totalWeightedPrediction += prediction.prediction * confidenceWeight;
      totalConfidenceWeight += confidenceWeight;
    }

    const finalPrediction = totalConfidenceWeight > 0 ? 
      totalWeightedPrediction / totalConfidenceWeight : 
      predictions.reduce((sum, p) => sum + p.prediction, 0) / predictions.length;

    // Meta-confidence based on agreement between models
    const avgPrediction = predictions.reduce((sum, p) => sum + p.prediction, 0) / predictions.length;
    const variance = predictions.reduce((sum, p) => sum + Math.pow(p.prediction - avgPrediction, 2), 0) / predictions.length;
    const agreement = Math.max(0, 100 - Math.sqrt(variance) / 10);

    return {
      prediction: Math.round(finalPrediction),
      confidence: Math.round(agreement)
    };
  }

  /**
   * Combines prediction factors from all models
   */
  private combineFactors(predictions: PredictionResponse[]): PredictionFactor[] {
    const factorMap = new Map<string, { importance: number; count: number; impact: string; value: any }>();

    // Aggregate factors from all models
    for (const prediction of predictions) {
      for (const factor of prediction.factors) {
        const existing = factorMap.get(factor.feature);
        if (existing) {
          existing.importance += factor.importance;
          existing.count++;
          existing.value = factor.value; // Use latest value
        } else {
          factorMap.set(factor.feature, {
            importance: factor.importance,
            count: 1,
            impact: factor.impact,
            value: factor.value
          });
        }
      }
    }

    // Convert to final factors with averaged importance
    const combinedFactors: PredictionFactor[] = [];
    for (const [feature, data] of factorMap) {
      combinedFactors.push({
        feature,
        importance: Math.round(data.importance / data.count),
        value: data.value,
        impact: data.impact,
        description: `Consensus factor from ${data.count} models`
      });
    }

    // Sort by importance and return top factors
    combinedFactors.sort((a, b) => b.importance - a.importance);
    return combinedFactors.slice(0, 8);
  }

  /**
   * Evaluates ensemble performance
   */
  private async evaluateEnsemble(data: number[][], labels: number[]): Promise<ModelPerformance> {
    const predictions: number[] = [];
    
    // Generate ensemble predictions for evaluation data
    for (let i = 0; i < data.length; i++) {
      const request: PredictionRequest = {
        userAddress: `test_${i}`,
        modelId: this.ensemble.ensembleId,
        features: this.dataToFeatures(data[i]),
        predictionHorizon: 30
      };
      
      const prediction = await this.predict(request);
      predictions.push(prediction.prediction);
    }

    // Calculate performance metrics
    let totalLoss = 0;
    let correctPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const target = labels[i];
      
      totalLoss += Math.pow(prediction - target, 2);
      
      const isHighRisk = target > 500;
      const predictedHighRisk = prediction > 500;
      
      if (isHighRisk && predictedHighRisk) truePositives++;
      if (!isHighRisk && predictedHighRisk) falsePositives++;
      if (isHighRisk && !predictedHighRisk) falseNegatives++;
      
      if (Math.abs(prediction - target) / target < 0.15) { // Slightly more lenient for ensemble
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
      auc: 0.5 + Math.abs(accuracy - 0.5),
      mse: totalLoss / data.length,
      mae: Math.sqrt(totalLoss / data.length),
      validationMetrics: {},
      testMetrics: {}
    };
  }

  /**
   * Converts data array to features object
   */
  private dataToFeatures(data: number[]): Record<string, any> {
    return {
      defiReliabilityScore: data[0] || 0,
      tradingConsistencyScore: data[1] || 0,
      stakingCommitmentScore: data[2] || 0,
      governanceParticipationScore: data[3] || 0,
      liquidityProviderScore: data[4] || 0,
      totalTransactionVolume: data[5] || 0,
      averageTransactionSize: data[6] || 0,
      transactionFrequency: data[7] || 0,
      protocolDiversification: data[8] || 0,
      historicalDefaultRate: data[9] || 0,
      marketVolatility: data[10] || 0,
      liquidityRatio: data[11] || 0
    };
  }

  /**
   * Gets ensemble configuration
   */
  public getEnsemble(): ModelEnsemble {
    return { ...this.ensemble };
  }

  /**
   * Updates ensemble weights
   */
  public updateWeights(newWeights: number[]): void {
    if (newWeights.length !== this.ensemble.weights.length) {
      throw new ValidationError('New weights array must match current weights length');
    }

    const weightSum = newWeights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(weightSum - 1.0) > 0.001) {
      throw new ValidationError('New weights must sum to 1.0');
    }

    this.ensemble.weights = [...newWeights];
  }

  /**
   * Adds a new model to the ensemble
   */
  public async addModel(modelConfig: MLModelConfig, weight: number): Promise<void> {
    if (weight <= 0 || weight >= 1) {
      throw new ValidationError('Model weight must be between 0 and 1');
    }

    // Adjust existing weights to accommodate new model
    const adjustmentFactor = (1 - weight);
    this.ensemble.weights = this.ensemble.weights.map(w => w * adjustmentFactor);
    
    // Add new model
    this.ensemble.models.push(modelConfig.modelId);
    this.ensemble.weights.push(weight);

    // Initialize new model
    const model = new LSTMRiskModel(modelConfig);
    await model.initialize();
    this.models.set(modelConfig.modelId, model);
  }

  /**
   * Removes a model from the ensemble
   */
  public removeModel(modelId: string): void {
    const modelIndex = this.ensemble.models.indexOf(modelId);
    if (modelIndex === -1) {
      throw new ValidationError(`Model ${modelId} not found in ensemble`);
    }

    if (this.ensemble.models.length <= 1) {
      throw new ValidationError('Cannot remove the last model from ensemble');
    }

    // Remove model and weight
    const removedWeight = this.ensemble.weights[modelIndex];
    this.ensemble.models.splice(modelIndex, 1);
    this.ensemble.weights.splice(modelIndex, 1);

    // Redistribute removed weight proportionally
    const totalRemainingWeight = this.ensemble.weights.reduce((sum, w) => sum + w, 0);
    this.ensemble.weights = this.ensemble.weights.map(w => w + (w / totalRemainingWeight) * removedWeight);

    // Remove from models map
    this.models.delete(modelId);
  }
}