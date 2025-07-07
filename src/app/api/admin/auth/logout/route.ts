import { NextResponse } from 'next/server'

export async function POST() {
  // レスポンスを作成
  const response = NextResponse.json({ message: 'ログアウトしました' })

  // HTTPOnlyクッキーを削除
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // 即座に削除
  })

  return response
}
