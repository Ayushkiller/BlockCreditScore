# Real-Time Price Feed Management System

This document describes the implementation of Task 6: "Implement real-time price feed management" from the real data integration specification.

## Overview

The real-time price feed management system replaces mock price data with live Chainlink integration and implements a comprehensive price monitoring and caching system. The implementation consists of several interconnected components that work together to provide reliable, real-time price data with failover capabilities and volatility monitoring.

## Components

### 1. Real-Time Price Feed Manager (`real-time-price-feed-manager.ts`)

**Purpose**: Manages live Chainlink price feeds with WebSocket subscriptions and DEX aggregator integration.

**Key Features**:
- Real Chainlink price feed integration using actual contract addresses
- WebSocket subscriptions to AnswerUpdated events for real-time updates
- DEX aggregator integration (1inch, 0x) for token price fetching
- Automatic failover between multiple RPC providers
- Price staleness detection and confidence scoring

**Supported Price Feeds**:
- ETH/USD: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- BTC/USD: `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`
- USDC/USD: `0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6`
- And more major tokens...

### 2. Redis Price Cache (`redis-price-cache.ts`)

**Purpose**: High-performance Redis-based caching with TTL and staleness detection.

**Key Features**:
- Redis-based price caching with configurable TTL
- Staleness detection using actual timestamp comparisons
- Batch price operations for efficiency
- Cache statistics and health monitoring
- Automatic cleanup of expired entries

**Cache Configuration**:
- Chainlink prices: 5-minute TTL
- DEX prices: 2-minute TTL
- CoinGecko prices: 10-minute TTL

### 3. Price Feed Failover Manager (`price-feed-failover.ts`)

**Purpose**: Manages multiple price sources with automatic failover and circuit breaker patterns.

**Key Features**:
- Priority-based source selection
- Circuit breaker pattern for failed sources
- Health monitoring and automatic recovery
- Comprehensive error handling and retry logic
- Performance statistics tracking

**Failover Priority**:
1. Chainlink (highest priority)
2. Redis cache
3. DEX aggregators
4. CoinGecko API
5. Stale cache (emergency fallback)

### 4. Price Volatility Monitor (`price-volatility-monitor.ts`)

**Purpose**: Monitors real price changes and calculates volatility metrics.

**Key Features**:
- Real-time volatility calculation using actual price data
- Multiple time window analysis (1h, 24h, 7d)
- Volatility alerts for significant price movements
- Statistical analysis (standard deviation, price ranges)
- Historical price data management

**Volatility Metrics**:
- Price change percentages
- Standard deviation of returns
- High/low price ranges
- Volume-weighted analysis

### 5. Integrated Price Feed Service (`integrated-price-feed-service.ts`)

**Purpose**: Unified interface combining all price feed components.

**Key Features**:
- Single API for all price feed operations
- Automatic component initialization and management
- Batch price operations with optimization
- Real-time subscriptions with volatility data
- Comprehensive health monitoring

## Implementation Details

### Task 6.1: Replace mock price feeds with live Chainlink integration

✅ **Completed Features**:

1. **Real Chainlink Contract Integration**:
   - Uses actual Chainlink price feed contract addresses on Ethereum mainnet
   - Implements `latestRoundData()` calls for current prices
   - Subscribes to `AnswerUpdated` events for real-time updates

2. **WebSocket Event Subscriptions**:
   - Establishes persistent WebSocket connections to Ethereum nodes
   - Listens for Chainlink AnswerUpdated events
   - Automatic reconnection with exponential backoff

3. **DEX Aggregator Integration**:
   - 1inch API integration for token prices
   - 0x API as backup source
   - Real USD conversion using current exchange rates

4. **Multi-Provider Failover**:
   - Alchemy, Infura, and Ankr RPC provider support
   - Automatic failover on provider failures
   - Health checking and provider ranking

### Task 6.2: Build real price monitoring and caching system

✅ **Completed Features**:

1. **Redis-Based Caching**:
   - High-performance Redis integration with ioredis
   - Configurable TTL based on data source reliability
   - Batch operations for improved performance
   - Memory usage monitoring and optimization

2. **Staleness Detection**:
   - Real timestamp comparison for data freshness
   - Configurable staleness thresholds per source
   - Warning and error level staleness alerts
   - Automatic stale data cleanup

3. **Price Feed Failover**:
   - Circuit breaker pattern implementation
   - Multiple backup price sources
   - Health monitoring with automatic recovery
   - Performance metrics and latency tracking

4. **Volatility Monitoring**:
   - Real-time price change calculations
   - Statistical volatility analysis
   - Multi-timeframe monitoring (1h, 24h, 7d)
   - Volatility alerts and notifications

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_KEY_PREFIX=cryptovault:

# RPC Provider Configuration
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key
ETHEREUM_FALLBACK_RPC_1=https://mainnet.infura.io/v3/your-api-key
ETHEREUM_FALLBACK_RPC_2=https://rpc.ankr.com/eth

# API Keys
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key
COINGECKO_API_KEY=your_coingecko_key

