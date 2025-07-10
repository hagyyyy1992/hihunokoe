import {
  render,
  screen,
  createUser,
  expectElementToBeVisible,
  fillInput,
  submitForm,
  waitFor,
} from '../../helpers/rtl-utils'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'
import {
  mockApiResponse,
  setupFetchMock,
  createMockFetch,
  mockRouter,
} from '../../helpers/component-mocks'
import ResetPasswordPage from '@/app/auth/reset-password/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'token') return 'valid-reset-token'
      return null
    }),
  }),
}))

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode
      href: string
      [key: string]: unknown
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }
})

describe('ResetPasswordPage', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    setupComponentTest()
    mockFetch = createMockFetch()
    setupFetchMock(mockFetch)
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  describe('トークン検証', () => {
    it('有効なトークンでパスワードリセットフォームが表示される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any)

      render(<ResetPasswordPage />)

      await waitFor(() => expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument())

      expectElementToBeVisible(screen.getByText('新しいパスワードを設定'))
      expectElementToBeVisible(screen.getByText('新しいパスワードを入力してください'))
      expectElementToBeVisible(screen.getByLabelText('新しいパスワード'))
      expectElementToBeVisible(screen.getByLabelText('パスワード確認'))
      expectElementToBeVisible(screen.getByText('パスワードをリセット'))
    })

    it('無効なトークンでエラーメッセージが表示される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, message: '無効なトークンまたは期限切れです' }),
      } as any)

      render(<ResetPasswordPage />)

      await waitFor(() => expect(screen.getByText('パスワードリセット')).toBeInTheDocument())

      expectElementToBeVisible(screen.getByText('パスワードリセット'))
      expectElementToBeVisible(screen.getByText('無効なトークンまたは期限切れです'))
      expectElementToBeVisible(screen.getByText('パスワードリセットを再試行'))
    })

    it('トークン検証エラー時にエラーメッセージが表示される', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => ({ ok: true, json: async () => ({ success: true }) }))
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ResetPasswordPage />)

      await waitFor(() =>
        expect(screen.getByText('トークンの確認中にエラーが発生しました')).toBeInTheDocument()
      )

      expectElementToBeVisible(screen.getByText('トークンの確認中にエラーが発生しました'))
      expect(consoleSpy).toHaveBeenCalledWith('Token verification error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('トークン検証中にローディング状態が表示される', () => {
      // Don't resolve the promise immediately to test loading state
      let resolvePromise: (value: {
        children: React.ReactNode
        href: string
        [key: string]: unknown
      }) => void = () => {}
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockFetch.mockReturnValueOnce(pendingPromise as any)

      render(<ResetPasswordPage />)

      expectElementToBeVisible(screen.getByText('トークンを確認中...'))
    })
  })

  describe('パスワードリセットフォーム', () => {
    beforeEach(async () => {
      // Mock successful token verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any)

      render(<ResetPasswordPage />)
      await waitFor(() => expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument())
    })

    it('パスワード入力フィールドが正しく設定されている', () => {
      const passwordInput = screen.getByLabelText('新しいパスワード') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('パスワード確認') as HTMLInputElement

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('placeholder', '新しいパスワードを入力してください')

      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('required')
      expect(confirmPasswordInput).toHaveAttribute('placeholder', 'パスワードを再入力してください')
    })

    it('正しいパスワードでリセットできる', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'パスワードリセット成功' }) as any
      )

      const passwordInput = screen.getByLabelText('新しいパスワード') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('パスワード確認') as HTMLInputElement
      const submitButton = screen.getByText('パスワードをリセット')

      await fillInput(user, passwordInput, 'newpassword123')
      await fillInput(user, confirmPasswordInput, 'newpassword123')
      await user.click(submitButton)

      expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'valid-reset-token',
          password: 'newpassword123',
        }),
      })
    })
  })

  describe('バリデーション', () => {
    beforeEach(async () => {
      // Mock successful token verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any)

      render(<ResetPasswordPage />)
      await waitFor(() => expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument())
    })

    it('パスワードが短すぎる場合にエラーメッセージが表示される', async () => {
      const user = createUser()
      const passwordInput = screen.getByLabelText('新しいパスワード') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('パスワード確認') as HTMLInputElement
      const submitButton = screen.getByText('パスワードをリセット')

      await fillInput(user, passwordInput, '123')
      await fillInput(user, confirmPasswordInput, '123')
      await user.click(submitButton)

      // The component correctly prioritizes length validation over password mismatch
      await waitFor(() =>
        expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
      )

      expectElementToBeVisible(screen.getByText('パスワードは8文字以上で入力してください'))
    })
  })

  describe('ナビゲーション', () => {
    it('ログインページへのリンクが表示される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any)

      render(<ResetPasswordPage />)
      await waitFor(() => expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument())

      const loginLink = screen.getByText('ログインページに戻る')
      expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login')
    })

    it('無効なトークン時にパスワードリセット再試行リンクが表示される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, message: '無効なトークン' }),
      } as any)

      render(<ResetPasswordPage />)
      await waitFor(() => expect(screen.getByText('パスワードリセット')).toBeInTheDocument())

      const retryLink = screen.getByText('パスワードリセットを再試行')
      expect(retryLink.closest('a')).toHaveAttribute('href', '/auth/forgot-password')
    })
  })
})
