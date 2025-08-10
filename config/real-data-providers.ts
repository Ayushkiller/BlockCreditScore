// Real Data API Provider Configuration with Failover Support
// This configuration supports the Real Data Integration feature

export interface RpcProvider {
  name: string;
  rpcUrl: string;
  wsUrl: string;
  apiKey: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  isHealthy: boolean;
  lastHealthCheck: number;
}

export interface MarketDataProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number;
  timeout: number;
  priority: number;
  isHealthy: boolean;
  lastHealthCheck: number;
}

export interface RealDataProvidersConfig {
  ethereum: {
    rpcProviders: RpcProvider[];
    fallbackProviders: RpcProvider[];
  };
  marketData: {
    priceProviders: MarketDataProvider[];
    defiProviders: MarketDataProvider[];
    sentimentProviders: MarketDataProvider[];
  };
  healthCheck: {
    intervalMs: number;
    timeoutMs: number;
    maxRetries: number;
  };
  failover: {
    enableAutoFailover: boolean;
    maxFailuresBeforeSwitch: number;
    cooldownMs: number;
  };
}

// Real Contract Addresses for Production Use
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
    REWARDS_CONTROLLER: '0x8164Cc65827dcFe994AB23944CBC90e0aa80bFcb'
  },
  COMPOUND: {
    COMPTROLLER: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    COMP_TOKEN: '0xc00e94Cb662C3520282E6f5717214004A7f26888'
  },
  CHAINLINK: {
    ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    BTC_USD: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    USDC_USD: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    DAI_USD: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'
  },
  MAKER: {
    DAI_TOKEN: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    MCD_VAT: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
    MCD_JUG: '0x19c0976f590D67707E62397C87829d896Dc0f1F1'
  }
};

