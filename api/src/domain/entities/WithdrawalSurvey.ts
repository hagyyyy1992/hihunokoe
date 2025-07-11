export interface WithdrawalSurvey {
  id: string
  userId: string
  reason: WithdrawalReason
  reasonOther?: string
  feedback?: string
  wouldRecommend?: boolean
  createdAt: Date
}

export enum WithdrawalReason {
  NOT_USEFUL = 'not_useful',
  PRIVACY_CONCERNS = 'privacy_concerns',
  TOO_MANY_EMAILS = 'too_many_emails',
  FOUND_ALTERNATIVE = 'found_alternative',
  TEMPORARY_BREAK = 'temporary_break',
  TECHNICAL_ISSUES = 'technical_issues',
  OTHER = 'other',
}
