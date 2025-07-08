import { POST } from '@/app/api/test/reset-rate-limiters/route'
import { resetAllRateLimiters } from '@/lib/rate-limiter'

// resetAllRateLimitersをモック化
jest.mock('@/lib/rate-limiter', () => ({
  resetAllRateLimiters: jest.fn(),
}))

const mockResetAllRateLimiters = resetAllRateLimiters as jest.MockedFunction<
  typeof resetAllRateLimiters
>

describe('/api/test/reset-rate-limiters', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    })
  })

  describe('POST', () => {
    it('development環境で正常にレート制限をリセットする', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'レート制限がリセットされました',
      })
      expect(mockResetAllRateLimiters).toHaveBeenCalledTimes(1)
    })

    it('test環境で正常にレート制限をリセットする', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true,
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'レート制限がリセットされました',
      })
      expect(mockResetAllRateLimiters).toHaveBeenCalledTimes(1)
    })

    it('production環境では403エラーを返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'このエンドポイントは本番環境では利用できません',
      })
      expect(mockResetAllRateLimiters).not.toHaveBeenCalled()
    })

    it('resetAllRateLimitersでエラーが発生した場合は500エラーを返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true,
      })
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      const testError = new Error('Reset failed')
      mockResetAllRateLimiters.mockImplementation(() => {
        throw testError
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'レート制限のリセットに失敗しました',
      })
      expect(consoleError).toHaveBeenCalledWith('Rate limiter reset error:', testError)
      expect(mockResetAllRateLimiters).toHaveBeenCalledTimes(1)

      consoleError.mockRestore()
    })
  })
})
