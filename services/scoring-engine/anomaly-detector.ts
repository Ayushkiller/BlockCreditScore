// Anomaly Detector - Detects suspicious behavior patterns for manual review
// Implements Requirement 6.4: anomaly detection and logging

import { AnomalyReport } from '../../types/api';
import { CategorizedTransaction } from '../data-aggregator/transaction-categorizer';
import { getCurrentTimestamp } from '../../utils/time';
import { formatError } from '../../utils/errors';

export interface AnomalyPattern {
  type: AnomalyReport['type'];
  threshold: number;
  timeWindow: number; // milliseconds
  description: string;
}

export interface UserBehaviorHistory {
  userAddress: string;
  transactions: CategorizedTransaction[];
  lastUpdated: number;
  totalVolume: number;
  averageRisk: number;
  transactionCount: number;
}

export class AnomalyDetector {
  private userHistory: Map<string, UserBehaviorHistory> = new Map();
  private anomalyPatterns: AnomalyPattern[];
  private totalAnomaliesDetected: number = 0;
  private anomalyLog: AnomalyReport[] = [];

  constructor() {
    this.anomalyPatterns = this.initializeAnomalyPatterns();
  }

  /**
   * Initialize anomaly detection patterns
   */
  private initializeAnomalyPatterns(): AnomalyPattern[] {
    return [
      {
        type: 'suspicious_volume',
        threshold: 10, // 10x normal volume
        timeWindow: 24 * 60 * 60 * 1000, // 24 hours
        description: 'Transaction volume significantly higher than normal'
      },
      {
        type: 'unusual_pattern',
        threshold: 5, // 5x normal frequency
        timeWindow: 60 * 60 * 1000, // 1 hour
        description: 'Unusual transaction frequency pattern detected'
      },
      {
        type: 'potential_fraud',
        threshold: 0.8, // High risk score threshold
        timeWindow: 30 * 60 * 1000, // 30 minutes
        description: 'Multiple high-risk transactions in short timeframe'
      }
    ];
  }

  /**
   * Detect anomalies for a user transaction
   * Implements Requirement 6.4
   */
  public async detectAnomalies(
    userAddress: string,
    transaction: CategorizedTransaction
  ): Promise<AnomalyReport[]> {
    try {
      // Update user behavior history
      await this.updateUserHistory(userAddress, transaction);
      
      const userHistory = this.userHistory.get(userAddress);
      if (!userHistory) {
        return [];
      }

      const anomalies: AnomalyReport[] = [];

      // Check each anomaly pattern
      for (const pattern of this.anomalyPatterns) {
        const anomaly = await this.checkAnomalyPattern(userHistory, transaction, pattern);
        if (anomaly) {
          anomalies.push(anomaly);
        }
      }

      // Log anomalies for manual review as required
      if (anomalies.length > 0) {
        this.logAnomalies(anomalies);
        this.totalAnomaliesDetected += anomalies.length;
      }

      return anomalies;

    } catch (error) {
      console.error(`Error detecting anomalies for ${userAddress}:`, formatError(error));
      return [];
    }
  }  /**

   * Update user behavior history with new transaction
   */
  private async updateUserHistory(
    userAddress: string,
    transaction: CategorizedTransaction
  ): Promise<void> {
    let history = this.userHistory.get(userAddress);
    
    if (!history) {
      history = {
        userAddress,
        transactions: [],
        lastUpdated: getCurrentTimestamp(),
        totalVolume: 0,
        averageRisk: 0,
        transactionCount: 0
      };
      this.userHistory.set(userAddress, history);
    }

    // Add new transaction
    history.transactions.push(transaction);
    history.lastUpdated = getCurrentTimestamp();
    history.transactionCount++;

    // Update volume (convert hex to number)
    const transactionValue = parseInt(transaction.value, 16) / 1e18;
    history.totalVolume += transactionValue;

    // Update average risk
    const totalRisk = history.transactions.reduce((sum, tx) => sum + tx.riskScore, 0);
    history.averageRisk = totalRisk / history.transactionCount;

    // Keep only last 100 transactions to manage memory
    if (history.transactions.length > 100) {
      history.transactions = history.transactions.slice(-100);
    }
  }

  /**
   * Check specific anomaly pattern
   */
  private async checkAnomalyPattern(
    userHistory: UserBehaviorHistory,
    currentTransaction: CategorizedTransaction,
    pattern: AnomalyPattern
  ): Promise<AnomalyReport | null> {
    const now = getCurrentTimestamp();
    const windowStart = now - pattern.timeWindow;

    // Get transactions within the time window
    const recentTransactions = userHistory.transactions.filter(
      tx => tx.timestamp >= windowStart
    );

    switch (pattern.type) {
      case 'suspicious_volume':
        return this.checkSuspiciousVolume(userHistory, recentTransactions, pattern);
      
      case 'unusual_pattern':
        return this.checkUnusualPattern(userHistory, recentTransactions, pattern);
      
      case 'potential_fraud':
        return this.checkPotentialFraud(userHistory, recentTransactions, pattern);
      
      default:
        return null;
    }
  }

