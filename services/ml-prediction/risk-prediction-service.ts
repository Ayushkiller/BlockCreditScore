// Risk Prediction Service - Main Service Implementation

import {
  MLModelConfig,
  PredictionRequest,
  PredictionResponse,
  ModelEnsemble,
  MarketContext
} from '../../types/ml';
import { RiskPrediction, PredictionData, RiskFactor, CreditProfile } from '../../types/credit';
import { LSTMRiskModel } from './lstm-model';
import { EnsembleRiskModel } from './ensemble-model';
import { ModelTrainingPipeline } from './training-pipeline';
import { MLModelError, ValidationError, asyncErrorHandler } from '../../utils/errors';
import { isValidConfidence } from '../../utils/validation';
import { 
  ConfidenceScoringService, 
  ConfidenceAssessment, 
  UncertaintyWarning 
} from './confidence-scoring-service';
import { 
  MarketVolatilityAdjustmentService, 
  VolatilityAdjustment 
} from './market-volatility-adjustment';

/**
 * Main Risk Prediction Service
 * Provides 30/90/180-day risk predictions using LSTM models and ensembles
 */
export class RiskPredictionService {
  private pipeline: ModelTrainingPipeline;
  private models: Map<string, LSTMRiskModel> = new Map();
  private ensembles: Map<string, EnsembleRiskModel> = new Map();
  private confidenceService: ConfidenceScoringService;
  private volatilityService: MarketVolatilityAdjustmentService;
  private isInitialized: boolean = false;

  constructor() {
    this.pipeline = new ModelTrainingPipeline();
    this.confidenceService = new ConfidenceScoringService();
    this.volatilityService = new MarketVolatilityAdjustmentService();
  }

  /**
   * Initializes the risk prediction service
   */
  public async initialize(): Promise<void> {
    try {
      // Create and train the complete risk prediction pipeline
      const pipelineResult = await this.pipeline.createRiskPredictionPipeline();
      
      // Store trained models
      for (const config of pipelineResult.models) {
        const model = this.pipeline.getModel(config.modelId);
        if (model) {
          this.models.set(config.modelId, model);
        }
      }

      // Store ensemble
      const ensemble = this.pipeline.getEnsemble(pipelineResult.ensemble.ensembleId);
      if (ensemble) {
        this.ensembles.set(pipelineResult.ensemble.ensembleId, ensemble);
      }

      this.isInitialized = true;
    } catch (error) {
      throw new MLModelError(`Service initialization failed: ${error.message}`, 'risk_prediction_service');
    }
  }

