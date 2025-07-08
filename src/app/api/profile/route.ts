import { NextRequest } from 'next/server'
import { ProfileController } from '@api/framework/controllers/ProfileController'
import { GetProfileUseCase } from '@api/usecases/profile/interactor'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'

const userRepository = new UserRepositoryImpl()
const profileUseCase = new GetProfileUseCase(userRepository)
const profileController = new ProfileController(profileUseCase)

export async function GET(request: NextRequest) {
  return profileController.getProfile(request)
}
