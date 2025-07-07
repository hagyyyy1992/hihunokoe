import { NextRequest } from 'next/server'
import { handleVerifyEmail } from '../auth-route-adapters'

export async function GET(request: NextRequest) {
  return handleVerifyEmail(request)
}
