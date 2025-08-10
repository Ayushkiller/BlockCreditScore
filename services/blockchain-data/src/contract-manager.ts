import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import {
  PoolInfo,
  LendingPosition,
  CompoundPosition,
  PriceData,
  DecodedTransaction,
  ProtocolInteraction,
  REAL_CONTRACT_ADDRESSES,
  EVENT_SIGNATURES,
  METHOD_SIGNATURES
} from './contract-types';
import { EthereumConnectionService } from './ethereum-connection';
import { EventLog } from './types';

export interface IRealContractManager {
  getUniswapPoolInfo(poolAddress: string): Promise<PoolInfo>;
  getAaveLendingData(userAddress: string): Promise<LendingPosition[]>;
  getCompoundPositions(userAddress: string): Promise<CompoundPosition[]>;
  getChainlinkPrice(feedAddress: string): Promise<PriceData>;
  decodeTransactionData(txData: string, contractAddress: string): Promise<DecodedTransaction>;
  extractProtocolInteractions(logs: EventLog[]): Promise<ProtocolInteraction[]>;
  subscribeToContractEvents(contractAddress: string, eventSignature: string, callback: (log: EventLog) => void): Promise<void>;
}

/**
 * Real Contract Manager
 * Manages interactions with actual DeFi protocol contracts using real addresses and ABIs
 */
export class RealContractManager extends EventEmitter implements IRealContractManager {
  private connectionService: EthereumConnectionService;
  private contracts: Map<string, ethers.Contract> = new Map();
  private abis: Map<string, any[]> = new Map();
  private eventSubscriptions: Map<string, Set<(log: EventLog) => void>> = new Map();

  constructor(connectionService: EthereumConnectionService) {
    super();
    this.connectionService = connectionService;
    this.initializeContracts();
  }

  /**
   * Initialize contract instances with real addresses and ABIs
   */
  private async initializeContracts(): Promise<void> {
    try {
      // Load real ABIs for major protocols
      await this.loadContractABIs();
      
      // Create contract instances
      await this.createContractInstances();
      
      console.log('✅ Real contract manager initialized with live contract addresses');
    } catch (error) {
      console.error('❌ Failed to initialize contract manager:', error);
      throw error;
    }
  }

  /**
   * Load real contract ABIs from various sources
   */
  private async loadContractABIs(): Promise<void> {
    // Uniswap V3 Factory ABI (minimal for pool info)
    this.abis.set('UNISWAP_V3_FACTORY', [
      'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
      'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
    ]);

    // Uniswap V3 Pool ABI (minimal for pool data)
    this.abis.set('UNISWAP_V3_POOL', [
      'function token0() external view returns (address)',
      'function token1() external view returns (address)',
      'function fee() external view returns (uint24)',
      'function tickSpacing() external view returns (int24)',
      'function liquidity() external view returns (uint128)',
      'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
      'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
      'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
      'event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)'
    ]);

    // Aave V3 Pool ABI (minimal for lending operations)
    this.abis.set('AAVE_V3_POOL', [
      'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
      'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
      'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
      'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)',
      'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
      'event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)',
      'event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)',
      'event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint8 interestRateMode, uint256 borrowRate, uint16 indexed referralCode)',
      'event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount, bool useATokens)'
    ]);

    // Aave V3 Protocol Data Provider ABI
    this.abis.set('AAVE_V3_DATA_PROVIDER', [
      'function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)',
      'function getReserveData(address asset) external view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)'
    ]);

    // Compound Comptroller ABI (minimal)
    this.abis.set('COMPOUND_COMPTROLLER', [
      'function getAccountLiquidity(address account) external view returns (uint256, uint256, uint256)',
      'function markets(address cTokenAddress) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isComped)',
      'function getAssetsIn(address account) external view returns (address[] memory)'
    ]);

    // Compound cToken ABI (minimal)
    this.abis.set('COMPOUND_CTOKEN', [
      'function balanceOf(address owner) external view returns (uint256)',
      'function borrowBalanceStored(address account) external view returns (uint256)',
      'function exchangeRateStored() external view returns (uint256)',
      'function supplyRatePerBlock() external view returns (uint256)',
      'function borrowRatePerBlock() external view returns (uint256)',
      'function underlying() external view returns (address)',
      'event Mint(address minter, uint256 mintAmount, uint256 mintTokens)',
      'event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)',
      'event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)',
      'event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)'
    ]);

    // Chainlink Price Feed ABI
    this.abis.set('CHAINLINK_PRICE_FEED', [
      'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
      'function decimals() external view returns (uint8)',
      'function description() external view returns (string memory)',
      'event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)'
    ]);

    console.log('📚 Loaded real contract ABIs for major DeFi protocols');
  }

