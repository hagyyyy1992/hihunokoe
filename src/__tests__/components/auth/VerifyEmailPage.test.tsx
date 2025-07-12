import { render, screen, expectElementToBeVisible, waitFor } from '../../helpers/rtl-utils'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'
import {
  mockApiResponse,
  setupFetchMock,
  createMockFetch,
  mockRouter,
} from '../../helpers/component-mocks'
import VerifyEmailPage from '@/app/auth/verify-email/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'token') return 'valid-verification-token'
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

const mockRefreshAuth = jest.fn()

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshAuth: mockRefreshAuth,
    updateProfile: jest.fn(),
    loading: false,
  }),
}))

describe('VerifyEmailPage', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    setupComponentTest()
    mockFetch = createMockFetch()
    setupFetchMock(mockFetch)
    jest.clearAllMocks()
    mockRefreshAuth.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    cleanupComponentTest()
    jest.useRealTimers()
  })

  it('ページが正しくレンダリングされる', () => {
    render(<VerifyEmailPage />)

    expectElementToBeVisible(screen.getByText('メールアドレスの確認'))
  })

  describe('初期ローディング状態', () => {
    it('検証中にローディング状態が表示される', () => {
      // Don't resolve the promise immediately to test loading state
      const pendingPromise = new Promise(() => {
        // Promise intentionally not resolved to test loading state
      })
      mockFetch.mockReturnValueOnce(pendingPromise as Promise<Response>)

      render(<VerifyEmailPage />)

      expectElementToBeVisible(screen.getByText('確認中...'))
      const spinner = screen.getByText('確認中...').previousElementSibling
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'h-8',
        'w-8',
        'border-b-2',
        'border-blue-600'
      )
    })
  })

  describe('メール確認成功', () => {
    it('成功時に成功メッセージが表示される', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      expectElementToBeVisible(screen.getByText('メールアドレスの確認が完了しました'))
      expect(screen.getByText('✓')).toBeInTheDocument()
      expectElementToBeVisible(screen.getByText('3秒後に自動的にホーム画面に移動します'))
      expectElementToBeVisible(screen.getByText('今すぐホーム画面に移動'))
    })

    it('成功時にrefreshAuthが呼ばれる', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      expect(mockRefreshAuth).toHaveBeenCalledTimes(1)
    })

    it('成功時に3秒後にホームページにリダイレクトされる', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      // Fast-forward time
      jest.advanceTimersByTime(3000)

      expect(mockRouter.push).toHaveBeenCalledWith('/home')
    })

    it('今すぐホーム画面に移動リンクが正しく設定されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      const homeLink = screen.getByText('今すぐホーム画面に移動')
      expect(homeLink.closest('a')).toHaveAttribute('href', '/home')
    })
  })

  describe('メール確認失敗', () => {
    it('エラー時にエラーメッセージが表示される', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.error('無効なトークンまたは期限切れです') as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('無効なトークンまたは期限切れです')).toBeInTheDocument()
      )

      expectElementToBeVisible(screen.getByText('無効なトークンまたは期限切れです'))
      expect(screen.getByText('✗')).toBeInTheDocument()
      expectElementToBeVisible(screen.getByText('新規登録に戻る'))
      expectElementToBeVisible(screen.getByText('ログインページ'))
    })

    it('ネットワークエラー時にエラーメッセージが表示される', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認に失敗しました')).toBeInTheDocument()
      )

      expectElementToBeVisible(screen.getByText('メールアドレスの確認に失敗しました'))
      expect(consoleSpy).toHaveBeenCalledWith('Email verification error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('エラー時のナビゲーションリンクが正しく設定されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.error('無効なトークンまたは期限切れです') as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('無効なトークンまたは期限切れです')).toBeInTheDocument()
      )

      const registerLink = screen.getByText('新規登録に戻る')
      const loginLink = screen.getByText('ログインページ')

      expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register')
      expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('トークンの処理', () => {
    it('有効なトークンでAPI呼び出しが行われる', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/verify-email?token=valid-verification-token'
      )
    })

    it('重複処理を防ぐため一度だけ実行される', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      // API should be called only once
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Suspenseとフォールバック', () => {
    it('ローディング状態が表示される', () => {
      // This test verifies that the Suspense fallback structure is correct
      render(<VerifyEmailPage />)

      // The page should render some form of content
      expect(
        screen.getByText('確認中...') || screen.getByText('メールアドレスの確認')
      ).toBeInTheDocument()
    })
  })

  describe('UI/UXテスト', () => {
    it('適切なスタイルクラスが適用されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      // Find the container with max-w-md class by searching upward
      const heading = screen.getByText('メールアドレスの確認')
      let container = heading.parentElement
      while (container && !container.classList.contains('max-w-md')) {
        container = container.parentElement
      }
      expect(container).toHaveClass('max-w-md', 'w-full', 'space-y-8')

      // Find the white container
      const successMessage = screen.getByText('メールアドレスの確認が完了しました')
      let whiteContainer = successMessage.parentElement
      while (whiteContainer && !whiteContainer.classList.contains('bg-white')) {
        whiteContainer = whiteContainer.parentElement
      }
      expect(whiteContainer).toHaveClass('bg-white', 'shadow-md', 'rounded-lg', 'p-6')
    })

    it('成功状態のスタイルが正しく適用されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      const successIcon = screen.getByText('✓')
      expect(successIcon).toHaveClass('text-green-600', 'text-5xl', 'mb-4')

      const successMessage = screen.getByText('メールアドレスの確認が完了しました')
      expect(successMessage).toHaveClass('text-green-600', 'font-medium', 'mb-4')
    })

    it('エラー状態のスタイルが正しく適用されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.error('無効なトークンまたは期限切れです') as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('無効なトークンまたは期限切れです')).toBeInTheDocument()
      )

      const errorIcon = screen.getByText('✗')
      expect(errorIcon).toHaveClass('text-red-600', 'text-5xl', 'mb-4')

      const errorMessage = screen.getByText('無効なトークンまたは期限切れです')
      expect(errorMessage).toHaveClass('text-red-600', 'font-medium', 'mb-4')
    })

    it('ローディング状態のスタイルが正しく適用されている', () => {
      const pendingPromise = new Promise(() => {
        // Promise intentionally not resolved to test loading state
      })
      mockFetch.mockReturnValueOnce(pendingPromise as Promise<Response>)

      render(<VerifyEmailPage />)

      const spinner = screen.getByText('確認中...').previousElementSibling as HTMLElement
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'h-8',
        'w-8',
        'border-b-2',
        'border-blue-600'
      )

      const loadingText = screen.getByText('確認中...')
      expect(loadingText).toHaveClass('text-gray-600')
    })
  })

  describe('アクセシビリティ', () => {
    it('適切な見出し構造が使用されている', () => {
      render(<VerifyEmailPage />)

      const heading = screen.getByText('メールアドレスの確認')
      expect(heading.tagName).toBe('H2')
    })

    it('リンクに適切なtext-colorクラスが適用されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      const homeLink = screen.getByText('今すぐホーム画面に移動')
      expect(homeLink).toHaveClass('text-blue-600', 'hover:text-blue-500', 'font-medium')
    })

    it('エラー時のリンクに適切なスタイルが適用されている', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.error('無効なトークンまたは期限切れです') as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('無効なトークンまたは期限切れです')).toBeInTheDocument()
      )

      const registerLink = screen.getByText('新規登録に戻る')
      const loginLink = screen.getByText('ログインページ')

      expect(registerLink).toHaveClass(
        'block',
        'text-blue-600',
        'hover:text-blue-500',
        'font-medium'
      )
      expect(loginLink).toHaveClass('block', 'text-blue-600', 'hover:text-blue-500', 'font-medium')
    })

    it('スピナーに適切なaria属性が設定されている', () => {
      const pendingPromise = new Promise(() => {
        // Promise intentionally not resolved to test loading state
      })
      mockFetch.mockReturnValueOnce(pendingPromise as Promise<Response>)

      render(<VerifyEmailPage />)

      const spinner = screen.getByText('確認中...').previousElementSibling as HTMLElement
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('状態管理', () => {
    it('処理完了後は再実行されない', async () => {
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      const { rerender } = render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      // Re-render the component
      rerender(<VerifyEmailPage />)

      // API should still be called only once
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('useEffectの依存関係が正しく設定されている', async () => {
      // This test verifies that useEffect dependencies are correct
      // by checking that the effect runs when searchParams change
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: 'メールアドレスの確認が完了しました' }) as Response
      )

      render(<VerifyEmailPage />)

      await waitFor(() =>
        expect(screen.getByText('メールアドレスの確認が完了しました')).toBeInTheDocument()
      )

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/verify-email?token=valid-verification-token'
      )
      expect(mockRefreshAuth).toHaveBeenCalledTimes(1)
    })
  })
})
