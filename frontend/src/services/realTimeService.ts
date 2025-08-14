import { BenchmarkingData } from './apiService'

export interface RealTimeBenchmarkUpdate {
  address: string
  previousPercentile: number
  newPercentile: number
  percentileChange: number
  componentChanges: {
    [component: string]: {
      previous: number
      new: number
      change: number
    }
  }
  updateTimestamp: number
  updateReason: 'SCHEDULED' | 'TRIGGERED' | 'PEER_GROUP_CHANGE' | 'SCORE_UPDATE'
}

export interface BenchmarkTrendData {
  timestamp: number
  overallPercentile: number
  componentPercentiles: {
    transactionVolume: number
    transactionFrequency: number
    stakingActivity: number
    defiInteractions: number
    consistencyScore: number
    diversificationScore: number
    gasEfficiency: number
    riskScore: number
  }
  peerGroupSize: number
  confidence: number
}

export interface PeerGroupPositionUpdate {
  address: string
  peerGroupId: string
  peerGroupName: string
  newPosition: number
  previousPosition: number
  totalMembers: number
  percentileChange: number
  timestamp: number
}

export interface BenchmarkConfidenceIndicator {
  overallConfidence: number // 0-100
  dataFreshness: number // 0-100 (how recent the data is)
  peerGroupStability: number // 0-100 (how stable the peer group is)
  calculationReliability: number // 0-100 (reliability of the calculation)
  lastUpdateTime: number
  nextUpdateTime: number
  factors: {
    dataQuality: number
    sampleSize: number
    timeRange: number
    marketConditions: number
  }
}

type RealTimeEventType = 
  | 'benchmark_update'
  | 'peer_group_change'
  | 'trend_update'
  | 'confidence_update'
  | 'position_change'

interface RealTimeEvent {
  type: RealTimeEventType
  data: any
  timestamp: number
}

type EventCallback = (event: RealTimeEvent) => void

/**
 * Real-time service for benchmark data updates
 */
