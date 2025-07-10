import { NextRequest } from 'next/server'
import { ProfileController } from '@api/framework/controllers/ProfileController'
import { GetProfileUseCase } from '@api/usecases/profile/interactor'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

const userRepository = new UserRepository()
const profileUseCase = new GetProfileUseCase(userRepository)
const profileController = new ProfileController(profileUseCase)

export async function PUT(request: Request) {
  const adaptedRequest = adaptCookieToBearer(request)
  return profileController.updateProfile(adaptedRequest as NextRequest)
}
