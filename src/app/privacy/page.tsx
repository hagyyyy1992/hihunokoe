import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー - ひふのこえ',
  description: 'ひふのこえのプライバシーポリシーページです。',
}

export default function Privacy() {
  redirect('/legal/privacy')
}
