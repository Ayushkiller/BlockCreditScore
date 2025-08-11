// Production Environment Configuration
// Real production-ready configuration with actual API credentials and timeout values

export interface ProductionConfig {
  name: 'production';
  isProduction: true;
  features: {
    realDataEnabled: boolean;
    zkProofs: boolean;
    mlPredictions: boolean;
    socialCredit: boolean;
    gamification: boolean;
    crossChainAggregation: boolean;
  };
  realData: {
    ethereum: {
      rpcProviders: RpcProvider[];
      fallbackProviders: RpcProvider[];
      websocketProviders: WebSocketProvider[];
    };
    marketData: {
      priceProviders: PriceProvider[];
      defiProviders: DefiProvider[];
      sentimentProviders: SentimentProvider[];
    };
    healthCheck: {
      interval: number;
      timeout: number;
      retries: number;
      failureThreshold: number;
    };
    failover: {
      enabled: boolean;
      cooldownMs: number;
      maxFailuresBeforeSwitch: number;
      exponentialBackoff: boolean;
      maxBackoffMs: number;
    };
    retry: {
      maxRetries: number;
      baseDelayMs: number;
      maxDelayMs: number;
      exponentialBackoff: boolean;
      jitterMs: number;
    };
    timeout: {
      rpcCallTimeoutMs: number;
      apiCallTimeoutMs: number;
      websocketTimeoutMs: number;
      blockchainQueryTimeoutMs: number;
    };
    logging: {
      level: 'error' | 'warn' | 'info' | 'debug';
      enableDetailedErrors: boolean;
      enablePerformanceMetrics: boolean;
      enableApiCallLogging: boolean;
      logRetentionDays: number;
    };
  };
  monitoring: {
    enabled: boolean;
    endpoint: string;
    apiKey: string;
    metricsInterval: number;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      failureCount: number;
    };
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    corsOrigins: string[];
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
      skipSuccessfulRequests: boolean;
    };
  };
}

export interface RpcProvider {
  name: string;
  rpcUrl: string;
  wsUrl: string;
  apiKey: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  retries: number;
  isHealthy: boolean;
  lastHealthCheck: number;
  failureCount: number;
  successCount: number;
  averageLatency: number;
  features: string[];
}

export interface WebSocketProvider {
  name: string;
  wsUrl: string;
  apiKey: string;
  priority: number;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  isHealthy: boolean;
  lastHealthCheck: number;
}

export interface PriceProvider {
  name: string;
  baseUrl: string;
  apiKey: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  retries: number;
  isHealthy: boolean;
  lastHealthCheck: number;
  failureCount: number;
  successCount: number;
  averageLatency: number;
  supportedAssets: string[];
  endpoints: {
    currentPrice: string;
    historicalPrice: string;
    priceChange: string;
  };
}

export interface DefiProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  retries: number;
  isHealthy: boolean;
  lastHealthCheck: number;
  failureCount: number;
  successCount: number;
  averageLatency: number;
  supportedProtocols: string[];
  endpoints: {
    tvl: string;
    yields: string;
    protocols: string;
  };
}

export interface SentimentProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  retries: number;
  isHealthy: boolean;
  lastHealthCheck: number;
  failureCount: number;
  successCount: number;
  averageLatency: number;
  endpoints: {
    fearGreed: string;
    sentiment: string;
    social: string;
  };
}

