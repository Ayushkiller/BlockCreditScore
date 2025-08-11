// WebSocket Connection Manager - Real connection management and recovery
// Implements task 9.2: Build real connection management and recovery with frontend connection status

import { WebSocket } from 'ws';
import { formatError } from '../../utils/errors';
import { getCurrentTimestamp } from '../../utils/time';

export interface ConnectionConfig {
  url: string;
  name: string;
  priority: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface ConnectionStatus {
  name: string;
  url: string;
  isConnected: boolean;
  connectionTime: number;
  lastHeartbeat: number;
  reconnectAttempts: number;
  totalReconnects: number;
  lastError?: string;
  latency: number;
  dataReceived: number;
  messagesReceived: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export interface ConnectionRecoveryEvent {
  type: 'connected' | 'disconnected' | 'reconnecting' | 'failed' | 'recovered';
  connection: string;
  timestamp: number;
  details?: string;
}

export interface DataAvailabilityStatus {
  isAvailable: boolean;
  source: 'live' | 'cached' | 'fallback';
  staleness: number;
  confidence: number;
  lastUpdate: number;
}

export class WebSocketConnectionManager {
  private connections: Map<string, WebSocket> = new Map();
  private connectionConfigs: Map<string, ConnectionConfig> = new Map();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private eventCallbacks: Set<(event: ConnectionRecoveryEvent) => void> = new Set();
  private dataCallbacks: Map<string, Set<(data: any) => void>> = new Map();
  private cachedData: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private isShuttingDown: boolean = false;

  /**
   * Add connection configuration
   */
  public addConnection(config: ConnectionConfig): void {
    this.connectionConfigs.set(config.name, config);
    this.connectionStatus.set(config.name, {
      name: config.name,
      url: config.url,
      isConnected: false,
      connectionTime: 0,
      lastHeartbeat: 0,
      reconnectAttempts: 0,
      totalReconnects: 0,
      latency: 0,
      dataReceived: 0,
      messagesReceived: 0,
      connectionQuality: 'disconnected'
    });
  }

  /**
   * Connect to all configured WebSocket endpoints
   */
  public async connectAll(): Promise<void> {
    const connectionPromises = Array.from(this.connectionConfigs.values())
      .sort((a, b) => a.priority - b.priority)
      .map(config => this.connect(config.name));

    await Promise.allSettled(connectionPromises);
  }

  /**
   * Connect to specific WebSocket endpoint
   */
  public async connect(connectionName: string): Promise<void> {
    const config = this.connectionConfigs.get(connectionName);
    if (!config) {
      throw new Error(`Connection config not found: ${connectionName}`);
    }

    const status = this.connectionStatus.get(connectionName)!;

    try {
      // Close existing connection if any
      await this.disconnect(connectionName);

      this.emitEvent({
        type: 'reconnecting',
        connection: connectionName,
        timestamp: getCurrentTimestamp(),
        details: `Attempting connection to ${config.url}`
      });

      const ws = await this.establishConnection(config);
      
      this.connections.set(connectionName, ws);
      
      // Update status
      status.isConnected = true;
      status.connectionTime = getCurrentTimestamp();
      status.lastHeartbeat = getCurrentTimestamp();
      status.reconnectAttempts = 0;
      status.connectionQuality = 'excellent';
      status.lastError = undefined;

      // Setup heartbeat
      this.setupHeartbeat(connectionName);

      this.emitEvent({
        type: 'connected',
        connection: connectionName,
        timestamp: getCurrentTimestamp(),
        details: `Successfully connected to ${config.url}`
      });

      console.log(`✅ WebSocket connected: ${connectionName} (${config.url})`);

    } catch (error) {
      status.lastError = error instanceof Error ? error.message : 'Unknown error';
      status.connectionQuality = 'disconnected';
      
      console.error(`❌ WebSocket connection failed: ${connectionName}`, formatError(error));
      
      // Schedule reconnection if not shutting down
      if (!this.isShuttingDown) {
        this.scheduleReconnection(connectionName);
      }
      
      throw error;
    }
  }

  /**
   * Establish WebSocket connection with timeout
   */
  private async establishConnection(config: ConnectionConfig): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.url);
      let connectionTimeout: NodeJS.Timeout;

      connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error(`Connection timeout after ${config.connectionTimeout}ms`));
      }, config.connectionTimeout);

      ws.on('open', () => {
        clearTimeout(connectionTimeout);
        this.setupWebSocketHandlers(ws, config);
        resolve(ws);
      });

      ws.on('error', (error) => {
        clearTimeout(connectionTimeout);
        reject(error);
      });
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(ws: WebSocket, config: ConnectionConfig): void {
    const status = this.connectionStatus.get(config.name)!;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Update metrics
        status.messagesReceived++;
        status.dataReceived += data.length;
        status.lastHeartbeat = getCurrentTimestamp();
        
        // Handle heartbeat responses
        if (message.type === 'pong') {
          const latency = getCurrentTimestamp() - message.timestamp;
          status.latency = latency;
          this.updateConnectionQuality(config.name, latency);
          return;
        }

        // Cache data for fallback
        this.cacheData(config.name, message);

        // Notify data callbacks
        const callbacks = this.dataCallbacks.get(config.name);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error(`Error in data callback for ${config.name}:`, formatError(error));
            }
          });
        }

      } catch (error) {
        console.error(`Error parsing message from ${config.name}:`, formatError(error));
      }
    });

    ws.on('close', (code, reason) => {
      console.warn(`🔌 WebSocket closed: ${config.name} (${code}: ${reason})`);
      this.handleDisconnection(config.name, `Connection closed: ${code} ${reason}`);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error: ${config.name}`, formatError(error));
      status.lastError = error.message;
      this.handleDisconnection(config.name, error.message);
    });
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(connectionName: string, reason: string): void {
    const status = this.connectionStatus.get(connectionName)!;
    
    // Update status
    status.isConnected = false;
    status.connectionQuality = 'disconnected';
    status.lastError = reason;

    // Clear heartbeat
    const heartbeatInterval = this.heartbeatIntervals.get(connectionName);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      this.heartbeatIntervals.delete(connectionName);
    }

    // Remove connection
    this.connections.delete(connectionName);

    this.emitEvent({
      type: 'disconnected',
      connection: connectionName,
      timestamp: getCurrentTimestamp(),
      details: reason
    });

    // Schedule reconnection if not shutting down
    if (!this.isShuttingDown) {
      this.scheduleReconnection(connectionName);
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(connectionName: string): void {
    const config = this.connectionConfigs.get(connectionName)!;
    const status = this.connectionStatus.get(connectionName)!;

    if (status.reconnectAttempts >= config.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${connectionName}`);
      
      this.emitEvent({
        type: 'failed',
        connection: connectionName,
        timestamp: getCurrentTimestamp(),
        details: `Max reconnection attempts (${config.maxReconnectAttempts}) reached`
      });
      
      return;
    }

    status.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.reconnectDelay * Math.pow(2, status.reconnectAttempts - 1),
      config.maxReconnectDelay
    );

    console.log(`🔄 Scheduling reconnection for ${connectionName} in ${delay}ms (attempt ${status.reconnectAttempts})`);

    const timeout = setTimeout(async () => {
      this.reconnectTimeouts.delete(connectionName);
      
      try {
        await this.connect(connectionName);
        status.totalReconnects++;
        
        this.emitEvent({
          type: 'recovered',
          connection: connectionName,
          timestamp: getCurrentTimestamp(),
          details: `Reconnected after ${status.reconnectAttempts} attempts`
        });
        
      } catch (error) {
        console.error(`Reconnection failed for ${connectionName}:`, formatError(error));
      }
    }, delay);

    this.reconnectTimeouts.set(connectionName, timeout);
  }

  /**
   * Setup heartbeat monitoring
   */
  private setupHeartbeat(connectionName: string): void {
    const config = this.connectionConfigs.get(connectionName)!;
    const ws = this.connections.get(connectionName)!;

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const pingMessage = {
          type: 'ping',
          timestamp: getCurrentTimestamp()
        };
        
        try {
          ws.send(JSON.stringify(pingMessage));
        } catch (error) {
          console.error(`Error sending heartbeat to ${connectionName}:`, formatError(error));
        }
      }
    }, config.heartbeatInterval);

    this.heartbeatIntervals.set(connectionName, interval);
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(connectionName: string, latency: number): void {
    const status = this.connectionStatus.get(connectionName)!;
    
    if (latency < 100) {
      status.connectionQuality = 'excellent';
    } else if (latency < 300) {
      status.connectionQuality = 'good';
    } else {
      status.connectionQuality = 'poor';
    }
  }

  /**
   * Cache data for fallback scenarios
   */
  private cacheData(connectionName: string, data: any): void {
    const cacheKey = `${connectionName}:${data.type || 'data'}`;
    const ttl = this.getTTLForDataType(data.type);
    
    this.cachedData.set(cacheKey, {
      data,
      timestamp: getCurrentTimestamp(),
      ttl
    });

    // Clean up expired cache entries
    this.cleanupExpiredCache();
  }

  /**
   * Get TTL for different data types
   */
  private getTTLForDataType(dataType: string): number {
    const ttlMap: Record<string, number> = {
      'price': 30000,      // 30 seconds
      'transaction': 300000, // 5 minutes
      'block': 60000,      // 1 minute
      'event': 180000,     // 3 minutes
      'default': 120000    // 2 minutes
    };
    
    return ttlMap[dataType] || ttlMap.default;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = getCurrentTimestamp();
    
    for (const [key, cached] of this.cachedData.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cachedData.delete(key);
      }
    }
  }

  /**
   * Get cached data with staleness information
   */
  public getCachedData(connectionName: string, dataType: string = 'data'): DataAvailabilityStatus {
    const cacheKey = `${connectionName}:${dataType}`;
    const cached = this.cachedData.get(cacheKey);
    
    if (!cached) {
      return {
        isAvailable: false,
        source: 'fallback',
        staleness: Infinity,
        confidence: 0,
        lastUpdate: 0
      };
    }

    const now = getCurrentTimestamp();
    const staleness = now - cached.timestamp;
    const isStale = staleness > cached.ttl;
    
    return {
      isAvailable: true,
      source: isStale ? 'cached' : 'live',
      staleness,
      confidence: Math.max(0, 100 - (staleness / cached.ttl) * 100),
      lastUpdate: cached.timestamp
    };
  }

  /**
   * Disconnect from specific WebSocket
   */
  public async disconnect(connectionName: string): Promise<void> {
    const ws = this.connections.get(connectionName);
    if (ws) {
      ws.close();
      this.connections.delete(connectionName);
    }

    // Clear intervals and timeouts
    const heartbeatInterval = this.heartbeatIntervals.get(connectionName);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      this.heartbeatIntervals.delete(connectionName);
    }

    const reconnectTimeout = this.reconnectTimeouts.get(connectionName);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      this.reconnectTimeouts.delete(connectionName);
    }

    // Update status
    const status = this.connectionStatus.get(connectionName);
    if (status) {
      status.isConnected = false;
      status.connectionQuality = 'disconnected';
    }
  }

  /**
   * Disconnect from all WebSockets
   */
  public async disconnectAll(): Promise<void> {
    this.isShuttingDown = true;
    
    const disconnectPromises = Array.from(this.connections.keys())
      .map(name => this.disconnect(name));
    
    await Promise.allSettled(disconnectPromises);
  }

  /**
   * Subscribe to connection events
   */
  public onConnectionEvent(callback: (event: ConnectionRecoveryEvent) => void): () => void {
    this.eventCallbacks.add(callback);
    
    return () => {
      this.eventCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to data from specific connection
   */
  public onData(connectionName: string, callback: (data: any) => void): () => void {
    if (!this.dataCallbacks.has(connectionName)) {
      this.dataCallbacks.set(connectionName, new Set());
    }
    
    this.dataCallbacks.get(connectionName)!.add(callback);
    
    return () => {
      const callbacks = this.dataCallbacks.get(connectionName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.dataCallbacks.delete(connectionName);
        }
      }
    };
  }

  /**
   * Emit connection event
   */
  private emitEvent(event: ConnectionRecoveryEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in connection event callback:', formatError(error));
      }
    });
  }

  /**
   * Get all connection statuses
   */
  public getAllConnectionStatus(): ConnectionStatus[] {
    return Array.from(this.connectionStatus.values());
  }

  /**
   * Get specific connection status
   */
  public getConnectionStatus(connectionName: string): ConnectionStatus | undefined {
    return this.connectionStatus.get(connectionName);
  }

  /**
   * Get overall system health
   */
  public getSystemHealth(): {
    totalConnections: number;
    connectedCount: number;
    disconnectedCount: number;
    reconnectingCount: number;
    averageLatency: number;
    dataAvailability: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  } {
    const statuses = Array.from(this.connectionStatus.values());
    const connected = statuses.filter(s => s.isConnected);
    const reconnecting = statuses.filter(s => s.reconnectAttempts > 0 && !s.isConnected);
    
    const averageLatency = connected.length > 0 
      ? connected.reduce((sum, s) => sum + s.latency, 0) / connected.length
      : 0;
    
    const dataAvailability = statuses.length > 0
      ? (connected.length / statuses.length) * 100
      : 0;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (dataAvailability >= 80) {
      overallHealth = 'healthy';
    } else if (dataAvailability >= 50) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'critical';
    }

    return {
      totalConnections: statuses.length,
      connectedCount: connected.length,
      disconnectedCount: statuses.length - connected.length,
      reconnectingCount: reconnecting.length,
      averageLatency,
      dataAvailability,
      overallHealth
    };
  }

  /**
   * Force reconnection for all connections
   */
  public async forceReconnectAll(): Promise<void> {
    console.log('🔄 Force reconnecting all WebSocket connections...');
    
    const reconnectPromises = Array.from(this.connectionConfigs.keys())
      .map(async (name) => {
        try {
          await this.disconnect(name);
          await this.connect(name);
        } catch (error) {
          console.error(`Failed to reconnect ${name}:`, formatError(error));
        }
      });

    await Promise.allSettled(reconnectPromises);
  }

  /**
   * Get connection recovery statistics
   */
  public getRecoveryStats(): {
    totalReconnects: number;
    averageReconnectTime: number;
    successfulRecoveries: number;
    failedRecoveries: number;
  } {
    const statuses = Array.from(this.connectionStatus.values());
    
    return {
      totalReconnects: statuses.reduce((sum, s) => sum + s.totalReconnects, 0),
      averageReconnectTime: 0, // Would need to track reconnect times
      successfulRecoveries: statuses.filter(s => s.totalReconnects > 0 && s.isConnected).length,
      failedRecoveries: statuses.filter(s => s.reconnectAttempts >= (this.connectionConfigs.get(s.name)?.maxReconnectAttempts || 5)).length
    };
  }
}

// Export singleton instance
let wsConnectionManagerInstance: WebSocketConnectionManager | null = null;

export function getWebSocketConnectionManager(): WebSocketConnectionManager {
  if (!wsConnectionManagerInstance) {
    wsConnectionManagerInstance = new WebSocketConnectionManager();
  }
  return wsConnectionManagerInstance;
}