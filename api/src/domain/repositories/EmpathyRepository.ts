import { Empathy } from '@api/domain/entities/Empathy'

export interface CreateEmpathyData {
  userId: string
  postId: string
}

export interface EmpathyRepository {
  findById(id: string): Promise<Empathy | null>
  findByUserAndPost(userId: string, postId: string): Promise<Empathy | null>
  findByPost(postId: string): Promise<Empathy[]>
  findByUser(userId: string): Promise<Empathy[]>
  create(data: CreateEmpathyData): Promise<Empathy>
  delete(id: string): Promise<void>
  countByPost(postId: string): Promise<number>
  countByUser(userId: string): Promise<number>
  countTotal(): Promise<number>
}
