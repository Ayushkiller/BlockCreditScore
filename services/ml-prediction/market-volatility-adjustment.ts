// Market Volatility Adjustment Service - Dynamic model parameter adjustment for market conditions

import {
  MLModelConfig,
  MarketContext,
  ModelPerformance,
  PredictionRequest,
  PredictionResponse,
  MacroFactor
} from '../../types/ml';
import { MLModelError, ValidationError } from '../../utils/errors';

export interface VolatilityAdjustment {
  originalPrediction: number;
  adjustedPrediction: number;
  adjustmentFactor: number;
  adjustmentReason: string;
  volatilityLevel: VolatilityLevel;
  marketConditions: MarketConditionAssessment;
}

export interface MarketConditionAssessment {
  volatilityLevel: VolatilityLevel;
  sentimentLevel: SentimentLevel;
  liquidityLevel: LiquidityLevel;
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  dominantFactors: string[];
}

export enum VolatilityLevel {
  VERY_LOW = 'very_low',    // < 20
  LOW = 'low',              // 20-40
  MODERATE = 'moderate',    // 40-60
  HIGH = 'high',            // 60-80
  VERY_HIGH = 'very_high'   // > 80
}

export enum SentimentLevel {
  VERY_NEGATIVE = 'very_negative',  // < -0.6
  NEGATIVE = 'negative',            // -0.6 to -0.2
  NEUTRAL = 'neutral',              // -0.2 to 0.2
  POSITIVE = 'positive',            // 0.2 to 0.6
  VERY_POSITIVE = 'very_positive'   // > 0.6
}

export enum LiquidityLevel {
  VERY_LOW = 'very_low',    // < 20
  LOW = 'low',              // 20-40
  MODERATE = 'moderate',    // 40-60
  HIGH = 'high',            // 60-80
  VERY_HIGH = 'very_high'   // > 80
}

export interface ModelParameterAdjustment {
  parameterName: string;
  originalValue: number;
  adjustedValue: number;
  adjustmentRatio: number;
  reason: string;
}

/**
 * Service for dynamic model parameter adjustment based on market volatility and conditions
 */
export class MarketVolatilityAdjustmentService {
  private readonly VOLATILITY_THRESHOLDS = {
    veryLow: 20,
    low: 40,
    moderate: 60,
    high: 80
  };

  private readonly SENTIMENT_THRESHOLDS = {
    veryNegative: -0.6,
    negative: -0.2,
    positive: 0.2,
    veryPositive: 0.6
  };

  private readonly LIQUIDITY_THRESHOLDS = {
    veryLow: 20,
    low: 40,
    moderate: 60,
    high: 80
  };

  /**
   * Adjusts prediction based on current market volatility and conditions
   */
  public adjustPredictionForMarketConditions(
    originalPrediction: PredictionResponse,
    marketContext: MarketContext,
    modelConfig: MLModelConfig
  ): VolatilityAdjustment {
    try {
      // Assess current market conditions
      const marketConditions = this.assessMarketConditions(marketContext);
      
      // Calculate volatility-based adjustment factor
      const adjustmentFactor = this.calculateVolatilityAdjustmentFactor(
        marketConditions,
        originalPrediction.prediction
      );

      // Apply adjustment to prediction
      const adjustedPrediction = this.applyPredictionAdjustment(
        originalPrediction.prediction,
        adjustmentFactor,
        marketConditions
      );

      // Generate adjustment reason
      const adjustmentReason = this.generateAdjustmentReason(
        marketConditions,
        adjustmentFactor
      );

      return {
        originalPrediction: originalPrediction.prediction,
        adjustedPrediction,
        adjustmentFactor,
        adjustmentReason,
        volatilityLevel: marketConditions.volatilityLevel,
        marketConditions
      };
    } catch (error) {
      throw new MLModelError(`Market volatility adjustment failed: ${error.message}`, originalPrediction.modelId);
    }
  }

