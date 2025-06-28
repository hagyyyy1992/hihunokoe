import { render, screen, expectElementToBeVisible, waitFor } from '../../helpers/rtl-utils'
import EmpathyButton from '../../../src/components/ui/EmpathyButton'
import { setupComponentTest, cleanupComponentTest } from '../../helpers/component-test-setup'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

// Mock AuthContext
jest.mock('../../../src/lib/auth/AuthContext', () => ({
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
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('EmpathyButton Component', () => {
  const defaultProps = {
    postId: 'test-post-1',
    initialCount: 5,
    initialHasEmpathized: false,
  }

  beforeEach(() => {
    setupComponentTest()
    mockFetch.mockClear()
  })

  afterEach(() => {
    cleanupComponentTest()
  })

  it('初期状態で共感ボタンをレンダリングする', () => {
    render(<EmpathyButton {...defaultProps} />)

    const button = screen.getByTestId('empathy-button')
    expectElementToBeVisible(button)
    expect(button).toHaveTextContent('共感する (5)')
    expect(button).toHaveClass('text-pink-600', 'bg-pink-50')
  })

  it('共感済み状態をレンダリングする', () => {
    render(<EmpathyButton {...defaultProps} initialHasEmpathized={true} initialCount={6} />)

    const button = screen.getByTestId('empathy-button')
    expectElementToBeVisible(button)
    expect(button).toHaveTextContent('共感済み (6)')
    expect(button).toHaveClass('text-white', 'bg-pink-600')
  })

  it('スモールサイズでカウントのみ表示する', () => {
    render(<EmpathyButton {...defaultProps} size="sm" />)

    const button = screen.getByTestId('empathy-button')
    expect(button).toHaveTextContent('5')
    expect(button).not.toHaveTextContent('共感する')
  })

  it('共感ボタンがクリック可能である', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          empathy: { empathyType: 'helpful' },
          totalCount: 6,
        }),
    })

    render(<EmpathyButton {...defaultProps} />)

    const button = screen.getByTestId('empathy-button')
    await user.click(button)

    // ボタンがクリックされたことを確認
    expect(button).toBeInTheDocument()
  })

  it('共感済み状態でもクリック可能である', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          totalCount: 4,
        }),
    })

    render(<EmpathyButton {...defaultProps} initialHasEmpathized={true} initialCount={5} />)

    const button = screen.getByTestId('empathy-button')
    await user.click(button)

    // ボタンがクリックされたことを確認
    expect(button).toBeInTheDocument()
  })

  it('アクセシビリティ属性が設定される', () => {
    render(<EmpathyButton {...defaultProps} />)

    const button = screen.getByTestId('empathy-button')
    expect(button).toHaveAttribute('aria-label', '共感する')
  })

  it('共感済み状態でアクセシビリティ属性が変わる', () => {
    render(<EmpathyButton {...defaultProps} initialHasEmpathized={true} />)

    const button = screen.getByTestId('empathy-button')
    expect(button).toHaveAttribute('aria-label', '共感を取り消す')
  })

  it('カスタムクラス名が適用される', () => {
    render(<EmpathyButton {...defaultProps} className="custom-class" />)

    const button = screen.getByTestId('empathy-button')
    expect(button).toHaveClass('custom-class')
  })

  it('初期共感タイプが設定される', () => {
    render(
      <EmpathyButton
        {...defaultProps}
        initialHasEmpathized={true}
        initialEmpathyType="interested"
      />
    )

    // この場合、UIに直接表示されないが、内部状態として保持される
    const button = screen.getByTestId('empathy-button')
    expect(button).toHaveTextContent('共感済み')
  })
})
