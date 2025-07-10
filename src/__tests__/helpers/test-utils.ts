import { NextRequest } from 'next/server'

/**
 * Creates a mock NextRequest for testing API routes
 */
export const createMockRequest = (
  url: string,
  options: {
    method?: string
    body?: unknown
    cookies?: Record<string, string>
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
) => {
  const { method = 'GET', body, cookies = {}, headers = {}, searchParams = {} } = options

  // Build URL with search parameters
  const requestUrl = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    requestUrl.searchParams.set(key, value)
  })

  // Build headers
  const requestHeaders = new Headers()

  // Add default headers
  if (body && method !== 'GET') {
    requestHeaders.set('Content-Type', 'application/json')
  }

  // Add custom headers
  Object.entries(headers).forEach(([key, value]) => {
    requestHeaders.set(key, value)
  })

  // Add cookies
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    requestHeaders.set('Cookie', cookieString)
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  const { signal, ...cleanRequestInit } = requestInit
  return new NextRequest(requestUrl.toString(), {
    ...cleanRequestInit,
    signal: signal || undefined,
  })
}

/**
 * Creates a mock request for API authentication endpoints
 */
export const createAuthRequest = (endpoint: string, body: unknown, token?: string) => {
  const cookies = token ? { 'auth-token': token } : undefined

  return createMockRequest(`http://localhost:3000/api/auth/${endpoint}`, {
    method: 'POST',
    body,
    cookies,
  })
}

/**
 * Creates a mock request for posts endpoints
 */
export const createPostsRequest = (
  method: 'GET' | 'POST' = 'GET',
  options: {
    body?: unknown
    token?: string
    searchParams?: Record<string, string>
  } = {}
) => {
  const { body, token, searchParams } = options
  const cookies = token ? { 'auth-token': token } : undefined

  return createMockRequest('http://localhost:3000/api/posts', {
    method,
    body,
    cookies,
    searchParams,
  })
}

/**
 * Creates a mock request for individual post endpoints
 */
export const createPostRequest = (
  postId: string,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET',
  options: {
    body?: unknown
    token?: string
  } = {}
) => {
  const { body, token } = options
  const cookies = token ? { 'auth-token': token } : undefined

  return createMockRequest(`http://localhost:3000/api/posts/${postId}`, {
    method,
    body,
    cookies,
  })
}

/**
 * Creates mock route params for dynamic routes
 */
export const createMockParams = (params: Record<string, string>) => {
  return Promise.resolve(params)
}

/**
 * Extracts cookies from a Response object
 */
export const extractCookiesFromResponse = (response: Response): Record<string, string> => {
  const cookies: Record<string, string> = {}
  const setCookieHeader = response.headers.get('set-cookie')

  if (setCookieHeader) {
    // Parse multiple cookies (split by comma but be careful of commas in dates)
    const cookieStrings = setCookieHeader.split(/,(?=\s*\w+\s*=)/g)

    cookieStrings.forEach(cookieString => {
      const [nameValue] = cookieString.split(';')
      const [name, value] = nameValue.split('=').map(s => s.trim())
      if (name && value !== undefined) {
        cookies[name] = value
      }
    })
  }

  return cookies
}

/**
 * Checks if a response contains a specific cookie
 */
export const responseHasCookie = (
  response: Response,
  cookieName: string,
  expectedValue?: string
): boolean => {
  const cookies = extractCookiesFromResponse(response)

  if (!(cookieName in cookies)) {
    return false
  }

  if (expectedValue !== undefined) {
    return cookies[cookieName] === expectedValue
  }

  return true
}

/**
 * Checks if a response has the correct CORS headers
 */
export const responseHasCORS = (response: Response): boolean => {
  return response.headers.has('Access-Control-Allow-Origin')
}

/**
 * Helper to test API error responses
 */
export const expectAPIError = async (
  response: Response,
  expectedStatus: number,
  expectedErrorMessage?: string
) => {
  expect(response.status).toBe(expectedStatus)

  const data = await response.json()
  expect(data).toHaveProperty('error')

  if (expectedErrorMessage) {
    expect(data.error).toBe(expectedErrorMessage)
  }

  return data
}

/**
 * Helper to test API success responses
 */
export const expectAPISuccess = async (response: Response, expectedStatus: number = 200) => {
  expect(response.status).toBe(expectedStatus)

  const data = await response.json()
  expect(data).not.toHaveProperty('error')

  return data
}

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = { ...console }

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  return originalConsole
}

/**
 * Helper to test pagination responses
 */
export const expectValidPagination = (
  pagination: unknown,
  expectedPage: number,
  expectedLimit: number,
  expectedTotal: number
) => {
  expect(pagination).toMatchObject({
    page: expectedPage,
    limit: expectedLimit,
    total: expectedTotal,
    pages: Math.ceil(expectedTotal / expectedLimit),
  })
}

/**
 * Helper to simulate async delays in tests
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Helper to test Zod validation errors
 */
export const expectZodValidationError = async (response: Response, expectedField?: string) => {
  const data = await expectAPIError(response, 400, '入力内容に誤りがあります')
  expect(data).toHaveProperty('details')

  if (expectedField) {
    expect(data.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.arrayContaining([expectedField]),
        }),
      ])
    )
  }

  return data
}
