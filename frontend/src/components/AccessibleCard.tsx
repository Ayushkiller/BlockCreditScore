import { ReactNode, HTMLAttributes } from 'react';

interface AccessibleCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescription?: string;
}

export default function AccessibleCard({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  loading = false,
  ariaLabel,
  ariaDescription,
  className = '',
  onClick,
  onKeyDown,
  ...props
}: AccessibleCardProps) {
  const baseClasses = `
    rounded-lg border bg-card text-card-foreground
    transition-all duration-200
  `;

  const variants = {
    default: 'shadow-sm',
    interactive: 'shadow-sm hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    elevated: 'shadow-md hover:shadow-lg'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const cardClasses = `
    ${baseClasses}
    ${variants[clickable ? 'interactive' : variant]}
    ${paddings[padding]}
    ${loading ? 'opacity-50 pointer-events-none' : ''}
    ${className}
  `;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e as any);
    }
    onKeyDown?.(e);
  };

  const cardProps = {
    className: cardClasses,
    onClick: clickable ? onClick : undefined,
    onKeyDown: clickable ? handleKeyDown : onKeyDown,
    tabIndex: clickable ? 0 : undefined,
    role: clickable ? 'button' : undefined,
    'aria-label': ariaLabel,
    'aria-description': ariaDescription,
    'aria-busy': loading,
    ...props
  };

  return (
    <div {...cardProps}>
      {children}
    </div>
  );
}