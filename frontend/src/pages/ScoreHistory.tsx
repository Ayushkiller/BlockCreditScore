import { useState, useEffect, useMemo } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { apiService, type ScoreHistoryEntry } from '../services/apiService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface ExtendedScoreHistoryEntry extends ScoreHistoryEntry {
  id: number
  address: string
}

export default function ScoreHistory() {
  const { account } = useWallet()
  const [history, setHistory] = useState<ExtendedScoreHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (account) {
      fetchHistory()
    }
  }, [account])

  // Initialize date range when history is loaded
  useEffect(() => {
    if (history.length > 0 && !dateRange.startDate && !dateRange.endDate) {
      const dates = history.map(entry => new Date(entry.timestamp * 1000))
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
      
      setDateRange({
        startDate: minDate.toISOString().split('T')[0],
        endDate: maxDate.toISOString().split('T')[0]
      })
    }
  }, [history, dateRange.startDate, dateRange.endDate])

  const fetchHistory = async () => {
    if (!account) return

    setLoading(true)
    setError(null)

    try {
      const result = await apiService.getScoreHistory(account)
      
      // Transform the API response to match our interface
      const historyData = result.history.map((entry, index) => ({
        id: index + 1, // Generate ID since API doesn't return it
        address: result.address,
        score: entry.score,
        timestamp: entry.timestamp,
        date: new Date(entry.timestamp * 1000).toISOString().split('T')[0] // Add date field
      }))
      
      setHistory(historyData)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching your score history')
    } finally {
      setLoading(false)
    }
  }

  // Filter history based on date range
  const filteredHistory = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return history
    }

    const startTime = new Date(dateRange.startDate).getTime() / 1000
    const endTime = new Date(dateRange.endDate + 'T23:59:59').getTime() / 1000

    return history.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    )
  }, [history, dateRange])

  // Prepare chart data
  const chartData = useMemo(() => {
    const sortedData = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp)
    
    return {
      labels: sortedData.map(entry => new Date(entry.timestamp * 1000)),
      datasets: [
        {
          label: 'Credit Score',
          data: sortedData.map(entry => entry.score),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: sortedData.map(entry => {
            if (entry.score >= 800) return 'rgb(34, 197, 94)'
            if (entry.score >= 600) return 'rgb(251, 191, 36)'
            return 'rgb(239, 68, 68)'
          }),
          pointBorderColor: sortedData.map(entry => {
            if (entry.score >= 800) return 'rgb(34, 197, 94)'
            if (entry.score >= 600) return 'rgb(251, 191, 36)'
            return 'rgb(239, 68, 68)'
          }),
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    }
  }, [filteredHistory])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Credit Score History',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return new Date(context[0].parsed.x).toLocaleDateString()
          },
          label: (context: any) => {
            const score = context.parsed.y
            let rating = 'Poor'
            if (score >= 800) rating = 'Excellent'
            else if (score >= 700) rating = 'Good'
            else if (score >= 600) rating = 'Fair'
            
            return `Score: ${score} (${rating})`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
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
        beginAtZero: true,
        max: 1000,
        title: {
          display: true,
          text: 'Credit Score'
        },
        ticks: {
          stepSize: 100
        }
      }
    }
  }

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetDateRange = () => {
    if (history.length > 0) {
      const dates = history.map(entry => new Date(entry.timestamp * 1000))
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
      
      setDateRange({
        startDate: minDate.toISOString().split('T')[0],
        endDate: maxDate.toISOString().split('T')[0]
      })
    }
  }

  if (!account) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600">
          Connect your wallet to view your credit score history.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your score history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchHistory} className="btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Score History</h1>
        <button onClick={fetchHistory} className="btn-secondary">
          Refresh
        </button>
      </div>

      {/* Date Range Controls */}
      {history.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex items-end">
                <button onClick={resetDateRange} className="btn-secondary">
                  Reset Range
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'chart' 
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'table' 
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>
          
          {filteredHistory.length !== history.length && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredHistory.length} of {history.length} entries
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="card text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Available</h3>
          <p className="text-gray-600 mb-4">
            Your score history will appear here once you generate your first credit score.
          </p>
          <p className="text-sm text-gray-500">
            Score tracking began when you first generated a credit score for this address.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="card text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data in Selected Range</h3>
          <p className="text-gray-600 mb-4">
            No score history found for the selected date range.
          </p>
          <button onClick={resetDateRange} className="btn-primary">
            Reset Date Range
          </button>
        </div>
      ) : (
        <>
          {/* Chart View */}
          {viewMode === 'chart' && (
            <div className="card">
              <div className="h-96">
                {filteredHistory.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>No data to display in chart</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chart Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.max(...filteredHistory.map(h => h.score))}
                    </div>
                    <div className="text-sm text-gray-500">Highest Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.min(...filteredHistory.map(h => h.score))}
                    </div>
                    <div className="text-sm text-gray-500">Lowest Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(filteredHistory.reduce((sum, h) => sum + h.score, 0) / filteredHistory.length)}
                    </div>
                    <div className="text-sm text-gray-500">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredHistory.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Entries</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...filteredHistory]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((entry, index, sortedArray) => {
                        const getScoreColor = (score: number) => {
                          if (score >= 800) return 'text-success-600'
                          if (score >= 600) return 'text-warning-600'
                          return 'text-danger-600'
                        }

                        const getScoreLabel = (score: number) => {
                          if (score >= 800) return 'Excellent'
                          if (score >= 700) return 'Good'
                          if (score >= 600) return 'Fair'
                          return 'Poor'
                        }

                        const previousEntry = sortedArray[index + 1]
                        const scoreChange = previousEntry ? entry.score - previousEntry.score : 0

                        return (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.timestamp * 1000).toLocaleDateString()}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getScoreColor(entry.score)}`}>
                              {entry.score}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getScoreLabel(entry.score)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {scoreChange === 0 ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                <span className={`flex items-center ${
                                  scoreChange > 0 ? 'text-success-600' : 'text-danger-600'
                                }`}>
                                  {scoreChange > 0 ? (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                    </svg>
                                  )}
                                  {Math.abs(scoreChange)}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}