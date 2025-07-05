'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthUser } from '@/lib/auth/auth'

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
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
  allergies?: string[] | null
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
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Auth failed - explicitly set user to null
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Network error or other issue - set user to null
      setUser(null)
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
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました')
      }

      setUser(data.user)
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
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshAuth = async () => {
    await checkAuth()
  }

  const updateProfile = async (profileData: UpdateProfileData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
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
