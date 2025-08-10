// Main Real Data Configuration Manager
// Unified interface for accessing real data integration configuration

const { getDevelopmentConfig, validateDevelopmentConfig } = require('./environments/development');
const { getProductionConfig, validateProductionConfig } = require('./environments/production');
const { getSecretManager, validateEnvironmentSecrets } = require('./secret-manager');
const { getRealDataProvidersConfig, validateRealDataConfig, REAL_CONTRACT_ADDRESSES } = require('./real-data-providers');

import { DevelopmentConfig } from './environments/development';
import { ProductionConfig } from './environments/production';

export type RealDataConfig = DevelopmentConfig | ProductionConfig;

export interface ConfigurationStatus {
  environment: string;
  realDataEnabled: boolean;
  providersConfigured: {
    rpc: number;
    fallback: number;
    price: number;
    defi: number;
    sentiment: number;
  };
  secretsStatus: {
    valid: boolean;
    missing: string[];
    warnings: string[];
  };
  healthStatus: {
    lastCheck: number;
    allHealthy: boolean;
    unhealthyProviders: string[];
  };
}

class RealDataConfigManager {
  private config: RealDataConfig | null = null;
  private environment: string;
  private initialized: boolean = false;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  public async initialize(): Promise<void> {
    try {
      // Validate environment secrets first
      validateEnvironmentSecrets(this.environment);

      // Load appropriate configuration
      this.config = this.loadEnvironmentConfig();

      // Validate the configuration
      this.validateConfiguration();

      // Validate real data providers
      validateRealDataConfig(this.config.realData);

      this.initialized = true;
      console.log(`Real data configuration initialized for ${this.environment} environment`);
    } catch (error) {
      console.error('Failed to initialize real data configuration:', error);
      throw error;
    }
  }

  private loadEnvironmentConfig(): RealDataConfig {
    switch (this.environment) {
      case 'production':
      case 'staging':
        return getProductionConfig();
      case 'development':
      case 'test':
      default:
        return getDevelopmentConfig();
    }
  }

  private validateConfiguration(): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    if (this.config.isProduction) {
      validateProductionConfig(this.config as ProductionConfig);
    } else {
      validateDevelopmentConfig(this.config as DevelopmentConfig);
    }
  }

  public getConfig(): RealDataConfig {
    if (!this.initialized || !this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }

  public getRpcProviders() {
    const config = this.getConfig();
    return {
      primary: config.realData.ethereum.rpcProviders,
      fallback: config.realData.ethereum.fallbackProviders
    };
  }

  public getMarketDataProviders() {
    const config = this.getConfig();
    return config.realData.marketData;
  }

  public getContractAddresses() {
    return REAL_CONTRACT_ADDRESSES;
  }

  public isRealDataEnabled(): boolean {
    const config = this.getConfig();
    return config.features.realDataEnabled;
  }

  public getHealthCheckConfig() {
    const config = this.getConfig();
    return config.realData.healthCheck;
  }

  public getFailoverConfig() {
    const config = this.getConfig();
    return config.realData.failover;
  }

  public async getConfigurationStatus(): Promise<ConfigurationStatus> {
    const config = this.getConfig();
    const secretManager = getSecretManager();
    const secretsStatus = secretManager.validateRealDataSecrets();

    return {
      environment: this.environment,
      realDataEnabled: config.features.realDataEnabled,
      providersConfigured: {
        rpc: config.realData.ethereum.rpcProviders.length,
        fallback: config.realData.ethereum.fallbackProviders.length,
        price: config.realData.marketData.priceProviders.length,
        defi: config.realData.marketData.defiProviders.length,
        sentiment: config.realData.marketData.sentimentProviders.length
      },
      secretsStatus,
      healthStatus: {
        lastCheck: Date.now(),
        allHealthy: true, // Will be updated by health check service
        unhealthyProviders: []
      }
    };
  }

  public async updateProviderHealth(providerName: string, isHealthy: boolean): Promise<void> {
    const config = this.getConfig();
    
    // Update RPC providers
    const rpcProvider = config.realData.ethereum.rpcProviders.find((p: any) => p.name === providerName);
    if (rpcProvider) {
      rpcProvider.isHealthy = isHealthy;
      rpcProvider.lastHealthCheck = Date.now();
      return;
    }

    // Update fallback providers
    const fallbackProvider = config.realData.ethereum.fallbackProviders.find((p: any) => p.name === providerName);
    if (fallbackProvider) {
      fallbackProvider.isHealthy = isHealthy;
      fallbackProvider.lastHealthCheck = Date.now();
      return;
    }

    // Update market data providers
    const allMarketProviders = [
      ...config.realData.marketData.priceProviders,
      ...config.realData.marketData.defiProviders,
      ...config.realData.marketData.sentimentProviders
    ];

    const marketProvider = allMarketProviders.find((p: any) => p.name === providerName);
    if (marketProvider) {
      marketProvider.isHealthy = isHealthy;
      marketProvider.lastHealthCheck = Date.now();
    }
  }

  public getHealthyRpcProviders() {
    const config = this.getConfig();
    const allProviders = [
      ...config.realData.ethereum.rpcProviders,
      ...config.realData.ethereum.fallbackProviders
    ];
    
    return allProviders
      .filter(provider => provider.isHealthy)
      .sort((a, b) => a.priority - b.priority);
  }

  public getHealthyMarketDataProviders() {
    const config = this.getConfig();
    return {
      price: config.realData.marketData.priceProviders.filter((p: any) => p.isHealthy),
      defi: config.realData.marketData.defiProviders.filter((p: any) => p.isHealthy),
      sentiment: config.realData.marketData.sentimentProviders.filter((p: any) => p.isHealthy)
    };
  }

  public async reload(): Promise<void> {
    this.initialized = false;
    this.config = null;
    await this.initialize();
  }
}

// Singleton instance
let configManagerInstance: RealDataConfigManager | null = null;

export async function getRealDataConfigManager(): Promise<RealDataConfigManager> {
  if (!configManagerInstance) {
    configManagerInstance = new RealDataConfigManager();
    await configManagerInstance.initialize();
  }
  return configManagerInstance;
}

// Convenience functions
export async function getRealDataConfig(): Promise<RealDataConfig> {
  const manager = await getRealDataConfigManager();
  return manager.getConfig();
}

export async function isRealDataEnabled(): Promise<boolean> {
  const manager = await getRealDataConfigManager();
  return manager.isRealDataEnabled();
}

export async function getRpcProviders() {
  const manager = await getRealDataConfigManager();
  return manager.getRpcProviders();
}

export async function getMarketDataProviders() {
  const manager = await getRealDataConfigManager();
  return manager.getMarketDataProviders();
}

export async function getContractAddresses() {
  const manager = await getRealDataConfigManager();
  return manager.getContractAddresses();
}

async function getConfigurationStatus(): Promise<ConfigurationStatus> {
  const manager = await getRealDataConfigManager();
  return manager.getConfigurationStatus();
}

module.exports = {
  getRealDataConfigManager,
  getRealDataConfig,
  isRealDataEnabled,
  getRpcProviders,
  getMarketDataProviders,
  getContractAddresses,
  getConfigurationStatus
};