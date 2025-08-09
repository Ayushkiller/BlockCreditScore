// Real-Time Scoring Engine Service
// Processes new transaction data into score updates with SLA compliance

import { CreditProfile, ScoreDimension, ScoreHistory } from '../../types/credit';
import { ICreditScoringEngine, AnomalyReport } from '../../types/api';
import { CategorizedTransaction } from '../data-aggregator/transaction-categorizer';
import { ScoreCalculator } from './score-calculator';
import { UpdateScheduler } from './update-scheduler';
import { AnomalyDetector } from './anomaly-detector';
import { ConfidenceAnalyzer } from './confidence-analyzer';
import { TrendAnalyzer } from './trend-analyzer';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface ScoringEngineConfig {
  positiveUpdateSLA: number; // 4 hours in milliseconds
  negativeUpdateSLA: number; // 24 hours in milliseconds
  immediateFlag: boolean; // Enable immediate flagging for negative behaviors
  enableAnomalyDetection: boolean;
  enableTrendAnalysis: boolean;
  confidenceThreshold: number; // Minimum confidence for score updates
}

export interface ScoreUpdateRequest {
  userAddress: string;
  transaction: CategorizedTransaction;
  timestamp: number;
  priority: 'normal' | 'high' | 'immediate';
}

export interface ScoreUpdateResult {
  userAddress: string;
  updatedDimensions: (keyof CreditProfile['dimensions'])[];
  oldScores: Partial<CreditProfile['dimensions']>;
  newScores: Partial<CreditProfile['dimensions']>;
  anomaliesDetected: AnomalyReport[];
  updateLatency: number;
  confidence: number;
}

export class ScoringEngineService implements ICreditScoringEngine {
  private scoreCalculator: ScoreCalculator;
  private updateScheduler: UpdateScheduler;
  private anomalyDetector: AnomalyDetector;
  private confidenceAnalyzer: ConfidenceAnalyzer;
  private trendAnalyzer: TrendAnalyzer;
  private config: ScoringEngineConfig;
  private userProfiles: Map<string, CreditProfile> = new Map();
  private scoreHistory: Map<string, ScoreHistory[]> = new Map();
  private isRunning: boolean = false;

  constructor(config: Partial<ScoringEngineConfig> = {}) {
    this.config = {
      positiveUpdateSLA: 4 * 60 * 60 * 1000, // 4 hours
      negativeUpdateSLA: 24 * 60 * 60 * 1000, // 24 hours
      immediateFlag: true,
      enableAnomalyDetection: true,
      enableTrendAnalysis: true,
      confidenceThreshold: 70,
      ...config
    };

    this.scoreCalculator = new ScoreCalculator();
    this.updateScheduler = new UpdateScheduler(this.config);
    this.anomalyDetector = new AnomalyDetector();
    this.confidenceAnalyzer = new ConfidenceAnalyzer();
    this.trendAnalyzer = new TrendAnalyzer();
  }

