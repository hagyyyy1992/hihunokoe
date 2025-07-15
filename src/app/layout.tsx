import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ApolloProvider } from '@/components/providers/ApolloProvider'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { generateMetadata } from './metadata'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = generateMetadata()

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
