// Score Calculator - Algorithms for processing transaction data into score updates
// Implements weighted scoring algorithms for each credit dimension

import { CreditProfile, ScoreDimension } from '../../types/credit';
import { CategorizedTransaction, CreditDimensionMapping } from '../data-aggregator/transaction-categorizer';
import { getCurrentTimestamp } from '../../utils/time';

export interface ScoreUpdate {
  dimension: keyof CreditProfile['dimensions'];
  oldScore: number;
  newScore: number;
  confidence: number;
  impact: number;
  reason: string;
}

export interface ScoringWeights {
  transactionValue: number;
  protocolReliability: number;
  frequencyBonus: number;
  riskPenalty: number;
  dataWeight: number;
}

export class ScoreCalculator {
  private readonly defaultWeights: ScoringWeights = {
    transactionValue: 0.3,
    protocolReliability: 0.25,
    frequencyBonus: 0.2,
    riskPenalty: 0.15,
    dataWeight: 0.1
  };

  /**
   * Calculate score updates for all affected dimensions
   */
  public async calculateScoreUpdates(
    profile: CreditProfile,
    transaction: CategorizedTransaction
  ): Promise<ScoreUpdate[]> {
    const updates: ScoreUpdate[] = [];
    const dimensions = transaction.creditDimensions;

    // Process each dimension that has impact from the transaction
    for (const [dimensionKey, impact] of Object.entries(dimensions)) {
      if (impact > 0) {
        const dimension = dimensionKey as keyof CreditProfile['dimensions'];
        const currentDimension = profile.dimensions[dimension];
        
        const scoreUpdate = await this.calculateDimensionUpdate(
          currentDimension,
          transaction,
          impact,
          dimension
        );

        if (scoreUpdate) {
          updates.push(scoreUpdate);
        }
      }
    }

    return updates;
  }

  /**
   * Calculate score update for a specific dimension
   */
  private async calculateDimensionUpdate(
    currentDimension: ScoreDimension,
    transaction: CategorizedTransaction,
    impact: number,
    dimensionType: keyof CreditProfile['dimensions']
  ): Promise<ScoreUpdate | null> {
    try {
      // Calculate base score change from transaction impact
      const baseImpact = this.calculateBaseImpact(transaction, impact);
      
      // Apply dimension-specific scoring algorithm
      const dimensionImpact = this.applyDimensionSpecificScoring(
        dimensionType,
        baseImpact,
        transaction
      );

      // Apply weighted adjustments
      const weightedImpact = this.applyWeightedAdjustments(
        dimensionImpact,
        transaction,
        currentDimension
      );

      // Calculate new score with bounds checking
      const newScore = this.calculateNewScore(currentDimension.score, weightedImpact);
      
      // Calculate confidence for this update
      const confidence = this.calculateUpdateConfidence(currentDimension, transaction);

      // Only return update if there's meaningful change
      if (Math.abs(newScore - currentDimension.score) < 1) {
        return null;
      }

      return {
        dimension: dimensionType,
        oldScore: currentDimension.score,
        newScore,
        confidence,
        impact: weightedImpact,
        reason: this.generateUpdateReason(transaction, dimensionType, weightedImpact)
      };

    } catch (error) {
      console.error(`Error calculating dimension update for ${dimensionType}:`, error);
      return null;
    }
  }

  /**
   * Calculate base impact from transaction
   */
  private calculateBaseImpact(transaction: CategorizedTransaction, impact: number): number {
    // Convert transaction value to impact multiplier
    const valueInEth = parseInt(transaction.value, 16) / 1e18;
    const valueMultiplier = this.getValueMultiplier(valueInEth);
    
    // Apply risk adjustment
    const riskAdjustment = 1 - (transaction.riskScore * this.defaultWeights.riskPenalty);
    
    // Apply data weight
    const dataWeightAdjustment = transaction.dataWeight * this.defaultWeights.dataWeight;
    
    return impact * valueMultiplier * riskAdjustment * (1 + dataWeightAdjustment);
  }

