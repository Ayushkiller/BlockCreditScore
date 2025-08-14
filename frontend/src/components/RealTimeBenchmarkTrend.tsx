import React, { useState, useEffect, useRef } from 'react'
import { realTimeService, BenchmarkTrendData, RealTimeBenchmarkUpdate } from '../services/realTimeService'

interface RealTimeBenchmarkTrendProps {
  address: string
  timeRange?: '1h' | '6h' | '24h'
  height?: number
  showComponentBreakdown?: boolean
}

interface TrendChartProps {
  data: BenchmarkTrendData[]
  height: number
  selectedMetric: string
  onMetricChange: (metric: string) => void
}

const METRIC_COLORS = {
  overallPercentile: '#3B82F6', // Blue
  transactionVolume: '#10B981', // Green
  transactionFrequency: '#F59E0B', // Yellow
  stakingActivity: '#8B5CF6', // Purple
  defiInteractions: '#EF4444', // Red
  consistencyScore: '#06B6D4', // Cyan
  diversificationScore: '#84CC16', // Lime
  gasEfficiency: '#F97316', // Orange
  riskScore: '#EC4899' // Pink
}

const METRIC_LABELS = {
  overallPercentile: 'Overall Score',
  transactionVolume: 'Transaction Volume',
  transactionFrequency: 'Transaction Frequency',
  stakingActivity: 'Staking Activity',
  defiInteractions: 'DeFi Interactions',
  consistencyScore: 'Consistency',
  diversificationScore: 'Diversification',
  gasEfficiency: 'Gas Efficiency',
  riskScore: 'Risk Management'
}

