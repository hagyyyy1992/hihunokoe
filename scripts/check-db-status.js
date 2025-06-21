#!/usr/bin/env node

// Database status checker for npm run db:status
// This script checks the current database configuration

const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function getDatabaseType() {
  if (process.env.USE_MOCK_DATA === 'true') {
    return 'mock'
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'supabase'
  }
  
  return 'local'
}

function getDatabaseUrl() {
  const dbType = getDatabaseType()
  
  switch (dbType) {
    case 'supabase':
      return process.env.DATABASE_URL || ''
    case 'local':
      return process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/usaka_dev'
    default:
      return ''
  }
}

function getConnectionInfo() {
  const dbType = getDatabaseType()
  const url = dbType === 'mock' ? 'Mock Data' : getDatabaseUrl().replace(/:[^:]*@/, ':***@')
  
  return {
    type: dbType,
    url: url,
    environment: process.env.NODE_ENV || 'development',
  }
}

// Main execution
const config = getConnectionInfo()

console.log('🗄️  Database Configuration:')
console.log(`   Type: ${config.type}`)
console.log(`   Environment: ${config.environment}`)
console.log(`   URL: ${config.url}`)

if (config.type === 'local') {
  console.log('\n📋 Next steps for local development:')
  console.log('   1. npm run db:migrate  # Run database migrations')
  console.log('   2. npm run dev         # Start development server')
} else if (config.type === 'supabase') {
  console.log('\n📋 Next steps for Supabase:')
  console.log('   1. Create tables in Supabase Dashboard')
  console.log('   2. npm run build       # Build for production')
} else {
  console.log('\n📋 Current mode: Mock data (no database required)')
  console.log('   Set USE_MOCK_DATA=false to use real database')
}