import { DatabaseService } from './databaseService';
import { RiskAssessmentEngine, RiskAssessment, RiskFactor } from './riskAssessmentEngine';
import { UserMetrics, TransactionData } from './blockchainService';

/**
 * Risk Monitoring Service
 * Implements ongoing risk level tracking and monitoring as per requirement 2.5
 */

export interface RiskMonitoringAlert {
  id?: number;
  address: string;
  alertType: 'RISK_INCREASE' | 'RISK_DECREASE' | 'NEW_RISK_FACTOR' | 'RISK_THRESHOLD_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  currentRiskLevel: string;
  previousRiskLevel?: string;
  riskScore: number;
  previousRiskScore?: number;
  triggeredFactors: string[];
  recommendations: string[];
  timestamp: number;
  acknowledged: boolean;
}

export interface RiskTrend {
  address: string;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dataPoints: RiskDataPoint[];
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  trendStrength: number; // 0-100
  averageRiskScore: number;
  volatility: number;
  projectedRisk: number;
}

export interface RiskDataPoint {
  timestamp: number;
  riskScore: number;
  riskLevel: string;
  primaryRiskFactors: string[];
}

export interface RiskThreshold {
  address: string;
  riskFactor: string;
  thresholdType: 'SCORE' | 'LEVEL' | 'CHANGE_RATE';
  thresholdValue: number;
  alertSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  lastTriggered?: number;
}

export interface RiskMonitoringConfig {
  address: string;
  monitoringEnabled: boolean;
  alertFrequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY';
  thresholds: RiskThreshold[];
  notificationPreferences: {
    riskIncrease: boolean;
    riskDecrease: boolean;
    newRiskFactors: boolean;
    thresholdBreaches: boolean;
  };
}

/**
 * Risk Monitoring Service
 * Provides ongoing risk level tracking and alert generation
 */
export class RiskMonitoringService {
  
  // Risk monitoring thresholds
  private static readonly MONITORING_THRESHOLDS = {
    SIGNIFICANT_CHANGE: 10,    // Points change to trigger alert
    CRITICAL_RISK_SCORE: 80,   // Score threshold for critical alerts
    HIGH_RISK_SCORE: 60,       // Score threshold for high risk alerts
    TREND_ANALYSIS_DAYS: 30,   // Days to analyze for trend calculation
    MAX_ALERTS_PER_DAY: 5      // Maximum alerts per address per day
  };

