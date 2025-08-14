import React, { useState, useEffect } from 'react'
import { realTimeService, BenchmarkConfidenceIndicator as ConfidenceData } from '../services/realTimeService'

interface BenchmarkConfidenceIndicatorProps {
  address: string
  showDetails?: boolean
  compact?: boolean
}

interface ConfidenceFactorProps {
  label: string
  value: number
  description: string
  isExpanded: boolean
  onToggle: () => void
}

function ConfidenceFactor({ label, value, description, isExpanded, onToggle }: ConfidenceFactorProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100'
    if (confidence >= 75) return 'text-blue-600 bg-blue-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    if (confidence >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    } else if (confidence >= 75) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    } else if (confidence >= 60) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getConfidenceColor(value)}`}>
            {getConfidenceIcon(value)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{label}</div>
            <div className="text-sm text-gray-600">{value}%</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                value >= 90 ? 'bg-green-500' :
                value >= 75 ? 'bg-blue-500' :
                value >= 60 ? 'bg-yellow-500' :
                value >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}
    </div>
  )
}

export default function BenchmarkConfidenceIndicator({ 
  address, 
  showDetails = true, 
  compact = false 
}: BenchmarkConfidenceIndicatorProps) {
  const [confidenceData, setConfidenceData] = useState<ConfidenceData | null>(null)
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial confidence data
    const loadConfidenceData = () => {
      const data = realTimeService.getBenchmarkConfidence(address)
      setConfidenceData(data)
      setLastUpdate(new Date())
      setIsLoading(false)
    }

    loadConfidenceData()

    // Set up event listeners for real-time updates
    const handleConfidenceUpdate = (event: any) => {
      if (event.data.address === address) {
        const updatedData = realTimeService.getBenchmarkConfidence(address)
        setConfidenceData(updatedData)
        setLastUpdate(new Date())
      }
    }

    realTimeService.addEventListener('confidence_update', handleConfidenceUpdate)

    // Refresh data periodically
    const refreshInterval = setInterval(loadConfidenceData, 60000) // Every minute

    return () => {
      realTimeService.removeEventListener('confidence_update', handleConfidenceUpdate)
      clearInterval(refreshInterval)
    }
  }, [address])

  const toggleFactor = (factorName: string) => {
    setExpandedFactor(expandedFactor === factorName ? null : factorName)
  }

  const getOverallConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 75) return 'text-blue-600'
    if (confidence >= 60) return 'text-yellow-600'
    if (confidence >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getOverallConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'Excellent'
    if (confidence >= 75) return 'Good'
    if (confidence >= 60) return 'Fair'
    if (confidence >= 40) return 'Poor'
    return 'Very Poor'
  }

  const formatTimeUntilUpdate = (nextUpdateTime: number) => {
    const now = Date.now()
    const diff = nextUpdateTime - now
    
    if (diff <= 0) return 'Updating soon...'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  if (isLoading) {
    return (
      <div className={`${compact ? 'p-4' : 'card'}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          {showDetails && (
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!confidenceData) {
    return (
      <div className={`${compact ? 'p-4' : 'card'} text-center`}>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h4 className="font-medium text-gray-900 mb-1">No Confidence Data</h4>
        <p className="text-sm text-gray-600">Confidence indicators will appear once benchmark data is available</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            confidenceData.overallConfidence >= 75 ? 'bg-green-500' :
            confidenceData.overallConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium text-gray-900">
            {confidenceData.overallConfidence}% Confidence
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Next update: {formatTimeUntilUpdate(confidenceData.nextUpdateTime)}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Benchmark Confidence</h3>
          <p className="text-sm text-gray-600 mt-1">Reliability indicators for benchmark calculations</p>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getOverallConfidenceColor(confidenceData.overallConfidence)}`}>
            {confidenceData.overallConfidence}%
          </div>
          <div className="text-sm text-gray-600">
            {getOverallConfidenceLabel(confidenceData.overallConfidence)}
          </div>
        </div>
      </div>

      {/* Overall Confidence Visualization */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Overall Confidence</span>
          <span className="text-sm text-gray-600">{confidenceData.overallConfidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              confidenceData.overallConfidence >= 90 ? 'bg-green-500' :
              confidenceData.overallConfidence >= 75 ? 'bg-blue-500' :
              confidenceData.overallConfidence >= 60 ? 'bg-yellow-500' :
              confidenceData.overallConfidence >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidenceData.overallConfidence}%` }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-700">{confidenceData.dataFreshness}%</div>
          <div className="text-sm text-blue-600">Data Freshness</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-700">{confidenceData.peerGroupStability}%</div>
          <div className="text-sm text-green-600">Peer Group Stability</div>
        </div>
      </div>

      {/* Detailed Factors */}
      {showDetails && (
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Confidence Factors</h4>
          
          <ConfidenceFactor
            label="Data Quality"
            value={confidenceData.factors.dataQuality}
            description="Quality and completeness of transaction data used in calculations"
            isExpanded={expandedFactor === 'dataQuality'}
            onToggle={() => toggleFactor('dataQuality')}
          />
          
          <ConfidenceFactor
            label="Sample Size"
            value={confidenceData.factors.sampleSize}
            description="Number of transactions and data points available for analysis"
            isExpanded={expandedFactor === 'sampleSize'}
            onToggle={() => toggleFactor('sampleSize')}
          />
          
          <ConfidenceFactor
            label="Time Range"
            value={confidenceData.factors.timeRange}
            description="Historical data coverage and temporal consistency"
            isExpanded={expandedFactor === 'timeRange'}
            onToggle={() => toggleFactor('timeRange')}
          />
          
          <ConfidenceFactor
            label="Market Conditions"
            value={confidenceData.factors.marketConditions}
            description="Stability of market conditions affecting benchmark calculations"
            isExpanded={expandedFactor === 'marketConditions'}
            onToggle={() => toggleFactor('marketConditions')}
          />
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span>Calculation Reliability: {confidenceData.calculationReliability}%</span>
          <span>Next Update: {formatTimeUntilUpdate(confidenceData.nextUpdateTime)}</span>
        </div>
        {lastUpdate && (
          <span>Last Refresh: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}