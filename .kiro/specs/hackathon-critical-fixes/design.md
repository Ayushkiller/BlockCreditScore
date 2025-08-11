# Design Document

## Overview

This design focuses on the fastest path to get a working hackathon demo by fixing the core deployment and data issues. We'll replace all fake/mock functionality with real blockchain interactions and streamline the user experience for judges to quickly test the system.

## Architecture

### Core Components to Fix

1. **Real Deployment System**: Replace `simulateDeployment` with actual Hardhat deployment calls
2. **Real Data Pipeline**: Remove all mock data and connect to actual blockchain/API sources  
3. **Simplified Wallet Flow**: Remove verification barriers and allow direct address analysis
4. **Working Contract Integration**: Connect frontend to actual deployed contracts

## Components and Interfaces

### 1. Real Deployment Service

**Current Issue**: `DeploymentPanel.tsx` uses `simulateDeployment` with fake addresses
**Solution**: Create actual deployment service that calls Hardhat scripts

```typescript
interface RealDeploymentService {
  deployContract(network: 'goerli' | 'sepolia'): Promise<DeploymentResult>
  getDeploymentStatus(txHash: string): Promise<DeploymentStatus>
  verifyContract(address: string, network: string): Promise<VerificationResult>
}
```

### 2. Real Data Services

**Current Issue**: Multiple services return mock data
**Solution**: Connect to actual data sources

```typescript
interface RealDataService {
  getWalletTransactions(address: string): Promise<Transaction[]>
  calculateRealCreditScore(address: string): Promise<CreditScore>
  getMarketData(): Promise<MarketData>
  getDefiInteractions(address: string): Promise<DefiActivity[]>
}
```

### 3. Simplified Wallet Interface

**Current Issue**: Missing verify button, complex verification flow
**Solution**: Direct address input with optional wallet connection

```typescript
interface WalletInterface {
  analyzeAddress(address: string): Promise<CreditAnalysis>
  connectWallet?(): Promise<string> // Optional for convenience
  getCurrentAddress(): string | null
}
```

## Data Models

### Real Deployment Result
```typescript
interface DeploymentResult {
  contractAddress: string
  transactionHash: string
  blockNumber: number
  gasUsed: number
  network: string
  timestamp: number
  verified: boolean
}
```

### Real Credit Score
```typescript
interface RealCreditScore {
  address: string
  compositeScore: number
  dimensions: {
    defiReliability: number
    tradingConsistency: number
    stakingCommitment: number
    governanceParticipation: number
    liquidityProvider: number
  }
  confidence: number
  lastUpdated: number
  dataPoints: number
}
```

## Error Handling

### Deployment Errors
- Network connection failures → Show clear error with retry option
- Insufficient funds → Display required balance and faucet links
- Contract compilation errors → Show compilation output

### Data Errors  
- API failures → Fallback to cached data or show "Data unavailable"
- Invalid addresses → Clear validation messages
- Network timeouts → Retry with exponential backoff

## Testing Strategy

### Manual Testing Priority (5-hour constraint)
1. Deploy contract to Sepolia (fastest testnet)
2. Test with 3-5 real wallet addresses with transaction history
3. Verify all dashboards show real data
4. Test address input without wallet connection
5. Verify Etherscan links work

### Critical Test Cases
- Deploy contract and verify on Etherscan
- Input random address and see real credit analysis
- Check that no mock data appears anywhere
- Verify all API endpoints return real data

## Implementation Priority

### Phase 1: Fix Deployment (1 hour)
1. Replace `simulateDeployment` with real Hardhat deployment
2. Add proper error handling for deployment failures
3. Test deployment to Sepolia testnet

### Phase 2: Remove Fake Data (2 hours)
1. Identify all mock data sources
2. Replace with real blockchain data calls
3. Connect to actual price feeds and DeFi protocols

### Phase 3: Fix Wallet Flow (1 hour)
1. Add direct address input field
2. Remove verification barriers
3. Make wallet connection optional

### Phase 4: Integration Testing (1 hour)
1. End-to-end testing with real addresses
2. Verify all dashboards work
3. Test deployment and contract interaction
4. Final demo preparation

## Security Considerations

### Minimal Security for Demo
- Input validation for addresses
- Rate limiting on API calls
- Basic error handling
- No complex authentication (demo focus)

### Production Considerations (Post-Hackathon)
- Proper access controls
- Comprehensive input validation
- Secure key management
- Audit trails