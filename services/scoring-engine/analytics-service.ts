// Analytics Service - Comprehensive confidence and trend analysis integration
// Implements Requirements 1.4, 8.1, 8.2: confidence intervals, trend analysis, and evolution monitoring

import { CreditProfile, ScoreDimension, ScoreHistory } from '../../types/credit';
import { ConfidenceAnalyzer, ConfidenceResult } from './confidence-analyzer';
import { TrendAnalyzer, TrendAnalysis, HistoricalAnalysis } from './trend-analyzer';
import { getCurrentTimestamp } from '../../utils/time';
import { formatError } from '../../utils/errors';

export interface ComprehensiveAnalysis {
  userAddress: string;
  timestamp: number;
  overallConfidence: number;
  dataQuality: 'poor' | 'fair' | 'good' | 'excellent';
  dimensionAnalyses: DimensionAnalysis[];
  recommendations: AnalyticsRecommendation[];
  evolutionSummary: EvolutionSummary;
}

export interface DimensionAnalysis {
  dimension: keyof CreditProfile['dimensions'];
  currentScore: number;
  confidence: ConfidenceResult;
  trend: TrendAnalysis;
  historical: HistoricalAnalysis[];
  riskFactors: string[];
  opportunities: string[];
}

export interface AnalyticsRecommendation {
  type: 'confidence' | 'trend' | 'diversification' | 'risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
}

export interface EvolutionSummary {
  totalDataPoints: number;
  activeDimensions: number;
  overallTrend: 'improving' | 'stable' | 'declining';
  momentum: number;
  volatility: number;
  projectedScore: number;
  timeToNextTier: number | null; // days to reach next score tier
}

