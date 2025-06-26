import { createClient } from '@supabase/supabase-js'

// Webhook event type
interface ResendWebhookEvent {
  type: string
  data: {
    id: string
    to?: string[] | string
    from?: string
    subject?: string
    opened_at?: string
    clicked_at?: string
    link?: string
    reason?: string
    [key: string]: unknown
  }
}

// Email event database type
interface EmailEvent {
  resend_id: string
  event_type: string
  email_to?: string
  email_from?: string
  email_subject?: string
  event_data: Record<string, unknown>
  environment: string
}

// Supabaseクライアントを作成（サーバーサイド用）
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Resend webhookイベントをSupabaseに保存
 */
export async function saveEmailEvent(event: ResendWebhookEvent) {
  try {
    const supabase = createSupabaseClient()

    // emailアドレスを正規化
    const emailTo = Array.isArray(event.data.to) ? event.data.to[0] : event.data.to

    const emailEvent: EmailEvent = {
      resend_id: event.data.id,
      event_type: event.type,
      email_to: emailTo,
      email_from: event.data.from,
      email_subject: event.data.subject,
      event_data: event.data,
      environment: process.env.VERCEL_ENV || 'local',
    }

    const { data, error } = await supabase
      .from('email_events')
      .insert(emailEvent)
      .select('id')
      .single()

    if (error) {
      console.error('Failed to save email event:', error)
      return { success: false, error: error.message }
    }

    console.log('Email event saved successfully:', {
      id: data.id,
      type: event.type,
      resend_id: event.data.id,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error saving email event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 特定のメールIDに関連するイベントを取得
 */
export async function getEmailEvents(resendId: string) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('email_events')
      .select('*')
      .eq('resend_id', resendId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch email events:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching email events:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 最近のメールイベントを取得
 */
export async function getRecentEmailEvents(limit = 50, environment?: string) {
  try {
    const supabase = createSupabaseClient()

    let query = supabase
      .from('email_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (environment) {
      query = query.eq('environment', environment)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch recent email events:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching recent email events:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * メールイベントの統計を取得
 */
export async function getEmailEventStats(days = 7, environment?: string) {
  try {
    const supabase = createSupabaseClient()

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    let query = supabase
      .from('email_events')
      .select('event_type, created_at')
      .gte('created_at', fromDate.toISOString())

    if (environment) {
      query = query.eq('environment', environment)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch email event stats:', error)
      return { success: false, error: error.message }
    }

    // 統計を集計
    const stats = data?.reduce(
      (acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        acc.total++
        return acc
      },
      { total: 0 } as Record<string, number>
    )

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error fetching email event stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * メール送信ログをSupabaseに記録（送信時に使用）
 */
export async function logEmailSend({
  resendId,
  to,
  from,
  subject,
  environment,
}: {
  resendId: string
  to: string
  from: string
  subject: string
  environment?: string
}) {
  try {
    const supabase = createSupabaseClient()

    const emailEvent: EmailEvent = {
      resend_id: resendId,
      event_type: 'email.sent',
      email_to: to,
      email_from: from,
      email_subject: subject,
      event_data: { id: resendId, to, from, subject },
      environment: environment || process.env.VERCEL_ENV || 'local',
    }

    const { data, error } = await supabase
      .from('email_events')
      .insert(emailEvent)
      .select('id')
      .single()

    if (error) {
      console.error('Failed to log email send:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error logging email send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
