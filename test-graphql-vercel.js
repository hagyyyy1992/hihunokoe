#!/usr/bin/env node

const https = require('https')

// Vercel環境のURL（stagingブランチのデプロイメント）
const VERCEL_URL = 'hihunokoe-staging.vercel.app'

// GraphQLクエリのテスト
function makeRequest(query) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const postData = JSON.stringify(query)

    const options = {
      hostname: VERCEL_URL,
      port: 443,
      path: '/api/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        const endTime = Date.now()
        const duration = endTime - startTime
        try {
          const parsed = JSON.parse(data)
          resolve({ ...parsed, duration })
        } catch (e) {
          resolve({
            error: `Failed to parse response: ${data.substring(0, 200)}...`,
            statusCode: res.statusCode,
            duration,
          })
        }
      })
    })

    req.on('error', error => {
      const endTime = Date.now()
      const duration = endTime - startTime
      resolve({ error: error.message, duration })
    })

    req.write(postData)
    req.end()
  })
}

async function analyzeGraphQLPerformance() {
  console.log('🌐 Vercel環境でのGraphQL パフォーマンス分析を開始します...')
  console.log(`📍 対象URL: https://${VERCEL_URL}/api/graphql\n`)

  // 1. 基本的な接続確認
  console.log('1️⃣ 接続確認:')
  const testQuery = { query: '{ __typename }' }
  const testResult = await makeRequest(testQuery)

  if (testResult.error) {
    console.error('❌ GraphQL APIに接続できません:', testResult.error)
    return
  }
  console.log('✅ 接続成功\n')

  // 2. 投稿一覧取得（ユーザー情報含む）
  console.log('2️⃣ 投稿一覧の取得（ユーザー情報を含む）:')
  console.log('   クエリ: posts + user データ')

  const postsWithUsersQuery = {
    query: `
      query GetPostsWithUsers {
        posts(first: 10) {
          edges {
            node {
              id
              title
              content
              cosmeticName
              skinType
              empathyCount
              commentCount
              createdAt
              user {
                id
                displayName
                email
              }
            }
          }
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
  }

  const postsResult = await makeRequest(postsWithUsersQuery)

  if (postsResult.errors) {
    console.error('❌ エラー:', JSON.stringify(postsResult.errors, null, 2))
  } else if (postsResult.data && postsResult.data.posts) {
    console.log('✅ 成功!')
    console.log(`   投稿数: ${postsResult.data.posts.edges.length}件`)
    console.log(`   総投稿数: ${postsResult.data.posts.totalCount}件`)
    console.log(`   レスポンス時間: ${postsResult.duration}ms`)

    // パフォーマンス評価
    if (postsResult.duration < 200) {
      console.log('   ✨ 優秀なパフォーマンス（< 200ms）')
    } else if (postsResult.duration < 500) {
      console.log('   ✅ 良好なパフォーマンス（< 500ms）')
    } else if (postsResult.duration < 1000) {
      console.log('   ⚠️  改善の余地あり（< 1秒）')
    } else {
      console.log('   ❌ パフォーマンスに問題あり（> 1秒）')
    }
  }

  console.log('\n---\n')

  // 3. ネストされたデータの取得テスト
  console.log('3️⃣ ネストされたデータの取得（N+1問題の確認）:')
  console.log('   クエリ: posts + user + comments + empathies')

  const nestedQuery = {
    query: `
      query GetPostsWithNestedData {
        posts(first: 5) {
          edges {
            node {
              id
              title
              empathyCount
              commentCount
              user {
                id
                displayName
              }
              comments {
                id
                content
                createdAt
                user {
                  id
                  displayName
                }
              }
              empathies {
                id
                empathyType
                createdAt
                user {
                  id
                  displayName
                }
              }
            }
          }
        }
      }
    `,
  }

  const nestedResult = await makeRequest(nestedQuery)

  if (nestedResult.errors) {
    console.error('❌ エラー:', JSON.stringify(nestedResult.errors, null, 2))
  } else if (nestedResult.data && nestedResult.data.posts) {
    console.log('✅ 成功!')
    const posts = nestedResult.data.posts.edges
    console.log(`   投稿数: ${posts.length}件`)

    // 関連データの集計
    let totalComments = 0
    let totalEmpathies = 0
    let totalUsers = new Set()

    posts.forEach(edge => {
      const post = edge.node
      totalComments += post.comments?.length || 0
      totalEmpathies += post.empathies?.length || 0

      // ユーザーIDを集計
      totalUsers.add(post.user?.id)
      post.comments?.forEach(comment => {
        if (comment.user?.id) totalUsers.add(comment.user.id)
      })
      post.empathies?.forEach(empathy => {
        if (empathy.user?.id) totalUsers.add(empathy.user.id)
      })
    })

    console.log(`   関連コメント数: ${totalComments}`)
    console.log(`   関連共感数: ${totalEmpathies}`)
    console.log(`   関連ユーザー数: ${totalUsers.size}`)
    console.log(`   レスポンス時間: ${nestedResult.duration}ms`)

    // N+1問題の評価
    const expectedQueries = 1 + totalUsers.size // 1 (posts) + N (users)
    const timePerQuery = nestedResult.duration / expectedQueries

    console.log(`\n   📊 パフォーマンス分析:`)
    console.log(`   推定クエリ数: ${expectedQueries}`)
    console.log(`   1クエリあたりの時間: ${Math.round(timePerQuery)}ms`)

    if (nestedResult.duration < 500) {
      console.log('   ✅ DataLoaderが効果的に機能している可能性が高い')
    } else if (nestedResult.duration < 1000) {
      console.log('   ⚠️  部分的にN+1問題が残っている可能性')
    } else {
      console.log('   ❌ N+1問題が深刻な状態')
    }
  }

  console.log('\n---\n')

  // 4. 個別投稿の取得（比較用）
  console.log('4️⃣ 個別投稿の取得パフォーマンス:')

  // まず投稿IDを取得
  const idsQuery = {
    query: `
      query GetPostIds {
        posts(first: 3) {
          edges {
            node {
              id
            }
          }
        }
      }
    `,
  }

  const idsResult = await makeRequest(idsQuery)

  if (idsResult.data && idsResult.data.posts && idsResult.data.posts.edges.length > 0) {
    const postIds = idsResult.data.posts.edges.map(edge => edge.node.id)

    console.log(`   取得する投稿ID: ${postIds.join(', ')}`)

    // 個別に投稿を取得
    const individualTimes = []
    for (const postId of postIds) {
      const singlePostQuery = {
        query: `
          query GetSinglePost($id: ID!) {
            post(id: $id) {
              id
              title
              user {
                id
                displayName
              }
            }
          }
        `,
        variables: { id: postId },
      }

      const result = await makeRequest(singlePostQuery)
      if (result.data) {
        individualTimes.push(result.duration)
        console.log(`   Post ${postId}: ${result.duration}ms`)
      }
    }

    const avgTime = Math.round(individualTimes.reduce((a, b) => a + b, 0) / individualTimes.length)
    const totalTime = individualTimes.reduce((a, b) => a + b, 0)

    console.log(`\n   平均レスポンス時間: ${avgTime}ms`)
    console.log(`   合計時間: ${totalTime}ms`)
  }

  console.log('\n\n📈 パフォーマンス分析まとめ:')
  console.log('────────────────────────────')

  if (postsResult.duration && nestedResult.duration) {
    const simpleQueryTime = postsResult.duration
    const complexQueryTime = nestedResult.duration
    const ratio = complexQueryTime / simpleQueryTime

    console.log(`📊 クエリ複雑度による影響:`)
    console.log(`   シンプルクエリ: ${simpleQueryTime}ms`)
    console.log(`   複雑なクエリ: ${complexQueryTime}ms`)
    console.log(`   増加率: ${Math.round((ratio - 1) * 100)}%`)

    if (ratio < 2) {
      console.log(`   ✅ 複雑度に対してスケーラブル`)
    } else if (ratio < 5) {
      console.log(`   ⚠️  複雑なクエリで性能劣化`)
    } else {
      console.log(`   ❌ 深刻なN+1問題の兆候`)
    }
  }

  console.log('\n💡 推奨される改善策:')
  console.log('1. DataLoaderパターンの実装（ユーザー情報は実装済み）')
  console.log('2. コメント・共感データ用のDataLoader追加')
  console.log('3. GraphQLのフィールドリゾルバーの最適化')
  console.log('4. データベースインデックスの確認')
  console.log('5. クエリの複雑度制限の実装')
}

// 実行
analyzeGraphQLPerformance().catch(console.error)
