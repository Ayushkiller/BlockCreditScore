import React, { useState } from 'react'
import { RiskAssessment, RiskFactor } from '../services/apiService'

interface VisualRiskAssessmentProps {
  riskAssessment: RiskAssessment
  onRiskFactorClick?: (factorName: string, factor: RiskFactor) => void
}

interface RiskGaugeProps {
  risk: string
  score: number
  size?: number
}

function RiskGauge({ risk, score, size = 120 }: RiskGaugeProps) {
  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return { color: '#10b981', label: 'Low Risk', angle: 45 }
      case 'MEDIUM':
        return { color: '#f59e0b', label: 'Medium Risk', angle: 90 }
      case 'HIGH':
        return { color: '#ef4444', label: 'High Risk', angle: 135 }
      case 'CRITICAL':
        return { color: '#dc2626', label: 'Critical Risk', angle: 180 }
      default:
        return { color: '#6b7280', label: 'Unknown', angle: 0 }
    }
  }

  const config = getRiskConfig(risk)
  const radius = size / 2 - 10
  const centerX = size / 2
  const centerY = size / 2

  // Calculate needle position
  const needleAngle = (config.angle - 90) * (Math.PI / 180)
  const needleX = centerX + (radius - 20) * Math.cos(needleAngle)
  const needleY = centerY + (radius - 20) * Math.sin(needleAngle)

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform rotate-180">
        {/* Background arc */}
        <path
          d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        
        {/* Risk level arcs */}
        <path
          d={`M 20 ${centerY} A ${radius} ${radius} 0 0 1 ${centerX} 20`}
          stroke="#10b981"
          strokeWidth="8"
          fill="none"
          opacity={risk === 'LOW' ? 1 : 0.3}
        />
        <path
          d={`M ${centerX} 20 A ${radius} ${radius} 0 0 1 ${centerX + radius * 0.7} ${centerY - radius * 0.7}`}
          stroke="#f59e0b"
          strokeWidth="8"
          fill="none"
          opacity={risk === 'MEDIUM' ? 1 : 0.3}
        />
        <path
          d={`M ${centerX + radius * 0.7} ${centerY - radius * 0.7} A ${radius} ${radius} 0 0 1 ${size - 20} ${centerY}`}
          stroke="#ef4444"
          strokeWidth="8"
          fill="none"
          opacity={risk === 'HIGH' || risk === 'CRITICAL' ? 1 : 0.3}
        />
        
        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={config.color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill={config.color}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-end justify-center pb-4">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: config.color }}>
            {config.label}
          </div>
          <div className="text-sm text-muted-foreground">
            Score: {score}
          </div>
        </div>
      </div>
    </div>
  )
}

interface RiskFactorCardProps {
  name: string
  factor: RiskFactor
  onClick?: () => void
}

function RiskFactorCard({ name, factor, onClick }: RiskFactorCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'border-green-200 bg-green-50 text-green-800'
      case 'MEDIUM': return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'HIGH': return 'border-red-200 bg-red-50 text-red-800'
      case 'CRITICAL': return 'border-red-300 bg-red-100 text-red-900'
      default: return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  const getImpactIcon = (impact: number) => {
    if (impact >= 50) return '🔴'
    if (impact >= 25) return '🟡'
    return '🟢'
  }

  return (
    <div 
      className={`
        border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md
        ${getRiskColor(factor.level)}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getImpactIcon(factor.impact)}</span>
          <h4 className="font-medium">
            {name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </h4>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
          {factor.level}
        </span>
      </div>
      
      <p className="text-sm mb-3 opacity-90">
        {factor.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="text-xs opacity-75">
          Impact: {factor.impact}%
        </div>
        <div className="text-xs opacity-75">
          Confidence: {factor.confidence}%
        </div>
      </div>
      
      {/* Impact bar */}
      <div className="mt-2 w-full bg-white/30 rounded-full h-1">
        <div 
          className="bg-current h-1 rounded-full transition-all duration-300"
          style={{ width: `${factor.impact}%` }}
        />
      </div>
    </div>
  )
}

export default function VisualRiskAssessment({ riskAssessment, onRiskFactorClick }: VisualRiskAssessmentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const riskFactorEntries = Object.entries(riskAssessment.riskFactors || {})
  const activeFlags = Object.entries(riskAssessment.flags || {}).filter(([, isActive]) => isActive)

  const getRiskScore = (risk: string) => {
    switch (risk) {
      case 'LOW': return 25
      case 'MEDIUM': return 50
      case 'HIGH': return 75
      case 'CRITICAL': return 95
      default: return 0
    }
  }

  const categories = [
    { id: 'transaction', label: 'Transaction Patterns', icon: '💳' },
    { id: 'behavioral', label: 'Behavioral Analysis', icon: '🧠' },
    { id: 'network', label: 'Network Activity', icon: '🌐' },
    { id: 'temporal', label: 'Temporal Patterns', icon: '⏰' }
  ]

  const filteredFactors = selectedCategory 
    ? riskFactorEntries.filter(([name]) => 
        name.toLowerCase().includes(selectedCategory) || 
        selectedCategory === 'transaction' && (name.includes('volume') || name.includes('frequency')) ||
        selectedCategory === 'behavioral' && (name.includes('pattern') || name.includes('behavior')) ||
        selectedCategory === 'network' && (name.includes('address') || name.includes('connection')) ||
        selectedCategory === 'temporal' && (name.includes('time') || name.includes('timing'))
      )
    : riskFactorEntries

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Risk Assessment</h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of potential risk factors in your wallet activity
        </p>
      </div>

      {/* Risk Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Risk Gauge */}
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-foreground mb-6">Overall Risk Level</h3>
          <RiskGauge 
            risk={riskAssessment.overallRisk} 
            score={getRiskScore(riskAssessment.overallRisk)}
          />
          <div className="mt-4 text-sm text-muted-foreground">
            Based on analysis of {riskFactorEntries.length} risk factors
          </div>
        </div>

        {/* Risk Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Risk Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              <span className={`font-medium ${
                riskAssessment.overallRisk === 'LOW' ? 'text-green-600' :
                riskAssessment.overallRisk === 'MEDIUM' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {riskAssessment.overallRisk}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Flags</span>
              <span className="font-medium text-foreground">{activeFlags.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Factors</span>
              <span className="font-medium text-foreground">{riskFactorEntries.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">High Risk Factors</span>
              <span className="font-medium text-red-600">
                {riskFactorEntries.filter(([, factor]) => factor.level === 'HIGH' || factor.level === 'CRITICAL').length}
              </span>
            </div>
          </div>

          {/* Active Flags */}
          {activeFlags.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="font-medium text-foreground mb-3">⚠️ Active Flags</h4>
              <div className="space-y-2">
                {activeFlags.map(([flag]) => (
                  <div key={flag} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-muted-foreground">
                      {flag.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Factors
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Risk Factors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFactors.map(([name, factor]) => (
          <RiskFactorCard
            key={name}
            name={name}
            factor={factor}
            onClick={() => onRiskFactorClick?.(name, factor)}
          />
        ))}
      </div>

      {filteredFactors.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            No risk factors found in the selected category
          </div>
        </div>
      )}

      {/* Risk Mitigation Tips */}
      <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <span>💡</span>
          <span>Risk Mitigation Tips</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Immediate Actions</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Review and diversify transaction patterns</li>
              <li>• Avoid suspicious or coordinated activities</li>
              <li>• Maintain consistent activity levels</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Long-term Strategy</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Build a strong transaction history</li>
              <li>• Engage with reputable DeFi protocols</li>
              <li>• Monitor your risk profile regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}