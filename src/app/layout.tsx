import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ApolloProvider } from '@/components/providers/ApolloProvider'
import { SERVICE_FULL_TITLE } from '@/lib/constants'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: SERVICE_FULL_TITLE,
  description:
    '化粧品の本当の使い心地を、体験談で共有するコミュニティ。成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけよう。',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'ひふのこえ',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: SERVICE_FULL_TITLE,
    description: '化粧品の本当の使い心地を、体験談で共有するコミュニティ。',
    url: 'https://hihunokoe.com',
    siteName: 'ひふのこえ',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ひふのこえ - 肌の声に耳をすませる、わたしの肌ログ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SERVICE_FULL_TITLE,
    description: '化粧品の本当の使い心地を、体験談で共有するコミュニティ。',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <ApolloProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
