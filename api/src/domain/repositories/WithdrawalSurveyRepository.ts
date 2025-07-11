import { WithdrawalSurvey } from '@api/domain/entities/WithdrawalSurvey'

export interface WithdrawalSurveyRepository {
  create(survey: Omit<WithdrawalSurvey, 'id' | 'createdAt'>): Promise<WithdrawalSurvey>
  findByUserId(userId: string): Promise<WithdrawalSurvey | null>
  findAll(options?: {
    skip?: number
    take?: number
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  }): Promise<{
    surveys: WithdrawalSurvey[]
    total: number
  }>
  getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalResponses: number
    byReason: Record<string, number>
    recommendationRate: number
  }>
}
