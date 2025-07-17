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

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    ...props
  }: {
    children: React.ReactNode
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    className?: string
    [key: string]: unknown
  }) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({
    children,
    className,
    name,
  }: {
    children?: React.ReactNode
    className?: string
    name?: string
    [key: string]: unknown
  }) => (
    <div className={className}>
      {children || (name && typeof name === 'string' ? name.charAt(0).toUpperCase() : '')}
    </div>
  ),
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
  ClipboardList: () => <span>ClipboardList</span>,
  MessageSquare: () => <span>MessageSquare</span>,
}))

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode
    href: string
    onClick?: React.MouseEventHandler<HTMLAnchorElement>
    className?: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    )
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

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

  it('shows loading state initially', () => {
    // Mock fetch to never resolve to simulate loading
    mockFetch.mockImplementation(() => ({ ok: true, json: async () => ({ success: true }) }))

    render(
      <AdminLayout>
        <div data-testid="admin-content">Admin Content</div>
      </AdminLayout>
    )

    // Should show loading state
    expect(screen.getByText('認証中...')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('redirects to login when auth API returns 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
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

  it('redirects to login when auth API returns 403', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
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

  it('redirects to login when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

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
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            id: '1',
            adminName: 'admin',
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
      expect(screen.getByText('ひふのこえ管理画面')).toBeInTheDocument()
    })
  })

  it('renders navigation items', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            id: '1',
            adminName: 'admin',
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
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
      expect(screen.getByText('ユーザー管理')).toBeInTheDocument()
      expect(screen.getByText('投稿管理')).toBeInTheDocument()
      expect(screen.getByText('通報管理')).toBeInTheDocument()
      expect(screen.getByText('お問い合わせ')).toBeInTheDocument()
      expect(screen.getByText('設定')).toBeInTheDocument()
    })
  })

  it('shows user info and logout button', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            id: '1',
            adminName: 'admin',
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
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            id: '1',
            adminName: 'superadmin',
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
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              id: '1',
              adminName: 'admin',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'ログアウトしました' }),
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
      json: () =>
        Promise.resolve({
          success: true,
          user: {
            id: '1',
            adminName: 'admin',
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

  it('shows unread inquiries badge', async () => {
    // Mock auth API
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              id: '1',
              adminName: 'admin',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          }),
      } as Response)
      // Mock unread count API
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            unreadCount: 5,
          }),
      } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      const badge = screen.getByText('5')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-500')
    })
  })

  it('does not show badge when no unread inquiries', async () => {
    // Mock auth API
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            user: {
              id: '1',
              adminName: 'admin',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          }),
      } as Response)
      // Mock unread count API
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            unreadCount: 0,
          }),
      } as Response)

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    )

    await waitFor(() => {
      expect(screen.getByText('お問い合わせ')).toBeInTheDocument()
    })

    // バッジが表示されていないことを確認
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
