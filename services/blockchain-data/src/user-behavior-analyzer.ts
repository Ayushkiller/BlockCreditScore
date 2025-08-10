import { EventEmitter } from 'events';
import { RealTransactionAnalyzer, TransactionAnalysis, TransactionPattern } from './real-transaction-analyzer';
import { RealBlockchainDataManager } from './blockchain-data-manager';
import { RealContractManager } from './contract-manager';
import {
  EthereumTransaction,
  TransactionReceipt,
  ProtocolInteraction,
  REAL_CONTRACT_ADDRESSES,
  EVENT_SIGNATURES
} from './types';

export interface StakingBehavior {
  userAddress: string;
  totalStaked: string;
  totalUnstaked: string;
  totalRewardsClaimed: string;
  stakingProtocols: Map<string, StakingProtocolData>;
  stakingHistory: StakingEvent[];
  averageStakingDuration: number; // in days
  stakingScore: number; // 0-1 scale
  riskLevel: 'low' | 'medium' | 'high';
}

export interface StakingProtocolData {
  protocol: string;
  contractAddress: string;
  totalStaked: string;
  totalRewards: string;
  activeStakes: number;
  firstStakeTimestamp: number;
  lastActivityTimestamp: number;
}

export interface StakingEvent {
  type: 'stake' | 'unstake' | 'claim_rewards' | 'slash';
  protocol: string;
  amount: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
  tokenAddress?: string;
  validatorAddress?: string;
}

export interface LiquidationBehavior {
  userAddress: string;
  totalLiquidations: number;
  liquidationEvents: LiquidationEvent[];
  liquidationProtocols: Map<string, LiquidationProtocolData>;
  totalLiquidatedValue: string;
  averageHealthFactor: number;
  liquidationRiskScore: number; // 0-1 scale, higher = more risky
  recoveryPattern: 'quick' | 'slow' | 'none';
}

export interface LiquidationEvent {
  type: 'liquidated' | 'liquidator';
  protocol: string;
  collateralAsset: string;
  debtAsset: string;
  liquidatedAmount: string;
  collateralAmount: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
  healthFactorBefore?: number;
  liquidationBonus?: string;
}

export interface LiquidationProtocolData {
  protocol: string;
  totalLiquidations: number;
  totalLiquidatedValue: string;
  averageHealthFactor: number;
  lastLiquidationTimestamp: number;
}

export interface UserBehaviorProfile {
  userAddress: string;
  transactionPattern: TransactionPattern;
  stakingBehavior: StakingBehavior;
  liquidationBehavior: LiquidationBehavior;
  overallRiskScore: number;
  creditworthiness: number; // 0-1000 scale
  behaviorTags: string[];
  lastAnalysisTimestamp: number;
  dataCompleteness: number; // 0-1 scale indicating how complete the data is
}

/**
 * Real User Behavior Analyzer
 * Analyzes user behavior patterns using real blockchain data
 * Focuses on staking behavior and liquidation detection
 */
export class RealUserBehaviorAnalyzer extends EventEmitter {
  private transactionAnalyzer: RealTransactionAnalyzer;
  private blockchainManager: RealBlockchainDataManager;
  private contractManager: RealContractManager;
  
  // Known staking contract addresses
  private readonly STAKING_CONTRACTS = {
    ETH2_DEPOSIT: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    LIDO_STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    ROCKET_POOL: '0x1cc9cf5586522c6f483e84a19c3c2b0b6d027bf0',
    FRAX_ETH: '0x5E8422345238F34275888049021821E8E08CAa1f',
    COINBASE_CBETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704'
  };

  // Known liquidation event signatures
  private readonly LIQUIDATION_EVENTS = {
    AAVE_V3_LIQUIDATION: '0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286',
    COMPOUND_LIQUIDATION: '0x298637f684da70674f26509b10f07ec2fbc77a335ab1e7d6215a4b2484d8bb52',
    MAKER_LIQUIDATION: '0x99b5620489b6ef926d4518936cfec15d305452712b88bd59da2d9c10fb0953e8'
  };

