import { SERVICE_NAME } from '@/lib/constants'

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

  const { container, text, brandText } = sizeClasses[size]

  return (
    <div className="flex items-center space-x-2">
      <div className={`${container} bg-apple-100 rounded-full flex items-center justify-center`}>
        <span className={`text-apple-600 font-bold ${text}`}>H</span>
      </div>
      {showText && (
        <span className={`${brandText} font-semibold text-gray-900`}>{SERVICE_NAME}</span>
      )}
    </div>
  )
}
