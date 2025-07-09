'use client'

import { gql, useQuery } from '@apollo/client'

const TEST_QUERY = gql`
  query TestQuery {
    posts {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`

export default function TestGraphQLPage() {
  const { data, loading, error } = useQuery(TEST_QUERY)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GraphQL テストページ</h1>

      <div className="space-y-4">
        <div>
          <strong>ステータス:</strong> {loading ? 'Loading...' : 'Complete'}
        </div>

        {error && (
          <div className="text-red-600">
            <strong>エラー:</strong> {error.message}
          </div>
        )}

        {data && (
          <div>
            <strong>データ:</strong>
            <pre className="bg-gray-100 p-4 rounded mt-2">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