# Price Feed Configuration
ENABLE_REDIS_CACHE=true
ENABLE_PRICE_FAILOVER=true
ENABLE_VOLATILITY_MONITORING=true
DEFAULT_FRESHNESS_TOLERANCE=300
BATCH_UPDATE_INTERVAL=60000

# Volatility Configuration
VOLATILITY_ALERT_HIGH=30
VOLATILITY_ALERT_CRITICAL=50
PRICE_CHANGE_SPIKE_THRESHOLD=20
PRICE_CHANGE_DROP_THRESHOLD=-20
```

### Service Configuration

```typescript
const config = {
  enableRedisCache: true,
  enableFailover: true,
  enableVolatilityMonitoring: true,
  defaultFreshnessTolerance: 300, // 5 minutes
  batchUpdateInterval: 60000, // 1 minute
  supportedTokens: ['ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE']
};
```

## Usage Examples

### Basic Price Fetching

```typescript
import { getIntegratedPriceFeedService } from './integrated-price-feed-service';

const priceFeedService = await getIntegratedPriceFeedService();

// Get single price
const ethPrice = await priceFeedService.getPrice('ETH');
console.log(`ETH: $${ethPrice.priceUSD.toFixed(2)}`);

// Get batch prices
const batchResponse = await priceFeedService.getBatchPrices({
  symbols: ['ETH', 'BTC', 'USDC'],
  includeVolatility: true
});
```

### Real-Time Subscriptions

```typescript
// Subscribe to price updates with volatility monitoring
const subscriptionId = await priceFeedService.subscribeToPrice(
  'ETH',
  (data) => {
    console.log(`ETH: $${data.price.priceUSD.toFixed(2)}`);
    if (data.volatility) {
      console.log(`24h Volatility: ${data.volatility.volatility24h.toFixed(2)}%`);
    }
  },
  {
    includeVolatility: true,
    volatilityAlerts: true,
    priceChangeThreshold: 5 // 5% change alerts
  }
);
```

### USD Conversion

```typescript
// Convert 1 ETH to USD
const amount = '1000000000000000000'; // 1 ETH in wei
const usdValue = await priceFeedService.convertToUSD('ETH', amount, 18);
console.log(`1 ETH = $${usdValue.toFixed(2)}`);
```

## Testing

Run the comprehensive test suite:

```bash
npx ts-node services/data-aggregator/test-integrated-price-feed.ts
```

The test suite covers:
- Service initialization
- Single and batch price fetching
- USD conversion
- Real-time subscriptions
- Health checks
- Event handling
- Configuration validation

## Monitoring and Alerts

### Health Checks

The system provides comprehensive health monitoring:

```typescript
const healthCheck = await priceFeedService.performHealthCheck();
console.log(`System Health: ${healthCheck.status}`);
```

### Event Monitoring

Subscribe to system events for monitoring:

```typescript
priceFeedService.on('volatilityAlert', (alert) => {
  console.log(`🚨 Volatility Alert: ${alert.symbol} - ${alert.message}`);
});

priceFeedService.on('circuitBreakerOpened', (data) => {
  console.log(`⚡ Circuit breaker opened for ${data.sourceName}`);
});

priceFeedService.on('priceStale', (data) => {
  console.log(`⚠️ Stale price detected for ${data.symbol}`);
});
```

## Production Deployment

### Prerequisites

1. **Redis Server**: Required for caching functionality
2. **Ethereum RPC Access**: Alchemy, Infura, or similar provider
3. **API Keys**: CoinGecko, DEX aggregators (optional but recommended)

### Deployment Steps

1. Configure environment variables
2. Initialize Redis server
3. Start the integrated price feed service
4. Monitor health and performance metrics
5. Set up alerting for critical events

### Performance Considerations

- **Caching**: Reduces API calls and improves response times
- **Batch Operations**: Optimizes multiple price requests
- **Connection Pooling**: Manages WebSocket connections efficiently
- **Circuit Breakers**: Prevents cascade failures

## Security Considerations

1. **API Key Management**: Store keys securely in environment variables
2. **Rate Limiting**: Respect API provider rate limits
3. **Input Validation**: Validate all token symbols and addresses
4. **Error Handling**: Graceful degradation on failures
5. **Monitoring**: Track suspicious activity and unusual patterns

## Future Enhancements

1. **Additional Price Sources**: More DEX and CEX integrations
2. **Advanced Analytics**: Machine learning for price prediction
3. **Cross-Chain Support**: Multi-blockchain price feeds
4. **Custom Alerts**: User-defined volatility thresholds
5. **Historical Analysis**: Long-term price trend analysis

## Requirements Fulfilled

This implementation fully satisfies the requirements from the real data integration specification:

- **Requirement 5.1**: ✅ Live Chainlink ETH/USD price feed integration
- **Requirement 5.2**: ✅ Real-time price update subscriptions
- **Requirement 5.3**: ✅ DEX aggregator token price fetching
- **Requirement 5.4**: ✅ Real USD conversion with current rates
- **Requirement 5.5**: ✅ Redis-based price caching with TTL
- **Requirement 5.6**: ✅ Price staleness detection and failover

The system provides a robust, production-ready price feed management solution that replaces all mock data with real, verifiable blockchain and market data sources.