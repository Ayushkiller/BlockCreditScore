import React, { useState } from 'react'
import { RiskFactor } from '../services/apiService'

interface RiskFactorExplanationProps {
  factorName: string
  factor: RiskFactor
  onClose?: () => void
  isModal?: boolean
}

interface MetricCardProps {
  label: string
  value: string | number
  benchmark?: string
  status?: 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
  description?: string
}

function MetricCard({ label, value, benchmark, status, description }: MetricCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'GOOD': return 'text-green-600 bg-green-50 border-green-200'
      case 'FAIR': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'POOR': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'GOOD':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'FAIR':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'POOR':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'CRITICAL':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon(status)}
          <h4 className="font-medium text-sm">{label}</h4>
        </div>
        {status && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-60">
            {status}
          </span>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-lg font-semibold">{value}</div>
        {benchmark && (
          <div className="text-xs text-gray-600">Benchmark: {benchmark}</div>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-700">{description}</p>
      )}
    </div>
  )
}

function RiskScoreVisualization({ factor }: { factor: RiskFactor }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-500'
    if (score >= 60) return 'bg-orange-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Breakdown</h3>
      
      <div className="flex items-center space-x-6 mb-6">
        {/* Circular Progress */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - factor.score / 100)}`}
              className={`transition-all duration-1000 ease-out ${getScoreColor(factor.score).replace('text-', 'text-')}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(factor.score)}`}>
                {factor.score}
              </div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>
        </div>
        
        {/* Score Details */}
        <div className="flex-1">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Risk Level</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${
                  factor.level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  factor.level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  factor.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {factor.level}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(factor.score)}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Confidence</span>
                <span className="text-sm font-semibold text-gray-900">{factor.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${factor.confidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-700">
        {factor.explanation}
      </div>
    </div>
  )
}

function DetailedAnalysis({ factor }: { factor: RiskFactor }) {
  const [activeTab, setActiveTab] = useState<'indicators' | 'mitigation'>('indicators')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('indicators')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'indicators'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Risk Indicators ({factor.indicators.length})
        </button>
        <button
          onClick={() => setActiveTab('mitigation')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'mitigation'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Mitigation Suggestions ({factor.mitigationSuggestions.length})
        </button>
      </div>

      {activeTab === 'indicators' && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">Risk Indicators</h4>
          {factor.indicators.length > 0 ? (
            <div className="space-y-3">
              {factor.indicators.map((indicator, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{indicator}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No specific risk indicators identified
            </div>
          )}
        </div>
      )}

      {activeTab === 'mitigation' && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">Mitigation Suggestions</h4>
          {factor.mitigationSuggestions.length > 0 ? (
            <div className="space-y-3">
              {factor.mitigationSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No specific mitigation suggestions available
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RiskFactorExplanation({ 
  factorName, 
  factor, 
  onClose, 
  isModal = false 
}: RiskFactorExplanationProps) {
  const formatFactorName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Risk', ' Risk')
  }

  // Mock metrics data - in a real implementation, this would come from the backend
  const mockMetrics = [
    {
      label: 'Current Score',
      value: factor.score,
      benchmark: '< 40 (Low Risk)',
      status: factor.score >= 80 ? 'CRITICAL' : factor.score >= 60 ? 'POOR' : factor.score >= 40 ? 'FAIR' : 'GOOD',
      description: 'Current risk score for this factor'
    },
    {
      label: 'Confidence Level',
      value: `${factor.confidence}%`,
      benchmark: '> 80%',
      status: factor.confidence >= 80 ? 'GOOD' : factor.confidence >= 60 ? 'FAIR' : 'POOR',
      description: 'Confidence in the risk assessment'
    },
    {
      label: 'Risk Level',
      value: factor.level,
      benchmark: 'LOW',
      status: factor.level === 'LOW' ? 'GOOD' : factor.level === 'MEDIUM' ? 'FAIR' : factor.level === 'HIGH' ? 'POOR' : 'CRITICAL',
      description: 'Overall risk classification'
    }
  ]

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{formatFactorName(factorName)}</h2>
          <p className="text-gray-600 mt-1">Detailed risk factor analysis and explanation</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Risk Score Visualization */}
      <RiskScoreVisualization factor={factor} />

      {/* Key Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockMetrics.map((metric, index) => (
            <MetricCard
              key={index}
              label={metric.label}
              value={metric.value}
              benchmark={metric.benchmark}
              status={metric.status as any}
              description={metric.description}
            />
          ))}
        </div>
      </div>

      {/* Detailed Analysis */}
      <DetailedAnalysis factor={factor} />

      {/* Historical Context */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Understanding This Risk Factor</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            <strong>{formatFactorName(factorName)}</strong> is assessed based on your transaction patterns, 
            account behavior, and various risk indicators. The current score of <strong>{factor.score}/100</strong> 
            indicates a <strong>{factor.level.toLowerCase()}</strong> risk level.
          </p>
          
          <p>
            This assessment is made with <strong>{factor.confidence}% confidence</strong> based on the available 
            data and analysis methods. Higher confidence levels indicate more reliable risk assessments.
          </p>
          
          {factor.level !== 'LOW' && (
            <p>
              To improve this risk factor, focus on the mitigation suggestions provided above. 
              These recommendations are tailored to address the specific indicators that contribute 
              to your current risk level.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isModal && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            View Recommendations
          </button>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
          
          <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {content}
    </div>
  )
}