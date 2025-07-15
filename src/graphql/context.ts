import DataLoader from 'dataloader'
import { User } from '@api/domain/entities/User'
import { Prisma } from '@prisma/client'

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    user: true
  }
}>

type EmpathyWithRelations = Prisma.EmpathyGetPayload<{
  include: {
    user: true
  }
}>

export interface GraphQLContext {
  userId: string | null
  userLoader: DataLoader<string, User | null>
  commentLoader: DataLoader<string, CommentWithRelations[]>
  commentByIdLoader: DataLoader<string, CommentWithRelations | null>
  empathyLoader: DataLoader<string, EmpathyWithRelations[]>
  userEmpathyLoader: DataLoader<string, boolean>
}
