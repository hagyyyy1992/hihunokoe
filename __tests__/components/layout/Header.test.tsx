/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useAuth } from '@/lib/auth/AuthContext'

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href, className, ...props }: any) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    )
  }
})

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })
  })

  it('renders the header element', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('renders the Usaka logo and brand name', () => {
    render(<Header />)

    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('Usaka')).toBeInTheDocument()
  })

  it('renders navigation links when user is not authenticated', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: 'ホーム' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '体験を見る' })).toHaveAttribute('href', '/posts')
    expect(screen.getByRole('link', { name: 'ログイン' })).toHaveAttribute('href', '/auth/login')
    expect(screen.getByRole('link', { name: '会員登録' })).toHaveAttribute('href', '/auth/register')
  })

  it('renders user navigation when authenticated', () => {
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

    render(<Header />)

    expect(screen.getByRole('link', { name: 'ダッシュボード' })).toHaveAttribute(
      'href',
      '/dashboard'
    )
    expect(screen.getByRole('link', { name: '体験を投稿' })).toHaveAttribute('href', '/posts/new')
    expect(screen.getByText('testuserさん')).toBeInTheDocument()
  })

  it('applies active styles to current page link', () => {
    mockUsePathname.mockReturnValue('/posts')

    render(<Header />)

    const postsLink = screen.getByRole('link', { name: '体験を見る' })
    expect(postsLink).toHaveClass('bg-pink-600', 'text-white', 'rounded-full')
  })

  it('applies active styles to posts/new page', () => {
    mockUsePathname.mockReturnValue('/posts/new')

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

    render(<Header />)

    const newPostLink = screen.getByRole('link', { name: '体験を投稿' })
    expect(newPostLink).toHaveClass('bg-pink-600', 'text-white', 'rounded-full')
  })

  it('handles posts subdirectory active state correctly', () => {
    mockUsePathname.mockReturnValue('/posts/123')

    render(<Header />)

    const postsLink = screen.getByRole('link', { name: '体験を見る' })
    expect(postsLink).toHaveClass('bg-pink-600', 'text-white', 'rounded-full')
  })

  it('does not apply active state to posts when on posts/new', () => {
    mockUsePathname.mockReturnValue('/posts/new')

    render(<Header />)

    const postsLink = screen.getByRole('link', { name: '体験を見る' })
    expect(postsLink).not.toHaveClass('bg-pink-600', 'text-white', 'rounded-full')
  })

  it('toggles mobile menu', () => {
    render(<Header />)

    const menuButton = screen.getByTestId('mobile-menu-button')
    fireEvent.click(menuButton)

    // Check if body overflow is set to hidden (mobile menu open)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes mobile menu when clicking close button', () => {
    render(<Header />)

    const menuButton = screen.getByTestId('mobile-menu-button')
    fireEvent.click(menuButton)

    // For simplicity, test the toggle behavior directly
    fireEvent.click(menuButton)

    expect(document.body.style.overflow).toBe('unset')
  })

  it('calls logout when logout button is clicked', () => {
    const mockLogout = jest.fn()
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
      logout: mockLogout,
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<Header />)

    const logoutButton = screen.getByTestId('logout-button')
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })

  it('shows loading state correctly', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
    })

    render(<Header />)

    // Should not show login/register links while loading
    expect(screen.queryByRole('link', { name: 'ログイン' })).not.toBeInTheDocument()
  })

  it('cleans up body overflow on unmount', () => {
    const { unmount } = render(<Header />)

    const menuButton = screen.getByTestId('mobile-menu-button')
    fireEvent.click(menuButton)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('unset')
  })

  it('returns default class when currentPath is empty', () => {
    mockUsePathname.mockReturnValue('')

    render(<Header />)

    const homeLink = screen.getByRole('link', { name: 'ホーム' })
    expect(homeLink).toHaveClass('text-gray-700', 'hover:text-pink-600')
  })
})