export class RealTimeService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventCallbacks: Map<RealTimeEventType, EventCallback[]> = new Map()
  private isConnecting = false
  private subscribedAddresses: Set<string> = new Set()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'

  // Mock data for development - in production this would come from WebSocket
  private mockTrendData: Map<string, BenchmarkTrendData[]> = new Map()
  private mockConfidenceData: Map<string, BenchmarkConfidenceIndicator> = new Map()

  constructor() {
    this.initializeMockData()
  }

  /**
   * Initialize mock data for development
   */
  private initializeMockData(): void {
    // Generate mock trend data for the last 24 hours
    const now = Date.now()
    const mockAddresses = ['0x1234567890123456789012345678901234567890']
    
    mockAddresses.forEach(address => {
      const trendData: BenchmarkTrendData[] = []
      
      for (let i = 24; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000) // Every hour
        const basePercentile = 65 + Math.sin(i * 0.1) * 10 // Oscillating around 65th percentile
        
        trendData.push({
          timestamp,
          overallPercentile: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 5)),
          componentPercentiles: {
            transactionVolume: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 15)),
            transactionFrequency: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 10)),
            stakingActivity: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 20)),
            defiInteractions: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 12)),
            consistencyScore: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 8)),
            diversificationScore: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 6)),
            gasEfficiency: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 10)),
            riskScore: Math.max(0, Math.min(100, basePercentile + (Math.random() - 0.5) * 15))
          },
          peerGroupSize: 1250 + Math.floor(Math.random() * 100),
          confidence: Math.max(70, Math.min(95, 85 + (Math.random() - 0.5) * 10))
        })
      }
      
      this.mockTrendData.set(address, trendData)
      
      // Generate mock confidence data
      this.mockConfidenceData.set(address, {
        overallConfidence: 87,
        dataFreshness: 92,
        peerGroupStability: 78,
        calculationReliability: 91,
        lastUpdateTime: now - 300000, // 5 minutes ago
        nextUpdateTime: now + 600000, // 10 minutes from now
        factors: {
          dataQuality: 89,
          sampleSize: 85,
          timeRange: 92,
          marketConditions: 76
        }
      })
    })
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'))
        return
      }

      this.isConnecting = true
      this.connectionStatus = 'connecting'

      try {
        // In development, we'll simulate WebSocket connection
        if (process.env.NODE_ENV === 'development') {
          this.simulateWebSocketConnection()
          resolve()
          return
        }

        // Production WebSocket connection
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/benchmarks`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('Real-time benchmark service connected')
          this.connectionStatus = 'connected'
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('Real-time benchmark service disconnected')
          this.connectionStatus = 'disconnected'
          this.isConnecting = false
          this.stopHeartbeat()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionStatus = 'error'
          this.isConnecting = false
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        this.connectionStatus = 'error'
        reject(error)
      }
    })
  }

  /**
   * Simulate WebSocket connection for development
   */
  private simulateWebSocketConnection(): void {
    console.log('Simulating real-time benchmark service connection')
    this.connectionStatus = 'connected'
    this.isConnecting = false
    this.reconnectAttempts = 0

    // Simulate periodic updates
    setInterval(() => {
      this.simulateRealTimeUpdates()
    }, 30000) // Every 30 seconds
  }

  /**
   * Simulate real-time updates for development
   */
  private simulateRealTimeUpdates(): void {
    this.subscribedAddresses.forEach(address => {
      // Simulate benchmark update
      const mockUpdate: RealTimeBenchmarkUpdate = {
        address,
        previousPercentile: 65,
        newPercentile: 67,
        percentileChange: 2,
        componentChanges: {
          transactionVolume: { previous: 70, new: 72, change: 2 },
          transactionFrequency: { previous: 60, new: 62, change: 2 },
          stakingActivity: { previous: 65, new: 67, change: 2 },
          defiInteractions: { previous: 68, new: 70, change: 2 }
        },
        updateTimestamp: Date.now(),
        updateReason: 'SCHEDULED'
      }

      this.emitEvent('benchmark_update', mockUpdate)

      // Update mock trend data
      const existingTrend = this.mockTrendData.get(address) || []
      const latestTrend: BenchmarkTrendData = {
        timestamp: Date.now(),
        overallPercentile: mockUpdate.newPercentile,
        componentPercentiles: {
          transactionVolume: mockUpdate.componentChanges.transactionVolume.new,
          transactionFrequency: mockUpdate.componentChanges.transactionFrequency.new,
          stakingActivity: mockUpdate.componentChanges.stakingActivity.new,
          defiInteractions: mockUpdate.componentChanges.defiInteractions.new,
          consistencyScore: 75,
          diversificationScore: 68,
          gasEfficiency: 82,
          riskScore: 71
        },
        peerGroupSize: 1250,
        confidence: 87
      }

      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
      const updatedTrend = [...existingTrend.filter(t => t.timestamp > oneDayAgo), latestTrend]
      this.mockTrendData.set(address, updatedTrend)

      this.emitEvent('trend_update', { address, trendData: latestTrend })
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.connectionStatus = 'disconnected'
    this.subscribedAddresses.clear()
  }

  /**
   * Subscribe to real-time updates for an address
   */
  subscribeToAddress(address: string): void {
    this.subscribedAddresses.add(address)
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        address
      }))
    }
  }

  /**
   * Unsubscribe from real-time updates for an address
   */
  unsubscribeFromAddress(address: string): void {
    this.subscribedAddresses.delete(address)
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        address
      }))
    }
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: RealTimeEventType, callback: EventCallback): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, [])
    }
    this.eventCallbacks.get(eventType)!.push(callback)
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: RealTimeEventType, callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get benchmark trend data for an address
   */
  getBenchmarkTrend(address: string, timeRange: '1h' | '6h' | '24h' = '24h'): BenchmarkTrendData[] {
    const trendData = this.mockTrendData.get(address) || []
    const now = Date.now()
    
    let cutoffTime: number
    switch (timeRange) {
      case '1h':
        cutoffTime = now - (60 * 60 * 1000)
        break
      case '6h':
        cutoffTime = now - (6 * 60 * 60 * 1000)
        break
      case '24h':
      default:
        cutoffTime = now - (24 * 60 * 60 * 1000)
        break
    }
    
    return trendData.filter(data => data.timestamp >= cutoffTime)
  }

  /**
   * Get benchmark confidence indicator for an address
   */
  getBenchmarkConfidence(address: string): BenchmarkConfidenceIndicator | null {
    return this.mockConfidenceData.get(address) || null
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.connectionStatus
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    if (!data.type) return

    this.emitEvent(data.type, data.payload || data)
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: RealTimeEventType, data: any): void {
    const callbacks = this.eventCallbacks.get(eventType)
    if (callbacks) {
      const event: RealTimeEvent = {
        type: eventType,
        data,
        timestamp: Date.now()
      }
      
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      })
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService()