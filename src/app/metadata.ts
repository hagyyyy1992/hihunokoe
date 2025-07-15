import { Metadata } from 'next'
import { SERVICE_FULL_TITLE } from '@/lib/constants'

export function generateMetadata(): Metadata {
  const isStaging =
    process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_GIT_COMMIT_REF === 'staging'

  const baseMetadata: Metadata = {
    title: isStaging ? `${SERVICE_FULL_TITLE} [ステージング環境]` : SERVICE_FULL_TITLE,
    description:
      '化粧品の本当の使い心地を、体験談で共有するコミュニティ。成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけよう。',
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: isStaging ? '/favicon-staging.ico' : '/logo-favicon.ico', sizes: 'any' },
        {
          url: isStaging ? '/favicon-32-staging.png' : '/logo-icon-32.png',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          url: isStaging ? '/icon-192-staging.png' : '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          url: isStaging ? '/icon-512-staging.png' : '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      apple: [
        {
          url: isStaging ? '/apple-icon-staging.png' : '/apple-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
    appleWebApp: {
      capable: true,
      title: isStaging ? 'ひふのこえ [STG]' : 'ひふのこえ',
      statusBarStyle: 'default',
    },
    openGraph: {
      title: isStaging ? `${SERVICE_FULL_TITLE} [ステージング環境]` : SERVICE_FULL_TITLE,
      description: '化粧品の本当の使い心地を、体験談で共有するコミュニティ。',
      url: isStaging ? 'https://staging.hihunokoe.com' : 'https://hihunokoe.com',
      siteName: isStaging ? 'ひふのこえ [STG]' : 'ひふのこえ',
      locale: 'ja_JP',
      type: 'website',
      images: [
        {
          url: isStaging ? '/og-image-staging.png' : '/og-image.png',
          width: 1200,
          height: 630,
          alt: isStaging
            ? 'ひふのこえ [ステージング環境] - 肌の声に耳をすませる、わたしの肌ログ'
            : 'ひふのこえ - 肌の声に耳をすませる、わたしの肌ログ',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isStaging ? `${SERVICE_FULL_TITLE} [ステージング環境]` : SERVICE_FULL_TITLE,
      description: '化粧品の本当の使い心地を、体験談で共有するコミュニティ。',
      images: [isStaging ? '/og-image-staging.png' : '/og-image.png'],
    },
  }

  return baseMetadata
}
