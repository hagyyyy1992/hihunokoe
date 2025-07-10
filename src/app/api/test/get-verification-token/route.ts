import { NextRequest } from 'next/server'
import { TestController } from '@api/framework/controllers/TestController'

const testController = new TestController()

export async function POST(request: NextRequest) {
  return testController.getVerificationToken(request)
}