  /**
   * Generates comprehensive risk predictions for a user with confidence scoring and market volatility adjustments
   */
  public async generateRiskPrediction(
    userAddress: string,
    creditProfile: CreditProfile,
    marketContext?: MarketContext
  ): Promise<RiskPrediction & { 
    confidenceAssessments: Record<string, ConfidenceAssessment>;
    volatilityAdjustments: Record<string, VolatilityAdjustment>;
    uncertaintyWarnings: UncertaintyWarning[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Extract features from credit profile
      const features = this.extractFeaturesFromProfile(creditProfile, marketContext);

      // Generate base predictions for all time horizons
      const thirtyDayPrediction = await this.predictRisk(userAddress, features, 30);
      const ninetyDayPrediction = await this.predictRisk(userAddress, features, 90);
      const oneEightyDayPrediction = await this.predictRisk(userAddress, features, 180);

      // Apply market volatility adjustments if market context is provided
      const volatilityAdjustments: Record<string, VolatilityAdjustment> = {};
      let adjustedThirtyDay = thirtyDayPrediction;
      let adjustedNinetyDay = ninetyDayPrediction;
      let adjustedOneEightyDay = oneEightyDayPrediction;

      if (marketContext) {
        const modelConfig = this.getModelConfig(thirtyDayPrediction.modelId);
        
        volatilityAdjustments.thirtyDay = this.volatilityService.adjustPredictionForMarketConditions(
          thirtyDayPrediction, marketContext, modelConfig
        );
        volatilityAdjustments.ninetyDay = this.volatilityService.adjustPredictionForMarketConditions(
          ninetyDayPrediction, marketContext, modelConfig
        );
        volatilityAdjustments.oneEightyDay = this.volatilityService.adjustPredictionForMarketConditions(
          oneEightyDayPrediction, marketContext, modelConfig
        );

        // Update predictions with adjusted values
        adjustedThirtyDay = { ...thirtyDayPrediction, prediction: volatilityAdjustments.thirtyDay.adjustedPrediction };
        adjustedNinetyDay = { ...ninetyDayPrediction, prediction: volatilityAdjustments.ninetyDay.adjustedPrediction };
        adjustedOneEightyDay = { ...oneEightyDayPrediction, prediction: volatilityAdjustments.oneEightyDay.adjustedPrediction };
      }

      // Evaluate confidence for each prediction
      const confidenceAssessments: Record<string, ConfidenceAssessment> = {};
      const modelPerformance = this.getModelPerformance();
      const defaultModelPerformance = Object.values(modelPerformance)[0] || {
        accuracy: 0.75, precision: 0.7, recall: 0.7, f1Score: 0.7, auc: 0.75, mse: 2500, mae: 50,
        validationMetrics: {}, testMetrics: {}
      };

      if (marketContext) {
        confidenceAssessments.thirtyDay = await this.confidenceService.evaluateConfidence(
          adjustedThirtyDay, creditProfile, marketContext, defaultModelPerformance
        );
        confidenceAssessments.ninetyDay = await this.confidenceService.evaluateConfidence(
          adjustedNinetyDay, creditProfile, marketContext, defaultModelPerformance
        );
        confidenceAssessments.oneEightyDay = await this.confidenceService.evaluateConfidence(
          adjustedOneEightyDay, creditProfile, marketContext, defaultModelPerformance
        );
      }

      // Collect all uncertainty warnings
      const uncertaintyWarnings: UncertaintyWarning[] = [];
      Object.values(confidenceAssessments).forEach(assessment => {
        uncertaintyWarnings.push(...assessment.uncertaintyWarnings);
      });

      // Update confidence values in predictions if assessments are available
      if (confidenceAssessments.thirtyDay) {
        adjustedThirtyDay.confidence = confidenceAssessments.thirtyDay.adjustedConfidence;
      }
      if (confidenceAssessments.ninetyDay) {
        adjustedNinetyDay.confidence = confidenceAssessments.ninetyDay.adjustedConfidence;
      }
      if (confidenceAssessments.oneEightyDay) {
        adjustedOneEightyDay.confidence = confidenceAssessments.oneEightyDay.adjustedConfidence;
      }

      return {
        thirtyDay: {
          riskScore: adjustedThirtyDay.prediction,
          confidence: adjustedThirtyDay.confidence,
          factors: this.convertToRiskFactors(adjustedThirtyDay.factors)
        },
        ninetyDay: {
          riskScore: adjustedNinetyDay.prediction,
          confidence: adjustedNinetyDay.confidence,
          factors: this.convertToRiskFactors(adjustedNinetyDay.factors)
        },
        oneEightyDay: {
          riskScore: adjustedOneEightyDay.prediction,
          confidence: adjustedOneEightyDay.confidence,
          factors: this.convertToRiskFactors(adjustedOneEightyDay.factors)
        },
        lastUpdated: Date.now(),
        confidenceAssessments,
        volatilityAdjustments,
        uncertaintyWarnings
      };
    } catch (error) {
      throw new MLModelError(`Risk prediction failed: ${error.message}`, userAddress);
    }
  }

