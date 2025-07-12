import { NextRequest, NextResponse } from 'next/server'
import { AdminController } from '@api/framework/controllers/AdminController'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamicParams = true
export const maxDuration = 30

console.log('🟢🟢🟢 [ACTIVATE USER ROUTE] MODULE LOADED!!! 🟢🟢🟢', {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
  deploymentUrl: process.env.VERCEL_URL
})

let adminController: AdminController | null = null

try {
  adminController = new AdminController()
  console.log('✅ [ACTIVATE USER] AdminController initialized successfully')
} catch (error) {
  console.error('💥 [ACTIVATE USER] Failed to initialize AdminController:', error)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('⚡⚡⚡ [ACTIVATE USER] ===== POST HANDLER INVOKED ===== ⚡⚡⚡')
  console.log('📊 [ACTIVATE USER] COMPLETE REQUEST DETAILS:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    authorization: request.headers.get('authorization') ? 'PRESENT' : 'MISSING',
    cookies: request.headers.get('cookie') ? 'PRESENT' : 'MISSING',
    vercelId: request.headers.get('x-vercel-id'),
    allHeaders: Object.fromEntries(request.headers.entries())
  })

  if (!adminController) {
    console.error('❌❌❌ [ACTIVATE USER] CRITICAL: AdminController is NULL!!!')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  console.log('✅ [ACTIVATE USER] AdminController is available!')

  try {
    const params = await context.params
    console.log('🎯 [ACTIVATE USER] EXTRACTED PARAMS:', params)
    console.log('🔄 [ACTIVATE USER] CALLING adminController.activateUser...')

    const startTime = Date.now()
    const result = await adminController.activateUser(request, { params })
    const endTime = Date.now()

    console.log('✨ [ACTIVATE USER] CONTROLLER RESULT:', {
      executionTime: `${endTime - startTime}ms`,
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries())
    })

    console.log('🎉 [ACTIVATE USER] ===== HANDLER COMPLETED SUCCESSFULLY =====')
    return result
  } catch (error) {
    console.error('💥💥💥 [ACTIVATE USER] FATAL ERROR:', {
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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('🚀 [ACTIVATE USER - PUT] ===== PUT METHOD CALLED =====', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method
  })

  if (!adminController) {
    console.error('❌ [ACTIVATE USER - PUT] AdminController not available')
    return NextResponse.json(
      { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
      { status: 500 }
    )
  }

  const params = await context.params
  console.log('✅ [ACTIVATE USER - PUT] Processing user ID:', params.id)
  return adminController.activateUser(request, { params })
}

export async function OPTIONS() {
  console.log('⚙️⚙️⚙️ [ACTIVATE USER - OPTIONS] PREFLIGHT REQUEST!!!', {
    timestamp: new Date().toISOString(),
    message: 'CORS preflight request received'
  })
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}