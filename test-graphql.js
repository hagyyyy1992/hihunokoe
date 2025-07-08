#!/usr/bin/env node

const http = require('http')

// GraphQLクエリのテスト
function makeRequest(query, port = 3000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const req = http.request(options, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve(parsed)
        } catch (e) {
          resolve({
            error: `Failed to parse response: ${data.substring(0, 200)}...`,
            statusCode: res.statusCode,
          })
        }
      })
    })

    req.on('error', error => {
      resolve({ error: error.message })
    })

    req.write(JSON.stringify(query))
    req.end()
  })
}

async function testGraphQL() {
  console.log('🔍 GraphQL APIの動作確認を開始します...\n')

  // まずポート3000を試し、失敗したら3001を試す
  let port = 3000
  let testQuery = { query: '{ __typename }' }
  let testResult = await makeRequest(testQuery, port)

  if (testResult.error || testResult.statusCode === 404) {
    console.log('ℹ️  ポート3000で接続できません。ポート3001を試します...')
    port = 3001
    testResult = await makeRequest(testQuery, port)

    if (testResult.error || testResult.statusCode === 404) {
      console.error(
        '❌ GraphQL APIに接続できません。開発サーバーが起動していることを確認してください。'
      )
      return
    }
  }

  console.log(`✅ ポート${port}でGraphQL APIに接続しました。\n`)

  // 1. 投稿一覧の取得
  console.log('1️⃣ 投稿一覧の取得:')
  try {
    const postsQuery = {
      query: `
        query GetPosts {
          posts {
            id
            title
            content
            product_name
            skin_type
            product_rating
            created_at
            user {
              id
              name
            }
          }
        }
      `,
    }

    const data = await makeRequest(postsQuery, port)

    if (data.errors) {
      console.error('❌ エラー:', JSON.stringify(data.errors, null, 2))
    } else if (data.data && data.data.posts) {
      console.log('✅ 成功!')
      console.log(`   投稿数: ${data.data.posts.length}件`)
      if (data.data.posts.length > 0) {
        console.log('   最新の投稿:')
        const latestPost = data.data.posts[0]
        console.log(`   - タイトル: ${latestPost.title}`)
        console.log(`   - 商品名: ${latestPost.product_name}`)
        console.log(`   - 評価: ${latestPost.product_rating}/5`)
      }
    } else {
      console.log('⚠️ 予期しないレスポンス:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }

  console.log('\n---\n')

  // 2. 単一投稿の取得
  console.log('2️⃣ 単一投稿の取得:')
  try {
    // まず投稿一覧を取得してIDを取得
    const postsQuery = {
      query: `
        query GetPosts {
          posts {
            id
          }
        }
      `,
    }

    const postsData = await makeRequest(postsQuery, port)

    if (postsData.data && postsData.data.posts && postsData.data.posts.length > 0) {
      const postId = postsData.data.posts[0].id

      const postQuery = {
        query: `
          query GetPost($id: ID!) {
            post(id: $id) {
              id
              title
              content
              product_name
              brand_name
              skin_type
              product_rating
              purchase_location
              purchase_price
              usage_period
              repurchase_intention
              created_at
              updated_at
              user {
                id
                name
              }
              empathyCount
              userHasEmpathized
              comments {
                id
                content
                created_at
                user {
                  id
                  name
                }
              }
            }
          }
        `,
        variables: {
          id: postId,
        },
      }

      const data = await makeRequest(postQuery, port)

      if (data.errors) {
        console.error('❌ エラー:', JSON.stringify(data.errors, null, 2))
      } else if (data.data && data.data.post) {
        console.log('✅ 成功!')
        const post = data.data.post
        console.log(`   タイトル: ${post.title}`)
        console.log(`   商品名: ${post.product_name}`)
        console.log(`   ブランド: ${post.brand_name || 'なし'}`)
        console.log(`   評価: ${post.product_rating}/5`)
        console.log(`   共感数: ${post.empathyCount}`)
        console.log(`   コメント数: ${post.comments ? post.comments.length : 0}件`)
      } else {
        console.log('⚠️ 投稿が見つかりません')
      }
    } else {
      console.log('⚠️ 投稿が存在しないため、詳細取得をスキップします')
    }
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }

  console.log('\n---\n')

  // 3. GraphQL Introspectionクエリ（スキーマ確認）
  console.log('3️⃣ GraphQLスキーマの確認:')
  try {
    const introspectionQuery = {
      query: `
        query {
          __schema {
            types {
              name
              kind
            }
          }
        }
      `,
    }

    const data = await makeRequest(introspectionQuery, port)

    if (data.errors) {
      console.error('❌ エラー:', JSON.stringify(data.errors, null, 2))
    } else if (data.data && data.data.__schema) {
      console.log('✅ 成功!')
      const customTypes = data.data.__schema.types
        .filter(
          type =>
            !type.name.startsWith('__') &&
            !['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name)
        )
        .map(type => `${type.name} (${type.kind})`)
      console.log('   カスタム型:')
      customTypes.slice(0, 10).forEach(type => console.log(`   - ${type}`))
      if (customTypes.length > 10) {
        console.log(`   ... 他${customTypes.length - 10}個の型`)
      }
    } else {
      console.log('⚠️ 予期しないレスポンス:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }

  console.log('\n✨ テスト完了!')
  console.log('\n📝 メモ:')
  console.log('- 投稿の作成/更新/削除には認証が必要です')
  console.log(
    '- ブラウザで http://localhost:' +
      port +
      '/api/graphql にアクセスするとGraphQL Playgroundが利用できます'
  )
}

// 実行
testGraphQL().catch(console.error)
