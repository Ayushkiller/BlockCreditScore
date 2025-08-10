// Production Environment Configuration for Real Data Integration

import { RealDataProvidersConfig } from "../real-data-providers";

const { getSecretManager } = require('../secret-manager');

export interface ProductionConfig {
  name: string;
  isProduction: boolean;
  realData: RealDataProvidersConfig;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };
  blockchain: {
    defaultNetwork: string;
    confirmations: number;
    gasMultiplier: number;
  };
  cache: {
    ttl: {
      prices: number;
      transactions: number;
      marketData: number;
    };
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    metricsInterval: number;
    alerting: {
      enabled: boolean;
      thresholds: {
        errorRate: number;
        responseTime: number;
        failoverCount: number;
      };
    };
  };
  features: {
    realDataEnabled: boolean;
    mockFallback: boolean;
    healthChecks: boolean;
    autoFailover: boolean;
  };
  security: {
    encryptSecrets: boolean;
    rotateKeys: boolean;
    auditLog: boolean;
  };
}

function getProductionConfig(): ProductionConfig {
  const secretManager = getSecretManager();
  
  return {
    name: 'production',
    isProduction: true,
    realData: {
      ethereum: {
        rpcProviders: [
          {
            name: 'Alchemy',
            rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${secretManager.getSecret('ALCHEMY_API_KEY')}`,
            wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${secretManager.getSecret('ALCHEMY_API_KEY')}`,
            apiKey: secretManager.getSecret('ALCHEMY_API_KEY') || '',
            priority: 1,
            rateLimit: 300,
            timeout: 5000, // Strict timeout for production
            isHealthy: true,
            lastHealthCheck: 0
          },
          {
            name: 'Infura',
            rpcUrl: `https://mainnet.infura.io/v3/${secretManager.getSecret('INFURA_API_KEY')}`,
            wsUrl: `wss://mainnet.infura.io/ws/v3/${secretManager.getSecret('INFURA_API_KEY')}`,
            apiKey: secretManager.getSecret('INFURA_API_KEY') || '',
            priority: 2,
            rateLimit: 100,
            timeout: 5000,
            isHealthy: true,
            lastHealthCheck: 0
          },
          {
            name: 'QuickNode',
            rpcUrl: secretManager.getSecret('QUICKNODE_RPC_URL') || '',
            wsUrl: secretManager.getSecret('QUICKNODE_WS_URL') || '',
            apiKey: secretManager.getSecret('QUICKNODE_API_KEY') || '',
            priority: 3,
            rateLimit: 200,
            timeout: 5000,
            isHealthy: true,
            lastHealthCheck: 0
          }
        ],
        fallbackProviders: [
          {
            name: 'Ankr',
            rpcUrl: `https://rpc.ankr.com/eth/${secretManager.getSecret('ANKR_API_KEY')}`,
            wsUrl: `wss://rpc.ankr.com/eth/ws/${secretManager.getSecret('ANKR_API_KEY')}`,
            apiKey: secretManager.getSecret('ANKR_API_KEY') || '',
            priority: 4,
            rateLimit: 50,
            timeout: 8000,
            isHealthy: true,
            lastHealthCheck: 0
          },
          {
            name: 'Moralis',
            rpcUrl: secretManager.getSecret('MORALIS_RPC_URL') || '',
            wsUrl: secretManager.getSecret('MORALIS_WS_URL') || '',
            apiKey: secretManager.getSecret('MORALIS_API_KEY') || '',
            priority: 5,
            rateLimit: 25,
            timeout: 10000,
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
            apiKey: secretManager.getSecret('COINGECKO_API_KEY'),
            rateLimit: 500, // Pro plan
            timeout: 3000,
            priority: 1,
            isHealthy: true,
            lastHealthCheck: 0
          },
          {
            name: 'CoinMarketCap',
            baseUrl: 'https://pro-api.coinmarketcap.com/v1',
            apiKey: secretManager.getSecret('COINMARKETCAP_API_KEY'),
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
            apiKey: secretManager.getSecret('DEFIPULSE_API_KEY'),
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
        maxFailuresBeforeSwitch: 2, // Quick failover in production
        cooldownMs: 180000 // 3 minutes
      }
    },
    api: {
      baseUrl: process.env.PROD_API_URL || 'https://api.cryptovault.com',
      timeout: 10000, // Strict timeout
      retries: 5,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10000 // Production limits
      }
    },
    blockchain: {
      defaultNetwork: 'ethereum',
      confirmations: 3, // More confirmations for production
      gasMultiplier: 1.2 // Higher gas multiplier for reliability
    },
    cache: {
      ttl: {
        prices: 30, // 30 seconds - fresh data for production
        transactions: 86400, // 24 hours
        marketData: 180 // 3 minutes
      },
      maxSize: 10000 // Larger cache for production
    },
    monitoring: {
      enabled: true,
      logLevel: 'info',
      metricsInterval: 30000, // 30 seconds
      alerting: {
        enabled: true,
        thresholds: {
          errorRate: 0.05, // 5% error rate threshold
          responseTime: 5000, // 5 second response time threshold
          failoverCount: 3 // Alert after 3 failovers in an hour
        }
      }
    },
    features: {
      realDataEnabled: true, // Always enabled in production
      mockFallback: false, // No mock data in production
      healthChecks: true,
      autoFailover: true
    },
    security: {
      encryptSecrets: true,
      rotateKeys: true,
      auditLog: true
    }
  };
}

function validateProductionConfig(config: ProductionConfig): void {
  const secretManager = getSecretManager();
  
  // Strict validation for production
  const validation = secretManager.validateRealDataSecrets();
  
  if (!validation.valid) {
    throw new Error(`Production deployment requires all API keys: ${validation.missing.join(', ')}`);
  }

  // Validate that we have multiple RPC providers for redundancy
  const validRpcProviders = config.realData.ethereum.rpcProviders.filter(
    provider => provider.apiKey
  );

  if (validRpcProviders.length < 2) {
    throw new Error('Production requires at least 2 RPC providers for redundancy');
  }

  // Validate that we have multiple price providers
  if (config.realData.marketData.priceProviders.length < 2) {
    console.warn('Warning: Production should have multiple price providers for redundancy');
  }

  // Validate required environment variables
  const requiredEnvVars = [
    'PROD_API_URL',
    'ENCRYPTION_KEY',
    'JWT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }

  // Validate monitoring configuration
  if (!config.monitoring.enabled) {
    throw new Error('Monitoring must be enabled in production');
  }

  // Validate security settings
  if (!config.security.encryptSecrets) {
    throw new Error('Secret encryption must be enabled in production');
  }

  console.log('Production configuration validated successfully');
}

module.exports = {
  getProductionConfig,
  validateProductionConfig
};