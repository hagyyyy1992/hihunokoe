import { User } from '../../domain/entities/User'
import { UserRepository } from '../../domain/repositories/UserRepository'
import { getUserById } from '../../../../src/lib/auth/auth'

export class UserRepositoryImpl implements UserRepository {
  async findById(id: string): Promise<User | null> {
    console.log('[Repository] UserRepositoryImpl.findById called', { id })

    const user = await getUserById(id)
    console.log('[Repository] getUserById result', {
      user: user ? { id: user.id, email: user.email } : null,
    })

    if (!user) {
      console.log('[Repository] User not found, returning null')
      return null
    }

    const domainUser = {
      id: user.id,
      email: user.email,
      username: user.userName,
      emailVerified: user.emailVerified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('[Repository] Converting to domain user', {
      domainUser: { id: domainUser.id, email: domainUser.email },
    })
    return domainUser
  }
}
