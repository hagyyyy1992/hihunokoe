import { NextResponse } from 'next/server'

export async function POST() {
  // レスポンスを作成
  const response = NextResponse.json({ message: 'ログアウトしました' })

  // HTTPOnlyクッキーを削除
  response.cookies.set('admin-auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // 即座に削除
  })

  return response
}