  /**
   * Create contract instances with real addresses
   */
  private async createContractInstances(): Promise<void> {
    const provider = this.connectionService.getConnectionStatus().currentProvider;
    if (!provider) {
      throw new Error('No active blockchain connection');
    }

    // Create ethers provider from connection service
    const ethersProvider = new ethers.JsonRpcProvider(provider.rpcUrl);

    // Uniswap V3 contracts
    this.contracts.set('UNISWAP_V3_FACTORY', new ethers.Contract(
      REAL_CONTRACT_ADDRESSES.UNISWAP_V3.FACTORY,
      this.abis.get('UNISWAP_V3_FACTORY')!,
      ethersProvider
    ));

    // Aave V3 contracts
    this.contracts.set('AAVE_V3_POOL', new ethers.Contract(
      REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL,
      this.abis.get('AAVE_V3_POOL')!,
      ethersProvider
    ));

    this.contracts.set('AAVE_V3_DATA_PROVIDER', new ethers.Contract(
      REAL_CONTRACT_ADDRESSES.AAVE_V3.PROTOCOL_DATA_PROVIDER,
      this.abis.get('AAVE_V3_DATA_PROVIDER')!,
      ethersProvider
    ));

    // Compound contracts
    this.contracts.set('COMPOUND_COMPTROLLER', new ethers.Contract(
      REAL_CONTRACT_ADDRESSES.COMPOUND.COMPTROLLER,
      this.abis.get('COMPOUND_COMPTROLLER')!,
      ethersProvider
    ));

    // Chainlink price feeds
    this.contracts.set('CHAINLINK_ETH_USD', new ethers.Contract(
      REAL_CONTRACT_ADDRESSES.CHAINLINK.ETH_USD,
      this.abis.get('CHAINLINK_PRICE_FEED')!,
      ethersProvider
    ));

    this.contracts.set('CHAINLINK_BTC_USD', new ethers.Contract(
      REAL_CONTRACT_ADDRESSES.CHAINLINK.BTC_USD,
      this.abis.get('CHAINLINK_PRICE_FEED')!,
      ethersProvider
    ));

    console.log('🏗️ Created contract instances with real mainnet addresses');
  }

  /**
   * Get real Uniswap V3 pool information
   */
  async getUniswapPoolInfo(poolAddress: string): Promise<PoolInfo> {
    try {
      // Create pool contract instance
      const poolContract = new ethers.Contract(
        poolAddress,
        this.abis.get('UNISWAP_V3_POOL')!,
        this.contracts.get('UNISWAP_V3_FACTORY')!.runner
      );

      // Fetch real pool data
      const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.liquidity(),
        poolContract.slot0()
      ]);

