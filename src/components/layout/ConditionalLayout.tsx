'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      <main className={`flex-1 ${!isAdminRoute ? 'pt-16' : ''}`}>{children}</main>
      {!isAdminRoute && <Footer />}
    </>
  )
}
