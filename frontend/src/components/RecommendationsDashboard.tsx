import React, { useState } from 'react'
import { PersonalizedRecommendation as ApiPersonalizedRecommendation, ActionItem } from '../services/apiService'

interface PersonalizedRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'VOLUME' | 'FREQUENCY' | 'STAKING' | 'DEFI' | 'RISK' | 'EFFICIENCY'
  title: string
  description: string
  impact: string
  actionItems: string[]
}

interface RecommendationsDashboardProps {
  recommendations: PersonalizedRecommendation[]
}

export default function RecommendationsDashboard({ recommendations }: RecommendationsDashboardProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null)

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
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'MEDIUM':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'LOW':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VOLUME':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'FREQUENCY':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'STAKING':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      case 'DEFI':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'RISK':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'EFFICIENCY':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return null
    }
  }

  const calculateOverallScore = () => {
    if (recommendations.length === 0) return 0
    
    // Calculate score based on number and priority of recommendations
    const highPriorityCount = recommendations.filter(r => r.priority === 'HIGH').length
    const mediumPriorityCount = recommendations.filter(r => r.priority === 'MEDIUM').length
    const lowPriorityCount = recommendations.filter(r => r.priority === 'LOW').length
    
    // Higher score means fewer high-priority recommendations needed
    const baseScore = 100
    const highPenalty = highPriorityCount * 25
    const mediumPenalty = mediumPriorityCount * 15
    const lowPenalty = lowPriorityCount * 5
    
    return Math.max(0, baseScore - highPenalty - mediumPenalty - lowPenalty)
  }

  const overallScore = calculateOverallScore()

  return (
    <div className="space-y-6">
      {/* Overall Recommendations Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recommendations Overview</h3>
          <div className="text-sm text-gray-500">
            {recommendations.length} recommendations available
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Implementation Score</span>
              <span className="text-2xl font-bold text-gray-900">{overallScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  overallScore >= 80 ? 'bg-green-500' :
                  overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 text-sm">
          {overallScore >= 80 && 'Excellent! You have few high-priority recommendations to implement.'}
          {overallScore >= 60 && overallScore < 80 && 'Good progress! Focus on implementing medium and high-priority recommendations.'}
          {overallScore < 60 && 'Several recommendations need attention to improve your credit score.'}
        </p>
      </div>

      {/* Recommendations List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">All Set!</h4>
            <p className="text-gray-600">
              No specific recommendations at this time. Your credit profile is performing well.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${getPriorityColor(recommendation.priority)}`}
                onClick={() => setExpandedRecommendation(expandedRecommendation === index ? null : index)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getPriorityIcon(recommendation.priority)}
                    <div>
                      <h4 className="font-medium text-sm">{recommendation.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          {getCategoryIcon(recommendation.category)}
                          <span className="text-xs text-gray-600">{recommendation.category}</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-60">
                          {recommendation.priority} PRIORITY
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">{recommendation.impact}</span>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        expandedRecommendation === index ? 'transform rotate-90' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 mb-3">{recommendation.description}</p>
                
                {expandedRecommendation === index && (
                  <div className="border-t border-white border-opacity-60 pt-3 mt-3">
                    <h5 className="text-xs font-medium text-gray-800 mb-2">Action Items:</h5>
                    <ul className="space-y-1">
                      {recommendation.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-2 text-xs text-gray-700">
                          <div className="w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {recommendations.filter(r => r.priority === 'HIGH').length}
          </div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {recommendations.filter(r => r.priority === 'MEDIUM').length}
          </div>
          <div className="text-sm text-gray-600">Medium Priority</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {recommendations.filter(r => r.priority === 'LOW').length}
          </div>
          <div className="text-sm text-gray-600">Low Priority</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {new Set(recommendations.map(r => r.category)).size}
          </div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>
    </div>
  )
}
