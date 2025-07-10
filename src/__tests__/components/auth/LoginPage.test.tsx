import {
  render,
  screen,
  createUser,
  expectElementToBeVisible,
  fillInput,
  submitForm,
} from '../../helpers/rtl-utils'
import {
  setupComponentTest,
  cleanupComponentTest,
  waitFor as delay,
} from '../../helpers/component-test-setup'
import { waitFor } from '@testing-library/react'
import {
  mockApiResponse,
  setupFetchMock,
  createMockFetch,
  mockRouter,
} from '../../helpers/component-mocks'
import LoginPage from '@/app/auth/login/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

const mockLogin = jest.fn()
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
    refreshAuth: jest.fn(),
    updateProfile: jest.fn(),
    loading: false,
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
describe('LoginPage', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>
  let mockRefreshAuth: jest.Mock

  beforeEach(() => {
    setupComponentTest()
    mockFetch = createMockFetch()
    setupFetchMock(mockFetch)
    mockRefreshAuth = jest.fn()
    jest.clearAllMocks()
    mockLogin.mockClear()
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  it('ページが正しくレンダリングされる', () => {
    render(<LoginPage />)

    expectElementToBeVisible(screen.getByRole('heading', { name: 'ログイン' }))
    expectElementToBeVisible(screen.getByTestId('login-form'))
    expectElementToBeVisible(screen.getByTestId('email-input'))
    expectElementToBeVisible(screen.getByTestId('password-input'))
    expectElementToBeVisible(screen.getByTestId('login-button'))
  })

  it('ロゴが表示される', () => {
    render(<LoginPage />)

    const logo = screen.getByText('H')
    expectElementToBeVisible(logo)
    expect(logo.closest('div')).toHaveClass(
      'w-10',
      'h-10',
      'sm:w-12',
      'sm:h-12',
      'bg-apple-100',
      'rounded-full'
    )
  })

  it('会員登録リンクが表示される', () => {
    render(<LoginPage />)

    const registerLink = screen.getByTestId('register-link')
    expectElementToBeVisible(registerLink)
    expect(registerLink).toHaveAttribute('href', '/auth/register')
    expect(registerLink).toHaveTextContent('会員登録')
  })

  it('パスワード忘れリンクが表示される', () => {
    render(<LoginPage />)

    const forgotPasswordLink = screen.getByTestId('forgot-password-link')
    expectElementToBeVisible(forgotPasswordLink)
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password')
    expect(forgotPasswordLink).toHaveTextContent('パスワードをお忘れですか？')
  })

  it('Remember meチェックボックスが表示される', () => {
    render(<LoginPage />)

    const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox') as HTMLInputElement
    expectElementToBeVisible(rememberMeCheckbox)
    expect(rememberMeCheckbox).toHaveAttribute('type', 'checkbox')
    expect(rememberMeCheckbox).toHaveAttribute('id', 'remember-me')
  })

  describe('フォーム入力フィールド', () => {
    it('メールアドレス入力フィールドが正しく設定されている', () => {
      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('placeholder', 'example@example.com')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
    })

    it('パスワード入力フィールドが正しく設定されている', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('placeholder', 'パスワードを入力してください')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    })

    it('フォーム送信ボタンの初期状態が正しい', () => {
      render(<LoginPage />)

      const submitButton = screen.getByTestId('login-button')
      expect(submitButton).toHaveTextContent('ログイン')
      expect(submitButton).not.toBeDisabled()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('フォーム送信', () => {
    it('正しい情報でログインできる', async () => {
      const user = createUser()
      mockLogin.mockResolvedValueOnce(undefined)

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await submitForm(user, form)

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('ログイン成功時にダッシュボードにリダイレクトされる', async () => {
      const user = createUser()
      mockLogin.mockResolvedValueOnce(undefined)

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await submitForm(user, form)

      await delay(100)

      expect(mockRouter.push).toHaveBeenCalledWith('/home')
    })

    it('ログインエラー時にエラーメッセージが表示される', async () => {
      const user = createUser()
      mockLogin.mockRejectedValueOnce(new Error('メールアドレスまたはパスワードが間違っています'))

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'wrong@example.com')
      await fillInput(user, passwordInput, 'wrongpassword')
      await submitForm(user, form)

      await delay(100)

      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage).toHaveTextContent('メールアドレスまたはパスワードが間違っています')
      expect(errorMessage).toHaveClass('bg-red-50', 'text-red-700')
    })

    it('メール認証が必要な場合に再送信ボタンが表示される', async () => {
      const user = createUser()
      mockLogin.mockRejectedValueOnce(new Error('メールアドレスの確認が完了していません'))

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'unverified@example.com')
      await fillInput(user, passwordInput, 'password123')

      await submitForm(user, form)
      await delay(100)

      expect(screen.getByText('メールアドレスの確認が完了していません')).toBeInTheDocument()

      // Wait for the resend button to appear after the error message
      await waitFor(() => expect(screen.getByText('確認メールを再送信する')).toBeInTheDocument())
    })

    it('確認メール再送信機能が動作する', async () => {
      const user = createUser()

      // First call - login with email verification required
      mockLogin.mockRejectedValueOnce(new Error('メールアドレスの確認が完了していません'))

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'unverified@example.com')
      await fillInput(user, passwordInput, 'password123')
      await submitForm(user, form)
      await delay(100)

      // Second call - resend verification email
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.success({ message: '確認メール送信完了' }) as any
      )

      const resendButton = screen.getByText('確認メールを再送信する')
      await user.click(resendButton)

      await delay(100)

      expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'unverified@example.com' }),
      })

      const successMessage = screen.getByTestId('error-message')
      expect(successMessage).toHaveTextContent(
        '確認メールを再送信しました。メールボックスをご確認ください。'
      )
      expect(successMessage).toHaveClass('bg-green-50', 'text-green-700')
    })

    it('ネットワークエラー時にエラーメッセージが表示される', async () => {
      const user = createUser()
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => ({ ok: true, json: async () => ({ success: true }) }))
      mockLogin.mockRejectedValueOnce(new Error('Network error'))

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await submitForm(user, form)

      await delay(100)

      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage).toHaveTextContent('Network error')
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('送信中はボタンが無効化され、ローディング状態になる', async () => {
      const user = createUser()
      let resolvePromise: (value: {
        children: React.ReactNode
        href: string
        [key: string]: unknown
      }) => void = () => {}
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockLogin.mockReturnValueOnce(pendingPromise as any)

      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const submitButton = screen.getByTestId('login-button')
      const form = screen.getByTestId('login-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await submitForm(user, form)

      expect(submitButton).toBeDisabled()

      resolvePromise(undefined)
      await delay(100)

      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('バリデーション', () => {
    it('空のフィールドでは送信できない', async () => {
      const user = createUser()
      render(<LoginPage />)

      const form = screen.getByTestId('login-form') as HTMLFormElement
      await submitForm(user, form)

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('必須フィールドにrequired属性が設定されている', () => {
      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')

      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })
  })

  describe('UI/UXテスト', () => {
    it('レスポンシブデザインのクラスが適用されている', () => {
      render(<LoginPage />)

      const container = screen.getByRole('heading', { name: 'ログイン' }).closest('div')
      expect(container).toHaveClass('mx-auto', 'w-full', 'max-w-sm', 'sm:max-w-md')
    })

    it('フォームコンテナに適切なスタイルが適用されている', () => {
      render(<LoginPage />)

      const formContainer = screen.getByTestId('login-form').closest('div')
      expect(formContainer).toHaveClass(
        'bg-white',
        'py-6',
        'sm:py-8',
        'px-4',
        'sm:px-6',
        'lg:px-10',
        'shadow',
        'rounded-lg'
      )
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なdata-testid属性が設定されている', () => {
      render(<LoginPage />)

      expect(screen.getByTestId('login-form')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('login-button')).toBeInTheDocument()
      expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('register-link')).toBeInTheDocument()
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument()
    })

    it('入力フィールドに適切なlabelが関連付けられている', () => {
      render(<LoginPage />)

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox')

      expect(screen.getByText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByText('パスワード')).toBeInTheDocument()
      expect(screen.getByText('ログイン状態を保持する')).toBeInTheDocument()

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(rememberMeCheckbox).toHaveAttribute('id', 'remember-me')
    })
  })
})
