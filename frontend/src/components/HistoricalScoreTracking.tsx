import React, { useState, useEffect } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { apiService, type ScoreHistoryEntry } from '../services/apiService'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
)

interface HistoricalScoreTrackingProps {
  address: string
  currentScore: number
}

interface ScoreTrend {
  period: string
  change: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface ScoreAnalytics {
  averageScore: number
  highestScore: number
  lowestScore: number
  volatility: number
  trendDirection: 'improving' | 'declining' | 'stable'
  consistencyRating: number
}

export default function HistoricalScoreTracking({ address, currentScore }: HistoricalScoreTrackingProps) {
  const [historyData, setHistoryData] = useState<ScoreHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [viewType, setViewType] = useState<'line' | 'bar' | 'area'>('line')
  const [analytics, setAnalytics] = useState<ScoreAnalytics | null>(null)
  const [trends, setTrends] = useState<ScoreTrend[]>([])

  useEffect(() => {
    fetchHistoricalData()
  }, [address, timeRange])

  useEffect(() => {
    if (historyData.length > 0) {
      calculateAnalytics()
      calculateTrends()
    }
  }, [historyData])

  const fetchHistoricalData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Generate mock historical data for demonstration
      const mockData = generateMockHistoricalData(timeRange)
      setHistoryData(mockData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockHistoricalData = (range: string): ScoreHistoryEntry[] => {
    const now = new Date()
    const data: ScoreHistoryEntry[] = []
    let days: number

    switch (range) {
      case '7d': days = 7; break
      case '30d': days = 30; break
      case '90d': days = 90; break
      case '1y': days = 365; break
      default: days = 30
    }

    const baseScore = currentScore || 650
    const volatility = 0.02 // 2% volatility

    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i)
      const timestamp = date.getTime() / 1000
      
      // Generate realistic score progression with some randomness
      const trendFactor = (days - i) / days * 0.1 // Slight upward trend over time
      const randomFactor = (Math.random() - 0.5) * volatility * 2
      const cycleFactor = Math.sin((i / days) * Math.PI * 4) * 0.05 // Some cyclical variation
      
      const score = Math.round(
        baseScore * (1 + trendFactor + randomFactor + cycleFactor)
      )

      data.push({
        score: Math.max(300, Math.min(1000, score)),
        timestamp,
        date: format(date, 'yyyy-MM-dd')
      })
    }

    return data.reverse()
  }

  const calculateAnalytics = () => {
    if (historyData.length === 0) return

    const scores = historyData.map(entry => entry.score)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const highestScore = Math.max(...scores)
    const lowestScore = Math.min(...scores)
    
    // Calculate volatility (standard deviation)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length
    const volatility = Math.sqrt(variance)
    
    // Determine trend direction
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
    
    let trendDirection: 'improving' | 'declining' | 'stable'
    const trendDiff = secondHalfAvg - firstHalfAvg
    if (Math.abs(trendDiff) < 5) {
      trendDirection = 'stable'
    } else {
      trendDirection = trendDiff > 0 ? 'improving' : 'declining'
    }
    
    // Calculate consistency rating (inverse of volatility, normalized)
    const consistencyRating = Math.max(0, Math.min(100, 100 - (volatility / averageScore * 100 * 5)))

    setAnalytics({
      averageScore: Math.round(averageScore),
      highestScore,
      lowestScore,
      volatility: Math.round(volatility),
      trendDirection,
      consistencyRating: Math.round(consistencyRating)
    })
  }

  const calculateTrends = () => {
    if (historyData.length < 2) return

    const trends: ScoreTrend[] = []
    const currentScoreValue = historyData[historyData.length - 1].score

    // Calculate trends for different periods
    const periods = [
      { key: '7d', days: 7, label: '7 days' },
      { key: '30d', days: 30, label: '30 days' },
      { key: '90d', days: 90, label: '90 days' }
    ]

    periods.forEach(period => {
      const periodData = historyData.slice(-period.days)
      if (periodData.length < 2) return

      const oldScore = periodData[0].score
      const change = currentScoreValue - oldScore
      const percentage = (change / oldScore) * 100

      let trend: 'up' | 'down' | 'stable'
      if (Math.abs(change) < 5) {
        trend = 'stable'
      } else {
        trend = change > 0 ? 'up' : 'down'
      }

      trends.push({
        period: period.label,
        change,
        percentage,
        trend
      })
    })

    setTrends(trends)
  }