  /**
   * Check for suspicious volume anomaly
   */
  private checkSuspiciousVolume(
    userHistory: UserBehaviorHistory,
    recentTransactions: CategorizedTransaction[],
    pattern: AnomalyPattern
  ): AnomalyReport | null {
    if (recentTransactions.length === 0) {
      return null;
    }

    // Calculate recent volume
    const recentVolume = recentTransactions.reduce((sum, tx) => {
      return sum + (parseInt(tx.value, 16) / 1e18);
    }, 0);

    // Calculate normal volume (average over all history)
    const normalVolume = userHistory.totalVolume / userHistory.transactionCount;
    
    // Check if recent volume exceeds threshold
    if (recentVolume > normalVolume * pattern.threshold) {
      return {
        type: 'suspicious_volume',
        severity: this.calculateSeverity(recentVolume / normalVolume, pattern.threshold),
        description: `Volume ${Math.round(recentVolume / normalVolume)}x higher than normal`,
        affectedTransactions: recentTransactions.map(tx => tx.hash),
        timestamp: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Check for unusual pattern anomaly
   */
  private checkUnusualPattern(
    userHistory: UserBehaviorHistory,
    recentTransactions: CategorizedTransaction[],
    pattern: AnomalyPattern
  ): AnomalyReport | null {
    if (recentTransactions.length === 0) {
      return null;
    }

    // Calculate normal transaction frequency
    const totalTimeSpan = getCurrentTimestamp() - (userHistory.transactions[0]?.timestamp || getCurrentTimestamp());
    const normalFrequency = userHistory.transactionCount / (totalTimeSpan / (60 * 60 * 1000)); // per hour

    // Calculate recent frequency
    const recentFrequency = recentTransactions.length / (pattern.timeWindow / (60 * 60 * 1000));

    // Check if recent frequency exceeds threshold
    if (recentFrequency > normalFrequency * pattern.threshold) {
      return {
        type: 'unusual_pattern',
        severity: this.calculateSeverity(recentFrequency / normalFrequency, pattern.threshold),
        description: `Transaction frequency ${Math.round(recentFrequency / normalFrequency)}x higher than normal`,
        affectedTransactions: recentTransactions.map(tx => tx.hash),
        timestamp: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Check for potential fraud anomaly
   */
  private checkPotentialFraud(
    userHistory: UserBehaviorHistory,
    recentTransactions: CategorizedTransaction[],
    pattern: AnomalyPattern
  ): AnomalyReport | null {
    if (recentTransactions.length === 0) {
      return null;
    }

    // Count high-risk transactions
    const highRiskTransactions = recentTransactions.filter(tx => tx.riskScore >= pattern.threshold);
    
    // Check if there are multiple high-risk transactions
    if (highRiskTransactions.length >= 3) {
      const averageRisk = highRiskTransactions.reduce((sum, tx) => sum + tx.riskScore, 0) / highRiskTransactions.length;
      
      return {
        type: 'potential_fraud',
        severity: this.calculateSeverity(averageRisk, 0.7),
        description: `${highRiskTransactions.length} high-risk transactions detected in short timeframe`,
        affectedTransactions: highRiskTransactions.map(tx => tx.hash),
        timestamp: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Calculate anomaly severity based on threshold exceedance
   */
  private calculateSeverity(actualValue: number, threshold: number): AnomalyReport['severity'] {
    const ratio = actualValue / threshold;
    
    if (ratio >= 5) return 'critical';
    if (ratio >= 3) return 'high';
    if (ratio >= 2) return 'medium';
    return 'low';
  }

  /**
   * Log anomalies for manual review (Requirement 6.4)
   */
  private logAnomalies(anomalies: AnomalyReport[]): void {
    for (const anomaly of anomalies) {
      // Add to internal log
      this.anomalyLog.push(anomaly);
      
      // Log to console for immediate visibility
      console.warn(`ANOMALY DETECTED [${anomaly.severity.toUpperCase()}]: ${anomaly.description}`, {
        type: anomaly.type,
        affectedTransactions: anomaly.affectedTransactions.length,
        timestamp: new Date(anomaly.timestamp).toISOString()
      });
    }

    // Keep only last 1000 anomaly reports
    if (this.anomalyLog.length > 1000) {
      this.anomalyLog = this.anomalyLog.slice(-1000);
    }
  }

  /**
   * Get total anomalies detected (for metrics)
   */
  public getTotalAnomaliesDetected(): number {
    return this.totalAnomaliesDetected;
  }

  /**
   * Get recent anomaly reports
   */
  public getRecentAnomalies(timeWindow: number = 24 * 60 * 60 * 1000): AnomalyReport[] {
    const cutoff = getCurrentTimestamp() - timeWindow;
    return this.anomalyLog.filter(anomaly => anomaly.timestamp >= cutoff);
  }

  /**
   * Get anomaly statistics
   */
  public getAnomalyStatistics(): {
    totalDetected: number;
    byType: Record<AnomalyReport['type'], number>;
    bySeverity: Record<AnomalyReport['severity'], number>;
    recentCount: number;
  } {
    const byType: Record<AnomalyReport['type'], number> = {
      suspicious_volume: 0,
      unusual_pattern: 0,
      potential_fraud: 0
    };

    const bySeverity: Record<AnomalyReport['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    for (const anomaly of this.anomalyLog) {
      byType[anomaly.type]++;
      bySeverity[anomaly.severity]++;
    }

    return {
      totalDetected: this.totalAnomaliesDetected,
      byType,
      bySeverity,
      recentCount: this.getRecentAnomalies().length
    };
  }

  /**
   * Clear user history (for testing or privacy)
   */
  public clearUserHistory(userAddress: string): boolean {
    return this.userHistory.delete(userAddress);
  }

  /**
   * Get user behavior summary
   */
  public getUserBehaviorSummary(userAddress: string): UserBehaviorHistory | null {
    return this.userHistory.get(userAddress) || null;
  }
}