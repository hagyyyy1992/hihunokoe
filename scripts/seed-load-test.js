const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')
const { faker } = require('@faker-js/faker/locale/ja')

const prisma = new PrismaClient()

// 設定
const CONFIG = {
  users: 1000, // 生成するユーザー数
  postsPerUser: 5, // 各ユーザーあたりの投稿数
  commentsPerPost: 3, // 各投稿あたりのコメント数
  empathiesPerPost: 10, // 各投稿あたりの共感数
  batchSize: 100, // バッチ処理のサイズ
  saltRounds: 10, // bcryptのsaltラウンド数（負荷テスト用に低めに設定）
}

// プログレス表示用
let progress = {
  users: 0,
  posts: 0,
  comments: 0,
  empathies: 0,
}

// ランダムデータ生成用のヘルパー関数
const skinTypes = ['normal', 'dry', 'oily', 'combination', 'sensitive']
const genders = ['male', 'female', 'other']
const allergyTypes = ['fragrance', 'alcohol', 'paraben', 'sulfate', 'silicone']
const cosmeticCategories = [
  'toner',
  'serum',
  'moisturizer',
  'cleanser',
  'sunscreen',
  'mask',
  'eye_cream',
  'lip_care',
]
const moodTags = [
  'refreshing',
  'moisturizing',
  'calming',
  'energizing',
  'luxurious',
  'natural',
  'gentle',
  'powerful',
]

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateUsageSituation() {
  return {
    season: faker.helpers.arrayElement(['spring', 'summer', 'autumn', 'winter']),
    timeOfDay: faker.helpers.arrayElement(['morning', 'afternoon', 'evening', 'night']),
    skinCondition: faker.helpers.arrayElement(['good', 'normal', 'bad', 'sensitive']),
    weather: faker.helpers.arrayElement(['sunny', 'cloudy', 'rainy', 'humid', 'dry']),
    occasion: faker.helpers.arrayElement(['daily', 'special', 'work', 'date', 'party']),
  }
}

function generateExperienceDetails() {
  return {
    scent: faker.helpers.arrayElement(['floral', 'citrus', 'herbal', 'woody', 'unscented']),
    texture: faker.helpers.arrayElement(['light', 'creamy', 'gel', 'oil', 'watery']),
    absorption: faker.helpers.arrayElement(['fast', 'moderate', 'slow']),
    finish: faker.helpers.arrayElement(['matte', 'dewy', 'natural', 'glowing']),
    satisfaction: faker.number.int({ min: 1, max: 5 }),
  }
}

// バッチ処理用のヘルパー関数
async function processBatch(items, batchSize, processor) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }
  return results
}

