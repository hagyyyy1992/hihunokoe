import {
  render,
  screen,
  expectElementToBeVisible,
  expectElementToHaveText,
} from '../../helpers/rtl-utils'
import PostCard from '@/components/ui/PostCard'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'
import { categoryLabels, skincareCategories } from '@/lib/constants/categories'

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '1時間前'),
}))

// Mock AuthContext
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
    loading: false,
    error: null,
  }),
}))

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        hasEmpathized: false,
        totalCount: 5,
      }),
  })
) as jest.Mock

describe('PostCard Component', () => {
  const mockPost = {
    id: 'test-post-1',
    title: 'テスト投稿のタイトル',
    content:
      'これはテスト投稿のコンテンツです。長いコンテンツをテストするために十分な文字数を含んでいます。',
    cosmeticName: 'テスト化粧品',
    cosmeticCategory: 'toner',
    skinType: 'normal',
    moodTag: 'good',
    publishedAt: '2024-01-01T00:00:00Z',
    empathyCount: 5,
    viewCount: 42,
    user: {
      id: 'user-1',
      userName: 'テストユーザー',
      skinType: 'normal',
    },
    _count: {
      empathies: 5,
      comments: 3,
    },
  }

  beforeEach(() => {
    setupComponentTest()
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  it('基本的な投稿情報をレンダリングする', () => {
    render(<PostCard post={mockPost} />)

    // タイトル
    const title = screen.getByText('テスト投稿のタイトル')
    expectElementToBeVisible(title)

    // コスメ名
    const cosmeticName = screen.getByText('使用コスメ: テスト化粧品')
    expectElementToBeVisible(cosmeticName)

    // コンテンツ
    const content = screen.getByText(/これはテスト投稿のコンテンツです/)
    expectElementToBeVisible(content)
  })

  it('カテゴリタグを表示する', () => {
    render(<PostCard post={mockPost} />)

    const categoryTag = screen.getByText('化粧水')
    expectElementToBeVisible(categoryTag)
    expect(categoryTag).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('全てのカテゴリが正しくマッピングされる', () => {
    Object.entries(categoryLabels).forEach(([key, label]) => {
      const postWithCategory = { ...mockPost, cosmeticCategory: key }
      const { unmount } = render(<PostCard post={postWithCategory} />)

      const categoryTag = screen.getByText(label)
      expectElementToBeVisible(categoryTag)

      // スキンケアカテゴリは緑色、それ以外は青色
      if (skincareCategories.includes(key)) {
        expect(categoryTag).toHaveClass('bg-green-100', 'text-green-800')
      } else {
        expect(categoryTag).toHaveClass('bg-blue-100', 'text-blue-800')
      }

      unmount()
    })
  })

  it('skincareカテゴリを正しく表示する', () => {
    const postWithSkincare = { ...mockPost, cosmeticCategory: 'skincare' }
    render(<PostCard post={postWithSkincare} />)

    const categoryTag = screen.getByText('スキンケア')
    expectElementToBeVisible(categoryTag)
    expect(categoryTag).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('ムードタグを表示する', () => {
    render(<PostCard post={mockPost} />)

    const moodTag = screen.getByText('良かった')
    expectElementToBeVisible(moodTag)
    expect(moodTag).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('ユーザー情報を表示する', () => {
    render(<PostCard post={mockPost} />)

    // ユーザー名
    const userName = screen.getByText('テストユーザー')
    expectElementToBeVisible(userName)

    // 肌タイプ
    const skinType = screen.getByText('普通肌')
    expectElementToBeVisible(skinType)
  })

  it('投稿へのリンクが正しく設定される', () => {
    render(<PostCard post={mockPost} />)

    const titleLink = screen.getByRole('link')
    expect(titleLink).toHaveAttribute('href', '/posts/test-post-1')
  })

  it('長いコンテンツを切り詰める', () => {
    const longPost = {
      ...mockPost,
      content: 'あ'.repeat(200), // 200文字の長いコンテンツ
    }

    render(<PostCard post={longPost} />)

    const content = screen.getByText(/あ+\.\.\./)
    expect(content.textContent).toHaveLength(153) // 150文字 + "..."
  })

  it('短いコンテンツは切り詰めない', () => {
    const shortPost = {
      ...mockPost,
      content: '短いコンテンツ',
    }

    render(<PostCard post={shortPost} />)

    const content = screen.getByText('短いコンテンツ')
    expectElementToHaveText(content, '短いコンテンツ')
  })

  it('userNameを表示する', () => {
    render(<PostCard post={mockPost} />)

    const userName = screen.getByText('テストユーザー')
    expectElementToBeVisible(userName)
  })

  it('オプション項目がない場合は表示しない', () => {
    const minimalPost = {
      ...mockPost,
      cosmeticCategory: undefined,
      moodTag: undefined,
      user: {
        ...mockPost.user,
        skinType: undefined,
      },
    }

    render(<PostCard post={minimalPost} />)

    // カテゴリタグなし
    expect(screen.queryByText('化粧水')).not.toBeInTheDocument()

    // ムードタグなし
    expect(screen.queryByText('良かった')).not.toBeInTheDocument()

    // 肌タイプなし
    expect(screen.queryByText('普通肌')).not.toBeInTheDocument()
  })

  it('異なるムードタグの色を正しく適用する', () => {
    const moods = [
      { mood: 'disappointed', label: 'ちょっと残念', color: 'bg-gray-100 text-gray-700' },
      { mood: 'okay', label: 'まあまあ', color: 'bg-yellow-100 text-yellow-700' },
      { mood: 'good', label: '良かった', color: 'bg-green-100 text-green-700' },
      { mood: 'love', label: 'また使いたい', color: 'bg-apple-100 text-apple-700' },
      { mood: 'perfect', label: '完璧', color: 'bg-purple-100 text-purple-700' },
    ]

    moods.forEach(({ mood, label, color }) => {
      const testPost = { ...mockPost, moodTag: mood }
      const { unmount } = render(<PostCard post={testPost} />)

      const moodTag = screen.getByText(label)
      expect(moodTag).toHaveClass(...color.split(' '))

      unmount()
    })
  })

  it('日付フォーマットが正しく表示される', () => {
    render(<PostCard post={mockPost} />)

    const timeAgo = screen.getByText('1時間前')
    expectElementToBeVisible(timeAgo)
  })

  it('カードにhover効果のクラスが適用される', () => {
    const { container } = render(<PostCard post={mockPost} />)

    // TestWrapperで囲まれるため、PostCardのdivは2番目の子要素
    const wrapper = container.firstChild as HTMLElement
    const card = wrapper.firstChild as HTMLElement
    expect(card).toHaveClass('hover:shadow-md')
    expect(card).toHaveClass('transition-shadow')
  })
})
