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
  waitFor,
} from '../../helpers/component-test-setup'
import { mockApiResponse, setupFetchMock, createMockFetch } from '../../helpers/component-mocks'
import ForgotPasswordPage from '../../../src/app/auth/forgot-password/page'

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }
})

describe('ForgotPasswordPage', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    setupComponentTest()
    mockFetch = createMockFetch()
    setupFetchMock(mockFetch)
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  it('ページが正しくレンダリングされる', () => {
    render(<ForgotPasswordPage />)

    expectElementToBeVisible(screen.getByText('パスワードをお忘れですか？'))
    expectElementToBeVisible(
      screen.getByText('メールアドレスを入力してください。パスワードリセットリンクをお送りします。')
    )
    expectElementToBeVisible(screen.getByTestId('reset-password-form'))
    expectElementToBeVisible(screen.getByTestId('email-input'))
    expectElementToBeVisible(screen.getByTestId('reset-password-button'))
  })

  it('ロゴが表示される', () => {
    render(<ForgotPasswordPage />)

    const logo = screen.getByText('H')
    expectElementToBeVisible(logo)
    expect(logo.closest('div')).toHaveClass('w-10', 'h-10', 'sm:w-12', 'sm:h-12', 'bg-apple-100', 'rounded-full')
  })

  it('ログインページへのリンクが表示される', () => {
    render(<ForgotPasswordPage />)

    const loginLink = screen.getByText('ログインページに戻る')
    expectElementToBeVisible(loginLink)
    expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login')
  })

  it('メールアドレス入力フィールドが正しく設定されている', () => {
    render(<ForgotPasswordPage />)

    const emailInput = screen.getByTestId('email-input') as HTMLInputElement
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('placeholder', 'example@example.com')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')
  })

  it('フォーム送信ボタンの初期状態が正しい', () => {
    render(<ForgotPasswordPage />)

    const submitButton = screen.getByTestId('reset-password-button')
    expect(submitButton).toHaveTextContent('パスワードリセットメールを送信')
    expect(submitButton).not.toBeDisabled()
  })

  describe('フォーム送信', () => {
    it('メールアドレスを入力してフォームを送信できる', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: 'メール送信成功' }) as any)

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const form = screen.getByTestId('reset-password-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await submitForm(user, form)

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    })

    it('成功時に成功メッセージが表示される', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: 'メール送信成功' }) as any)

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const form = screen.getByTestId('reset-password-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await submitForm(user, form)

      await waitFor(100)

      const successMessage = screen.getByTestId('message')
      expect(successMessage).toHaveTextContent(
        'パスワードリセットメールを送信しました。メールボックスをご確認ください。'
      )
      expect(successMessage).toHaveClass('bg-green-50', 'text-green-700')
    })

    it('エラー時にエラーメッセージが表示される', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(mockApiResponse.error('ユーザーが見つかりません') as any)

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const form = screen.getByTestId('reset-password-form') as HTMLFormElement

      await fillInput(user, emailInput, 'nonexistent@example.com')
      await submitForm(user, form)

      await waitFor(100)

      const errorMessage = screen.getByTestId('message')
      expect(errorMessage).toHaveTextContent('ユーザーが見つかりません')
      expect(errorMessage).toHaveClass('bg-red-50', 'text-red-700')
    })

    it('ネットワークエラー時にエラーメッセージが表示される', async () => {
      const user = createUser()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const form = screen.getByTestId('reset-password-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await submitForm(user, form)

      await waitFor(100)

      const errorMessage = screen.getByTestId('message')
      expect(errorMessage).toHaveTextContent('エラーが発生しました')
      expect(errorMessage).toHaveClass('bg-red-50', 'text-red-700')
      expect(consoleSpy).toHaveBeenCalledWith('Forgot password error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('送信中はボタンが無効化され、ローディング状態になる', async () => {
      const user = createUser()
      let resolvePromise: (value: any) => void = () => {}
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockFetch.mockReturnValueOnce(pendingPromise as any)

      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const submitButton = screen.getByTestId('reset-password-button')
      const form = screen.getByTestId('reset-password-form') as HTMLFormElement

      await fillInput(user, emailInput, 'test@example.com')
      await submitForm(user, form)

      expect(submitButton).toBeDisabled()

      resolvePromise(mockApiResponse.success({ message: 'Success' }))
      await waitFor(100)

      expect(submitButton).not.toBeDisabled()
    })

    it('空のメールアドレスでは送信できない', async () => {
      const user = createUser()
      render(<ForgotPasswordPage />)

      const form = screen.getByTestId('reset-password-form') as HTMLFormElement
      await submitForm(user, form)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('バリデーション', () => {
    it('メールアドレス入力フィールドにrequired属性が設定されている', () => {
      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input')
      expect(emailInput).toHaveAttribute('required')
    })

    it('メールアドレス入力フィールドにemail typeが設定されている', () => {
      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input')
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  describe('UI/UXテスト', () => {
    it('レスポンシブデザインのクラスが適用されている', () => {
      render(<ForgotPasswordPage />)

      const container = screen.getByText('パスワードをお忘れですか？').closest('div')
      expect(container).toHaveClass('mx-auto', 'w-full', 'max-w-sm', 'sm:max-w-md')
    })

    it('フォームコンテナに適切なスタイルが適用されている', () => {
      render(<ForgotPasswordPage />)

      const formContainer = screen.getByTestId('reset-password-form').closest('div')
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

    it('ヘッダータイトルに適切なスタイルが適用されている', () => {
      render(<ForgotPasswordPage />)

      const title = screen.getByText('パスワードをお忘れですか？')
      expect(title).toHaveClass(
        'mt-4',
        'sm:mt-6',
        'text-center',
        'text-xl',
        'sm:text-2xl',
        'lg:text-3xl',
        'font-extrabold',
        'text-gray-900'
      )
    })
  })

  describe('アクセシビリティ', () => {
    it('フォームにdata-testid属性が設定されている', () => {
      render(<ForgotPasswordPage />)

      const form = screen.getByTestId('reset-password-form')
      expect(form).toBeInTheDocument()
    })

    it('入力フィールドに適切なlabelが関連付けられている', () => {
      render(<ForgotPasswordPage />)

      const emailInput = screen.getByTestId('email-input')
      const label = screen.getByText('メールアドレス')
      expect(label).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('id', 'email')
    })

    it('ボタンに適切なdata-testid属性が設定されている', () => {
      render(<ForgotPasswordPage />)

      const button = screen.getByTestId('reset-password-button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })
})
