#!/usr/bin/env node

const http = require('http')

// GraphQLクエリのテスト
function makeRequest(query, port = 3000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
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

    req.write(JSON.stringify(query))
    req.end()
  })
}

async function testGraphQLPerformance() {
  console.log('🚀 GraphQL パフォーマンステストを開始します...\n')

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

  // 1. 投稿一覧の取得（ユーザー情報を含む）
  console.log('1️⃣ 投稿一覧の取得（ユーザー情報を含む）:')
  try {
    const postsQuery = {
      query: `
        query GetPostsWithUsers {
          posts(first: 20) {
            edges {
              node {
                id
                title
                content
                cosmeticName
                skinType
                createdAt
                user {
                  id
                  displayName
                  email
                }
              }
            }
            totalCount
          }
        }
      `,
    }

    const data = await makeRequest(postsQuery, port)

    if (data.errors) {
      console.error('❌ エラー:', JSON.stringify(data.errors, null, 2))
    } else if (data.data && data.data.posts) {
      console.log('✅ 成功!')
      console.log(`   投稿数: ${data.data.posts.edges.length}件`)
      console.log(`   レスポンス時間: ${data.duration}ms`)

      if (data.duration > 1000) {
        console.log('⚠️  レスポンス時間が1秒を超えています。N+1問題の可能性があります。')
      } else if (data.duration > 500) {
        console.log('⚠️  レスポンス時間が500msを超えています。最適化の余地があります。')
      } else {
        console.log('✨ パフォーマンスは良好です！')
      }
    } else {
      console.log('⚠️ 予期しないレスポンス:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }

  console.log('\n---\n')

  // 2. 投稿一覧の取得（コメント・共感情報を含む）
  console.log('2️⃣ 投稿一覧の取得（コメント・共感情報を含む）:')
  try {
    const postsWithRelationsQuery = {
      query: `
        query GetPostsWithRelations {
          posts(first: 10) {
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
                  user {
                    id
                    displayName
                  }
                }
                empathies {
                  id
                  empathyType
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

    const data = await makeRequest(postsWithRelationsQuery, port)

    if (data.errors) {
      console.error('❌ エラー:', JSON.stringify(data.errors, null, 2))
    } else if (data.data && data.data.posts) {
      console.log('✅ 成功!')
      console.log(`   投稿数: ${data.data.posts.edges.length}件`)
      console.log(`   レスポンス時間: ${data.duration}ms`)

      // コメントとEmpathyの数を集計
      let totalComments = 0
      let totalEmpathies = 0
      data.data.posts.edges.forEach(edge => {
        totalComments += edge.node.comments?.length || 0
        totalEmpathies += edge.node.empathies?.length || 0
      })

      console.log(`   総コメント数: ${totalComments}`)
      console.log(`   総共感数: ${totalEmpathies}`)

      if (data.duration > 2000) {
        console.log('⚠️  レスポンス時間が2秒を超えています。重大なN+1問題の可能性があります。')
      } else if (data.duration > 1000) {
        console.log('⚠️  レスポンス時間が1秒を超えています。最適化が必要です。')
      } else {
        console.log('✨ パフォーマンスは良好です！')
      }
    } else {
      console.log('⚠️ 予期しないレスポンス:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }

  console.log('\n---\n')

  // 3. 個別クエリの実行（N+1問題の確認）
  console.log('3️⃣ N+1問題の確認（個別クエリ vs バッチクエリ）:')
  try {
    // まず投稿IDを取得
    const idsQuery = {
      query: `
        query GetPostIds {
          posts(first: 5) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
    }

    const idsData = await makeRequest(idsQuery, port)

    if (idsData.data && idsData.data.posts && idsData.data.posts.edges.length > 0) {
      const postIds = idsData.data.posts.edges.map(edge => edge.node.id)

      // 個別にユーザー情報を取得（N+1の例）
      console.log('\n  📍 個別クエリでのテスト:')
      const individualStartTime = Date.now()

      for (const postId of postIds) {
        const singlePostQuery = {
          query: `
            query GetSinglePost($id: ID!) {
              post(id: $id) {
                id
                user {
                  id
                  displayName
                }
              }
            }
          `,
          variables: { id: postId },
        }
        await makeRequest(singlePostQuery, port)
      }

      const individualDuration = Date.now() - individualStartTime
      console.log(`     個別クエリ合計時間: ${individualDuration}ms`)

      // バッチクエリでの取得
      console.log('\n  📍 バッチクエリでのテスト:')
      const batchQuery = {
        query: `
          query GetPostsBatch {
            posts(first: 5) {
              edges {
                node {
                  id
                  user {
                    id
                    displayName
                  }
                }
              }
            }
          }
        `,
      }

      const batchData = await makeRequest(batchQuery, port)
      console.log(`     バッチクエリ時間: ${batchData.duration}ms`)

      const improvement = Math.round(
        ((individualDuration - batchData.duration) / individualDuration) * 100
      )
      console.log(`\n  📊 パフォーマンス比較:`)
      console.log(`     改善率: ${improvement}%`)

      if (improvement > 50) {
        console.log('     ✅ DataLoaderが効果的に機能しています！')
      } else if (improvement > 0) {
        console.log('     ⚠️  改善は見られますが、さらなる最適化が可能です。')
      } else {
        console.log('     ❌ N+1問題が解決されていない可能性があります。')
      }
    }
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }

  console.log('\n\n✨ パフォーマンステスト完了!')
  console.log('\n📝 推奨事項:')
  console.log('- レスポンス時間が200ms以下: 優秀')
  console.log('- レスポンス時間が500ms以下: 良好')
  console.log('- レスポンス時間が1秒以上: 要改善')
  console.log('- DataLoaderを使用してN+1問題を解決')
  console.log('- 関連データの積極的な読み込み（eager loading）を検討')
}

// 実行
testGraphQLPerformance().catch(console.error)