export function getProductionConfig(): ProductionConfig {
  // Validate required environment variables
  const requiredEnvVars = [
    'ALCHEMY_API_KEY',
    'INFURA_API_KEY',
    'COINGECKO_API_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'MONITORING_ENDPOINT',
    'MONITORING_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required production environment variable: ${envVar}`);
    }
  }

  return {
    name: 'production',
    isProduction: true,
    features: {
      realDataEnabled: process.env.REAL_DATA_ENABLED === 'true',
      zkProofs: process.env.ENABLE_ZK_PROOFS === 'true',
      mlPredictions: process.env.ENABLE_ML_PREDICTIONS === 'true',
      socialCredit: process.env.ENABLE_SOCIAL_CREDIT === 'true',
      gamification: process.env.ENABLE_GAMIFICATION === 'true',
      crossChainAggregation: true
    },
    realData: {
      ethereum: {
        rpcProviders: [
          {
            name: 'Alchemy',
            rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            apiKey: process.env.ALCHEMY_API_KEY!,
            priority: 1,
            rateLimit: 300, // requests per second
            timeout: 10000, // 10 seconds
            retries: 3,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            features: ['archive', 'trace', 'debug']
          },
          {
            name: 'Infura',
            rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
            wsUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
            apiKey: process.env.INFURA_API_KEY!,
            priority: 2,
            rateLimit: 100,
            timeout: 12000,
            retries: 3,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            features: ['archive']
          }
        ],
        fallbackProviders: [
          {
            name: 'Ankr',
            rpcUrl: `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY || ''}`,
            wsUrl: `wss://rpc.ankr.com/eth/ws/${process.env.ANKR_API_KEY || ''}`,
            apiKey: process.env.ANKR_API_KEY || '',
            priority: 3,
            rateLimit: 50,
            timeout: 15000,
            retries: 2,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            features: ['basic']
          },
          {
            name: 'QuickNode',
            rpcUrl: process.env.QUICKNODE_RPC_URL || '',
            wsUrl: process.env.QUICKNODE_WS_URL || '',
            apiKey: process.env.QUICKNODE_API_KEY || '',
            priority: 4,
            rateLimit: 200,
            timeout: 8000,
            retries: 3,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            features: ['archive', 'trace', 'debug']
          }
        ],
        websocketProviders: [
          {
            name: 'Alchemy-WS',
            wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            apiKey: process.env.ALCHEMY_API_KEY!,
            priority: 1,
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            heartbeatInterval: 30000,
            isHealthy: true,
            lastHealthCheck: 0
          },
          {
            name: 'Infura-WS',
            wsUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
            apiKey: process.env.INFURA_API_KEY!,
            priority: 2,
            reconnectInterval: 7000,
            maxReconnectAttempts: 8,
            heartbeatInterval: 45000,
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
            apiKey: process.env.COINGECKO_API_KEY!,
            priority: 1,
            rateLimit: 50, // requests per minute for pro plan
            timeout: 8000,
            retries: 3,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            supportedAssets: ['ethereum', 'bitcoin', 'usd-coin', 'tether'],
            endpoints: {
              currentPrice: '/simple/price',
              historicalPrice: '/coins/{id}/history',
              priceChange: '/simple/price'
            }
          },
          {
            name: 'CoinMarketCap',
            baseUrl: 'https://pro-api.coinmarketcap.com/v1',
            apiKey: process.env.COINMARKETCAP_API_KEY || '',
            priority: 2,
            rateLimit: 333, // requests per day for basic plan
            timeout: 10000,
            retries: 2,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            supportedAssets: ['ETH', 'BTC', 'USDC', 'USDT'],
            endpoints: {
              currentPrice: '/cryptocurrency/quotes/latest',
              historicalPrice: '/cryptocurrency/quotes/historical',
              priceChange: '/cryptocurrency/quotes/latest'
            }
          }
        ],
        defiProviders: [
          {
            name: 'DefiLlama',
            baseUrl: 'https://api.llama.fi',
            priority: 1,
            rateLimit: 300, // requests per 5 minutes
            timeout: 12000,
            retries: 3,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            supportedProtocols: ['uniswap', 'aave', 'compound', 'makerdao'],
            endpoints: {
              tvl: '/tvl',
              yields: '/yields',
              protocols: '/protocols'
            }
          },
          {
            name: 'DeFiPulse',
            baseUrl: 'https://data-api.defipulse.com/api/v1',
            apiKey: process.env.DEFIPULSE_API_KEY || '',
            priority: 2,
            rateLimit: 100,
            timeout: 15000,
            retries: 2,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            supportedProtocols: ['uniswap', 'aave', 'compound'],
            endpoints: {
              tvl: '/defipulse/api/GetProjects',
              yields: '/defipulse/api/GetRates',
              protocols: '/defipulse/api/GetProjects'
            }
          }
        ],
        sentimentProviders: [
          {
            name: 'FearGreedIndex',
            baseUrl: 'https://api.alternative.me',
            priority: 1,
            rateLimit: 100, // requests per day
            timeout: 5000,
            retries: 2,
            isHealthy: true,
            lastHealthCheck: 0,
            failureCount: 0,
            successCount: 0,
            averageLatency: 0,
            endpoints: {
              fearGreed: '/fng/',
              sentiment: '/fng/',
              social: '/fng/'
            }
          }
        ]
      },
      healthCheck: {
        interval: 60000, // 1 minute
        timeout: 5000,
        retries: 2,
        failureThreshold: 3
      },
      failover: {
        enabled: true,
        cooldownMs: 300000, // 5 minutes
        maxFailuresBeforeSwitch: 3,
        exponentialBackoff: true,
        maxBackoffMs: 60000 // 1 minute
      },
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        exponentialBackoff: true,
        jitterMs: 500
      },
      timeout: {
        rpcCallTimeoutMs: 10000,
        apiCallTimeoutMs: 8000,
        websocketTimeoutMs: 30000,
        blockchainQueryTimeoutMs: 15000
      },
      logging: {
        level: 'info',
        enableDetailedErrors: true,
        enablePerformanceMetrics: true,
        enableApiCallLogging: true,
        logRetentionDays: 30
      }
    },
    monitoring: {
      enabled: true,
      endpoint: process.env.MONITORING_ENDPOINT!,
      apiKey: process.env.MONITORING_API_KEY!,
      metricsInterval: 60000, // 1 minute
      alertThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 5000, // 5 seconds
        failureCount: 10
      }
    },
    security: {
      jwtSecret: process.env.JWT_SECRET!,
      encryptionKey: process.env.ENCRYPTION_KEY!,
      corsOrigins: (process.env.CORS_ORIGINS || 'https://cryptovault.com,https://app.cryptovault.com').split(','),
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        skipSuccessfulRequests: false
      }
    }
  };
}

