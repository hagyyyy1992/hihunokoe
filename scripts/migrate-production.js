#!/usr/bin/env node

// Production migration script for Vercel deployment
// This script handles database migrations in production environment

const { execSync } = require('child_process')

const NODE_ENV = process.env.NODE_ENV
const DATABASE_URL = process.env.DATABASE_URL
const USE_MOCK_DATA = process.env.USE_MOCK_DATA

console.log('🚀 Starting production migration...')
console.log(`Environment: ${NODE_ENV}`)
console.log(`Database URL: ${DATABASE_URL ? 'Set' : 'Not set'}`)
console.log(`Mock Data: ${USE_MOCK_DATA}`)

// Always generate Prisma Client first
console.log('📦 Generating Prisma Client...')
try {
  execSync('prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated successfully')
} catch (error) {
  console.error('❌ Prisma Client generation failed:', error.message)
  process.exit(1)
}

// Only run migrations in production with real database
if (NODE_ENV === 'production' && DATABASE_URL && USE_MOCK_DATA !== 'true') {
  try {
    console.log('🔍 Checking database status...')
    execSync('prisma migrate status', { stdio: 'inherit' })

    console.log('🗄️  Deploying database migrations...')
    execSync('prisma migrate deploy', { stdio: 'inherit' })

    console.log('✅ Production migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('💡 This might be the first deployment. Please ensure:')
    console.error('  1. DATABASE_URL is correctly set in Vercel')
    console.error('  2. Supabase database is accessible')
    console.error('  3. Network connectivity is working')

    // For first deployment, don't fail the build
    console.log('⚠️  First deployment detected - continuing with mock mode fallback...')
    console.log('🔄 After first deployment, please manually run migrations or create tables')
  }
} else if (USE_MOCK_DATA === 'true') {
  console.log('⚠️  Mock data mode enabled - skipping migrations')
} else if (!DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not set - using mock mode')
} else {
  console.log('⚠️  Development environment - skipping production migrations')
}

console.log('🏁 Migration script finished')
