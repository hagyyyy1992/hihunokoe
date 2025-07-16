'use client'

import { SERVICE_NAME } from '@/lib/constants'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const [logoSrc, setLogoSrc] = useState('/logo-image.png')
  const [logoAlt, setLogoAlt] = useState('ひふのこえロゴ')

  // 環境に応じてロゴをカスタマイズ
  const deployEnv = process.env.NEXT_PUBLIC_DEPLOY_ENV || 'production'
  const isStaging = deployEnv === 'staging'

  useEffect(() => {
    if (isStaging) {
      setLogoSrc('/logo-image-staging.png')
      setLogoAlt('ひふのこえロゴ（ステージング環境）')
    }
  }, [])

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

  const { container, brandText } = sizeClasses[size]

  return (
    <div className="flex items-center space-x-2">
      <div className={`${container} relative`}>
        <Image src={logoSrc} alt={logoAlt} fill className="object-contain" priority />
      </div>
      {showText && (
        <span className={`${brandText} font-semibold text-gray-900`}>
          {SERVICE_NAME}
          {isStaging && (
            <span className="text-base ml-2 font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
              STG
            </span>
          )}
        </span>
      )}
    </div>
  )
}
