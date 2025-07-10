/**
 * @jest-environment jsdom
 */
import { redirect } from 'next/navigation'
import AdminPage from '@/app/admin/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to admin dashboard', () => {
    AdminPage()
    expect(redirect).toHaveBeenCalledWith('/admin/dashboard')
  })
})