  /**
   * Predicts risk for a specific time horizon
   */
  private async predictRisk(
    userAddress: string,
    features: Record<string, any>,
    predictionHorizon: number
  ): Promise<PredictionResponse> {
    // Use ensemble if available, otherwise fall back to individual model
    const ensembleId = 'risk_prediction_ensemble';
    const ensemble = this.ensembles.get(ensembleId);
    
    if (ensemble) {
      const request: PredictionRequest = {
        userAddress,
        modelId: ensembleId,
        features,
        predictionHorizon,
        confidenceThreshold: 70
      };
      return await ensemble.predict(request);
    }

    // Fall back to individual model
    const modelId = `lstm_risk_${predictionHorizon}d`;
    const model = this.models.get(modelId);
    
    if (!model) {
      throw new MLModelError(`Model not found: ${modelId}`, modelId);
    }

    const request: PredictionRequest = {
      userAddress,
      modelId,
      features,
      predictionHorizon,
      confidenceThreshold: 70
    };

    return await model.predict(request);
  }

  /**
   * Extracts features from credit profile for ML prediction
   */
  private extractFeaturesFromProfile(
    profile: CreditProfile,
    marketContext?: MarketContext
  ): Record<string, any> {
    const features: Record<string, any> = {
      // Core credit dimensions
      defiReliabilityScore: profile.dimensions.defiReliability.score,
      tradingConsistencyScore: profile.dimensions.tradingConsistency.score,
      stakingCommitmentScore: profile.dimensions.stakingCommitment.score,
      governanceParticipationScore: profile.dimensions.governanceParticipation.score,
      liquidityProviderScore: profile.dimensions.liquidityProvider.score,

      // Confidence scores (data quality indicators)
      defiReliabilityConfidence: profile.dimensions.defiReliability.confidence,
      tradingConsistencyConfidence: profile.dimensions.tradingConsistency.confidence,
      stakingCommitmentConfidence: profile.dimensions.stakingCommitment.confidence,
      governanceParticipationConfidence: profile.dimensions.governanceParticipation.confidence,
      liquidityProviderConfidence: profile.dimensions.liquidityProvider.confidence,

      // Data points (activity level indicators)
      defiReliabilityDataPoints: profile.dimensions.defiReliability.dataPoints,
      tradingConsistencyDataPoints: profile.dimensions.tradingConsistency.dataPoints,
      stakingCommitmentDataPoints: profile.dimensions.stakingCommitment.dataPoints,
      governanceParticipationDataPoints: profile.dimensions.governanceParticipation.dataPoints,
      liquidityProviderDataPoints: profile.dimensions.liquidityProvider.dataPoints,

      // Trend indicators
      defiReliabilityTrend: this.encodeTrend(profile.dimensions.defiReliability.trend),
      tradingConsistencyTrend: this.encodeTrend(profile.dimensions.tradingConsistency.trend),
      stakingCommitmentTrend: this.encodeTrend(profile.dimensions.stakingCommitment.trend),
      governanceParticipationTrend: this.encodeTrend(profile.dimensions.governanceParticipation.trend),
      liquidityProviderTrend: this.encodeTrend(profile.dimensions.liquidityProvider.trend),

      // Social credit indicators
      socialCreditScore: this.calculateSocialCreditScore(profile.socialCredit),
      
      // Portfolio diversity
      linkedWalletsCount: profile.linkedWallets.length,
      achievementsCount: profile.achievements.length,

      // Time-based features
      profileAge: (Date.now() - profile.lastUpdated) / (24 * 60 * 60 * 1000), // days
      lastUpdateRecency: (Date.now() - profile.lastUpdated) / (60 * 60 * 1000), // hours

      // Market context features
      marketVolatility: marketContext?.volatilityIndex || 50,
      marketSentiment: marketContext?.marketSentiment || 0,
      liquidityIndex: marketContext?.liquidityIndex || 50
    };

    // Add macro factors if available
    if (marketContext?.macroFactors) {
      for (const factor of marketContext.macroFactors) {
        features[`macro_${factor.name.toLowerCase().replace(/\s+/g, '_')}`] = factor.value;
      }
    }

    return features;
  }

