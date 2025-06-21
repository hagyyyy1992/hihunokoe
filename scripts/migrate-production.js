#!/usr/bin/env node

// Production migration script for Vercel deployment
// This script handles database migrations in production environment

const { execSync } = require('child_process')

const NODE_ENV = process.env.NODE_ENV
const DATABASE_URL = process.env.DATABASE_URL

console.log('🚀 Starting production migration...')
console.log(`Environment: ${NODE_ENV}`)
console.log(`Database URL: ${DATABASE_URL ? 'Set' : 'Not set'}`)

// Only run migrations in production
if (NODE_ENV === 'production' && DATABASE_URL) {
  try {
    console.log('📦 Generating Prisma Client...')
    execSync('prisma generate', { stdio: 'inherit' })
    
    console.log('🗄️  Running database migrations...')
    execSync('prisma migrate deploy', { stdio: 'inherit' })
    
    console.log('✅ Production migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
} else if (NODE_ENV !== 'production') {
  console.log('⚠️  Skipping migrations - not in production environment')
} else {
  console.log('⚠️  Skipping migrations - DATABASE_URL not set')
}

console.log('🏁 Migration script finished')