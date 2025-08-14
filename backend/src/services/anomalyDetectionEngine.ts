import { TransactionData, UserMetrics } from './blockchainService';
import { TransactionAnalysisEngine, TemporalPatternAnalysis } from './transactionAnalysisEngine';

/**
 * Comprehensive Anomaly Detection and Fraud Identification System
 * Implements advanced statistical analysis and pattern recognition for suspicious activity detection
 * Requirements: 2.1, 2.2, 2.4
 */

export interface AnomalyDetectionResult {
  address: string;
  timestamp: number;
  overallAnomalyScore: number; // 0-100
  confidence: number; // 0-100
  
  // Detection results
  statisticalAnomalies: StatisticalAnomaly[];
  washTradingDetection: WashTradingResult;
  botBehaviorDetection: BotBehaviorResult;
  coordinatedActivityDetection: CoordinatedActivityResult;
  
  // Summary flags
  flags: {
    hasStatisticalAnomalies: boolean;
    hasWashTrading: boolean;
    hasBotBehavior: boolean;
    hasCoordinatedActivity: boolean;
    requiresInvestigation: boolean;
  };
  
  // Detailed explanations
  riskExplanation: string;
  recommendations: string[];
}

export interface StatisticalAnomaly {
  type: 'AMOUNT' | 'GAS_PRICE' | 'TIMING' | 'FREQUENCY' | 'PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  confidence: number; // 0-100
  
  description: string;
  statisticalMethod: 'Z_SCORE' | 'IQR' | 'ISOLATION_FOREST' | 'CLUSTERING';
  threshold: number;
  actualValue: number;
  expectedRange: { min: number; max: number };
  
  affectedTransactions: string[]; // Transaction hashes
  evidence: string[];
}

export interface WashTradingResult {
  detected: boolean;
  confidence: number; // 0-100
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  patterns: WashTradingPattern[];
  suspiciousTransactionPairs: TransactionPair[];
  circularTransactionChains: TransactionChain[];
  
  riskScore: number; // 0-100
  explanation: string;
  evidence: string[];
}

export interface WashTradingPattern {
  patternType: 'RAPID_REVERSAL' | 'CIRCULAR_FLOW' | 'AMOUNT_MATCHING' | 'TIMING_COORDINATION';
  transactions: string[]; // Transaction hashes
  confidence: number;
  description: string;
  timeWindow: number; // Seconds
  amountSimilarity: number; // 0-1
}

export interface TransactionPair {
  transaction1: string;
  transaction2: string;
  timeDifference: number; // Seconds
  amountSimilarity: number; // 0-1
  suspicionScore: number; // 0-100
  evidence: string[];
}

export interface TransactionChain {
  transactions: string[];
  chainLength: number;
  totalAmount: number;
  timeSpan: number; // Seconds
  circularityScore: number; // 0-100
  suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BotBehaviorResult {
  detected: boolean;
  confidence: number; // 0-100
  botProbability: number; // 0-100
  
  behaviorPatterns: BotBehaviorPattern[];
  timingAnalysis: BotTimingAnalysis;
  parameterConsistency: ParameterConsistency;
  
  riskScore: number; // 0-100
  explanation: string;
  evidence: string[];
}

export interface BotBehaviorPattern {
  patternType: 'REGULAR_INTERVALS' | 'IDENTICAL_PARAMETERS' | 'BURST_ACTIVITY' | 'MECHANICAL_PRECISION';
  strength: number; // 0-100
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  affectedTransactions: string[];
}

export interface BotTimingAnalysis {
  intervalConsistency: number; // 0-100 (higher = more consistent = more bot-like)
  averageInterval: number; // Seconds
  intervalVariance: number;
  coefficientOfVariation: number;
  
  burstPatterns: BurstPattern[];
  regularityScore: number; // 0-100
  humanLikeScore: number; // 0-100 (higher = more human-like)
}

export interface BurstPattern {
  startTime: number;
  endTime: number;
  transactionCount: number;
  averageInterval: number;
  burstIntensity: number; // Transactions per minute
  suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ParameterConsistency {
  gasPriceConsistency: number; // 0-100
  gasLimitConsistency: number; // 0-100
  amountPatternConsistency: number; // 0-100
  
  identicalParameterGroups: ParameterGroup[];
  overallConsistencyScore: number; // 0-100
}

export interface ParameterGroup {
  parameterType: 'GAS_PRICE' | 'GAS_LIMIT' | 'AMOUNT';
  value: string;
  transactionCount: number;
  percentage: number; // Percentage of total transactions
  suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CoordinatedActivityResult {
  detected: boolean;
  confidence: number; // 0-100
  coordinationScore: number; // 0-100
  
  coordinationPatterns: CoordinationPattern[];
  synchronizedTransactions: SynchronizedTransaction[];
  parameterMatching: ParameterMatching;
  
  riskScore: number; // 0-100
  explanation: string;
  evidence: string[];
}

export interface CoordinationPattern {
  patternType: 'SYNCHRONIZED_TIMING' | 'IDENTICAL_PARAMETERS' | 'COORDINATED_AMOUNTS' | 'NETWORK_EFFECTS';
  strength: number; // 0-100
  confidence: number; // 0-100
  description: string;
  evidence: string[];
  
  // Note: In a real implementation, this would include cross-account data
  // For now, we analyze patterns within single account that suggest coordination
  indicativeTransactions: string[];
}

export interface SynchronizedTransaction {
  transactions: string[];
  timeWindow: number; // Seconds within which transactions occurred
  synchronizationScore: number; // 0-100
  suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ParameterMatching {
  gasPriceMatching: MatchingGroup[];
  gasLimitMatching: MatchingGroup[];
  amountMatching: MatchingGroup[];
  
  overallMatchingScore: number; // 0-100
}

export interface MatchingGroup {
  parameter: string;
  value: string;
  transactionCount: number;
  percentage: number;
  suspicionScore: number; // 0-100
}

/**
 * Advanced Anomaly Detection Engine
 * Implements sophisticated statistical analysis and pattern recognition
 */
export class AnomalyDetectionEngine {
  
  // Statistical thresholds for anomaly detection
  private static readonly STATISTICAL_THRESHOLDS = {
    Z_SCORE: {
      MEDIUM: 2.0,    // 2 standard deviations
      HIGH: 2.5,      // 2.5 standard deviations  
      CRITICAL: 3.0   // 3 standard deviations
    },
    IQR: {
      OUTLIER_MULTIPLIER: 1.5,  // Standard IQR outlier detection
      EXTREME_MULTIPLIER: 3.0   // Extreme outlier detection
    },
    WASH_TRADING: {
      TIME_WINDOW: 3600,        // 1 hour window for wash trading detection
      AMOUNT_SIMILARITY: 0.95,  // 95% amount similarity threshold
      MIN_REVERSAL_COUNT: 2     // Minimum reversals to flag as wash trading
    },
    BOT_BEHAVIOR: {
      TIMING_CONSISTENCY: 0.1,  // CV threshold for bot-like timing
      PARAMETER_CONSISTENCY: 0.7, // Threshold for identical parameters
      BURST_THRESHOLD: 5        // Transactions per 10 minutes for burst detection
    },
    COORDINATION: {
      SYNC_WINDOW: 300,         // 5 minute window for synchronized transactions
      PARAMETER_MATCH: 0.8      // Threshold for parameter matching
    }
  };

  /**
   * Perform comprehensive anomaly detection analysis
   * Requirement 2.1: Statistical anomaly detection for unusual transaction patterns
   */
  public static async detectAnomalies(
    address: string,
    metrics: UserMetrics,
    transactionHistory: TransactionData[]
  ): Promise<AnomalyDetectionResult> {
    
    if (!transactionHistory || transactionHistory.length < 3) {
      return this.createEmptyResult(address, 'Insufficient transaction history for anomaly detection');
    }

    // Perform individual detection analyses
    const statisticalAnomalies = await this.detectStatisticalAnomalies(transactionHistory);
    const washTradingDetection = await this.detectWashTrading(transactionHistory);
    const botBehaviorDetection = await this.detectBotBehavior(transactionHistory);
    const coordinatedActivityDetection = await this.detectCoordinatedActivity(transactionHistory);

    // Calculate overall anomaly score
    const overallAnomalyScore = this.calculateOverallAnomalyScore({
      statisticalAnomalies,
      washTradingDetection,
      botBehaviorDetection,
      coordinatedActivityDetection
    });

    // Calculate confidence based on data quality and detection consistency
    const confidence = this.calculateDetectionConfidence(transactionHistory, {
      statisticalAnomalies,
      washTradingDetection,
      botBehaviorDetection,
      coordinatedActivityDetection
    });

    // Set flags
    const flags = {
      hasStatisticalAnomalies: statisticalAnomalies.length > 0,
      hasWashTrading: washTradingDetection.detected,
      hasBotBehavior: botBehaviorDetection.detected,
      hasCoordinatedActivity: coordinatedActivityDetection.detected,
      requiresInvestigation: overallAnomalyScore > 70
    };

    // Generate explanation and recommendations
    const riskExplanation = this.generateRiskExplanation({
      statisticalAnomalies,
      washTradingDetection,
      botBehaviorDetection,
      coordinatedActivityDetection,
      overallScore: overallAnomalyScore
    });

    const recommendations = this.generateRecommendations(flags, overallAnomalyScore);

    return {
      address,
      timestamp: Date.now(),
      overallAnomalyScore,
      confidence,
      statisticalAnomalies,
      washTradingDetection,
      botBehaviorDetection,
      coordinatedActivityDetection,
      flags,
      riskExplanation,
      recommendations
    };
  }

  /**
   * Detect statistical anomalies using multiple methods
   * Requirement 2.1: Statistical anomaly detection for unusual transaction patterns
   */
  private static async detectStatisticalAnomalies(
    transactions: TransactionData[]
  ): Promise<StatisticalAnomaly[]> {
    const anomalies: StatisticalAnomaly[] = [];

    // Analyze transaction amounts
    const amounts = transactions.map(tx => parseFloat(tx.value));
    anomalies.push(...this.detectAmountAnomalies(amounts, transactions));

    // Analyze gas prices
    const gasPrices = transactions.map(tx => parseFloat(tx.gasPrice));
    anomalies.push(...this.detectGasPriceAnomalies(gasPrices, transactions));

    // Analyze timing intervals
    const timingAnomalies = this.detectTimingAnomalies(transactions);
    anomalies.push(...timingAnomalies);

    // Analyze frequency patterns
    const frequencyAnomalies = this.detectFrequencyAnomalies(transactions);
    anomalies.push(...frequencyAnomalies);

    return anomalies.filter(anomaly => anomaly.confidence > 50); // Filter low-confidence anomalies
  }

