import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// モックモードの判定（USE_MOCK_DATA=true または DATABASE_URLが未設定）
const shouldUseMockData = process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL

let prismaClient: PrismaClient | null = null

if (!shouldUseMockData) {
  try {
    prismaClient = globalForPrisma.prisma ?? new PrismaClient()
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient
  } catch (error) {
    console.warn('Prisma Client initialization failed:', error)
    prismaClient = null
  }
} else {
  console.log('🔄 Running in mock mode - using demo data')
}

export const prisma = prismaClient

// データベースが利用可能かどうかをチェック
export const isDatabaseAvailable = () => {
  return !shouldUseMockData && !!prismaClient
}
