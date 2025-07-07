import { NextRequest } from 'next/server'
import { ProfileController } from '@api/framework/controllers/ProfileController'

const profileController = new ProfileController()

export async function PUT(request: NextRequest) {
  return profileController.updateProfile(request)
}
