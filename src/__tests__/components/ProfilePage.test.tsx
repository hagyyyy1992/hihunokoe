import { render, screen, createUser } from '../helpers/rtl-utils'
import ProfilePage from '@/app/profile/page'
import { setupComponentTest, cleanupComponentTest } from '../helpers/component-test-setup'
import { mockUser } from '../helpers/component-mocks'
import { ReadonlyURLSearchParams } from 'next/navigation'

// Mock the auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Import the mocked modules
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock the auth hook
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

const mockRouterPush = jest.fn()

describe('ProfilePage Component', () => {
  beforeEach(() => {
    setupComponentTest()

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { ...mockUser },
      loading: false,
      updateProfile: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshAuth: jest.fn(),
    })

    mockUseRouter.mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>)

    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      has: jest.fn().mockReturnValue(false),
      getAll: jest.fn().mockReturnValue([]),
      keys: jest.fn().mockReturnValue([]),
      values: jest.fn().mockReturnValue([]),
      entries: jest.fn().mockReturnValue([]),
      forEach: jest.fn(),
      toString: jest.fn().mockReturnValue(''),
      append: jest.fn(),
      delete: jest.fn(),
      set: jest.fn(),
      sort: jest.fn(),
      size: 0,
      [Symbol.iterator]: jest.fn(),
    } as unknown as ReadonlyURLSearchParams)
  })

  afterEach(() => {
    cleanupComponentTest()
    jest.clearAllMocks()
  })

  it('ユーザー情報を正しく表示する', () => {
    render(<ProfilePage />)

    // ユーザー名が表示されていることを確認
    expect(screen.getByRole('heading', { name: 'testuser' })).toBeInTheDocument()

    // 基本情報セクションが表示されていることを確認
    expect(screen.getByText('基本情報')).toBeInTheDocument()

    // 編集ボタンが表示されていることを確認
    expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument()
  })

  it('ユーザーが認証されていない場合、ログインページにリダイレクトする', () => {
    const mockPush = jest.fn()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>)

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      updateProfile: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshAuth: jest.fn(),
    })

    render(<ProfilePage />)

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('ローディング中は読み込み中の表示をする', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      updateProfile: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshAuth: jest.fn(),
    })

    render(<ProfilePage />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('編集ボタンをクリックすると編集ページに遷移する', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // 編集ボタンをクリック
    await user.click(screen.getByTestId('edit-profile-button'))

    // ルーターのpushが呼ばれることを確認
    expect(mockRouterPush).toHaveBeenCalledWith('/profile/edit')
  })

  it('肌タイプが設定されている場合、バッジで表示される', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, skinType: 'dry' },
      loading: false,
      updateProfile: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshAuth: jest.fn(),
    })

    render(<ProfilePage />)

    // 肌タイプバッジが表示されていることを確認（複数の要素があるため、getAllByTextを使用）
    const skinTypeElements = screen.getAllByText('乾燥肌')
    expect(skinTypeElements).toHaveLength(2) // バッジと基本情報セクションの2箇所
    expect(skinTypeElements[0]).toHaveClass('badge') // 最初の要素はバッジ
  })

  it('基本情報が正しく表示される', () => {
    mockUseAuth.mockReturnValue({
      user: {
        ...mockUser,
        birthDate: new Date('1990-01-01'),
        gender: 'female',
        allergies: ['fragrance', 'alcohol'],
        allergiesOther: 'ビタミンC誘導体',
      },
      loading: false,
      updateProfile: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshAuth: jest.fn(),
    })

    render(<ProfilePage />)

    // メールアドレスが表示されていることを確認
    expect(screen.getByText('test@example.com')).toBeInTheDocument()

    // 肌タイプが表示されていることを確認（複数の要素があるため、getAllByTextを使用）
    const skinTypeElements = screen.getAllByText('普通肌')
    expect(skinTypeElements).toHaveLength(2) // バッジと基本情報セクションの2箇所

    // 生年月日が表示されていることを確認
    expect(screen.getByText('1990/1/1')).toBeInTheDocument()

    // 性別が表示されていることを確認
    expect(screen.getByText('女性')).toBeInTheDocument()

    // アレルギーが表示されていることを確認
    expect(screen.getByText('香料、アルコール、ビタミンC誘導体')).toBeInTheDocument()
  })

  it('アカウント削除ボタンが表示され、クリックすると削除ページに遷移する', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // アカウント設定セクションが表示されることを確認
    expect(screen.getByText('アカウント設定')).toBeInTheDocument()
    expect(
      screen.getByText(/アカウントを削除すると、すべての投稿が永久に削除されます/)
    ).toBeInTheDocument()

    // アカウント削除ボタンが表示されることを確認
    const deleteButton = screen.getByTestId('delete-account-button')
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton).toHaveTextContent('アカウントを削除')

    // ボタンをクリック
    await user.click(deleteButton)

    // ルーターのpushが呼ばれることを確認
    expect(mockRouterPush).toHaveBeenCalledWith('/account/delete')
  })
})
