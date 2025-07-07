import { NextRequest } from 'next/server'
import { handleGetCurrentUser } from '../auth-route-adapters'

export async function GET(request: NextRequest) {
  return handleGetCurrentUser(request)
}
