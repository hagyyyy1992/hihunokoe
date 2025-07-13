/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import AdminLoginPage from '@/app/admin/login/page'
import { AdminAuthProvider } from '@/lib/auth/AdminAuthContext'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    className,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    className?: string
    [key: string]: unknown
  }) => (
    <button onClick={onClick} disabled={disabled} type={type} className={className} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
}))

jest.mock('@/components/ui/Input', () => ({
  Input: ({
    id,
    type,
    value,
    onChange,
    required,
    disabled,
    ...props
  }: {
    id?: string
    type?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    required?: boolean
    disabled?: boolean
    [key: string]: unknown
  }) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({
    children,
    htmlFor,
    className,
  }: {
    children: React.ReactNode
    htmlFor?: string
    className?: string
  }) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}))

jest.mock('@/components/ui/Alert', () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-variant={variant}>{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock fetch
global.fetch = jest.fn()

describe('AdminLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>)
    ;(global.fetch as jest.Mock).mockClear()

    // Default mock for AdminAuthContext auth state check
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    })
  })

  it('renders the login form', () => {
    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    expect(screen.getByText('管理者ログイン')).toBeInTheDocument()
    expect(
      screen.getByText('管理画面にアクセスするには管理者アカウントでログインしてください')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('has empty default values for email and password', () => {
    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const emailInput = screen.getByLabelText('メールアドレス') as HTMLInputElement
    const passwordInput = screen.getByLabelText('パスワード') as HTMLInputElement

    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')
  })

  it('updates input values when typing', () => {
    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } })

    expect((emailInput as HTMLInputElement).value).toBe('test@example.com')
    expect((passwordInput as HTMLInputElement).value).toBe('newpassword')
  })

  it('handles successful login', async () => {
    // AdminAuthContext will call /api/admin/auth/me first to check current auth state
    const authMeResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    }

    // Login API response - must have success: true and user object
    const loginResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        user: { id: '1', adminName: 'test', email: 'admin@example.com', role: 'ADMIN' },
      }),
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(authMeResponse) // First call: /api/admin/auth/me
      .mockResolvedValueOnce(loginResponse) // Second call: /api/admin/auth/login

    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    // Fill in form fields first
    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'admin123' } })

    const form = screen.getByRole('button', { name: 'ログイン' }).closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123',
        }),
        credentials: 'include',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('handles login error', async () => {
    // AdminAuthContext will call /api/admin/auth/me first
    const authMeResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    }

    const loginResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Invalid credentials' }),
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(authMeResponse)
      .mockResolvedValueOnce(loginResponse)

    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const form = screen.getByRole('button', { name: 'ログイン' }).closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles network error', async () => {
    // AdminAuthContext will call /api/admin/auth/me first
    const authMeResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(authMeResponse)
      .mockRejectedValueOnce(new Error('Network error'))

    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const form = screen.getByRole('button', { name: 'ログイン' }).closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument()
    })
  })

  it('shows loading state during login', async () => {
    // AdminAuthContext will call /api/admin/auth/me first
    const authMeResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    }

    const loginResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ token: 'test-token' }),
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(authMeResponse)
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(loginResponse), 100))
      )

    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    const form = submitButton.closest('form')

    fireEvent.submit(form!)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    })

    // Should disable inputs during loading
    expect(screen.getByLabelText('メールアドレス')).toBeDisabled()
    expect(screen.getByLabelText('パスワード')).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('handles generic error when no specific error message', async () => {
    // AdminAuthContext will call /api/admin/auth/me first
    const authMeResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    }

    const loginResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(authMeResponse)
      .mockResolvedValueOnce(loginResponse)

    render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const form = screen.getByRole('button', { name: 'ログイン' }).closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument()
    })
  })

  it('applies correct CSS classes', () => {
    // Mock auth state check
    const authMeResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Not authenticated' }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(authMeResponse)

    const { container } = render(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>
    )

    const mainDiv = container.querySelector(
      '.min-h-screen.flex.items-center.justify-center.bg-gray-100'
    )
    expect(mainDiv).toBeInTheDocument()

    const card = container.querySelector('.w-full.max-w-md.bg-white.border-gray-300.shadow-xl')
    expect(card).toBeInTheDocument()
  })
})
