import { NextRequest } from 'next/server'
import { handleLogout } from '../auth-route-adapters'

export async function POST(request: NextRequest) {
  return handleLogout(request)
}
