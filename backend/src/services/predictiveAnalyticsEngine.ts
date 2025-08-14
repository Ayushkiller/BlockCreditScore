import { CreditScore } from './scoreCalculator';
import { UserMetrics } from './blockchainService';
import { EnhancedScoreHistoryEntry, DatabaseService } from './databaseService';

// Interfaces for predictive analytics
export interface ScoreForecast {
  address: string;
  currentScore: number;
  predictedScores: PredictedScore[];
  trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING';
  trendStrength: number; // 0-100
  confidence: number; // 0-100
  predictionHorizon: number; // days
  methodology: string;
  keyFactors: string[];
  uncertaintyFactors: string[];
  lastUpdated: number;
}

export interface PredictedScore {
  timeframe: number; // days from now
  predictedScore: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number;
  keyAssumptions: string[];
}

export interface BehavioralTrendPrediction {
  address: string;
  currentBehavior: BehaviorSnapshot;
  predictedBehavior: PredictedBehavior[];
  trendAnalysis: TrendAnalysis;
  riskFactors: RiskFactor[];
  opportunities: OpportunityFactor[];
  confidence: number;
  predictionHorizon: number;
  lastUpdated: number;
}

export interface BehaviorSnapshot {
  activityLevel: number; // 0-100
  consistencyScore: number; // 0-100
  diversificationLevel: number; // 0-100
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
  sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  growthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export interface PredictedBehavior {
  timeframe: number; // days from now
  predictedActivityLevel: number;
  predictedConsistency: number;
  predictedDiversification: number;
  predictedRiskProfile: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  keyDrivers: string[];
}

export interface TrendAnalysis {
  momentum: number; // -100 to 100
  acceleration: number; // -100 to 100
  volatility: number; // 0-100
  seasonalPatterns: SeasonalPattern[];
  cyclicalPatterns: CyclicalPattern[];
}

export interface SeasonalPattern {
  pattern: string;
  strength: number; // 0-100
  confidence: number; // 0-100
  description: string;
}

export interface CyclicalPattern {
  cycle: string;
  period: number; // days
  amplitude: number;
  confidence: number; // 0-100
  description: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number; // 0-100
  timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  description: string;
  mitigation: string[];
}

export interface OpportunityFactor {
  opportunity: string;
  potential: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number; // 0-100
  timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  description: string;
  actionItems: string[];
}

export interface PredictionAccuracy {
  predictionId: string;
  address: string;
  predictionDate: number;
  targetDate: number;
  predictedScore: number;
  actualScore: number;
  accuracy: number; // 0-100
  absoluteError: number;
  relativeError: number; // percentage
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  wasWithinInterval: boolean;
  methodology: string;
  factors: string[];
}

export interface ModelPerformance {
  modelName: string;
  version: string;
  totalPredictions: number;
  averageAccuracy: number; // 0-100
  averageAbsoluteError: number;
  averageRelativeError: number; // percentage
  confidenceIntervalAccuracy: number; // percentage of predictions within CI
  performanceByTimeframe: {
    [timeframe: string]: {
      accuracy: number;
      absoluteError: number;
      relativeError: number;
      sampleSize: number;
    };
  };
  performanceByScoreRange: {
    [range: string]: {
      accuracy: number;
      absoluteError: number;
      relativeError: number;
      sampleSize: number;
    };
  };
  lastUpdated: number;
  recommendations: string[];
}

/**
 * Predictive Analytics Engine for score forecasting and trend prediction
 */
export class PredictiveAnalyticsEngine {
  private static readonly PREDICTION_HORIZONS = [7, 14, 30, 60, 90]; // days
  private static readonly MIN_HISTORY_POINTS = 5;
  private static readonly CONFIDENCE_THRESHOLD = 60; // minimum confidence for predictions

