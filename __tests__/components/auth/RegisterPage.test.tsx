import { render, screen, expectElementToBeVisible } from '../../helpers/rtl-utils'
import { fireEvent } from '@testing-library/react'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'
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

  // 🚀 軽量な表示テスト（高速）
  describe('レンダリング確認', () => {
    it('ページの基本要素が正しく表示される', () => {
      render(<RegisterPage />)

      // 基本要素の確認
      expectElementToBeVisible(screen.getByRole('heading', { name: '会員登録' }))
      expectElementToBeVisible(screen.getByTestId('register-form'))
      expectElementToBeVisible(screen.getByTestId('username-input'))
      expectElementToBeVisible(screen.getByTestId('email-input'))
      expectElementToBeVisible(screen.getByTestId('password-input'))
      expectElementToBeVisible(screen.getByTestId('confirm-password-input'))
      expectElementToBeVisible(screen.getByTestId('register-button'))

      // ロゴとリンクの確認
      const logo = screen.getByText('H')
      expectElementToBeVisible(logo)
      expect(logo.closest('div')).toHaveClass('w-12', 'h-12', 'bg-apple-100', 'rounded-full')

      const loginLink = screen.getByText('ログイン')
      expectElementToBeVisible(loginLink)
      expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('フィールド設定確認', () => {
    it('全ての入力フィールドが正しく設定されている', () => {
      render(<RegisterPage />)

      // 必須フィールドの属性確認
      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement

      // Required属性の確認
      expect(usernameInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
      expect(confirmPasswordInput).toHaveAttribute('required')

      // タイプとプレースホルダーの確認
      expect(usernameInput).toHaveAttribute('type', 'text')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      // オプションフィールドの確認
      const birthDateInput = screen.getByTestId('birth-date-input') as HTMLInputElement
      expect(birthDateInput).toHaveAttribute('type', 'date')
      expect(birthDateInput).not.toHaveAttribute('required')

      // select要素の確認
      expect(screen.getByTestId('gender-select')).toBeInTheDocument()
      expect(screen.getByTestId('skin-type-select')).toBeInTheDocument()
      expect(screen.getByTestId('allergies-select')).toBeInTheDocument()
    })

    it('select optionsが正しく表示される', () => {
      render(<RegisterPage />)

      // 性別オプション
      expect(screen.getByText('男性')).toBeInTheDocument()
      expect(screen.getByText('女性')).toBeInTheDocument()

      // 肌質オプション
      expect(screen.getByText('普通肌')).toBeInTheDocument()
      expect(screen.getByText('乾燥肌')).toBeInTheDocument()

      // アレルギーオプション
      expect(screen.getByText('香料')).toBeInTheDocument()
      expect(screen.getByText('アルコール')).toBeInTheDocument()
    })
  })

  // ⚡ 最小限のインタラクションテスト（1つだけ）
  describe('基本フォーム機能', () => {
    it('フォーム入力と送信が動作する', async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: '登録成功' }) as any)

      render(<RegisterPage />)

      // 必須フィールドに入力
      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      // フォーム送信
      fireEvent.submit(screen.getByTestId('register-form'))

      // API呼び出しを確認
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          birthDate: '2000-01-01',
          gender: undefined,
          skinType: undefined,
          skinTypeOther: undefined,
          allergies: undefined,
          allergiesOther: undefined,
        }),
      })
    })

    it('バリデーションエラーが表示される', async () => {
      render(<RegisterPage />)

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement

      // パスワード不一致
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } })
      fireEvent.submit(screen.getByTestId('register-form'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('パスワードが一致しません')
      })
    })

    it('短いパスワードでバリデーションエラーが表示される', async () => {
      render(<RegisterPage />)

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
      const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement

      // 短いパスワード
      fireEvent.change(passwordInput, { target: { value: 'short' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'short' } })
      fireEvent.submit(screen.getByTestId('register-form'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'パスワードは8文字以上で入力してください'
        )
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('API エラー時にエラーメッセージが表示される', async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse.error('登録に失敗しました', 400) as any)

      render(<RegisterPage />)

      // 有効なフォームデータを入力
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'password123' },
      })

      fireEvent.submit(screen.getByTestId('register-form'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('登録に失敗しました')
      })
    })

    it('ネットワークエラー時にエラーメッセージが表示される', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<RegisterPage />)

      // 有効なフォームデータを入力
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'password123' },
      })

      fireEvent.submit(screen.getByTestId('register-form'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'サーバーへの接続に失敗しました。しばらく待ってから再度お試しください。'
        )
      })
    })
  })

  describe('リダイレクト機能', () => {
    it('登録成功時に正しくリダイレクトされる', async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse.success({ message: '登録成功' }) as any)

      render(<RegisterPage />)

      // 有効なフォームデータを入力
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'password123' },
      })

      fireEvent.submit(screen.getByTestId('register-form'))

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/auth/registration-complete?email=test%40example.com'
        )
      })
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なdata-testid属性とlabelが設定されている', () => {
      render(<RegisterPage />)

      // data-testid属性の確認
      expect(screen.getByTestId('register-form')).toBeInTheDocument()
      expect(screen.getByTestId('username-input')).toBeInTheDocument()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('register-button')).toBeInTheDocument()

      // label関連付けの確認
      expect(screen.getByText('ユーザー名 *')).toBeInTheDocument()
      expect(screen.getByText('メールアドレス *')).toBeInTheDocument()
      expect(screen.getByText('パスワード')).toBeInTheDocument()
      expect(screen.getByText('パスワード確認')).toBeInTheDocument()
    })
  })
})
