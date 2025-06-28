import { User } from '../../domain/entities/User'
import { UserRepository } from '../../domain/repositories/UserRepository'
import { getUserById } from '../../../../src/lib/auth/auth'

export class UserRepositoryImpl implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await getUserById(id)
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      username: user.userName,
      emailVerified: user.emailVerified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}