  /**
   * Detect amount-based anomalies using Z-score and IQR methods
   */
  private static detectAmountAnomalies(
    amounts: number[],
    transactions: TransactionData[]
  ): StatisticalAnomaly[] {
    const anomalies: StatisticalAnomaly[] = [];

    if (amounts.length < 5) return anomalies;

    // Calculate statistical measures
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Z-score analysis
    amounts.forEach((amount, index) => {
      if (stdDev > 0) {
        const zScore = Math.abs(amount - mean) / stdDev;
        
        if (zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL) {
          anomalies.push({
            type: 'AMOUNT',
            severity: 'CRITICAL',
            score: Math.min(100, zScore * 20),
            confidence: 95,
            description: `Transaction amount ${amount.toFixed(4)} ETH is ${zScore.toFixed(2)} standard deviations from mean`,
            statisticalMethod: 'Z_SCORE',
            threshold: this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL,
            actualValue: amount,
            expectedRange: { 
              min: mean - (this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL * stdDev), 
              max: mean + (this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL * stdDev) 
            },
            affectedTransactions: [transactions[index].hash],
            evidence: [
              `Z-score: ${zScore.toFixed(2)}`,
              `Mean amount: ${mean.toFixed(4)} ETH`,
              `Standard deviation: ${stdDev.toFixed(4)} ETH`
            ]
          });
        } else if (zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH) {
          anomalies.push({
            type: 'AMOUNT',
            severity: 'HIGH',
            score: Math.min(100, zScore * 15),
            confidence: 85,
            description: `Transaction amount ${amount.toFixed(4)} ETH significantly deviates from normal pattern`,
            statisticalMethod: 'Z_SCORE',
            threshold: this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH,
            actualValue: amount,
            expectedRange: { 
              min: mean - (this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH * stdDev), 
              max: mean + (this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH * stdDev) 
            },
            affectedTransactions: [transactions[index].hash],
            evidence: [
              `Z-score: ${zScore.toFixed(2)}`,
              `Deviation from normal range`
            ]
          });
        }
      }
    });

    // IQR analysis for additional outlier detection
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedAmounts.length * 0.25);
    const q3Index = Math.floor(sortedAmounts.length * 0.75);
    const q1 = sortedAmounts[q1Index];
    const q3 = sortedAmounts[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - (this.STATISTICAL_THRESHOLDS.IQR.EXTREME_MULTIPLIER * iqr);
    const upperBound = q3 + (this.STATISTICAL_THRESHOLDS.IQR.EXTREME_MULTIPLIER * iqr);

    amounts.forEach((amount, index) => {
      if (amount < lowerBound || amount > upperBound) {
        // Check if we already detected this with Z-score to avoid duplicates
        const alreadyDetected = anomalies.some(a => 
          a.affectedTransactions.includes(transactions[index].hash) && a.type === 'AMOUNT'
        );
        
        if (!alreadyDetected) {
          anomalies.push({
            type: 'AMOUNT',
            severity: 'HIGH',
            score: 75,
            confidence: 80,
            description: `Transaction amount ${amount.toFixed(4)} ETH is an extreme outlier (IQR method)`,
            statisticalMethod: 'IQR',
            threshold: this.STATISTICAL_THRESHOLDS.IQR.EXTREME_MULTIPLIER,
            actualValue: amount,
            expectedRange: { min: lowerBound, max: upperBound },
            affectedTransactions: [transactions[index].hash],
            evidence: [
              `Amount outside IQR bounds`,
              `Q1: ${q1.toFixed(4)}, Q3: ${q3.toFixed(4)}, IQR: ${iqr.toFixed(4)}`
            ]
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect gas price anomalies
   */
  private static detectGasPriceAnomalies(
    gasPrices: number[],
    transactions: TransactionData[]
  ): StatisticalAnomaly[] {
    const anomalies: StatisticalAnomaly[] = [];

    if (gasPrices.length < 5) return anomalies;

    const mean = gasPrices.reduce((sum, val) => sum + val, 0) / gasPrices.length;
    const variance = gasPrices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gasPrices.length;
    const stdDev = Math.sqrt(variance);

    gasPrices.forEach((gasPrice, index) => {
      if (stdDev > 0) {
        const zScore = Math.abs(gasPrice - mean) / stdDev;
        
        if (zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH) {
          anomalies.push({
            type: 'GAS_PRICE',
            severity: zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL ? 'CRITICAL' : 'HIGH',
            score: Math.min(100, zScore * 15),
            confidence: 80,
            description: `Gas price ${gasPrice.toFixed(2)} Gwei deviates significantly from user's normal pattern`,
            statisticalMethod: 'Z_SCORE',
            threshold: this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH,
            actualValue: gasPrice,
            expectedRange: { 
              min: mean - (2 * stdDev), 
              max: mean + (2 * stdDev) 
            },
            affectedTransactions: [transactions[index].hash],
            evidence: [
              `Z-score: ${zScore.toFixed(2)}`,
              `User's average gas price: ${mean.toFixed(2)} Gwei`
            ]
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect timing anomalies in transaction patterns
   */
  private static detectTimingAnomalies(transactions: TransactionData[]): StatisticalAnomaly[] {
    const anomalies: StatisticalAnomaly[] = [];

    if (transactions.length < 3) return anomalies;

    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    const intervals = [];

    // Calculate intervals between consecutive transactions
    for (let i = 1; i < sortedTxs.length; i++) {
      intervals.push(sortedTxs[i].timestamp - sortedTxs[i-1].timestamp);
    }

    if (intervals.length < 2) return anomalies;

    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Detect unusually short or long intervals
    intervals.forEach((interval, index) => {
      if (stdDev > 0) {
        const zScore = Math.abs(interval - mean) / stdDev;
        
        if (zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH) {
          const isShortInterval = interval < mean;
          anomalies.push({
            type: 'TIMING',
            severity: zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL ? 'CRITICAL' : 'HIGH',
            score: Math.min(100, zScore * 15),
            confidence: 75,
            description: `${isShortInterval ? 'Unusually short' : 'Unusually long'} interval between transactions: ${Math.round(interval / 60)} minutes`,
            statisticalMethod: 'Z_SCORE',
            threshold: this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH,
            actualValue: interval,
            expectedRange: { 
              min: mean - (2 * stdDev), 
              max: mean + (2 * stdDev) 
            },
            affectedTransactions: [sortedTxs[index].hash, sortedTxs[index + 1].hash],
            evidence: [
              `Interval Z-score: ${zScore.toFixed(2)}`,
              `Average interval: ${Math.round(mean / 60)} minutes`
            ]
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect frequency pattern anomalies
   */
  private static detectFrequencyAnomalies(transactions: TransactionData[]): StatisticalAnomaly[] {
    const anomalies: StatisticalAnomaly[] = [];

    if (transactions.length < 10) return anomalies;

    // Analyze daily transaction frequency
    const dailyFrequency = new Map<string, number>();
    
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp * 1000).toDateString();
      dailyFrequency.set(date, (dailyFrequency.get(date) || 0) + 1);
    });

    const frequencies = Array.from(dailyFrequency.values());
    
    if (frequencies.length < 3) return anomalies;

    const mean = frequencies.reduce((sum, val) => sum + val, 0) / frequencies.length;
    const variance = frequencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / frequencies.length;
    const stdDev = Math.sqrt(variance);

    // Detect days with unusual activity
    Array.from(dailyFrequency.entries()).forEach(([date, frequency]) => {
      if (stdDev > 0) {
        const zScore = Math.abs(frequency - mean) / stdDev;
        
        if (zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH && frequency > mean) {
          const dayTransactions = transactions.filter(tx => 
            new Date(tx.timestamp * 1000).toDateString() === date
          );
          
          anomalies.push({
            type: 'FREQUENCY',
            severity: zScore >= this.STATISTICAL_THRESHOLDS.Z_SCORE.CRITICAL ? 'CRITICAL' : 'HIGH',
            score: Math.min(100, zScore * 20),
            confidence: 80,
            description: `Unusually high transaction frequency on ${date}: ${frequency} transactions`,
            statisticalMethod: 'Z_SCORE',
            threshold: this.STATISTICAL_THRESHOLDS.Z_SCORE.HIGH,
            actualValue: frequency,
            expectedRange: { 
              min: 0, 
              max: mean + (2 * stdDev) 
            },
            affectedTransactions: dayTransactions.map(tx => tx.hash),
            evidence: [
              `Daily frequency Z-score: ${zScore.toFixed(2)}`,
              `Average daily frequency: ${mean.toFixed(1)} transactions`
            ]
          });
        }
      }
    });

    return anomalies;
  }  /**

   * Detect wash trading patterns using transaction graph analysis
   * Requirement 2.2: Create wash trading detection algorithm using transaction graph analysis
   */
  private static async detectWashTrading(
    transactions: TransactionData[]
  ): Promise<WashTradingResult> {
    
    if (transactions.length < 4) {
      return {
        detected: false,
        confidence: 0,
        severity: 'LOW',
        patterns: [],
        suspiciousTransactionPairs: [],
        circularTransactionChains: [],
        riskScore: 0,
        explanation: 'Insufficient transaction history for wash trading analysis',
        evidence: []
      };
    }

    const patterns: WashTradingPattern[] = [];
    const suspiciousTransactionPairs: TransactionPair[] = [];
    const circularTransactionChains: TransactionChain[] = [];
    const evidence: string[] = [];

    // Sort transactions by timestamp for temporal analysis
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    // 1. Detect rapid reversal patterns
    const rapidReversalPatterns = this.detectRapidReversals(sortedTxs);
    patterns.push(...rapidReversalPatterns);

    // 2. Detect amount matching patterns
    const amountMatchingPatterns = this.detectAmountMatching(sortedTxs);
    patterns.push(...amountMatchingPatterns);
    
    // 3. Detect suspicious transaction pairs
    const txPairs = this.findSuspiciousTransactionPairs(sortedTxs);
    suspiciousTransactionPairs.push(...txPairs);

    // 4. Detect circular transaction chains
    const circularChains = this.detectCircularChains(sortedTxs);
    circularTransactionChains.push(...circularChains);

    // 5. Analyze timing coordination
    const timingPatterns = this.detectTimingCoordination(sortedTxs);
    patterns.push(...timingPatterns);

    // Calculate overall wash trading risk score
    const riskScore = this.calculateWashTradingRiskScore({
      patterns,
      suspiciousTransactionPairs,
      circularTransactionChains
    });

    // Determine if wash trading is detected
    const detected = riskScore > 60 || patterns.length > 2 || suspiciousTransactionPairs.length > 1;
    
    // Calculate confidence based on evidence strength
    const confidence = this.calculateWashTradingConfidence({
      patterns,
      suspiciousTransactionPairs,
      circularTransactionChains,
      transactionCount: transactions.length
    });

    // Determine severity
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore > 90) severity = 'CRITICAL';
    else if (riskScore > 75) severity = 'HIGH';
    else if (riskScore > 50) severity = 'MEDIUM';

    // Generate evidence
    if (patterns.length > 0) {
      evidence.push(`${patterns.length} suspicious trading patterns detected`);
    }
    if (suspiciousTransactionPairs.length > 0) {
      evidence.push(`${suspiciousTransactionPairs.length} suspicious transaction pairs identified`);
    }
    if (circularTransactionChains.length > 0) {
      evidence.push(`${circularTransactionChains.length} circular transaction chains found`);
    }

    const explanation = this.generateWashTradingExplanation({
      detected,
      riskScore,
      patterns,
      suspiciousTransactionPairs,
      circularTransactionChains
    });

    return {
      detected,
      confidence,
      severity,
      patterns,
      suspiciousTransactionPairs,
      circularTransactionChains,
      riskScore,
      explanation,
      evidence
    };
  }

  /**
   * Detect rapid reversal patterns (buy-sell-buy sequences)
   */
  private static detectRapidReversals(transactions: TransactionData[]): WashTradingPattern[] {
    const patterns: WashTradingPattern[] = [];
    
    for (let i = 0; i < transactions.length - 2; i++) {
      const tx1 = transactions[i];
      const tx2 = transactions[i + 1];
      const tx3 = transactions[i + 2];
      
      const amount1 = parseFloat(tx1.value);
      const amount2 = parseFloat(tx2.value);
      const amount3 = parseFloat(tx3.value);
      
      // Check for reversal pattern: similar amounts in opposite directions
      const similarity12 = this.calculateAmountSimilarity(amount1, amount2);
      const similarity13 = this.calculateAmountSimilarity(amount1, amount3);
      
      const timeWindow = tx3.timestamp - tx1.timestamp;
      
      if (similarity12 > 0.9 && similarity13 > 0.8 && 
          timeWindow < this.STATISTICAL_THRESHOLDS.WASH_TRADING.TIME_WINDOW) {
        
        patterns.push({
          patternType: 'RAPID_REVERSAL',
          transactions: [tx1.hash, tx2.hash, tx3.hash],
          confidence: Math.min(95, (similarity12 + similarity13) * 50),
          description: `Rapid reversal pattern: similar amounts traded back and forth within ${Math.round(timeWindow / 60)} minutes`,
          timeWindow,
          amountSimilarity: (similarity12 + similarity13) / 2
        });
      }
    }
    
    return patterns;
  }

  /**
   * Detect amount matching patterns across transactions
   */
  private static detectAmountMatching(transactions: TransactionData[]): WashTradingPattern[] {
    const patterns: WashTradingPattern[] = [];
    const amountGroups = new Map<string, TransactionData[]>();
    
    // Group transactions by similar amounts
    transactions.forEach(tx => {
      const amount = parseFloat(tx.value);
      const roundedAmount = Math.round(amount * 10000) / 10000; // Round to 4 decimal places
      const key = roundedAmount.toString();
      
      if (!amountGroups.has(key)) {
        amountGroups.set(key, []);
      }
      amountGroups.get(key)!.push(tx);
    });
    
    // Look for suspicious amount matching
    amountGroups.forEach((txGroup, amount) => {
      if (txGroup.length >= 3 && parseFloat(amount) > 0.01) { // At least 3 transactions with same amount > 0.01 ETH
        const timeSpan = Math.max(...txGroup.map(tx => tx.timestamp)) - Math.min(...txGroup.map(tx => tx.timestamp));
        
        if (timeSpan < this.STATISTICAL_THRESHOLDS.WASH_TRADING.TIME_WINDOW * 2) { // Within 2 hours
          patterns.push({
            patternType: 'AMOUNT_MATCHING',
            transactions: txGroup.map(tx => tx.hash),
            confidence: Math.min(90, txGroup.length * 20),
            description: `${txGroup.length} transactions with identical amount (${amount} ETH) within ${Math.round(timeSpan / 60)} minutes`,
            timeWindow: timeSpan,
            amountSimilarity: 1.0
          });
        }
      }
    });
    
    return patterns;
  }

  /**
   * Find suspicious transaction pairs
   */
  private static findSuspiciousTransactionPairs(transactions: TransactionData[]): TransactionPair[] {
    const pairs: TransactionPair[] = [];
    
    for (let i = 0; i < transactions.length - 1; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const tx1 = transactions[i];
        const tx2 = transactions[j];
        
        const timeDifference = Math.abs(tx2.timestamp - tx1.timestamp);
        const amount1 = parseFloat(tx1.value);
        const amount2 = parseFloat(tx2.value);
        
        if (timeDifference < this.STATISTICAL_THRESHOLDS.WASH_TRADING.TIME_WINDOW && 
            amount1 > 0.01 && amount2 > 0.01) {
          
          const amountSimilarity = this.calculateAmountSimilarity(amount1, amount2);
          
          if (amountSimilarity > this.STATISTICAL_THRESHOLDS.WASH_TRADING.AMOUNT_SIMILARITY) {
            const suspicionScore = this.calculatePairSuspicionScore(tx1, tx2, amountSimilarity, timeDifference);
            
            if (suspicionScore > 70) {
              pairs.push({
                transaction1: tx1.hash,
                transaction2: tx2.hash,
                timeDifference,
                amountSimilarity,
                suspicionScore,
                evidence: [
                  `Amount similarity: ${(amountSimilarity * 100).toFixed(1)}%`,
                  `Time difference: ${Math.round(timeDifference / 60)} minutes`,
                  `Amounts: ${amount1.toFixed(4)} ETH, ${amount2.toFixed(4)} ETH`
                ]
              });
            }
          }
        }
      }
    }
    
    return pairs.sort((a, b) => b.suspicionScore - a.suspicionScore).slice(0, 10); // Top 10 most suspicious pairs
  }

  /**
   * Detect circular transaction chains
   */
  private static detectCircularChains(transactions: TransactionData[]): TransactionChain[] {
    const chains: TransactionChain[] = [];
    
    // Look for sequences of transactions that could form circular patterns
    for (let startIdx = 0; startIdx < transactions.length - 2; startIdx++) {
      const chain = [transactions[startIdx]];
      let currentIdx = startIdx;
      
      // Try to build a chain of related transactions
      for (let i = startIdx + 1; i < transactions.length && chain.length < 6; i++) {
        const currentTx = transactions[currentIdx];
        const nextTx = transactions[i];
        
        const timeDiff = nextTx.timestamp - currentTx.timestamp;
        const amountSimilarity = this.calculateAmountSimilarity(
          parseFloat(currentTx.value), 
          parseFloat(nextTx.value)
        );
        
        if (timeDiff < this.STATISTICAL_THRESHOLDS.WASH_TRADING.TIME_WINDOW && 
            amountSimilarity > 0.7) {
          chain.push(nextTx);
          currentIdx = i;
        }
      }
      
      if (chain.length >= 3) {
        const totalAmount = chain.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
        const timeSpan = chain[chain.length - 1].timestamp - chain[0].timestamp;
        const circularityScore = this.calculateCircularityScore(chain);
        
        if (circularityScore > 60) {
          let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
          if (circularityScore > 90) suspicionLevel = 'CRITICAL';
          else if (circularityScore > 80) suspicionLevel = 'HIGH';
          else if (circularityScore > 70) suspicionLevel = 'MEDIUM';
          
          chains.push({
            transactions: chain.map(tx => tx.hash),
            chainLength: chain.length,
            totalAmount,
            timeSpan,
            circularityScore,
            suspicionLevel
          });
        }
      }
    }
    
    return chains.sort((a, b) => b.circularityScore - a.circularityScore).slice(0, 5); // Top 5 chains
  }

  /**
   * Detect timing coordination patterns
   */
  private static detectTimingCoordination(transactions: TransactionData[]): WashTradingPattern[] {
    const patterns: WashTradingPattern[] = [];
    
    // Look for clusters of transactions in short time windows
    const timeWindows = new Map<number, TransactionData[]>();
    
    transactions.forEach(tx => {
      const windowStart = Math.floor(tx.timestamp / 300) * 300; // 5-minute windows
      if (!timeWindows.has(windowStart)) {
        timeWindows.set(windowStart, []);
      }
      timeWindows.get(windowStart)!.push(tx);
    });
    
    timeWindows.forEach((txGroup, windowStart) => {
      if (txGroup.length >= 3) {
        // Check if transactions in this window show coordination signs
        const amounts = txGroup.map(tx => parseFloat(tx.value));
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const amountVariance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
        const coefficientOfVariation = avgAmount > 0 ? Math.sqrt(amountVariance) / avgAmount : 0;
        
        if (coefficientOfVariation < 0.2) { // Low variation suggests coordination
          patterns.push({
            patternType: 'TIMING_COORDINATION',
            transactions: txGroup.map(tx => tx.hash),
            confidence: Math.min(85, (1 - coefficientOfVariation) * 100),
            description: `${txGroup.length} transactions with coordinated timing and similar amounts in 5-minute window`,
            timeWindow: 300,
            amountSimilarity: 1 - coefficientOfVariation
          });
        }
      }
    });
    
    return patterns;
  }

  /**
   * Calculate amount similarity between two values
   */
  private static calculateAmountSimilarity(amount1: number, amount2: number): number {
    if (amount1 === 0 && amount2 === 0) return 1;
    if (amount1 === 0 || amount2 === 0) return 0;
    
    const ratio = Math.min(amount1, amount2) / Math.max(amount1, amount2);
    return ratio;
  }

  /**
   * Calculate suspicion score for a transaction pair
   */
  private static calculatePairSuspicionScore(
    tx1: TransactionData, 
    tx2: TransactionData, 
    amountSimilarity: number, 
    timeDifference: number
  ): number {
    let score = 0;
    
    // Amount similarity contributes up to 40 points
    score += amountSimilarity * 40;
    
    // Time proximity contributes up to 30 points (closer = higher score)
    const timeScore = Math.max(0, 30 - (timeDifference / 3600) * 30); // Decreases over 1 hour
    score += timeScore;
    
    // Gas price similarity contributes up to 20 points
    const gasPrice1 = parseFloat(tx1.gasPrice);
    const gasPrice2 = parseFloat(tx2.gasPrice);
    const gasSimilarity = this.calculateAmountSimilarity(gasPrice1, gasPrice2);
    score += gasSimilarity * 20;
    
    // Additional 10 points for other suspicious factors
    if (tx1.to === tx2.from || tx1.from === tx2.to) {
      score += 10; // Direct reversal
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate circularity score for a transaction chain
   */
  private static calculateCircularityScore(chain: TransactionData[]): number {
    let score = 0;
    
    // Base score for chain length
    score += Math.min(30, chain.length * 5);
    
    // Amount consistency score
    const amounts = chain.map(tx => parseFloat(tx.value));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const amountVariance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
    const coefficientOfVariation = avgAmount > 0 ? Math.sqrt(amountVariance) / avgAmount : 1;
    
    score += Math.max(0, 40 - (coefficientOfVariation * 40)); // Up to 40 points for amount consistency
    
    // Timing consistency score
    const intervals = [];
    for (let i = 1; i < chain.length; i++) {
      intervals.push(chain[i].timestamp - chain[i-1].timestamp);
    }
    
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const intervalCV = avgInterval > 0 ? Math.sqrt(intervalVariance) / avgInterval : 1;
      
      score += Math.max(0, 30 - (intervalCV * 30)); // Up to 30 points for timing consistency
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate overall wash trading risk score
   */
  private static calculateWashTradingRiskScore(data: {
    patterns: WashTradingPattern[];
    suspiciousTransactionPairs: TransactionPair[];
    circularTransactionChains: TransactionChain[];
  }): number {
    let score = 0;
    
    // Pattern-based scoring
    data.patterns.forEach(pattern => {
      const patternWeight = {
        'RAPID_REVERSAL': 25,
        'CIRCULAR_FLOW': 30,
        'AMOUNT_MATCHING': 20,
        'TIMING_COORDINATION': 15
      };
      
      score += (pattern.confidence / 100) * (patternWeight[pattern.patternType] || 10);
    });
    
    // Suspicious pairs scoring
    data.suspiciousTransactionPairs.forEach(pair => {
      score += (pair.suspicionScore / 100) * 15;
    });
    
    // Circular chains scoring
    data.circularTransactionChains.forEach(chain => {
      score += (chain.circularityScore / 100) * 20;
    });
    
    return Math.min(100, score);
  }

  /**
   * Calculate wash trading detection confidence
   */
  private static calculateWashTradingConfidence(data: {
    patterns: WashTradingPattern[];
    suspiciousTransactionPairs: TransactionPair[];
    circularTransactionChains: TransactionChain[];
    transactionCount: number;
  }): number {
    let confidence = 0;
    
    // Base confidence from transaction count
    confidence += Math.min(30, data.transactionCount * 2);
    
    // Pattern diversity increases confidence
    const patternTypes = new Set(data.patterns.map(p => p.patternType));
    confidence += patternTypes.size * 15;
    
    // Multiple evidence sources increase confidence
    if (data.patterns.length > 0) confidence += 20;
    if (data.suspiciousTransactionPairs.length > 0) confidence += 15;
    if (data.circularTransactionChains.length > 0) confidence += 20;
    
    return Math.min(100, confidence);
  }

  /**
   * Generate wash trading explanation
   */
  private static generateWashTradingExplanation(data: {
    detected: boolean;
    riskScore: number;
    patterns: WashTradingPattern[];
    suspiciousTransactionPairs: TransactionPair[];
    circularTransactionChains: TransactionChain[];
  }): string {
    if (!data.detected) {
      return 'No significant wash trading patterns detected in transaction history.';
    }
    
    let explanation = `Wash trading risk detected (Score: ${data.riskScore}/100). `;
    
    if (data.patterns.length > 0) {
      explanation += `Found ${data.patterns.length} suspicious trading patterns including `;
      const patternTypes = data.patterns.map(p => p.patternType.toLowerCase().replace('_', ' '));
      explanation += patternTypes.join(', ') + '. ';
    }
    
    if (data.suspiciousTransactionPairs.length > 0) {
      explanation += `Identified ${data.suspiciousTransactionPairs.length} suspicious transaction pairs with high amount similarity and coordinated timing. `;
    }
    
    if (data.circularTransactionChains.length > 0) {
      explanation += `Detected ${data.circularTransactionChains.length} potential circular transaction chains. `;
    }
    
    return explanation;
  }  /**
  
 * Detect bot behavior through timing and pattern analysis
   * Requirement 2.2: Build bot behavior identification through timing and pattern analysis
   */
  private static async detectBotBehavior(
    transactions: TransactionData[]
  ): Promise<BotBehaviorResult> {
    
    if (transactions.length < 5) {
      return {
        detected: false,
        confidence: 0,
        botProbability: 0,
        behaviorPatterns: [],
        timingAnalysis: this.createEmptyTimingAnalysis(),
        parameterConsistency: this.createEmptyParameterConsistency(),
        riskScore: 0,
        explanation: 'Insufficient transaction history for bot behavior analysis',
        evidence: []
      };
    }

    // Perform comprehensive bot behavior analysis
    const timingAnalysis = this.analyzeBotTiming(transactions);
    const parameterConsistency = this.analyzeParameterConsistency(transactions);
    const behaviorPatterns = this.detectBotBehaviorPatterns(transactions, timingAnalysis, parameterConsistency);

    // Calculate bot probability
    const botProbability = this.calculateBotProbability(timingAnalysis, parameterConsistency, behaviorPatterns);

    // Determine if bot behavior is detected
    const detected = botProbability > 70 || behaviorPatterns.some(p => p.strength > 80);

    // Calculate confidence
    const confidence = this.calculateBotDetectionConfidence(transactions.length, behaviorPatterns, timingAnalysis);

    // Calculate risk score
    const riskScore = this.calculateBotRiskScore(botProbability, behaviorPatterns);

    // Generate evidence
    const evidence = this.generateBotEvidence(behaviorPatterns, timingAnalysis, parameterConsistency);

    // Generate explanation
    const explanation = this.generateBotExplanation(detected, botProbability, behaviorPatterns);

    return {
      detected,
      confidence,
      botProbability,
      behaviorPatterns,
      timingAnalysis,
      parameterConsistency,
      riskScore,
      explanation,
      evidence
    };
  }

  /**
   * Analyze timing patterns for bot-like behavior
   */
  private static analyzeBotTiming(transactions: TransactionData[]): BotTimingAnalysis {
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate intervals between transactions
    const intervals = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      intervals.push(sortedTxs[i].timestamp - sortedTxs[i-1].timestamp);
    }

    if (intervals.length === 0) {
      return this.createEmptyTimingAnalysis();
    }

    // Calculate timing statistics
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length;
    const intervalVariance = variance;
    const coefficientOfVariation = averageInterval > 0 ? Math.sqrt(variance) / averageInterval : 0;

    // Calculate interval consistency (lower CV = more consistent = more bot-like)
    const intervalConsistency = Math.max(0, 100 - (coefficientOfVariation * 100));

    // Detect burst patterns
    const burstPatterns = this.detectBurstPatterns(sortedTxs);

    // Calculate regularity score (how regular the intervals are)
    const regularityScore = this.calculateRegularityScore(intervals);

    // Calculate human-like score (higher = more human-like)
    const humanLikeScore = this.calculateHumanLikeScore(intervals, burstPatterns);

    return {
      intervalConsistency,
      averageInterval,
      intervalVariance,
      coefficientOfVariation,
      burstPatterns,
      regularityScore,
      humanLikeScore
    };
  }

  /**
   * Detect burst patterns in transaction timing
   */
  private static detectBurstPatterns(transactions: TransactionData[]): BurstPattern[] {
    const patterns: BurstPattern[] = [];
    const burstThreshold = this.STATISTICAL_THRESHOLDS.BOT_BEHAVIOR.BURST_THRESHOLD; // 5 transactions per 10 minutes
    const windowSize = 600; // 10 minutes in seconds

    for (let i = 0; i < transactions.length; i++) {
      const windowStart = transactions[i].timestamp;
      const windowEnd = windowStart + windowSize;
      
      // Count transactions in this window
      const windowTransactions = transactions.filter(tx => 
        tx.timestamp >= windowStart && tx.timestamp <= windowEnd
      );

      if (windowTransactions.length >= burstThreshold) {
        // Calculate burst intensity
        const burstIntensity = (windowTransactions.length / windowSize) * 60; // Transactions per minute
        
        // Calculate average interval within burst
        const burstIntervals = [];
        for (let j = 1; j < windowTransactions.length; j++) {
          burstIntervals.push(windowTransactions[j].timestamp - windowTransactions[j-1].timestamp);
        }
        const averageInterval = burstIntervals.length > 0 
          ? burstIntervals.reduce((sum, interval) => sum + interval, 0) / burstIntervals.length 
          : 0;

        // Determine suspicion level
        let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (burstIntensity > 2) suspicionLevel = 'CRITICAL';
        else if (burstIntensity > 1) suspicionLevel = 'HIGH';
        else if (burstIntensity > 0.5) suspicionLevel = 'MEDIUM';

        patterns.push({
          startTime: windowStart,
          endTime: windowEnd,
          transactionCount: windowTransactions.length,
          averageInterval,
          burstIntensity,
          suspicionLevel
        });

        // Skip overlapping windows
        i += windowTransactions.length - 1;
      }
    }

    return patterns;
  }

  /**
   * Calculate regularity score for intervals
   */
  private static calculateRegularityScore(intervals: number[]): number {
    if (intervals.length < 2) return 0;

    // Check for perfectly regular intervals (strong bot indicator)
    const uniqueIntervals = new Set(intervals);
    if (uniqueIntervals.size === 1) return 100; // Perfect regularity

    // Check for patterns in intervals
    const intervalCounts = new Map<number, number>();
    intervals.forEach(interval => {
      const roundedInterval = Math.round(interval / 60) * 60; // Round to nearest minute
      intervalCounts.set(roundedInterval, (intervalCounts.get(roundedInterval) || 0) + 1);
    });

    // Find most common interval
    const maxCount = Math.max(...Array.from(intervalCounts.values()));
    const regularityRatio = maxCount / intervals.length;

    return regularityRatio * 100;
  }

  /**
   * Calculate human-like score
   */
  private static calculateHumanLikeScore(intervals: number[], burstPatterns: BurstPattern[]): number {
    let score = 100; // Start with maximum human-like score

    // Reduce score for high regularity
    const regularityScore = this.calculateRegularityScore(intervals);
    score -= regularityScore * 0.5;

    // Reduce score for low variation
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const coefficientOfVariation = avgInterval > 0 ? Math.sqrt(variance) / avgInterval : 0;
    
    if (coefficientOfVariation < 0.1) score -= 40; // Very low variation is bot-like
    else if (coefficientOfVariation < 0.3) score -= 20;

    // Reduce score for burst patterns
    burstPatterns.forEach(pattern => {
      if (pattern.suspicionLevel === 'CRITICAL') score -= 30;
      else if (pattern.suspicionLevel === 'HIGH') score -= 20;
      else if (pattern.suspicionLevel === 'MEDIUM') score -= 10;
    });

    // Increase score for natural variation patterns
    if (coefficientOfVariation > 1.0 && coefficientOfVariation < 3.0) {
      score += 10; // Natural human variation
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze parameter consistency for bot detection
   */
  private static analyzeParameterConsistency(transactions: TransactionData[]): ParameterConsistency {
    // Analyze gas price consistency
    const gasPrices = transactions.map(tx => parseFloat(tx.gasPrice));
    const gasPriceConsistency = this.calculateParameterConsistency(gasPrices);

    // Analyze gas limit consistency
    const gasLimits = transactions.map(tx => parseInt(tx.gasUsed || '0'));
    const gasLimitConsistency = this.calculateParameterConsistency(gasLimits);

    // Analyze amount pattern consistency
    const amounts = transactions.map(tx => parseFloat(tx.value));
    const amountPatternConsistency = this.calculateAmountPatternConsistency(amounts);

    // Find identical parameter groups
    const identicalParameterGroups = this.findIdenticalParameterGroups(transactions);

    // Calculate overall consistency score
    const overallConsistencyScore = (gasPriceConsistency + gasLimitConsistency + amountPatternConsistency) / 3;

    return {
      gasPriceConsistency,
      gasLimitConsistency,
      amountPatternConsistency,
      identicalParameterGroups,
      overallConsistencyScore
    };
  }

  /**
   * Calculate parameter consistency score
   */
  private static calculateParameterConsistency(values: number[]): number {
    if (values.length < 2) return 0;

    const uniqueValues = new Set(values);
    
    // If all values are identical, maximum consistency
    if (uniqueValues.size === 1) return 100;

    // Calculate coefficient of variation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

    // Lower CV = higher consistency
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  /**
   * Calculate amount pattern consistency
   */
  private static calculateAmountPatternConsistency(amounts: number[]): number {
    if (amounts.length < 3) return 0;

    // Look for repeating amount patterns
    const amountCounts = new Map<string, number>();
    amounts.forEach(amount => {
      const roundedAmount = Math.round(amount * 10000) / 10000; // Round to 4 decimal places
      const key = roundedAmount.toString();
      amountCounts.set(key, (amountCounts.get(key) || 0) + 1);
    });

    // Calculate pattern consistency
    const maxCount = Math.max(...Array.from(amountCounts.values()));
    const patternRatio = maxCount / amounts.length;

    // Check for arithmetic progressions or other patterns
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    let progressionScore = 0;
    
    if (sortedAmounts.length >= 3) {
      const differences = [];
      for (let i = 1; i < sortedAmounts.length; i++) {
        differences.push(sortedAmounts[i] - sortedAmounts[i-1]);
      }
      
      const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
      const diffVariance = differences.reduce((sum, diff) => sum + Math.pow(diff - avgDifference, 2), 0) / differences.length;
      const diffCV = avgDifference > 0 ? Math.sqrt(diffVariance) / avgDifference : 0;
      
      if (diffCV < 0.1) progressionScore = 50; // Arithmetic progression detected
    }

    return Math.max(patternRatio * 100, progressionScore);
  }

  /**
   * Find groups of transactions with identical parameters
   */
  private static findIdenticalParameterGroups(transactions: TransactionData[]): ParameterGroup[] {
    const groups: ParameterGroup[] = [];

    // Group by gas price
    const gasPriceGroups = new Map<string, number>();
    transactions.forEach(tx => {
      const gasPrice = tx.gasPrice;
      gasPriceGroups.set(gasPrice, (gasPriceGroups.get(gasPrice) || 0) + 1);
    });

    gasPriceGroups.forEach((count, gasPrice) => {
      if (count >= 3) { // At least 3 transactions with same gas price
        const percentage = (count / transactions.length) * 100;
        let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        
        if (percentage > 80) suspicionLevel = 'CRITICAL';
        else if (percentage > 60) suspicionLevel = 'HIGH';
        else if (percentage > 40) suspicionLevel = 'MEDIUM';

        groups.push({
          parameterType: 'GAS_PRICE',
          value: gasPrice,
          transactionCount: count,
          percentage,
          suspicionLevel
        });
      }
    });

    // Group by gas limit
    const gasLimitGroups = new Map<string, number>();
    transactions.forEach(tx => {
      const gasLimit = tx.gasUsed || '0';
      gasLimitGroups.set(gasLimit, (gasLimitGroups.get(gasLimit) || 0) + 1);
    });

    gasLimitGroups.forEach((count, gasLimit) => {
      if (count >= 3) {
        const percentage = (count / transactions.length) * 100;
        let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        
        if (percentage > 70) suspicionLevel = 'HIGH';
        else if (percentage > 50) suspicionLevel = 'MEDIUM';

        groups.push({
          parameterType: 'GAS_LIMIT',
          value: gasLimit,
          transactionCount: count,
          percentage,
          suspicionLevel
        });
      }
    });

    // Group by amount
    const amountGroups = new Map<string, number>();
    transactions.forEach(tx => {
      const amount = Math.round(parseFloat(tx.value) * 10000) / 10000; // Round to 4 decimal places
      const key = amount.toString();
      amountGroups.set(key, (amountGroups.get(key) || 0) + 1);
    });

    amountGroups.forEach((count, amount) => {
      if (count >= 3 && parseFloat(amount) > 0) {
        const percentage = (count / transactions.length) * 100;
        let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        
        if (percentage > 60) suspicionLevel = 'CRITICAL';
        else if (percentage > 40) suspicionLevel = 'HIGH';
        else if (percentage > 25) suspicionLevel = 'MEDIUM';

        groups.push({
          parameterType: 'AMOUNT',
          value: amount,
          transactionCount: count,
          percentage,
          suspicionLevel
        });
      }
    });

    return groups.sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Detect specific bot behavior patterns
   */
  private static detectBotBehaviorPatterns(
    transactions: TransactionData[],
    timingAnalysis: BotTimingAnalysis,
    parameterConsistency: ParameterConsistency
  ): BotBehaviorPattern[] {
    const patterns: BotBehaviorPattern[] = [];

    // Pattern 1: Regular intervals
    if (timingAnalysis.intervalConsistency > 80) {
      patterns.push({
        patternType: 'REGULAR_INTERVALS',
        strength: timingAnalysis.intervalConsistency,
        confidence: 90,
        description: `Highly regular transaction intervals (${Math.round(timingAnalysis.averageInterval / 60)} minutes average)`,
        evidence: [
          `Interval consistency: ${timingAnalysis.intervalConsistency.toFixed(1)}%`,
          `Coefficient of variation: ${timingAnalysis.coefficientOfVariation.toFixed(3)}`
        ],
        affectedTransactions: transactions.map(tx => tx.hash)
      });
    }

    // Pattern 2: Identical parameters
    if (parameterConsistency.overallConsistencyScore > 70) {
      patterns.push({
        patternType: 'IDENTICAL_PARAMETERS',
        strength: parameterConsistency.overallConsistencyScore,
        confidence: 85,
        description: 'High consistency in transaction parameters suggests automated behavior',
        evidence: [
          `Gas price consistency: ${parameterConsistency.gasPriceConsistency.toFixed(1)}%`,
          `Amount pattern consistency: ${parameterConsistency.amountPatternConsistency.toFixed(1)}%`,
          `${parameterConsistency.identicalParameterGroups.length} identical parameter groups found`
        ],
        affectedTransactions: transactions.map(tx => tx.hash)
      });
    }

    // Pattern 3: Burst activity
    if (timingAnalysis.burstPatterns.length > 0) {
      const highSuspicionBursts = timingAnalysis.burstPatterns.filter(
        p => p.suspicionLevel === 'HIGH' || p.suspicionLevel === 'CRITICAL'
      );
      
      if (highSuspicionBursts.length > 0) {
        const maxIntensity = Math.max(...highSuspicionBursts.map(p => p.burstIntensity));
        
        patterns.push({
          patternType: 'BURST_ACTIVITY',
          strength: Math.min(100, maxIntensity * 50),
          confidence: 80,
          description: `${highSuspicionBursts.length} burst patterns detected with high transaction intensity`,
          evidence: [
            `Maximum burst intensity: ${maxIntensity.toFixed(2)} transactions/minute`,
            `Total burst patterns: ${timingAnalysis.burstPatterns.length}`
          ],
          affectedTransactions: transactions.map(tx => tx.hash)
        });
      }
    }

    // Pattern 4: Mechanical precision
    if (timingAnalysis.regularityScore > 90 && parameterConsistency.overallConsistencyScore > 80) {
      patterns.push({
        patternType: 'MECHANICAL_PRECISION',
        strength: (timingAnalysis.regularityScore + parameterConsistency.overallConsistencyScore) / 2,
        confidence: 95,
        description: 'Mechanical precision in both timing and parameters indicates automated behavior',
        evidence: [
          `Timing regularity: ${timingAnalysis.regularityScore.toFixed(1)}%`,
          `Parameter consistency: ${parameterConsistency.overallConsistencyScore.toFixed(1)}%`,
          `Human-like score: ${timingAnalysis.humanLikeScore.toFixed(1)}%`
        ],
        affectedTransactions: transactions.map(tx => tx.hash)
      });
    }

    return patterns;
  }

  /**
   * Calculate bot probability
   */
  private static calculateBotProbability(
    timingAnalysis: BotTimingAnalysis,
    parameterConsistency: ParameterConsistency,
    behaviorPatterns: BotBehaviorPattern[]
  ): number {
    let probability = 0;

    // Timing-based probability (40% weight)
    const timingScore = (
      timingAnalysis.intervalConsistency * 0.4 +
      timingAnalysis.regularityScore * 0.3 +
      (100 - timingAnalysis.humanLikeScore) * 0.3
    );
    probability += timingScore * 0.4;

    // Parameter consistency probability (30% weight)
    probability += parameterConsistency.overallConsistencyScore * 0.3;

    // Pattern-based probability (30% weight)
    if (behaviorPatterns.length > 0) {
      const avgPatternStrength = behaviorPatterns.reduce((sum, p) => sum + p.strength, 0) / behaviorPatterns.length;
      probability += avgPatternStrength * 0.3;
    }

    return Math.min(100, probability);
  }

  /**
   * Calculate bot detection confidence
   */
  private static calculateBotDetectionConfidence(
    transactionCount: number,
    behaviorPatterns: BotBehaviorPattern[],
    timingAnalysis: BotTimingAnalysis
  ): number {
    let confidence = 0;

    // Base confidence from transaction count
    confidence += Math.min(40, transactionCount * 2);

    // Pattern diversity increases confidence
    confidence += behaviorPatterns.length * 15;

    // Strong patterns increase confidence
    const strongPatterns = behaviorPatterns.filter(p => p.strength > 80);
    confidence += strongPatterns.length * 10;

    // Timing analysis quality
    if (timingAnalysis.intervalConsistency > 0) confidence += 20;

    return Math.min(100, confidence);
  }

  /**
   * Calculate bot risk score
   */
  private static calculateBotRiskScore(
    botProbability: number,
    behaviorPatterns: BotBehaviorPattern[]
  ): number {
    let riskScore = botProbability * 0.7; // Base risk from bot probability

    // Add risk from specific patterns
    behaviorPatterns.forEach(pattern => {
      const patternRisk = {
        'REGULAR_INTERVALS': 15,
        'IDENTICAL_PARAMETERS': 20,
        'BURST_ACTIVITY': 25,
        'MECHANICAL_PRECISION': 30
      };
      
      riskScore += (pattern.strength / 100) * (patternRisk[pattern.patternType] || 10);
    });

    return Math.min(100, riskScore);
  }

  /**
   * Generate bot evidence
   */
  private static generateBotEvidence(
    behaviorPatterns: BotBehaviorPattern[],
    timingAnalysis: BotTimingAnalysis,
    parameterConsistency: ParameterConsistency
  ): string[] {
    const evidence: string[] = [];

    if (timingAnalysis.intervalConsistency > 70) {
      evidence.push(`High timing consistency: ${timingAnalysis.intervalConsistency.toFixed(1)}%`);
    }

    if (timingAnalysis.humanLikeScore < 30) {
      evidence.push(`Low human-like behavior score: ${timingAnalysis.humanLikeScore.toFixed(1)}%`);
    }

    if (parameterConsistency.overallConsistencyScore > 70) {
      evidence.push(`High parameter consistency: ${parameterConsistency.overallConsistencyScore.toFixed(1)}%`);
    }

    behaviorPatterns.forEach(pattern => {
      evidence.push(`${pattern.patternType.replace('_', ' ').toLowerCase()} pattern detected (${pattern.strength.toFixed(1)}% strength)`);
    });

    if (timingAnalysis.burstPatterns.length > 0) {
      evidence.push(`${timingAnalysis.burstPatterns.length} burst activity patterns detected`);
    }

    return evidence;
  }

  /**
   * Generate bot explanation
   */
  private static generateBotExplanation(
    detected: boolean,
    botProbability: number,
    behaviorPatterns: BotBehaviorPattern[]
  ): string {
    if (!detected) {
      return 'No significant bot behavior patterns detected. Transaction patterns appear consistent with human behavior.';
    }

    let explanation = `Bot behavior detected with ${botProbability.toFixed(1)}% probability. `;

    if (behaviorPatterns.length > 0) {
      explanation += `Analysis identified ${behaviorPatterns.length} suspicious patterns including `;
      const patternNames = behaviorPatterns.map(p => p.patternType.toLowerCase().replace('_', ' '));
      explanation += patternNames.join(', ') + '. ';
    }

    if (botProbability > 90) {
      explanation += 'Strong evidence suggests automated trading behavior.';
    } else if (botProbability > 80) {
      explanation += 'Multiple indicators suggest likely automated behavior.';
    } else {
      explanation += 'Some indicators suggest possible automated behavior.';
    }

    return explanation;
  }

  /**
   * Create empty timing analysis for insufficient data
   */
  private static createEmptyTimingAnalysis(): BotTimingAnalysis {
    return {
      intervalConsistency: 0,
      averageInterval: 0,
      intervalVariance: 0,
      coefficientOfVariation: 0,
      burstPatterns: [],
      regularityScore: 0,
      humanLikeScore: 100
    };
  }

  /**
   * Create empty parameter consistency for insufficient data
   */
  private static createEmptyParameterConsistency(): ParameterConsistency {
    return {
      gasPriceConsistency: 0,
      gasLimitConsistency: 0,
      amountPatternConsistency: 0,
      identicalParameterGroups: [],
      overallConsistencyScore: 0
    };
  }  /**

   * Detect coordinated activity for multi-account suspicious behavior
   * Requirement 2.2: Add coordinated activity detection for multi-account suspicious behavior
   */
  private static async detectCoordinatedActivity(
    transactions: TransactionData[]
  ): Promise<CoordinatedActivityResult> {
    
    if (transactions.length < 3) {
      return {
        detected: false,
        confidence: 0,
        coordinationScore: 0,
        coordinationPatterns: [],
        synchronizedTransactions: [],
        parameterMatching: this.createEmptyParameterMatching(),
        riskScore: 0,
        explanation: 'Insufficient transaction history for coordination analysis',
        evidence: []
      };
    }

    // Analyze coordination patterns within the account's transactions
    // Note: In a real implementation, this would analyze across multiple accounts
    // For now, we look for patterns that suggest coordination with external entities
    
    const coordinationPatterns = this.detectCoordinationPatterns(transactions);
    const synchronizedTransactions = this.detectSynchronizedTransactions(transactions);
    const parameterMatching = this.analyzeParameterMatching(transactions);

    // Calculate coordination score
    const coordinationScore = this.calculateCoordinationScore({
      coordinationPatterns,
      synchronizedTransactions,
      parameterMatching
    });

    // Determine if coordination is detected
    const detected = coordinationScore > 60 || coordinationPatterns.some(p => p.strength > 75);

    // Calculate confidence
    const confidence = this.calculateCoordinationConfidence(transactions.length, coordinationPatterns);

    // Calculate risk score
    const riskScore = this.calculateCoordinationRiskScore(coordinationScore, coordinationPatterns);

    // Generate evidence
    const evidence = this.generateCoordinationEvidence(coordinationPatterns, synchronizedTransactions, parameterMatching);

    // Generate explanation
    const explanation = this.generateCoordinationExplanation(detected, coordinationScore, coordinationPatterns);

    return {
      detected,
      confidence,
      coordinationScore,
      coordinationPatterns,
      synchronizedTransactions,
      parameterMatching,
      riskScore,
      explanation,
      evidence
    };
  }

  /**
   * Detect coordination patterns that suggest multi-account activity
   */
  private static detectCoordinationPatterns(transactions: TransactionData[]): CoordinationPattern[] {
    const patterns: CoordinationPattern[] = [];

    // Pattern 1: Synchronized timing (transactions at very similar times)
    const timingPattern = this.detectSynchronizedTiming(transactions);
    if (timingPattern) patterns.push(timingPattern);

    // Pattern 2: Identical parameters across transactions
    const parameterPattern = this.detectIdenticalParameterCoordination(transactions);
    if (parameterPattern) patterns.push(parameterPattern);

    // Pattern 3: Coordinated amounts (round numbers, similar amounts)
    const amountPattern = this.detectCoordinatedAmounts(transactions);
    if (amountPattern) patterns.push(amountPattern);

    // Pattern 4: Network effects (gas price coordination with network conditions)
    const networkPattern = this.detectNetworkEffects(transactions);
    if (networkPattern) patterns.push(networkPattern);

    return patterns;
  }

  /**
   * Detect synchronized timing patterns
   */
  private static detectSynchronizedTiming(transactions: TransactionData[]): CoordinationPattern | null {
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Look for clusters of transactions within short time windows
    const syncWindow = this.STATISTICAL_THRESHOLDS.COORDINATION.SYNC_WINDOW; // 5 minutes
    const clusters: TransactionData[][] = [];
    
    let currentCluster: TransactionData[] = [sortedTxs[0]];
    
    for (let i = 1; i < sortedTxs.length; i++) {
      const timeDiff = sortedTxs[i].timestamp - sortedTxs[i-1].timestamp;
      
      if (timeDiff <= syncWindow) {
        currentCluster.push(sortedTxs[i]);
      } else {
        if (currentCluster.length >= 3) {
          clusters.push([...currentCluster]);
        }
        currentCluster = [sortedTxs[i]];
      }
    }
    
    // Check final cluster
    if (currentCluster.length >= 3) {
      clusters.push(currentCluster);
    }

    if (clusters.length === 0) return null;

    // Calculate synchronization strength
    const totalSyncTransactions = clusters.reduce((sum, cluster) => sum + cluster.length, 0);
    const syncRatio = totalSyncTransactions / transactions.length;
    const strength = Math.min(100, syncRatio * 150); // Boost for high sync ratio

    if (strength < 30) return null;

    return {
      patternType: 'SYNCHRONIZED_TIMING',
      strength,
      confidence: Math.min(90, strength + 10),
      description: `${clusters.length} clusters of synchronized transactions detected`,
      evidence: [
        `${totalSyncTransactions} transactions in synchronized clusters`,
        `Synchronization ratio: ${(syncRatio * 100).toFixed(1)}%`,
        `Largest cluster: ${Math.max(...clusters.map(c => c.length))} transactions`
      ],
      indicativeTransactions: clusters.flat().map(tx => tx.hash)
    };
  }

  /**
   * Detect identical parameter coordination
   */
  private static detectIdenticalParameterCoordination(transactions: TransactionData[]): CoordinationPattern | null {
    // Analyze gas price coordination
    const gasPriceGroups = new Map<string, TransactionData[]>();
    transactions.forEach(tx => {
      const gasPrice = tx.gasPrice;
      if (!gasPriceGroups.has(gasPrice)) {
        gasPriceGroups.set(gasPrice, []);
      }
      gasPriceGroups.get(gasPrice)!.push(tx);
    });

    // Find the largest group with identical gas prices
    let maxGroupSize = 0;
    let maxGroup: TransactionData[] = [];
    
    gasPriceGroups.forEach(group => {
      if (group.length > maxGroupSize) {
        maxGroupSize = group.length;
        maxGroup = group;
      }
    });

    // Check if coordination is significant
    const coordinationRatio = maxGroupSize / transactions.length;
    const threshold = this.STATISTICAL_THRESHOLDS.COORDINATION.PARAMETER_MATCH;

    if (coordinationRatio < threshold || maxGroupSize < 3) return null;

    const strength = Math.min(100, coordinationRatio * 125);

    return {
      patternType: 'IDENTICAL_PARAMETERS',
      strength,
      confidence: 85,
      description: `${maxGroupSize} transactions with identical gas price suggesting coordination`,
      evidence: [
        `Gas price coordination: ${(coordinationRatio * 100).toFixed(1)}%`,
        `Identical gas price: ${maxGroup[0].gasPrice} Gwei`,
        `${gasPriceGroups.size} unique gas prices used`
      ],
      indicativeTransactions: maxGroup.map(tx => tx.hash)
    };
  }

  /**
   * Detect coordinated amounts
   */
  private static detectCoordinatedAmounts(transactions: TransactionData[]): CoordinationPattern | null {
    const amounts = transactions.map(tx => parseFloat(tx.value)).filter(amount => amount > 0);
    
    if (amounts.length < 3) return null;

    // Check for round number coordination
    const roundAmounts = amounts.filter(amount => {
      // Check if amount is a "round" number (ends in many zeros)
      const amountStr = amount.toFixed(6);
      return amountStr.endsWith('000000') || amountStr.endsWith('00000') || 
             amountStr.endsWith('0000') || amountStr.endsWith('000');
    });

    const roundRatio = roundAmounts.length / amounts.length;

    // Check for identical amounts
    const amountGroups = new Map<string, number>();
    amounts.forEach(amount => {
      const roundedAmount = Math.round(amount * 10000) / 10000;
      const key = roundedAmount.toString();
      amountGroups.set(key, (amountGroups.get(key) || 0) + 1);
    });

    const maxIdenticalCount = Math.max(...Array.from(amountGroups.values()));
    const identicalRatio = maxIdenticalCount / amounts.length;

    // Calculate coordination strength
    let strength = 0;
    const evidence: string[] = [];

    if (roundRatio > 0.5) {
      strength += roundRatio * 60;
      evidence.push(`${(roundRatio * 100).toFixed(1)}% of transactions use round amounts`);
    }

    if (identicalRatio > 0.3 && maxIdenticalCount >= 3) {
      strength += identicalRatio * 40;
      evidence.push(`${maxIdenticalCount} transactions with identical amounts`);
    }

    if (strength < 30) return null;

    return {
      patternType: 'COORDINATED_AMOUNTS',
      strength: Math.min(100, strength),
      confidence: 75,
      description: 'Coordinated transaction amounts suggest planned activity',
      evidence,
      indicativeTransactions: transactions.filter(tx => {
        const amount = parseFloat(tx.value);
        const roundedAmount = Math.round(amount * 10000) / 10000;
        return amountGroups.get(roundedAmount.toString()) === maxIdenticalCount;
      }).map(tx => tx.hash)
    };
  }

  /**
   * Detect network effects coordination
   */
  private static detectNetworkEffects(transactions: TransactionData[]): CoordinationPattern | null {
    if (transactions.length < 5) return null;

    // Analyze gas price patterns relative to transaction timing
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    // Look for coordinated gas price changes
    const gasPriceChanges = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      const prevGasPrice = parseFloat(sortedTxs[i-1].gasPrice);
      const currentGasPrice = parseFloat(sortedTxs[i].gasPrice);
      const change = (currentGasPrice - prevGasPrice) / prevGasPrice;
      gasPriceChanges.push(change);
    }

    // Check for synchronized gas price movements
    const significantChanges = gasPriceChanges.filter(change => Math.abs(change) > 0.1); // 10% changes
    const changeRatio = significantChanges.length / gasPriceChanges.length;

    // Look for patterns in timing relative to gas prices
    const highGasPriceTxs = sortedTxs.filter(tx => parseFloat(tx.gasPrice) > 50); // Above 50 Gwei
    const highGasRatio = highGasPriceTxs.length / sortedTxs.length;

    let strength = 0;
    const evidence: string[] = [];

    if (changeRatio > 0.4) {
      strength += changeRatio * 50;
      evidence.push(`${(changeRatio * 100).toFixed(1)}% of transactions show significant gas price changes`);
    }

    if (highGasRatio > 0.7) {
      strength += 30;
      evidence.push(`${(highGasRatio * 100).toFixed(1)}% of transactions use high gas prices`);
    }

    if (strength < 25) return null;

    return {
      patternType: 'NETWORK_EFFECTS',
      strength: Math.min(100, strength),
      confidence: 60,
      description: 'Gas price patterns suggest coordination with network conditions',
      evidence,
      indicativeTransactions: highGasPriceTxs.map(tx => tx.hash)
    };
  }

  /**
   * Detect synchronized transactions
   */
  private static detectSynchronizedTransactions(transactions: TransactionData[]): SynchronizedTransaction[] {
    const synchronized: SynchronizedTransaction[] = [];
    const syncWindow = this.STATISTICAL_THRESHOLDS.COORDINATION.SYNC_WINDOW;
    
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedTxs.length - 1; i++) {
      const syncGroup = [sortedTxs[i]];
      
      for (let j = i + 1; j < sortedTxs.length; j++) {
        const timeDiff = sortedTxs[j].timestamp - sortedTxs[i].timestamp;
        
        if (timeDiff <= syncWindow) {
          syncGroup.push(sortedTxs[j]);
        } else {
          break;
        }
      }
      
      if (syncGroup.length >= 3) {
        const timeWindow = syncGroup[syncGroup.length - 1].timestamp - syncGroup[0].timestamp;
        const synchronizationScore = Math.max(0, 100 - (timeWindow / syncWindow) * 100);
        
        let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (synchronizationScore > 90) suspicionLevel = 'CRITICAL';
        else if (synchronizationScore > 75) suspicionLevel = 'HIGH';
        else if (synchronizationScore > 50) suspicionLevel = 'MEDIUM';
        
        synchronized.push({
          transactions: syncGroup.map(tx => tx.hash),
          timeWindow,
          synchronizationScore,
          suspicionLevel
        });
        
        i += syncGroup.length - 1; // Skip processed transactions
      }
    }
    
    return synchronized;
  }

  /**
   * Analyze parameter matching for coordination
   */
  private static analyzeParameterMatching(transactions: TransactionData[]): ParameterMatching {
    // Gas price matching
    const gasPriceMatching = this.analyzeParameterMatchingByType(
      transactions.map(tx => tx.gasPrice),
      'GAS_PRICE'
    );

    // Gas limit matching
    const gasLimitMatching = this.analyzeParameterMatchingByType(
      transactions.map(tx => tx.gasUsed || '0'),
      'GAS_LIMIT'
    );

    // Amount matching
    const amountMatching = this.analyzeParameterMatchingByType(
      transactions.map(tx => tx.value),
      'AMOUNT'
    );

    // Calculate overall matching score
    const allGroups = [...gasPriceMatching, ...gasLimitMatching, ...amountMatching];
    const overallMatchingScore = allGroups.length > 0 
      ? allGroups.reduce((sum, group) => sum + group.suspicionScore, 0) / allGroups.length 
      : 0;

    return {
      gasPriceMatching,
      gasLimitMatching,
      amountMatching,
      overallMatchingScore
    };
  }

  /**
   * Analyze parameter matching by type
   */
  private static analyzeParameterMatchingByType(
    values: string[],
    parameterType: string
  ): MatchingGroup[] {
    const groups: MatchingGroup[] = [];
    const valueCounts = new Map<string, number>();
    
    values.forEach(value => {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });

    valueCounts.forEach((count, value) => {
      if (count >= 3) { // At least 3 occurrences
        const percentage = (count / values.length) * 100;
        let suspicionScore = 0;
        
        if (percentage > 70) suspicionScore = 90;
        else if (percentage > 50) suspicionScore = 70;
        else if (percentage > 30) suspicionScore = 50;
        else suspicionScore = 30;

        groups.push({
          parameter: parameterType,
          value,
          transactionCount: count,
          percentage,
          suspicionScore
        });
      }
    });

    return groups.sort((a, b) => b.suspicionScore - a.suspicionScore);
  }

  /**
   * Calculate coordination score
   */
  private static calculateCoordinationScore(data: {
    coordinationPatterns: CoordinationPattern[];
    synchronizedTransactions: SynchronizedTransaction[];
    parameterMatching: ParameterMatching;
  }): number {
    let score = 0;

    // Pattern-based scoring
    data.coordinationPatterns.forEach(pattern => {
      const patternWeight = {
        'SYNCHRONIZED_TIMING': 30,
        'IDENTICAL_PARAMETERS': 25,
        'COORDINATED_AMOUNTS': 20,
        'NETWORK_EFFECTS': 15
      };
      
      score += (pattern.strength / 100) * (patternWeight[pattern.patternType] || 10);
    });

    // Synchronized transactions scoring
    data.synchronizedTransactions.forEach(sync => {
      score += (sync.synchronizationScore / 100) * 20;
    });

    // Parameter matching scoring
    score += (data.parameterMatching.overallMatchingScore / 100) * 15;

    return Math.min(100, score);
  }

  /**
   * Calculate coordination confidence
   */
  private static calculateCoordinationConfidence(
    transactionCount: number,
    coordinationPatterns: CoordinationPattern[]
  ): number {
    let confidence = 0;

    // Base confidence from transaction count
    confidence += Math.min(40, transactionCount * 2);

    // Pattern diversity increases confidence
    const patternTypes = new Set(coordinationPatterns.map(p => p.patternType));
    confidence += patternTypes.size * 15;

    // Strong patterns increase confidence
    const strongPatterns = coordinationPatterns.filter(p => p.strength > 70);
    confidence += strongPatterns.length * 10;

    return Math.min(100, confidence);
  }

  /**
   * Calculate coordination risk score
   */
  private static calculateCoordinationRiskScore(
    coordinationScore: number,
    coordinationPatterns: CoordinationPattern[]
  ): number {
    let riskScore = coordinationScore * 0.8; // Base risk from coordination score

    // Add risk from specific patterns
    coordinationPatterns.forEach(pattern => {
      const patternRisk = {
        'SYNCHRONIZED_TIMING': 20,
        'IDENTICAL_PARAMETERS': 25,
        'COORDINATED_AMOUNTS': 15,
        'NETWORK_EFFECTS': 10
      };
      
      riskScore += (pattern.strength / 100) * (patternRisk[pattern.patternType] || 5);
    });

    return Math.min(100, riskScore);
  }

  /**
   * Generate coordination evidence
   */
  private static generateCoordinationEvidence(
    coordinationPatterns: CoordinationPattern[],
    synchronizedTransactions: SynchronizedTransaction[],
    parameterMatching: ParameterMatching
  ): string[] {
    const evidence: string[] = [];

    coordinationPatterns.forEach(pattern => {
      evidence.push(`${pattern.patternType.replace('_', ' ').toLowerCase()} pattern detected (${pattern.strength.toFixed(1)}% strength)`);
    });

    if (synchronizedTransactions.length > 0) {
      evidence.push(`${synchronizedTransactions.length} synchronized transaction groups found`);
    }

    if (parameterMatching.overallMatchingScore > 50) {
      evidence.push(`High parameter matching score: ${parameterMatching.overallMatchingScore.toFixed(1)}%`);
    }

    return evidence;
  }

  /**
   * Generate coordination explanation
   */
  private static generateCoordinationExplanation(
    detected: boolean,
    coordinationScore: number,
    coordinationPatterns: CoordinationPattern[]
  ): string {
    if (!detected) {
      return 'No significant coordination patterns detected. Transaction behavior appears independent.';
    }

    let explanation = `Coordination patterns detected (Score: ${coordinationScore.toFixed(1)}/100). `;

    if (coordinationPatterns.length > 0) {
      explanation += `Analysis identified ${coordinationPatterns.length} coordination patterns including `;
      const patternNames = coordinationPatterns.map(p => p.patternType.toLowerCase().replace('_', ' '));
      explanation += patternNames.join(', ') + '. ';
    }

    if (coordinationScore > 80) {
      explanation += 'Strong evidence suggests coordinated activity with external entities.';
    } else if (coordinationScore > 60) {
      explanation += 'Multiple indicators suggest possible coordination.';
    } else {
      explanation += 'Some patterns suggest potential coordination.';
    }

    return explanation;
  }

  /**
   * Create empty parameter matching for insufficient data
   */
  private static createEmptyParameterMatching(): ParameterMatching {
    return {
      gasPriceMatching: [],
      gasLimitMatching: [],
      amountMatching: [],
      overallMatchingScore: 0
    };
  }

  /**
   * Calculate overall anomaly score from all detection results
   */
  private static calculateOverallAnomalyScore(data: {
    statisticalAnomalies: StatisticalAnomaly[];
    washTradingDetection: WashTradingResult;
    botBehaviorDetection: BotBehaviorResult;
    coordinatedActivityDetection: CoordinatedActivityResult;
  }): number {
    let score = 0;

    // Statistical anomalies (25% weight)
    if (data.statisticalAnomalies.length > 0) {
      const avgAnomalyScore = data.statisticalAnomalies.reduce((sum, a) => sum + a.score, 0) / data.statisticalAnomalies.length;
      score += avgAnomalyScore * 0.25;
    }

    // Wash trading (30% weight)
    score += data.washTradingDetection.riskScore * 0.30;

    // Bot behavior (25% weight)
    score += data.botBehaviorDetection.riskScore * 0.25;

    // Coordinated activity (20% weight)
    score += data.coordinatedActivityDetection.riskScore * 0.20;

    return Math.min(100, score);
  }

  /**
   * Calculate detection confidence based on data quality and consistency
   */
  private static calculateDetectionConfidence(
    transactions: TransactionData[],
    detectionResults: {
      statisticalAnomalies: StatisticalAnomaly[];
      washTradingDetection: WashTradingResult;
      botBehaviorDetection: BotBehaviorResult;
      coordinatedActivityDetection: CoordinatedActivityResult;
    }
  ): number {
    let confidence = 0;

    // Base confidence from transaction count
    confidence += Math.min(30, transactions.length);

    // Confidence from detection consistency
    const detectionCount = [
      detectionResults.statisticalAnomalies.length > 0,
      detectionResults.washTradingDetection.detected,
      detectionResults.botBehaviorDetection.detected,
      detectionResults.coordinatedActivityDetection.detected
    ].filter(Boolean).length;

    confidence += detectionCount * 15;

    // Individual detection confidences
    confidence += detectionResults.washTradingDetection.confidence * 0.1;
    confidence += detectionResults.botBehaviorDetection.confidence * 0.1;
    confidence += detectionResults.coordinatedActivityDetection.confidence * 0.1;

    return Math.min(100, confidence);
  }

  /**
   * Generate risk explanation
   */
  private static generateRiskExplanation(data: {
    statisticalAnomalies: StatisticalAnomaly[];
    washTradingDetection: WashTradingResult;
    botBehaviorDetection: BotBehaviorResult;
    coordinatedActivityDetection: CoordinatedActivityResult;
    overallScore: number;
  }): string {
    let explanation = `Anomaly detection analysis completed with overall risk score of ${data.overallScore.toFixed(1)}/100. `;

    const detectedIssues: string[] = [];

    if (data.statisticalAnomalies.length > 0) {
      detectedIssues.push(`${data.statisticalAnomalies.length} statistical anomalies`);
    }

    if (data.washTradingDetection.detected) {
      detectedIssues.push('wash trading patterns');
    }

    if (data.botBehaviorDetection.detected) {
      detectedIssues.push('automated behavior patterns');
    }

    if (data.coordinatedActivityDetection.detected) {
      detectedIssues.push('coordination patterns');
    }

    if (detectedIssues.length > 0) {
      explanation += `Detected: ${detectedIssues.join(', ')}. `;
    } else {
      explanation += 'No significant anomalies detected. ';
    }

    if (data.overallScore > 80) {
      explanation += 'High risk profile requires immediate investigation.';
    } else if (data.overallScore > 60) {
      explanation += 'Moderate risk profile warrants monitoring.';
    } else if (data.overallScore > 30) {
      explanation += 'Low to moderate risk profile with some concerns.';
    } else {
      explanation += 'Low risk profile with normal transaction patterns.';
    }

    return explanation;
  }

  /**
   * Generate recommendations based on detected anomalies
   */
  private static generateRecommendations(
    flags: {
      hasStatisticalAnomalies: boolean;
      hasWashTrading: boolean;
      hasBotBehavior: boolean;
      hasCoordinatedActivity: boolean;
      requiresInvestigation: boolean;
    },
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (flags.requiresInvestigation) {
      recommendations.push('Immediate manual review recommended due to high anomaly score');
    }

    if (flags.hasWashTrading) {
      recommendations.push('Investigate potential wash trading patterns and verify transaction legitimacy');
    }

    if (flags.hasBotBehavior) {
      recommendations.push('Review for automated trading behavior and ensure compliance with platform policies');
    }

    if (flags.hasCoordinatedActivity) {
      recommendations.push('Analyze for potential multi-account coordination or external manipulation');
    }

    if (flags.hasStatisticalAnomalies) {
      recommendations.push('Review statistical outliers for unusual transaction patterns');
    }

    if (overallScore > 70) {
      recommendations.push('Consider temporary restrictions pending investigation');
      recommendations.push('Implement enhanced monitoring for future transactions');
    } else if (overallScore > 40) {
      recommendations.push('Increase monitoring frequency for this account');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue standard monitoring procedures');
    }

    return recommendations;
  }

  /**
   * Create empty result for insufficient data
   */
  private static createEmptyResult(address: string, reason: string): AnomalyDetectionResult {
    return {
      address,
      timestamp: Date.now(),
      overallAnomalyScore: 0,
      confidence: 0,
      statisticalAnomalies: [],
      washTradingDetection: {
        detected: false,
        confidence: 0,
        severity: 'LOW',
        patterns: [],
        suspiciousTransactionPairs: [],
        circularTransactionChains: [],
        riskScore: 0,
        explanation: reason,
        evidence: []
      },
      botBehaviorDetection: {
        detected: false,
        confidence: 0,
        botProbability: 0,
        behaviorPatterns: [],
        timingAnalysis: this.createEmptyTimingAnalysis(),
        parameterConsistency: this.createEmptyParameterConsistency(),
        riskScore: 0,
        explanation: reason,
        evidence: []
      },
      coordinatedActivityDetection: {
        detected: false,
        confidence: 0,
        coordinationScore: 0,
        coordinationPatterns: [],
        synchronizedTransactions: [],
        parameterMatching: this.createEmptyParameterMatching(),
        riskScore: 0,
        explanation: reason,
        evidence: []
      },
      flags: {
        hasStatisticalAnomalies: false,
        hasWashTrading: false,
        hasBotBehavior: false,
        hasCoordinatedActivity: false,
        requiresInvestigation: false
      },
      riskExplanation: reason,
      recommendations: ['Build transaction history for comprehensive anomaly detection']
    };
  }
}

export default AnomalyDetectionEngine;