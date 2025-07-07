import { NextRequest } from 'next/server'
import { handleLogin } from '../auth-route-adapters'

export async function POST(request: NextRequest) {
  return handleLogin(request)
}
