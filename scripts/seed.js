require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // デモユーザーの作成
  const hashedPassword = await bcrypt.hash('demo1234', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      emailVerified: true, // メール認証済みに設定
      failedLoginAttempts: 0, // ログイン失敗回数をリセット
      lockedUntil: null, // アカウントロックを解除
      isActive: true, // アクティブ状態に設定
    },
    create: {
      userName: 'demo_user',
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      skinType: 'normal',
      role: 'USER',
      emailVerified: true, // メール認証済みに設定
      isActive: true, // アクティブ状態に設定
    },
  })

  console.log('✅ Demo user created:', demoUser.email)

  // 管理者ユーザーの作成（互換性のため一旦Userテーブルにも作成）
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: 'SUPER_ADMIN',
      emailVerified: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    },
    create: {
      userName: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword, // 同じパスワード (demo1234) を使用
      role: 'SUPER_ADMIN',
      emailVerified: true,
      isActive: true,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // AdminUserテーブルにも管理者を作成
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: 'SUPER_ADMIN',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      adminName: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Super admin created in AdminUser table:', superAdmin.email)

  // デモ投稿の作成
  const demoPosts = [
    {
      title: '敏感肌でも使えた！優しい化粧水',
      content:
        '敏感肌の私でも安心して使える化粧水を見つけました。刺激もなく、しっとりとした仕上がりで満足しています。',
      cosmeticName: 'ナチュラル保湿化粧水',
      cosmeticCategory: 'toner',
      skinType: 'sensitive',
      moodTag: 'love',
      usageSituation: {
        season: 'winter',
        timeOfDay: 'morning',
        menstrualCycle: 'normal',
        skinCondition: 'stable',
        weatherCondition: 'dry',
      },
      experienceDetails: {
        fragrance: {
          type: 'none',
          intensity: 'none',
          description: '無香料でよかった',
        },
        texture: {
          type: 'liquid',
          spreadability: 'easy',
          absorption: 'fast',
          description: 'さらっとしているのにしっとり',
        },
        afterUse: {
          moisture: 'moist',
          texture: 'smooth',
          comfort: 'comfortable',
          duration: 'long',
          description: '一日中潤いが続いた',
        },
      },
    },
    {
      title: 'リピ決定！コスパ最高のクレンジング',
      content:
        'ドラッグストアで買えるプチプラクレンジングですが、メイクもしっかり落ちてつっぱりません。',
      cosmeticName: 'やさしいクレンジングオイル',
      cosmeticCategory: 'cleansing',
      skinType: 'combination',
      moodTag: 'good',
      usageSituation: {
        season: 'spring',
        timeOfDay: 'evening',
        menstrualCycle: 'normal',
        skinCondition: 'stable',
        weatherCondition: 'normal',
      },
      experienceDetails: {
        fragrance: {
          type: 'citrus',
          intensity: 'weak',
          description: 'ほんのり柑橘系',
        },
        texture: {
          type: 'oil',
          spreadability: 'easy',
          absorption: 'moderate',
          description: 'するっと落ちる',
        },
        afterUse: {
          moisture: 'balanced',
          texture: 'smooth',
          comfort: 'comfortable',
          duration: 'moderate',
          description: 'つっぱらず良い感じ',
        },
      },
    },
  ]

  for (const postData of demoPosts) {
    // 既存の投稿をチェック
    const existingPost = await prisma.post.findFirst({
      where: {
        title: postData.title,
        userId: demoUser.id,
      },
    })

    if (!existingPost) {
      const post = await prisma.post.create({
        data: {
          ...postData,
          userId: demoUser.id,
          publishedAt: new Date(),
        },
      })
      console.log('✅ Demo post created:', post.title)
    } else {
      console.log('⏭️  Demo post already exists:', postData.title)
    }
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
