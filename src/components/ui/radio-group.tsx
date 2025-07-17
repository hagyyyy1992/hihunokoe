'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    value?: string
    onValueChange?: (value: string) => void
    name?: string
  }
>(({ className, value, onValueChange, name, ...props }, ref) => {
  const generatedName = React.useId()

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name: name || generatedName }}>
      <div ref={ref} role="radiogroup" className={cn('grid gap-2', className)} {...props} />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = 'RadioGroup'

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'> & {
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)

  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup')
  }

  return (
    <input
      ref={ref}
      type="radio"
      name={context.name}
      value={value}
      checked={context.value === value}
      onChange={e => {
        if (e.target.checked && context.onValueChange) {
          context.onValueChange(value)
        }
      }}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-gray-300 text-blue-600 ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
