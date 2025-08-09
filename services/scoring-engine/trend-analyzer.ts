// Trend Analyzer - Implements trend analysis and historical score tracking
// Supports Requirements 1.4, 8.1, 8.2: trend analysis and evolution monitoring

import { CreditProfile, ScoreDimension, ScoreHistory } from '../../types/credit';
import { getCurrentTimestamp } from '../../utils/time';

export interface TrendAnalysis {
  dimension: keyof CreditProfile['dimensions'];
  currentTrend: 'improving' | 'stable' | 'declining';
  trendStrength: number; // 0-100, how strong the trend is
  trendDuration: number; // milliseconds
  projectedScore: number; // projected score in 30 days
  volatility: number; // 0-100, how volatile the scores are
  momentum: number; // -100 to 100, trend momentum
}

export interface HistoricalAnalysis {
  timeframe: '7d' | '30d' | '90d' | '180d';
  scoreChange: number;
  percentageChange: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface TrendConfig {
  minDataPointsForTrend: number;
  stableTrendThreshold: number; // Score change threshold for "stable"
  volatilityWindow: number; // Number of recent scores to analyze
  projectionDays: number; // Days to project forward
}

export class TrendAnalyzer {
  private scoreHistoryMap: Map<string, Map<keyof CreditProfile['dimensions'], ScoreHistory[]>> = new Map();
  private config: TrendConfig;

  constructor(config: Partial<TrendConfig> = {}) {
    this.config = {
      minDataPointsForTrend: 3,
      stableTrendThreshold: 10, // ±10 points considered stable
      volatilityWindow: 10,
      projectionDays: 30,
      ...config
    };
  }

  /**
   * Update trends for a user profile after score updates
   */
  public async updateTrends(
    profile: CreditProfile,
    scoreUpdates: any[]
  ): Promise<void> {
    for (const update of scoreUpdates) {
      await this.updateDimensionTrend(
        profile.userAddress,
        update.dimension,
        update.newScore,
        update.reason || 'Score update'
      );
    }

    // Update the profile's trend information
    await this.refreshProfileTrends(profile);
  }

  /**
   * Update trend for a specific dimension
   */
  private async updateDimensionTrend(
    userAddress: string,
    dimension: keyof CreditProfile['dimensions'],
    newScore: number,
    trigger: string
  ): Promise<void> {
    // Get or create score history for user
    if (!this.scoreHistoryMap.has(userAddress)) {
      this.scoreHistoryMap.set(userAddress, new Map());
    }

    const userHistory = this.scoreHistoryMap.get(userAddress)!;
    
    if (!userHistory.has(dimension)) {
      userHistory.set(dimension, []);
    }

    const dimensionHistory = userHistory.get(dimension)!;

    // Add new score to history
    const historyEntry: ScoreHistory = {
      timestamp: getCurrentTimestamp(),
      dimension,
      score: newScore,
      confidence: 0, // Will be updated by confidence analyzer
      trigger
    };

    dimensionHistory.push(historyEntry);

    // Keep only last 100 entries per dimension
    if (dimensionHistory.length > 100) {
      dimensionHistory.splice(0, dimensionHistory.length - 100);
    }
  }

  /**
   * Refresh trends for all dimensions in a profile
   */
  public async refreshTrends(profile: CreditProfile): Promise<void> {
    await this.refreshProfileTrends(profile);
  }

