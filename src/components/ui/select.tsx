import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

// Simple implementation for our use case
const SimpleSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }
>(({ className, value, onValueChange, onChange, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    value={value}
    onChange={e => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }}
    {...props}
  >
    {children}
  </select>
))
SimpleSelect.displayName = 'SimpleSelect'

export { SimpleSelect }
