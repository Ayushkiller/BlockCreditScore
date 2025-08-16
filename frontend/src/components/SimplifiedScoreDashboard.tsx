import React, { useState, useEffect } from 'react'
import { CreditScore, apiService } from '../services/apiService'
import InteractiveScoreBreakdown from './InteractiveScoreBreakdown'
import ActionableRecommendations from './ActionableRecommendations'
import HistoricalScoreTracking from './HistoricalScoreTracking'
import DataExportShare from './DataExportShare'
import RiskAssessmentDashboard from './RiskAssessmentDashboard'
import BehavioralInsightsDashboard from './BehavioralInsightsDashboard'
import RecommendationsDashboard from './RecommendationsDashboard'

interface ScoreDashboardProps {
  address: string
  onAddressChange?: (address: string) => void
}

export default function SimplifiedScoreDashboard({ address, onAddressChange }: ScoreDashboardProps) {
  const [score, setScore] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'recommendations' | 'history'>('overview')
  const [showExportModal, setShowExportModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchScore = async (targetAddress?: string) => {
    const addressToFetch = targetAddress || address
    if (!addressToFetch) return

    setLoading(true)
    setError(null)
    
    try {
      const scoreData = await apiService.getCreditScore(addressToFetch)
      setScore(scoreData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credit score')
      console.error('Error fetching credit score:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchScore()
    setRefreshing(false)
  }

  useEffect(() => {
    if (address) {
      fetchScore()
    }
  }, [address])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <div className="text-center mt-4">
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Score</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchScore()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">No Score Data Available</h3>
            <button
              onClick={() => fetchScore()}
              className="btn-primary"
            >
              Load Score
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600'
    if (score >= 600) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 800) return 'bg-green-50 border-green-200'
    if (score >= 600) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 safe-area-inset">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Score Overview */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Credit Score Dashboard
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Wallet: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn-outline flex items-center space-x-2 touch-target"
                >
                  <svg 
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                
                <button
                  onClick={() => setShowExportModal(true)}
                  className="btn-primary flex items-center space-x-2 touch-target"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="hidden sm:inline">Export & Share</span>
                  <span className="sm:hidden">Export</span>
                </button>
              </div>
            </div>

            {/* Score Display */}
            <div className={`rounded-xl border-2 p-6 ${getScoreBg(score.score)}`}>
              <div className="text-center">
                <div className={`text-5xl md:text-6xl font-bold ${getScoreColor(score.score)} mb-2`}>
                  {score.score}
                </div>
                <div className="text-gray-600 text-sm md:text-base mb-4">
                  out of 1000 • Last updated {new Date(score.timestamp * 1000).toLocaleDateString()}
                </div>
                
                {/* Score Interpretation */}
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Excellent (800+)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Good (600-799)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Needs Work (&lt;600)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'breakdown', label: 'Breakdown', icon: '📈' },
                { id: 'recommendations', label: 'Recommendations', icon: '💡' },
                { id: 'history', label: 'History', icon: '📅' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm touch-target ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-red-600 text-sm font-medium mb-1">Risk Assessment</div>
                    <div className="text-2xl font-bold text-red-900">
                      {score.riskAssessment ? `${score.riskAssessment.riskScore}/100` : '0/100'}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {score.riskAssessment?.overallRisk || 'Not Available'}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-blue-600 text-sm font-medium mb-1">Behavioral Insights</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {score.behavioralInsights ? `${score.behavioralInsights.consistencyScore}/100` : '0/100'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {score.behavioralInsights?.activityPattern || 'Not Available'}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-green-600 text-sm font-medium mb-1">Recommendations</div>
                    <div className="text-2xl font-bold text-green-900">
                      {score.recommendations ? `${Math.max(0, 100 - (score.recommendations.length * 20))}/100` : '0/100'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {score.recommendations?.length || 0} items
                    </div>
                  </div>
                </div>

                {/* Risk Assessment Dashboard */}
                {score.riskAssessment && (
                  <RiskAssessmentDashboard 
                    riskAssessment={score.riskAssessment}
                  />
                )}

                {/* Behavioral Insights Dashboard */}
                {score.behavioralInsights && (
                  <BehavioralInsightsDashboard 
                    behavioralInsights={score.behavioralInsights}
                  />
                )}

                {/* Recommendations Dashboard */}
                {score.recommendations && (
                  <RecommendationsDashboard 
                    recommendations={score.recommendations.map(rec => ({
                      priority: rec.priority,
                      category: rec.category,
                      title: rec.title,
                      description: rec.description,
                      impact: `+${rec.expectedScoreImpact || 0} points potential`,
                      actionItems: rec.actionItems.map(item => item.description)
                    }))}
                  />
                )}
              </div>
            )}

            {activeTab === 'breakdown' && (
              <InteractiveScoreBreakdown 
                breakdown={score.breakdown || {}} 
                totalScore={score.score} 
              />
            )}

            {activeTab === 'recommendations' && (
              <ActionableRecommendations 
                recommendations={score.recommendations || []}
                onRecommendationAction={() => {}}
              />
            )}

            {activeTab === 'history' && (
              <HistoricalScoreTracking address={address} currentScore={score?.score || 0} />
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <DataExportShare
          score={score}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav mobile-only grid grid-cols-4 gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'breakdown', label: 'Breakdown', icon: '📈' },
          { id: 'recommendations', label: 'Tips', icon: '💡' },
          { id: 'history', label: 'History', icon: '📅' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`mobile-nav-item ${
              activeTab === tab.id ? 'active' : ''
            }`}
          >
            <div className="icon">{tab.icon}</div>
            <div className="label">{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
