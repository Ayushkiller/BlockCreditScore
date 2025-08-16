import React from 'react'
import { BehavioralInsights } from '../services/apiService'

interface BehavioralInsightsDashboardProps {
  behavioralInsights: BehavioralInsights
}

export default function BehavioralInsightsDashboard({ behavioralInsights }: BehavioralInsightsDashboardProps) {
  const getActivityPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'REGULAR': return 'text-green-600 bg-green-100'
      case 'SPORADIC': return 'text-yellow-600 bg-yellow-100'
      case 'INACTIVE': return 'text-red-600 bg-red-100'
      case 'HYPERACTIVE': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDiversificationColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return 'text-green-600 bg-green-100'
      case 'STABLE': return 'text-blue-600 bg-blue-100'
      case 'DECLINING': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'STABLE':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )
      case 'DECLINING':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Behavioral Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Behavioral Analysis</h3>
          <div className="text-sm text-gray-500">
            Based on transaction patterns
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Consistency Score</span>
              <span className="text-2xl font-bold text-gray-900">{behavioralInsights.consistencyScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${behavioralInsights.consistencyScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Activity Pattern */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Activity Pattern</h4>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityPatternColor(behavioralInsights.activityPattern)}`}>
              {behavioralInsights.activityPattern}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {behavioralInsights.activityPattern === 'REGULAR' && 'Consistent transaction frequency showing reliable activity patterns.'}
            {behavioralInsights.activityPattern === 'SPORADIC' && 'Irregular transaction patterns with periods of high and low activity.'}
            {behavioralInsights.activityPattern === 'INACTIVE' && 'Low transaction frequency indicating minimal on-chain activity.'}
            {behavioralInsights.activityPattern === 'HYPERACTIVE' && 'Very high transaction frequency showing intensive blockchain usage.'}
          </p>
        </div>

        {/* Growth Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Growth Trend</h4>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getTrendColor(behavioralInsights.growthTrend)}`}>
              {getTrendIcon(behavioralInsights.growthTrend)}
              <span>{behavioralInsights.growthTrend}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {behavioralInsights.growthTrend === 'IMPROVING' && 'Your blockchain activity and sophistication are trending upward.'}
            {behavioralInsights.growthTrend === 'STABLE' && 'Your blockchain usage patterns remain consistent over time.'}
            {behavioralInsights.growthTrend === 'DECLINING' && 'Recent activity shows a downward trend in engagement.'}
          </p>
        </div>

        {/* Diversification Level */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Diversification</h4>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDiversificationColor(behavioralInsights.diversificationLevel)}`}>
              {behavioralInsights.diversificationLevel}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {behavioralInsights.diversificationLevel === 'HIGH' && 'Excellent protocol diversification reducing concentration risk.'}
            {behavioralInsights.diversificationLevel === 'MEDIUM' && 'Moderate diversification across different DeFi protocols.'}
            {behavioralInsights.diversificationLevel === 'LOW' && 'Limited protocol usage - consider exploring more DeFi options.'}
          </p>
        </div>
      </div>

      {/* Gas Efficiency & Protocol Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gas Efficiency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Gas Efficiency</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Efficiency Score</span>
            <span className="text-lg font-semibold text-gray-900">{behavioralInsights.gasEfficiency}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                behavioralInsights.gasEfficiency >= 80 ? 'bg-green-500' :
                behavioralInsights.gasEfficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${behavioralInsights.gasEfficiency}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {behavioralInsights.gasEfficiency >= 80 && 'Excellent gas optimization showing cost-conscious behavior.'}
            {behavioralInsights.gasEfficiency >= 60 && behavioralInsights.gasEfficiency < 80 && 'Good gas efficiency with room for improvement.'}
            {behavioralInsights.gasEfficiency < 60 && 'Consider optimizing transaction timing and batching to reduce gas costs.'}
          </p>
        </div>

        {/* Preferred Protocols */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Preferred Protocols</h4>
          {behavioralInsights.preferredProtocols.length > 0 ? (
            <div className="space-y-2">
              {behavioralInsights.preferredProtocols.map((protocol, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">{protocol}</span>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No preferred protocols identified yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Behavioral Insights Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Key Behavioral Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">
              {behavioralInsights.activityPattern === 'REGULAR' ? 'Reliable user' : 
               behavioralInsights.activityPattern === 'SPORADIC' ? 'Occasional user' : 
               behavioralInsights.activityPattern === 'INACTIVE' ? 'Infrequent user' : 'Power user'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">
              {behavioralInsights.gasEfficiency >= 80 ? 'Cost-efficient' : 
               behavioralInsights.gasEfficiency >= 60 ? 'Moderately efficient' : 'High gas usage'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">
              {behavioralInsights.diversificationLevel === 'HIGH' ? 'Well diversified' : 
               behavioralInsights.diversificationLevel === 'MEDIUM' ? 'Moderately diversified' : 'Concentrated usage'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
