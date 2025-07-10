import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/profile/update/route'
import { ProfileController } from '@api/framework/controllers/ProfileController'
import { GetProfileUseCase } from '@api/usecases/profile/interactor'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

// モック設定
const mockUpdateProfile = jest.fn()
const mockAdaptCookieToBearer = jest.fn()

jest.mock('@api/framework/controllers/ProfileController', () => {
  return {
    ProfileController: jest.fn().mockImplementation(() => {
      return {
        updateProfile: mockUpdateProfile,
      }
    }),
  }
})

jest.mock('@api/usecases/profile/interactor', () => {
  return {
    GetProfileUseCase: jest.fn().mockImplementation(() => ({})),
  }
})

jest.mock('@api/interface-adapters/repositories/UserRepositoryImpl', () => {
  return {
    UserRepositoryImpl: jest.fn().mockImplementation(() => ({})),
  }
})

jest.mock('@/lib/auth/cookie-auth-adapter', () => {
  return {
    adaptCookieToBearer: mockAdaptCookieToBearer,
  }
})

describe('/api/profile/update', () => {
  let PUT: typeof import('@/app/api/profile/update/route').PUT

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/profile/update/route')
    PUT = module.PUT
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockAdaptCookieToBearer.mockImplementation(request => request as NextRequest)
  })

  it('プロフィールを更新できる', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        success: true,
        user: {
          id: 'user-id',
          email: 'test@example.com',
          userName: 'updateduser',
          skinType: 'dry',
          birthDate: '1990-01-01',
          gender: 'female',
          allergies: ['alcohol'],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    mockUpdateProfile.mockResolvedValue(mockResponse)

    const profileData = {
      userName: 'updateduser',
      skinType: 'dry',
      birthDate: '1990-01-01',
      gender: 'female',
      allergies: ['alcohol'],
    }

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(profileData),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(mockAdaptCookieToBearer).toHaveBeenCalledWith(request)
    expect(mockUpdateProfile).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.userName).toBe('updateduser')
  })

  it('認証されていない場合は401を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

    mockUpdateProfile.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName: 'test' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('無効なデータの場合は400を返す', async () => {
    const mockResponse = new Response(
      JSON.stringify({ error: 'ユーザー名は3文字以上で入力してください' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )

    mockUpdateProfile.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ userName: 'ab' }), // 2文字
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ユーザー名は3文字以上で入力してください')
  })

  it('ユーザー名が既に使用されている場合は409を返す', async () => {
    const mockResponse = new Response(
      JSON.stringify({ error: 'このユーザー名は既に使用されています' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    )

    mockUpdateProfile.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ userName: 'existinguser' }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('このユーザー名は既に使用されています')
  })

  it('サーバーエラーの場合は500を返す', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Database connection error'))

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ userName: 'test' }),
    })

    await expect(PUT(request)).rejects.toThrow('Database connection error')
  })
})
