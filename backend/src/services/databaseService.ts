import { getDatabase } from '../database/connection';
import { CreditScore } from './scoreCalculator';

export interface ScoreHistoryEntry {
  id: number;
  address: string;
  score: number;
  timestamp: number;
}

export interface CachedScore {
  address: string;
  score: number;
  breakdown: {
    transactionVolume: number;
    transactionFrequency: number;
    stakingActivity: number;
    defiInteractions: number;
  };
  lastUpdated: number;
  createdAt: number;
}

// New interfaces for enhanced intelligence features
export interface EnhancedScoreHistoryEntry {
  id: number;
  address: string;
  score: number;
  confidence: number;
  timestamp: number;
  version: string;
  
  // Component scores
  volumeScore?: number;
  frequencyScore?: number;
  stakingScore?: number;
  defiScore?: number;
  gasEfficiencyScore?: number;
  consistencyScore?: number;
  diversificationScore?: number;
  
  // Risk assessment
  riskScore?: number;
  riskLevel?: string;
  riskFlags?: string; // JSON string
  
  // Behavioral insights
  activityPattern?: string;
  userArchetype?: string;
  sophisticationLevel?: string;
  growthTrend?: string;
  
  // Metadata
  calculationTimeMs?: number;
  dataQualityScore?: number;
}

export interface BehavioralPattern {
  id: number;
  address: string;
  patternType: string;
  patternData: string; // JSON string
  confidence: number;
  firstDetected: number;
  lastUpdated: number;
  status: string;
}

export interface Recommendation {
  id: number;
  address: string;
  recommendationId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  expectedImpact?: number;
  difficulty?: string;
  createdAt: number;
  status: string;
  progress: number;
  completedAt?: number;
}

// Real-time benchmarking interfaces
export interface RealTimeBenchmarkData {
  id: number;
  address: string;
  peerGroupId: string;
  overallPercentile: number;
  componentPercentiles: string; // JSON string
  benchmarkTimestamp: number;
  lastUpdated: number;
  updateFrequency: number; // seconds
  isStale: boolean;
}

export interface BenchmarkUpdateJob {
  id: number;
  jobType: 'PEER_GROUP_REFRESH' | 'PERCENTILE_RECALC' | 'BENCHMARK_UPDATE';
  targetAddress?: string;
  peerGroupId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface PeerGroupSnapshot {
  id: number;
  peerGroupId: string;
  memberCount: number;
  averageScore: number;
  scoreDistribution: string; // JSON string with percentiles
  snapshotTimestamp: number;
  isActive: boolean;
}

/**
 * Database service for managing credit scores and history
 */
export class DatabaseService {
  // Cache duration in seconds (1 hour)
  private static readonly CACHE_DURATION = 60 * 60;

