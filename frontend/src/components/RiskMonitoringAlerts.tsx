import React, { useState, useEffect } from 'react'

export interface RiskAlert {
  id: string
  type: 'RISK_INCREASE' | 'RISK_DECREASE' | 'NEW_FLAG' | 'FLAG_CLEARED' | 'RECOMMENDATION_AVAILABLE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  timestamp: number
  isRead: boolean
  actionRequired: boolean
  relatedFactor?: string
  data?: any
}

interface RiskMonitoringAlertsProps {
  alerts: RiskAlert[]
  onAlertAction?: (alertId: string, action: 'read' | 'dismiss' | 'view_details') => void
  onClearAll?: () => void
  showNotifications?: boolean
}

interface AlertItemProps {
  alert: RiskAlert
  onAction?: (action: 'read' | 'dismiss' | 'view_details') => void
}

function AlertItem({ alert, onAction }: AlertItemProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800'
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'LOW': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'HIGH':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RISK_INCREASE':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      case 'RISK_DECREASE':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case 'NEW_FLAG':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        )
      case 'FLAG_CLEARED':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'RECOMMENDATION_AVAILABLE':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${getSeverityColor(alert.severity)} ${!alert.isRead ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 flex items-center space-x-2">
          {getSeverityIcon(alert.severity)}
          {getTypeIcon(alert.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {alert.title}
                {!alert.isRead && (
                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </h4>
              <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatTimestamp(alert.timestamp)}</span>
                {alert.relatedFactor && (
                  <span className="px-2 py-1 bg-white bg-opacity-60 rounded">
                    {alert.relatedFactor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {alert.actionRequired && (
                <button
                  onClick={() => onAction?.('view_details')}
                  className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              )}
              
              {!alert.isRead && (
                <button
                  onClick={() => onAction?.('read')}
                  className="px-3 py-1 text-xs font-medium bg-white bg-opacity-60 text-gray-700 rounded hover:bg-white hover:bg-opacity-80 transition-colors"
                >
                  Mark Read
                </button>
              )}
              
              <button
                onClick={() => onAction?.('dismiss')}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationToast({ alert, onDismiss }: { alert: RiskAlert, onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 5000) // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer)
  }, [onDismiss])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in-right">
      <div className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`}></div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{alert.title}</h4>
          <p className="text-sm text-gray-600">{alert.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function RiskMonitoringAlerts({ 
  alerts, 
  onAlertAction, 
  onClearAll, 
  showNotifications = true 
}: RiskMonitoringAlertsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<RiskAlert[]>([])
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'HIGH_PRIORITY'>('ALL')

  // Handle new alerts for notifications
  useEffect(() => {
    if (showNotifications) {
      const newAlerts = alerts.filter(alert => 
        !alert.isRead && 
        (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') &&
        !visibleNotifications.some(visible => visible.id === alert.id)
      )
      
      if (newAlerts.length > 0) {
        setVisibleNotifications(prev => [...prev, ...newAlerts.slice(0, 3)]) // Max 3 notifications
      }
    }
  }, [alerts, showNotifications, visibleNotifications])

  const handleAlertAction = (alertId: string, action: 'read' | 'dismiss' | 'view_details') => {
    onAlertAction?.(alertId, action)
  }

  const dismissNotification = (alertId: string) => {
    setVisibleNotifications(prev => prev.filter(alert => alert.id !== alertId))
  }

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'UNREAD':
        return !alert.isRead
      case 'HIGH_PRIORITY':
        return alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
      default:
        return true
    }
  })

  // Sort alerts by timestamp (newest first) and severity
  const sortedAlerts = filteredAlerts.sort((a, b) => {
    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
    const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder]
    
    if (severityDiff !== 0) return severityDiff
    return b.timestamp - a.timestamp
  })

  const unreadCount = alerts.filter(alert => !alert.isRead).length
  const highPriorityCount = alerts.filter(alert => alert.severity === 'HIGH' || alert.severity === 'CRITICAL').length

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Risk Alerts</h3>
        <p className="text-gray-600">Your account is being monitored. Any risk changes will appear here.</p>
      </div>
    )
  }

  return (
    <>
      {/* Notification Toasts */}
      {visibleNotifications.map(alert => (
        <NotificationToast
          key={alert.id}
          alert={alert}
          onDismiss={() => dismissNotification(alert.id)}
        />
      ))}

      {/* Main Alerts Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Risk Monitoring Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAlerts.length} of {alerts.length} alerts
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilter('UNREAD')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === 'UNREAD' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('HIGH_PRIORITY')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === 'HIGH_PRIORITY' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                High Priority ({highPriorityCount})
              </button>
            </div>
            
            {/* Clear All Button */}
            {alerts.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {sortedAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAction={(action) => handleAlertAction(alert.id, action)}
            />
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No alerts match the selected filter</div>
            <button
              onClick={() => setFilter('ALL')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Show All Alerts
            </button>
          </div>
        )}
      </div>
    </>
  )
}