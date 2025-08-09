// Confidence Analyzer - Implements confidence interval calculations based on data sufficiency
// Supports Requirements 1.4, 8.1, 8.2

import { CreditProfile, ScoreDimension } from '../../types/credit';
import { getCurrentTimestamp } from '../../utils/time';

export interface ConfidenceResult {
  dimension: keyof CreditProfile['dimensions'];
  confidence: number;
  interval: {
    lower: number;
    upper: number;
  };
  dataSufficiency: 'insufficient' | 'minimal' | 'adequate' | 'excellent';
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  impact: number; // -100 to 100
  description: string;
}

export interface ConfidenceConfig {
  minDataPoints: number;
  maxDataPoints: number;
  dataFreshnessWeight: number;
  consistencyWeight: number;
  volumeWeight: number;
}

export class ConfidenceAnalyzer {
  private config: ConfidenceConfig;

  constructor(config: Partial<ConfidenceConfig> = {}) {
    this.config = {
      minDataPoints: 5,
      maxDataPoints: 100,
      dataFreshnessWeight: 0.2,
      consistencyWeight: 0.3,
      volumeWeight: 0.25,
      ...config
    };
  }

  /**
   * Analyze confidence for score updates
   */
  public async analyzeConfidence(
    profile: CreditProfile,
    scoreUpdates: any[]
  ): Promise<ConfidenceResult[]> {
    const results: ConfidenceResult[] = [];

    for (const update of scoreUpdates) {
      const dimension = profile.dimensions[update.dimension];
      const confidenceResult = await this.calculateDimensionConfidence(
        dimension,
        update.dimension,
        profile
      );
      results.push(confidenceResult);
    }

    return results;
  }

  /**
   * Calculate confidence for a specific dimension
   * Implements Requirement 1.4: confidence interval calculations
   */
  public async calculateDimensionConfidence(
    dimension: ScoreDimension,
    dimensionType: keyof CreditProfile['dimensions'],
    profile: CreditProfile
  ): Promise<ConfidenceResult> {
    const factors: ConfidenceFactor[] = [];
    let baseConfidence = 50; // Start with neutral confidence

    // Data sufficiency analysis
    const dataSufficiency = this.assessDataSufficiency(dimension.dataPoints);
    const dataSufficiencyImpact = this.getDataSufficiencyImpact(dataSufficiency);
    baseConfidence += dataSufficiencyImpact;
    
    factors.push({
      name: 'Data Sufficiency',
      impact: dataSufficiencyImpact,
      description: `${dataSufficiency} data with ${dimension.dataPoints} data points`
    });

    // Data freshness analysis
    const freshnessImpact = this.calculateFreshnessImpact(dimension.lastCalculated);
    baseConfidence += freshnessImpact;
    
    factors.push({
      name: 'Data Freshness',
      impact: freshnessImpact,
      description: this.getFreshnessDescription(dimension.lastCalculated)
    });

    // Score consistency analysis
    const consistencyImpact = this.calculateConsistencyImpact(dimension, dimensionType);
    baseConfidence += consistencyImpact;
    
    factors.push({
      name: 'Score Consistency',
      impact: consistencyImpact,
      description: `Score trend is ${dimension.trend}`
    });

    // Cross-dimension validation
    const crossValidationImpact = this.calculateCrossDimensionImpact(profile, dimensionType);
    baseConfidence += crossValidationImpact;
    
    factors.push({
      name: 'Cross-Dimension Validation',
      impact: crossValidationImpact,
      description: 'Consistency with other credit dimensions'
    });

    // Ensure confidence stays within bounds
    const finalConfidence = Math.max(0, Math.min(100, baseConfidence));

    // Calculate confidence interval
    const interval = this.calculateConfidenceInterval(dimension.score, finalConfidence);

    return {
      dimension: dimensionType,
      confidence: Math.round(finalConfidence),
      interval,
      dataSufficiency,
      factors
    };
  }  
/**
   * Assess data sufficiency based on number of data points
   */
  private assessDataSufficiency(dataPoints: number): ConfidenceResult['dataSufficiency'] {
    if (dataPoints < this.config.minDataPoints) return 'insufficient';
    if (dataPoints < this.config.minDataPoints * 2) return 'minimal';
    if (dataPoints < this.config.maxDataPoints * 0.5) return 'adequate';
    return 'excellent';
  }

  /**
   * Get confidence impact from data sufficiency
   */
  private getDataSufficiencyImpact(sufficiency: ConfidenceResult['dataSufficiency']): number {
    const impacts = {
      insufficient: -30,
      minimal: -10,
      adequate: 10,
      excellent: 25
    };
    return impacts[sufficiency];
  }

  /**
   * Calculate impact of data freshness on confidence
   */
  private calculateFreshnessImpact(lastCalculated: number): number {
    const now = getCurrentTimestamp();
    const ageInHours = (now - lastCalculated) / (60 * 60 * 1000);

    // Fresh data (< 1 hour) gets bonus
    if (ageInHours < 1) return 15;
    
    // Recent data (< 24 hours) gets moderate bonus
    if (ageInHours < 24) return 5;
    
    // Old data (< 7 days) gets slight penalty
    if (ageInHours < 168) return -5;
    
    // Very old data gets significant penalty
    return -20;
  }

