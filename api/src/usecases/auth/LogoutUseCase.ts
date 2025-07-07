import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'

export interface LogoutInputData {
  token: string
}

export interface LogoutOutputData {
  success: boolean
  message: string
}

export class LogoutUseCase {
  constructor(private authSessionRepository: AuthSessionRepository) {}

  async execute(inputData: LogoutInputData): Promise<LogoutOutputData> {
    const { token } = inputData

    if (!token) {
      throw new Error('No authentication token provided')
    }

    // Find and invalidate the session
    const session = await this.authSessionRepository.findByToken(token)

    if (session) {
      await this.authSessionRepository.invalidate(session.id)
    }

    return {
      success: true,
      message: 'ログアウトしました。',
    }
  }
}