  constructor(
    transactionAnalyzer: RealTransactionAnalyzer,
    blockchainManager: RealBlockchainDataManager,
    contractManager: RealContractManager
  ) {
    super();
    this.transactionAnalyzer = transactionAnalyzer;
    this.blockchainManager = blockchainManager;
    this.contractManager = contractManager;
  }

  /**
   * Analyze comprehensive user behavior using real blockchain data
   */
  async analyzeUserBehavior(
    userAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<UserBehaviorProfile> {
    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error('Invalid Ethereum address format');
    }

    console.log(`🔍 Analyzing user behavior for ${userAddress}...`);

    try {
      // Get basic transaction pattern analysis
      const transactionPattern = await this.transactionAnalyzer.analyzeUserBehavior(
        userAddress, 
        fromBlock, 
        toBlock
      );

      // Analyze staking behavior using real staking contract events
      const stakingBehavior = await this.analyzeStakingBehavior(
        userAddress, 
        fromBlock, 
        toBlock
      );

      // Analyze liquidation behavior using real lending protocol events
      const liquidationBehavior = await this.analyzeLiquidationBehavior(
        userAddress, 
        fromBlock, 
        toBlock
      );

      // Calculate overall risk and creditworthiness scores
      const overallRiskScore = this.calculateOverallRiskScore(
        transactionPattern,
        stakingBehavior,
        liquidationBehavior
      );

      const creditworthiness = this.calculateCreditworthiness(
        transactionPattern,
        stakingBehavior,
        liquidationBehavior,
        overallRiskScore
      );

      // Generate behavior tags
      const behaviorTags = this.generateBehaviorTags(
        transactionPattern,
        stakingBehavior,
        liquidationBehavior
      );

      // Calculate data completeness
      const dataCompleteness = this.calculateDataCompleteness(
        transactionPattern,
        stakingBehavior,
        liquidationBehavior
      );

      const profile: UserBehaviorProfile = {
        userAddress,
        transactionPattern,
        stakingBehavior,
        liquidationBehavior,
        overallRiskScore,
        creditworthiness,
        behaviorTags,
        lastAnalysisTimestamp: Date.now(),
        dataCompleteness
      };

      console.log(`✅ User behavior analysis complete for ${userAddress}`);
      console.log(`   Risk Score: ${overallRiskScore.toFixed(3)}`);
      console.log(`   Creditworthiness: ${creditworthiness}`);
      console.log(`   Data Completeness: ${(dataCompleteness * 100).toFixed(1)}%`);

      this.emit('userBehaviorAnalyzed', profile);
      return profile;

    } catch (error) {
      console.error(`❌ Failed to analyze user behavior for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Analyze real staking behavior using actual staking contract events
   */
  private async analyzeStakingBehavior(
    userAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<StakingBehavior> {
    console.log(`📊 Analyzing staking behavior for ${userAddress}...`);

    const stakingEvents: StakingEvent[] = [];
    const stakingProtocols = new Map<string, StakingProtocolData>();
    let totalStaked = BigInt(0);
    let totalUnstaked = BigInt(0);
    let totalRewardsClaimed = BigInt(0);

    // Analyze each known staking contract
    for (const [protocolName, contractAddress] of Object.entries(this.STAKING_CONTRACTS)) {
      try {
        const protocolEvents = await this.getStakingEventsForProtocol(
          userAddress,
          contractAddress,
          protocolName.toLowerCase(),
          fromBlock,
          toBlock
        );

        stakingEvents.push(...protocolEvents);

        // Aggregate protocol data
        if (protocolEvents.length > 0) {
          const protocolData = this.aggregateStakingProtocolData(
            protocolName.toLowerCase(),
            contractAddress,
            protocolEvents
          );
          stakingProtocols.set(protocolName.toLowerCase(), protocolData);

          // Update totals
          totalStaked += BigInt(protocolData.totalStaked);
          totalRewardsClaimed += BigInt(protocolData.totalRewards);
        }

      } catch (error) {
        console.warn(`⚠️ Could not analyze staking for ${protocolName}:`, error);
      }
    }

    // Calculate average staking duration
    const averageStakingDuration = this.calculateAverageStakingDuration(stakingEvents);

    // Calculate staking score
    const stakingScore = this.calculateStakingScore(
      stakingEvents,
      stakingProtocols,
      averageStakingDuration
    );

    // Determine risk level
    const riskLevel = this.determineStakingRiskLevel(stakingEvents, stakingScore);

    return {
      userAddress,
      totalStaked: totalStaked.toString(),
      totalUnstaked: totalUnstaked.toString(),
      totalRewardsClaimed: totalRewardsClaimed.toString(),
      stakingProtocols,
      stakingHistory: stakingEvents.sort((a, b) => b.timestamp - a.timestamp),
      averageStakingDuration,
      stakingScore,
      riskLevel
    };
  }

  /**
   * Get staking events for a specific protocol
   */
  private async getStakingEventsForProtocol(
    userAddress: string,
    contractAddress: string,
    protocol: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<StakingEvent[]> {
    const events: StakingEvent[] = [];

    try {
      // Get transaction history for this contract
      const currentBlock = await this.blockchainManager.getCurrentBlock();
      const startBlock = fromBlock || Math.max(0, currentBlock - 50000); // Last ~50k blocks
      const endBlock = toBlock || currentBlock;

      // Use the blockchain manager to get events
      const filter = {
        address: contractAddress,
        fromBlock: startBlock,
        toBlock: endBlock,
        topics: [
          null, // Any event signature
          this.padAddress(userAddress) // User address as topic
        ]
      };

      const logs = await this.blockchainManager.getLogs(filter);

      for (const log of logs) {
        const stakingEvent = await this.parseStakingEvent(log, protocol);
        if (stakingEvent) {
          events.push(stakingEvent);
        }
      }

    } catch (error) {
      console.warn(`⚠️ Could not get staking events for ${protocol}:`, error);
    }

    return events;
  }

  /**
   * Parse a staking event from a log entry
   */
  private async parseStakingEvent(log: any, protocol: string): Promise<StakingEvent | null> {
    try {
      const eventSignature = log.topics[0];
      const blockNumber = parseInt(log.blockNumber, 16);
      const block = await this.blockchainManager.getBlockByNumber(blockNumber);

      // Parse different staking events based on protocol and signature
      if (protocol === 'eth2_deposit' && this.isDepositEvent(eventSignature)) {
        return {
          type: 'stake',
          protocol,
          amount: this.parseAmountFromLog(log),
          timestamp: block.timestamp,
          transactionHash: log.transactionHash,
          blockNumber,
          validatorAddress: log.topics[2] // Validator pubkey hash
        };
      }

      if (protocol === 'lido_steth' && this.isStETHEvent(eventSignature)) {
        return {
          type: this.getStETHEventType(eventSignature),
          protocol,
          amount: this.parseAmountFromLog(log),
          timestamp: block.timestamp,
          transactionHash: log.transactionHash,
          blockNumber,
          tokenAddress: log.address
        };
      }

      // Add more protocol-specific parsing as needed

    } catch (error) {
      console.warn(`⚠️ Could not parse staking event:`, error);
    }

    return null;
  }

  /**
   * Analyze real liquidation behavior using actual lending protocol liquidation events
   */
  private async analyzeLiquidationBehavior(
    userAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<LiquidationBehavior> {
    console.log(`⚡ Analyzing liquidation behavior for ${userAddress}...`);

    const liquidationEvents: LiquidationEvent[] = [];
    const liquidationProtocols = new Map<string, LiquidationProtocolData>();
    let totalLiquidatedValue = BigInt(0);

    // Check Aave V3 liquidations
    const aaveLiquidations = await this.getAaveLiquidationEvents(
      userAddress,
      fromBlock,
      toBlock
    );
    liquidationEvents.push(...aaveLiquidations);

    // Check Compound liquidations
    const compoundLiquidations = await this.getCompoundLiquidationEvents(
      userAddress,
      fromBlock,
      toBlock
    );
    liquidationEvents.push(...compoundLiquidations);

    // Check MakerDAO liquidations
    const makerLiquidations = await this.getMakerLiquidationEvents(
      userAddress,
      fromBlock,
      toBlock
    );
    liquidationEvents.push(...makerLiquidations);

    // Aggregate protocol data
    for (const event of liquidationEvents) {
      const protocolData = liquidationProtocols.get(event.protocol) || {
        protocol: event.protocol,
        totalLiquidations: 0,
        totalLiquidatedValue: '0',
        averageHealthFactor: 0,
        lastLiquidationTimestamp: 0
      };

      protocolData.totalLiquidations++;
      protocolData.totalLiquidatedValue = (
        BigInt(protocolData.totalLiquidatedValue) + BigInt(event.liquidatedAmount)
      ).toString();
      protocolData.lastLiquidationTimestamp = Math.max(
        protocolData.lastLiquidationTimestamp,
        event.timestamp
      );

      liquidationProtocols.set(event.protocol, protocolData);
      totalLiquidatedValue += BigInt(event.liquidatedAmount);
    }

    // Calculate metrics
    const averageHealthFactor = this.calculateAverageHealthFactor(liquidationEvents);
    const liquidationRiskScore = this.calculateLiquidationRiskScore(liquidationEvents);
    const recoveryPattern = this.analyzeRecoveryPattern(liquidationEvents);

    return {
      userAddress,
      totalLiquidations: liquidationEvents.length,
      liquidationEvents: liquidationEvents.sort((a, b) => b.timestamp - a.timestamp),
      liquidationProtocols,
      totalLiquidatedValue: totalLiquidatedValue.toString(),
      averageHealthFactor,
      liquidationRiskScore,
      recoveryPattern
    };
  }  /**

   * Get Aave V3 liquidation events
   */
  private async getAaveLiquidationEvents(
    userAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<LiquidationEvent[]> {
    const events: LiquidationEvent[] = [];

    try {
      const currentBlock = await this.blockchainManager.getCurrentBlock();
      const startBlock = fromBlock || Math.max(0, currentBlock - 50000);
      const endBlock = toBlock || currentBlock;

      // Get liquidation events from Aave V3 Pool contract
      const filter = {
        address: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
        fromBlock: startBlock,
        toBlock: endBlock,
        topics: [
          this.LIQUIDATION_EVENTS.AAVE_V3_LIQUIDATION,
          null, // collateralAsset
          null, // debtAsset
          this.padAddress(userAddress) // user being liquidated
        ]
      };

      const logs = await this.blockchainManager.getLogs(filter);

      for (const log of logs) {
        const liquidationEvent = await this.parseAaveLiquidationEvent(log);
        if (liquidationEvent) {
          events.push(liquidationEvent);
        }
      }

      // Also check if user was a liquidator
      const liquidatorFilter = {
        address: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
        fromBlock: startBlock,
        toBlock: endBlock,
        topics: [
          this.LIQUIDATION_EVENTS.AAVE_V3_LIQUIDATION,
          this.padAddress(userAddress), // liquidator
          null,
          null
        ]
      };

      const liquidatorLogs = await this.blockchainManager.getLogs(liquidatorFilter);
      for (const log of liquidatorLogs) {
        const liquidationEvent = await this.parseAaveLiquidationEvent(log, true);
        if (liquidationEvent) {
          events.push(liquidationEvent);
        }
      }

    } catch (error) {
      console.warn(`⚠️ Could not get Aave liquidation events:`, error);
    }

    return events;
  }

  /**
   * Get Compound liquidation events
   */
  private async getCompoundLiquidationEvents(
    userAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<LiquidationEvent[]> {
    const events: LiquidationEvent[] = [];

    try {
      const currentBlock = await this.blockchainManager.getCurrentBlock();
      const startBlock = fromBlock || Math.max(0, currentBlock - 50000);
      const endBlock = toBlock || currentBlock;

      // Compound liquidations happen on individual cToken contracts
      // We'll check the main Comptroller for liquidation events
      const filter = {
        address: REAL_CONTRACT_ADDRESSES.COMPOUND.COMPTROLLER,
        fromBlock: startBlock,
        toBlock: endBlock,
        topics: [
          this.LIQUIDATION_EVENTS.COMPOUND_LIQUIDATION,
          null,
          this.padAddress(userAddress) // borrower being liquidated
        ]
      };

      const logs = await this.blockchainManager.getLogs(filter);

      for (const log of logs) {
        const liquidationEvent = await this.parseCompoundLiquidationEvent(log);
        if (liquidationEvent) {
          events.push(liquidationEvent);
        }
      }

    } catch (error) {
      console.warn(`⚠️ Could not get Compound liquidation events:`, error);
    }

    return events;
  }

  /**
   * Get MakerDAO liquidation events
   */
  private async getMakerLiquidationEvents(
    userAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<LiquidationEvent[]> {
    const events: LiquidationEvent[] = [];

    try {
      // MakerDAO liquidations are more complex and involve multiple contracts
      // For now, we'll implement a basic version
      console.log(`📝 MakerDAO liquidation analysis not fully implemented yet`);

    } catch (error) {
      console.warn(`⚠️ Could not get MakerDAO liquidation events:`, error);
    }

    return events;
  }

  /**
   * Parse Aave liquidation event
   */
  private async parseAaveLiquidationEvent(log: any, isLiquidator = false): Promise<LiquidationEvent | null> {
    try {
      const blockNumber = parseInt(log.blockNumber, 16);
      const block = await this.blockchainManager.getBlockByNumber(blockNumber);

      // Decode the log data (simplified - would use actual ABI decoding)
      const collateralAsset = log.topics[1];
      const debtAsset = log.topics[2];
      const user = log.topics[3];
      
      // Parse amounts from log data (simplified)
      const debtToCover = this.parseHexAmount(log.data.slice(0, 66));
      const liquidatedCollateralAmount = this.parseHexAmount(log.data.slice(66, 132));

      return {
        type: isLiquidator ? 'liquidator' : 'liquidated',
        protocol: 'aave_v3',
        collateralAsset: collateralAsset,
        debtAsset: debtAsset,
        liquidatedAmount: debtToCover,
        collateralAmount: liquidatedCollateralAmount,
        timestamp: block.timestamp,
        transactionHash: log.transactionHash,
        blockNumber
      };

    } catch (error) {
      console.warn(`⚠️ Could not parse Aave liquidation event:`, error);
      return null;
    }
  }

  /**
   * Parse Compound liquidation event
   */
  private async parseCompoundLiquidationEvent(log: any): Promise<LiquidationEvent | null> {
    try {
      const blockNumber = parseInt(log.blockNumber, 16);
      const block = await this.blockchainManager.getBlockByNumber(blockNumber);

      // Simplified parsing - would use actual ABI decoding
      const liquidator = log.topics[1];
      const borrower = log.topics[2];
      const repayAmount = this.parseHexAmount(log.data.slice(0, 66));
      const cTokenCollateral = log.data.slice(66, 132);
      const seizeTokens = this.parseHexAmount(log.data.slice(132, 198));

      return {
        type: 'liquidated',
        protocol: 'compound',
        collateralAsset: cTokenCollateral,
        debtAsset: 'unknown', // Would need to decode from cToken
        liquidatedAmount: repayAmount,
        collateralAmount: seizeTokens,
        timestamp: block.timestamp,
        transactionHash: log.transactionHash,
        blockNumber
      };

    } catch (error) {
      console.warn(`⚠️ Could not parse Compound liquidation event:`, error);
      return null;
    }
  }

  /**
   * Calculate overall risk score combining all behavior patterns
   */
  private calculateOverallRiskScore(
    transactionPattern: TransactionPattern,
    stakingBehavior: StakingBehavior,
    liquidationBehavior: LiquidationBehavior
  ): number {
    let riskScore = 0;

    // Transaction pattern risk (30% weight)
    const transactionRisk = Math.max(0, 1 - transactionPattern.behaviorScore);
    riskScore += transactionRisk * 0.3;

    // Staking behavior risk (20% weight)
    const stakingRisk = this.calculateStakingRisk(stakingBehavior);
    riskScore += stakingRisk * 0.2;

    // Liquidation risk (50% weight - most important)
    riskScore += liquidationBehavior.liquidationRiskScore * 0.5;

    return Math.min(1, riskScore);
  }

  /**
   * Calculate creditworthiness score (0-1000 scale)
   */
  private calculateCreditworthiness(
    transactionPattern: TransactionPattern,
    stakingBehavior: StakingBehavior,
    liquidationBehavior: LiquidationBehavior,
    overallRiskScore: number
  ): number {
    let score = 500; // Base score

    // Transaction activity bonus
    if (transactionPattern.totalTransactions > 100) {
      score += 100;
    } else if (transactionPattern.totalTransactions > 50) {
      score += 50;
    }

    // Protocol diversity bonus
    const protocolCount = transactionPattern.protocolUsage.size;
    score += Math.min(100, protocolCount * 20);

    // Staking behavior bonus
    if (stakingBehavior.stakingScore > 0.7) {
      score += 150;
    } else if (stakingBehavior.stakingScore > 0.4) {
      score += 75;
    }

    // Liquidation penalty
    if (liquidationBehavior.totalLiquidations > 0) {
      score -= liquidationBehavior.totalLiquidations * 100;
    }

    // Overall risk penalty
    score -= overallRiskScore * 200;

    return Math.max(0, Math.min(1000, Math.round(score)));
  }

  /**
   * Generate behavior tags based on analysis
   */
  private generateBehaviorTags(
    transactionPattern: TransactionPattern,
    stakingBehavior: StakingBehavior,
    liquidationBehavior: LiquidationBehavior
  ): string[] {
    const tags: string[] = [];

    // Transaction-based tags
    if (transactionPattern.totalTransactions > 1000) {
      tags.push('high_activity');
    } else if (transactionPattern.totalTransactions > 100) {
      tags.push('active_user');
    } else if (transactionPattern.totalTransactions < 10) {
      tags.push('low_activity');
    }

    // Protocol usage tags
    if (transactionPattern.protocolUsage.size > 5) {
      tags.push('protocol_diverse');
    }
    if (transactionPattern.protocolUsage.has('uniswap')) {
      tags.push('dex_user');
    }
    if (transactionPattern.protocolUsage.has('aave') || transactionPattern.protocolUsage.has('compound')) {
      tags.push('lending_user');
    }

    // Staking tags
    if (stakingBehavior.stakingScore > 0.7) {
      tags.push('experienced_staker');
    } else if (stakingBehavior.stakingScore > 0.3) {
      tags.push('casual_staker');
    }

    if (stakingBehavior.stakingProtocols.size > 2) {
      tags.push('multi_protocol_staker');
    }

    // Risk tags
    if (liquidationBehavior.totalLiquidations > 0) {
      tags.push('liquidation_history');
    }
    if (liquidationBehavior.totalLiquidations > 3) {
      tags.push('high_liquidation_risk');
    }

    // Risk level tags
    if (stakingBehavior.riskLevel === 'high') {
      tags.push('high_risk_staker');
    }

    return tags;
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(
    transactionPattern: TransactionPattern,
    stakingBehavior: StakingBehavior,
    liquidationBehavior: LiquidationBehavior
  ): number {
    let completeness = 0;
    let maxScore = 0;

    // Transaction data completeness (40% weight)
    maxScore += 0.4;
    if (transactionPattern.totalTransactions > 0) {
      completeness += 0.4;
    }

    // Staking data completeness (30% weight)
    maxScore += 0.3;
    if (stakingBehavior.stakingHistory.length > 0) {
      completeness += 0.3;
    }

    // Liquidation data completeness (30% weight)
    maxScore += 0.3;
    completeness += 0.3; // Always complete (even if no liquidations)

    return completeness / maxScore;
  }

  // Helper methods for staking analysis

  private aggregateStakingProtocolData(
    protocol: string,
    contractAddress: string,
    events: StakingEvent[]
  ): StakingProtocolData {
    let totalStaked = BigInt(0);
    let totalRewards = BigInt(0);
    let activeStakes = 0;
    let firstStakeTimestamp = Number.MAX_SAFE_INTEGER;
    let lastActivityTimestamp = 0;

    for (const event of events) {
      if (event.type === 'stake') {
        totalStaked += BigInt(event.amount);
        activeStakes++;
      } else if (event.type === 'claim_rewards') {
        totalRewards += BigInt(event.amount);
      }

      firstStakeTimestamp = Math.min(firstStakeTimestamp, event.timestamp);
      lastActivityTimestamp = Math.max(lastActivityTimestamp, event.timestamp);
    }

    return {
      protocol,
      contractAddress,
      totalStaked: totalStaked.toString(),
      totalRewards: totalRewards.toString(),
      activeStakes,
      firstStakeTimestamp: firstStakeTimestamp === Number.MAX_SAFE_INTEGER ? 0 : firstStakeTimestamp,
      lastActivityTimestamp
    };
  }

  private calculateAverageStakingDuration(events: StakingEvent[]): number {
    // Simplified calculation - would need to match stake/unstake pairs
    const stakeEvents = events.filter(e => e.type === 'stake');
    const unstakeEvents = events.filter(e => e.type === 'unstake');

    if (stakeEvents.length === 0) return 0;

    // Simple heuristic: average time between first stake and last activity
    const firstStake = Math.min(...stakeEvents.map(e => e.timestamp));
    const lastActivity = Math.max(...events.map(e => e.timestamp));

    return (lastActivity - firstStake) / (1000 * 60 * 60 * 24); // Convert to days
  }

  private calculateStakingScore(
    events: StakingEvent[],
    protocols: Map<string, StakingProtocolData>,
    averageDuration: number
  ): number {
    let score = 0;

    // Base score for having staking activity
    if (events.length > 0) {
      score += 0.3;
    }

    // Protocol diversity bonus
    score += Math.min(0.3, protocols.size * 0.1);

    // Duration bonus
    if (averageDuration > 365) { // > 1 year
      score += 0.2;
    } else if (averageDuration > 90) { // > 3 months
      score += 0.1;
    }

    // Activity consistency bonus
    const recentActivity = events.some(e => 
      Date.now() - e.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );
    if (recentActivity) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private determineStakingRiskLevel(events: StakingEvent[], score: number): 'low' | 'medium' | 'high' {
    // Check for slashing events
    const hasSlashing = events.some(e => e.type === 'slash');
    if (hasSlashing) return 'high';

    // Check for frequent unstaking (might indicate panic behavior)
    const unstakeEvents = events.filter(e => e.type === 'unstake');
    const stakeEvents = events.filter(e => e.type === 'stake');
    
    if (unstakeEvents.length > stakeEvents.length * 0.8) {
      return 'high';
    }

    // Use score to determine risk
    if (score > 0.7) return 'low';
    if (score > 0.4) return 'medium';
    return 'high';
  }

  private calculateStakingRisk(stakingBehavior: StakingBehavior): number {
    if (stakingBehavior.riskLevel === 'high') return 0.8;
    if (stakingBehavior.riskLevel === 'medium') return 0.5;
    return 0.2;
  }

  // Helper methods for liquidation analysis

  private calculateAverageHealthFactor(events: LiquidationEvent[]): number {
    const healthFactors = events
      .map(e => e.healthFactorBefore)
      .filter(hf => hf !== undefined) as number[];

    if (healthFactors.length === 0) return 2.0; // Default healthy value

    return healthFactors.reduce((sum, hf) => sum + hf, 0) / healthFactors.length;
  }

  private calculateLiquidationRiskScore(events: LiquidationEvent[]): number {
    if (events.length === 0) return 0;

    let riskScore = 0;

    // Base risk for having liquidations
    riskScore += Math.min(0.5, events.length * 0.1);

    // Recent liquidation risk
    const recentLiquidations = events.filter(e => 
      Date.now() - e.timestamp < 90 * 24 * 60 * 60 * 1000 // Last 90 days
    );
    riskScore += recentLiquidations.length * 0.2;

    // Frequency risk
    if (events.length > 5) {
      riskScore += 0.3;
    }

    return Math.min(1, riskScore);
  }

  private analyzeRecoveryPattern(events: LiquidationEvent[]): 'quick' | 'slow' | 'none' {
    if (events.length === 0) return 'none';

    // Sort by timestamp
    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
    
    // Check time between liquidations
    const intervals: number[] = [];
    for (let i = 1; i < sortedEvents.length; i++) {
      intervals.push(sortedEvents[i].timestamp - sortedEvents[i-1].timestamp);
    }

    if (intervals.length === 0) return 'none';

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const avgIntervalDays = avgInterval / (1000 * 60 * 60 * 24);

    if (avgIntervalDays < 30) return 'quick'; // Quick recovery/re-liquidation
    if (avgIntervalDays < 180) return 'slow'; // Slow recovery
    return 'none'; // No clear pattern
  }

  // Utility helper methods

  private padAddress(address: string): string {
    return '0x' + address.slice(2).padStart(64, '0');
  }

  private parseAmountFromLog(log: any): string {
    // Simplified amount parsing - would use proper ABI decoding
    try {
      return this.parseHexAmount(log.data.slice(0, 66));
    } catch {
      return '0';
    }
  }

  private parseHexAmount(hex: string): string {
    try {
      return BigInt(hex).toString();
    } catch {
      return '0';
    }
  }

  private isDepositEvent(signature: string): boolean {
    // ETH2 deposit event signature
    return signature === '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5';
  }

  private isStETHEvent(signature: string): boolean {
    // Lido stETH events (Transfer, Submit, etc.)
    const stethEvents = [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer
      '0x96a25c8ce0baabc1fdefd93e9ed25d8e092a3332f3aa9a41722b5697231d1d1a'  // Submit
    ];
    return stethEvents.includes(signature);
  }

  private getStETHEventType(signature: string): 'stake' | 'unstake' | 'claim_rewards' {
    // Simplified mapping - would need proper event decoding
    if (signature === '0x96a25c8ce0baabc1fdefd93e9ed25d8e092a3332f3aa9a41722b5697231d1d1a') {
      return 'stake'; // Submit event
    }
    return 'claim_rewards'; // Default for other events
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(): {
    totalUsersAnalyzed: number;
    avgCreditworthiness: number;
    avgRiskScore: number;
    stakingParticipation: number;
    liquidationRate: number;
  } {
    // This would track statistics over time
    return {
      totalUsersAnalyzed: 0,
      avgCreditworthiness: 0,
      avgRiskScore: 0,
      stakingParticipation: 0,
      liquidationRate: 0
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    console.log('🔌 User behavior analyzer shut down');
  }
}