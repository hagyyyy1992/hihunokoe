import { SERVICE_NAME } from '@/lib/constants'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      text: 'text-sm',
      brandText: 'text-xl',
      badge: 'text-[6px] px-1 py-0.5',
    },
    md: {
      container: 'w-12 h-12',
      text: 'text-lg',
      brandText: 'text-2xl',
      badge: 'text-[8px] px-1.5 py-0.5',
    },
    lg: {
      container: 'w-16 h-16',
      text: 'text-2xl',
      brandText: 'text-3xl',
      badge: 'text-[10px] px-2 py-1',
    },
  }

  const { container, brandText, badge } = sizeClasses[size]

  // 環境に応じてロゴをカスタマイズ
  const deployEnv = process.env.NEXT_PUBLIC_DEPLOY_ENV || 'production'
  const isLocal = deployEnv === 'local'
  const isStaging = deployEnv === 'staging'

  return (
    <div className="flex items-center space-x-2">
      <div className={`${container} relative`}>
        <Image
          src="/logo-image.png"
          alt="ひふのこえロゴ"
          fill
          className={`object-contain ${isLocal ? 'brightness-110 hue-rotate-180 saturate-[0.3] contrast-125' : ''}`}
          priority
        />
        {/* ローカル環境用の青いオーバーレイ */}
        {isLocal && (
          <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-full mix-blend-multiply" />
        )}
        {/* 環境バッジ */}
        {(isLocal || isStaging) && (
          <div
            className={`absolute -top-1 -right-1 ${isLocal ? 'bg-blue-600' : 'bg-orange-600'} text-white ${badge} rounded-full font-bold`}
          >
            {isLocal ? 'LOCAL' : 'STAGING'}
          </div>
        )}
      </div>
      {showText && (
        <span className={`${brandText} font-semibold text-gray-900`}>{SERVICE_NAME}</span>
      )}
    </div>
  )
}
