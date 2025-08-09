// Transaction Categorizer for Credit Dimensions
// Maps Ethereum transactions to the five credit scoring dimensions

import { CrossChainTransaction, TransactionCategory } from '../../types/transactions';
import { MonitoredTransaction } from './ethereum-monitor';

export interface CreditDimensionMapping {
  defiReliability: number;
  tradingConsistency: number;
  stakingCommitment: number;
  governanceParticipation: number;
  liquidityProvider: number;
}

export interface CategorizedTransaction extends MonitoredTransaction {
  creditDimensions: CreditDimensionMapping;
  riskScore: number;
  dataWeight: number;
}

export class TransactionCategorizer {
  /**
   * Categorize a monitored transaction into credit dimensions
   */
  public categorizeForCreditScoring(tx: MonitoredTransaction): CategorizedTransaction {
    const creditDimensions = this.mapToCreditDimensions(tx);
    const riskScore = this.calculateRiskScore(tx);
    const dataWeight = this.calculateDataWeight(tx);

    return {
      ...tx,
      creditDimensions,
      riskScore,
      dataWeight
    };
  }

  /**
   * Map transaction to credit dimensions based on category and protocol
   */
  private mapToCreditDimensions(tx: MonitoredTransaction): CreditDimensionMapping {
    const mapping: CreditDimensionMapping = {
      defiReliability: 0,
      tradingConsistency: 0,
      stakingCommitment: 0,
      governanceParticipation: 0,
      liquidityProvider: 0
    };

    if (!tx.category) {
      return mapping;
    }

    switch (tx.category) {
      case TransactionCategory.LENDING:
        mapping.defiReliability = 1.0;
        mapping.tradingConsistency = 0.3;
        break;

      case TransactionCategory.BORROWING:
        mapping.defiReliability = 0.8;
        mapping.tradingConsistency = 0.2;
        break;

      case TransactionCategory.TRADING:
        mapping.tradingConsistency = 1.0;
        mapping.defiReliability = 0.4;
        break;

      case TransactionCategory.STAKING:
        mapping.stakingCommitment = 1.0;
        mapping.defiReliability = 0.6;
        break;

      case TransactionCategory.GOVERNANCE:
        mapping.governanceParticipation = 1.0;
        mapping.defiReliability = 0.5;
        break;

      case TransactionCategory.LIQUIDITY_PROVISION:
        mapping.liquidityProvider = 1.0;
        mapping.defiReliability = 0.7;
        mapping.tradingConsistency = 0.4;
        break;

      case TransactionCategory.YIELD_FARMING:
        mapping.liquidityProvider = 0.8;
        mapping.defiReliability = 0.6;
        mapping.stakingCommitment = 0.4;
        break;

      default:
        // Default minimal mapping for unknown categories
        mapping.defiReliability = 0.1;
        break;
    }

    // Apply protocol-specific adjustments
    this.applyProtocolAdjustments(mapping, tx);

    return mapping;
  }

  /**
   * Apply protocol-specific adjustments to credit dimension mappings
   */
  private applyProtocolAdjustments(mapping: CreditDimensionMapping, tx: MonitoredTransaction): void {
    if (!tx.protocol) return;

    const protocolName = tx.protocol.toLowerCase();

    // Protocol-specific reliability adjustments
    const protocolReliabilityMultipliers: Record<string, number> = {
      'aave v2': 1.2,
      'aave v3': 1.1,
      'compound v2': 1.15,
      'uniswap v2': 1.0,
      'uniswap v3': 1.05,
      'makerdao': 1.3,
      'makerdao governance': 1.4
    };

    const multiplier = protocolReliabilityMultipliers[protocolName] || 1.0;
    
    // Apply multiplier to all non-zero dimensions
    Object.keys(mapping).forEach(key => {
      const dimension = key as keyof CreditDimensionMapping;
      if (mapping[dimension] > 0) {
        mapping[dimension] *= multiplier;
        // Cap at 1.0 to maintain score bounds
        mapping[dimension] = Math.min(mapping[dimension], 1.0);
      }
    });
  }

