// Development Environment Configuration for Real Data Integration

import { RealDataProvidersConfig } from '../real-data-providers';
const { getSecretManager } = require('../secret-manager');

export interface DevelopmentConfig {
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
  };
  features: {
    realDataEnabled: boolean;
    mockFallback: boolean;
    healthChecks: boolean;
    autoFailover: boolean;
  };
}

function getDevelopmentConfig(): DevelopmentConfig {
  const secretManager = getSecretManager();
  
  return {
    name: 'development',
    isProduction: false,
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
            timeout: 15000, // Longer timeout for development
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
            timeout: 15000,
            isHealthy: true,
            lastHealthCheck: 0
          }
        ],
        fallbackProviders: [
          {
            name: 'Public',
            rpcUrl: 'https://ethereum.publicnode.com',
            wsUrl: 'wss://ethereum.publicnode.com',
            apiKey: '',
            priority: 3,
            rateLimit: 10, // Very limited for public endpoints
            timeout: 20000,
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
            rateLimit: 10, // Free tier limit
            timeout: 10000,
            priority: 1,
            isHealthy: true,
            lastHealthCheck: 0
          }
        ],
        defiProviders: [
          {
            name: 'DefiLlama',
            baseUrl: 'https://api.llama.fi',
            rateLimit: 300,
            timeout: 15000,
            priority: 1,
            isHealthy: true,
            lastHealthCheck: 0
          }
        ],
        sentimentProviders: [
          {
            name: 'FearGreedIndex',
            baseUrl: 'https://api.alternative.me',
            rateLimit: 100,
            timeout: 10000,
            priority: 1,
            isHealthy: true,
            lastHealthCheck: 0
          }
        ]
      },
      healthCheck: {
        intervalMs: 120000, // 2 minutes - less frequent for development
        timeoutMs: 10000,
        maxRetries: 2
      },
      failover: {
        enableAutoFailover: true,
        maxFailuresBeforeSwitch: 5, // More tolerant in development
        cooldownMs: 600000 // 10 minutes
      }
    },
    api: {
      baseUrl: process.env.DEV_API_URL || 'http://localhost:3001',
      timeout: 30000,
      retries: 3,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000 // Higher limit for development
      }
    },
    blockchain: {
      defaultNetwork: 'ethereum',
      confirmations: 1, // Faster for development
      gasMultiplier: 1.1
    },
    cache: {
      ttl: {
        prices: 60, // 1 minute - shorter for development testing
        transactions: 3600, // 1 hour
        marketData: 300 // 5 minutes
      },
      maxSize: 1000
    },
    monitoring: {
      enabled: true,
      logLevel: 'debug',
      metricsInterval: 60000 // 1 minute
    },
    features: {
      realDataEnabled: process.env.REAL_DATA_ENABLED === 'true',
      mockFallback: true, // Allow mock data fallback in development
      healthChecks: true,
      autoFailover: true
    }
  };
}

function validateDevelopmentConfig(config: DevelopmentConfig): void {
  // Validate that at least one RPC provider is available
  const hasValidRpcProvider = config.realData.ethereum.rpcProviders.some(
    provider => provider.apiKey || provider.name === 'Public'
  );

  if (!hasValidRpcProvider) {
    console.warn('Warning: No valid RPC providers configured. Using public endpoints only.');
  }

  // Validate market data providers
  if (config.realData.marketData.priceProviders.length === 0) {
    console.warn('Warning: No price data providers configured. Real data integration may not work.');
  }

  // Check if real data is enabled but no API keys are provided
  if (config.features.realDataEnabled) {
    const secretManager = getSecretManager();
    const validation = secretManager.validateRealDataSecrets();
    
    if (!validation.valid) {
      console.warn('Real data enabled but missing API keys:', validation.missing.join(', '));
      console.warn('Consider setting REAL_DATA_ENABLED=false or providing API keys');
    }
  }
}

module.exports = {
  getDevelopmentConfig,
  validateDevelopmentConfig
};