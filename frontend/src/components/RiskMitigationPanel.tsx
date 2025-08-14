import React, { useState } from 'react'
import { PersonalizedRecommendation } from '../services/apiService'

interface RiskMitigationPanelProps {
  recommendations: PersonalizedRecommendation[]
  onRecommendationAction?: (recommendationId: string, action: 'start' | 'complete' | 'dismiss') => void
}

interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation
  index: number
  onAction?: (action: 'start' | 'complete' | 'dismiss') => void
}

function RecommendationCard({ recommendation, index, onAction }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-50 border-red-200 text-red-800'
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'LOW': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'MEDIUM':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'LOW':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'HARD': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTimeToImpactColor = (timeToImpact: string) => {
    switch (timeToImpact) {
      case 'IMMEDIATE': return 'text-green-600'
      case 'SHORT_TERM': return 'text-blue-600'
      case 'LONG_TERM': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getPriorityColor(recommendation.priority)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {getPriorityIcon(recommendation.priority)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-60">
                {recommendation.priority}
              </span>
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                {formatCategory(recommendation.category)}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{recommendation.title}</h4>
            <p className="text-sm text-gray-700">{recommendation.description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
        >
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Impact Metrics */}
      <div className="flex items-center space-x-4 mb-3 text-sm">
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-gray-700">+{recommendation.expectedScoreImpact} points</span>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.implementationDifficulty)}`}>
          {recommendation.implementationDifficulty}
        </div>
        
        <div className={`text-xs ${getTimeToImpactColor(recommendation.timeToImpact)}`}>
          {recommendation.timeToImpact.replace('_', ' ')}
        </div>
      </div>

      {/* Progress Bar (if tracking enabled) */}
      {recommendation.trackingEnabled && recommendation.currentProgress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Progress</span>
            <span className="text-xs text-gray-600">{recommendation.currentProgress}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${recommendation.currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mb-3">
        {recommendation.currentProgress === undefined || recommendation.currentProgress === 0 ? (
          <button
            onClick={() => onAction?.('start')}
            className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Start Implementation
          </button>
        ) : recommendation.currentProgress < 100 ? (
          <button
            onClick={() => onAction?.('complete')}
            className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Mark Complete
          </button>
        ) : (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            ✓ Completed
          </span>
        )}
        
        <button
          onClick={() => onAction?.('dismiss')}
          className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white border-opacity-60 pt-3 space-y-3">
          {/* Action Items */}
          {recommendation.actionItems.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Action Items</h5>
              <div className="space-y-2">
                {recommendation.actionItems.map((action, actionIndex) => (
                  <div key={actionIndex} className="bg-white bg-opacity-60 rounded p-3">
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

          {/* Success Metrics */}
          {recommendation.successMetrics.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Success Metrics</h5>
              <ul className="space-y-1">
                {recommendation.successMetrics.map((metric, metricIndex) => (
                  <li key={metricIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-600">{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RecommendationFilters({ 
  categories, 
  priorities, 
  selectedCategory, 
  selectedPriority, 
  onCategoryChange, 
  onPriorityChange 
}: {
  categories: string[]
  priorities: string[]
  selectedCategory: string
  selectedPriority: string
  onCategoryChange: (category: string) => void
  onPriorityChange: (priority: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Priority:</label>
        <select
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Priorities</option>
          {priorities.map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function RiskMitigationPanel({ recommendations, onRecommendationAction }: RiskMitigationPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedPriority, setSelectedPriority] = useState('ALL')

  // Get unique categories and priorities
  const categories = Array.from(new Set(recommendations.map(r => r.category)))
  const priorities = Array.from(new Set(recommendations.map(r => r.priority)))

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'ALL' || rec.category === selectedCategory
    const priorityMatch = selectedPriority === 'ALL' || rec.priority === selectedPriority
    return categoryMatch && priorityMatch
  })

  // Sort by priority and expected impact
  const sortedRecommendations = filteredRecommendations.sort((a, b) => {
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
    const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    
    if (priorityDiff !== 0) return priorityDiff
    return b.expectedScoreImpact - a.expectedScoreImpact
  })

  const handleRecommendationAction = (index: number, action: 'start' | 'complete' | 'dismiss') => {
    const recommendation = sortedRecommendations[index]
    onRecommendationAction?.(recommendation.title, action) // Using title as ID for now
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Risk Mitigation Needed</h3>
        <p className="text-gray-600">Your account shows a healthy risk profile with no immediate mitigation recommendations.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Risk Mitigation Recommendations</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredRecommendations.length} of {recommendations.length} recommendations
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-red-600">
              {recommendations.filter(r => r.priority === 'HIGH').length}
            </div>
            <div className="text-gray-500">High Priority</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {recommendations.reduce((sum, r) => sum + r.expectedScoreImpact, 0)}
            </div>
            <div className="text-gray-500">Total Impact</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <RecommendationFilters
        categories={categories}
        priorities={priorities}
        selectedCategory={selectedCategory}
        selectedPriority={selectedPriority}
        onCategoryChange={setSelectedCategory}
        onPriorityChange={setSelectedPriority}
      />

      {/* Recommendations List */}
      <div className="space-y-4">
        {sortedRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.title}-${index}`}
            recommendation={recommendation}
            index={index}
            onAction={(action) => handleRecommendationAction(index, action)}
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No recommendations match the selected filters</div>
          <button
            onClick={() => {
              setSelectedCategory('ALL')
              setSelectedPriority('ALL')
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}