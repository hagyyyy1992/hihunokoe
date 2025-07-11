import { PrismaClient, WithdrawalReason as PrismaWithdrawalReason } from '@prisma/client'
import { WithdrawalSurvey, WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'
import { WithdrawalSurveyRepository as IWithdrawalSurveyRepository } from '@api/domain/repositories/WithdrawalSurveyRepository'

export class WithdrawalSurveyRepository implements IWithdrawalSurveyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(survey: Omit<WithdrawalSurvey, 'id' | 'createdAt'>): Promise<WithdrawalSurvey> {
    const created = await this.prisma.withdrawalSurvey.create({
      data: {
        userId: survey.userId,
        reason: this.toPrismaReason(survey.reason),
        reasonOther: survey.reasonOther,
        feedback: survey.feedback,
        wouldRecommend: survey.wouldRecommend,
      },
    })

    return this.toDomainEntity(created)
  }

  async findByUserId(userId: string): Promise<WithdrawalSurvey | null> {
    const survey = await this.prisma.withdrawalSurvey.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return survey ? this.toDomainEntity(survey) : null
  }

  async findAll(options?: {
    skip?: number
    take?: number
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  }): Promise<{
    surveys: WithdrawalSurvey[]
    total: number
  }> {
    const [surveys, total] = await Promise.all([
      this.prisma.withdrawalSurvey.findMany({
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy
          ? { [options.orderBy.field]: options.orderBy.direction }
          : { createdAt: 'desc' },
      }),
      this.prisma.withdrawalSurvey.count(),
    ])

    return {
      surveys: surveys.map(survey => this.toDomainEntity(survey)),
      total,
    }
  }

  async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalResponses: number
    byReason: Record<string, number>
    recommendationRate: number
  }> {
    const where = {
      ...(startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    }

    const [total, reasonCounts, positiveRecommendCount, totalRecommendCount] = await Promise.all([
      this.prisma.withdrawalSurvey.count({ where }),
      this.prisma.withdrawalSurvey.groupBy({
        by: ['reason'],
        where,
        _count: {
          reason: true,
        },
      }),
      this.prisma.withdrawalSurvey.count({
        where: {
          ...where,
          wouldRecommend: true,
        },
      }),
      this.prisma.withdrawalSurvey.count({
        where: {
          ...where,
          wouldRecommend: { not: null },
        },
      }),
    ])

    const byReason = reasonCounts.reduce(
      (acc, item) => {
        acc[this.fromPrismaReason(item.reason)] = item._count.reason
        return acc
      },
      {} as Record<string, number>
    )

    const recommendationRate =
      totalRecommendCount > 0 ? (positiveRecommendCount / totalRecommendCount) * 100 : 0

    return {
      totalResponses: total,
      byReason,
      recommendationRate,
    }
  }

  private toDomainEntity(survey: {
    id: string
    userId: string
    reason: PrismaWithdrawalReason
    reasonOther: string | null
    feedback: string | null
    wouldRecommend: boolean | null
    createdAt: Date
  }): WithdrawalSurvey {
    return {
      id: survey.id,
      userId: survey.userId,
      reason: this.fromPrismaReason(survey.reason),
      reasonOther: survey.reasonOther ?? undefined,
      feedback: survey.feedback ?? undefined,
      wouldRecommend: survey.wouldRecommend ?? undefined,
      createdAt: survey.createdAt,
    }
  }

  private toPrismaReason(reason: WithdrawalReason): PrismaWithdrawalReason {
    const mapping: Record<WithdrawalReason, PrismaWithdrawalReason> = {
      [WithdrawalReason.NOT_USEFUL]: 'not_useful',
      [WithdrawalReason.PRIVACY_CONCERNS]: 'privacy_concerns',
      [WithdrawalReason.TOO_MANY_EMAILS]: 'too_many_emails',
      [WithdrawalReason.FOUND_ALTERNATIVE]: 'found_alternative',
      [WithdrawalReason.TEMPORARY_BREAK]: 'temporary_break',
      [WithdrawalReason.TECHNICAL_ISSUES]: 'technical_issues',
      [WithdrawalReason.OTHER]: 'other',
    }
    return mapping[reason]
  }

  private fromPrismaReason(reason: PrismaWithdrawalReason): WithdrawalReason {
    const mapping: Record<PrismaWithdrawalReason, WithdrawalReason> = {
      not_useful: WithdrawalReason.NOT_USEFUL,
      privacy_concerns: WithdrawalReason.PRIVACY_CONCERNS,
      too_many_emails: WithdrawalReason.TOO_MANY_EMAILS,
      found_alternative: WithdrawalReason.FOUND_ALTERNATIVE,
      temporary_break: WithdrawalReason.TEMPORARY_BREAK,
      technical_issues: WithdrawalReason.TECHNICAL_ISSUES,
      other: WithdrawalReason.OTHER,
    }
    return mapping[reason]
  }
}