  /**
   * Start the scoring engine service
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scoring engine is already running');
    }

    try {
      await this.updateScheduler.start();
      this.isRunning = true;
      console.log('Scoring Engine Service started successfully');
    } catch (error) {
      console.error('Failed to start scoring engine:', formatError(error));
      throw error;
    }
  }

  /**
   * Stop the scoring engine service
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.updateScheduler.stop();
      this.isRunning = false;
      console.log('Scoring Engine Service stopped');
    } catch (error) {
      console.error('Error stopping scoring engine:', formatError(error));
      throw error;
    }
  }

  /**
   * Process new transaction data into score updates
   * Implements Requirements 6.2, 6.3, 6.4
   */
  public async processTransactionUpdate(request: ScoreUpdateRequest): Promise<ScoreUpdateResult> {
    const startTime = getCurrentTimestamp();
    
    try {
      // Get current user profile or create new one
      const currentProfile = await this.getOrCreateProfile(request.userAddress);
      
      // Detect anomalies if enabled (Requirement 6.4)
      const anomalies = this.config.enableAnomalyDetection 
        ? await this.anomalyDetector.detectAnomalies(request.userAddress, request.transaction)
        : [];

      // Log anomalies for manual review as required
      if (anomalies.length > 0) {
        console.log(`Anomalies detected for ${request.userAddress}:`, anomalies);
        // In production, this would be sent to a monitoring/alerting system
      }

      // Determine if this is negative behavior requiring immediate flagging
      const isNegativeBehavior = this.isNegativeBehavior(request.transaction, anomalies);
      
      if (isNegativeBehavior && this.config.immediateFlag) {
        // Immediate flagging for negative behaviors (Requirement 6.3)
        console.warn(`Immediate flag: Negative behavior detected for ${request.userAddress}`);
        request.priority = 'immediate';
      }

      // Calculate new scores based on transaction
      const scoreUpdates = await this.scoreCalculator.calculateScoreUpdates(
        currentProfile,
        request.transaction
      );

      // Apply confidence analysis
      const confidenceResults = await this.confidenceAnalyzer.analyzeConfidence(
        currentProfile,
        scoreUpdates
      );

      // Only proceed with updates that meet confidence threshold
      const validUpdates = this.filterByConfidence(scoreUpdates, confidenceResults);

      if (validUpdates.length === 0) {
        console.log(`No valid score updates for ${request.userAddress} - confidence too low`);
        return this.createEmptyResult(request.userAddress, startTime);
      }

      // Apply trend analysis if enabled
      if (this.config.enableTrendAnalysis) {
        await this.trendAnalyzer.updateTrends(currentProfile, validUpdates);
      }

      // Store old scores for comparison
      const oldScores = this.extractDimensionScores(currentProfile);

      // Apply score updates to profile
      const updatedProfile = await this.applyScoreUpdates(currentProfile, validUpdates);
      
      // Store updated profile
      this.userProfiles.set(request.userAddress, updatedProfile);

      // Record score history
      await this.recordScoreHistory(request.userAddress, validUpdates, request.transaction);

      // Schedule update based on priority and SLA requirements
      await this.scheduleUpdate(request, updatedProfile);

      const endTime = getCurrentTimestamp();
      const updateLatency = endTime - startTime;

      return {
        userAddress: request.userAddress,
        updatedDimensions: validUpdates.map(u => u.dimension),
        oldScores,
        newScores: this.extractDimensionScores(updatedProfile),
        anomaliesDetected: anomalies,
        updateLatency,
        confidence: Math.min(...confidenceResults.map(c => c.confidence))
      };

    } catch (error) {
      console.error(`Error processing transaction update for ${request.userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Calculate complete credit profile for a user
   */
  public async calculateCreditProfile(userAddress: string): Promise<CreditProfile> {
    try {
      const existingProfile = this.userProfiles.get(userAddress);
      
      if (existingProfile) {
        // Update confidence and trends for existing profile
        if (this.config.enableTrendAnalysis) {
          await this.trendAnalyzer.refreshTrends(existingProfile);
        }
        return existingProfile;
      }

      // Create new profile with default values
      return this.createDefaultProfile(userAddress);
    } catch (error) {
      console.error(`Error calculating credit profile for ${userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Update specific score dimension
   */
  public async updateScoreDimension(
    userAddress: string,
    dimension: keyof CreditProfile['dimensions'],
    newData: any
  ): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile(userAddress);
      
      // Create synthetic transaction for the update
      const syntheticTransaction: CategorizedTransaction = {
        hash: `synthetic_${Date.now()}`,
        blockNumber: 0,
        from: userAddress,
        to: userAddress,
        value: '0',
        input: '0x',
        timestamp: getCurrentTimestamp(),
        creditDimensions: {
          defiReliability: 0,
          tradingConsistency: 0,
          stakingCommitment: 0,
          governanceParticipation: 0,
          liquidityProvider: 0,
          [dimension]: newData.impact || 1.0
        },
        riskScore: newData.riskScore || 0.5,
        dataWeight: newData.dataWeight || 1.0
      };

      await this.processTransactionUpdate({
        userAddress,
        transaction: syntheticTransaction,
        timestamp: getCurrentTimestamp(),
        priority: 'normal'
      });

    } catch (error) {
      console.error(`Error updating score dimension ${dimension} for ${userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get credit history for a user within a time range
   */
  public async getCreditHistory(userAddress: string, timeRange: number): Promise<ScoreHistory[]> {
    try {
      const history = this.scoreHistory.get(userAddress) || [];
      const cutoffTime = getCurrentTimestamp() - timeRange;
      
      return history.filter(entry => entry.timestamp >= cutoffTime);
    } catch (error) {
      console.error(`Error getting credit history for ${userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get confidence score for a specific dimension
   */
  public async getScoreConfidence(
    userAddress: string,
    dimension: keyof CreditProfile['dimensions']
  ): Promise<number> {
    try {
      const profile = this.userProfiles.get(userAddress);
      
      if (!profile) {
        return 0;
      }

      return profile.dimensions[dimension].confidence;
    } catch (error) {
      console.error(`Error getting score confidence for ${userAddress}:`, formatError(error));
      throw error;
    }
  }

  /**
   * Get or create user profile
   */
  private async getOrCreateProfile(userAddress: string): Promise<CreditProfile> {
    const existing = this.userProfiles.get(userAddress);
    
    if (existing) {
      return existing;
    }

    const newProfile = this.createDefaultProfile(userAddress);
    this.userProfiles.set(userAddress, newProfile);
    return newProfile;
  }

  /**
   * Create default credit profile for new user
   */
  private createDefaultProfile(userAddress: string): CreditProfile {
    const defaultDimension: ScoreDimension = {
      score: 500, // Neutral starting score
      confidence: 0,
      dataPoints: 0,
      trend: 'stable',
      lastCalculated: getCurrentTimestamp()
    };

    return {
      userAddress,
      linkedWallets: [userAddress],
      dimensions: {
        defiReliability: { ...defaultDimension },
        tradingConsistency: { ...defaultDimension },
        stakingCommitment: { ...defaultDimension },
        governanceParticipation: { ...defaultDimension },
        liquidityProvider: { ...defaultDimension }
      },
      socialCredit: {
        p2pLendingHistory: [],
        communityFeedback: [],
        disputeHistory: [],
        reputationScore: 500,
        trustNetwork: []
      },
      predictiveRisk: {
        thirtyDay: { riskScore: 500, confidence: 0, factors: [] },
        ninetyDay: { riskScore: 500, confidence: 0, factors: [] },
        oneEightyDay: { riskScore: 500, confidence: 0, factors: [] },
        lastUpdated: getCurrentTimestamp()
      },
      achievements: [],
      nftTokenId: 0,
      lastUpdated: getCurrentTimestamp()
    };
  }

  /**
   * Determine if transaction represents negative behavior
   */
  private isNegativeBehavior(transaction: CategorizedTransaction, anomalies: AnomalyReport[]): boolean {
    // High risk score indicates negative behavior
    if (transaction.riskScore > 0.7) {
      return true;
    }

    // Critical anomalies indicate negative behavior
    if (anomalies.some(a => a.severity === 'critical' || a.severity === 'high')) {
      return true;
    }

    // Additional negative behavior patterns can be added here
    return false;
  }

  /**
   * Filter score updates by confidence threshold
   */
  private filterByConfidence(
    scoreUpdates: any[],
    confidenceResults: any[]
  ): any[] {
    return scoreUpdates.filter((update, index) => {
      const confidence = confidenceResults[index]?.confidence || 0;
      return confidence >= this.config.confidenceThreshold;
    });
  }

  /**
   * Extract dimension scores from profile
   */
  private extractDimensionScores(profile: CreditProfile): Partial<CreditProfile['dimensions']> {
    return {
      defiReliability: profile.dimensions.defiReliability,
      tradingConsistency: profile.dimensions.tradingConsistency,
      stakingCommitment: profile.dimensions.stakingCommitment,
      governanceParticipation: profile.dimensions.governanceParticipation,
      liquidityProvider: profile.dimensions.liquidityProvider
    };
  }

  /**
   * Apply score updates to profile
   */
  private async applyScoreUpdates(profile: CreditProfile, updates: any[]): Promise<CreditProfile> {
    const updatedProfile = { ...profile };
    
    for (const update of updates) {
      const dimension = updatedProfile.dimensions[update.dimension];
      dimension.score = update.newScore;
      dimension.confidence = update.confidence;
      dimension.dataPoints += 1;
      dimension.lastCalculated = getCurrentTimestamp();
    }

    updatedProfile.lastUpdated = getCurrentTimestamp();
    return updatedProfile;
  }

  /**
   * Record score history entry
   */
  private async recordScoreHistory(
    userAddress: string,
    updates: any[],
    transaction: CategorizedTransaction
  ): Promise<void> {
    const history = this.scoreHistory.get(userAddress) || [];
    
    for (const update of updates) {
      const historyEntry: ScoreHistory = {
        timestamp: getCurrentTimestamp(),
        dimension: update.dimension,
        score: update.newScore,
        confidence: update.confidence,
        trigger: `Transaction: ${transaction.hash}`
      };
      
      history.push(historyEntry);
    }

    // Keep only last 1000 entries per user
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.scoreHistory.set(userAddress, history);
  }

  /**
   * Schedule update based on priority and SLA
   */
  private async scheduleUpdate(
    request: ScoreUpdateRequest,
    profile: CreditProfile
  ): Promise<void> {
    const isPositiveBehavior = request.transaction.riskScore < 0.5;
    const slaDeadline = isPositiveBehavior 
      ? this.config.positiveUpdateSLA 
      : this.config.negativeUpdateSLA;

    await this.updateScheduler.scheduleUpdate({
      userAddress: request.userAddress,
      profile,
      priority: request.priority,
      deadline: getCurrentTimestamp() + slaDeadline
    });
  }

  /**
   * Create empty result for failed updates
   */
  private createEmptyResult(userAddress: string, startTime: number): ScoreUpdateResult {
    return {
      userAddress,
      updatedDimensions: [],
      oldScores: {},
      newScores: {},
      anomaliesDetected: [],
      updateLatency: getCurrentTimestamp() - startTime,
      confidence: 0
    };
  }

  /**
   * Get service status and metrics
   */
  public getServiceStatus(): {
    isRunning: boolean;
    activeProfiles: number;
    totalScoreUpdates: number;
    averageUpdateLatency: number;
    anomaliesDetected: number;
  } {
    return {
      isRunning: this.isRunning,
      activeProfiles: this.userProfiles.size,
      totalScoreUpdates: Array.from(this.scoreHistory.values()).reduce((sum, history) => sum + history.length, 0),
      averageUpdateLatency: this.updateScheduler.getAverageLatency(),
      anomaliesDetected: this.anomalyDetector.getTotalAnomaliesDetected()
    };
  }
}

// Export singleton instance
export const scoringEngineService = new ScoringEngineService();