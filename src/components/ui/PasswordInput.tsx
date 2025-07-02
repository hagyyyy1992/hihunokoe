import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { usePasswordToggle } from '@/hooks/usePasswordToggle'

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  'data-testid'?: string
}

const PasswordInput = memo(
  React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, label, error, hint, 'data-testid': testId, ...props }, ref) => {
      const { inputType, PasswordToggleIcon } = usePasswordToggle()
      const id = props.id || props.name

      return (
        <div className="form-group">
          {label && (
            <label htmlFor={id} className="form-label">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <div className="relative">
            <input
              ref={ref}
              type={inputType}
              className={cn('input pr-10', error && 'input-error', className)}
              data-testid={testId || `${props.name}-input`}
              {...props}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div data-testid={`${props.name}-password-toggle`}>
                <PasswordToggleIcon />
              </div>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          {hint && !error && <p className="form-hint">{hint}</p>}
        </div>
      )
    }
  )
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
