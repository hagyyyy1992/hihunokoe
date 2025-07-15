import DataLoader from 'dataloader'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { User } from '@api/domain/entities/User'

export const createUserLoader = (userRepository: IUserRepository) => {
  return new DataLoader<string, User | null>(async (userIds: readonly string[]) => {
    const users = await userRepository.findByIds([...userIds])
    const userMap = new Map(users.map(user => [user.id, user]))

    return userIds.map(id => userMap.get(id) || null)
  })
}
