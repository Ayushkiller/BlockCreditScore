import { useState } from 'react'
import { PersonalizedRecommendation } from '../services/apiService'

interface ActionableRecommendationsProps {
  recommendations: PersonalizedRecommendation[]
  onRecommendationAction?: (recommendationId: string, action: 'start' | 'complete' | 'dismiss') => void
}

interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation
  index: number
  onAction: (action: 'start' | 'complete' | 'dismiss') => void
}

function RecommendationCard({ recommendation, index, onAction }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(recommendation.currentProgress || 0)
  const [isStarted, setIsStarted] = useState(currentProgress > 0)

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          color: 'border-danger-200 bg-danger-50',
          badge: 'bg-danger-100 text-danger-800 border-danger-200',
          icon: '🔥',
          urgency: 'Urgent'
        }
      case 'MEDIUM':
        return {
          color: 'border-warning-200 bg-warning-50',
          badge: 'bg-warning-100 text-warning-800 border-warning-200',
          icon: '⚡',
          urgency: 'Important'
        }
      case 'LOW':
        return {
          color: 'border-success-200 bg-success-50',
          badge: 'bg-success-100 text-success-800 border-success-200',
          icon: '💡',
          urgency: 'Optional'
        }
      default:
        return {
          color: 'border-gray-200 bg-gray-50',
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '📋',
          urgency: 'Standard'
        }
    }
  }

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return { color: 'text-success-600', icon: '🟢', label: 'Easy' }
      case 'MEDIUM':
        return { color: 'text-warning-600', icon: '🟡', label: 'Medium' }
      case 'HARD':
        return { color: 'text-danger-600', icon: '🔴', label: 'Hard' }
      default:
        return { color: 'text-muted-foreground', icon: '⚪', label: 'Unknown' }
    }
  }

  const config = getPriorityConfig(recommendation.priority)
  const difficultyConfig = getDifficultyConfig(recommendation.implementationDifficulty)

  const handleStart = () => {
    setIsStarted(true)
    setCurrentProgress(10)
    onAction('start')
  }

  const handleComplete = () => {
    setCurrentProgress(100)
    onAction('complete')
  }

  return (
    <div className={`
      border rounded-xl p-6 transition-all duration-300 hover:shadow-lg
      ${config.color}
      ${isStarted ? 'ring-2 ring-primary/20' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl">{config.icon}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.badge}`}>
                {config.urgency}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {recommendation.category}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {recommendation.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation.description}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
        >
          <svg 
            className={`w-5 h-5 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Metrics */}
      <div className="flex justify-between items-center text-sm mb-4 p-3 bg-white/30 rounded-lg">
        <div className="text-center">
          <div className="font-semibold text-primary">+{recommendation.expectedScoreImpact}</div>
          <div className="text-xs text-muted-foreground">Impact</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${difficultyConfig.color}`}>
            {difficultyConfig.label}
          </div>
          <div className="text-xs text-muted-foreground">Difficulty</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">
            {recommendation.timeToImpact ? recommendation.timeToImpact.replace('_', ' ') : 'Unknown'}
          </div>
          <div className="text-xs text-muted-foreground">Timeline</div>
        </div>
      </div>

      {/* Progress */}
      {isStarted && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Progress</span>
            <span className="text-muted-foreground">{currentProgress}%</span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {!isStarted ? (
            <button
              onClick={handleStart}
              className="btn-primary btn-sm"
            >
              Start Implementation
            </button>
          ) : currentProgress < 100 ? (
            <button
              onClick={handleComplete}
              className="btn-primary btn-sm"
            >
              Mark Complete
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-success-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-outline btn-sm"
          >
            {isExpanded ? 'Less Details' : 'More Details'}
          </button>
        </div>
        
        <button
          onClick={() => onAction('dismiss')}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-4 border-t border-white/50 pt-4 animate-fade-in">
          {/* Action Items */}
          {recommendation.actionItems && recommendation.actionItems.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Action Steps</span>
              </h4>
              <div className="space-y-3">
                {recommendation.actionItems.map((action, actionIndex) => (
                  <div key={actionIndex} className="bg-white/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-foreground">{action.description}</h5>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        action.riskLevel === 'LOW' ? 'bg-success-100 text-success-700' :
                        action.riskLevel === 'MEDIUM' ? 'bg-warning-100 text-warning-700' :
                        'bg-danger-100 text-danger-700'
                      }`}>
                        {action.riskLevel} RISK
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{action.specificGuidance}</p>
                    {action.estimatedCost && (
                      <div className="text-xs text-muted-foreground">
                        💰 Estimated cost: {action.estimatedCost}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Metrics */}
          {recommendation.successMetrics && recommendation.successMetrics.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Success Metrics</span>
              </h4>
              <ul className="space-y-2">
                {recommendation.successMetrics.map((metric, metricIndex) => (
                  <li key={metricIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-muted-foreground">{metric}</span>
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

export default function ActionableRecommendations({ 
  recommendations, 
  onRecommendationAction 
}: ActionableRecommendationsProps) {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [sortBy, setSortBy] = useState<'priority' | 'impact' | 'difficulty'>('priority')

  const filteredRecommendations = recommendations.filter(rec => 
    filter === 'ALL' || rec.priority === filter
  )

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
      case 'impact':
        return b.expectedScoreImpact - a.expectedScoreImpact
      case 'difficulty':
        const difficultyOrder = { EASY: 1, MEDIUM: 2, HARD: 3 }
        return (difficultyOrder[a.implementationDifficulty as keyof typeof difficultyOrder] || 0) - 
               (difficultyOrder[b.implementationDifficulty as keyof typeof difficultyOrder] || 0)
      default:
        return 0
    }
  })

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Build Your Credit Score</h3>
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-muted-foreground text-sm mb-4">
            Start with these proven strategies to build and improve your on-chain credit score:
          </p>
          
          <div className="space-y-3 text-left">
            <div className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-primary-900">Regular Transactions</div>
                <div className="text-xs text-primary-700">Make 5-10 transactions per month to show activity</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-success-50 rounded-lg border border-success-200">
              <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-success-900">DeFi Participation</div>
                <div className="text-xs text-success-700">Use lending, staking, or DEX protocols</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-purple-900">Maintain Balances</div>
                <div className="text-xs text-purple-700">Keep consistent token balances over time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center space-x-3">
          <span className="text-4xl">💡</span>
          <span>Personalized Recommendations</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Take action on these tailored recommendations to improve your credit score. 
          Each recommendation is prioritized based on potential impact and ease of implementation.
        </p>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">Filter:</span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
            <button
              key={priority}
              onClick={() => setFilter(priority as any)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === priority
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-background"
          >
            <option value="priority">Priority</option>
            <option value="impact">Score Impact</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-foreground mb-1">{recommendations.length}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-danger-600 mb-1">
            {recommendations.filter(r => r.priority === 'HIGH').length}
          </div>
          <div className="text-sm text-muted-foreground">High Priority</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-primary mb-1">
            +{recommendations.reduce((sum, r) => sum + r.expectedScoreImpact, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Potential Points</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-success-600 mb-1">
            {recommendations.filter(r => r.implementationDifficulty === 'EASY').length}
          </div>
          <div className="text-sm text-muted-foreground">Easy Wins</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-6">
        {sortedRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.title}-${index}`}
            recommendation={recommendation}
            index={index}
            onAction={(action) => onRecommendationAction?.(
              `${recommendation.title}-${index}`, 
              action
            )}
          />
        ))}
      </div>
    </div>
  )
}