  /**
   * Dynamically adjusts model parameters based on market conditions
   */
  public adjustModelParameters(
    modelConfig: MLModelConfig,
    marketContext: MarketContext
  ): ModelParameterAdjustment[] {
    const adjustments: ModelParameterAdjustment[] = [];
    const marketConditions = this.assessMarketConditions(marketContext);

    // Adjust learning rate based on volatility
    if (modelConfig.hyperparameters.learningRate) {
      const learningRateAdjustment = this.calculateLearningRateAdjustment(marketConditions);
      if (Math.abs(learningRateAdjustment - 1.0) > 0.05) {
        adjustments.push({
          parameterName: 'learningRate',
          originalValue: modelConfig.hyperparameters.learningRate,
          adjustedValue: modelConfig.hyperparameters.learningRate * learningRateAdjustment,
          adjustmentRatio: learningRateAdjustment,
          reason: this.getLearningRateAdjustmentReason(marketConditions, learningRateAdjustment)
        });
      }
    }

    // Adjust regularization based on market uncertainty
    if (modelConfig.hyperparameters.regularization) {
      const regularizationAdjustment = this.calculateRegularizationAdjustment(marketConditions);
      if (Math.abs(regularizationAdjustment - 1.0) > 0.05) {
        adjustments.push({
          parameterName: 'regularization',
          originalValue: modelConfig.hyperparameters.regularization,
          adjustedValue: modelConfig.hyperparameters.regularization * regularizationAdjustment,
          adjustmentRatio: regularizationAdjustment,
          reason: this.getRegularizationAdjustmentReason(marketConditions, regularizationAdjustment)
        });
      }
    }

    // Adjust dropout rate for model robustness
    if (modelConfig.hyperparameters.dropout) {
      const dropoutAdjustment = this.calculateDropoutAdjustment(marketConditions);
      if (Math.abs(dropoutAdjustment - 1.0) > 0.05) {
        adjustments.push({
          parameterName: 'dropout',
          originalValue: modelConfig.hyperparameters.dropout,
          adjustedValue: Math.min(0.8, modelConfig.hyperparameters.dropout * dropoutAdjustment),
          adjustmentRatio: dropoutAdjustment,
          reason: this.getDropoutAdjustmentReason(marketConditions, dropoutAdjustment)
        });
      }
    }

    return adjustments;
  }

  /**
   * Assesses current market conditions across multiple dimensions
   */
  private assessMarketConditions(marketContext: MarketContext): MarketConditionAssessment {
    const volatilityLevel = this.categorizeVolatility(marketContext.volatilityIndex);
    const sentimentLevel = this.categorizeSentiment(marketContext.marketSentiment);
    const liquidityLevel = this.categorizeLiquidity(marketContext.liquidityIndex);

    // Determine overall risk level
    const overallRiskLevel = this.calculateOverallRiskLevel(
      volatilityLevel,
      sentimentLevel,
      liquidityLevel
    );

    // Identify dominant risk factors
    const dominantFactors = this.identifyDominantFactors(
      marketContext,
      volatilityLevel,
      sentimentLevel,
      liquidityLevel
    );

    return {
      volatilityLevel,
      sentimentLevel,
      liquidityLevel,
      overallRiskLevel,
      dominantFactors
    };
  }

  /**
   * Categorizes volatility level based on index value
   */
  private categorizeVolatility(volatilityIndex: number): VolatilityLevel {
    if (volatilityIndex < this.VOLATILITY_THRESHOLDS.veryLow) return VolatilityLevel.VERY_LOW;
    if (volatilityIndex < this.VOLATILITY_THRESHOLDS.low) return VolatilityLevel.LOW;
    if (volatilityIndex < this.VOLATILITY_THRESHOLDS.moderate) return VolatilityLevel.MODERATE;
    if (volatilityIndex < this.VOLATILITY_THRESHOLDS.high) return VolatilityLevel.HIGH;
    return VolatilityLevel.VERY_HIGH;
  }

