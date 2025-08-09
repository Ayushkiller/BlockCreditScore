// Confidence Scoring Service - Implements 70% minimum threshold validation and confidence intervals

import {
  PredictionResponse,
  PredictionRequest,
  MarketContext,
  ModelPerformance,
  PredictionFactor
} from '../../types/ml';
import { CreditProfile } from '../../types/credit';
import { MLModelError, ValidationError } from '../../utils/errors';
import { isValidConfidence } from '../../utils/validation';

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
  width: number;
}

export interface UncertaintyWarning {
  type: 'low_confidence' | 'high_volatility' | 'insufficient_data' | 'model_uncertainty';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  affectedFactors: string[];
}

export interface ConfidenceAssessment {
  baseConfidence: number;
  adjustedConfidence: number;
  confidenceInterval: ConfidenceInterval;
  uncertaintyWarnings: UncertaintyWarning[];
  meetsThreshold: boolean;
  adjustmentFactors: ConfidenceAdjustmentFactor[];
}

export interface ConfidenceAdjustmentFactor {
  name: string;
  impact: number; // -100 to +100
  reason: string;
  weight: number;
}

/**
 * Service for comprehensive confidence scoring and uncertainty assessment
 */
export class ConfidenceScoringService {
  private readonly MINIMUM_CONFIDENCE_THRESHOLD = 70;
  private readonly CONFIDENCE_INTERVAL_Z_SCORE = 1.96; // 95% confidence interval

  /**
   * Evaluates prediction confidence with 70% minimum threshold validation
   */
  public async evaluateConfidence(
    prediction: PredictionResponse,
    creditProfile: CreditProfile,
    marketContext: MarketContext,
    modelPerformance: ModelPerformance
  ): Promise<ConfidenceAssessment> {
    try {
      // Calculate base confidence from multiple sources
      const baseConfidence = this.calculateBaseConfidence(
        prediction,
        creditProfile,
        modelPerformance
      );

      // Apply market volatility and context adjustments
      const adjustmentFactors = this.calculateAdjustmentFactors(
        creditProfile,
        marketContext,
        modelPerformance
      );

      // Calculate adjusted confidence
      const adjustedConfidence = this.applyConfidenceAdjustments(
        baseConfidence,
        adjustmentFactors
      );

      // Calculate confidence interval
      const confidenceInterval = this.calculateConfidenceInterval(
        prediction.prediction,
        adjustedConfidence,
        modelPerformance
      );

      // Generate uncertainty warnings
      const uncertaintyWarnings = this.generateUncertaintyWarnings(
        adjustedConfidence,
        confidenceInterval,
        marketContext,
        creditProfile
      );

      // Check if meets minimum threshold
      const meetsThreshold = adjustedConfidence >= this.MINIMUM_CONFIDENCE_THRESHOLD;

      return {
        baseConfidence,
        adjustedConfidence,
        confidenceInterval,
        uncertaintyWarnings,
        meetsThreshold,
        adjustmentFactors
      };
    } catch (error) {
      throw new MLModelError(`Confidence evaluation failed: ${error.message}`, prediction.modelId);
    }
  }

