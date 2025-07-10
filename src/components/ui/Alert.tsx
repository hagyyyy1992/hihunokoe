import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Alert = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'destructive'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative w-full rounded-lg border p-4',
      {
        'bg-background text-foreground': variant === 'default',
        'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive':
          variant === 'destructive',
      },
      className
    )}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }
