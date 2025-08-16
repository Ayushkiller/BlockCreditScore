import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  variant?: 'default' | 'filled'
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const hasError = !!error

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <div className="w-4 h-4">{leftIcon}</div>
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            input
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
            ${variant === 'filled' ? 'bg-muted/50' : ''}
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <div className="w-4 h-4">{rightIcon}</div>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`text-sm ${hasError ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error || helperText}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

// Specialized input variants
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void
  showClear?: boolean
}

export function SearchInput({ onClear, showClear, ...props }: SearchInputProps) {
  return (
    <Input
      leftIcon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightIcon={showClear && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="hover:text-foreground transition-colors"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : undefined}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  const hasError = !!error

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={`
          input min-h-[80px] resize-y
          ${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
          ${className}
        `}
        {...props}
      />
      
      {(error || helperText) && (
        <div className={`text-sm ${hasError ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error || helperText}
        </div>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'