/**
 * @jest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import HomePage from '@/app/home/page'
import { useAuth } from '@/lib/auth/AuthContext'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

jest.mock('lucide-react', () => ({
  User: () => <span>User</span>,
  FileText: () => <span>FileText</span>,
  Plus: () => <span>Plus</span>,
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

describe('HomePage', () => {
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
  })

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<HomePage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('does not redirect when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<HomePage />)

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders home page when user is authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      userName: 'testuser',
      email: 'test@example.com',
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ posts: [] }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<HomePage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/posts?limit=20')
    })
  })

  it('handles fetch error gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      userName: 'testuser',
      email: 'test@example.com',
    }

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<HomePage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })

  it('fetches posts when user is available', async () => {
    const mockUser = {
      id: 'user-123',
      userName: 'testuser',
      email: 'test@example.com',
    }

    const mockPosts = [
      {
        id: 'post-1',
        title: 'My Post',
        content: 'Content',
        cosmeticName: 'Product',
        publishedAt: '2023-01-01T00:00:00Z',
        user: { id: 'user-123', userName: 'testuser' },
        _count: { empathies: 5, comments: 2 },
      },
      {
        id: 'post-2',
        title: 'Other Post',
        content: 'Other Content',
        cosmeticName: 'Other Product',
        publishedAt: '2023-01-02T00:00:00Z',
        user: { id: 'user-456', userName: 'otheruser' },
        _count: { empathies: 3, comments: 1 },
      },
    ]

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ posts: mockPosts }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<HomePage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/posts?limit=20')
    })
  })
})
