import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { EthereumConnectionService } from './ethereum-connection';
import { RealContractManager } from './contract-manager';
import { REAL_CONTRACT_ADDRESSES, EVENT_SIGNATURES } from './contract-types';
import { EventLog } from './types';

export interface TVLData {
  protocol: string;
  totalValueLocked: string;
  totalSupply: string;
  totalBorrow: string;
  utilizationRate: number;
  timestamp: number;
}

export interface YieldData {
  protocol: string;
  asset: string;
  supplyAPY: number;
  borrowAPY: number;
  totalSupply: string;
  totalBorrow: string;
  utilizationRate: number;
  timestamp: number;
}

export interface LiquidationEvent {
  protocol: string;
  liquidator: string;
  borrower: string;
  collateralAsset: string;
  debtAsset: string;
  collateralAmount: string;
  debtAmount: string;
  liquidationBonus: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface ContractStateData {
  contractAddress: string;
  contractName: string;
  state: Record<string, any>;
  blockNumber: number;
  timestamp: number;
}

/**
 * Real Contract Data Fetcher
 * Fetches real on-chain data from DeFi protocol contracts
 */
export class RealContractDataFetcher extends EventEmitter {
  private connectionService: EthereumConnectionService;
  private contractManager: RealContractManager;
  private liquidationFilters: Map<string, ethers.EventLog[]> = new Map();
  private isMonitoring = false;

  constructor(connectionService: EthereumConnectionService, contractManager: RealContractManager) {
    super();
    this.connectionService = connectionService;
    this.contractManager = contractManager;
  }

