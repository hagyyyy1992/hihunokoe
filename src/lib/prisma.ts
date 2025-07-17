import { PrismaClient } from '@prisma/client'
import { DB_CONFIG } from '@/lib/db-config'
import { PerformanceLogger } from '@api/lib/performance-logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// データベースタイプを取得
const databaseType = DB_CONFIG.getDatabaseType()

let prismaClient: PrismaClient | null = null

if (databaseType !== 'mock') {
  const initLogger = new PerformanceLogger('Prisma-Initialization')

  try {
    // 環境に応じたPrismaClient設定
    // Vercelのサーバーレス環境では、pgbouncerモードで接続プーリングを使用
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV

    initLogger.start('create-client')
    prismaClient =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'pretty',
        datasources: isVercel
          ? {
              db: {
                url: (() => {
                  const url = process.env.DATABASE_URL
                  if (!url) return undefined

                  // URLが既にパラメータを含んでいるかチェック
                  if (url.includes('?')) {
                    // 既存のパラメータに追加
                    return url + '&connection_limit=1&statement_cache_size=0'
                  } else {
                    // 新規にパラメータを追加
                    return url + '?pgbouncer=true&connection_limit=1&statement_cache_size=0'
                  }
                })(),
              },
            }
          : undefined,
      })
    initLogger.end('create-client', { cached: !!globalForPrisma.prisma })

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient
    }

    // データベース接続をテスト
    if (process.env.NODE_ENV === 'production') {
      initLogger.start('connect-test')
      prismaClient
        .$connect()
        .then(() => {
          initLogger.end('connect-test', { success: true })
          initLogger.finish({ success: true, environment: 'production' })
        })
        .catch(error => {
          initLogger.end('connect-test', { success: false, error: error.message })
          initLogger.finish({ success: false, error: error.message })
          console.error('❌ Failed to connect to database in production:', error)
          prismaClient = null
        })
    } else {
      initLogger.finish({ success: true, environment: process.env.NODE_ENV })
    }
  } catch (error) {
    initLogger.finish({ success: false, error: (error as Error).message })
    console.error(`❌ Prisma Client initialization failed for ${databaseType}:`, error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Database URL check:', process.env.DATABASE_URL ? 'Present' : 'Missing')
    prismaClient = null
  }
}

export const prisma = prismaClient

// データベースが利用可能かどうかをチェック
export const isDatabaseAvailable = () => {
  return databaseType !== 'mock' && !!prismaClient
}

// 現在のデータベース設定を取得
export const getDatabaseInfo = () => {
  return {
    type: databaseType,
    available: isDatabaseAvailable(),
    config: DB_CONFIG.getConnectionInfo(),
  }
}

// Export types for GraphQL Code Generator
export type { User, Post, Empathy, Comment } from '@prisma/client'