async function main() {
  console.log('🚀 負荷テスト用データの生成を開始します...')
  console.log(`設定: ${CONFIG.users}人のユーザー、各${CONFIG.postsPerUser}件の投稿`)
  console.log(`合計: ${CONFIG.users * CONFIG.postsPerUser}件の投稿`)
  console.log('')

  const startTime = Date.now()

  try {
    // 既存のデータを削除（オプション）
    console.log('📋 既存のテストデータをクリーンアップ中...')
    await prisma.$transaction([
      prisma.empathy.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.comment.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.postPermission.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.post.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.withdrawalSurvey.deleteMany({ where: { user: { email: { contains: '@loadtest' } } } }),
      prisma.contactInquiry.deleteMany({ where: { email: { contains: '@loadtest' } } }),
      prisma.user.deleteMany({ where: { email: { contains: '@loadtest' } } }),
    ])

    // パスワードハッシュを事前に生成（全ユーザー同じパスワードで時間短縮）
    console.log('🔐 パスワードハッシュを生成中...')
    const passwordHash = await bcryptjs.hash('loadtest123', CONFIG.saltRounds)

    // 1. ユーザーの生成
    console.log(`\n👥 ${CONFIG.users}人のユーザーを生成中...`)
    const userDataArray = []
    for (let i = 0; i < CONFIG.users; i++) {
      const userNumber = i + 1
      userDataArray.push({
        userName: `loadtest_user_${userNumber}`,
        email: `loadtest${userNumber}@loadtest.example.com`,
        passwordHash,
        emailVerified: true,
        isActive: true,
        birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        gender: faker.helpers.arrayElement(genders),
        skinType: faker.helpers.arrayElement(skinTypes),
        allergies: getRandomItems(allergyTypes, faker.number.int({ min: 0, max: 3 })),
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        createdAt: faker.date.past({ years: 2 }),
      })
    }

    // バッチ処理でユーザーを作成
    const users = await processBatch(userDataArray, CONFIG.batchSize, async userData => {
      const user = await prisma.user.create({ data: userData })
      progress.users++
      if (progress.users % 100 === 0) {
        console.log(`  ✓ ${progress.users}/${CONFIG.users} ユーザー作成完了`)
      }
      return user
    })

    // 2. 投稿の生成
    console.log(`\n📝 ${CONFIG.users * CONFIG.postsPerUser}件の投稿を生成中...`)
    const postDataArray = []
    for (const user of users) {
      for (let j = 0; j < CONFIG.postsPerUser; j++) {
        const createdAt = faker.date.between({
          from: user.createdAt,
          to: new Date(),
        })
        postDataArray.push({
          userId: user.id,
          title: faker.commerce.productName() + 'の使用レポート',
          content: faker.lorem.paragraphs(3, '\n\n'),
          cosmeticName: faker.commerce.productName(),
          cosmeticCategory: faker.helpers.arrayElement(cosmeticCategories),
          skinType: user.skinType,
          usageSituation: generateUsageSituation(),
          experienceDetails: generateExperienceDetails(),
          moodTag: faker.helpers.arrayElement(moodTags),
          status: 'published',
          viewCount: faker.number.int({ min: 0, max: 1000 }),
          createdAt,
          publishedAt: createdAt,
        })
      }
    }

    const posts = await processBatch(postDataArray, CONFIG.batchSize, async postData => {
      const post = await prisma.post.create({ data: postData })
      progress.posts++
      if (progress.posts % 500 === 0) {
        console.log(`  ✓ ${progress.posts}/${CONFIG.users * CONFIG.postsPerUser} 投稿作成完了`)
      }
      return post
    })

    // 3. コメントの生成
    const totalComments = posts.length * CONFIG.commentsPerPost
    console.log(`\n💬 ${totalComments}件のコメントを生成中...`)
    const commentDataArray = []
    for (const post of posts) {
      // ランダムなユーザーからコメント
      const commenters = faker.helpers.arrayElements(users, CONFIG.commentsPerPost)
      for (const commenter of commenters) {
        commentDataArray.push({
          postId: post.id,
          userId: commenter.id,
          content: faker.lorem.sentence(),
          createdAt: faker.date.between({
            from: post.createdAt,
            to: new Date(),
          }),
        })
      }
    }

    await processBatch(commentDataArray, CONFIG.batchSize * 2, async commentData => {
      await prisma.comment.create({ data: commentData })
      progress.comments++
      if (progress.comments % 1000 === 0) {
        console.log(`  ✓ ${progress.comments}/${totalComments} コメント作成完了`)
      }
    })

    // 4. 共感の生成
    const totalEmpathies = posts.length * CONFIG.empathiesPerPost
    console.log(`\n❤️  ${totalEmpathies}件の共感を生成中...`)
    const empathyDataArray = []
    const empathyTypes = ['like', 'love', 'useful', 'surprised', 'thinking']

    for (const post of posts) {
      // ランダムなユーザーから共感
      const empathizers = faker.helpers.arrayElements(users, CONFIG.empathiesPerPost)
      for (const empathizer of empathizers) {
        empathyDataArray.push({
          postId: post.id,
          userId: empathizer.id,
          empathyType: faker.helpers.arrayElement(empathyTypes),
          createdAt: faker.date.between({
            from: post.createdAt,
            to: new Date(),
          }),
        })
      }
    }

    // 重複を避けるため、バッチ処理でcreateMany
    const empathyBatches = []
    for (let i = 0; i < empathyDataArray.length; i += CONFIG.batchSize * 5) {
      empathyBatches.push(empathyDataArray.slice(i, i + CONFIG.batchSize * 5))
    }

    for (const batch of empathyBatches) {
      await prisma.empathy.createMany({
        data: batch,
        skipDuplicates: true,
      })
      progress.empathies += batch.length
      console.log(`  ✓ ${progress.empathies}/${totalEmpathies} 共感作成完了`)
    }

    // 5. 投稿の共感数を更新
    console.log('\n📊 投稿の共感数を更新中...')
    const updateBatches = []
    for (let i = 0; i < posts.length; i += CONFIG.batchSize) {
      updateBatches.push(posts.slice(i, i + CONFIG.batchSize))
    }

    let updatedPosts = 0
    for (const batch of updateBatches) {
      await Promise.all(
        batch.map(async post => {
          const empathyCount = await prisma.empathy.count({
            where: { postId: post.id },
          })
          await prisma.post.update({
            where: { id: post.id },
            data: { empathyCount },
          })
        })
      )
      updatedPosts += batch.length
      console.log(`  ✓ ${updatedPosts}/${posts.length} 投稿の共感数更新完了`)
    }

    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    console.log('\n✅ 負荷テスト用データの生成が完了しました！')
    console.log('\n📈 生成結果:')
    console.log(`  - ユーザー: ${progress.users}人`)
    console.log(`  - 投稿: ${progress.posts}件`)
    console.log(`  - コメント: ${progress.comments}件`)
    console.log(`  - 共感: ${progress.empathies}件`)
    console.log(`  - 実行時間: ${duration.toFixed(2)}秒`)
    console.log(`  - 平均処理速度: ${(progress.posts / duration).toFixed(2)}投稿/秒`)
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 実行
main()