  /**
   * Generate comprehensive score forecast for an address
   */
  static async generateScoreForecast(
    address: string,
    currentScore: CreditScore,
    metrics: UserMetrics,
    scoreHistory?: EnhancedScoreHistoryEntry[]
  ): Promise<ScoreForecast> {
    try {
      // Get historical data if not provided
      if (!scoreHistory) {
        scoreHistory = await DatabaseService.getEnhancedScoreHistory(address, 100);
      }

      // Validate sufficient data for prediction
      if (scoreHistory.length < this.MIN_HISTORY_POINTS) {
        return this.generateBasicForecast(address, currentScore, metrics);
      }

      // Perform time series analysis
      const timeSeriesAnalysis = this.performTimeSeriesAnalysis(scoreHistory);
      
      // Generate predictions for different horizons
      const predictedScores = await this.generatePredictedScores(
        address,
        currentScore,
        scoreHistory,
        timeSeriesAnalysis
      );

      // Determine trend direction and strength
      const trendAnalysis = this.analyzeTrend(scoreHistory, timeSeriesAnalysis);

      // Identify key factors and uncertainties
      const factorAnalysis = await this.analyzeKeyFactors(address, metrics, scoreHistory);

      return {
        address,
        currentScore: currentScore.score,
        predictedScores,
        trendDirection: trendAnalysis.direction,
        trendStrength: trendAnalysis.strength,
        confidence: this.calculateOverallConfidence(predictedScores, timeSeriesAnalysis),
        predictionHorizon: Math.max(...this.PREDICTION_HORIZONS),
        methodology: 'Time Series Analysis with Behavioral Factors',
        keyFactors: factorAnalysis.keyFactors,
        uncertaintyFactors: factorAnalysis.uncertaintyFactors,
        lastUpdated: Math.floor(Date.now() / 1000)
      };

    } catch (error) {
      console.error('Error generating score forecast:', error);
      return this.generateBasicForecast(address, currentScore, metrics);
    }
  }

  /**
   * Generate behavioral trend prediction
   */
  static async generateBehavioralTrendPrediction(
    address: string,
    metrics: UserMetrics,
    scoreHistory?: EnhancedScoreHistoryEntry[]
  ): Promise<BehavioralTrendPrediction> {
    try {
      // Get historical data if not provided
      if (!scoreHistory) {
        scoreHistory = await DatabaseService.getEnhancedScoreHistory(address, 100);
      }

      // Create current behavior snapshot
      const currentBehavior = this.createBehaviorSnapshot(metrics, scoreHistory);

      // Analyze behavioral trends
      const trendAnalysis = this.analyzeBehavioralTrends(scoreHistory);

      // Generate behavioral predictions
      const predictedBehavior = this.generateBehavioralPredictions(
        currentBehavior,
        trendAnalysis,
        scoreHistory
      );

      // Identify risk factors and opportunities
      const riskFactors = this.identifyRiskFactors(currentBehavior, trendAnalysis);
      const opportunities = this.identifyOpportunities(currentBehavior, trendAnalysis);

      return {
        address,
        currentBehavior,
        predictedBehavior,
        trendAnalysis,
        riskFactors,
        opportunities,
        confidence: this.calculateBehavioralPredictionConfidence(trendAnalysis, scoreHistory),
        predictionHorizon: 90, // 3 months
        lastUpdated: Math.floor(Date.now() / 1000)
      };

    } catch (error) {
      console.error('Error generating behavioral trend prediction:', error);
      throw new Error(`Failed to generate behavioral trend prediction: ${error}`);
    }
  }