  /**
   * Monitor risk changes and generate alerts
   * Requirement 2.5: Create risk monitoring system for ongoing risk level tracking
   */
  public static async monitorRiskChanges(
    address: string,
    currentAssessment: RiskAssessment,
    previousAssessment?: RiskAssessment
  ): Promise<RiskMonitoringAlert[]> {
    const alerts: RiskMonitoringAlert[] = [];
    const timestamp = Date.now();

    if (!previousAssessment) {
      // First assessment - create baseline alert
      alerts.push({
        address,
        alertType: 'NEW_RISK_FACTOR',
        severity: currentAssessment.overallRisk === 'CRITICAL' ? 'CRITICAL' : 
                 currentAssessment.overallRisk === 'HIGH' ? 'HIGH' : 'MEDIUM',
        title: 'Initial Risk Assessment Completed',
        description: `Initial risk assessment shows ${currentAssessment.overallRisk} risk level`,
        currentRiskLevel: currentAssessment.overallRisk,
        riskScore: currentAssessment.riskScore,
        triggeredFactors: this.getHighRiskFactors(currentAssessment),
        recommendations: currentAssessment.recommendations.map(r => r.title),
        timestamp,
        acknowledged: false
      });
      
      return alerts;
    }

    // Check for significant risk score changes
    const scoreChange = currentAssessment.riskScore - previousAssessment.riskScore;
    
    if (Math.abs(scoreChange) >= this.MONITORING_THRESHOLDS.SIGNIFICANT_CHANGE) {
      const isIncrease = scoreChange > 0;
      
      alerts.push({
        address,
        alertType: isIncrease ? 'RISK_INCREASE' : 'RISK_DECREASE',
        severity: this.determineSeverityFromScore(currentAssessment.riskScore),
        title: `Risk ${isIncrease ? 'Increase' : 'Decrease'} Detected`,
        description: `Risk score ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(scoreChange)} points`,
        currentRiskLevel: currentAssessment.overallRisk,
        previousRiskLevel: previousAssessment.overallRisk,
        riskScore: currentAssessment.riskScore,
        previousRiskScore: previousAssessment.riskScore,
        triggeredFactors: this.getChangedRiskFactors(currentAssessment, previousAssessment),
        recommendations: currentAssessment.recommendations
          .filter(r => r.priority === 'HIGH')
          .map(r => r.title),
        timestamp,
        acknowledged: false
      });
    }

    // Check for risk level changes
    if (currentAssessment.overallRisk !== previousAssessment.overallRisk) {
      alerts.push({
        address,
        alertType: 'RISK_THRESHOLD_BREACH',
        severity: this.determineSeverityFromLevel(currentAssessment.overallRisk),
        title: `Risk Level Changed: ${previousAssessment.overallRisk} → ${currentAssessment.overallRisk}`,
        description: `Risk level changed from ${previousAssessment.overallRisk} to ${currentAssessment.overallRisk}`,
        currentRiskLevel: currentAssessment.overallRisk,
        previousRiskLevel: previousAssessment.overallRisk,
        riskScore: currentAssessment.riskScore,
        previousRiskScore: previousAssessment.riskScore,
        triggeredFactors: this.getHighRiskFactors(currentAssessment),
        recommendations: currentAssessment.recommendations
          .filter(r => r.priority === 'HIGH' || r.priority === 'MEDIUM')
          .map(r => r.title),
        timestamp,
        acknowledged: false
      });
    }

    // Check for new high-risk factors
    const newHighRiskFactors = this.detectNewHighRiskFactors(currentAssessment, previousAssessment);
    
    if (newHighRiskFactors.length > 0) {
      alerts.push({
        address,
        alertType: 'NEW_RISK_FACTOR',
        severity: 'HIGH',
        title: `New High-Risk Factors Detected`,
        description: `${newHighRiskFactors.length} new high-risk factors identified: ${newHighRiskFactors.join(', ')}`,
        currentRiskLevel: currentAssessment.overallRisk,
        previousRiskLevel: previousAssessment.overallRisk,
        riskScore: currentAssessment.riskScore,
        previousRiskScore: previousAssessment.riskScore,
        triggeredFactors: newHighRiskFactors,
        recommendations: currentAssessment.recommendations
          .filter(r => newHighRiskFactors.some(factor => 
            r.category.toLowerCase().includes(factor.toLowerCase())
          ))
          .map(r => r.title),
        timestamp,
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Calculate risk trend over time
   * Requirement 2.5: Ongoing risk level tracking
   */
  public static async calculateRiskTrend(
    address: string,
    timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<RiskTrend> {
    
    // Get historical risk data from database
    const historicalData = await this.getHistoricalRiskData(address, timeframe);
    
    if (historicalData.length < 2) {
      return {
        address,
        timeframe,
        dataPoints: historicalData,
        trend: 'STABLE',
        trendStrength: 0,
        averageRiskScore: historicalData.length > 0 ? historicalData[0].riskScore : 0,
        volatility: 0,
        projectedRisk: historicalData.length > 0 ? historicalData[0].riskScore : 0
      };
    }

    // Calculate trend using linear regression
    const trendAnalysis = this.calculateTrendAnalysis(historicalData);
    
    // Calculate volatility
    const riskScores = historicalData.map(d => d.riskScore);
    const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    const variance = riskScores.reduce((sum, score) => sum + Math.pow(score - averageRiskScore, 2), 0) / riskScores.length;
    const volatility = Math.sqrt(variance);

    // Project future risk based on trend
    const projectedRisk = this.projectFutureRisk(historicalData, trendAnalysis);

    return {
      address,
      timeframe,
      dataPoints: historicalData,
      trend: trendAnalysis.direction,
      trendStrength: trendAnalysis.strength,
      averageRiskScore,
      volatility,
      projectedRisk
    };
  }

  /**
   * Store risk assessment for monitoring
   */
  public static async storeRiskAssessment(
    address: string,
    assessment: RiskAssessment
  ): Promise<void> {
    try {
      // For now, we'll store this in the enhanced score history table
      // In a production system, you'd want a dedicated risk monitoring table
      await DatabaseService.saveEnhancedScoreHistory({
        address,
        score: 100 - assessment.riskScore, // Convert risk score to credit score equivalent
        confidence: assessment.confidence,
        timestamp: Date.now(),
        version: '1.0',
        riskScore: assessment.riskScore,
        riskLevel: assessment.overallRisk,
        riskFlags: JSON.stringify(assessment.flags)
      });
      
      console.log(`Stored risk assessment for address ${address}: ${assessment.overallRisk} risk`);
    } catch (error) {
      console.error('Error storing risk assessment:', error);
      throw new Error(`Failed to store risk assessment: ${error}`);
    }
  }

  /**
   * Get historical risk data for trend analysis
   */
  private static async getHistoricalRiskData(
    address: string,
    timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Promise<RiskDataPoint[]> {
    try {
      const daysBack = timeframe === 'DAILY' ? 7 : 
                      timeframe === 'WEEKLY' ? 30 : 90;
      
      const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
      
      // Get enhanced score history which includes risk data
      const history = await DatabaseService.getEnhancedScoreHistory(address, 100);
      
      // Filter by timeframe and convert to risk data points
      const filteredHistory = history.filter(entry => entry.timestamp > cutoffTime);
      
      return filteredHistory.map(entry => ({
        timestamp: entry.timestamp,
        riskScore: entry.riskScore || 0,
        riskLevel: entry.riskLevel || 'LOW',
        primaryRiskFactors: this.identifyPrimaryRiskFactorsFromFlags(entry.riskFlags)
      }));
    } catch (error) {
      console.error('Error getting historical risk data:', error);
      return [];
    }
  }

  /**
   * Calculate trend analysis using linear regression
   */
  private static calculateTrendAnalysis(dataPoints: RiskDataPoint[]): {
    direction: 'INCREASING' | 'STABLE' | 'DECREASING';
    strength: number;
    slope: number;
  } {
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(d => d.riskScore);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const strength = Math.min(100, Math.abs(slope) * 10); // Normalize to 0-100
    
    let direction: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
    
    if (Math.abs(slope) > 0.5) {
      direction = slope > 0 ? 'INCREASING' : 'DECREASING';
    }
    
    return { direction, strength, slope };
  }

  /**
   * Project future risk based on current trend
   */
  private static projectFutureRisk(
    dataPoints: RiskDataPoint[],
    trendAnalysis: { slope: number }
  ): number {
    if (dataPoints.length === 0) return 0;
    
    const latestRisk = dataPoints[dataPoints.length - 1].riskScore;
    const projectedChange = trendAnalysis.slope * 7; // Project 7 days ahead
    
    return Math.max(0, Math.min(100, latestRisk + projectedChange));
  }

  /**
   * Helper methods for alert generation
   */
  private static getHighRiskFactors(assessment: RiskAssessment): string[] {
    const highRiskFactors: string[] = [];
    
    Object.entries(assessment.riskFactors).forEach(([key, factor]) => {
      if (factor.level === 'HIGH' || factor.level === 'CRITICAL') {
        highRiskFactors.push(key.replace('Risk', ''));
      }
    });
    
    return highRiskFactors;
  }

  private static getChangedRiskFactors(
    current: RiskAssessment,
    previous: RiskAssessment
  ): string[] {
    const changedFactors: string[] = [];
    
    Object.entries(current.riskFactors).forEach(([key, currentFactor]) => {
      const previousFactor = previous.riskFactors[key as keyof typeof previous.riskFactors];
      
      if (Math.abs(currentFactor.score - previousFactor.score) >= 10 ||
          currentFactor.level !== previousFactor.level) {
        changedFactors.push(key.replace('Risk', ''));
      }
    });
    
    return changedFactors;
  }

  private static detectNewHighRiskFactors(
    current: RiskAssessment,
    previous: RiskAssessment
  ): string[] {
    const newHighRiskFactors: string[] = [];
    
    Object.entries(current.riskFactors).forEach(([key, currentFactor]) => {
      const previousFactor = previous.riskFactors[key as keyof typeof previous.riskFactors];
      
      if ((currentFactor.level === 'HIGH' || currentFactor.level === 'CRITICAL') &&
          (previousFactor.level === 'LOW' || previousFactor.level === 'MEDIUM')) {
        newHighRiskFactors.push(key.replace('Risk', ''));
      }
    });
    
    return newHighRiskFactors;
  }

  private static determineSeverityFromScore(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= this.MONITORING_THRESHOLDS.CRITICAL_RISK_SCORE) return 'CRITICAL';
    if (riskScore >= this.MONITORING_THRESHOLDS.HIGH_RISK_SCORE) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private static determineSeverityFromLevel(riskLevel: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (riskLevel) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MEDIUM': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  private static identifyPrimaryRiskFactors(riskScores: {
    concentrationRisk: number;
    volatilityRisk: number;
    inactivityRisk: number;
    newAccountRisk: number;
    anomalyRisk: number;
    liquidityRisk: number;
  }): string[] {
    const factors: string[] = [];
    
    Object.entries(riskScores).forEach(([key, score]) => {
      if (score >= 60) { // High risk threshold
        factors.push(key.replace('Risk', ''));
      }
    });
    
    return factors;
  }

  private static identifyPrimaryRiskFactorsFromFlags(riskFlags?: string): string[] {
    if (!riskFlags) return [];
    
    try {
      const flags = JSON.parse(riskFlags);
      const factors: string[] = [];
      
      if (flags.suspiciousActivity) factors.push('suspicious');
      if (flags.washTrading) factors.push('washTrading');
      if (flags.botBehavior) factors.push('botBehavior');
      if (flags.coordinatedActivity) factors.push('coordinated');
      if (flags.unusualPatterns) factors.push('unusual');
      
      return factors;
    } catch (error) {
      console.error('Error parsing risk flags:', error);
      return [];
    }
  }
}