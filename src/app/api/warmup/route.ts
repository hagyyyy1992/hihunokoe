import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PerformanceLogger } from '@api/lib/performance-logger'

// Lambda ウォーミング用エンドポイント
// Vercel CronまたはUptimeRobotなどから定期的に呼び出す
export async function GET(request: NextRequest) {
  const perfLogger = new PerformanceLogger('Lambda-Warmup')

  try {
    // Authorization ヘッダーチェック（簡易的なセキュリティ）
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.WARMUP_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    perfLogger.start('prisma-warmup')
    // Prisma接続をウォームアップ
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`
    }
    perfLogger.end('prisma-warmup', { success: true })

    perfLogger.finish({ success: true })

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      performance: 'warmup completed',
    })
  } catch (error) {
    perfLogger.finish({ success: false, error: (error as Error).message })
    console.error('Warmup error:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
