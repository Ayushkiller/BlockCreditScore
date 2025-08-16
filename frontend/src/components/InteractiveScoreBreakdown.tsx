import React, { useState, useMemo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Bar, Doughnut, Radar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler)

interface BackendScoreBreakdown {
  transactionVolume: {
    score: number
    weight: number
    weightedScore: number
    details: {
      totalVolume: string
      volumeScore: number
      volumeCategory: string
      gasEfficiency: number
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
  transactionFrequency: {
    score: number
    weight: number
    weightedScore: number
    details: {
      totalTransactions: number
      accountAge: number
      frequencyScore: number
      avgTransactionsPerMonth: number
      consistencyScore: number
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
  stakingActivity: {
    score: number
    weight: number
    weightedScore: number
    details: {
      stakingBalance: string
      stakingScore: number
      stakingRatio: number
      stakingProtocols: string[]
      stakingDuration: number
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
  defiInteractions: {
    score: number
    weight: number
    weightedScore: number
    details: {
      protocolsUsed: number
      defiScore: number
      diversificationScore: number
      favoriteProtocols: string[]
      sophisticationLevel: string
    }
    insights: {
      explanation: string
      strengths: string[]
      weaknesses: string[]
      improvementPotential: number
      benchmarkComparison: {
        percentile: number
        category: string
      }
    }
  }
}

interface InteractiveScoreBreakdownProps {
  breakdown: BackendScoreBreakdown
  totalScore: number
}

interface ComponentCardProps {
  name: string
  component: any
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
                  {component.insights.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-success-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {component.insights?.weaknesses && component.insights.weaknesses.length > 0 && (
              <div>
                <h5 className="font-medium text-warning-600 mb-2 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Areas to Improve</span>
                </h5>
                <ul className="space-y-1">
                  {component.insights.weaknesses.map((weakness: string, index: number) => (
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
  const [viewMode, setViewMode] = useState<'cards' | 'charts'>('cards')

  // Safety check for breakdown data
  if (!breakdown || typeof breakdown !== 'object') {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Score Breakdown Unavailable</h3>
        <p className="text-muted-foreground">
          The detailed score breakdown is not available at the moment. Please try refreshing the page.
        </p>
      </div>
    )
  }

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

  // Chart data preparation
  const chartLabels = sortedComponents.map(([name]) => 
    name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  )
  const chartScores = sortedComponents.map(([, component]) => component.score || 0)
  const chartWeights = sortedComponents.map(([, component]) => (component.weight || 0) * 100)
  const chartWeightedScores = sortedComponents.map(([, component]) => component.weightedScore || 0)

  // Bar chart data
  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Component Score',
        data: chartScores,
        backgroundColor: chartScores.map(score => 
          score >= 80 ? 'rgba(34, 197, 94, 0.8)' :
          score >= 60 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: chartScores.map(score => 
          score >= 80 ? 'rgba(34, 197, 94, 1)' :
          score >= 60 ? 'rgba(251, 191, 36, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Weight (%)',
        data: chartWeights,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        yAxisID: 'y1',
      }
    ],
  }

  // Doughnut chart data for weighted contribution
  const doughnutData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Weighted Score Contribution',
        data: chartWeightedScores,
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(245, 101, 101, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Radar chart data for comprehensive view
  const radarData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Current Performance',
        data: chartScores,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
      {
        label: 'Potential Performance',
        data: chartScores.map((score, index) => 
          Math.min(score + (sortedComponents[index][1].improvementPotential || 0), 100)
        ),
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(34, 197, 94, 0.8)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        max: 100,
        title: {
          display: true,
          text: 'Weight (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} pts (${percentage}%)`
          }
        }
      }
    },
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      },
    },
  }

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
          {viewMode === 'cards' ? 'Click on any component to see detailed insights and improvement opportunities.' : 'Interactive charts show your performance across all components.'}
        </p>
        
        {/* View Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-muted rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📋 Card View
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📊 Chart View
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'charts' ? (
        <div className="space-y-8">
          {/* Interactive Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Bar Chart - Scores vs Weights */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <span>📊</span>
                <span>Scores & Weights</span>
              </h3>
              <div className="h-80">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            {/* Doughnut Chart - Weighted Contributions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <span>🍩</span>
                <span>Score Contributions</span>
              </h3>
              <div className="h-80">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          {/* Radar Chart - Performance Overview */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
              <span>🎯</span>
              <span>Performance Radar</span>
            </h3>
            <div className="h-96">
              <Radar data={radarData} options={radarOptions} />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              The solid line shows your current performance, while the dashed line shows your potential with improvements.
            </p>
          </div>

          {/* Chart Insights */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-success-600 mb-1">
                {sortedComponents.filter(([, c]) => (c.score || 0) >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Top Performing Areas</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                +{Math.round(sortedComponents.reduce((sum, [, c]) => sum + (c.improvementPotential || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Growth Potential</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl mb-2">⚖️</div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round(sortedComponents.reduce((sum, [, c]) => sum + ((c.weight || 0) * 100), 0))}%
              </div>
              <div className="text-sm text-muted-foreground">Total Weight Coverage</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Visual Overview */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Component Weights</h3>
            <div className="space-y-3">
              {sortedComponents.map(([name, component]) => {
                const weight = (component.weight || 0) * 100
                const score = component.score || 0
                const isHighlighted = hoveredComponent === name
                
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        isHighlighted ? 'text-primary' : 'text-foreground'
                      }`}>
                        {name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={`font-medium ${
                          score >= 80 ? 'text-success-600' : 
                          score >= 60 ? 'text-warning-600' : 'text-danger-600'
                        }`}>
                          {score}/100
                        </span>
                        <span className="text-muted-foreground">
                          ({Math.round(weight)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isHighlighted ? 'bg-primary' : 'bg-primary/70'
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
        </div>
      )}


      {/* Summary */}
      <div className="card p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Score Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{totalScore}</div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600 mb-1">
                {Object.values(breakdown).filter(c => (c.score || 0) >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Strong Areas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600 mb-1">
                +{Object.values(breakdown).reduce((sum, c) => sum + (c.improvementPotential || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Growth Potential</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Math.round(Object.values(breakdown).reduce((sum, c) => sum + (c.confidence || 0), 0) / Object.values(breakdown).length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}