  /**
   * Encodes trend strings to numerical values
   */
  private encodeTrend(trend: 'improving' | 'stable' | 'declining'): number {
    switch (trend) {
      case 'improving': return 1;
      case 'stable': return 0;
      case 'declining': return -1;
      default: return 0;
    }
  }

  /**
   * Calculates a simplified social credit score
   */
  private calculateSocialCreditScore(socialCredit: any): number {
    // Simplified calculation - in real implementation would be more sophisticated
    if (!socialCredit) return 0;
    
    let score = 0;
    
    // P2P lending history
    if (socialCredit.p2pLendingHistory?.length > 0) {
      const successRate = socialCredit.p2pLendingHistory.filter(
        (loan: any) => loan.repaymentStatus === 'completed'
      ).length / socialCredit.p2pLendingHistory.length;
      score += successRate * 300;
    }

    // Community feedback
    if (socialCredit.communityFeedback?.length > 0) {
      const avgRating = socialCredit.communityFeedback.reduce(
        (sum: number, feedback: any) => sum + (feedback.rating || 0), 0
      ) / socialCredit.communityFeedback.length;
      score += avgRating * 100;
    }

    // Reputation score
    if (socialCredit.reputationScore) {
      score += socialCredit.reputationScore;
    }

    return Math.min(1000, score);
  }

  /**
   * Converts ML prediction factors to credit risk factors
   */
  private convertToRiskFactors(mlFactors: any[]): RiskFactor[] {
    return mlFactors.map(factor => ({
      name: factor.feature,
      impact: factor.importance * (factor.impact === 'positive' ? -1 : 1), // Negative impact = higher risk
      description: factor.description
    }));
  }

  /**
   * Updates model with new training data
   */
  public async updateModels(
    trainingData: { data: number[][]; labels: number[] },
    validationData?: { inputs: number[][]; labels: number[] }
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new MLModelError('Service not initialized', 'risk_prediction_service');
    }

