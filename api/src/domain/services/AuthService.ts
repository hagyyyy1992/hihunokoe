import { NextRequest } from 'next/server'

export interface IAuthService {
  getUserIdFromRequest(request: NextRequest): Promise<string | null>
  requireAuth(request: NextRequest): Promise<string>
}
