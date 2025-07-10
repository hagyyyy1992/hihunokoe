import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PostsPage from '@/app/posts/page'
import { categoryLabels } from '@/lib/constants/categories'
import { MockedProvider } from '@apollo/client/testing'
import { GET_POSTS } from '@/graphql/queries/post'

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  }
})

const mockPosts = {
  data: {
    posts: {
      edges: [
        {
          node: {
            id: '1',
            title: 'テスト投稿1',
            content: 'テストコンテンツ1',
            cosmeticName: 'テスト化粧水',
            cosmeticCategory: 'toner',
            skinType: 'normal',
            author: {
              id: '1',
              userName: 'testuser',
            },
            createdAt: new Date().toISOString(),
            _count: {
              empathies: 5,
              comments: 3,
            },
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '1',
        endCursor: '1',
      },
    },
  },
}

const mocks = [
  {
    request: {
      query: GET_POSTS,
      variables: {
        first: 20,
        filters: {},
      },
    },
    result: mockPosts,
  },
]

describe('PostsPage', () => {
  test('カテゴリーフィルターが共通定数から動的に生成される', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostsPage />
      </MockedProvider>
    )

    const categoryFilter = await screen.findByTestId('category-filter')
    const options = categoryFilter.querySelectorAll('option')

    // 最初のオプションは「すべて」
    expect(options[0]).toHaveTextContent('すべて')
    expect(options[0]).toHaveValue('')

    // スキンケアカテゴリーを除いたカテゴリー数 + 1（すべて）のオプションが存在する
    const expectedCount = Object.keys(categoryLabels).filter(key => key !== 'skincare').length + 1
    expect(options.length).toBe(expectedCount)
  })

  test('スキンケアカテゴリーがフィルターに含まれていない', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostsPage />
      </MockedProvider>
    )

    const categoryFilter = await screen.findByTestId('category-filter')
    const options = Array.from(categoryFilter.querySelectorAll('option'))
    const optionValues = options.map(option => (option as HTMLOptionElement).value)

    expect(optionValues).not.toContain('skincare')
  })

  test('各カテゴリーが正しいラベルで表示される', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostsPage />
      </MockedProvider>
    )

    const categoryFilter = await screen.findByTestId('category-filter')
    const options = categoryFilter.querySelectorAll('option')

    // スキンケアを除いた各カテゴリーが正しく表示されている
    const categoriesWithoutSkincare = Object.entries(categoryLabels).filter(
      ([key]) => key !== 'skincare'
    )

    categoriesWithoutSkincare.forEach(([value, label], index) => {
      const option = options[index + 1] // +1 は「すべて」の分
      expect(option).toHaveValue(value)
      expect(option).toHaveTextContent(label)
    })
  })

  test('カテゴリーフィルターを選択できる', async () => {
    const mockWithFilter = [
      ...mocks,
      {
        request: {
          query: GET_POSTS,
          variables: {
            first: 20,
            filters: { cosmeticCategory: 'toner' },
          },
        },
        result: mockPosts,
      },
    ]

    render(
      <MockedProvider mocks={mockWithFilter} addTypename={false}>
        <PostsPage />
      </MockedProvider>
    )

    const categoryFilter = await screen.findByTestId('category-filter')

    // 化粧水を選択
    fireEvent.change(categoryFilter, { target: { value: 'toner' } })
    expect(categoryFilter).toHaveValue('toner')
  })
})