  /**
   * Calculate risk score for the transaction
   */
  private calculateRiskScore(tx: MonitoredTransaction): number {
    let baseRisk = 0.5; // Neutral risk

    // Category-based risk adjustments
    const categoryRiskAdjustments: Record<TransactionCategory, number> = {
      [TransactionCategory.LENDING]: -0.2, // Lower risk
      [TransactionCategory.BORROWING]: 0.1, // Slightly higher risk
      [TransactionCategory.TRADING]: 0.2, // Higher risk due to volatility
      [TransactionCategory.STAKING]: -0.3, // Lower risk, long-term commitment
      [TransactionCategory.GOVERNANCE]: -0.4, // Lowest risk, community participation
      [TransactionCategory.LIQUIDITY_PROVISION]: 0.0, // Neutral risk
      [TransactionCategory.YIELD_FARMING]: 0.3, // Higher risk due to complexity
      [TransactionCategory.BRIDGE_TRANSFER]: 0.4, // Higher risk due to cross-chain
      [TransactionCategory.NFT_TRADE]: 0.5 // Highest risk due to volatility
    };

    if (tx.category) {
      baseRisk += categoryRiskAdjustments[tx.category];
    }

    // Protocol-based risk adjustments
    const protocolRiskAdjustments: Record<string, number> = {
      'aave v2': -0.1,
      'aave v3': -0.05,
      'compound v2': -0.08,
      'uniswap v2': 0.05,
      'uniswap v3': 0.02,
      'makerdao': -0.15,
      'makerdao governance': -0.2
    };

    if (tx.protocol) {
      const protocolAdjustment = protocolRiskAdjustments[tx.protocol.toLowerCase()] || 0;
      baseRisk += protocolAdjustment;
    }

    // Transaction value risk adjustment (higher values = higher risk)
    const valueInEth = parseInt(tx.value, 16) / 1e18;
    if (valueInEth > 100) {
      baseRisk += 0.1;
    } else if (valueInEth > 10) {
      baseRisk += 0.05;
    }

    // Ensure risk score stays within bounds [0, 1]
    return Math.max(0, Math.min(1, baseRisk));
  }

  /**
   * Calculate data weight for the transaction (importance for scoring)
   */
  private calculateDataWeight(tx: MonitoredTransaction): number {
    let baseWeight = 1.0;

    // Category-based weight adjustments
    const categoryWeights: Record<TransactionCategory, number> = {
      [TransactionCategory.LENDING]: 1.5,
      [TransactionCategory.BORROWING]: 1.4,
      [TransactionCategory.TRADING]: 1.0,
      [TransactionCategory.STAKING]: 1.6,
      [TransactionCategory.GOVERNANCE]: 2.0, // Highest weight for governance
      [TransactionCategory.LIQUIDITY_PROVISION]: 1.3,
      [TransactionCategory.YIELD_FARMING]: 1.2,
      [TransactionCategory.BRIDGE_TRANSFER]: 0.8,
      [TransactionCategory.NFT_TRADE]: 0.6
    };

    if (tx.category) {
      baseWeight = categoryWeights[tx.category];
    }

    // Protocol-based weight adjustments
    const protocolWeights: Record<string, number> = {
      'aave v2': 1.3,
      'aave v3': 1.2,
      'compound v2': 1.25,
      'uniswap v2': 1.0,
      'uniswap v3': 1.1,
      'makerdao': 1.4,
      'makerdao governance': 1.8
    };

    if (tx.protocol) {
      const protocolMultiplier = protocolWeights[tx.protocol.toLowerCase()] || 1.0;
      baseWeight *= protocolMultiplier;
    }

    // Transaction value weight adjustment
    const valueInEth = parseInt(tx.value, 16) / 1e18;
    if (valueInEth > 100) {
      baseWeight *= 1.3;
    } else if (valueInEth > 10) {
      baseWeight *= 1.1;
    } else if (valueInEth < 0.01) {
      baseWeight *= 0.5; // Reduce weight for very small transactions
    }

    return Math.max(0.1, Math.min(3.0, baseWeight));
  }

  /**
   * Get credit dimension impact summary for a transaction
   */
  public getCreditImpactSummary(tx: CategorizedTransaction): {
    primaryDimension: keyof CreditDimensionMapping;
    impactScore: number;
    description: string;
  } {
    const dimensions = tx.creditDimensions;
    
    // Find the dimension with highest impact
    const primaryDimension = Object.entries(dimensions)
      .reduce((max, [key, value]) => value > max.value ? { key: key as keyof CreditDimensionMapping, value } : max, 
              { key: 'defiReliability' as keyof CreditDimensionMapping, value: 0 }).key;

    const impactScore = dimensions[primaryDimension] * tx.dataWeight;

    const descriptions: Record<keyof CreditDimensionMapping, string> = {
      defiReliability: 'Contributes to DeFi protocol reliability and trustworthiness',
      tradingConsistency: 'Demonstrates consistent trading patterns and market participation',
      stakingCommitment: 'Shows long-term commitment through staking activities',
      governanceParticipation: 'Reflects active participation in protocol governance',
      liquidityProvider: 'Indicates contribution to protocol liquidity and stability'
    };

    return {
      primaryDimension,
      impactScore,
      description: descriptions[primaryDimension]
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  public batchCategorize(transactions: MonitoredTransaction[]): CategorizedTransaction[] {
    return transactions.map(tx => this.categorizeForCreditScoring(tx));
  }
}

// Export singleton instance
export const transactionCategorizer = new TransactionCategorizer();