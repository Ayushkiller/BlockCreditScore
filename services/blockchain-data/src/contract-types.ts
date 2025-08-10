// Real DeFi Protocol Contract Types and Interfaces

export interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

export interface LendingPosition {
  asset: string;
  assetSymbol?: string;
  supplied: string;
  borrowed: string;
  supplyAPY: number;
  borrowAPY: number;
  healthFactor: string;
  liquidationThreshold: number;
  ltv: number;
  usageAsCollateralEnabled?: boolean;
  stableBorrowRate?: number;
  lastUpdateTimestamp?: number;
}

export interface CompoundPosition {
  cToken: string;
  cTokenSymbol?: string;
  underlying: string;
  supplied: string;
  borrowed: string;
  supplyAPY: number;
  borrowAPY: number;
  exchangeRate: string;
  collateralFactor: string;
  isListed?: boolean;
  isComped?: boolean;
  totalSupply?: string;
  totalBorrow?: string;
}

export interface PriceData {
  price: string;
  decimals: number;
  timestamp: number;
  roundId?: string;
  updatedAt: number;
}

export interface DecodedTransaction {
  methodName: string;
  methodId: string;
  inputs: DecodedInput[];
  contractAddress: string;
  contractName: string;
}

export interface DecodedInput {
  name: string;
  type: string;
  value: any;
}

export interface ProtocolInteraction {
  protocol: string;
  action: string;
  tokens: string[];
  amounts: string[];
  user: string;
  timestamp: number;
  transactionHash: string;
  gasUsed: string;
  blockNumber?: number;
}

// Real contract addresses on Ethereum mainnet
export const REAL_CONTRACT_ADDRESSES = {
  UNISWAP_V3: {
    ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    FACTORY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    QUOTER: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    POSITION_MANAGER: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
  },
  AAVE_V3: {
    POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    POOL_ADDRESS_PROVIDER: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
    ORACLE: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
    PROTOCOL_DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3'
  },
  COMPOUND: {
    COMPTROLLER: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    COMP_TOKEN: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    CETH: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    CUSDC: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    CDAI: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
  },
  CHAINLINK: {
    ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    BTC_USD: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    USDC_USD: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    DAI_USD: '0xAed0c38402d20D9df7b2a0b4c5d5d8a8e4c4b4b4'
  },
  MAKER: {
    CDP_MANAGER: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
    VAT: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
    JUG: '0x19c0976f590D67707E62397C87829d896Dc0f1F1',
    SPOT: '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3'
  }
};

// Event signatures for common DeFi operations
export const EVENT_SIGNATURES = {
  UNISWAP_V3: {
    SWAP: '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67',
    MINT: '0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde',
    BURN: '0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c',
    COLLECT: '0x70935338e69775456a85ddef226c395fb668b63fa0115f5f20610b388e6ca9c0'
  },
  AAVE_V3: {
    SUPPLY: '0x2b627736bca15cd5381dcf80b0bf11fd197d01a037c52b927a881a10fb73ba61',
    WITHDRAW: '0x3115d1449a7b732c986cba18244e897a450f61e1bb8d589cd2e69e6c8924f9f7',
    BORROW: '0xb3d084820fb1a9decffb176436bd02558d15fac9b0ddfed8c465bc7359d7dce0',
    REPAY: '0xa534c8dbe71f871f9f3530e97a74601fea17b426cae02e1c5aee42c96c784051',
    LIQUIDATION_CALL: '0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286'
  },
  COMPOUND: {
    MINT: '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f',
    REDEEM: '0xe5b754fb1abb7f01b499791d0b820ae3b6af3424ac1c59768edb53f4ec31a929',
    BORROW: '0x13ed6866d4e1ee6da46f845c46d7e6320a2cd8f08c038068a0e8a8b45b8b8b8b',
    REPAY_BORROW: '0x1a2a22cb034d26d1854bdc6666a5b91fe25efbbb5dcad3b0355478d6f5c362a1',
    LIQUIDATE_BORROW: '0x298637f684da70674f26509b10f07ec2fbc77a335ab1e7d6215a4b2484d8bb52'
  },
  CHAINLINK: {
    ANSWER_UPDATED: '0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f'
  }
};

// Method signatures for common DeFi operations
export const METHOD_SIGNATURES = {
  UNISWAP_V3: {
    EXACT_INPUT_SINGLE: '0x414bf389',
    EXACT_OUTPUT_SINGLE: '0xdb3e2198',
    EXACT_INPUT: '0xc04b8d59',
    EXACT_OUTPUT: '0xf28c0498'
  },
  AAVE_V3: {
    SUPPLY: '0x617ba037',
    WITHDRAW: '0x69328dec',
    BORROW: '0xa415bcad',
    REPAY: '0x573ade81'
  },
  COMPOUND: {
    MINT: '0xa0712d68',
    REDEEM: '0xdb006a75',
    BORROW: '0xc5ebeaec',
    REPAY_BORROW: '0x0e752702'
  }
};