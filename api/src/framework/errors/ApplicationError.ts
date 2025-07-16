export enum ErrorCode {
  // 認証関連
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // リソース関連
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // バリデーション関連
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // システム関連
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // ビジネスロジック関連
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
}

export class ApplicationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'ApplicationError'
  }

  static unauthorized(message: string = '認証が必要です'): ApplicationError {
    return new ApplicationError(ErrorCode.UNAUTHORIZED, message, 401)
  }

  static forbidden(message: string = 'アクセス権限がありません'): ApplicationError {
    return new ApplicationError(ErrorCode.FORBIDDEN, message, 403)
  }

  static notFound(resource: string): ApplicationError {
    return new ApplicationError(ErrorCode.NOT_FOUND, `${resource}が見つかりません`, 404)
  }

  static validationError(details: any): ApplicationError {
    return new ApplicationError(ErrorCode.VALIDATION_ERROR, '入力値が不正です', 400, details)
  }

  static businessRuleViolation(message: string): ApplicationError {
    return new ApplicationError(ErrorCode.BUSINESS_RULE_VIOLATION, message, 422)
  }

  static internalError(message: string = '内部エラーが発生しました'): ApplicationError {
    return new ApplicationError(ErrorCode.INTERNAL_ERROR, message, 500)
  }
}
