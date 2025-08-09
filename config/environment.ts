// Environment configuration for different deployment stages

export interface EnvironmentConfig {
  name: string;
  isProduction: boolean;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  database: {
    url: string;
    maxConnections: number;
    ssl: boolean;
  };
  redis: {
    url: string;
    maxConnections: number;
  };
  monitoring: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
  features: {
    zkProofs: boolean;
    mlPredictions: boolean;
    socialCredit: boolean;
    gamification: boolean;
    crossChainAggregation: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    corsOrigins: string[];
  };
}

const baseConfig: Partial<EnvironmentConfig> = {
  api: {
    timeout: 30000,
    retries: 3
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  features: {
    zkProofs: true,
    mlPredictions: true,
    socialCredit: true,
    gamification: true,
    crossChainAggregation: true
  }
};

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    ...baseConfig,
    name: 'development',
    isProduction: false,
    api: {
      ...baseConfig.api!,
      baseUrl: process.env.DEV_API_URL || 'http://localhost:3000'
    },
    database: {
      url: process.env.DEV_DATABASE_URL || 'postgresql://localhost:5432/cryptovault_dev',
      maxConnections: 10,
      ssl: false
    },
    redis: {
      url: process.env.DEV_REDIS_URL || 'redis://localhost:6379',
      maxConnections: 5
    },
    monitoring: {
      enabled: false
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
      encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key',
      corsOrigins: ['http://localhost:3000', 'http://localhost:3001']
    }
  } as EnvironmentConfig,

  testing: {
    ...baseConfig,
    name: 'testing',
    isProduction: false,
    api: {
      ...baseConfig.api!,
      baseUrl: process.env.TEST_API_URL || 'http://localhost:3001'
    },
    database: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/cryptovault_test',
      maxConnections: 5,
      ssl: false
    },
    redis: {
      url: process.env.TEST_REDIS_URL || 'redis://localhost:6380',
      maxConnections: 3
    },
    monitoring: {
      enabled: false
    },
    security: {
      jwtSecret: 'test-secret-key',
      encryptionKey: 'test-encryption-key',
      corsOrigins: ['http://localhost:3001']
    }
  } as EnvironmentConfig,

  staging: {
    ...baseConfig,
    name: 'staging',
    isProduction: false,
    api: {
      ...baseConfig.api!,
      baseUrl: process.env.STAGING_API_URL || 'https://staging-api.cryptovault.com'
    },
    database: {
      url: process.env.STAGING_DATABASE_URL!,
      maxConnections: 20,
      ssl: true
    },
    redis: {
      url: process.env.STAGING_REDIS_URL!,
      maxConnections: 10
    },
    monitoring: {
      enabled: true,
      endpoint: process.env.MONITORING_ENDPOINT,
      apiKey: process.env.MONITORING_API_KEY
    },
    security: {
      jwtSecret: process.env.JWT_SECRET!,
      encryptionKey: process.env.ENCRYPTION_KEY!,
      corsOrigins: ['https://staging.cryptovault.com']
    }
  } as EnvironmentConfig,

  production: {
    ...baseConfig,
    name: 'production',
    isProduction: true,
    api: {
      ...baseConfig.api!,
      baseUrl: process.env.PROD_API_URL || 'https://api.cryptovault.com'
    },
    database: {
      url: process.env.DATABASE_URL!,
      maxConnections: 50,
      ssl: true
    },
    redis: {
      url: process.env.REDIS_URL!,
      maxConnections: 25
    },
    monitoring: {
      enabled: true,
      endpoint: process.env.MONITORING_ENDPOINT!,
      apiKey: process.env.MONITORING_API_KEY!
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 1000
    },
    security: {
      jwtSecret: process.env.JWT_SECRET!,
      encryptionKey: process.env.ENCRYPTION_KEY!,
      corsOrigins: ['https://cryptovault.com', 'https://app.cryptovault.com']
    }
  } as EnvironmentConfig
};

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = environments[env];
  
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }
  
  return config;
}

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const requiredFields = [
    'api.baseUrl',
    'database.url',
    'redis.url',
    'security.jwtSecret',
    'security.encryptionKey'
  ];
  
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config as any);
    if (!value) {
      throw new Error(`Missing required environment configuration: ${field}`);
    }
  }
  
  if (config.isProduction) {
    const productionRequiredFields = [
      'monitoring.endpoint',
      'monitoring.apiKey'
    ];
    
    for (const field of productionRequiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], config as any);
      if (!value) {
        throw new Error(`Missing required production configuration: ${field}`);
      }
    }
  }
}