  /**
   * Track prediction accuracy and update model performance
   */
  static async trackPredictionAccuracy(
    predictionId: string,
    address: string,
    actualScore: number
  ): Promise<PredictionAccuracy> {
    try {
      // Get the original prediction
      const prediction = await DatabaseService.getPrediction(predictionId);
      if (!prediction) {
        throw new Error(`Prediction ${predictionId} not found`);
      }

      // Calculate accuracy metrics
      const absoluteError = Math.abs(prediction.predictedScore - actualScore);
      const relativeError = (absoluteError / prediction.predictedScore) * 100;
      const accuracy = Math.max(0, 100 - relativeError);
      
      const wasWithinInterval = actualScore >= prediction.confidenceInterval.lower && 
                               actualScore <= prediction.confidenceInterval.upper;

      const accuracyResult: PredictionAccuracy = {
        predictionId,
        address,
        predictionDate: prediction.predictionDate,
        targetDate: prediction.targetDate,
        predictedScore: prediction.predictedScore,
        actualScore,
        accuracy,
        absoluteError,
        relativeError,
        confidenceInterval: prediction.confidenceInterval,
        wasWithinInterval,
        methodology: prediction.methodology,
        factors: prediction.factors
      };

      // Save accuracy result
      await DatabaseService.savePredictionAccuracy(accuracyResult);

      // Update model performance metrics
      await this.updateModelPerformance(prediction.methodology, accuracyResult);

      return accuracyResult;

    } catch (error) {
      console.error('Error tracking prediction accuracy:', error);
      throw new Error(`Failed to track prediction accuracy: ${error}`);
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformance(modelName?: string): Promise<ModelPerformance[]> {
    try {
      return await DatabaseService.getModelPerformance(modelName);
    } catch (error) {
      console.error('Error getting model performance:', error);
      throw new Error(`Failed to get model performance: ${error}`);
    }
  }

  // Private helper methods

  /**
   * Perform time series analysis on score history
   */
  private static performTimeSeriesAnalysis(scoreHistory: EnhancedScoreHistoryEntry[]): any {
    // Sort by timestamp
    const sortedHistory = scoreHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate moving averages
    const shortTermMA = this.calculateMovingAverage(sortedHistory, 7);
    const longTermMA = this.calculateMovingAverage(sortedHistory, 30);
    
    // Calculate trend
    const trend = this.calculateTrend(sortedHistory);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(sortedHistory);
    
    // Detect seasonality
    const seasonality = this.detectSeasonality(sortedHistory);
    
    return {
      shortTermMA,
      longTermMA,
      trend,
      volatility,
      seasonality,
      dataPoints: sortedHistory.length
    };
  }

  /**
   * Generate predicted scores for different time horizons
   */
  private static async generatePredictedScores(
    address: string,
    currentScore: CreditScore,
    scoreHistory: EnhancedScoreHistoryEntry[],
    timeSeriesAnalysis: any
  ): Promise<PredictedScore[]> {
    const predictions: PredictedScore[] = [];

    for (const horizon of this.PREDICTION_HORIZONS) {
      const prediction = this.predictScoreForHorizon(
        currentScore.score,
        horizon,
        timeSeriesAnalysis,
        scoreHistory
      );
      
      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Predict score for a specific time horizon
   */
  private static predictScoreForHorizon(
    currentScore: number,
    horizon: number,
    timeSeriesAnalysis: any,
    scoreHistory: EnhancedScoreHistoryEntry[]
  ): PredictedScore {
    // Simple linear trend projection with adjustments
    const trendSlope = timeSeriesAnalysis.trend.slope;
    const baselinePrediction = currentScore + (trendSlope * horizon);
    
    // Apply volatility-based confidence interval
    const volatility = timeSeriesAnalysis.volatility;
    const confidenceMultiplier = this.getConfidenceMultiplier(horizon);
    const intervalWidth = volatility * confidenceMultiplier;
    
    // Ensure predictions stay within reasonable bounds (0-1000)
    const predictedScore = Math.max(0, Math.min(1000, baselinePrediction));
    const lower = Math.max(0, predictedScore - intervalWidth);
    const upper = Math.min(1000, predictedScore + intervalWidth);
    
    // Calculate confidence based on data quality and horizon
    const confidence = this.calculatePredictionConfidence(horizon, timeSeriesAnalysis, scoreHistory);
    
    return {
      timeframe: horizon,
      predictedScore: Math.round(predictedScore),
      confidenceInterval: {
        lower: Math.round(lower),
        upper: Math.round(upper)
      },
      confidence,
      keyAssumptions: this.generateKeyAssumptions(horizon, timeSeriesAnalysis)
    };
  }

  /**
   * Calculate moving average
   */
  private static calculateMovingAverage(
    scoreHistory: EnhancedScoreHistoryEntry[],
    period: number
  ): number[] {
    const movingAverages: number[] = [];
    
    for (let i = period - 1; i < scoreHistory.length; i++) {
      const sum = scoreHistory.slice(i - period + 1, i + 1)
        .reduce((acc, entry) => acc + entry.score, 0);
      movingAverages.push(sum / period);
    }
    
    return movingAverages;
  }

  /**
   * Calculate trend slope using linear regression
   */
  private static calculateTrend(scoreHistory: EnhancedScoreHistoryEntry[]): any {
    if (scoreHistory.length < 2) {
      return { slope: 0, intercept: 0, correlation: 0 };
    }

    const n = scoreHistory.length;
    const x = scoreHistory.map((_, i) => i);
    const y = scoreHistory.map(entry => entry.score);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce((acc, xi, i) => acc + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((acc, xi) => acc + (xi - meanX) ** 2, 0));
    const denomY = Math.sqrt(y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0));
    const correlation = numerator / (denomX * denomY);
    
    return { slope, intercept, correlation };
  }

  /**
   * Calculate volatility (standard deviation of score changes)
   */
  private static calculateVolatility(scoreHistory: EnhancedScoreHistoryEntry[]): number {
    if (scoreHistory.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < scoreHistory.length; i++) {
      changes.push(scoreHistory[i].score - scoreHistory[i - 1].score);
    }
    
    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((acc, change) => acc + (change - mean) ** 2, 0) / changes.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Detect seasonal patterns in score history
   */
  private static detectSeasonality(scoreHistory: EnhancedScoreHistoryEntry[]): any {
    // Simple seasonality detection - could be enhanced with FFT or other methods
    const patterns = [];
    
    // Check for weekly patterns (7 days)
    const weeklyPattern = this.checkPeriodicPattern(scoreHistory, 7);
    if (weeklyPattern.strength > 0.3) {
      patterns.push({
        period: 7,
        strength: weeklyPattern.strength,
        description: 'Weekly pattern detected'
      });
    }
    
    // Check for monthly patterns (30 days)
    const monthlyPattern = this.checkPeriodicPattern(scoreHistory, 30);
    if (monthlyPattern.strength > 0.3) {
      patterns.push({
        period: 30,
        strength: monthlyPattern.strength,
        description: 'Monthly pattern detected'
      });
    }
    
    return patterns;
  }

  /**
   * Check for periodic patterns in the data
   */
  private static checkPeriodicPattern(
    scoreHistory: EnhancedScoreHistoryEntry[],
    period: number
  ): { strength: number } {
    if (scoreHistory.length < period * 2) {
      return { strength: 0 };
    }
    
    // Simple autocorrelation at the given period
    const scores = scoreHistory.map(entry => entry.score);
    let correlation = 0;
    let count = 0;
    
    for (let i = period; i < scores.length; i++) {
      correlation += scores[i] * scores[i - period];
      count++;
    }
    
    if (count === 0) return { strength: 0 };
    
    correlation /= count;
    
    // Normalize correlation to 0-1 range
    const strength = Math.max(0, Math.min(1, correlation / 1000));
    
    return { strength };
  }

  /**
   * Analyze trend direction and strength
   */
  private static analyzeTrend(
    scoreHistory: EnhancedScoreHistoryEntry[],
    timeSeriesAnalysis: any
  ): { direction: 'IMPROVING' | 'STABLE' | 'DECLINING'; strength: number } {
    const slope = timeSeriesAnalysis.trend.slope;
    const correlation = Math.abs(timeSeriesAnalysis.trend.correlation);
    
    let direction: 'IMPROVING' | 'STABLE' | 'DECLINING';
    if (Math.abs(slope) < 0.1) {
      direction = 'STABLE';
    } else if (slope > 0) {
      direction = 'IMPROVING';
    } else {
      direction = 'DECLINING';
    }
    
    // Strength is based on correlation and slope magnitude
    const strength = Math.min(100, correlation * 100 * Math.abs(slope));
    
    return { direction, strength };
  }

  /**
   * Analyze key factors affecting predictions
   */
  private static async analyzeKeyFactors(
    address: string,
    metrics: UserMetrics,
    scoreHistory: EnhancedScoreHistoryEntry[]
  ): Promise<{ keyFactors: string[]; uncertaintyFactors: string[] }> {
    const keyFactors: string[] = [];
    const uncertaintyFactors: string[] = [];
    
    // Analyze transaction volume trends
    if (metrics.totalTransactions > 100) {
      keyFactors.push('High transaction volume provides stable prediction base');
    } else {
      uncertaintyFactors.push('Limited transaction history may affect prediction accuracy');
    }
    
    // Analyze account age
    if (metrics.accountAge > 365) {
      keyFactors.push('Mature account with established behavioral patterns');
    } else {
      uncertaintyFactors.push('Young account with evolving behavioral patterns');
    }
    
    // Analyze score volatility
    const recentHistory = scoreHistory.slice(-10);
    if (recentHistory.length > 1) {
      const volatility = this.calculateVolatility(recentHistory);
      if (volatility < 20) {
        keyFactors.push('Low score volatility indicates stable behavior');
      } else {
        uncertaintyFactors.push('High score volatility may indicate unpredictable behavior');
      }
    }
    
    // Analyze DeFi sophistication
    if (metrics.defiProtocolsUsed.length > 5) {
      keyFactors.push('High DeFi sophistication suggests continued engagement');
    }
    
    return { keyFactors, uncertaintyFactors };
  }

  /**
   * Generate basic forecast when insufficient data
   */
  private static generateBasicForecast(
    address: string,
    currentScore: CreditScore,
    metrics: UserMetrics
  ): ScoreForecast {
    const predictedScores: PredictedScore[] = this.PREDICTION_HORIZONS.map(horizon => ({
      timeframe: horizon,
      predictedScore: currentScore.score,
      confidenceInterval: {
        lower: Math.max(0, currentScore.score - 50),
        upper: Math.min(1000, currentScore.score + 50)
      },
      confidence: 30, // Low confidence due to insufficient data
      keyAssumptions: ['Insufficient historical data', 'Assuming stable behavior']
    }));

    return {
      address,
      currentScore: currentScore.score,
      predictedScores,
      trendDirection: 'STABLE',
      trendStrength: 0,
      confidence: 30,
      predictionHorizon: Math.max(...this.PREDICTION_HORIZONS),
      methodology: 'Basic Forecast (Insufficient Data)',
      keyFactors: ['Current score level', 'Account age', 'Transaction volume'],
      uncertaintyFactors: ['Limited historical data', 'Unknown behavioral patterns'],
      lastUpdated: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Create behavior snapshot from current metrics
   */
  private static createBehaviorSnapshot(
    metrics: UserMetrics,
    scoreHistory: EnhancedScoreHistoryEntry[]
  ): BehaviorSnapshot {
    // Calculate activity level based on recent transactions
    const activityLevel = Math.min(100, (metrics.totalTransactions / 100) * 100);
    
    // Calculate consistency from score history
    const consistencyScore = scoreHistory.length > 1 ? 
      Math.max(0, 100 - this.calculateVolatility(scoreHistory)) : 50;
    
    // Calculate diversification level
    const diversificationLevel = Math.min(100, (metrics.defiProtocolsUsed.length / 10) * 100);
    
    // Determine risk profile
    let riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (diversificationLevel > 70 && consistencyScore > 70) {
      riskProfile = 'LOW';
    } else if (diversificationLevel < 30 || consistencyScore < 30) {
      riskProfile = 'HIGH';
    }
    
    // Determine sophistication level
    let sophisticationLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' = 'BEGINNER';
    if (metrics.defiProtocolsUsed.length > 10) {
      sophisticationLevel = 'EXPERT';
    } else if (metrics.defiProtocolsUsed.length > 5) {
      sophisticationLevel = 'ADVANCED';
    } else if (metrics.defiProtocolsUsed.length > 2) {
      sophisticationLevel = 'INTERMEDIATE';
    }
    
    // Determine growth trend
    let growthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    if (scoreHistory.length > 2) {
      const recentScores = scoreHistory.slice(-5);
      const trend = this.calculateTrend(recentScores);
      if (trend.slope > 1) {
        growthTrend = 'IMPROVING';
      } else if (trend.slope < -1) {
        growthTrend = 'DECLINING';
      }
    }
    
    return {
      activityLevel,
      consistencyScore,
      diversificationLevel,
      riskProfile,
      sophisticationLevel,
      growthTrend
    };
  }

  /**
   * Analyze behavioral trends from score history
   */
  private static analyzeBehavioralTrends(scoreHistory: EnhancedScoreHistoryEntry[]): TrendAnalysis {
    const trend = this.calculateTrend(scoreHistory);
    const volatility = this.calculateVolatility(scoreHistory);
    
    // Calculate momentum (rate of change)
    const momentum = Math.max(-100, Math.min(100, trend.slope * 10));
    
    // Calculate acceleration (change in momentum)
    let acceleration = 0;
    if (scoreHistory.length > 10) {
      const recentTrend = this.calculateTrend(scoreHistory.slice(-5));
      const olderTrend = this.calculateTrend(scoreHistory.slice(-10, -5));
      acceleration = Math.max(-100, Math.min(100, (recentTrend.slope - olderTrend.slope) * 10));
    }
    
    // Detect seasonal patterns
    const seasonalPatterns: SeasonalPattern[] = [];
    const seasonality = this.detectSeasonality(scoreHistory);
    
    for (const pattern of seasonality) {
      seasonalPatterns.push({
        pattern: pattern.description,
        strength: pattern.strength * 100,
        confidence: 70, // Default confidence
        description: pattern.description
      });
    }
    
    // Detect cyclical patterns (simplified)
    const cyclicalPatterns: CyclicalPattern[] = [];
    if (scoreHistory.length > 30) {
      cyclicalPatterns.push({
        cycle: 'Monthly cycle',
        period: 30,
        amplitude: volatility,
        confidence: 60,
        description: 'Potential monthly behavioral cycle detected'
      });
    }
    
    return {
      momentum,
      acceleration,
      volatility,
      seasonalPatterns,
      cyclicalPatterns
    };
  }

  /**
   * Generate behavioral predictions for different time horizons
   */
  private static generateBehavioralPredictions(
    currentBehavior: BehaviorSnapshot,
    trendAnalysis: TrendAnalysis,
    scoreHistory: EnhancedScoreHistoryEntry[]
  ): PredictedBehavior[] {
    const predictions: PredictedBehavior[] = [];
    const horizons = [7, 14, 30, 60, 90];
    
    for (const horizon of horizons) {
      // Apply momentum and trend to current behavior
      const momentumFactor = trendAnalysis.momentum / 100;
      const volatilityFactor = trendAnalysis.volatility / 100;
      
      // Predict activity level
      const activityChange = momentumFactor * horizon * 0.1;
      const predictedActivityLevel = Math.max(0, Math.min(100, 
        currentBehavior.activityLevel + activityChange
      ));
      
      // Predict consistency (tends to be more stable)
      const consistencyChange = momentumFactor * horizon * 0.05;
      const predictedConsistency = Math.max(0, Math.min(100,
        currentBehavior.consistencyScore + consistencyChange
      ));
      
      // Predict diversification (gradual changes)
      const diversificationChange = momentumFactor * horizon * 0.02;
      const predictedDiversification = Math.max(0, Math.min(100,
        currentBehavior.diversificationLevel + diversificationChange
      ));
      
      // Predict risk profile
      let predictedRiskProfile = currentBehavior.riskProfile;
      if (trendAnalysis.momentum > 50 && horizon > 30) {
        predictedRiskProfile = 'LOW';
      } else if (trendAnalysis.momentum < -50 && horizon > 30) {
        predictedRiskProfile = 'HIGH';
      }
      
      // Calculate confidence (decreases with time horizon and volatility)
      const confidence = Math.max(30, 90 - (horizon / 10) - (volatilityFactor * 20));
      
      predictions.push({
        timeframe: horizon,
        predictedActivityLevel,
        predictedConsistency,
        predictedDiversification,
        predictedRiskProfile,
        confidence,
        keyDrivers: this.identifyKeyDrivers(trendAnalysis, horizon)
      });
    }
    
    return predictions;
  }

  /**
   * Identify key drivers for behavioral predictions
   */
  private static identifyKeyDrivers(trendAnalysis: TrendAnalysis, horizon: number): string[] {
    const drivers: string[] = [];
    
    if (Math.abs(trendAnalysis.momentum) > 30) {
      drivers.push(`Strong ${trendAnalysis.momentum > 0 ? 'positive' : 'negative'} momentum`);
    }
    
    if (Math.abs(trendAnalysis.acceleration) > 20) {
      drivers.push(`${trendAnalysis.acceleration > 0 ? 'Accelerating' : 'Decelerating'} trend`);
    }
    
    if (trendAnalysis.volatility > 30) {
      drivers.push('High behavioral volatility');
    }
    
    if (trendAnalysis.seasonalPatterns.length > 0) {
      drivers.push('Seasonal behavioral patterns');
    }
    
    if (horizon > 60) {
      drivers.push('Long-term behavioral evolution');
    }
    
    return drivers.length > 0 ? drivers : ['Current behavioral patterns'];
  }

  /**
   * Identify risk factors for behavioral predictions
   */
  private static identifyRiskFactors(
    currentBehavior: BehaviorSnapshot,
    trendAnalysis: TrendAnalysis
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    
    // High volatility risk
    if (trendAnalysis.volatility > 40) {
      riskFactors.push({
        factor: 'High Behavioral Volatility',
        impact: 'HIGH',
        probability: 80,
        timeframe: 'SHORT_TERM',
        description: 'High volatility in past behavior may continue, making predictions less reliable',
        mitigation: ['Monitor closely', 'Use shorter prediction horizons', 'Apply wider confidence intervals']
      });
    }
    
    // Declining trend risk
    if (trendAnalysis.momentum < -30) {
      riskFactors.push({
        factor: 'Declining Activity Trend',
        impact: 'MEDIUM',
        probability: 70,
        timeframe: 'MEDIUM_TERM',
        description: 'Current declining trend may continue, leading to reduced activity and scores',
        mitigation: ['Identify causes of decline', 'Implement engagement strategies', 'Monitor for stabilization']
      });
    }
    
    // Low diversification risk
    if (currentBehavior.diversificationLevel < 30) {
      riskFactors.push({
        factor: 'Low Diversification',
        impact: 'MEDIUM',
        probability: 60,
        timeframe: 'LONG_TERM',
        description: 'Low diversification may limit growth potential and increase concentration risk',
        mitigation: ['Encourage protocol diversification', 'Provide education on DeFi opportunities']
      });
    }
    
    return riskFactors;
  }

  /**
   * Identify opportunities for behavioral improvements
   */
  private static identifyOpportunities(
    currentBehavior: BehaviorSnapshot,
    trendAnalysis: TrendAnalysis
  ): OpportunityFactor[] {
    const opportunities: OpportunityFactor[] = [];
    
    // Positive momentum opportunity
    if (trendAnalysis.momentum > 30) {
      opportunities.push({
        opportunity: 'Positive Momentum Acceleration',
        potential: 'HIGH',
        probability: 75,
        timeframe: 'SHORT_TERM',
        description: 'Current positive momentum can be leveraged for further improvements',
        actionItems: ['Maintain current strategies', 'Increase activity gradually', 'Explore new protocols']
      });
    }
    
    // Diversification opportunity
    if (currentBehavior.diversificationLevel < 70 && currentBehavior.sophisticationLevel !== 'BEGINNER') {
      opportunities.push({
        opportunity: 'Diversification Expansion',
        potential: 'MEDIUM',
        probability: 65,
        timeframe: 'MEDIUM_TERM',
        description: 'Opportunity to improve diversification and reduce concentration risk',
        actionItems: ['Explore new DeFi protocols', 'Spread activity across different categories', 'Maintain consistent engagement']
      });
    }
    
    // Consistency improvement opportunity
    if (currentBehavior.consistencyScore < 60 && trendAnalysis.volatility > 20) {
      opportunities.push({
        opportunity: 'Consistency Enhancement',
        potential: 'MEDIUM',
        probability: 70,
        timeframe: 'MEDIUM_TERM',
        description: 'Improving behavioral consistency can lead to better scores and predictions',
        actionItems: ['Establish regular activity patterns', 'Reduce extreme variations', 'Focus on sustainable practices']
      });
    }
    
    return opportunities;
  }

  /**
   * Calculate overall confidence for predictions
   */
  private static calculateOverallConfidence(
    predictedScores: PredictedScore[],
    timeSeriesAnalysis: any
  ): number {
    if (predictedScores.length === 0) return 0;
    
    // Average confidence across all predictions
    const avgConfidence = predictedScores.reduce((sum, pred) => sum + pred.confidence, 0) / predictedScores.length;
    
    // Adjust based on data quality
    const dataQualityFactor = Math.min(1, timeSeriesAnalysis.dataPoints / 20);
    const correlationFactor = Math.abs(timeSeriesAnalysis.trend.correlation);
    
    return Math.round(avgConfidence * dataQualityFactor * (0.5 + correlationFactor * 0.5));
  }

  /**
   * Calculate prediction confidence for a specific horizon
   */
  private static calculatePredictionConfidence(
    horizon: number,
    timeSeriesAnalysis: any,
    scoreHistory: EnhancedScoreHistoryEntry[]
  ): number {
    // Base confidence starts high and decreases with horizon
    let confidence = 90 - (horizon / 10);
    
    // Adjust for data quality
    const dataQualityFactor = Math.min(1, scoreHistory.length / 20);
    confidence *= dataQualityFactor;
    
    // Adjust for trend strength
    const trendStrength = Math.abs(timeSeriesAnalysis.trend.correlation);
    confidence *= (0.5 + trendStrength * 0.5);
    
    // Adjust for volatility
    const volatilityPenalty = Math.min(30, timeSeriesAnalysis.volatility);
    confidence -= volatilityPenalty;
    
    return Math.max(this.CONFIDENCE_THRESHOLD, Math.round(confidence));
  }

  /**
   * Calculate behavioral prediction confidence
   */
  private static calculateBehavioralPredictionConfidence(
    trendAnalysis: TrendAnalysis,
    scoreHistory: EnhancedScoreHistoryEntry[]
  ): number {
    let confidence = 80;
    
    // Adjust for data quality
    const dataQualityFactor = Math.min(1, scoreHistory.length / 15);
    confidence *= dataQualityFactor;
    
    // Adjust for volatility
    const volatilityPenalty = Math.min(25, trendAnalysis.volatility);
    confidence -= volatilityPenalty;
    
    // Adjust for momentum strength
    const momentumBonus = Math.min(10, Math.abs(trendAnalysis.momentum) / 10);
    confidence += momentumBonus;
    
    return Math.max(40, Math.round(confidence));
  }

  /**
   * Get confidence multiplier based on prediction horizon
   */
  private static getConfidenceMultiplier(horizon: number): number {
    // Confidence interval widens with longer horizons
    return 1 + (horizon / 30);
  }

  /**
   * Generate key assumptions for predictions
   */
  private static generateKeyAssumptions(horizon: number, timeSeriesAnalysis: any): string[] {
    const assumptions: string[] = [];
    
    assumptions.push('Current behavioral patterns continue');
    
    if (horizon > 30) {
      assumptions.push('No major market disruptions');
    }
    
    if (timeSeriesAnalysis.trend.correlation > 0.5) {
      assumptions.push('Historical trend remains valid');
    }
    
    if (timeSeriesAnalysis.volatility > 20) {
      assumptions.push('Volatility remains within historical range');
    }
    
    assumptions.push('External factors remain stable');
    
    return assumptions;
  }

  /**
   * Update model performance metrics
   */
  private static async updateModelPerformance(
    methodology: string,
    accuracyResult: PredictionAccuracy
  ): Promise<void> {
    try {
      // Get existing performance data
      const existingPerformance = await DatabaseService.getModelPerformance(methodology);
      
      let performance: ModelPerformance;
      
      if (existingPerformance.length > 0) {
        // Update existing performance
        performance = existingPerformance[0];
        performance.totalPredictions++;
        
        // Update averages (simple moving average)
        const weight = 1 / performance.totalPredictions;
        performance.averageAccuracy = performance.averageAccuracy * (1 - weight) + accuracyResult.accuracy * weight;
        performance.averageAbsoluteError = performance.averageAbsoluteError * (1 - weight) + accuracyResult.absoluteError * weight;
        performance.averageRelativeError = performance.averageRelativeError * (1 - weight) + accuracyResult.relativeError * weight;
        
        // Update confidence interval accuracy
        const ciWeight = accuracyResult.wasWithinInterval ? 1 : 0;
        performance.confidenceIntervalAccuracy = performance.confidenceIntervalAccuracy * (1 - weight) + ciWeight * 100 * weight;
        
      } else {
        // Create new performance record
        performance = {
          modelName: methodology,
          version: '1.0',
          totalPredictions: 1,
          averageAccuracy: accuracyResult.accuracy,
          averageAbsoluteError: accuracyResult.absoluteError,
          averageRelativeError: accuracyResult.relativeError,
          confidenceIntervalAccuracy: accuracyResult.wasWithinInterval ? 100 : 0,
          performanceByTimeframe: {},
          performanceByScoreRange: {},
          lastUpdated: Math.floor(Date.now() / 1000),
          recommendations: []
        };
      }
      
      performance.lastUpdated = Math.floor(Date.now() / 1000);
      
      // Update performance by timeframe
      const timeframeDays = Math.floor((accuracyResult.targetDate - accuracyResult.predictionDate) / (24 * 60 * 60));
      const timeframeKey = `${timeframeDays}d`;
      
      if (!performance.performanceByTimeframe[timeframeKey]) {
        performance.performanceByTimeframe[timeframeKey] = {
          accuracy: accuracyResult.accuracy,
          absoluteError: accuracyResult.absoluteError,
          relativeError: accuracyResult.relativeError,
          sampleSize: 1
        };
      } else {
        const tf = performance.performanceByTimeframe[timeframeKey];
        const tfWeight = 1 / (tf.sampleSize + 1);
        tf.accuracy = tf.accuracy * (1 - tfWeight) + accuracyResult.accuracy * tfWeight;
        tf.absoluteError = tf.absoluteError * (1 - tfWeight) + accuracyResult.absoluteError * tfWeight;
        tf.relativeError = tf.relativeError * (1 - tfWeight) + accuracyResult.relativeError * tfWeight;
        tf.sampleSize++;
      }
      
      // Update performance by score range
      const scoreRange = this.getScoreRange(accuracyResult.predictedScore);
      if (!performance.performanceByScoreRange[scoreRange]) {
        performance.performanceByScoreRange[scoreRange] = {
          accuracy: accuracyResult.accuracy,
          absoluteError: accuracyResult.absoluteError,
          relativeError: accuracyResult.relativeError,
          sampleSize: 1
        };
      } else {
        const sr = performance.performanceByScoreRange[scoreRange];
        const srWeight = 1 / (sr.sampleSize + 1);
        sr.accuracy = sr.accuracy * (1 - srWeight) + accuracyResult.accuracy * srWeight;
        sr.absoluteError = sr.absoluteError * (1 - srWeight) + accuracyResult.absoluteError * srWeight;
        sr.relativeError = sr.relativeError * (1 - srWeight) + accuracyResult.relativeError * srWeight;
        sr.sampleSize++;
      }
      
      // Generate recommendations based on performance
      performance.recommendations = this.generatePerformanceRecommendations(performance);
      
      // Save updated performance
      await DatabaseService.saveModelPerformance(performance);
      
    } catch (error) {
      console.error('Error updating model performance:', error);
      throw new Error(`Failed to update model performance: ${error}`);
    }
  }

  /**
   * Get score range for performance tracking
   */
  private static getScoreRange(score: number): string {
    if (score < 200) return '0-199';
    if (score < 400) return '200-399';
    if (score < 600) return '400-599';
    if (score < 800) return '600-799';
    return '800-1000';
  }

  /**
   * Generate performance recommendations
   */
  private static generatePerformanceRecommendations(performance: ModelPerformance): string[] {
    const recommendations: string[] = [];
    
    if (performance.averageAccuracy < 70) {
      recommendations.push('Consider improving model accuracy through feature engineering');
    }
    
    if (performance.confidenceIntervalAccuracy < 80) {
      recommendations.push('Adjust confidence interval calculations for better coverage');
    }
    
    if (performance.totalPredictions < 50) {
      recommendations.push('Collect more prediction samples for reliable performance metrics');
    }
    
    // Check timeframe performance
    const longTermPerformance = performance.performanceByTimeframe['90d'];
    if (longTermPerformance && longTermPerformance.accuracy < 60) {
      recommendations.push('Long-term predictions need improvement - consider additional features');
    }
    
    return recommendations;
  }
}