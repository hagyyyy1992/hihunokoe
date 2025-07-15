const { gql } = require('graphql-request')

// 正しいクエリを定義
const GET_POSTS = gql`
  query GetPosts($first: Int, $after: String, $filter: PostFilterInput, $orderBy: PostOrderBy) {
    posts(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        cursor
        node {
          id
          title
          content
          cosmeticName
          cosmeticCategory
          skinType
          moodTag
          viewCount
          empathyCount
          commentCount
          createdAt
          user {
            id
            displayName
            profileImageUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`

const GET_SINGLE_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      cosmeticName
      cosmeticCategory
      skinType
      moodTag
      viewCount
      empathyCount
      createdAt
      user {
        id
        displayName
        profileImageUrl
      }
    }
  }
`

// パフォーマンステスト関数
async function testGraphQLPerformance() {
  const { GraphQLClient } = require('graphql-request')

  const client = new GraphQLClient('http://localhost:3000/api/graphql', {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  console.log('🔍 GraphQL パフォーマンステストを開始します...\n')

  // 1. 基本的な投稿一覧取得
  console.log('1️⃣ 基本的な投稿一覧取得:')
  const startTime1 = Date.now()
  try {
    const result1 = await client.request(GET_POSTS, {
      first: 10,
      filter: {},
      orderBy: 'CREATED_AT_DESC',
    })
    const endTime1 = Date.now()
    console.log(`✅ 成功! 実行時間: ${endTime1 - startTime1}ms`)
    console.log(`   投稿数: ${result1.posts.edges.length}`)
    console.log(`   総投稿数: ${result1.posts.totalCount}`)
    console.log(`   最初の投稿ID: ${result1.posts.edges[0]?.node?.id || 'なし'}`)
  } catch (error) {
    const endTime1 = Date.now()
    console.log(`❌ エラー: ${endTime1 - startTime1}ms`)
    console.log(`   エラー内容: ${error.message}`)
  }

  // 2. 大量データ取得（50件）
  console.log('\n2️⃣ 大量データ取得（50件）:')
  const startTime2 = Date.now()
  try {
    const result2 = await client.request(GET_POSTS, {
      first: 50,
      filter: {},
      orderBy: 'CREATED_AT_DESC',
    })
    const endTime2 = Date.now()
    console.log(`✅ 成功! 実行時間: ${endTime2 - startTime2}ms`)
    console.log(`   投稿数: ${result2.posts.edges.length}`)
    console.log(`   総投稿数: ${result2.posts.totalCount}`)

    // N+1問題の確認 - ユーザー情報が正しく取得されているか
    const usersWithoutDisplayName = result2.posts.edges.filter(
      edge => !edge.node.user.displayName || edge.node.user.displayName === 'Unknown User'
    )
    console.log(`   ユーザー情報取得失敗: ${usersWithoutDisplayName.length}件`)

    // 各投稿のユーザー情報をサンプル表示
    if (result2.posts.edges.length > 0) {
      const sample = result2.posts.edges.slice(0, 3)
      console.log('   サンプルユーザー情報:')
      sample.forEach((edge, index) => {
        console.log(`     ${index + 1}. ${edge.node.user.displayName} (${edge.node.user.id})`)
      })
    }
  } catch (error) {
    const endTime2 = Date.now()
    console.log(`❌ エラー: ${endTime2 - startTime2}ms`)
    console.log(`   エラー内容: ${error.message}`)
  }

  // 3. フィルター付きクエリ
  console.log('\n3️⃣ フィルター付きクエリ:')
  const startTime3 = Date.now()
  try {
    const result3 = await client.request(GET_POSTS, {
      first: 20,
      filter: {
        skinType: '乾燥肌',
      },
      orderBy: 'CREATED_AT_DESC',
    })
    const endTime3 = Date.now()
    console.log(`✅ 成功! 実行時間: ${endTime3 - startTime3}ms`)
    console.log(`   投稿数: ${result3.posts.edges.length}`)
    console.log(`   総投稿数: ${result3.posts.totalCount}`)
  } catch (error) {
    const endTime3 = Date.now()
    console.log(`❌ エラー: ${endTime3 - startTime3}ms`)
    console.log(`   エラー内容: ${error.message}`)
  }

  // 4. 検索付きクエリ
  console.log('\n4️⃣ 検索付きクエリ:')
  const startTime4 = Date.now()
  try {
    const result4 = await client.request(GET_POSTS, {
      first: 20,
      filter: {
        search: '化粧水',
      },
      orderBy: 'CREATED_AT_DESC',
    })
    const endTime4 = Date.now()
    console.log(`✅ 成功! 実行時間: ${endTime4 - startTime4}ms`)
    console.log(`   投稿数: ${result4.posts.edges.length}`)
    console.log(`   総投稿数: ${result4.posts.totalCount}`)
  } catch (error) {
    const endTime4 = Date.now()
    console.log(`❌ エラー: ${endTime4 - startTime4}ms`)
    console.log(`   エラー内容: ${error.message}`)
  }

  // 5. 人気順ソート
  console.log('\n5️⃣ 人気順ソート:')
  const startTime5 = Date.now()
  try {
    const result5 = await client.request(GET_POSTS, {
      first: 20,
      filter: {},
      orderBy: 'EMPATHY_COUNT_DESC',
    })
    const endTime5 = Date.now()
    console.log(`✅ 成功! 実行時間: ${endTime5 - startTime5}ms`)
    console.log(`   投稿数: ${result5.posts.edges.length}`)
    console.log(`   総投稿数: ${result5.posts.totalCount}`)

    // 人気順になっているか確認
    if (result5.posts.edges.length > 1) {
      const empathyCounts = result5.posts.edges.map(edge => edge.node.empathyCount)
      console.log(`   共感数順: ${empathyCounts.slice(0, 5).join(', ')}`)
    }
  } catch (error) {
    const endTime5 = Date.now()
    console.log(`❌ エラー: ${endTime5 - startTime5}ms`)
    console.log(`   エラー内容: ${error.message}`)
  }

  console.log('\n✨ テスト完了!')
}

// パフォーマンステストの実行
testGraphQLPerformance().catch(console.error)