    try {
      // Validate training data
      const validation = this.pipeline.validateTrainingData(trainingData.data, trainingData.labels);
      if (!validation.isValid) {
        throw new ValidationError(`Invalid training data: ${validation.issues.join(', ')}`);
      }

      // Retrain all models
      const retrainingPromises: Promise<any>[] = [];
      
      for (const [modelId, model] of this.models) {
        const config = model.getConfig();
        retrainingPromises.push(
          this.pipeline.trainModel(config, trainingData, validationData)
        );
      }

      await Promise.all(retrainingPromises);

      // Update ensemble if it exists
      const ensembleId = 'risk_prediction_ensemble';
      const ensemble = this.ensembles.get(ensembleId);
      if (ensemble) {
        await ensemble.trainEnsemble(trainingData.data, trainingData.labels, validationData);
      }
    } catch (error) {
      throw new MLModelError(`Model update failed: ${error.message}`, 'risk_prediction_service');
    }
  }

  /**
   * Gets model performance metrics
   */
  public getModelPerformance(): Record<string, any> {
    const performance: Record<string, any> = {};

    // Individual model performance
    for (const [modelId, model] of this.models) {
      const config = model.getConfig();
      performance[modelId] = config.performance;
    }

    // Ensemble performance
    for (const [ensembleId, ensemble] of this.ensembles) {
      const ensembleConfig = ensemble.getEnsemble();
      performance[ensembleId] = ensembleConfig.performance;
    }

    return performance;
  }

  /**
   * Validates prediction confidence against minimum threshold with comprehensive assessment
   */
  public validatePredictionConfidence(
    prediction: PredictionResponse, 
    minimumConfidence: number = 70,
    confidenceAssessment?: ConfidenceAssessment
  ): { isValid: boolean; reason?: string; warnings: UncertaintyWarning[] } {
    const warnings: UncertaintyWarning[] = [];
    
    // Basic confidence validation
    if (!isValidConfidence(prediction.confidence) || prediction.confidence < minimumConfidence) {
      return {
        isValid: false,
        reason: `Prediction confidence (${prediction.confidence}%) is below minimum threshold (${minimumConfidence}%)`,
        warnings
      };
    }

    // Enhanced validation with confidence assessment if available
    if (confidenceAssessment) {
      const validationResult = this.confidenceService.validateConfidenceThreshold(
        confidenceAssessment, 
        minimumConfidence
      );
      
      if (!validationResult.isValid) {
        return {
          isValid: false,
          reason: validationResult.reason,
          warnings: confidenceAssessment.uncertaintyWarnings
        };
      }

      warnings.push(...confidenceAssessment.uncertaintyWarnings);
    }

    return { isValid: true, warnings };
  }

  /**
   * Adjusts model parameters dynamically based on market conditions
   */
  public async adjustModelParametersForMarketConditions(marketContext: MarketContext): Promise<void> {
    if (!this.isInitialized) {
      throw new MLModelError('Service not initialized', 'risk_prediction_service');
    }

    try {
      // Adjust parameters for all models
      for (const [modelId, model] of this.models) {
        const currentConfig = model.getConfig();
        const adjustments = this.volatilityService.adjustModelParameters(currentConfig, marketContext);
        
        if (adjustments.length > 0) {
          // Apply parameter adjustments
          const updatedHyperparameters = { ...currentConfig.hyperparameters };
          
          for (const adjustment of adjustments) {
            updatedHyperparameters[adjustment.parameterName] = adjustment.adjustedValue;
          }

          model.updateConfig({
            ...currentConfig,
            hyperparameters: updatedHyperparameters
          });
        }
      }
    } catch (error) {
      throw new MLModelError(`Model parameter adjustment failed: ${error.message}`, 'risk_prediction_service');
    }
  }

  /**
   * Gets service status and health information
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    modelsLoaded: number;
    ensemblesLoaded: number;
    lastTrainingJobs: any[];
  } {
    return {
      isInitialized: this.isInitialized,
      modelsLoaded: this.models.size,
      ensemblesLoaded: this.ensembles.size,
      lastTrainingJobs: this.pipeline.getAllTrainingJobs().slice(-5)
    };
  }

  /**
   * Gets model configuration for a specific model
   */
  private getModelConfig(modelId: string): MLModelConfig {
    const model = this.models.get(modelId);
    if (model) {
      return model.getConfig();
    }

    // Return default config if model not found
    return {
      modelId,
      name: 'Default LSTM Risk Model',
      version: '1.0.0',
      type: ModelType.RISK_PREDICTION,
      architecture: {
        type: 'LSTM',
        inputShape: [12],
        outputShape: [1],
        layers: [{ type: 'LSTM', units: 64, parameters: {} }]
      },
      hyperparameters: {
        learningRate: 0.001,
        batchSize: 32,
        epochs: 100,
        dropout: 0.2,
        regularization: 0.01
      },
      trainingData: {
        sources: [],
        timeRange: { start: 0, end: 0 },
        features: [],
        targetVariable: 'risk_score',
        validationSplit: 0.2,
        testSplit: 0.1
      },
      performance: {
        accuracy: 0.75,
        precision: 0.7,
        recall: 0.7,
        f1Score: 0.7,
        auc: 0.75,
        mse: 2500,
        mae: 50,
        validationMetrics: {},
        testMetrics: {}
      },
      lastTrained: Date.now(),
      isActive: true
    };
  }

  /**
   * Gets confidence scoring service configuration
   */
  public getConfidenceConfiguration() {
    return this.confidenceService.getConfiguration();
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.models.clear();
    this.ensembles.clear();
    this.pipeline.cleanupCompletedJobs();
    this.isInitialized = false;
  }
}