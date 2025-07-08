import { User } from '@api/domain/entities/User'

export type GetProfileOutputPort = {
  user: User
}

export type UpdateProfileOutputPort = {
  user: User
  message: string
}
