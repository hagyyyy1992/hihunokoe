import { SERVICE_NAME } from '@/lib/constants'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { container: 'w-8 h-8', text: 'text-sm', brandText: 'text-xl' },
    md: { container: 'w-12 h-12', text: 'text-lg', brandText: 'text-2xl' },
    lg: { container: 'w-16 h-16', text: 'text-2xl', brandText: 'text-3xl' },
  }

  const { container, brandText } = sizeClasses[size]

  return (
    <div className="flex items-center space-x-2">
      <div className={`${container} relative`}>
        <Image
          src="/logo-image.png"
          alt="ひふのこえロゴ"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`${brandText} font-semibold text-gray-900`}>{SERVICE_NAME}</span>
      )}
    </div>
  )
}
