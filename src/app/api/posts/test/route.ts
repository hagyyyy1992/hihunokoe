import { NextRequest } from 'next/server'
import { HealthController } from '@api/framework/controllers/HealthController'

const healthController = new HealthController()

export async function GET(request: Request) {
  return healthController.checkPostsApi(request as NextRequest)
}
