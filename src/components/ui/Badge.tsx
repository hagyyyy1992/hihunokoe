import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'gray'
    | 'pink'
    | 'lavender'
    | 'blue'
    | 'green'
    | 'yellow'
    | 'red'
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
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
    lavender: 'badge-pink',
    blue: 'badge-blue',
    green: 'badge-green',
    yellow: 'badge-yellow',
    red: 'badge-red',
    default: 'badge-blue',
    secondary: 'badge-gray',
    destructive: 'badge-red',
    outline: 'border border-gray-300 bg-transparent text-gray-700',
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
