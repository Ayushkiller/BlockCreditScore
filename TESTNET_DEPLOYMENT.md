# CryptoVault Credit Intelligence - Testnet Deployment Guide

## Overview

This guide covers the deployment of CryptoVault Credit Intelligence smart contracts to Ethereum testnets (Goerli/Sepolia) for testing and validation purposes.

## Prerequisites

### 1. Environment Setup

Create a `.env` file with the following configuration:

```bash
# Testnet RPC URLs (replace with your provider)
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Deployment wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas configuration
GAS_PRICE_GWEI=20
GAS_LIMIT=8000000
```

### 2. Testnet ETH Requirements

- **Minimum Balance**: 0.1 ETH per testnet
- **Recommended Balance**: 0.2 ETH per testnet (for testing transactions)

#### Getting Testnet ETH:

**Goerli Testnet:**
- [Goerli Faucet](https://goerlifaucet.com/)
- [Alchemy Goerli Faucet](https://goerlifaucet.com/)

**Sepolia Testnet:**
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

### 3. API Keys Setup

**Infura/Alchemy:**
1. Sign up at [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/)
2. Create a new project
3. Copy the API key to your `.env` file

**Etherscan:**
1. Sign up at [Etherscan](https://etherscan.io/)
2. Go to API Keys section
3. Create a new API key
4. Copy to your `.env` file

## Deployment Process

### Step 1: Compile Contracts

```bash
npx hardhat compile
```

### Step 2: Deploy to Testnet

**Deploy to Goerli:**
```bash
npx hardhat run scripts/deploy-testnet.ts --network goerli
```

**Deploy to Sepolia:**
```bash
npx hardhat run scripts/deploy-testnet.ts --network sepolia
```

### Step 3: Verify Contracts

**Verify on Goerli:**
```bash
npx hardhat run scripts/verify-testnet.ts --network goerli
```

**Verify on Sepolia:**
```bash
npx hardhat run scripts/verify-testnet.ts --network sepolia
```

### Step 4: Monitor Real-time Functionality

**Monitor Goerli:**
```bash
npx hardhat run scripts/monitor-testnet.ts --network goerli
```

**Monitor Sepolia:**
```bash
npx hardhat run scripts/monitor-testnet.ts --network sepolia
```

## Deployment Output

After successful deployment, you'll see:

```
📊 Deployment Summary:
============================================================
Network: goerli (Chain ID: 5)
Block Number: 8234567
Deployer: 0x1234...5678
SimpleCreditScore: 0xabcd...ef01
Total Gas Used: 2,456,789
Deployment Cost: ~0.049 ETH
============================================================
```

## Contract Addresses

Deployed contract addresses are automatically saved to:
- `deployments/{network}-testnet-latest.json`
- `deployments/{network}-testnet-{timestamp}.json`

## Testing Deployed Contracts

### Basic Functionality Test

```typescript
// Connect to deployed contract
const SimpleCreditScore = await ethers.getContractFactory("SimpleCreditScore");
const contract = SimpleCreditScore.attach("DEPLOYED_ADDRESS");

// Test profile creation
await contract.createCreditProfile(userAddress);

// Test score update
await contract.updateScoreDimension(
  userAddress,
  0, // DEFI_RELIABILITY
  [750, 800, 720], // Sample scores
  [1, 1, 1] // Equal weights
);

// Check results
const [score, confidence] = await contract.getScoreDimension(userAddress, 0);
console.log(`Score: ${score}, Confidence: ${confidence}%`);
```

### Real-time Monitoring

The monitoring script will:
1. ✅ Test contract connectivity
2. ✅ Monitor network status
3. ✅ Set up event listeners
4. ✅ Create test transactions
5. ✅ Monitor gas usage
6. ✅ Verify calculations
7. ✅ Track real-time blocks

## Gas Optimization

### Current Gas Usage:
- **Contract Deployment**: ~2.4M gas
- **Profile Creation**: ~460K gas
- **Score Update**: ~112K gas

### Optimization Tips:
1. Use batch operations for multiple updates
2. Consider gas price during deployment
3. Monitor network congestion

## Troubleshooting

### Common Issues:

**1. Insufficient Balance**
```
❌ Insufficient balance. Need at least 0.1 ETH, have 0.05 ETH
```
**Solution**: Get more testnet ETH from faucets

**2. RPC Connection Issues**
```
❌ Network connection failed
```
**Solution**: Check RPC URL and API key

**3. Private Key Issues**
```
❌ Invalid private key
```
**Solution**: Ensure private key is without 0x prefix

**4. Verification Failed**
```
❌ Contract verification failed
```
**Solution**: Wait a few minutes and retry, or check Etherscan API key

### Debug Commands:

**Check network connection:**
```bash
npx hardhat console --network goerli
```

**Check account balance:**
```bash
npx hardhat run scripts/check-balance.ts --network goerli
```

## Security Considerations

### Testnet Security:
1. ✅ Use separate wallet for testnet
2. ✅ Never use mainnet private keys
3. ✅ Testnet ETH has no value
4. ✅ Contracts are publicly visible

### Production Preparation:
1. 🔒 Security audit required
2. 🔒 Multi-sig deployment wallet
3. 🔒 Formal verification
4. 🔒 Gradual rollout strategy

## Next Steps

After successful testnet deployment:

1. **Integration Testing**: Test with frontend applications
2. **Load Testing**: Simulate high transaction volumes
3. **Security Audit**: Professional security review
4. **Beta Program**: Limited user testing
5. **Mainnet Preparation**: Final optimizations

## Support

For deployment issues:
1. Check this guide first
2. Review error messages carefully
3. Verify environment configuration
4. Test on local hardhat network first

## Contract Interfaces

### SimpleCreditScore Functions:

```solidity
// Profile Management
function createCreditProfile(address user) external;
function getCreditProfile(address user) external view returns (bool, address, uint256);

// Score Management
function updateScoreDimension(address user, CreditDimension dimension, uint256[] calldata rawData, uint256[] calldata weights) external;
function getScoreDimension(address user, CreditDimension dimension) external view returns (uint256, uint256, uint256, ScoreTrend, uint256, bool);
function getCompositeScore(address user) external view returns (uint256, uint256);

// Authorization
function addAuthorizedUpdater(address updater) external;
function removeAuthorizedUpdater(address updater) external;
```

### Credit Dimensions:
0. DEFI_RELIABILITY
1. TRADING_CONSISTENCY  
2. STAKING_COMMITMENT
3. GOVERNANCE_PARTICIPATION
4. LIQUIDITY_PROVIDER

---

**Deployment Status**: ✅ Ready for testnet deployment
**Last Updated**: January 2025
**Version**: 1.0.0