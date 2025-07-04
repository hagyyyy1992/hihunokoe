import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name = '', size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
    }

    const initial = name.charAt(0).toUpperCase()

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full bg-apple-100 text-apple-600 font-bold',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {initial}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export { Avatar }
