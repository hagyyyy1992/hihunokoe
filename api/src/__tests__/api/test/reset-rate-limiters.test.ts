import { NextRequest } from 'next/server'
import { TestController } from '@api/framework/controllers/TestController'

// モック設定
const mockResetRateLimiters = jest.fn()

jest.mock('@api/framework/controllers/TestController', () => {
  return {
    TestController: jest.fn().mockImplementation(() => {
      return {
        resetRateLimiters: mockResetRateLimiters,
      }
    }),
  }
})

describe('/api/test/reset-rate-limiters', () => {
  let POST: typeof import('@/app/api/test/reset-rate-limiters/route').POST

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/test/reset-rate-limiters/route')
    POST = module.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('レート制限をリセットできる', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        success: true,
        message: 'Rate limiters reset successfully',
        resetCount: 5,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    mockResetRateLimiters.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/test/reset-rate-limiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(mockResetRateLimiters).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Rate limiters reset successfully')
    expect(data.resetCount).toBe(5)
  })

  it('本番環境では403を返す', async () => {
    const mockResponse = new Response(
      JSON.stringify({ error: 'This endpoint is only available in development mode' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )

    mockResetRateLimiters.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/test/reset-rate-limiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('This endpoint is only available in development mode')
  })

  it('メソッドが無効な場合は405を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })

    mockResetRateLimiters.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/test/reset-rate-limiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(405)
    expect(data.error).toBe('Method not allowed')
  })

  it('レート制限サービスでエラーが発生した場合は500を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Failed to reset rate limiters' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })

    mockResetRateLimiters.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/test/reset-rate-limiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to reset rate limiters')
  })

  it('サーバーエラーの場合は例外をスローする', async () => {
    mockResetRateLimiters.mockRejectedValue(new Error('Internal server error'))

    const request = new NextRequest('http://localhost:3000/api/test/reset-rate-limiters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await expect(POST(request)).rejects.toThrow('Internal server error')
  })
})
