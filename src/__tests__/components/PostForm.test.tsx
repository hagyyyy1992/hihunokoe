import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PostForm from '@/components/forms/post-form'
import { categoryLabels } from '@/lib/constants/categories'
import { useRouter } from 'next/navigation'
import { MockedProvider } from '@apollo/client/testing'
import { CREATE_POST } from '@/graphql/queries/post'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()

describe('PostForm', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mocks = [
    {
      request: {
        query: CREATE_POST,
        variables: {
          input: {
            title: 'テスト投稿',
            content: 'テストコンテンツ',
            cosmeticName: 'テスト化粧品',
            cosmeticCategory: 'toner',
            skinType: 'normal',
            moodTag: 'good',
            usageSituation: {},
            experienceDetails: {},
          },
        },
      },
      result: {
        data: {
          createPost: {
            id: '1',
            title: 'テスト投稿',
            content: 'テストコンテンツ',
          },
        },
      },
    },
  ]

  test('カテゴリー選択が共通定数から動的に生成される', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostForm />
      </MockedProvider>
    )

    const categorySelect = screen.getByTestId('category-select')
    const options = categorySelect.querySelectorAll('option')

    // 最初のオプションは「選択してください」
    expect(options[0]).toHaveTextContent('選択してください')
    expect(options[0]).toHaveValue('')

    // カテゴリーラベルの数 + 1（選択してください）のオプションが存在する
    expect(options.length).toBe(Object.keys(categoryLabels).length + 1)

    // 各カテゴリーが正しく表示されている
    Object.entries(categoryLabels).forEach(([value, label], index) => {
      const option = options[index + 1] // +1 は「選択してください」の分
      expect(option).toHaveValue(value)
      expect(option).toHaveTextContent(label)
    })
  })

  test('カテゴリーの順序が一貫している', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostForm />
      </MockedProvider>
    )

    const categorySelect = screen.getByTestId('category-select')
    const options = Array.from(categorySelect.querySelectorAll('option')).slice(1) // 「選択してください」を除く
    const actualOrder = options.map(option => option.value)
    const expectedOrder = Object.keys(categoryLabels)

    expect(actualOrder).toEqual(expectedOrder)
  })

  test('カテゴリーを選択できる', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostForm />
      </MockedProvider>
    )

    const categorySelect = screen.getByTestId('category-select')

    // 化粧水を選択
    fireEvent.change(categorySelect, { target: { value: 'toner' } })
    expect(categorySelect).toHaveValue('toner')

    // ファンデーションを選択
    fireEvent.change(categorySelect, { target: { value: 'foundation' } })
    expect(categorySelect).toHaveValue('foundation')
  })

  test('すべてのカテゴリーが選択可能', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <PostForm />
      </MockedProvider>
    )

    const categorySelect = screen.getByTestId('category-select') as HTMLSelectElement

    Object.keys(categoryLabels).forEach(categoryValue => {
      fireEvent.change(categorySelect, { target: { value: categoryValue } })
      expect(categorySelect.value).toBe(categoryValue)
    })
  })
})
