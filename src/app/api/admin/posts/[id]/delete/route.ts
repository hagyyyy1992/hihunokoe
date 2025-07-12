import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamicParams = true
export const maxDuration = 30

console.log('🗑️🗑️🗑️ [DELETE POST ROUTE] MODULE LOADED!!! 🗑️🗑️🗑️', {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  deploymentUrl: process.env.VERCEL_URL,
  fileName: __filename || 'delete/route.ts'
})

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
  console.log('✅ [DELETE POST] AdminController initialized successfully')
} catch (error) {
  console.error('💥 [DELETE POST] Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🔥🔥🔥 [DELETE POST] ===== POST HANDLER INVOKED ===== 🔥🔥🔥')
  console.log('📋 [DELETE POST] ULTRA DETAILED REQUEST INFO:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    authorization: request.headers.get('authorization') ? 'PRESENT' : 'MISSING',
    cookies: request.headers.get('cookie') ? 'PRESENT' : 'MISSING',
    xForwardedFor: request.headers.get('x-forwarded-for'),
    vercelId: request.headers.get('x-vercel-id'),
    requestId: request.headers.get('x-request-id'),
    allHeaders: Object.fromEntries(request.headers.entries())
  })

  if (!adminController) {
    console.error('❌❌❌ [DELETE POST] CRITICAL: AdminController is NULL!!!')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  console.log('✅ [DELETE POST] AdminController is available!')

  try {
    const params = await context.params
    console.log('🎯 [DELETE POST] EXTRACTED PARAMS:', params)
    console.log('🔄 [DELETE POST] CALLING adminController.deletePost...')

    const startTime = Date.now()
    const result = await adminController.deletePost(request, { params })
    const endTime = Date.now()

    console.log('✨ [DELETE POST] CONTROLLER RESULT:', {
      executionTime: `${endTime - startTime}ms`,
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries())
    })

    console.log('🎉 [DELETE POST] ===== HANDLER COMPLETED SUCCESSFULLY =====')
    return result
  } catch (error) {
    console.error('💥💥💥 [DELETE POST] FATAL ERROR:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🗑️ [DELETE POST - DELETE METHOD] ===== DELETE HANDLER INVOKED =====', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method
  })

  if (!adminController) {
    console.error('❌ [DELETE POST - DELETE METHOD] AdminController not available')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  const params = await context.params
  console.log('✅ [DELETE POST - DELETE METHOD] Processing post ID:', params.id)
  return adminController.deletePost(request, { params })
}

export async function OPTIONS() {
  console.log('⚙️⚙️⚙️ [DELETE POST - OPTIONS] PREFLIGHT REQUEST!!!', {
    timestamp: new Date().toISOString(),
    message: 'CORS preflight request received'
  })
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}