  /**
   * Categorizes market sentiment level
   */
  private categorizeSentiment(sentiment: number): SentimentLevel {
    if (sentiment < this.SENTIMENT_THRESHOLDS.veryNegative) return SentimentLevel.VERY_NEGATIVE;
    if (sentiment < this.SENTIMENT_THRESHOLDS.negative) return SentimentLevel.NEGATIVE;
    if (sentiment < this.SENTIMENT_THRESHOLDS.positive) return SentimentLevel.NEUTRAL;
    if (sentiment < this.SENTIMENT_THRESHOLDS.veryPositive) return SentimentLevel.POSITIVE;
    return SentimentLevel.VERY_POSITIVE;
  }

  /**
   * Categorizes liquidity level based on index value
   */
  private categorizeLiquidity(liquidityIndex: number): LiquidityLevel {
    if (liquidityIndex < this.LIQUIDITY_THRESHOLDS.veryLow) return LiquidityLevel.VERY_LOW;
    if (liquidityIndex < this.LIQUIDITY_THRESHOLDS.low) return LiquidityLevel.LOW;
    if (liquidityIndex < this.LIQUIDITY_THRESHOLDS.moderate) return LiquidityLevel.MODERATE;
    if (liquidityIndex < this.LIQUIDITY_THRESHOLDS.high) return LiquidityLevel.HIGH;
    return LiquidityLevel.VERY_HIGH;
  }

  /**
   * Calculates overall risk level from individual components
   */
  private calculateOverallRiskLevel(
    volatility: VolatilityLevel,
    sentiment: SentimentLevel,
    liquidity: LiquidityLevel
  ): 'low' | 'moderate' | 'high' | 'extreme' {
    let riskScore = 0;

    // Volatility contribution
    switch (volatility) {
      case VolatilityLevel.VERY_HIGH: riskScore += 4; break;
      case VolatilityLevel.HIGH: riskScore += 3; break;
      case VolatilityLevel.MODERATE: riskScore += 2; break;
      case VolatilityLevel.LOW: riskScore += 1; break;
      case VolatilityLevel.VERY_LOW: riskScore += 0; break;
    }

    // Sentiment contribution (extreme sentiment increases risk)
    switch (sentiment) {
      case SentimentLevel.VERY_NEGATIVE:
      case SentimentLevel.VERY_POSITIVE: riskScore += 2; break;
      case SentimentLevel.NEGATIVE:
      case SentimentLevel.POSITIVE: riskScore += 1; break;
      case SentimentLevel.NEUTRAL: riskScore += 0; break;
    }

    // Liquidity contribution (low liquidity increases risk)
    switch (liquidity) {
      case LiquidityLevel.VERY_LOW: riskScore += 3; break;
      case LiquidityLevel.LOW: riskScore += 2; break;
      case LiquidityLevel.MODERATE: riskScore += 1; break;
      case LiquidityLevel.HIGH:
      case LiquidityLevel.VERY_HIGH: riskScore += 0; break;
    }

    if (riskScore >= 7) return 'extreme';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'moderate';
    return 'low';
  }

  /**
   * Identifies dominant market risk factors
   */
  private identifyDominantFactors(
    marketContext: MarketContext,
    volatility: VolatilityLevel,
    sentiment: SentimentLevel,
    liquidity: LiquidityLevel
  ): string[] {
    const factors: string[] = [];

    // Check volatility dominance
    if (volatility === VolatilityLevel.VERY_HIGH || volatility === VolatilityLevel.HIGH) {
      factors.push('High Market Volatility');
    }

    // Check sentiment extremes
    if (sentiment === SentimentLevel.VERY_NEGATIVE) {
      factors.push('Extreme Negative Sentiment');
    } else if (sentiment === SentimentLevel.VERY_POSITIVE) {
      factors.push('Extreme Positive Sentiment');
    }

    // Check liquidity issues
    if (liquidity === LiquidityLevel.VERY_LOW || liquidity === LiquidityLevel.LOW) {
      factors.push('Low Market Liquidity');
    }

    // Check macro factors
    if (marketContext.macroFactors) {
      for (const factor of marketContext.macroFactors) {
        if (Math.abs(factor.impact) > 0.7 && factor.confidence > 0.8) {
          factors.push(`${factor.name} (${factor.impact > 0 ? 'Positive' : 'Negative'} Impact)`);
        }
      }
    }

    return factors.length > 0 ? factors : ['Normal Market Conditions'];
  }