export function validateProductionConfig(config: ProductionConfig): void {
  // Validate RPC providers
  if (config.realData.ethereum.rpcProviders.length === 0) {
    throw new Error('At least one RPC provider must be configured for production');
  }

  // Validate API keys
  const rpcProvidersWithoutKeys = config.realData.ethereum.rpcProviders
    .filter(provider => !provider.apiKey);
  
  if (rpcProvidersWithoutKeys.length > 0) {
    throw new Error(`RPC providers missing API keys: ${rpcProvidersWithoutKeys.map(p => p.name).join(', ')}`);
  }

  // Validate price providers
  if (config.realData.marketData.priceProviders.length === 0) {
    throw new Error('At least one price provider must be configured for production');
  }

  const priceProvidersWithoutKeys = config.realData.marketData.priceProviders
    .filter(provider => !provider.apiKey);
  
  if (priceProvidersWithoutKeys.length > 0) {
    throw new Error(`Price providers missing API keys: ${priceProvidersWithoutKeys.map(p => p.name).join(', ')}`);
  }

  // Validate monitoring configuration
  if (!config.monitoring.endpoint || !config.monitoring.apiKey) {
    throw new Error('Monitoring endpoint and API key are required for production');
  }

  // Validate security configuration
  if (!config.security.jwtSecret || config.security.jwtSecret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters long for production');
  }

  if (!config.security.encryptionKey || config.security.encryptionKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters long for production');
  }

  // Validate timeout values are reasonable for production
  if (config.realData.timeout.rpcCallTimeoutMs < 5000) {
    throw new Error('RPC call timeout should be at least 5 seconds for production');
  }

  if (config.realData.timeout.apiCallTimeoutMs < 3000) {
    throw new Error('API call timeout should be at least 3 seconds for production');
  }

  // Validate retry configuration
  if (config.realData.retry.maxRetries < 2) {
    throw new Error('Maximum retries should be at least 2 for production resilience');
  }

  if (config.realData.retry.maxDelayMs < 10000) {
    throw new Error('Maximum retry delay should be at least 10 seconds for production');
  }
}