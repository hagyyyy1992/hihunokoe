import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 - ひふのこえ',
  description: 'ひふのこえの利用規約ページです。',
}

export default function Terms() {
  redirect('/legal/terms')
}
