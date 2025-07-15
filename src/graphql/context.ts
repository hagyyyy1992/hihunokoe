import DataLoader from 'dataloader'
import { User } from '@api/domain/entities/User'

export interface GraphQLContext {
  userId: string | null
  userLoader: DataLoader<string, User | null>
}