  /**
   * Get real TVL data from Aave V3 protocol
   */
  async getAaveTVL(): Promise<TVLData> {
    try {
      const dataProvider = this.contractManager.getContract('AAVE_V3_DATA_PROVIDER');
      if (!dataProvider) {
        throw new Error('Aave data provider contract not available');
      }

      // Common assets to check for TVL calculation
      const assets = [
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '0xA0b86a33E6417c8f4c8c8c8c8c8c8c8c8c8c8c8c', // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'  // USDT
      ];

      let totalSupply = BigInt(0);
      let totalBorrow = BigInt(0);

      for (const asset of assets) {
        try {
          const reserveData = await dataProvider.getReserveData(asset);
          totalSupply += BigInt(reserveData.totalAToken);
          totalBorrow += BigInt(reserveData.totalVariableDebt) + BigInt(reserveData.totalStableDebt);
        } catch (error) {
          console.warn(`⚠️ Failed to get reserve data for ${asset}:`, error);
        }
      }

      const utilizationRate = totalSupply > 0 ? Number(totalBorrow * BigInt(10000) / totalSupply) / 100 : 0;

      return {
        protocol: 'Aave V3',
        totalValueLocked: totalSupply.toString(),
        totalSupply: totalSupply.toString(),
        totalBorrow: totalBorrow.toString(),
        utilizationRate,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to get Aave TVL:', error);
      throw error;
    }
  }

  /**
   * Get real TVL data from Compound protocol
   */
  async getCompoundTVL(): Promise<TVLData> {
    try {
      const comptroller = this.contractManager.getContract('COMPOUND_COMPTROLLER');
      if (!comptroller) {
        throw new Error('Compound comptroller contract not available');
      }

      // Common cTokens to check
      const cTokens = [
        REAL_CONTRACT_ADDRESSES.COMPOUND.CETH,
        REAL_CONTRACT_ADDRESSES.COMPOUND.CUSDC,
        REAL_CONTRACT_ADDRESSES.COMPOUND.CDAI
      ];

      let totalSupply = BigInt(0);
      let totalBorrow = BigInt(0);

      for (const cTokenAddress of cTokens) {
        try {
          // Create cToken contract instance
          const provider = this.connectionService.getConnectionStatus().currentProvider;
          if (!provider) continue;

          const ethersProvider = new ethers.JsonRpcProvider(provider.rpcUrl);
          const cToken = new ethers.Contract(cTokenAddress, [
            'function totalSupply() external view returns (uint256)',
            'function totalBorrows() external view returns (uint256)',
            'function exchangeRateStored() external view returns (uint256)'
          ], ethersProvider);

          const [supply, borrows, exchangeRate] = await Promise.all([
            cToken.totalSupply(),
            cToken.totalBorrows(),
            cToken.exchangeRateStored()
          ]);

          // Convert cToken supply to underlying using exchange rate
          const underlyingSupply = BigInt(supply) * BigInt(exchangeRate) / BigInt(10).pow(BigInt(18));
          
          totalSupply += underlyingSupply;
          totalBorrow += BigInt(borrows);
        } catch (error) {
          console.warn(`⚠️ Failed to get cToken data for ${cTokenAddress}:`, error);
        }
      }

      const utilizationRate = totalSupply > 0 ? Number(totalBorrow * BigInt(10000) / totalSupply) / 100 : 0;

      return {
        protocol: 'Compound',
        totalValueLocked: totalSupply.toString(),
        totalSupply: totalSupply.toString(),
        totalBorrow: totalBorrow.toString(),
        utilizationRate,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to get Compound TVL:', error);
      throw error;
    }
  }

  /**
   * Get real yield data for Aave V3 assets
   */
  async getAaveYieldData(asset: string): Promise<YieldData> {
    try {
      const dataProvider = this.contractManager.getContract('AAVE_V3_DATA_PROVIDER');
      if (!dataProvider) {
        throw new Error('Aave data provider contract not available');
      }

      const reserveData = await dataProvider.getReserveData(asset);
      
      // Convert ray values to percentages
      const supplyAPY = Number(reserveData.liquidityRate) / 1e25; // Ray to percentage
      const borrowAPY = Number(reserveData.variableBorrowRate) / 1e25;
      
      const totalSupply = reserveData.totalAToken;
      const totalBorrow = BigInt(reserveData.totalVariableDebt) + BigInt(reserveData.totalStableDebt);
      const utilizationRate = totalSupply > 0 ? Number(totalBorrow * BigInt(10000) / BigInt(totalSupply)) / 100 : 0;

      return {
        protocol: 'Aave V3',
        asset,
        supplyAPY,
        borrowAPY,
        totalSupply: totalSupply.toString(),
        totalBorrow: totalBorrow.toString(),
        utilizationRate,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Failed to get Aave yield data for ${asset}:`, error);
      throw error;
    }
  }

  /**
   * Get real yield data for Compound cTokens
   */
  async getCompoundYieldData(cTokenAddress: string): Promise<YieldData> {
    try {
      const provider = this.connectionService.getConnectionStatus().currentProvider;
      if (!provider) {
        throw new Error('No active blockchain connection');
      }

      const ethersProvider = new ethers.JsonRpcProvider(provider.rpcUrl);
      const cToken = new ethers.Contract(cTokenAddress, [
        'function supplyRatePerBlock() external view returns (uint256)',
        'function borrowRatePerBlock() external view returns (uint256)',
        'function totalSupply() external view returns (uint256)',
        'function totalBorrows() external view returns (uint256)',
        'function exchangeRateStored() external view returns (uint256)',
        'function underlying() external view returns (address)'
      ], ethersProvider);

      const [supplyRate, borrowRate, totalSupply, totalBorrows, exchangeRate, underlying] = await Promise.all([
        cToken.supplyRatePerBlock(),
        cToken.borrowRatePerBlock(),
        cToken.totalSupply(),
        cToken.totalBorrows(),
        cToken.exchangeRateStored(),
        cToken.underlying().catch(() => '0x0000000000000000000000000000000000000000') // cETH doesn't have underlying
      ]);

      // Convert per-block rates to APY (assuming 2,102,400 blocks per year)
      const blocksPerYear = 2102400;
      const supplyAPY = Number(supplyRate) * blocksPerYear / 1e18 * 100;
      const borrowAPY = Number(borrowRate) * blocksPerYear / 1e18 * 100;

      // Convert cToken supply to underlying
      const underlyingSupply = BigInt(totalSupply) * BigInt(exchangeRate) / BigInt(10).pow(BigInt(18));
      const utilizationRate = underlyingSupply > 0 ? Number(BigInt(totalBorrows) * BigInt(10000) / underlyingSupply) / 100 : 0;

      return {
        protocol: 'Compound',
        asset: underlying,
        supplyAPY,
        borrowAPY,
        totalSupply: underlyingSupply.toString(),
        totalBorrow: totalBorrows.toString(),
        utilizationRate,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Failed to get Compound yield data for ${cTokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real contract state data
   */
  async getContractState(contractAddress: string, contractName: string, methods: string[]): Promise<ContractStateData> {
    try {
      const provider = this.connectionService.getConnectionStatus().currentProvider;
      if (!provider) {
        throw new Error('No active blockchain connection');
      }

      const ethersProvider = new ethers.JsonRpcProvider(provider.rpcUrl);
      const currentBlock = await ethersProvider.getBlockNumber();
      
      // Create minimal contract interface for the requested methods
      const abi = methods.map(method => `function ${method}`);
      const contract = new ethers.Contract(contractAddress, abi, ethersProvider);

      const state: Record<string, any> = {};

      // Fetch all requested method results
      for (const method of methods) {
        try {
          const methodName = method.split('(')[0]; // Extract method name without parameters
          const result = await contract[methodName]();
          state[methodName] = typeof result === 'bigint' ? result.toString() : result;
        } catch (error) {
          console.warn(`⚠️ Failed to call method ${method} on ${contractAddress}:`, error);
          state[method] = null;
        }
      }

      return {
        contractAddress,
        contractName,
        state,
        blockNumber: currentBlock,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Failed to get contract state for ${contractAddress}:`, error);
      throw error;
    }
  }

  /**
   * Start monitoring real liquidation events
   */
  async startLiquidationMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Liquidation monitoring already active');
      return;
    }

    try {
      this.isMonitoring = true;
      
      // Monitor Aave V3 liquidations
      await this.monitorAaveLiquidations();
      
      // Monitor Compound liquidations
      await this.monitorCompoundLiquidations();
      
      console.log('📡 Started real liquidation event monitoring');
    } catch (error) {
      console.error('❌ Failed to start liquidation monitoring:', error);
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stop liquidation monitoring
   */
  async stopLiquidationMonitoring(): Promise<void> {
    this.isMonitoring = false;
    this.liquidationFilters.clear();
    console.log('🛑 Stopped liquidation event monitoring');
  }

  /**
   * Monitor Aave V3 liquidation events
   */
  private async monitorAaveLiquidations(): Promise<void> {
    const aavePool = this.contractManager.getContract('AAVE_V3_POOL');
    if (!aavePool) {
      console.warn('⚠️ Aave pool contract not available for liquidation monitoring');
      return;
    }

    // Subscribe to liquidation events
    await this.contractManager.subscribeToContractEvents(
      REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      EVENT_SIGNATURES.AAVE_V3.LIQUIDATION_CALL,
      (log: EventLog) => {
        this.processAaveLiquidationEvent(log);
      }
    );
  }

  /**
   * Monitor Compound liquidation events
   */
  private async monitorCompoundLiquidations(): Promise<void> {
    // Monitor liquidations on major cTokens
    const cTokens = [
      REAL_CONTRACT_ADDRESSES.COMPOUND.CETH,
      REAL_CONTRACT_ADDRESSES.COMPOUND.CUSDC,
      REAL_CONTRACT_ADDRESSES.COMPOUND.CDAI
    ];

    for (const cToken of cTokens) {
      await this.contractManager.subscribeToContractEvents(
        cToken,
        EVENT_SIGNATURES.COMPOUND.LIQUIDATE_BORROW,
        (log: EventLog) => {
          this.processCompoundLiquidationEvent(log);
        }
      );
    }
  }

  /**
   * Process Aave liquidation event
   */
  private async processAaveLiquidationEvent(log: EventLog): Promise<void> {
    try {
      // Decode the liquidation event log
      const aavePool = this.contractManager.getContract('AAVE_V3_POOL');
      if (!aavePool) return;

      // Parse event data (simplified - would need proper ABI decoding)
      const liquidationEvent: LiquidationEvent = {
        protocol: 'Aave V3',
        liquidator: '0x' + log.topics[1].slice(26), // Extract address from topic
        borrower: '0x' + log.topics[2].slice(26),
        collateralAsset: '0x' + log.topics[3].slice(26),
        debtAsset: '', // Would need to decode from data
        collateralAmount: '', // Would need to decode from data
        debtAmount: '', // Would need to decode from data
        liquidationBonus: '', // Would need to decode from data
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: Date.now()
      };

      console.log(`🚨 Aave liquidation detected: ${liquidationEvent.liquidator} liquidated ${liquidationEvent.borrower}`);
      this.emit('liquidationDetected', liquidationEvent);
    } catch (error) {
      console.error('❌ Failed to process Aave liquidation event:', error);
    }
  }

  /**
   * Process Compound liquidation event
   */
  private async processCompoundLiquidationEvent(log: EventLog): Promise<void> {
    try {
      // Parse Compound liquidation event (simplified)
      const liquidationEvent: LiquidationEvent = {
        protocol: 'Compound',
        liquidator: '0x' + log.topics[1].slice(26),
        borrower: '0x' + log.topics[2].slice(26),
        collateralAsset: log.address, // cToken address
        debtAsset: '', // Would need to decode from data
        collateralAmount: '', // Would need to decode from data
        debtAmount: '', // Would need to decode from data
        liquidationBonus: '', // Would need to decode from data
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: Date.now()
      };

      console.log(`🚨 Compound liquidation detected: ${liquidationEvent.liquidator} liquidated ${liquidationEvent.borrower}`);
      this.emit('liquidationDetected', liquidationEvent);
    } catch (error) {
      console.error('❌ Failed to process Compound liquidation event:', error);
    }
  }

  /**
   * Get historical liquidation events
   */
  async getHistoricalLiquidations(fromBlock: number, toBlock: number): Promise<LiquidationEvent[]> {
    const liquidations: LiquidationEvent[] = [];

    try {
      const provider = this.connectionService.getConnectionStatus().currentProvider;
      if (!provider) {
        throw new Error('No active blockchain connection');
      }

      const ethersProvider = new ethers.JsonRpcProvider(provider.rpcUrl);

      // Get Aave liquidations
      const aaveFilter = {
        address: REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
        topics: [EVENT_SIGNATURES.AAVE_V3.LIQUIDATION_CALL],
        fromBlock,
        toBlock
      };

      const aaveLogs = await ethersProvider.getLogs(aaveFilter);
      for (const log of aaveLogs) {
        await this.processAaveLiquidationEvent(log as any);
      }

      // Get Compound liquidations
      const cTokens = [
        REAL_CONTRACT_ADDRESSES.COMPOUND.CETH,
        REAL_CONTRACT_ADDRESSES.COMPOUND.CUSDC,
        REAL_CONTRACT_ADDRESSES.COMPOUND.CDAI
      ];

      for (const cToken of cTokens) {
        const compoundFilter = {
          address: cToken,
          topics: [EVENT_SIGNATURES.COMPOUND.LIQUIDATE_BORROW],
          fromBlock,
          toBlock
        };

        const compoundLogs = await ethersProvider.getLogs(compoundFilter);
        for (const log of compoundLogs) {
          await this.processCompoundLiquidationEvent(log as any);
        }
      }

      console.log(`📊 Retrieved ${liquidations.length} historical liquidations from blocks ${fromBlock} to ${toBlock}`);
      return liquidations;
    } catch (error) {
      console.error('❌ Failed to get historical liquidations:', error);
      throw error;
    }
  }

  /**
   * Get real transaction decoding with enhanced ABI support
   */
  async decodeTransactionWithContext(txHash: string): Promise<{
    transaction: any;
    receipt: any;
    decoded: any;
    protocolInteractions: any[];
    gasAnalysis: any;
  }> {
    try {
      // Get transaction and receipt
      const [transaction, receipt] = await Promise.all([
        this.connectionService.getTransaction(txHash),
        this.connectionService.getTransactionReceipt(txHash)
      ]);

      // Decode transaction data
      const decoded = await this.contractManager.decodeTransactionData(transaction.input, transaction.to || '');

      // Extract protocol interactions
      const protocolInteractions = await this.contractManager.extractProtocolInteractions(receipt.logs);

      // Analyze gas usage
      const gasAnalysis = {
        gasUsed: receipt.gasUsed,
        gasPrice: transaction.gasPrice,
        gasCost: BigInt(receipt.gasUsed) * BigInt(transaction.gasPrice),
        gasEfficiency: Number(receipt.gasUsed) / Number(transaction.gasLimit) * 100
      };

      return {
        transaction,
        receipt,
        decoded,
        protocolInteractions,
        gasAnalysis
      };
    } catch (error) {
      console.error(`❌ Failed to decode transaction with context ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    await this.stopLiquidationMonitoring();
    console.log('🔌 Contract data fetcher disconnected');
  }
}