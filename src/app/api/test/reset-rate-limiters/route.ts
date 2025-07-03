import { NextResponse } from 'next/server'
import { resetAllRateLimiters } from '@/lib/rate-limiter'

// テスト環境でのみレート制限をリセットするAPIエンドポイント
export async function POST() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'このエンドポイントは本番環境では利用できません' },
      { status: 403 }
    )
  }

  try {
    resetAllRateLimiters()
    return NextResponse.json({
      success: true,
      message: 'レート制限がリセットされました',
    })
  } catch (error) {
    console.error('Rate limiter reset error:', error)
    return NextResponse.json({ error: 'レート制限のリセットに失敗しました' }, { status: 500 })
  }
}
