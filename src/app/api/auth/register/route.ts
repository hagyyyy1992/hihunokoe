import { NextRequest } from 'next/server'
import { handleRegister } from '../auth-route-adapters'

export async function POST(request: NextRequest) {
  return handleRegister(request)
}
