export interface AdminAuthenticationInputPort {
  login(email: string, password: string): Promise<void>
  verifyToken(token: string): Promise<void>
}
