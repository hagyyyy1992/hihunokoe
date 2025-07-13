const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking database environment...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? '✅ Set' : '❌ Not set')

  try {
    // データベース接続テスト
    console.log('\n📡 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    // 現在のデータベース情報を取得
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`
    console.log('📊 Database info:', dbInfo[0])

    // 既存のユーザー数をカウント
    const userCount = await prisma.user.count()
    console.log(`\n👥 Total users in database: ${userCount}`)

    // ステージング確認用のテストユーザーを作成
    const testEmail = `staging-test-${Date.now()}@example.com`
    const testUser = await prisma.user.create({
      data: {
        userName: 'staging_test_user',
        email: testEmail,
        passwordHash: 'dummy_hash', // 実際のパスワードハッシュは不要
        skinType: 'normal',
        role: 'USER',
        emailVerified: true,
        isActive: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    })

    console.log(`\n✅ Test user created successfully:`)
    console.log(`   - ID: ${testUser.id}`)
    console.log(`   - Email: ${testUser.email}`)
    console.log(`   - Created: ${testUser.createdAt}`)

    // テストユーザーを削除（クリーンアップ）
    await prisma.user.delete({
      where: { id: testUser.id },
    })
    console.log('🧹 Test user cleaned up')

    // 環境判定
    console.log('\n🎯 Environment check:')
    if (process.env.VERCEL_ENV === 'preview') {
      console.log('✅ Running in Vercel Preview environment (staging)')
    } else if (process.env.VERCEL_ENV === 'production') {
      console.log('⚠️  WARNING: Running in Vercel Production environment!')
    } else {
      console.log('ℹ️  Running in local/unknown environment')
    }

    console.log('\n🎉 All checks passed! This is your staging database.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
