'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

interface EmailEvent {
  id: string
  resend_id: string
  event_type: string
  email_to: string
  email_from: string
  email_subject: string
  event_data: Record<string, unknown>
  environment: string
  created_at: string
}

interface EmailStats {
  total: number
  [key: string]: number
}

function EmailTrackingContent() {
  const [emails, setEmails] = useState<EmailEvent[]>([])
  const [stats, setStats] = useState<EmailStats>({ total: 0 })
  const [filter, setFilter] = useState('all')
  const [environmentFilter, setEnvironmentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return createClient(supabaseUrl!, supabaseKey!)
  }, [])

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('email_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('event_type', filter)
      }

      if (environmentFilter !== 'all') {
        query = query.eq('environment', environmentFilter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setEmails(data || [])
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filter, environmentFilter, supabase])

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase.from('email_events').select('event_type')

      if (statsError) {
        console.error('Failed to fetch stats:', statsError)
        return
      }

      const statsData = data?.reduce(
        (acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1
          acc.total++
          return acc
        },
        { total: 0 } as EmailStats
      )

      setStats(statsData || { total: 0 })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchEmails()
    fetchStats()

    // リアルタイム更新
    const subscription = supabase
      .channel('email_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_events',
        },
        payload => {
          setEmails(prev => [payload.new as EmailEvent, ...prev])
          fetchStats() // 統計も更新
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe().catch(console.error)
    }
  }, [filter, environmentFilter, fetchEmails, fetchStats, supabase])

  function StatusIcon({ type }: { type: string }) {
    const icons: Record<string, string> = {
      'email.sent': '📤',
      'email.delivered': '✅',
      'email.opened': '👀',
      'email.clicked': '🔗',
      'email.bounced': '❌',
      'email.complained': '⚠️',
    }
    return <span className="text-lg">{icons[type] || '📧'}</span>
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  function getEventColor(type: string) {
    const colors: Record<string, string> = {
      'email.sent': 'bg-blue-100 text-blue-800',
      'email.delivered': 'bg-green-100 text-green-800',
      'email.opened': 'bg-purple-100 text-purple-800',
      'email.clicked': 'bg-orange-100 text-orange-800',
      'email.bounced': 'bg-red-100 text-red-800',
      'email.complained': 'bg-yellow-100 text-yellow-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Email Tracking</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          エラーが発生しました: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Email Tracking Dashboard</h1>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Events</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats['email.sent'] || 0}</div>
          <div className="text-sm text-gray-500">Sent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats['email.delivered'] || 0}</div>
          <div className="text-sm text-gray-500">Delivered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{stats['email.opened'] || 0}</div>
          <div className="text-sm text-gray-500">Opened</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{stats['email.clicked'] || 0}</div>
          <div className="text-sm text-gray-500">Clicked</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats['email.bounced'] || 0}</div>
          <div className="text-sm text-gray-500">Bounced</div>
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Events</option>
            <option value="email.sent">Sent</option>
            <option value="email.delivered">Delivered</option>
            <option value="email.opened">Opened</option>
            <option value="email.clicked">Clicked</option>
            <option value="email.bounced">Bounced</option>
            <option value="email.complained">Complained</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
          <select
            value={environmentFilter}
            onChange={e => setEnvironmentFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="preview">Preview</option>
            <option value="development">Development</option>
            <option value="local">Local</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchEmails}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* イベントリスト */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">No email events found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map(email => (
            <div
              key={email.id}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon type={email.event_type} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(email.event_type)}`}
                      >
                        {email.event_type}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {email.environment}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>To:</strong> {email.email_to}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Subject:</strong> {email.email_subject}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {email.resend_id} | {formatDate(email.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {email.event_data?.opened_at && typeof email.event_data.opened_at === 'string' ? (
                    <div className="text-xs text-gray-500">
                      Opened: {formatDate(email.event_data.opened_at)}
                    </div>
                  ) : null}
                  {email.event_data?.clicked_at &&
                  typeof email.event_data.clicked_at === 'string' ? (
                    <div className="text-xs text-gray-500">
                      Clicked: {formatDate(email.event_data.clicked_at)}
                    </div>
                  ) : null}
                  {email.event_data?.link && typeof email.event_data.link === 'string' ? (
                    <div className="text-xs text-blue-600 truncate max-w-xs">
                      Link: {email.event_data.link}
                    </div>
                  ) : null}
                  {email.event_data?.reason && typeof email.event_data.reason === 'string' ? (
                    <div className="text-xs text-red-600">Reason: {email.event_data.reason}</div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* フッター */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Email events are updated in real-time via Resend webhooks
      </div>
    </div>
  )
}

export default function EmailTrackingPage() {
  // 環境変数チェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Email Tracking</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Supabase設定が見つかりません。環境変数NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを確認してください。
        </div>
      </div>
    )
  }

  return <EmailTrackingContent />
}
