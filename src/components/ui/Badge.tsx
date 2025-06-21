import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gray' | 'pink' | 'blue' | 'green' | 'yellow' | 'red'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'gray',
  size = 'md',
  children,
  ...props
}) => {
  const baseClasses = 'badge'
  const variantClasses = {
    gray: 'badge-gray',
    pink: 'badge-pink',
    blue: 'badge-blue',
    green: 'badge-green',
    yellow: 'badge-yellow',
    red: 'badge-red',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  }

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'

export { Badge }
