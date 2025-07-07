import { NextRequest, NextResponse } from 'next/server'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { EmailServiceImpl } from '@api/interface-adapters/services/EmailServiceImpl'
import { RateLimitServiceImpl } from '@api/interface-adapters/services/RateLimitServiceImpl'

export class TestController {
  private userRepository: UserRepositoryImpl
  private postRepository: PostRepositoryImpl
  private empathyRepository: EmpathyRepositoryImpl
  private emailService: EmailServiceImpl
  private rateLimitService: RateLimitServiceImpl

  constructor() {
    this.userRepository = new UserRepositoryImpl()
    this.postRepository = new PostRepositoryImpl()
    this.empathyRepository = new EmpathyRepositoryImpl()
    this.emailService = new EmailServiceImpl()
    this.rateLimitService = new RateLimitServiceImpl()
  }

  private checkTestEnvironment(): NextResponse | null {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'このエンドポイントは本番環境では利用できません' },
        { status: 403 }
      )
    }
    return null
  }

  async cleanupUser(request: NextRequest): Promise<NextResponse> {
    const envCheck = this.checkTestEnvironment()
    if (envCheck) return envCheck

    try {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      // Find and delete user
      const user = await this.userRepository.findByEmail(email)
      if (user) {
        await this.userRepository.delete(user.id)
      }

      return NextResponse.json({
        success: true,
        message: 'User cleanup completed',
      })
    } catch (error) {
      console.error('Cleanup user error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }
  }

  async resetRateLimiters(request: NextRequest): Promise<NextResponse> {
    const envCheck = this.checkTestEnvironment()
    if (envCheck) return envCheck

    try {
      // Reset all rate limiters
      this.rateLimitService.clearRateLimits()

      return NextResponse.json({
        success: true,
        message: 'Rate limiters reset successfully',
      })
    } catch (error) {
      console.error('Reset rate limiters error:', error)
      return NextResponse.json({ error: 'Rate limiter reset failed' }, { status: 500 })
    }
  }

  async sendTestEmail(request: NextRequest): Promise<NextResponse> {
    const envCheck = this.checkTestEnvironment()
    if (envCheck) return envCheck

    try {
      const body = await request.json()
      const { to } = body

      if (!to) {
        return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(to)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Send test email
      await this.emailService.sendWelcomeEmail(to, 'Test User')

      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
      })
    } catch (error) {
      console.error('Send test email error:', error)
      return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
    }
  }
}
