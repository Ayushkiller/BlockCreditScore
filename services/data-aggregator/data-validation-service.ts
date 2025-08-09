// Data Validation and Anomaly Detection Service
// Implements comprehensive validation and anomaly detection for transaction data

import { MonitoredTransaction } from './ethereum-monitor';
import { CategorizedTransaction } from './transaction-categorizer';
import { isValidAddress, isValidTxHash, isValidTimestamp, validateTransaction } from '../../utils/validation';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface ValidationConfig {
  maxTransactionAge: number; // milliseconds
  minTransactionValue: number; // USD
  maxTransactionValue: number; // USD
  maxDailyTransactions: number;
  maxHourlyTransactions: number;
  anomalyThreshold: number; // 0-1 scale
  enableAnomalyDetection: boolean;
  enableDataValidation: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  anomalyScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyPattern {
  type: 'volume_spike' | 'frequency_spike' | 'value_anomaly' | 'protocol_deviation' | 'time_pattern' | 'gas_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number; // 0-100
  affectedTransactions: string[];
  detectedAt: number;
}

export interface UserTransactionHistory {
  address: string;
  transactions: CategorizedTransaction[];
  dailyVolume: Map<string, number>; // date -> USD volume
  hourlyCount: Map<string, number>; // hour -> transaction count
  protocolUsage: Map<string, number>; // protocol -> usage count
  averageGasPrice: number;
  lastUpdated: number;
}

export class DataValidationService {
  private config: ValidationConfig;
  private userHistories: Map<string, UserTransactionHistory> = new Map();
  private anomalyPatterns: AnomalyPattern[] = [];
  private validationMetrics: {
    totalValidated: number;
    totalRejected: number;
    anomaliesDetected: number;
    lastReset: number;
  } = {
    totalValidated: 0,
    totalRejected: 0,
    anomaliesDetected: 0,
    lastReset: getCurrentTimestamp()
  };

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  /**
   * Validate a single transaction with comprehensive checks
   */
  public async validateTransaction(transaction: MonitoredTransaction): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      anomalyScore: 0,
      riskLevel: 'low'
    };

    try {
      // Basic data validation
      if (this.config.enableDataValidation) {
        this.performBasicValidation(transaction, result);
      }

      // Business logic validation
      this.performBusinessValidation(transaction, result);

      // Anomaly detection
      if (this.config.enableAnomalyDetection) {
        await this.performAnomalyDetection(transaction, result);
      }

      // Determine overall risk level
      result.riskLevel = this.calculateRiskLevel(result);

      // Update metrics
      if (result.isValid) {
        this.validationMetrics.totalValidated++;
      } else {
        this.validationMetrics.totalRejected++;
      }

      if (result.anomalyScore > this.config.anomalyThreshold) {
        this.validationMetrics.anomaliesDetected++;
      }

      return result;
    } catch (error) {
      console.error('Error during transaction validation:', formatError(error));
      result.isValid = false;
      result.errors.push(`Validation error: ${formatError(error)}`);
      result.riskLevel = 'critical';
      return result;
    }
  }

  /**
   * Batch validate multiple transactions
   */
  public async batchValidateTransactions(
    transactions: MonitoredTransaction[]
  ): Promise<ValidationResult[]> {
    const results = await Promise.allSettled(
      transactions.map(tx => this.validateTransaction(tx))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Validation failed for transaction ${index}:`, result.reason);
        return {
          isValid: false,
          errors: [`Validation failed: ${result.reason}`],
          warnings: [],
          anomalyScore: 1.0,
          riskLevel: 'critical' as const
        };
      }
    });
  }

  /**
   * Update user transaction history for anomaly detection
   */
  public updateUserHistory(transaction: CategorizedTransaction): void {
    const userAddress = transaction.from.toLowerCase();
    
    let history = this.userHistories.get(userAddress);
    if (!history) {
      history = {
        address: userAddress,
        transactions: [],
        dailyVolume: new Map(),
        hourlyCount: new Map(),
        protocolUsage: new Map(),
        averageGasPrice: 0,
        lastUpdated: getCurrentTimestamp()
      };
      this.userHistories.set(userAddress, history);
    }

    // Add transaction to history
    history.transactions.push(transaction);
    
    // Keep only recent transactions (last 30 days)
    const thirtyDaysAgo = getCurrentTimestamp() - (30 * 24 * 60 * 60 * 1000);
    history.transactions = history.transactions.filter(tx => tx.timestamp > thirtyDaysAgo);

    // Update daily volume
    const date = new Date(transaction.timestamp).toISOString().split('T')[0];
    const currentVolume = history.dailyVolume.get(date) || 0;
    const txValueUSD = this.estimateTransactionValueUSD(transaction);
    history.dailyVolume.set(date, currentVolume + txValueUSD);

    // Update hourly count
    const hour = new Date(transaction.timestamp).toISOString().slice(0, 13);
    const currentCount = history.hourlyCount.get(hour) || 0;
    history.hourlyCount.set(hour, currentCount + 1);

    // Update protocol usage
    if (transaction.protocol) {
      const currentUsage = history.protocolUsage.get(transaction.protocol) || 0;
      history.protocolUsage.set(transaction.protocol, currentUsage + 1);
    }

    // Update average gas price (simplified calculation)
    const gasPrice = parseInt(transaction.value, 16) / 1e18; // Simplified
    history.averageGasPrice = (history.averageGasPrice + gasPrice) / 2;

    history.lastUpdated = getCurrentTimestamp();
  }

  /**
   * Perform basic data validation
   */
  private performBasicValidation(transaction: MonitoredTransaction, result: ValidationResult): void {
    // Use existing validation utility
    const basicValidation = validateTransaction({
      txHash: transaction.hash,
      chainId: 1, // Ethereum mainnet
      from: transaction.from,
      to: transaction.to,
      timestamp: transaction.timestamp,
      blockNumber: transaction.blockNumber,
      usdValue: this.estimateTransactionValueUSD(transaction)
    });

    if (!basicValidation.isValid) {
      result.isValid = false;
      result.errors.push(...basicValidation.errors);
    }

    // Additional validations
    if (!isValidTxHash(transaction.hash)) {
      result.isValid = false;
      result.errors.push('Invalid transaction hash format');
    }

    if (!isValidAddress(transaction.from)) {
      result.isValid = false;
      result.errors.push('Invalid from address');
    }

    if (transaction.to && !isValidAddress(transaction.to)) {
      result.isValid = false;
      result.errors.push('Invalid to address');
    }

    if (!isValidTimestamp(transaction.timestamp)) {
      result.isValid = false;
      result.errors.push('Invalid timestamp');
    }

    // Check transaction age
    const age = getCurrentTimestamp() - transaction.timestamp;
    if (age > this.config.maxTransactionAge) {
      result.warnings.push('Transaction is older than maximum allowed age');
    }
  }

  /**
   * Perform business logic validation
   */
  private performBusinessValidation(transaction: MonitoredTransaction, result: ValidationResult): void {
    const txValueUSD = this.estimateTransactionValueUSD(transaction);

    // Check transaction value bounds
    if (txValueUSD < this.config.minTransactionValue) {
      result.warnings.push(`Transaction value (${txValueUSD} USD) below minimum threshold`);
    }

    if (txValueUSD > this.config.maxTransactionValue) {
      result.warnings.push(`Transaction value (${txValueUSD} USD) above maximum threshold`);
      result.anomalyScore += 0.3;
    }

    // Check for zero-value transactions
    if (transaction.value === '0x0' && !transaction.input) {
      result.warnings.push('Zero-value transaction with no data');
    }

    // Validate protocol interaction
    if (transaction.protocol && !this.isKnownProtocol(transaction.protocol)) {
      result.warnings.push(`Unknown protocol: ${transaction.protocol}`);
      result.anomalyScore += 0.1;
    }
  }

  /**
   * Perform anomaly detection
   */
  private async performAnomalyDetection(
    transaction: MonitoredTransaction,
    result: ValidationResult
  ): Promise<void> {
    const userAddress = transaction.from.toLowerCase();
    const history = this.userHistories.get(userAddress);

    if (!history || history.transactions.length < 5) {
      // Not enough history for anomaly detection
      return;
    }

    let anomalyScore = 0;
    const detectedAnomalies: AnomalyPattern[] = [];

    // Volume spike detection
    const volumeAnomaly = this.detectVolumeAnomaly(transaction, history);
    if (volumeAnomaly) {
      detectedAnomalies.push(volumeAnomaly);
      anomalyScore += 0.4;
    }

    // Frequency spike detection
    const frequencyAnomaly = this.detectFrequencyAnomaly(transaction, history);
    if (frequencyAnomaly) {
      detectedAnomalies.push(frequencyAnomaly);
      anomalyScore += 0.3;
    }

    // Protocol deviation detection
    const protocolAnomaly = this.detectProtocolDeviation(transaction, history);
    if (protocolAnomaly) {
      detectedAnomalies.push(protocolAnomaly);
      anomalyScore += 0.2;
    }

    // Time pattern anomaly
    const timeAnomaly = this.detectTimePatternAnomaly(transaction, history);
    if (timeAnomaly) {
      detectedAnomalies.push(timeAnomaly);
      anomalyScore += 0.1;
    }

    // Gas price anomaly
    const gasAnomaly = this.detectGasAnomaly(transaction, history);
    if (gasAnomaly) {
      detectedAnomalies.push(gasAnomaly);
      anomalyScore += 0.1;
    }

    result.anomalyScore = Math.min(1.0, anomalyScore);

    // Add anomalies to global tracking
    this.anomalyPatterns.push(...detectedAnomalies);

    // Add warnings for detected anomalies
    detectedAnomalies.forEach(anomaly => {
      result.warnings.push(`${anomaly.type}: ${anomaly.description}`);
    });
  }

  /**
   * Detect volume anomalies
   */
  private detectVolumeAnomaly(
    transaction: MonitoredTransaction,
    history: UserTransactionHistory
  ): AnomalyPattern | null {
    const txValueUSD = this.estimateTransactionValueUSD(transaction);
    const recentTransactions = history.transactions.slice(-20); // Last 20 transactions
    
    if (recentTransactions.length < 5) return null;

    const values = recentTransactions.map(tx => this.estimateTransactionValueUSD(tx));
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length);

    // Check if current transaction is more than 3 standard deviations from average
    if (txValueUSD > average + (3 * stdDev) && txValueUSD > average * 5) {
      return {
        type: 'volume_spike',
        severity: txValueUSD > average * 10 ? 'critical' : 'high',
        description: `Transaction value (${txValueUSD} USD) is ${Math.round(txValueUSD / average)}x higher than average`,
        confidence: Math.min(95, 60 + (txValueUSD / average) * 5),
        affectedTransactions: [transaction.hash],
        detectedAt: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Detect frequency anomalies
   */
  private detectFrequencyAnomaly(
    transaction: MonitoredTransaction,
    history: UserTransactionHistory
  ): AnomalyPattern | null {
    const now = getCurrentTimestamp();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const hourlyTxs = history.transactions.filter(tx => tx.timestamp > oneHourAgo);
    const dailyTxs = history.transactions.filter(tx => tx.timestamp > oneDayAgo);

    if (hourlyTxs.length > this.config.maxHourlyTransactions) {
      return {
        type: 'frequency_spike',
        severity: hourlyTxs.length > this.config.maxHourlyTransactions * 2 ? 'critical' : 'high',
        description: `${hourlyTxs.length} transactions in the last hour (limit: ${this.config.maxHourlyTransactions})`,
        confidence: 85,
        affectedTransactions: hourlyTxs.map(tx => tx.hash),
        detectedAt: getCurrentTimestamp()
      };
    }

    if (dailyTxs.length > this.config.maxDailyTransactions) {
      return {
        type: 'frequency_spike',
        severity: dailyTxs.length > this.config.maxDailyTransactions * 2 ? 'high' : 'medium',
        description: `${dailyTxs.length} transactions in the last day (limit: ${this.config.maxDailyTransactions})`,
        confidence: 80,
        affectedTransactions: dailyTxs.map(tx => tx.hash),
        detectedAt: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Detect protocol usage deviations
   */
  private detectProtocolDeviation(
    transaction: MonitoredTransaction,
    history: UserTransactionHistory
  ): AnomalyPattern | null {
    if (!transaction.protocol) return null;

    const protocolUsage = Array.from(history.protocolUsage.entries());
    const totalUsage = protocolUsage.reduce((sum, [, count]) => sum + count, 0);
    
    if (totalUsage < 10) return null; // Not enough data

    const currentProtocolUsage = history.protocolUsage.get(transaction.protocol) || 0;
    const usagePercentage = currentProtocolUsage / totalUsage;

    // Check if this is a completely new protocol for the user
    if (currentProtocolUsage === 0 && totalUsage > 20) {
      return {
        type: 'protocol_deviation',
        severity: 'medium',
        description: `First time using protocol: ${transaction.protocol}`,
        confidence: 70,
        affectedTransactions: [transaction.hash],
        detectedAt: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Detect time pattern anomalies
   */
  private detectTimePatternAnomaly(
    transaction: MonitoredTransaction,
    history: UserTransactionHistory
  ): AnomalyPattern | null {
    const txHour = new Date(transaction.timestamp).getHours();
    const recentTxs = history.transactions.slice(-50);
    
    if (recentTxs.length < 20) return null;

    const hourCounts = new Array(24).fill(0);
    recentTxs.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour]++;
    });

    const averageHourlyActivity = hourCounts.reduce((sum, count) => sum + count, 0) / 24;
    const currentHourActivity = hourCounts[txHour];

    // Check if transaction occurs during unusually inactive hours
    if (currentHourActivity === 0 && averageHourlyActivity > 1) {
      return {
        type: 'time_pattern',
        severity: 'low',
        description: `Transaction at unusual hour: ${txHour}:00`,
        confidence: 60,
        affectedTransactions: [transaction.hash],
        detectedAt: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Detect gas price anomalies
   */
  private detectGasAnomaly(
    transaction: MonitoredTransaction,
    history: UserTransactionHistory
  ): AnomalyPattern | null {
    // Simplified gas analysis - in practice, would need actual gas price data
    const estimatedGasPrice = parseInt(transaction.value, 16) / 1e18;
    
    if (estimatedGasPrice > history.averageGasPrice * 5) {
      return {
        type: 'gas_anomaly',
        severity: 'low',
        description: `Unusually high gas price: ${estimatedGasPrice.toFixed(4)} ETH`,
        confidence: 50,
        affectedTransactions: [transaction.hash],
        detectedAt: getCurrentTimestamp()
      };
    }

    return null;
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(result: ValidationResult): 'low' | 'medium' | 'high' | 'critical' {
    if (!result.isValid || result.errors.length > 0) {
      return 'critical';
    }

    if (result.anomalyScore > 0.7) {
      return 'high';
    }

    if (result.anomalyScore > 0.4 || result.warnings.length > 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Estimate transaction value in USD (simplified)
   */
  private estimateTransactionValueUSD(transaction: MonitoredTransaction): number {
    // Simplified estimation - in practice, would use price feed service
    const ethValue = parseInt(transaction.value, 16) / 1e18;
    const ethPriceUSD = 2000; // Placeholder - should use actual price feed
    return ethValue * ethPriceUSD;
  }

  /**
   * Check if protocol is known/trusted
   */
  private isKnownProtocol(protocol: string): boolean {
    const knownProtocols = [
      'uniswap v2', 'uniswap v3', 'aave v2', 'aave v3',
      'compound v2', 'makerdao', 'makerdao governance'
    ];
    return knownProtocols.includes(protocol.toLowerCase());
  }

  /**
   * Get validation metrics
   */
  public getValidationMetrics(): typeof this.validationMetrics {
    return { ...this.validationMetrics };
  }

  /**
   * Get recent anomaly patterns
   */
  public getRecentAnomalies(hours: number = 24): AnomalyPattern[] {
    const cutoff = getCurrentTimestamp() - (hours * 60 * 60 * 1000);
    return this.anomalyPatterns.filter(anomaly => anomaly.detectedAt > cutoff);
  }

  /**
   * Clear old data to manage memory
   */
  public cleanupOldData(): void {
    const thirtyDaysAgo = getCurrentTimestamp() - (30 * 24 * 60 * 60 * 1000);
    
    // Clean up user histories
    for (const [address, history] of this.userHistories.entries()) {
      history.transactions = history.transactions.filter(tx => tx.timestamp > thirtyDaysAgo);
      
      if (history.transactions.length === 0) {
        this.userHistories.delete(address);
      }
    }

    // Clean up anomaly patterns
    this.anomalyPatterns = this.anomalyPatterns.filter(anomaly => anomaly.detectedAt > thirtyDaysAgo);

    console.log(`Cleaned up old data. Active users: ${this.userHistories.size}, Recent anomalies: ${this.anomalyPatterns.length}`);
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    isEnabled: boolean;
    trackedUsers: number;
    recentAnomalies: number;
    validationMetrics: typeof this.validationMetrics;
  } {
    return {
      isEnabled: this.config.enableDataValidation || this.config.enableAnomalyDetection,
      trackedUsers: this.userHistories.size,
      recentAnomalies: this.getRecentAnomalies().length,
      validationMetrics: this.getValidationMetrics()
    };
  }
}

// Export configuration factory
export function createValidationConfig(): ValidationConfig {
  return {
    maxTransactionAge: 24 * 60 * 60 * 1000, // 24 hours
    minTransactionValue: 0.001, // $0.001 USD
    maxTransactionValue: 1000000, // $1M USD
    maxDailyTransactions: 100,
    maxHourlyTransactions: 20,
    anomalyThreshold: 0.5, // 50% anomaly score threshold
    enableAnomalyDetection: true,
    enableDataValidation: true
  };
}