  /**
   * Apply dimension-specific scoring algorithms
   */
  private applyDimensionSpecificScoring(
    dimension: keyof CreditProfile['dimensions'],
    baseImpact: number,
    transaction: CategorizedTransaction
  ): number {
    switch (dimension) {
      case 'defiReliability':
        return this.calculateDefiReliabilityImpact(baseImpact, transaction);
      
      case 'tradingConsistency':
        return this.calculateTradingConsistencyImpact(baseImpact, transaction);
      
      case 'stakingCommitment':
        return this.calculateStakingCommitmentImpact(baseImpact, transaction);
      
      case 'governanceParticipation':
        return this.calculateGovernanceParticipationImpact(baseImpact, transaction);
      
      case 'liquidityProvider':
        return this.calculateLiquidityProviderImpact(baseImpact, transaction);
      
      default:
        return baseImpact;
    }
  }

  /**
   * Calculate DeFi Reliability impact
   */
  private calculateDefiReliabilityImpact(
    baseImpact: number,
    transaction: CategorizedTransaction
  ): number {
    let impact = baseImpact;

    // Protocol reliability bonus
    const protocolBonus = this.getProtocolReliabilityBonus(transaction.protocol);
    impact *= (1 + protocolBonus);

    // Successful transaction bonus (low risk = successful)
    if (transaction.riskScore < 0.3) {
      impact *= 1.2;
    }

    // Large transaction reliability bonus
    const valueInEth = parseInt(transaction.value, 16) / 1e18;
    if (valueInEth > 10) {
      impact *= 1.1;
    }

    return impact;
  }

  /**
   * Calculate Trading Consistency impact
   */
  private calculateTradingConsistencyImpact(
    baseImpact: number,
    transaction: CategorizedTransaction
  ): number {
    let impact = baseImpact;

    // Consistency bonus based on transaction frequency
    // This would need historical data in a real implementation
    const consistencyBonus = 0.1; // Placeholder
    impact *= (1 + consistencyBonus);

    // Moderate risk tolerance for trading
    if (transaction.riskScore > 0.7) {
      impact *= 0.8; // Penalty for very high risk trades
    }

    return impact;
  }

  /**
   * Calculate Staking Commitment impact
   */
  private calculateStakingCommitmentImpact(
    baseImpact: number,
    transaction: CategorizedTransaction
  ): number {
    let impact = baseImpact;

    // Long-term commitment bonus
    // In a real implementation, this would analyze staking duration
    const commitmentBonus = 0.3;
    impact *= (1 + commitmentBonus);

    // Staking is generally low risk, so bonus for low risk scores
    if (transaction.riskScore < 0.2) {
      impact *= 1.4;
    }

    return impact;
  }

  /**
   * Calculate Governance Participation impact
   */
  private calculateGovernanceParticipationImpact(
    baseImpact: number,
    transaction: CategorizedTransaction
  ): number {
    let impact = baseImpact;

    // Governance participation gets highest weight
    impact *= 1.5;

    // Protocol governance bonus
    if (transaction.protocol?.toLowerCase().includes('governance')) {
      impact *= 1.3;
    }

    // Governance is lowest risk activity
    impact *= 1.2;

    return impact;
  }

  /**
   * Calculate Liquidity Provider impact
   */
  private calculateLiquidityProviderImpact(
    baseImpact: number,
    transaction: CategorizedTransaction
  ): number {
    let impact = baseImpact;

    // Liquidity provision bonus
    const liquidityBonus = 0.2;
    impact *= (1 + liquidityBonus);

    // Large liquidity provision bonus
    const valueInEth = parseInt(transaction.value, 16) / 1e18;
    if (valueInEth > 50) {
      impact *= 1.25;
    }

    return impact;
  }

