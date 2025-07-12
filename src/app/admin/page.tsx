import { redirect } from 'next/navigation'

// 管理画面は動的レンダリングが必要
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  redirect('/admin/dashboard')
}
