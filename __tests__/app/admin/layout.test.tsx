/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import AdminLayout from '@/app/admin/layout'
// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('lucide-react', () => ({
  Users: () => <span>Users</span>,
  FileText: () => <span>FileText</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  Settings: () => <span>Settings</span>,
  BarChart3: () => <span>BarChart3</span>,
  Shield: () => <span>Shield</span>,
  LogOut: () => <span>LogOut</span>,
  Menu: () => <span>Menu</span>,
  X: () => <span>X</span>,
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, className }: any) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    )
  }
})

const mockPush = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    })
    mockUsePathname.mockReturnValue('/admin/dashboard')

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'auth-token=valid-token',
    })
  })

  it('renders login page directly when pathname is /admin/login', () => {
    mockUsePathname.mockReturnValue('/admin/login')

    render(
      <AdminLayout>
        <div data-testid="login-content">Login Content</div>
      </AdminLayout>
    )

    expect(screen.getByTestId('login-content')).toBeInTheDocument()
  })

  it('shows loading state initially', async () => {
    // Mock API call that takes time to resolve
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ user: { id: '1', userName: 'admin', role: 'ADMIN' } }),
              } as Response),
            100
          )
        )
    )

    render(
      <AdminLayout>
        <div data-testid="admin-content">Admin Content</div>
      </AdminLayout>
    )

    // Should show loading state initially
    expect(screen.getByText('認証中...')).toBeInTheDocument()
  })

  it('redirects to login when no token is present', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    expect(mockPush).toHaveBeenCalledWith('/admin/login')
  })

  it('redirects to login when token is invalid', async () => {
    // Mock API call returning 401 error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login')
    })
  })

  it('redirects to login when user is not admin', async () => {
    // Mock API call returning non-admin user
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'user',
          email: 'user@example.com',
          role: 'USER',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login')
    })
  })

  it('renders admin layout for valid admin user', async () => {
    // Mock successful API call with admin user
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div data-testid="admin-content">Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(screen.getByText('管理画面')).toBeInTheDocument()
    })
  })

  it('renders navigation items', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(screen.getAllByText('ダッシュボード')).toHaveLength(2) // nav link + header
      expect(screen.getByText('ユーザー管理')).toBeInTheDocument()
      expect(screen.getByText('投稿管理')).toBeInTheDocument()
      expect(screen.getByText('通報管理')).toBeInTheDocument()
      expect(screen.getByText('設定')).toBeInTheDocument()
    })
  })

  it('shows user info and logout button', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('管理者')).toBeInTheDocument()
      expect(screen.getByText('ログアウト')).toBeInTheDocument()
    })
  })

  it('shows super admin role correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'superadmin',
          email: 'superadmin@example.com',
          role: 'SUPER_ADMIN',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(screen.getByText('スーパー管理者')).toBeInTheDocument()
    })
  })

  it('handles logout correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      const logoutButton = screen.getByText('ログアウト')
      fireEvent.click(logoutButton)
    })

    expect(mockPush).toHaveBeenCalledWith('/admin/login')
  })

  it('toggles sidebar on mobile', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          userName: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }),
    } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      const menuButton = screen
        .getAllByRole('button')
        .find(btn => btn.textContent?.includes('Menu'))
      if (menuButton) {
        fireEvent.click(menuButton)
      }
    })

    // Should show overlay when sidebar is open
    await waitFor(() => {
      const overlay = document.querySelector('.bg-black.bg-opacity-50')
      expect(overlay).toBeInTheDocument()
    })
  })
})