  const chartData = {
    labels: historyData.map(entry => new Date(entry.timestamp * 1000)),
    datasets: [
      {
        label: 'Credit Score',
        data: historyData.map(entry => entry.score),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: viewType === 'area' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.8)',
        borderWidth: 2,
        fill: viewType === 'area',
        tension: 0.4,
        pointRadius: viewType === 'line' ? 3 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: function(context: any) {
            return format(new Date(context[0].parsed.x), 'MMM dd, yyyy')
          },
          label: function(context: any) {
            return `Score: ${context.parsed.y}`
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeRange === '7d' ? 'day' : timeRange === '30d' ? 'day' : timeRange === '90d' ? 'week' : 'month',
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: false,
        min: Math.max(300, Math.min(...historyData.map(d => d.score)) - 50),
        max: Math.min(1000, Math.max(...historyData.map(d => d.score)) + 50),
        title: {
          display: true,
          text: 'Credit Score'
        },
        ticks: {
          callback: function(value: any) {
            return value.toString()
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-success-600'
      case 'down': return 'text-danger-600'
      case 'stable': return 'text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="card p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load History</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={fetchHistoricalData} className="btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
            <span>📈</span>
            <span>Score History</span>
          </h2>
          <p className="text-muted-foreground">Track your credit score evolution over time</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range === '1y' ? '1 Year' : range.toUpperCase()}
              </button>
            ))}
          </div>
          
          {/* View Type Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['line', 'bar', 'area'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  viewType === type
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Trends */}
      {trends.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trends.map((trend, index) => (
            <div key={index} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{trend.period}</div>
                  <div className={`text-lg font-semibold ${getTrendColor(trend.trend)}`}>
                    {trend.change > 0 ? '+' : ''}{trend.change} pts
                  </div>
                  <div className={`text-xs ${getTrendColor(trend.trend)}`}>
                    {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="text-2xl">
                  {getTrendIcon(trend.trend)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Chart */}
      <div className="card p-6">
        <div className="h-80">
          {viewType === 'bar' ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {analytics.averageScore}
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-success-600 mb-1">
              {analytics.highestScore}
            </div>
            <div className="text-sm text-muted-foreground">Highest Score</div>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">⚖️</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {analytics.consistencyRating}%
            </div>
            <div className="text-sm text-muted-foreground">Consistency</div>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">
              {analytics.trendDirection === 'improving' ? '📈' : 
               analytics.trendDirection === 'declining' ? '📉' : '➡️'}
            </div>
            <div className={`text-lg font-bold mb-1 capitalize ${
              analytics.trendDirection === 'improving' ? 'text-success-600' :
              analytics.trendDirection === 'declining' ? 'text-danger-600' : 'text-muted-foreground'
            }`}>
              {analytics.trendDirection}
            </div>
            <div className="text-sm text-muted-foreground">Overall Trend</div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Key Insights</h3>
        <div className="space-y-3">
          {analytics && (
            <>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="text-sm text-muted-foreground">
                  Your score has been <strong className="text-foreground">
                    {analytics.trendDirection}
                  </strong> over the selected time period with a consistency rating of{' '}
                  <strong className="text-foreground">{analytics.consistencyRating}%</strong>.
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="text-sm text-muted-foreground">
                  Your highest score of <strong className="text-foreground">{analytics.highestScore}</strong>{' '}
                  shows your potential, while your average of{' '}
                  <strong className="text-foreground">{analytics.averageScore}</strong>{' '}
                  represents your typical performance.
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="text-sm text-muted-foreground">
                  Score volatility of <strong className="text-foreground">{analytics.volatility} points</strong>{' '}
                  indicates {analytics.volatility < 20 ? 'stable' : analytics.volatility < 50 ? 'moderate' : 'high'}{' '}
                  fluctuation in your credit behavior.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