export class AnalyticsService {
  private confidenceAnalyzer: ConfidenceAnalyzer;
  private trendAnalyzer: TrendAnalyzer;
  private analysisCache: Map<string, { analysis: ComprehensiveAnalysis; expiry: number }> = new Map();
  private cacheExpiryTime: number = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.confidenceAnalyzer = new ConfidenceAnalyzer();
    this.trendAnalyzer = new TrendAnalyzer();
  }

  /**
   * Generate comprehensive analysis for a user profile
   * Implements Requirements 1.4, 8.1, 8.2
   */
  public async generateComprehensiveAnalysis(profile: CreditProfile): Promise<ComprehensiveAnalysis> {
    try {
      // Check cache first
      const cached = this.analysisCache.get(profile.userAddress);
      if (cached && cached.expiry > getCurrentTimestamp()) {
        return cached.analysis;
      }

      // Get overall profile confidence
      const overallConfidenceResult = await this.confidenceAnalyzer.getOverallProfileConfidence(profile);
      
      // Get trend summary for all dimensions
      const trendSummary = await this.trendAnalyzer.getTrendSummary(profile.userAddress);

      // Analyze each dimension comprehensively
      const dimensionAnalyses: DimensionAnalysis[] = [];
      
      for (const [dimensionKey, dimension] of Object.entries(profile.dimensions)) {
        const dimKey = dimensionKey as keyof CreditProfile['dimensions'];
        
        const dimensionAnalysis = await this.analyzeDimension(
          profile,
          dimKey,
          dimension,
          trendSummary[dimKey]
        );
        
        dimensionAnalyses.push(dimensionAnalysis);
      }

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        profile,
        dimensionAnalyses,
        overallConfidenceResult
      );

      // Create evolution summary
      const evolutionSummary = await this.createEvolutionSummary(
        profile,
        dimensionAnalyses,
        trendSummary
      );

      const analysis: ComprehensiveAnalysis = {
        userAddress: profile.userAddress,
        timestamp: getCurrentTimestamp(),
        overallConfidence: overallConfidenceResult.overallConfidence,
        dataQuality: overallConfidenceResult.dataQuality,
        dimensionAnalyses,
        recommendations,
        evolutionSummary
      };

      // Cache the analysis
      this.analysisCache.set(profile.userAddress, {
        analysis,
        expiry: getCurrentTimestamp() + this.cacheExpiryTime
      });

      return analysis;

    } catch (error) {
      console.error(`Error generating comprehensive analysis for ${profile.userAddress}:`, formatError(error));
      throw error;
    }
  } 
 /**
   * Analyze a specific dimension comprehensively
   */
  private async analyzeDimension(
    profile: CreditProfile,
    dimensionKey: keyof CreditProfile['dimensions'],
    dimension: ScoreDimension,
    trendAnalysis: TrendAnalysis
  ): Promise<DimensionAnalysis> {
    // Get confidence analysis
    const confidence = await this.confidenceAnalyzer.calculateDimensionConfidence(
      dimension,
      dimensionKey,
      profile
    );

    // Get historical analysis
    const historical = await this.trendAnalyzer.getHistoricalAnalysis(
      profile.userAddress,
      dimensionKey
    );

    // Identify risk factors and opportunities
    const riskFactors = this.identifyRiskFactors(dimension, confidence, trendAnalysis);
    const opportunities = this.identifyOpportunities(dimension, confidence, trendAnalysis);

    return {
      dimension: dimensionKey,
      currentScore: dimension.score,
      confidence,
      trend: trendAnalysis,
      historical,
      riskFactors,
      opportunities
    };
  }

  /**
   * Identify risk factors for a dimension
   */
  private identifyRiskFactors(
    dimension: ScoreDimension,
    confidence: ConfidenceResult,
    trend: TrendAnalysis
  ): string[] {
    const risks: string[] = [];

    // Low confidence risks
    if (confidence.confidence < 50) {
      risks.push('Low confidence due to insufficient data');
    }

    if (confidence.dataSufficiency === 'insufficient') {
      risks.push('Insufficient transaction data for reliable scoring');
    }

    // Trend-based risks
    if (trend.currentTrend === 'declining' && trend.trendStrength > 30) {
      risks.push('Strong declining trend detected');
    }

    if (trend.volatility > 70) {
      risks.push('High score volatility indicates inconsistent behavior');
    }

    if (trend.momentum < -50) {
      risks.push('Negative momentum suggests accelerating decline');
    }

    // Score-based risks
    if (dimension.score < 300) {
      risks.push('Very low score indicates high credit risk');
    }

    // Data freshness risks
    const dataAge = getCurrentTimestamp() - dimension.lastCalculated;
    if (dataAge > 7 * 24 * 60 * 60 * 1000) { // 7 days
      risks.push('Stale data may not reflect current behavior');
    }

    return risks;
  }

  /**
   * Identify opportunities for improvement
   */
  private identifyOpportunities(
    dimension: ScoreDimension,
    confidence: ConfidenceResult,
    trend: TrendAnalysis
  ): string[] {
    const opportunities: string[] = [];

    // Confidence improvement opportunities
    if (confidence.confidence < 70 && confidence.dataSufficiency !== 'excellent') {
      opportunities.push('Increase activity frequency to improve confidence');
    }

    // Trend-based opportunities
    if (trend.currentTrend === 'improving' && trend.momentum > 20) {
      opportunities.push('Strong positive momentum - continue current strategy');
    }

    if (trend.currentTrend === 'stable' && trend.volatility < 30) {
      opportunities.push('Stable performance - good foundation for growth');
    }

    // Score improvement opportunities
    if (dimension.score < 700 && trend.currentTrend !== 'declining') {
      opportunities.push('Significant room for score improvement');
    }

    if (dimension.score > 800 && trend.currentTrend === 'improving') {
      opportunities.push('Approaching excellent credit tier');
    }

    // Projection-based opportunities
    if (trend.projectedScore > dimension.score + 50) {
      opportunities.push('Positive trajectory suggests continued improvement');
    }

    return opportunities;
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    profile: CreditProfile,
    dimensionAnalyses: DimensionAnalysis[],
    overallResult: any
  ): Promise<AnalyticsRecommendation[]> {
    const recommendations: AnalyticsRecommendation[] = [];

    // Overall confidence recommendations
    if (overallResult.overallConfidence < 60) {
      recommendations.push({
        type: 'confidence',
        priority: 'high',
        title: 'Improve Overall Data Confidence',
        description: 'Your credit profile has low confidence due to insufficient data',
        actionItems: [
          'Increase transaction frequency across all DeFi activities',
          'Diversify into underutilized credit dimensions',
          'Maintain consistent activity patterns'
        ],
        expectedImpact: 'Higher confidence scores and more accurate credit assessment'
      });
    }

    // Dimension-specific recommendations
    for (const analysis of dimensionAnalyses) {
      if (analysis.confidence.confidence < 50) {
        recommendations.push({
          type: 'confidence',
          priority: 'medium',
          title: `Improve ${analysis.dimension} Confidence`,
          description: `Low confidence in ${analysis.dimension} dimension`,
          actionItems: [
            `Increase activity in ${analysis.dimension} related protocols`,
            'Maintain consistent transaction patterns',
            'Focus on higher-value transactions'
          ],
          expectedImpact: `Better ${analysis.dimension} score accuracy and reliability`
        });
      }

      if (analysis.trend.currentTrend === 'declining' && analysis.trend.trendStrength > 40) {
        recommendations.push({
          type: 'trend',
          priority: 'critical',
          title: `Address Declining ${analysis.dimension} Trend`,
          description: `Strong negative trend detected in ${analysis.dimension}`,
          actionItems: [
            'Review recent transaction patterns for issues',
            'Increase positive activities in this dimension',
            'Consider consulting DeFi best practices'
          ],
          expectedImpact: 'Reverse negative trend and improve credit standing'
        });
      }
    }

    // Diversification recommendations
    const activeDimensions = dimensionAnalyses.filter(d => d.currentScore > 0).length;
    if (activeDimensions < 3) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        title: 'Diversify DeFi Activities',
        description: 'Limited activity across credit dimensions reduces overall profile strength',
        actionItems: [
          'Explore lending and borrowing protocols',
          'Participate in governance voting',
          'Consider liquidity provision opportunities',
          'Engage in staking activities'
        ],
        expectedImpact: 'Stronger, more resilient credit profile with higher overall scores'
      });
    }

    // Risk-based recommendations
    const highRiskDimensions = dimensionAnalyses.filter(d => d.riskFactors.length > 2);
    if (highRiskDimensions.length > 0) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        title: 'Address High-Risk Dimensions',
        description: 'Multiple risk factors detected across credit dimensions',
        actionItems: [
          'Focus on consistent, low-risk activities',
          'Avoid high-volatility protocols temporarily',
          'Build stable transaction history'
        ],
        expectedImpact: 'Reduced risk profile and improved lender confidence'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Create evolution summary
   */
  private async createEvolutionSummary(
    profile: CreditProfile,
    dimensionAnalyses: DimensionAnalysis[],
    trendSummary: Record<keyof CreditProfile['dimensions'], TrendAnalysis>
  ): Promise<EvolutionSummary> {
    // Calculate total data points
    const totalDataPoints = Object.values(profile.dimensions)
      .reduce((sum, dim) => sum + dim.dataPoints, 0);

    // Count active dimensions
    const activeDimensions = dimensionAnalyses.filter(d => d.currentScore > 0).length;

    // Calculate overall trend
    const trendScores = dimensionAnalyses.map(d => {
      if (d.trend.currentTrend === 'improving') return 1;
      if (d.trend.currentTrend === 'declining') return -1;
      return 0;
    });
    const avgTrendScore = trendScores.reduce((a, b) => a + b, 0) / trendScores.length;
    
    let overallTrend: 'improving' | 'stable' | 'declining';
    if (avgTrendScore > 0.2) overallTrend = 'improving';
    else if (avgTrendScore < -0.2) overallTrend = 'declining';
    else overallTrend = 'stable';

    // Calculate overall momentum and volatility
    const momentum = dimensionAnalyses.reduce((sum, d) => sum + d.trend.momentum, 0) / dimensionAnalyses.length;
    const volatility = dimensionAnalyses.reduce((sum, d) => sum + d.trend.volatility, 0) / dimensionAnalyses.length;

    // Calculate projected overall score
    const projectedScore = Math.round(
      dimensionAnalyses.reduce((sum, d) => sum + d.trend.projectedScore, 0) / dimensionAnalyses.length
    );

    // Calculate time to next tier
    const currentOverallScore = Math.round(
      Object.values(profile.dimensions).reduce((sum, dim) => sum + dim.score, 0) / 5
    );
    const timeToNextTier = this.calculateTimeToNextTier(currentOverallScore, projectedScore, overallTrend);

    return {
      totalDataPoints,
      activeDimensions,
      overallTrend,
      momentum: Math.round(momentum),
      volatility: Math.round(volatility),
      projectedScore,
      timeToNextTier
    };
  }

  /**
   * Calculate estimated time to reach next credit tier
   */
  private calculateTimeToNextTier(
    currentScore: number,
    projectedScore: number,
    trend: 'improving' | 'stable' | 'declining'
  ): number | null {
    if (trend !== 'improving' || projectedScore <= currentScore) {
      return null;
    }

    // Define credit tiers
    const tiers = [300, 500, 650, 750, 850];
    const nextTier = tiers.find(tier => tier > currentScore);
    
    if (!nextTier) {
      return null; // Already at highest tier
    }

    // Estimate time based on current improvement rate
    const improvementRate = (projectedScore - currentScore) / 30; // per day
    if (improvementRate <= 0) {
      return null;
    }

    const pointsNeeded = nextTier - currentScore;
    const daysNeeded = Math.ceil(pointsNeeded / improvementRate);

    return daysNeeded;
  }

  /**
   * Get quick confidence and trend summary
   */
  public async getQuickSummary(profile: CreditProfile): Promise<{
    overallConfidence: number;
    dataQuality: string;
    activeDimensions: number;
    overallTrend: string;
    topRecommendation: string;
  }> {
    try {
      const analysis = await this.generateComprehensiveAnalysis(profile);
      
      return {
        overallConfidence: analysis.overallConfidence,
        dataQuality: analysis.dataQuality,
        activeDimensions: analysis.evolutionSummary.activeDimensions,
        overallTrend: analysis.evolutionSummary.overallTrend,
        topRecommendation: analysis.recommendations[0]?.title || 'Continue current activities'
      };
    } catch (error) {
      console.error(`Error generating quick summary for ${profile.userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Clear analysis cache for a user
   */
  public clearCache(userAddress?: string): void {
    if (userAddress) {
      this.analysisCache.delete(userAddress);
    } else {
      this.analysisCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    expiryTime: number;
  } {
    const now = getCurrentTimestamp();
    const validEntries = Array.from(this.analysisCache.values()).filter(entry => entry.expiry > now);
    
    return {
      size: this.analysisCache.size,
      hitRate: validEntries.length / Math.max(this.analysisCache.size, 1),
      expiryTime: this.cacheExpiryTime
    };
  }
}