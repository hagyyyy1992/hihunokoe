import { User } from '@api/domain/entities/User'

export interface UserRepository {
  findById(id: string): Promise<User | null>
}
