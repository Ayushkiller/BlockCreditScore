import React, { useState, useEffect } from 'react'
import { BenchmarkingData, CreditScore } from '../services/apiService'
import RealTimeBenchmarkTrend from './RealTimeBenchmarkTrend'
import BenchmarkConfidenceIndicator from './BenchmarkConfidenceIndicator'
import RealTimePeerGroupPosition from './RealTimePeerGroupPosition'
import { realTimeService } from '../services/realTimeService'

interface CompetitivePositioningDashboardProps {
  score: CreditScore
  benchmarkingData?: BenchmarkingData
  enableRealTime?: boolean
  showTrendAnalysis?: boolean
  showConfidenceIndicators?: boolean
}

interface MarketPositionChartProps {
  percentileRank: number
  peerGroupSize: number
  peerGroupType: string
}

interface CompetitiveAdvantagesPanelProps {
  advantages: string[]
  keyStrengths: string[]
  marketPosition: string
  overallRating: string
}

interface MarketOpportunityPanelProps {
  opportunityAreas: Array<{
    area: string
    currentPercentile: number
    potentialPercentile: number
    impactOnOverallScore: number
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'
    actionItems: string[]
  }>
  improvementPriorities: string[]
}

// Market Position Visualization Chart
function MarketPositionChart({ percentileRank, peerGroupSize, peerGroupType }: MarketPositionChartProps) {
  const getPositionColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-600 bg-green-100'
    if (percentile >= 75) return 'text-blue-600 bg-blue-100'
    if (percentile >= 50) return 'text-yellow-600 bg-yellow-100'
    if (percentile >= 25) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getPositionLabel = (percentile: number) => {
    if (percentile >= 90) return 'Elite'
    if (percentile >= 75) return 'High Performer'
    if (percentile >= 50) return 'Above Average'
    if (percentile >= 25) return 'Average'
    return 'Below Average'
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Market Position</h3>
      
      {/* Percentile Visualization */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-2xl font-bold ${getPositionColor(percentileRank)}`}>
          {percentileRank}th
        </div>
        <div className="mt-3">
          <div className="text-lg font-semibold text-gray-900">{getPositionLabel(percentileRank)}</div>
          <div className="text-sm text-gray-600">
            Percentile among {peerGroupSize.toLocaleString()} {peerGroupType} users
          </div>
        </div>
      </div>

      {/* Percentile Range Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>0th</span>
          <span>25th</span>
          <span>50th</span>
          <span>75th</span>
          <span>90th</span>
          <span>100th</span>
        </div>
        <div className="relative h-4 bg-gradient-to-r from-red-200 via-yellow-200 via-blue-200 to-green-200 rounded-full">
          <div 
            className="absolute top-0 w-3 h-4 bg-gray-800 rounded-full transform -translate-x-1/2"
            style={{ left: `${percentileRank}%` }}
          />
        </div>
        <div className="flex justify-center mt-2">
          <div className="text-sm font-medium text-gray-700">
            You rank higher than {percentileRank}% of your peers
          </div>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        <div className="p-2 bg-red-50 rounded">
          <div className="font-semibold text-red-700">0-25th</div>
          <div className="text-red-600">Below Avg</div>
        </div>
        <div className="p-2 bg-orange-50 rounded">
          <div className="font-semibold text-orange-700">25-50th</div>
          <div className="text-orange-600">Average</div>
        </div>
        <div className="p-2 bg-yellow-50 rounded">
          <div className="font-semibold text-yellow-700">50-75th</div>
          <div className="text-yellow-600">Above Avg</div>
        </div>
        <div className="p-2 bg-blue-50 rounded">
          <div className="font-semibold text-blue-700">75-90th</div>
          <div className="text-blue-600">High Perf</div>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <div className="font-semibold text-green-700">90-100th</div>
          <div className="text-green-600">Elite</div>
        </div>
      </div>
    </div>
  )
}

// Competitive Advantages Highlights Panel
function CompetitiveAdvantagesPanel({ advantages, keyStrengths, marketPosition, overallRating }: CompetitiveAdvantagesPanelProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCEPTIONAL': return 'text-green-700 bg-green-100 border-green-200'
      case 'ABOVE_AVERAGE': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'AVERAGE': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'BELOW_AVERAGE': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'NEEDS_IMPROVEMENT': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'EXCEPTIONAL':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'ABOVE_AVERAGE':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Competitive Advantages</h3>
      
      {/* Overall Rating */}
      <div className="mb-6">
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${getRatingColor(overallRating)}`}>
          {getRatingIcon(overallRating)}
          <span className="font-semibold">{overallRating.replace('_', ' ')}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{marketPosition}</p>
      </div>

      {/* Key Strengths */}
      {keyStrengths.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Key Strengths vs Peers</h4>
          <div className="space-y-2">
            {keyStrengths.map((strength, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Advantages */}
      {advantages.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Competitive Advantages</h4>
          <div className="space-y-3">
            {advantages.map((advantage, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">{advantage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {advantages.length === 0 && keyStrengths.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Build Competitive Advantages</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-900 mb-1">Increase Transaction Volume</div>
                <div className="text-xs text-blue-700">Move into the top 25% by increasing your monthly transaction count</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900 mb-1">Diversify Protocol Usage</div>
                <div className="text-xs text-green-700">Use 3+ different DeFi protocols to show sophisticated engagement</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-purple-900 mb-1">Maintain Higher Balances</div>
                <div className="text-xs text-purple-700">Keep larger token balances to demonstrate financial stability</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Market Opportunity Recommendations Panel
function MarketOpportunityPanel({ opportunityAreas, improvementPriorities }: MarketOpportunityPanelProps) {
  const [expandedOpportunity, setExpandedOpportunity] = useState<number | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-700 bg-green-100 border-green-200'
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'HARD': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'SHORT_TERM': return 'text-green-600'
      case 'MEDIUM_TERM': return 'text-yellow-600'
      case 'LONG_TERM': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case 'SHORT_TERM': return '1-3 months'
      case 'MEDIUM_TERM': return '3-6 months'
      case 'LONG_TERM': return '6+ months'
      default: return timeframe
    }
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Market Opportunities</h3>
      
      {/* Improvement Priorities Summary */}
      {improvementPriorities.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-medium text-blue-900 mb-2">Top Improvement Priorities</h4>
          <div className="flex flex-wrap gap-2">
            {improvementPriorities.map((priority, index) => (
              <span key={index} className="px-3 py-1 bg-blue-200 text-blue-800 text-sm font-medium rounded-full">
                {priority}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Areas */}
      {opportunityAreas.length > 0 ? (
        <div className="space-y-4">
          {opportunityAreas.map((opportunity, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedOpportunity(expandedOpportunity === index ? null : index)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{opportunity.area}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(opportunity.difficulty)}`}>
                      {opportunity.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>+{opportunity.impactOnOverallScore} score impact</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={getTimeframeColor(opportunity.timeframe)}>
                        {getTimeframeLabel(opportunity.timeframe)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Current: {opportunity.currentPercentile}th percentile</span>
                      <span>Potential: {opportunity.potentialPercentile}th percentile</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="relative h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${opportunity.currentPercentile}%` }}
                        />
                        <div 
                          className="absolute top-0 h-2 bg-blue-300 rounded-full"
                          style={{ 
                            left: `${opportunity.currentPercentile}%`,
                            width: `${opportunity.potentialPercentile - opportunity.currentPercentile}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedOpportunity === index ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {expandedOpportunity === index && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Action Items</h5>
                  <div className="space-y-2">
                    {opportunity.actionItems.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                        <span className="text-sm text-gray-700">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Excellent Performance</h4>
          <p className="text-gray-600">You're performing well across all areas with limited improvement opportunities</p>
        </div>
      )}
    </div>
  )
}

// Main Competitive Positioning Dashboard Component
export default function CompetitivePositioningDashboard({ 
  score, 
  benchmarkingData,
  enableRealTime = true,
  showTrendAnalysis = true,
  showConfidenceIndicators = true
}: CompetitivePositioningDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'position' | 'confidence'>('overview')
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(enableRealTime)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  useEffect(() => {
    if (isRealTimeEnabled) {
      // Initialize real-time connection
      const initializeRealTime = async () => {
        try {
          setConnectionStatus('connecting')
          await realTimeService.connect()
          setConnectionStatus('connected')
        } catch (error) {
          console.error('Failed to initialize real-time competitive positioning:', error)
          setConnectionStatus('error')
        }
      }

      initializeRealTime()
    }

    return () => {
      if (isRealTimeEnabled) {
        realTimeService.disconnect()
      }
    }
  }, [isRealTimeEnabled])

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled)
  }
  if (!benchmarkingData) {
    return (
      <div className="space-y-6">
        {/* Real-time components can still work without full benchmarking data */}
        {isRealTimeEnabled && showConfidenceIndicators && (
          <BenchmarkConfidenceIndicator 
            address={score.address} 
            showDetails={false}
            compact={true}
          />
        )}
        
        <div className="card text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Competitive Analysis Unavailable</h3>
          <p className="text-gray-600">Benchmarking data is not available for this address</p>
          
          {isRealTimeEnabled && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Real-time features are active and will display data as it becomes available
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const { 
    percentileRankings, 
    comparativeAnalysis, 
    relativePerformance,
    peerGroupClassification 
  } = benchmarkingData

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'connecting': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Controls Header */}
      {isRealTimeEnabled && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Real-Time Competitive Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">Live updates of your competitive position and benchmarks</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <span className="capitalize">{connectionStatus}</span>
              </div>
              
              {/* View Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'trends', label: 'Trends' },
                  { key: 'position', label: 'Position' },
                  { key: 'confidence', label: 'Confidence' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key as any)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      activeView === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              {/* Real-time Toggle */}
              <button
                onClick={toggleRealTime}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isRealTimeEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span>{isRealTimeEnabled ? 'Live' : 'Static'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Market Position Chart */}
          <MarketPositionChart 
            percentileRank={percentileRankings.overallScore.percentile}
            peerGroupSize={peerGroupClassification.primaryPeerGroup.memberCount}
            peerGroupType={peerGroupClassification.primaryPeerGroup.name}
          />

          {/* Real-time Peer Group Position (compact) */}
          {isRealTimeEnabled && (
            <RealTimePeerGroupPosition
              address={score.address}
              benchmarkingData={benchmarkingData}
              compact={true}
              showMovementHistory={false}
            />
          )}

          {/* Competitive Advantages Panel */}
          <CompetitiveAdvantagesPanel 
            advantages={relativePerformance.competitiveAdvantages}
            keyStrengths={relativePerformance.keyStrengths}
            marketPosition={relativePerformance.marketPosition}
            overallRating={relativePerformance.overallRating}
          />

          {/* Market Opportunity Panel */}
          <MarketOpportunityPanel 
            opportunityAreas={comparativeAnalysis.opportunityAreas}
            improvementPriorities={relativePerformance.improvementPriorities}
          />
        </div>
      )}

      {activeView === 'trends' && isRealTimeEnabled && showTrendAnalysis && (
        <div className="space-y-6">
          <RealTimeBenchmarkTrend
            address={score.address}
            timeRange="24h"
            height={400}
            showComponentBreakdown={true}
          />
          
          {/* Additional trend insights */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Trend Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">24h Change</span>
                  <span className="text-sm font-medium text-green-600">+2.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Peak Position</span>
                  <span className="text-sm font-medium text-gray-900">67th percentile</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volatility</span>
                  <span className="text-sm font-medium text-yellow-600">Moderate</span>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Drivers</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Increased transaction volume</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Improved consistency score</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">New peer group members</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'position' && isRealTimeEnabled && (
        <RealTimePeerGroupPosition
          address={score.address}
          benchmarkingData={benchmarkingData}
          showMovementHistory={true}
          compact={false}
        />
      )}

      {activeView === 'confidence' && isRealTimeEnabled && showConfidenceIndicators && (
        <BenchmarkConfidenceIndicator
          address={score.address}
          showDetails={true}
          compact={false}
        />
      )}

      {/* Fallback for non-real-time views */}
      {!isRealTimeEnabled && activeView !== 'overview' && (
        <div className="card text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Real-time Features Disabled</h4>
          <p className="text-gray-600 mb-4">Enable real-time updates to access advanced competitive analysis features</p>
          <button
            onClick={toggleRealTime}
            className="btn-primary"
          >
            Enable Real-time Updates
          </button>
        </div>
      )}
    </div>
  )
}