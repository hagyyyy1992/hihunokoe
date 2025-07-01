import { render, screen, createUser, waitFor } from '../helpers/rtl-utils'
import ProfilePage from '../../src/app/profile/page'
import { setupComponentTest, cleanupComponentTest } from '../helpers/component-test-setup'
import { mockUser } from '../helpers/component-mocks'

// Mock the auth context
jest.mock('../../src/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Import the mocked modules
import { useAuth } from '../../src/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

// Mock the auth hook
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock the updateProfile function
const mockUpdateProfile = jest.fn()
const mockRouterPush = jest.fn()

describe('ProfilePage Component', () => {
  beforeEach(() => {
    setupComponentTest()

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { ...mockUser },
      loading: false,
      updateProfile: mockUpdateProfile,
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
    } as any)

    mockUpdateProfile.mockResolvedValue(undefined)
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
    } as any)

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      updateProfile: mockUpdateProfile,
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
      updateProfile: mockUpdateProfile,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshAuth: jest.fn(),
    })

    render(<ProfilePage />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('編集モードに切り替わる', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // 編集ボタンをクリック
    await user.click(screen.getByTestId('edit-profile-button'))

    // フォームが表示されていることを確認
    expect(screen.getByTestId('username-input')).toBeInTheDocument()
    expect(screen.getByTestId('skin-type-select')).toBeInTheDocument()

    // 保存ボタンとキャンセルボタンが表示されていることを確認
    expect(screen.getByTestId('save-profile-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-edit-button')).toBeInTheDocument()
  })

  it('フォームの入力値を変更できる', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // 編集モードに切り替え
    await user.click(screen.getByTestId('edit-profile-button'))

    // ユーザー名を変更
    const usernameInput = screen.getByTestId('username-input')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')

    // 肌タイプを変更
    const skinTypeSelect = screen.getByTestId('skin-type-select')
    await user.selectOptions(skinTypeSelect, 'dry')

    // 入力値が変更されていることを確認
    expect(usernameInput).toHaveValue('newusername')
    expect(skinTypeSelect).toHaveValue('dry')
  })

  it('プロフィールを正常に更新する', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // 編集モードに切り替え
    await user.click(screen.getByTestId('edit-profile-button'))

    // ユーザー名を変更
    const usernameInput = screen.getByTestId('username-input')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')

    // 保存ボタンをクリック
    await user.click(screen.getByTestId('save-profile-button'))

    // updateProfileが呼ばれたことを確認
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      userName: 'newusername',
      skinType: mockUser.skinType,
    })

    // 成功メッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('プロフィールを更新しました')).toBeInTheDocument()
    })

    // 編集モードが終了していることを確認
    expect(screen.queryByTestId('username-input')).not.toBeInTheDocument()
  })

  it('バリデーションエラーを表示する', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // 編集モードに切り替え
    await user.click(screen.getByTestId('edit-profile-button'))

    // ユーザー名を短すぎる値に変更
    const usernameInput = screen.getByTestId('username-input')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'ab')

    // 保存ボタンをクリック
    await user.click(screen.getByTestId('save-profile-button'))

    // バリデーションエラーが表示されることを確認
    expect(screen.getByText('ユーザー名は3文字以上で入力してください')).toBeInTheDocument()

    // updateProfileが呼ばれていないことを確認
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('プロフィール更新に失敗した場合、エラーメッセージを表示する', async () => {
    // updateProfileがエラーを返すようにモック
    mockUpdateProfile.mockRejectedValue(new Error('更新に失敗しました'))

    const user = createUser()
    render(<ProfilePage />)

    // 編集モードに切り替え
    await user.click(screen.getByTestId('edit-profile-button'))

    // ユーザー名を変更
    const usernameInput = screen.getByTestId('username-input')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')

    // 保存ボタンをクリック
    await user.click(screen.getByTestId('save-profile-button'))

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('更新に失敗しました')).toBeInTheDocument()
    })
  })

  it('キャンセルボタンをクリックすると編集モードが終了する', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // 編集モードに切り替え
    await user.click(screen.getByTestId('edit-profile-button'))

    // ユーザー名を変更
    const usernameInput = screen.getByTestId('username-input')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')

    // キャンセルボタンをクリック
    await user.click(screen.getByTestId('cancel-edit-button'))

    // 編集モードが終了していることを確認
    expect(screen.queryByTestId('username-input')).not.toBeInTheDocument()

    // 元のユーザー名が表示されていることを確認
    expect(screen.getByText(`@${mockUser.userName}`)).toBeInTheDocument()

    // updateProfileが呼ばれていないことを確認
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('アカウント削除ボタンが表示され、クリックすると削除ページに遷移する', async () => {
    const user = createUser()
    render(<ProfilePage />)

    // アカウント設定セクションが表示されることを確認
    expect(screen.getByText('アカウント設定')).toBeInTheDocument()
    expect(
      screen.getByText(
        /アカウントを削除すると、すべての投稿、コメント、共感データが永久に削除されます/
      )
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
