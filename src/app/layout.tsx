import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ApolloProvider } from '@/components/providers/ApolloProvider'
import { SERVICE_FULL_TITLE } from '@/lib/constants'

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
        <AuthProvider>
          <ApolloProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