  /**
   * Save or update a credit score in the database
   */
  static async saveScore(creditScore: CreditScore): Promise<void> {
    const db = getDatabase();

    try {
      const now = Math.floor(Date.now() / 1000);
      const breakdownJson = JSON.stringify(creditScore.breakdown);

      // Check if score already exists
      const existingScore = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT address FROM credit_scores WHERE address = ?',
          [creditScore.address.toLowerCase()],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingScore) {
        // Update existing score
        await new Promise<void>((resolve, reject) => {
          db.run(`
            UPDATE credit_scores 
            SET score = ?, breakdown = ?, last_updated = ?
            WHERE address = ?
          `, [
            creditScore.score,
            breakdownJson,
            creditScore.timestamp,
            creditScore.address.toLowerCase()
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        // Insert new score
        await new Promise<void>((resolve, reject) => {
          db.run(`
            INSERT INTO credit_scores (address, score, breakdown, last_updated, created_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            creditScore.address.toLowerCase(),
            creditScore.score,
            breakdownJson,
            creditScore.timestamp,
            now
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Add to history
      await new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO score_history (address, score, timestamp)
          VALUES (?, ?, ?)
        `, [
          creditScore.address.toLowerCase(),
          creditScore.score,
          creditScore.timestamp
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Saved credit score for address ${creditScore.address}: ${creditScore.score}`);
    } catch (error) {
      console.error('Error saving credit score:', error);
      throw new Error(`Failed to save credit score: ${error}`);
    }
  }

  /**
   * Get cached credit score by address
   */
  static async getCachedScore(address: string): Promise<CachedScore | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT address, score, breakdown, last_updated, created_at
          FROM credit_scores 
          WHERE address = ?
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) {
        return null;
      }

      return {
        address: result.address,
        score: result.score,
        breakdown: JSON.parse(result.breakdown),
        lastUpdated: result.last_updated,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Error getting cached score:', error);
      throw new Error(`Failed to get cached score: ${error}`);
    }
  }

  /**
   * Check if cached score is still fresh
   */
  static isCacheFresh(cachedScore: CachedScore): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = now - cachedScore.lastUpdated;
    return age < this.CACHE_DURATION;
  }

  /**
   * Get score history for an address
   */
  static async getScoreHistory(address: string, limit: number = 100): Promise<ScoreHistoryEntry[]> {
    const db = getDatabase();

    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT id, address, score, timestamp
          FROM score_history 
          WHERE address = ?
          ORDER BY timestamp DESC
          LIMIT ?
        `, [address.toLowerCase(), limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results;
    } catch (error) {
      console.error('Error getting score history:', error);
      throw new Error(`Failed to get score history: ${error}`);
    }
  }

  /**
   * Get multiple cached scores by addresses
   */
  static async getMultipleCachedScores(addresses: string[]): Promise<CachedScore[]> {
    const db = getDatabase();

    try {
      if (addresses.length === 0) {
        return [];
      }

      // Create placeholders for the IN clause
      const placeholders = addresses.map(() => '?').join(',');
      const lowercaseAddresses = addresses.map(addr => addr.toLowerCase());

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT address, score, breakdown, last_updated, created_at
          FROM credit_scores 
          WHERE address IN (${placeholders})
        `, lowercaseAddresses, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map((result: any) => ({
        address: result.address,
        score: result.score,
        breakdown: JSON.parse(result.breakdown),
        lastUpdated: result.last_updated,
        createdAt: result.created_at
      }));
    } catch (error) {
      console.error('Error getting multiple cached scores:', error);
      throw new Error(`Failed to get multiple cached scores: ${error}`);
    }
  }

  /**
   * Delete old score history entries (cleanup)
   */
  static async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    const db = getDatabase();

    try {
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
      
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          DELETE FROM score_history 
          WHERE timestamp < ?
        `, [cutoffTimestamp], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      const deletedCount = result.changes || 0;
      console.log(`Cleaned up ${deletedCount} old score history entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old history:', error);
      throw new Error(`Failed to cleanup old history: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{
    totalScores: number;
    totalHistoryEntries: number;
    oldestScore: number;
    newestScore: number;
  }> {
    const db = getDatabase();

    try {
      const [scoresCount, historyCount, timeRange] = await Promise.all([
        new Promise<any>((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM credit_scores', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        new Promise<any>((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM score_history', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        new Promise<any>((resolve, reject) => {
          db.get(`
            SELECT 
              MIN(created_at) as oldest,
              MAX(last_updated) as newest
            FROM credit_scores
          `, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        })
      ]);

      return {
        totalScores: scoresCount?.count || 0,
        totalHistoryEntries: historyCount?.count || 0,
        oldestScore: timeRange?.oldest || 0,
        newestScore: timeRange?.newest || 0
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }

  // Enhanced Intelligence Features Database Methods

  /**
   * Save enhanced score history entry with intelligence data
   */
  static async saveEnhancedScoreHistory(entry: Omit<EnhancedScoreHistoryEntry, 'id'>): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO enhanced_score_history (
            address, score, confidence, timestamp, version,
            volume_score, frequency_score, staking_score, defi_score,
            gas_efficiency_score, consistency_score, diversification_score,
            risk_score, risk_level, risk_flags,
            activity_pattern, user_archetype, sophistication_level, growth_trend,
            calculation_time_ms, data_quality_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.address.toLowerCase(),
          entry.score,
          entry.confidence,
          entry.timestamp,
          entry.version,
          entry.volumeScore,
          entry.frequencyScore,
          entry.stakingScore,
          entry.defiScore,
          entry.gasEfficiencyScore,
          entry.consistencyScore,
          entry.diversificationScore,
          entry.riskScore,
          entry.riskLevel,
          entry.riskFlags,
          entry.activityPattern,
          entry.userArchetype,
          entry.sophisticationLevel,
          entry.growthTrend,
          entry.calculationTimeMs,
          entry.dataQualityScore
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved enhanced score history for address ${entry.address}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving enhanced score history:', error);
      throw new Error(`Failed to save enhanced score history: ${error}`);
    }
  }

  /**
   * Get enhanced score history for an address
   */
  static async getEnhancedScoreHistory(address: string, limit: number = 100): Promise<EnhancedScoreHistoryEntry[]> {
    const db = getDatabase();

    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT * FROM enhanced_score_history 
          WHERE address = ?
          ORDER BY timestamp DESC
          LIMIT ?
        `, [address.toLowerCase(), limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        address: row.address,
        score: row.score,
        confidence: row.confidence,
        timestamp: row.timestamp,
        version: row.version,
        volumeScore: row.volume_score,
        frequencyScore: row.frequency_score,
        stakingScore: row.staking_score,
        defiScore: row.defi_score,
        gasEfficiencyScore: row.gas_efficiency_score,
        consistencyScore: row.consistency_score,
        diversificationScore: row.diversification_score,
        riskScore: row.risk_score,
        riskLevel: row.risk_level,
        riskFlags: row.risk_flags,
        activityPattern: row.activity_pattern,
        userArchetype: row.user_archetype,
        sophisticationLevel: row.sophistication_level,
        growthTrend: row.growth_trend,
        calculationTimeMs: row.calculation_time_ms,
        dataQualityScore: row.data_quality_score
      }));
    } catch (error) {
      console.error('Error getting enhanced score history:', error);
      throw new Error(`Failed to get enhanced score history: ${error}`);
    }
  }

  /**
   * Save behavioral pattern
   */
  static async saveBehavioralPattern(pattern: Omit<BehavioralPattern, 'id'>): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO behavioral_patterns (
            address, pattern_type, pattern_data, confidence,
            first_detected, last_updated, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          pattern.address.toLowerCase(),
          pattern.patternType,
          pattern.patternData,
          pattern.confidence,
          pattern.firstDetected,
          pattern.lastUpdated,
          pattern.status
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved behavioral pattern for address ${pattern.address}: ${pattern.patternType}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving behavioral pattern:', error);
      throw new Error(`Failed to save behavioral pattern: ${error}`);
    }
  }

  /**
   * Get behavioral patterns for an address
   */
  static async getBehavioralPatterns(address: string, patternType?: string): Promise<BehavioralPattern[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM behavioral_patterns WHERE address = ?';
      const params: any[] = [address.toLowerCase()];

      if (patternType) {
        query += ' AND pattern_type = ?';
        params.push(patternType);
      }

      query += ' ORDER BY last_updated DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        address: row.address,
        patternType: row.pattern_type,
        patternData: row.pattern_data,
        confidence: row.confidence,
        firstDetected: row.first_detected,
        lastUpdated: row.last_updated,
        status: row.status
      }));
    } catch (error) {
      console.error('Error getting behavioral patterns:', error);
      throw new Error(`Failed to get behavioral patterns: ${error}`);
    }
  }

  /**
   * Update behavioral pattern
   */
  static async updateBehavioralPattern(id: number, updates: Partial<BehavioralPattern>): Promise<void> {
    const db = getDatabase();

    try {
      const setClause: string[] = [];
      const params: any[] = [];

      if (updates.patternData !== undefined) {
        setClause.push('pattern_data = ?');
        params.push(updates.patternData);
      }
      if (updates.confidence !== undefined) {
        setClause.push('confidence = ?');
        params.push(updates.confidence);
      }
      if (updates.lastUpdated !== undefined) {
        setClause.push('last_updated = ?');
        params.push(updates.lastUpdated);
      }
      if (updates.status !== undefined) {
        setClause.push('status = ?');
        params.push(updates.status);
      }

      if (setClause.length === 0) {
        return; // No updates to make
      }

      params.push(id);

      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE behavioral_patterns 
          SET ${setClause.join(', ')}
          WHERE id = ?
        `, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Updated behavioral pattern ${id}`);
    } catch (error) {
      console.error('Error updating behavioral pattern:', error);
      throw new Error(`Failed to update behavioral pattern: ${error}`);
    }
  }

  /**
   * Save recommendation
   */
  static async saveRecommendation(recommendation: Omit<Recommendation, 'id'>): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO recommendations (
            address, recommendation_id, category, priority, title, description,
            expected_impact, difficulty, created_at, status, progress, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          recommendation.address.toLowerCase(),
          recommendation.recommendationId,
          recommendation.category,
          recommendation.priority,
          recommendation.title,
          recommendation.description,
          recommendation.expectedImpact,
          recommendation.difficulty,
          recommendation.createdAt,
          recommendation.status,
          recommendation.progress,
          recommendation.completedAt
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved recommendation for address ${recommendation.address}: ${recommendation.title}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving recommendation:', error);
      throw new Error(`Failed to save recommendation: ${error}`);
    }
  }

  /**
   * Get recommendations for an address
   */
  static async getRecommendations(address: string, status?: string): Promise<Recommendation[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM recommendations WHERE address = ?';
      const params: any[] = [address.toLowerCase()];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY priority DESC, created_at DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        address: row.address,
        recommendationId: row.recommendation_id,
        category: row.category,
        priority: row.priority,
        title: row.title,
        description: row.description,
        expectedImpact: row.expected_impact,
        difficulty: row.difficulty,
        createdAt: row.created_at,
        status: row.status,
        progress: row.progress,
        completedAt: row.completed_at
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error(`Failed to get recommendations: ${error}`);
    }
  }

  /**
   * Update recommendation progress
   */
  static async updateRecommendationProgress(id: number, progress: number, status?: string): Promise<void> {
    const db = getDatabase();

    try {
      const now = Math.floor(Date.now() / 1000);
      const completedAt = progress >= 100 ? now : null;
      const finalStatus = status || (progress >= 100 ? 'COMPLETED' : 'ACTIVE');

      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE recommendations 
          SET progress = ?, status = ?, completed_at = ?
          WHERE id = ?
        `, [progress, finalStatus, completedAt, id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Updated recommendation ${id} progress to ${progress}%`);
    } catch (error) {
      console.error('Error updating recommendation progress:', error);
      throw new Error(`Failed to update recommendation progress: ${error}`);
    }
  }

  // Anomaly Detection Database Methods

  /**
   * Save anomaly detection results
   */
  static async saveAnomalyDetectionResult(result: any): Promise<number> {
    const db = getDatabase();

    try {
      const insertResult = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO anomaly_detection_results (
            address, timestamp, overall_anomaly_score, confidence,
            has_statistical_anomalies, has_wash_trading, has_bot_behavior, 
            has_coordinated_activity, requires_investigation,
            statistical_anomalies, wash_trading_result, bot_behavior_result, 
            coordinated_activity_result, risk_explanation, recommendations,
            analysis_version, processing_time_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          result.address.toLowerCase(),
          result.timestamp,
          result.overallAnomalyScore,
          result.confidence,
          result.flags.hasStatisticalAnomalies,
          result.flags.hasWashTrading,
          result.flags.hasBotBehavior,
          result.flags.hasCoordinatedActivity,
          result.flags.requiresInvestigation,
          JSON.stringify(result.statisticalAnomalies),
          JSON.stringify(result.washTradingDetection),
          JSON.stringify(result.botBehaviorDetection),
          JSON.stringify(result.coordinatedActivityDetection),
          result.riskExplanation,
          JSON.stringify(result.recommendations),
          '1.0',
          Date.now() - result.timestamp
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      const detectionId = insertResult.lastID;

      // Save detailed statistical anomalies
      for (const anomaly of result.statisticalAnomalies) {
        await this.saveStatisticalAnomaly(result.address, detectionId, anomaly);
      }

      // Save wash trading patterns
      for (const pattern of result.washTradingDetection.patterns) {
        await this.saveWashTradingPattern(result.address, detectionId, pattern);
      }

      // Save bot behavior patterns
      for (const pattern of result.botBehaviorDetection.behaviorPatterns) {
        await this.saveBotBehaviorPattern(result.address, detectionId, pattern, result.botBehaviorDetection);
      }

      // Save coordination patterns
      for (const pattern of result.coordinatedActivityDetection.coordinationPatterns) {
        await this.saveCoordinationPattern(result.address, detectionId, pattern);
      }

      console.log(`Saved anomaly detection result for address ${result.address} with ID ${detectionId}`);
      return detectionId;
    } catch (error) {
      console.error('Error saving anomaly detection result:', error);
      throw new Error(`Failed to save anomaly detection result: ${error}`);
    }
  }

  /**
   * Save statistical anomaly
   */
  private static async saveStatisticalAnomaly(address: string, detectionId: number, anomaly: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO statistical_anomalies (
          address, detection_id, anomaly_type, severity, score, confidence,
          description, statistical_method, threshold_value, actual_value,
          expected_min, expected_max, affected_transactions, evidence, detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        detectionId,
        anomaly.type,
        anomaly.severity,
        anomaly.score,
        anomaly.confidence,
        anomaly.description,
        anomaly.statisticalMethod,
        anomaly.threshold,
        anomaly.actualValue,
        anomaly.expectedRange.min,
        anomaly.expectedRange.max,
        JSON.stringify(anomaly.affectedTransactions),
        JSON.stringify(anomaly.evidence),
        Date.now()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save wash trading pattern
   */
  private static async saveWashTradingPattern(address: string, detectionId: number, pattern: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO wash_trading_patterns (
          address, detection_id, pattern_type, confidence, time_window,
          amount_similarity, description, affected_transactions, evidence, detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        detectionId,
        pattern.patternType,
        pattern.confidence,
        pattern.timeWindow,
        pattern.amountSimilarity,
        pattern.description,
        JSON.stringify(pattern.transactions),
        JSON.stringify([pattern.description]), // Convert description to evidence array
        Date.now()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save bot behavior pattern
   */
  private static async saveBotBehaviorPattern(address: string, detectionId: number, pattern: any, behaviorResult: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO bot_behavior_patterns (
          address, detection_id, pattern_type, strength, confidence,
          description, evidence, affected_transactions,
          interval_consistency, average_interval, coefficient_of_variation,
          regularity_score, human_like_score,
          gas_price_consistency, gas_limit_consistency, amount_pattern_consistency,
          detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        detectionId,
        pattern.patternType,
        pattern.strength,
        pattern.confidence,
        pattern.description,
        JSON.stringify(pattern.evidence),
        JSON.stringify(pattern.affectedTransactions),
        behaviorResult.timingAnalysis.intervalConsistency,
        behaviorResult.timingAnalysis.averageInterval,
        behaviorResult.timingAnalysis.coefficientOfVariation,
        behaviorResult.timingAnalysis.regularityScore,
        behaviorResult.timingAnalysis.humanLikeScore,
        behaviorResult.parameterConsistency.gasPriceConsistency,
        behaviorResult.parameterConsistency.gasLimitConsistency,
        behaviorResult.parameterConsistency.amountPatternConsistency,
        Date.now()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save coordination pattern
   */
  private static async saveCoordinationPattern(address: string, detectionId: number, pattern: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO coordination_patterns (
          address, detection_id, pattern_type, strength, confidence,
          description, evidence, indicative_transactions,
          synchronization_score, parameter_matching_score, coordination_window,
          detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        detectionId,
        pattern.patternType,
        pattern.strength,
        pattern.confidence,
        pattern.description,
        JSON.stringify(pattern.evidence),
        JSON.stringify(pattern.indicativeTransactions),
        0, // Default synchronization score
        0, // Default parameter matching score
        300, // Default 5-minute coordination window
        Date.now()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get latest anomaly detection result for an address
   */
  static async getLatestAnomalyDetectionResult(address: string): Promise<any | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM anomaly_detection_results 
          WHERE address = ?
          ORDER BY timestamp DESC
          LIMIT 1
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) return null;

      return {
        id: result.id,
        address: result.address,
        timestamp: result.timestamp,
        overallAnomalyScore: result.overall_anomaly_score,
        confidence: result.confidence,
        flags: {
          hasStatisticalAnomalies: result.has_statistical_anomalies,
          hasWashTrading: result.has_wash_trading,
          hasBotBehavior: result.has_bot_behavior,
          hasCoordinatedActivity: result.has_coordinated_activity,
          requiresInvestigation: result.requires_investigation
        },
        statisticalAnomalies: JSON.parse(result.statistical_anomalies || '[]'),
        washTradingDetection: JSON.parse(result.wash_trading_result || '{}'),
        botBehaviorDetection: JSON.parse(result.bot_behavior_result || '{}'),
        coordinatedActivityDetection: JSON.parse(result.coordinated_activity_result || '{}'),
        riskExplanation: result.risk_explanation,
        recommendations: JSON.parse(result.recommendations || '[]')
      };
    } catch (error) {
      console.error('Error getting latest anomaly detection result:', error);
      throw new Error(`Failed to get latest anomaly detection result: ${error}`);
    }
  }

  // Competitive Positioning Database Methods

  /**
   * Save competitive positioning data
   */
  static async saveCompetitivePositioningData(data: any): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO competitive_positioning_data (
            address, timestamp, overall_market_rank, total_market_size, market_percentile,
            market_segment_name, market_segment_data, competitive_landscape_data, market_share_data,
            user_trends_data, peer_group_trends_data, market_average_trends_data,
            trend_velocity_data, trend_positioning_data,
            competitive_advantages, market_opportunities, competitive_threats, strategic_recommendations,
            analysis_version, processing_time_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.address.toLowerCase(),
          data.timestamp || Math.floor(Date.now() / 1000),
          data.marketPosition.overallMarketRank,
          data.marketPosition.totalMarketSize,
          data.marketPosition.marketPercentile,
          data.marketPosition.marketSegment.name,
          JSON.stringify(data.marketPosition.marketSegment),
          JSON.stringify(data.marketPosition.competitiveLandscape),
          JSON.stringify(data.marketPosition.marketShare),
          JSON.stringify(data.trendComparison.userTrends),
          JSON.stringify(data.trendComparison.peerGroupTrends),
          JSON.stringify(data.trendComparison.marketAverageTrends),
          JSON.stringify(data.trendComparison.trendVelocity),
          JSON.stringify(data.trendComparison.trendPositioning),
          JSON.stringify(data.competitiveAdvantages),
          JSON.stringify(data.marketOpportunities),
          JSON.stringify(data.competitiveThreats),
          JSON.stringify(data.strategicRecommendations),
          '1.0',
          Date.now() - (data.timestamp || Math.floor(Date.now() / 1000)) * 1000
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      const positioningId = result.lastID;

      // Save detailed competitive advantages
      for (const advantage of data.competitiveAdvantages) {
        await this.saveCompetitiveAdvantage(data.address, positioningId, advantage);
      }

      // Save market opportunities
      for (const opportunity of data.marketOpportunities) {
        await this.saveMarketOpportunity(data.address, positioningId, opportunity);
      }

      // Save competitive threats
      for (const threat of data.competitiveThreats) {
        await this.saveCompetitiveThreat(data.address, positioningId, threat);
      }

      // Save strategic recommendations
      for (const recommendation of data.strategicRecommendations) {
        await this.saveStrategicRecommendation(data.address, positioningId, recommendation);
      }

      console.log(`Saved competitive positioning data for address ${data.address} with ID ${positioningId}`);
      return positioningId;
    } catch (error) {
      console.error('Error saving competitive positioning data:', error);
      throw new Error(`Failed to save competitive positioning data: ${error}`);
    }
  }

  /**
   * Save competitive advantage
   */
  private static async saveCompetitiveAdvantage(address: string, positioningId: number, advantage: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO competitive_advantages (
          address, positioning_id, area, advantage_type, strength, market_gap,
          defensibility, monetization_potential, description, supporting_metrics, threats, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        positioningId,
        advantage.area,
        advantage.advantageType,
        advantage.strength,
        advantage.marketGap,
        advantage.defensibility,
        advantage.monetizationPotential,
        advantage.description,
        JSON.stringify(advantage.supportingMetrics),
        JSON.stringify(advantage.threats),
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save market opportunity
   */
  private static async saveMarketOpportunity(address: string, positioningId: number, opportunity: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO market_opportunities (
          address, positioning_id, area, opportunity_size, difficulty, time_to_capture,
          market_demand, competition_level, potential_score_improvement,
          potential_market_position_gain, potential_competitive_advantage_gain,
          description, action_plan, success_metrics, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        positioningId,
        opportunity.area,
        opportunity.opportunitySize,
        opportunity.difficulty,
        opportunity.timeToCapture,
        opportunity.marketDemand,
        opportunity.competitionLevel,
        opportunity.potentialImpact.scoreImprovement,
        opportunity.potentialImpact.marketPositionGain,
        opportunity.potentialImpact.competitiveAdvantageGain,
        opportunity.description,
        JSON.stringify(opportunity.actionPlan),
        JSON.stringify(opportunity.successMetrics),
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save competitive threat
   */
  private static async saveCompetitiveThreat(address: string, positioningId: number, threat: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO competitive_threats (
          address, positioning_id, threat, severity, probability, timeframe,
          impact_areas, potential_score_impact, potential_market_position_loss,
          potential_competitive_disadvantage, description, mitigation_strategies,
          early_warning_signals, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        positioningId,
        threat.threat,
        threat.severity,
        threat.probability,
        threat.timeframe,
        JSON.stringify(threat.impactAreas),
        threat.potentialLoss.scoreImpact,
        threat.potentialLoss.marketPositionLoss,
        threat.potentialLoss.competitiveDisadvantage,
        threat.description,
        JSON.stringify(threat.mitigationStrategies),
        JSON.stringify(threat.earlyWarningSignals),
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Save strategic recommendation
   */
  private static async saveStrategicRecommendation(address: string, positioningId: number, recommendation: any): Promise<void> {
    const db = getDatabase();

    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT INTO strategic_recommendations (
          address, positioning_id, priority, category, title, description,
          rationale, expected_outcome, implementation_steps, timeline,
          resources, risks, success_metrics, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        address.toLowerCase(),
        positioningId,
        recommendation.priority,
        recommendation.category,
        recommendation.title,
        recommendation.description,
        recommendation.rationale,
        recommendation.expectedOutcome,
        JSON.stringify(recommendation.implementation.steps),
        recommendation.implementation.timeline,
        JSON.stringify(recommendation.implementation.resources),
        JSON.stringify(recommendation.implementation.risks),
        JSON.stringify(recommendation.successMetrics),
        Math.floor(Date.now() / 1000)
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get latest competitive positioning data for an address
   */
  static async getLatestCompetitivePositioningData(address: string): Promise<any | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM competitive_positioning_data 
          WHERE address = ?
          ORDER BY timestamp DESC
          LIMIT 1
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) return null;

      return {
        id: result.id,
        address: result.address,
        timestamp: result.timestamp,
        marketPosition: {
          overallMarketRank: result.overall_market_rank,
          totalMarketSize: result.total_market_size,
          marketPercentile: result.market_percentile,
          marketSegment: JSON.parse(result.market_segment_data || '{}'),
          competitiveLandscape: JSON.parse(result.competitive_landscape_data || '{}'),
          marketShare: JSON.parse(result.market_share_data || '{}')
        },
        trendComparison: {
          userTrends: JSON.parse(result.user_trends_data || '{}'),
          peerGroupTrends: JSON.parse(result.peer_group_trends_data || '{}'),
          marketAverageTrends: JSON.parse(result.market_average_trends_data || '{}'),
          trendVelocity: JSON.parse(result.trend_velocity_data || '{}'),
          trendPositioning: JSON.parse(result.trend_positioning_data || '{}')
        },
        competitiveAdvantages: JSON.parse(result.competitive_advantages || '[]'),
        marketOpportunities: JSON.parse(result.market_opportunities || '[]'),
        competitiveThreats: JSON.parse(result.competitive_threats || '[]'),
        strategicRecommendations: JSON.parse(result.strategic_recommendations || '[]'),
        analysisVersion: result.analysis_version,
        processingTimeMs: result.processing_time_ms
      };
    } catch (error) {
      console.error('Error getting latest competitive positioning data:', error);
      throw new Error(`Failed to get latest competitive positioning data: ${error}`);
    }
  }

  /**
   * Get competitive positioning history for an address
   */
  static async getCompetitivePositioningHistory(address: string, limit: number = 10): Promise<any[]> {
    const db = getDatabase();

    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT * FROM competitive_positioning_data 
          WHERE address = ?
          ORDER BY timestamp DESC
          LIMIT ?
        `, [address.toLowerCase(), limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        address: row.address,
        timestamp: row.timestamp,
        marketPercentile: row.market_percentile,
        overallMarketRank: row.overall_market_rank,
        marketSegmentName: row.market_segment_name,
        analysisVersion: row.analysis_version
      }));
    } catch (error) {
      console.error('Error getting competitive positioning history:', error);
      throw new Error(`Failed to get competitive positioning history: ${error}`);
    }
  }

  /**
   * Get competitive advantages for an address
   */
  static async getCompetitiveAdvantages(address: string, positioningId?: number): Promise<any[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM competitive_advantages WHERE address = ?';
      const params: any[] = [address.toLowerCase()];

      if (positioningId) {
        query += ' AND positioning_id = ?';
        params.push(positioningId);
      }

      query += ' ORDER BY market_gap DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        area: row.area,
        advantageType: row.advantage_type,
        strength: row.strength,
        marketGap: row.market_gap,
        defensibility: row.defensibility,
        monetizationPotential: row.monetization_potential,
        description: row.description,
        supportingMetrics: JSON.parse(row.supporting_metrics || '[]'),
        threats: JSON.parse(row.threats || '[]'),
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting competitive advantages:', error);
      throw new Error(`Failed to get competitive advantages: ${error}`);
    }
  }

  /**
   * Get market opportunities for an address
   */
  static async getMarketOpportunities(address: string, positioningId?: number): Promise<any[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM market_opportunities WHERE address = ?';
      const params: any[] = [address.toLowerCase()];

      if (positioningId) {
        query += ' AND positioning_id = ?';
        params.push(positioningId);
      }

      query += ' ORDER BY potential_score_improvement DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        area: row.area,
        opportunitySize: row.opportunity_size,
        difficulty: row.difficulty,
        timeToCapture: row.time_to_capture,
        marketDemand: row.market_demand,
        competitionLevel: row.competition_level,
        potentialImpact: {
          scoreImprovement: row.potential_score_improvement,
          marketPositionGain: row.potential_market_position_gain,
          competitiveAdvantageGain: row.potential_competitive_advantage_gain
        },
        description: row.description,
        actionPlan: JSON.parse(row.action_plan || '[]'),
        successMetrics: JSON.parse(row.success_metrics || '[]'),
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting market opportunities:', error);
      throw new Error(`Failed to get market opportunities: ${error}`);
    }
  }

  /**
   * Get competitive threats for an address
   */
  static async getCompetitiveThreats(address: string, positioningId?: number): Promise<any[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM competitive_threats WHERE address = ?';
      const params: any[] = [address.toLowerCase()];

      if (positioningId) {
        query += ' AND positioning_id = ?';
        params.push(positioningId);
      }

      query += ' ORDER BY severity DESC, probability DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        threat: row.threat,
        severity: row.severity,
        probability: row.probability,
        timeframe: row.timeframe,
        impactAreas: JSON.parse(row.impact_areas || '[]'),
        potentialLoss: {
          scoreImpact: row.potential_score_impact,
          marketPositionLoss: row.potential_market_position_loss,
          competitiveDisadvantage: row.potential_competitive_disadvantage
        },
        description: row.description,
        mitigationStrategies: JSON.parse(row.mitigation_strategies || '[]'),
        earlyWarningSignals: JSON.parse(row.early_warning_signals || '[]'),
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting competitive threats:', error);
      throw new Error(`Failed to get competitive threats: ${error}`);
    }
  }

  /**
   * Get strategic recommendations for an address
   */
  static async getStrategicRecommendations(address: string, positioningId?: number, status?: string): Promise<any[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM strategic_recommendations WHERE address = ?';
      const params: any[] = [address.toLowerCase()];

      if (positioningId) {
        query += ' AND positioning_id = ?';
        params.push(positioningId);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY priority DESC, created_at DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        priority: row.priority,
        category: row.category,
        title: row.title,
        description: row.description,
        rationale: row.rationale,
        expectedOutcome: row.expected_outcome,
        implementation: {
          steps: JSON.parse(row.implementation_steps || '[]'),
          timeline: row.timeline,
          resources: JSON.parse(row.resources || '[]'),
          risks: JSON.parse(row.risks || '[]')
        },
        successMetrics: JSON.parse(row.success_metrics || '[]'),
        createdAt: row.created_at,
        status: row.status,
        progress: row.progress,
        completedAt: row.completed_at
      }));
    } catch (error) {
      console.error('Error getting strategic recommendations:', error);
      throw new Error(`Failed to get strategic recommendations: ${error}`);
    }
  }

  /**
   * Update strategic recommendation progress
   */
  static async updateStrategicRecommendationProgress(id: number, progress: number, status?: string): Promise<void> {
    const db = getDatabase();

    try {
      const now = Math.floor(Date.now() / 1000);
      const completedAt = progress >= 100 ? now : null;
      const finalStatus = status || (progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS');

      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE strategic_recommendations 
          SET progress = ?, status = ?, completed_at = ?
          WHERE id = ?
        `, [progress, finalStatus, completedAt, id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Updated strategic recommendation ${id} progress to ${progress}%`);
    } catch (error) {
      console.error('Error updating strategic recommendation progress:', error);
      throw new Error(`Failed to update strategic recommendation progress: ${error}`);
    }
  }
  // Real-time Benchmarking Database Methods

  /**
   * Save real-time benchmark data
   */
  static async saveRealTimeBenchmarkData(data: Omit<RealTimeBenchmarkData, 'id'>): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO real_time_benchmark_data (
            address, peer_group_id, overall_percentile, component_percentiles,
            benchmark_timestamp, last_updated, update_frequency, is_stale
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.address.toLowerCase(),
          data.peerGroupId,
          data.overallPercentile,
          data.componentPercentiles,
          data.benchmarkTimestamp,
          data.lastUpdated,
          data.updateFrequency,
          data.isStale ? 1 : 0
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved real-time benchmark data for address ${data.address}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving real-time benchmark data:', error);
      throw new Error(`Failed to save real-time benchmark data: ${error}`);
    }
  }

  /**
   * Get real-time benchmark data for an address
   */
  static async getRealTimeBenchmarkData(address: string): Promise<RealTimeBenchmarkData | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM real_time_benchmark_data 
          WHERE address = ?
          ORDER BY last_updated DESC
          LIMIT 1
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) return null;

      return {
        id: result.id,
        address: result.address,
        peerGroupId: result.peer_group_id,
        overallPercentile: result.overall_percentile,
        componentPercentiles: result.component_percentiles,
        benchmarkTimestamp: result.benchmark_timestamp,
        lastUpdated: result.last_updated,
        updateFrequency: result.update_frequency,
        isStale: result.is_stale === 1
      };
    } catch (error) {
      console.error('Error getting real-time benchmark data:', error);
      throw new Error(`Failed to get real-time benchmark data: ${error}`);
    }
  }

  /**
   * Update real-time benchmark data
   */
  static async updateRealTimeBenchmarkData(
    address: string, 
    updates: Partial<Omit<RealTimeBenchmarkData, 'id' | 'address'>>
  ): Promise<void> {
    const db = getDatabase();

    try {
      const setClause: string[] = [];
      const params: any[] = [];

      if (updates.overallPercentile !== undefined) {
        setClause.push('overall_percentile = ?');
        params.push(updates.overallPercentile);
      }
      if (updates.componentPercentiles !== undefined) {
        setClause.push('component_percentiles = ?');
        params.push(updates.componentPercentiles);
      }
      if (updates.lastUpdated !== undefined) {
        setClause.push('last_updated = ?');
        params.push(updates.lastUpdated);
      }
      if (updates.isStale !== undefined) {
        setClause.push('is_stale = ?');
        params.push(updates.isStale ? 1 : 0);
      }

      if (setClause.length === 0) return;

      params.push(address.toLowerCase());

      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE real_time_benchmark_data 
          SET ${setClause.join(', ')}
          WHERE address = ?
        `, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Updated real-time benchmark data for address ${address}`);
    } catch (error) {
      console.error('Error updating real-time benchmark data:', error);
      throw new Error(`Failed to update real-time benchmark data: ${error}`);
    }
  }

  /**
   * Mark benchmark data as stale for addresses that need updates
   */
  static async markStaleRealTimeBenchmarks(olderThanSeconds: number): Promise<number> {
    const db = getDatabase();

    try {
      const cutoffTimestamp = Math.floor(Date.now() / 1000) - olderThanSeconds;
      
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          UPDATE real_time_benchmark_data 
          SET is_stale = 1
          WHERE last_updated < ? AND is_stale = 0
        `, [cutoffTimestamp], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      const updatedCount = result.changes || 0;
      console.log(`Marked ${updatedCount} benchmark entries as stale`);
      return updatedCount;
    } catch (error) {
      console.error('Error marking stale benchmarks:', error);
      throw new Error(`Failed to mark stale benchmarks: ${error}`);
    }
  }

  /**
   * Get addresses with stale benchmark data
   */
  static async getStaleRealTimeBenchmarks(limit: number = 100): Promise<string[]> {
    const db = getDatabase();

    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT DISTINCT address FROM real_time_benchmark_data 
          WHERE is_stale = 1
          ORDER BY last_updated ASC
          LIMIT ?
        `, [limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => row.address);
    } catch (error) {
      console.error('Error getting stale benchmarks:', error);
      throw new Error(`Failed to get stale benchmarks: ${error}`);
    }
  }

  /**
   * Create benchmark update job
   */
  static async createBenchmarkUpdateJob(job: Omit<BenchmarkUpdateJob, 'id'>): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO benchmark_update_jobs (
            job_type, target_address, peer_group_id, priority,
            scheduled_at, started_at, completed_at, status,
            error_message, retry_count, max_retries
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          job.jobType,
          job.targetAddress?.toLowerCase(),
          job.peerGroupId,
          job.priority,
          job.scheduledAt,
          job.startedAt,
          job.completedAt,
          job.status,
          job.errorMessage,
          job.retryCount,
          job.maxRetries
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Created benchmark update job: ${job.jobType}`);
      return result.lastID;
    } catch (error) {
      console.error('Error creating benchmark update job:', error);
      throw new Error(`Failed to create benchmark update job: ${error}`);
    }
  }

  /**
   * Get pending benchmark update jobs
   */
  static async getPendingBenchmarkUpdateJobs(limit: number = 50): Promise<BenchmarkUpdateJob[]> {
    const db = getDatabase();

    try {
      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(`
          SELECT * FROM benchmark_update_jobs 
          WHERE status = 'PENDING' AND scheduled_at <= ?
          ORDER BY priority DESC, scheduled_at ASC
          LIMIT ?
        `, [Math.floor(Date.now() / 1000), limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        id: row.id,
        jobType: row.job_type,
        targetAddress: row.target_address,
        peerGroupId: row.peer_group_id,
        priority: row.priority,
        scheduledAt: row.scheduled_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        status: row.status,
        errorMessage: row.error_message,
        retryCount: row.retry_count,
        maxRetries: row.max_retries
      }));
    } catch (error) {
      console.error('Error getting pending benchmark update jobs:', error);
      throw new Error(`Failed to get pending benchmark update jobs: ${error}`);
    }
  }

  /**
   * Update benchmark job status
   */
  static async updateBenchmarkJobStatus(
    jobId: number, 
    status: BenchmarkUpdateJob['status'], 
    errorMessage?: string
  ): Promise<void> {
    const db = getDatabase();

    try {
      const now = Math.floor(Date.now() / 1000);
      let setClause = 'status = ?';
      const params: any[] = [status];

      if (status === 'RUNNING') {
        setClause += ', started_at = ?';
        params.push(now);
      } else if (status === 'COMPLETED' || status === 'FAILED') {
        setClause += ', completed_at = ?';
        params.push(now);
      }

      if (errorMessage) {
        setClause += ', error_message = ?';
        params.push(errorMessage);
      }

      params.push(jobId);

      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE benchmark_update_jobs 
          SET ${setClause}
          WHERE id = ?
        `, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Updated benchmark job ${jobId} status to ${status}`);
    } catch (error) {
      console.error('Error updating benchmark job status:', error);
      throw new Error(`Failed to update benchmark job status: ${error}`);
    }
  }

  /**
   * Increment job retry count
   */
  static async incrementBenchmarkJobRetryCount(jobId: number): Promise<void> {
    const db = getDatabase();

    try {
      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE benchmark_update_jobs 
          SET retry_count = retry_count + 1, status = 'PENDING'
          WHERE id = ?
        `, [jobId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Incremented retry count for benchmark job ${jobId}`);
    } catch (error) {
      console.error('Error incrementing benchmark job retry count:', error);
      throw new Error(`Failed to increment benchmark job retry count: ${error}`);
    }
  }

  /**
   * Save peer group snapshot
   */
  static async savePeerGroupSnapshot(snapshot: Omit<PeerGroupSnapshot, 'id'>): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO peer_group_snapshots (
            peer_group_id, member_count, average_score, score_distribution,
            snapshot_timestamp, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          snapshot.peerGroupId,
          snapshot.memberCount,
          snapshot.averageScore,
          snapshot.scoreDistribution,
          snapshot.snapshotTimestamp,
          snapshot.isActive ? 1 : 0
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved peer group snapshot for ${snapshot.peerGroupId}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving peer group snapshot:', error);
      throw new Error(`Failed to save peer group snapshot: ${error}`);
    }
  }

  /**
   * Get latest peer group snapshot
   */
  static async getLatestPeerGroupSnapshot(peerGroupId: string): Promise<PeerGroupSnapshot | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM peer_group_snapshots 
          WHERE peer_group_id = ? AND is_active = 1
          ORDER BY snapshot_timestamp DESC
          LIMIT 1
        `, [peerGroupId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) return null;

      return {
        id: result.id,
        peerGroupId: result.peer_group_id,
        memberCount: result.member_count,
        averageScore: result.average_score,
        scoreDistribution: result.score_distribution,
        snapshotTimestamp: result.snapshot_timestamp,
        isActive: result.is_active === 1
      };
    } catch (error) {
      console.error('Error getting latest peer group snapshot:', error);
      throw new Error(`Failed to get latest peer group snapshot: ${error}`);
    }
  }

  /**
   * Deactivate old peer group snapshots
   */
  static async deactivateOldPeerGroupSnapshots(peerGroupId: string, keepLatest: number = 5): Promise<void> {
    const db = getDatabase();

    try {
      await new Promise<void>((resolve, reject) => {
        db.run(`
          UPDATE peer_group_snapshots 
          SET is_active = 0
          WHERE peer_group_id = ? AND id NOT IN (
            SELECT id FROM peer_group_snapshots 
            WHERE peer_group_id = ?
            ORDER BY snapshot_timestamp DESC
            LIMIT ?
          )
        `, [peerGroupId, peerGroupId, keepLatest], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`Deactivated old snapshots for peer group ${peerGroupId}`);
    } catch (error) {
      console.error('Error deactivating old peer group snapshots:', error);
      throw new Error(`Failed to deactivate old peer group snapshots: ${error}`);
    }
  }

  /**
   * Get real-time benchmark statistics
   */
  static async getRealTimeBenchmarkStats(): Promise<{
    totalBenchmarks: number;
    staleBenchmarks: number;
    pendingJobs: number;
    activePeerGroups: number;
    lastUpdateTime: number;
  }> {
    const db = getDatabase();

    try {
      const [benchmarkStats, jobStats, peerGroupStats] = await Promise.all([
        new Promise<any>((resolve, reject) => {
          db.get(`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN is_stale = 1 THEN 1 ELSE 0 END) as stale,
              MAX(last_updated) as last_update
            FROM real_time_benchmark_data
          `, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        new Promise<any>((resolve, reject) => {
          db.get(`
            SELECT COUNT(*) as pending
            FROM benchmark_update_jobs
            WHERE status = 'PENDING'
          `, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }),
        new Promise<any>((resolve, reject) => {
          db.get(`
            SELECT COUNT(DISTINCT peer_group_id) as active_groups
            FROM peer_group_snapshots
            WHERE is_active = 1
          `, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        })
      ]);

      return {
        totalBenchmarks: benchmarkStats?.total || 0,
        staleBenchmarks: benchmarkStats?.stale || 0,
        pendingJobs: jobStats?.pending || 0,
        activePeerGroups: peerGroupStats?.active_groups || 0,
        lastUpdateTime: benchmarkStats?.last_update || 0
      };
    } catch (error) {
      console.error('Error getting real-time benchmark stats:', error);
      throw new Error(`Failed to get real-time benchmark stats: ${error}`);
    }
  }

  // Predictive Analytics Database Methods

  /**
   * Save score forecast prediction
   */
  static async savePrediction(prediction: any): Promise<string> {
    const db = getDatabase();

    try {
      const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO predictions (
            prediction_id, address, prediction_date, target_date, predicted_score,
            confidence_lower, confidence_upper, confidence, methodology, factors,
            prediction_data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          predictionId,
          prediction.address.toLowerCase(),
          prediction.predictionDate,
          prediction.targetDate,
          prediction.predictedScore,
          prediction.confidenceInterval.lower,
          prediction.confidenceInterval.upper,
          prediction.confidence,
          prediction.methodology,
          JSON.stringify(prediction.factors),
          JSON.stringify(prediction),
          Math.floor(Date.now() / 1000)
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved prediction ${predictionId} for address ${prediction.address}`);
      return predictionId;
    } catch (error) {
      console.error('Error saving prediction:', error);
      throw new Error(`Failed to save prediction: ${error}`);
    }
  }

  /**
   * Get prediction by ID
   */
  static async getPrediction(predictionId: string): Promise<any | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM predictions 
          WHERE prediction_id = ?
        `, [predictionId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) {
        return null;
      }

      return {
        predictionId: result.prediction_id,
        address: result.address,
        predictionDate: result.prediction_date,
        targetDate: result.target_date,
        predictedScore: result.predicted_score,
        confidenceInterval: {
          lower: result.confidence_lower,
          upper: result.confidence_upper
        },
        confidence: result.confidence,
        methodology: result.methodology,
        factors: JSON.parse(result.factors),
        predictionData: JSON.parse(result.prediction_data),
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Error getting prediction:', error);
      throw new Error(`Failed to get prediction: ${error}`);
    }
  }

  /**
   * Save prediction accuracy result
   */
  static async savePredictionAccuracy(accuracy: any): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO prediction_accuracy (
            prediction_id, address, prediction_date, target_date, predicted_score,
            actual_score, accuracy, absolute_error, relative_error,
            confidence_lower, confidence_upper, was_within_interval,
            methodology, factors, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          accuracy.predictionId,
          accuracy.address.toLowerCase(),
          accuracy.predictionDate,
          accuracy.targetDate,
          accuracy.predictedScore,
          accuracy.actualScore,
          accuracy.accuracy,
          accuracy.absoluteError,
          accuracy.relativeError,
          accuracy.confidenceInterval.lower,
          accuracy.confidenceInterval.upper,
          accuracy.wasWithinInterval,
          accuracy.methodology,
          JSON.stringify(accuracy.factors),
          Math.floor(Date.now() / 1000)
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved prediction accuracy for ${accuracy.predictionId}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving prediction accuracy:', error);
      throw new Error(`Failed to save prediction accuracy: ${error}`);
    }
  }

  /**
   * Save model performance metrics
   */
  static async saveModelPerformance(performance: any): Promise<void> {
    const db = getDatabase();

    try {
      // Check if performance record exists
      const existing = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT id FROM model_performance 
          WHERE model_name = ? AND version = ?
        `, [performance.modelName, performance.version], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existing) {
        // Update existing record
        await new Promise<void>((resolve, reject) => {
          db.run(`
            UPDATE model_performance 
            SET total_predictions = ?, average_accuracy = ?, average_absolute_error = ?,
                average_relative_error = ?, confidence_interval_accuracy = ?,
                performance_by_timeframe = ?, performance_by_score_range = ?,
                recommendations = ?, last_updated = ?
            WHERE id = ?
          `, [
            performance.totalPredictions,
            performance.averageAccuracy,
            performance.averageAbsoluteError,
            performance.averageRelativeError,
            performance.confidenceIntervalAccuracy,
            JSON.stringify(performance.performanceByTimeframe),
            JSON.stringify(performance.performanceByScoreRange),
            JSON.stringify(performance.recommendations),
            performance.lastUpdated,
            existing.id
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        // Insert new record
        await new Promise<void>((resolve, reject) => {
          db.run(`
            INSERT INTO model_performance (
              model_name, version, total_predictions, average_accuracy,
              average_absolute_error, average_relative_error, confidence_interval_accuracy,
              performance_by_timeframe, performance_by_score_range,
              recommendations, last_updated, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            performance.modelName,
            performance.version,
            performance.totalPredictions,
            performance.averageAccuracy,
            performance.averageAbsoluteError,
            performance.averageRelativeError,
            performance.confidenceIntervalAccuracy,
            JSON.stringify(performance.performanceByTimeframe),
            JSON.stringify(performance.performanceByScoreRange),
            JSON.stringify(performance.recommendations),
            performance.lastUpdated,
            Math.floor(Date.now() / 1000)
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      console.log(`Saved model performance for ${performance.modelName}`);
    } catch (error) {
      console.error('Error saving model performance:', error);
      throw new Error(`Failed to save model performance: ${error}`);
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformance(modelName?: string): Promise<any[]> {
    const db = getDatabase();

    try {
      let query = 'SELECT * FROM model_performance';
      const params: any[] = [];

      if (modelName) {
        query += ' WHERE model_name = ?';
        params.push(modelName);
      }

      query += ' ORDER BY last_updated DESC';

      const results = await new Promise<any[]>((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      return results.map(row => ({
        modelName: row.model_name,
        version: row.version,
        totalPredictions: row.total_predictions,
        averageAccuracy: row.average_accuracy,
        averageAbsoluteError: row.average_absolute_error,
        averageRelativeError: row.average_relative_error,
        confidenceIntervalAccuracy: row.confidence_interval_accuracy,
        performanceByTimeframe: JSON.parse(row.performance_by_timeframe),
        performanceByScoreRange: JSON.parse(row.performance_by_score_range),
        recommendations: JSON.parse(row.recommendations),
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting model performance:', error);
      throw new Error(`Failed to get model performance: ${error}`);
    }
  }

  /**
   * Save score forecast
   */
  static async saveScoreForecast(forecast: any): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO score_forecasts (
            address, current_score, trend_direction, trend_strength, confidence,
            prediction_horizon, methodology, key_factors, uncertainty_factors,
            predicted_scores, last_updated, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          forecast.address.toLowerCase(),
          forecast.currentScore,
          forecast.trendDirection,
          forecast.trendStrength,
          forecast.confidence,
          forecast.predictionHorizon,
          forecast.methodology,
          JSON.stringify(forecast.keyFactors),
          JSON.stringify(forecast.uncertaintyFactors),
          JSON.stringify(forecast.predictedScores),
          forecast.lastUpdated,
          Math.floor(Date.now() / 1000)
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved score forecast for address ${forecast.address}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving score forecast:', error);
      throw new Error(`Failed to save score forecast: ${error}`);
    }
  }

  /**
   * Get latest score forecast for an address
   */
  static async getLatestScoreForecast(address: string): Promise<any | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM score_forecasts 
          WHERE address = ?
          ORDER BY last_updated DESC
          LIMIT 1
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) {
        return null;
      }

      return {
        address: result.address,
        currentScore: result.current_score,
        trendDirection: result.trend_direction,
        trendStrength: result.trend_strength,
        confidence: result.confidence,
        predictionHorizon: result.prediction_horizon,
        methodology: result.methodology,
        keyFactors: JSON.parse(result.key_factors),
        uncertaintyFactors: JSON.parse(result.uncertainty_factors),
        predictedScores: JSON.parse(result.predicted_scores),
        lastUpdated: result.last_updated,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Error getting score forecast:', error);
      throw new Error(`Failed to get score forecast: ${error}`);
    }
  }

  /**
   * Save behavioral trend prediction
   */
  static async saveBehavioralTrendPrediction(prediction: any): Promise<number> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.run(`
          INSERT INTO behavioral_trend_predictions (
            address, current_behavior, predicted_behavior, trend_analysis,
            risk_factors, opportunities, confidence, prediction_horizon,
            last_updated, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          prediction.address.toLowerCase(),
          JSON.stringify(prediction.currentBehavior),
          JSON.stringify(prediction.predictedBehavior),
          JSON.stringify(prediction.trendAnalysis),
          JSON.stringify(prediction.riskFactors),
          JSON.stringify(prediction.opportunities),
          prediction.confidence,
          prediction.predictionHorizon,
          prediction.lastUpdated,
          Math.floor(Date.now() / 1000)
        ], function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });

      console.log(`Saved behavioral trend prediction for address ${prediction.address}`);
      return result.lastID;
    } catch (error) {
      console.error('Error saving behavioral trend prediction:', error);
      throw new Error(`Failed to save behavioral trend prediction: ${error}`);
    }
  }

  /**
   * Get latest behavioral trend prediction for an address
   */
  static async getLatestBehavioralTrendPrediction(address: string): Promise<any | null> {
    const db = getDatabase();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        db.get(`
          SELECT * FROM behavioral_trend_predictions 
          WHERE address = ?
          ORDER BY last_updated DESC
          LIMIT 1
        `, [address.toLowerCase()], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!result) {
        return null;
      }

      return {
        address: result.address,
        currentBehavior: JSON.parse(result.current_behavior),
        predictedBehavior: JSON.parse(result.predicted_behavior),
        trendAnalysis: JSON.parse(result.trend_analysis),
        riskFactors: JSON.parse(result.risk_factors),
        opportunities: JSON.parse(result.opportunities),
        confidence: result.confidence,
        predictionHorizon: result.prediction_horizon,
        lastUpdated: result.last_updated,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Error getting behavioral trend prediction:', error);
      throw new Error(`Failed to get behavioral trend prediction: ${error}`);
    }
  }
}

export const databaseService = DatabaseService;
export default databaseService;