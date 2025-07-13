import { NextRequest, NextResponse } from 'next/server'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { EmailServiceImpl } from '@api/interface-adapters/services/EmailServiceImpl'
import { RateLimitServiceImpl } from '@api/interface-adapters/services/RateLimitServiceImpl'

export class TestController {
  private userRepository: UserRepository
  private emailService: EmailServiceImpl
  private rateLimitService: RateLimitServiceImpl

  constructor() {
    this.userRepository = new UserRepository()
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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(to)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

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

  async verifyUserEmail(request: NextRequest): Promise<NextResponse> {
    const envCheck = this.checkTestEnvironment()
    if (envCheck) return envCheck

    try {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await this.userRepository.update(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
      })

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
      })
    } catch (error) {
      console.error('Verify user email error:', error)
      return NextResponse.json({ error: 'Email verification failed' }, { status: 500 })
    }
  }

  async getVerificationToken(request: NextRequest): Promise<NextResponse> {
    const envCheck = this.checkTestEnvironment()
    if (envCheck) return envCheck

    try {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (!user.emailVerificationToken) {
        return NextResponse.json({ error: 'No verification token found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        token: user.emailVerificationToken,
      })
    } catch (error) {
      console.error('Get verification token error:', error)
      return NextResponse.json({ error: 'Failed to get verification token' }, { status: 500 })
    }
  }
}
