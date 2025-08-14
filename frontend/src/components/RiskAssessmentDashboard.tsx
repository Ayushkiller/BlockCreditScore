import React, { useState } from 'react'
import { RiskAssessment, RiskFactor } from '../services/apiService'

interface RiskAssessmentDashboardProps {
  riskAssessment: RiskAssessment
  onRiskFactorClick?: (factorName: string, factor: RiskFactor) => void
}

interface RiskFactorCardProps {
  factorName: string
  factor: RiskFactor
  onClick?: () => void
}

function RiskFactorCard({ factorName, factor, onClick }: RiskFactorCardProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-50 border-green-200 text-green-800'
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'MEDIUM':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'HIGH':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'CRITICAL':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const formatFactorName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Risk', '')
  }

  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${getRiskLevelColor(factor.level)}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getRiskIcon(factor.level)}
          <h4 className="font-medium text-sm">{formatFactorName(factorName)}</h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-60">
            {factor.level}
          </span>
          <span className="text-xs text-gray-600">{factor.confidence}% confidence</span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Risk Score</span>
          <span className="text-sm font-semibold">{factor.score}/100</span>
        </div>
        <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              factor.level === 'CRITICAL' ? 'bg-red-500' :
              factor.level === 'HIGH' ? 'bg-orange-500' :
              factor.level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${factor.score}%` }}
          />
        </div>
      </div>
      
      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{factor.explanation}</p>
      
      {factor.indicators.length > 0 && (
        <div className="text-xs">
          <span className="font-medium text-gray-700">Key Indicators:</span>
          <ul className="mt-1 space-y-1">
            {factor.indicators.slice(0, 2).map((indicator, index) => (
              <li key={index} className="flex items-start space-x-1">
                <div className="w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-600">{indicator}</span>
              </li>
            ))}
            {factor.indicators.length > 2 && (
              <li className="text-gray-500 italic">+{factor.indicators.length - 2} more indicators</li>
            )}
          </ul>
        </div>
      )}
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">Click for details</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

function OverallRiskIndicator({ riskAssessment }: { riskAssessment: RiskAssessment }) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'CRITICAL': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskDescription = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Your account shows minimal risk factors and healthy transaction patterns.'
      case 'MEDIUM': return 'Some risk factors detected. Consider reviewing recommendations to improve your risk profile.'
      case 'HIGH': return 'Several risk factors require attention. Please review mitigation recommendations.'
      case 'CRITICAL': return 'Critical risk factors detected. Immediate action recommended to improve account security.'
      default: return 'Risk assessment unavailable.'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Overall Risk Assessment</h3>
        <div className="text-sm text-gray-500">
          Confidence: {riskAssessment.confidence}%
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className={`px-4 py-2 rounded-full font-medium text-lg ${getRiskColor(riskAssessment.overallRisk)}`}>
          {riskAssessment.overallRisk} RISK
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Risk Score</span>
            <span className="text-lg font-semibold text-gray-900">{riskAssessment.riskScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                riskAssessment.overallRisk === 'CRITICAL' ? 'bg-red-500' :
                riskAssessment.overallRisk === 'HIGH' ? 'bg-orange-500' :
                riskAssessment.overallRisk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${riskAssessment.riskScore}%` }}
            />
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-4">
        {getRiskDescription(riskAssessment.overallRisk)}
      </p>
      
      {/* Risk Flags */}
      {Object.entries(riskAssessment.flags).some(([_, value]) => value) && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Active Risk Flags</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(riskAssessment.flags).map(([flag, isActive]) => {
              if (!isActive) return null
              
              const flagLabels: Record<string, string> = {
                suspiciousActivity: 'Suspicious Activity',
                washTrading: 'Wash Trading',
                botBehavior: 'Bot Behavior',
                coordinatedActivity: 'Coordinated Activity',
                unusualPatterns: 'Unusual Patterns'
              }
              
              return (
                <span 
                  key={flag}
                  className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
                >
                  {flagLabels[flag] || flag}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RiskAssessmentDashboard({ riskAssessment, onRiskFactorClick }: RiskAssessmentDashboardProps) {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null)

  const handleFactorClick = (factorName: string, factor: RiskFactor) => {
    setSelectedFactor(factorName)
    onRiskFactorClick?.(factorName, factor)
  }

  return (
    <div className="space-y-6">
      {/* Overall Risk Assessment */}
      <OverallRiskIndicator riskAssessment={riskAssessment} />
      
      {/* Risk Factors Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factor Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(riskAssessment.riskFactors).map(([factorName, factor]) => (
            <RiskFactorCard
              key={factorName}
              factorName={factorName}
              factor={factor}
              onClick={() => handleFactorClick(factorName, factor)}
            />
          ))}
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Object.values(riskAssessment.riskFactors).filter(f => f.level === 'HIGH' || f.level === 'CRITICAL').length}
          </div>
          <div className="text-sm text-gray-600">High Risk Factors</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Object.values(riskAssessment.flags).filter(Boolean).length}
          </div>
          <div className="text-sm text-gray-600">Active Flags</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Math.round(Object.values(riskAssessment.riskFactors).reduce((sum, f) => sum + f.confidence, 0) / Object.values(riskAssessment.riskFactors).length)}%
          </div>
          <div className="text-sm text-gray-600">Avg Confidence</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {riskAssessment.recommendations?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Recommendations</div>
        </div>
      </div>
    </div>
  )
}