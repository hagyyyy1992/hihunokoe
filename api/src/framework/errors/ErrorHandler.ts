import { NextResponse } from 'next/server'
import { ApplicationError, ErrorCode } from './ApplicationError'

export class ErrorHandler {
  static handle(error: unknown): NextResponse {
    console.error('Error occurred:', error)

    if (error instanceof ApplicationError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode }
      )
    }

    // Prismaエラーのハンドリング
    if (this.isPrismaError(error)) {
      return this.handlePrismaError(error)
    }

    // その他のエラー
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: '内部エラーが発生しました',
        },
      },
      { status: 500 }
    )
  }

  private static isPrismaError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as any).code === 'string' &&
      (error as any).code.startsWith('P')
    )
  }

  private static handlePrismaError(error: any): NextResponse {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            error: {
              code: ErrorCode.ALREADY_EXISTS,
              message: '既に存在するデータです',
            },
          },
          { status: 409 }
        )
      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'データが見つかりません',
            },
          },
          { status: 404 }
        )
      default:
        return NextResponse.json(
          {
            error: {
              code: ErrorCode.DATABASE_ERROR,
              message: 'データベースエラーが発生しました',
            },
          },
          { status: 500 }
        )
    }
  }
}
