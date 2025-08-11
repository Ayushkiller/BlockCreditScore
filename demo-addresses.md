# Hackathon Demo - Real Wallet Addresses

## Selected Addresses for Demo

These are real Ethereum addresses with significant DeFi activity that judges can use to test the credit scoring system:

### 1. Vitalik Buterin
- **Address**: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- **Activity**: Ethereum founder, extensive DeFi interactions, governance participation
- **Expected Score**: High (800-950) due to consistent activity and governance participation

### 2. Binance Hot Wallet 
- **Address**: `0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE`
- **Activity**: Major exchange wallet, high volume trading, liquidity provision
- **Expected Score**: Very High (900-1000) due to massive transaction volume and reliability

### 3. Uniswap V3 Router
- **Address**: `0xE592427A0AEce92De3Edee1F18E0157C05861564`
- **Activity**: Core DeFi infrastructure, constant trading activity
- **Expected Score**: Maximum (1000) due to critical DeFi role

### 4. Compound Treasury
- **Address**: `0x2775b1c75658Be0F640272CCb8c72ac986009e38`
- **Activity**: DeFi protocol treasury, lending/borrowing, governance
- **Expected Score**: High (850-950) due to DeFi protocol involvement

### 5. Aave V3 Pool
- **Address**: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`
- **Activity**: Major lending protocol, high TVL, consistent activity
- **Expected Score**: Very High (900-1000) due to DeFi infrastructure role

### 6. ENS Treasury
- **Address**: `0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7`
- **Activity**: Governance token holder, DAO participation, ENS ecosystem
- **Expected Score**: High (800-900) due to governance participation

## Demo Flow

1. **Start with Vitalik's address** - Most recognizable, good mix of activities
2. **Show Binance wallet** - Demonstrate high-volume trading analysis
3. **Test Uniswap router** - Show DeFi infrastructure scoring
4. **Input custom address** - Let judges test with any address they want

## Key Features to Demonstrate

### Real Data Sources
- ✅ Actual Etherscan transaction history
- ✅ Real CoinGecko price feeds
- ✅ Live blockchain data from Sepolia testnet
- ✅ Actual smart contract interactions

### Credit Scoring Dimensions
- **DeFi Reliability**: Based on successful protocol interactions
- **Trading Consistency**: Analyzed from real trading patterns
- **Staking Commitment**: Calculated from actual staking transactions
- **Governance Participation**: Measured from real DAO votes
- **Liquidity Provider**: Scored from actual LP positions

### Real-Time Features
- Live price updates from CoinGecko API
- Real blockchain event monitoring
- Actual contract deployment on Sepolia testnet
- Real transaction analysis and scoring

## Error Handling Demo

Test these scenarios to show robust error handling:
- Invalid address format
- Address with no transaction history
- Network connectivity issues
- API rate limiting

## Contract Verification

**Deployed Contract**: `0x62A6cDE7c05d01c3b49F6061Aa0A2EB729c7c2e6`
**Network**: Sepolia Testnet
**Etherscan**: https://sepolia.etherscan.io/address/0x62A6cDE7c05d01c3b49F6061Aa0A2EB729c7c2e6

## Demo Script

1. **Open dashboard** at http://localhost:3000
2. **Show contract deployment** - verify on Etherscan
3. **Input Vitalik's address** - demonstrate credit analysis
4. **Show real-time data** - prices, events, scores
5. **Test different addresses** - show variety of scores
6. **Demonstrate error handling** - invalid inputs
7. **Show data sources** - prove everything is real

## Success Criteria

- ✅ Contract deployed and verified on testnet
- ✅ All dashboards show real blockchain data
- ✅ Credit scores calculated from actual transaction history
- ✅ No mock or fake data anywhere in the system
- ✅ Judges can input any address and see real analysis
- ✅ System handles errors gracefully
- ✅ Real-time updates working properly