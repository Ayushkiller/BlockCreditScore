// Model Training Pipeline for LSTM Risk Prediction Models

import {
  MLModelConfig,
  ModelType,
  ModelArchitecture,
  TrainingDataConfig,
  ModelTrainingJob,
  TrainingStatus,
  TrainingLog,
  DataSource,
  FeatureConfig,
  ModelEnsemble
} from '../../types/ml';
import { LSTMRiskModel } from './lstm-model';
import { EnsembleRiskModel } from './ensemble-model';
import { MLModelError, ValidationError, asyncErrorHandler } from '../../utils/errors';

/**
 * Training Pipeline for managing LSTM model training workflows
 */
export class ModelTrainingPipeline {
  private trainingJobs: Map<string, ModelTrainingJob> = new Map();
  private models: Map<string, LSTMRiskModel> = new Map();
  private ensembles: Map<string, EnsembleRiskModel> = new Map();

  /**
   * Creates a new LSTM model configuration for risk prediction
   */
  public createModelConfig(
    modelId: string,
    predictionHorizon: number, // 30, 90, or 180 days
    architecture?: Partial<ModelArchitecture>
  ): MLModelConfig {
    const defaultArchitecture: ModelArchitecture = {
      type: 'LSTM',
      inputShape: [60, 12], // 60 time steps, 12 features
      outputShape: [1], // Single risk score output
      layers: [
        {
          type: 'LSTM',
          units: 64,
          activation: 'tanh',
          dropout: 0.2,
          parameters: {
            returnSequences: true,
            recurrentDropout: 0.2
          }
        },
        {
          type: 'LSTM',
          units: 32,
          activation: 'tanh',
          dropout: 0.2,
          parameters: {
            returnSequences: false,
            recurrentDropout: 0.2
          }
        },
        {
          type: 'Dense',
          units: 16,
          activation: 'relu',
          dropout: 0.1,
          parameters: {}
        },
        {
          type: 'Dense',
          units: 1,
          activation: 'sigmoid',
          parameters: {}
        }
      ]
    };

    const trainingConfig: TrainingDataConfig = {
      sources: [
        {
          name: 'ethereum_transactions',
          type: 'blockchain',
          updateFrequency: 900, // 15 minutes
          reliability: 0.95
        },
        {
          name: 'defi_protocols',
          type: 'blockchain',
          updateFrequency: 3600, // 1 hour
          reliability: 0.90
        },
        {
          name: 'market_data',
          type: 'market_data',
          updateFrequency: 300, // 5 minutes
          reliability: 0.85
        }
      ],
      timeRange: {
        start: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
        end: Date.now()
      },
      features: this.getFeatureConfigs(),
      targetVariable: 'risk_score',
      validationSplit: 0.2,
      testSplit: 0.1
    };

    return {
      modelId,
      name: `LSTM Risk Prediction ${predictionHorizon}D`,
      version: '1.0.0',
      type: ModelType.RISK_PREDICTION,
      architecture: { ...defaultArchitecture, ...architecture },
      hyperparameters: {
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
        lossFunction: 'mse',
        metrics: ['mae', 'mse'],
        earlyStopping: {
          monitor: 'val_loss',
          patience: 10,
          minDelta: 0.001
        },
        predictionHorizon
      },
      trainingData: trainingConfig,
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        auc: 0,
        mse: 0,
        mae: 0,
        validationMetrics: {},
        testMetrics: {}
      },
      lastTrained: 0,
      isActive: false
    };
  }

  /**
   * Gets feature configurations for DeFi risk prediction
   */
  private getFeatureConfigs(): FeatureConfig[] {
    return [
      {
        name: 'defi_reliability_score',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.2,
        description: 'Historical DeFi protocol interaction reliability'
      },
      {
        name: 'trading_consistency_score',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.18,
        description: 'Consistency of trading patterns and behaviors'
      },
      {
        name: 'staking_commitment_score',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.15,
        description: 'Long-term staking commitment and behavior'
      },
      {
        name: 'governance_participation_score',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.12,
        description: 'Active participation in protocol governance'
      },
      {
        name: 'liquidity_provider_score',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.15,
        description: 'Liquidity provision consistency and volume'
      },
      {
        name: 'transaction_volume',
        type: 'numerical',
        transformation: 'log_normalize',
        importance: 0.1,
        description: 'Total transaction volume in USD'
      },
      {
        name: 'transaction_frequency',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.08,
        description: 'Frequency of on-chain transactions'
      },
      {
        name: 'protocol_diversification',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.07,
        description: 'Diversification across different DeFi protocols'
      },
      {
        name: 'market_volatility',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.06,
        description: 'Market volatility during transaction periods'
      },
      {
        name: 'liquidity_ratio',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.05,
        description: 'Ratio of liquid to illiquid assets'
      },
      {
        name: 'historical_default_rate',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.04,
        description: 'Historical default rate in similar market conditions'
      },
      {
        name: 'social_credit_score',
        type: 'numerical',
        transformation: 'normalize',
        importance: 0.03,
        description: 'Peer-to-peer lending and social reputation'
      }
    ];
  }

  /**
   * Generates synthetic training data for DeFi risk prediction
   */
  public generateTrainingData(sampleCount: number = 10000): { data: number[][]; labels: number[] } {
    const data: number[][] = [];
    const labels: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      // Generate synthetic time series data (60 time steps, 12 features)
      const sample: number[] = [];
      
      // Base risk factors
      const baseReliability = Math.random() * 1000;
      const baseConsistency = Math.random() * 1000;
      const baseStaking = Math.random() * 1000;
      const baseGovernance = Math.random() * 1000;
      const baseLiquidity = Math.random() * 1000;
      
      // Market conditions
      const marketVolatility = Math.random() * 100;
      const liquidityRatio = Math.random() * 100;
      
      // Transaction patterns
      const txVolume = Math.random() * 1000000;
      const txFrequency = Math.random() * 100;
      const protocolDiv = Math.random() * 20;
      
      // Historical patterns
      const historicalDefault = Math.random() * 10;
      const socialCredit = Math.random() * 1000;

      // Create time series with some temporal correlation
      for (let t = 0; t < 60; t++) {
        const timeDecay = Math.exp(-t * 0.01); // Recent data more important
        const noise = (Math.random() - 0.5) * 50; // Add noise
        
        sample.push(
          baseReliability * timeDecay + noise,
          baseConsistency * timeDecay + noise,
          baseStaking * timeDecay + noise,
          baseGovernance * timeDecay + noise,
          baseLiquidity * timeDecay + noise,
          txVolume * timeDecay + noise,
          txFrequency * timeDecay + noise,
          protocolDiv * timeDecay + noise,
          marketVolatility + noise * 0.1,
          liquidityRatio + noise * 0.1,
          historicalDefault + noise * 0.01,
          socialCredit * timeDecay + noise
        );
      }

      data.push(sample);

      // Calculate risk score based on features
      const avgReliability = (baseReliability + baseConsistency + baseStaking + baseGovernance + baseLiquidity) / 5;
      const riskAdjustment = marketVolatility * 2 + historicalDefault * 10;
      const riskScore = Math.max(0, Math.min(1000, 1000 - avgReliability + riskAdjustment));
      
      labels.push(riskScore);
    }

    return { data, labels };
  }

  /**
   * Trains a single LSTM model
   */
  public async trainModel(
    config: MLModelConfig,
    trainingData?: { data: number[][]; labels: number[] },
    validationData?: { inputs: number[][]; labels: number[] }
  ): Promise<ModelTrainingJob> {
    try {
      // Generate training data if not provided
      const trainData = trainingData || this.generateTrainingData(8000);
      const valData = validationData || (() => {
        const valSet = this.generateTrainingData(2000);
        return { inputs: valSet.data, labels: valSet.labels };
      })();

      // Create and initialize model
      const model = new LSTMRiskModel(config);
      await model.initialize();

      // Start training
      const trainingJob = await model.train(trainData.data, trainData.labels, valData);
      
      // Store model and job
      this.models.set(config.modelId, model);
      this.trainingJobs.set(trainingJob.jobId, trainingJob);

      return trainingJob;
    } catch (error) {
      throw new MLModelError(`Model training failed: ${error.message}`, config.modelId);
    }
  }

  /**
   * Creates and trains an ensemble of LSTM models
   */
  public async trainEnsemble(
    ensembleId: string,
    modelConfigs: MLModelConfig[],
    weights?: number[]
  ): Promise<ModelEnsemble> {
    if (modelConfigs.length < 2) {
      throw new ValidationError('Ensemble requires at least 2 models');
    }

    try {
      // Default equal weights if not provided
      const ensembleWeights = weights || modelConfigs.map(() => 1 / modelConfigs.length);

      // Create ensemble configuration
      const ensemble: ModelEnsemble = {
        ensembleId,
        name: `Risk Prediction Ensemble ${ensembleId}`,
        models: modelConfigs.map(config => config.modelId),
        weights: ensembleWeights,
        combiningMethod: 'weighted_average',
        performance: {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          auc: 0,
          mse: 0,
          mae: 0,
          validationMetrics: {},
          testMetrics: {}
        },
        isActive: false
      };

      // Create ensemble model
      const ensembleModel = new EnsembleRiskModel(ensemble);
      await ensembleModel.initialize(modelConfigs);

      // Generate diverse training datasets
      const trainingData = this.generateTrainingData(10000);
      const validationData = (() => {
        const valSet = this.generateTrainingData(2000);
        return { inputs: valSet.data, labels: valSet.labels };
      })();

      // Train ensemble
      await ensembleModel.trainEnsemble(trainingData.data, trainingData.labels, validationData);

      // Store ensemble
      this.ensembles.set(ensembleId, ensembleModel);

      return ensembleModel.getEnsemble();
    } catch (error) {
      throw new MLModelError(`Ensemble training failed: ${error.message}`, ensembleId);
    }
  }

  /**
   * Creates a complete training pipeline for 30/90/180-day predictions
   */
  public async createRiskPredictionPipeline(): Promise<{
    models: MLModelConfig[];
    ensemble: ModelEnsemble;
    trainingJobs: ModelTrainingJob[];
  }> {
    try {
      // Create model configurations for different prediction horizons
      const modelConfigs: MLModelConfig[] = [
        this.createModelConfig('lstm_risk_30d', 30),
        this.createModelConfig('lstm_risk_90d', 90, {
          layers: [
            {
              type: 'LSTM',
              units: 80,
              activation: 'tanh',
              dropout: 0.25,
              parameters: { returnSequences: true, recurrentDropout: 0.25 }
            },
            {
              type: 'LSTM',
              units: 40,
              activation: 'tanh',
              dropout: 0.25,
              parameters: { returnSequences: false, recurrentDropout: 0.25 }
            },
            {
              type: 'Dense',
              units: 20,
              activation: 'relu',
              dropout: 0.15,
              parameters: {}
            },
            {
              type: 'Dense',
              units: 1,
              activation: 'sigmoid',
              parameters: {}
            }
          ]
        }),
        this.createModelConfig('lstm_risk_180d', 180, {
          layers: [
            {
              type: 'LSTM',
              units: 96,
              activation: 'tanh',
              dropout: 0.3,
              parameters: { returnSequences: true, recurrentDropout: 0.3 }
            },
            {
              type: 'LSTM',
              units: 48,
              activation: 'tanh',
              dropout: 0.3,
              parameters: { returnSequences: false, recurrentDropout: 0.3 }
            },
            {
              type: 'Dense',
              units: 24,
              activation: 'relu',
              dropout: 0.2,
              parameters: {}
            },
            {
              type: 'Dense',
              units: 1,
              activation: 'sigmoid',
              parameters: {}
            }
          ]
        })
      ];

      // Train individual models
      const trainingJobs: ModelTrainingJob[] = [];
      for (const config of modelConfigs) {
        const job = await this.trainModel(config);
        trainingJobs.push(job);
      }

      // Create ensemble with weighted combination
      // 30-day predictions get higher weight for short-term accuracy
      // 180-day predictions get lower weight due to higher uncertainty
      const ensembleWeights = [0.5, 0.3, 0.2];
      const ensemble = await this.trainEnsemble('risk_prediction_ensemble', modelConfigs, ensembleWeights);

      return {
        models: modelConfigs,
        ensemble,
        trainingJobs
      };
    } catch (error) {
      throw new MLModelError(`Pipeline creation failed: ${error.message}`, 'risk_prediction_pipeline');
    }
  }

  /**
   * Gets training job status
   */
  public getTrainingJob(jobId: string): ModelTrainingJob | undefined {
    return this.trainingJobs.get(jobId);
  }

  /**
   * Gets all training jobs
   */
  public getAllTrainingJobs(): ModelTrainingJob[] {
    return Array.from(this.trainingJobs.values());
  }

  /**
   * Gets trained model
   */
  public getModel(modelId: string): LSTMRiskModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Gets ensemble model
   */
  public getEnsemble(ensembleId: string): EnsembleRiskModel | undefined {
    return this.ensembles.get(ensembleId);
  }

  /**
   * Validates training data quality
   */
  public validateTrainingData(data: number[][], labels: number[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (data.length === 0) {
      issues.push('Training data is empty');
    }

    if (data.length !== labels.length) {
      issues.push('Data and labels length mismatch');
    }

    if (data.length > 0) {
      const featureCount = data[0].length;
      for (let i = 0; i < data.length; i++) {
        if (data[i].length !== featureCount) {
          issues.push(`Inconsistent feature count at sample ${i}`);
          break;
        }
      }
    }

    // Check for missing values
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (isNaN(data[i][j]) || !isFinite(data[i][j])) {
          issues.push(`Invalid value at sample ${i}, feature ${j}`);
        }
      }
    }

    // Check label validity
    for (let i = 0; i < labels.length; i++) {
      if (isNaN(labels[i]) || !isFinite(labels[i]) || labels[i] < 0 || labels[i] > 1000) {
        issues.push(`Invalid label at index ${i}: ${labels[i]}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Exports model for deployment
   */
  public exportModel(modelId: string): { config: MLModelConfig; weights: any } | null {
    const model = this.models.get(modelId);
    if (!model) {
      return null;
    }

    return {
      config: model.getConfig(),
      weights: {} // Simplified - in real implementation would export actual weights
    };
  }

  /**
   * Cleans up completed training jobs
   */
  public cleanupCompletedJobs(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    
    for (const [jobId, job] of this.trainingJobs) {
      if (job.endTime && job.endTime < cutoffTime && 
          (job.status === TrainingStatus.COMPLETED || job.status === TrainingStatus.FAILED)) {
        this.trainingJobs.delete(jobId);
      }
    }
  }
}