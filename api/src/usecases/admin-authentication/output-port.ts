export interface AdminAuthenticationOutputPort {
  presentSuccess(data: {
    adminUser: {
      id: string
      adminName: string
      email: string
      role: string
    }
    token: string
  }): void
  presentError(error: { code: string; message: string }): void
}
