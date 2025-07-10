import { Empathy, EmpathyType } from '@api/domain/entities/Empathy'

export interface CreateEmpathyData {
  userId: string
  postId: string
  empathyType: EmpathyType
}

export interface IEmpathyRepository {
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
