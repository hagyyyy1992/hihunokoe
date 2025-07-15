import { AuthController } from '@api/framework/controllers/AuthController'
import {
  IAuthenticationUseCase,
  IPasswordManagementUseCase,
  IEmailVerificationUseCase,
  IAccountManagementUseCase,
} from '@api/usecases/auth/input-port'
import { IEmailService } from '@api/domain/services/EmailService'

export function createMockAuthController(
  authenticationUseCase: Partial<IAuthenticationUseCase> = {},
  passwordManagementUseCase: Partial<IPasswordManagementUseCase> = {},
  emailVerificationUseCase: Partial<IEmailVerificationUseCase> = {},
  accountManagementUseCase: Partial<IAccountManagementUseCase> = {},
  emailService: Partial<IEmailService> = {}
): AuthController {
  return new AuthController(
    authenticationUseCase as IAuthenticationUseCase,
    passwordManagementUseCase as IPasswordManagementUseCase,
    emailVerificationUseCase as IEmailVerificationUseCase,
    accountManagementUseCase as IAccountManagementUseCase,
    emailService as IEmailService
  )
}