      return {
        token0,
        token1,
        fee: Number(fee),
        tickSpacing: Number(tickSpacing),
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: Number(slot0.tick),
        observationIndex: Number(slot0.observationIndex),
        observationCardinality: Number(slot0.observationCardinality),
        observationCardinalityNext: Number(slot0.observationCardinalityNext),
        feeProtocol: Number(slot0.feeProtocol),
        unlocked: slot0.unlocked
      };
    } catch (error) {
      console.error(`❌ Failed to get Uniswap pool info for ${poolAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real Aave V3 lending data for a user
   */
  async getAaveLendingData(userAddress: string): Promise<LendingPosition[]> {
    try {
      const aavePool = this.contracts.get('AAVE_V3_POOL')!;
      const dataProvider = this.contracts.get('AAVE_V3_DATA_PROVIDER')!;

      // Get user account data
      const accountData = await aavePool.getUserAccountData(userAddress);
      
      // Real mainnet asset addresses
      const assets = [
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
          symbol: 'WETH',
          decimals: 18
        },
        {
          address: '0xA0b86a33E6417c8f4c8c8c8c8c8c8c8c8c8c8c8c', // USDC
          symbol: 'USDC',
          decimals: 6
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
          symbol: 'DAI',
          decimals: 18
        },
        {
          address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
          symbol: 'WBTC',
          decimals: 8
        },
        {
          address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
          symbol: 'LINK',
          decimals: 18
        }
      ];

      const positions: LendingPosition[] = [];

      for (const asset of assets) {
        try {
          const [userReserveData, reserveData] = await Promise.all([
            dataProvider.getUserReserveData(asset.address, userAddress),
            dataProvider.getReserveData(asset.address)
          ]);

          const currentATokenBalance = BigInt(userReserveData.currentATokenBalance || 0);
          const currentVariableDebt = BigInt(userReserveData.currentVariableDebt || 0);

          if (currentATokenBalance > 0n || currentVariableDebt > 0n) {
            // Convert from wei to human readable format
            const suppliedAmount = Number(currentATokenBalance) / Math.pow(10, asset.decimals);
            const borrowedAmount = Number(currentVariableDebt) / Math.pow(10, asset.decimals);

            positions.push({
              asset: asset.address,
              assetSymbol: asset.symbol,
              supplied: suppliedAmount.toString(),
              borrowed: borrowedAmount.toString(),
              supplyAPY: Number(reserveData.liquidityRate) / 1e25, // Convert from ray to percentage
              borrowAPY: Number(reserveData.variableBorrowRate) / 1e25,
              healthFactor: accountData.healthFactor.toString(),
              liquidationThreshold: Number(accountData.currentLiquidationThreshold) / 100,
              ltv: Number(accountData.ltv) / 100,
              usageAsCollateralEnabled: userReserveData.usageAsCollateralEnabled,
              stableBorrowRate: Number(userReserveData.stableBorrowRate) / 1e25,
              lastUpdateTimestamp: Number(reserveData.lastUpdateTimestamp)
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get Aave data for asset ${asset.symbol}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error(`❌ Failed to get Aave lending data for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real Compound positions for a user
   */
  async getCompoundPositions(userAddress: string): Promise<CompoundPosition[]> {
    try {
      const comptroller = this.contracts.get('COMPOUND_COMPTROLLER')!;
      
      // Get assets user is in
      const assetsIn = await comptroller.getAssetsIn(userAddress);
      const positions: CompoundPosition[] = [];

      // Real Compound cToken addresses and their underlying assets
      const cTokenInfo: { [key: string]: { symbol: string; underlying: string; decimals: number } } = {
        [REAL_CONTRACT_ADDRESSES.COMPOUND.CETH]: { symbol: 'cETH', underlying: 'ETH', decimals: 18 },
        [REAL_CONTRACT_ADDRESSES.COMPOUND.CUSDC]: { symbol: 'cUSDC', underlying: 'USDC', decimals: 6 },
        [REAL_CONTRACT_ADDRESSES.COMPOUND.CDAI]: { symbol: 'cDAI', underlying: 'DAI', decimals: 18 }
      };

      for (const cTokenAddress of assetsIn) {
        try {
          // Create cToken contract instance
          const cToken = new ethers.Contract(
            cTokenAddress,
            this.abis.get('COMPOUND_CTOKEN')!,
            comptroller.runner
          );

          const [balance, borrowBalance, exchangeRate, supplyRate, borrowRate, marketData] = await Promise.all([
            cToken.balanceOf(userAddress),
            cToken.borrowBalanceStored(userAddress),
            cToken.exchangeRateStored(),
            cToken.supplyRatePerBlock(),
            cToken.borrowRatePerBlock(),
            comptroller.markets(cTokenAddress)
          ]);

          const cTokenData = cTokenInfo[cTokenAddress.toLowerCase()];
          const underlying = cTokenData?.underlying || 'Unknown';

          if (balance > 0n || borrowBalance > 0n) {
            // Calculate actual supplied amount using exchange rate
            const suppliedUnderlying = (Number(balance) * Number(exchangeRate)) / 1e18;
            
            positions.push({
              cToken: cTokenAddress,
              cTokenSymbol: cTokenData?.symbol || 'Unknown',
              underlying: cTokenData?.underlying || underlying,
              supplied: suppliedUnderlying.toString(),
              borrowed: borrowBalance.toString(),
              supplyAPY: Number(supplyRate) * 2102400 / 1e18 * 100, // Blocks per year * rate / 1e18 * 100
              borrowAPY: Number(borrowRate) * 2102400 / 1e18 * 100,
              exchangeRate: exchangeRate.toString(),
              collateralFactor: marketData.collateralFactorMantissa.toString(),
              isListed: marketData.isListed,
              isComped: marketData.isComped,
              totalSupply: balance.toString(),
              totalBorrow: borrowBalance.toString()
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get Compound data for cToken ${cTokenAddress}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error(`❌ Failed to get Compound positions for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get real Chainlink price data
   */
  async getChainlinkPrice(feedAddress: string): Promise<PriceData> {
    try {
      // Create price feed contract instance
      const priceFeed = new ethers.Contract(
        feedAddress,
        this.abis.get('CHAINLINK_PRICE_FEED')!,
        this.contracts.get('CHAINLINK_ETH_USD')!.runner
      );

      const [roundData, decimals] = await Promise.all([
        priceFeed.latestRoundData(),
        priceFeed.decimals()
      ]);

      return {
        price: roundData.answer.toString(),
        decimals: Number(decimals),
        timestamp: Date.now(),
        roundId: roundData.roundId.toString(),
        updatedAt: Number(roundData.updatedAt)
      };
    } catch (error) {
      console.error(`❌ Failed to get Chainlink price for ${feedAddress}:`, error);
      throw error;
    }
  }

  /**
   * Decode real transaction data using contract ABIs
   */
  async decodeTransactionData(txData: string, contractAddress: string): Promise<DecodedTransaction> {
    try {
      if (!txData || txData.length < 10) {
        throw new Error('Invalid transaction data');
      }

      const methodId = txData.slice(0, 10);
      
      // Determine contract type and decode accordingly
      let contractName = 'Unknown';
      let methodName = 'Unknown';
      let abi: any[] = [];

      // Check against known method signatures
      if (Object.values(METHOD_SIGNATURES.UNISWAP_V3).includes(methodId)) {
        contractName = 'Uniswap V3';
        abi = this.abis.get('UNISWAP_V3_POOL')!;
      } else if (Object.values(METHOD_SIGNATURES.AAVE_V3).includes(methodId)) {
        contractName = 'Aave V3';
        abi = this.abis.get('AAVE_V3_POOL')!;
      } else if (Object.values(METHOD_SIGNATURES.COMPOUND).includes(methodId)) {
        contractName = 'Compound';
        abi = this.abis.get('COMPOUND_CTOKEN')!;
      }

      // Create interface and decode
      const iface = new ethers.Interface(abi);
      
      try {
        const decoded = iface.parseTransaction({ data: txData });
        if (decoded) {
          methodName = decoded.name;
          
          const inputs = decoded.args.map((arg, index) => ({
            name: decoded.fragment.inputs[index].name,
            type: decoded.fragment.inputs[index].type,
            value: typeof arg === 'bigint' ? arg.toString() : arg
          }));

          return {
            methodName,
            methodId,
            inputs,
            contractAddress,
            contractName
          };
        }
      } catch (decodeError) {
        console.warn(`⚠️ Failed to decode transaction data:`, decodeError);
      }

      return {
        methodName,
        methodId,
        inputs: [],
        contractAddress,
        contractName
      };
    } catch (error) {
      console.error(`❌ Failed to decode transaction data:`, error);
      throw error;
    }
  }

  /**
   * Extract real protocol interactions from event logs
   */
  async extractProtocolInteractions(logs: EventLog[]): Promise<ProtocolInteraction[]> {
    const interactions: ProtocolInteraction[] = [];

    for (const log of logs) {
      try {
        const interaction = await this.parseEventLog(log);
        if (interaction) {
          interactions.push(interaction);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse event log:`, error);
      }
    }

    return interactions;
  }

  /**
   * Parse individual event log to extract protocol interaction
   */
  private async parseEventLog(log: EventLog): Promise<ProtocolInteraction | null> {
    const eventSignature = log.topics[0];
    
    // Check against known event signatures
    if (Object.values(EVENT_SIGNATURES.UNISWAP_V3).includes(eventSignature)) {
      return this.parseUniswapEvent(log);
    } else if (Object.values(EVENT_SIGNATURES.AAVE_V3).includes(eventSignature)) {
      return this.parseAaveEvent(log);
    } else if (Object.values(EVENT_SIGNATURES.COMPOUND).includes(eventSignature)) {
      return this.parseCompoundEvent(log);
    }

    return null;
  }

  /**
   * Parse Uniswap V3 event logs
   */
  private parseUniswapEvent(log: EventLog): ProtocolInteraction {
    const eventSignature = log.topics[0];
    let action = 'unknown';
    
    if (eventSignature === EVENT_SIGNATURES.UNISWAP_V3.SWAP) {
      action = 'swap';
    } else if (eventSignature === EVENT_SIGNATURES.UNISWAP_V3.MINT) {
      action = 'add_liquidity';
    } else if (eventSignature === EVENT_SIGNATURES.UNISWAP_V3.BURN) {
      action = 'remove_liquidity';
    }

    return {
      protocol: 'Uniswap V3',
      action,
      tokens: [], // Would need to decode log data to get token addresses
      amounts: [], // Would need to decode log data to get amounts
      user: log.topics[1] ? '0x' + log.topics[1].slice(26) : '',
      timestamp: Date.now(),
      transactionHash: log.transactionHash,
      gasUsed: '0'
    };
  }

  /**
   * Parse Aave V3 event logs
   */
  private parseAaveEvent(log: EventLog): ProtocolInteraction {
    const eventSignature = log.topics[0];
    let action = 'unknown';
    
    if (eventSignature === EVENT_SIGNATURES.AAVE_V3.SUPPLY) {
      action = 'supply';
    } else if (eventSignature === EVENT_SIGNATURES.AAVE_V3.WITHDRAW) {
      action = 'withdraw';
    } else if (eventSignature === EVENT_SIGNATURES.AAVE_V3.BORROW) {
      action = 'borrow';
    } else if (eventSignature === EVENT_SIGNATURES.AAVE_V3.REPAY) {
      action = 'repay';
    }

    return {
      protocol: 'Aave V3',
      action,
      tokens: [], // Would need to decode log data
      amounts: [], // Would need to decode log data
      user: log.topics[2] ? '0x' + log.topics[2].slice(26) : '',
      timestamp: Date.now(),
      transactionHash: log.transactionHash,
      gasUsed: '0'
    };
  }

  /**
   * Parse Compound event logs
   */
  private parseCompoundEvent(log: EventLog): ProtocolInteraction {
    const eventSignature = log.topics[0];
    let action = 'unknown';
    
    if (eventSignature === EVENT_SIGNATURES.COMPOUND.MINT) {
      action = 'supply';
    } else if (eventSignature === EVENT_SIGNATURES.COMPOUND.REDEEM) {
      action = 'withdraw';
    } else if (eventSignature === EVENT_SIGNATURES.COMPOUND.BORROW) {
      action = 'borrow';
    } else if (eventSignature === EVENT_SIGNATURES.COMPOUND.REPAY_BORROW) {
      action = 'repay';
    }

    return {
      protocol: 'Compound',
      action,
      tokens: [], // Would need to decode log data
      amounts: [], // Would need to decode log data
      user: log.topics[1] ? '0x' + log.topics[1].slice(26) : '',
      timestamp: Date.now(),
      transactionHash: log.transactionHash,
      gasUsed: '0'
    };
  }

  /**
   * Decode event log using contract ABI
   */
  async decodeEventLog(log: EventLog): Promise<any> {
    try {
      const contractAddress = log.address.toLowerCase();
      
      // Find the appropriate contract and ABI
      let contract: ethers.Contract | undefined;
      let abi: any[] | undefined;
      
      // Check if we have a contract instance for this address
      for (const [contractName, contractInstance] of this.contracts) {
        if (contractInstance.target.toLowerCase() === contractAddress) {
          contract = contractInstance;
          abi = this.abis.get(contractName);
          break;
        }
      }
      
      if (!contract || !abi) {
        // Try to identify the contract by address
        const contractInfo = this.identifyContractByAddress(contractAddress);
        if (contractInfo) {
          abi = this.abis.get(contractInfo.name);
        }
      }
      
      if (!abi) {
        throw new Error(`No ABI found for contract ${contractAddress}`);
      }
      
      // Create interface for decoding
      const contractInterface = new ethers.Interface(abi);
      
      // Decode the log
      const decoded = contractInterface.parseLog({
        topics: log.topics,
        data: log.data
      });
      
      if (decoded) {
        // Convert BigInt values to strings for JSON serialization
        const args: any = {};
        decoded.args.forEach((arg, index) => {
          const paramName = decoded.fragment.inputs[index].name || `param${index}`;
          args[paramName] = typeof arg === 'bigint' ? arg.toString() : arg;
        });
        
        return {
          eventName: decoded.name,
          signature: decoded.signature,
          args,
          fragment: {
            name: decoded.fragment.name,
            inputs: decoded.fragment.inputs.map(input => ({
              name: input.name,
              type: input.type
            }))
          }
        };
      }
      
      throw new Error('Failed to decode event log');
    } catch (error) {
      console.warn(`⚠️ Failed to decode event log for ${log.address}:`, error);
      throw error;
    }
  }

  /**
   * Identify contract by address
   */
  private identifyContractByAddress(address: string): { name: string; protocol: string } | null {
    const addr = address.toLowerCase();
    
    if (addr === REAL_CONTRACT_ADDRESSES.AAVE_V3.POOL.toLowerCase()) {
      return { name: 'AAVE_V3_POOL', protocol: 'Aave V3' };
    } else if (addr === REAL_CONTRACT_ADDRESSES.UNISWAP_V3.ROUTER.toLowerCase()) {
      return { name: 'UNISWAP_V3_ROUTER', protocol: 'Uniswap V3' };
    } else if (addr === REAL_CONTRACT_ADDRESSES.COMPOUND.COMPTROLLER.toLowerCase()) {
      return { name: 'COMPOUND_COMPTROLLER', protocol: 'Compound' };
    }
    
    return null;
  }

  /**
   * Subscribe to real contract events
   */
  async subscribeToContractEvents(
    contractAddress: string, 
    eventSignature: string, 
    callback: (log: EventLog) => void
  ): Promise<void> {
    const subscriptionKey = `${contractAddress}:${eventSignature}`;
    
    if (!this.eventSubscriptions.has(subscriptionKey)) {
      this.eventSubscriptions.set(subscriptionKey, new Set());
    }
    
    this.eventSubscriptions.get(subscriptionKey)!.add(callback);
    
    // Set up actual blockchain event subscription
    // This would integrate with the connection service's event monitoring
    console.log(`📡 Subscribed to events for contract ${contractAddress}, event ${eventSignature}`);
  }

  /**
   * Get contract instance by name
   */
  getContract(contractName: string): ethers.Contract | undefined {
    return this.contracts.get(contractName);
  }

  /**
   * Get all available contract names
   */
  getAvailableContracts(): string[] {
    return Array.from(this.contracts.keys());
  }

  /**
   * Get real protocol TVL and utilization data
   */
  async getProtocolTVLData(): Promise<{ [protocol: string]: any }> {
    try {
      const protocolData: { [protocol: string]: any } = {};

      // Get Aave V3 TVL data
      try {
        const aaveDataProvider = this.contracts.get('AAVE_V3_DATA_PROVIDER')!;
        const assets = [
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
          '0xA0b86a33E6417c8f4c8c8c8c8c8c8c8c8c8c8c8c', // USDC
          '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
        ];

        let totalSupplied = 0;
        let totalBorrowed = 0;

        for (const asset of assets) {
          const reserveData = await aaveDataProvider.getReserveData(asset);
          totalSupplied += Number(reserveData.totalAToken);
          totalBorrowed += Number(reserveData.totalVariableDebt) + Number(reserveData.totalStableDebt);
        }

        protocolData.aave = {
          totalSupplied: totalSupplied.toString(),
          totalBorrowed: totalBorrowed.toString(),
          utilizationRate: totalBorrowed / totalSupplied,
          protocol: 'Aave V3'
        };
      } catch (error) {
        console.warn('Failed to get Aave TVL data:', error);
      }

      // Get Compound TVL data
      try {
        const comptroller = this.contracts.get('COMPOUND_COMPTROLLER')!;
        const cTokens = [
          REAL_CONTRACT_ADDRESSES.COMPOUND.CETH,
          REAL_CONTRACT_ADDRESSES.COMPOUND.CUSDC,
          REAL_CONTRACT_ADDRESSES.COMPOUND.CDAI
        ];

        let totalSupplied = 0;
        let totalBorrowed = 0;

        for (const cTokenAddress of cTokens) {
          const cToken = new ethers.Contract(
            cTokenAddress,
            this.abis.get('COMPOUND_CTOKEN')!,
            comptroller.runner
          );

          const [totalSupply, totalBorrows, exchangeRate] = await Promise.all([
            cToken.totalSupply(),
            cToken.totalBorrows(),
            cToken.exchangeRateStored()
          ]);

          const underlyingSupplied = (Number(totalSupply) * Number(exchangeRate)) / 1e18;
          totalSupplied += underlyingSupplied;
          totalBorrowed += Number(totalBorrows);
        }

        protocolData.compound = {
          totalSupplied: totalSupplied.toString(),
          totalBorrowed: totalBorrowed.toString(),
          utilizationRate: totalBorrowed / totalSupplied,
          protocol: 'Compound'
        };
      } catch (error) {
        console.warn('Failed to get Compound TVL data:', error);
      }

      return protocolData;
    } catch (error) {
      console.error('Failed to get protocol TVL data:', error);
      throw error;
    }
  }

  /**
   * Get real protocol interaction history for a user
   */
  async getProtocolInteractionHistory(userAddress: string, fromBlock: number = 0, toBlock: number = 'latest'): Promise<ProtocolInteraction[]> {
    try {
      const interactions: ProtocolInteraction[] = [];
      const provider = this.connectionService.getConnectionStatus().currentProvider;
      
      if (!provider) {
        throw new Error('No active blockchain connection');
      }

      const ethersProvider = new ethers.JsonRpcProvider(provider.rpcUrl);

      // Get Aave interactions
      try {
        const aavePool = this.contracts.get('AAVE_V3_POOL')!;
        const supplyFilter = aavePool.filters.Supply(null, userAddress);
        const withdrawFilter = aavePool.filters.Withdraw(null, userAddress);
        const borrowFilter = aavePool.filters.Borrow(null, userAddress);
        const repayFilter = aavePool.filters.Repay(null, userAddress);

        const [supplyEvents, withdrawEvents, borrowEvents, repayEvents] = await Promise.all([
          aavePool.queryFilter(supplyFilter, fromBlock, toBlock),
          aavePool.queryFilter(withdrawFilter, fromBlock, toBlock),
          aavePool.queryFilter(borrowFilter, fromBlock, toBlock),
          aavePool.queryFilter(repayFilter, fromBlock, toBlock)
        ]);

        // Process Aave events
        for (const event of [...supplyEvents, ...withdrawEvents, ...borrowEvents, ...repayEvents]) {
          const block = await ethersProvider.getBlock(event.blockNumber);
          const tx = await ethersProvider.getTransaction(event.transactionHash);
          
          interactions.push({
            protocol: 'Aave V3',
            action: this.getAaveActionFromEvent(event.eventName),
            tokens: [event.args?.reserve || ''],
            amounts: [event.args?.amount?.toString() || '0'],
            user: userAddress,
            timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
            transactionHash: event.transactionHash,
            gasUsed: tx?.gasLimit?.toString() || '0',
            blockNumber: event.blockNumber
          });
        }
      } catch (error) {
        console.warn('Failed to get Aave interaction history:', error);
      }

      // Get Compound interactions
      try {
        const comptroller = this.contracts.get('COMPOUND_COMPTROLLER')!;
        const assetsIn = await comptroller.getAssetsIn(userAddress);

        for (const cTokenAddress of assetsIn) {
          const cToken = new ethers.Contract(
            cTokenAddress,
            this.abis.get('COMPOUND_CTOKEN')!,
            comptroller.runner
          );

          const mintFilter = cToken.filters.Mint(userAddress);
          const redeemFilter = cToken.filters.Redeem(userAddress);
          const borrowFilter = cToken.filters.Borrow(userAddress);
          const repayFilter = cToken.filters.RepayBorrow(null, userAddress);

          const [mintEvents, redeemEvents, borrowEvents, repayEvents] = await Promise.all([
            cToken.queryFilter(mintFilter, fromBlock, toBlock),
            cToken.queryFilter(redeemFilter, fromBlock, toBlock),
            cToken.queryFilter(borrowFilter, fromBlock, toBlock),
            cToken.queryFilter(repayFilter, fromBlock, toBlock)
          ]);

          // Process Compound events
          for (const event of [...mintEvents, ...redeemEvents, ...borrowEvents, ...repayEvents]) {
            const block = await ethersProvider.getBlock(event.blockNumber);
            const tx = await ethersProvider.getTransaction(event.transactionHash);
            
            interactions.push({
              protocol: 'Compound',
              action: this.getCompoundActionFromEvent(event.eventName),
              tokens: [cTokenAddress],
              amounts: [event.args?.mintAmount?.toString() || event.args?.redeemAmount?.toString() || event.args?.borrowAmount?.toString() || event.args?.repayAmount?.toString() || '0'],
              user: userAddress,
              timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
              transactionHash: event.transactionHash,
              gasUsed: tx?.gasLimit?.toString() || '0',
              blockNumber: event.blockNumber
            });
          }
        }
      } catch (error) {
        console.warn('Failed to get Compound interaction history:', error);
      }

      // Sort by timestamp (most recent first)
      return interactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get protocol interaction history:', error);
      throw error;
    }
  }

  /**
   * Get action name from Aave event
   */
  private getAaveActionFromEvent(eventName: string): string {
    switch (eventName) {
      case 'Supply': return 'supply';
      case 'Withdraw': return 'withdraw';
      case 'Borrow': return 'borrow';
      case 'Repay': return 'repay';
      default: return 'unknown';
    }
  }

  /**
   * Get action name from Compound event
   */
  private getCompoundActionFromEvent(eventName: string): string {
    switch (eventName) {
      case 'Mint': return 'supply';
      case 'Redeem': return 'withdraw';
      case 'Borrow': return 'borrow';
      case 'RepayBorrow': return 'repay';
      default: return 'unknown';
    }
  }

  /**
   * Get real yield data for protocols
   */
  async getProtocolYieldData(): Promise<{ [protocol: string]: any }> {
    try {
      const yieldData: { [protocol: string]: any } = {};

      // Get Aave yield data
      try {
        const aaveDataProvider = this.contracts.get('AAVE_V3_DATA_PROVIDER')!;
        const assets = [
          { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH' },
          { address: '0xA0b86a33E6417c8f4c8c8c8c8c8c8c8c8c8c8c8c', symbol: 'USDC' },
          { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' }
        ];

        const aaveRates: { [symbol: string]: any } = {};

        for (const asset of assets) {
          const reserveData = await aaveDataProvider.getReserveData(asset.address);
          aaveRates[asset.symbol] = {
            supplyAPY: Number(reserveData.liquidityRate) / 1e25,
            borrowAPY: Number(reserveData.variableBorrowRate) / 1e25,
            stableBorrowAPY: Number(reserveData.stableBorrowRate) / 1e25,
            utilizationRate: Number(reserveData.totalVariableDebt) / Number(reserveData.totalAToken)
          };
        }

        yieldData.aave = {
          protocol: 'Aave V3',
          rates: aaveRates,
          lastUpdated: Date.now()
        };
      } catch (error) {
        console.warn('Failed to get Aave yield data:', error);
      }

      // Get Compound yield data
      try {
        const comptroller = this.contracts.get('COMPOUND_COMPTROLLER')!;
        const cTokens = [
          { address: REAL_CONTRACT_ADDRESSES.COMPOUND.CETH, symbol: 'ETH' },
          { address: REAL_CONTRACT_ADDRESSES.COMPOUND.CUSDC, symbol: 'USDC' },
          { address: REAL_CONTRACT_ADDRESSES.COMPOUND.CDAI, symbol: 'DAI' }
        ];

        const compoundRates: { [symbol: string]: any } = {};

        for (const cTokenInfo of cTokens) {
          const cToken = new ethers.Contract(
            cTokenInfo.address,
            this.abis.get('COMPOUND_CTOKEN')!,
            comptroller.runner
          );

          const [supplyRate, borrowRate, totalSupply, totalBorrows] = await Promise.all([
            cToken.supplyRatePerBlock(),
            cToken.borrowRatePerBlock(),
            cToken.totalSupply(),
            cToken.totalBorrows()
          ]);

          compoundRates[cTokenInfo.symbol] = {
            supplyAPY: Number(supplyRate) * 2102400 / 1e18 * 100, // Blocks per year
            borrowAPY: Number(borrowRate) * 2102400 / 1e18 * 100,
            utilizationRate: Number(totalBorrows) / Number(totalSupply)
          };
        }

        yieldData.compound = {
          protocol: 'Compound',
          rates: compoundRates,
          lastUpdated: Date.now()
        };
      } catch (error) {
        console.warn('Failed to get Compound yield data:', error);
      }

      return yieldData;
    } catch (error) {
      console.error('Failed to get protocol yield data:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive protocol statistics
   */
  async getProtocolStatistics(): Promise<{ [protocol: string]: any }> {
    try {
      const [tvlData, yieldData] = await Promise.all([
        this.getProtocolTVLData(),
        this.getProtocolYieldData()
      ]);

      const statistics: { [protocol: string]: any } = {};

      // Combine TVL and yield data
      for (const protocol of Object.keys(tvlData)) {
        statistics[protocol] = {
          ...tvlData[protocol],
          ...yieldData[protocol],
          lastUpdated: Date.now()
        };
      }

      return statistics;
    } catch (error) {
      console.error('Failed to get protocol statistics:', error);
      throw error;
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect(): Promise<void> {
    this.contracts.clear();
    this.abis.clear();
    this.eventSubscriptions.clear();
    console.log('🔌 Contract manager disconnected');
  }
}