import { AdminAuthenticationInputPort } from './input-port'
import { AdminAuthenticationOutputPort } from './output-port'
import { AdminUserRepository } from '@api/domain/repositories/AdminUserRepository'
import { IPasswordHashService } from '@api/domain/services/PasswordHashService'
import { ITokenService } from '@api/domain/services/TokenService'

export class AdminAuthenticationInteractor implements AdminAuthenticationInputPort {
  constructor(
    private adminUserRepository: AdminUserRepository,
    private passwordHashService: IPasswordHashService,
    private tokenService: ITokenService,
    private outputPort: AdminAuthenticationOutputPort
  ) {}

  async login(email: string, password: string): Promise<void> {
    try {
      const adminUser = await this.adminUserRepository.findByEmail(email)

      if (!adminUser) {
        return this.outputPort.presentError({
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        })
      }

      if (!adminUser.isActive) {
        return this.outputPort.presentError({
          code: 'ACCOUNT_INACTIVE',
          message: 'アカウントが無効化されています',
        })
      }

      if (adminUser.lockedUntil && new Date() < adminUser.lockedUntil) {
        const lockMinutes = Math.ceil(
          (adminUser.lockedUntil.getTime() - new Date().getTime()) / 1000 / 60
        )
        return this.outputPort.presentError({
          code: 'ACCOUNT_LOCKED',
          message: `アカウントがロックされています。${lockMinutes}分後に再試行してください`,
        })
      }

      const isValidPassword = await this.passwordHashService.compare(
        password,
        adminUser.passwordHash
      )

      if (!isValidPassword) {
        await this.adminUserRepository.incrementFailedLoginAttempts(adminUser.id)

        const MAX_FAILED_ATTEMPTS = 5
        if (adminUser.failedLoginAttempts + 1 >= MAX_FAILED_ATTEMPTS) {
          const lockUntil = new Date()
          lockUntil.setMinutes(lockUntil.getMinutes() + 30)
          await this.adminUserRepository.lockAccount(adminUser.id, lockUntil)

          return this.outputPort.presentError({
            code: 'ACCOUNT_LOCKED',
            message: 'ログイン試行回数が上限に達しました。アカウントがロックされました',
          })
        }

        return this.outputPort.presentError({
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        })
      }

      await this.adminUserRepository.resetFailedLoginAttempts(adminUser.id)
      await this.adminUserRepository.incrementLoginCount(adminUser.id)

      const token = await this.tokenService.generateToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        userName: adminUser.adminName,
      })

      return this.outputPort.presentSuccess({
        adminUser: {
          id: adminUser.id,
          adminName: adminUser.adminName,
          email: adminUser.email,
          role: adminUser.role,
        },
        token,
      })
    } catch (error) {
      console.error('Admin login error:', error)
      return this.outputPort.presentError({
        code: 'INTERNAL_ERROR',
        message: '認証処理中にエラーが発生しました',
      })
    }
  }

  async verifyToken(token: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyToken(token)

      const adminUser = await this.adminUserRepository.findById(payload.userId)

      if (!adminUser) {
        return this.outputPort.presentError({
          code: 'USER_NOT_FOUND',
          message: '管理者が見つかりません',
        })
      }

      if (!adminUser.isActive) {
        return this.outputPort.presentError({
          code: 'ACCOUNT_INACTIVE',
          message: 'アカウントが無効化されています',
        })
      }

      return this.outputPort.presentSuccess({
        adminUser: {
          id: adminUser.id,
          adminName: adminUser.adminName,
          email: adminUser.email,
          role: adminUser.role,
        },
        token,
      })
    } catch (error) {
      return this.outputPort.presentError({
        code: 'INVALID_TOKEN',
        message: '無効なトークンです',
      })
    }
  }
}
