#!/usr/bin/env ts-node

// Real Data Environment Setup Script
// Interactive script to help users configure API keys and environment settings

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { getSecretManager } from '../config/secret-manager';

interface ApiKeyConfig {
  name: string;
  key: string;
  description: string;
  required: boolean;
  testUrl?: string;
}

const API_CONFIGS: ApiKeyConfig[] = [
  {
    name: 'ALCHEMY_API_KEY',
    key: 'alchemy',
    description: 'Alchemy API key for Ethereum RPC access',
    required: true,
    testUrl: 'https://eth-mainnet.alchemyapi.io/v2/'
  },
  {
    name: 'INFURA_API_KEY',
    key: 'infura',
    description: 'Infura API key for Ethereum RPC backup',
    required: true,
    testUrl: 'https://mainnet.infura.io/v3/'
  },
  {
    name: 'COINGECKO_API_KEY',
    key: 'coingecko',
    description: 'CoinGecko API key for price data',
    required: true,
    testUrl: 'https://api.coingecko.com/api/v3'
  },
  {
    name: 'ANKR_API_KEY',
    key: 'ankr',
    description: 'Ankr API key for additional RPC backup',
    required: false
  },
  {
    name: 'QUICKNODE_API_KEY',
    key: 'quicknode',
    description: 'QuickNode API key for premium RPC access',
    required: false
  },
  {
    name: 'MORALIS_API_KEY',
    key: 'moralis',
    description: 'Moralis API key for additional blockchain data',
    required: false
  },
  {
    name: 'COINMARKETCAP_API_KEY',
    key: 'coinmarketcap',
    description: 'CoinMarketCap API key for price data backup',
    required: false
  },
  {
    name: 'DEFIPULSE_API_KEY',
    key: 'defipulse',
    description: 'DeFiPulse API key for DeFi protocol data',
    required: false
  }
];

class RealDataEnvSetup {
  private rl: readline.Interface;
  private secretManager: any;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.secretManager = getSecretManager();
  }

  private async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private async confirmAction(message: string): Promise<boolean> {
    const answer = await this.question(`${message} (y/N): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  public async run(): Promise<void> {
    console.log('🚀 Real Data Integration Environment Setup');
    console.log('=' .repeat(50));
    console.log('This script will help you configure API keys for real data integration.\n');

    try {
      // Check current environment
      const currentEnv = process.env.NODE_ENV || 'development';
      console.log(`Current environment: ${currentEnv}\n`);

      // Show current configuration status
      await this.showCurrentStatus();

      // Ask if user wants to configure API keys
      const configureKeys = await this.confirmAction('Would you like to configure API keys?');
      if (configureKeys) {
        await this.configureApiKeys();
      }

      // Ask if user wants to update environment settings
      const configureEnv = await this.confirmAction('Would you like to update environment settings?');
      if (configureEnv) {
        await this.configureEnvironmentSettings();
      }

      // Test configuration
      const testConfig = await this.confirmAction('Would you like to test the configuration?');
      if (testConfig) {
        await this.testConfiguration();
      }

      console.log('\n✅ Setup completed successfully!');
      console.log('You can now run the validation script: npm run validate-real-data-config');

    } catch (error) {
      console.error('❌ Setup failed:', error);
    } finally {
      this.rl.close();
    }
  }

  private async showCurrentStatus(): Promise<void> {
    console.log('📊 Current Configuration Status:');
    console.log('-'.repeat(30));

    for (const config of API_CONFIGS) {
      const hasKey = this.secretManager.hasSecret(config.name);
      const status = hasKey ? '✅' : (config.required ? '❌' : '⚠️ ');
      const requiredText = config.required ? ' (Required)' : ' (Optional)';
      console.log(`${status} ${config.name}${requiredText}`);
    }

    const realDataEnabled = process.env.REAL_DATA_ENABLED === 'true';
    console.log(`${realDataEnabled ? '✅' : '❌'} REAL_DATA_ENABLED: ${realDataEnabled}`);
    console.log('');
  }

  private async configureApiKeys(): Promise<void> {
    console.log('\n🔑 Configuring API Keys:');
    console.log('-'.repeat(30));

    for (const config of API_CONFIGS) {
      const currentValue = this.secretManager.getSecret(config.name);
      const hasValue = !!currentValue;

      console.log(`\n${config.name}:`);
      console.log(`  Description: ${config.description}`);
      console.log(`  Required: ${config.required ? 'Yes' : 'No'}`);
      console.log(`  Current status: ${hasValue ? 'Configured' : 'Not configured'}`);

      if (hasValue) {
        const update = await this.confirmAction('  Update this key?');
        if (!update) continue;
      }

      const newValue = await this.question('  Enter API key (or press Enter to skip): ');
      if (newValue.trim()) {
        this.secretManager.setSecret(config.name, newValue.trim());
        console.log('  ✅ API key saved');
      }
    }
  }

  private async configureEnvironmentSettings(): Promise<void> {
    console.log('\n⚙️  Configuring Environment Settings:');
    console.log('-'.repeat(30));

    // Real data enabled
    const currentRealData = process.env.REAL_DATA_ENABLED === 'true';
    console.log(`\nREAL_DATA_ENABLED (currently: ${currentRealData})`);
    const enableRealData = await this.confirmAction('Enable real data integration?');
    
    // Failover enabled
    const currentFailover = process.env.ENABLE_FAILOVER !== 'false';
    console.log(`\nENABLE_FAILOVER (currently: ${currentFailover})`);
    const enableFailover = await this.confirmAction('Enable automatic failover?');

    // Update .env file
    await this.updateEnvFile({
      REAL_DATA_ENABLED: enableRealData.toString(),
      ENABLE_FAILOVER: enableFailover.toString()
    });

    console.log('✅ Environment settings updated');
  }

  private async updateEnvFile(updates: Record<string, string>): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
  }

  private async testConfiguration(): Promise<void> {
    console.log('\n🧪 Testing Configuration:');
    console.log('-'.repeat(30));

    // Test CoinGecko
    const coinGeckoKey = this.secretManager.getSecret('COINGECKO_API_KEY');
    if (coinGeckoKey) {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/ping', {
          headers: { 'X-CG-Demo-API-Key': coinGeckoKey }
        });
        console.log(`CoinGecko API: ${response.ok ? '✅ Connected' : '❌ Failed'}`);
      } catch (error) {
        console.log('CoinGecko API: ❌ Connection error');
      }
    } else {
      console.log('CoinGecko API: ⚠️  No API key configured');
    }

    // Test Alchemy
    const alchemyKey = this.secretManager.getSecret('ALCHEMY_API_KEY');
    if (alchemyKey) {
      try {
        const response = await fetch(`https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        console.log(`Alchemy RPC: ${response.ok ? '✅ Connected' : '❌ Failed'}`);
      } catch (error) {
        console.log('Alchemy RPC: ❌ Connection error');
      }
    } else {
      console.log('Alchemy RPC: ⚠️  No API key configured');
    }

    // Test DefiLlama (no key required)
    try {
      const response = await fetch('https://api.llama.fi/protocols');
      console.log(`DefiLlama API: ${response.ok ? '✅ Connected' : '❌ Failed'}`);
    } catch (error) {
      console.log('DefiLlama API: ❌ Connection error');
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const setup = new RealDataEnvSetup();
  await setup.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}