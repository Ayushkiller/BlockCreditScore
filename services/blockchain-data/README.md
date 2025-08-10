# Real Blockchain Data Service

This service provides authentic blockchain data integration for the CryptoVault Credit Intelligence system. It replaces mock/placeholder data with real Ethereum mainnet data using multiple RPC providers with automatic failover.

## Features

### ✅ Real Blockchain Connections
- **Live Ethereum RPC**: Connects to real Ethereum mainnet via Alchemy, Infura, Ankr, QuickNode, and Moralis
- **WebSocket Subscriptions**: Real-time block and transaction monitoring using `eth_subscribe`
- **Automatic Failover**: Seamless switching between providers when one fails
- **Health Monitoring**: Continuous health checks with automatic recovery

### ✅ Authentic Data Retrieval
- **Real Transactions**: Uses `eth_getTransactionByHash` and `eth_getTransactionReceipt` for authentic transaction data
- **Live Block Data**: Fetches real block information with timestamps, gas usage, and transaction lists
- **Real-time Monitoring**: Subscribe to new blocks and address-specific transactions
- **Chain Reorganization Handling**: Properly handles blockchain reorgs and confirmations

### ✅ Production-Ready Features
- **Rate Limiting**: Respects provider rate limits and implements backoff strategies
- **Error Handling**: Comprehensive error handling with detailed logging
- **Connection Recovery**: Exponential backoff reconnection with configurable limits
- **Performance Monitoring**: Tracks latency, failures, and provider health

## Quick Start

### 1. Environment Setup

Create a `.env` file with your API keys:

```bash
# Primary providers (recommended)
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_API_KEY=your_infura_api_key

# Additional providers (optional)
ANKR_API_KEY=your_ankr_api_key
QUICKNODE_RPC_URL=your_quicknode_rpc_url
QUICKNODE_WS_URL=your_quicknode_ws_url
MORALIS_RPC_URL=your_moralis_rpc_url
MORALIS_WS_URL=your_moralis_ws_url
```

### 2. Basic Usage

```typescript
import { createBlockchainDataManager } from '@cryptovault/blockchain-data';

async function example() {
  // Create and connect to blockchain
  const manager = await createBlockchainDataManager();
  
  // Get current block
  const blockNumber = await manager.getCurrentBlock();
  console.log(`Current block: ${blockNumber}`);
  
  // Get transaction data
  const tx = await manager.getTransaction('0x...');
  console.log(`Transaction from: ${tx.from}, value: ${tx.value}`);
  
  // Subscribe to new blocks
  await manager.subscribeToBlocks((block) => {
    console.log(`New block: ${block.blockNumber}`);
  });
  
  // Monitor an address
  await manager.subscribeToAddress('0x...', (tx) => {
    console.log(`Transaction: ${tx.hash}`);
  });
}
```

### 3. Test Connection

```bash
# Run the connection test
npm run test:connection

# Or directly with ts-node
npx ts-node src/test-connection.ts
```

## API Reference

### RealBlockchainDataManager

Main class for blockchain data operations.

#### Methods

##### `connectToMainnet(providers: RpcProvider[]): Promise<void>`
Connect to Ethereum mainnet with automatic failover.

##### `getTransaction(hash: string): Promise<EthereumTransaction>`
Get transaction details using real `eth_getTransactionByHash`.

##### `getTransactionReceipt(hash: string): Promise<TransactionReceipt>`
Get transaction receipt using real `eth_getTransactionReceipt`.

##### `subscribeToBlocks(callback: SubscriptionCallback<BlockSubscriptionData>): Promise<void>`
Subscribe to new blocks using real `eth_subscribe` for `newHeads`.

##### `subscribeToAddress(address: string, callback: SubscriptionCallback<TransactionSubscriptionData>): Promise<void>`
Monitor transactions for a specific address.

##### `getCurrentBlock(): Promise<number>`
Get the current block number from the blockchain.

##### `getBlockByNumber(blockNumber: number): Promise<Block>`
Get detailed block information.

##### `getConnectionStatus(): ConnectionStatus`
Get current connection status and provider information.

##### `getProviderHealth(): RpcProvider[]`
Get health status of all configured providers.

## Configuration

### Provider Priority

Providers are used in priority order (lower number = higher priority):

1. **Alchemy** (Priority 1) - 300 req/sec
2. **Infura** (Priority 2) - 100 req/sec  
3. **Ankr** (Priority 3) - 50 req/sec
4. **QuickNode** (Priority 4) - 200 req/sec
5. **Moralis** (Priority 5) - 25 req/sec

### Health Checking

- **Interval**: Every 60 seconds
- **Timeout**: 10 seconds per check
- **Failover**: After 3 consecutive failures
- **Recovery**: Automatic when provider becomes healthy

### Rate Limiting

Each provider has configured rate limits:
- Requests are automatically throttled
- Exponential backoff on rate limit errors
- Automatic failover when limits exceeded

## Error Handling

### Connection Errors
- Automatic failover to next healthy provider
- Exponential backoff reconnection (5s to 5min)
- Maximum 5 reconnection attempts before manual intervention

### API Errors
- HTTP error code handling (429, 500, etc.)
- Timeout handling with configurable limits
- Invalid response handling with detailed logging

### Data Validation
- Transaction hash format validation
- Address format validation
- Block number validation
- Response data structure validation

## Monitoring & Logging

### Connection Events
```typescript
manager.on('connected', (provider) => {
  console.log(`Connected to ${provider.name}`);
});

manager.on('disconnected', () => {
  console.log('Disconnected from provider');
});

manager.on('error', (error) => {
  console.error('Connection error:', error);
});
```

### Health Check Events
```typescript
manager.on('healthCheckCompleted', (results) => {
  console.log(`Health check: ${results.length} providers checked`);
});
```

### Statistics
```typescript
const stats = manager.getProviderStatistics();
console.log(`Healthy providers: ${stats.healthyProviders}/${stats.totalProviders}`);
```

## Requirements Fulfilled

This implementation fulfills the following requirements from the Real Data Integration spec:

- **Requirement 1.1**: ✅ Real RPC endpoints (Alchemy, Infura, Ankr) with valid API keys
- **Requirement 1.2**: ✅ Actual `eth_getTransactionByHash` and `eth_getTransactionReceipt` calls
- **Requirement 1.3**: ✅ WebSocket connections to live Ethereum nodes for real-time detection
- **Requirement 1.4**: ✅ Real block data using `eth_getBlockByNumber` with real hashes and timestamps
- **Requirement 1.6**: ✅ Automatic failover to backup RPC providers with exponential backoff

## Production Deployment

### Environment Variables
Set up all required API keys in your production environment.

### Monitoring
- Monitor connection status and provider health
- Set up alerts for connection failures
- Track API usage and rate limits

### Scaling
- Use multiple instances with different provider configurations
- Implement caching for frequently accessed data
- Consider read replicas for high-volume applications

## Troubleshooting

### Common Issues

**No providers configured**
```
Error: No RPC providers configured
```
Solution: Set up at least one API key in environment variables.

**All providers unhealthy**
```
Error: No healthy providers available
```
Solution: Check API keys, network connectivity, and provider status.

**Rate limit exceeded**
```
Error: Rate limit exceeded
```
Solution: The service automatically handles this with backoff and failover.

**WebSocket connection failed**
```
Error: WebSocket connection failed
```
Solution: Check firewall settings and WebSocket URL configuration.

### Debug Logging

Enable debug logging:
```bash
DEBUG=blockchain-data:* npm start
```

## License

MIT License - see LICENSE file for details.