import {
  render,
  screen,
  createUser,
  expectElementToBeVisible,
  fillInput,
  submitForm,
  selectOption,
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
import RegisterPage from '../../../src/app/auth/register/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

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

jest.mock('../../../src/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshAuth: jest.fn(),
    updateProfile: jest.fn(),
    loading: false,
  }),
}))

describe('RegisterPage', () => {
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

  it('ページが正しくレンダリングされる', () => {
    render(<RegisterPage />)

    expectElementToBeVisible(screen.getByRole('heading', { name: '会員登録' }))
    expectElementToBeVisible(screen.getByTestId('register-form'))
    expectElementToBeVisible(screen.getByTestId('username-input'))
    expectElementToBeVisible(screen.getByTestId('email-input'))
    expectElementToBeVisible(screen.getByTestId('password-input'))
    expectElementToBeVisible(screen.getByTestId('confirm-password-input'))
    expectElementToBeVisible(screen.getByTestId('register-button'))
  })

  it('Usakaロゴが表示される', () => {
    render(<RegisterPage />)

    const logo = screen.getByText('U')
    expectElementToBeVisible(logo)
    expect(logo.closest('div')).toHaveClass('w-12', 'h-12', 'bg-pink-100', 'rounded-full')
  })

  it('ログインリンクが表示される', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByText('ログイン')
    expectElementToBeVisible(loginLink)
    expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login')
  })

  describe('必須フィールド', () => {
    it('必須フィールドが正しく設定されている', () => {
      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input')
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const confirmPasswordInput = screen.getByTestId('confirm-password-input')

      expect(usernameInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
      expect(confirmPasswordInput).toHaveAttribute('required')
    })

    it('ユーザー名入力フィールドが正しく設定されている', () => {
      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      expect(usernameInput).toHaveAttribute('type', 'text')
      expect(usernameInput).toHaveAttribute('placeholder', 'ユーザー名を入力してください')
      expect(screen.getByText('3〜50文字で入力してください')).toBeInTheDocument()
    })

    it('メールアドレス入力フィールドが正しく設定されている', () => {
      render(<RegisterPage />)

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'example@example.com')
    })

    it('パスワード入力フィールドが正しく設定されている', () => {
      render(<RegisterPage />)

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password')
      expect(screen.getByText('8文字以上で入力してください')).toBeInTheDocument()
    })
  })

  describe('オプションフィールド', () => {
    it('生年月日フィールドが表示される', () => {
      render(<RegisterPage />)

      const birthDateInput = screen.getByTestId('birth-date-input') as HTMLInputElement
      expect(birthDateInput).toHaveAttribute('type', 'date')
      expect(birthDateInput).not.toHaveAttribute('required')
    })

    it('性別選択フィールドが表示される', () => {
      render(<RegisterPage />)

      const genderSelect = screen.getByTestId('gender-select') as HTMLSelectElement
      expect(genderSelect).toBeInTheDocument()
      const options = screen.getAllByText('選択してください')
      expect(options.length).toBeGreaterThan(0)
      expect(screen.getByText('男性')).toBeInTheDocument()
      expect(screen.getByText('女性')).toBeInTheDocument()
      expect(screen.getByText('ノンバイナリー')).toBeInTheDocument()
      expect(screen.getByText('回答しない')).toBeInTheDocument()
    })

    it('肌質選択フィールドが表示される', () => {
      render(<RegisterPage />)

      const skinTypeSelect = screen.getByTestId('skin-type-select') as HTMLSelectElement
      expect(skinTypeSelect).toBeInTheDocument()
      expect(screen.getByText('普通肌')).toBeInTheDocument()
      expect(screen.getByText('乾燥肌')).toBeInTheDocument()
      expect(screen.getByText('脂性肌')).toBeInTheDocument()
      expect(screen.getByText('混合肌')).toBeInTheDocument()
      const sensitiveOptions = screen.getAllByText('敏感肌')
      expect(sensitiveOptions.length).toBeGreaterThan(0)
    })

    it('肌質で「その他」を選択すると入力フィールドが表示される', async () => {
      const user = createUser()
      render(<RegisterPage />)

      const skinTypeSelect = screen.getByTestId('skin-type-select') as HTMLSelectElement
      await selectOption(user, skinTypeSelect, 'other')

      const skinTypeOtherInput = screen.getByTestId('skin-type-other-input')
      expectElementToBeVisible(skinTypeOtherInput)
      expect(skinTypeOtherInput).toHaveAttribute('placeholder', 'その他の肌質を入力してください')
    })

    it('アレルギー選択フィールドが表示される', () => {
      render(<RegisterPage />)

      const allergiesSelect = screen.getByTestId('allergies-select') as HTMLSelectElement
      expect(allergiesSelect).toHaveAttribute('multiple')
      expect(allergiesSelect).toHaveAttribute('size', '5')
      expect(screen.getByText('香料')).toBeInTheDocument()
      expect(screen.getByText('アルコール')).toBeInTheDocument()
      expect(screen.getByText('パラベン')).toBeInTheDocument()
      expect(screen.getByText('Ctrl/Cmdキーを押しながらクリックで複数選択')).toBeInTheDocument()
    })

    it('アレルギーで「その他」を選択すると入力フィールドが表示される', async () => {
      const user = createUser()
      render(<RegisterPage />)

      const allergiesSelect = screen.getByTestId('allergies-select') as HTMLSelectElement
      await selectOption(user, allergiesSelect, 'other')

      const allergiesOtherInput = screen.getByTestId('allergies-other-input')
      expectElementToBeVisible(allergiesOtherInput)
      expect(allergiesOtherInput).toHaveAttribute(
        'placeholder',
        'その他のアレルギーを入力してください'
      )
    })

    it('体質選択フィールドが表示される', () => {
      render(<RegisterPage />)

      const bodyTypeSelect = screen.getByTestId('body-type-select') as HTMLSelectElement
      expect(bodyTypeSelect).toBeInTheDocument()
      expect(screen.getByText('アトピー性皮膚炎')).toBeInTheDocument()
      // 敏感肌は肌質と体質の両方にあるので、複数存在することを確認
      const sensitiveOptions = screen.getAllByText('敏感肌')
      expect(sensitiveOptions.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('ニキビ肌')).toBeInTheDocument()
      expect(screen.getByText('年齢肌')).toBeInTheDocument()
    })

    it('体質で「その他」を選択すると入力フィールドが表示される', async () => {
      const user = createUser()
      render(<RegisterPage />)

      const bodyTypeSelect = screen.getByTestId('body-type-select') as HTMLSelectElement
      await selectOption(user, bodyTypeSelect, 'other')

      const bodyTypeOtherInput = screen.getByTestId('body-type-other-input')
      expectElementToBeVisible(bodyTypeOtherInput)
      expect(bodyTypeOtherInput).toHaveAttribute('placeholder', 'その他の体質を入力してください')
    })
  })

  describe('フォーム送信', () => {
    it('必須フィールドのみで登録できる', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: '登録成功' }) as any)

      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'password123')
      await submitForm(user, form)

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          birthDate: undefined,
          gender: undefined,
          skinType: undefined,
          skinTypeOther: undefined,
          allergies: undefined,
          allergiesOther: undefined,
          bodyType: undefined,
          bodyTypeOther: undefined,
        }),
      })
    })

    it('全フィールドを入力して登録できる', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: '登録成功' }) as any)

      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const birthDateInput = screen.getByTestId('birth-date-input') as HTMLInputElement
      const genderSelect = screen.getByTestId('gender-select') as HTMLSelectElement
      const skinTypeSelect = screen.getByTestId('skin-type-select') as HTMLSelectElement
      const bodyTypeSelect = screen.getByTestId('body-type-select') as HTMLSelectElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'password123')
      await fillInput(user, birthDateInput, '1990-01-01')
      await selectOption(user, genderSelect, 'female')
      await selectOption(user, skinTypeSelect, 'dry')
      await selectOption(user, bodyTypeSelect, 'sensitive_skin')
      await submitForm(user, form)

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          birthDate: '1990-01-01',
          gender: 'female',
          skinType: 'dry',
          skinTypeOther: undefined,
          allergies: undefined,
          allergiesOther: undefined,
          bodyType: 'sensitive_skin',
          bodyTypeOther: undefined,
        }),
      })
    })

    it('登録成功時に完了ページにリダイレクトされる', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: '登録成功' }) as any)

      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'password123')
      await submitForm(user, form)

      await delay(300) // Wait for the timeout in the component

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/auth/registration-complete?email=test%40example.com'
      )
    })

    it('登録エラー時にエラーメッセージが表示される', async () => {
      const user = createUser()
      mockFetch.mockResolvedValueOnce(
        mockApiResponse.error('メールアドレスは既に使用されています') as any
      )

      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'existing@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'password123')
      await submitForm(user, form)

      await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument())

      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage).toHaveTextContent('メールアドレスは既に使用されています')
      expect(errorMessage).toHaveClass('bg-red-50', 'border', 'border-red-200', 'text-red-700')
    })

    it('ネットワークエラー時にエラーメッセージが表示される', async () => {
      const user = createUser()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'password123')
      await submitForm(user, form)

      await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument())

      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage).toHaveTextContent('ユーザー登録に失敗しました')
      expect(consoleSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('送信中はボタンが無効化され、ローディング状態になる', async () => {
      const user = createUser()
      let resolvePromise: (value: any) => void = () => {}
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockFetch.mockReturnValueOnce(pendingPromise as any)

      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const submitButton = screen.getByTestId('register-button')
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'password123')
      await submitForm(user, form)

      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('登録中...')

      resolvePromise(mockApiResponse.success({ message: 'Success' }))
      await waitFor(() => expect(submitButton).not.toBeDisabled())
      await waitFor(() => expect(submitButton).toHaveTextContent('会員登録'))
    })
  })

  describe('バリデーション', () => {
    it('パスワードが一致しない場合にエラーメッセージが表示される', async () => {
      const user = createUser()
      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, 'password123')
      await fillInput(user, confirmPasswordInput, 'differentpassword')
      await submitForm(user, form)

      await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument())

      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage).toHaveTextContent('パスワードが一致しません')
    })

    it('パスワードが短すぎる場合にエラーメッセージが表示される', async () => {
      const user = createUser()
      render(<RegisterPage />)

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement
      const form = screen.getByTestId('register-form') as HTMLFormElement

      await fillInput(user, usernameInput, 'testuser')
      await fillInput(user, emailInput, 'test@example.com')
      await fillInput(user, passwordInput, '123')
      await fillInput(user, confirmPasswordInput, '123')
      await submitForm(user, form)

      await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument())

      const errorMessage = screen.getByTestId('error-message')
      expect(errorMessage).toHaveTextContent('パスワードは8文字以上で入力してください')
    })

    it('空のフィールドでは送信できない', async () => {
      const user = createUser()
      render(<RegisterPage />)

      const form = screen.getByTestId('register-form') as HTMLFormElement
      await submitForm(user, form)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なdata-testid属性が設定されている', () => {
      render(<RegisterPage />)

      expect(screen.getByTestId('register-form')).toBeInTheDocument()
      expect(screen.getByTestId('username-input')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('birth-date-input')).toBeInTheDocument()
      expect(screen.getByTestId('gender-select')).toBeInTheDocument()
      expect(screen.getByTestId('skin-type-select')).toBeInTheDocument()
      expect(screen.getByTestId('allergies-select')).toBeInTheDocument()
      expect(screen.getByTestId('body-type-select')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument()
      expect(screen.getByTestId('register-button')).toBeInTheDocument()
    })

    it('入力フィールドに適切なlabelが関連付けられている', () => {
      render(<RegisterPage />)

      expect(screen.getByText('ユーザー名 *')).toBeInTheDocument()
      expect(screen.getByText('メールアドレス *')).toBeInTheDocument()
      expect(screen.getByText('生年月日')).toBeInTheDocument()
      expect(screen.getByText('性別')).toBeInTheDocument()
      expect(screen.getByText('肌質')).toBeInTheDocument()
      expect(screen.getByText('アレルギー（複数選択可）')).toBeInTheDocument()
      expect(screen.getByText('体質')).toBeInTheDocument()
      expect(screen.getByText('パスワード *')).toBeInTheDocument()
      expect(screen.getByText('パスワード確認 *')).toBeInTheDocument()
    })
  })
})
