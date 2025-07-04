/**
 * Database configuration utility
 * Handles switching between local PostgreSQL and production Supabase
 */

export const DB_CONFIG = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database URLs
  localDatabase: process.env.DATABASE_URL?.includes('localhost') || false,
  supabaseDatabase: process.env.DATABASE_URL?.includes('supabase.co') || false,

  // Current database type
  getDatabaseType(): 'local' | 'supabase' | 'mock' {
    if (process.env.USE_MOCK_DATA === 'true') {
      return 'mock'
    }

    if (process.env.NODE_ENV === 'production') {
      return 'supabase'
    }

    return 'local'
  },

  // Get appropriate database URL
  getDatabaseUrl(): string {
    const dbType = this.getDatabaseType()

    switch (dbType) {
      case 'supabase':
        return process.env.DATABASE_URL || ''
      case 'local':
        return (
          process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hihunokoe_dev'
        )
      default:
        return ''
    }
  },

  // Database connection info for logging
  getConnectionInfo() {
    const dbType = this.getDatabaseType()

    return {
      type: dbType,
      url: dbType === 'mock' ? 'Mock Data' : this.getDatabaseUrl().replace(/:[^:]*@/, ':***@'),
      environment: process.env.NODE_ENV,
    }
  },
}

// Log current database configuration
if (typeof window === 'undefined') {
  const config = DB_CONFIG.getConnectionInfo()
  console.log(`🗄️  Database: ${config.type} (${config.environment})`)
  if (config.url !== 'Mock Data') {
    console.log(`📍 URL: ${config.url}`)
  }
}
