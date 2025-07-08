/**
 * @jest-environment node
 */
import { GET } from '@/app/api/posts/test/route'

describe('/api/posts/test', () => {
  it('returns success message with timestamp', async () => {
    const request = new Request('http://localhost:3000/api/posts/test')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Posts API is working')
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('returns a valid ISO timestamp', async () => {
    const request = new Request('http://localhost:3000/api/posts/test')
    const response = await GET(request)
    const data = await response.json()

    const timestamp = new Date(data.timestamp)
    expect(timestamp.toISOString()).toBe(data.timestamp)
  })
})
