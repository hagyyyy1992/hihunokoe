import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Explicitly define that this route uses dynamic parameters
export async function generateStaticParams() {
  return []
}

console.log('[PUBLISH POST ROUTE] Module loaded at:', new Date().toISOString())

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
} catch (error) {
  console.error('Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🚀 [PUBLISH POST] ===== ROUTE HANDLER STARTED =====', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    authorization: request.headers.get('authorization') ? 'present' : 'none',
    cookies: request.headers.get('cookie') ? 'present' : 'none',
    headers: Object.fromEntries(request.headers.entries()),
  })

  if (!adminController) {
    console.error('❌ [PUBLISH POST] AdminController not available - database connection issue')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  try {
    const params = await context.params
    console.log('✅ [PUBLISH POST] Params extracted:', params)
    console.log('🔄 [PUBLISH POST] Calling adminController.publishPost...')
    const result = await adminController.publishPost(request, { params })
    console.log('✅ [PUBLISH POST] Controller returned result:', {
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries()),
    })
    return result
  } catch (error) {
    console.error('💥 [PUBLISH POST] Error in handler:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🚀 [PUBLISH POST - PUT] ===== PUT HANDLER STARTED =====', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
  })

  if (!adminController) {
    console.error('❌ [PUBLISH POST - PUT] AdminController not available')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  const params = await context.params
  console.log('✅ [PUBLISH POST - PUT] Processing ID:', params.id)
  return adminController.publishPost(request, { params })
}

export async function OPTIONS() {
  console.log('⚙️ [PUBLISH POST - OPTIONS] OPTIONS request received:', new Date().toISOString())
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