  /**
   * Calculates volatility-based adjustment factor for predictions
   */
  private calculateVolatilityAdjustmentFactor(
    marketConditions: MarketConditionAssessment,
    originalPrediction: number
  ): number {
    let adjustmentFactor = 1.0;

    // Base volatility adjustment
    switch (marketConditions.volatilityLevel) {
      case VolatilityLevel.VERY_HIGH:
        adjustmentFactor *= originalPrediction > 500 ? 1.25 : 0.85; // Amplify high risk, dampen low risk
        break;
      case VolatilityLevel.HIGH:
        adjustmentFactor *= originalPrediction > 500 ? 1.15 : 0.90;
        break;
      case VolatilityLevel.VERY_LOW:
        adjustmentFactor *= originalPrediction > 500 ? 0.90 : 1.10; // Dampen high risk, amplify low risk
        break;
      case VolatilityLevel.LOW:
        adjustmentFactor *= originalPrediction > 500 ? 0.95 : 1.05;
        break;
    }

    // Sentiment adjustment
    switch (marketConditions.sentimentLevel) {
      case SentimentLevel.VERY_NEGATIVE:
        adjustmentFactor *= 1.20; // Increase risk across the board
        break;
      case SentimentLevel.NEGATIVE:
        adjustmentFactor *= 1.10;
        break;
      case SentimentLevel.VERY_POSITIVE:
        adjustmentFactor *= 1.15; // Extreme optimism can also increase risk
        break;
    }

    // Liquidity adjustment
    switch (marketConditions.liquidityLevel) {
      case LiquidityLevel.VERY_LOW:
        adjustmentFactor *= 1.15; // Low liquidity increases risk
        break;
      case LiquidityLevel.LOW:
        adjustmentFactor *= 1.08;
        break;
    }

    // Overall risk level adjustment
    switch (marketConditions.overallRiskLevel) {
      case 'extreme':
        adjustmentFactor *= 1.30;
        break;
      case 'high':
        adjustmentFactor *= 1.20;
        break;
      case 'low':
        adjustmentFactor *= 0.95;
        break;
    }

    return Math.max(0.5, Math.min(2.0, adjustmentFactor)); // Clamp between 0.5x and 2.0x
  }

  /**
   * Applies adjustment factor to prediction with bounds checking
   */
  private applyPredictionAdjustment(
    originalPrediction: number,
    adjustmentFactor: number,
    marketConditions: MarketConditionAssessment
  ): number {
    let adjustedPrediction = originalPrediction * adjustmentFactor;

    // Ensure prediction stays within valid bounds (0-1000)
    adjustedPrediction = Math.max(0, Math.min(1000, adjustedPrediction));

    // Apply additional constraints for extreme market conditions
    if (marketConditions.overallRiskLevel === 'extreme') {
      // In extreme conditions, bias towards higher risk
      adjustedPrediction = Math.max(adjustedPrediction, originalPrediction * 1.1);
    }

    return Math.round(adjustedPrediction);
  }

  /**
   * Generates human-readable reason for adjustment
   */
  private generateAdjustmentReason(
    marketConditions: MarketConditionAssessment,
    adjustmentFactor: number
  ): string {
    const reasons: string[] = [];

    if (adjustmentFactor > 1.1) {
      reasons.push('Risk increased due to');
    } else if (adjustmentFactor < 0.9) {
      reasons.push('Risk decreased due to');
    } else {
      return 'No significant market-based adjustment applied';
    }

    // Add specific market condition reasons
    if (marketConditions.volatilityLevel === VolatilityLevel.VERY_HIGH || 
        marketConditions.volatilityLevel === VolatilityLevel.HIGH) {
      reasons.push('elevated market volatility');
    }

    if (marketConditions.sentimentLevel === SentimentLevel.VERY_NEGATIVE) {
      reasons.push('extremely negative market sentiment');
    } else if (marketConditions.sentimentLevel === SentimentLevel.VERY_POSITIVE) {
      reasons.push('potentially unsustainable market optimism');
    }

    if (marketConditions.liquidityLevel === LiquidityLevel.VERY_LOW || 
        marketConditions.liquidityLevel === LiquidityLevel.LOW) {
      reasons.push('reduced market liquidity');
    }

    if (marketConditions.dominantFactors.length > 1) {
      reasons.push(`multiple risk factors: ${marketConditions.dominantFactors.slice(0, 2).join(', ')}`);
    }

    return reasons.join(' ');
  }

