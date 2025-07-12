import React, { useState } from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext'
import { UserRole } from '@prisma/client'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock console methods
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

// Test component that uses useAuth
function TestComponent() {
  const { user, login, register, logout, refreshAuth, updateProfile, loading } = useAuth()

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? `User: ${user.userName} (${user.email})` : 'No User'}</div>
      <button data-testid="login-btn" onClick={() => login('test@example.com', 'password123')}>
        Login
      </button>
      <button
        data-testid="register-btn"
        onClick={() =>
          register({
            userName: 'testuser',
            email: 'test@example.com',
            password: 'password123',
          })
        }
      >
        Register
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
      <button data-testid="refresh-btn" onClick={() => refreshAuth()}>
        Refresh
      </button>
      <button
        data-testid="update-profile-btn"
        onClick={() =>
          updateProfile({
            userName: 'updateduser',
            skinType: 'NORMAL',
          })
        }
      >
        Update Profile
      </button>
    </div>
  )
}

// Component to test useAuth outside of provider
function TestComponentOutsideProvider() {
  const auth = useAuth()
  return <div>{auth.user?.userName}</div>
}

// Component to test async error handling
function TestComponentWithErrorHandler() {
  const { login, register, updateProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password123')
    } catch (error) {
      setError((error as Error).message)
    }
  }

  const handleRegister = async () => {
    try {
      await register({
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })
    } catch (error) {
      setError((error as Error).message)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        userName: 'updateduser',
        skinType: 'NORMAL',
      })
    } catch (error) {
      setError((error as Error).message)
    }
  }

  return (
    <div>
      <button data-testid="login-btn" onClick={handleLogin}>
        Login
      </button>
      <button data-testid="register-btn" onClick={handleRegister}>
        Register
      </button>
      <button data-testid="update-profile-btn" onClick={handleUpdateProfile}>
        Update Profile
      </button>
      {error && <div data-testid="error">{error}</div>}
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterAll(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('AuthProvider', () => {
    it('should initialize with loading state and check auth on mount', async () => {
      const mockUser = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')

      // Wait for auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('User: testuser (test@example.com)')
      expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      })
    })

    it('should include Authorization header when token exists in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token')
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      expect(fetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer stored-token',
        },
        credentials: 'same-origin',
      })
    })

    it('should handle auth check failure and remove token', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token')
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('No User')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })

    it('should handle network error during auth check', async () => {
      localStorageMock.getItem.mockReturnValue('token')
      const networkError = new Error('Network error')
      ;(fetch as jest.Mock).mockRejectedValueOnce(networkError)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('No User')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('login function', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      // Initial auth check (no user)
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'login-token',
        }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        credentials: 'same-origin',
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'login-token')
      expect(screen.getByTestId('user')).toHaveTextContent('User: testuser (test@example.com)')
    })

    it('should handle login with terms agreement required', async () => {
      const mockUser = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request with terms agreement required
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'login-token',
          requiresTermsAgreement: true,
          redirectTo: '/auth/terms-agreement',
        }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'login-token')
      expect(screen.getByTestId('user')).toHaveTextContent('User: testuser (test@example.com)')
    })

    it('should handle login without token', async () => {
      const mockUser = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request without token
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          // No token provided
        }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith('No token in login response!')
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('should handle login API error', async () => {
      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request with error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid credentials',
        }),
      })

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
    })

    it('should handle JSON parse error during login', async () => {
      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request with JSON parse error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('JSON parse error')
        },
      })

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent(
        'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      )
    })

    it('should handle network error during login', async () => {
      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request with network error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'))

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent(
        'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      )
    })

    it('should handle other errors during login', async () => {
      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Login request with other error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Other error'))

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Other error')
    })
  })

  describe('register function', () => {
    it('should handle successful registration', async () => {
      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Register request
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Registration successful',
        }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('register-btn'))
      })

      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
        credentials: 'same-origin',
      })
    })

    it('should handle registration API error', async () => {
      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Register request with error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Email already exists',
        }),
      })

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('register-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Email already exists')
    })
  })

  describe('logout function', () => {
    it('should handle successful logout with token', async () => {
      localStorageMock.getItem.mockReturnValue('logout-token')

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Logout request
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'))
      })

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer logout-token',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    it('should handle logout without token', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'))
      })

      // Should not make API call when no token
      expect(fetch).toHaveBeenCalledTimes(1) // Only initial auth check

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    it('should handle logout API error', async () => {
      localStorageMock.getItem.mockReturnValue('logout-token')

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Logout request with error
      const logoutError = new Error('Logout failed')
      ;(fetch as jest.Mock).mockRejectedValueOnce(logoutError)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'))
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })
  })

  describe('refreshAuth function', () => {
    it('should call checkAuth when refreshAuth is called', async () => {
      const mockUser = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Refresh auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('refresh-btn'))
      })

      expect(screen.getByTestId('user')).toHaveTextContent('User: testuser (test@example.com)')
    })
  })

  describe('updateProfile function', () => {
    it('should handle successful profile update', async () => {
      const updatedUser = {
        id: 'user-1',
        userName: 'updateduser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      localStorageMock.getItem.mockReturnValue('profile-token')

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Update profile request
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: updatedUser,
        }),
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      await act(async () => {
        await userEvent.click(screen.getByTestId('update-profile-btn'))
      })

      expect(fetch).toHaveBeenCalledWith('/api/profile/update', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer profile-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: 'updateduser',
          skinType: 'NORMAL',
        }),
        credentials: 'same-origin',
      })

      expect(screen.getByTestId('user')).toHaveTextContent('User: updateduser (test@example.com)')
    })

    it('should handle update profile without token', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('update-profile-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('認証が必要です')
    })

    it('should handle update profile API error', async () => {
      localStorageMock.getItem.mockReturnValue('profile-token')

      // Initial auth check
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      // Update profile request with error
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Profile update failed',
        }),
      })

      render(
        <AuthProvider>
          <TestComponentWithErrorHandler />
        </AuthProvider>
      )

      await act(async () => {
        await userEvent.click(screen.getByTestId('update-profile-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('Profile update failed')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress expected error in console
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})
