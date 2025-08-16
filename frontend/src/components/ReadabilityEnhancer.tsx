import { ReactNode } from 'react'

interface ReadabilityEnhancerProps {
  children: ReactNode
  variant?: 'default' | 'compact' | 'spacious'
  className?: string
}

/**
 * ReadabilityEnhancer component that provides consistent spacing, typography,
 * and visual hierarchy improvements across the application
 */
export default function ReadabilityEnhancer({ 
  children, 
  variant = 'default',
  className = '' 
}: ReadabilityEnhancerProps) {
  const variantClasses = {
    default: 'space-y-6',
    compact: 'space-y-4',
    spacious: 'space-y-8'
  }

  return (
    <div className={`
      ${variantClasses[variant]}
      ${className}
      [&_h1]:text-display [&_h1]:mb-4
      [&_h2]:text-headline [&_h2]:mb-3
      [&_h3]:text-title [&_h3]:mb-2
      [&_p]:text-body [&_p]:leading-relaxed
      [&_.card]:shadow-sm [&_.card]:hover:shadow-md [&_.card]:transition-shadow
      [&_button]:interactive-element
      [&_.status-indicator]:status-indicator
    `}>
      {children}
    </div>
  )
}

interface SectionProps {
  title: string
  subtitle?: string
  icon?: string
  children: ReactNode
  className?: string
}

export function Section({ title, subtitle, icon, children, className = '' }: SectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <div className="text-center space-y-3">
        <h2 className="text-headline flex items-center justify-center space-x-3">
          {icon && <span className="text-4xl">{icon}</span>}
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className="text-body text-muted-foreground max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

interface MetricCardProps {
  value: string | number
  label: string
  description?: string
  icon?: string
  color?: 'primary' | 'success' | 'warning' | 'danger'
  trend?: 'up' | 'down' | 'stable'
  className?: string
}

export function MetricCard({ 
  value, 
  label, 
  description, 
  icon, 
  color = 'primary',
  trend,
  className = '' 
}: MetricCardProps) {
  const colorClasses = {
    primary: 'from-primary-50 to-primary-100 border-primary-200 text-primary-900',
    success: 'from-success-50 to-success-100 border-success-200 text-success-900',
    warning: 'from-warning-50 to-warning-100 border-warning-200 text-warning-900',
    danger: 'from-danger-50 to-danger-100 border-danger-200 text-danger-900'
  }

  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }

  return (
    <div className={`
      card p-6 bg-gradient-to-br ${colorClasses[color]} 
      hover:shadow-lg hover:-translate-y-1 transition-all duration-300
      ${className}
    `}>
      <div className="flex items-start justify-between mb-4">
        {icon && <div className="text-3xl">{icon}</div>}
        {trend && <div className="text-lg">{trendIcons[trend]}</div>}
      </div>
      
      <div className="space-y-2">
        <div className="text-display font-black">{value}</div>
        <div className="text-title font-bold">{label}</div>
        {description && (
          <div className="text-caption opacity-80">{description}</div>
        )}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function ActionButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  disabled = false,
  className = '' 
}: ActionButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 action-feedback'
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}
        ${className}
      `}
    >
      {icon && <span className="mr-2 text-lg">{icon}</span>}
      {children}
    </button>
  )
}

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
  className?: string
}

export function StatusBadge({ status, children, className = '' }: StatusBadgeProps) {
  const statusClasses = {
    success: 'status-success',
    warning: 'status-warning',
    danger: 'status-danger',
    info: 'bg-blue-50 text-blue-800 border border-blue-200'
  }

  return (
    <span className={`status-indicator ${statusClasses[status]} ${className}`}>
      {children}
    </span>
  )
}