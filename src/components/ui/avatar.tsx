import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import Image from 'next/image'

const Avatar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
)
Avatar.displayName = 'Avatar'

interface AvatarImageProps {
  src: string
  alt?: string
  className?: string
}

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt = '', src }, ref) => (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill
      className={cn('aspect-square object-cover', className)}
    />
  )
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