  /**
   * Get description for data freshness
   */
  private getFreshnessDescription(lastCalculated: number): string {
    const now = getCurrentTimestamp();
    const ageInHours = (now - lastCalculated) / (60 * 60 * 1000);

    if (ageInHours < 1) return 'Very fresh data (< 1 hour)';
    if (ageInHours < 24) return 'Recent data (< 24 hours)';
    if (ageInHours < 168) return 'Moderately old data (< 7 days)';
    return 'Stale data (> 7 days)';
  }

  /**
   * Calculate consistency impact based on score trend
   */
  private calculateConsistencyImpact(
    dimension: ScoreDimension,
    dimensionType: keyof CreditProfile['dimensions']
  ): number {
    // Stable trends get confidence bonus
    if (dimension.trend === 'stable') return 10;
    
    // Improving trends get moderate bonus
    if (dimension.trend === 'improving') return 5;
    
    // Declining trends get slight penalty but not too much
    // (could be legitimate behavior change)
    if (dimension.trend === 'declining') return -5;
    
    return 0;
  }

  /**
   * Calculate cross-dimension validation impact
   */
  private calculateCrossDimensionImpact(
    profile: CreditProfile,
    currentDimension: keyof CreditProfile['dimensions']
  ): number {
    const dimensions = profile.dimensions;
    const currentScore = dimensions[currentDimension].score;
    
    // Get scores from other dimensions
    const otherScores = Object.entries(dimensions)
      .filter(([key]) => key !== currentDimension)
      .map(([, dim]) => dim.score)
      .filter(score => score > 0); // Only consider dimensions with data

    if (otherScores.length === 0) {
      return -10; // Penalty for no cross-validation data
    }

    // Calculate average of other dimensions
    const averageOtherScore = otherScores.reduce((sum, score) => sum + score, 0) / otherScores.length;
    
    // Calculate deviation from average
    const deviation = Math.abs(currentScore - averageOtherScore);
    const maxDeviation = 200; // Maximum expected deviation
    
    // Lower deviation = higher confidence
    const deviationRatio = Math.min(deviation / maxDeviation, 1);
    const impact = 15 * (1 - deviationRatio);
    
    return Math.round(impact);
  }

  /**
   * Calculate confidence interval for a score
   * Implements statistical confidence intervals
   */
  private calculateConfidenceInterval(score: number, confidence: number): { lower: number; upper: number } {
    // Convert confidence percentage to interval width
    // Higher confidence = narrower interval
    const intervalWidth = (100 - confidence) * 2; // Scale factor
    
    const lower = Math.max(0, score - intervalWidth);
    const upper = Math.min(1000, score + intervalWidth);
    
    return {
      lower: Math.round(lower),
      upper: Math.round(upper)
    };
  }

  /**
   * Get overall profile confidence
   * Implements Requirements 8.1, 8.2: comprehensive analytics
   */
  public async getOverallProfileConfidence(profile: CreditProfile): Promise<{
    overallConfidence: number;
    dimensionConfidences: Record<keyof CreditProfile['dimensions'], number>;
    dataQuality: 'poor' | 'fair' | 'good' | 'excellent';
    recommendations: string[];
  }> {
    const dimensionConfidences: Record<keyof CreditProfile['dimensions'], number> = {
      defiReliability: 0,
      tradingConsistency: 0,
      stakingCommitment: 0,
      governanceParticipation: 0,
      liquidityProvider: 0
    };

    const recommendations: string[] = [];
    let totalConfidence = 0;
    let dimensionsWithData = 0;

    // Calculate confidence for each dimension
    for (const [dimensionKey, dimension] of Object.entries(profile.dimensions)) {
      const dimKey = dimensionKey as keyof CreditProfile['dimensions'];
      const confidenceResult = await this.calculateDimensionConfidence(dimension, dimKey, profile);
      
      dimensionConfidences[dimKey] = confidenceResult.confidence;
      
      if (dimension.dataPoints > 0) {
        totalConfidence += confidenceResult.confidence;
        dimensionsWithData++;
      }

      // Generate recommendations based on confidence factors
      if (confidenceResult.confidence < 50) {
        recommendations.push(`Improve ${dimKey} confidence by increasing activity in this area`);
      }
    }

    // Calculate overall confidence
    const overallConfidence = dimensionsWithData > 0 ? totalConfidence / dimensionsWithData : 0;

    // Determine data quality
    const dataQuality = this.assessDataQuality(overallConfidence, dimensionsWithData);

    // Add general recommendations
    if (dimensionsWithData < 3) {
      recommendations.push('Diversify your DeFi activities across more dimensions to improve overall confidence');
    }

    if (overallConfidence < 60) {
      recommendations.push('Increase transaction frequency and volume to build stronger credit history');
    }

    return {
      overallConfidence: Math.round(overallConfidence),
      dimensionConfidences,
      dataQuality,
      recommendations
    };
  }

  /**
   * Assess overall data quality
   */
  private assessDataQuality(overallConfidence: number, dimensionsWithData: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (overallConfidence >= 80 && dimensionsWithData >= 4) return 'excellent';
    if (overallConfidence >= 65 && dimensionsWithData >= 3) return 'good';
    if (overallConfidence >= 45 && dimensionsWithData >= 2) return 'fair';
    return 'poor';
  }

  /**
   * Update confidence configuration
   */
  public updateConfig(newConfig: Partial<ConfidenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ConfidenceConfig {
    return { ...this.config };
  }
}