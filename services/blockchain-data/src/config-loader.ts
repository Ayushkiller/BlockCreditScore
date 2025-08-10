import { RpcProvider } from './types';

/**
 * Load real data providers configuration from environment and config files
 */
export class RealDataConfigLoader {
  /**
   * Load RPC providers from configuration
   */
  static loadRpcProviders(): RpcProvider[] {
    const providers: RpcProvider[] = [];

    // Alchemy provider
    if (process.env.ALCHEMY_API_KEY) {
      providers.push({
        name: 'Alchemy',
        rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        wsUrl: `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        apiKey: process.env.ALCHEMY_API_KEY,
        priority: 1,
        rateLimit: 300, // requests per second
        timeout: 10000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Infura provider
    if (process.env.INFURA_API_KEY) {
      providers.push({
        name: 'Infura',
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        wsUrl: `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`,
        apiKey: process.env.INFURA_API_KEY,
        priority: 2,
        rateLimit: 100,
        timeout: 10000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Ankr provider
    if (process.env.ANKR_API_KEY) {
      providers.push({
        name: 'Ankr',
        rpcUrl: `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
        wsUrl: `wss://rpc.ankr.com/eth/ws/${process.env.ANKR_API_KEY}`,
        apiKey: process.env.ANKR_API_KEY,
        priority: 3,
        rateLimit: 50,
        timeout: 15000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // QuickNode provider
    if (process.env.QUICKNODE_RPC_URL && process.env.QUICKNODE_WS_URL) {
      providers.push({
        name: 'QuickNode',
        rpcUrl: process.env.QUICKNODE_RPC_URL,
        wsUrl: process.env.QUICKNODE_WS_URL,
        apiKey: process.env.QUICKNODE_API_KEY || '',
        priority: 4,
        rateLimit: 200,
        timeout: 8000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Moralis provider
    if (process.env.MORALIS_RPC_URL && process.env.MORALIS_WS_URL) {
      providers.push({
        name: 'Moralis',
        rpcUrl: process.env.MORALIS_RPC_URL,
        wsUrl: process.env.MORALIS_WS_URL,
        apiKey: process.env.MORALIS_API_KEY || '',
        priority: 5,
        rateLimit: 25,
        timeout: 15000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    // Add public fallback providers if no API keys are configured
    if (providers.length === 0) {
      console.warn('⚠️ No API keys configured, using public endpoints (not recommended for production)');
      
      providers.push({
        name: 'Cloudflare',
        rpcUrl: 'https://cloudflare-eth.com',
        wsUrl: 'wss://cloudflare-eth.com/ws', // May not be available
        apiKey: '',
        priority: 10,
        rateLimit: 10, // Very limited
        timeout: 20000,
        isHealthy: true,
        lastHealthCheck: 0,
        failureCount: 0
      });
    }

    if (providers.length === 0) {
      throw new Error('No RPC providers configured. Please set up API keys in environment variables.');
    }

    console.log(`📡 Loaded ${providers.length} RPC providers:`, providers.map(p => p.name).join(', '));
    return providers;
  }

  /**
   * Validate that required environment variables are set
   */
  static validateEnvironment(): void {
    const requiredVars = [];
    const recommendedVars = ['ALCHEMY_API_KEY', 'INFURA_API_KEY'];
    
    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    
    if (missingRecommended.length === recommendedVars.length) {
      console.warn('⚠️ Warning: No recommended API keys found. Consider setting up:');
      missingRecommended.forEach(varName => {
        console.warn(`   - ${varName}`);
      });
    }

    // Check for any configured providers
    const hasAnyProvider = recommendedVars.some(varName => process.env[varName]) ||
                          process.env.QUICKNODE_RPC_URL ||
                          process.env.MORALIS_RPC_URL ||
                          process.env.ANKR_API_KEY;

    if (!hasAnyProvider) {
      throw new Error('No blockchain providers configured. Please set up at least one API key.');
    }
  }

  /**
   * Get configuration summary for logging
   */
  static getConfigSummary(): {
    providersConfigured: string[];
    totalProviders: number;
    hasApiKeys: boolean;
    environment: string;
  } {
    const providers = this.loadRpcProviders();
    
    return {
      providersConfigured: providers.map(p => p.name),
      totalProviders: providers.length,
      hasApiKeys: providers.some(p => p.apiKey && p.apiKey.length > 0),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}