# Real Data Integration Setup Guide

This guide explains how to configure and use the Real Data Integration feature for the CryptoVault Credit Intelligence system.

## Overview

The Real Data Integration feature replaces mock/placeholder data with authentic blockchain data, real market APIs, and live DeFi protocol interactions. This provides genuine credit scoring based on real user behavior and market conditions.

## Quick Start

### 1. Interactive Setup

Run the interactive setup script to configure API keys and environment settings:

```bash
npm run setup-real-data
```

This script will:
- Show current configuration status
- Help you configure required API keys
- Update environment settings
- Test API connectivity

### 2. Manual Configuration

Alternatively, you can manually configure the environment by editing the `.env` file:

```bash
# Enable real data integration
REAL_DATA_ENABLED=true
ENABLE_FAILOVER=true

# Required API Keys
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_API_KEY=your_infura_api_key
COINGECKO_API_KEY=your_coingecko_api_key

# Optional API Keys (for enhanced redundancy)
ANKR_API_KEY=your_ankr_api_key
QUICKNODE_API_KEY=your_quicknode_api_key
MORALIS_API_KEY=your_moralis_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
DEFIPULSE_API_KEY=your_defipulse_api_key
```

### 3. Validate Configuration

After configuration, validate that everything is set up correctly:

```bash
npm run validate-real-data-config
```

This will:
- Check all required API keys are configured
- Test API connectivity
- Validate provider redundancy
- Show configuration status

## Required API Keys

### Essential (Required)

1. **Alchemy API Key**
   - Purpose: Primary Ethereum RPC provider
   - Get it: [alchemy.com](https://alchemy.com)
   - Free tier: 300 requests/second

2. **Infura API Key**
   - Purpose: Backup Ethereum RPC provider
   - Get it: [infura.io](https://infura.io)
   - Free tier: 100,000 requests/day

3. **CoinGecko API Key**
   - Purpose: Price data and market information
   - Get it: [coingecko.com/api](https://coingecko.com/api)
   - Free tier: 10-50 calls/minute

### Optional (Recommended for Production)

4. **Ankr API Key**
   - Purpose: Additional RPC backup
   - Get it: [ankr.com](https://ankr.com)

5. **QuickNode API Key**
   - Purpose: Premium RPC access
   - Get it: [quicknode.com](https://quicknode.com)

6. **Moralis API Key**
   - Purpose: Additional blockchain data
   - Get it: [moralis.io](https://moralis.io)

7. **CoinMarketCap API Key**
   - Purpose: Price data backup
   - Get it: [coinmarketcap.com/api](https://coinmarketcap.com/api)

8. **DeFiPulse API Key**
   - Purpose: DeFi protocol data
   - Get it: [defipulse.com](https://defipulse.com)

## Configuration Files

The real data integration uses several configuration files:

### Core Configuration
- `config/real-data-providers.ts` - Provider definitions and real contract addresses
- `config/real-data-config.ts` - Main configuration manager
- `config/secret-manager.ts` - Secure secret management

### Environment-Specific
- `config/environments/development.ts` - Development environment settings
- `config/environments/production.ts` - Production environment settings

## Features

### Failover Support
- Automatic failover between RPC providers
- Health checking and provider monitoring
- Configurable failure thresholds and cooldown periods

### Secure Secret Management
- Encrypted storage of API keys
- Environment variable fallback
- Validation of required secrets

### Real Contract Integration
- Uniswap V3: Router, Factory, Quoter contracts
- Aave V3: Pool, Oracle, Rewards contracts
- Compound: Comptroller, COMP token
- Chainlink: Price feed contracts
- MakerDAO: DAI token and core contracts

### Market Data Integration
- Real-time price feeds from multiple sources
- DeFi protocol TVL and yield data
- Market sentiment indicators
- Historical price data

## Environment Variables

### Core Settings
```bash
REAL_DATA_ENABLED=true              # Enable/disable real data integration
ENABLE_FAILOVER=true                # Enable automatic failover
HEALTH_CHECK_INTERVAL_MS=60000      # Health check frequency (1 minute)
FAILOVER_COOLDOWN_MS=300000         # Failover cooldown (5 minutes)
MAX_FAILURES_BEFORE_SWITCH=3       # Failures before switching providers
```

### API Configuration
```bash
# Blockchain RPC Providers
ALCHEMY_API_KEY=your_key
INFURA_API_KEY=your_key
ANKR_API_KEY=your_key
QUICKNODE_RPC_URL=your_endpoint
QUICKNODE_WS_URL=your_ws_endpoint
QUICKNODE_API_KEY=your_key
MORALIS_RPC_URL=your_endpoint
MORALIS_WS_URL=your_ws_endpoint
MORALIS_API_KEY=your_key

# Market Data Providers
COINGECKO_API_KEY=your_key
COINMARKETCAP_API_KEY=your_key
DEFIPULSE_API_KEY=your_key
```

## Usage in Code

### Getting Configuration
```typescript
import { getRealDataConfig, isRealDataEnabled } from './config/real-data-config';

// Check if real data is enabled
const enabled = await isRealDataEnabled();

// Get full configuration
const config = await getRealDataConfig();

// Get RPC providers
const providers = await getRpcProviders();
```

### Using Contract Addresses
```typescript
import { getContractAddresses } from './config/real-data-config';

const contracts = await getContractAddresses();
const uniswapRouter = contracts.UNISWAP_V3.ROUTER;
const aavePool = contracts.AAVE_V3.POOL;
```

### Health Monitoring
```typescript
import { getConfigurationStatus } from './config/real-data-config';

const status = await getConfigurationStatus();
console.log('Providers configured:', status.providersConfigured);
console.log('Secrets status:', status.secretsStatus);
```

## Troubleshooting

### Common Issues

1. **"Missing required secrets" error**
   - Run `npm run setup-real-data` to configure API keys
   - Check that all required environment variables are set

2. **API connection failures**
   - Verify API keys are correct and active
   - Check API rate limits and quotas
   - Ensure network connectivity

3. **Provider failover not working**
   - Check `ENABLE_FAILOVER=true` in environment
   - Verify multiple providers are configured
   - Check provider health status

### Debug Commands

```bash
# Validate configuration
npm run validate-real-data-config

# Check environment variables
node -e "console.log(process.env.REAL_DATA_ENABLED)"

# Test API connectivity
curl -H "X-CG-Demo-API-Key: YOUR_KEY" https://api.coingecko.com/api/v3/ping
```

## Production Deployment

### Requirements
- At least 3 RPC providers for redundancy
- Multiple price data providers
- All required API keys configured
- Monitoring and alerting enabled
- Encrypted secret storage

### Validation
```bash
NODE_ENV=production npm run validate-real-data-config
```

### Security
- Use environment variables for API keys
- Enable secret encryption in production
- Implement key rotation policies
- Monitor API usage and costs

## Support

For issues or questions:
1. Check the validation output: `npm run validate-real-data-config`
2. Review the configuration status in the logs
3. Verify API key validity and quotas
4. Check network connectivity and firewall settings

## Next Steps

After completing the setup:
1. Run the validation script to ensure everything works
2. Test with a small subset of real data
3. Monitor API usage and performance
4. Gradually increase real data integration
5. Set up monitoring and alerting for production use