  /**
   * Calculates base confidence from model performance and data quality
   */
  private calculateBaseConfidence(
    prediction: PredictionResponse,
    creditProfile: CreditProfile,
    modelPerformance: ModelPerformance
  ): number {
    // Start with model's inherent accuracy
    let confidence = modelPerformance.accuracy * 100;

    // Adjust based on data completeness
    const dataCompleteness = this.assessDataCompleteness(creditProfile);
    confidence *= dataCompleteness;

    // Adjust based on prediction certainty (distance from neutral score)
    const predictionCertainty = this.calculatePredictionCertainty(prediction.prediction);
    confidence *= (0.8 + 0.2 * predictionCertainty);

    // Adjust based on feature importance alignment
    const featureAlignment = this.assessFeatureAlignment(prediction.factors);
    confidence *= featureAlignment;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Assesses data completeness across all credit dimensions
   */
  private assessDataCompleteness(creditProfile: CreditProfile): number {
    const dimensions = [
      creditProfile.dimensions.defiReliability,
      creditProfile.dimensions.tradingConsistency,
      creditProfile.dimensions.stakingCommitment,
      creditProfile.dimensions.governanceParticipation,
      creditProfile.dimensions.liquidityProvider
    ];

    let totalCompleteness = 0;
    let validDimensions = 0;

    for (const dimension of dimensions) {
      if (dimension.dataPoints > 0) {
        // Calculate completeness based on data points and confidence
        const dataPointsScore = Math.min(1, dimension.dataPoints / 50); // Normalize to 50 data points
        const confidenceScore = dimension.confidence / 100;
        const dimensionCompleteness = (dataPointsScore + confidenceScore) / 2;
        
        totalCompleteness += dimensionCompleteness;
        validDimensions++;
      }
    }

    if (validDimensions === 0) return 0.1; // Minimum completeness for no data
    
    const averageCompleteness = totalCompleteness / validDimensions;
    
    // Bonus for having data in multiple dimensions
    const diversityBonus = Math.min(0.2, validDimensions / dimensions.length * 0.2);
    
    return Math.min(1, averageCompleteness + diversityBonus);
  }

  /**
   * Calculates prediction certainty based on distance from neutral score
   */
  private calculatePredictionCertainty(prediction: number): number {
    const neutralScore = 500; // Middle of 0-1000 scale
    const maxDistance = 500;
    
    const distance = Math.abs(prediction - neutralScore);
    return Math.min(1, distance / maxDistance);
  }

  /**
   * Assesses alignment between prediction factors and expected importance
   */
  private assessFeatureAlignment(factors: PredictionFactor[]): number {
    if (factors.length === 0) return 0.5; // Neutral if no factors

    // Check if top factors have reasonable importance scores
    const topFactors = factors.slice(0, 3);
    const importanceSum = topFactors.reduce((sum, factor) => sum + factor.importance, 0);
    
    if (importanceSum === 0) return 0.5;
    
    // Good alignment if top factors have high importance and clear impact
    const avgImportance = importanceSum / topFactors.length;
    const impactClarity = topFactors.filter(f => f.impact !== 'neutral').length / topFactors.length;
    
    return (avgImportance / 100) * 0.7 + impactClarity * 0.3;
  }

  /**
   * Calculates confidence adjustment factors based on market and profile context
   */
  private calculateAdjustmentFactors(
    creditProfile: CreditProfile,
    marketContext: MarketContext,
    modelPerformance: ModelPerformance
  ): ConfidenceAdjustmentFactor[] {
    const factors: ConfidenceAdjustmentFactor[] = [];

    // Market volatility adjustment
    const volatilityAdjustment = this.calculateVolatilityAdjustment(marketContext.volatilityIndex);
    if (Math.abs(volatilityAdjustment) > 1) {
      factors.push({
        name: 'Market Volatility',
        impact: volatilityAdjustment,
        reason: volatilityAdjustment < 0 ? 
          'High market volatility increases prediction uncertainty' :
          'Low market volatility improves prediction reliability',
        weight: 0.3
      });
    }

    // Market sentiment adjustment
    const sentimentAdjustment = this.calculateSentimentAdjustment(marketContext.marketSentiment);
    if (Math.abs(sentimentAdjustment) > 1) {
      factors.push({
        name: 'Market Sentiment',
        impact: sentimentAdjustment,
        reason: marketContext.marketSentiment < -0.5 ? 
          'Negative market sentiment increases default risk uncertainty' :
          marketContext.marketSentiment > 0.5 ?
          'Positive market sentiment improves prediction confidence' :
          'Neutral market sentiment has minimal impact',
        weight: 0.2
      });
    }

    // Profile age adjustment
    const profileAge = (Date.now() - creditProfile.lastUpdated) / (24 * 60 * 60 * 1000); // days
    const ageAdjustment = this.calculateProfileAgeAdjustment(profileAge);
    if (Math.abs(ageAdjustment) > 1) {
      factors.push({
        name: 'Profile Age',
        impact: ageAdjustment,
        reason: profileAge < 30 ? 
          'Recent profile with limited historical data' :
          profileAge > 365 ?
          'Mature profile with extensive historical data' :
          'Established profile with good historical coverage',
        weight: 0.15
      });
    }

    // Model performance adjustment
    const performanceAdjustment = this.calculatePerformanceAdjustment(modelPerformance);
    if (Math.abs(performanceAdjustment) > 1) {
      factors.push({
        name: 'Model Performance',
        impact: performanceAdjustment,
        reason: modelPerformance.accuracy > 0.8 ?
          'High model accuracy increases confidence' :
          modelPerformance.accuracy < 0.6 ?
          'Low model accuracy decreases confidence' :
          'Moderate model accuracy',
        weight: 0.25
      });
    }

    // Liquidity adjustment
    const liquidityAdjustment = this.calculateLiquidityAdjustment(marketContext.liquidityIndex);
    if (Math.abs(liquidityAdjustment) > 1) {
      factors.push({
        name: 'Market Liquidity',
        impact: liquidityAdjustment,
        reason: marketContext.liquidityIndex < 30 ?
          'Low market liquidity increases prediction uncertainty' :
          'Adequate market liquidity supports prediction reliability',
        weight: 0.1
      });
    }

    return factors;
  }

  /**
   * Calculates volatility-based confidence adjustment
   */
  private calculateVolatilityAdjustment(volatilityIndex: number): number {
    // Higher volatility reduces confidence
    if (volatilityIndex > 80) return -25; // High volatility
    if (volatilityIndex > 60) return -15; // Moderate-high volatility
    if (volatilityIndex < 20) return +10; // Low volatility
    if (volatilityIndex < 40) return +5;  // Moderate-low volatility
    return 0; // Normal volatility
  }

  /**
   * Calculates sentiment-based confidence adjustment
   */
  private calculateSentimentAdjustment(sentiment: number): number {
    // Extreme sentiment (positive or negative) can reduce confidence
    if (Math.abs(sentiment) > 0.8) return -10; // Extreme sentiment
    if (Math.abs(sentiment) > 0.6) return -5;  // Strong sentiment
    if (Math.abs(sentiment) < 0.2) return +5;  // Neutral sentiment
    return 0;
  }

  /**
   * Calculates profile age-based confidence adjustment
   */
  private calculateProfileAgeAdjustment(ageInDays: number): number {
    if (ageInDays < 7) return -20;    // Very new profile
    if (ageInDays < 30) return -10;   // New profile
    if (ageInDays > 365) return +10;  // Mature profile
    if (ageInDays > 180) return +5;   // Established profile
    return 0; // Standard profile age
  }

  /**
   * Calculates model performance-based confidence adjustment
   */
  private calculatePerformanceAdjustment(performance: ModelPerformance): number {
    const accuracy = performance.accuracy;
    if (accuracy > 0.9) return +15;   // Excellent performance
    if (accuracy > 0.8) return +10;   // Good performance
    if (accuracy < 0.5) return -20;   // Poor performance
    if (accuracy < 0.6) return -10;   // Below average performance
    return 0; // Average performance
  }

  /**
   * Calculates liquidity-based confidence adjustment
   */
  private calculateLiquidityAdjustment(liquidityIndex: number): number {
    if (liquidityIndex < 20) return -15; // Very low liquidity
    if (liquidityIndex < 40) return -5;  // Low liquidity
    if (liquidityIndex > 80) return +5;  // High liquidity
    return 0; // Normal liquidity
  }

  /**
   * Applies confidence adjustments to base confidence
   */
  private applyConfidenceAdjustments(
    baseConfidence: number,
    adjustmentFactors: ConfidenceAdjustmentFactor[]
  ): number {
    let adjustedConfidence = baseConfidence;

    for (const factor of adjustmentFactors) {
      const weightedImpact = factor.impact * factor.weight;
      adjustedConfidence += weightedImpact;
    }

    return Math.max(0, Math.min(100, adjustedConfidence));
  }

  /**
   * Calculates confidence interval for the prediction
   */
  private calculateConfidenceInterval(
    prediction: number,
    confidence: number,
    modelPerformance: ModelPerformance
  ): ConfidenceInterval {
    // Use model's MAE (Mean Absolute Error) as basis for interval width
    const baseError = modelPerformance.mae || modelPerformance.mse ? Math.sqrt(modelPerformance.mse!) : 50;
    
    // Adjust interval width based on confidence level
    const confidenceMultiplier = Math.max(0.5, (100 - confidence) / 100);
    const intervalWidth = baseError * confidenceMultiplier * this.CONFIDENCE_INTERVAL_Z_SCORE;

    const lower = Math.max(0, prediction - intervalWidth);
    const upper = Math.min(1000, prediction + intervalWidth);

    return {
      lower: Math.round(lower),
      upper: Math.round(upper),
      confidence: Math.round(confidence),
      width: Math.round(upper - lower)
    };
  }

  /**
   * Generates uncertainty warnings based on confidence assessment
   */
  private generateUncertaintyWarnings(
    confidence: number,
    confidenceInterval: ConfidenceInterval,
    marketContext: MarketContext,
    creditProfile: CreditProfile
  ): UncertaintyWarning[] {
    const warnings: UncertaintyWarning[] = [];

    // Low confidence warning
    if (confidence < this.MINIMUM_CONFIDENCE_THRESHOLD) {
      const severity = confidence < 50 ? 'critical' : confidence < 60 ? 'high' : 'medium';
      warnings.push({
        type: 'low_confidence',
        severity,
        message: `Prediction confidence (${confidence.toFixed(1)}%) is below the minimum threshold of ${this.MINIMUM_CONFIDENCE_THRESHOLD}%`,
        recommendation: 'Consider gathering more transaction data or waiting for additional market stability before making lending decisions',
        affectedFactors: ['Overall prediction reliability']
      });
    }

    // High volatility warning
    if (marketContext.volatilityIndex > 70) {
      warnings.push({
        type: 'high_volatility',
        severity: marketContext.volatilityIndex > 85 ? 'high' : 'medium',
        message: `High market volatility (${marketContext.volatilityIndex}) may affect prediction accuracy`,
        recommendation: 'Monitor market conditions closely and consider shorter prediction horizons during volatile periods',
        affectedFactors: ['Market-dependent risk factors']
      });
    }

    // Wide confidence interval warning
    if (confidenceInterval.width > 200) {
      warnings.push({
        type: 'model_uncertainty',
        severity: confidenceInterval.width > 300 ? 'high' : 'medium',
        message: `Wide prediction range (${confidenceInterval.lower}-${confidenceInterval.upper}) indicates high uncertainty`,
        recommendation: 'Consider additional data sources or alternative risk assessment methods',
        affectedFactors: ['Prediction precision']
      });
    }

    // Insufficient data warning
    const dataCompleteness = this.assessDataCompleteness(creditProfile);
    if (dataCompleteness < 0.5) {
      warnings.push({
        type: 'insufficient_data',
        severity: dataCompleteness < 0.3 ? 'high' : 'medium',
        message: 'Limited transaction history may affect prediction reliability',
        recommendation: 'Encourage user to connect additional wallets or wait for more transaction history',
        affectedFactors: ['Data quality', 'Historical patterns']
      });
    }

    return warnings;
  }

  /**
   * Validates if prediction meets confidence requirements
   */
  public validateConfidenceThreshold(
    confidenceAssessment: ConfidenceAssessment,
    customThreshold?: number
  ): { isValid: boolean; reason?: string } {
    const threshold = customThreshold || this.MINIMUM_CONFIDENCE_THRESHOLD;
    
    if (!confidenceAssessment.meetsThreshold || confidenceAssessment.adjustedConfidence < threshold) {
      return {
        isValid: false,
        reason: `Prediction confidence (${confidenceAssessment.adjustedConfidence.toFixed(1)}%) is below required threshold (${threshold}%)`
      };
    }

    // Check for critical warnings
    const criticalWarnings = confidenceAssessment.uncertaintyWarnings.filter(w => w.severity === 'critical');
    if (criticalWarnings.length > 0) {
      return {
        isValid: false,
        reason: `Critical uncertainty detected: ${criticalWarnings[0].message}`
      };
    }

    return { isValid: true };
  }

  /**
   * Gets confidence scoring configuration
   */
  public getConfiguration(): {
    minimumThreshold: number;
    confidenceIntervalZScore: number;
    adjustmentWeights: Record<string, number>;
  } {
    return {
      minimumThreshold: this.MINIMUM_CONFIDENCE_THRESHOLD,
      confidenceIntervalZScore: this.CONFIDENCE_INTERVAL_Z_SCORE,
      adjustmentWeights: {
        marketVolatility: 0.3,
        marketSentiment: 0.2,
        modelPerformance: 0.25,
        profileAge: 0.15,
        marketLiquidity: 0.1
      }
    };
  }
}