  /**
   * Calculates learning rate adjustment based on market conditions
   */
  private calculateLearningRateAdjustment(marketConditions: MarketConditionAssessment): number {
    let adjustment = 1.0;

    // Reduce learning rate in volatile conditions for stability
    switch (marketConditions.volatilityLevel) {
      case VolatilityLevel.VERY_HIGH: adjustment *= 0.5; break;
      case VolatilityLevel.HIGH: adjustment *= 0.7; break;
      case VolatilityLevel.VERY_LOW: adjustment *= 1.2; break; // Can learn faster in stable conditions
    }

    // Adjust for overall risk level
    switch (marketConditions.overallRiskLevel) {
      case 'extreme': adjustment *= 0.4; break;
      case 'high': adjustment *= 0.6; break;
      case 'low': adjustment *= 1.3; break;
    }

    return Math.max(0.1, Math.min(2.0, adjustment));
  }

  /**
   * Calculates regularization adjustment based on market conditions
   */
  private calculateRegularizationAdjustment(marketConditions: MarketConditionAssessment): number {
    let adjustment = 1.0;

    // Increase regularization in uncertain conditions to prevent overfitting
    switch (marketConditions.overallRiskLevel) {
      case 'extreme': adjustment *= 2.0; break;
      case 'high': adjustment *= 1.5; break;
      case 'low': adjustment *= 0.8; break;
    }

    // Additional adjustment for volatility
    if (marketConditions.volatilityLevel === VolatilityLevel.VERY_HIGH) {
      adjustment *= 1.3;
    }

    return Math.max(0.5, Math.min(3.0, adjustment));
  }

  /**
   * Calculates dropout adjustment based on market conditions
   */
  private calculateDropoutAdjustment(marketConditions: MarketConditionAssessment): number {
    let adjustment = 1.0;

    // Increase dropout in uncertain conditions for robustness
    switch (marketConditions.overallRiskLevel) {
      case 'extreme': adjustment *= 1.8; break;
      case 'high': adjustment *= 1.4; break;
      case 'low': adjustment *= 0.9; break;
    }

    return Math.max(0.5, Math.min(2.0, adjustment));
  }

  /**
   * Gets reason for learning rate adjustment
   */
  private getLearningRateAdjustmentReason(
    marketConditions: MarketConditionAssessment,
    adjustment: number
  ): string {
    if (adjustment < 0.8) {
      return `Reduced learning rate for stability in ${marketConditions.overallRiskLevel} risk market conditions`;
    } else if (adjustment > 1.2) {
      return `Increased learning rate to adapt quickly in stable market conditions`;
    }
    return 'Learning rate maintained for current market conditions';
  }

  /**
   * Gets reason for regularization adjustment
   */
  private getRegularizationAdjustmentReason(
    marketConditions: MarketConditionAssessment,
    adjustment: number
  ): string {
    if (adjustment > 1.2) {
      return `Increased regularization to prevent overfitting in uncertain market conditions`;
    } else if (adjustment < 0.9) {
      return `Reduced regularization to allow model flexibility in stable conditions`;
    }
    return 'Regularization maintained for current market conditions';
  }

  /**
   * Gets reason for dropout adjustment
   */
  private getDropoutAdjustmentReason(
    marketConditions: MarketConditionAssessment,
    adjustment: number
  ): string {
    if (adjustment > 1.2) {
      return `Increased dropout for model robustness in volatile market conditions`;
    } else if (adjustment < 0.9) {
      return `Reduced dropout to maintain model capacity in stable conditions`;
    }
    return 'Dropout rate maintained for current market conditions';
  }
}