  /**
   * Refresh profile trends based on historical data
   */
  private async refreshProfileTrends(profile: CreditProfile): Promise<void> {
    const userHistory = this.scoreHistoryMap.get(profile.userAddress);
    
    if (!userHistory) {
      return;
    }

    // Update trend for each dimension
    for (const [dimensionKey, dimension] of Object.entries(profile.dimensions)) {
      const dimKey = dimensionKey as keyof CreditProfile['dimensions'];
      const history = userHistory.get(dimKey) || [];
      
      if (history.length >= this.config.minDataPointsForTrend) {
        const trendAnalysis = await this.analyzeTrend(history);
        dimension.trend = trendAnalysis.currentTrend;
      }
    }
  }  /**
   
* Analyze trend for a dimension's score history
   * Implements Requirements 1.4, 8.1: trend analysis
   */
  public async analyzeTrend(history: ScoreHistory[]): Promise<TrendAnalysis> {
    if (history.length < this.config.minDataPointsForTrend) {
      return this.createDefaultTrendAnalysis(history[0]?.dimension || 'defiReliability');
    }

    // Sort history by timestamp
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const scores = sortedHistory.map(h => h.score);
    const timestamps = sortedHistory.map(h => h.timestamp);

    // Calculate trend direction and strength
    const trendResult = this.calculateTrendDirection(scores);
    const volatility = this.calculateVolatility(scores);
    const momentum = this.calculateMomentum(scores);
    const projectedScore = this.projectFutureScore(scores, timestamps);
    const trendDuration = this.calculateTrendDuration(sortedHistory, trendResult.trend);

    return {
      dimension: sortedHistory[0].dimension,
      currentTrend: trendResult.trend,
      trendStrength: trendResult.strength,
      trendDuration,
      projectedScore,
      volatility,
      momentum
    };
  }

  /**
   * Calculate trend direction using linear regression
   */
  private calculateTrendDirection(scores: number[]): { trend: 'improving' | 'stable' | 'declining'; strength: number } {
    if (scores.length < 2) {
      return { trend: 'stable', strength: 0 };
    }

    // Simple linear regression to find slope
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Determine trend based on slope
    const slopeThreshold = this.config.stableTrendThreshold / n; // Adjust for number of points
    
    let trend: 'improving' | 'stable' | 'declining';
    if (slope > slopeThreshold) {
      trend = 'improving';
    } else if (slope < -slopeThreshold) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    // Calculate trend strength (0-100)
    const maxSlope = 50; // Maximum expected slope for normalization
    const strength = Math.min(Math.abs(slope) / maxSlope * 100, 100);

    return { trend, strength };
  }

  /**
   * Calculate score volatility
   */
  private calculateVolatility(scores: number[]): number {
    if (scores.length < 2) {
      return 0;
    }

    // Use recent scores for volatility calculation
    const recentScores = scores.slice(-this.config.volatilityWindow);
    const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    // Calculate standard deviation
    const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-100 scale (assuming max std dev of 100 points)
    return Math.min(stdDev, 100);
  }

  /**
   * Calculate trend momentum
   */
  private calculateMomentum(scores: number[]): number {
    if (scores.length < 3) {
      return 0;
    }

    // Compare recent trend to overall trend
    const recentScores = scores.slice(-5); // Last 5 scores
    const overallScores = scores;

    const recentTrend = this.calculateTrendDirection(recentScores);
    const overallTrend = this.calculateTrendDirection(overallScores);

    // Momentum is positive if recent trend is stronger than overall trend
    let momentum = 0;

    if (recentTrend.trend === 'improving' && overallTrend.trend === 'improving') {
      momentum = recentTrend.strength - overallTrend.strength;
    } else if (recentTrend.trend === 'declining' && overallTrend.trend === 'declining') {
      momentum = -(recentTrend.strength - overallTrend.strength);
    } else if (recentTrend.trend === 'improving' && overallTrend.trend !== 'improving') {
      momentum = recentTrend.strength;
    } else if (recentTrend.trend === 'declining' && overallTrend.trend !== 'declining') {
      momentum = -recentTrend.strength;
    }

    return Math.max(-100, Math.min(100, momentum));
  }

  /**
   * Project future score based on current trend
   */
  private projectFutureScore(scores: number[], timestamps: number[]): number {
    if (scores.length < 2) {
      return scores[0] || 500;
    }

    // Use linear regression to project future score
    const n = scores.length;
    const x = timestamps.map(t => t - timestamps[0]); // Normalize timestamps
    const y = scores;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Project score for configured days in the future
    const futureTime = timestamps[timestamps.length - 1] + (this.config.projectionDays * 24 * 60 * 60 * 1000);
    const normalizedFutureTime = futureTime - timestamps[0];
    
    const projectedScore = slope * normalizedFutureTime + intercept;
    
    // Ensure projected score stays within bounds
    return Math.max(0, Math.min(1000, Math.round(projectedScore)));
  }

