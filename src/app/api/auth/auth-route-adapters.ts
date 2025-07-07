import { NextRequest, NextResponse } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

const authController = new AuthController()

/**
 * Adapter for login route - handles cookies and response format
 */
export async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await authController.login(request)
    const data = await response.json()

    // If login was successful, set the auth cookie
    if (data.success && data.token) {
      const newResponse = NextResponse.json({
        user: data.user,
        message: 'ログインしました',
      })

      newResponse.cookies.set('auth-token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

      return newResponse
    }

    // Map error messages to Japanese
    if (data.error) {
      let errorMessage = data.error
      if (errorMessage === 'Invalid email or password') {
        errorMessage = 'メールアドレスまたはパスワードが間違っています'
      } else if (errorMessage === 'Please verify your email before logging in') {
        return NextResponse.json(
          {
            error: 'メールアドレスの確認が完了していません。確認メールをご確認ください。',
            emailVerificationRequired: true,
            email: data.email,
          },
          { status: 403 }
        )
      } else if (errorMessage === 'Account is locked due to too many failed login attempts') {
        errorMessage = 'ログイン試行回数が多すぎるため、アカウントがロックされています'
      } else if (errorMessage === 'Account is inactive') {
        errorMessage = 'アカウントが無効になっています'
      } else if (errorMessage === 'Email and password are required') {
        errorMessage = 'メールアドレスとパスワードは必須です'
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
  }
}

/**
 * Adapter for register route - handles field mapping and response format
 */
export async function handleRegister(request: NextRequest): Promise<NextResponse> {
  try {
    // Map userName to username for clean architecture
    const body = await request.json()
    const mappedBody = {
      ...body,
      username: body.userName,
    }

    const mappedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(mappedBody),
    })

    const response = await authController.register(mappedRequest as NextRequest)
    const data = await response.json()

    // Map response format
    if (data.success) {
      return NextResponse.json(
        {
          user: {
            id: data.userId,
            userName: body.userName,
            email: body.email,
            birthDate: body.birthDate,
            gender: body.gender,
            skinType: body.skinType,
            skinTypeOther: body.skinTypeOther,
            allergies: body.allergies,
            allergiesOther: body.allergiesOther,
            emailVerified: false,
          },
          message: 'ユーザー登録が完了しました。確認メールをご確認ください。',
        },
        { status: 201 }
      )
    }

    // Map error messages
    if (data.error) {
      let errorMessage = data.error
      if (errorMessage === 'Email already exists') {
        errorMessage = 'ユーザー名またはメールアドレスが既に使用されています'
      } else if (errorMessage === 'Username already exists') {
        errorMessage = 'ユーザー名またはメールアドレスが既に使用されています'
      } else if (errorMessage === 'Email, username, and password are required') {
        errorMessage = '必要な項目を入力してください'
      } else if (errorMessage === 'Invalid email format') {
        errorMessage = '有効なメールアドレスを入力してください'
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'ユーザー登録に失敗しました' }, { status: 500 })
  }
}

/**
 * Adapter for logout route - handles cookie deletion
 */
export async function handleLogout(request: NextRequest): Promise<NextResponse> {
  try {
    const adaptedRequest = adaptCookieToBearer(request)
    const response = await authController.logout(adaptedRequest)
    const data = await response.json()

    if (data.success || response.status === 200) {
      const newResponse = NextResponse.json({
        message: 'ログアウトしました',
      })

      newResponse.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
      })

      return newResponse
    }

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Even on error, clear the cookie
    const response = NextResponse.json({ message: 'ログアウトしました' })
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
    return response
  }
}

/**
 * Adapter for getCurrentUser route - handles cookie auth
 */
export async function handleGetCurrentUser(request: NextRequest): Promise<NextResponse> {
  try {
    const adaptedRequest = adaptCookieToBearer(request)
    const response = await authController.getCurrentUser(adaptedRequest)
    const data = await response.json()

    if (data.success && data.user) {
      return NextResponse.json({ user: data.user })
    }

    // Map error messages
    if (data.error) {
      let errorMessage = data.error
      if (errorMessage === 'No authentication token provided') {
        errorMessage = '認証が必要です'
      } else if (errorMessage === 'Unauthorized') {
        errorMessage = 'トークンが無効です'
      } else if (errorMessage === 'User not found') {
        errorMessage = 'ユーザーが見つかりません'
      }

      // Check for email verification
      if (!data.user?.emailVerified) {
        errorMessage = 'メールアドレスの確認が必要です'
        return NextResponse.json({ error: errorMessage }, { status: 403 })
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return response
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'ユーザー情報の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * Adapter for deleteAccount route - handles cookie auth and deletion
 */
export async function handleDeleteAccount(request: NextRequest): Promise<NextResponse> {
  try {
    const adaptedRequest = adaptCookieToBearer(request)
    const response = await authController.deleteAccount(adaptedRequest)
    const data = await response.json()

    if (data.success) {
      const newResponse = NextResponse.json({
        message: 'アカウントが正常に削除されました',
      })

      newResponse.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
      })

      return newResponse
    }

    // Map error messages
    if (data.error) {
      let errorMessage = data.error
      if (errorMessage === 'No authentication token provided') {
        errorMessage = 'ログインが必要です'
      } else if (errorMessage === 'Unauthorized') {
        errorMessage = '無効なトークンです'
      } else if (errorMessage === 'Invalid password') {
        errorMessage = 'パスワードが正しくありません'
      } else if (errorMessage === 'Password is required') {
        errorMessage = 'パスワードの確認が必要です'
      } else if (errorMessage === 'User not found') {
        errorMessage = 'ユーザーが見つかりません'
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return response
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'アカウント削除に失敗しました' }, { status: 500 })
  }
}

/**
 * Adapter for verifyEmail route - handles GET to POST conversion
 */
export async function handleVerifyEmail(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'トークンが提供されていません' }, { status: 400 })
    }

    // Create a POST request with token in body
    const adaptedRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ token }),
    })

    const response = await authController.verifyEmail(adaptedRequest as NextRequest)
    const data = await response.json()

    if (data.success) {
      // Get user details and generate auth token
      // Note: The clean architecture doesn't return user details or set cookies on email verification
      // This would need to be implemented in the use case if needed
      return NextResponse.json({
        message: data.message || 'メールアドレスの確認が完了しました',
      })
    }

    // Map error messages
    if (data.error) {
      let errorMessage = data.error
      if (errorMessage === 'Token is required') {
        errorMessage = 'トークンが提供されていません'
      } else if (errorMessage === 'Invalid or expired verification token') {
        errorMessage = '無効または期限切れのトークンです'
      } else if (errorMessage === 'Invalid request') {
        errorMessage = '無効なリクエストです'
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return response
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'メールアドレスの確認に失敗しました' }, { status: 500 })
  }
}
