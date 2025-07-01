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

describe('EmpathyButton Component', () => {
  const defaultProps = {
    postId: 'test-post-1',
    initialCount: 5,
    initialHasEmpathized: false,
  }

  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    const setup = setupComponentTest()
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
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

    // Mock the fetch response properly with all required Response properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({
        success: true,
        empathy: { empathyType: 'helpful' },
        totalCount: 6,
      }),
      text: jest.fn().mockResolvedValue(''),
      blob: jest.fn(),
      arrayBuffer: jest.fn(),
      formData: jest.fn(),
      headers: new Headers(),
      url: '/api/posts/empathy?id=test-post-1',
      redirected: false,
      type: 'basic',
      clone: jest.fn(),
      body: null,
      bodyUsed: false,
    } as unknown as Response)

    render(<EmpathyButton {...defaultProps} />)

    const button = screen.getByTestId('empathy-button')
    await user.click(button)

    // Wait for the API call to be made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Verify the correct API endpoint was called
    expect(mockFetch).toHaveBeenCalledWith('/api/posts/empathy?id=test-post-1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        empathyType: 'helpful',
      }),
    })
  })

  it('共感済み状態でもクリック可能である', async () => {
    const user = userEvent.setup()

    // Mock the fetch response properly with all required Response properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({
        success: true,
        totalCount: 4,
      }),
      text: jest.fn().mockResolvedValue(''),
      blob: jest.fn(),
      arrayBuffer: jest.fn(),
      formData: jest.fn(),
      headers: new Headers(),
      url: '/api/posts/empathy?id=test-post-1',
      redirected: false,
      type: 'basic',
      clone: jest.fn(),
      body: null,
      bodyUsed: false,
    } as unknown as Response)

    render(<EmpathyButton {...defaultProps} initialHasEmpathized={true} initialCount={5} />)

    const button = screen.getByTestId('empathy-button')
    await user.click(button)

    // Wait for the API call to be made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Verify the correct API endpoint was called
    expect(mockFetch).toHaveBeenCalledWith('/api/posts/empathy?id=test-post-1', {
      method: 'DELETE',
    })
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
