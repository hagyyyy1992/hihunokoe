#!/usr/bin/env node

/**
 * Supabase REST API経由でのデータ復旧スクリプト（正しいカラム名版）
 */

const SUPABASE_URL = 'https://getpoicarcllsyvdzncp.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdldHBvaWNhcmNsbHN5dmR6bmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjA5OTQsImV4cCI6MjA2NjA5Njk5NH0.FEfQPFvHW43mnUhv0qdLSFxeHrVSLDyAqauupSppwhc'

async function makeRequest(table, data, method = 'POST') {
  const url = `${SUPABASE_URL}/rest/v1/${table}`

  const response = await fetch(url, {
    method,
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
    console.error(`Failed to ${method} to ${table}:`, response.status, error)
    return null
  }

  console.log(`✅ Successfully created record in ${table}`)
  return response
}

async function main() {
  console.log('🌱 Seeding database via Supabase REST API...')

  try {
    // 仮のハッシュ値（demo123をbcryptでハッシュ化した値）
    const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeY1/UqMqPmLHV6Sm'

    const demoUsers = [
      {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        user_name: 'demouser',
        email: 'demo@example.com',
        password_hash: hashedPassword,
        role: 'user',
        is_active: true,
        email_verified: true,
        skin_type: 'normal',
        age: 25,
        gender: 'female',
        self_introduction: 'デモユーザーです。よろしくお願いします！',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '11234567-89ab-cdef-0123-456789abcdef',
        user_name: 'demouser2',
        email: 'demo2@example.com',
        password_hash: hashedPassword,
        role: 'user',
        is_active: true,
        email_verified: true,
        skin_type: 'sensitive',
        age: 30,
        gender: 'female',
        self_introduction: 'コスメ好きのデモユーザー2です。',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '21234567-89ab-cdef-0123-456789abcdef',
        user_name: 'admin',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin',
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    console.log('👤 Creating demo users...')
    for (const user of demoUsers) {
      await makeRequest('users', user)
    }

    // デモ投稿の作成
    const demoPosts = [
      {
        id: '01234567-89ab-cdef-0123-456789abcde1',
        title: 'おすすめのファンデーション',
        product_name: 'パーフェクトファンデーション',
        product_brand: 'ビューティーコスメ',
        product_category: 'ベースメイク',
        skin_type: 'normal',
        product_rating: 5,
        content:
          'このファンデーションは本当におすすめです！カバー力が高くて、一日中崩れません。乾燥肌の私でも潤いが続きます。',
        mood: 'satisfied',
        is_published: true,
        user_id: '01234567-89ab-cdef-0123-456789abcdef',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '01234567-89ab-cdef-0123-456789abcde2',
        title: '敏感肌におすすめのスキンケア',
        product_name: 'センシティブケアローション',
        product_brand: 'ナチュラルケア',
        product_category: 'スキンケア',
        skin_type: 'sensitive',
        product_rating: 4,
        content:
          '敏感肌の私でも安心して使えるスキンケア商品です。刺激が少なく、しっとりと潤います。',
        mood: 'pleased',
        is_published: true,
        user_id: '11234567-89ab-cdef-0123-456789abcdef',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    console.log('📝 Creating demo posts...')
    for (const post of demoPosts) {
      await makeRequest('posts', post)
    }

    // デモレポートの作成
    const demoReports = [
      {
        id: '01234567-89ab-cdef-0123-456789abcde3',
        reporter_id: '11234567-89ab-cdef-0123-456789abcdef',
        post_id: '01234567-89ab-cdef-0123-456789abcde1',
        reason: 'spam',
        description: '不適切な商品宣伝のようです',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    console.log('🚨 Creating demo reports...')
    for (const report of demoReports) {
      await makeRequest('reports', report)
    }

    console.log('✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

main()
