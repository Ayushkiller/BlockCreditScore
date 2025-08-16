import { useState } from 'react'
import { ComponentScore } from '../services/apiService'

interface InteractiveScoreBreakdownProps {
  breakdown: Record<string, ComponentScore>
  totalScore: number
}

interface ComponentCardProps {
  name: string
  component: ComponentScore
  isExpanded: boolean
  onToggle: () => void
  onHover: (name: string | null) => void
  isHighlighted: boolean
}

function ComponentCard({ 
  name, 
  component, 
  isExpanded, 
  onToggle, 
  onHover,
  isHighlighted 
}: ComponentCardProps) {
  const safeScore = component.score || 0
  const safeWeight = component.weight || 0
  const safeWeightedScore = component.weightedScore || 0
  const safeConfidence = component.confidence || 0
  const safeImprovementPotential = component.improvementPotential || 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-500 bg-success-50 border-success-200'
    if (score >= 60) return 'text-warning-500 bg-warning-50 border-warning-200'
    return 'text-danger-500 bg-danger-50 border-danger-200'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-success-500'
    if (score >= 60) return 'bg-warning-500'
    return 'bg-danger-500'
  }

  const displayName = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  const progressPercentage = Math.min((safeScore / 100) * 100, 100)

  return (
    <div 
      className={`
        border rounded-xl p-6 transition-all duration-300 cursor-pointer
        ${isHighlighted 
          ? 'border-primary shadow-lg scale-105 bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:shadow-md'
        }
        ${isExpanded ? 'ring-2 ring-primary/20' : ''}
      `}
      onClick={onToggle}
      onMouseEnter={() => onHover(name)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
            ${getScoreColor(safeScore)}
          `}>
            {safeScore}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground">
              Weight: {Math.round(safeWeight * 100)}% • {safeConfidence}% confidence
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="font-semibold text-foreground">+{Math.round(safeWeightedScore)}</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
          <svg 
            className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Performance</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${getProgressColor(safeScore)}`}
            style={{ 
              width: `${progressPercentage}%`,
              boxShadow: isHighlighted ? '0 0 8px currentColor' : 'none'
            }}
          />
        </div>
      </div>

      {/* Improvement Potential */}
      {safeImprovementPotential > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
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

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 border-t border-border pt-4 animate-fade-in">
          {/* Explanation */}
          <div>
            <h4 className="font-medium text-foreground mb-2">How this affects your score</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {component.explanation || 'This component contributes to your overall credit score based on your on-chain activity patterns.'}
            </p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            {component.strengths && component.strengths.length > 0 && (
              <div>
                <h5 className="font-medium text-success-600 mb-2 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Strengths</span>
                </h5>
                <ul className="space-y-1">
                  {component.strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-success-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {component.weaknesses && component.weaknesses.length > 0 && (
              <div>
                <h5 className="font-medium text-warning-600 mb-2 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Areas to Improve</span>
                </h5>
                <ul className="space-y-1">
                  {component.weaknesses.slice(0, 3).map((weakness, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-warning-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button className="btn-outline btn-sm">
              Get Specific Recommendations
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InteractiveScoreBreakdown({ breakdown, totalScore }: InteractiveScoreBreakdownProps) {
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)

  const toggleComponent = (componentName: string) => {
    setExpandedComponent(expandedComponent === componentName ? null : componentName)
  }

  const handleHover = (componentName: string | null) => {
    setHoveredComponent(componentName)
  }

  const sortedComponents = Object.entries(breakdown).sort(([, a], [, b]) => {
    const aWeight = a.weight || 0
    const bWeight = b.weight || 0
    return bWeight - aWeight
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center space-x-3">
          <span className="text-4xl">🔍</span>
          <span>Score Breakdown</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Explore how each component contributes to your total score of <span className="font-bold text-primary">{totalScore}</span>. 
          Click on any component to see detailed insights and improvement opportunities.
        </p>
      </div>

      {/* Visual Overview */}
      <div className="card p-8 bg-gradient-to-br from-slate-50/80 to-slate-100/80 border-slate-200/60 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-2xl">⚖️</span>
          <h3 className="text-xl font-bold text-foreground">Component Weights</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Each component has a different impact on your overall score. Hover over the bars to highlight the corresponding detailed card below.
        </p>
        <div className="space-y-4">
          {sortedComponents.map(([name, component]) => {
            const weight = (component.weight || 0) * 100
            const score = component.score || 0
            const isHighlighted = hoveredComponent === name
            
            return (
              <div key={name} className="space-y-3 group">
                <div className="flex justify-between items-center">
                  <span className={`font-semibold transition-all duration-300 ${
                    isHighlighted ? 'text-primary text-lg' : 'text-foreground'
                  }`}>
                    {name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${
                      score >= 80 ? 'text-success-600' : 
                      score >= 60 ? 'text-warning-600' : 'text-danger-600'
                    }`}>
                      {score}/100
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {Math.round(weight)}% weight
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isHighlighted ? 'bg-primary shadow-lg scale-y-110' : 'bg-primary/80'
                    }`}
                    style={{ width: `${weight}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Component Cards */}
      <div className="grid gap-6">
        {sortedComponents.map(([name, component]) => (
          <ComponentCard
            key={name}
            name={name}
            component={component}
            isExpanded={expandedComponent === name}
            onToggle={() => toggleComponent(name)}
            onHover={handleHover}
            isHighlighted={hoveredComponent === name}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="card p-8 bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border-primary/30 backdrop-blur-sm">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <span className="text-3xl">📈</span>
            <h3 className="text-2xl font-bold text-foreground">Your Score Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">
                {totalScore}
              </div>
              <div className="text-sm font-semibold text-foreground">Total Score</div>
              <div className="text-xs text-muted-foreground mt-1">Out of 1000</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-success-600 mb-2 group-hover:scale-110 transition-transform">
                {Object.values(breakdown).filter(c => (c.score || 0) >= 80).length}
              </div>
              <div className="text-sm font-semibold text-foreground">Strong Areas</div>
              <div className="text-xs text-muted-foreground mt-1">Components ≥80</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-warning-600 mb-2 group-hover:scale-110 transition-transform">
                +{Object.values(breakdown).reduce((sum, c) => sum + (c.improvementPotential || 0), 0)}
              </div>
              <div className="text-sm font-semibold text-foreground">Growth Potential</div>
              <div className="text-xs text-muted-foreground mt-1">Possible points</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                {Math.round(Object.values(breakdown).reduce((sum, c) => sum + (c.confidence || 0), 0) / Object.values(breakdown).length)}%
              </div>
              <div className="text-sm font-semibold text-foreground">Avg Confidence</div>
              <div className="text-xs text-muted-foreground mt-1">Data reliability</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}