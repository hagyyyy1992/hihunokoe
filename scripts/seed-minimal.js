#!/usr/bin/env node

/**
 * 最小限のフィールドでのデータ復旧スクリプト
 */

const SUPABASE_URL = 'https://getpoicarcllsyvdzncp.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdldHBvaWNhcmNsbHN5dmR6bmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjA5OTQsImV4cCI6MjA2NjA5Njk5NH0.FEfQPFvHW43mnUhv0qdLSFxeHrVSLDyAqauupSppwhc'

async function makeRequest(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to POST to ${table}:`, response.status, error)
    return null
  }

  console.log(`✅ Successfully created record in ${table}`)
  return response
}

async function main() {
  console.log('🌱 Seeding database with minimal data...')

  try {
    // 最小限のユーザーデータ
    const minimalUsers = [
      {
        user_name: 'demouser',
        email: 'demo@example.com',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeY1/UqMqPmLHV6Sm',
      },
      {
        user_name: 'admin',
        email: 'admin@example.com',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeY1/UqMqPmLHV6Sm',
        role: 'admin',
      },
    ]

    console.log('👤 Creating minimal users...')
    for (const user of minimalUsers) {
      await makeRequest('users', user)
    }

    console.log('✅ Minimal seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

main()
