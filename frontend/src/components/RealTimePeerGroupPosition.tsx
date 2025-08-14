import React, { useState, useEffect } from 'react'
import { realTimeService, PeerGroupPositionUpdate } from '../services/realTimeService'
import { BenchmarkingData } from '../services/apiService'

interface RealTimePeerGroupPositionProps {
  address: string
  benchmarkingData?: BenchmarkingData
  showMovementHistory?: boolean
  compact?: boolean
}

interface PositionMovement {
  timestamp: number
  previousPosition: number
  newPosition: number
  change: number
  reason: string
}

interface PeerGroupVisualizationProps {
  currentPosition: number
  totalMembers: number
  percentile: number
  recentMovements: PositionMovement[]
}

function PeerGroupVisualization({ 
  currentPosition, 
  totalMembers, 
  percentile,
  recentMovements 
}: PeerGroupVisualizationProps) {
  const getPositionColor = (percentile: number) => {
    if (percentile >= 90) return 'bg-green-500'
    if (percentile >= 75) return 'bg-blue-500'
    if (percentile >= 50) return 'bg-yellow-500'
    if (percentile >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getPositionLabel = (percentile: number) => {
    if (percentile >= 90) return 'Elite'
    if (percentile >= 75) return 'High Performer'
    if (percentile >= 50) return 'Above Average'
    if (percentile >= 25) return 'Average'
    return 'Below Average'
  }

  const getMovementIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    } else if (change < 0) {
      return (
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="space-y-4">
      {/* Position Indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-lg font-bold ${getPositionColor(percentile)}`}>
          #{currentPosition}
        </div>
        <div className="mt-2">
          <div className="text-lg font-semibold text-gray-900">{getPositionLabel(percentile)}</div>
          <div className="text-sm text-gray-600">
            {percentile.toFixed(1)}th percentile of {totalMembers.toLocaleString()} users
          </div>
        </div>
      </div>

      {/* Position Range Visualization */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>#1</span>
          <span>#{Math.floor(totalMembers / 4)}</span>
          <span>#{Math.floor(totalMembers / 2)}</span>
          <span>#{Math.floor(totalMembers * 3 / 4)}</span>
          <span>#{totalMembers}</span>
        </div>
        <div className="relative h-4 bg-gradient-to-r from-green-200 via-yellow-200 via-orange-200 to-red-200 rounded-full">
          <div 
            className="absolute top-0 w-3 h-4 bg-gray-800 rounded-full transform -translate-x-1/2"
            style={{ left: `${((totalMembers - currentPosition) / totalMembers) * 100}%` }}
          />
        </div>
        <div className="flex justify-center mt-2">
          <div className="text-sm font-medium text-gray-700">
            You rank #{currentPosition} out of {totalMembers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      {recentMovements.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Position Changes</h5>
          <div className="space-y-2">
            {recentMovements.slice(0, 3).map((movement, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {getMovementIcon(movement.change)}
                  <span className="text-gray-600">
                    {new Date(movement.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">
                    #{movement.previousPosition} → #{movement.newPosition}
                  </span>
                  <span className={`font-medium ${
                    movement.change > 0 ? 'text-green-600' : 
                    movement.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {movement.change > 0 ? '+' : ''}{movement.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RealTimePeerGroupPosition({ 
  address, 
  benchmarkingData,
  showMovementHistory = true,
  compact = false 
}: RealTimePeerGroupPositionProps) {
  const [currentPosition, setCurrentPosition] = useState<number>(0)
  const [totalMembers, setTotalMembers] = useState<number>(0)
  const [percentile, setPercentile] = useState<number>(0)
  const [peerGroupName, setPeerGroupName] = useState<string>('')
  const [positionMovements, setPositionMovements] = useState<PositionMovement[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  useEffect(() => {
    // Initialize with benchmarking data if available
    if (benchmarkingData) {
      const primaryPeerGroup = benchmarkingData.peerGroupClassification.primaryPeerGroup
      const overallRanking = benchmarkingData.percentileRankings.overallScore
      
      setCurrentPosition(overallRanking.rank)
      setTotalMembers(primaryPeerGroup.memberCount)
      setPercentile(overallRanking.percentile)
      setPeerGroupName(primaryPeerGroup.name)
    }

    // Set up real-time connection
    const initializeRealTime = async () => {
      try {
        setConnectionStatus('connecting')
        await realTimeService.connect()
        setConnectionStatus('connected')
        setIsLive(true)
        
        // Subscribe to position updates
        realTimeService.subscribeToAddress(address)
        
      } catch (error) {
        console.error('Failed to initialize real-time peer group updates:', error)
        setConnectionStatus('error')
      }
    }

    initializeRealTime()

    // Set up event listeners
    const handlePositionChange = (event: any) => {
      const update: PeerGroupPositionUpdate = event.data
      if (update.address === address) {
        setCurrentPosition(update.newPosition)
        setTotalMembers(update.totalMembers)
        setPercentile(100 - (update.newPosition / update.totalMembers) * 100)
        setLastUpdate(new Date())
        
        // Add to movement history
        const movement: PositionMovement = {
          timestamp: update.timestamp,
          previousPosition: update.previousPosition,
          newPosition: update.newPosition,
          change: update.previousPosition - update.newPosition, // Positive = moved up
          reason: 'Score update'
        }
        
        setPositionMovements(prev => [movement, ...prev.slice(0, 9)]) // Keep last 10 movements
      }
    }

    const handlePeerGroupChange = (event: any) => {
      if (event.data.address === address) {
        // Peer group composition changed
        setLastUpdate(new Date())
        
        // Add movement for peer group change
        const movement: PositionMovement = {
          timestamp: Date.now(),
          previousPosition: currentPosition,
          newPosition: currentPosition, // Position might stay same but percentile changes
          change: 0,
          reason: 'Peer group updated'
        }
        
        setPositionMovements(prev => [movement, ...prev.slice(0, 9)])
      }
    }

    realTimeService.addEventListener('position_change', handlePositionChange)
    realTimeService.addEventListener('peer_group_change', handlePeerGroupChange)

    // Simulate position updates for development
    const simulateUpdates = setInterval(() => {
      if (isLive && currentPosition > 0) {
        // Simulate small position changes
        const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
        const newPosition = Math.max(1, Math.min(totalMembers, currentPosition + change))
        
        if (newPosition !== currentPosition) {
          const movement: PositionMovement = {
            timestamp: Date.now(),
            previousPosition: currentPosition,
            newPosition: newPosition,
            change: currentPosition - newPosition, // Positive = moved up
            reason: 'Simulated update'
          }
          
          setCurrentPosition(newPosition)
          setPercentile(100 - (newPosition / totalMembers) * 100)
          setPositionMovements(prev => [movement, ...prev.slice(0, 9)])
          setLastUpdate(new Date())
        }
      }
    }, 45000) // Every 45 seconds

    return () => {
      realTimeService.removeEventListener('position_change', handlePositionChange)
      realTimeService.removeEventListener('peer_group_change', handlePeerGroupChange)
      realTimeService.unsubscribeFromAddress(address)
      clearInterval(simulateUpdates)
    }
  }, [address, benchmarkingData, isLive, currentPosition, totalMembers])

  const toggleLiveUpdates = () => {
    if (isLive) {
      realTimeService.unsubscribeFromAddress(address)
      setIsLive(false)
    } else {
      realTimeService.subscribeToAddress(address)
      setIsLive(true)
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'connecting': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            percentile >= 75 ? 'bg-green-500' :
            percentile >= 50 ? 'bg-blue-500' :
            percentile >= 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}>
            #{currentPosition}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {percentile.toFixed(1)}th percentile
            </div>
            <div className="text-xs text-gray-600">
              {totalMembers.toLocaleString()} peers
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {positionMovements.length > 0 && (
            <div className="flex items-center space-x-1">
              {positionMovements[0].change > 0 ? (
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : positionMovements[0].change < 0 ? (
                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : null}
              <span className="text-xs text-gray-500">
                {Math.abs(positionMovements[0].change)}
              </span>
            </div>
          )}
          
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>
      </div>
    )
  }

  if (!benchmarkingData && currentPosition === 0) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Peer Group Position Unavailable</h3>
        <p className="text-gray-600">Position data will appear once benchmarking is available</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Live Peer Group Position</h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time ranking in {peerGroupName || 'peer group'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="capitalize">{connectionStatus}</span>
          </div>
          
          {/* Live Toggle */}
          <button
            onClick={toggleLiveUpdates}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isLive 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Position Visualization */}
      <PeerGroupVisualization
        currentPosition={currentPosition}
        totalMembers={totalMembers}
        percentile={percentile}
        recentMovements={showMovementHistory ? positionMovements : []}
      />

      {/* Movement History */}
      {showMovementHistory && positionMovements.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Position Movement History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {positionMovements.map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500">
                    {new Date(movement.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-700">
                    {movement.reason}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    #{movement.previousPosition} → #{movement.newPosition}
                  </span>
                  {movement.change !== 0 && (
                    <div className="flex items-center space-x-1">
                      {movement.change > 0 ? (
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-xs font-medium ${
                        movement.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(movement.change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 mt-6">
        <div className="flex items-center space-x-4">
          <span>Movements Tracked: {positionMovements.length}</span>
          <span>Peer Group: {peerGroupName}</span>
        </div>
        {lastUpdate && (
          <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}