// Development Configuration
const developmentConfig: RealDataProvidersConfig = {
  ethereum: {
    rpcProviders: [
      {
        name: 'Alchemy',
        rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        apiKey: process.env.ALCHEMY_API_KEY || '',
        priority: 1,
        rateLimit: 300, // requests per second
        timeout: 10000,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'Infura',
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        wsUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
        apiKey: process.env.INFURA_API_KEY || '',
        priority: 2,
        rateLimit: 100,
        timeout: 10000,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ],
    fallbackProviders: [
      {
        name: 'Ankr',
        rpcUrl: `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
        wsUrl: `wss://rpc.ankr.com/eth/ws/${process.env.ANKR_API_KEY}`,
        apiKey: process.env.ANKR_API_KEY || '',
        priority: 3,
        rateLimit: 50,
        timeout: 15000,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ]
  },
  marketData: {
    priceProviders: [
      {
        name: 'CoinGecko',
        baseUrl: 'https://api.coingecko.com/api/v3',
        apiKey: process.env.COINGECKO_API_KEY,
        rateLimit: 10, // requests per minute for free tier
        timeout: 5000,
        priority: 1,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'CoinMarketCap',
        baseUrl: 'https://pro-api.coinmarketcap.com/v1',
        apiKey: process.env.COINMARKETCAP_API_KEY,
        rateLimit: 333, // requests per day for basic plan
        timeout: 5000,
        priority: 2,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ],
    defiProviders: [
      {
        name: 'DefiLlama',
        baseUrl: 'https://api.llama.fi',
        rateLimit: 300, // requests per 5 minutes
        timeout: 10000,
        priority: 1,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'DeFiPulse',
        baseUrl: 'https://data-api.defipulse.com/api/v1',
        apiKey: process.env.DEFIPULSE_API_KEY,
        rateLimit: 100,
        timeout: 10000,
        priority: 2,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ],
    sentimentProviders: [
      {
        name: 'FearGreedIndex',
        baseUrl: 'https://api.alternative.me',
        rateLimit: 100, // requests per day
        timeout: 5000,
        priority: 1,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ]
  },
  healthCheck: {
    intervalMs: 60000, // 1 minute
    timeoutMs: 5000,
    maxRetries: 3
  },
  failover: {
    enableAutoFailover: true,
    maxFailuresBeforeSwitch: 3,
    cooldownMs: 300000 // 5 minutes
  }
};

// Production Configuration
const productionConfig: RealDataProvidersConfig = {
  ethereum: {
    rpcProviders: [
      {
        name: 'Alchemy',
        rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        apiKey: process.env.ALCHEMY_API_KEY || '',
        priority: 1,
        rateLimit: 300,
        timeout: 8000,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'Infura',
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        wsUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
        apiKey: process.env.INFURA_API_KEY || '',
        priority: 2,
        rateLimit: 100,
        timeout: 8000,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'QuickNode',
        rpcUrl: process.env.QUICKNODE_RPC_URL || '',
        wsUrl: process.env.QUICKNODE_WS_URL || '',
        apiKey: process.env.QUICKNODE_API_KEY || '',
        priority: 3,
        rateLimit: 200,
        timeout: 8000,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ],
    fallbackProviders: [
      {
        name: 'Ankr',
        rpcUrl: `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
        wsUrl: `wss://rpc.ankr.com/eth/ws/${process.env.ANKR_API_KEY}`,
        apiKey: process.env.ANKR_API_KEY || '',
        priority: 4,
        rateLimit: 50,
        timeout: 12000,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'Moralis',
        rpcUrl: process.env.MORALIS_RPC_URL || '',
        wsUrl: process.env.MORALIS_WS_URL || '',
        apiKey: process.env.MORALIS_API_KEY || '',
        priority: 5,
        rateLimit: 25,
        timeout: 15000,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ]
  },
  marketData: {
    priceProviders: [
      {
        name: 'CoinGecko',
        baseUrl: 'https://api.coingecko.com/api/v3',
        apiKey: process.env.COINGECKO_API_KEY,
        rateLimit: 500, // Pro plan
        timeout: 3000,
        priority: 1,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'CoinMarketCap',
        baseUrl: 'https://pro-api.coinmarketcap.com/v1',
        apiKey: process.env.COINMARKETCAP_API_KEY,
        rateLimit: 10000, // Professional plan
        timeout: 3000,
        priority: 2,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ],
    defiProviders: [
      {
        name: 'DefiLlama',
        baseUrl: 'https://api.llama.fi',
        rateLimit: 300,
        timeout: 5000,
        priority: 1,
        isHealthy: true,
        lastHealthCheck: 0
      },
      {
        name: 'DeFiPulse',
        baseUrl: 'https://data-api.defipulse.com/api/v1',
        apiKey: process.env.DEFIPULSE_API_KEY,
        rateLimit: 1000, // Pro plan
        timeout: 5000,
        priority: 2,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ],
    sentimentProviders: [
      {
        name: 'FearGreedIndex',
        baseUrl: 'https://api.alternative.me',
        rateLimit: 1000, // Pro plan
        timeout: 3000,
        priority: 1,
        isHealthy: true,
        lastHealthCheck: 0
      }
    ]
  },
  healthCheck: {
    intervalMs: 30000, // 30 seconds
    timeoutMs: 3000,
    maxRetries: 5
  },
  failover: {
    enableAutoFailover: true,
    maxFailuresBeforeSwitch: 2,
    cooldownMs: 180000 // 3 minutes
  }
};

function getRealDataProvidersConfig(): RealDataProvidersConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return productionConfig; // Use production config for staging
    case 'development':
    case 'test':
    default:
      return developmentConfig;
  }
}

function validateRealDataConfig(config: RealDataProvidersConfig): void {
  // Validate that at least one RPC provider is configured
  if (config.ethereum.rpcProviders.length === 0) {
    throw new Error('At least one Ethereum RPC provider must be configured');
  }

  // Validate that all primary providers have API keys
  for (const provider of config.ethereum.rpcProviders) {
    if (!provider.apiKey && provider.name !== 'Public') {
      console.warn(`Warning: ${provider.name} RPC provider missing API key`);
    }
  }

  // Validate market data providers
  if (config.marketData.priceProviders.length === 0) {
    throw new Error('At least one price data provider must be configured');
  }

  if (config.marketData.defiProviders.length === 0) {
    throw new Error('At least one DeFi data provider must be configured');
  }
}

export {
  getRealDataProvidersConfig,
  validateRealDataConfig,
  REAL_CONTRACT_ADDRESSES
};