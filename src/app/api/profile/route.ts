import { NextRequest } from 'next/server'
import { ProfileController } from '@api/framework/controllers/ProfileController'

const profileController = new ProfileController()

export async function GET(request: NextRequest) {
  return profileController.getProfile(request)
}
