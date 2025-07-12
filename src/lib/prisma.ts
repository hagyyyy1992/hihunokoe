import { PrismaClient } from '@prisma/client'
import { DB_CONFIG } from '@/lib/db-config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// データベースタイプを取得
const databaseType = DB_CONFIG.getDatabaseType()

let prismaClient: PrismaClient | null = null

if (databaseType !== 'mock') {
  try {
    // 環境に応じたPrismaClient設定
    prismaClient =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
      })

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient
    }

    // データベース接続をテスト
    if (process.env.NODE_ENV === 'production') {
      prismaClient.$connect().catch(error => {
        console.error('❌ Failed to connect to database in production:', error)
        prismaClient = null
      })
    }
  } catch (error) {
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
