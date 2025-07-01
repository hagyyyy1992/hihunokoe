#!/usr/bin/env node

/**
 * Supabase REST API経由でのデータ復旧スクリプト
 * 直接PostgreSQL接続ができない場合の代替手段
 */

// bcryptは使用せず、仮のハッシュ値を使用
// const bcrypt = require('bcrypt')

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

  return response
}

async function main() {
  console.log('🌱 Seeding database via Supabase REST API...')

  try {
    // デモユーザーの作成
    // 仮のハッシュ値（実際のbcryptハッシュ）
    const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeY1/UqMqPmLHV6Sm' // demo123をハッシュ化した値

    const demoUsers = [
      {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        email: 'demo@example.com',
        username: 'demouser',
        displayName: 'デモユーザー',
        password: hashedPassword,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '11234567-89ab-cdef-0123-456789abcdef',
        email: 'demo2@example.com',
        username: 'demouser2',
        displayName: 'デモユーザー2',
        password: hashedPassword,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '21234567-89ab-cdef-0123-456789abcdef',
        email: 'admin@example.com',
        username: 'admin',
        displayName: '管理者',
        password: hashedPassword,
        emailVerified: true,
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        content: 'このファンデーションは本当におすすめです！カバー力が高くて、一日中崩れません。',
        authorId: '01234567-89ab-cdef-0123-456789abcdef',
        skinType: 'NORMAL',
        category: 'BASE_MAKEUP',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '01234567-89ab-cdef-0123-456789abcde2',
        title: '敏感肌におすすめのスキンケア',
        content: '敏感肌の私でも安心して使えるスキンケア商品を紹介します。',
        authorId: '11234567-89ab-cdef-0123-456789abcdef',
        skinType: 'SENSITIVE',
        category: 'SKINCARE',
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        postId: '01234567-89ab-cdef-0123-456789abcde1',
        reporterId: '11234567-89ab-cdef-0123-456789abcdef',
        reason: 'SPAM',
        description: 'スパムコンテンツと思われます',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