  /**
   * Apply weighted adjustments based on scoring weights
   */
  private applyWeightedAdjustments(
    dimensionImpact: number,
    transaction: CategorizedTransaction,
    currentDimension: ScoreDimension
  ): number {
    let adjustedImpact = dimensionImpact;

    // Frequency bonus based on data points (more activity = higher impact)
    const frequencyMultiplier = Math.min(1 + (currentDimension.dataPoints * 0.01), 1.5);
    adjustedImpact *= frequencyMultiplier * this.defaultWeights.frequencyBonus;

    // Protocol reliability adjustment
    const protocolReliability = this.getProtocolReliabilityBonus(transaction.protocol);
    adjustedImpact *= (1 + protocolReliability * this.defaultWeights.protocolReliability);

    return adjustedImpact;
  }

  /**
   * Calculate new score with bounds checking (0-1000 scale)
   */
  private calculateNewScore(currentScore: number, impact: number): number {
    // Convert impact to score change (scale impact appropriately)
    const scoreChange = impact * 50; // Scale factor to make meaningful score changes
    
    const newScore = currentScore + scoreChange;
    
    // Ensure score stays within bounds
    return Math.max(0, Math.min(1000, Math.round(newScore)));
  }

  /**
   * Calculate confidence for the score update
   */
  private calculateUpdateConfidence(
    currentDimension: ScoreDimension,
    transaction: CategorizedTransaction
  ): number {
    let confidence = 50; // Base confidence

    // More data points = higher confidence
    confidence += Math.min(currentDimension.dataPoints * 2, 30);

    // Higher data weight = higher confidence
    confidence += transaction.dataWeight * 10;

    // Lower risk = higher confidence
    confidence += (1 - transaction.riskScore) * 15;

    // Protocol reliability affects confidence
    const protocolBonus = this.getProtocolReliabilityBonus(transaction.protocol);
    confidence += protocolBonus * 10;

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Get value multiplier based on transaction value
   */
  private getValueMultiplier(valueInEth: number): number {
    if (valueInEth < 0.01) return 0.5;
    if (valueInEth < 0.1) return 0.8;
    if (valueInEth < 1) return 1.0;
    if (valueInEth < 10) return 1.2;
    if (valueInEth < 100) return 1.4;
    return 1.6;
  }

  /**
   * Get protocol reliability bonus
   */
  private getProtocolReliabilityBonus(protocol?: string): number {
    if (!protocol) return 0;

    const protocolBonuses: Record<string, number> = {
      'aave v2': 0.3,
      'aave v3': 0.25,
      'compound v2': 0.28,
      'makerdao': 0.35,
      'makerdao governance': 0.4,
      'uniswap v2': 0.15,
      'uniswap v3': 0.2
    };

    return protocolBonuses[protocol.toLowerCase()] || 0;
  }

  /**
   * Generate human-readable reason for score update
   */
  private generateUpdateReason(
    transaction: CategorizedTransaction,
    dimension: keyof CreditProfile['dimensions'],
    impact: number
  ): string {
    const direction = impact > 0 ? 'increased' : 'decreased';
    const protocol = transaction.protocol || 'DeFi protocol';
    
    const reasons: Record<keyof CreditProfile['dimensions'], string> = {
      defiReliability: `DeFi reliability ${direction} due to ${protocol} interaction`,
      tradingConsistency: `Trading consistency ${direction} from ${protocol} trading activity`,
      stakingCommitment: `Staking commitment ${direction} through ${protocol} staking`,
      governanceParticipation: `Governance participation ${direction} via ${protocol} governance`,
      liquidityProvider: `Liquidity provider score ${direction} from ${protocol} liquidity provision`
    };

    return reasons[dimension];
  }

  /**
   * Get scoring weights (for external configuration)
   */
  public getScoringWeights(): ScoringWeights {
    return { ...this.defaultWeights };
  }

  /**
   * Update scoring weights (for dynamic adjustment)
   */
  public updateScoringWeights(newWeights: Partial<ScoringWeights>): void {
    Object.assign(this.defaultWeights, newWeights);
  }
}