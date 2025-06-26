import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Webhookの署名を検証
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('resend-signature')

    // 署名の検証（本番環境では必須）
    if (process.env.RESEND_WEBHOOK_SECRET && signature) {
      const isValid = verifySignature(body, signature, process.env.RESEND_WEBHOOK_SECRET)

      if (!isValid) {
        console.error('Invalid webhook signature')
        return Response.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // 環境情報をログに含める
    const logPrefix = `[${process.env.VERCEL_ENV || 'local'}] 📧`

    // イベントタイプごとの処理
    switch (event.type) {
      case 'email.sent':
        console.log(`${logPrefix} Email sent:`, {
          id: event.data.id,
          to: event.data.to,
          subject: event.data.subject,
          timestamp: new Date().toISOString(),
        })
        break

      case 'email.delivered':
        console.log(`${logPrefix} Email delivered:`, {
          id: event.data.id,
          to: event.data.to,
          timestamp: new Date().toISOString(),
        })
        break

      case 'email.opened':
        console.log(`${logPrefix} Email opened:`, {
          id: event.data.id,
          opened_at: event.data.opened_at,
          timestamp: new Date().toISOString(),
        })
        break

      case 'email.clicked':
        console.log(`${logPrefix} Link clicked:`, {
          id: event.data.id,
          link: event.data.link,
          clicked_at: event.data.clicked_at,
          timestamp: new Date().toISOString(),
        })
        break

      case 'email.bounced':
        console.error(`${logPrefix} Email bounced:`, {
          id: event.data.id,
          to: event.data.to,
          reason: event.data.reason,
          timestamp: new Date().toISOString(),
        })
        break

      case 'email.complained':
        console.error(`${logPrefix} Email complained:`, {
          id: event.data.id,
          to: event.data.to,
          timestamp: new Date().toISOString(),
        })
        break

      default:
        console.log(`${logPrefix} Unknown event type:`, event.type)
    }

    // メールイベントをSupabaseに保存（後で実装）
    try {
      const { saveEmailEvent } = await import('@/lib/email/email-events')
      await saveEmailEvent(event)
    } catch (error) {
      console.warn('Failed to save email event to database:', error)
      // データベース保存に失敗してもWebhookは成功とする
    }

    return Response.json({ received: true, type: event.type })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({
    status: 'ok',
    environment: process.env.VERCEL_ENV || 'local',
    timestamp: new Date().toISOString(),
  })
}
