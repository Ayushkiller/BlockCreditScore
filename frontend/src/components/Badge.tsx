import React, { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  icon?: ReactNode
  removable?: boolean
  onRemove?: () => void
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  removable = false,
  onRemove
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors'
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-success-100 text-success-800 border border-success-200',
    warning: 'bg-warning-100 text-warning-800 border border-warning-200',
    danger: 'bg-danger-100 text-danger-800 border border-danger-200',
    outline: 'border border-input bg-background text-foreground'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  }

  return (
    <span className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {icon && (
        <div className="w-3 h-3 mr-1">
          {icon}
        </div>
      )}
      
      {children}
      
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away'
  showText?: boolean
  className?: string
}

export function StatusBadge({ status, showText = false, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-success-500', text: 'Online' },
    offline: { color: 'bg-gray-400', text: 'Offline' },
    busy: { color: 'bg-danger-500', text: 'Busy' },
    away: { color: 'bg-warning-500', text: 'Away' }
  }

  const config = statusConfig[status]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      {showText && (
        <span className="text-sm text-muted-foreground">{config.text}</span>
      )}
    </div>
  )
}

interface ScoreBadgeProps {
  score: number
  maxScore?: number
  className?: string
}

export function ScoreBadge({ score, maxScore = 1000, className = '' }: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100
  
  const getVariant = () => {
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'danger'
  }

  const getLabel = () => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Good'
    if (percentage >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <Badge variant={getVariant()} className={className}>
      {score} - {getLabel()}
    </Badge>
  )
}

interface RiskBadgeProps {
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  className?: string
}

export function RiskBadge({ risk, className = '' }: RiskBadgeProps) {
  const riskConfig = {
    LOW: { variant: 'success' as const, icon: '🟢' },
    MEDIUM: { variant: 'warning' as const, icon: '🟡' },
    HIGH: { variant: 'danger' as const, icon: '🟠' },
    CRITICAL: { variant: 'danger' as const, icon: '🔴' }
  }

  const config = riskConfig[risk]

  return (
    <Badge 
      variant={config.variant} 
      className={className}
      icon={<span>{config.icon}</span>}
    >
      {risk}
    </Badge>
  )
}