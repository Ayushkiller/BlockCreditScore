// WebSocket Server for Real-Time Updates
const WebSocket = require('ws');

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.transactionUpdateInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/transactions'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('📡 WebSocket client connected from:', req.socket.remoteAddress);
      this.clients.add(ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to CryptoVault transaction stream',
        timestamp: Date.now()
      }));

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('📨 WebSocket message received:', data);
          
          // Handle subscription requests
          if (data.type === 'subscribe') {
            ws.subscriptions = data.topics || ['transactions'];
            ws.send(JSON.stringify({
              type: 'subscription_confirmed',
              topics: ws.subscriptions,
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('📡 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Start sending mock transaction updates
    this.startTransactionUpdates();

    console.log('✅ WebSocket server initialized on /ws/transactions');
  }

  startTransactionUpdates() {
    // Send mock transaction updates every 5 seconds
    this.transactionUpdateInterval = setInterval(() => {
      if (this.clients.size === 0) return;

      const mockTransaction = this.generateMockTransaction();
      this.broadcast({
        type: 'transaction_update',
        data: mockTransaction,
        timestamp: Date.now()
      });
    }, 5000);
  }

  generateMockTransaction() {
    const tokens = ['ETH', 'USDC', 'DAI', 'LINK', 'UNI', 'AAVE'];
    const protocols = ['Uniswap', 'Compound', 'Aave', 'MakerDAO', 'Curve'];
    const types = ['swap', 'lend', 'borrow', 'stake', 'unstake', 'claim'];
    
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = (Math.random() * 1000).toFixed(2);
    const usdValue = (parseFloat(amount) * (Math.random() * 3000 + 100)).toFixed(2);

    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      from: '0x' + Math.random().toString(16).substr(2, 40),
      to: '0x' + Math.random().toString(16).substr(2, 40),
      type,
      protocol,
      token,
      amount,
      usdValue,
      gasUsed: Math.floor(Math.random() * 200000 + 21000),
      gasPrice: (Math.random() * 50 + 10).toFixed(2),
      blockNumber: Math.floor(Math.random() * 1000000 + 18000000),
      timestamp: Date.now(),
      status: Math.random() > 0.1 ? 'success' : 'failed'
    };
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('❌ Error sending WebSocket message:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });
  }

  // Send price updates to connected clients
  broadcastPriceUpdate(priceData) {
    this.broadcast({
      type: 'price_update',
      data: priceData,
      timestamp: Date.now()
    });
  }

  // Send system alerts
  broadcastAlert(alert) {
    this.broadcast({
      type: 'system_alert',
      data: alert,
      timestamp: Date.now()
    });
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      isRunning: this.wss !== null,
      uptime: process.uptime()
    };
  }

  stop() {
    if (this.transactionUpdateInterval) {
      clearInterval(this.transactionUpdateInterval);
      this.transactionUpdateInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    console.log('🛑 WebSocket server stopped');
  }
}

module.exports = new WebSocketServer();