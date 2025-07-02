import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { usePasswordToggle } from '@/hooks/usePasswordToggle'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  showPlaceholderHint?: boolean
  icon?: React.ReactNode
  variant?: 'default' | 'error'
  'data-testid'?: string
}

const Input = memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    (
      {
        className,
        label,
        error,
        hint,
        showPlaceholderHint,
        icon,
        variant = 'default',
        'data-testid': testId,
        type,
        ...props
      },
      ref
    ) => {
      const { inputType, PasswordToggleIcon } = usePasswordToggle()
      const id = props.id || props.name
      const displayHint = hint || (showPlaceholderHint && props.placeholder) || ''
      const isPasswordField = type === 'password'
      const finalInputType = isPasswordField ? inputType : type

      return (
        <div className="form-group">
          {label && (
            <label htmlFor={id} className="form-label">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="relative">
            {icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">{icon}</span>
              </div>
            )}
            <input
              ref={ref}
              type={finalInputType}
              className={cn(
                'input',
                icon && 'pl-10',
                isPasswordField && 'pr-10',
                variant === 'error' && 'input-error',
                className
              )}
              data-testid={testId || `${props.name}-input`}
              {...props}
            />
            {isPasswordField && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div data-testid={`${props.name}-password-toggle`}>
                  <PasswordToggleIcon />
                </div>
              </div>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
          {displayHint && !error && <p className="form-hint">{displayHint}</p>}
        </div>
      )
    }
  )
)

Input.displayName = 'Input'

export { Input }
