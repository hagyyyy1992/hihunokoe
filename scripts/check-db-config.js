require('dotenv').config()

console.log('🔍 Environment Variables:')
console.log('  NODE_ENV:', process.env.NODE_ENV)
console.log('  USE_MOCK_DATA:', process.env.USE_MOCK_DATA)
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.log('  Database Type: LOCAL')
  } else if (url.includes('supabase.co')) {
    console.log('  Database Type: SUPABASE')
  } else {
    console.log('  Database Type: OTHER')
  }
  
  // URLの安全な表示（パスワード部分をマスク）
  const maskedUrl = url.replace(/:[^:]*@/, ':***@')
  console.log('  Database URL:', maskedUrl)
}

// DB_CONFIG の動作確認
const { DB_CONFIG } = require('../src/lib/db-config.ts')
console.log('\n🗄️  DB_CONFIG:')
console.log('  Type:', DB_CONFIG.getDatabaseType())
console.log('  Info:', DB_CONFIG.getConnectionInfo())

// Prisma の接続状況確認
const { isDatabaseAvailable } = require('../src/lib/prisma.ts')
console.log('\n🔌 Prisma:')
console.log('  Available:', isDatabaseAvailable())