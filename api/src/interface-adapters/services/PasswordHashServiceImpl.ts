import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import bcrypt from 'bcryptjs'

export class PasswordHashServiceImpl implements PasswordHashService {
  private readonly saltRounds = 10

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds)
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}