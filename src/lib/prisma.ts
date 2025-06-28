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
    prismaClient = globalForPrisma.prisma ?? new PrismaClient()

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient
    }

    console.log(`✅ Prisma connected to ${databaseType} database`)
  } catch (error) {
    console.error(`❌ Prisma Client initialization failed for ${databaseType}:`, error)
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
