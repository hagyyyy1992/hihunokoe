'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthUser } from '@/lib/auth/auth'

interface AuthContextType {
  user: AuthUser | null
  login: (
    email: string,
    password: string,
    acceptTerms?: boolean,
    acceptPrivacy?: boolean
  ) => Promise<{ requiresTermsAgreement?: boolean; redirectTo?: string } | void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  loading: boolean
}

interface RegisterData {
  userName: string
  email: string
  password: string
  skinType?: string
}

interface UpdateProfileData {
  userName: string
  skinType?: string | null
  birthDate?: string | null
  gender?: string | null
  allergies?: string[]
  allergiesOther?: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      // クッキーベースの認証を優先し、localStorageのトークンもサポート
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // localStorageにトークンがある場合はヘッダーに追加
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers,
        credentials: 'same-origin', // クッキーを送信
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Auth failed
        setUser(null)
        // localStorageにトークンがある場合は削除
        if (token) {
          localStorage.removeItem('token')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Network error or other issue
      setUser(null)
      if (token) {
        localStorage.removeItem('token')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
      })

      // レスポンスのJSONパースを試みる
      let data
      try {
        data = await response.json()
      } catch {
        // JSONパースに失敗した場合（ネットワークエラーなど）
        throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。')
      }

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました')
      }

      // 利用規約同意が必要な場合はリダイレクト情報を返す
      if (data.requiresTermsAgreement) {
        setUser(data.user)
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        return data // リダイレクト情報を含むレスポンスを返す
      }

      setUser(data.user)
      // GraphQL用にトークンをlocalStorageに保存
      if (data.token) {
        localStorage.setItem('token', data.token)
      } else {
        console.warn('No token in login response!') // デバッグログ追加
      }
    } catch (error) {
      // ネットワークエラーの場合
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (registerData: RegisterData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
        credentials: 'same-origin',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ユーザー登録に失敗しました')
      }

      // メール確認が完了するまでログイン状態にしない
      // setUser(data.user) をコメントアウト
      return data
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        })
      }
      setUser(null)
      // トークンも削除
      localStorage.removeItem('token')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshAuth = async () => {
    await checkAuth()
  }

  const updateProfile = async (profileData: UpdateProfileData) => {
    setLoading(true)
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('認証が必要です')
    }

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'same-origin',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの更新に失敗しました')
      }

      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, refreshAuth, updateProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
