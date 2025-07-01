import { NextResponse } from 'next/server'

export class ApiError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

type ErrorType =
  | 'SERVICE_UNAVAILABLE'
  | 'RESOURCE_NOT_FOUND'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'RATE_LIMIT_EXCEEDED'

const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  SERVICE_UNAVAILABLE: 503,
  RESOURCE_NOT_FOUND: 404,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  RATE_LIMIT_EXCEEDED: 429,
}

export function createApiError(errorType: ErrorType, message: string): ApiError {
  const statusCode = ERROR_STATUS_MAP[errorType] || 500
  return new ApiError(message, statusCode)
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
