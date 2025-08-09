// Ethereum Transaction Monitoring Service
// Implements WebSocket connections to Ethereum mainnet for real-time transaction monitoring

import { WebSocket } from 'ws';
import { CrossChainTransaction, TransactionCategory, ProtocolData } from '../../types/transactions';
import { isValidAddress } from '../../utils/crypto';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface EthereumMonitorConfig {
  rpcUrl: string;
  wsUrl: string;
  fallbackRpcUrls: string[];
  fallbackWsUrls: string[];
  detectionSLA: number; // milliseconds (15 minutes = 900000)
  retryAttempts: number;
  retryDelay: number;
}

export interface MonitoredTransaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  input: string;
  timestamp: number;
  protocol?: string;
  category?: TransactionCategory;
}

export interface TransactionFilter {
  addresses: string[];
  topics: string[];
  protocols: ProtocolData[];
}

export class EthereumTransactionMonitor {
  private ws: WebSocket | null = null;
  private config: EthereumMonitorConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private currentRpcIndex: number = 0;
  private currentWsIndex: number = 0;
  private transactionCallbacks: Map<string, (tx: MonitoredTransaction) => void> = new Map();
  private protocolFilters: TransactionFilter;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: EthereumMonitorConfig) {
    this.config = config;
    this.protocolFilters = this.initializeProtocolFilters();
  }

  /**
   * Initialize protocol filters for major DeFi protocols
   * Focuses on Uniswap, Aave, Compound, and MakerDAO as specified
   */
  private initializeProtocolFilters(): TransactionFilter {
    const protocols: ProtocolData[] = [
      // Uniswap V2 & V3 - Trading/Liquidity
      {
        name: 'Uniswap V2',
        category: TransactionCategory.TRADING,
        contractAddresses: [
          '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Router
          '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'  // Factory
        ],
        riskMultiplier: 1.0,
        dataWeight: 1.0
      },
      {
        name: 'Uniswap V3',
        category: TransactionCategory.LIQUIDITY_PROVISION,
        contractAddresses: [
          '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Router
          '0x1F98431c8aD98523631AE4a59f267346ea31F984'  // Factory
        ],
        riskMultiplier: 1.2,
        dataWeight: 1.2
      },
      // Aave - Lending/Borrowing
      {
        name: 'Aave V2',
        category: TransactionCategory.LENDING,
        contractAddresses: [
          '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // LendingPool
          '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5'  // AddressProvider
        ],
        riskMultiplier: 0.8,
        dataWeight: 1.5
      },
      {
        name: 'Aave V3',
        category: TransactionCategory.BORROWING,
        contractAddresses: [
          '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', // Pool
          '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e'  // AddressProvider
        ],
        riskMultiplier: 0.9,
        dataWeight: 1.4
      },
      // Compound - Lending/Borrowing
      {
        name: 'Compound V2',
        category: TransactionCategory.LENDING,
        contractAddresses: [
          '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // Comptroller
          '0xc00e94Cb662C3520282E6f5717214004A7f26888'  // COMP Token
        ],
        riskMultiplier: 0.7,
        dataWeight: 1.3
      },
      // MakerDAO - Staking/Governance
      {
        name: 'MakerDAO',
        category: TransactionCategory.STAKING,
        contractAddresses: [
          '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B', // Vat
          '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'  // MKR Token
        ],
        riskMultiplier: 0.6,
        dataWeight: 1.6
      },
      {
        name: 'MakerDAO Governance',
        category: TransactionCategory.GOVERNANCE,
        contractAddresses: [
          '0x0a3f6849f78076aefaDf113F5BED87720274dDC0', // Chief
          '0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB'  // DSPause
        ],
        riskMultiplier: 0.5,
        dataWeight: 2.0
      }
    ];

    const addresses = protocols.flatMap(p => p.contractAddresses);
    const topics = [
      // ERC20 Transfer
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      // Uniswap Swap
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
      // Aave Deposit
      '0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951',
      // Compound Supply
      '0x13ed6866d4e1ee6da46f845c46d7e6760d4dc2a5d5f5f5f5f5f5f5f5f5f5f5f5'
    ];

    return {
      addresses,
      topics,
      protocols
    };
  }

  /**
   * Start monitoring Ethereum transactions with WebSocket connection
   */
  public async startMonitoring(): Promise<void> {
    try {
      await this.connectWebSocket();
      this.setupHeartbeat();
      console.log('Ethereum transaction monitoring started');
    } catch (error) {
      console.error('Failed to start monitoring:', formatError(error));
      throw error;
    }
  }

  /**
   * Stop monitoring and cleanup connections
   */
  public async stopMonitoring(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('Ethereum transaction monitoring stopped');
  }

  /**
   * Subscribe to transactions for a specific wallet address
   */
  public subscribeToWallet(address: string, callback: (tx: MonitoredTransaction) => void): void {
    if (!isValidAddress(address)) {
      throw new Error(`Invalid Ethereum address: ${address}`);
    }

    this.transactionCallbacks.set(address.toLowerCase(), callback);
    console.log(`Subscribed to wallet: ${address}`);
  }

  /**
   * Unsubscribe from wallet transaction monitoring
   */
  public unsubscribeFromWallet(address: string): void {
    this.transactionCallbacks.delete(address.toLowerCase());
    console.log(`Unsubscribed from wallet: ${address}`);
  }

  /**
   * Connect to Ethereum WebSocket with failover support
   */
  private async connectWebSocket(): Promise<void> {
    const wsUrls = [this.config.wsUrl, ...this.config.fallbackWsUrls];

    for (let i = 0; i < wsUrls.length; i++) {
      try {
        const wsUrl = wsUrls[this.currentWsIndex % wsUrls.length];
        console.log(`Attempting WebSocket connection to: ${wsUrl}`);

        await this.establishConnection(wsUrl);
        this.reconnectAttempts = 0;
        this.currentWsIndex = i;
        return;
      } catch (error) {
        console.error(`WebSocket connection failed for ${wsUrls[i]}:`, formatError(error));
        this.currentWsIndex++;

        if (i === wsUrls.length - 1) {
          throw new Error('All WebSocket endpoints failed');
        }
      }
    }
  }

  /**
   * Establish WebSocket connection to specific endpoint
   */
  private async establishConnection(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout;

      connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      ws.on('open', () => {
        clearTimeout(connectionTimeout);
        this.ws = ws;
        this.isConnected = true;
        this.lastHeartbeat = getCurrentTimestamp();

        // Subscribe to pending transactions and new blocks
        this.subscribeToEvents();
        resolve();
      });

      ws.on('message', (data: Buffer) => {
        try {
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error handling WebSocket message:', formatError(error));
        }
      });

      ws.on('error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', formatError(error));
        reject(error);
      });

      ws.on('close', () => {
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        this.handleDisconnection();
      });
    });
  }

  /**
   * Subscribe to relevant Ethereum events
   */
  private subscribeToEvents(): void {
    if (!this.ws || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    // Subscribe to new pending transactions
    const pendingTxSubscription = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: ['newPendingTransactions']
    };

    // Subscribe to new block headers
    const newBlockSubscription = {
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_subscribe',
      params: ['newHeads']
    };

    // Subscribe to logs for DeFi protocols
    const logsSubscription = {
      jsonrpc: '2.0',
      id: 3,
      method: 'eth_subscribe',
      params: [
        'logs',
        {
          address: this.protocolFilters.addresses,
          topics: [this.protocolFilters.topics]
        }
      ]
    };

    this.ws.send(JSON.stringify(pendingTxSubscription));
    this.ws.send(JSON.stringify(newBlockSubscription));
    this.ws.send(JSON.stringify(logsSubscription));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: Buffer): void {
    const message = JSON.parse(data.toString());
    this.lastHeartbeat = getCurrentTimestamp();

    if (message.method === 'eth_subscription') {
      const { subscription, result } = message.params;

      if (typeof result === 'string') {
        // New pending transaction hash
        this.handlePendingTransaction(result);
      } else if (result.hash && result.number) {
        // New block header
        this.handleNewBlock(result);
      } else if (result.topics) {
        // Log event from DeFi protocol
        this.handleProtocolLog(result);
      }
    }
  }

  /**
   * Handle new pending transaction
   */
  private async handlePendingTransaction(txHash: string): Promise<void> {
    try {
      // Get full transaction details
      const tx = await this.getTransactionDetails(txHash);
      if (!tx) return;

      // Check if transaction involves monitored wallets
      const fromAddress = tx.from.toLowerCase();
      const toAddress = tx.to?.toLowerCase();

      if (this.transactionCallbacks.has(fromAddress) ||
        (toAddress && this.transactionCallbacks.has(toAddress))) {

        // Categorize transaction based on protocol interaction
        const categorizedTx = this.categorizeTransaction(tx);

        // Notify relevant callbacks
        if (this.transactionCallbacks.has(fromAddress)) {
          this.transactionCallbacks.get(fromAddress)!(categorizedTx);
        }
        if (toAddress && this.transactionCallbacks.has(toAddress)) {
          this.transactionCallbacks.get(toAddress)!(categorizedTx);
        }
      }
    } catch (error) {
      console.error(`Error handling pending transaction ${txHash}:`, formatError(error));
    }
  }

  /**
   * Handle new block confirmation
   */
  private handleNewBlock(blockHeader: any): void {
    const blockNumber = parseInt(blockHeader.number, 16);
    console.log(`New block confirmed: ${blockNumber}`);

    // Update detection SLA tracking
    this.updateDetectionMetrics(blockNumber);
  }

  /**
   * Handle protocol-specific log events
   */
  private handleProtocolLog(log: any): void {
    const protocol = this.identifyProtocol(log.address);
    if (protocol) {
      console.log(`Protocol event detected: ${protocol.name} at ${log.address}`);
      // Additional protocol-specific processing can be added here
    }
  }

  /**
   * Get full transaction details from hash
   */
  private async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const response = await fetch(this.getCurrentRpcUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionByHash',
          params: [txHash]
        })
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error(`Failed to get transaction details for ${txHash}:`, formatError(error));
      return null;
    }
  }

  /**
   * Categorize transaction based on protocol interaction and data
   */
  private categorizeTransaction(tx: any): MonitoredTransaction {
    const protocol = this.identifyProtocol(tx.to);
    const category = this.determineTransactionCategory(tx, protocol);

    return {
      hash: tx.hash,
      blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      input: tx.input,
      timestamp: getCurrentTimestamp(),
      protocol: protocol?.name,
      category
    };
  }

  /**
   * Identify which DeFi protocol a transaction interacts with
   */
  private identifyProtocol(address: string): ProtocolData | undefined {
    if (!address) return undefined;

    return this.protocolFilters.protocols.find(protocol =>
      protocol.contractAddresses.some(addr =>
        addr.toLowerCase() === address.toLowerCase()
      )
    );
  }

  /**
   * Determine transaction category based on protocol and method signature
   */
  private determineTransactionCategory(tx: any, protocol?: ProtocolData): TransactionCategory {
    if (!protocol) {
      return TransactionCategory.TRADING; // Default category
    }

    // Analyze method signature from input data
    const methodSignature = tx.input.slice(0, 10);

    // Common DeFi method signatures for categorization
    const methodCategories: Record<string, TransactionCategory> = {
      // Uniswap
      '0x38ed1739': TransactionCategory.TRADING, // swapExactTokensForTokens
      '0x7ff36ab5': TransactionCategory.TRADING, // swapExactETHForTokens
      '0xe8e33700': TransactionCategory.LIQUIDITY_PROVISION, // addLiquidity
      '0xf305d719': TransactionCategory.LIQUIDITY_PROVISION, // addLiquidityETH

      // Aave
      '0xe8eda9df': TransactionCategory.LENDING, // deposit
      '0x69328dec': TransactionCategory.BORROWING, // borrow
      '0x573ade81': TransactionCategory.BORROWING, // repay

      // Compound
      '0x1249c58b': TransactionCategory.LENDING, // mint
      '0xdb006a75': TransactionCategory.BORROWING, // redeem
      '0xc5ebeaec': TransactionCategory.BORROWING, // borrow

      // MakerDAO
      '0x3b4da69f': TransactionCategory.STAKING, // lock
      '0xa9059cbb': TransactionCategory.GOVERNANCE, // transfer (for voting)
    };

    return methodCategories[methodSignature] || protocol.category;
  }

  /**
   * Handle WebSocket disconnection with automatic reconnection
   */
  private async handleDisconnection(): Promise<void> {
    console.log('WebSocket disconnected, attempting reconnection...');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      setTimeout(async () => {
        try {
          await this.connectWebSocket();
          console.log('WebSocket reconnected successfully');
        } catch (error) {
          console.error('Reconnection failed:', formatError(error));
          this.handleDisconnection();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached, monitoring stopped');
      throw new Error('WebSocket connection permanently lost');
    }
  }

  /**
   * Setup heartbeat monitoring to detect connection issues
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = getCurrentTimestamp();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;

      // If no heartbeat for 5 minutes, consider connection stale
      if (timeSinceLastHeartbeat > 300000) {
        console.warn('WebSocket connection appears stale, reconnecting...');
        this.handleDisconnection();
      }
    }, 60000); // Check every minute
  }

  /**
   * Update detection metrics for SLA monitoring
   */
  private updateDetectionMetrics(blockNumber: number): void {
    // Track detection latency for SLA compliance (15-minute requirement)
    const detectionTime = getCurrentTimestamp();

    // Log metrics for monitoring (in production, this would go to monitoring service)
    console.log(`Block ${blockNumber} detected at ${detectionTime}`);
  }

  /**
   * Get current RPC URL with failover support
   */
  private getCurrentRpcUrl(): string {
    const rpcUrls = [this.config.rpcUrl, ...this.config.fallbackRpcUrls];
    return rpcUrls[this.currentRpcIndex % rpcUrls.length];
  }

  /**
   * Switch to next RPC endpoint on failure
   */
  private switchRpcEndpoint(): void {
    this.currentRpcIndex++;
    console.log(`Switched to RPC endpoint: ${this.getCurrentRpcUrl()}`);
  }

  /**
   * Get monitoring status and metrics
   */
  public getMonitoringStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    lastHeartbeat: number;
    subscribedWallets: number;
    currentRpcUrl: string;
    currentWsUrl: string;
  } {
    const wsUrls = [this.config.wsUrl, ...this.config.fallbackWsUrls];

    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      subscribedWallets: this.transactionCallbacks.size,
      currentRpcUrl: this.getCurrentRpcUrl(),
      currentWsUrl: wsUrls[this.currentWsIndex % wsUrls.length]
    };
  }

  /**
   * Get supported protocols information
   */
  public getSupportedProtocols(): ProtocolData[] {
    return this.protocolFilters.protocols;
  }

  /**
   * Validate if an address belongs to a monitored DeFi protocol
   */
  public isMonitoredProtocol(address: string): boolean {
    return this.protocolFilters.addresses.some(addr =>
      addr.toLowerCase() === address.toLowerCase()
    );
  }
}

// Export configuration factory
export function createEthereumMonitorConfig(): EthereumMonitorConfig {
  return {
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    wsUrl: process.env.ETHEREUM_WS_URL || 'wss://eth-mainnet.alchemyapi.io/v2/your-api-key',
    fallbackRpcUrls: [
      process.env.ETHEREUM_FALLBACK_RPC_1 || 'https://mainnet.infura.io/v3/your-api-key',
      process.env.ETHEREUM_FALLBACK_RPC_2 || 'https://rpc.ankr.com/eth'
    ],
    fallbackWsUrls: [
      process.env.ETHEREUM_FALLBACK_WS_1 || 'wss://mainnet.infura.io/ws/v3/your-api-key',
      process.env.ETHEREUM_FALLBACK_WS_2 || 'wss://rpc.ankr.com/eth/ws'
    ],
    detectionSLA: 15 * 60 * 1000, // 15 minutes in milliseconds
    retryAttempts: 5,
    retryDelay: 1000
  };
}