function TrendChart({ data, height, selectedMetric, onMetricChange }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, data: BenchmarkTrendData } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = rect.width - padding.left - padding.right
    const chartHeight = rect.height - padding.top - padding.bottom

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Get data values for selected metric
    const values = data.map(d => {
      if (selectedMetric === 'overallPercentile') {
        return d.overallPercentile
      }
      return d.componentPercentiles[selectedMetric as keyof typeof d.componentPercentiles] || 0
    })

    const minValue = Math.max(0, Math.min(...values) - 5)
    const maxValue = Math.min(100, Math.max(...values) + 5)
    const valueRange = maxValue - minValue

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()

      // Y-axis labels
      const value = maxValue - (valueRange / 5) * i
      ctx.fillStyle = '#6B7280'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(value)}%`, padding.left - 10, y + 4)
    }

    // Vertical grid lines
    const timePoints = Math.min(6, data.length)
    for (let i = 0; i <= timePoints; i++) {
      const x = padding.left + (chartWidth / timePoints) * i
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + chartHeight)
      ctx.stroke()

      // X-axis labels
      if (i < data.length) {
        const dataIndex = Math.floor((data.length - 1) * (i / timePoints))
        const timestamp = data[dataIndex]?.timestamp
        if (timestamp) {
          const date = new Date(timestamp)
          const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
          ctx.fillStyle = '#6B7280'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(timeStr, x, padding.top + chartHeight + 20)
        }
      }
    }

    // Draw trend line
    if (data.length > 1) {
      ctx.strokeStyle = METRIC_COLORS[selectedMetric as keyof typeof METRIC_COLORS] || '#3B82F6'
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index
        const value = selectedMetric === 'overallPercentile' 
          ? point.overallPercentile 
          : point.componentPercentiles[selectedMetric as keyof typeof point.componentPercentiles] || 0
        const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw data points
      ctx.fillStyle = METRIC_COLORS[selectedMetric as keyof typeof METRIC_COLORS] || '#3B82F6'
      data.forEach((point, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index
        const value = selectedMetric === 'overallPercentile' 
          ? point.overallPercentile 
          : point.componentPercentiles[selectedMetric as keyof typeof point.componentPercentiles] || 0
        const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()

        // Add white border
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    // Draw trend indicator
    if (data.length >= 2) {
      const firstData = data[0];
      const lastData = data[data.length - 1];
      
      const firstValue = selectedMetric === 'overallPercentile' 
        ? firstData.overallPercentile 
        : (firstData.componentPercentiles as any)[selectedMetric] || 0;
      const lastValue = selectedMetric === 'overallPercentile' 
        ? lastData.overallPercentile 
        : (lastData.componentPercentiles as any)[selectedMetric] || 0;
      
      const change = lastValue - firstValue
      const trendColor = change > 0 ? '#10B981' : change < 0 ? '#EF4444' : '#6B7280'
      const trendIcon = change > 0 ? '↗' : change < 0 ? '↘' : '→'
      
      ctx.fillStyle = trendColor
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${trendIcon} ${change > 0 ? '+' : ''}${change.toFixed(1)}%`, rect.width - 10, 25)
    }

  }, [data, selectedMetric, height])

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const padding = { top: 20, right: 20, bottom: 40, left: 50 }
    const chartWidth = rect.width - padding.left - padding.right

    // Find closest data point
    const dataIndex = Math.round(((x - padding.left) / chartWidth) * (data.length - 1))
    if (dataIndex >= 0 && dataIndex < data.length) {
      setHoveredPoint({ x: event.clientX, y: event.clientY, data: data[dataIndex] })
    }
  }

  const handleCanvasMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        className="w-full cursor-crosshair"
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        style={{ height: `${height}px` }}
      />
      
      {hoveredPoint && (
        <div 
          className="absolute z-10 bg-gray-900 text-white text-xs rounded-lg p-3 pointer-events-none shadow-lg"
          style={{ 
            left: hoveredPoint.x + 10, 
            top: hoveredPoint.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-semibold mb-1">
            {new Date(hoveredPoint.data.timestamp).toLocaleString()}
          </div>
          <div className="space-y-1">
            <div>
              {METRIC_LABELS[selectedMetric as keyof typeof METRIC_LABELS]}: {' '}
              <span className="font-semibold">
                {selectedMetric === 'overallPercentile' 
                  ? hoveredPoint.data.overallPercentile.toFixed(1)
                  : (hoveredPoint.data.componentPercentiles[selectedMetric as keyof typeof hoveredPoint.data.componentPercentiles] || 0).toFixed(1)
                }%
              </span>
            </div>
            <div>Confidence: <span className="font-semibold">{hoveredPoint.data.confidence.toFixed(1)}%</span></div>
            <div>Peer Group: <span className="font-semibold">{hoveredPoint.data.peerGroupSize.toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RealTimeBenchmarkTrend({ 
  address, 
  timeRange = '24h', 
  height = 300,
  showComponentBreakdown = true 
}: RealTimeBenchmarkTrendProps) {
  const [trendData, setTrendData] = useState<BenchmarkTrendData[]>([])
  const [selectedMetric, setSelectedMetric] = useState('overallPercentile')
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  useEffect(() => {
    // Initialize connection and load initial data
    const initializeRealTime = async () => {
      try {
        setConnectionStatus('connecting')
        await realTimeService.connect()
        setConnectionStatus('connected')
        
        // Subscribe to address updates
        realTimeService.subscribeToAddress(address)
        
        // Load initial trend data
        const initialData = realTimeService.getBenchmarkTrend(address, timeRange)
        setTrendData(initialData)
        setLastUpdate(new Date())
        
      } catch (error) {
        console.error('Failed to initialize real-time service:', error)
        setConnectionStatus('error')
      }
    }

    initializeRealTime()

    // Set up event listeners
    const handleBenchmarkUpdate = (event: any) => {
      if (event.data.address === address) {
        setLastUpdate(new Date())
        // Refresh trend data
        const updatedData = realTimeService.getBenchmarkTrend(address, timeRange)
        setTrendData(updatedData)
      }
    }

    const handleTrendUpdate = (event: any) => {
      if (event.data.address === address) {
        setLastUpdate(new Date())
        const updatedData = realTimeService.getBenchmarkTrend(address, timeRange)
        setTrendData(updatedData)
      }
    }

    realTimeService.addEventListener('benchmark_update', handleBenchmarkUpdate)
    realTimeService.addEventListener('trend_update', handleTrendUpdate)

    return () => {
      realTimeService.removeEventListener('benchmark_update', handleBenchmarkUpdate)
      realTimeService.removeEventListener('trend_update', handleTrendUpdate)
      realTimeService.unsubscribeFromAddress(address)
    }
  }, [address, timeRange])

  useEffect(() => {
    setConnectionStatus(realTimeService.getConnectionStatus())
    setIsLive(realTimeService.getConnectionStatus() === 'connected')
  }, [])

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

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'connecting':
        return (
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Live Benchmark Trends</h3>
          <p className="text-sm text-gray-600 mt-1">Real-time percentile ranking changes over time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
            {getConnectionStatusIcon()}
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

      {/* Metric Selector */}
      {showComponentBreakdown && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(METRIC_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedMetric === key
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedMetric === key ? METRIC_COLORS[key as keyof typeof METRIC_COLORS] : undefined
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {trendData.length > 0 ? (
        <div className="mb-4">
          <TrendChart 
            data={trendData} 
            height={height} 
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Trend Data Available</h4>
            <p className="text-gray-600">Trend data will appear as benchmark updates are received</p>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span>Time Range: {timeRange.toUpperCase()}</span>
          <span>Data Points: {trendData.length}</span>
        </div>
        {lastUpdate && (
          <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}