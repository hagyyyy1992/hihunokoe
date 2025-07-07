import { NextRequest } from 'next/server'
import { handleDeleteAccount } from '../auth-route-adapters'

export async function DELETE(request: NextRequest) {
  return handleDeleteAccount(request)
}
