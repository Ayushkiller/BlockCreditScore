import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { apiService, type CreditScore, type ComponentScore, type PersonalizedRecommendation, type RiskAssessment, type RiskFactor, type BenchmarkingData } from '../services/apiService'
import WalletSwitchGuide from './WalletSwitchGuide'
import RiskAssessmentDashboard from './RiskAssessmentDashboard'
import RiskMitigationPanel from './RiskMitigationPanel'
import RiskMonitoringAlerts, { type RiskAlert } from './RiskMonitoringAlerts'
import RiskFactorExplanation from './RiskFactorExplanation'
import CompetitivePositioningDashboard from './CompetitivePositioningDashboard'

interface BreakdownComponentProps {
  label: string
  value: number
  percentage: string
  maxValue?: number
}

interface EnhancedBreakdownComponentProps {
  label: string
  component: ComponentScore & { insights?: any }
  isExpanded: boolean
  onToggle: () => void
}

// Enhanced Breakdown Component with detailed insights
function EnhancedBreakdownComponent({ label, component, isExpanded, onToggle }: EnhancedBreakdownComponentProps) {
  const safeScore = isNaN(component.score) ? 0 : (component.score || 0);
  const safeImprovementPotential = isNaN(component.improvementPotential) ? 0 : (component.improvementPotential || 0);
  const safeConfidence = isNaN(component.confidence) ? 0 : (component.confidence || 0);
  const safeWeight = isNaN(component.weight) ? 0 : (component.weight || 0);
  const safeWeightedScore = isNaN(component.weightedScore) ? 0 : (component.weightedScore || 0);
  
  const progressPercentage = safeScore + safeImprovementPotential > 0 
    ? Math.min((safeScore / (safeScore + safeImprovementPotential)) * 100, 100)
    : 0;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">{safeScore}</span>
            <span className="text-xs text-gray-500">({safeConfidence}% confidence)</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">Weight: {Math.round(safeWeight * 100)}%</div>
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
      
      <div className="mt-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                safeScore >= 800 ? 'bg-success-500' :
                safeScore >= 600 ? 'bg-warning-500' : 'bg-danger-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-16 text-right">
            {Math.round(safeWeightedScore)} pts
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-600">
            {component.explanation}
          </div>
          
          {component.strengths.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-success-700 mb-2">Strengths</h5>
              <ul className="space-y-1">
                {component.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-success-500 rounded-full mt-2"></div>
                    <span className="text-sm text-gray-600">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {component.weaknesses.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-warning-700 mb-2">Areas for Improvement</h5>
              <ul className="space-y-1">
                {component.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-warning-500 rounded-full mt-2"></div>
                    <span className="text-sm text-gray-600">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {safeImprovementPotential > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-medium text-blue-700">
                  Improvement Potential: +{safeImprovementPotential} points
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Strengths and Weaknesses Panel
function StrengthsWeaknessesPanel({ score }: { score: CreditScore }) {
  const allStrengths: string[] = []
  const allWeaknesses: string[] = []
  
  Object.values(score.breakdown || {}).forEach(component => {
    if (component && typeof component === 'object') {
      if (component.strengths && Array.isArray(component.strengths)) {
        allStrengths.push(...component.strengths);
      }
      if (component.weaknesses && Array.isArray(component.weaknesses)) {
        allWeaknesses.push(...component.weaknesses);
      }
    }
  })
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Strengths */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Your Strengths</h3>
        </div>
        
        {allStrengths.length > 0 ? (
          <div className="space-y-3">
            {allStrengths.slice(0, 5).map((strength, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                <span className="text-sm text-gray-700">{strength}</span>
              </div>
            ))}
            {allStrengths.length > 5 && (
              <div className="text-sm text-gray-500 italic">
                +{allStrengths.length - 5} more strengths
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Continue building your on-chain activity to develop strengths
          </div>
        )}
      </div>
      
      {/* Weaknesses */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Areas to Improve</h3>
        </div>
        
        {allWeaknesses.length > 0 ? (
          <div className="space-y-3">
            {allWeaknesses.slice(0, 5).map((weakness, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                <span className="text-sm text-gray-700">{weakness}</span>
              </div>
            ))}
            {allWeaknesses.length > 5 && (
              <div className="text-sm text-gray-500 italic">
                +{allWeaknesses.length - 5} more areas to improve
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Great! No significant weaknesses identified
          </div>
        )}
      </div>
    </div>
  )
}

// Recommendations Panel
function RecommendationsPanel({ recommendations }: { recommendations: PersonalizedRecommendation[] }) {
  const [expandedRec, setExpandedRec] = useState<number | null>(null)
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'HARD': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Available</h3>
        <p className="text-gray-600">Continue building your on-chain activity to receive personalized recommendations</p>
      </div>
    )
  }
  
  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Personalized Recommendations</h3>
      
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div 
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedRec(expandedRec === index ? null : index)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {rec.category}
                  </span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-gray-700">+{rec.expectedScoreImpact} points</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${getDifficultyColor(rec.implementationDifficulty)}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{rec.implementationDifficulty}</span>
                  </div>
                  <div className="text-gray-500">
                    {rec.timeToImpact.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedRec === index ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {expandedRec === index && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                {rec.actionItems.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Action Items</h5>
                    <div className="space-y-3">
                      {rec.actionItems.map((action, actionIndex) => (
                        <div key={actionIndex} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{action.description}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              action.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                              action.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {action.riskLevel} RISK
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{action.specificGuidance}</p>
                          {action.estimatedCost && (
                            <div className="text-xs text-gray-500">
                              Estimated cost: {action.estimatedCost}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {rec.successMetrics.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Success Metrics</h5>
                    <ul className="space-y-1">
                      {rec.successMetrics.map((metric, metricIndex) => (
                        <li key={metricIndex} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                          <span className="text-sm text-gray-600">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {rec.currentProgress !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Progress</span>
                      <span className="text-sm text-gray-600">{rec.currentProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${rec.currentProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Circular Progress Component
function CircularProgress({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 1000) * circumference

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 144 144">
        {/* Background circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="72"
          cy="72"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${
            score >= 800 ? 'text-success-500' : 
            score >= 600 ? 'text-warning-500' : 'text-danger-500'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            score >= 800 ? 'text-success-600' : 
            score >= 600 ? 'text-warning-600' : 'text-danger-600'
          }`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">/ 1000</div>
        </div>
      </div>
    </div>
  )
}

// Breakdown Component with Progress Bar
function BreakdownComponent({ label, value, percentage, maxValue = 300 }: BreakdownComponentProps) {
  const safeValue = isNaN(value) ? 0 : (value || 0);
  const safeMaxValue = isNaN(maxValue) ? 300 : (maxValue || 300);
  const progressPercentage = safeMaxValue > 0 ? Math.min((safeValue / safeMaxValue) * 100, 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{safeValue}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              safeValue >= safeMaxValue * 0.8 ? 'bg-success-500' :
              safeValue >= safeMaxValue * 0.6 ? 'bg-warning-500' : 'bg-danger-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-12 text-right">{percentage}</span>
      </div>
    </div>
  )
}

export default function ScoreDashboard() {
  const { account } = useWallet()
  const [score, setScore] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputAddress, setInputAddress] = useState('')
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'insights' | 'recommendations' | 'risk' | 'competitive'>('overview')
  const [selectedRiskFactor, setSelectedRiskFactor] = useState<{ name: string, factor: RiskFactor } | null>(null)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [showRiskFactorModal, setShowRiskFactorModal] = useState(false)

  // Removed auto-fill behavior - user must manually enter or select wallet address

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const fetchScore = async (address?: string) => {
    const targetAddress = address || currentAddress
    if (!targetAddress) return

    setLoading(true)
    setError(null)

    try {
      const scoreData = await apiService.getCreditScore(targetAddress)
      setScore(scoreData)
      setCurrentAddress(targetAddress)
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the score')
      setScore(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshScore = async () => {
    if (!currentAddress) return

    setLoading(true)
    setError(null)

    try {
      const scoreData = await apiService.refreshCreditScore(currentAddress)
      setScore(scoreData)
    } catch (err: any) {
      setError(err.message || 'An error occurred while refreshing the score')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputAddress.trim()) {
      setError('Please enter an Ethereum address')
      return
    }

    if (!isValidAddress(inputAddress.trim())) {
      setError('Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)')
      return
    }

    fetchScore(inputAddress.trim())
  }

  const handleUseConnectedWallet = () => {
    if (account) {
      setInputAddress(account)
      fetchScore(account)
    }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent'
    if (score >= 700) return 'Good'
    if (score >= 600) return 'Fair'
    return 'Poor'
  }

  const toggleComponent = (componentName: string) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(componentName)) {
      newExpanded.delete(componentName)
    } else {
      newExpanded.add(componentName)
    }
    setExpandedComponents(newExpanded)
  }

  const handleRiskFactorClick = (factorName: string, factor: RiskFactor) => {
    setSelectedRiskFactor({ name: factorName, factor })
    setShowRiskFactorModal(true)
  }

  const handleRecommendationAction = (recommendationId: string, action: 'start' | 'complete' | 'dismiss') => {
    console.log(`Recommendation ${recommendationId} action: ${action}`)
    // In a real implementation, this would update the recommendation status
  }

  const handleAlertAction = (alertId: string, action: 'read' | 'dismiss' | 'view_details') => {
    setRiskAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isRead: action === 'read' ? true : alert.isRead }
        : alert
    ).filter(alert => action === 'dismiss' ? alert.id !== alertId : true))
  }

  const clearAllAlerts = () => {
    setRiskAlerts([])
  }

  // Mock risk alerts - in a real implementation, these would come from the API
  useEffect(() => {
    if (score?.riskAssessment) {
      const mockAlerts: RiskAlert[] = []
      
      // Generate alerts based on risk assessment
      if (score.riskAssessment.overallRisk === 'HIGH' || score.riskAssessment.overallRisk === 'CRITICAL') {
        mockAlerts.push({
          id: 'risk-level-alert',
          type: 'RISK_INCREASE',
          severity: score.riskAssessment.overallRisk === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          title: 'Risk Level Alert',
          message: `Your overall risk level is ${score.riskAssessment.overallRisk}. Review recommendations to improve your risk profile.`,
          timestamp: Date.now() - 300000, // 5 minutes ago
          isRead: false,
          actionRequired: true
        })
      }

      // Generate alerts for active flags
      Object.entries(score.riskAssessment.flags).forEach(([flag, isActive]) => {
        if (isActive) {
          const flagLabels: Record<string, string> = {
            suspiciousActivity: 'Suspicious Activity Detected',
            washTrading: 'Wash Trading Pattern',
            botBehavior: 'Bot-like Behavior',
            coordinatedActivity: 'Coordinated Activity',
            unusualPatterns: 'Unusual Patterns'
          }
          
          mockAlerts.push({
            id: `flag-${flag}`,
            type: 'NEW_FLAG',
            severity: 'HIGH',
            title: flagLabels[flag] || flag,
            message: `${flagLabels[flag] || flag} has been detected in your transaction patterns.`,
            timestamp: Date.now() - 600000, // 10 minutes ago
            isRead: false,
            actionRequired: true,
            relatedFactor: flag
          })
        }
      })

      setRiskAlerts(mockAlerts)
    }
  }, [score])

  // Address Input Form - Always show this at the top
  const renderAddressInputForm = () => (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyze Wallet Credit Score</h2>
      <form onSubmit={handleAddressSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Ethereum Address
          </label>
          <div className="flex space-x-3">
            <input
              type="text"
              id="address"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="0x1234567890123456789012345678901234567890"
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputAddress.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
        
        {account && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Connected wallet: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              type="button"
              onClick={handleUseConnectedWallet}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              disabled={loading}
            >
              Use Connected Wallet
            </button>
          </div>
        )}
      </form>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <WalletSwitchGuide />
        {renderAddressInputForm()}
        <div className="card text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Wallet</h3>
          <p className="text-gray-600">
            Calculating credit score for {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : 'address'}
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <WalletSwitchGuide />
        {renderAddressInputForm()}
        <div className="card text-center">
          <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Unable to Load Credit Score</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="space-x-3">
            <button onClick={() => fetchScore()} className="btn-primary">
              Try Again
            </button>
            {currentAddress && (
              <button onClick={refreshScore} className="btn-secondary">
                Force Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!score && !loading && !error) {
    return (
      <div className="space-y-6">
        <WalletSwitchGuide />
        {renderAddressInputForm()}
        <div className="card text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
          <p className="text-gray-600 mb-4">Enter any Ethereum address above to generate a credit score</p>
        </div>
      </div>
    )
  }

  if (!score) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Wallet Switch Guide */}
      <WalletSwitchGuide />
      
      {/* Address Input Form */}
      {renderAddressInputForm()}

      {/* Main Score Display with Circular Progress */}
      <div className="card text-center">
        <div className="mb-8">
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Analyzing Address:</div>
            <div className="text-lg font-mono text-gray-900 break-all">
              {score.address}
            </div>
          </div>
          <CircularProgress score={score.score} />
          <div className="mt-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {getScoreLabel(score.score)} Credit Score
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(score.timestamp * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button onClick={refreshScore} className="btn-primary" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Score'}
          </button>
          <button onClick={() => fetchScore()} className="btn-secondary">
            Reload
          </button>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'breakdown', label: 'Detailed Breakdown', icon: '🔍' },
              { id: 'insights', label: 'Insights', icon: '💡' },
              { id: 'recommendations', label: 'Recommendations', icon: '🎯' },
              { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
              { id: 'competitive', label: 'Competitive Position', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="pt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{score.confidence || 0}%</div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.values(score.breakdown || {}).reduce((sum, comp) => {
                      const weightedScore = comp?.weightedScore || 0;
                      return sum + (isNaN(weightedScore) ? 0 : weightedScore);
                    }, 0).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {score.behavioralInsights?.sophisticationLevel || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {score.riskAssessment?.overallRisk || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Risk</div>
                </div>
              </div>
              
              {/* Basic Breakdown */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Component Overview</h4>
                {Object.entries(score.breakdown || {}).map(([key, component]) => {
                  if (!component || typeof component !== 'object') return null;
                  const safeComponent = {
                    score: component.score || 0,
                    weight: component.weight || 0,
                    ...component
                  };
                  const safeWeight = isNaN(safeComponent.weight) ? 0 : safeComponent.weight;
                  const safeScore = isNaN(safeComponent.score) ? 0 : safeComponent.score;
                  return (
                    <BreakdownComponent
                      key={key}
                      label={`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (${Math.round(safeWeight * 100)}%)`}
                      value={safeScore}
                      percentage={`${Math.round(safeWeight * 100)}%`}
                      maxValue={Math.round(safeWeight * 1000)}
                    />
                  );
                })}
              </div>
            </div>
          )}
          
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Detailed Score Breakdown</h3>
                <div className="text-sm text-gray-500">
                  Click components to expand details
                </div>
              </div>
              
              {Object.entries(score.breakdown || {}).map(([key, component]) => {
                if (!component || typeof component !== 'object') return null;
                const safeComponent = {
                  score: 0,
                  weight: 0,
                  weightedScore: 0,
                  confidence: 0,
                  explanation: '',
                  strengths: [],
                  weaknesses: [],
                  improvementPotential: 0,
                  ...component
                };
                return (
                  <EnhancedBreakdownComponent
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    component={safeComponent}
                    isExpanded={expandedComponents.has(key)}
                    onToggle={() => toggleComponent(key)}
                  />
                );
              })}
            </div>
          )}
          
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <StrengthsWeaknessesPanel score={score} />
              
              {score.behavioralInsights && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavioral Insights</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Activity Pattern</div>
                      <div className="text-lg text-gray-900">{score.behavioralInsights.activityPattern}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">User Type</div>
                      <div className="text-lg text-gray-900">{score.behavioralInsights.userArchetype}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Growth Trend</div>
                      <div className="text-lg text-gray-900">{score.behavioralInsights.growthTrend}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Diversification</div>
                      <div className="text-lg text-gray-900">{score.behavioralInsights.diversificationLevel}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {score.benchmarking && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Peer Comparison</h3>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary-600">{score.benchmarking.percentileRank}th</div>
                    <div className="text-sm text-gray-500">percentile among {score.benchmarking.peerGroupSize} similar users</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(score.benchmarking.comparisonAreas).map(([area, data]) => (
                      <div key={area} className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{data.percentile}th</div>
                        <div className="text-sm text-gray-500 capitalize">{area}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'recommendations' && (
            <RecommendationsPanel 
              recommendations={score.recommendations || []} 
              onRecommendationAction={handleRecommendationAction}
            />
          )}
          
          {activeTab === 'risk' && score.riskAssessment && (
            <div className="space-y-6">
              {/* Risk Monitoring Alerts */}
              {riskAlerts.length > 0 && (
                <RiskMonitoringAlerts
                  alerts={riskAlerts}
                  onAlertAction={handleAlertAction}
                  onClearAll={clearAllAlerts}
                  showNotifications={true}
                />
              )}
              
              {/* Risk Assessment Dashboard */}
              <RiskAssessmentDashboard
                riskAssessment={score.riskAssessment}
                onRiskFactorClick={handleRiskFactorClick}
              />
              
              {/* Risk Mitigation Panel */}
              {score.riskAssessment.recommendations && score.riskAssessment.recommendations.length > 0 && (
                <RiskMitigationPanel
                  recommendations={score.riskAssessment.recommendations.map(rec => ({
                    priority: rec.priority,
                    category: rec.category as any,
                    title: rec.title,
                    description: rec.description,
                    expectedScoreImpact: 25, // Mock value
                    implementationDifficulty: 'MEDIUM' as const,
                    timeToImpact: rec.timeframe as any,
                    actionItems: rec.actionItems.map(item => ({
                      description: item,
                      type: 'TRANSACTION' as const,
                      specificGuidance: item,
                      riskLevel: 'LOW' as const
                    })),
                    successMetrics: [`Improve ${rec.category.toLowerCase()} score`],
                    trackingEnabled: false
                  }))}
                  onRecommendationAction={handleRecommendationAction}
                />
              )}
            </div>
          )}
          
          {activeTab === 'competitive' && (
            <CompetitivePositioningDashboard 
              score={score}
              benchmarkingData={score.benchmarking as BenchmarkingData}
              enableRealTime={true}
              showTrendAnalysis={true}
              showConfidenceIndicators={true}
            />
          )}
        </div>
      </div>

      {/* Score Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Range Guide */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Ranges</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Excellent (800-1000)</div>
                <div className="text-xs text-gray-500">High creditworthiness</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success-400 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Good (700-799)</div>
                <div className="text-xs text-gray-500">Strong credit profile</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Fair (600-699)</div>
                <div className="text-xs text-gray-500">Moderate creditworthiness</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Poor (0-599)</div>
                <div className="text-xs text-gray-500">Limited credit history</div>
              </div>
            </div>
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improve Your Score</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Increase transaction volume through regular DeFi activities
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Maintain consistent on-chain activity over time
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Participate in staking to demonstrate long-term commitment
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Interact with multiple DeFi protocols to show diversity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}