  /**
   * Calculate how long the current trend has been active
   */
  private calculateTrendDuration(
    history: ScoreHistory[],
    currentTrend: 'improving' | 'stable' | 'declining'
  ): number {
    if (history.length < 2) {
      return 0;
    }

    // Find when the current trend started
    let trendStartIndex = history.length - 1;
    
    for (let i = history.length - 2; i >= 0; i--) {
      const prevScore = history[i].score;
      const currScore = history[i + 1].score;
      const scoreDiff = currScore - prevScore;
      
      let segmentTrend: 'improving' | 'stable' | 'declining';
      if (scoreDiff > this.config.stableTrendThreshold) {
        segmentTrend = 'improving';
      } else if (scoreDiff < -this.config.stableTrendThreshold) {
        segmentTrend = 'declining';
      } else {
        segmentTrend = 'stable';
      }

      if (segmentTrend !== currentTrend) {
        break;
      }
      
      trendStartIndex = i;
    }

    const trendStart = history[trendStartIndex].timestamp;
    const trendEnd = history[history.length - 1].timestamp;
    
    return trendEnd - trendStart;
  }

  /**
   * Get historical analysis for different timeframes
   * Implements Requirements 8.1, 8.2: historical score tracking
   */
  public async getHistoricalAnalysis(
    userAddress: string,
    dimension: keyof CreditProfile['dimensions'],
    timeframes: ('7d' | '30d' | '90d' | '180d')[] = ['7d', '30d', '90d', '180d']
  ): Promise<HistoricalAnalysis[]> {
    const userHistory = this.scoreHistoryMap.get(userAddress);
    const dimensionHistory = userHistory?.get(dimension) || [];

    if (dimensionHistory.length === 0) {
      return [];
    }

    const now = getCurrentTimestamp();
    const analyses: HistoricalAnalysis[] = [];

    for (const timeframe of timeframes) {
      const days = parseInt(timeframe);
      const cutoffTime = now - (days * 24 * 60 * 60 * 1000);
      
      const relevantHistory = dimensionHistory.filter(h => h.timestamp >= cutoffTime);
      
      if (relevantHistory.length === 0) {
        continue;
      }

      const scores = relevantHistory.map(h => h.score);
      const firstScore = scores[0];
      const lastScore = scores[scores.length - 1];
      
      const analysis: HistoricalAnalysis = {
        timeframe,
        scoreChange: lastScore - firstScore,
        percentageChange: firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        trendDirection: this.calculateTrendDirection(scores).trend
      };

      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Create default trend analysis for insufficient data
   */
  private createDefaultTrendAnalysis(dimension: keyof CreditProfile['dimensions']): TrendAnalysis {
    return {
      dimension,
      currentTrend: 'stable',
      trendStrength: 0,
      trendDuration: 0,
      projectedScore: 500,
      volatility: 0,
      momentum: 0
    };
  }

  /**
   * Get trend summary for all dimensions
   */
  public async getTrendSummary(userAddress: string): Promise<Record<keyof CreditProfile['dimensions'], TrendAnalysis>> {
    const userHistory = this.scoreHistoryMap.get(userAddress);
    
    const summary: Record<keyof CreditProfile['dimensions'], TrendAnalysis> = {
      defiReliability: this.createDefaultTrendAnalysis('defiReliability'),
      tradingConsistency: this.createDefaultTrendAnalysis('tradingConsistency'),
      stakingCommitment: this.createDefaultTrendAnalysis('stakingCommitment'),
      governanceParticipation: this.createDefaultTrendAnalysis('governanceParticipation'),
      liquidityProvider: this.createDefaultTrendAnalysis('liquidityProvider')
    };

    if (!userHistory) {
      return summary;
    }

    for (const [dimension, history] of userHistory.entries()) {
      if (history.length >= this.config.minDataPointsForTrend) {
        summary[dimension] = await this.analyzeTrend(history);
      }
    }

    return summary;
  }

  /**
   * Clear trend history for a user
   */
  public clearUserTrends(userAddress: string): boolean {
    return this.scoreHistoryMap.delete(userAddress);
  }

  /**
   * Update trend configuration
   */
  public updateConfig(newConfig: Partial<TrendConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): TrendConfig {
    return { ...this.config };
  }
}